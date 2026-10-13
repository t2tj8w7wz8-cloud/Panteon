const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const storeKey='tomori-internacional-experimental-v12';let state={};try{state=window.TomoriCollector?TomoriCollector.read():JSON.parse(localStorage.getItem(storeKey)||'{}')}catch{};state.owned??={};state.wanted??={};state.follow??={};state.ratings??={};state.quotes??={};state.votes??={};const save=()=>localStorage.setItem(storeKey,JSON.stringify(state));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=t=>{let x=$('#toast');if(!x)return;x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2400)};
const primaryEditions=SERIES.filter(s=>s.primary);
const editionById=new Map(SERIES.map(s=>[s.id,s]));
const editionForVolume=v=>editionById.get(v.editionId);
const navSeries=(n,id)=>location.href='serie.html?serie='+encodeURIComponent(n)+(id?'&edicion='+encodeURIComponent(id):'');
/* Catalogo real: no hay valoraciones ni votos comunitarios importados. */
const serieCard=s=>`<article class="series-card" tabindex="0" role="link" data-open-series="${esc(s.name)}" data-edition="${esc(s.id)}"><div class="series-cover" aria-label="Portada genérica, derechos de imagen pendientes"></div><div class="series-info"><h3>${esc(s.name)}</h3><p>${esc(s.publisher)} · ${esc(s.market)} · ${esc(s.editionName)}</p><span class="series-rating" aria-label="Todavía no hay valoraciones"><span class="series-rating-star" aria-hidden="true">★</span><span class="series-rating-value">—</span></span><button class="series-follow ${state.follow[s.id]?'active':''}" data-toggle-follow="${esc(s.id)}" aria-label="Seguir esta edición" aria-pressed="${!!state.follow[s.id]}">${state.follow[s.id]?'✓':'+'}</button></div></article>`;
// TOMORI · Norma global de estados de tomos (v1.0): iconos negros, sin cambiar tamaño.
const tomoriIconHeart='<svg class="tomori-state-icon tomori-heart" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>';
const tomoriIconBook='<svg class="tomori-state-icon tomori-book" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" focusable="false"><path d="M12 7.3c-2.3-1.7-5.4-2.1-9-1.1V19c3.6-1 6.7-.6 9 1.1m0-12.8c2.3-1.7 5.4-2.1 9-1.1V19c-3.6-1-6.7-.6-9 1.1m0-12.8v12.8"/></svg>';
const tomoriTomoLabel=(mark,selected)=>selected?(mark==='want'?tomoriIconHeart:tomoriIconBook):(mark==='want'?'Lo quiero':'Lo tengo');
const tomoCard=(v,showCoverRating=false)=>{const own=!!state.owned[v.id],want=!!state.wanted[v.id],edition=editionForVolume(v),label=edition?edition.editionName:v.market;
 return `<article class="volume-card"><div class="volume-main"><div class="volume-cover" role="img" aria-label="Portada genérica, pendiente de autorización"></div><div class="volume-info"><h3><a href="serie.html?serie=${encodeURIComponent(v.series)}&edicion=${encodeURIComponent(v.editionId)}" style="color:inherit;text-decoration:none">${esc(v.series)}</a> · Tomo ${v.num}</h3><p>${v.published?'Publicado':'Anunciado, no publicado'}</p><p>${esc(v.publisher)} · ${esc(v.market)} · ${esc(label)}</p><div class="volume-actions"><button type="button" class="action ${want?'active':''}" aria-label="Lo quiero" title="Lo quiero" aria-pressed="${want}" data-mark="want" data-id="${esc(v.id)}">${tomoriTomoLabel('want',want)}</button><button type="button" class="action ${own?'active':''}" aria-label="Lo tengo" title="Lo tengo" aria-pressed="${own}" data-mark="own" data-id="${esc(v.id)}">${tomoriTomoLabel('own',own)}</button><button class="follow ${state.follow[v.editionId]?'active':''}" data-toggle-follow="${esc(v.editionId)}" aria-label="Seguir edición" aria-pressed="${!!state.follow[v.editionId]}">${state.follow[v.editionId]?'✓':'+'}</button></div></div></div></article>`};
