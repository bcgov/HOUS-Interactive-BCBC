import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FrontMatterRenderer } from './FrontMatterRenderer';

vi.mock('../../lib/text-parsing', () => ({
  parseTextWithMarkers: (text: string) => text.replace(/<\/?[^>]+>/g, ''),
}));

vi.mock('./TableBlock', () => ({
  TableBlock: ({ table, effectiveDate }: { table: { title?: string }; effectiveDate?: string }) => (
    <div data-testid="table-block">{`${table.title || 'table'}|${effectiveDate || 'latest'}`}</div>
  ),
}));

describe('FrontMatterRenderer', () => {
  it('passes the effective date through to front matter tables', () => {
    render(
      <FrontMatterRenderer
        section={{
          id: 'nbc.2020.preface',
          type: 'preface',
          content: [
            {
              id: 'nbc.2020.preface.table1',
              type: 'table',
              title: 'Preface Table',
              structure: { body_rows: [] },
            },
          ],
        }}
        effectiveDate="2025-06-16"
      />
    );

    expect(screen.getByTestId('table-block')).toHaveTextContent('Preface Table|2025-06-16');
  });
});