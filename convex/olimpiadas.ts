import { ConvexError, v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import { requireUserId, resolveActingUserId } from './lib/auth';
import { createAviso } from './lib/avisos';
import { isEquipe } from './lib/equipe';
import {
  awardValidator,
  checkEligibility,
  dateInfoValidator,
  eligibilityTags,
  gradeValidator,
  outcomeValidator,
  schoolTypeValidator,
  sortKey,
  visiblePhases,
  type DateInfo,
} from './lib/olimpiadas';

const MAX_OLYMPIADS_PER_SEASON = 300;
const MAX_PHASES_PER_OLYMPIAD = 10;

export async function loadPhases(ctx: QueryCtx | MutationCtx, olympiadId: Id<'olympiads'>) {
  return await ctx.db
    .query('phases')
    .withIndex('by_olympiad_and_order', (q) => q.eq('olympiadId', olympiadId))
    .take(MAX_PHASES_PER_OLYMPIAD);
}

/** Official olympiads of a season plus the viewer's own Olimpíadas extras. */
export async function loadSeasonOlympiads(
  ctx: QueryCtx | MutationCtx,
  season: number,
  viewerId: Id<'users'> | null
) {
  const all = await ctx.db
    .query('olympiads')
    .withIndex('by_season_and_key', (q) => q.eq('season', season))
    .take(MAX_OLYMPIADS_PER_SEASON);
  return all.filter((olympiad) => !olympiad.ownerId || olympiad.ownerId === viewerId);
}

async function loadMyResults(ctx: QueryCtx | MutationCtx, userId: Id<'users'>, season: number) {
  return await ctx.db
    .query('results')
    .withIndex('by_user_and_season', (q) => q.eq('userId', userId).eq('season', season))
    .take(500);
}

async function loadMyParticipations(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  season: number
) {
  return await ctx.db
    .query('participations')
    .withIndex('by_user_and_season', (q) => q.eq('userId', userId).eq('season', season))
    .take(MAX_OLYMPIADS_PER_SEASON);
}

async function requireVisibleOlympiad(
  ctx: QueryCtx | MutationCtx,
  olympiadId: Id<'olympiads'>,
  userId: Id<'users'>
) {
  const olympiad = await ctx.db.get(olympiadId);
  if (!olympiad || (olympiad.ownerId && olympiad.ownerId !== userId)) {
    throw new ConvexError('Olimpíada não encontrada');
  }
  return olympiad;
}

export type CalendarEvent = {
  kind: 'prazo' | 'fase' | 'divulgacao';
  olympiadId: Id<'olympiads'>;
  phaseId?: Id<'phases'>;
  acronym: string;
  name: string;
  title: string;
  date: DateInfo;
  sortKey: string;
  participationStatus: 'planned' | 'registered' | null;
};

/** Every dated moment of one olympiad for one menina (respecting which Fases she can see). */
export function eventsFor(
  olympiad: Doc<'olympiads'>,
  phases: Doc<'phases'>[],
  results: Array<{ phaseId: string; outcome: Doc<'results'>['outcome'] }>,
  participationStatus: 'planned' | 'registered' | null
): CalendarEvent[] {
  const label = olympiad.acronym || olympiad.name;
  const base = {
    olympiadId: olympiad._id,
    acronym: label,
    name: olympiad.name,
    participationStatus,
  };
  const events: CalendarEvent[] = [];
  if (olympiad.registrationDeadline) {
    events.push({
      ...base,
      kind: 'prazo',
      title: `Prazo de inscrição · ${label}`,
      date: olympiad.registrationDeadline,
      sortKey: sortKey(olympiad.registrationDeadline, olympiad.season),
    });
  }
  for (const phase of visiblePhases(phases, results)) {
    events.push({
      ...base,
      kind: 'fase',
      phaseId: phase._id,
      title: `${phase.name} · ${label}`,
      date: phase.date,
      sortKey: sortKey(phase.date, olympiad.season),
    });
    if (phase.resultRelease) {
      events.push({
        ...base,
        kind: 'divulgacao',
        phaseId: phase._id,
        title: `Divulgação do resultado · ${phase.name} · ${label}`,
        date: phase.resultRelease,
        sortKey: sortKey(phase.resultRelease, olympiad.season),
      });
    }
  }
  return events;
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return {
      _id: user._id,
      name: user.name ?? null,
      email: user.email ?? null,
      image: user.image ?? null,
      grade: user.grade ?? null,
      schoolType: user.schoolType ?? null,
      pushPromptDismissedAt: user.pushPromptDismissedAt ?? null,
      isEquipe: await isEquipe(ctx, userId),
    };
  },
});

