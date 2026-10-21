/**
 * AI Signal: content script.
 *
 * Watches the page for posts, scores each one with the configured scorer and
 * renders a badge above the post text. Re-scores a post if its text changes.
 */
(function () {
  'use strict';

  const { scorer, site } = globalThis.AiSignal;
  const DEFAULTS = { enabled: true, minWords: 30, showSignals: true, hideEnabled: false, hideAbove: 80 };
  let settings = { ...DEFAULTS };
  const rendered = new Map(); // post id -> { text, badge, stub? }
  const revealed = new Set(); // post ids the reader chose to show despite the threshold

  // Traffic light and mood per level.
  const FACE = { high: ['🔴', '🤮'], mid: ['🟡', '🤨'], low: ['🟢', '😌'], na: ['⚪', '🤷'] };

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
    pill.innerHTML = '<span class="aisig-light"></span><span class="aisig-label"></span><span class="aisig-mood"></span><span class="aisig-conf"></span>';
    const [light, mood] = FACE[badge.dataset.level];
    pill.querySelector('.aisig-light').textContent = light;
    pill.querySelector('.aisig-label').textContent = label;
    pill.querySelector('.aisig-mood').textContent = mood;
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
    const entry = { text: post.text, badge };
    rendered.set(post.id, entry);

    if (settings.hideEnabled && result.score !== null && result.score >= settings.hideAbove && !revealed.has(post.id)) {
      hide(post, result, entry);
    }
  }

  // Hide the whole card and leave a one-line stub. The card stays in the DOM
  // because LinkedIn's renderer owns it and breaks if its nodes vanish.
  function hide(post, result, entry) {
    const card = post.card;
    const stub = document.createElement('div');
    stub.className = 'aisig-stub';
    stub.dataset.level = level(result);
    const [light, mood] = FACE[stub.dataset.level];
    const show = document.createElement('button');
    show.type = 'button';
    show.className = 'aisig-show';
    show.textContent = 'show';
    stub.append(light + ' ' + mood + ' Hidden a post scoring ' + result.score + ' ');
    stub.appendChild(show);
    show.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      revealed.add(post.id);
      unhide(entry);
    });
    card.parentElement.insertBefore(stub, card);
    entry.stub = stub;
    entry.card = card;
    entry.display = card.style.display;
    card.style.setProperty('display', 'none', 'important');
  }

  function unhide(entry) {
    if (!entry.stub) return;
    entry.stub.remove();
    entry.card.style.display = entry.display || '';
    delete entry.stub;
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
    for (const entry of rendered.values()) { unhide(entry); entry.badge.remove(); }
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
        if (m.target.closest && m.target.closest('.aisig-badge, .aisig-stub')) continue;
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
