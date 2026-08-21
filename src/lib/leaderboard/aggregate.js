/**
 * Build a small Top-N leaderboard aggregate from engineer rows (pure).
 * Prefer reading leaderboard_aggregates/{id} when maintained by server.
 */
export function buildTopLeaderboard(engineers = [], { limit = 10, scoreOf } = {}) {
  const scoreFn =
    scoreOf ||
    ((e) => {
      const n = Number(e?.tcsScore ?? e?.score ?? 0);
      return Number.isFinite(n) ? n : 0;
    });
  return [...engineers]
    .map((e) => ({
      code: e.code,
      name: e.name,
      score: scoreFn(e),
      partner: e.partner || e.center || '',
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}

export async function writeLeaderboardAggregate(db, docId, rows) {
  if (!db || !docId) return;
  await db.collection('leaderboard_aggregates').doc(docId).set(
    {
      updatedAt: new Date().toISOString(),
      top: rows,
      count: rows.length,
    },
    { merge: true },
  );
}
