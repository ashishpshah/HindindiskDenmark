import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Project, Task, User, Activity, Notification, Status } from '../types';
import { useAuth } from './AuthContext';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import { userService } from '../services/user.service';
import { activityService } from '../services/activity.service';
import { showError } from '../lib/toast';

interface DataContextType {
  projects: Project[];
  tasks: Task[];
  users: User[];
  assignableUsers: User[];
  activities: Activity[];
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  activeAlert: Notification | null;
  dismissAlert: () => void;
  addProject: (project: Project) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  reassignProject: (projectId: number, newOwnerId: number, reasonTag: string) => Promise<void>;
  updateProjectMembers: (projectId: number, userIds: number[]) => Promise<void>;
  removeMemberFromProject: (projectId: number, userId: number) => Promise<void>;
  addTask: (task: Task) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  addTaskComment: (taskId: number, comment: { text: string }) => Promise<void>;
  reassignTask: (taskId: number, newAssigneeId: number | null, reasonTag: string) => Promise<void>;
  addChecklistItem: (taskId: number, title: string, orderIndex: number) => Promise<void>;
  toggleChecklistItem: (taskId: number, itemId: number, isCompleted: boolean) => Promise<void>;
  updateChecklistItem: (taskId: number, itemId: number, title: string, orderIndex: number) => Promise<void>;
  deleteChecklistItem: (taskId: number, itemId: number) => Promise<void>;
  markAllChecklistComplete: (taskId: number) => Promise<void>;
  setTaskBlock: (taskId: number, isBlocked: boolean, reason: string) => Promise<void>;
  startTask: (taskId: number) => Promise<void>;
  changeTaskStatus: (taskId: number, toStatus: Status, reason?: string, actualHours?: number) => Promise<void>;
  addUser: (user: User, password?: string) => Promise<User>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Promise<void>;
  markNotificationAsRead: (id: number) => void;
  clearAllNotifications: () => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser, isSystemAdmin, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<Notification | null>(null);
  // P5-B: useRef so mutations don't trigger re-renders
  const shownAlerts = useRef<Set<string>>(new Set());
  // P5-G: monotonic counter via useRef — avoids Date.now() collision
  const nextNotifId = useRef(1);

