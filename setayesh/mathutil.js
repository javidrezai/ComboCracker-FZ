'use strict';
// Deterministic calculator + common unit conversions, split out of index.js
// (pure, no shared state). The point is exactness: numbers are computed here so
// the model never does mental arithmetic and gets it subtly wrong.
// tryCompute returns a short "expr = result" string, or null when the message
// isn't a calculation. Unit-tested in smoke.test.js.

function round4(n) { return Math.round(n * 10000) / 10000; }

function convertUnit(v, from, to) {
  const L = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, mile: 1609.344, miles: 1609.344, ft: 0.3048, foot: 0.3048, feet: 0.3048, in: 0.0254, inch: 0.0254, yd: 0.9144, yard: 0.9144 };
  const W = { g: 1, kg: 1000, mg: 0.001, lb: 453.592, lbs: 453.592, pound: 453.592, oz: 28.3495, ton: 1e6, tonne: 1e6 };
  if (L[from] && L[to]) return v * L[from] / L[to];
  if (W[from] && W[to]) return v * W[from] / W[to];
  const isC = (s) => s === 'c' || s === 'celsius'; const isF = (s) => s === 'f' || s === 'fahrenheit'; const isK = (s) => s === 'k' || s === 'kelvin';
  if (isC(from) && isF(to)) return v * 9 / 5 + 32;
  if (isF(from) && isC(to)) return (v - 32) * 5 / 9;
  if (isC(from) && isK(to)) return v + 273.15;
  if (isK(from) && isC(to)) return v - 273.15;
  if (isF(from) && isK(to)) return (v - 32) * 5 / 9 + 273.15;
  if (isK(from) && isF(to)) return (v - 273.15) * 9 / 5 + 32;
  return null;
}

function tryCompute(message) {
  const raw = String(message || '').trim();
  if (!raw || raw.length > 200) return null;

  // Unit conversions: "3 km to miles", "20 c to f", "5 kg in lb"
  const conv = raw.match(/(-?\d+(?:\.\d+)?)\s*([a-zA-Z°]+)\s*(?:to|in|را به|به)\s*([a-zA-Z°]+)/i);
  if (conv) {
    const v = parseFloat(conv[1]);
    const from = conv[2].toLowerCase().replace('°', '');
    const to = conv[3].toLowerCase().replace('°', '');
    const out = convertUnit(v, from, to);
    if (out != null) return `${v} ${conv[2]} = ${round4(out)} ${conv[3]}`;
  }

  // Pure arithmetic: only digits, operators, parentheses, %, spaces, decimal.
  const expr = raw.replace(/[،٫]/g, '.').replace(/x/gi, '*').replace(/÷/g, '/').replace(/×/g, '*').replace(/[=؟?]+$/, '').trim();
  if (/^[-+*/%().\d\s^]+$/.test(expr) && /[-+*/%^]/.test(expr) && /\d/.test(expr)) {
    try {
      const js = expr.replace(/\^/g, '**');
      // eslint-disable-next-line no-new-func
      const val = Function('"use strict";return (' + js + ')')();
      if (typeof val === 'number' && isFinite(val)) return `${expr.replace(/\*\*/g, '^')} = ${round4(val)}`;
    } catch (e) {}
  }
  return null;
}

module.exports = { tryCompute, convertUnit, round4 };
