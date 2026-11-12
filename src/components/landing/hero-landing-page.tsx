'use client';

import React, { useEffect } from 'react';
import { useUIStore } from '@/lib/store/use-ui-store';
import { Navbar } from './navbar';
import { Hero } from './hero';
import { ProblemSolution } from './problem-solution';
import { TaglineReveal } from './tagline-reveal';
import { Benefits } from './benefits';
import { HowItWorks } from './how-it-works';
import { FAQ } from './faq';
import { FinalCTA } from './final-cta';
import { Footer } from './footer';
import { FAQ_JSON_LD } from './demo-data';
import './landing.css';

export function HeroLandingPage() {
  const setLandingPage = useUIStore((s) => s.setLandingPage);

  // Sync landing page state with global shell and enforce isolated light editorial theme
  useEffect(() => {
    setLandingPage(true);
    const prevTheme = document.documentElement.getAttribute('data-theme');
    const hadDark = document.documentElement.classList.contains('dark');

    document.documentElement.setAttribute('data-theme', 'editorial-light');
    document.documentElement.classList.remove('dark');

    return () => {
      setLandingPage(false);
      if (prevTheme) {
        document.documentElement.setAttribute('data-theme', prevTheme);
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      if (hadDark) {
        document.documentElement.classList.add('dark');
      }
    };
  }, [setLandingPage]);

  return (
    <div className="landing lifeos-landing-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />

      <Navbar />

      <main id="main">
        <Hero />
        <ProblemSolution />
        <TaglineReveal />
        <Benefits />
        <HowItWorks />
        <FAQ />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
