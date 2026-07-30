/**
 * Smoke tests for TCS dashboard winners config helpers.
 * Run: node scripts/test-tcs-winners-config.mjs
 */
import {
  buildTcsWinnersConfigMap,
  lookupTcsWinnersConfig,
  resolveTcsWinnersConfig,
  resolveTcsWinnersDocId,
  isWinnersMapKeyForRole,
} from '../src/lib/tcsWinnersConfig.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const configs = [
  {
    id: 'Q1-2026-MX',
    quarterKey: 'Q1-2026',
    product: 'MX',
    mxRole: 'engineers',
    winners: ['ENG1', 'ENG2', 'ENG3', 'ENG4', 'ENG5', 'ENG6'],
  },
  {
    id: 'Q2-2026-MX-receptionists',
    quarterKey: 'Q2-2026',
    product: 'MX',
    mxRole: 'receptionists',
    winners: ['MOHAMEDMAHER', 'MAHMOUDMORTADA'],
  },
  {
    id: 'Q2-2026-MX-galaxy_consultants',
    quarterKey: 'Q2-2026',
    product: 'MX',
    mxRole: 'galaxy_consultants',
    winners: ['GALAXY1'],
  },
];

const map = buildTcsWinnersConfigMap(configs);

assert(resolveTcsWinnersDocId('Q2-2026', 'MX', 'receptionists') === 'Q2-2026-MX-receptionists', 'doc id receptionists');
assert(resolveTcsWinnersDocId('Q2-2026', 'MX', 'galaxy_consultants') === 'Q2-2026-MX-galaxy_consultants', 'doc id galaxy');
assert(resolveTcsWinnersDocId('Q1-2026', 'MX', 'engineers') === 'Q1-2026-MX', 'doc id engineers');

const recep = lookupTcsWinnersConfig(map, 'Q2-2026', 'MX', 'receptionists');
assert(recep?.winners?.[0] === 'MOHAMEDMAHER', 'lookup receptionists Q2');

const recepLeak = lookupTcsWinnersConfig(map, 'Q1-2026', 'MX', 'receptionists');
assert(recepLeak == null, 'receptionists must NOT fall back to engineer Q1-2026-MX');

const galaxy = lookupTcsWinnersConfig(map, 'Q2-2026', 'MX', 'galaxy_consultants');
assert(galaxy?.winners?.[0] === 'GALAXY1', 'lookup galaxy Q2');

const eng = lookupTcsWinnersConfig(map, 'Q1-2026', 'MX', 'engineers');
assert(eng?.winners?.[0] === 'ENG1', 'lookup engineers Q1');

assert(isWinnersMapKeyForRole('Q2-2026-MX-receptionists', 'MX', 'receptionists'), 'map key role filter');
assert(!isWinnersMapKeyForRole('Q2-2026-MX-receptionists', 'MX', 'engineers'), 'engineers exclude receptionists key');
assert(!isWinnersMapKeyForRole('Q1-2026-MX', 'MX', 'receptionists'), 'receptionists exclude engineer key');

const resolved = resolveTcsWinnersConfig(configs, map, 'Q2-2026', 'MX', 'receptionists');
assert(resolved?.winners?.length === 2, 'resolve receptionists');

console.log('OK: tcs winners config tests passed');
