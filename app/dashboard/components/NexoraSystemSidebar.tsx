'use client';

import * as Collapsible from '@radix-ui/react-collapsible';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  UserCircle2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import {
  NEXORA_HMS_NAV,
  type NavItem,
  type NavSection,
  type NexoraSidebarUser,
} from './navigation.types';

export type NexoraSystemSidebarProps = {
  activeModuleId: string;
  onNavigate: (moduleId: string) => void;
  user?: NexoraSidebarUser;
  onSignOut?: () => void;
  onSettings?: () => void;
  /** Controlled collapsed state (optional) */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
};

const EXPANDED_WIDTH = 'w-[15.5rem]';
const COLLAPSED_WIDTH = 'w-[3.25rem]';

function NavLinkButton({
  item,
  isActive,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onNavigate: (id: string) => void;
}) {
  const Icon = item.icon;

  const button = (
    <button
      type="button"
      role="menuitem"
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onNavigate(item.id)}
      className={`group relative flex w-full items-center gap-2 rounded-md py-1.5 text-left text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${
        collapsed ? 'justify-center px-0' : 'pl-2.5 pr-2'
      } ${
        isActive
          ? 'bg-[#2563EB]/15 text-white before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-[#2563EB]'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <Icon
        className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#60A5FA]' : 'text-slate-500 group-hover:text-slate-300'}`}
        strokeWidth={2}
        aria-hidden
      />
      {!collapsed && <span className="truncate leading-tight">{item.label}</span>}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="z-50 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-800 shadow-md"
          >
            {item.label}
            {item.shortcut && (
              <span className="mt-0.5 block text-[10px] font-normal text-slate-500">{item.shortcut}</span>
            )}
            <Tooltip.Arrow className="fill-white" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return button;
}

function NavSectionBlock({
  section,
  collapsed,
  activeModuleId,
  onNavigate,
  open,
  onOpenChange,
}: {
  section: NavSection;
  collapsed: boolean;
  activeModuleId: string;
  onNavigate: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hasActiveChild = section.items.some((item) => item.id === activeModuleId);

  if (collapsed) {
    return (
      <div className="space-y-0.5 border-b border-slate-700/60 pb-1.5 last:border-0" role="group" aria-label={section.title}>
        {section.items.map((item) => (
          <NavLinkButton
            key={item.id}
            item={item}
            isActive={activeModuleId === item.id}
            collapsed
            onNavigate={onNavigate}
          />
        ))}
      </div>
    );
  }

  return (
    <Collapsible.Root open={open} onOpenChange={onOpenChange}>
      <Collapsible.Trigger
        className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${
          hasActiveChild ? 'text-[#60A5FA]' : ''
        }`}
        aria-expanded={open}
      >
        <span>{section.title}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          aria-hidden
        />
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-0.5 space-y-0.5 overflow-hidden">
        <div role="menu" aria-label={`${section.title} modules`}>
          {section.items.map((item) => (
            <NavLinkButton
              key={item.id}
              item={item}
              isActive={activeModuleId === item.id}
              collapsed={false}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export default function NexoraSystemSidebar({
  activeModuleId,
  onNavigate,
  user = { name: 'Dr. Admin Console', role: 'Admin / Operations', initials: 'AC' },
  onSignOut,
  onSettings,
  collapsed: collapsedProp,
  onCollapsedChange,
}: NexoraSystemSidebarProps) {
  const [collapsedInternal, setCollapsedInternal] = useState(false);
  const collapsed = collapsedProp ?? collapsedInternal;

  const setCollapsed = useCallback(
    (value: boolean) => {
      if (onCollapsedChange) onCollapsedChange(value);
      else setCollapsedInternal(value);
    },
    [onCollapsedChange],
  );

  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NEXORA_HMS_NAV.map((s) => [s.id, s.defaultOpen ?? false])),
  );

  const toggleSection = (id: string, open: boolean) => {
    setSectionOpen((prev) => ({ ...prev, [id]: open }));
  };

  const initials = useMemo(
    () =>
      user.initials ??
      user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [user.initials, user.name],
  );

  return (
    <Tooltip.Provider>
      <aside
        className={`flex h-screen shrink-0 flex-col border-r border-slate-800 bg-[#0F172A] text-slate-300 transition-[width] duration-200 ease-in-out ${collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}`}
        aria-label="Nexora HMS primary navigation"
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-slate-800 bg-[#0F172A] px-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#2563EB] text-[10px] font-black text-white">
            N
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold tracking-wide text-white">NEXORA HMS</p>
              <span className="inline-flex rounded border border-[#2563EB]/40 bg-[#2563EB]/10 px-1 py-px text-[8px] font-bold uppercase tracking-wider text-[#93C5FD]">
                Hospital App
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Scrollable nav */}
        <nav
          className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-1.5 py-2"
          role="navigation"
          aria-label="Hospital modules"
        >
          <div className={`space-y-2 ${collapsed ? 'space-y-1' : ''}`}>
            {NEXORA_HMS_NAV.map((section) => (
              <NavSectionBlock
                key={section.id}
                section={section}
                collapsed={collapsed}
                activeModuleId={activeModuleId}
                onNavigate={onNavigate}
                open={sectionOpen[section.id] ?? false}
                onOpenChange={(open) => toggleSection(section.id, open)}
              />
            ))}
          </div>
        </nav>

        {/* User footer */}
        <div className="shrink-0 border-t border-slate-800 bg-[#0F172A] p-1.5">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={`flex w-full items-center gap-2 rounded-md p-1.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${
                  collapsed ? 'justify-center' : ''
                }`}
                aria-label="User account menu"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-700 text-[10px] font-bold text-slate-200">
                  {initials}
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-slate-100">{user.name}</span>
                    <span className="block truncate text-[9px] font-medium uppercase tracking-wide text-slate-500">
                      {user.role}
                    </span>
                  </span>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side={collapsed ? 'right' : 'top'}
                align="start"
                sideOffset={6}
                className="z-50 min-w-[10rem] rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
              >
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-slate-700 outline-none hover:bg-slate-50 focus:bg-slate-50"
                  onSelect={() => onSettings?.()}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-rose-600 outline-none hover:bg-rose-50 focus:bg-rose-50"
                  onSelect={() => onSignOut?.()}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          {!collapsed && (
            <div className="mt-1 flex items-center gap-1 px-1 text-[9px] text-slate-600">
              <UserCircle2 className="h-3 w-3" aria-hidden />
              Operational Console
            </div>
          )}
        </div>
      </aside>
    </Tooltip.Provider>
  );
}
