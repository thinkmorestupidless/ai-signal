/**
 * AI Signal: heuristic scorer.
 *
 * Pure function from text to a 0..100 score plus the signals that produced it.
 * No model, no network. It looks for the stylistic habits that LLM-written
 * LinkedIn posts share (contrast hooks, em dashes, emoji bullets, stock
 * vocabulary, uniform sentence lengths, tidy punctuation) and for the habits
 * humans have that models rarely do (lowercase "i", sloppy spacing, swearing,
 * run-on sentences).
 *
 * This is a signal, not a verdict. Its confidence never rises above "medium".
 * The scorer interface is { score(text) -> Result }, so a model or API backend
 * can replace it without touching the content script.
 */
(function (root) {
  'use strict';

  const VERSION = 'heuristic-0.1';

  // Stock phrases and words. Weight is the logit contribution per distinct hit.
  const PHRASES = [
    [/\bdelve\b/i, 1.0, 'delve'],
    [/\btapestry\b/i, 1.0, 'tapestry'],
    [/\ba testament to\b/i, 0.9, 'a testament to'],
    [/\bever-evolving\b/i, 0.9, 'ever-evolving'],
    [/\bfast-paced\b/i, 0.7, 'fast-paced'],
    [/\bgame[- ]changer\b/i, 0.8, 'game-changer'],
    [/\bgame[- ]changing\b/i, 0.7, 'game-changing'],
    [/\bseamless(ly)?\b/i, 0.5, 'seamless'],
    [/\brobust\b/i, 0.4, 'robust'],
    [/\bleverag(e|ing)\b/i, 0.5, 'leverage'],
    [/\bunlock(s|ing)?\b/i, 0.5, 'unlock'],
    [/\belevat(e|es|ing)\b/i, 0.5, 'elevate'],
    [/\bharness(es|ing)?\b/i, 0.6, 'harness'],
    [/\bembark(s|ed|ing)?\b/i, 0.6, 'embark'],
    [/\bnavigat(e|es|ing) the\b/i, 0.6, 'navigate the'],
    [/\brealm\b/i, 0.7, 'realm'],
    [/\bpivotal\b/i, 0.6, 'pivotal'],
    [/\btransformative\b/i, 0.6, 'transformative'],
    [/\bcutting-edge\b/i, 0.6, 'cutting-edge'],
    [/\bparadigm\b/i, 0.6, 'paradigm'],
    [/\bsynergy\b/i, 0.6, 'synergy'],
    [/\bholistic\b/i, 0.5, 'holistic'],
    [/\bunleash(es|ed|ing)?\b/i, 0.7, 'unleash'],
    [/\bactionable\b/i, 0.5, 'actionable'],
    [/\bfoster(s|ing)?\b/i, 0.4, 'foster'],
    [/\bempower(s|ing|ed)?\b/i, 0.4, 'empower'],
    [/\bresonate(s|d)?\b/i, 0.5, 'resonate'],
    [/\bdeep dive\b/i, 0.4, 'deep dive'],
    [/\bdouble down\b/i, 0.4, 'double down'],
    [/\bat the end of the day\b/i, 0.4, 'at the end of the day'],
    [/\blet that sink in\b/i, 1.0, 'let that sink in'],
    [/\bread that again\b/i, 1.0, 'read that again'],
    [/\bhere'?s the thing\b/i, 0.6, "here's the thing"],
    [/\bthe truth is\b/i, 0.5, 'the truth is'],
    [/\bplot twist\b/i, 0.7, 'plot twist'],
    [/\bhot take\b/i, 0.5, 'hot take'],
    [/\bthe best part\?/i, 0.8, 'the best part?'],
    [/\bthe result\?/i, 0.8, 'the result?'],
    [/\bthe lesson\?/i, 0.8, 'the lesson?'],
    [/\bspoiler( alert)?:/i, 0.7, 'spoiler:'],
    [/\bhere'?s (why|what|how)\b/i, 0.5, "here's why/what/how"],
    [/\bkey takeaways?\b/i, 0.6, 'key takeaway'],
    [/\bthis isn'?t just\b/i, 0.7, "this isn't just"],
    [/\bit'?s not just\b/i, 0.6, "it's not just"],
    [/\bmore than just\b/i, 0.4, 'more than just'],
    [/\bin today'?s\b/i, 0.6, "in today's"],
    [/\bgentle reminder\b/i, 0.6, 'gentle reminder'],
    [/\bfollow (me )?for more\b/i, 0.6, 'follow for more'],
    [/\brepost (if|to)\b/i, 0.5, 'repost if'],
    [/\bgroundbreaking\b/i, 0.5, 'groundbreaking'],
    [/\bmeticulous(ly)?\b/i, 0.6, 'meticulous'],
    [/\bcrucial\b/i, 0.4, 'crucial'],
    [/\bvibrant\b/i, 0.5, 'vibrant'],
    [/\bnuanced\b/i, 0.4, 'nuanced'],
    [/\bmultifaceted\b/i, 0.7, 'multifaceted'],
    [/\bunderscore(s|d)?\b/i, 0.6, 'underscore'],
    [/\bshowcas(e|es|ing)\b/i, 0.5, 'showcase'],
    [/\bbeacon\b/i, 0.7, 'beacon'],
    [/\bjourney\b/i, 0.3, 'journey'],
  ];

  const EMOJI_BULLET = /^\s*(?:[✅❌⭐⚡\u{1F300}-\u{1FAFF}]|\u{1F449}|\u{1F4A1}|\u{1F680}|\u{1F511}|\u{1F4CC}|\u{1F3AF}|✨|\u{1F525}|\u{1F4C8}|\u{1F4AC}|\u{1F9F5})/u;
  const ARROW_BULLET = /^\s*(?:→|➡️|➜|->|▶|•)\s+/;
  const CTA_LINE = /^(?:agree\??|thoughts\??|what('?s| is| do) you (think|take)|what'?s your take|let me know|curious to hear|would love to hear|drop (a|your)|share your)/i;
  const PROFANITY = /\b(fuck\w*|shit\w*|bullshit|crap|damn|bloody|arse|ass(hole)?|pissed)\b/i;

  function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

  function splitSentences(text) {
    return text
      .replace(/\n+/g, ' \n ')
      .split(/(?<=[.!?…])\s+|\s*\n\s*/)
      .map(s => s.trim())
      .filter(s => s.split(/\s+/).filter(Boolean).length >= 2);
  }

  function countWords(text) {
    return text.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
  }

  /**
   * @param {string} text
   * @returns {{score: number|null, confidence: 'none'|'low'|'medium', words: number, signals: Array<{label: string, weight: number}>, version: string, reason?: string}}
   */
  function score(text) {
    const clean = (text || '').replace(/ /g, ' ').trim();
    const words = countWords(clean);
    const signals = [];
    const add = (label, weight) => { if (weight) signals.push({ label, weight: +weight.toFixed(2) }); };

    if (words < 30) {
      return { score: null, confidence: 'none', words, signals, version: VERSION, reason: 'too short to score' };
    }

    const per100 = n => (n * 100) / words;
    const lines = clean.split(/\n/).map(l => l.trim()).filter(Boolean);
    const sentences = splitSentences(clean);

    // 1. Stock vocabulary. Each phrase counts once; the total is capped.
    let vocab = 0;
    const vocabHits = [];
    for (const [re, w, label] of PHRASES) {
      if (re.test(clean)) { vocab += w; vocabHits.push(label); }
    }
    if (vocabHits.length) {
      add('stock phrases: ' + vocabHits.slice(0, 5).join(', ') + (vocabHits.length > 5 ? ', …' : ''), Math.min(vocab, 2.5));
    }

    // 2. The contrast hook: "It's not X. It's Y."
    const contrast = (clean.match(/\b(?:it'?s|this is|that'?s|it was|this isn'?t|it isn'?t)\s+(?:not\s+|about\s+)?[^.!?\n]{2,90}[.!?\n]\s*(?:it'?s|this is|that'?s|it was|but it'?s)\s+(?:about\s+)?/gi) || []).length
      + (clean.match(/(?:^|\n)\s*not\s+[^.!?\n]{2,70}[.!?]\s*\n?\s*(?:but\s+|just\s+)?[A-Z][^.!?\n]{2,70}[.!?]/gm) || []).length;
    if (contrast) add('"not X, Y" contrast hook' + (contrast > 1 ? ' ×' + contrast : ''), Math.min(contrast * 0.9, 1.8));

    // 3. Sentence length rhythm. Models are even; people are bursty.
    if (sentences.length >= 5) {
      const lens = sentences.map(s => s.split(/\s+/).length);
      const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
      const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
      const cv = mean ? sd / mean : 0;
      if (cv < 0.3) add('very uniform sentence lengths', 1.1);
      else if (cv < 0.45) add('uniform sentence lengths', 0.5);
      else if (cv > 0.85) add('bursty sentence lengths', -0.6);
      if (Math.max(...lens) > 45) add('a run-on sentence', -0.4);
    }

    // 4. Dashes. Em dashes are a model habit; spaced hyphens a human one.
    const emDashes = (clean.match(/—/g) || []).length;
    const emRate = per100(emDashes);
    if (emRate >= 1.5) add('em dashes (' + emDashes + ')', 1.1);
    else if (emRate >= 0.6) add('em dashes (' + emDashes + ')', 0.6);
    const spacedHyphens = (clean.match(/\s-\s/g) || []).length;
    if (spacedHyphens && !emDashes) add('spaced hyphens as dashes', -0.3);

    // 5. Bullets.
    const emojiBullets = lines.filter(l => EMOJI_BULLET.test(l)).length;
    if (emojiBullets >= 3) add('emoji bullets (' + emojiBullets + ')', 0.8);
    const arrowBullets = lines.filter(l => ARROW_BULLET.test(l)).length;
    if (arrowBullets >= 3) add('arrow bullets (' + arrowBullets + ')', 0.5);

    // 6. Three short parallel lines in a row.
    let triads = 0;
    for (let i = 0; i + 2 < lines.length; i++) {
      const ws = [lines[i], lines[i + 1], lines[i + 2]].map(l => l.split(/\s+/).length);
      if (ws.every(w => w >= 2 && w <= 7) && Math.max(...ws) - Math.min(...ws) <= 2) { triads++; i += 2; }
    }
    if (triads) add('rule-of-three line groups', Math.min(triads * 0.5, 1.0));

    // 7. Closing call to action.
    const tail = lines.slice(-3).filter(l => !/^#/.test(l));
    if (tail.some(l => CTA_LINE.test(l) || (/\?$/.test(l) && l.split(/\s+/).length <= 10))) add('closing question or call to action', 0.6);

    // 8. Opening rhetorical question.
    if (lines.slice(0, 2).some(l => /\?$/.test(l) && l.split(/\s+/).length <= 14)) add('opening rhetorical question', 0.4);

    // 9. Hashtag tail.
    const hashtags = (clean.match(/(^|\s)#\w+/g) || []).length;
    if (hashtags >= 3) add('hashtag tail (' + hashtags + ')', 0.3);

    // 10. Tidiness. Every sentence capitalised and terminated.
    if (sentences.length >= 5) {
      const tidy = sentences.filter(s => /^[A-Z"“(\d\u{1F300}-\u{1FAFF}]/u.test(s) && /[.!?…:"”)]$/.test(s)).length;
      if (tidy === sentences.length) add('every sentence tidy', 0.4);
      else if (tidy / sentences.length < 0.6) add('untidy capitalisation or punctuation', -0.5);
    }

    // 11. Human fingerprints.
    if (/(^|\s)i('m|'ve|'ll|'d)?\s/.test(clean)) add('lowercase "i"', -0.9);
    const prose = clean.replace(/https?:\/\/\S+|\S+@\S+|[#@]\w+|\b(?:e\.g|i\.e|etc|vs|no)\./gi, ' ');
    if (/[a-z][.!?][A-Z][a-z]/.test(prose) || /[a-z],[a-z]{3,}/.test(prose) || /\S  +\S/.test(prose)) add('sloppy spacing', -0.4);
    if (PROFANITY.test(clean)) add('swearing', -0.6);
    const bangs = (clean.match(/!/g) || []).length;
    if (per100(bangs) > 3) add('lots of exclamation marks', -0.3);
    if (/\b(lol|lmao|haha+|tbh|imo|ngl|idk)\b/i.test(clean)) add('chat slang', -0.6);

    // Combine. The prior leans slightly human: most posts still are.
    const logit = -0.9 + signals.reduce((a, s) => a + s.weight, 0);
    const value = Math.round(sigmoid(logit) * 100);
    const confidence = words < 60 ? 'low' : 'medium';
    signals.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
    return { score: value, confidence, words, signals, version: VERSION };
  }

  const api = { score, VERSION };
  root.AiSignal = Object.assign(root.AiSignal || {}, { scorer: api });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
