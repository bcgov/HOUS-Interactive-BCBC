import type { Article, Revision, Content } from '@/types';

export interface RevisionInfo {
  effectiveDate: string;
  displayDate: string;
  revision: Revision;
}

export class RevisionManager {
  /**
   * Get all unique effective dates from an article's revisions, sorted from newest to oldest
   */
  static getAvailableDates(article: Article): RevisionInfo[] {
    if (!article.revisions || article.revisions.length === 0) {
      return [];
    }

    const revisionInfos: RevisionInfo[] = article.revisions.map(revision => ({
      effectiveDate: revision.effective_date,
      displayDate: this.formatDisplayDate(revision.effective_date),
      revision
    }));

    // Sort by effective date, newest first
    return revisionInfos.sort((a, b) => 
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
  }

  /**
   * Get the content for an article based on the selected effective date
   */
  static getContentForDate(article: Article, selectedDate?: string): Content[] {
    if (!article.revisions || article.revisions.length === 0) {
      return article.content;
    }

    // If no date selected, use the most recent revision
    if (!selectedDate) {
      const availableDates = this.getAvailableDates(article);
      if (availableDates.length > 0) {
        return availableDates[0].revision.content;
      }
      return article.content;
    }

    // Find the revision for the selected date
    const selectedRevision = article.revisions.find(
      revision => revision.effective_date === selectedDate
    );

    if (selectedRevision) {
      return selectedRevision.content;
    }

    // If no revision found for the selected date, find the most recent revision
    // that is effective before or on the selected date
    const availableRevisions = article.revisions
      .filter(revision => new Date(revision.effective_date) <= new Date(selectedDate))
      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

    if (availableRevisions.length > 0) {
      return availableRevisions[0].content;
    }

    // Fallback to base content
    return article.content;
  }

  /**
   * Get the default selected date (most recent revision)
   */
  static getDefaultSelectedDate(article: Article): string | null {
    const availableDates = this.getAvailableDates(article);
    return availableDates.length > 0 ? availableDates[0].effectiveDate : null;
  }

  /**
   * Check if an article has revisions
   */
  static hasRevisions(article: Article): boolean {
    return !!(article.revisions && article.revisions.length > 0);
  }

  /**
   * Format date for display in dropdown
   */
  private static formatDisplayDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get revision info for a specific date
   */
  static getRevisionInfo(article: Article, effectiveDate: string): Revision | null {
    if (!article.revisions) return null;
    
    return article.revisions.find(revision => revision.effective_date === effectiveDate) || null;
  }

  /**
   * Get change summary for a revision
   */
  static getChangeSummary(article: Article, effectiveDate: string): string | null {
    const revision = this.getRevisionInfo(article, effectiveDate);
    return revision?.change_summary || null;
  }
}