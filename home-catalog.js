/* EXPERIMENTAL EN RAÍZ · Se sustituyen fichas ilustrativas por registros importados.
   Se preservan clases CSS, alturas, contornos y arquitectura HTML del Inicio. */
(function(){
 const C=window.TomoriCollector;if(!C)return;
 C.seedDemo();
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const series=SERIES.filter(s=>s.publishedVerifiedCount>0);
 const pub=VOLUMES.filter(v=>v.published);
 function paintSeries(container,items){if(!container)return;
 container.innerHTML=items.map(s=>`<article class="series-card" tabindex="0" role="button" data-series="${esc(s.name)}" aria-label="Abrir perfil de ${esc(s.name)}"><div class="series-cover" aria-label="Portada provisional"></div><div class="series-info"><h3>${esc(s.name)}</h3><p>${esc(s.publisher)} · ${esc(s.editionName)}</p><span class="series-rating" title="Valoración solo demostrativa"><span class="series-rating-value">4.3</span><span class="series-rating-star">★</span></span><button class="series-follow" aria-label="Seguir serie" aria-pressed="false">+</button></div></article>`).join('')}
 function paintVolumes(container,items){if(!container)return;
 container.innerHTML=items.map(v=>`<article class="volume-card"><div class="volume-main"><div class="volume-cover" aria-label="Sin derechos de portada"></div><div class="volume-info"><h3>${esc(v.series)} · Tomo ${v.num}</h3><p>Publicado · ficha verificable</p><p>${esc(v.publisher)}</p><div class="volume-actions"><button class="action" data-action="want-pilot" data-volume-id="${esc(v.id)}" aria-label="Lo quiero" aria-pressed="false">Lo quiero</button><button class="action" data-action="own-pilot" data-volume-id="${esc(v.id)}" aria-label="Lo tengo" aria-pressed="false">Lo tengo</button><button class="follow" data-follow="pilot" data-follow-series="${esc(v.series)}" aria-label="Seguir serie" aria-pressed="false">+</button></div></div></div></article>`).join('')}
 paintSeries(document.getElementById('featured'),series.slice(0,3));
 paintSeries(document.getElementById('popular'),series.slice(3,6));
 paintVolumes(document.getElementById('releases'),pub.slice(0,4));
 function refresh(){const s=C.read();document.querySelectorAll('#releases [data-volume-id]').forEach(b=>{const active=!!s[b.dataset.action.startsWith('want')?'wanted':'owned'][b.dataset.volumeId];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));if(typeof paintTomoButton==='function')paintTomoButton(b)});
 document.querySelectorAll('#releases [data-follow-series]').forEach(b=>{const a=!!s.follow[b.dataset.followSeries];b.classList.toggle('active',a);b.textContent=a?'✓':'+'})}
 // Original homepage action handler runs in bubble phase; this handler syncs after it.
 document.addEventListener('click',e=>{
  const mark=e.target.closest('#releases [data-volume-id]');
  if(mark){const kind=mark.dataset.action.startsWith('want')?'want':'own';C.changeMark(mark.dataset.volumeId,kind,mark.classList.contains('active'));refresh();return}
  const f=e.target.closest('#releases [data-follow-series]');
  if(f){C.changeFollow(f.dataset.followSeries,f.classList.contains('active'));refresh();return}
  const card=e.target.closest('.series-card[data-series]');
  if(card&&!e.target.closest('button'))location.href='serie.html?serie='+encodeURIComponent(card.dataset.series)
 });
 document.querySelectorAll('.series-card[data-series]').forEach(card=>{const b=card.querySelector('.series-follow');if(!b)return;const active=!!C.read().follow[card.dataset.series];b.classList.toggle('active',active);b.textContent=active?'✓':'+';b.setAttribute('aria-pressed',String(active))});
 window.addEventListener('tomori:state',refresh);refresh();
})();


/* TOMORI · TARJETAS DE TOMO COMPACTAS · REGLA APROBADA
 * Compatible con portadas Open Library y el laboratorio Ivrea.
 * No descarga ni incorpora imágenes. Solo ajusta tarjetas con imagen cargada.
 * Inicio utiliza home-catalog.js, no app.js: aquí se aplica la misma regla sin cambiar la UI.
 */
