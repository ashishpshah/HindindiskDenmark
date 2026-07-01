import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Clock, Link2 } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { DateInput } from '../components/ui/DateInput';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { useData } from '../context/DataContext';
import { useSweetAlert } from '../context/SweetAlertContext';
import { showSuccess, showError } from '../lib/toast';
import {
  diaryService,
  WorkDiaryEntry,
  CreateWorkDiaryDto,
  UpdateWorkDiaryDto,
  DIARY_CATEGORIES,
} from '../services/diary.service';
import { isAllowedDiaryDate } from '../lib/diaryDateUtils';
import { formatDate } from '../lib/utils';

// ── helpers ──────────────────────────────────────────────────────────────────

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupByDate(entries: WorkDiaryEntry[]): Map<string, WorkDiaryEntry[]> {
  const map = new Map<string, WorkDiaryEntry[]>();
  for (const e of entries) {
    const key = e.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return map;
}

const CATEGORY_COLORS: Record<string, string> = {
  Development: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  Meeting:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Review:      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Testing:     'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Documentation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Other:       'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

// ── modal form ────────────────────────────────────────────────────────────────

interface DiaryFormProps {
  initial?: WorkDiaryEntry;
  tasks: { id: number; title: string; code?: string }[];
  onSave: (dto: CreateWorkDiaryDto | UpdateWorkDiaryDto, id?: number) => Promise<void>;
  onClose: () => void;
}

function DiaryEntryModal({ initial, tasks, onSave, onClose }: DiaryFormProps) {
  const [date, setDate] = useState(initial ? initial.date.slice(0, 10) : todayISO());
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [hours, setHours] = useState(initial?.hoursSpent != null ? String(initial.hoursSpent) : '');
  const [taskId, setTaskId] = useState<number | ''>(initial?.taskId ?? '');
  const [saving, setSaving] = useState(false);

  const isEdit = !!initial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { showError('Description is required.'); return; }
    if (!date) { showError('Date is required.'); return; }
    if (!isAllowedDiaryDate(new Date(date))) {
      showError('Selected date is not a valid working day.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const dto: UpdateWorkDiaryDto = {
          description: description.trim(),
          category: category || undefined,
          hoursSpent: hours ? parseFloat(hours) : undefined,
          taskId: taskId !== '' ? Number(taskId) : undefined,
        };
        await onSave(dto, initial.id);
      } else {
        const dto: CreateWorkDiaryDto = {
          date,
          description: description.trim(),
          category: category || undefined,
          hoursSpent: hours ? parseFloat(hours) : undefined,
          taskId: taskId !== '' ? Number(taskId) : undefined,
        };
        await onSave(dto);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Edit Diary Entry' : 'Add Diary Entry'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date — only show when adding; date is immutable on edit */}
        {!isEdit && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={date}
              onChange={setDate}
              disabledDate={(d) => !isAllowedDiaryDate(d)}
              className="input w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Today and past working days only (Mon–Sat, excl. 2nd/4th Saturdays)
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What did you work on today?"
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Select category —</option>
            {DIARY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Hours Spent */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Hours Spent
          </label>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="e.g. 3.5"
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Linked Task */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
            Linked Task
          </label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— No linked task —</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code ? `${t.code} – ` : ''}{t.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Entry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Diary() {
  const { tasks } = useData();
  const { confirmAlert } = useSweetAlert();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState<WorkDiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkDiaryEntry | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await diaryService.getMyDiary(month, year);
      setEntries(data);
    } catch {
      showError('Failed to load diary entries.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (dto: CreateWorkDiaryDto | UpdateWorkDiaryDto, id?: number) => {
    try {
      if (id != null) {
        await diaryService.update(id, dto as UpdateWorkDiaryDto);
        showSuccess('Entry updated.');
      } else {
        await diaryService.add(dto as CreateWorkDiaryDto);
        showSuccess('Entry added.');
      }
      setModalOpen(false);
      setEditing(undefined);
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save entry.';
      showError(msg);
      throw err;
    }
  };

  const handleDelete = (entry: WorkDiaryEntry) => {
    confirmAlert('Delete this diary entry? This cannot be undone.', async () => {
      try {
        await diaryService.remove(entry.id);
        showSuccess('Entry deleted.');
        await load();
      } catch {
        showError('Failed to delete entry.');
      }
    });
  };

  const openAdd = () => { setEditing(undefined); setModalOpen(true); };
  const openEdit = (e: WorkDiaryEntry) => { setEditing(e); setModalOpen(true); };

  const grouped = groupByDate(entries);
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const taskOptions = tasks.map((t) => ({ id: t.id, title: t.title, code: t.code }));

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <PageHeader
            title="Work Diary"
            description="Log your daily work notes"
          />
          <Button onClick={openAdd}>
            <Plus size={15} className="mr-1" /> Add Entry
          </Button>
        </div>

        {/* Month / Year filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-600/20 border-t-indigo-600 animate-spin" />
          </div>
        ) : sortedDates.length === 0 ? (
          <EmptyState
            title="No diary entries"
            description={`No entries for ${months[month - 1]} ${year}. Click "Add Entry" to log your work.`}
            icon={BookOpen}
          />
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => {
              const dayEntries = grouped.get(dateKey)!;
              const dateObj = new Date(dateKey + 'T00:00:00');
              const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
              const totalHours = dayEntries.reduce(
                (sum, e) => sum + (e.hoursSpent ?? 0),
                0
              );
              return (
                <div key={dateKey}>
                  {/* Date heading */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {dayName}
                      </span>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {formatDate(dateKey)}
                      </span>
                      {totalHours > 0 && (
                        <span className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          <Clock size={11} /> {totalHours}h
                        </span>
                      )}
                    </div>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                  </div>

                  {/* Entries for this date */}
                  <div className="space-y-3">
                    {dayEntries.map((entry) => (
                      <Card key={entry.id} className="group">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {/* Badges row */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {entry.category && (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.Other
                                    }`}
                                  >
                                    {entry.category}
                                  </span>
                                )}
                                {entry.hoursSpent != null && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                    <Clock size={10} /> {entry.hoursSpent}h
                                  </span>
                                )}
                                {entry.taskTitle && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400">
                                    <Link2 size={10} /> {entry.taskTitle}
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                {entry.description}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEdit(entry)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                title="Edit"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(entry)}
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <DiaryEntryModal
          initial={editing}
          tasks={taskOptions}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(undefined); }}
        />
      )}
    </PageTransition>
  );
}
