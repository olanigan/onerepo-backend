
import React, { useState, useEffect } from 'react';
import { TaskStatus, TaskInput } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskInput) => void;
  initialStatus?: TaskStatus;
}

const statusOptions: { value: TaskStatus; label: string; description: string }[] = [
  { value: 'inbox', label: 'Inbox', description: 'Needs review' },
  { value: 'next', label: 'Next', description: 'Ready to do' },
  { value: 'waiting', label: 'Waiting', description: 'On hold' },
  { value: 'done', label: 'Done', description: 'Completed' }
];

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, initialStatus = 'inbox' }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setStatus(initialStatus);
    }
  }, [isOpen, initialStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">New Task</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Task Title</label>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-600 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`px-4 py-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                      status === opt.value
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className={`text-xs mt-0.5 ${status === opt.value ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (title.trim()) {
                  onSave({ title, description, status });
                  onClose();
                }
              }}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
