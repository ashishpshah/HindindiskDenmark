import { apiRequest } from '../lib/api';

export interface WorkDiaryEntry {
  id: number;
  userId: number;
  date: string;
  description: string;
  category?: string;
  hoursSpent?: number;
  taskId?: number;
  taskTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkDiaryDto {
  date: string;
  description: string;
  category?: string;
  hoursSpent?: number;
  taskId?: number;
}

export interface UpdateWorkDiaryDto {
  description: string;
  category?: string;
  hoursSpent?: number;
  taskId?: number;
}

export const DIARY_CATEGORIES = [
  'Development',
  'Meeting',
  'Review',
  'Testing',
  'Documentation',
  'Other',
];

export const diaryService = {
  async getMyDiary(month?: number, year?: number): Promise<WorkDiaryEntry[]> {
    const p = new URLSearchParams();
    if (month != null) p.set('month', String(month));
    if (year != null) p.set('year', String(year));
    const qs = p.toString();
    return apiRequest<WorkDiaryEntry[]>(`/workdiary${qs ? `?${qs}` : ''}`);
  },

  async add(dto: CreateWorkDiaryDto): Promise<WorkDiaryEntry> {
    return apiRequest<WorkDiaryEntry>('/workdiary', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  async update(id: number, dto: UpdateWorkDiaryDto): Promise<WorkDiaryEntry> {
    return apiRequest<WorkDiaryEntry>(`/workdiary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  },

  async remove(id: number): Promise<void> {
    return apiRequest<void>(`/workdiary/${id}`, { method: 'DELETE' });
  },
};
