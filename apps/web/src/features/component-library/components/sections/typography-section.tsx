import { IHeading } from '@/core/components/IHeading';
import { IText } from '@/core/components/IText';

import { ShowcaseItem, ShowcaseSection } from '../showcase';

export function TypographySection() {
  return (
    <ShowcaseSection id="typography" title="Typography" description="Hanken Grotesk Variable, weights 400 and 600. Sizes follow the surface.">
      <ShowcaseItem name="Font" usage="@fontsource-variable/hanken-grotesk, imported once in styles.css" wide>
        <p className="text-[2rem] leading-tight">Aa Bb Cc 0123456789</p>
        <p className="font-semibold">Semibold 600: headings, labels, buttons</p>
        <p>Regular 400: body text, hints, captions</p>
      </ShowcaseItem>
      <ShowcaseItem name="IHeading" usage="level 1-4, optional size override">
        <IHeading level={1}>Heading 1</IHeading>
        <IHeading level={2}>Heading 2</IHeading>
        <IHeading level={3}>Heading 3</IHeading>
        <IHeading level={4}>Heading 4</IHeading>
      </ShowcaseItem>
      <ShowcaseItem name="IText" usage="as, asChild, size, weight, tone, truncate">
        <IText as="p" size="lg">Large text</IText>
        <IText as="p">Medium text (surface body size)</IText>
        <IText as="p" size="sm">Small text</IText>
        <IText as="p" tone="secondary">Secondary tone</IText>
        <IText as="p" tone="error" weight="semibold">Error tone, semibold</IText>
        <IText as="p" truncate className="max-w-56">Truncated text that is far too long to fit on one line</IText>
      </ShowcaseItem>
    </ShowcaseSection>
  );
}
