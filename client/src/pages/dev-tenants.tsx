import { Link } from '@tanstack/react-router';
import { useTenantsData } from '@djpanda/convex-tenants/react';
import { useConvex, useQuery } from 'convex/react';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrganizationContextControl } from '@/components/organization-context-control';
import { useAppForm } from '@/components/form';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

const crossOrgProbeSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID is required'),
  todoId: z.string().min(1, 'Todo ID is required'),
});

type CrossOrgProbeValues = z.infer<typeof crossOrgProbeSchema>;

export function DevTenantsPage() {
  const isPlatformAdmin = useQuery(api.platform.isCurrentUserPlatformAdmin, {});
  const { currentOrganization } = useTenantsData();
  const orgId = currentOrganization?._id;
  const convex = useConvex();
  const todos = useQuery(api.todos.list, orgId ? { organizationId: orgId } : 'skip');
  const [probeResult, setProbeResult] = useState<string>('idle');

  const probeForm = useAppForm<CrossOrgProbeValues>({
    defaultValues: {
      organizationId: '',
      todoId: '',
    },
    onSubmit: async ({ value }) => {
      const result = await convex.query(api.testing.e2e.probeOrgResource, {
        organizationId: value.organizationId,
        todoId: value.todoId as Id<'todos'>,
      });
      setProbeResult(JSON.stringify(result));
    },
  });

  return (
    <div className="container space-y-6 px-4 py-8 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dev tenants</h1>
          <p className="text-sm text-muted-foreground">Tenant isolation probe page.</p>
        </div>
        <Link to="/">
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div data-testid="tenant-current-org-id">Org ID: {orgId ?? 'none'}</div>
          <div data-testid="tenant-current-org-name">
            Org name: {currentOrganization?.name ?? 'none'}
          </div>
          <div data-testid="tenant-org-switcher">
            <OrganizationContextControl isPlatformAdmin={Boolean(isPlatformAdmin)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visible todos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(todos ?? []).map((todo) => (
            <div
              key={todo._id}
              className="rounded-md border px-3 py-2 text-sm"
              data-testid="tenant-todo-row"
            >
              {todo.title} · {todo.organizationId}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cross-org probe</CardTitle>
        </CardHeader>
        <CardContent>
          <probeForm.FormShell className="gap-3">
            <probeForm.fields.Text
              name="organizationId"
              placeholder="Other org ID"
              validation={crossOrgProbeSchema.shape.organizationId}
            />
            <probeForm.fields.Text
              name="todoId"
              placeholder="Other org todo ID"
              validation={crossOrgProbeSchema.shape.todoId}
            />
            <probeForm.SubmitButton data-testid="probe-other-org">
              Probe access
            </probeForm.SubmitButton>
          </probeForm.FormShell>
          <div data-testid="probe-result" className="mt-3 text-sm text-muted-foreground">
            {probeResult}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
