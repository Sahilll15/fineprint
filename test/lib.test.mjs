import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORY_IDS, explainClause, levelFor, scoreClause, splitClauses, summarize } from '../app/lib.ts';

const none = Object.fromEntries(CATEGORY_IDS.map((id) => [id, 0]));
const raw = (id) => ({ id, heading: null, text: 'Some clause text that is long enough to count.' });

test('splitClauses keeps headings with their text and pulls out the title', () => {
  const { title, clauses } = splitClauses(
    'Sample Terms\n\n1. Renewal\nThis plan renews every month until you cancel it.\n\n2. Fees\nA late fee of $50 applies to any payment received after the due date.',
  );
  assert.equal(title, 'Sample Terms');
  assert.equal(clauses.length, 2);
  assert.equal(clauses[0].heading, '1. Renewal');
  assert.match(clauses[1].text, /late fee/);
});

test('splitClauses splits single-newline numbered sections', () => {
  const { clauses } = splitClauses(
    '1. The tenant pays rent on the first day of each month by transfer.\n2. The landlord may enter the unit at any time without notice.',
  );
  assert.equal(clauses.length, 2);
});

test('splitClauses caps the clause count by merging neighbours', () => {
  const text = Array.from({ length: 40 }, (_, i) => `${i + 1}. Clause number ${i + 1} says something about the agreement here.`).join('\n\n');
  const { clauses, merged } = splitClauses(text, 25);
  assert.equal(clauses.length, 25);
  assert.equal(merged, true);
  assert.ok(clauses.map((c) => c.text).join(' ').includes('Clause number 40'));
});

test('scoreClause: aggressive flagged clause is high, standard unflagged is low', () => {
  const bad = scoreClause(raw('a'), { flags: { ...none, arbitration: 0.95, liabilityLimit: 0.7 }, aggressiveness: 2.8, notice: 0.9 });
  assert.equal(bad.level, 'high');
  assert.deepEqual(bad.categories, ['arbitration', 'liabilityLimit']);

  const fine = scoreClause(raw('b'), { flags: none, aggressiveness: 0.2, notice: 0.1 });
  assert.equal(fine.level, 'low');
  assert.deepEqual(fine.categories, []);
});

test('scoreClause: unflagged clauses are capped below high and inputs are clamped', () => {
  const c = scoreClause(raw('c'), { flags: { ...none, ipRights: 1.4 }, aggressiveness: 9, notice: -1 });
  assert.ok(c.risk <= 1 && c.aggressiveness === 3 && c.notice === 0 && c.flags.ipRights === 1);
  const odd = scoreClause(raw('d'), { flags: none, aggressiveness: 3, notice: 1 });
  assert.notEqual(odd.level, 'high');
});

test('summarize counts categories, weights the worst clauses, and picks three to read first', () => {
  const clauses = [
    scoreClause(raw('a'), { flags: { ...none, autoRenewal: 0.9 }, aggressiveness: 2.5, notice: 0.9 }),
    scoreClause(raw('b'), { flags: { ...none, feesPenalties: 0.8, autoRenewal: 0.6 }, aggressiveness: 2, notice: 0.8 }),
    scoreClause(raw('c'), { flags: { ...none, dataSharing: 0.7 }, aggressiveness: 1.5, notice: 0.6 }),
    scoreClause(raw('d'), { flags: none, aggressiveness: 0, notice: 0.05 }),
    scoreClause(raw('e'), { flags: none, aggressiveness: 0.1, notice: 0.1 }),
  ];
  const s = summarize(clauses);
  assert.equal(s.counts.autoRenewal, 2);
  assert.equal(s.counts.feesPenalties, 1);
  assert.deepEqual(s.readFirst, ['a', 'b', 'c']);
  assert.ok(s.score > 40 && s.score <= 100);
  assert.equal(s.levels.low, 2);
});

test('summarize on a clean document is low and recommends nothing', () => {
  const s = summarize([scoreClause(raw('a'), { flags: none, aggressiveness: 0, notice: 0 })]);
  assert.equal(s.level, 'low');
  assert.deepEqual(s.readFirst, []);
  assert.equal(levelFor(0.6), 'high');
});

test('explainClause uses templated copy and keeps acronyms', () => {
  const c = scoreClause(raw('a'), { flags: { ...none, ipRights: 0.9 }, aggressiveness: 2, notice: 0.9 });
  assert.match(explainClause(c), /^Flagged for content and IP rights\./);
});
