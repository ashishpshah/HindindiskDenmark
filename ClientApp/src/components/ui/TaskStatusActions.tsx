import { useState } from 'react';
import { Status, STATUS_LABELS } from '../../types';
import { TimeInput } from './TimeInput';
import { fromHHMM } from '../../lib/utils';

// Statuses that do NOT require actual hours when entered (mirrors backend).
// Only the initial "new" is exempt; every other status requires hours.
const HOURS_EXEMPT: Status[] = ['new'];

// Mirrors backend AllowedEdges (Services/TaskService.cs). Buttons shown per current status.
const ALLOWED_EDGES: Record<Status, Status[]> = {
  'new':          ['in-progress', 'completed'],
  'in-progress':  ['paused', 'blocked', 'under-review', 'completed'],
  'paused':       ['in-progress', 'completed'],
  'blocked':      ['in-progress', 'completed'],
  'under-review': ['issues', 'in-progress', 'completed'],
  'issues':       ['in-progress', 'completed'],
  'completed':    ['in-progress'],
};

// Button color per target status
const TARGET_STYLE: Record<Status, string> = {
  'new':          'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
  'in-progress':  'border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
  'paused':       'border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20',
  'blocked':      'border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
  'under-review': 'border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20',
  'issues':       'border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20',
  'completed':    'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
};

interface TaskStatusActionsProps {
  currentStatus: Status;
  isManager: boolean;
  isAssignee: boolean;
  isQa: boolean;
  /** Whether all checklist items are done (true also when there are no items). */
  checklistComplete: boolean;
  /** True when the task has an active block. Only admins may change status while blocked. */
  isBlocked?: boolean;
  /** True for IsAdmin users — allowed to change status even when blocked. */
  isAdmin?: boolean;
  /** Called with the target status (+ optional reason for blocked, + actual hours when required). */
  onChange: (to: Status, reason?: string, actualHours?: number) => Promise<void> | void;
}

// Verbose label for the action button (not just the bare status name)
function actionLabel(to: Status): string {
  switch (to) {
    case 'completed':   return 'Complete Task';
    case 'under-review': return 'Submit for Review';
    case 'in-progress': return 'Move to In Progress';
    case 'paused':      return 'Pause';
    case 'blocked':     return 'Block';
    case 'issues':      return 'Send Back (Issues)';
    case 'new':         return STATUS_LABELS['new'];
    default:            return STATUS_LABELS[to] ?? to;
  }
}

// Returns null when the user may perform from→to, else a reason it's hidden.
function isAllowedForUser(from: Status, to: Status, p: { isManager: boolean; isAssignee: boolean; isQa: boolean }): boolean {
  const { isManager, isAssignee, isQa } = p;
  switch (to) {
    case 'completed':
      if (from === 'under-review') return isManager || isQa;     // approve / QA pass
      return isAssignee || isManager;                            // direct complete
    case 'issues':
      return isManager || isQa;                                  // request changes / QA fail
    case 'under-review':
      return isAssignee || isManager;                            // submit
    case 'in-progress':
      if (from === 'completed' || from === 'under-review') return isManager; // reopen / kickback
      return isAssignee || isManager;                            // resume
    default: // paused, blocked, new
      return isAssignee || isManager;
  }
}

export function TaskStatusActions({ currentStatus, isManager, isAssignee, isQa, checklistComplete, isBlocked, isAdmin, onChange }: TaskStatusActionsProps) {
  // A blocked task is frozen for everyone except admins — unblock it first.
  if (isBlocked && !isAdmin) {
    return (
      <div className="space-y-1.5">
        <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5">Change Status</h3>
        <p className="text-[10px] font-bold text-red-500 dark:text-red-400 px-0.5">
          Task is blocked. Unblock it before changing status.
        </p>
      </div>
    );
  }

  // When a target needs actual hours, we open an inline prompt instead of firing immediately.
  const [pendingTo, setPendingTo] = useState<Status | null>(null);
  const [hoursInput, setHoursInput] = useState('');
  const [saving, setSaving] = useState(false);

  const targets = (ALLOWED_EDGES[currentStatus] ?? []).filter(to =>
    // 'blocked' is handled by the dedicated Block Status panel, not the status switcher
    to !== 'blocked' && isAllowedForUser(currentStatus, to, { isManager, isAssignee, isQa })
  );
  if (targets.length === 0) return null;

  const handle = async (to: Status) => {
    // Checklist gate for under-review / completed (mirrors backend)
    if ((to === 'under-review' || to === 'completed') && !checklistComplete) return;
    // Actual hours compulsory unless entering new/paused/blocked → open the prompt.
    if (!HOURS_EXEMPT.includes(to)) {
      setHoursInput('');
      setPendingTo(to);
      return;
    }
    await onChange(to);
  };

  const confirmHours = async () => {
    if (!pendingTo) return;
    const hours = fromHHMM(hoursInput);
    if (hours == null || hours <= 0) return;   // require a positive value
    setSaving(true);
    try {
      await onChange(pendingTo, undefined, hours);
      setPendingTo(null);
      setHoursInput('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5">Change Status</h3>
      <div className="flex flex-wrap gap-1.5">
        {targets.map(to => {
          const gated = (to === 'under-review' || to === 'completed') && !checklistComplete;
          return (
            <button
              key={to}
              type="button"
              disabled={gated || saving}
              onClick={() => handle(to)}
              title={gated ? 'Complete all checklist items first' : `Move to ${STATUS_LABELS[to] ?? to}`}
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${TARGET_STYLE[to]}`}
            >
              {actionLabel(to)}
            </button>
          );
        })}
      </div>

      {/* Actual-hours prompt for the pending transition */}
      {pendingTo && (
        <div className="mt-1 p-2.5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-lg space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
            Hours spent — {STATUS_LABELS[pendingTo] ?? pendingTo}
          </p>
          <div className="flex items-center gap-2">
            <TimeInput
              value={hoursInput}
              onChange={setHoursInput}
              className="flex-1 px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg outline-none focus:ring-1 ring-indigo-400/40 text-[12px] font-mono"
            />
            <button
              type="button"
              onClick={confirmHours}
              disabled={saving || fromHHMM(hoursInput) == null || (fromHHMM(hoursInput) ?? 0) <= 0}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? '…' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => { setPendingTo(null); setHoursInput(''); }}
              className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700 text-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-[9px] text-gray-400 normal-case tracking-normal">Format HH:MM · required to move to {STATUS_LABELS[pendingTo] ?? pendingTo}.</p>
        </div>
      )}
    </div>
  );
}
