'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="foot">
      <Link className="logo" href="#main" aria-label="LifeOS, back to top">
        Life<span>OS</span>
      </Link>
      <a href="mailto:aryan.prajapati.dev@gmail.com">aryan.prajapati.dev@gmail.com</a>
      <span>© 2026 LifeOS</span>
    </footer>
  );
}
