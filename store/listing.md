# Chrome Web Store listing

Paste these into the developer dashboard. Keep them in step with `README.md`.

## Name
AI Signal

## Summary (132 characters max)
Scores LinkedIn and Reddit posts for signs of AI-written style and shows a badge. A signal, not a verdict. Nothing leaves your browser.

## Description
AI Signal puts a small badge above every LinkedIn and Reddit post you read, with a traffic
light, a score from 0 to 100 and a mood: 🟢 😌 reads like a person, 🟡 🤨 could be either,
🔴 🤮 reads like boilerplate. Click the badge for the reasons: the stylistic habits it found and
how much each one counted.

Optionally, hide posts at or above a score you choose. Hidden posts collapse to a one-line stub
with a show button, and can be hidden again.

The score is a stylistic signal, not a verdict. It looks for habits that machine-written social
posts share (the "it's not X, it's Y" hook, em dashes, emoji bullets, stock phrases, uniform
sentence lengths, a closing call to action) and habits that people have and models rarely do.
It is a first draft: it is better on LinkedIn than on Reddit, it refuses to score very short
text, edited or paraphrased text defeats it, and like every detector of its kind it flags some
human writers unfairly. Treat red as "reads like boilerplate", not "written by a machine".

Everything runs inside your browser. There is no network access, no account, no analytics and
no data collection of any kind. Settings are kept in Chrome's extension storage.

Open source under the MIT licence: https://github.com/thinkmorestupidless/ai-signal

## Category
Productivity (or Social & Communication)

## Language
English

## Single purpose
Show a stylistic "reads like AI" score next to each post on LinkedIn and Reddit, and optionally
hide posts above a chosen score.

## Permission justifications
- `storage`: keeps the user's settings (on/off, minimum words, show reasons, score comments,
  hide threshold) in Chrome's extension storage.
- Host access to `www.linkedin.com`, `www.reddit.com`, `old.reddit.com`, `new.reddit.com`: the
  content script has to read the text of posts on those pages to score them and insert the
  badge. No other hosts are touched. No remote code.

## Privacy tab, field by field
- Single purpose description: the line under "Single purpose" above.
- Permission justification, `storage`: the `storage` line above.
- Permission justification, host permissions: the host-access line above.
- Are you using remote code? No. All code is in the package; nothing is fetched or evaluated.
- Data usage, "What user data do you plan to collect?": tick nothing. No personally
  identifiable information, health, financial, authentication, personal communications,
  location, web history, user activity or website content is collected. Website content is
  read in the page to compute the score and is not stored or transmitted.
- Certifications: tick all three. Data is not sold to third parties, is not used or transferred
  for purposes unrelated to the item's single purpose, and is not used or transferred to
  determine creditworthiness or for lending.
- Privacy policy URL: https://github.com/thinkmorestupidless/ai-signal/blob/main/PRIVACY.md

## Assets
- Icon 128×128: `icons/icon128.png`, drawn by `icon.py` (needs Pillow; also writes 48 and 16).
- Small promo tile 440×280: `promo-small-440x280.png`, and marquee 1400×560:
  `promo-marquee-1400x560.png`, both drawn by `promo.py` (macOS Helvetica Neue).
- Screenshots: at least one, 1280×800 or 640×400, PNG or JPEG. Not kept in the repo because
  they show a real feed. Take them with the badges visible and the reasons panel open on one
  post, and pixelate other people's names and faces before uploading.

## Steps
1. Register at https://chrome.google.com/webstore/devconsole (one-time 5 USD fee, Google account).
2. `just package`, upload `dist/ai-signal-<version>.zip`.
3. Fill the listing from this file, upload the icon and screenshots, complete the privacy tab.
4. Submit for review. First reviews take from a day to a couple of weeks; host-permission
   extensions get a closer look, which the justifications above are written for.
5. Each later release: bump `version` in `manifest.json`, commit, `just package`, upload.
