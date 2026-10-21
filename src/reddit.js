/**
 * AI Signal: Reddit adapter.
 *
 * Covers the current Reddit UI (web components: <shreddit-post>, <shreddit-comment>,
 * light-DOM slots "text-body" and "comment") and old.reddit.com (div.thing with
 * .usertext-body .md). Posts carry their title plus body; comments their body.
 * Verified against saved copies of the front page and a post page (2026-10-21):
 * posts and comments live in the light DOM, so plain querySelector reaches them.
 */
(function (root) {
  'use strict';

  const POST = 'shreddit-post, div.thing.link[data-fullname]';
  const COMMENT = 'shreddit-comment, div.thing.comment[data-fullname]';
  const POST_BODY = '[id$="-post-rtjson-content"], [slot="text-body"] .md, [slot="text-body"], .expando .usertext-body .md, .usertext-body .md';
  const COMMENT_BODY = '[id$="-comment-rtjson-content"], [slot="comment"], .entry .usertext-body .md';
  const POST_TITLE = '[slot="title"], h1[id^="post-title"], p.title > a.title';

  function idOf(el) {
    return el.getAttribute('id') || el.getAttribute('thingid') || el.getAttribute('data-fullname') || el.getAttribute('permalink') || null;
  }

  function textOf(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('button, script, style, shreddit-blurred-container, faceplate-screen-reader-content').forEach(n => n.remove());
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    clone.querySelectorAll('p, div, li, blockquote, h1, h2, h3').forEach(n => n.append('\n'));
    return clone.textContent.replace(/\r/g, '')
      .split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  function ownBody(container, selector, ownerSelector) {
    for (const box of container.querySelectorAll(selector)) {
      if (box.closest(ownerSelector) !== container) continue;
      return box;
    }
    return null;
  }

  function findPosts(scope) {
    const items = [];
    const seen = new Set();
    const doc = scope || document;

    for (const card of doc.querySelectorAll(POST)) {
      const box = ownBody(card, POST_BODY, POST);
      if (!box) continue;
      const id = idOf(card) || ('post:' + items.length);
      if (seen.has(id)) continue;
      seen.add(id);
      const titleEl = card.querySelector(POST_TITLE);
      const title = (card.getAttribute('post-title') || (titleEl ? titleEl.textContent : '') || '').trim();
      const body = textOf(box);
      const text = title && !body.startsWith(title) ? title + '\n\n' + body : body;
      items.push({ id, card, box, text, kind: 'post' });
    }

    for (const card of doc.querySelectorAll(COMMENT)) {
      const box = ownBody(card, COMMENT_BODY, COMMENT);
      if (!box) continue;
      const id = idOf(card) || ('comment:' + items.length);
      if (seen.has(id)) continue;
      seen.add(id);
      items.push({ id, card, box, text: textOf(box), kind: 'comment' });
    }
    return items;
  }

  // The badge goes just above the body text.
  function badgeAnchor(item) {
    return item.box;
  }

  root.AiSignal = Object.assign(root.AiSignal || {}, { site: { name: 'reddit', findPosts, badgeAnchor, hasComments: true } });
})(typeof globalThis !== 'undefined' ? globalThis : this);
