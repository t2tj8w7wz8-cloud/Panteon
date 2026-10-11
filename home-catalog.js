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
