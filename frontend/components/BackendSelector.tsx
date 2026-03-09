"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Backend, BACKENDS, getCurrentBackend, setCurrentBackend } from '../lib/api';

interface BackendSelectorProps {
  onChange?: (backend: Backend) => void;
}

export function BackendSelector({ onChange }: BackendSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<Backend>('hono-d1');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(getCurrentBackend());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (backend: Backend) => {
    setCurrentBackend(backend);
    setCurrent(backend);
    setIsOpen(false);
    onChange?.(backend);
  };

  const currentBackend = BACKENDS[current];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm"
      >
        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        <span className="font-medium text-slate-700">{currentBackend.name}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Select Backend
          </div>
          {Object.values(BACKENDS).map((backend) => (
            <button
              key={backend.id}
              onClick={() => handleSelect(backend.id)}
              className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                current === backend.id ? 'bg-indigo-50' : ''
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${current === backend.id ? 'bg-indigo-500' : 'bg-slate-300'}`} />
              <div>
                <div className={`font-medium text-sm ${current === backend.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                  {backend.name}
                </div>
                <div className="text-xs text-slate-400">{backend.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
