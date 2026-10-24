import { describe, expect, it } from 'vitest';
import {
  orgDocumentId,
  orgTableRoom,
  parseOrganizationIdFromDocumentId,
  parseOrganizationIdFromRoom,
  presenceRoomForDocument,
} from './collabIds';

describe('collabIds namespaces', () => {
  it('builds org-scoped document ids and table rooms', () => {
    expect(orgDocumentId('org_123', 'notes')).toBe('org:org_123:doc:notes');
    expect(orgTableRoom('org_123', 'todos')).toBe('org:org_123:table:todos');
    expect(presenceRoomForDocument('org:org_123:doc:notes')).toBe('doc:org:org_123:doc:notes');
  });

  it('parses organization ids from document ids and rooms', () => {
    expect(parseOrganizationIdFromDocumentId('org:org_123:doc:notes')).toBe('org_123');
    expect(parseOrganizationIdFromRoom('org:org_123:table:todos')).toBe('org_123');
    expect(parseOrganizationIdFromRoom('doc:org:org_123:doc:notes')).toBe('org_123');
  });

  it('rejects malformed namespaces', () => {
    expect(() => parseOrganizationIdFromDocumentId('notes')).toThrow();
    expect(() => parseOrganizationIdFromRoom('room:todos')).toThrow();
  });
});
