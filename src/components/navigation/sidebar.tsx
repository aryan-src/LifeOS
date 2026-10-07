'use client';

import React from 'react';
import { MacOSSidebar, DEFAULT_NAV_ITEMS, type MacOSSidebarProps } from './macos-sidebar';

export { MacOSSidebar, DEFAULT_NAV_ITEMS };

export function Sidebar(props: Partial<MacOSSidebarProps>) {
  return <MacOSSidebar {...props} />;
}
