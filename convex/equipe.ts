import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx } from './_generated/server';
import { isAllowlistedPlatformEmail } from './lib/auth';
import { createAviso } from './lib/avisos';
import { isEquipe, requireEquipe } from './lib/equipe';
import {
  confirmedDay,
  daysBetween,
  dateInfoValidator,
  eligibilityValidator,
  formatDateInfo,
  type DateInfo,
} from './lib/olimpiadas';
import { loadHistorico, loadPhases, loadSeasonOlympiads } from './olimpiadas';

const NUDGE_WINDOW_DAYS = 7;

function becameConfirmed(before: DateInfo | undefined, after: DateInfo | undefined) {
  return Boolean(
    after &&
    confirmedDay(after) &&
    (!before || before.status !== 'confirmed' || before.start !== after.start)
  );
}

/** "Data a confirmar" → confirmed: tell every menina with a Participação. */
async function notifyDateConfirmed(
  ctx: MutationCtx,
  olympiad: Doc<'olympiads'>,
  what: string,
  date: DateInfo,
  phaseId?: Id<'phases'>
) {
  const participations = await ctx.db
    .query('participations')
    .withIndex('by_olympiad', (q) => q.eq('olympiadId', olympiad._id))
    .take(2000);
  for (const participation of participations) {
    await createAviso(ctx, {
      userId: participation.userId,
      kind: 'data_confirmada',
      olympiadId: olympiad._id,
      phaseId,
      title: `${olympiad.acronym}: data confirmada (${what})`,
      body: `Agora é oficial: ${formatDateInfo(date)}. Já está no seu calendário.`,
      dedupeKey: `confirmada:${phaseId ?? olympiad._id}:${what}:${date.start}`,
    });
  }
}

async function listMeninas(ctx: Parameters<typeof isEquipe>[0]) {
  const users = await ctx.db.query('users').take(1000);
  const meninas: Doc<'users'>[] = [];
  for (const user of users) {
    if (user.isAnonymous || (user.email && isAllowlistedPlatformEmail(user.email))) {
      continue;
    }
    if (user.onboardingStatus === undefined) {
      continue;
    }
    if (await isEquipe(ctx, user._id)) {
      continue;
    }
    meninas.push(user);
  }
  return meninas;
}

/** Acompanhamento: who needs a nudge, what to celebrate, and every menina. */
export const acompanhamento = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    await requireEquipe(ctx);
    const year = Number(args.today.slice(0, 4));

    const nudges: Array<{
      userId: Id<'users'>;
      name: string;
      olympiadId: Id<'olympiads'>;
      acronym: string;
      deadline: string;
      daysLeft: number;
    }> = [];
    for (const season of [year, year + 1]) {
      const planned = await ctx.db
        .query('participations')
        .withIndex('by_season_and_status', (q) => q.eq('season', season).eq('status', 'planned'))
        .take(5000);
      for (const participation of planned) {
        const olympiad = await ctx.db.get(participation.olympiadId);
        const deadline = confirmedDay(olympiad?.registrationDeadline);
        if (!olympiad || !deadline) {
          continue;
        }
        const daysLeft = daysBetween(args.today, deadline);
        if (daysLeft < 0 || daysLeft > NUDGE_WINDOW_DAYS) {
          continue;
        }
        const user = await ctx.db.get(participation.userId);
        nudges.push({
          userId: participation.userId,
          name: user?.name ?? user?.email ?? 'Menina',
          olympiadId: olympiad._id,
          acronym: olympiad.acronym,
          deadline,
          daysLeft,
        });
      }
    }
    nudges.sort((a, b) => a.daysLeft - b.daysLeft);

    const recent = await ctx.db.query('results').withIndex('by_recordedAt').order('desc').take(60);
    const celebrations = [];
    for (const result of recent) {
      if (result.outcome !== 'advanced' && !result.award) {
        continue;
      }
      const [user, olympiad, phase] = await Promise.all([
        ctx.db.get(result.userId),
        ctx.db.get(result.olympiadId),
        ctx.db.get(result.phaseId),
      ]);
      if (!user || !olympiad || !phase) {
        continue;
      }
      celebrations.push({
        _id: result._id,
        userId: user._id,
        name: user.name ?? user.email ?? 'Menina',
        acronym: olympiad.acronym,
        phaseName: phase.name,
        outcome: result.outcome,
        award: result.award ?? null,
        recordedAt: result.recordedAt,
      });
      if (celebrations.length >= 20) break;
    }

    const meninas = await listMeninas(ctx);
    const roster = await Promise.all(
      meninas.map(async (menina) => {
        const [current, next, results] = await Promise.all([
          ctx.db
            .query('participations')
            .withIndex('by_user_and_season', (q) => q.eq('userId', menina._id).eq('season', year))
            .take(300),
          ctx.db
            .query('participations')
            .withIndex('by_user_and_season', (q) =>
              q.eq('userId', menina._id).eq('season', year + 1)
            )
            .take(300),
          ctx.db
            .query('results')
            .withIndex('by_user_and_season', (q) => q.eq('userId', menina._id))
            .take(500),
        ]);
        const participations = [...current, ...next];
        return {
          _id: menina._id,
          name: menina.name ?? menina.email ?? 'Menina',
          email: menina.email ?? null,
          image: menina.image ?? null,
          status: menina.onboardingStatus ?? null,
          planned: participations.filter((p) => p.status === 'planned').length,
          registered: participations.filter((p) => p.status === 'registered').length,
          medals: results.filter((r) => r.award && r.award !== 'mencao').length,
        };
      })
    );
    roster.sort((a, b) => a.name.localeCompare(b.name));

    return { nudges, celebrations, roster };
  },
});

