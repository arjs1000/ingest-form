import { ChevronDown, FileText, LayoutGrid, Settings } from 'lucide-react';
import { useState } from 'react';

import { IBackBar } from '@/core/components/IBackBar';
import { IBreadcrumb, IBreadcrumbItem } from '@/core/components/IBreadcrumb';
import { IButton } from '@/core/components/IButton';
import {
  IDropdownMenu,
  IDropdownMenuContent,
  IDropdownMenuItem,
  IDropdownMenuLabel,
  IDropdownMenuSeparator,
  IDropdownMenuTrigger,
} from '@/core/components/IDropdownMenu';
import { ISidebar, ISidebarItem, ISidebarSection } from '@/core/components/ISidebar';
import { ITabs, ITabsContent, ITabsList, ITabsTrigger } from '@/core/components/ITabs';
import { IText } from '@/core/components/IText';

import { ShowcaseItem, ShowcaseSection } from '../showcase';

export function NavigationSection() {
  const [tab, setTab] = useState('one');
  return (
    <ShowcaseSection id="navigation" title="Navigation" description="Headers, bars, tabs and menus. Admin navigation is URL-driven in real pages.">
      <ShowcaseItem name="ITabs" usage="Controlled; store the value in the URL" wide>
        <ITabs value={tab} onValueChange={setTab}>
          <ITabsList aria-label="Demo tabs">
            <ITabsTrigger value="one">Overview</ITabsTrigger>
            <ITabsTrigger value="two">Uploads</ITabsTrigger>
            <ITabsTrigger value="three">Audit log</ITabsTrigger>
          </ITabsList>
          <ITabsContent value="one"><IText tone="secondary">Overview panel</IText></ITabsContent>
          <ITabsContent value="two"><IText tone="secondary">Uploads panel</IText></ITabsContent>
          <ITabsContent value="three"><IText tone="secondary">Audit log panel</IText></ITabsContent>
        </ITabs>
      </ShowcaseItem>
      <ShowcaseItem name="ISidebar" usage="Items wrap router Links; active via data-status">
        <ISidebar label="Demo">
          <ISidebarSection title="Workspace">
            <ISidebarItem>
              <a href="#navigation" data-status="active">
                <Settings aria-hidden="true" />
                Settings
              </a>
            </ISidebarItem>
            <ISidebarItem>
              <a href="#navigation">
                <FileText aria-hidden="true" />
                Uploads
              </a>
            </ISidebarItem>
            <ISidebarItem>
              <a href="#navigation">
                <LayoutGrid aria-hidden="true" />
                Components
              </a>
            </ISidebarItem>
          </ISidebarSection>
        </ISidebar>
      </ShowcaseItem>
      <ShowcaseItem name="IBreadcrumb / IDropdownMenu" usage="Admin wayfinding and actions">
        <IBreadcrumb>
          <IBreadcrumbItem>
            <a href="#navigation">Admin</a>
          </IBreadcrumbItem>
          <IBreadcrumbItem>
            <a href="#navigation">Providers</a>
          </IBreadcrumbItem>
          <IBreadcrumbItem current>North Street</IBreadcrumbItem>
        </IBreadcrumb>
        <IDropdownMenu>
          <IDropdownMenuTrigger asChild>
            <IButton variant="reverse" className="w-auto">
              Actions
              <ChevronDown aria-hidden="true" />
            </IButton>
          </IDropdownMenuTrigger>
          <IDropdownMenuContent align="start">
            <IDropdownMenuLabel>Upload</IDropdownMenuLabel>
            <IDropdownMenuItem>View</IDropdownMenuItem>
            <IDropdownMenuItem>Download</IDropdownMenuItem>
            <IDropdownMenuSeparator />
            <IDropdownMenuItem className="text-error">Archive</IDropdownMenuItem>
          </IDropdownMenuContent>
        </IDropdownMenu>
      </ShowcaseItem>
      <ShowcaseItem name="IBackBar" usage="Patient pages, under the header" wide>
        <div className="overflow-hidden rounded-[8px]">
          <IBackBar>
            <a href="#navigation">Back</a>
          </IBackBar>
        </div>
      </ShowcaseItem>
    </ShowcaseSection>
  );
}
