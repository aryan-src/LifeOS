'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useUIStore } from '@/lib/store/use-ui-store';
import './landing.css';

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is LifeOS?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A single dashboard that tracks your pocket money, daily and weekly tasks, habits, projects and ideas.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, LifeOS is free to use right now. If that changes, you’ll hear about it before it does.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a card to sign up?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. You only need an account to start.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my data private?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your budget, tasks, habits, projects and notes live in your own account, and other users can’t see them.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work on my phone?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. LifeOS runs in your phone’s browser, so there’s nothing to install.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I delete my data?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can delete any habit, note or project whenever you like.',
      },
    },
  ],
};

const TAGLINE_WORDS = [
  'Plan', 'the', 'day.', 'Guard', 'the', 'cash.', 'Keep', 'the', 'streak.',
  'Catch', 'the', 'idea.', 'One', 'calm', 'screen.'
];

export function HeroLandingPage() {
  const setLandingPage = useUIStore((s) => s.setLandingPage);
  const rootRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  // Sync landing page state with global shell (hides the bottom dock)
  useEffect(() => {
    setLandingPage(true);
    return () => setLandingPage(false);
  }, [setLandingPage]);

  // Scroll reveal observer (.rv -> .rv.in)
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = rootRef.current?.querySelectorAll('.rv');
    elements?.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  // Tagline word-by-word reveal on scroll
  useEffect(() => {
    const el = taglineRef.current;
    if (!el) return;

    const spans = el.querySelectorAll<HTMLSpanElement>('.w');
    if (spans.length === 0) return;

    el.classList.add('tg-ready');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updateTagline = () => {
      const rect = el.getBoundingClientRect();
      const progress = reduceMotion
        ? 1
        : Math.min(
            1,
            Math.max(0, (window.innerHeight * 0.85 - rect.top) / (window.innerHeight * 0.5))
          );
      const activeCount = Math.round(progress * spans.length);
      spans.forEach((span, idx) => {
        span.classList.toggle('on', idx < activeCount);
      });
    };

    window.addEventListener('scroll', updateTagline, { passive: true });
    window.addEventListener('resize', updateTagline);
    updateTagline();

    return () => {
      window.removeEventListener('scroll', updateTagline);
      window.removeEventListener('resize', updateTagline);
    };
  }, []);

  return (
    <div ref={rootRef} className="lifeos-landing-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />

      <a className="skip" href="#main">
        Skip to content
      </a>

      {/* Floating Pill Nav */}
      <nav className="nav" aria-label="Main">
        <Link className="logo" href="#main" aria-label="LifeOS home">
          Life<span>OS</span>
        </Link>
        <Link className="btn btn-sm" href="/login">
          Start free
        </Link>
      </nav>

      <main id="main">
        {/* Hero Section */}
        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title" className="r" style={{ '--i': 0 } as React.CSSProperties}>
            Your whole student life, tracked on one calm screen
          </h1>
          <p className="sub r" style={{ '--i': 1 } as React.CSSProperties}>
            LifeOS keeps your pocket money, daily tasks, habits, projects and ideas together, so you
            can see where your day and your money stand at a glance.
          </p>
          <div className="cta-row r" style={{ '--i': 2 } as React.CSSProperties}>
            <Link className="btn btn-lg" href="/login">
              Start free
            </Link>
          </div>

          {/* Sample Dashboard Mock */}
          <div
            className="frame r"
            style={{ '--i': 4 } as React.CSSProperties}
            role="img"
            aria-label="Sample LifeOS dashboard showing a monthly budget, today’s focus timer, habit streak, active projects and a saved idea"
          >
            <div className="board" aria-hidden="true">
              {/* Pocket Money Card */}
              <div className="card s2">
                <span className="lab">Pocket money · Nov</span>
                <span className="big">₹1,212</span>
                <div className="bar">
                  <i style={{ width: '76%' }}></i>
                </div>
                <span className="small">left of ₹5,000, about ₹60 a day</span>
              </div>

              {/* 7 Days Spending Chart Card */}
              <div className="card s4">
                <span className="lab">Last 7 days · spending</span>
                <div className="row">
                  <span className="big">₹718</span>
                  <span className="small">about ₹103 a day</span>
                </div>
                <div className="chart">
                  <i style={{ height: '65%' }}></i>
                  <i style={{ height: '21%' }}></i>
                  <i style={{ height: '0%' }}></i>
                  <i style={{ height: '78%' }}></i>
                  <i style={{ height: '100%' }}></i>
                  <i style={{ height: '40%' }}></i>
                  <i className="today" style={{ height: '27%' }}></i>
                </div>
                <div className="days">
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                </div>
              </div>

              {/* Active Projects Card */}
              <div className="card s4">
                <span className="lab">Active projects</span>
                <div className="row">
                  <span className="small">Portfolio site</span>
                  <span className="chip">Active</span>
                </div>
                <div className="row">
                  <span className="small">Lab report</span>
                  <span className="chip mute">Backlog</span>
                </div>
                <div className="row">
                  <span className="small">Study group notes</span>
                  <span className="chip warm">Paused</span>
                </div>
              </div>

              {/* Today's Focus Card */}
              <div className="card s2">
                <span className="lab">Today’s focus</span>
                <div className="row">
                  <span className="timer">25:00</span>
                  <span className="chip">2 of 4 pomodoros</span>
                </div>
                <div className="bar">
                  <i style={{ width: '60%' }}></i>
                </div>
                <span className="small">3 of 5 tasks done</span>
              </div>

              {/* Habits Card */}
              <div className="card s2">
                <span className="lab">Habits</span>
                <div className="row">
                  <span className="small">Practice coding</span>
                  <span className="chip warm">4 day streak</span>
                </div>
                <div className="dots">
                  <i className="on"></i>
                  <i className="on"></i>
                  <i></i>
                  <i className="on"></i>
                  <i className="on"></i>
                  <i className="on"></i>
                  <i></i>
                </div>
                <span className="small">5 of 7 days this week</span>
              </div>

              {/* Recent Ideas Card */}
              <div className="card s4">
                <span className="lab">Recent ideas</span>
                <span className="small">Try pre and post increment questions before Friday.</span>
                <span className="chip mute">Promote to project</span>
              </div>
            </div>
          </div>
        </section>

        {/* Problem to Solution Section */}
        <section className="sec" aria-labelledby="problem-title">
          <div className="sec-in">
            <span className="lab rv">The problem</span>
            <h2 id="problem-title" className="rv" style={{ '--i': 1, marginTop: '12px' } as React.CSSProperties}>
              Money in one app, tasks in another, ideas in a third
            </h2>
            <p className="lead rv" style={{ '--i': 2 } as React.CSSProperties}>
              Most students end up juggling a budget sheet, a to do list, a habit app, a notes app and
              a project board. Each one works fine alone. Together they mean five places to check
              before you know how your day is going.
            </p>
            <div className="cmp">
              <div className="pane rv" style={{ '--i': 3 } as React.CSSProperties}>
                <span className="lab">Before</span>
                <div className="tags scatter">
                  <span className="chip">Budget sheet</span>
                  <span className="chip">To do app</span>
                  <span className="chip">Habit app</span>
                  <span className="chip">Notes app</span>
                  <span className="chip">Project board</span>
                </div>
                <p>Five tabs, five logins, and no single view of where you stand.</p>
              </div>
              <div className="pane after rv" style={{ '--i': 4 } as React.CSSProperties}>
                <span className="lab">With LifeOS</span>
                <div className="tags">
                  <span className="chip">Pocket money</span>
                  <span className="chip">Tasks</span>
                  <span className="chip">Habits</span>
                  <span className="chip">Projects</span>
                  <span className="chip">Ideas</span>
                </div>
                <p>One dashboard shows all five side by side, and each page goes deeper when you need it.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tagline Reveal Section */}
        <section className="tag-sec" aria-label="What LifeOS does">
          <p ref={taglineRef} className="tg">
            {TAGLINE_WORDS.map((word, idx) => (
              <React.Fragment key={idx}>
                <span className="w">{word}</span>
                {idx < TAGLINE_WORDS.length - 1 ? ' ' : ''}
              </React.Fragment>
            ))}
          </p>
        </section>

        {/* What You Get / Benefits Section */}
        <section className="sec" aria-labelledby="ben-title">
          <div className="sec-in">
            <span className="lab rv">What you get</span>
            <h2 id="ben-title" className="rv" style={{ '--i': 1, marginTop: '12px' } as React.CSSProperties}>
              Five trackers, one dashboard
            </h2>
            <div className="ben-grid">
              <article className="bcard s4 rv" style={{ '--i': 2 } as React.CSSProperties}>
                <span className="lab">Pocket money</span>
                <h3>Know what you can spend today</h3>
                <p>
                  Set a monthly budget and see a safe daily amount, a 7 day spending chart and a
                  breakdown by category.
                </p>
              </article>
              <article className="bcard s2 rv" style={{ '--i': 3 } as React.CSSProperties}>
                <span className="lab">Tasks</span>
                <h3>Finish the day’s work</h3>
                <p>Daily and weekly tasks, with a pomodoro timer and sprints built in.</p>
              </article>
              <article className="bcard s2 rv" style={{ '--i': 4 } as React.CSSProperties}>
                <span className="lab">Habits</span>
                <h3>Keep your streaks alive</h3>
                <p>Tick a habit each day and watch your weekly pattern build.</p>
              </article>
              <article className="bcard s4 rv" style={{ '--i': 5 } as React.CSSProperties}>
                <span className="lab">Projects</span>
                <h3>See where every project stands</h3>
                <p>Backlog, active, paused or completed, shown as a board, a list or a timeline.</p>
              </article>
              <article className="bcard full rv" style={{ '--i': 6 } as React.CSSProperties}>
                <span className="lab">Notes</span>
                <h3>Never lose an idea</h3>
                <p>Scribble it down the moment it arrives, then promote it to a project in one click.</p>
              </article>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="sec" aria-labelledby="how-title">
          <div className="sec-in">
            <span className="lab rv">How it works</span>
            <h2 id="how-title" className="rv" style={{ '--i': 1, marginTop: '12px' } as React.CSSProperties}>
              Set up once, then open it each morning
            </h2>
            <ol className="steps">
              <li className="step rv" style={{ '--i': 2 } as React.CSSProperties}>
                <span className="num" aria-hidden="true">
                  1
                </span>
                <h3>Create your free account</h3>
                <p>Sign up for free and your dashboard is ready to fill.</p>
              </li>
              <li className="step rv" style={{ '--i': 3 } as React.CSSProperties}>
                <span className="num" aria-hidden="true">
                  2
                </span>
                <h3>Add your budget, tasks and habits</h3>
                <p>Enter your monthly pocket money, today’s tasks and the habits you want to keep.</p>
              </li>
              <li className="step rv" style={{ '--i': 4 } as React.CSSProperties}>
                <span className="num" aria-hidden="true">
                  3
                </span>
                <h3>Check in at a glance</h3>
                <p>See your safe daily spend, today’s focus and your streaks on one screen.</p>
              </li>
            </ol>
            <div className="after-steps rv" style={{ '--i': 5 } as React.CSSProperties}>
              <Link className="btn btn-lg" href="/login">
                Start free
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="sec" aria-labelledby="faq-title">
          <div className="sec-in">
            <span className="lab rv">FAQ</span>
            <h2 id="faq-title" className="rv" style={{ '--i': 1, marginTop: '12px' } as React.CSSProperties}>
              Questions, answered
            </h2>
            <div className="faq rv" style={{ '--i': 2 } as React.CSSProperties}>
              <details>
                <summary>What is LifeOS?</summary>
                <p>A single dashboard that tracks your pocket money, daily and weekly tasks, habits, projects and ideas.</p>
              </details>
              <details>
                <summary>Is it really free?</summary>
                <p>Yes, LifeOS is free to use right now. If that changes, you’ll hear about it before it does.</p>
              </details>
              <details>
                <summary>Do I need a card to sign up?</summary>
                <p>No. You only need an account to start.</p>
              </details>
              <details>
                <summary>Is my data private?</summary>
                <p>Your budget, tasks, habits, projects and notes live in your own account, and other users can’t see them.</p>
              </details>
              <details>
                <summary>Does it work on my phone?</summary>
                <p>Yes. LifeOS runs in your phone’s browser, so there’s nothing to install.</p>
              </details>
              <details>
                <summary>Can I delete my data?</summary>
                <p>Yes. You can delete any habit, note or project whenever you like.</p>
              </details>
              <details>
                <summary>How do I report a bug or suggest a feature?</summary>
                <p>
                  Email <a href="mailto:aryan.prajapati.dev@gmail.com">aryan.prajapati.dev@gmail.com</a>. I read every message.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="sec" id="signup" aria-labelledby="final-title">
          <div className="sec-in">
            <div className="final rv">
              <h2 id="final-title">Put your whole day on one screen</h2>
              <p>Free for now. Your dashboard is ready as soon as you sign up.</p>
              <Link className="btn btn-lg" href="/login">
                Start free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="foot">
        <Link className="logo" href="#main" aria-label="LifeOS, back to top">
          Life<span>OS</span>
        </Link>
        <a href="mailto:aryan.prajapati.dev@gmail.com">aryan.prajapati.dev@gmail.com</a>
        <span>© 2026 LifeOS</span>
      </footer>
    </div>
  );
}
