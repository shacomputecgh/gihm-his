import { describe, it, expect } from 'vitest';
import { conflictSummary, isConflictResult, parseVersion } from './syncConflicts';
import type { SyncConflictRow } from '../types';

const row: SyncConflictRow = {
  id: 'c1',
  transactionId: 'txn-1',
  entityType: 'labOrder',
  entityId: 'ord-12345678-abcd',
  operation: 'RESULT',
  status: 'OPEN',
  deviceName: 'Reception PC',
  clientUser: 'Ama Serwaa',
  clientEmail: 'ama@demo.gh',
  serverVersion: '{"id":"ord-1","result":"NEGATIVE","status":"VERIFIED"}',
  clientVersion: '{"orderId":"ord-1","result":"POSITIVE"}',
  resolutionNote: null,
  resolvedAt: null,
  createdAt: '2026-08-13T00:00:00.000Z',
};

describe('isConflictResult', () => {
  it('recognises a CONFLICT result carrying a conflictId', () => {
    expect(isConflictResult({ transactionId: 't', status: 'CONFLICT', conflictId: 'c1' })).toBe(true);
  });

  it('rejects processed, failed and undefined results', () => {
    expect(isConflictResult({ transactionId: 't', status: 'PROCESSED' })).toBe(false);
    expect(isConflictResult({ transactionId: 't', status: 'FAILED' })).toBe(false);
    expect(isConflictResult({ transactionId: 't', status: 'CONFLICT' })).toBe(false); // no conflictId
    expect(isConflictResult(undefined)).toBe(false);
  });
});

describe('conflictSummary', () => {
  it('names the entity, actor and device', () => {
    expect(conflictSummary(row)).toBe('labOrder.RESULT on ord-1234 (Ama Serwaa · Reception PC)');
  });

  it('falls back to email when the display name is absent', () => {
    expect(conflictSummary({ ...row, clientUser: null })).toContain('ama@demo.gh');
  });

  it('omits device name when absent', () => {
    const summary = conflictSummary({ ...row, deviceName: null });
    expect(summary).not.toContain('·');
    expect(summary).toContain('labOrder.RESULT');
  });
});

describe('parseVersion', () => {
  it('parses valid JSON', () => {
    expect(parseVersion('{"result":"POSITIVE"}')).toEqual({ result: 'POSITIVE' });
  });

  it('never crashes on invalid input', () => {
    expect(parseVersion('not json')).toEqual({});
    expect(parseVersion('null')).toEqual({});
    expect(parseVersion('"just a string"')).toEqual({});
    expect(parseVersion('')).toEqual({});
  });
});
