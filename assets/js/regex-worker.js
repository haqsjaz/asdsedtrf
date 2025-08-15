/* /assets/js/regex-worker.js */
'use strict';

self.onmessage = (e) => {
  const { pattern = '', flags = '', text = '', maxMatches = 5000 } = e.data || {};
  try {
    // flags seguras apenas
    const safeFlags = String(flags).replace(/[^gimsuy]/g, '');
    const re = new RegExp(pattern, safeFlags);

    const matches = [];
    if (!safeFlags.includes('g')) {
      // sem 'g': apenas o primeiro match (matchAll exigiria 'g')
      const m = re.exec(text);
      if (m) matches.push({ index: m.index, length: m[0].length });
    } else {
      let m, count = 0;
      while ((m = re.exec(text)) !== null) {
        matches.push({ index: m.index, length: m[0].length });
        count++;
        if (count >= maxMatches) break;
        // evita loop infinito em matches de comprimento zero
        if (m[0] === '') re.lastIndex++;
      }
    }

    self.postMessage({ ok: true, matches });
  } catch (err) {
    self.postMessage({ ok: false, error: err && err.message ? err.message : String(err) });
  }
};
