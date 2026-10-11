const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const storeKey='panteon-lab-v11';let state={};try{state=JSON.parse(localStorage.getItem(storeKey)||'{}')}catch{};state.owned??={};state.wanted??={};state.follow??={};state.ratings??={};state.quotes??={};state.votes??={};const save=()=>localStorage.setItem(storeKey,JSON.stringify(state));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=t=>{let x=$('#toast');if(!x)return;x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2400)};
const navSeries=n=>location.href='serie.html?serie='+encodeURIComponent(n);
// Puntuación ilustrativa coherente con la media provisional del Perfil de serie.
// Si el usuario valora la serie, su nota afecta a la media demostrativa al volver al Catálogo.
const seriesDemoCriteria=[4.4,4.1,4.7,4.0];
const seriesDemoScore=name=>{
  const mine=state.ratings[name];
  const criteria=Array.isArray(mine)&&mine.length===4
    ?seriesDemoCriteria.map((base,i)=>(base*9+Number(mine[i]))/10)
    :seriesDemoCriteria;
  return (criteria.reduce((sum,n)=>sum+n,0)/criteria.length).toFixed(1);
};
const serieCard=s=>`<article class="series-card" tabindex="0" role="link" data-open-series="${esc(s.name)}"><div class="series-cover" aria-label="Portada provisional"></div><div class="series-info"><h3>${esc(s.name)}</h3><p>${esc(s.genre)} · ${esc(s.publisher)}</p><span class="series-rating" role="img" aria-label="Calificación ilustrativa: ${seriesDemoScore(s.name)} de 5 estrellas" title="Calificación ilustrativa de la comunidad · ${seriesDemoScore(s.name)} de 5"><span class="series-rating-star" aria-hidden="true">★</span><span class="series-rating-value" aria-hidden="true">${seriesDemoScore(s.name)}</span></span><button class="series-follow ${state.follow[s.name]?'active':''}" data-toggle-follow="${esc(s.name)}" aria-label="Seguir serie" aria-pressed="${!!state.follow[s.name]}">${state.follow[s.name]?'✓':'+'}</button></div></article>`;
// Valoración numérica ilustrativa específica del tomo; no son datos reales.
// Se muestra únicamente en la vista Lanzamientos, superpuesta a la portada.
const tomoDemoScore=v=>(3.6+((Number(v.num)*7+String(v.series).length)%14)/10).toFixed(1);
const tomoCard=(v,showCoverRating=false)=>{const own=!!state.owned[v.id],want=!!state.wanted[v.id];const score=tomoDemoScore(v);return `<article class="volume-card"><div class="volume-main"><div class="volume-cover" role="img" aria-label="Portada provisional">${showCoverRating?`<span class="volume-cover-rating" aria-label="Valoración ilustrativa del tomo: ${score} de 5" title="Valoración de ejemplo: ${score} de 5"><span class="volume-cover-rating-value">${score}</span><span class="volume-cover-rating-star" aria-hidden="true">★</span></span>`:''}</div><div class="volume-info"><h3><a href="serie.html?serie=${encodeURIComponent(v.series)}" style="color:inherit;text-decoration:none">${esc(v.series)}</a> · Tomo ${v.num}</h3><p>${v.year}</p><p>${esc(v.publisher)}</p><div class="volume-actions"><button class="action ${want?'active':''}" aria-pressed="${want}" data-mark="want" data-id="${esc(v.id)}">Lo quiero</button><button class="action ${own?'active':''}" aria-pressed="${own}" data-mark="own" data-id="${esc(v.id)}">Lo tengo</button><button class="follow ${state.follow[v.series]?'active':''}" data-toggle-follow="${esc(v.series)}" aria-label="Seguir serie" aria-pressed="${!!state.follow[v.series]}">${state.follow[v.series]?'✓':'+'}</button></div></div></div></article>`};
function initCommon(){const h=$('#header'),m=$('#menu'),mb=$('#menuButton');function upd(){h.classList.toggle('compact',scrollY>90)}addEventListener('scroll',upd,{passive:true});upd();mb.onclick=()=>{m.classList.toggle('open');mb.setAttribute('aria-expanded',m.classList.contains('open'))};$('#closeMenu').onclick=()=>m.classList.remove('open');document.addEventListener('keydown',e=>{if(e.key==='Escape')m.classList.remove('open')});document.addEventListener('click',e=>{const dest=e.target.closest('[data-dest]');if(dest){m.classList.remove('open');if(dest.dataset.dest==='catalogo')location.href='catalogo.html';else if(dest.dataset.dest==='feedback' && $('#feedback'))$('#feedback').scrollIntoView({behavior:'smooth',block:'start'});else toast('Sección fuera del alcance de v1.1')}const open=e.target.closest('[data-open-series]');if(open&&!e.target.closest('button'))navSeries(open.dataset.openSeries);const follow=e.target.closest('[data-toggle-follow]');if(follow){let n=follow.dataset.toggleFollow;state.follow[n]=!state.follow[n];save();$$(`[data-toggle-follow]`).filter(b=>b.dataset.toggleFollow===n).forEach(b=>{b.classList.toggle('active',!!state.follow[n]);b.textContent=state.follow[n]?'✓':'+';b.setAttribute('aria-pressed',!!state.follow[n])});const b=$('#followSeries');if(b&&new URLSearchParams(location.search).get('serie')===n)b.textContent=state.follow[n]?'✓ Siguiendo':'Seguir serie'}const mark=e.target.closest('[data-mark]');if(mark){const id=mark.dataset.id,kind=mark.dataset.mark,already=!!state[kind==='own'?'owned':'wanted'][id];state[kind==='own'?'owned':'wanted'][id]=!already;if(!already)state[kind==='own'?'wanted':'owned'][id]=false;save();if(document.body.dataset.page==='catálogo')renderCatalog();else renderVolumes();if(document.body.dataset.page==='perfil de serie')renderProgress()}});document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-open-series]'))navSeries(e.target.dataset.openSeries)})}
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
    const values=[...new Set(SERIES.map(s=>s[key]))].sort((a,b)=>a.localeCompare(b,'es'));
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
    const values=[...new Set(VOLUMES.map(v=>launchSeriesByName.get(v.series)?.[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
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
    const ranks=[['Series más coleccionadas','Orden ilustrativo por colecciones registradas.',SERIES.slice().sort((a,b)=>b.pop-a.pop).slice(0,3),false],['Tomos más solicitados','Orden ilustrativo por listas de deseos.',VOLUMES.slice().sort((a,b)=>b.pop-a.pop).slice(0,3),true],['Series mejor valoradas','Valoraciones ficticias para el prototipo.',SERIES.slice().sort((a,b)=>b.pop-a.pop).slice(0,3),false],['Tomos mejor valorados','Valoraciones ficticias para el prototipo.',VOLUMES.slice().sort((a,b)=>b.pop-a.pop).slice(0,3),true]];
    results.innerHTML=ranks.map(([title,desc,items,vol])=>{const filtered=items.filter(x=>(x.name||x.series+' tomo '+x.num).toLowerCase().includes(q));return `<div class="ranking-block"><h2 style="display:table;padding:10px 20px;background:white;border:2px solid #111;box-shadow:4px 4px #111">${title}</h2><p class="ranking-description">${desc} · Datos de ejemplo.</p><div class="cards ${vol?'volume-grid launch-volume-grid ranking-volume-grid':'series-grid'} catalog-grid">${filtered.map((v,i)=>`<div class="rank-wrap"><span class="rank-number">${i+1}</span>${vol?tomoCard(v,true):serieCard(v)}</div>`).join('')||'<p>Sin coincidencias.</p>'}</div><div class="ranking-more-wrap"><button class="button ranking-more" type="button" data-ranking>Ver ranking completo</button></div></div>`}).join('');
    $$('[data-ranking]').forEach(b=>b.onclick=()=>toast('Ranking completo previsto para una versión posterior'));
    return;
  }
  const isVol=view==='lanzamientos';
  results.className=`cards ${isVol?'volume-grid launch-volume-grid':'series-grid'} catalog-grid`;
  let items=(isVol?VOLUMES:SERIES).filter(x=>[x.name,x.series,x.author,x.publisher,x.num&&'tomo '+x.num,x.num].filter(Boolean).join(' ').toLocaleLowerCase('es').includes(q));
  if(!isVol){
    for(const key of Object.keys(seriesSelectedFilters)){
      const active=seriesSelectedFilters[key];if(active.size)items=items.filter(s=>active.has(s[key]));
    }
    items.sort((a,b)=>seriesSort==='name'?a.name.localeCompare(b.name,'es'):seriesSort==='year'?b.year-a.year||a.name.localeCompare(b.name,'es'):b.pop-a.pop||a.name.localeCompare(b.name,'es'));
    renderActiveSeriesFilters();
  }else{
    for(const key of Object.keys(launchSelectedFilters)){
      const active=launchSelectedFilters[key];
      if(active.size)items=items.filter(v=>active.has(launchSeriesByName.get(v.series)?.[key]));
    }
    items.sort((a,b)=>{
      if(launchSort==='old')return a.year-b.year||a.num-b.num||a.series.localeCompare(b.series,'es');
      if(launchSort==='popular')return b.pop-a.pop||b.year-a.year||b.num-a.num;
      if(launchSort==='name')return a.series.localeCompare(b.series,'es')||a.num-b.num;
      return b.year-a.year||b.num-a.num||a.series.localeCompare(b.series,'es');
    });
    renderActiveLaunchFilters();
  }
  results.innerHTML=items.slice(0,catCount).map(isVol?(v=>tomoCard(v,true)):serieCard).join('')||'<p class="empty">No hay resultados para esta búsqueda o filtros.</p>';
  more.hidden=items.length<=catCount;
}
let activeSeries,allVol=[],volCount=12,quoteCount=3;
function initProfile(){const requested=new URLSearchParams(location.search).get('serie');activeSeries=SERIES.find(s=>s.name===requested)||SERIES[0];const s=activeSeries;$('#pageHeading').textContent=s.name;$('#seriesTitle').textContent=s.name;$('#seriesMeta').innerHTML=[['Autor',s.author],['Géneros',s.genre],['Editorial y edición',s.publisher+' · Edición de muestra'],['Estado',s.status],['Tomos publicados','24 (ejemplo)']].map(([k,v])=>`<p><strong>${k}</strong><br>${esc(v)}</p>`).join('');$('#synopsisPublisher').textContent=s.publisher;$('#followSeries').textContent=state.follow[s.name]?'✓ Siguiendo':'Seguir serie';$('#followSeries').onclick=()=>{state.follow[s.name]=!state.follow[s.name];save();$('#followSeries').textContent=state.follow[s.name]?'✓ Siguiendo':'Seguir serie'};$$('[data-scroll]').forEach(b=>b.onclick=()=>$('#'+b.dataset.scroll).scrollIntoView({behavior:'smooth'}));allVol=Array.from({length:24},(_,i)=>({id:s.name+':'+(i+1),series:s.name,num:i+1,year:2021+Math.floor(i/4),publisher:s.publisher,pop:100-i,author:s.author}));$('#volumeSearch').oninput=resetVol;$('#volumeSort').onchange=resetVol;$('#volumeFilter').onchange=resetVol;$('#volumeMore').onclick=()=>{volCount+=matchMedia('(max-width:600px)').matches?4:12;renderVolumes()};addEventListener('resize',()=>{if(!$('#volumeSearch').value&&!$('#volumeFilter').value.includes('owned'))renderVolumes()});$('#rateSeries').onclick=()=>{$('#ratingEditor').hidden=!$('#ratingEditor').hidden};$('#saveRating').onclick=()=>{const values=$$('#ratingInputs select').map(e=>Number(e.value));state.ratings[s.name]=values;save();$('#ratingEditor').hidden=true;renderRatings();toast('Valoración de demostración guardada')};renderRatings();renderProgress();volCount=matchMedia('(max-width:600px)').matches?4:12;renderVolumes();initQuotes()}
function renderRatings(){const s=activeSeries.name,labels=['Historia','Protagonista','Arte','Personajes secundarios'],mine=state.ratings[s],base=[4.4,4.1,4.7,4.0];let vals=mine?base.map((v,i)=>(v*9+mine[i])/10):base;$('#ratingDetails').innerHTML=labels.map((k,i)=>`<div class="rating-row"><strong>${k}</strong><span class="stars">${'★'.repeat(Math.round(vals[i]))}${'☆'.repeat(5-Math.round(vals[i]))} ${vals[i].toFixed(1)}</span></div>`).join('');$('#ratingInputs').innerHTML=labels.map((k,i)=>`<label class="rating-row">${k}<select class="control">${[1,2,3,4,5].map(n=>`<option ${n===(mine?.[i]||4)?'selected':''} value="${n}">${n} ★</option>`).join('')}</select></label>`).join('');const avg=vals.reduce((a,b)=>a+b,0)/4;$('#generalRating').textContent=`★ ${avg.toFixed(1)} / 5 · ${mine?'10':'9'} votos (ejemplo)`;$('#ratingCount').textContent='Puntuaciones de ejemplo; la valoración guardada modifica la media simulada.';$('#rateSeries').textContent=mine?'Editar mi valoración':'Valorar esta serie'}
function renderProgress(){const owned=allVol.filter(v=>state.owned[v.id]).length;$('#progressBox').innerHTML=owned?`<h3>Mi colección</h3><p><strong>${owned}/24 tomos · ${Math.round(owned/24*100)}%</strong></p><div class="progress-bar" role="progressbar" aria-valuenow="${owned}" aria-valuemax="24"><div class="progress-fill" style="width:${owned/24*100}%"></div></div>`:`<h3>Comienza tu colección</h3><p>Todavía no has registrado ningún tomo de esta serie.</p><button class="button primary" id="startCollecting">Comenzar a coleccionar</button>`;const b=$('#startCollecting');if(b)b.onclick=()=>{$('#volumeFilter').value='all';$('#volumeSearch').value='';resetVol();$('#tomos').scrollIntoView({behavior:'smooth'});toast('Selecciona un tomo y pulsa «Lo tengo»')}}
function resetVol(){volCount=matchMedia('(max-width:600px)').matches?4:12;renderVolumes()}
function renderVolumes(){if(!activeSeries)return;let items=allVol.slice(),q=$('#volumeSearch').value.trim(),filter=$('#volumeFilter').value;if(q)items=items.filter(v=>String(v.num).includes(q));if(filter==='owned')items=items.filter(v=>state.owned[v.id]);if(filter==='wanted')items=items.filter(v=>state.wanted[v.id]);if(filter==='missing')items=items.filter(v=>!state.owned[v.id]);const sort=$('#volumeSort').value;items.sort((a,b)=>sort==='old'?a.num-b.num:sort==='rated'?((b.num*7)%13)-((a.num*7)%13):sort==='collected'?b.pop-a.pop:b.num-a.num);$('#volumeResults').innerHTML=items.slice(0,volCount).map(v=>tomoCard(v,true)).join('')||'<p class="empty">No hay tomos que coincidan con estos filtros.</p>';$('#volumeMore').hidden=items.length<=volCount}
function initQuotes(){const name=activeSeries.name;state.quotes[name]??=[{id:'a',author:'Lectora Alba · ejemplo',text:'Un viaje que transforma las pequeñas decisiones en grandes aventuras.',votes:14,created:1},{id:'b',author:'MangaFan · ejemplo',text:'Personajes inolvidables y un mundo lleno de preguntas.',votes:10,created:2},{id:'c',author:'Kiro · ejemplo',text:'Una historia que crece contigo.',votes:8,created:3},{id:'d',author:'Nina · ejemplo',text:'Misterio, emoción y dibujos que cuentan más que las palabras.',votes:5,created:4},{id:'e',author:'Leo · ejemplo',text:'Un comienzo sencillo que sorprende a cada paso.',votes:3,created:5}];$('#quoteForm').onsubmit=e=>{e.preventDefault();let text=$('#quoteText').value.trim();if(!text)return;if(/spoiler/i.test(text)){toast('Evita spoilers en tu frase');return}let mine=state.quotes[name].find(q=>q.id==='mine');if(mine)mine.text=text;else state.quotes[name].push({id:'mine',author:'Tú · demostración',text,votes:0,created:Date.now()});save();$('#quoteText').value='';renderQuotes()};$('#moreQuotes').onclick=()=>{quoteCount+=3;renderQuotes()};renderQuotes()}
function renderQuotes(){const arr=state.quotes[activeSeries.name].slice().sort((a,b)=>b.votes-a.votes||a.created-b.created);$('#quotes').innerHTML=arr.slice(0,quoteCount).map(q=>`<div class="quote"><small>${esc(q.author)}</small><p>${esc(q.text)}</p><div class="quote-actions"><span>${q.votes} votos</span><button class="button ${state.votes[activeSeries.name+q.id]?'active':''}" data-vote="${esc(q.id)}" ${q.id==='mine'?'disabled':''}>▲ Votar</button></div></div>`).join('');$('#moreQuotes').hidden=quoteCount>=arr.length;$$('[data-vote]').forEach(b=>b.onclick=()=>{const id=b.dataset.vote,key=activeSeries.name+id,q=state.quotes[activeSeries.name].find(x=>x.id===id);if(state.votes[key]){q.votes--;delete state.votes[key]}else{q.votes++;state.votes[key]=true}save();renderQuotes()});const mine=arr.find(q=>q.id==='mine');if(mine)$('#quoteText').placeholder='Edita tu frase anterior…'}
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

