import { describe, it, expect } from 'vitest';
import { computeQuizPoints } from '../src/lib/quizScoring.js';
import { checkQuizAnswer, isScoredQuestionType } from '../src/lib/quizAnswerCheck.js';
import { dryRunTcsImport, validateExcelMeta } from '../src/lib/tcs/importValidate.js';
import { buildTopLeaderboard } from '../src/lib/leaderboard/aggregate.js';
import { assertSafePublicHttpsUrl } from '../src/lib/security/safeFetch.js';
import { snapshotIdForPeriod, buildTcsSnapshot } from '../src/lib/tcs/snapshots.js';

describe('quiz scoring', () => {
  it('awards decaying points for fast correct answers', () => {
    const pts = computeQuizPoints(1000, 20, 1000);
    expect(pts).toBeGreaterThan(500);
    expect(pts).toBeLessThanOrEqual(1000);
  });

  it('checks choice answers', () => {
    const q = { type: 'choice', correctIndex: 2 };
    expect(checkQuizAnswer(q, '2')).toBe(true);
    expect(checkQuizAnswer(q, '0')).toBe(false);
  });

  it('polls are not scored', () => {
    expect(isScoredQuestionType('poll')).toBe(false);
  });
});

describe('SSRF guard', () => {
  it('blocks localhost and http', () => {
    expect(assertSafePublicHttpsUrl('http://127.0.0.1/x').ok).toBe(false);
    expect(assertSafePublicHttpsUrl('https://localhost/x').ok).toBe(false);
    expect(assertSafePublicHttpsUrl('https://169.254.169.254/latest').ok).toBe(false);
  });

  it('allows https public hosts', () => {
    expect(assertSafePublicHttpsUrl('https://example.com/a').ok).toBe(true);
  });
});

describe('TCS import dry-run', () => {
  it('rejects bad extension', () => {
    expect(validateExcelMeta({ fileName: 'x.exe', size: 10 }).ok).toBe(false);
  });

  it('classifies add/update/reject', () => {
    const plan = dryRunTcsImport({
      workbookRows: [
        { code: 'A1', tcsScore: 90 },
        { code: 'A1', tcsScore: 80 },
        { code: 'B2', tcsScore: 200 },
        { code: 'C3', tcsScore: 70 },
      ],
      existing: [{ id: '1', code: 'C3', tcsScore: 50 }],
    });
    expect(plan.toAdd.some((x) => x.code === 'A1')).toBe(true);
    expect(plan.toUpdate.some((x) => x.code === 'C3')).toBe(true);
    expect(plan.rejected.length).toBeGreaterThan(0);
  });
});

describe('leaderboard aggregate', () => {
  it('returns top N', () => {
    const top = buildTopLeaderboard(
      [
        { code: '1', name: 'a', tcsScore: 10 },
        { code: '2', name: 'b', tcsScore: 90 },
        { code: '3', name: 'c', tcsScore: 50 },
      ],
      { limit: 2 },
    );
    expect(top).toHaveLength(2);
    expect(top[0].code).toBe('2');
  });
});

describe('snapshots', () => {
  it('builds locked snapshot id', () => {
    expect(snapshotIdForPeriod(2026, 8)).toBe('TCS_2026-08_FINAL');
    const s = buildTcsSnapshot({ year: 2026, month: 8, engineers: [{ code: 'X', tcsScore: 1 }] });
    expect(s.locked).toBe(true);
    expect(s.engineerCount).toBe(1);
  });
});
