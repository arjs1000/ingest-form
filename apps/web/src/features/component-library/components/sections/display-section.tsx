import { IBadge } from '@/core/components/IBadge';
import { ICard, ICardBody, ICardHeading, ICardLink } from '@/core/components/ICard';
import { ICodeBlock } from '@/core/components/ICodeBlock';
import { ICopyButton } from '@/core/components/ICopyButton';
import { IList } from '@/core/components/IList';
import {
  ITable,
  ITableBody,
  ITableCaption,
  ITableCell,
  ITableHead,
  ITableHeaderCell,
  ITableRow,
} from '@/core/components/ITable';

import { ShowcaseItem, ShowcaseSection } from '../showcase';

export function DisplaySection() {
  return (
    <ShowcaseSection id="display" title="Display" description="Cards, tables, lists, badges, dividers and copy buttons.">
      <ShowcaseItem name="ICard" usage="clickable + ICardLink stretches the link">
        <ICard clickable>
          <ICardHeading>
            <ICardLink>
              <a href="#display">Clickable card</a>
            </ICardLink>
          </ICardHeading>
          <ICardBody>
            <p>The whole card is the link target.</p>
          </ICardBody>
        </ICard>
      </ShowcaseItem>
      <ShowcaseItem name="IBadge" usage="neutral | info | success | warning | error">
        <div className="flex flex-wrap gap-2">
          <IBadge>Draft</IBadge>
          <IBadge tone="info">In review</IBadge>
          <IBadge tone="success">Accepted</IBadge>
          <IBadge tone="warning">Needs info</IBadge>
          <IBadge tone="error">Rejected</IBadge>
        </div>
      </ShowcaseItem>
      <ShowcaseItem name="ITable" usage="dense admin table; scrolls inside itself; clickable / selected rows" wide>
        <ITable>
          <ITableCaption className="sr-only">Example submissions</ITableCaption>
          <ITableHead>
            <ITableRow>
              <ITableHeaderCell>Received</ITableHeaderCell>
              <ITableHeaderCell>Reference</ITableHeaderCell>
              <ITableHeaderCell>Source</ITableHeaderCell>
              <ITableHeaderCell>Status</ITableHeaderCell>
              <ITableHeaderCell>Attempts</ITableHeaderCell>
            </ITableRow>
          </ITableHead>
          <ITableBody>
            <ITableRow clickable>
              <ITableCell className="whitespace-nowrap">27 Sep 2026, 09:14</ITableCell>
              <ITableCell className="font-mono">ABC-123456-0001</ITableCell>
              <ITableCell>
                <IBadge tone="info">API · Acme Health</IBadge>
              </ITableCell>
              <ITableCell>
                <IBadge tone="success">Completed</IBadge>
              </ITableCell>
              <ITableCell>1</ITableCell>
            </ITableRow>
            <ITableRow selected>
              <ITableCell className="whitespace-nowrap">27 Sep 2026, 09:20</ITableCell>
              <ITableCell className="font-mono">ABC-123456-0002</ITableCell>
              <ITableCell>
                <IBadge>UI</IBadge>
              </ITableCell>
              <ITableCell>
                <IBadge tone="error">Failed</IBadge>
              </ITableCell>
              <ITableCell>2</ITableCell>
            </ITableRow>
          </ITableBody>
        </ITable>
      </ShowcaseItem>
      <ShowcaseItem name="ICopyButton" usage="icon button; label is required; toasts on copy">
        <div className="flex items-center gap-2">
          <code className="font-mono text-[0.8125rem]">cmg1x2y3z0000abcd</code>
          <ICopyButton value="cmg1x2y3z0000abcd" label="Copy example ID" />
        </div>
      </ShowcaseItem>
      <ShowcaseItem name="IList" usage="bullet | number | plain">
        <IList items={['Photo ID', 'Proof of address']} />
        <IList variant="number" items={['Answer questions', 'Upload documents', 'Get confirmation']} />
      </ShowcaseItem>
      <ShowcaseItem name="ICodeBlock" usage="Monospace, wraps, scrolls inside, optional copy" wide>
        <ICodeBlock
          label="example JSON"
          code={JSON.stringify({ session_id: '7f0c…', name: 'Alex Example', date_of_birth: '1984-03-15', mobile_number: '+447123456789' }, null, 2)}
        />
      </ShowcaseItem>
    </ShowcaseSection>
  );
}
