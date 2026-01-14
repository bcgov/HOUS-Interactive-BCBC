import type { BCBCData, Article, Content } from '@/types';

export interface GlobalRevisionInfo {
  effectiveDate: string;
  displayDate: string;
  count: number; // Number of items with revisions on this date
  type: 'mixed' | 'original' | 'amendment';
}

export class GlobalRevisionManager {
  private static cachedDates: GlobalRevisionInfo[] | null = null;

  /**
   * Get all unique revision dates from the entire BCBC dataset
   */
  static async getAllAvailableDates(bcbcData?: BCBCData): Promise<GlobalRevisionInfo[]> {
    if (this.cachedDates) {
      return this.cachedDates;
    }

    if (!bcbcData) {
      // Load the data if not provided
      try {
        const response = await fetch('/bcbc-full.json');
        bcbcData = await response.json();
      } catch (error) {
        console.error('Failed to load BCBC data:', error);
        return [];
      }
    }

    const dateMap = new Map<string, { count: number; types: Set<string> }>();

    // Traverse the entire data structure to find all revision dates
    this.traverseForRevisions(bcbcData, dateMap);

    // Convert to GlobalRevisionInfo array
    const revisionInfos: GlobalRevisionInfo[] = Array.from(dateMap.entries()).map(([date, info]) => ({
      effectiveDate: date,
      displayDate: this.formatDisplayDate(date),
      count: info.count,
      type: this.determineType(info.types)
    }));

    // Sort by effective date, newest first
    this.cachedDates = revisionInfos.sort((a, b) => 
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );

    return this.cachedDates;
  }

  /**
   * Recursively traverse the BCBC data structure to find all revisions
   */
  private static traverseForRevisions(
    obj: any, 
    dateMap: Map<string, { count: number; types: Set<string> }>
  ): void {
    if (!obj || typeof obj !== 'object') return;

    // Check if this object has revisions
    if (obj.revisions && Array.isArray(obj.revisions)) {
      obj.revisions.forEach((revision: any) => {
        if (revision.effective_date) {
          const existing = dateMap.get(revision.effective_date) || { count: 0, types: new Set() };
          existing.count++;
          existing.types.add(revision.type || 'unknown');
          dateMap.set(revision.effective_date, existing);
        }
      });
    }

    // Recursively check all properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (Array.isArray(value)) {
          value.forEach(item => this.traverseForRevisions(item, dateMap));
        } else if (typeof value === 'object') {
          this.traverseForRevisions(value, dateMap);
        }
      }
    }
  }

  /**
   * Determine the overall type for a date based on revision types
   */
  private static determineType(types: Set<string>): 'mixed' | 'original' | 'amendment' {
    if (types.size > 1) return 'mixed';
    const type = Array.from(types)[0];
    if (type === 'original') return 'original';
    if (type === 'revision' || type === 'amendment') return 'amendment';
    return 'mixed';
  }

  /**
   * Get the most recent revision date
   */
  static async getLatestRevisionDate(bcbcData?: BCBCData): Promise<string | null> {
    const dates = await this.getAllAvailableDates(bcbcData);
    return dates.length > 0 ? dates[0].effectiveDate : null;
  }

  /**
   * Get content for any article based on global revision date
   */
  static getContentForGlobalDate(article: Article, globalDate?: string): Content[] {
    if (!globalDate) {
      return article.content;
    }

    // First check for article-level revisions
    if (article.revisions && article.revisions.length > 0) {
      return this.getArticleLevelContentForDate(article, globalDate);
    }

    // Then check for sentence-level revisions
    if (this.hasSentenceLevelRevisions(article)) {
      return this.getSentenceLevelContentForDate(article, globalDate);
    }

    // Fallback to base content
    return article.content;
  }

  /**
   * Handle article-level revisions for global date
   */
  private static getArticleLevelContentForDate(article: Article, globalDate: string): Content[] {
    // Find the most recent revision that is effective on or before the global date
    const applicableRevisions = article.revisions!
      .filter(revision => new Date(revision.effective_date) <= new Date(globalDate))
      .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

    if (applicableRevisions.length > 0) {
      return applicableRevisions[0].content;
    }

    return article.content;
  }

  /**
   * Handle sentence-level revisions for global date
   */
  private static getSentenceLevelContentForDate(article: Article, globalDate: string): Content[] {
    return article.content.map(content => {
      if (content.revisions && content.revisions.length > 0) {
        // Find the most recent revision that is effective on or before the global date
        const applicableRevisions = content.revisions
          .filter(revision => new Date(revision.effective_date) <= new Date(globalDate))
          .sort((a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime());

        if (applicableRevisions.length > 0) {
          return {
            ...content,
            text: applicableRevisions[0].text
          };
        }
      }

      return content;
    });
  }

  /**
   * Check if an article has sentence-level revisions
   */
  private static hasSentenceLevelRevisions(article: Article): boolean {
    return article.content.some(content => 
      content.revisions && content.revisions.length > 0
    );
  }

  /**
   * Format date for display
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
   * Clear cached dates (useful when data is updated)
   */
  static clearCache(): void {
    this.cachedDates = null;
  }

  /**
   * Get revision statistics for a specific date
   */
  static async getRevisionStats(effectiveDate: string, bcbcData?: BCBCData): Promise<{
    articlesAffected: number;
    sentencesAffected: number;
    tablesAffected: number;
  }> {
    if (!bcbcData) {
      try {
        const response = await fetch('/bcbc-full.json');
        bcbcData = await response.json();
      } catch (error) {
        console.error('Failed to load BCBC data:', error);
        return { articlesAffected: 0, sentencesAffected: 0, tablesAffected: 0 };
      }
    }

    const stats = { articlesAffected: 0, sentencesAffected: 0, tablesAffected: 0 };
    this.countRevisionsForDate(bcbcData, effectiveDate, stats);
    return stats;
  }

  /**
   * Count revisions for a specific date
   */
  private static countRevisionsForDate(
    obj: any, 
    targetDate: string, 
    stats: { articlesAffected: number; sentencesAffected: number; tablesAffected: number }
  ): void {
    if (!obj || typeof obj !== 'object') return;

    // Check if this object has revisions for the target date
    if (obj.revisions && Array.isArray(obj.revisions)) {
      const hasTargetRevision = obj.revisions.some((revision: any) => 
        revision.effective_date === targetDate
      );
      
      if (hasTargetRevision) {
        if (obj.type === 'article') stats.articlesAffected++;
        else if (obj.type === 'sentence') stats.sentencesAffected++;
        else if (obj.type === 'table') stats.tablesAffected++;
      }
    }

    // Recursively check all properties
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (Array.isArray(value)) {
          value.forEach(item => this.countRevisionsForDate(item, targetDate, stats));
        } else if (typeof value === 'object') {
          this.countRevisionsForDate(value, targetDate, stats);
        }
      }
    }
  }
}