export const listSeasons = query({
  args: {},
  handler: async (ctx) => {
    const seasons = await ctx.db.query('seasons').withIndex('by_year').order('desc').take(20);
    return seasons.map((season) => season.year);
  },
});

export const updateSchoolProfile = mutation({
  args: { grade: gradeValidator, schoolType: schoolTypeValidator },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await ctx.db.patch(userId, { grade: args.grade, schoolType: args.schoolType });
    return null;
  },
});

export const dismissPushPrompt = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    await ctx.db.patch(userId, { pushPromptDismissedAt: Date.now() });
    return null;
  },
});

/** Lista oficial of a Temporada, split into "Para você" and the rest. */
export const listForSeason = query({
  args: { season: v.number() },
  handler: async (ctx, args) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    const profile = { grade: user?.grade, schoolType: user?.schoolType };
    const [olympiads, participations] = await Promise.all([
      loadSeasonOlympiads(ctx, args.season, userId),
      loadMyParticipations(ctx, userId, args.season),
    ]);
    const rows = await Promise.all(
      olympiads.map(async (olympiad) => {
        const phases = await loadPhases(ctx, olympiad._id);
        const firstPhase = phases.toSorted((a, b) => a.order - b.order)[0];
        const participation = participations.find((entry) => entry.olympiadId === olympiad._id);
        const eligibility = olympiad.ownerId
          ? { eligible: true, reasons: [] }
          : checkEligibility(olympiad.eligibility, profile);
        return {
          _id: olympiad._id,
          name: olympiad.name,
          acronym: olympiad.acronym,
          area: olympiad.area,
          website: olympiad.website ?? null,
          isExtra: Boolean(olympiad.ownerId),
          registrationDeadline: olympiad.registrationDeadline ?? null,
          registrationNote: olympiad.registrationNote ?? null,
          firstPhase: firstPhase ? { name: firstPhase.name, date: firstPhase.date } : null,
          tags: eligibilityTags(olympiad.eligibility),
          eligible: eligibility.eligible,
          reasons: eligibility.reasons,
          participationStatus: participation?.status ?? null,
          sortKey: sortKey(firstPhase?.date ?? olympiad.registrationDeadline, args.season),
        };
      })
    );
    rows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return {
      hasProfile: Boolean(profile.grade && profile.schoolType),
      rows,
    };
  },
});

