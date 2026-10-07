#!/usr/bin/env node
/**
 * Contrast checker for the TrustLink design tokens.
 * Prints WCAG ratios for text pairs (need >= 4.5:1) and UI pairs (need >= 3:1).
 * Mirrors the token values in src/theme/index.ts (run `npm run contrast`).
 */
const hex = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const srgb = (c) => {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
};
const luminance = (h) => {
  const [r, g, b] = hex(h);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};
const ratio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};
const mix = (fg, bg, alpha) => {
  const A = hex(fg);
  const B = hex(bg);
  const c = A.map((v, i) => Math.round(v * alpha + B[i] * (1 - alpha)));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
};

const light = {
  bg: '#ffffff', bgSecondary: '#f9fafb', surface: '#ffffff',
  text: '#111827', textSecondary: '#4b5563', textMuted: '#5b6472',
  primaryAction: '#0b1f47', primaryActionText: '#ffffff',
  accent: '#b8863a', accentText: '#0b1f47',
  danger: '#b91c1c', dangerText: '#ffffff',
  success: '#059669', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6',
  badge: { success: '#065f46', warning: '#92400e', error: '#991b1b', info: '#1e40af', neutral: '#374151' },
};
const dark = {
  bg: '#0b1220', bgSecondary: '#0f172a', surface: '#131c2e',
  text: '#f3f4f6', textSecondary: '#c3cad6', textMuted: '#9aa6b8',
  primaryAction: '#d4a55d', primaryActionText: '#0b1f47',
  accent: '#d4a55d', accentText: '#0b1f47',
  danger: '#dc2626', dangerText: '#ffffff',
  success: '#34d399', warning: '#fbbf24', error: '#f87171', info: '#60a5fa',
  badge: { success: '#6ee7b7', warning: '#fcd34d', error: '#fca5a5', info: '#93c5fd', neutral: '#c3cad6' },
};

const TINT_ALPHA = 0x22 / 255;
const badgeStatusColor = { success: 'success', warning: 'warning', error: 'error', info: 'info', neutral: 'textSecondary' };

function textPairs(t) {
  const pairs = [
    ['text / bg', t.text, t.bg],
    ['text / surface', t.text, t.surface],
    ['textSecondary / bg', t.textSecondary, t.bg],
    ['textMuted / bg', t.textMuted, t.bg],
    ['textMuted / bgSecondary', t.textMuted, t.bgSecondary],
    ['primaryActionText / primaryAction', t.primaryActionText, t.primaryAction],
    ['accentText / accent', t.accentText, t.accent],
    ['dangerText / danger', t.dangerText, t.danger],
  ];
  for (const [name, key] of Object.entries(badgeStatusColor)) {
    const tint = mix(t[key], t.surface, TINT_ALPHA);
    pairs.push([`badge.${name} / tint`, t.badge[name], tint]);
  }
  return pairs;
}
function uiPairs(t) {
  return [
    ['primaryAction / bg', t.primaryAction, t.bg],
    ['accent / bg', t.accent, t.bg],
    ['danger / bg', t.danger, t.bg],
    ['success / surface', t.success, t.surface],
    ['info / surface', t.info, t.surface],
  ];
}

let failures = 0;
function report(label, t) {
  console.log(`\n=== ${label} ===`);
  console.log('\nText pairs (need >= 4.5:1)');
  for (const [name, fg, bg] of textPairs(t)) {
    const r = ratio(fg, bg);
    const ok = r >= 4.5;
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${String(r).padStart(6)}:1  ${name}  (${fg} on ${bg})`);
  }
  console.log('\nUI pairs (need >= 3:1)');
  for (const [name, fg, bg] of uiPairs(t)) {
    const r = ratio(fg, bg);
    const ok = r >= 3;
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${String(r).padStart(6)}:1  ${name}  (${fg} on ${bg})`);
  }
}

report('LIGHT', light);
report('DARK', dark);
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
