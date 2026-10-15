/**
 * Private jet charter cost calculator — pure arithmetic, no DOM.
 * Shared by the Astro page (pre-rendered default example) and the client script.
 * All results are ranges [low, high]; null high means "and up".
 */

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampPct(v, fallback = 0) {
  const n = num(v, fallback);
  return Math.min(100, Math.max(0, n));
}

/**
 * Core estimate.
 * @param {object} o
 * @param {number} o.rateLow - hourly rate low
 * @param {number|null} o.rateHigh - hourly rate high (null = open ended)
 * @param {number} o.hours - flight hours (0.5 steps)
 * @param {number} o.positioningHours - optional positioning/waiting hours (billed "if billed")
 * @param {number} o.feePct - optional taxes/fees % entered by the reader (null = not entered)
 * @param {number} o.passengers
 * @param {boolean} o.emptyLeg - show the 25–75% empty-leg band
 */
export function jetEstimate(o) {
  const rateLow = Math.max(0, num(o.rateLow));
  const rateHigh = o.rateHigh == null ? null : Math.max(0, num(o.rateHigh));
  const hours = Math.min(24, Math.max(0.5, num(o.hours, 2)));
  const positioningHours = Math.min(24, Math.max(0, num(o.positioningHours)));
  const passengers = Math.min(19, Math.max(1, Math.round(num(o.passengers, 4))));
  const feePct = o.feePct == null || o.feePct === '' ? null : clampPct(o.feePct);

  const billable = hours + positioningHours;
  const baseLow = rateLow * billable;
  const baseHigh = rateHigh == null ? null : rateHigh * billable;

  const withFees = (v) => (feePct == null || v == null ? v : v * (1 + feePct / 100));

  const total = [withFees(baseLow), withFees(baseHigh)];
  const perPassenger = [total[0] / passengers, total[1] == null ? null : total[1] / passengers];

  // Empty leg: 25–75% off the standard range, one-way only, subject to change.
  const emptyLeg = o.emptyLeg
    ? {
        low: [total[0] * 0.25, total[0] * 0.75],
        high: total[1] == null ? null : [total[1] * 0.25, total[1] * 0.75],
      }
    : null;

  return {
    hours, positioningHours, passengers, feePct,
    billableHours: billable,
    total, perPassenger, emptyLeg,
    feesNote: feePct == null,
  };
}

/**
 * Break-even vs first class: how many passengers make the jet cheaper per person.
 * @param {object} o { jetLow, jetHigh, fare }
 * @returns {[number|null, number|null]} people (nulls when fare missing/invalid)
 */
export function breakEven(o) {
  const fare = num(o.fare, NaN);
  if (!Number.isFinite(fare) || fare <= 0) return [null, null];
  const lo = o.jetLow == null ? null : o.jetLow / fare;
  const hi = o.jetHigh == null ? null : o.jetHigh / fare;
  return [lo, hi];
}

/**
 * Quote sanity check: where does a quote sit against the sourced range for category+hours?
 * @param {object} o { quote, rateLow, rateHigh, hours, positioningHours }
 */
export function sanityCheck(o) {
  const base = jetEstimate({
    rateLow: o.rateLow,
    rateHigh: o.rateHigh,
    hours: o.hours,
    positioningHours: o.positioningHours || 0,
    feePct: null,
    passengers: 1,
  });
  const quote = num(o.quote, NaN);
  const [low, high] = base.total;
  if (!Number.isFinite(quote) || quote < 0) {
    return { verdict: 'unknown', positionPct: null, pctAbove: null, range: base.total };
  }
  if (quote < low) return { verdict: 'below', positionPct: null, pctAbove: null, range: base.total };
  if (high == null || quote <= high) {
    const positionPct = high == null || high === low ? null : Math.round(((quote - low) / (high - low)) * 100);
    return { verdict: 'within', positionPct, pctAbove: null, range: base.total };
  }
  const pctAbove = high > 0 ? Math.round(((quote - high) / high) * 100) : null;
  return { verdict: 'above', positionPct: null, pctAbove, range: base.total };
}

export function fmtMoney(n, symbol = '$') {
  if (n == null || !Number.isFinite(n)) return '—';
  const r = Math.round(n);
  if (r >= 1000) {
    const k = (Math.round(r / 100) / 10).toString().replace(/\.0$/, '');
    return symbol + k + 'k';
  }
  return symbol + r.toLocaleString('en-US');
}

export function fmtMoneyFull(n, symbol = '$') {
  if (n == null || !Number.isFinite(n)) return '—';
  return symbol + Math.round(n).toLocaleString('en-US');
}

export function fmtRange(range, symbol = '$', full = false) {
  const f = full ? fmtMoneyFull : fmtMoney;
  const [lo, hi] = range;
  if (hi == null) return f(lo, symbol) + '+';
  return f(lo, symbol) + ' – ' + f(hi, symbol);
}

/** Round to 1 decimal for people counts, e.g. 2.3. */
export function fmtPeople(n) {
  if (n == null || !Number.isFinite(n)) return '—';
  return (Math.round(n * 10) / 10).toString();
}

/** Render the jet estimate as HTML rows (server pre-render + client updates share this). */
export function renderJetResults(est, symbol = '$') {
  const row = (label, value, cls = '') =>
    `<div class="trow${cls}"><span>${label}</span><strong>${value}</strong></div>`;
  let h = row('Estimated total', fmtRange(est.total, symbol, true), ' ttotal');
  if (est.feesNote) {
    h += `<p class="tnote">Plus taxes and fees — ask for an all-in quote.</p>`;
  } else {
    h += row(`Including your ${est.feePct}% taxes/fees`, fmtRange(est.total, symbol, true));
  }
  h += row(
    est.passengers === 1 ? 'Per passenger' : `Per passenger (${est.passengers} travelling)`,
    fmtRange(est.perPassenger, symbol, true)
  );
  if (est.positioningHours > 0) {
    h += `<p class="tnote">Includes ${est.positioningHours} positioning/waiting hour(s), billed at the same hourly rate <em>if billed</em> — practice varies by provider.</p>`;
  }
  if (est.emptyLeg) {
    const band = est.emptyLeg.high == null
      ? fmtRange(est.emptyLeg.low, symbol, true)
      : fmtRange([est.emptyLeg.low[0], est.emptyLeg.high[1]], symbol, true);
    h += row('As an empty leg (25–75% off)', band);
    h += `<p class="tnote">One-way only, and the operator can change or cancel it. Never book an empty leg for a time-sensitive trip.</p>`;
  }
  return h;
}
