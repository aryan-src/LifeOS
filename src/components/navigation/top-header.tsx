'use client';

import React from 'react';

export function TopHeader() {
  return (
    <header className="fixed top-0 left-64 right-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-14 w-full px-space-lg flex items-center justify-between">
        <div className="flex items-center gap-space-sm text-outline font-label-sm text-label-sm">
          <span className="hover:text-on-surface cursor-pointer">LifeOS</span>
          <span>/</span>
          <span className="text-on-surface font-medium">Workspace</span>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-space-sm text-[16px] text-outline pointer-events-none">search</span>
            <input
              className="bg-surface-container-low pl-8 pr-space-sm py-1 rounded font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors w-44 md:w-56"
              placeholder="Search anything..."
              type="text"
            />
          </div>
          <button
            className="text-on-surface-variant hover:text-on-surface flex items-center justify-center p-1 rounded hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
