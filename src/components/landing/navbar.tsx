'use client';

import React from 'react';
import Link from 'next/link';

export function Navbar() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <nav className="nav" aria-label="Main">
        <Link className="logo" href="#main" aria-label="LifeOS home">
          Life<span>OS</span>
        </Link>
        <Link className="btn btn-sm" href="/login">
          Start free
        </Link>
      </nav>
    </>
  );
}
