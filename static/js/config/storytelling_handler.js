(function() {
  // Ativa o storytelling em todas as estações de 1 a 15
  const STORY_STATIONS = new Set(Array.from({ length: 15 }, (_, i) => String(i + 1)));

  const ssKey = (id) => `story_shown_station_${id}`;
  let storytellingMap = null;
  let modal, modalEl, titleEl, bodyEl, btnContinue;

  async function loadStorytelling() {
    if (storytellingMap) return storytellingMap;
    const res = await fetch('/static/data/storytelling.json', { cache: 'no-store' });
    const json = await res.json();
    storytellingMap = {};
    if (Array.isArray(json.stations)) {
      for (const s of json.stations) storytellingMap[String(s.id)] = s;
    }
    return storytellingMap;
  }

  function ensureModalRefs() {
    modalEl = document.getElementById('storytellingModal');
    if (!modalEl) return false;
    titleEl = document.getElementById('storytellingModalTitle');
    bodyEl = document.getElementById('storytellingModalBody');
    btnContinue = document.getElementById('storytellingContinueBtn');
    if (!modal) modal = new bootstrap.Modal(modalEl);
    return true;
  }

  function showStory(challengeId, title, intro) {
    return new Promise((resolve) => {
      if (!ensureModalRefs()) return resolve();
      titleEl.textContent = `Estação ${challengeId} — ${title}`;
      bodyEl.textContent = intro || '...';

      const onContinue = () => {
        btnContinue.removeEventListener('click', onContinue);
        resolve();
      };

      btnContinue.addEventListener('click', onContinue, { once: true });
      modal.show();
    });
  }

  document.addEventListener('click', async (evt) => {
    const btn = evt.target.closest('.start-challenge-btn');
    if (!btn) return;
    const challengeId = String(btn.dataset.challengeId || '');
    if (!STORY_STATIONS.has(challengeId)) return;
    if (btn.disabled) return;
    if (btn.dataset.storyBypass === 'true') return;
    if (sessionStorage.getItem(ssKey(challengeId)) === '1') return;

    evt.preventDefault();
    evt.stopPropagation();
    const map = await loadStorytelling();
    const station = map[challengeId];
    if (!station) { btn.click(); return; }

    await showStory(challengeId, station.title, station.intro_message);
    btn.dataset.storyBypass = 'true';
    btn.click();
    setTimeout(() => { delete btn.dataset.storyBypass; }, 50);
  }, true);
})();
