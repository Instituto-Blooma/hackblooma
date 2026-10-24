import { useTenantsData } from '@djpanda/convex-tenants/react';
import { Link } from '@tanstack/react-router';
import { useQuery } from 'convex/react';
import { lazy, Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { api } from '../../../convex/_generated/api';
import { orgDocumentId } from '../../../convex/lib/collabIds';

const RichTextEditor = lazy(() => import('@/components/form/fields/rich-text-editor'));

const DOC_SLUG = 'richtext-collab-demo';

function hashHue(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 45%)`;
}

export function DevRichTextCollabPage() {
  const currentUser = useQuery(api.users.current, {});
  const { currentOrganization, isOrganizationsLoading } = useTenantsData();
  const { theme } = useTheme();
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const documentId = useMemo(() => {
    if (!currentOrganization?._id) {
      return null;
    }
    return orgDocumentId(currentOrganization._id, DOC_SLUG);
  }, [currentOrganization?._id]);

  const collabUser = useMemo(() => {
    if (!currentUser) {
      return null;
    }
    const name = currentUser.name ?? currentUser.email ?? 'Editor';
    return {
      userId: currentUser._id,
      name,
      color: hashHue(currentUser._id),
    };
  }, [currentUser]);

  return (
    <div className="container flex flex-col gap-6 px-4 py-8 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="dev-richtext-collab-title">
            Rich text collaboration
          </h1>
          <p className="text-sm text-muted-foreground">
            Live MDXEditor carets and facepile over `@talentum-ventures/convex-presence`.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/dev/form">Dev form</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Dashboard</Link>
          </Button>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Shared document</CardTitle>
          <CardDescription>
            Open this page in two browsers to see remote carets and the facepile. Authoritative
            content is the Yjs doc; markdown snapshots are eventually consistent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOrganizationsLoading || currentUser === undefined ? (
            <p className="text-sm text-muted-foreground">Loading workspace…</p>
          ) : null}

          {currentUser && !currentOrganization ? (
            <p className="text-sm text-muted-foreground" data-testid="dev-richtext-collab-no-org">
              Select an organization to open the shared editor.
            </p>
          ) : null}

          {documentId && collabUser ? (
            <Suspense
              fallback={
                <div
                  className="min-h-[200px] rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground"
                  data-testid="dev-richtext-collab-loading"
                >
                  Loading collaborative editor…
                </div>
              }
            >
              <RichTextEditor
                value=""
                onChange={() => undefined}
                isDark={isDark}
                placeholder="Start typing — peers will see your caret…"
                data-testid="dev-richtext-collab-editor"
                collab={{
                  documentId,
                  user: collabUser,
                }}
              />
            </Suspense>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
