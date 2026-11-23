import React from 'react';
import { render } from '@testing-library/react';
import { SubsectionBlock } from './SubsectionBlock';
import { SectionRenderer } from './SectionRenderer';

describe('"(See Note …)" under Section and Subsection headings', () => {
  it('prints a Subsection see-also right under its heading', () => {
    const subsection = {
      id: 'nbc.divB.part3.sect1.subsect2',
      type: 'subsection',
      number: 2,
      title: 'Classification of Buildings or Parts of Buildings by Major Occupancy',
      see_also: '(See Note A-3.1.2.)',
      articles: [],
    } as any;
    const { container } = render(<SubsectionBlock subsection={subsection} sectionNumberPrefix="3.1" interactive={false} />);
    const heading = container.querySelector('.subsectionHeading');
    expect(heading?.nextElementSibling?.className).toBe('subsectionSeeAlso');
    expect(heading?.nextElementSibling?.textContent).toBe('(See Note A-3.1.2.)');
  });

  it('prints a Section see-also right under its title', () => {
    const section = {
      id: 'nbc.divB.part3.sect3',
      type: 'section',
      number: 3,
      title: 'Safety within Floor Areas',
      see_also: '(See Note A-3.3.)',
      subsections: [],
    } as any;
    const { container } = render(<SectionRenderer section={section} partNumber="3" interactive={false} />);
    const title = container.querySelector('.sectionTitle');
    expect(title?.nextElementSibling?.className).toBe('sectionSeeAlso');
    expect(title?.nextElementSibling?.textContent).toBe('(See Note A-3.3.)');
  });

  it('prints nothing when there is no see-also', () => {
    const subsection = { id: 's', type: 'subsection', number: 1, title: 'General', articles: [] } as any;
    const { container } = render(<SubsectionBlock subsection={subsection} sectionNumberPrefix="9.1" interactive={false} />);
    expect(container.querySelector('.subsectionSeeAlso')).toBeNull();
  });
});
