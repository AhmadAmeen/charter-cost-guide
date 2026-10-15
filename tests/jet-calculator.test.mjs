import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { jetEstimate, breakEven, sanityCheck } from '../src/lib/jet-calc.js';

const approx = (a, b, eps = 0.01) => Math.abs(a - b) < eps;

describe('jetEstimate — plan acceptance cases', () => {
  it('light, 2 hours → $7,000–$13,000', () => {
    const r = jetEstimate({ rateLow: 3500, rateHigh: 6500, hours: 2, positioningHours: 0, feePct: null, passengers: 1 });
    assert.ok(approx(r.total[0], 7000), `low ${r.total[0]}`);
    assert.ok(approx(r.total[1], 13000), `high ${r.total[1]}`);
  });

  it('midsize, 4 hours → $18,000–$34,000', () => {
    const r = jetEstimate({ rateLow: 4500, rateHigh: 8500, hours: 4, positioningHours: 0, feePct: null, passengers: 1 });
    assert.ok(approx(r.total[0], 18000));
    assert.ok(approx(r.total[1], 34000));
  });

  it('heavy, 7 hours → $49,000–$91,000', () => {
    const r = jetEstimate({ rateLow: 7000, rateHigh: 13000, hours: 7, positioningHours: 0, feePct: null, passengers: 1 });
    assert.ok(approx(r.total[0], 49000));
    assert.ok(approx(r.total[1], 91000));
  });

  it('light, 2 hours, 6 passengers → $1,166.67–$2,166.67 each', () => {
    const r = jetEstimate({ rateLow: 3500, rateHigh: 6500, hours: 2, positioningHours: 0, feePct: null, passengers: 6 });
    assert.ok(approx(r.perPassenger[0], 1166.67, 0.01), `low ${r.perPassenger[0]}`);
    assert.ok(approx(r.perPassenger[1], 2166.67, 0.01), `high ${r.perPassenger[1]}`);
  });

  it('light, 2 hours, 10% fees → $7,700–$14,300', () => {
    const r = jetEstimate({ rateLow: 3500, rateHigh: 6500, hours: 2, positioningHours: 0, feePct: 10, passengers: 1 });
    assert.ok(approx(r.total[0], 7700));
    assert.ok(approx(r.total[1], 14300));
  });

  it('no fee percentage entered → feesNote true (show "plus taxes and fees")', () => {
    const r = jetEstimate({ rateLow: 3500, rateHigh: 6500, hours: 2, positioningHours: 0, feePct: null, passengers: 1 });
    assert.equal(r.feesNote, true);
    assert.ok(approx(r.total[0], 7000), 'no invented fee multiplier');
  });

  it('empty-leg toggle → 25–75% band of the standard range', () => {
    const r = jetEstimate({ rateLow: 3500, rateHigh: 6500, hours: 2, positioningHours: 0, feePct: null, passengers: 1, emptyLeg: true });
    assert.ok(r.emptyLeg !== null);
    assert.ok(approx(r.emptyLeg.low[0], 1750) && approx(r.emptyLeg.low[1], 5250));
    assert.ok(approx(r.emptyLeg.high[0], 3250) && approx(r.emptyLeg.high[1], 9750));
  });

  it('positioning hours are billed at the same rates', () => {
    const r = jetEstimate({ rateLow: 3500, rateHigh: 6500, hours: 2, positioningHours: 1, feePct: null, passengers: 1 });
    assert.ok(approx(r.total[0], 10500));
    assert.ok(approx(r.total[1], 19500));
  });
});

describe('breakEven — plan acceptance case', () => {
  it('jet 7,000–13,000, fare 3,000 → 2.3–4.3 people', () => {
    const [lo, hi] = breakEven({ jetLow: 7000, jetHigh: 13000, fare: 3000 });
    assert.ok(approx(lo, 2.33, 0.05), `lo ${lo}`);
    assert.ok(approx(hi, 4.33, 0.05), `hi ${hi}`);
  });

  it('no fare → nulls (never invent a default fare)', () => {
    assert.deepEqual(breakEven({ jetLow: 7000, jetHigh: 13000, fare: NaN }), [null, null]);
  });
});

describe('sanityCheck — plan acceptance cases', () => {
  it('light, 2 hours, quote 10,500 → within range 7,000–13,000', () => {
    const r = sanityCheck({ quote: 10500, rateLow: 3500, rateHigh: 6500, hours: 2, positioningHours: 0 });
    assert.equal(r.verdict, 'within');
    assert.ok(approx(r.range[0], 7000) && approx(r.range[1], 13000));
  });

  it('light, 2 hours, quote 15,500 → above, ~19% over the top', () => {
    const r = sanityCheck({ quote: 15500, rateLow: 3500, rateHigh: 6500, hours: 2, positioningHours: 0 });
    assert.equal(r.verdict, 'above');
    assert.ok(r.pctAbove >= 18 && r.pctAbove <= 20, `pctAbove ${r.pctAbove}`);
  });

  it('quote below range → below', () => {
    const r = sanityCheck({ quote: 5000, rateLow: 3500, rateHigh: 6500, hours: 2, positioningHours: 0 });
    assert.equal(r.verdict, 'below');
  });
});
