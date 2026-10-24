import { ConvexError, v } from 'convex/values';
import { mutation } from './_generated/server';
import { requireUserId } from './lib/auth';
import { devFormSchema } from './devFormSchemas';
import { VALIDATION_ERROR_CODE, validationErrorPayload } from './lib/forms';

const stepItemValidator = v.object({
  id: v.string(),
  label: v.string(),
});

export const submitDevForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    bio: v.string(),
    content: v.string(),
    age: v.number(),
    role: v.union(v.literal('admin'), v.literal('member')),
    tags: v.array(v.union(v.literal('frontend'), v.literal('backend'), v.literal('design'))),
    accessLevel: v.union(v.literal('read'), v.literal('write')),
    channels: v.array(v.union(v.literal('email'), v.literal('slack'), v.literal('sms'))),
    notifyByEmail: v.boolean(),
    notificationFrequency: v.union(
      v.literal('instant'),
      v.literal('daily'),
      v.literal('weekly'),
      v.null()
    ),
    acceptTerms: v.boolean(),
    startDate: v.string(),
    brandColor: v.string(),
    steps: v.array(stepItemValidator),
    attachmentId: v.optional(v.union(v.string(), v.null())),
    isAdult: v.boolean(),
  },
  returns: v.object({
    ok: v.literal(true),
    submitted: v.object({
      notifyByEmail: v.boolean(),
      notificationFrequency: v.union(
        v.literal('instant'),
        v.literal('daily'),
        v.literal('weekly'),
        v.null()
      ),
    }),
  }),
  handler: async (ctx, args) => {
    await requireUserId(ctx);

    if (args.email === 'server-error@example.com') {
      throw new ConvexError({
        code: VALIDATION_ERROR_CODE,
        fields: { email: 'Email already taken' },
      });
    }

    const parsed = devFormSchema.safeParse(args);
    if (!parsed.success) {
      throw new ConvexError(validationErrorPayload(parsed.error));
    }
    return {
      ok: true as const,
      submitted: {
        notifyByEmail: parsed.data.notifyByEmail,
        notificationFrequency: parsed.data.notificationFrequency,
      },
    };
  },
});
