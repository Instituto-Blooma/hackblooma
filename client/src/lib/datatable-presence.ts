import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConvexPresenceEntry } from '@talentum-ventures/convex-datatable';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { orgTableRoom } from '../../../convex/lib/collabIds';

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session-${Math.random().toString(36).slice(2)}`;
}

type TablePresenceData = {
  userName: string;
  userColor: string;
  activeRowId: string | null;
  activeColumnId: string | null;
};

export function useDatatablePresenceBridge(args: {
  organizationId: string;
  tableId: string;
  heartbeatIntervalMs?: number;
}) {
  const room = orgTableRoom(args.organizationId, args.tableId);
  const sessionId = useMemo(() => createSessionId(), []);
  const heartbeatIntervalMs = args.heartbeatIntervalMs ?? 10_000;
  const { isAuthenticated } = useConvexAuth();
  const updatePresence = useMutation(api.collab.update);
  const disconnectPresence = useMutation(api.collab.disconnect);
  const [now, setNow] = useState(() => Date.now());
  const peers = useQuery(api.collab.list, isAuthenticated ? { room, now } : 'skip');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), heartbeatIntervalMs);
    return () => clearInterval(timer);
  }, [heartbeatIntervalMs]);

  useEffect(() => {
    return () => {
      void disconnectPresence({ room, sessionId }).catch(() => {
        // Logout can clear auth before this cleanup runs.
      });
    };
  }, [disconnectPresence, room, sessionId]);

  const peersRef = useRef(peers);
  peersRef.current = peers;

  const usePresenceData = (_tableId: string): ReadonlyArray<ConvexPresenceEntry> => {
    void _tableId;
    if (!peers) {
      return [];
    }
    return peers.map((peer: { userId: string; updated: number; data?: unknown }) => {
      const data = (peer.data ?? {}) as Partial<TablePresenceData>;
      return {
        tableId: args.tableId,
        userId: peer.userId,
        userName: typeof data.userName === 'string' ? data.userName : peer.userId,
        userColor: typeof data.userColor === 'string' ? data.userColor : '#2563eb',
        activeRowId: typeof data.activeRowId === 'string' ? data.activeRowId : null,
        activeColumnId: typeof data.activeColumnId === 'string' ? data.activeColumnId : null,
        lastSeen: peer.updated,
      };
    });
  };

  const sendHeartbeat = async (entry: ConvexPresenceEntry) => {
    await updatePresence({
      room,
      sessionId,
      userId: entry.userId,
      data: {
        userName: entry.userName,
        userColor: entry.userColor,
        activeRowId: entry.activeRowId,
        activeColumnId: entry.activeColumnId,
      } satisfies TablePresenceData,
      intervalMs: heartbeatIntervalMs,
    });
  };

  return {
    usePresenceData,
    sendHeartbeat,
  };
}
