// Each top-level demo visit starts fresh. Frames share only this tab's session.
(() => {
  'use strict';
  window.resetChampionshipSession = () => {
    try {
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('olchipanel.championship.')) sessionStorage.removeItem(key);
      }
    } catch (_) {}
  };
  if (window.parent === window) {
    window.resetChampionshipSession();
    window.addEventListener('pageshow', event => {
      if (event.persisted) location.reload();
    });
  }
})();
