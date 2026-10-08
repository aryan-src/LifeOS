'use client';

import React from 'react';
import { GlowCard } from '@/components/ui/spotlight-card';

export function Default() {
  return (
    <div className="w-screen h-screen flex flex-row items-center justify-center gap-10 custom-cursor">
      <GlowCard glowColor="blue" />
      <GlowCard glowColor="purple" />
      <GlowCard glowColor="green" />
    </div>
  );
}

export { Default as SpotlightCardDemo };
