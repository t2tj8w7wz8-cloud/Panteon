/* TOMORI · Valoración individual de tomos · v1.0 · 2026-10-22.
 * Complemento visual independiente: NO cambia el estándar aprobado de la
 * portada principal del perfil de serie ni la lógica de colección.
 * Badge al costado inferior izquierdo de cada portada, con dimensiones
 * y altura alineadas al botón «Lo quiero» de la tarjeta.
 */
(() => {
  'use strict';
  if (window.__tomoriTomoRatingStripV1) return;
  window.__tomoriTomoRatingStripV1 = true;

  const style = document.createElement('style');
  style.id = 'tm-rating-tomos-v1';
  style.textContent = `
    /* SOLO tomos, no .profile-cover ni fichas de serie */
    .volume-card .volume-cover { position: relative; }
    .volume-card .volume-cover > .volume-cover-rating.tm-rating-tomo {
      position: absolute !important;
      left: 0 !important;
      right: auto !important;
      top: auto !important;
      bottom: var(--tm-tomo-rating-bottom, 4px) !important;
      width: var(--tm-tomo-rating-width, auto) !important;
      max-width: 100% !important;
      height: var(--tm-tomo-rating-height, 34px) !important;
      min-height: 0 !important;
      box-sizing: border-box !important;
      padding: 0 10px !important;
      margin: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 7px !important;
      white-space: nowrap !important;
      font-family: inherit !important;
      font-size: var(--tm-tomo-rating-font, 1rem) !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      color: #111 !important;
      background: rgba(232,232,232,0.70) !important;
      border: 0 !important;
      border-radius: 0 14px 14px 0 !important;
      box-shadow: none !important;
      pointer-events: none !important;
      z-index: 4 !important;
      -webkit-backdrop-filter: blur(1px);
      backdrop-filter: blur(1px);
    }
    .volume-card .volume-cover > .volume-cover-rating.tm-rating-tomo .volume-cover-rating-value {
      color: #111 !important;
      font: inherit !important;
      font-variant-numeric: tabular-nums !important;
    }
    .volume-card .volume-cover > .volume-cover-rating.tm-rating-tomo .volume-cover-rating-star {
      color: #c62828 !important;
      font-size: 1.08em !important;
      font-weight: 900 !important;
      line-height: 1 !important;
    }
  `;
  document.head.appendChild(style);

  const watching = new WeakSet();
  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(entries => {
        for (const entry of entries) {
          const card = entry.target.closest('.volume-card');
          if (card) alignCard(card);
        }
      }) : null;

  function findAction(card) {
    const actions = card.querySelector('.volume-actions');
    if (!actions) return null;
    // Un botón de la fila; se prefieren los dos de colección.
    return actions.querySelector('button.action, .action, button[data-action], button, .follow');
  }

  function ensureBadge(card) {
    const cover = card.querySelector('.volume-cover');
    if (!cover) return null;
    let badge = cover.querySelector(':scope > .volume-cover-rating');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'volume-cover-rating';
      badge.setAttribute('role', 'img');
      badge.setAttribute('aria-label', 'Sin valoraciones registradas para este tomo');
      badge.title = 'Sin valoraciones registradas';
      const value = document.createElement('span');
      value.className = 'volume-cover-rating-value';
      value.textContent = '—';
      const star = document.createElement('span');
      star.className = 'volume-cover-rating-star';
      star.textContent = '★';
      star.setAttribute('aria-hidden', 'true');
      badge.append(value, star);
      cover.appendChild(badge);
    } else if (!badge.querySelector('.volume-cover-rating-star')) {
      // Conservar íntegra la puntuación original, si ya existe.
      const value = badge.querySelector('.volume-cover-rating-value');
      if (!value) {
        const oldText = badge.textContent.trim();
        badge.textContent = '';
        const span = document.createElement('span');
        span.className = 'volume-cover-rating-value';
        span.textContent = oldText || '—';
        badge.appendChild(span);
      }
      const star = document.createElement('span');
      star.className = 'volume-cover-rating-star';
      star.textContent = '★';
      star.setAttribute('aria-hidden', 'true');
      badge.appendChild(star);
    }
    badge.classList.add('tm-rating-tomo');
    return badge;
  }

  function alignCard(card) {
    if (!card.isConnected) return;
    const cover = card.querySelector('.volume-cover');
    const badge = cover && cover.querySelector(':scope > .volume-cover-rating.tm-rating-tomo');
    if (!badge) return;
    const action = findAction(card);
    if (!action) {
      // Tarjetas sin fila de botones: mantener la tira en la base.
      badge.style.setProperty('--tm-tomo-rating-bottom', '4px');
      badge.style.setProperty('--tm-tomo-rating-height', '34px');
      badge.style.removeProperty('--tm-tomo-rating-width');
      badge.style.removeProperty('--tm-tomo-rating-font');
      return;
    }
    const coverRect = cover.getBoundingClientRect();
    const actionRect = action.getBoundingClientRect();
    if (!coverRect.width || !coverRect.height || !actionRect.height || !actionRect.width) return;

    // Mismo alto/ancho que el botón, sin invadir el espacio fuera de la portada.
    const h = Math.max(1, Math.min(actionRect.height, coverRect.height - 4));
    const w = Math.max(1, Math.min(actionRect.width, coverRect.width));
    // El borde inferior de la tira coincide con el borde inferior de la fila.
    const wantedBottom = coverRect.bottom - actionRect.bottom;
    const bottom = Math.max(4, Math.min(wantedBottom, coverRect.height - h));
    const round = n => `${Math.round(n * 10) / 10}px`;
    badge.style.setProperty('--tm-tomo-rating-bottom', round(bottom));
    badge.style.setProperty('--tm-tomo-rating-height', round(h));
    badge.style.setProperty('--tm-tomo-rating-width', round(w));
    badge.style.setProperty('--tm-tomo-rating-font', getComputedStyle(action).fontSize);

    if (resizeObserver) {
      for (const node of [card, action]) {
        if (watching.has(node)) continue;
        watching.add(node);
        resizeObserver.observe(node);
      }
    }
  }

  let scheduled = false;
  function sync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      document.querySelectorAll('.volume-card').forEach(card => {
        ensureBadge(card);
        alignCard(card);
      });
    });
  }

  function init() {
    sync();
    const observer = new MutationObserver(mutations => {
      // No reaccionar a nuestra propia inserción del indicador.
      if (mutations.some(m => Array.from(m.addedNodes).some(n =>
        n.nodeType === 1 && !n.classList?.contains('volume-cover-rating') &&
        !n.classList?.contains('volume-cover-rating-star') &&
        !n.classList?.contains('volume-cover-rating-value')))) sync();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('tomori:state', sync);
    document.getElementById('volumeEdition')?.addEventListener('change', sync);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
