import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
  canAccessOrgTodo,
  getOrgScopedTodo,
  requireOrgPermission,
  requireOrgTodoAccess,
} from './lib/orgAccess';
import { resolveActingUserId } from './lib/auth';
import { GUEST_EMPTY_PAGE } from './lib/guestQuery';

const priorityValidator = v.union(v.literal('low'), v.literal('medium'), v.literal('high'));

const filterOperatorValidator = v.union(
  v.literal('eq'),
  v.literal('neq'),
  v.literal('contains'),
  v.literal('startsWith'),
  v.literal('endsWith'),
  v.literal('gt'),
  v.literal('gte'),
  v.literal('lt'),
  v.literal('lte'),
  v.literal('in'),
  v.literal('isEmpty'),
  v.literal('isNotEmpty')
);

const queryStateValidator = v.object({
  sorting: v.array(
    v.object({
      columnId: v.string(),
      direction: v.union(v.literal('asc'), v.literal('desc')),
    })
  ),
  filters: v.array(
    v.object({
      columnId: v.string(),
      op: filterOperatorValidator,
      value: v.union(v.string(), v.number(), v.boolean(), v.null(), v.array(v.string())),
    })
  ),
  pageSize: v.number(),
  cursor: v.union(v.string(), v.null()),
});

const rowPatchValidator = v.object({
  rowId: v.id('todos'),
  patch: v.object({
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(priorityValidator),
    dueDate: v.optional(v.union(v.string(), v.null())),
    completed: v.optional(v.boolean()),
  }),
});

const tableRowValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  priority: priorityValidator,
  dueDate: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  completed: v.boolean(),
});

function normalizeText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function parseDateString(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function getTodoFieldValue(
  todo: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: number;
    createdAt: number;
    updatedAt: number;
    completed: boolean;
  },
  columnId: string
) {
  switch (columnId) {
    case 'title':
      return todo.title;
    case 'description':
      return todo.description ?? '';
    case 'priority':
      return todo.priority;
    case 'dueDate':
      return todo.dueDate ?? null;
    case 'createdAt':
      return todo.createdAt;
    case 'updatedAt':
      return todo.updatedAt;
    case 'completed':
      return todo.completed;
    default:
      return null;
  }
}

function compareValues(left: unknown, right: unknown) {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return 1;
  }

  if (right === null || right === undefined) {
    return -1;
  }

  if (typeof left === 'string' && typeof right === 'string') {
    return left.localeCompare(right, undefined, { sensitivity: 'base' });
  }

  if (typeof left === 'boolean' && typeof right === 'boolean') {
    return Number(left) - Number(right);
  }

  return Number(left) - Number(right);
}

function matchesFilter(
  todo: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: number;
    createdAt: number;
    updatedAt: number;
    completed: boolean;
  },
  filter: {
    columnId: string;
    op:
      | 'eq'
      | 'neq'
      | 'contains'
      | 'startsWith'
      | 'endsWith'
      | 'gt'
      | 'gte'
      | 'lt'
      | 'lte'
      | 'in'
      | 'isEmpty'
      | 'isNotEmpty';
    value: string | number | boolean | null | string[];
  }
) {
  const actual = getTodoFieldValue(todo, filter.columnId);
  const isEmpty = actual === null || actual === undefined || actual === '';

  switch (filter.op) {
    case 'eq':
      return compareValues(actual, filter.value) === 0;
    case 'neq':
      return compareValues(actual, filter.value) !== 0;
    case 'contains':
      return String(actual ?? '')
        .toLowerCase()
        .includes(String(filter.value).toLowerCase());
    case 'startsWith':
      return String(actual ?? '')
        .toLowerCase()
        .startsWith(String(filter.value).toLowerCase());
    case 'endsWith':
      return String(actual ?? '')
        .toLowerCase()
        .endsWith(String(filter.value).toLowerCase());
    case 'gt':
      return compareValues(actual, filter.value) > 0;
    case 'gte':
      return compareValues(actual, filter.value) >= 0;
    case 'lt':
      return compareValues(actual, filter.value) < 0;
    case 'lte':
      return compareValues(actual, filter.value) <= 0;
    case 'in':
      return Array.isArray(filter.value) ? filter.value.includes(String(actual ?? '')) : false;
    case 'isEmpty':
      return isEmpty;
    case 'isNotEmpty':
      return !isEmpty;
    default:
      return true;
  }
}

export const list = query({
  args: {
    organizationId: v.string(),
    completed: v.optional(v.boolean()),
    priority: v.optional(priorityValidator),
  },
  handler: async (ctx, args) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return [];
    }
    await requireOrgPermission(ctx, args.organizationId, 'todos:read', userId);

    let todos = await ctx.db
      .query('todos')
      .withIndex('by_org', (q) => q.eq('organizationId', args.organizationId))
      .collect();

    if (args.completed !== undefined) {
      todos = todos.filter((todo) => todo.completed === args.completed);
    }
    if (args.priority !== undefined) {
      todos = todos.filter((todo) => todo.priority === args.priority);
    }

    return todos.toSorted((left, right) => right.createdAt - left.createdAt);
  },
});

