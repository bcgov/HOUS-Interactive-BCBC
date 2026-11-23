/**
 * SectionRenderer - Renders a complete section with all subsections
 * 
 * Works directly with Section type from parser (no transformation needed)
 */

import React from 'react';
import type { Section } from '@bc-building-code/bcbc-parser';
import { SectionTitle } from './SectionTitle';
import { SubsectionBlock } from './SubsectionBlock';
import { parseTextWithMarkers } from '../../lib/text-parsing';
import './SectionRenderer.css';

export interface SectionRendererProps {
  section: Section;
  partNumber?: string;
  effectiveDate?: string;
  interactive?: boolean;
}

export const SectionRenderer: React.FC<SectionRendererProps> = ({ 
  section,
  partNumber,
  effectiveDate,
  interactive = true 
}) => {
  const fullSectionNumber = partNumber ? `${partNumber}.${section.number}` : section.number;
  // "(See Note A-3.3.)" printed under the Section title in the PDF.
  const seeAlsoText = (section as Section & { see_also?: string }).see_also?.trim();

  return (
    <div className="sectionRenderer">
      <SectionTitle 
        number={fullSectionNumber}
        title={section.title}
      />
      {seeAlsoText ? (
        <p className="sectionSeeAlso">
          {parseTextWithMarkers(seeAlsoText, [], interactive)}
        </p>
      ) : null}
      
      <div className="sectionContent">
        {section.subsections.map((subsection) => (
          <SubsectionBlock
            key={subsection.id}
            subsection={subsection}
            sectionNumberPrefix={fullSectionNumber}
            effectiveDate={effectiveDate}
            interactive={interactive}
          />
        ))}
      </div>
    </div>
  );
};
