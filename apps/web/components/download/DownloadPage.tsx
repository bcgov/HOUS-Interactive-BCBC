'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Icon from '@repo/ui/icon';
import { useVersionStore } from '@/stores/version-store';
import {
  type DownloadVersionOptions,
  formatEffectiveDate,
  loadDownloadOptions,
  selectDownloadVersion,
} from '@/lib/download-options';
import './DownloadPage.css';

export default function DownloadPage() {
  const searchParams = useSearchParams();
  const currentVersion = useVersionStore((state) => state.currentVersion);
  const [activeVersion, setActiveVersion] = useState<DownloadVersionOptions | null>(null);
  const [selectedCodePdf, setSelectedCodePdf] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestedVersion = searchParams.get('version') || currentVersion || '2024';

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const response = await loadDownloadOptions();
        const selected = selectDownloadVersion(response, requestedVersion);
        if (cancelled) return;

        setActiveVersion(selected);
        setSelectedCodePdf(selected?.codePdfs[0]?.pdfLink || '');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load download options.');
        setActiveVersion(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [requestedVersion]);

  const selectedCodeOption = useMemo(
    () => activeVersion?.codePdfs.find((option) => option.pdfLink === selectedCodePdf) ?? activeVersion?.codePdfs[0],
    [activeVersion, selectedCodePdf]
  );

  if (loading) {
    return <div className="download-page">Loading download options...</div>;
  }

  if (error) {
    return <div className="download-page">Unable to load download options. {error}</div>;
  }

  if (!activeVersion) {
    return <div className="download-page">No download options are available.</div>;
  }

  return (
    <section className="download-page" data-testid="download-page">
      <h1 className="download-page__title">{activeVersion.pageTitle}</h1>

      <div className="download-page__grid">
        <div className="download-page__left-column">
          <section className="download-card" aria-labelledby="download-code-title">
            <h2 id="download-code-title" className="download-card__heading">
              Complete BC Building Code
            </h2>
            <p className="download-card__description">Download the entire BC Building Code edition.</p>

            <div className="download-card__controls">
              <div className="download-card__select-group">
                <label htmlFor="code-version-pdf" className="download-card__label">
                  Code Version
                </label>
                <select
                  id="code-version-pdf"
                  className="download-card__select"
                  value={selectedCodePdf}
                  onChange={(event) => setSelectedCodePdf(event.target.value)}
                  aria-label="Select code PDF to open"
                >
                  {activeVersion.codePdfs.map((option) => (
                    <option key={`${option.year}-${option.pdfLink}`} value={option.pdfLink}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <a
                className="download-page__button download-page__button--primary"
                href={selectedCodeOption?.pdfLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${selectedCodeOption?.label || 'selected code PDF'} in a new tab`}
              >
                <Icon type="download" />
                <span>Download full Code</span>
              </a>
            </div>
          </section>

          <section className="download-revisions" aria-labelledby="download-revisions-title">
            <h2 id="download-revisions-title" className="download-revisions__title">
              Revisions and Errata
            </h2>

            {activeVersion.revisionsErrata.length === 0 ? (
              <p className="download-revisions__empty">No revisions or errata are currently available for this version.</p>
            ) : (
              <ul className="download-revisions__list">
                {activeVersion.revisionsErrata.map((item) => (
                  <li key={`${item.type}-${item.title}-${item.effectiveDate}`} className="download-revision-card">
                    <div className="download-revision-card__content">
                      <h3 className="download-revision-card__title">{item.title}</h3>
                      <p className="download-revision-card__description">
                        Effective {formatEffectiveDate(item.effectiveDate)}: {item.description}
                      </p>
                    </div>
                    <a
                      className="download-page__button download-page__button--small"
                      href={item.pdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${item.title} PDF in a new tab`}
                    >
                      PDF
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="download-about" aria-labelledby="download-about-title">
          <h2 id="download-about-title" className="download-about__title">
            About Downloads
          </h2>

          <h3 className="download-about__heading">File Format</h3>
          <p>{activeVersion.about.fileFormat}</p>

          <h3 className="download-about__heading">Effective Dates</h3>
          <p>{activeVersion.about.effectiveDates}</p>

          <h3 className="download-about__heading">Copyright &amp; Usage</h3>
          <p>{activeVersion.about.copyright}</p>
        </aside>
      </div>
    </section>
  );
}
