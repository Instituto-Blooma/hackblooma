import { describe, expect, it } from 'vitest';
import {
  addDays,
  checkEligibility,
  daysBetween,
  dueAvisos,
  formatDateInfo,
  todayInBrasilia,
  visiblePhases,
} from './olimpiadas';

describe('datas', () => {
  it('uses Brasília time for today', () => {
    // 02:00 UTC on 25/10 is still 24/10 in Brasília.
    expect(todayInBrasilia(Date.parse('2026-10-25T02:00:00Z'))).toBe('2026-10-24');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-06-05', '2026-06-12')).toBe(7);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('formats confirmed and "a confirmar" dates', () => {
    expect(formatDateInfo({ status: 'confirmed', start: '2026-06-19', end: '2026-06-20' })).toBe(
      '19/06 a 20/06/2026'
    );
    expect(formatDateInfo({ status: 'confirmed', start: '2026-06-09' })).toBe('09/06/2026');
    expect(formatDateInfo({ status: 'tbc', estimateMonth: 5 })).toBe(
      'a confirmar (deve ser em maio)'
    );
    expect(formatDateInfo({ status: 'tbc' })).toBe('a confirmar');
  });
});

describe('quem pode participar', () => {
  it('flags school type and grade', () => {
    const obmep = { schoolTypes: ['publica' as const], minGrade: 'ef6' as const };
    expect(checkEligibility(obmep, { grade: 'em1', schoolType: 'publica' }).eligible).toBe(true);
    expect(checkEligibility(obmep, { grade: 'em1', schoolType: 'particular' }).reasons).toEqual([
      'Só escola pública',
    ]);
    expect(
      checkEligibility({ minGrade: 'ef8', maxGrade: 'ef9' }, { grade: 'em2' }).reasons[0]
    ).toMatch(/^Até o/);
  });

  it('never lists invite-only olympiads as Para você', () => {
    expect(checkEligibility({ inviteOnly: true }, {}).eligible).toBe(false);
  });
});

describe('fases', () => {
  const phases = [
    { _id: 'f2', order: 2 },
    { _id: 'f1', order: 1 },
    { _id: 'f3', order: 3 },
  ];

  it('shows only the first Fase until she passes', () => {
    expect(visiblePhases(phases, []).map((p) => p._id)).toEqual(['f1']);
    expect(
      visiblePhases(phases, [{ phaseId: 'f1', outcome: 'advanced' }]).map((p) => p._id)
    ).toEqual(['f1', 'f2']);
    expect(
      visiblePhases(phases, [{ phaseId: 'f1', outcome: 'not_advanced' }]).map((p) => p._id)
    ).toEqual(['f1']);
  });
});

describe('avisos', () => {
  const olympiad = {
    _id: 'obf',
    acronym: 'OBF',
    name: 'Olimpíada Brasileira de Física',
    registrationDeadline: { status: 'confirmed' as const, start: '2026-06-12' },
  };
  const phases = [
    {
      _id: 'f1',
      order: 1,
      name: '1ª fase',
      date: { status: 'confirmed' as const, start: '2026-06-19' },
      resultRelease: { status: 'confirmed' as const, start: '2026-07-10' },
    },
    {
      _id: 'f2',
      order: 2,
      name: '2ª fase',
      date: { status: 'confirmed' as const, start: '2026-08-20' },
    },
  ];

  it('reminds about the prazo 7 days and 1 day before, only while not inscrita', () => {
    const base = { olympiad, phases, results: [] };
    expect(
      dueAvisos({ ...base, today: '2026-06-05', participationStatus: 'planned' })
    ).toHaveLength(1);
    expect(
      dueAvisos({ ...base, today: '2026-06-11', participationStatus: 'planned' })[0]?.title
    ).toBe('OBF: a inscrição termina amanhã');
    expect(
      dueAvisos({ ...base, today: '2026-06-05', participationStatus: 'registered' })
    ).toHaveLength(0);
    expect(
      dueAvisos({ ...base, today: '2026-06-08', participationStatus: 'planned' })
    ).toHaveLength(0);
  });

  it('reminds about visible Fases and the divulgação do resultado', () => {
    const base = { olympiad, phases, participationStatus: 'registered' as const };
    expect(dueAvisos({ ...base, today: '2026-06-18', results: [] })[0]?.kind).toBe('fase');
    expect(dueAvisos({ ...base, today: '2026-07-10', results: [] })[0]?.kind).toBe('divulgacao');
    // 2ª fase stays hidden until she passed the 1ª.
    expect(dueAvisos({ ...base, today: '2026-08-13', results: [] })).toHaveLength(0);
    expect(
      dueAvisos({ ...base, today: '2026-08-13', results: [{ phaseId: 'f1', outcome: 'advanced' }] })
    ).toHaveLength(1);
  });
});
