import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { yachtEstimate, bareboatExtras, compareQuotes, sanityCheck, tipRange } from '../src/lib/yacht-calc.js';

const approx = (a, b, eps = 0.01) => Math.abs(a - b) < eps;

describe('yachtEstimate — plan acceptance cases', () => {
  it('base 50,000, 1 week, APA 30%, tip 10%, tax 13%, 8 guests', () => {
    const r = yachtEstimate({ baseLow: 50000, baseHigh: 50000, durationUnit: 'weeks', duration: 1, apaPct: 30, tipPct: 10, taxPct: 13, guests: 8 });
    assert.ok(approx(r.total[0], 76500), `total low ${r.total[0]}`);
    assert.ok(approx(r.total[1], 76500), `total high ${r.total[1]}`);
    assert.ok(approx(r.perGuest[0], 9562.5), `per guest ${r.perGuest[0]}`);
    assert.ok(approx(r.multiplier[0], 1.53), `multiplier ${r.multiplier[0]}`);
  });

  it('base 15,000, APA 25%, tip 10%, tax 0 → 20,250', () => {
    const r = yachtEstimate({ baseLow: 15000, baseHigh: 15000, durationUnit: 'weeks', duration: 1, apaPct: 25, tipPct: 10, taxPct: 0, guests: 8 });
    assert.ok(approx(r.total[0], 20250), `total ${r.total[0]}`);
  });

  it('base 100,000, APA 35%, tip 10%, tax 0 → 145,000', () => {
    const r = yachtEstimate({ baseLow: 100000, baseHigh: 100000, durationUnit: 'weeks', duration: 1, apaPct: 35, tipPct: 10, taxPct: 0, guests: 8 });
    assert.ok(approx(r.total[0], 145000), `total ${r.total[0]}`);
  });

  it('30,000 base, 3 days → pro-rata floor 12,857 with warning flag', () => {
    const r = yachtEstimate({ baseLow: 30000, baseHigh: 30000, durationUnit: 'days', duration: 3, apaPct: 0, tipPct: 0, taxPct: 0, guests: 2 });
    assert.ok(approx(r.baseLow, 12857.14, 1), `floor ${r.baseLow}`);
    assert.equal(r.proRataNote, true);
  });

  it('per-couple is twice per-guest (76,500 / 8 → 19,125 per couple)', () => {
    const r = yachtEstimate({ baseLow: 50000, baseHigh: 50000, durationUnit: 'weeks', duration: 1, apaPct: 30, tipPct: 10, taxPct: 13, guests: 8 });
    assert.ok(approx(r.perCouple[0], 19125), `per couple ${r.perCouple[0]}`);
  });
});

describe('bareboatExtras — plan acceptance case', () => {
  it('bareboat 5,000 + skipper 7 days at 180–250 → 6,260–6,750 before fuel/marina', () => {
    const r = bareboatExtras({ baseFee: 5000, fuel: 0, marina: 0, cleaning: 0, skipperDays: 7, skipperLow: 180, skipperHigh: 250 });
    assert.ok(approx(r.total[0], 6260), `low ${r.total[0]}`);
    assert.ok(approx(r.total[1], 6750), `high ${r.total[1]}`);
  });
});

describe('compareQuotes', () => {
  it('A: 50,000 base vs B: 45,000 base + 2,000 fees (30/10/13) → A 76,500, B 70,850, diff 5,650', () => {
    const r = compareQuotes({ aBase: 50000, aFees: 0, bBase: 45000, bFees: 2000, apaPct: 30, tipPct: 10, taxPct: 13 });
    assert.ok(approx(r.a, 76500), `A ${r.a}`);
    assert.ok(approx(r.b, 70850), `B ${r.b}`);
    assert.ok(approx(r.difference, 5650), `diff ${r.difference}`);
    assert.equal(r.cheaper, 'B');
  });
});

describe('sanityCheck', () => {
  it('mid-size cat range 15,000–45,000, quote 38,000 → within, ~77% up the range', () => {
    const r = sanityCheck({ quote: 38000, low: 15000, high: 45000 });
    assert.equal(r.verdict, 'within');
    assert.ok(r.positionPct >= 75 && r.positionPct <= 78, `position ${r.positionPct}`);
  });

  it('quote below range → below', () => {
    assert.equal(sanityCheck({ quote: 12000, low: 15000, high: 45000 }).verdict, 'below');
  });

  it('quote above range → above', () => {
    assert.equal(sanityCheck({ quote: 50000, low: 15000, high: 45000 }).verdict, 'above');
  });
});

describe('tipRange', () => {
  it('base 50,000, Mediterranean 10–15% → 5,000–7,500', () => {
    const [lo, hi] = tipRange({ baseFee: 50000, lowPct: 10, highPct: 15 });
    assert.ok(approx(lo, 5000) && approx(hi, 7500), `${lo}–${hi}`);
  });
});
