"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, TaskInput } from '../types';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { BackendSelector } from '../components/BackendSelector';
import { api, ApiTask } from '../lib/api';

function mapApiTaskToTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    status: apiTask.status,
    projectId: apiTask.project_id,
    completed: apiTask.status === 'done',
    createdAt: apiTask.created_at,
    updatedAt: apiTask.updated_at,
  };
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<TaskStatus>('inbox');

  useEffect(() => {
    setIsClient(true);
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      const apiTasks = await api.tasks.list();
      setTasks(apiTasks.map(mapApiTaskToTask));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const inboxCount = tasks.filter(t => t.status === 'inbox').length;
    if (inboxCount > 0) {
      setNotification(`Attention: You have ${inboxCount} tasks in inbox needing review.`);
    } else {
      setNotification(null);
    }
  }, [tasks]);

  const handleOpenModal = (status: TaskStatus = 'inbox') => {
    setModalStatus(status);
    setIsModalOpen(true);
  };

  const handleCreateTask = async (input: TaskInput) => {
    try {
      const apiTask = await api.tasks.create({
        title: input.title,
        description: input.description,
        status: input.status,
        project_id: input.projectId || undefined,
      });
      setTasks(prev => [mapApiTaskToTask(apiTask), ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newStatus: TaskStatus = task.status === 'done' ? 'next' : 'done';
    
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    ));
    
    try {
      await api.tasks.update(id, { status: newStatus });
    } catch (err) {
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, status: task.status, updatedAt: task.updatedAt } : t
      ));
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const moveTask = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const oldStatus = task.status;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));
    
    try {
      await api.tasks.update(id, { status: newStatus });
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: oldStatus, updatedAt: task.updatedAt } : t));
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    const oldTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));
    
    try {
      await api.tasks.delete(id);
    } catch (err) {
      setTasks(oldTasks);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const completionRate = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [tasks]);

  if (!isClient) return <div className="min-h-screen bg-slate-50" />;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="w-64 glass-panel border-r border-slate-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            FocusFlow
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Views</div>
          <div className="px-4 py-3 text-sm text-slate-600">
            All tasks shown below
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">All Tasks</h2>
            {notification && (
              <div className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full flex items-center gap-2 animate-pulse border border-amber-200">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                {notification}
              </div>
            )}
          </div>
          
<div className="flex items-center gap-3">
            <BackendSelector />
              <div className="text-sm text-slate-500 font-medium">
                {completionRate}% complete
             </div>
             <div className="text-sm text-slate-500 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-4 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {(['inbox', 'next', 'waiting', 'done'] as TaskStatus[]).map((status) => (
                <div key={status} className="flex flex-col h-full bg-slate-100/50 p-6 rounded-3xl border border-dashed border-slate-300">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{status}</h3>
                      <span className="bg-white text-slate-600 px-2 py-0.5 rounded-full text-xs border border-slate-200">
                        {tasks.filter(t => t.status === status).length}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleOpenModal(status)}
                      className="p-1 hover:bg-white rounded-full text-indigo-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {tasks.filter(t => t.status === status).length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <div className="w-12 h-12 bg-white rounded-2xl mx-auto mb-3 flex items-center justify-center border border-slate-100">
                           <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                        <p className="text-xs text-slate-400">No tasks</p>
                      </div>
                    ) : (
                      tasks.filter(t => t.status === status).map(task => (
                        <TaskCard key={task.id} task={task} onToggle={toggleTask} onMove={moveTask} onDelete={deleteTask} />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateTask}
        initialStatus={modalStatus}
      />

      <footer className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50">
        <button onClick={() => handleOpenModal('inbox')} className="p-2 rounded-lg text-slate-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" /></svg>
        </button>
        <div className="text-xs text-slate-400">{tasks.length} tasks</div>
        <div className="text-xs text-slate-400">{completionRate}%</div>
      </footer>
    </div>
  );
}
