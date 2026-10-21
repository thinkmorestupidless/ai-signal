/**
 * AI Signal: content script.
 *
 * Watches the page for posts, scores each one with the configured scorer and
 * renders a badge above the post text. Re-scores a post if its text changes.
 */
(function () {
  'use strict';

  const { scorer, site } = globalThis.AiSignal;
  const DEFAULTS = { enabled: true, minWords: 30, showSignals: true };
  let settings = { ...DEFAULTS };
  const rendered = new Map(); // post id -> { text, badge }

  function level(result) {
    if (result.score === null) return 'na';
    if (result.score >= 70) return 'high';
    if (result.score >= 45) return 'mid';
    return 'low';
  }

  function render(post, result) {
    const existing = rendered.get(post.id);
    if (existing && existing.badge.isConnected) existing.badge.remove();

    const badge = document.createElement('div');
    badge.className = 'aisig-badge';
    badge.dataset.level = level(result);
    badge.dataset.aisigFor = post.id;

    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'aisig-pill';
    const label = result.score === null ? 'AI signal: n/a' : 'AI signal ' + result.score;
    const conf = result.score === null ? result.reason : result.confidence + ' confidence';
    pill.innerHTML = '<span class="aisig-dot"></span><span class="aisig-label"></span><span class="aisig-conf"></span>';
    pill.querySelector('.aisig-label').textContent = label;
    pill.querySelector('.aisig-conf').textContent = conf;
    pill.title = 'Heuristic signal, not a verdict. Click for the reasons.';
    badge.appendChild(pill);

    if (settings.showSignals && result.signals.length) {
      const detail = document.createElement('div');
      detail.className = 'aisig-detail';
      detail.hidden = true;
      const ul = document.createElement('ul');
      for (const s of result.signals) {
        const li = document.createElement('li');
        li.dataset.sign = s.weight > 0 ? 'ai' : 'human';
        li.textContent = (s.weight > 0 ? '+' : '') + s.weight.toFixed(1) + '  ' + s.label;
        ul.appendChild(li);
      }
      detail.appendChild(ul);
      const foot = document.createElement('p');
      foot.className = 'aisig-foot';
      foot.textContent = result.words + ' words · ' + result.version + ' · stylistic signals only; edited, short or unusual text defeats them';
      detail.appendChild(foot);
      badge.appendChild(detail);
      pill.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); detail.hidden = !detail.hidden; });
    } else {
      pill.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
    }

    const anchor = site.badgeAnchor(post);
    anchor.parentElement.insertBefore(badge, anchor);
    rendered.set(post.id, { text: post.text, badge });
  }

  function scan() {
    if (!settings.enabled) return;
    for (const post of site.findPosts(document)) {
      const prev = rendered.get(post.id);
      if (prev && prev.text === post.text && prev.badge.isConnected) continue;
      const result = scorer.score(post.text);
      if (result.score !== null && result.words < settings.minWords) {
        result.score = null; result.confidence = 'none'; result.reason = 'under ' + settings.minWords + ' words';
      }
      render(post, result);
    }
  }

  function clear() {
    for (const { badge } of rendered.values()) badge.remove();
    rendered.clear();
  }

  let timer = null;
  function schedule() {
    if (timer) return;
    timer = setTimeout(() => { timer = null; scan(); }, 300);
  }

  function start() {
    scan();
    new MutationObserver(muts => {
      for (const m of muts) {
        if (m.target.closest && m.target.closest('.aisig-badge')) continue;
        schedule();
        return;
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  chrome.storage.sync.get(DEFAULTS, stored => {
    settings = { ...DEFAULTS, ...stored };
    start();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const [k, v] of Object.entries(changes)) settings[k] = v.newValue;
    clear();
    scan();
  });
})();
