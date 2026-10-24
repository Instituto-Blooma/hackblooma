import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type InboxMessage = {
  id?: string;
  to?: string | string[];
  subject?: string;
  html?: string;
};

async function fetchInbox(): Promise<InboxMessage[]> {
  const response = await fetch('/resend-emulate/inbox');
  if (!response.ok) {
    throw new Error(`Failed to load inbox: ${response.status}`);
  }
  const payload = await response.json();
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.messages)) {
    return payload.messages;
  }
  return [];
}

export function DevInboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchInbox()
      .then(setMessages)
      .catch((fetchError: Error) => setError(fetchError.message));
  }, []);

  return (
    <div className="container space-y-6 px-4 py-8 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dev inbox</h1>
          <p className="text-sm text-muted-foreground">Emulated Resend messages for local QA.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchInbox().then(setMessages)}>
            Refresh
          </Button>
          <Link to="/">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-4" data-testid="dev-inbox-list">
        {messages.map((message, index) => (
          <Card key={message.id ?? String(index)}>
            <CardHeader>
              <CardTitle className="text-base">{message.subject ?? 'No subject'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>To: {Array.isArray(message.to) ? message.to.join(', ') : message.to}</div>
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: message.html ?? '' }}
              />
            </CardContent>
          </Card>
        ))}
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : null}
      </div>
    </div>
  );
}
