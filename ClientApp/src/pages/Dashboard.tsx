import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatDateTime, formatSeconds } from '../lib/utils';
import { Card, CardContent } from '../components/ui/Card';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import { Folder, CheckCircle2, Users, ClipboardCheck, ShieldAlert, UserCheck, Calendar, Clock, Zap, Activity, PauseCircle, Trophy } from 'lucide-react';
import { InteractiveLink } from '../components/ui/InteractiveLink';
import { Badge } from '../components/ui/Badge';
import { DateInput } from '../components/ui/DateInput';
import { PageTransition } from '../components/Layout/PageTransition';
import { ReassignModal } from '../components/ui/ReassignModal';
import { ReasonTag, BLOCK_REASON_TAGS, STATUS_BADGE_VARIANT, STATUS_LABELS, DashboardEffort } from '../types';
import { taskService } from '../services/task.service';
import { PeriodKey, PERIOD_OPTIONS, resolvePeriod, resolveCustom } from '../lib/dateRanges';
import { showSuccess, showError } from '../lib/toast';
import { VSelect, SelectOption } from '../components/forms/VSelect';

export default function Dashboard() {
  const { projects, tasks, users, loading, reassignTask } = useData();
  const { isAdmin, user: currentUser } = useAuth();
  const [reassigningTaskId, setReassigningTaskId] = useState<number | null>(null);

  // ── Effort widgets: period filter + org-wide stats ─────────────────────────
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [effortStats, setEffortStats] = useState<DashboardEffort | null>(null);
  const [effortLoading, setEffortLoading] = useState(false);

  useEffect(() => {
    const range = period === 'custom' ? resolveCustom(customFrom, customTo) : resolvePeriod(period);
    // For a custom range, wait until at least one bound is chosen.
    if (period === 'custom' && !range.from && !range.to) return;
    let cancelled = false;
    setEffortLoading(true);
    taskService.getEffortStats(range.from, range.to)
      .then(s => { if (!cancelled) setEffortStats(s); })
      .catch(() => { if (!cancelled) setEffortStats(null); })
      .finally(() => { if (!cancelled) setEffortLoading(false); });
    return () => { cancelled = true; };
  }, [period, customFrom, customTo]);

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed').length;

  // Tasks visible to the logged-in user: admin sees all; others see only tasks
  // assigned to OR created by them.
  const isMine = (t: typeof tasks[number]) =>
    !!currentUser && (t.assigneeId === currentUser.id || t.createdById === currentUser.id);
  const myTasks = isAdmin ? tasks : tasks.filter(isMine);

  // Blocked tasks (same scope: admin all, else assigned/created by me)
  const blockedTasks = myTasks.filter(t => t.isBlocked);

  const stats = [
    { id: 1, label: 'Total Projects', value: String(projects.length), icon: Folder, color: 'indigo', href: '/projects' },
    { id: 2, label: 'Active Tasks', value: String(activeTasks), icon: CheckCircle2, color: 'emerald', href: '/tasks' },
    { id: 3, label: 'Team Members', value: String(users.length), icon: Users, color: 'blue', href: '/users' },
    { id: 4, label: 'Blocked Tasks', value: String(blockedTasks.length), icon: ShieldAlert, color: blockedTasks.length > 0 ? 'red' : 'teal', href: '/tasks' },
  ];

  const recentTasks = myTasks.slice(0, 5);
  const activeProjectsList = projects.filter(p => p.status === 'active').slice(0, 3);

  // ── Personal "My Work" lists (logged-in user) ──────────────────────────────
  const uid = currentUser?.id;
  const byCreatedDesc = (a: typeof tasks[number], b: typeof tasks[number]) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  const taskIsOverdue = (t: typeof tasks[number]) =>
    !!t.dueDate && new Date(t.dueDate).getTime() < Date.now() && t.status !== 'completed';
  const assignedToMe = uid ? tasks.filter(t => t.assigneeId === uid).sort(byCreatedDesc).slice(0, 10) : [];
  const createdByMe  = uid ? tasks.filter(t => t.createdById === uid).sort(byCreatedDesc) : [];

  // Merged "My Deadlines": my non-completed dated tasks — overdue first (most overdue first),
  // then upcoming by soonest due date.
  const myDeadlines = uid
    ? tasks
        .filter(t => (t.assigneeId === uid || t.createdById === uid) && t.status !== 'completed' && !!t.dueDate)
        .sort((a, b) => {
          const ao = taskIsOverdue(a), bo = taskIsOverdue(b);
          if (ao !== bo) return ao ? -1 : 1;            // overdue group first
          return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(); // then soonest due
        })
        .slice(0, 8)
    : [];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
    teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/40',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
  };

  const reassigningTask = reassigningTaskId ? tasks.find(t => t.id === reassigningTaskId) : null;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => {
            const Icon = stat.icon;
            return (
              <Link key={stat.id} to={stat.href}>
                <Card className="h-full hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${colorMap[stat.color]}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* ── Effort & Productivity widgets ─────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Activity size={15} className="text-indigo-600" /> Effort & Productivity
              {effortLoading && <span className="text-[10px] font-bold text-gray-400 normal-case tracking-normal">updating…</span>}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <VSelect
                options={PERIOD_OPTIONS.map((o): SelectOption => ({ value: o.key, label: o.label }))}
                value={{ value: period, label: PERIOD_OPTIONS.find(o => o.key === period)?.label ?? period }}
                onChange={(opt) => { if (opt) setPeriod(opt.value as PeriodKey); }}
                isSearchable={false}
                className="w-36"
              />
              {period === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <DateInput value={customFrom} onChange={setCustomFrom} className="px-2 py-1.5 text-[12px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                  <span className="text-[10px] text-gray-400 font-bold">to</span>
                  <DateInput value={customTo} onChange={setCustomTo} className="px-2 py-1.5 text-[12px] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {([
              { label: 'Active Users', value: String(effortStats?.totalActiveUsers ?? 0), icon: Users, color: 'blue' },
              { label: 'Working Hours', value: formatSeconds(effortStats?.workingSeconds ?? 0), icon: Clock, color: 'indigo' },
              { label: 'Productive Hours', value: formatSeconds(effortStats?.productiveSeconds ?? 0), icon: Zap, color: 'emerald' },
              { label: 'Currently Working', value: String(effortStats?.usersCurrentlyWorking ?? 0), icon: Activity, color: 'emerald' },
              { label: 'In Pause / Review', value: String(effortStats?.usersInPauseReview ?? 0), icon: PauseCircle, color: 'amber' },
            ] as const).map((w, i) => {
              const Icon = w.icon;
              return (
                <Card key={i} className="h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center border ${colorMap[w.color]}`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{w.label}</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white font-mono">{w.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Top productive users */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5 mb-3">
                <Trophy size={13} className="text-amber-500" /> Top Productive Users
              </h3>
              {effortStats && effortStats.topProductiveUsers.length > 0 ? (
                <div className="space-y-2">
                  {effortStats.topProductiveUsers.map((u, i) => {
                    const max = effortStats.topProductiveUsers[0].productiveSeconds || 1;
                    const pct = Math.round((u.productiveSeconds / max) * 100);
                    return (
                      <div key={u.userId} className="flex items-center gap-3">
                        <span className="text-[11px] font-black text-gray-400 w-4 shrink-0">{i + 1}</span>
                        <InteractiveLink type="user" id={u.userId} className="flex items-center gap-2 w-40 shrink-0 min-w-0">
                          <img src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.userName)}&background=random`} alt="" className="h-6 w-6 rounded border border-gray-100 dark:border-gray-800 object-cover" />
                          <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200 truncate hover:text-indigo-600">{u.userName}</span>
                        </InteractiveLink>
                        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400 shrink-0 w-16 text-right">{formatSeconds(u.productiveSeconds)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 italic">No productive time recorded for this period.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Work: Assigned to Me | Created by Me (if any) */}
        {(() => {
          const renderRow = (task: typeof tasks[number], opts?: { overdue?: boolean }) => {
            const assignee = users.find(u => u.id === task.assigneeId);
            const daysLeft = task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000) : null;
            return (
              <div key={task.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-50 dark:border-gray-900 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {task.code && <span className="text-[8px] font-black tracking-widest font-mono text-gray-400 shrink-0">{task.code}</span>}
                    <InteractiveLink type="task" id={task.id} className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 truncate">
                      {task.title}
                    </InteractiveLink>
                    {task.isBlocked && <ShieldAlert size={11} className="text-red-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={STATUS_BADGE_VARIANT[task.status] ?? 'default'} className="text-[8px] uppercase tracking-tight">
                      {STATUS_LABELS[task.status] ?? task.status}
                    </Badge>
                    {assignee && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 truncate">
                        <img src={assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=random&size=20`} alt="" className="h-3.5 w-3.5 rounded-full object-cover" />
                        <span className="truncate max-w-[80px]">{assignee.name}</span>
                      </span>
                    )}
                  </div>
                </div>
                {opts?.overdue && daysLeft != null
                  ? <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap shrink-0 mt-0.5 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">{Math.abs(daysLeft)}d overdue</span>
                  : task.dueDate && <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap shrink-0 mt-0.5 flex items-center gap-1"><Calendar size={9} className="opacity-60" />{formatDate(task.dueDate)}</span>}
              </div>
            );
          };

          const simpleBox = (title: string, Icon: typeof UserCheck, items: typeof tasks, empty: string, viewAllTo: string) => (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon size={16} className="text-indigo-500" />
                  <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">{title}</h3>
                  {items.length > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">{items.length}</span>
                  )}
                </div>
                <Link to={viewAllTo} className="text-xs text-indigo-600 font-semibold hover:underline">View all →</Link>
              </div>
              <Card>
                <CardContent className="p-4 space-y-1">
                  {items.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-4">{empty}</p>
                    : items.map(t => renderRow(t))}
                </CardContent>
              </Card>
            </div>
          );

          // Deadlines box (overdue first, then upcoming) — shown right of "Assigned to Me"
          const hasOverdue = myDeadlines.some(taskIsOverdue);
          const deadlinesBox = (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ClipboardCheck size={16} className={hasOverdue ? 'text-red-500' : 'text-indigo-500'} />
                  <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Overdue &amp; Upcoming Deadlines</h3>
                  {hasOverdue && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      {myDeadlines.filter(taskIsOverdue).length} overdue
                    </span>
                  )}
                </div>
                <Link to={`/tasks?mine=1&due=${hasOverdue ? 'overdue' : 'upcoming'}`} className="text-xs text-indigo-600 font-semibold hover:underline">View all →</Link>
              </div>
              <Card>
                <CardContent className="p-4 space-y-2">
                  {myDeadlines.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No upcoming or overdue deadlines</p>
                  ) : (
                    myDeadlines.map((task, idx) => {
                      const assignee = users.find(u => u.id === task.assigneeId);
                      const daysLeft = Math.ceil((new Date(task.dueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      const urgency = daysLeft < 0 ? 'overdue' : daysLeft === 0 ? 'today' : daysLeft <= 2 ? 'soon' : 'normal';
                      const prevOverdue = idx > 0 && taskIsOverdue(myDeadlines[idx - 1]);
                      const showUpcomingDivider = !taskIsOverdue(task) && (idx === 0 || prevOverdue);
                      return (
                        <React.Fragment key={task.id}>
                          {showUpcomingDivider && idx > 0 && (
                            <div className="pt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">Upcoming</div>
                          )}
                          <div className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-50 dark:border-gray-900 last:border-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <InteractiveLink type="task" id={task.id} className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 truncate">
                                  {task.title}
                                </InteractiveLink>
                                {task.isBlocked && <ShieldAlert size={11} className="text-red-500 shrink-0" />}
                              </div>
                              {assignee && (
                                <InteractiveLink type="user" id={assignee.id} className="flex items-center gap-1 mt-0.5 w-fit hover:opacity-80 transition-opacity">
                                  <img
                                    src={assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=random&size=20`}
                                    alt={assignee.name}
                                    className="h-3.5 w-3.5 rounded-full object-cover border border-indigo-200 dark:border-indigo-800"
                                  />
                                  <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 truncate max-w-[80px]">{assignee.name}</span>
                                </InteractiveLink>
                              )}
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap shrink-0 mt-0.5 ${
                              urgency === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                              urgency === 'today'   ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                              urgency === 'soon'    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {urgency === 'overdue' ? `${Math.abs(daysLeft)}d overdue` : urgency === 'today' ? 'Today' : `In ${daysLeft}d`}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          );

          return (
            <div className="space-y-4">
              {/* Assigned to Me | Overdue & Upcoming Deadlines */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                {simpleBox('Assigned to Me', UserCheck, assignedToMe, 'No tasks assigned to you', '/tasks?mine=1')}
                {deadlinesBox}
              </div>
              {/* Created by Me (only if any) */}
              {createdByMe.length > 0 && simpleBox('Created by Me', ClipboardCheck, createdByMe, 'You have not created any tasks', '/tasks?createdByMe=1')}
            </div>
          );
        })()}

        {/* Row: Recent Tasks (left) | Blocked Tasks (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* Recent Tasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 size={16} className="text-indigo-500" />
              <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">
                Recent Tasks
              </h3>
            </div>
            <Link to={isAdmin ? '/tasks' : '/tasks?mine=1'} className="text-xs text-indigo-600 font-semibold hover:underline">
              View all →
            </Link>
          </div>
          <Card>
            <CardContent className="p-4 space-y-3">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No tasks yet</p>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-900">
                  {recentTasks.map(task => {
                    const project  = projects.find(p => p.id === task.projectId);
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const creator  = users.find(u => u.id === task.createdById);
                    const owner    = project ? users.find(u => u.id === project.ownerId) : undefined;

                    const checkTotal = task.checklistItems?.length ?? 0;
                    const checkDone  = task.checklistItems?.filter(c => c.isCompleted).length ?? 0;
                    const progress   = task.progress ?? (checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0);

                    const daysLeft = Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86400000);
                    const isOverdue = daysLeft < 0 && task.status !== 'completed';

                    const priorityDot =
                      task.priority === 'high'   ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';

                    const priorityLabel =
                      task.priority === 'high'   ? 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/40' :
                      task.priority === 'medium' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/40' :
                                                   'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/40';

                    const statusVariant = STATUS_BADGE_VARIANT[task.status] ?? 'default';

                    const progressColor = progress === 100 ? 'bg-emerald-500' : task.isBlocked ? 'bg-red-400' : 'bg-indigo-500';

                    return (
                      <div key={task.id} className="p-4 hover:bg-gray-50/60 dark:hover:bg-gray-900/30 transition-colors group">
                        {/* Row 1: title + status + priority + blocked */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${priorityDot}`} />
                            <InteractiveLink type="task" id={task.id} className="text-[13px] font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 transition-colors leading-tight font-display truncate">
                              {task.title}
                            </InteractiveLink>
                            {task.isBlocked && (
                              <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded text-[8px] font-black uppercase tracking-widest text-red-600">
                                <ShieldAlert size={8} /> Blocked
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${priorityLabel}`}>
                              {task.priority}
                            </span>
                            <Badge variant={statusVariant} className="text-[9px] uppercase tracking-tight">
                              {STATUS_LABELS[task.status] ?? task.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Row 2: project name */}
                        {project && (
                          <div className="mb-2">
                            <InteractiveLink type="project" id={project.id} className="text-[9px] font-black uppercase tracking-widest text-indigo-500/70 hover:text-indigo-600 transition-colors">
                              {project.name}
                            </InteractiveLink>
                          </div>
                        )}

                        {/* Row 3: progress bar */}
                        <div className="mb-2.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                              {checkTotal > 0 ? `Checklist ${checkDone}/${checkTotal}` : 'Progress'}
                            </span>
                            <span className={`text-[9px] font-black font-mono ${progress === 100 ? 'text-emerald-600' : 'text-indigo-500'}`}>{progress}%</span>
                          </div>
                          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${progress}%` }} />
                          </div>
                        </div>

                        {/* Row 4: users (creator, assignee, owner) + due date */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-3">
                            {/* Creator */}
                            {creator && (
                              <div className="flex items-center gap-1" title={`Created by ${creator.name}`}>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">By</span>
                                <InteractiveLink type="user" id={creator.id} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                  <img src={creator.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=random&size=20`} alt={creator.name} className="h-4 w-4 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                  <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400 max-w-[60px] truncate">{creator.name.split(' ')[0]}</span>
                                </InteractiveLink>
                              </div>
                            )}

                            {/* Assignee */}
                            {assignee && (
                              <div className="flex items-center gap-1" title={`Assigned to ${assignee.name}`}>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">To</span>
                                <InteractiveLink type="user" id={assignee.id} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                  <img src={assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=random&size=20`} alt={assignee.name} className="h-4 w-4 rounded-full object-cover border border-indigo-200 dark:border-indigo-800" />
                                  <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 max-w-[60px] truncate">{assignee.name.split(' ')[0]}</span>
                                </InteractiveLink>
                              </div>
                            )}

                            {/* Project owner (only if different from creator & assignee) */}
                            {owner && owner.id !== assignee?.id && owner.id !== creator?.id && (
                              <div className="flex items-center gap-1" title={`Project owner: ${owner.name}`}>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Own</span>
                                <InteractiveLink type="user" id={owner.id} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                                  <img src={owner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(owner.name)}&background=random&size=20`} alt={owner.name} className="h-4 w-4 rounded-full object-cover border border-amber-200 dark:border-amber-800" />
                                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 max-w-[60px] truncate">{owner.name.split(' ')[0]}</span>
                                </InteractiveLink>
                              </div>
                            )}
                          </div>

                          {/* Due date */}
                          <span className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${
                            isOverdue ? 'text-red-500' :
                            daysLeft === 0 ? 'text-amber-500' :
                            daysLeft <= 2 ? 'text-amber-400' :
                            'text-gray-400'
                          }`}>
                            <Calendar size={9} className="opacity-60" />
                            {isOverdue
                              ? `${Math.abs(daysLeft)}d overdue`
                              : daysLeft === 0 ? 'Due today'
                              : formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>{/* end Recent Tasks col */}

          {/* Blocked Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert size={16} className="text-red-500" />
                <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">
                  Blocked Tasks
                </h3>
                {blockedTasks.length > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-red-500 text-white text-[10px] font-black rounded-full">
                    {blockedTasks.length}
                  </span>
                )}
              </div>
              <Link to={isAdmin ? '/tasks?blocked=1' : '/tasks?mine=1&blocked=1'} className="text-xs text-red-600 font-semibold hover:underline">
                View all →
              </Link>
            </div>
            <Card className="border-red-100 dark:border-red-900/30">
              <CardContent className="p-4 space-y-3">
                {blockedTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No blocked tasks</p>
                ) : (
                  blockedTasks.map(task => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const project = projects.find(p => p.id === task.projectId);
                    const activeBlock = task.blockEntries?.find(b => b.isActive && b.blockedById === task.assigneeId);
                    return (
                      <div key={task.id} className="flex items-start gap-3 p-3 bg-red-50/60 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                        <div className="mt-0.5 shrink-0">
                          <ShieldAlert size={14} className="text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <InteractiveLink type="task" id={task.id} className="text-[13px] font-bold text-gray-900 dark:text-gray-100 hover:text-red-600 transition-colors leading-tight font-display truncate">
                              {task.title}
                            </InteractiveLink>
                            {project && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 shrink-0">
                                {project.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <UserCheck size={10} className="text-gray-400 shrink-0" />
                            {assignee ? (
                              <InteractiveLink type="user" id={assignee.id} className="text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 flex items-center gap-1">
                                <img src={assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=random&size=20`} alt="" className="h-4 w-4 rounded-full object-cover" />
                                {assignee.name}
                              </InteractiveLink>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Unassigned</span>
                            )}
                          </div>
                          {activeBlock && (
                            <p className="mt-1.5 text-[11px] text-red-700 dark:text-red-300 italic leading-snug">
                              "{activeBlock.reason}"
                              <span className="ml-1.5 text-[9px] not-italic font-mono text-red-400">{formatDateTime(activeBlock.blockedAt)}</span>
                            </p>
                          )}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => setReassigningTaskId(task.id)}
                            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest border border-amber-300 dark:border-amber-700 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <UserCheck size={11} /> Reassign
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>{/* end Recent | Blocked row */}

        {/* Reassign modal (for blocked tasks) */}
        {reassigningTask && (
          <ReassignModal
            isOpen={true}
            onClose={() => setReassigningTaskId(null)}
            title="Reassign Blocked Task"
            currentAssigneeId={reassigningTask.assigneeId}
            availableUsers={users.map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))}
            reasonTags={BLOCK_REASON_TAGS}
            onConfirm={async (newUserId: number, reasonTag: ReasonTag) => {
              try {
                await reassignTask(reassigningTask.id, newUserId, reasonTag);
                showSuccess('Task reassigned successfully');
              } catch {
                showError('Failed to reassign task');
              }
              setReassigningTaskId(null);
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}
