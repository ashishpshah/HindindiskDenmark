import React, { useState, useEffect, useRef } from 'react';
import { useQuickView } from '../../context/QuickViewContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Calendar, User, Clock, CheckCircle2, ListTodo, Activity, ExternalLink, FileText, Shield, Mail, UserCheck, History, ShieldAlert, Link2, Plus, ArrowLeft, ArrowRight, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn, formatDate, formatDateTime, toHHMM, formatSeconds } from '../../lib/utils';
import { CommentSection } from './CommentSection';
import { ChecklistPanel } from '../ui/ChecklistPanel';
import { TaskBlockPanel } from '../ui/TaskBlockPanel';
import { TaskStatusActions } from '../ui/TaskStatusActions';
import { ReassignModal } from '../ui/ReassignModal';
import { ReasonTag, BLOCK_REASON_TAGS, STATUS_LABELS, STATUS_BADGE_VARIANT, TaskEffort, TaskStatusHistory } from '../../types';
import { taskService } from '../../services/task.service';
import { TaskEffortPanel } from '../ui/TaskEffortPanel';
import { showSuccess, showError } from '../../lib/toast';

export function QuickViewContainer() {
  const { activeType, activeId, closeQuickView, openQuickView, goBack, canGoBack } = useQuickView();
  const { projects, tasks, users, activities, reassignTask, addChecklistItem, toggleChecklistItem, updateChecklistItem, deleteChecklistItem, markAllChecklistComplete, setTaskBlock, startTask, changeTaskStatus } = useData();
  const { user: currentUser, isAdmin } = useAuth();
  const [isTaskReassignOpen, setIsTaskReassignOpen] = useState(false);
  const [blockFormOpen, setBlockFormOpen] = useState(false);
  const [effort, setEffort] = useState<TaskEffort | null>(null);
  const [effortLoading, setEffortLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<TaskStatusHistory[]>([]);
  const [effortTab, setEffortTab] = useState<'history' | 'effort'>('history');
  const navigate = useNavigate();

  // Lazily fetch derived effort whenever a task detail (or its effort window) is opened.
  useEffect(() => {
    if ((activeType !== 'task' && activeType !== 'effort') || !activeId) {
      setEffort(null);
      return;
    }
    let cancelled = false;
    setEffortLoading(true);
    setEffort(null);
    taskService.getEffort(activeId)
      .then(e => { if (!cancelled) setEffort(e); })
      .catch(() => { if (!cancelled) setEffort(null); })
      .finally(() => { if (!cancelled) setEffortLoading(false); });
    return () => { cancelled = true; };
  }, [activeType, activeId]);

  // Status history — fetch whenever the effort frame opens.
  useEffect(() => {
    if (activeType !== 'effort' || !activeId) { setStatusLog([]); return; }
    let cancelled = false;
    taskService.getStatusHistory(activeId)
      .then(h => { if (!cancelled) setStatusLog(h); })
      .catch(() => { if (!cancelled) setStatusLog([]); });
    return () => { cancelled = true; };
  }, [activeType, activeId]);

  // Reset tab when a different task's effort frame opens.
  const prevEffortId = useRef<number | null>(null);
  useEffect(() => {
    if (activeType === 'effort' && activeId !== prevEffortId.current) {
      setEffortTab('history');
      prevEffortId.current = activeId;
    }
  }, [activeType, activeId]);

  if (!activeType || !activeId) return null;

  const renderContent = () => {
    switch (activeType) {
      case 'project': {
        const project = projects.find(p => p.id === activeId);
        if (!project) return <p className="p-4 text-center text-gray-500">Project not found</p>;

        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
        const owner = users.find(u => u.id === project.ownerId);

        // Task status breakdown counts
        const statusCounts: Record<string, number> = {};
        for (const t of projectTasks) {
          statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
        }
        const STATUS_DOT_PROJECT: Record<string, string> = {
          'new': 'bg-gray-400', 'in-progress': 'bg-indigo-500', 'paused': 'bg-amber-500',
          'blocked': 'bg-red-500', 'under-review': 'bg-purple-500', 'issues': 'bg-orange-500', 'completed': 'bg-emerald-500',
        };
        const STATUS_LABEL_PROJECT: Record<string, string> = {
          'new': 'New', 'in-progress': 'In Progress', 'paused': 'Paused',
          'blocked': 'Blocked', 'under-review': 'Review', 'issues': 'Issues', 'completed': 'Done',
        };

        return (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            {/* Header: code + status + dates */}
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant={project.status === 'completed' ? 'success' : project.status === 'active' ? 'info' : 'default'} className="uppercase text-[9px] font-black h-4">
                    {project.status}
                  </Badge>
                  {project.code && (
                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 text-[9px] font-black tracking-widest font-mono">
                      {project.code}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                  {project.startDate && (
                    <span className="flex items-center gap-0.5">
                      <Calendar size={9} className="opacity-60" />
                      {formatDate(project.startDate)}
                    </span>
                  )}
                  {project.startDate && project.endDate && <span className="opacity-30">→</span>}
                  {project.endDate && (
                    <span className="flex items-center gap-0.5 text-indigo-500">
                      <Calendar size={9} />
                      {formatDate(project.endDate)}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-[18px] font-black text-gray-900 dark:text-white uppercase tracking-tighter italic font-display leading-tight">
                {project.name}
              </h2>
              <p className="mt-1 text-gray-500 dark:text-gray-400 text-[12px] leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Load + Flow tiles */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-100/50 dark:border-gray-800/50">
                <div className="flex items-center text-gray-400 mb-0.5">
                  <ListTodo size={11} className="mr-1.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Load</span>
                </div>
                <div className="text-sm font-black font-mono">{projectTasks.length} Units</div>
              </div>
              <div className="p-2.5 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-100/50 dark:border-gray-800/50">
                <div className="flex items-center text-gray-400 mb-0.5">
                  <CheckCircle2 size={11} className="mr-1.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Flow</span>
                </div>
                <div className="text-sm font-black font-mono text-indigo-600">{progress}%</div>
              </div>
            </div>

            {/* Task status breakdown */}
            {projectTasks.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5 flex items-center gap-1">
                  <Activity size={9} /> Status Breakdown
                </h3>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-gray-50/80 dark:bg-gray-900/60 border border-gray-100/50 dark:border-gray-800/50">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT_PROJECT[status] ?? 'bg-gray-400'}`} />
                      <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 truncate flex-1">{STATUS_LABEL_PROJECT[status] ?? status}</span>
                      <span className="text-[10px] font-black font-mono text-gray-700 dark:text-gray-300">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modules */}
            {project.modules && project.modules.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5">Modules</h3>
                <div className="flex flex-wrap gap-1">
                  {project.modules.map((mod) => (
                    <span
                      key={mod}
                      className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tight"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Members */}
            {project.members && project.members.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5 flex items-center gap-1">
                  <User size={9} /> Team ({project.members.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.members.map((m) => (
                    <div
                      key={m.userId}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                      title={m.fullName}
                    >
                      <img
                        src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.fullName)}&background=random&size=24`}
                        alt={m.fullName}
                        className="h-4 w-4 rounded-full object-cover border border-white dark:border-gray-800 shrink-0"
                      />
                      <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400 truncate max-w-[80px]">{m.fullName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {project.attachments && project.attachments.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5">Manifests</h3>
                <div className="grid grid-cols-1 gap-1">
                  {project.attachments.slice(0, 2).map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-1.5 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-800 hover:border-indigo-200 transition-colors cursor-pointer group">
                      <div className="flex items-center min-w-0">
                        <FileText size={12} className="text-gray-300 mr-2 shrink-0" />
                        <div className="truncate">
                          <p className="text-[10px] font-black group-hover:text-indigo-600 transition-colors uppercase italic truncate">{file.name}</p>
                        </div>
                      </div>
                      <ExternalLink size={10} className="text-gray-300 group-hover:text-indigo-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Owner */}
            <div className="space-y-1.5">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5">Project Owner</h3>
              <div className="flex items-center p-2 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/30 dark:border-indigo-900/20">
                <img
                  src={owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner?.name || 'Owner')}&background=random&size=32`}
                  alt=""
                  className="h-6 w-6 rounded border border-white dark:border-gray-800 object-cover mr-2"
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-tight truncate">{owner?.name || project.ownerName || '—'}</div>
                  <div className="text-[8px] text-indigo-500 uppercase font-black tracking-widest">{owner?.role || 'Owner'}</div>
                </div>
              </div>
            </div>

            {/* Created by */}
            {(project.createdByName || project.createdAt) && (
              <div className="flex items-center justify-between px-0.5 py-1.5 border-t border-gray-50 dark:border-gray-900">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <UserCheck size={10} className="text-indigo-400" /> Created By
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{project.createdByName || '—'}</span>
                  {project.createdAt && (
                    <span className="text-[9px] font-mono text-gray-400">{formatDate(project.createdAt)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Ownership history */}
            {project.assignmentHistory && project.assignmentHistory.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5 flex items-center gap-1">
                  <History size={9} className="text-amber-500" /> Ownership History
                </h3>
                <div className="space-y-1">
                  {[...project.assignmentHistory]
                    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                    .map(h => (
                      <div key={h.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded tracking-widest">{h.reasonTag}</span>
                          <span className="text-[8px] text-gray-400 font-mono">{formatDateTime(h.changedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600 dark:text-gray-400">
                          <span className="line-through opacity-60">{h.previousOwnerName}</span>
                          <span className="opacity-30 mx-0.5">→</span>
                          <span className="text-indigo-600">{h.newOwnerName}</span>
                        </div>
                        <div className="text-[9px] text-gray-400 mt-0.5">by {h.changedByName}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-gray-50 dark:border-gray-900">
              <Link
                to={`/projects/${project.id}`}
                onClick={closeQuickView}
                className="flex items-center justify-center w-full py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all border border-indigo-100/50"
              >
                Access Full Relay <ExternalLink size={10} className="ml-2" />
              </Link>
            </div>
          </div>
        );
      }
      
      case 'task': {
        const task = tasks.find(t => t.id === activeId);
        if (!task) return <p className="p-4 text-center text-gray-500">Unit not found</p>;

        const project = projects.find(p => p.id === task.projectId);
        const assignee = users.find(u => u.id === task.assigneeId);
        const isCreator = currentUser?.id === task.createdById;
        const isAssignee = currentUser?.id === task.assigneeId;
        const isManager = isAdmin
          || isCreator
          || currentUser?.id === project?.ownerId
          || currentUser?.id === project?.createdById;
        const canReassignTask = isManager && task.status !== 'completed';
        const isQa = task.qaAssigneeId != null && currentUser?.id === task.qaAssigneeId;
        const canManageChecklist = isManager;
        const canUnblock = isManager;

        // Create Subtask — assignee or manager, only on top-level tasks (keeps a clean 2-level hierarchy)
        const canAddSubtask = (isAssignee || isManager) && !task.parentTaskId;

        // Checklist completion gates under-review/completed (mirrors backend).
        const checklistDone = !task.checklistItems?.length || task.checklistItems.every(c => c.isCompleted);

        return (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant={STATUS_BADGE_VARIANT[task.status] ?? 'default'} className="uppercase text-[9px] h-4">
                    {STATUS_LABELS[task.status] ?? task.status}
                  </Badge>
                  {task.isBlocked && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded text-[8px] font-black uppercase tracking-wider">
                      <ShieldAlert size={9} /> Blocked
                    </span>
                  )}
                  {task.module && (
                    <span className="text-[8px] font-black uppercase tracking-wider text-indigo-500/70 border-l border-gray-100 dark:border-gray-800 pl-1.5">
                      {task.module}
                    </span>
                  )}
                </div>
                <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.1em] border ${
                  task.priority === 'high' ? 'bg-red-50/50 text-red-500 border-red-100/50' : 
                  task.priority === 'medium' ? 'bg-amber-50/50 text-amber-500 border-amber-100/50' : 
                  'bg-emerald-50/50 text-emerald-500 border-emerald-100/50'
                }`}>
                  <span>{task.priority}</span>
                </div>
              </div>
              {task.code && (
                <span className="inline-block mb-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black tracking-widest font-mono">{task.code}</span>
              )}
              <h2 className="text-[18px] font-black text-gray-900 dark:text-white uppercase tracking-tighter italic font-display leading-tight">
                {task.title}
              </h2>
              {task.parentTaskId != null && (
                <button
                  type="button"
                  onClick={() => openQuickView('task', task.parentTaskId!)}
                  className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40 rounded text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                  title="Open parent task"
                >
                  <Link2 size={9} />
                  Linked to: {task.parentTaskTitle || `Task #${task.parentTaskId}`}
                </button>
              )}
              <div className="flex items-center mt-1 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                {project ? (
                  <span className="text-indigo-600/70 cursor-pointer hover:underline" onClick={() => openQuickView('project', project.id)}>
                    {project.name}
                  </span>
                ) : (
                  <span className="text-indigo-600/70">Unknown Project</span>
                )}
                <span className="mx-1.5 opacity-30">•</span>
                <span>Created {formatDate(task.createdAt)}</span>
              </div>
              <p className="mt-2 text-gray-500 dark:text-gray-400 text-[12px] leading-relaxed">
                {task.description}
              </p>
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map(tag => (
                    <span key={tag} className="text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-gray-50/50 dark:bg-gray-900/50 rounded border border-gray-100/50 dark:border-gray-800/50">
                <div className="flex items-center text-gray-400 mb-0.5">
                  <Calendar size={10} className="mr-1.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Deadline</span>
                </div>
                <div className="text-[11px] font-black font-mono">
                  {(() => {
                    if (!task.dueDate) return '--';
                    const createdAt = task.createdAt ? new Date(task.createdAt) : new Date();
                    const createHHMM = `${String(createdAt.getHours()).padStart(2,'0')}:${String(createdAt.getMinutes()).padStart(2,'0')}`;
                    const estMinutes = task.estimatedHours ? Math.round(task.estimatedHours * 60) : 0;
                    const base = new Date(`${task.dueDate}T${createHHMM}:00`);
                    const deadline = new Date(base.getTime() + estMinutes * 60000);
                    const pad = (n: number) => String(n).padStart(2, '0');
                    return `${pad(deadline.getDate())}-${pad(deadline.getMonth()+1)}-${deadline.getFullYear()} ${pad(deadline.getHours())}:${pad(deadline.getMinutes())}`;
                  })()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openQuickView('effort', task.id)}
                title="Open effort tracking"
                className="group/effort relative p-2 text-left bg-gray-50/50 dark:bg-gray-900/50 rounded border border-gray-100/50 dark:border-gray-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="flex items-center justify-between text-gray-400 mb-0.5">
                  <span className="flex items-center">
                    <Clock size={10} className="mr-1.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Effort</span>
                  </span>
                  <ArrowRight size={12} className="text-gray-300 group-hover/effort:text-indigo-500 group-hover/effort:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[11px] font-black font-mono">
                  {effort ? formatSeconds(effort.productiveSeconds) : '—'}
                  <span className="text-[8px] opacity-40 font-bold uppercase"> productive</span>
                </div>
                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  {task.startedAt ? `Started ${formatDateTime(task.startedAt)}` : 'Not started'}
                </div>
              </button>
            </div>

            {task.status !== 'completed' && (
              <div className="p-2.5 bg-indigo-50/20 dark:bg-indigo-900/10 rounded border border-indigo-100/20">
                <div className="flex justify-between text-[8px] font-black uppercase text-indigo-500 mb-1.5">
                  <span>Task Completion</span>
                  <span className="font-mono">{task.progress || 0}%</span>
                </div>
                <div className="h-1 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 shadow-sm transition-all duration-500" style={{ width: `${task.progress || 0}%` }} />
                </div>
                {task.estimatedHours && task.actualHours && task.actualHours > task.estimatedHours && (
                  <div className="mt-1.5 text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight flex items-center">
                    <Activity size={8} className="mr-1" /> Over budget by {toHHMM(task.actualHours - task.estimatedHours)}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5 flex items-center gap-1">
                  <User size={9} /> Assignee
                </h3>
                <div className="flex items-center p-2 bg-gray-50/30 dark:bg-gray-900/30 rounded border border-gray-100/30 dark:border-gray-800/30">
                  {assignee ? (
                    <>
                      <img src={assignee.avatar} alt="" className="h-6 w-6 rounded border border-white dark:border-gray-800 object-cover mr-1.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-tight truncate leading-none">{assignee.name}</div>
                        <div className="text-[8px] text-gray-400 uppercase font-black tracking-widest mt-0.5">{assignee.role}</div>
                      </div>
                    </>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold italic">Unassigned</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5 flex items-center gap-1">
                  <UserCheck size={9} /> Created By
                </h3>
                <div className="flex items-center p-2 bg-gray-50/30 dark:bg-gray-900/30 rounded border border-gray-100/30 dark:border-gray-800/30">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-tight truncate leading-none text-gray-700 dark:text-gray-300">
                      {project ? (users.find(u => u.id === project.ownerId)?.name || 'System') : 'System'}
                    </div>
                    <div className="text-[8px] text-gray-400 font-mono mt-0.5">{formatDate(task.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5">Checklist</h3>
              <ChecklistPanel
                taskId={task.id}
                items={task.checklistItems || []}
                currentUserId={currentUser?.id ?? 0}
                isAssignee={isAssignee}
                canManage={canManageChecklist}
                isStarted={task.startedAt != null}
                onStartTask={async () => {
                  await startTask(task.id);
                  showSuccess('Task started');
                }}
                onItemAdded={async (title) => {
                  const orderIndex = (task.checklistItems?.length ?? 0);
                  await addChecklistItem(task.id, title, orderIndex);
                }}
                onItemToggled={async (itemId, isCompleted) => {
                  await toggleChecklistItem(task.id, itemId, isCompleted);
                }}
                onItemUpdated={async (itemId, title, orderIndex) => {
                  await updateChecklistItem(task.id, itemId, title, orderIndex);
                }}
                onItemDeleted={async (itemId) => {
                  await deleteChecklistItem(task.id, itemId);
                }}
                onMarkAllComplete={async () => {
                  await markAllChecklistComplete(task.id);
                  showSuccess('All checklist items marked complete');
                }}
              />
            </div>

            {/* Status switcher — explicit button per allowed next status */}
            <TaskStatusActions
              currentStatus={task.status}
              isManager={isManager}
              isAssignee={isAssignee}
              isQa={isQa}
              checklistComplete={checklistDone}
              isBlocked={task.isBlocked}
              isAdmin={isAdmin}
              onChange={async (to, reason, actualHours) => {
                try { await changeTaskStatus(task.id, to, reason, actualHours); showSuccess(`Moved to ${STATUS_LABELS[to] ?? to}`); }
                catch (e) { showError(e instanceof Error ? e.message : 'Failed to change status'); }
              }}
            />

            {/* After Change Status: Reassign Task (left) | Block Status (right).
                When the block reason form is open, Block spans full width. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start pt-1">
              {/* Reassign — handles normal + blocked tasks; modal adapts its reason tags */}
              {canReassignTask && (
                <div className="space-y-1.5">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5 flex items-center gap-1">
                    <UserCheck size={9} className="text-amber-400" /> Reassign Task
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsTaskReassignOpen(true)}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors ${
                      task.isBlocked
                        ? 'border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20'
                        : 'border border-amber-200 dark:border-amber-800 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    }`}
                  >
                    <UserCheck size={12} />
                    Reassign Task
                  </button>
                  <ReassignModal
                    isOpen={isTaskReassignOpen}
                    onClose={() => setIsTaskReassignOpen(false)}
                    title={task.isBlocked ? 'Reassign Blocked Task' : 'Reassign Task'}
                    currentAssigneeId={task.assigneeId}
                    availableUsers={users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))}
                    reasonTags={task.isBlocked ? BLOCK_REASON_TAGS : undefined}
                    onConfirm={async (newUserId: number, reasonTag: ReasonTag) => {
                      await reassignTask(task.id, newUserId, reasonTag);
                      showSuccess('Task reassigned successfully');
                      setIsTaskReassignOpen(false);
                    }}
                  />
                </div>
              )}

              {/* Block panel */}
              <div className={`space-y-1.5 ${blockFormOpen ? 'sm:col-span-2' : ''}`}>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5 flex items-center gap-1">
                  <ShieldAlert size={9} className="text-red-400" /> Block Status
                </h3>
                <TaskBlockPanel
                  taskId={task.id}
                  isBlocked={task.isBlocked ?? false}
                  blockEntries={task.blockEntries ?? []}
                  currentUserId={currentUser?.id ?? 0}
                  isAssignee={isAssignee}
                  isAdmin={isAdmin}
                  canUnblock={canUnblock}
                  onFormOpenChange={setBlockFormOpen}
                  onSetBlock={async (blocked, reason) => {
                    await setTaskBlock(task.id, blocked, reason);
                  }}
                />
              </div>
            </div>

            {/* Linked Tasks (children) */}
            {task.childTasks && task.childTasks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5 flex items-center gap-1">
                  <Link2 size={9} className="text-indigo-500" /> Linked Tasks ({task.childTasks.length})
                </h3>
                <div className="space-y-1">
                  {task.childTasks.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openQuickView('task', c.id)}
                      className="w-full flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-colors text-left"
                    >
                      <Badge variant={STATUS_BADGE_VARIANT[c.status] ?? 'default'} className="uppercase text-[8px] h-4 shrink-0">
                        {STATUS_LABELS[c.status] ?? c.status}
                      </Badge>
                      {c.code && <span className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[8px] font-black tracking-widest font-mono shrink-0">{c.code}</span>}
                      <span className="flex-1 text-[11px] font-bold text-gray-700 dark:text-gray-300 truncate">{c.title}</span>
                      {c.assignedToName && (
                        <span className="text-[9px] font-bold text-gray-400 truncate max-w-[80px]">{c.assignedToName}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create Subtask — top-level tasks, parent pre-filled via the create modal */}
            {canAddSubtask && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    closeQuickView();
                    navigate(`/tasks?newLinkedFrom=${task.id}`);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  <Plus size={12} />
                  Create Subtask
                </button>
              </div>
            )}

            {/* Assignment History — always shown, full width */}
            <div className="space-y-1.5 pt-1">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5 flex items-center gap-1">
                <History size={9} className="text-amber-500" /> Assignment History
              </h3>
              {task.assignmentHistory && task.assignmentHistory.length > 0 ? (
                <div className="space-y-1.5">
                  {[...task.assignmentHistory].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()).map(h => (
                    <div key={h.id} className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-amber-100 dark:hover:border-amber-900/40 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded tracking-widest">{h.reasonTag}</span>
                        <span className="text-[8px] text-gray-400 font-mono">{formatDateTime(h.changedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600 dark:text-gray-400">
                        <span className="line-through opacity-60">{h.previousAssigneeName || 'Unassigned'}</span>
                        <span className="opacity-30 mx-0.5">→</span>
                        <span className="text-indigo-600">{h.newAssigneeName || 'Unassigned'}</span>
                      </div>
                      <div className="text-[9px] text-gray-400 mt-0.5">by {h.changedByName}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 italic px-0.5">No reassignments yet.</p>
              )}
            </div>

            <CommentSection taskId={task.id} comments={task.comments || []} canComment={isCreator || isAssignee || currentUser?.id === project?.ownerId || currentUser?.id === project?.createdById} />

            <div className="pt-3 border-t border-gray-50 dark:border-gray-900 flex gap-2">
              <Link
                to={`/projects/${task.projectId}`}
                onClick={closeQuickView}
                className="flex-1 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 rounded transition-all"
              >
                Project Relay
              </Link>
              <button
                onClick={closeQuickView}
                className="flex-1 h-8 flex items-center justify-center text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all shadow-sm"
              >
                Terminate View
              </button>
            </div>
          </div>
        );
      }

      case 'user': {
        const user = users.find(u => u.id === activeId);
        if (!user) return <p className="p-4 text-center text-gray-500">User not found</p>;
        
        const userTasks = tasks.filter(t => t.assigneeId === user.id);
        const userProjects = projects.filter(p => p.ownerId === user.id);
        const userActivities = activities.filter(a => a.userId === user.id).slice(0, 3);

        return (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="h-16 w-16 rounded-xl object-cover border-2 border-white dark:border-gray-800 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />
              </div>
              <h2 className="text-[18px] font-black text-gray-900 dark:text-white uppercase tracking-tighter italic font-display leading-tight">
                {user.name}
              </h2>
              <div className="mt-1 flex items-center text-indigo-600 text-[9px] font-black uppercase tracking-widest">
                <Shield size={10} className="mr-1.5" />
                {user.role}
              </div>
              <div className="mt-2 flex items-center text-gray-400 text-[11px] font-medium">
                <Mail size={12} className="mr-1.5 opacity-50" />
                {user.email}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-100/50 dark:border-gray-800/50 text-center">
                <div className="text-lg font-black font-mono text-gray-900 dark:text-white leading-none">{userProjects.length}</div>
                <div className="text-[8px] font-black uppercase tracking-tighter text-gray-400 mt-1">Managed</div>
              </div>
              <div className="p-2.5 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-100/50 dark:border-gray-800/50 text-center">
                <div className="text-lg font-black font-mono text-gray-900 dark:text-white leading-none">{userTasks.length}</div>
                <div className="text-[8px] font-black uppercase tracking-tighter text-gray-400 mt-1">Assigned</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-0.5">Stream</h3>
              <div className="space-y-1.5 divide-y divide-gray-50 dark:divide-gray-900">
                {userActivities.map((activity) => (
                  <div key={activity.id} className="pt-1.5 flex items-start space-x-2">
                    <div className="h-4 w-4 rounded bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 border border-indigo-100/30">
                      <Activity size={10} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-900 dark:text-gray-100 font-medium leading-none truncate">
                        {activity.action} {activity.targetName}
                      </p>
                      <p className="text-[8px] text-gray-400 uppercase font-black mt-1 font-mono">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-50 dark:border-gray-900">
              <Link 
                to={`/users/${user.id}`} 
                onClick={closeQuickView}
                className="flex items-center justify-center w-full py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all border border-indigo-100/50"
              >
                Profile Node <ExternalLink size={10} className="ml-2" />
              </Link>
            </div>
          </div>
        );
      }

      case 'effort': {
        const task = tasks.find(t => t.id === activeId);
        const loggedEntries = statusLog.filter(h => h.actualHours != null && h.actualHours > 0);
        const totalLogged = loggedEntries.reduce((sum, h) => sum + (h.actualHours ?? 0), 0);

        // Status colour map (matches TaskEffortPanel)
        const STATUS_DOT: Record<string, string> = {
          'new': 'bg-gray-400', 'in-progress': 'bg-indigo-500', 'paused': 'bg-amber-500',
          'blocked': 'bg-red-500', 'under-review': 'bg-purple-500', 'issues': 'bg-orange-500', 'completed': 'bg-emerald-500',
        };

        return (
          <div className="space-y-3">
            {/* Header */}
            <div>
              <h2 className="text-[16px] font-black text-gray-900 dark:text-white uppercase tracking-tighter italic font-display leading-tight flex items-center gap-2">
                <Clock size={15} className="text-indigo-500" /> Effort Details
              </h2>
              {task && (
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 truncate">{task.title}</p>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-gray-100 dark:border-gray-800">
              {([
                { key: 'history', label: 'Status History' },
                { key: 'effort',  label: 'User Effort Timeline' },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setEffortTab(t.key)}
                  className={`py-2 px-0.5 mr-4 text-[9px] font-black uppercase tracking-widest border-b-2 transition-colors ${
                    effortTab === t.key
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab 1: Status History ── */}
            {effortTab === 'history' && (
              statusLog.length === 0 && !effortLoading ? (
                <p className="text-[10px] text-gray-400 italic px-0.5 py-4 text-center">No status changes recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {/* Timeline */}
                  <div className="relative pl-4 space-y-0">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-800" />
                    {statusLog.map((h, i) => (
                      <div key={h.id} className="relative flex gap-2.5 pb-2.5 last:pb-0">
                        <span className={`absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 shrink-0 ${STATUS_DOT[h.toStatus] ?? 'bg-gray-400'}`} />
                        <div className="flex-1 min-w-0 p-2 rounded-lg bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                          {/* Transition chips */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${STATUS_DOT[h.fromStatus] ?? 'bg-gray-400'}`}>
                              {STATUS_LABELS[h.fromStatus] ?? h.fromStatus}
                            </span>
                            <ChevronRightIcon size={9} className="text-gray-400 shrink-0" />
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white ${STATUS_DOT[h.toStatus] ?? 'bg-gray-400'}`}>
                              {STATUS_LABELS[h.toStatus] ?? h.toStatus}
                            </span>
                            {i === 0 && (
                              <span className="ml-auto text-[7px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1 py-0.5 rounded">Latest</span>
                            )}
                          </div>
                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[8px] text-gray-400 font-mono">
                            <span className="font-semibold text-gray-600 dark:text-gray-300">{h.changedByName}</span>
                            <span>{formatDateTime(h.changedAt)}</span>
                            {h.actualHours != null && h.actualHours > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-black">⏱ {toHHMM(h.actualHours)}</span>
                            )}
                            {h.reason && <span className="italic">"{h.reason}"</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Manual actual hours total */}
                  {loggedEntries.length > 0 && (
                    <div className="pt-1 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[9px] font-mono text-gray-400">
                      <span className="font-black uppercase tracking-widest">Actual Hours Total</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{toHHMM(totalLogged)}</span>
                    </div>
                  )}
                </div>
              )
            )}

            {/* ── Tab 2: User Effort Timeline ── */}
            {effortTab === 'effort' && (
              <div className="space-y-1.5">
                <TaskEffortPanel effort={effort} loading={effortLoading} />
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={activeType !== null}
      onClose={closeQuickView}
      title={activeType ? `${activeType.charAt(0).toUpperCase() + activeType.slice(1)} Details` : ''}
    >
      {canGoBack && (
        <button
          type="button"
          onClick={goBack}
          className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={13} /> Back
        </button>
      )}
      {renderContent()}
    </Modal>
  );
}
