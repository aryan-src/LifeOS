import React from 'react';
import type { Metadata } from 'next';
import { getUserProfile } from '@/lib/actions/profile';
import { BentoSettings } from '@/components/settings/bento-settings';
import {
  WorkspaceAtmosphereSelector,
  WORKSPACE_THEMES,
} from '@/components/settings/workspace-atmosphere-selector';

export const metadata: Metadata = {
  title: 'Settings & Personalization — LifeOS',
  description:
    'Calibrate your student identity, daily liquidity constraints, aesthetic atmosphere, and portable data vault.',
};

export const dynamic = 'force-dynamic';

/**
 * Settings & Personalization Dashboard
 *
 * Exclusively houses the Workspace Atmosphere theme selector:
 * - Spatial Glassmorphism (spatial-glass)
 * - Risograph Editorial (risograph)
 * - Nordic Ceramic & Linen (nordic)
 * - TUI / Command-Line Terminal (tui)
 * - Tactile Functionalism (tactile)
 */
export default async function SettingsPage() {
  const profile = await getUserProfile();

  return (
    <div className="flex flex-col w-full">
      <BentoSettings initialProfile={profile} />
    </div>
  );
}
