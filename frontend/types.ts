export type TaskStatus = 'inbox' | 'next' | 'waiting' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  projectId: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ViewType = 'TODAY' | 'BACKLOG' | 'WAITING' | 'DONE';

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  projectId?: string | null;
}
