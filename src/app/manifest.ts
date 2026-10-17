import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LifeOS — Quiet Personal Dashboard',
    short_name: 'LifeOS',
    description:
      'Minimalist, zero-latency daily personal OS with academic planning, task tracking, finance management, habits, and notes.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff8f5',
    theme_color: '#1e1b18',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