  const playNotificationSound = () => {
    try {
      // P5-D: local file — place ClientApp/public/notification.mp3 to enable sound
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch {
      // Sound unavailable — silently ignore
    }
  };

  const loadAllTasks = async (): Promise<Task[]> => {
    const PAGE_SIZE = 100;
    const first = await taskService.getAll({}, 1, PAGE_SIZE);
    if (first.totalPages <= 1) return first.tasks;
    const rest = await Promise.all(
      Array.from({ length: first.totalPages - 1 }, (_, i) =>
        taskService.getAll({}, i + 2, PAGE_SIZE).then(r => r.tasks)
      )
    );
    return [...first.tasks, ...rest.flat()];
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectsData, allTasks, usersData, assignableData, activitiesData] = await Promise.all([
        projectService.getAll().catch(() => []),
        loadAllTasks().catch(() => []),
        userService.getAll().catch(() => []),
        userService.getAssignable().catch(() => []),
        activityService.getAll().catch(() => []),
      ]);

      setProjects(projectsData || []);
      setTasks(allTasks as Task[]);
      setUsers(usersData || []);
      setAssignableUsers(assignableData || []);
      setActivities(activitiesData || []);
    } catch {
      showError('Some data failed to load. Please refresh to try again.');
      setProjects([]);
      setTasks([]);
      setUsers([]);
      setAssignableUsers([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isSystemAdmin, isAdmin]);

  // Check for upcoming task due dates and generate in-app notifications
  useEffect(() => {
    if (!currentUser || tasks.length === 0) return;

    const checkReminders = () => {
      setNotifications(currentNotifications => {
        const today = new Date();
        const todayStr = today.toDateString();
        const twoDaysFromNow = new Date();
        twoDaysFromNow.setDate(today.getDate() + 2);

        const newNotifications: Notification[] = [];

        tasks.forEach(task => {
          if (task.status === 'completed') return;
          if (task.assigneeId !== currentUser.id && currentUser.role !== 'admin') return;

          const dueDate = new Date(task.dueDate);
          const link = `/tasks?id=${task.id}`;

          if (dueDate > today && dueDate <= twoDaysFromNow) {
            const existing = currentNotifications.find(n =>
              n.userId === currentUser.id &&
              n.type === 'reminder' &&
              n.link === link &&
              !n.message.includes('overdue') &&
              new Date(n.timestamp).toDateString() === todayStr
            );

            if (!existing) {
              const newNotif: Notification = {
                id: nextNotifId.current++,
                userId: currentUser.id,
                title: 'Upcoming Deadline',
                message: `Task "${task.title}" is due soon (${task.dueDate})`,
                type: 'reminder',
                read: false,
                timestamp: new Date().toISOString(),
                link,
              };
              newNotifications.push(newNotif);

              const alertKey = `${task.id}`;
              if (!shownAlerts.current.has(alertKey)) {
                setActiveAlert(newNotif);
                shownAlerts.current.add(alertKey);
                playNotificationSound();
              }
            }
          }

          if (dueDate < today) {
            const existing = currentNotifications.find(n =>
              n.userId === currentUser.id &&
              n.type === 'reminder' &&
              n.message.includes('overdue') &&
              n.link === link &&
              new Date(n.timestamp).toDateString() === todayStr
            );

            if (!existing) {
              const newNotif: Notification = {
                id: nextNotifId.current++,
                userId: currentUser.id,
                title: 'TASK OVERDUE',
                message: `Task "${task.title}" is past its due date (${task.dueDate})`,
                type: 'reminder',
                read: false,
                timestamp: new Date().toISOString(),
                link,
              };
              newNotifications.push(newNotif);

              const alertKey = `${task.id}-overdue`;
              if (!shownAlerts.current.has(alertKey)) {
                setActiveAlert(newNotif);
                shownAlerts.current.add(alertKey);
                playNotificationSound();
              }
            }
          }
        });

        if (newNotifications.length === 0) return currentNotifications;
        return [...newNotifications, ...currentNotifications];
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [tasks, currentUser?.id]);

  const refreshData = fetchData;

  const addProject = async (project: Project): Promise<Project> => {
    try {
      const newProject = await projectService.create(project);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      throw err;
    }
  };

  const updateProject = async (project: Project) => {
    try {
      const updated = await projectService.update(project);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      throw err;
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await projectService.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      setTasks(prev => prev.filter(t => t.projectId !== id));
    } catch (err) {
      throw err;
    }
  };

  const reassignProject = async (projectId: number, newOwnerId: number, reasonTag: string) => {
    try {
      const updated = await projectService.reassign(projectId, newOwnerId, reasonTag);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      throw err;
    }
  };

  const updateProjectMembers = async (projectId: number, userIds: number[]) => {
    try {
      const updated = await projectService.setMembers(projectId, userIds);
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err) {
      throw err;
    }
  };

  const removeMemberFromProject = async (projectId: number, userId: number) => {
    try {
      await projectService.removeMember(projectId, userId);
      setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          memberIds: (p.memberIds || []).filter(id => id !== userId),
          members: (p.members || []).filter(m => m.userId !== userId),
        };
      }));
    } catch (err) {
      throw err;
    }
  };

  const addTask = async (task: Task): Promise<Task> => {
    try {
      const newTask = await taskService.create(task);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      throw err;
    }
  };

  const updateTask = async (task: Task) => {
    try {
      const updated = await taskService.update(task);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (err) {
      throw err;
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await taskService.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const pushNotification = (title: string, message: string, link?: string) => {
    const id = nextNotifId.current++;
    const notif: Notification = {
      id,
      userId: 0,
      title,
      message,
      type: 'update',
      read: false,
      timestamp: new Date().toISOString(),
      link,
    };
    setNotifications(current => [notif, ...current]);
    setActiveAlert(notif);
    playNotificationSound();
  };

  const reassignTask = async (taskId: number, newAssigneeId: number | null, reasonTag: string) => {
    try {
      const updated = await taskService.reassign(taskId, newAssigneeId, reasonTag);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      const newAssignee = users.find(u => u.id === newAssigneeId);
      if (newAssignee && currentUser && newAssignee.id !== currentUser.id) {
        pushNotification(
          'Task Reassigned',
          `Task "${updated.title}" has been reassigned to ${newAssignee.name}. Reason: ${reasonTag}`,
          `/tasks?id=${taskId}`
        );
      }
    } catch (err) {
      throw err;
    }
  };

  const addChecklistItem = async (taskId: number, title: string, orderIndex: number) => {
    try {
      await taskService.addChecklistItem(taskId, title, orderIndex);
      const updatedTask = await taskService.getById(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      const task = tasks.find(t => t.id === taskId);
      if (task && currentUser && task.assigneeId !== currentUser.id) {
        pushNotification('Checklist Item Added', `New item "${title}" added to task "${task.title}"`, `/tasks?id=${taskId}`);
      }
    } catch (err) {
      throw err;
    }
  };

  const toggleChecklistItem = async (taskId: number, itemId: number, isCompleted: boolean) => {
    try {
      await taskService.toggleChecklistItem(taskId, itemId, isCompleted);
      const updatedTask = await taskService.getById(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      throw err;
    }
  };

  const updateChecklistItem = async (taskId: number, itemId: number, title: string, orderIndex: number) => {
    try {
      await taskService.updateChecklistItem(taskId, itemId, title, orderIndex);
      const updatedTask = await taskService.getById(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      const task = tasks.find(t => t.id === taskId);
      if (task && currentUser && task.assigneeId !== currentUser.id) {
        pushNotification('Checklist Updated', `A checklist item was updated on task "${task.title}"`, `/tasks?id=${taskId}`);
      }
    } catch (err) {
      throw err;
    }
  };

  const deleteChecklistItem = async (taskId: number, itemId: number) => {
    try {
      await taskService.deleteChecklistItem(taskId, itemId);
      const updatedTask = await taskService.getById(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      throw err;
    }
  };

  const markAllChecklistComplete = async (taskId: number) => {
    try {
      await taskService.markAllChecklistComplete(taskId);
      const updatedTask = await taskService.getById(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      throw err;
    }
  };

  const setTaskBlock = async (taskId: number, isBlocked: boolean, reason: string) => {
    try {
      const updatedTask = await taskService.setBlock(taskId, isBlocked, reason);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      if (isBlocked) {
        pushNotification(
          'Task Blocked',
          `"${updatedTask.title}" has been blocked. Reason: ${reason}`,
          '/tasks'
        );
      }
    } catch (err) {
      throw err;
    }
  };

  const startTask = async (taskId: number) => {
    try {
      const updatedTask = await taskService.start(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      throw err;
    }
  };

  const changeTaskStatus = async (taskId: number, toStatus: Status, reason?: string, actualHours?: number) => {
    try {
      const updatedTask = await taskService.changeStatus(taskId, toStatus, reason, actualHours);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      throw err;
    }
  };

  const addTaskComment = async (taskId: number, comment: { text: string }) => {
    try {
      const saved = await taskService.addComment(taskId, comment.text);
      const newComment = {
        id: saved.id,
        userId: saved.userId,
        userName: saved.userName,
        avatarUrl: saved.avatarUrl,
        text: saved.text,
        timestamp: saved.timestamp,
      };
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return { ...task, comments: [...(task.comments || []), newComment] };
        }
        return task;
      }));
    } catch (err) {
      throw err;
    }
  };

  const addUser = async (user: User, password?: string): Promise<User> => {
    try {
      const newUser = await userService.create(user, password);
      setUsers(prev => [newUser, ...prev]);
      return newUser;
    } catch (err) {
      throw err;
    }
  };

  const updateUser = async (user: User) => {
    try {
      const updated = await userService.update(user);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (err) {
      throw err;
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await userService.delete(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      throw err;
    }
  };

  const addActivity = async (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    try {
      const newActivity = await activityService.create(activity);
      setActivities(prev => [newActivity, ...prev]);
    } catch (err) {
      throw err;
    }
  };

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissAlert = () => setActiveAlert(null);

  return (
    <DataContext.Provider value={{
      projects, tasks, users, assignableUsers, activities, notifications, loading, error,
      activeAlert, dismissAlert,
      addProject, updateProject, deleteProject, reassignProject, updateProjectMembers, removeMemberFromProject,
      addTask, updateTask, deleteTask, addTaskComment,
      reassignTask, addChecklistItem, toggleChecklistItem, updateChecklistItem, deleteChecklistItem, markAllChecklistComplete, setTaskBlock, startTask, changeTaskStatus,
      addUser, updateUser, deleteUser,
      addActivity, markNotificationAsRead, clearAllNotifications,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
