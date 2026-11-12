import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { HeroLandingPage } from '@/components/landing/hero-landing-page';
import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { ProblemSolution } from '@/components/landing/problem-solution';
import { TaglineReveal } from '@/components/landing/tagline-reveal';
import { Benefits } from '@/components/landing/benefits';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FAQ } from '@/components/landing/faq';
import { FinalCTA } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';
import { FAQ_JSON_LD } from '@/components/landing/demo-data';

describe('LifeOS Editorial Landing Page', () => {
  it('renders full landing page structure with hero, mock frame, and ctas', () => {
    const html = renderToString(<HeroLandingPage />);

    // Brand and Navigation
    expect(html).toContain('Life<span>OS</span>');
    expect(html).toContain('Start free');
    expect(html).toContain('Skip to content');

    // Hero Section
    expect(html).toContain('Your whole student life, tracked on one calm screen');
    expect(html).toContain(
      'LifeOS keeps your pocket money, daily tasks, habits, projects and ideas together'
    );

    // Sample Dashboard Mock Cards
    expect(html).toContain('Pocket money · Nov');
    expect(html).toContain('₹1,212');
    expect(html).toContain('Last 7 days · spending');
    expect(html).toContain('₹718');
    expect(html).toContain('Active projects');
    expect(html).toContain('Portfolio site');
    expect(html).toContain('Lab report');
    expect(html).toContain('Study group notes');
    expect(html).toContain('Today’s focus');
    expect(html).toContain('25:00');
    expect(html).toContain('Habits');
    expect(html).toContain('Practice coding');
    expect(html).toContain('Recent ideas');
    expect(html).toContain('Try pre and post increment questions before Friday.');

    // Problem to Solution Section
    expect(html).toContain('The problem');
    expect(html).toContain('Money in one app, tasks in another, ideas in a third');
    expect(html).toContain('Five tabs, five logins, and no single view of where you stand.');
    expect(html).toContain('With LifeOS');

    // Tagline Section
    expect(html).toContain('Plan');
    expect(html).toContain('Guard');
    expect(html).toContain('screen.');

    // Trackers / Benefits Section
    expect(html).toContain('Five trackers, one dashboard');
    expect(html).toContain('Know what you can spend today');
    expect(html).toContain('Finish the day’s work');
    expect(html).toContain('Keep your streaks alive');
    expect(html).toContain('See where every project stands');
    expect(html).toContain('Never lose an idea');

    // How It Works Steps
    expect(html).toContain('Set up once, then open it each morning');
    expect(html).toContain('Create your free account');
    expect(html).toContain('Add your budget, tasks and habits');
    expect(html).toContain('Check in at a glance');

    // FAQ Section
    expect(html).toContain('Questions, answered');
    expect(html).toContain('What is LifeOS?');
    expect(html).toContain('Is it really free?');
    expect(html).toContain('Do I need a card to sign up?');
    expect(html).toContain('Is my data private?');
    expect(html).toContain('Does it work on my phone?');
    expect(html).toContain('Can I delete my data?');
    expect(html).toContain('aryan.prajapati.dev@gmail.com');

    // Final CTA & Footer
    expect(html).toContain('Put your whole day on one screen');
    expect(html).toContain('© 2026 LifeOS');

    // Structured Data JSON-LD
    expect(html).toContain('application/ld+json');
    expect(html).toContain('FAQPage');
  });

  it('all Start free links point to /login relative route', () => {
    const html = renderToString(<HeroLandingPage />);
    const startFreeMatches = [...html.matchAll(/href="([^"]+)"[^>]*>Start free/g)];

    expect(startFreeMatches.length).toBeGreaterThanOrEqual(3);
    startFreeMatches.forEach((match) => {
      expect(match[1]).toBe('/login');
    });
  });

  it('footer contains mailto link and 2026 LifeOS copyright', () => {
    const html = renderToString(<Footer />);
    expect(html).toContain('href="mailto:aryan.prajapati.dev@gmail.com"');
    expect(html).toContain('© 2026 LifeOS');
  });

  it('JSON-LD schema matches FAQ schema.org specification', () => {
    expect(FAQ_JSON_LD['@context']).toBe('https://schema.org');
    expect(FAQ_JSON_LD['@type']).toBe('FAQPage');
    expect(FAQ_JSON_LD.mainEntity.length).toBe(7);
    expect(FAQ_JSON_LD.mainEntity[0].name).toBe('What is LifeOS?');
  });

  it('individual modular components render properly', () => {
    expect(renderToString(<Navbar />)).toContain('Skip to content');
    expect(renderToString(<Hero />)).toContain('Your whole student life');
    expect(renderToString(<DashboardPreview />)).toContain('₹1,212');
    expect(renderToString(<ProblemSolution />)).toContain('Money in one app');
    expect(renderToString(<TaglineReveal />)).toContain('Plan');
    expect(renderToString(<Benefits />)).toContain('Five trackers');
    expect(renderToString(<HowItWorks />)).toContain('Set up once');
    expect(renderToString(<FAQ />)).toContain('Questions, answered');
    expect(renderToString(<FinalCTA />)).toContain('Put your whole day');
    expect(renderToString(<Footer />)).toContain('© 2026 LifeOS');
  });

  it('renders with the isolated .landing wrapper without dark mode classes', () => {
    const html = renderToString(<HeroLandingPage />);
    expect(html).toContain('class="landing');
    // Ensure no dark: Tailwind class variants are rendered inside the landing page
    expect(html).not.toMatch(/\bdark:[a-zA-Z0-9_-]+/);
  });
});
