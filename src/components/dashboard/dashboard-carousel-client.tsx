'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { CarouselCard } from './minimal-carousel';
import { DashboardCarouselSkeleton } from './dashboard-carousel-skeleton';

const ClientMinimalCarousel = dynamic(
  () => import('./minimal-carousel').then((mod) => mod.MinimalCarousel),
  {
    ssr: false,
    loading: () => <DashboardCarouselSkeleton />,
  }
);

export function DashboardCarouselClient({ cards }: { cards: CarouselCard[] }) {
  return <ClientMinimalCarousel cards={cards} />;
}
