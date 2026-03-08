import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DownloadPage from './DownloadPage';

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

vi.mock('@/stores/version-store', () => ({
  useVersionStore: vi.fn(),
}));

import { useSearchParams } from 'next/navigation';
import { useVersionStore } from '@/stores/version-store';

const mockData = {
  versions: [
    {
      versionId: '2024',
      pageTitle: 'Download the BC Building Code Edition',
      codePdfs: [
        { year: 2024, label: 'BC Building Code 2024 (PDF)', pdfLink: 'https://example.com/code-2024.pdf' },
      ],
      revisionsErrata: [
        {
          type: 'revision',
          title: 'Sample Revision',
          effectiveDate: '2025-06-16',
          description: 'Sample revision description.',
          pdfLink: 'https://example.com/revision-1.pdf',
        },
      ],
      about: {
        fileFormat: 'PDF files are read-only and preserve all formatting.',
        effectiveDates: 'The 2024 BC Building Code is effective as of March 8, 2024.',
        copyright: 'Sample copyright.',
      },
    },
  ],
};

describe('DownloadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as any).mockReturnValue({
      get: (key: string) => (key === 'version' ? '2024' : null),
    });
    (useVersionStore as any).mockImplementation((selector: any) => selector({ currentVersion: '2024' }));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as any);
  });

  it('renders page content from download options data', async () => {
    render(<DownloadPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Download the BC Building Code Edition' })).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Revisions and Errata' })).toBeInTheDocument();
    expect(screen.getByText('Sample Revision')).toBeInTheDocument();
  });

  it('uses new tab links for code pdf and revision pdf', async () => {
    render(<DownloadPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Open BC Building Code 2024 \(PDF\) in a new tab/i })).toBeInTheDocument();
    });

    const codePdfLink = screen.getByRole('link', { name: /Open BC Building Code 2024 \(PDF\) in a new tab/i });
    expect(codePdfLink).toHaveAttribute('href', 'https://example.com/code-2024.pdf');
    expect(codePdfLink).toHaveAttribute('target', '_blank');

    const revisionPdfLink = screen.getByRole('link', { name: /Open Sample Revision PDF in a new tab/i });
    expect(revisionPdfLink).toHaveAttribute('href', 'https://example.com/revision-1.pdf');
    expect(revisionPdfLink).toHaveAttribute('target', '_blank');
  });
});
