const scorer = require('../src/scorer.js');
const samples = require('./samples.js');
let failed = 0;
const check = (ok, msg) => { if (!ok) { failed++; console.error('FAIL', msg); } };

for (const [name, text] of Object.entries(samples)) {
  const r = scorer.score(text);
  console.log(`${name.padEnd(12)} score=${String(r.score).padStart(4)} conf=${r.confidence.padEnd(6)} words=${r.words}`);
  for (const s of r.signals) console.log(`             ${s.weight > 0 ? '+' : ''}${s.weight.toFixed(1)}  ${s.label}`);
}
check(scorer.score(samples.aiStyle).score >= 65, 'AI-style sample should score high');
check(scorer.score(samples.humanStyle).score <= 35, 'human-style sample should score low');
check(scorer.score(samples.short).score === null, 'short sample should not be scored');
check(scorer.score('').score === null, 'empty text should not be scored');
process.exit(failed ? 1 : 0);