;(() => {
  'use strict';
  // Si ya está instalada la variante anterior del laboratorio, dejarla gobernar
  // las tarjetas: evita cálculos duplicados o estilos simultáneos.
  if (document.querySelector('script[src*="tomos-portada-ajustada.js"]')) return;

  const STYLE_ID = 'tomori-approved-compact-tomos-style';
  const CSS_TEXT = "/* Tomori: ajuste aprobado de altura de tarjetas de tomo con portada real.\n   No altera fichas de serie, tarjetas genericas ni ancho de la grilla. */\n.volume-card.tomori-compact-volume {\n  min-height: 0 !important;\n  grid-auto-rows: auto;\n  grid-template-columns: var(--tomori-compact-cover-width, 42%) minmax(0, 1fr);\n  align-items: start;\n  align-self: start;\n}\n.volume-card.tomori-compact-volume .volume-cover {\n  min-height: 0 !important;\n  height: auto !important;\n  aspect-ratio: var(--tomori-real-cover-ratio, 2 / 3);\n  align-self: start !important;\n  position: relative;\n  background: transparent;\n  overflow: hidden;\n}\n.volume-card.tomori-compact-volume .volume-cover > img.tomori-ivrea-cover,\n.volume-card.tomori-compact-volume .volume-cover > img.tomori-ol-cover,\n.tomori-ivrea-crop .volume-card.tomori-compact-volume .volume-cover > img.tomori-ivrea-cover {\n  position: absolute;\n  inset: 0;\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: contain !important;\n  object-position: center;\n  margin: 0;\n  padding: 0;\n  border: 0;\n}\n.volume-card.tomori-compact-volume .volume-info {\n  height: auto !important;\n  min-height: 0 !important;\n  align-self: start;\n  padding: 9px 8px;\n}\n.volume-card.tomori-compact-volume .volume-actions { padding-top: 6px; }\n";
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS_TEXT;
    document.head.appendChild(style);
  }

  let pending = false;
  const COVER_SELECTOR = ':scope > img.tomori-ivrea-cover, :scope > img.tomori-ol-cover';

  function loadedCover(card) {
    const container = card.querySelector('.volume-cover');
    if (!container) return null;
    const img = container.querySelector(COVER_SELECTOR);
    if (!img || !img.complete || img.naturalWidth < 25 || img.naturalHeight < 25) return null;
    if (!container.classList.contains('tomori-ivrea-loaded') &&
        !container.classList.contains('tomori-ol-loaded')) return null;
    return img;
  }

  function reset(card) {
    card.classList.remove('tomori-compact-volume');
    card.style.removeProperty('--tomori-compact-cover-width');
    card.style.removeProperty('--tomori-real-cover-ratio');
  }

  function adapt(card) {
    // Antes de medir, siempre restablecer la tarjeta original.
    reset(card);
    const img = loadedCover(card);
    if (!img) return;
    const cover = card.querySelector('.volume-cover');
    const info = card.querySelector('.volume-info');
    if (!cover || !info) return;

    const ratio = img.naturalWidth / img.naturalHeight;
    const currentHeight = card.getBoundingClientRect().height;
    const currentCoverWidth = cover.getBoundingClientRect().width;
    if (!(Number.isFinite(ratio) && ratio > 0 &&
          currentHeight > 0 && currentCoverWidth > 0)) return;

    card.style.setProperty('--tomori-real-cover-ratio',
      `${img.naturalWidth} / ${img.naturalHeight}`);
    card.style.setProperty('--tomori-compact-cover-width',
      `${currentCoverWidth.toFixed(2)}px`);
    card.classList.add('tomori-compact-volume');

    // Conservar inicialmente el ancho de portada aprobado. Cuando el texto
    // necesite mas anchura o la imagen exigiría aumentar el alto, ceder solo
    // ancho de la imagen, manteniendo controles e información completos.
    for (let i = 0; i < 5; i++) {
      const infoHeight = info.getBoundingClientRect().height;
      const smallestCoverWidth = Math.min(currentCoverWidth,
        Math.max(64, currentCoverWidth * .65));
      const desiredWidth = Math.max(smallestCoverWidth,
        Math.min(currentCoverWidth, infoHeight * ratio));
      const oldWidth = Number.parseFloat(
        card.style.getPropertyValue('--tomori-compact-cover-width'));
      if (Math.abs(oldWidth - desiredWidth) < .6) break;
      card.style.setProperty('--tomori-compact-cover-width',
        `${desiredWidth.toFixed(2)}px`);
    }

    // Nunca hacer la tarjeta más alta que antes a causa del ajuste.
    // Cuando el contenido no cabe, mantener la geometría previamente aprobada.
    if (card.getBoundingClientRect().height > currentHeight + 1) {
      reset(card);
    }
  }

  function refresh() {
    pending = false;
    document.querySelectorAll('.volume-card').forEach(adapt);
  }
  function queue() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(refresh);
  }
  function init() {
    ensureStyle();
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') {
          // El proveedor marca .volume-cover cuando su imagen termina de cargar.
          if (record.target.classList.contains('volume-cover')) { queue(); return; }
        } else if ([...record.addedNodes, ...record.removedNodes].some(n =>
          n.nodeType === 1 && (n.matches?.('.volume-card,img.tomori-ivrea-cover,img.tomori-ol-cover') ||
          n.querySelector?.('.volume-card,img.tomori-ivrea-cover,img.tomori-ol-cover')))) {
          queue(); return;
        }
      }
    });
    observer.observe(document.body, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['class']
    });
    document.addEventListener('load', event => {
      if (event.target.matches?.('img.tomori-ivrea-cover,img.tomori-ol-cover')) queue();
    }, true);
    window.addEventListener('resize', queue, {passive: true});
    queue();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else init();
})();