function initCommon(){const h=$('#header'),m=$('#menu'),mb=$('#menuButton');function upd(){h.classList.toggle('compact',scrollY>90)}addEventListener('scroll',upd,{passive:true});upd();mb.onclick=()=>{m.classList.toggle('open');mb.setAttribute('aria-expanded',m.classList.contains('open'))};$('#closeMenu').onclick=()=>m.classList.remove('open');document.addEventListener('keydown',e=>{if(e.key==='Escape')m.classList.remove('open')});document.addEventListener('click',e=>{const dest=e.target.closest('[data-dest]');if(dest){m.classList.remove('open');if(dest.dataset.dest==='catalogo')location.href='catalogo.html';else if(dest.dataset.dest==='feedback' && $('#feedback'))$('#feedback').scrollIntoView({behavior:'smooth',block:'start'});else if(dest.dataset.dest==='coleccion')location.href='coleccion.html';else if(dest.dataset.dest==='sesion')location.href='perfil.html';else toast('Sección fuera del alcance de v1.1')}const open=e.target.closest('[data-open-series]');if(open&&!e.target.closest('button'))navSeries(open.dataset.openSeries,open.dataset.edition);const follow=e.target.closest('[data-toggle-follow]');if(follow){let n=follow.dataset.toggleFollow;state.follow[n]=window.TomoriCollector?TomoriCollector.changeFollow(n):!state.follow[n];if(!window.TomoriCollector)save();$$(`[data-toggle-follow]`).filter(b=>b.dataset.toggleFollow===n).forEach(b=>{b.classList.toggle('active',!!state.follow[n]);b.textContent=state.follow[n]?'✓':'+';b.setAttribute('aria-pressed',!!state.follow[n])});const b=$('#followSeries');if(b&&activeSeries?.id===n)b.textContent=state.follow[n]?'✓ Siguiendo':'Seguir edición'}const mark=e.target.closest('[data-mark]');if(mark){const id=mark.dataset.id,kind=mark.dataset.mark;if(kind==='own'&&!VOLUMES.find(v=>v.id===id)?.published){toast('Este tomo está anunciado y no se confirmó su publicación');return;}const already=!!state[kind==='own'?'owned':'wanted'][id];if(window.TomoriCollector){TomoriCollector.changeMark(id,kind,!already);state=TomoriCollector.read()}else{state[kind==='own'?'owned':'wanted'][id]=!already;if(!already)state[kind==='own'?'wanted':'owned'][id]=false;save()}if(document.body.dataset.page==='catálogo')renderCatalog();else if(document.body.dataset.page==='perfil de serie')renderVolumes();if(document.body.dataset.page==='perfil de serie')renderProgress()}});document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-open-series]'))navSeries(e.target.dataset.openSeries,e.target.dataset.edition)})}
let view='series',catCount=8;
// Selección múltiple por criterio: OR dentro de cada grupo, AND entre grupos.
const seriesFacetLabels={genre:'Género',publisher:'Editorial',status:'Estado'};
const seriesSelectedFilters={genre:new Set(),publisher:new Set(),status:new Set()};
let seriesSort='name';
// Lanzamientos: filtros independientes de Series. Selección OR por grupo y AND entre grupos.
const launchSelectedFilters={genre:new Set(),publisher:new Set(),status:new Set()};
let launchSort='recent';
const launchSeriesByName=new Map(SERIES.map(series=>[series.name,series]));
function initCatalog(){
  const groups=[['genre','Género'],['publisher','Editorial'],['status','Estado']];
  $('#catalogFilterOptions').innerHTML=groups.map(([key,label])=>{
    const values=[...new Set(primaryEditions.map(s=>s[key]))].sort((a,b)=>a.localeCompare(b,'es'));
    return `<fieldset class="catalog-filter-group"><legend>${label}</legend>${values.map(v=>`<label class="catalog-filter-choice"><input type="checkbox" data-facet="${key}" value="${esc(v)}"><span>${esc(v)}</span></label>`).join('')}</fieldset>`;
  }).join('');
  $('#catalogFilterOptions').addEventListener('change',e=>{
    const box=e.target.closest('input[data-facet]');if(!box)return;
    const group=seriesSelectedFilters[box.dataset.facet];
    if(box.checked)group.add(box.value);else group.delete(box.value);
    catCount=8;renderCatalog();
  });
  $('#catalogSortOptions').addEventListener('change',e=>{
    const radio=e.target.closest('input[name="catalogSort"]');if(!radio)return;
    seriesSort=radio.value;catCount=8;$('#catalogSortDropdown').open=false;renderCatalog();
  });
  $('#catalogActiveFilters').addEventListener('click',e=>{
    const chip=e.target.closest('button[data-remove-facet]');if(!chip)return;
    const group=seriesSelectedFilters[chip.dataset.removeFacet];group.delete(chip.dataset.removeValue);
    const input=[...$$('#catalogFilterOptions input[data-facet]')].find(x=>x.dataset.facet===chip.dataset.removeFacet&&x.value===chip.dataset.removeValue);
    if(input)input.checked=false;
    catCount=8;renderCatalog();
  });
  // Los mismos controles de Series, pero con estado independiente en Lanzamientos.
  $('#launchFilterOptions').innerHTML=groups.map(([key,label])=>{
    const values=[...new Set(VOLUMES.map(v=>editionById.get(v.editionId)?.[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    return `<fieldset class="catalog-filter-group"><legend>${label}</legend>${values.map(v=>`<label class="catalog-filter-choice"><input type="checkbox" data-launch-facet="${key}" value="${esc(v)}"><span>${esc(v)}</span></label>`).join('')}</fieldset>`;
  }).join('');
  $('#launchFilterOptions').addEventListener('change',e=>{
    const box=e.target.closest('input[data-launch-facet]');if(!box)return;
    const group=launchSelectedFilters[box.dataset.launchFacet];
    if(box.checked)group.add(box.value);else group.delete(box.value);
    catCount=8;renderCatalog();
  });
  $('#launchSortOptions').addEventListener('change',e=>{
    const radio=e.target.closest('input[name="launchSort"]');if(!radio)return;
    launchSort=radio.value;catCount=8;$('#launchSortDropdown').open=false;renderCatalog();
  });
  $('#launchActiveFilters').addEventListener('click',e=>{
    const chip=e.target.closest('button[data-remove-launch-facet]');if(!chip)return;
    launchSelectedFilters[chip.dataset.removeLaunchFacet].delete(chip.dataset.removeLaunchValue);
    const input=[...$$('#launchFilterOptions input[data-launch-facet]')].find(x=>x.dataset.launchFacet===chip.dataset.removeLaunchFacet&&x.value===chip.dataset.removeLaunchValue);
    if(input)input.checked=false;
    catCount=8;renderCatalog();
  });
  // Solo una lista desplegada a la vez; se cierran al pulsar fuera.
  const menus=[$('#catalogFilterDropdown'),$('#catalogSortDropdown'),$('#launchFilterDropdown'),$('#launchSortDropdown')];
  menus.forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open)menus.filter(other=>other!==menu).forEach(other=>other.open=false)}));
  document.addEventListener('click',e=>{if(!e.target.closest('.catalog-filter-dropdown'))menus.forEach(menu=>menu.open=false)});
  $$('[data-view]').forEach(b=>b.onclick=()=>{
    view=b.dataset.view;catCount=8;
    $$('[data-view]').forEach(x=>x.classList.toggle('active',x===b));
    $('#catalogSearch').value='';
    menus.forEach(menu=>menu.open=false);
    renderCatalog();
  });
  $('#catalogSearch').addEventListener('input',()=>{catCount=8;renderCatalog()});
  $('#catalogMore').onclick=()=>{catCount+=8;renderCatalog()};renderCatalog();
}
function renderActiveSeriesFilters(){
  const chips=[];
  for(const [key,label] of Object.entries(seriesFacetLabels)){
    for(const value of [...seriesSelectedFilters[key]].sort((a,b)=>a.localeCompare(b,'es'))){
      chips.push(`<button type="button" class="catalog-filter-chip" data-remove-facet="${key}" data-remove-value="${esc(value)}" aria-label="Quitar filtro ${label}: ${esc(value)}"><span>${label}: ${esc(value)}</span><span class="catalog-chip-remove" aria-hidden="true">×</span></button>`);
    }
  }
  $('#catalogActiveFilters').innerHTML=chips.join('');
  const count=chips.length,badge=$('#catalogFilterCount');badge.textContent=count;badge.hidden=count===0;
  const current={name:'Nombre',year:'Fecha',pop:'Popularidad'};
  $('#catalogCurrentSort').textContent=current[seriesSort];
}
function renderActiveLaunchFilters(){
  const chips=[];
  for(const [key,label] of Object.entries(seriesFacetLabels)){
    for(const value of [...launchSelectedFilters[key]].sort((a,b)=>a.localeCompare(b,'es'))){
      chips.push(`<button type="button" class="catalog-filter-chip" data-remove-launch-facet="${key}" data-remove-launch-value="${esc(value)}" aria-label="Quitar filtro ${label}: ${esc(value)}"><span>${label}: ${esc(value)}</span><span class="catalog-chip-remove" aria-hidden="true">×</span></button>`);
    }
  }
  $('#launchActiveFilters').innerHTML=chips.join('');
  const count=chips.length,badge=$('#launchFilterCount');badge.textContent=count;badge.hidden=count===0;
  const names={recent:'Más reciente',old:'Más antiguo',popular:'Más solicitado',name:'Nombre'};
  $('#launchCurrentSort').textContent=names[launchSort];
}
function renderCatalog(){
  const q=$('#catalogSearch').value.trim().toLocaleLowerCase('es');
  const results=$('#catalogResults'),filters=$('#catalogFilters'),more=$('#catalogMore');
  filters.hidden=view==='populares';more.hidden=view==='populares';
  $('#seriesControls').hidden=view!=='series';
  $('#catalogActiveFilters').hidden=view!=='series';
  $('#launchControls').hidden=view!=='lanzamientos';
  $('#catalogTitle').textContent=({series:'Todas las series',lanzamientos:'Nuevos lanzamientos',populares:'Rankings populares'})[view];
  if(view==='populares'){
    results.className='';
    // Conservar el aspecto de los bloques aprobados, sin clasificaciones ni votos ficticios.
    const sorted=primaryEditions.slice().sort((a,b)=>a.name.localeCompare(b.name,'es'));
    const latest=VOLUMES.filter(v=>v.published).slice().sort((a,b)=>b.num-a.num);
    const blocks=[['Series del catálogo','Muestra editorial por nombre, sin métricas de popularidad.',sorted.slice(0,3),false],['Tomos publicados','Tomos individualmente documentados.',latest.slice(0,3),true],['Otras obras verificadas','Aún no existen valoraciones comunitarias.',sorted.slice(2,5),false],['Ediciones disponibles','No hay votos suficientes para generar un ranking.',latest.slice(3,6),true]];
    results.innerHTML=blocks.map(([title,desc,items,isVol])=>`<div class="ranking-block"><h2 style="display:table;padding:10px 20px;background:white;border:2px solid #111;box-shadow:4px 4px #111">${title}</h2><p class="ranking-description">${desc}</p><div class="cards ${isVol?'volume-grid launch-volume-grid ranking-volume-grid':'series-grid'} catalog-grid">${items.map(v=>`<div class="rank-wrap">${isVol?tomoCard(v):serieCard(v)}</div>`).join('')}</div><div class="ranking-more-wrap"><button class="button ranking-more" type="button" data-ranking>Ver ranking completo</button></div></div>`).join('');
    $$('[data-ranking]').forEach(b=>b.onclick=()=>toast('No hay suficientes datos de usuarios para publicar rankings.'));
    return;
  }
  const isVol=view==='lanzamientos';
  results.className=`cards ${isVol?'volume-grid launch-volume-grid':'series-grid'} catalog-grid`;
  let items=(isVol?VOLUMES:primaryEditions).filter(x=>[x.name,x.series,x.author,x.publisher,x.editionName,x.market,x.num&&'tomo '+x.num,x.num].filter(Boolean).join(' ').toLocaleLowerCase('es').includes(q));
  if(!isVol){
    for(const key of Object.keys(seriesSelectedFilters)){
      const active=seriesSelectedFilters[key];if(active.size)items=items.filter(s=>active.has(s[key]));
    }
    items.sort((a,b)=>seriesSort==='name'?a.name.localeCompare(b.name,'es'):seriesSort==='year'?b.year-a.year||a.name.localeCompare(b.name,'es'):b.pop-a.pop||a.name.localeCompare(b.name,'es'));
    renderActiveSeriesFilters();
  }else{
    for(const key of Object.keys(launchSelectedFilters)){
      const active=launchSelectedFilters[key];
      if(active.size)items=items.filter(v=>active.has(editionById.get(v.editionId)?.[key]));
    }
    items.sort((a,b)=>{
      if(launchSort==='old')return (a.releaseDate||'').localeCompare(b.releaseDate||'')||a.num-b.num||a.series.localeCompare(b.series,'es');
      if(launchSort==='popular')return b.pop-a.pop||b.year-a.year||b.num-a.num;
      if(launchSort==='name')return a.series.localeCompare(b.series,'es')||a.num-b.num;
      return (b.releaseDate||'').localeCompare(a.releaseDate||'')||b.num-a.num||a.series.localeCompare(b.series,'es');
    });
    renderActiveLaunchFilters();
  }
  results.innerHTML=items.slice(0,catCount).map(isVol?(v=>tomoCard(v,true)):serieCard).join('')||'<p class="empty">No hay resultados para esta búsqueda o filtros.</p>';
  more.hidden=items.length<=catCount;
}
let activeSeries,allVol=[],volCount=12,quoteCount=3;
function initProfile(){
 const qp=new URLSearchParams(location.search),requested=qp.get('serie'),editionId=qp.get('edicion');
 activeSeries=SERIES.find(s=>s.id===editionId && (!requested||s.name===requested))||SERIES.find(s=>s.name===requested&&s.primary)||primaryEditions[0];
 if(!activeSeries)return;
 $('#volumeSearch').oninput=resetVol;$('#volumeSort').onchange=resetVol;$('#volumeFilter').onchange=resetVol;
 $('#volumeMore').onclick=()=>{volCount+=matchMedia('(max-width:600px)').matches?4:12;renderVolumes()};
 addEventListener('resize',()=>renderVolumes());
 $$('[data-scroll]').forEach(b=>b.onclick=()=>$('#'+b.dataset.scroll).scrollIntoView({behavior:'smooth'}));
 $('#rateSeries').onclick=()=>{$('#ratingEditor').hidden=!$('#ratingEditor').hidden};
 $('#saveRating').onclick=()=>{const values=$$('#ratingInputs select').map(e=>Number(e.value));state.ratings[activeSeries.id]=values;save();$('#ratingEditor').hidden=true;renderRatings();toast('Tu valoración personal se guardó')};
 $('#followSeries').onclick=()=>{state.follow[activeSeries.id]=window.TomoriCollector?TomoriCollector.changeFollow(activeSeries.id):!state.follow[activeSeries.id];if(!window.TomoriCollector)save();$('#followSeries').textContent=state.follow[activeSeries.id]?'✓ Siguiendo':'Seguir edición'};
 applyActiveEdition();
}
function applyActiveEdition(){
 const s=activeSeries,editionList=SERIES.filter(e=>e.workId===s.workId);
 $('#pageHeading').textContent=s.name;$('#seriesTitle').textContent=s.name;
 const values=[['Autor',s.author],['Géneros',s.genre],['Editorial y edición',s.publisher+' · '+s.market+' · '+s.editionName],['Estado de edición',s.status==='complete'?'Completa':s.status==='out_of_print'?'Descatalogada':s.status==='ongoing'?'En curso':'Por revisar'],['Publicados en esta edición',s.publishedCount==null?'Cantidad pendiente de confirmar':s.publishedCount+' declarados · '+s.publishedVerifiedCount+' fichas verificadas']];
 $('#seriesMeta').innerHTML=values.map(([k,v])=>`<p><strong>${esc(k)}</strong><br>${esc(v)}</p>`).join('')+`<p style="grid-column:1/-1"><label for="editionSelector"><strong>Seleccionar edición</strong></label><select id="editionSelector" class="control" style="max-width:100%;width:100%;margin-top:8px" aria-label="Seleccionar editorial, país y edición">${editionList.map(e=>`<option value="${esc(e.id)}" ${e.id===s.id?'selected':''}>${esc(e.publisher)} · ${esc(e.market)} · ${esc(e.editionName)}</option>`).join('')}</select></p>`;
 $('#editionSelector').onchange=e=>{
  const choice=editionById.get(e.target.value);if(!choice||choice.workId!==activeSeries.workId)return;
  activeSeries=choice;
  history.replaceState(null,'','serie.html?serie='+encodeURIComponent(choice.name)+'&edicion='+encodeURIComponent(choice.id));
  $('#volumeSearch').value='';$('#volumeFilter').value='all';applyActiveEdition();
 };
 $('#synopsisPublisher').textContent=s.publisher;
 $('#followSeries').textContent=state.follow[s.id]?'✓ Siguiendo':'Seguir edición';
 allVol=VOLUMES.filter(v=>v.editionId===s.id);
 renderRatings();renderProgress();volCount=matchMedia('(max-width:600px)').matches?4:12;renderVolumes();
 initQuotes();
}
function renderRatings(){
 const s=activeSeries.id,labels=['Historia','Protagonista','Arte','Personajes secundarios'];
 const mine=state.ratings[s];
 $('#ratingDetails').innerHTML=labels.map((k,i)=>`<div class="rating-row"><strong>${k}</strong><span class="stars">${mine?`${'★'.repeat(Number(mine[i]))}${'☆'.repeat(5-Number(mine[i]))} ${mine[i]}/5`:'Sin valoraciones'}</span></div>`).join('');
 $('#ratingInputs').innerHTML=labels.map((k,i)=>`<label class="rating-row">${k}<select class="control">${[1,2,3,4,5].map(n=>`<option ${n===(mine?.[i]||4)?'selected':''} value="${n}">${n} ★</option>`).join('')}</select></label>`).join('');
 $('#generalRating').textContent=mine?'★ '+(mine.reduce((a,b)=>a+Number(b),0)/mine.length).toFixed(1)+' / 5 · Personal':'★ — / 5';
 $('#ratingCount').textContent=mine?'Tu valoración personal: no representa la media de otros usuarios.':'Aún no se han recibido valoraciones reales de la comunidad.';
 $('#rateSeries').textContent=mine?'Editar mi valoración':'Valorar esta serie';
}
function renderProgress(){
 const total=activeSeries.publishedCount,owned=allVol.filter(v=>v.published&&state.owned[v.id]).length;
 const note=total===null?`${owned} tomos verificados en tu colección; el total publicado de esta edición no está confirmado.`:
 `${owned}/${total} tomos publicados declarados · ${Math.round(100*owned/total)}% · ${activeSeries.publishedVerifiedCount} fichas publicadas verificadas`;
 $('#progressBox').innerHTML=`<h3>Mi colección</h3><p><strong>${esc(note)}</strong></p>${total?`<div class="progress-bar" role="progressbar" aria-valuenow="${owned}" aria-valuemax="${total}"><div class="progress-fill" style="width:${100*owned/total}%"></div></div>`:''}`;
}
function resetVol(){volCount=matchMedia('(max-width:600px)').matches?4:12;renderVolumes()}
function renderVolumes(){if(!activeSeries)return;let items=allVol.slice(),q=$('#volumeSearch').value.trim(),filter=$('#volumeFilter').value;if(q)items=items.filter(v=>String(v.num).includes(q));if(filter==='owned')items=items.filter(v=>state.owned[v.id]);if(filter==='wanted')items=items.filter(v=>state.wanted[v.id]);if(filter==='missing')items=items.filter(v=>v.published&&!state.owned[v.id]);const sort=$('#volumeSort').value;items.sort((a,b)=>sort==='old'?a.num-b.num:sort==='rated'?b.num-a.num:sort==='collected'?b.num-a.num:b.num-a.num);$('#volumeResults').innerHTML=items.slice(0,volCount).map(v=>tomoCard(v,true)).join('')||'<p class="empty">No hay tomos que coincidan con estos filtros.</p>';$('#volumeMore').hidden=items.length<=volCount}
function initQuotes(){
 const key=activeSeries.id;
 state.quotes[key]??=[];
 $('#quoteForm').onsubmit=e=>{
  e.preventDefault();const t=$('#quoteText').value.trim();if(!t)return;
  if(/spoiler/i.test(t)){toast('Evita spoilers en tu frase');return}
  const mine=state.quotes[key].find(q=>q.id==='mine');
  if(mine)mine.text=t;else state.quotes[key].push({id:'mine',author:'Tú',text:t,votes:0,created:Date.now()});
  save();$('#quoteText').value='';renderQuotes();
 };
 quoteCount=3;
 $('#moreQuotes').onclick=()=>{quoteCount+=3;renderQuotes()};renderQuotes();
}
function renderQuotes(){
 const list=state.quotes[activeSeries.id]||[];
 $('#quotes').innerHTML=list.slice(0,quoteCount).map(q=>`<div class="quote"><small>${esc(q.author)}</small><p>${esc(q.text)}</p></div>`).join('')||'<p class="note">Todavía no hay frases aportadas por usuarios.</p>';
 $('#moreQuotes').hidden=list.length<=quoteCount;
}
/* PANTÉON — FEEDBACK GLOBAL: utilizar en todas las páginas nuevas.
   Formulario demostrativo idéntico al de Inicio, sin backend ni envío real. */