export const menina = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await requireEquipe(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    const participations = await ctx.db
      .query('participations')
      .withIndex('by_user_and_season', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(500);
    const rows = await Promise.all(
      participations.map(async (participation) => {
        const olympiad = await ctx.db.get(participation.olympiadId);
        return olympiad
          ? {
              _id: participation._id,
              season: participation.season,
              olympiadId: olympiad._id,
              acronym: olympiad.acronym,
              name: olympiad.name,
              isExtra: Boolean(olympiad.ownerId),
              status: participation.status,
              registrationDeadline: olympiad.registrationDeadline ?? null,
            }
          : null;
      })
    );
    return {
      name: user.name ?? user.email ?? 'Menina',
      email: user.email ?? null,
      image: user.image ?? null,
      grade: user.grade ?? null,
      schoolType: user.schoolType ?? null,
      participations: rows.filter((row) => row !== null),
      historico: await loadHistorico(ctx, user._id),
    };
  },
});

/** Lista oficial of one Temporada with every Fase, for editing. */
export const listaOficial = query({
  args: { season: v.number() },
  handler: async (ctx, args) => {
    await requireEquipe(ctx);
    const olympiads = (await loadSeasonOlympiads(ctx, args.season, null)).filter(
      (olympiad) => !olympiad.ownerId
    );
    const rows = await Promise.all(
      olympiads.map(async (olympiad) => {
        const phases = (await loadPhases(ctx, olympiad._id)).toSorted((a, b) => a.order - b.order);
        const participants = await ctx.db
          .query('participations')
          .withIndex('by_olympiad', (q) => q.eq('olympiadId', olympiad._id))
          .take(2000);
        return { ...olympiad, phases, participantCount: participants.length };
      })
    );
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  },
});

