/**
 * Yacht charter cost calculator — pure arithmetic, no DOM.
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
 * @param {number} o.baseLow - weekly base fee, low end (or single figure)
 * @param {number|null} o.baseHigh - weekly base fee, high end (null = open ended)
 * @param {'weeks'|'days'} o.durationUnit
 * @param {number} o.duration - weeks (1-4) or days (2-7)
 * @param {number} o.apaPct - APA percentage of base total
 * @param {number} o.tipPct - tip percentage of base total
 * @param {number} o.taxPct - tax percentage of base total
 * @param {number} o.guests - number of guests
 * @returns {{baseLow, baseHigh, apa:[number,number|null], tip:[...], tax:[...], total:[...], multiplier:[...], perGuest:[...], perCouple:[...], proRataNote: boolean}}
 */
export function yachtEstimate(o) {
  const baseLow = Math.max(0, num(o.baseLow));
  const baseHigh = o.baseHigh == null ? null : Math.max(0, num(o.baseHigh));
  const unit = o.durationUnit === 'days' ? 'days' : 'weeks';
  const duration = unit === 'days'
    ? Math.min(7, Math.max(2, Math.round(num(o.duration, 7))))
    : Math.min(4, Math.max(1, Math.round(num(o.duration, 1))));
  // Days are a pro-rata floor: base x days / 7 (short charters often cost more per day).
  const factor = unit === 'days' ? duration / 7 : duration;
  const apaPct = clampPct(o.apaPct);
  const tipPct = clampPct(o.tipPct);
  const taxPct = clampPct(o.taxPct);
  const guests = Math.max(1, Math.round(num(o.guests, 8)));

  const btLow = baseLow * factor;
  const btHigh = baseHigh == null ? null : baseHigh * factor;

  const band = (pct) => {
    const lo = (btLow * pct) / 100;
    const hi = btHigh == null ? null : (btHigh * pct) / 100;
    return [lo, hi];
  };

  const apa = band(apaPct);
  const tip = band(tipPct);
  const tax = band(taxPct);

  const totalLow = btLow + apa[0] + tip[0] + tax[0];
  const totalHigh = btHigh == null ? null : btHigh + apa[1] + tip[1] + tax[1];

  const mult = (t, b) => (b > 0 ? t / b : null);
  const multiplier = [mult(totalLow, btLow), totalHigh == null || btHigh == null ? null : mult(totalHigh, btHigh)];
  const perGuest = [totalLow / guests, totalHigh == null ? null : totalHigh / guests];
  const perCouple = [perGuest[0] * 2, perGuest[1] == null ? null : perGuest[1] * 2];

  return {
    baseLow: btLow,
    baseHigh: btHigh,
    apa, tip, tax,
    apaPct, tipPct, taxPct,
    total: [totalLow, totalHigh],
    multiplier,
    perGuest,
    perCouple,
    proRataNote: unit === 'days',
    guests,
    duration,
    durationUnit: unit,
  };
}

/** Render the main estimate as HTML rows (server pre-render + client updates share this). */
export function renderYachtResults(est, symbol = '$') {
  const row = (label, value, cls = '') =>
    `<div class="trow${cls}"><span>${label}</span><strong>${value}</strong></div>`;
  let h = row('Base fee total', fmtRange([est.baseLow, est.baseHigh], symbol, true));
  h += row(`APA (${est.apaPct}%)`, fmtRange(est.apa, symbol, true));
  h += row(`Crew tip (${est.tipPct}%)`, fmtRange(est.tip, symbol, true));
  h += row(`Tax (${est.taxPct}%)`, fmtRange(est.tax, symbol, true));
  h += row('Estimated total', fmtRange(est.total, symbol, true), ' ttotal');
  const mult = est.multiplier[1] == null
    ? (est.multiplier[0] == null ? '—' : '×' + (Math.round(est.multiplier[0] * 100) / 100))
    : '×' + (Math.round(est.multiplier[0] * 100) / 100) + ' – ×' + (Math.round(est.multiplier[1] * 100) / 100);
  h += row('All-in multiplier', mult);
  h += row(est.guests === 1 ? 'Per guest' : `Per guest (${est.guests} guests)`, fmtRange(est.perGuest, symbol, true));
  if (est.guests >= 2) h += row('Per couple (2 sharing)', fmtRange(est.perCouple, symbol, true));
  if (est.proRataNote) {
    h += `<p class="tnote">Short charters are often priced higher per day or have minimums — this is a pro-rata floor. Ask the broker.</p>`;
  }
  return h;
}