export const get = query({
  args: { olympiadId: v.id('olympiads') },
  handler: async (ctx, args) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return null;
    }
    const olympiad = await ctx.db.get(args.olympiadId);
    if (!olympiad || (olympiad.ownerId && olympiad.ownerId !== userId)) {
      return null;
    }
    const user = await ctx.db.get(userId);
    const [phases, participation, results] = await Promise.all([
      loadPhases(ctx, olympiad._id),
      ctx.db
        .query('participations')
        .withIndex('by_user_and_olympiad', (q) =>
          q.eq('userId', userId).eq('olympiadId', olympiad._id)
        )
        .unique(),
      ctx.db
        .query('results')
        .withIndex('by_user_and_olympiad', (q) =>
          q.eq('userId', userId).eq('olympiadId', olympiad._id)
        )
        .take(MAX_PHASES_PER_OLYMPIAD),
    ]);
    const shown = visiblePhases(phases, results);
    const caminho = await Promise.all(
      olympiad.leadsTo.map(async (key) => {
        const target = await ctx.db
          .query('olympiads')
          .withIndex('by_season_and_key', (q) => q.eq('season', olympiad.season).eq('key', key))
          .first();
        return target && !target.ownerId
          ? { _id: target._id, acronym: target.acronym, name: target.name }
          : null;
      })
    );
    const leadsHere = await ctx.db
      .query('olympiads')
      .withIndex('by_season_and_key', (q) => q.eq('season', olympiad.season))
      .take(MAX_OLYMPIADS_PER_SEASON);
    const eligibility = olympiad.ownerId
      ? { eligible: true, reasons: [] }
      : checkEligibility(olympiad.eligibility, {
          grade: user?.grade,
          schoolType: user?.schoolType,
        });
    return {
      olympiad: {
        _id: olympiad._id,
        season: olympiad.season,
        name: olympiad.name,
        acronym: olympiad.acronym,
        area: olympiad.area,
        website: olympiad.website ?? null,
        isExtra: Boolean(olympiad.ownerId),
        registrationDeadline: olympiad.registrationDeadline ?? null,
        registrationNote: olympiad.registrationNote ?? null,
        tags: eligibilityTags(olympiad.eligibility),
        eligibilityNote: olympiad.eligibility?.note ?? null,
      },
      eligible: eligibility.eligible,
      reasons: eligibility.reasons,
      participationStatus: participation?.status ?? null,
      phases: shown.map((phase) => ({
        _id: phase._id,
        name: phase.name,
        order: phase.order,
        date: phase.date,
        resultRelease: phase.resultRelease ?? null,
        result: results.find((result) => result.phaseId === phase._id) ?? null,
      })),
      hiddenPhaseCount: phases.length - shown.length,
      caminho: caminho.filter((entry) => entry !== null),
      comesFrom: leadsHere
        .filter((entry) => !entry.ownerId && entry.leadsTo.includes(olympiad.key))
        .map((entry) => ({ _id: entry._id, acronym: entry.acronym, name: entry.name })),
    };
  },
});

export const setParticipation = mutation({
  args: {
    olympiadId: v.id('olympiads'),
    status: v.union(v.literal('planned'), v.literal('registered'), v.literal('none')),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const olympiad = await requireVisibleOlympiad(ctx, args.olympiadId, userId);
    const existing = await ctx.db
      .query('participations')
      .withIndex('by_user_and_olympiad', (q) =>
        q.eq('userId', userId).eq('olympiadId', olympiad._id)
      )
      .unique();
    const now = Date.now();
    if (args.status === 'none') {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return null;
    }
    if (existing) {
      await ctx.db.patch(existing._id, { status: args.status, updatedAt: now });
    } else {
      await ctx.db.insert('participations', {
        userId,
        olympiadId: olympiad._id,
        season: olympiad.season,
        status: args.status,
        createdAt: now,
        updatedAt: now,
      });
    }
    return null;
  },
});