const olympiadFields = {
  name: v.string(),
  acronym: v.string(),
  area: v.string(),
  website: v.optional(v.string()),
  registrationDeadline: v.optional(dateInfoValidator),
  registrationNote: v.optional(v.string()),
  eligibility: v.optional(eligibilityValidator),
  leadsTo: v.array(v.string()),
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const saveOlympiad = mutation({
  args: {
    olympiadId: v.optional(v.id('olympiads')),
    season: v.number(),
    ...olympiadFields,
  },
  handler: async (ctx, args) => {
    await requireEquipe(ctx);
    const { olympiadId, season, ...fields } = args;
    const clean = {
      ...fields,
      name: fields.name.trim(),
      acronym: fields.acronym.trim() || fields.name.trim(),
      area: fields.area.trim(),
      website: fields.website?.trim() || undefined,
      registrationNote: fields.registrationNote?.trim() || undefined,
      updatedAt: Date.now(),
    };
    if (!clean.name) {
      throw new ConvexError('Dê um nome para a olimpíada');
    }
    if (!olympiadId) {
      return await ctx.db.insert('olympiads', {
        ...clean,
        season,
        key: slugify(clean.acronym) || slugify(clean.name),
      });
    }
    const existing = await ctx.db.get(olympiadId);
    if (!existing || existing.ownerId) {
      throw new ConvexError('Olimpíada não encontrada');
    }
    await ctx.db.patch(olympiadId, clean);
    if (becameConfirmed(existing.registrationDeadline, clean.registrationDeadline)) {
      await notifyDateConfirmed(
        ctx,
        { ...existing, ...clean },
        'prazo de inscrição',
        clean.registrationDeadline!
      );
    }
    return olympiadId;
  },
});

export const deleteOlympiad = mutation({
  args: { olympiadId: v.id('olympiads') },
  handler: async (ctx, args) => {
    await requireEquipe(ctx);
    const olympiad = await ctx.db.get(args.olympiadId);
    if (!olympiad || olympiad.ownerId) {
      throw new ConvexError('Olimpíada não encontrada');
    }
    const participations = await ctx.db
      .query('participations')
      .withIndex('by_olympiad', (q) => q.eq('olympiadId', olympiad._id))
      .take(1);
    if (participations.length) {
      throw new ConvexError('Há meninas participando desta olimpíada. Não dá para apagar.');
    }
    for (const phase of await loadPhases(ctx, olympiad._id)) {
      await ctx.db.delete(phase._id);
    }
    await ctx.db.delete(olympiad._id);
    return null;
  },
});

export const savePhase = mutation({
  args: {
    olympiadId: v.id('olympiads'),
    phaseId: v.optional(v.id('phases')),
    name: v.string(),
    date: dateInfoValidator,
    resultRelease: v.optional(dateInfoValidator),
  },
  handler: async (ctx, args) => {
    await requireEquipe(ctx);
    const olympiad = await ctx.db.get(args.olympiadId);
    if (!olympiad || olympiad.ownerId) {
      throw new ConvexError('Olimpíada não encontrada');
    }
    const name = args.name.trim() || 'Fase';
    if (!args.phaseId) {
      const phases = await loadPhases(ctx, olympiad._id);
      const order = phases.reduce((max, phase) => Math.max(max, phase.order), 0) + 1;
      return await ctx.db.insert('phases', {
        olympiadId: olympiad._id,
        order,
        name,
        date: args.date,
        resultRelease: args.resultRelease,
      });
    }
    const existing = await ctx.db.get(args.phaseId);
    if (!existing || existing.olympiadId !== olympiad._id) {
      throw new ConvexError('Fase não encontrada');
    }
    await ctx.db.patch(existing._id, { name, date: args.date, resultRelease: args.resultRelease });
    if (becameConfirmed(existing.date, args.date)) {
      await notifyDateConfirmed(ctx, olympiad, name, args.date, existing._id);
    }
    if (becameConfirmed(existing.resultRelease, args.resultRelease)) {
      await notifyDateConfirmed(
        ctx,
        olympiad,
        `divulgação do resultado da ${name}`,
        args.resultRelease!,
        existing._id
      );
    }
    return existing._id;
  },
});

export const deletePhase = mutation({
  args: { phaseId: v.id('phases') },
  handler: async (ctx, args) => {
    await requireEquipe(ctx);
    const phase = await ctx.db.get(args.phaseId);
    if (!phase) {
      return null;
    }
    await ctx.db.delete(phase._id);
    return null;
  },
});

function toEstimate(info: DateInfo | undefined): DateInfo | undefined {
  if (!info) {
    return undefined;
  }
  const month = info.start ? Number(info.start.slice(5, 7)) : info.estimateMonth;
  return { status: 'tbc', estimateMonth: month, note: info.note };
}

/**
 * Abre uma Temporada: copies the previous year's Lista oficial with every date "a confirmar"
 * and last year's month as the estimate.
 */
export const openSeason = mutation({
  args: { year: v.number() },
  handler: async (ctx, args) => {
    await requireEquipe(ctx);
    return await openSeasonFromPrevious(ctx, args.year);
  },
});

export async function openSeasonFromPrevious(ctx: MutationCtx, year: number) {
  const existing = await ctx.db
    .query('seasons')
    .withIndex('by_year', (q) => q.eq('year', year))
    .unique();
  if (existing) {
    throw new ConvexError(`A temporada ${year} já está aberta`);
  }
  await ctx.db.insert('seasons', { year, openedAt: Date.now() });
  const previous = (await loadSeasonOlympiads(ctx, year - 1, null)).filter((o) => !o.ownerId);
  for (const olympiad of previous) {
    const { _id, _creationTime, ...fields } = olympiad;
    const olympiadId = await ctx.db.insert('olympiads', {
      ...fields,
      season: year,
      registrationDeadline: toEstimate(fields.registrationDeadline),
      updatedAt: Date.now(),
    });
    for (const phase of await loadPhases(ctx, _id)) {
      await ctx.db.insert('phases', {
        olympiadId,
        order: phase.order,
        name: phase.name,
        date: toEstimate(phase.date)!,
        resultRelease: toEstimate(phase.resultRelease),
      });
    }
  }
  return previous.length;
}
