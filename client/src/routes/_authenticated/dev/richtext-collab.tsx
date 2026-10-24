import { createFileRoute } from '@tanstack/react-router';
import { DevRichTextCollabPage } from '@/pages/dev-richtext-collab';
import { requireDevTools } from '@/lib/route-guards';

export const Route = createFileRoute('/_authenticated/dev/richtext-collab')({
  beforeLoad: () => {
    requireDevTools();
  },
  component: DevRichTextCollabPage,
});
