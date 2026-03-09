
import React from 'react';
import { Task, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onMove: (id: string, newStatus: TaskStatus) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<TaskStatus, string> = {
  inbox: 'Inbox',
  next: 'Next',
  waiting: 'Waiting',
  done: 'Done'
};

const statusColors: Record<TaskStatus, string> = {
  inbox: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  next: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
  waiting: 'bg-amber-100 text-amber-600 hover:bg-amber-200',
  done: 'bg-green-100 text-green-600 hover:bg-green-200'
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onMove, onDelete }) => {
  return (
    <div className={`p-4 rounded-xl border transition-all duration-200 group relative ${
      task.status === 'done' 
        ? 'bg-gray-50 border-gray-100 opacity-60' 
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200'
    }`}>
      <div className="flex items-start gap-3">
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            task.status === 'done' ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
          }`}
        >
          {task.status === 'done' && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
              {statusLabels[task.status]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.status !== 'inbox' && (
            <button 
              onClick={() => onMove(task.id, 'inbox')}
              title="Move to Inbox"
              className="p-1 hover:bg-slate-100 text-slate-600 rounded"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </button>
          )}
          {task.status !== 'next' && (
            <button 
              onClick={() => onMove(task.id, 'next')}
              title="Move to Next"
              className="p-1 hover:bg-indigo-50 text-indigo-600 rounded"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
          {task.status !== 'waiting' && (
            <button 
              onClick={() => onMove(task.id, 'waiting')}
              title="Move to Waiting"
              className="p-1 hover:bg-amber-50 text-amber-600 rounded"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          {task.status !== 'done' && (
            <button 
              onClick={() => onMove(task.id, 'done')}
              title="Mark Done"
              className="p-1 hover:bg-green-50 text-green-600 rounded"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1 hover:bg-red-50 text-red-600 rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
