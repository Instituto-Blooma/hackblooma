import { ConvexError } from 'convex/values';

const ORG_DOC_ID_RE = /^org:([^:]+):doc:(.+)$/;
const ORG_TABLE_ROOM_RE = /^org:([^:]+):table:(.+)$/;
const DOC_PRESENCE_ROOM_RE = /^doc:(org:[^:]+:doc:.+)$/;

export function orgDocumentId(organizationId: string, slug: string): string {
  return `org:${organizationId}:doc:${slug}`;
}

export function orgTableRoom(organizationId: string, tableId: string): string {
  return `org:${organizationId}:table:${tableId}`;
}

export function presenceRoomForDocument(documentId: string): string {
  return `doc:${documentId}`;
}

export function parseOrganizationIdFromDocumentId(documentId: string): string {
  const match = documentId.match(ORG_DOC_ID_RE);
  if (!match?.[1]) {
    throw new ConvexError('Invalid collaborative document id');
  }
  return match[1];
}

export function parseOrganizationIdFromRoom(room: string): string {
  const tableMatch = room.match(ORG_TABLE_ROOM_RE);
  if (tableMatch?.[1]) {
    return tableMatch[1];
  }

  const docRoomMatch = room.match(DOC_PRESENCE_ROOM_RE);
  if (docRoomMatch?.[1]) {
    return parseOrganizationIdFromDocumentId(docRoomMatch[1]);
  }

  throw new ConvexError('Invalid collaborative presence room');
}
