/* TOMORI · Catálogo real v1.0 — Inicio.
 * Mantiene las plantillas visuales aprobadas; sustituye únicamente su contenido.
 * Sin compras, votos ni seguimientos demostrativos. Estado por edición.
 */
(function(){
 'use strict';
 const C=window.TomoriCollector;
 if (!C || typeof SERIES === 'undefined' || typeof VOLUMES === 'undefined')return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const primary=SERIES.filter(s=>s.primary);
 const byEdition=new Map(SERIES.map(s=>[s.id,s]));
 // Selección de tomos publicados de obras diferentes, sin presentar datos
 // anteriores como lanzamientos actuales cuando su fecha no está verificada.
 const samples=[];
 for(const edition of primary){
   const list=VOLUMES.filter(v=>v.editionId===edition.id&&v.published).sort((a,b)=>b.num-a.num);
   if(list.length)samples.push(list[0]);
 }
 const featured=document.getElementById('featured');
 const popular=document.getElementById('popular');
 const releases=document.getElementById('releases');
 if(!featured||!popular||!releases)return;
 const card=(ed,s)=>`<article class="series-card" tabindex="0" role="link" data-series="${esc(ed.name)}" data-edition-id="${esc(ed.id)}" aria-label="Abrir ${esc(ed.name)}, ${esc(ed.editionName)}"><div class="series-cover" aria-label="Portada genérica sin licencia de imagen"></div><div class="series-info"><h3>${esc(ed.name)}</h3><p>${esc(ed.publisher)} · ${esc(ed.market)} · ${esc(ed.editionName)}</p><span class="series-rating" aria-label="Sin valoraciones comunitarias"><span class="series-rating-value">—</span><span class="series-rating-star">★</span></span><button type="button" class="series-follow ${s.follow[ed.id]?'active':''}" aria-label="Seguir edición" data-home-follow="${esc(ed.id)}" aria-pressed="${!!s.follow[ed.id]}">${s.follow[ed.id]?'✓':'+'}</button></div></article>`;
 const heart='<svg class="tomori-state-icon tomori-heart" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>';
 const book='<svg class="tomori-state-icon tomori-book" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false"><path d="M12 7.3c-2.3-1.7-5.4-2.1-9-1.1V19c3.6-1 6.7-.6 9 1.1m0-12.8c2.3-1.7 5.4-2.1 9-1.1V19c-3.6-1-6.7-.6-9 1.1m0-12.8v12.8"/></svg>';
 const vol=(v,s)=>{const ed=byEdition.get(v.editionId),want=!!s.wanted[v.id],owned=!!s.owned[v.id];return `<article class="volume-card" data-home-volume="${esc(v.id)}"><div class="volume-main"><div class="volume-cover" aria-label="Portada genérica; uso de portadas reales pendiente de permisos"></div><div class="volume-info"><h3>${esc(v.series)} · Tomo ${v.num}</h3><p>${esc(v.publisher)} · ${esc(v.market)}</p><p>${esc(ed?.editionName||'Edición verificada')}</p><p>Publicado · Registro editorial</p><div class="volume-actions"><button class="action ${want?'active':''}" data-action="want-real" data-volume-id="${esc(v.id)}" type="button" aria-label="Lo quiero" aria-pressed="${want}">${want?heart:'Lo quiero'}</button><button class="action ${owned?'active':''}" data-action="own-real" data-volume-id="${esc(v.id)}" type="button" aria-label="Lo tengo" aria-pressed="${owned}">${owned?book:'Lo tengo'}</button><button class="follow ${s.follow[v.editionId]?'active':''}" data-home-follow="${esc(v.editionId)}" type="button" aria-label="Seguir edición" aria-pressed="${!!s.follow[v.editionId]}">${s.follow[v.editionId]?'✓':'+'}</button></div></div></div></article>`};
 // Las viñetas originales de Inicio muestran 3 + 3 + 4 fichas.
 // Con cinco obras algunas se repiten entre secciones, no en el mismo grupo.
 function paint(){
  const s=C.read();
  featured.innerHTML=primary.slice(0,3).map(e=>card(e,s)).join('');
  popular.innerHTML=primary.slice(3).concat(primary.slice(0,1)).map(e=>card(e,s)).join('');
  releases.innerHTML=samples.slice(0,4).map(v=>vol(v,s)).join('');
 }
 // En Inicio existe código ilustrativo antiguo: interceptar solo los clics
 // de tarjetas importadas para que no altere los estados ni genere toasts falsos.
 document.addEventListener('click',event=>{
  const mark=event.target.closest('#releases [data-volume-id]');
  const follow=event.target.closest('#featured [data-home-follow],#popular [data-home-follow],#releases [data-home-follow]');
  const seriesCard=event.target.closest('#featured .series-card[data-edition-id],#popular .series-card[data-edition-id]');
  if(!mark&&!follow&&!seriesCard)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(mark){
   const kind=mark.dataset.action.startsWith('want-')?'want':'own';
   C.changeMark(mark.dataset.volumeId,kind);
   paint();
  }else if(follow){
   C.changeFollow(follow.dataset.homeFollow);
   paint();
  }else if(seriesCard){
   location.href='serie.html?serie='+encodeURIComponent(seriesCard.dataset.series)+'&edicion='+encodeURIComponent(seriesCard.dataset.editionId);
  }
 },true);
 // Evento teclado: las fichas mantienen navegación accesible.
 document.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  const card=event.target.closest('#featured .series-card[data-edition-id],#popular .series-card[data-edition-id]');
  if(!card||event.target.closest('button'))return;
  event.preventDefault();event.stopImmediatePropagation();
  location.href='serie.html?serie='+encodeURIComponent(card.dataset.series)+'&edicion='+encodeURIComponent(card.dataset.editionId);
 },true);
 // Mantener datos de Inicio sincronizados con los de las otras páginas.
 window.addEventListener('storage',e=>{if(e.key===C.key)paint()});
 window.addEventListener('tomori:state',paint);
 paint();
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
