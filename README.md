# AI Signal

A Chrome extension that scores LinkedIn and Reddit posts for signs of AI-generated writing and
shows the score as a badge above each one. It is a signal, not a verdict.

## What it does

On the LinkedIn feed, on Reddit listings and on a post's own page, each post gets a pill above
its text with a traffic light, the score and a mood. On Reddit, comments are scored too (there is
a switch), and a post's title counts as part of its text:

    🟢 AI signal 23 😌  medium confidence
    🟡 AI signal 52 🤨  medium confidence
    🔴 AI signal 84 🤮  medium confidence

Click the pill for the reasons: the stylistic signals found, each with the weight it added or
removed. Posts under 30 words are not scored. Comments are not scored.

Optionally, posts at or above a score you choose are hidden. The card is collapsed to a one-line
stub ("🔴 🤮 Hidden a post scoring 84 · show"). The button toggles: show expands the post
under the stub, hide collapses it again. The card stays in the
DOM with `display: none` rather than being removed, because LinkedIn's renderer owns those nodes
and throws when they vanish under it.

## How it scores

The default scorer is a heuristic in plain JavaScript, `src/scorer.js`. No model, no network;
nothing leaves the browser. It looks for habits that LLM-written LinkedIn posts share (the
"it's not X, it's Y" hook, em dashes, emoji bullets, stock vocabulary, uniform sentence lengths,
tidy punctuation, a closing call to action) and habits that people have and models rarely do
(lowercase "i", sloppy spacing, swearing, run-on sentences, chat slang). The weights are hand
set, summed and squashed to 0 to 100.

Its confidence never rises above "medium". Short, edited or paraphrased text defeats it, and like
every detector it flags some human writers unfairly, non-native English writers in particular.
Treat a high score as "reads like boilerplate", not "written by a machine".

The scorer is one function, `score(text)`, returning `{ score, confidence, words, signals }`.
A model-based scorer (Transformers.js in an offscreen document) or an API-based one can replace
it behind the same interface; the popup already has the selector.

## Install

1. Open `chrome://extensions`, turn on Developer mode.
2. Load unpacked, choose this directory.
3. Open LinkedIn. The popup (toolbar icon) has the switch, the minimum word count, whether to
   show the reasons, and the hide threshold.

## Develop

    node test/run.js

runs the scorer over the samples in `test/samples.js` and checks it separates the obvious cases.
Each site has one adapter that holds every selector and exposes `findPosts()` and
`badgeAnchor()`; the content script is site-agnostic and the manifest loads one adapter per host.

- `src/linkedin.js` was verified against the 2026 UI (`componentkey` attributes,
  `data-testid="expandable-text-box"`), with a fallback for the older `feed-shared-update-v2`
  markup. Full post text is in the DOM even when clamped behind "… more".
- `src/reddit.js` covers the web-component UI (`shreddit-post`, `shreddit-comment`, light-DOM
  slots `text-body` and `comment`, ids ending `-post-rtjson-content` and
  `-comment-rtjson-content`) and old.reddit.com (`div.thing`, `.usertext-body .md`). It was
  verified in jsdom against saved copies of the front page and a post page from 2026-10-21; the
  old-Reddit selectors are from memory. Feed cards carry the full text of a post behind a CSS
  clamp, so they score the same as the post page.

## Layout

    manifest.json      MV3; one content-script entry per site
    src/scorer.js      the heuristic scorer (also loadable in node)
    src/linkedin.js    LinkedIn adapter: finds posts and their text
    src/reddit.js      Reddit adapter: posts and comments, new and old UI
    src/content.js     scans, scores, renders badges, re-scans on DOM changes
    src/badge.css      badge styles, light and dark
    popup/             settings
    test/              smoke test for the scorer
