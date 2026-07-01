import { useState } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { TaskBlockEntry } from '../../types';
import { formatDateTime } from '../../lib/utils';

interface TaskBlockPanelProps {
  taskId: number;
  isBlocked: boolean;
  blockEntries: TaskBlockEntry[];
  currentUserId: number;
  isAssignee: boolean;
  isAdmin: boolean;
  canUnblock: boolean;
  onSetBlock: (isBlocked: boolean, reason: string) => Promise<void>;
  /** Optional: notify parent when the reason form opens/closes (so it can widen the layout). */
  onFormOpenChange?: (open: boolean) => void;
}

export function TaskBlockPanel({
  isBlocked,
  blockEntries,
  currentUserId,
  isAssignee,
  isAdmin,
  canUnblock,
  onSetBlock,
  onFormOpenChange,
}: TaskBlockPanelProps) {
  const [showForm, setShowFormState] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const setShowForm = (open: boolean) => { setShowFormState(open); onFormOpenChange?.(open); };

  // Assignee or admin can raise a block (owner/creator can unblock via canUnblock).
  const canBlock = isAssignee || isAdmin;
  const canAct = canBlock || canUnblock;
  if (!canAct) return null;

  const myActiveBlock = blockEntries.find(b => b.blockedById === currentUserId && b.isActive);

  const activeBlocks = blockEntries.filter(b => b.isActive);

  const handleBlock = async () => {
    if (!reason.trim()) return;
    setSaving(true);
    try {
      await onSetBlock(true, reason.trim());
      setReason('');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async () => {
    setSaving(true);
    try {
      await onSetBlock(false, '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Active block banner */}
      {isBlocked && activeBlocks.length > 0 && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">
              Task Blocked
            </p>
            <div className="space-y-1.5">
              {activeBlocks.map(entry => (
                <div key={entry.id} className="text-[11px] text-red-700 dark:text-red-300">
                  <span className="font-bold">{entry.blockedByName}</span>
                  <span className="text-red-500 dark:text-red-400 mx-1">—</span>
                  <span className="italic">"{entry.reason}"</span>
                  <span className="ml-1.5 text-[9px] text-red-400 font-mono">{formatDateTime(entry.blockedAt)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action area */}
      <div className="flex items-center gap-2 flex-wrap">
        {canUnblock && isBlocked && (
          <button
            onClick={handleUnblock}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <ShieldCheck size={12} />
            {saving ? 'Saving...' : 'Unblock Task'}
          </button>
        )}
        {canBlock && !isBlocked && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <ShieldAlert size={12} />
            Block Task
          </button>
        )}
      </div>

      {/* Block reason form */}
      {showForm && canBlock && (
        <div className="p-3 bg-red-50/60 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Block Reason</p>
            <button onClick={() => { setShowForm(false); setReason(''); }} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe why this task is blocked..."
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded text-[12px] outline-none focus:ring-1 ring-red-400/40 resize-none placeholder-gray-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setReason(''); }}
              className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-gray-700 text-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              disabled={saving || !reason.trim()}
              className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <ShieldAlert size={11} />
              {saving ? 'Blocking...' : 'Confirm Block'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