function initFeedback(){
  const form=$('#feedbackForm');
  if(!form)return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    toast('Comentario de demostración: no se envió.');
    form.reset();
  });
}
initCommon();initFeedback();if(document.body.dataset.page==='catálogo')initCatalog();if(document.body.dataset.page==='perfil de serie')initProfile();

// PANTÉON MENÚ GLOBAL — Copia exacta del algoritmo de Inicio aprobado; reutilizar en nuevas páginas.

/* Distancia perpendicular ENTRE BORDES: 4 px; contorno: 4 px.
   Centro de las líneas separado 8 px; desplazamiento horizontal: 8 sqrt(2).
   Para un ángulo de 45°, delta X = delta Y. */
(function(){
  const NS='http://www.w3.org/2000/svg';
  const stroke=4,clearGap=4,offset=(stroke+clearGap)*Math.SQRT2/2;
  function draw(row){
    const w=row.clientWidth,h=row.clientHeight;
    if(w<50||h<50)return;
    let svg=row.querySelector('svg.menu-diagonal-art');
    if(!svg){svg=document.createElementNS(NS,'svg');svg.classList.add('menu-diagonal-art');svg.setAttribute('aria-hidden','true');row.prepend(svg)}
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    svg.setAttribute('preserveAspectRatio','none');
    const top=2,bottom=h-2,run=bottom-top;
    const slope=row.classList.contains('upper')?-1:1;
    const centerTop=w/2-slope*run/2,centerBottom=w/2+slope*run/2;
    const leftTop=centerTop-offset,leftBottom=centerBottom-offset;
    const rightTop=centerTop+offset,rightBottom=centerBottom+offset;
    const a=[[2,top],[leftTop,top],[leftBottom,bottom],[2,bottom]];
    const b=[[rightTop,top],[w-2,top],[w-2,bottom],[rightBottom,bottom]];
    const points=arr=>arr.map(([x,y])=>`${x.toFixed(3)},${y.toFixed(3)}`).join(' ');
    svg.replaceChildren();
    const buttons=row.querySelectorAll('.menu-tile');
    [a,b].forEach((pts,i)=>{
      const poly=document.createElementNS(NS,'polygon');
      poly.setAttribute('points',points(pts));poly.setAttribute('fill','#F4F0E6');
      poly.setAttribute('stroke','#111111');poly.setAttribute('stroke-width','4');
      poly.setAttribute('stroke-linejoin','miter');
      svg.appendChild(poly);
      const button=buttons[i];
      button.style.clipPath=`polygon(${pts.map(([x,y])=>`${x.toFixed(3)}px ${y.toFixed(3)}px`).join(',')})`;
      const setHover=on=>poly.setAttribute('fill',on?'#eae4d9':'#F4F0E6');
      button.onmouseenter=()=>setHover(true);
      button.onmouseleave=()=>setHover(false);
      button.onfocus=()=>setHover(true);
      button.onblur=()=>setHover(false);
    });
  }
  const rows=[...document.querySelectorAll('.menu-row.diagonal')];
  rows.forEach(draw);
  if('ResizeObserver' in window){const observer=new ResizeObserver(entries=>entries.forEach(entry=>draw(entry.target)));rows.forEach(row=>observer.observe(row))}
  else window.addEventListener('resize',()=>rows.forEach(draw));
})();


/* TOMORI · TARJETAS DE TOMO COMPACTAS · REGLA APROBADA
 * Compatible con portadas Open Library y el laboratorio Ivrea.
 * No descarga ni incorpora imágenes. Solo ajusta tarjetas con imagen cargada.
 * Esta sección se añade a app.js sin modificar sus funciones existentes.
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
