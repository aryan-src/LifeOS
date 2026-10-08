'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { MinimalCarouselProps } from './minimal-carousel';
import { DashboardCarouselSkeleton } from './dashboard-carousel-skeleton';

export const MinimalCarousel = dynamic(
  () => import('./minimal-carousel').then((mod) => mod.MinimalCarousel),
  {
    ssr: false,
    loading: () => <DashboardCarouselSkeleton />,
  }
);

export function DashboardCarouselClient(props: MinimalCarouselProps) {
  return <MinimalCarousel {...props} />;
}
