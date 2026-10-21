# AI Signal

A Chrome extension that scores LinkedIn posts for signs of AI-generated writing and shows the
score as a badge above each post. It is a signal, not a verdict.

## What it does

On the LinkedIn feed and on a post's own page, each post gets a pill above its text with a
traffic light, the score and a mood:

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
The LinkedIn adapter in `src/linkedin.js` holds every selector; it was verified against the 2026
UI (`componentkey` attributes, `data-testid="expandable-text-box"`), with a fallback for the older
`feed-shared-update-v2` markup. Full post text is in the DOM even when clamped behind "… more", so
nothing is expanded.

## Layout

    manifest.json      MV3; content script on https://www.linkedin.com/*
    src/scorer.js      the heuristic scorer (also loadable in node)
    src/linkedin.js    finds posts and their text
    src/content.js     scans, scores, renders badges, re-scans on DOM changes
    src/badge.css      badge styles, light and dark
    popup/             settings
    test/              smoke test for the scorer