export const listPage = query({
  args: {
    organizationId: v.string(),
    paginationOpts: paginationOptsValidator,
    state: queryStateValidator,
  },
  handler: async (ctx, args) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return GUEST_EMPTY_PAGE;
    }
    await requireOrgPermission(ctx, args.organizationId, 'todos:read', userId);

    const todos = await ctx.db
      .query('todos')
      .withIndex('by_org', (q) => q.eq('organizationId', args.organizationId))
      .collect();

    const filteredTodos = todos.filter((todo) =>
      args.state.filters.every((filter) => matchesFilter(todo, filter))
    );

    const sortedTodos = [...filteredTodos].toSorted((left, right) => {
      for (const sort of args.state.sorting) {
        const result = compareValues(
          getTodoFieldValue(left, sort.columnId),
          getTodoFieldValue(right, sort.columnId)
        );
        if (result !== 0) {
          return sort.direction === 'asc' ? result : -result;
        }
      }

      return right.createdAt - left.createdAt;
    });

    const start = Number.parseInt(args.paginationOpts.cursor ?? '0', 10);
    const safeStart = Number.isNaN(start) ? 0 : start;
    const page = sortedTodos.slice(safeStart, safeStart + args.paginationOpts.numItems);
    const nextOffset = safeStart + page.length;
    const isDone = nextOffset >= sortedTodos.length;

    return {
      page,
      continueCursor: String(nextOffset),
      isDone,
    };
  },
});

export const get = query({
  args: { id: v.id('todos'), organizationId: v.string() },
  handler: async (ctx, args) => {
    const userId = await resolveActingUserId(ctx);
    if (!userId) {
      return null;
    }

    const scoped = getOrgScopedTodo(await ctx.db.get(args.id), args.organizationId);
    if (!scoped) {
      return null;
    }

    const allowed = await canAccessOrgTodo(
      ctx,
      args.organizationId,
      userId,
      scoped.createdBy,
      'read'
    );
    return allowed ? scoped.todo : null;
  },
});

export const create = mutation({
  args: {
    organizationId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    priority: priorityValidator,
    dueDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const userId = await requireOrgPermission(ctx, args.organizationId, 'todos:create');

    const now = Date.now();
    return await ctx.db.insert('todos', {
      organizationId: args.organizationId,
      userId,
      createdBy: userId,
      title: args.title,
      description: args.description,
      priority: args.priority,
      dueDate: args.dueDate,
      completed: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createForTable = mutation({
  args: {
    organizationId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(priorityValidator),
    dueDate: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireOrgPermission(ctx, args.organizationId, 'todos:create');

    const now = Date.now();
    const id = await ctx.db.insert('todos', {
      organizationId: args.organizationId,
      userId,
      createdBy: userId,
      title: normalizeText(args.title) ?? 'Untitled todo',
      description: normalizeText(args.description),
      priority: args.priority ?? 'medium',
      dueDate: parseDateString(args.dueDate),
      completed: false,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    organizationId: v.string(),
    id: v.id('todos'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    priority: v.optional(priorityValidator),
    dueDate: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    await requireOrgTodoAccess(ctx, args.organizationId, args.id, 'update');

    const { id, organizationId: _organizationId, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(id);
  },
});

export const updateBatch = mutation({
  args: {
    organizationId: v.string(),
    changes: v.array(rowPatchValidator),
  },
  handler: async (ctx, args) => {
    for (const change of args.changes) {
      await requireOrgTodoAccess(ctx, args.organizationId, change.rowId, 'update');

      await ctx.db.patch(change.rowId, {
        title:
          change.patch.title === undefined
            ? undefined
            : (normalizeText(change.patch.title) ?? 'Untitled todo'),
        description:
          change.patch.description === undefined
            ? undefined
            : normalizeText(change.patch.description),
        priority: change.patch.priority,
        dueDate:
          change.patch.dueDate === undefined ? undefined : parseDateString(change.patch.dueDate),
        completed: change.patch.completed,
        updatedAt: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { organizationId: v.string(), id: v.id('todos') },
  handler: async (ctx, args) => {
    await requireOrgTodoAccess(ctx, args.organizationId, args.id, 'delete');
    await ctx.db.delete(args.id);
  },
});

export const deleteBatch = mutation({
  args: {
    organizationId: v.string(),
    rowIds: v.array(v.id('todos')),
  },
  handler: async (ctx, args) => {
    for (const rowId of args.rowIds) {
      await requireOrgTodoAccess(ctx, args.organizationId, rowId, 'delete');
      await ctx.db.delete(rowId);
    }
  },
});

export const restoreBatch = mutation({
  args: {
    organizationId: v.string(),
    rows: v.array(tableRowValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireOrgPermission(ctx, args.organizationId, 'todos:create');

    for (const row of args.rows) {
      await ctx.db.insert('todos', {
        organizationId: args.organizationId,
        userId,
        createdBy: userId,
        title: normalizeText(row.title) ?? 'Untitled todo',
        description: normalizeText(row.description),
        priority: row.priority,
        dueDate: parseDateString(row.dueDate),
        createdAt: parseDateString(row.createdAt) ?? Date.now(),
        updatedAt: parseDateString(row.updatedAt) ?? Date.now(),
        completed: row.completed,
      });
    }
  },
});

export const toggleComplete = mutation({
  args: { organizationId: v.string(), id: v.id('todos') },
  handler: async (ctx, args) => {
    const { scoped } = await requireOrgTodoAccess(ctx, args.organizationId, args.id, 'update');

    await ctx.db.patch(args.id, {
      completed: !scoped.todo.completed,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(args.id);
  },
});