export const recordResult = mutation({
  args: {
    phaseId: v.id('phases'),
    outcome: outcomeValidator,
    award: v.optional(awardValidator),
    score: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const phase = await ctx.db.get(args.phaseId);
    if (!phase) {
      throw new ConvexError('Fase não encontrada');
    }
    const olympiad = await requireVisibleOlympiad(ctx, phase.olympiadId, userId);
    const fields = {
      outcome: args.outcome,
      award: args.award,
      score: args.score?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      recordedAt: Date.now(),
    };
    const existing = await ctx.db
      .query('results')
      .withIndex('by_user_and_phase', (q) => q.eq('userId', userId).eq('phaseId', phase._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert('results', {
        userId,
        olympiadId: olympiad._id,
        phaseId: phase._id,
        season: olympiad.season,
        ...fields,
      });
    }

    // Recording a result implies she took part.
    const participation = await ctx.db
      .query('participations')
      .withIndex('by_user_and_olympiad', (q) =>
        q.eq('userId', userId).eq('olympiadId', olympiad._id)
      )
      .unique();
    if (!participation) {
      await ctx.db.insert('participations', {
        userId,
        olympiadId: olympiad._id,
        season: olympiad.season,
        status: 'registered',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else if (participation.status === 'planned') {
      await ctx.db.patch(participation._id, { status: 'registered', updatedAt: Date.now() });
    }

    const wentWell = args.outcome === 'advanced' || Boolean(args.award);
    if (wentWell) {
      for (const key of olympiad.leadsTo) {
        const target = await ctx.db
          .query('olympiads')
          .withIndex('by_season_and_key', (q) => q.eq('season', olympiad.season).eq('key', key))
          .first();
        if (!target || target.ownerId) {
          continue;
        }
        await createAviso(ctx, {
          userId,
          kind: 'caminho',
          olympiadId: target._id,
          title: `${target.acronym}: confira se você foi convidada!`,
          body: `Seu resultado em ${olympiad.acronym} pode abrir caminho para ${target.name}. Confira no site oficial.`,
          dedupeKey: `caminho:${phase._id}:${target._id}`,
        });
      }
    }
    return null;
  },
});

export const deleteResult = mutation({
  args: { phaseId: v.id('phases') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('results')
      .withIndex('by_user_and_phase', (q) => q.eq('userId', userId).eq('phaseId', args.phaseId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

export const createExtra = mutation({
  args: {
    season: v.number(),
    name: v.string(),
    acronym: v.optional(v.string()),
    area: v.string(),
    website: v.optional(v.string()),
    registrationDeadline: v.optional(dateInfoValidator),
    firstPhaseDate: dateInfoValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.name.trim();
    if (!name) {
      throw new ConvexError('Dê um nome para a olimpíada');
    }
    const now = Date.now();
    const olympiadId = await ctx.db.insert('olympiads', {
      season: args.season,
      key: `extra-${userId}-${now}`,
      name,
      acronym: args.acronym?.trim() || name,
      area: args.area.trim() || 'Outra',
      website: args.website?.trim() || undefined,
      registrationDeadline: args.registrationDeadline,
      leadsTo: [],
      ownerId: userId,
      updatedAt: now,
    });
    await ctx.db.insert('phases', {
      olympiadId,
      order: 1,
      name: '1ª fase',
      date: args.firstPhaseDate,
    });
    await ctx.db.insert('participations', {
      userId,
      olympiadId,
      season: args.season,
      status: 'planned',
      createdAt: now,
      updatedAt: now,
    });
    return olympiadId;
  },
});

export const deleteExtra = mutation({
  args: { olympiadId: v.id('olympiads') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const olympiad = await ctx.db.get(args.olympiadId);
    if (!olympiad || olympiad.ownerId !== userId) {
      throw new ConvexError('Só dá para apagar as suas olimpíadas extras');
    }
    for (const phase of await loadPhases(ctx, olympiad._id)) {
      await ctx.db.delete(phase._id);
    }
    const participations = await ctx.db
      .query('participations')
      .withIndex('by_olympiad', (q) => q.eq('olympiadId', olympiad._id))
      .take(10);
    for (const participation of participations) {
      await ctx.db.delete(participation._id);
    }
    const results = await ctx.db
      .query('results')
      .withIndex('by_user_and_olympiad', (q) =>
        q.eq('userId', userId).eq('olympiadId', olympiad._id)
      )
      .take(MAX_PHASES_PER_OLYMPIAD);
    for (const result of results) {
      await ctx.db.delete(result._id);
    }
    await ctx.db.delete(olympiad._id);
    return null;
  },
});

/** All dated moments of the menina's Participações in the given seasons. */
async function myEvents(ctx: QueryCtx, userId: Id<'users'>, seasons: number[]) {
  const events: CalendarEvent[] = [];
  for (const season of seasons) {
    const [participations, results] = await Promise.all([
      loadMyParticipations(ctx, userId, season),
      loadMyResults(ctx, userId, season),
    ]);
    for (const participation of participations) {
      const olympiad = await ctx.db.get(participation.olympiadId);
      if (!olympiad) {
        continue;
      }
      const phases = await loadPhases(ctx, olympiad._id);
      events.push(
        ...eventsFor(
          olympiad,
          phases,
          results.filter((result) => result.olympiadId === olympiad._id),
          participation.status
        )
      );
    }
  }
  return events;
}

function eventIsAhead(event: CalendarEvent, today: string) {
  const last = event.date.end ?? event.date.start;
  if (event.date.status === 'confirmed' && last) {
    return last >= today;
  }
  return event.sortKey.slice(0, 7) >= today.slice(0, 7);
}

/** Próximos passos: what is coming up, plus Fases already done with no Resultado yet. */
export const proximosPassos = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return null;
    }
    const year = Number(args.today.slice(0, 4));
    const events = await myEvents(ctx, userId, [year, year + 1]);
    const results = [
      ...(await loadMyResults(ctx, userId, year)),
      ...(await loadMyResults(ctx, userId, year + 1)),
    ];

    const upcoming = events
      .filter((event) => {
        if (event.kind === 'prazo' && event.participationStatus === 'registered') {
          return false;
        }
        return eventIsAhead(event, args.today);
      })
      .toSorted((a, b) => a.sortKey.localeCompare(b.sortKey));

    const toRecord = events
      .filter((event) => {
        if (event.kind !== 'fase' || !event.phaseId || event.date.status !== 'confirmed') {
          return false;
        }
        const last = event.date.end ?? event.date.start;
        return (
          Boolean(last && last < args.today) && !results.some((r) => r.phaseId === event.phaseId)
        );
      })
      .toSorted((a, b) => b.sortKey.localeCompare(a.sortKey));

    const participationCount = (
      await Promise.all([
        loadMyParticipations(ctx, userId, year),
        loadMyParticipations(ctx, userId, year + 1),
      ])
    ).flat().length;

    return {
      participationCount,
      upcoming: upcoming.slice(0, 40),
      toRecord: toRecord.slice(0, 10),
    };
  },
});

/** Calendar: her Participações, or every official olympiad when `everything` is set. */
export const calendar = query({
  args: { season: v.number(), everything: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return null;
    }
    if (!args.everything) {
      return await myEvents(ctx, userId, [args.season]);
    }
    const [olympiads, participations, results] = await Promise.all([
      loadSeasonOlympiads(ctx, args.season, userId),
      loadMyParticipations(ctx, userId, args.season),
      loadMyResults(ctx, userId, args.season),
    ]);
    const events: CalendarEvent[] = [];
    for (const olympiad of olympiads) {
      const phases = await loadPhases(ctx, olympiad._id);
      const participation = participations.find((entry) => entry.olympiadId === olympiad._id);
      events.push(
        ...eventsFor(
          olympiad,
          phases,
          results.filter((result) => result.olympiadId === olympiad._id),
          participation?.status ?? null
        )
      );
    }
    return events;
  },
});

/** Histórico: every Resultado across Temporadas. */
export const historico = query({
  args: {},
  handler: async (ctx) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return null;
    }
    return await loadHistorico(ctx, userId);
  },
});

export async function loadHistorico(ctx: QueryCtx, userId: Id<'users'>) {
  const results = await ctx.db
    .query('results')
    .withIndex('by_user_and_season', (q) => q.eq('userId', userId))
    .order('desc')
    .take(500);
  const rows = await Promise.all(
    results.map(async (result) => {
      const [olympiad, phase] = await Promise.all([
        ctx.db.get(result.olympiadId),
        ctx.db.get(result.phaseId),
      ]);
      if (!olympiad || !phase) {
        return null;
      }
      return {
        _id: result._id,
        season: result.season,
        olympiadId: olympiad._id,
        acronym: olympiad.acronym,
        olympiadName: olympiad.name,
        area: olympiad.area,
        phaseName: phase.name,
        phaseOrder: phase.order,
        outcome: result.outcome,
        award: result.award ?? null,
        score: result.score ?? null,
        notes: result.notes ?? null,
        recordedAt: result.recordedAt,
      };
    })
  );
  return rows
    .filter((row) => row !== null)
    .toSorted((a, b) =>
      b.season !== a.season
        ? b.season - a.season
        : a.acronym.localeCompare(b.acronym) || a.phaseOrder - b.phaseOrder
    );
}
