const DEFAULTS = { enabled: true, minWords: 30, showSignals: true, scorer: 'heuristic', hideEnabled: false, hideAbove: 80 };
const $ = id => document.getElementById(id);

chrome.storage.sync.get(DEFAULTS, s => {
  $('enabled').checked = s.enabled;
  $('minWords').value = s.minWords;
  $('showSignals').checked = s.showSignals;
  $('scorer').value = s.scorer;
  $('hideEnabled').checked = s.hideEnabled;
  $('hideAbove').value = s.hideAbove;
});

$('hideEnabled').addEventListener('change', e => chrome.storage.sync.set({ hideEnabled: e.target.checked }));
$('hideAbove').addEventListener('change', e => {
  const n = Math.max(1, Math.min(100, parseInt(e.target.value, 10) || DEFAULTS.hideAbove));
  e.target.value = n;
  chrome.storage.sync.set({ hideAbove: n });
});

$('enabled').addEventListener('change', e => chrome.storage.sync.set({ enabled: e.target.checked }));
$('showSignals').addEventListener('change', e => chrome.storage.sync.set({ showSignals: e.target.checked }));
$('scorer').addEventListener('change', e => chrome.storage.sync.set({ scorer: e.target.value }));
$('minWords').addEventListener('change', e => {
  const n = Math.max(10, Math.min(500, parseInt(e.target.value, 10) || DEFAULTS.minWords));
  e.target.value = n;
  chrome.storage.sync.set({ minWords: n });
});
