/*
 * TOMORI · One Piece Ivrea Argentina · portadas a sangre y esquinas redondeadas · 2026-10-22 · zoom + centrado + tiras de valoracion.
 * Las portadas externas se usan SOLO en el prototipo privado, sin licencia confirmada.
 * Correccion visual: la imagen cubre todo el marco, sin bandas y con esquinas redondeadas.
 * No altera coleccion, favoritos, filtros, renderizado ni paginacion.
 */
(function () {
  'use strict';
  if (window.__tomoriOnePieceCoversLoaded) return;
  window.__tomoriOnePieceCoversLoaded = true;

  const EDITION = 'edition:ivrea-ar-one-piece';
  const WORK = 'work:one-piece';
  const DEFAULT_RATIO = 450 / 640;
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
    /* Ajuste SOLO de portadas One Piece con una imagen realmente enlazada. */
    /* Solo el area de portada: sin marco blanco, sin padding y sin alterar la tarjeta. */
    .tm-op-cover-host {
      position: relative !important; overflow: hidden !important;
      box-sizing: border-box !important;
      margin: 0 !important; padding: 0 !important; border: 0 !important;
      background-color: #111 !important;
      border-radius: var(--tm-op-clip-radius, 9px) !important;
      isolation: isolate;
    }
    .tm-op-cover-host > img.tm-op-cover-img {
      position: absolute !important; inset: 0 !important;
      display: block !important; width: 100% !important; height: 100% !important;
      max-width: none !important; max-height: none !important;
      min-width: 0 !important; min-height: 0 !important;
      margin: 0 !important; padding: 0 !important; border: 0 !important;
      object-fit: cover !important; object-position: center center !important;
      border-radius: inherit !important;
      /* Amplificacion suave: evita ribetes claros que algunas imagenes traen incorporados. */
      transform: scale(1.06) !important; transform-origin: center center !important;
      background: #111; z-index: 1;
    }
    .tm-op-cover-host > .volume-cover-rating,
    .tm-op-cover-host > .rating-seal {
      position: absolute !important;
      left: 0 !important; bottom: 0 !important; top: auto !important; right: auto !important;
      z-index: 2 !important;
      display: inline-flex !important; align-items: center !important; gap: 6px !important;
      min-height: 0 !important;
      padding: 8px 12px 7px 12px !important;
      margin: 0 !important;
      background: rgba(232,232,232,.70) !important;
      color: #111 !important;
      border: 0 !important;
      border-radius: 0 12px 0 0 !important;
      box-shadow: none !important;
      line-height: 1 !important;
      font-weight: 700 !important;
      pointer-events: none !important;
      -webkit-backdrop-filter: blur(1px) !important;
      backdrop-filter: blur(1px) !important;
    }
    .tm-op-cover-host > .volume-cover-rating .volume-cover-rating-value,
    .tm-op-cover-host > .rating-seal .rating-value,
    .tm-op-cover-host > .rating-seal {
      font-size: .92rem !important;
      color: #111 !important;
      font-variant-numeric: tabular-nums !important;
    }
    .tm-op-cover-host > .volume-cover-rating .volume-cover-rating-star,
    .tm-op-cover-host > .rating-seal .rating-star {
      font-size: .95rem !important;
      color: #c62828 !important;
      line-height: 1 !important;
    }

    /* En tarjetas horizontales la anchura de la columna de imagen deriva
       de la altura de la tarjeta x la proporcion de la portada (no 42% fijo). */
    .volume-card.tm-op-card-horizontal,
    .series-card.tm-op-card-horizontal,
    .tm-edition-card.tm-op-card-horizontal,
    .edition-card.tm-op-card-horizontal {
      grid-template-columns: var(--tm-op-cover-width) minmax(0, 1fr) !important;
      align-self: start !important;
    }
    .tm-op-card-horizontal .tm-op-cover-host {
      width: var(--tm-op-cover-width) !important;
      min-width: 0 !important; max-width: none !important;
      flex: 0 0 var(--tm-op-cover-width) !important;
      height: 100% !important; min-height: 0 !important;
      aspect-ratio: var(--tm-op-ratio) !important;
      align-self: stretch !important;
    }
    /* Cuando la ficha es vertical, la propia caratula determina su alto. */
    .tm-op-card-vertical > .tm-op-cover-host,
    .tm-op-card-vertical > .volume-main > .tm-op-cover-host {
      width: 100% !important; height: auto !important;
      min-height: 0 !important; aspect-ratio: var(--tm-op-ratio) !important;
    }
    /* Ficha principal de la obra: conservar su ancho y calcular altura proporcional. */
    .profile-cover.tm-op-cover-host {
      aspect-ratio: var(--tm-op-ratio, 0.703125) !important;
      height: auto !important; min-height: 0 !important;
      align-self: center !important;
      justify-self: center !important;
      margin-inline: auto !important;
    }
  `;
  document.head.appendChild(css);

  const watched = new WeakSet();
  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(entries => {
        for (const entry of entries) {
          const card = entry.target;
          const host = card.querySelector('.tm-op-cover-host');
          if (host) fitCover(host);
        }
      }) : null;

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
    return !!(editionSelect && editionSelect.value === EDITION && card.closest('#volumeResults'));
  }

  function ratioOf(host) {
    const img = host.querySelector(':scope > img.tm-op-cover-img');
    const nativeRatio = img && img.naturalWidth > 0 && img.naturalHeight > 0
      ? img.naturalWidth / img.naturalHeight : DEFAULT_RATIO;
    // Ignore distorted dimensions sent by an image CDN; manga covers are vertical.
    return Number.isFinite(nativeRatio) && nativeRatio >= 0.52 && nativeRatio <= 0.86
      ? nativeRatio : DEFAULT_RATIO;
  }

  function getInfo(card, host) {
    const candidate = card.querySelector('.volume-info, .series-info, .tm-edition-info, .edition-info, .tm-edition-details, .edition-details');
    if (candidate && !host.contains(candidate)) return candidate;
    return Array.from(card.children).find(child => child !== host && !child.contains(host)) || null;
  }

  function isRounded(radius) {
    return /[1-9]/.test(radius || '');
  }

  // Respetar el radio original. Si el tema antiguo no lo define, recortar
  // solo las esquinas externas segun la disposicion de la ficha.
  function setCoverRadius(host, card, horizontal) {
    const original = host.dataset.tmOpOriginalRadius || '';
    if (isRounded(original)) {
      host.style.setProperty('--tm-op-clip-radius', original);
      return;
    }
    const cardRadius = card ? getComputedStyle(card).borderTopLeftRadius : '';
    const r = isRounded(cardRadius) ? cardRadius : '9px';
    const radius = !card ? r : horizontal ? `${r} 0 0 ${r}` : `${r} ${r} 0 0`;
    host.style.setProperty('--tm-op-clip-radius', radius);
  }

  function fitCover(host) {
    if (!host.isConnected) return;
    const ratio = ratioOf(host);
    host.style.setProperty('--tm-op-ratio', String(ratio));
    host.style.setProperty('aspect-ratio', String(ratio), 'important');
    const card = host.closest('.volume-card, .series-card, .tm-edition-card, .edition-card');
    if (!card) {
      setCoverRadius(host, null, false);
      return;
    }
    const rect = card.getBoundingClientRect();
    const coverRect = host.getBoundingClientRect();
    const info = getInfo(card, host);
    const infoRect = info?.getBoundingClientRect();
    if (!rect.width || !rect.height || !coverRect.width || !coverRect.height) return;

    // Detectar la disposicion existente, sin imponer un nuevo diseno.
    // Tambien sirve en movil cuando una ficha cambia de horizontal a vertical.
    const horizontal = infoRect && infoRect.width > 0 &&
      infoRect.left >= coverRect.right - 12 &&
      infoRect.top < coverRect.bottom - Math.min(12, coverRect.height / 4);
    card.classList.toggle('tm-op-card-horizontal', Boolean(horizontal));
    card.classList.toggle('tm-op-card-vertical', !horizontal);
    setCoverRadius(host, card, Boolean(horizontal));
    if (horizontal) {
      const desired = Math.max(40, Math.min(rect.width * 0.63,
        (rect.height - (card.clientTop || 0) * 2) * ratio));
      const px = `${Math.round(desired * 10) / 10}px`;
      if (card.style.getPropertyValue('--tm-op-cover-width') !== px)
        card.style.setProperty('--tm-op-cover-width', px);
      card.style.setProperty('--tm-op-ratio', String(ratio));
      // Propiedades directas: prevalecen sobre CSS antiguo guardado en cache
      // o reglas especificas de las fichas aprobadas.
      card.style.setProperty('grid-template-columns', `${px} minmax(0, 1fr)`, 'important');
      host.style.setProperty('width', px, 'important');
      host.style.setProperty('height', '100%', 'important');
      host.style.setProperty('min-height', '0', 'important');
      host.style.setProperty('flex', `0 0 ${px}`, 'important');
    } else {
      card.style.removeProperty('--tm-op-cover-width');
      card.style.setProperty('--tm-op-ratio', String(ratio));
      card.style.removeProperty('grid-template-columns');
      host.style.setProperty('width', '100%', 'important');
      host.style.setProperty('height', 'auto', 'important');
      host.style.setProperty('min-height', '0', 'important');
      host.style.removeProperty('flex');
    }
    if (resizeObserver && !watched.has(card)) {
      watched.add(card);
      resizeObserver.observe(card);
    }
  }

  function putImage(host, url, alt) {
    if (!host || !url || host.dataset.tmCoverFailed === '1') return;
    const previous = host.querySelector(':scope > img.tm-op-cover-img');
    if (previous) {
      if (previous.dataset.coverUrl === url) { fitCover(host); return; }
      previous.remove();
    }
    if (!('tmOpOriginalRadius' in host.dataset))
      host.dataset.tmOpOriginalRadius = getComputedStyle(host).borderRadius;
    host.classList.add('tm-op-cover-host');
    const img = document.createElement('img');
    img.className = 'tm-op-cover-img';
    img.dataset.coverUrl = url;
    img.alt = alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('load', () => {
      if (host.classList.contains('profile-cover'))
        host.style.setProperty('aspect-ratio', String(ratioOf(host)), 'important');
      fitCover(host);
    }, { once: true });
    img.addEventListener('error', () => {
      img.remove();
      host.classList.remove('tm-op-cover-host');
      host.style.removeProperty('--tm-op-ratio');
      host.style.removeProperty('--tm-op-clip-radius');
      for (const name of ['aspect-ratio', 'height', 'width', 'min-height', 'flex'])
        host.style.removeProperty(name);
      host.dataset.tmCoverFailed = '1';
      const card = host.closest('.volume-card, .series-card, .tm-edition-card, .edition-card');
      if (card) {
        card.classList.remove('tm-op-card-horizontal', 'tm-op-card-vertical');
        card.style.removeProperty('--tm-op-cover-width');
        card.style.removeProperty('--tm-op-ratio');
        card.style.removeProperty('grid-template-columns');
      }
    }, { once: true });
    host.insertBefore(img, host.firstChild);
    img.src = url;
    if (host.classList.contains('profile-cover')) {
      host.style.setProperty('aspect-ratio', String(DEFAULT_RATIO), 'important');
      host.style.setProperty('height', 'auto', 'important');
      host.style.setProperty('min-height', '0', 'important');
    }
    fitCover(host);
  }

  function applyVolumeCovers() {
    const profile = isSeriesProfile();
    document.querySelectorAll('.volume-card').forEach(card => {
      const number = volumeNumber(card);
      if (!number || !covers.has(number) || !belongsToIvrea(card, profile)) return;
      const host = card.querySelector('.volume-cover');
      if (host) putImage(host, covers.get(number), `Portada de One Piece, tomo ${number}, Ivrea Argentina`);
    });
  }

  function applySeriesCovers() {
    document.querySelectorAll('.series-card').forEach(card => {
      const name = card.dataset.series || card.querySelector('h3, h2')?.textContent || '';
      if (!/^\s*one\s*piece\s*$/i.test(name)) return;
      const host = card.querySelector('.series-cover');
      if (host) putImage(host, covers.get(1), 'One Piece · Portada del tomo 1 de Ivrea Argentina');
    });
    if (!isSeriesProfile()) return;
    const host = document.querySelector('.profile-cover');
    if (host) putImage(host, covers.get(1), 'One Piece · Portada del tomo 1 de Ivrea Argentina');
    document.querySelectorAll('#editionResults .tm-edition-card, #editionResults .edition-card').forEach(card => {
      const text = card.textContent || '';
      if (!/ivrea/i.test(text) || /planeta|panini/i.test(text)) return;
      const cover = card.querySelector('.tm-edition-cover, .edition-cover, .series-cover, .volume-cover');
      if (cover) putImage(cover, covers.get(1), 'One Piece · Portada de la edición Ivrea Argentina');
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
    // Reaplicar portadas despues de filtros, "Lo tengo" y "Mostrar mas".
    // No observar atributos ni texto para evitar bucles de renderizado.
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => [...m.addedNodes].some(node =>
        node.nodeType === 1 && !node.classList?.contains('tm-op-cover-img')))) sync();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.getElementById('volumeEdition')?.addEventListener('change', sync);
    window.addEventListener('tomori:state', sync);
    window.addEventListener('resize', sync, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
