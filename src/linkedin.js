/**
 * AI Signal: LinkedIn adapter.
 *
 * Finds post cards and their body text on the feed and on a post's own page.
 * Verified against LinkedIn's 2026 UI (obfuscated class names, `componentkey`
 * attributes, `data-testid` hooks) with a fallback for the older
 * `feed-shared-update-v2` markup. Comments share the text hook but sit under a
 * CommentComponentReference wrapper, so they are excluded.
 */
(function (root) {
  'use strict';

  const CARD = '[componentkey^="update-card-focus"], .feed-shared-update-v2[data-urn], [data-urn^="urn:li:activity"]';
  const TEXT_BOX = 'span[data-testid="expandable-text-box"], .update-components-text, .feed-shared-inline-show-more-text';
  const COMMENT_WRAPPER = '[componentkey^="CommentComponentReference"], .comments-comment-item, .comments-comment-entity';
  const TOGGLE = '[data-testid="expandable-text-button"], .feed-shared-inline-show-more-text__see-more-less-toggle, button';

  function cardId(card) {
    const key = card.getAttribute('componentkey') || card.getAttribute('data-urn') || card.getAttribute('data-id') || '';
    return key.replace(/^update-card-focus/, '').replace(/FeedType_.*$/, '') || null;
  }

  function bodyText(box) {
    const clone = box.cloneNode(true);
    clone.querySelectorAll(TOGGLE).forEach(b => b.remove());
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    clone.querySelectorAll('p, div, li').forEach(el => el.append('\n'));
    return clone.textContent.replace(/\r/g, '')
      .split('\n').map(l => l.replace(/[ \t]+/g, ' ').trim()).join('\n')
      .replace(/\n{3,}/g, '\n\n').trim();
  }

  function findTextBox(card) {
    for (const box of card.querySelectorAll(TEXT_BOX)) {
      if (box.closest(COMMENT_WRAPPER)) continue;
      if (box.closest(CARD) !== card) continue;
      return box;
    }
    return null;
  }

  /**
   * @param {ParentNode} scope
   * @returns {Array<{id: string, card: Element, box: Element, text: string}>}
   */
  function findPosts(scope) {
    const posts = [];
    const seen = new Set();
    for (const card of (scope || document).querySelectorAll(CARD)) {
      if (card.closest(COMMENT_WRAPPER)) continue;
      const box = findTextBox(card);
      if (!box) continue;
      const id = cardId(card) || ('anon:' + posts.length);
      if (seen.has(id)) continue;
      seen.add(id);
      posts.push({ id, card, box, text: bodyText(box), kind: 'post' });
    }
    return posts;
  }

  // Where to put the badge: just above the body text's paragraph.
  function badgeAnchor(post) {
    const p = post.box.closest('p') || post.box;
    return p.parentElement ? p : post.box;
  }

  root.AiSignal = Object.assign(root.AiSignal || {}, { site: { name: 'linkedin', findPosts, badgeAnchor, hasComments: false } });
})(typeof globalThis !== 'undefined' ? globalThis : this);
