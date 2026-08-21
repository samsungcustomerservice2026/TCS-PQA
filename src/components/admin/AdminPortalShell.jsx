'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  LayoutDashboard,
  MessageSquare,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Trophy,
} from 'lucide-react';

const ICON_BY_KEY = {
  data: Database,
  display: Monitor,
  survey: ClipboardList,
  feedback: MessageSquare,
  'scora-challenge': Trophy,
  'knowledge-base': BookOpen,
  insights: BarChart3,
  system: Settings,
};

const GROUP_META = [
  {
    id: 'ops',
    label: 'Operations',
    keys: ['data', 'display'],
  },
  {
    id: 'voice',
    label: 'Voice of ASC',
    keys: ['survey', 'feedback'],
  },
  {
    id: 'learn',
    label: 'Learning',
    keys: ['scora-challenge', 'knowledge-base'],
  },
  {
    id: 'control',
    label: 'Control',
    keys: ['insights', 'system'],
  },
];

function buildGroupedTabs(tabs) {
  const byKey = Object.fromEntries((tabs || []).map((t) => [t.key, t]));
  return GROUP_META.map((g) => ({
    ...g,
    items: g.keys.map((k) => byKey[k]).filter(Boolean),
  })).filter((g) => g.items.length > 0);
}

/**
 * Command Center shell: left rail + 3D backdrop + animated panel swap.
 */
export default function AdminPortalShell({
  tabs = [],
  activeTab,
  onTabChange,
  topBar,
  header,
  statusBar,
  children,
}) {
  const reduceMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = useMemo(() => buildGroupedTabs(tabs), [tabs]);

  const railWidth = collapsed ? 'w-[4.5rem]' : 'w-[15.5rem]';

  return (
    <div className="relative admin-portal-shell min-h-[70vh]">
      <div className="relative z-[1] space-y-5">
        {topBar ? topBar : null}

        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-stretch">
          {/* Mobile tab trigger */}
          <div className="lg:hidden flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-200"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
              {mobileOpen ? 'Hide menu' : 'Modules'}
              {mobileOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 truncate">
              {tabs.find((t) => t.key === activeTab)?.label || '—'}
            </span>
          </div>

          <motion.aside
            layout
            className={`
              ${mobileOpen ? 'flex' : 'hidden'} lg:flex
              flex-col shrink-0 ${railWidth}
              rounded-[1.75rem] border border-white/10 bg-zinc-950/75 backdrop-blur-xl
              shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden
            `}
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-white/5">
              {!collapsed ? (
                <div className="min-w-0 pl-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.28em] text-blue-400">SCORA</p>
                  <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">Command</p>
                </div>
              ) : (
                <Activity className="w-4 h-4 text-blue-400 mx-auto" />
              )}
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="hidden lg:inline-flex p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2.5 space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  {!collapsed ? (
                    <p className="px-2.5 text-[8px] font-black uppercase tracking-[0.22em] text-zinc-600">
                      {group.label}
                    </p>
                  ) : (
                    <div className="h-px bg-white/5 mx-2 my-1" />
                  )}
                  {group.items.map((tab) => {
                    const Icon = ICON_BY_KEY[tab.key] || LayoutDashboard;
                    const active = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          onTabChange?.(tab.key);
                          setMobileOpen(false);
                        }}
                        title={tab.label}
                        className={`
                          relative w-full flex items-center gap-3 rounded-xl text-left transition-colors
                          ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                          ${
                            active
                              ? `text-white ${reduceMotion ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.35)]' : ''}`
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                          }
                        `}
                      >
                        {active && !reduceMotion ? (
                          <motion.span
                            layoutId="admin-rail-active"
                            className="absolute inset-0 rounded-xl bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.35)] z-0"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          />
                        ) : null}
                        <Icon className={`w-4 h-4 shrink-0 relative z-[1] ${active ? 'text-white' : 'text-zinc-500'}`} />
                        {!collapsed ? (
                          <span className="relative z-[1] text-[10px] font-black uppercase tracking-widest truncate">
                            {tab.label}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </motion.aside>

          <div className="flex-1 min-w-0 space-y-5">
            {header}
            {statusBar}

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={reduceMotion ? false : { opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="admin-portal-panel"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
