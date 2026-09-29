import { Link } from '@tanstack/react-router';
import { ArrowLeft, Menu } from 'lucide-react';
import type { ReactNode } from 'react';

import { IButton } from '@/core/components/IButton';
import {
  IDropdownMenu,
  IDropdownMenuContent,
  IDropdownMenuItem,
  IDropdownMenuTrigger,
} from '@/core/components/IDropdownMenu';
import { ISidebar, ISidebarItem, ISidebarSection } from '@/core/components/ISidebar';
import { ITopBar } from '@/core/components/ITopBar';
import { SETTINGS_TAB_ITEMS } from '@/features/admin-settings/constants';
import { ApiStatus } from '@/features/health/components/api-status';

import { APP_TITLE } from '../app-meta';

// One list drives the desktop sidebar, the mobile menu and the settings tabs, so they cannot drift apart.
const ADMIN_NAV = SETTINGS_TAB_ITEMS;

/** Admin surface: dense dashboard style (data-surface="admin"). Sidebar from lg, menu below. */
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div data-surface="admin" className="flex min-h-dvh flex-col bg-page">
      <ITopBar
        brand={
          <Link to="/admin/settings" search={{ tab: 'general' }} className="font-semibold text-text no-underline visited:text-text">
            {APP_TITLE} <span className="font-normal text-text-secondary">Admin</span>
          </Link>
        }
        actions={<ApiStatus />}
      >
        <div className="lg:hidden">
          <IDropdownMenu>
            <IDropdownMenuTrigger asChild>
              <IButton variant="reverse" className="w-auto">
                <Menu aria-hidden="true" />
                Menu
              </IButton>
            </IDropdownMenuTrigger>
            <IDropdownMenuContent align="start">
              {ADMIN_NAV.map((item) => (
                <IDropdownMenuItem key={item.tab} asChild>
                  <Link to="/admin/settings" search={{ tab: item.tab }}>
                    <item.icon aria-hidden="true" />
                    {item.label}
                  </Link>
                </IDropdownMenuItem>
              ))}
            </IDropdownMenuContent>
          </IDropdownMenu>
        </div>
      </ITopBar>

      <div className="mx-auto grid w-full max-w-admin flex-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:py-8">
        {/* One aside for all sizes: the back button always shows (above the content on mobile),
            the sidebar only from lg, where the top-bar menu takes over below it. */}
        <aside className="flex flex-col gap-4">
          <IButton asChild variant="reverse" className="w-auto self-start lg:w-full lg:justify-start">
            <Link to="/">
              <ArrowLeft aria-hidden="true" />
              Back to site
            </Link>
          </IButton>
          <div className="hidden lg:block">
            <ISidebar label="Admin">
            <ISidebarSection title="Settings">
              {ADMIN_NAV.map((item) => (
                <ISidebarItem key={item.tab}>
                  <Link to="/admin/settings" search={{ tab: item.tab }} activeOptions={{ includeSearch: true }}>
                    <item.icon aria-hidden="true" />
                    {item.label}
                  </Link>
                </ISidebarItem>
              ))}
              </ISidebarSection>
            </ISidebar>
          </div>
        </aside>
        <main id="main-content" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
