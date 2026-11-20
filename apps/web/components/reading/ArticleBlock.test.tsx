import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ArticleBlock } from './ArticleBlock';
import type { Article } from '@bc-building-code/bcbc-parser';

const makeTable = (n: number, number?: string) => ({
  id: `nbc.divB.part4.sect1.subsect6.art2.table${n}`,
  type: 'table',
  ...(number ? { number } : {}),
  title: `Table title ${n}`,
  headers: [['Col']],
  rows: [{ cells: [{ content: 'Data' }] }],
  formingPart: [
    { type: 'internal', target: `nbc.divB.part4.sect1.subsect6.art2.sent${n}`, display_type: 'long' },
  ],
});

const makeArticle = (tables: unknown[]): Article =>
  ({
    id: 'nbc.divB.part4.sect1.subsect6.art2',
    number: '2',
    title: 'Specified Snow Load',
    type: 'article',
    content: tables,
  }) as unknown as Article;

describe('ArticleBlock table numbers', () => {
  it('uses the table number from the data in an Article with several tables', () => {
    render(<ArticleBlock article={makeArticle([makeTable(1, '4.1.6.2.-A'), makeTable(2, '4.1.6.2.-B')])} interactive={false} />);

    expect(screen.getByText('Table 4.1.6.2.-A')).toBeInTheDocument();
    expect(screen.getByText('Table 4.1.6.2.-B')).toBeInTheDocument();
    expect(screen.queryByText('Table 4.1.6.2.(2)')).toBeNull();
  });

  it('still derives a number when the data has none', () => {
    render(<ArticleBlock article={makeArticle([makeTable(1), makeTable(2)])} interactive={false} />);

    expect(screen.getByText('Table 4.1.6.2.(2)')).toBeInTheDocument();
  });
});
