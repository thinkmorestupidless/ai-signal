# AI Signal

A Chrome extension that scores LinkedIn and Reddit posts for signs of AI-generated writing and
shows the score as a badge above each one. It is a signal, not a verdict.

**This is a first draft.** It works, it is honest about what it is, and it has real limitations.
Read [Limitations](#limitations) before trusting a number.

## What it does

On the LinkedIn feed, on Reddit listings and on a post's own page, each post gets a pill above
its text with a traffic light, the score and a mood. On Reddit, comments are scored too (there is
a switch), and a post's title counts as part of its text:

    🟢 AI signal 23 😌  medium confidence
    🟡 AI signal 52 🤨  medium confidence
    🔴 AI signal 84 🤮  medium confidence

Click the pill for the reasons: the stylistic signals found, each with the weight it added or
removed. Posts under 30 words are not scored.

Optionally, posts at or above a score you choose are hidden. The card collapses to a one-line
stub ("🔴 🤮 Hidden a post scoring 84 · show"). The button toggles: show expands the post
under the stub, hide collapses it again. The card stays in the DOM with `display: none` rather
than being removed, because the sites' renderers own those nodes and throw when they vanish.

Nothing leaves your browser. There is no network access, no account, no analytics. Settings are
kept in Chrome's synced extension storage.

## How it scores

The default scorer is a heuristic in plain JavaScript, `src/scorer.js`. No model, no network.
It looks for habits that LLM-written social posts share (the "it's not X, it's Y" hook, em
dashes, emoji bullets, stock vocabulary, uniform sentence lengths, tidy punctuation, a closing
call to action) and habits that people have and models rarely do (lowercase "i", sloppy spacing,
swearing, run-on sentences, chat slang). The weights are hand set, summed and squashed to 0 to
100.

The scorer is one function, `score(text)`, returning `{ score, confidence, words, signals }`.
A model-based scorer (Transformers.js in an offscreen document) or an API-based one can replace
it behind the same interface; the popup already has the selector.

## Limitations

- **It is a stylistic heuristic, not a detector.** It measures how much a text reads like
  boilerplate, which correlates with machine writing but is not the same thing. A careful human
  who writes in the LinkedIn house style scores high; a model asked to write loosely scores low.
  Its confidence never rises above "medium" on purpose.
- **It is better on LinkedIn than on Reddit.** The signals were tuned on LinkedIn posts, which
  have a recognisable register. Reddit writing is more varied, comments are short, and the
  scorer has no feel for the conventions of a given subreddit. Expect more amber and more wrong
  calls there.
- **Short text defeats it.** Under 30 words it refuses; under 60 it says so. Most Reddit comments
  fall under the first line.
- **Edited, paraphrased or lightly humanised text defeats it.** Every stylistic detector shares
  this weakness; this one has it in full.
- **It flags some human writers unfairly.** Non-native English writers and anyone taught formal
  business writing produce exactly the tidy, uniform prose it penalises. This is documented for
  every detector of its kind and is the main reason the badge says "signal" and not "AI".
- **English only.** The phrase list and the punctuation habits are English.
- **The site adapters follow the sites' markup and will break when it changes.** LinkedIn was
  verified live in October 2026. Reddit's current UI was verified against saved pages from the
  same month; the old.reddit.com selectors are from memory and unverified.
- **No benchmark.** The smoke test checks that an obviously machine-styled sample scores high
  and an obviously human one scores low. There is no labelled corpus behind the weights, so no
  accuracy figure is claimed.

## Install

From the Chrome Web Store, once listed. Until then, or for development:

1. Open `chrome://extensions`, turn on Developer mode.
2. Load unpacked, choose this directory.
3. Open LinkedIn or Reddit. The popup (toolbar icon) has the switch, the minimum word count,
   whether to show the reasons, the comments switch and the hide threshold.

After pulling changes, press the reload arrow on the extension's card.

## Develop

    just test       # runs the scorer over the samples in test/samples.js
    just package    # builds dist/ai-signal-<version>.zip for the Web Store

Each site has one adapter that holds every selector and exposes `findPosts()` and
`badgeAnchor()`; the content script is site-agnostic and the manifest loads one adapter per host.

- `src/linkedin.js`: the 2026 UI (`componentkey` attributes, `data-testid="expandable-text-box"`),
  with a fallback for the older `feed-shared-update-v2` markup. Full post text is in the DOM even
  when clamped behind "… more".
- `src/reddit.js`: the web-component UI (`shreddit-post`, `shreddit-comment`, light-DOM slots
  `text-body` and `comment`, ids ending `-post-rtjson-content` and `-comment-rtjson-content`) and
  old.reddit.com (`div.thing`, `.usertext-body .md`). Feed cards carry the full text of a post
  behind a CSS clamp, so they score the same as the post page.

## Layout

    manifest.json      MV3; one content-script entry per site
    src/scorer.js      the heuristic scorer (also loadable in node)
    src/linkedin.js    LinkedIn adapter: finds posts and their text
    src/reddit.js      Reddit adapter: posts and comments, new and old UI
    src/content.js     scans, scores, renders badges and stubs, re-scans on DOM changes
    src/badge.css      badge and stub styles; colours follow the page's own text colour
    popup/             settings
    store/             Chrome Web Store listing text and packaging notes
    test/              smoke test for the scorer

## Licence

MIT. See `LICENSE`.
