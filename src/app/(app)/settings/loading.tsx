import React from 'react';

export default function SettingsLoading() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      <div className="w-full max-w-7xl mx-auto px-space-md sm:px-space-lg lg:px-margin py-space-xl flex flex-col gap-space-xl">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="h-4 w-48 bg-surface-container-high rounded" />
          <div className="h-8 w-64 bg-surface-container-high rounded-lg" />
          <div className="h-4 w-96 max-w-full bg-surface-container-high rounded" />
        </div>

        {/* Settings Sections Skeletons */}
        <div className="flex flex-col gap-8 w-full max-w-3xl">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 md:p-8 flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
                <div className="w-9 h-9 rounded-xl bg-surface-container-high" />
                <div className="flex flex-col gap-2">
                  <div className="h-5 w-36 bg-surface-container-high rounded" />
                  <div className="h-3 w-64 bg-surface-container-high rounded" />
                </div>
              </div>
              <div className="h-10 bg-surface-container-low rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
