/**
 * Analytics Filters - Phase 8.6
 *
 * Future-ready structure for filtering analytics by program.
 * This allows analytics to be broken down by:
 * - All workouts
 * - Specific program
 * - Free workouts only
 * - Template workouts only
 */

export type AnalyticsFilterType = 'all' | 'program' | 'free' | 'template';

export interface AnalyticsFilter {
  type: AnalyticsFilterType;
  programId?: string; // If type is 'program', this specifies which program
}

/**
 * Default filter showing all workouts
 */
export const DEFAULT_ANALYTICS_FILTER: AnalyticsFilter = {
  type: 'all',
};

/**
 * Create a filter for a specific program
 */
export function createProgramFilter(programId: string): AnalyticsFilter {
  return {
    type: 'program',
    programId,
  };
}

/**
 * Create a filter for free workouts only
 */
export function createFreeWorkoutsFilter(): AnalyticsFilter {
  return {
    type: 'free',
  };
}

/**
 * Create a filter for template workouts only
 */
export function createTemplateWorkoutsFilter(): AnalyticsFilter {
  return {
    type: 'template',
  };
}

/**
 * Get display label for a filter
 */
export function getFilterLabel(filter: AnalyticsFilter, programName?: string): string {
  switch (filter.type) {
    case 'all':
      return 'All Workouts';
    case 'program':
      return programName ? `Program: ${programName}` : 'Program';
    case 'free':
      return 'Free Workouts';
    case 'template':
      return 'Template Workouts';
  }
}

/**
 * Build SQL WHERE clause for analytics queries based on filter
 *
 * This is a helper for future implementation when analytics queries
 * need to be filtered by workout type.
 *
 * @param filter - Analytics filter
 * @param tableAlias - Table alias for workout_sessions (e.g., 'ws')
 * @returns Object with WHERE clause and parameters
 */
export function buildFilterWhereClause(
  filter: AnalyticsFilter,
  tableAlias: string = 'ws'
): { whereClause: string; params: any[] } {
  switch (filter.type) {
    case 'all':
      return {
        whereClause: '',
        params: [],
      };

    case 'program':
      if (!filter.programId) {
        // If no specific program, filter to any program workout
        return {
          whereClause: `${tableAlias}.program_id IS NOT NULL`,
          params: [],
        };
      }
      return {
        whereClause: `${tableAlias}.program_id = ?`,
        params: [filter.programId],
      };

    case 'free':
      // Free workouts have no template and no program
      return {
        whereClause: `${tableAlias}.template_id IS NULL AND ${tableAlias}.program_id IS NULL`,
        params: [],
      };

    case 'template':
      // Template workouts have a template but no program
      return {
        whereClause: `${tableAlias}.template_id IS NOT NULL AND ${tableAlias}.program_id IS NULL`,
        params: [],
      };
  }
}

/**
 * TODO Phase 8.6.2 - Future Enhancement:
 *
 * To enable filtering in analytics:
 *
 * 1. Update analytics repository functions in src/lib/db/repositories/analytics.ts
 *    to accept an optional AnalyticsFilter parameter
 *
 * 2. Use buildFilterWhereClause() to add filter conditions to queries
 *
 * 3. Add filter selector component to analytics screen:
 *    - Dropdown or segmented control
 *    - Shows: All | Programs | Templates | Free
 *    - If Programs selected, show program picker
 *
 * 4. Update analytics screen state to track current filter
 *
 * 5. Reload analytics data when filter changes
 *
 * Example usage in analytics repository:
 *
 * ```typescript
 * export async function getTotalWorkoutCount(
 *   startDate: number,
 *   endDate: number,
 *   filter?: AnalyticsFilter
 * ): Promise<number> {
 *   const baseWhere = 'end_time IS NOT NULL AND start_time >= ? AND start_time <= ?';
 *   const params = [startDate, endDate];
 *
 *   let whereClause = baseWhere;
 *   if (filter) {
 *     const { whereClause: filterClause, params: filterParams } =
 *       buildFilterWhereClause(filter, 'ws');
 *     if (filterClause) {
 *       whereClause = `${baseWhere} AND ${filterClause}`;
 *       params.push(...filterParams);
 *     }
 *   }
 *
 *   const result = await getOne<{ count: number }>(
 *     `SELECT COUNT(*) as count FROM workout_sessions ws WHERE ${whereClause}`,
 *     params
 *   );
 *   return result?.count ?? 0;
 * }
 * ```
 */
