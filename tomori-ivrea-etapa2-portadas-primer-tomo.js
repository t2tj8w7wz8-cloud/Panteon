/* TOMORI Etapa 2 · Portadas del tomo 1 en perfil y tarjeta de tomo.
 * Usa las referencias oficiales ya registradas en la edicion o en el tomo 1.
 * Mantiene el estandar visual aprobado: portada a sangre, esquinas redondeadas
 * y tira de valoracion intacta. No altera filtros, colecciones ni paginacion.
 */
(function(){
  'use strict';
  if(window.__tomoriIvreaPrimerTomoCoversLoaded)return;
  window.__tomoriIvreaPrimerTomoCoversLoaded=true;

  const DEFAULT_RATIO = 450/640;
  const css=document.createElement('style');
  css.id='tomori-ivrea-primer-tomo-covers-css';
  css.textContent=`
    .tm-iv-cover-host {
      position: relative !important; overflow: hidden !important;
      box-sizing: border-box !important;
      margin: 0 !important; padding: 0 !important; border: 0 !important;
      background-color: #111 !important;
      border-radius: var(--tm-iv-clip-radius, 9px) !important;
      isolation: isolate;
    }
    .tm-iv-cover-host > img.tm-iv-cover-img {
      position: absolute !important; inset: 0 !important;
      display: block !important; width: 100% !important; height: 100% !important;
      max-width: none !important; max-height: none !important;
      margin: 0 !important; padding: 0 !important; border: 0 !important;
      object-fit: cover !important; object-position: center center !important;
      border-radius: inherit !important;
      transform: scale(1.06) !important; transform-origin: center center !important;
      background: #111; z-index: 1;
    }
    .tm-iv-cover-host > .volume-cover-rating,
    .tm-iv-cover-host > .rating-seal {
      position: absolute !important;
      left: 0 !important; bottom: 4px !important; top: auto !important; right: auto !important;
      z-index: 2 !important;
      display: inline-flex !important; align-items: center !important; gap: 6px !important;
      min-height: 0 !important;
      padding: 10px 14px 9px 14px !important;
      margin: 0 !important;
      background: rgba(232,232,232,.70) !important;
      color: #111 !important;
      border: 0 !important;
      border-radius: 0 14px 14px 0 !important;
      box-shadow: none !important;
      line-height: 1 !important;
      font-weight: 700 !important;
      pointer-events: none !important;
      -webkit-backdrop-filter: blur(1px) !important;
      backdrop-filter: blur(1px) !important;
    }
    .tm-iv-cover-host > .volume-cover-rating .volume-cover-rating-value,
    .tm-iv-cover-host > .rating-seal .rating-value,
    .tm-iv-cover-host > .rating-seal {
      font-size: 1rem !important;
      color: #111 !important;
      font-variant-numeric: tabular-nums !important;
    }
    .tm-iv-cover-host > .volume-cover-rating .volume-cover-rating-star,
    .tm-iv-cover-host > .rating-seal .rating-star {
      font-size: 1.06rem !important;
      color: #c62828 !important;
      line-height: 1 !important;
    }
    .volume-card.tm-iv-card-horizontal,
    .series-card.tm-iv-card-horizontal,
    .tm-edition-card.tm-iv-card-horizontal,
    .edition-card.tm-iv-card-horizontal {
      grid-template-columns: var(--tm-iv-cover-width) minmax(0, 1fr) !important;
      align-self: start !important;
    }
    .tm-iv-card-horizontal .tm-iv-cover-host {
      width: var(--tm-iv-cover-width) !important;
      min-width: 0 !important; max-width: none !important;
      flex: 0 0 var(--tm-iv-cover-width) !important;
      height: 100% !important; min-height: 0 !important;
      aspect-ratio: var(--tm-iv-ratio) !important;
      align-self: stretch !important;
    }
    .tm-iv-card-vertical > .tm-iv-cover-host,
    .tm-iv-card-vertical > .volume-main > .tm-iv-cover-host {
      width: 100% !important; height: auto !important;
      min-height: 0 !important; aspect-ratio: var(--tm-iv-ratio) !important;
    }
    .profile-cover.tm-iv-cover-host {
      aspect-ratio: var(--tm-iv-ratio, 0.703125) !important;
      height: auto !important; min-height: 0 !important;
      align-self: center !important;
      justify-self: center !important;
      margin-inline: auto !important;
    }
  `;
  document.head.appendChild(css);

  const watched = new WeakSet();
  const resizeObserver = typeof ResizeObserver==='function'
    ? new ResizeObserver(entries=>{ for(const e of entries){ const host=e.target.querySelector('.tm-iv-cover-host'); if(host) fitCover(host);} })
    : null;

  function norm(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
  function qsWorkName(){
    const qs = new URLSearchParams(location.search);
    return (qs.get('serie') || qs.get('series') || '').trim();
  }
  function currentWork(){
    if(typeof WORKS==='undefined' || !Array.isArray(WORKS)) return null;
    const title=(document.querySelector('#seriesTitle')?.textContent||'').trim();
    const q=qsWorkName();
    return WORKS.find(w=>norm(w.name)===norm(title) || norm(w.name)===norm(q)) || null;
  }
  function currentEditionId(){ return document.getElementById('volumeEdition')?.value || null; }
  function editionById(id){ return (typeof EDITIONS!=='undefined'&&Array.isArray(EDITIONS)) ? EDITIONS.find(e=>e.id===id)||null : null; }
  function firstCoverForEdition(edition, work){
    if(!edition && !work) return null;
    const vol1 = (typeof VOLUMES!=='undefined'&&Array.isArray(VOLUMES) && edition)
      ? VOLUMES.find(v=>v.editionId===edition.id && Number(v.num)===1 && /^https:\/\//i.test(v.coverUrl||''))
      : null;
    const candidates = [
      vol1?.coverUrl,
      edition?.firstVolumeCoverReferenceUrl,
      work?.firstVolumeCoverReferenceUrl
    ].filter(v=>typeof v==='string' && /^https:\/\//i.test(v));
    return candidates[0] || null;
  }
  function volumeObjFromCard(card, edition){
    const ids=[card.getAttribute('data-volume-id'), card.getAttribute('data-volume'), card.getAttribute('data-id')].filter(Boolean);
    if(typeof VOLUMES!=='undefined' && Array.isArray(VOLUMES)){
      for(const id of ids){ const exact=VOLUMES.find(v=>v.id===id); if(exact) return exact; }
    }
    const txt=[...ids, card.querySelector('.volume-info h3, .volume-info h2, .volume-title, h3, h2')?.textContent||''].join(' ');
    const m=txt.match(/(?:tomo|vol(?:umen)?\.?|#)\s*[#º°n\u00b0.:\-]*\s*(\d{1,4})(?!\d)/i) || txt.match(/:(\d{3,4})\b/);
    const num=m?Number(m[1]):null;
    if(!num || typeof VOLUMES==='undefined' || !Array.isArray(VOLUMES) || !edition) return null;
    return VOLUMES.find(v=>v.editionId===edition.id && Number(v.num)===num) || null;
  }
  function ratioOf(host){
    const img=host.querySelector(':scope > img.tm-iv-cover-img');
    const nativeRatio=img&&img.naturalWidth>0&&img.naturalHeight>0 ? img.naturalWidth/img.naturalHeight : DEFAULT_RATIO;
    return Number.isFinite(nativeRatio)&&nativeRatio>=0.52&&nativeRatio<=0.86 ? nativeRatio : DEFAULT_RATIO;
  }
  function getInfo(card,host){
    const candidate = card.querySelector('.volume-info, .series-info, .tm-edition-info, .edition-info, .tm-edition-details, .edition-details');
    if(candidate && !host.contains(candidate)) return candidate;
    return Array.from(card.children).find(child=>child!==host && !child.contains(host)) || null;
  }
  function isRounded(radius){ return /[1-9]/.test(radius||''); }
  function setCoverRadius(host,card,horizontal){
    const original=host.dataset.tmIvOriginalRadius || '';
    if(isRounded(original)){ host.style.setProperty('--tm-iv-clip-radius', original); return; }
    const cardRadius=card ? getComputedStyle(card).borderTopLeftRadius : '';
    const r=isRounded(cardRadius)?cardRadius:'9px';
    const radius=!card ? r : horizontal ? `${r} 0 0 ${r}` : `${r} ${r} 0 0`;
    host.style.setProperty('--tm-iv-clip-radius', radius);
  }
  function fitCover(host){
    if(!host.isConnected) return;
    const ratio=ratioOf(host);
    host.style.setProperty('--tm-iv-ratio', String(ratio));
    host.style.setProperty('aspect-ratio', String(ratio), 'important');
    const card = host.closest('.volume-card, .series-card, .tm-edition-card, .edition-card');
    if(!card){ setCoverRadius(host,null,false); return; }
    const rect=card.getBoundingClientRect();
    const coverRect=host.getBoundingClientRect();
    const info=getInfo(card,host);
    const infoRect=info?.getBoundingClientRect();
    if(!rect.width || !rect.height || !coverRect.width || !coverRect.height) return;
    const horizontal = infoRect && infoRect.width>0 && infoRect.left>=coverRect.right-12 && infoRect.top<coverRect.bottom-Math.min(12, coverRect.height/4);
    card.classList.toggle('tm-iv-card-horizontal', !!horizontal);
    card.classList.toggle('tm-iv-card-vertical', !horizontal);
    setCoverRadius(host,card,!!horizontal);
    if(horizontal){
      const desired = Math.max(40, Math.min(rect.width * 0.63, (rect.height - (card.clientTop || 0) * 2) * ratio));
      const px = `${Math.round(desired*10)/10}px`;
      if(card.style.getPropertyValue('--tm-iv-cover-width')!==px) card.style.setProperty('--tm-iv-cover-width', px);
      card.style.setProperty('--tm-iv-ratio', String(ratio));
      card.style.setProperty('grid-template-columns', `${px} minmax(0, 1fr)`, 'important');
      host.style.setProperty('width', px, 'important');
      host.style.setProperty('height', '100%', 'important');
      host.style.setProperty('min-height', '0', 'important');
      host.style.setProperty('flex', `0 0 ${px}`, 'important');
    } else {
      card.style.removeProperty('--tm-iv-cover-width');
      card.style.setProperty('--tm-iv-ratio', String(ratio));
      card.style.removeProperty('grid-template-columns');
      host.style.setProperty('width', '100%', 'important');
      host.style.setProperty('height', 'auto', 'important');
      host.style.setProperty('min-height', '0', 'important');
      host.style.removeProperty('flex');
    }
    if(resizeObserver && !watched.has(card)) { watched.add(card); resizeObserver.observe(card); }
  }
  function putImage(host,url,alt){
    if(!host || !url || host.dataset.tmCoverFailed==='1') return;
    if(host.querySelector(':scope > img.tm-op-cover-img, :scope > img.tm-iv-cover-img')){ fitCover(host); return; }
    if(!('tmIvOriginalRadius' in host.dataset)) host.dataset.tmIvOriginalRadius=getComputedStyle(host).borderRadius;
    host.classList.add('tm-iv-cover-host');
    const img=document.createElement('img');
    img.className='tm-iv-cover-img'; img.alt=alt; img.loading='lazy'; img.decoding='async'; img.referrerPolicy='no-referrer';
    img.addEventListener('load', ()=>{ if(host.classList.contains('profile-cover')) host.style.setProperty('aspect-ratio', String(ratioOf(host)), 'important'); fitCover(host); }, {once:true});
    img.addEventListener('error', ()=>{ img.remove(); host.classList.remove('tm-iv-cover-host'); host.dataset.tmCoverFailed='1'; }, {once:true});
    host.insertBefore(img, host.firstChild); img.src=url;
    if(host.classList.contains('profile-cover')){
      host.style.setProperty('aspect-ratio', String(DEFAULT_RATIO), 'important');
      host.style.setProperty('height', 'auto', 'important');
      host.style.setProperty('min-height', '0', 'important');
    }
    fitCover(host);
  }
  function applyProfileCover(){
    const work=currentWork(); if(!work) return;
    const edition = editionById(currentEditionId()) || ((typeof EDITIONS!=='undefined'&&Array.isArray(EDITIONS)) ? (EDITIONS.find(e=>e.workId===work.id && e.primary===true) || EDITIONS.find(e=>e.workId===work.id)) : null);
    const url=firstCoverForEdition(edition, work);
    if(!url) return;
    const host=document.querySelector('.profile-cover');
    if(host) putImage(host, url, `${work.name} · portada del tomo 1 de Ivrea Argentina`);
  }
  function applyVolumeOneCover(){
    const work=currentWork(); if(!work) return;
    const edition = editionById(currentEditionId()) || ((typeof EDITIONS!=='undefined'&&Array.isArray(EDITIONS)) ? (EDITIONS.find(e=>e.workId===work.id && e.primary===true) || EDITIONS.find(e=>e.workId===work.id)) : null);
    if(!edition) return;
    document.querySelectorAll('.volume-card').forEach(card=>{
      const v=volumeObjFromCard(card, edition);
      if(!v || Number(v.num)!==1) return;
      const url = (typeof v.coverUrl==='string' && /^https:\/\//i.test(v.coverUrl)) ? v.coverUrl : firstCoverForEdition(edition, work);
      if(!url) return;
      const host=card.querySelector('.volume-cover');
      if(host) putImage(host, url, `${work.name} · portada del tomo 1 de Ivrea Argentina`);
    });
  }
  let queued=false;
  function sync(){ if(queued) return; queued=true; requestAnimationFrame(()=>{ queued=false; applyProfileCover(); applyVolumeOneCover(); }); }
  function init(){
    sync();
    const observer = new MutationObserver(muts=>{ if(muts.some(m=>[...m.addedNodes].some(n=>n.nodeType===1 && !n.classList?.contains('tm-iv-cover-img')))) sync(); });
    observer.observe(document.body,{childList:true,subtree:true});
    document.getElementById('volumeEdition')?.addEventListener('change', sync);
    window.addEventListener('tomori:state', sync);
    window.addEventListener('resize', sync, {passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
