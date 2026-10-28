import { internalMutation } from './_generated/server';
import { openSeasonFromPrevious } from './equipe';
import { LISTA_OFICIAL_2026 } from './lib/listaOficial2026';

/**
 * Loads the Lista oficial 2026 and opens Temporada 2027 from it. Safe to run more than once.
 * `npx convex run seedOlimpiadas:run`
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing2026 = await ctx.db
      .query('seasons')
      .withIndex('by_year', (q) => q.eq('year', 2026))
      .unique();
    let imported = 0;
    if (!existing2026) {
      await ctx.db.insert('seasons', { year: 2026, openedAt: Date.now() });
      for (const seed of LISTA_OFICIAL_2026) {
        const { phases, leadsTo, ...fields } = seed;
        const olympiadId = await ctx.db.insert('olympiads', {
          ...fields,
          season: 2026,
          leadsTo: leadsTo ?? [],
          updatedAt: Date.now(),
        });
        for (const [index, phase] of phases.entries()) {
          await ctx.db.insert('phases', { olympiadId, order: index + 1, ...phase });
        }
        imported += 1;
      }
    }
    const existing2027 = await ctx.db
      .query('seasons')
      .withIndex('by_year', (q) => q.eq('year', 2027))
      .unique();
    const opened = existing2027 ? 0 : await openSeasonFromPrevious(ctx, 2027);
    return { imported, opened };
  },
});