/** Render bareboat-mode results as HTML rows. */
export function renderBareboatResults(r, symbol = '€') {
  const row = (label, value, cls = '') =>
    `<div class="trow${cls}"><span>${label}</span><strong>${value}</strong></div>`;
  let h = row('Base fee', fmtMoneyFull(r.baseFee, symbol));
  h += row('Skipper', fmtRange(r.skipper, symbol, true));
  h += row('Fuel + marina + cleaning (your figures)', fmtMoneyFull(r.extras, symbol));
  h += row('Estimated total', fmtRange(r.total, symbol, true), ' ttotal');
  h += `<p class="tnote">Plus the refundable damage deposit (held, not spent) and provisions. Ask the operator what is included.</p>`;
  return h;
}

/**
 * Bareboat extras total (reader-entered figures, no defaults).
 * @param {object} o { fuel, marina, cleaning, skipperDays, skipperLow, skipperHigh, baseFee }
 */
export function bareboatExtras(o) {
  const baseFee = Math.max(0, num(o.baseFee));
  const fuel = Math.max(0, num(o.fuel));
  const marina = Math.max(0, num(o.marina));
  const cleaning = Math.max(0, num(o.cleaning));
  const skipperDays = Math.max(0, Math.round(num(o.skipperDays)));
  const skipperLow = Math.max(0, num(o.skipperLow));
  const skipperHigh = Math.max(0, num(o.skipperHigh));
  const skipLow = skipperDays * skipperLow;
  const skipHigh = skipperDays * skipperHigh;
  return {
    baseFee,
    skipper: [skipLow, skipHigh],
    extras: fuel + marina + cleaning,
    total: [baseFee + fuel + marina + cleaning + skipLow, baseFee + fuel + marina + cleaning + skipHigh],
  };
}

/**
 * Compare two quotes with the same formula.
 * Each quote keeps its own base fee and "other fees"; the APA/tip/tax
 * percentages come from the reader's settings on the page.
 * @param {object} o { aBase, aFees, bBase, bFees, apaPct, tipPct, taxPct }
 */
export function compareQuotes(o) {
  const calc = (base, fees) => {
    const b = Math.max(0, num(base));
    const apa = (b * clampPct(o.apaPct)) / 100;
    const tip = (b * clampPct(o.tipPct)) / 100;
    const tax = (b * clampPct(o.taxPct)) / 100;
    return b + apa + tip + tax + Math.max(0, num(fees));
  };
  const a = calc(o.aBase, o.aFees);
  const b = calc(o.bBase, o.bFees);
  return { a, b, difference: Math.abs(a - b), cheaper: a <= b ? 'A' : 'B' };
}

/**
 * Quote sanity check: where does a quoted base fee sit against the preset range?
 * @param {object} o { quote, low, high } — high null = open-ended range
 * @returns {'below'|'within'|'above', positionPct|null, pctAbove|null}
 */
export function sanityCheck(o) {
  const quote = num(o.quote, NaN);
  const low = num(o.low, NaN);
  const high = o.high == null ? null : num(o.high, NaN);
  if (!Number.isFinite(quote) || !Number.isFinite(low) || quote < 0) {
    return { verdict: 'unknown', positionPct: null, pctAbove: null };
  }
  if (quote < low) return { verdict: 'below', positionPct: null, pctAbove: null };
  if (high == null || quote <= high) {
    const positionPct = high == null || high === low ? null : Math.round(((quote - low) / (high - low)) * 100);
    return { verdict: 'within', positionPct, pctAbove: null };
  }
  const pctAbove = low > 0 ? Math.round(((quote - high) / high) * 100) : null;
  return { verdict: 'above', positionPct: null, pctAbove };
}

/**
 * Tip range for a base fee and region band.
 * @param {object} o { baseFee, lowPct, highPct }
 */
export function tipRange(o) {
  const base = Math.max(0, num(o.baseFee));
  return [(base * clampPct(o.lowPct)) / 100, (base * clampPct(o.highPct)) / 100];
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

/** "low – high" or "low+" when high is null. */
export function fmtRange(range, symbol = '$', full = false) {
  const f = full ? fmtMoneyFull : fmtMoney;
  const [lo, hi] = range;
  if (hi == null) return f(lo, symbol) + '+';
  return f(lo, symbol) + ' – ' + f(hi, symbol);
}
