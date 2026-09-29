import { IButton } from '@/core/components/IButton';
import { IFooter } from '@/core/components/IFooter';
import { IHeader } from '@/core/components/IHeader';
import { IPageHeader } from '@/core/components/IPageHeader';
import { IStatusPill } from '@/core/components/IStatusPill';
import { ITopBar } from '@/core/components/ITopBar';

import { ShowcaseItem, ShowcaseSection } from '../showcase';

export function LayoutSection() {
  return (
    <ShowcaseSection id="layout" title="Layout" description="Page chrome. IHeader + IFooter for patients, ITopBar for admin, IContainer for width.">
      <ShowcaseItem name="IPageHeader" usage="One h1 block per page, optional eyebrow and actions" wide>
        <IPageHeader title="Uploads" description="Documents submitted by patients." actions={<IButton className="w-auto">Export</IButton>} />
      </ShowcaseItem>
      <ShowcaseItem name="IHeader" usage="Patient surface" wide>
        <div className="overflow-hidden rounded-[8px]">
          <IHeader title="Bookable" subtitle={['Ingest Form POC v0.1']} actions={<IStatusPill status="ok" label="API OK" />} />
        </div>
      </ShowcaseItem>
      <ShowcaseItem name="ITopBar" usage="Admin surface" wide>
        <div className="overflow-hidden rounded-[8px] border border-border">
          <ITopBar brand={<span className="font-semibold">Bookable Admin</span>} actions={<IStatusPill status="ok" label="API OK" />} />
        </div>
      </ShowcaseItem>
      <ShowcaseItem name="IFooter" usage="Patient surface, disclaimer required" wide>
        <div className="overflow-hidden rounded-[8px] border border-border">
          <IFooter brand="Bookable" tagline="Ingest Form proof of concept" disclaimer={<p>Not a substitute for medical advice.</p>} />
        </div>
      </ShowcaseItem>
    </ShowcaseSection>
  );
}
