/*
 * TOMORI · Portadas One Piece / Editorial Ivrea Argentina · prototipo privado.
 * 2026-10-16. Uso de imágenes externas NO licenciado ni autorizado.
 * No modifica datos personales, botones, filtros, navegación ni paginación.
 * Los enlaces externos pueden fallar: en tal caso vuelve la portada provisional.
 */
(function () {
  'use strict';
  if (window.__tomoriOnePieceCoversLoaded) return;
  window.__tomoriOnePieceCoversLoaded = true;

  const EDITION = 'edition:ivrea-ar-one-piece';
  const WORK = 'work:one-piece';
  const volumes = typeof VOLUMES !== 'undefined' && Array.isArray(VOLUMES) ? VOLUMES : [];
  const covers = new Map(volumes
    .filter(v => v.workId === WORK && v.editionId === EDITION &&
      v.published === true && Number.isInteger(v.num) && v.num >= 1 && v.num <= 109 &&
      typeof v.coverUrl === 'string' && /^https:\/\//.test(v.coverUrl))
    .map(v => [v.num, v.coverUrl]));
  if (!covers.size) return;

  const css = document.createElement('style');
  css.id = 'tomori-onepiece-covers-css';
  css.textContent = `
    .tm-op-cover-host { position: relative !important; overflow: hidden; }
    .tm-op-cover-host > img.tm-op-cover-img {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: contain; object-position: center; display: block;
      background: #111; z-index: 1;
    }
    .tm-op-cover-host > .volume-cover-rating,
    .tm-op-cover-host > .series-rating,
    .tm-op-cover-host > .rating-seal { position: relative; z-index: 2; }
  `;
  document.head.appendChild(css);

  function isSeriesProfile() {
    if (!document.querySelector('#volumeResults')) return false;
    const qs = new URLSearchParams(location.search);
    const title = (document.querySelector('#seriesTitle')?.textContent || '').trim();
    const param = (qs.get('serie') || qs.get('series') || '').trim();
    return /\bone\s*piece\b/i.test(title || param);
  }

  function volumeNumber(card) {
    const parts = [card.getAttribute('data-volume-id'), card.getAttribute('data-volume'),
      card.getAttribute('data-id'), card.getAttribute('data-tomo'),
      card.querySelector('[data-volume-id]')?.getAttribute('data-volume-id'),
      card.querySelector('[data-volume]')?.getAttribute('data-volume'),
      card.querySelector('.volume-info h3, .volume-info h2, .volume-title, h3, h2')?.textContent];
    for (const part of parts) {
      if (!part) continue;
      const m = String(part).match(/volume:ivrea-ar-one-piece:(\d{1,3})/i) ||
        String(part).match(/(?:tomo|vol(?:umen)?\.?|#)\s*[#º°n\u00b0.:\-]*\s*(\d{1,3})(?!\d)/i);
      if (m) return Number(m[1]);
    }
    return null;
  }

  function belongsToIvrea(card, profile) {
    const heading = card.querySelector('.volume-info h3, .volume-info h2, .volume-title, h3, h2')?.textContent || '';
    const text = card.textContent || '';
    const id = [card.dataset.volumeId, card.dataset.volume, card.dataset.id].filter(Boolean).join(' ');
    if (/volume:ivrea-ar-one-piece:/i.test(id)) return true;
    if (/volume:(?!ivrea-ar-one-piece:)/i.test(id)) return false;
    if (/planeta|panini/i.test(text)) return false;
    if (/(?:ivrea|argentina)/i.test(text) && (/(?:one\s*piece)/i.test(text) || profile)) return true;
    if (!profile || (!/one\s*piece/i.test(heading) && !/tomo\s*\d+/i.test(heading))) return false;
    const editionSelect = document.getElementById('volumeEdition');
    // When the title is ambiguous, only assign the cover in the Ivrea-only filtered list.
    return !!(editionSelect && editionSelect.value === EDITION && card.closest('#volumeResults'));
  }

  function putImage(host, url, alt) {
    if (!host || !url) return;
    const previous = host.querySelector(':scope > img.tm-op-cover-img');
    if (previous) {
      if (previous.dataset.coverUrl === url) return;
      previous.remove();
    }
    host.classList.add('tm-op-cover-host');
    const img = document.createElement('img');
    img.className = 'tm-op-cover-img';
    img.dataset.coverUrl = url;
    img.src = url;
    img.alt = alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      // Keep the original provisional black cover; never hide the card.
      img.remove();
      host.classList.remove('tm-op-cover-host');
      host.dataset.tmCoverFailed = '1';
    }, { once: true });
    // Preserve rating badge as the top layer.
    host.insertBefore(img, host.firstChild);
  }

  function applyVolumeCovers() {
    const profile = isSeriesProfile();
    document.querySelectorAll('.volume-card').forEach(card => {
      const number = volumeNumber(card);
      if (!number || !covers.has(number) || !belongsToIvrea(card, profile)) return;
      const host = card.querySelector('.volume-cover');
      if (host && host.dataset.tmCoverFailed !== '1') {
        putImage(host, covers.get(number), `Portada de One Piece, tomo ${number}, Ivrea Argentina`);
      }
    });
  }

  function applySeriesCovers() {
    // One Piece's work and Ivrea edition: use volume 1 as the visual representative.
    document.querySelectorAll('.series-card').forEach(card => {
      const name = card.dataset.series || card.querySelector('h3, h2')?.textContent || '';
      if (!/^\s*one\s*piece\s*$/i.test(name)) return;
      const host = card.querySelector('.series-cover');
      if (host && host.dataset.tmCoverFailed !== '1') putImage(host, covers.get(1), 'One Piece · Portada del tomo 1 de Ivrea Argentina');
    });
    if (!isSeriesProfile()) return;
    const host = document.querySelector('.profile-cover');
    if (host && host.dataset.tmCoverFailed !== '1') putImage(host, covers.get(1), 'One Piece · Portada del tomo 1 de Ivrea Argentina');
    document.querySelectorAll('#editionResults .tm-edition-card, #editionResults .edition-card').forEach(card => {
      const text = card.textContent || '';
      if (!/ivrea/i.test(text) || /planeta|panini/i.test(text)) return;
      const editionCover = card.querySelector('.tm-edition-cover, .edition-cover, .series-cover, .volume-cover');
      if (editionCover && editionCover.dataset.tmCoverFailed !== '1') putImage(editionCover, covers.get(1), 'One Piece · Portada de la edición Ivrea Argentina');
    });
  }

  let queued = false;
  function sync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      applyVolumeCovers();
      applySeriesCovers();
    });
  }
  function init() {
    sync();
    // Renderers replace whole card lists on state changes; reapply only the images.
    // childList observation does not watch text, button state or filters directly.
    const obs = new MutationObserver(mutations => {
      if (mutations.some(m => [...m.addedNodes].some(node =>
        node.nodeType === 1 && !node.classList?.contains('tm-op-cover-img')))) sync();
    });
    obs.observe(document.body, { childList: true, subtree: true });
    document.getElementById('volumeEdition')?.addEventListener('change', sync);
    window.addEventListener('tomori:state', sync);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
