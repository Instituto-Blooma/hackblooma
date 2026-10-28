import { defineSchema, defineTable } from 'convex/server';
import { authTables } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import {
  awardValidator,
  dateInfoValidator,
  eligibilityValidator,
  gradeValidator,
  outcomeValidator,
  schoolTypeValidator,
} from './lib/olimpiadas';

const schema = defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),
    onboardingStatus: v.optional(
      v.union(v.literal('pending'), v.literal('invited'), v.literal('active'))
    ),
    invitedAt: v.optional(v.number()),
    activatedAt: v.optional(v.number()),
    // Perfil escolar (CONTEXT.md)
    grade: v.optional(gradeValidator),
    schoolType: v.optional(schoolTypeValidator),
    pushPromptDismissedAt: v.optional(v.number()),
  })
    .index('email', ['email'])
    .index('phone', ['phone']),

  impersonationSessions: defineTable({
    adminUserId: v.id('users'),
    targetUserId: v.id('users'),
    startedAt: v.number(),
    expiresAt: v.number(),
    endedAt: v.optional(v.number()),
  }).index('by_admin', ['adminUserId']),

  todos: defineTable({
    organizationId: v.string(),
    userId: v.id('users'),
    createdBy: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    dueDate: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_org', ['organizationId'])
    .index('by_org_and_user', ['organizationId', 'userId'])
    .index('by_user', ['userId'])
    .index('by_user_and_completed', ['userId', 'completed'])
    .index('by_user_and_priority', ['userId', 'priority']),

  // Temporada: one year of olympiads opened by the Equipe Blooma.
  seasons: defineTable({
    year: v.number(),
    openedAt: v.number(),
  }).index('by_year', ['year']),

  // Olimpíada in a Temporada. `ownerId` set = Olimpíada extra (only that menina sees it).
  olympiads: defineTable({
    season: v.number(),
    /** Stable key across temporadas, used for Caminho links and copying seasons. */
    key: v.string(),
    name: v.string(),
    acronym: v.string(),
    area: v.string(),
    website: v.optional(v.string()),
    registrationDeadline: v.optional(dateInfoValidator),
    /** Shown instead of a deadline, e.g. "Por convite (via Jacob Palis)". */
    registrationNote: v.optional(v.string()),
    eligibility: v.optional(eligibilityValidator),
    /** Caminho: keys of olympiads this one can lead to. */
    leadsTo: v.array(v.string()),
    ownerId: v.optional(v.id('users')),
    updatedAt: v.number(),
  })
    .index('by_season_and_key', ['season', 'key'])
    .index('by_owner_and_season', ['ownerId', 'season']),

  phases: defineTable({
    olympiadId: v.id('olympiads'),
    order: v.number(),
    name: v.string(),
    date: dateInfoValidator,
    resultRelease: v.optional(dateInfoValidator),
  }).index('by_olympiad_and_order', ['olympiadId', 'order']),

  participations: defineTable({
    userId: v.id('users'),
    olympiadId: v.id('olympiads'),
    season: v.number(),
    status: v.union(v.literal('planned'), v.literal('registered')),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user_and_season', ['userId', 'season'])
    .index('by_user_and_olympiad', ['userId', 'olympiadId'])
    .index('by_olympiad', ['olympiadId'])
    .index('by_season_and_status', ['season', 'status']),

  results: defineTable({
    userId: v.id('users'),
    olympiadId: v.id('olympiads'),
    phaseId: v.id('phases'),
    season: v.number(),
    outcome: outcomeValidator,
    award: v.optional(awardValidator),
    score: v.optional(v.string()),
    notes: v.optional(v.string()),
    recordedAt: v.number(),
  })
    .index('by_user_and_phase', ['userId', 'phaseId'])
    .index('by_user_and_olympiad', ['userId', 'olympiadId'])
    .index('by_user_and_season', ['userId', 'season'])
    .index('by_recordedAt', ['recordedAt']),

  avisos: defineTable({
    userId: v.id('users'),
    kind: v.union(
      v.literal('prazo'),
      v.literal('fase'),
      v.literal('divulgacao'),
      v.literal('data_confirmada'),
      v.literal('caminho')
    ),
    olympiadId: v.id('olympiads'),
    phaseId: v.optional(v.id('phases')),
    title: v.string(),
    body: v.string(),
    dedupeKey: v.string(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index('by_user_and_createdAt', ['userId', 'createdAt'])
    .index('by_user_and_dedupeKey', ['userId', 'dedupeKey']),

  pushSubscriptions: defineTable({
    userId: v.id('users'),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_endpoint', ['endpoint']),

  collabMarkdown: defineTable({
    organizationId: v.string(),
    documentId: v.string(),
    markdown: v.string(),
    updatedAt: v.number(),
    updatedBy: v.id('users'),
  })
    .index('by_documentId', ['documentId'])
    .index('by_org_and_document', ['organizationId', 'documentId']),
});

export default schema;
