/* TOMORI · Perfil de serie v2.0
   Obra → ediciones → tomos. Solo modifica la pagina serie.html.
   Sin fechas aproximadas inventadas, sin portadas no autorizadas,
   sin rankings de comunidad simulados. */
(function(){
'use strict';
const $v=s=>document.querySelector(s);
const editionsByWork=workId=>SERIES.filter(e=>e.workId===workId);
const marketName={AR:'Argentina',ES:'España',MX:'México',CL:'Chile',JP:'Japón'};
const country=code=>marketName[code]||code||'Mercado por verificar';
const languageName={es:'Español',ja:'Japonés',en:'Inglés'};
const language=code=>languageName[code]||code||'Idioma por verificar';
const statusName={complete:'Completa',ongoing:'En publicación',out_of_print:'Descatalogada',announced:'Anunciada',unknown:'Estado por verificar'};
const dateVerified=value=>typeof value==='string' && /^\d{4}-\d{2}(?:-\d{2})?$/.test(value);
const dateLabel=value=>{
 if(!dateVerified(value))return 'Fecha no verificada';
 const [year,month,day]=value.split('-');
 return day?`${day}/${month}/${year}`:`${month}/${year} (mes verificado)`;
};
const verifiedLatest=(a,b,ascending=false)=>{
 const da=dateVerified(a.releaseDate)?a.releaseDate:'';
 const db=dateVerified(b.releaseDate)?b.releaseDate:'';
 if(da&&!db)return -1;
 if(db&&!da)return 1;
 const comparison=ascending?da.localeCompare(db):db.localeCompare(da);
 return comparison||a.editionId.localeCompare(b.editionId)||a.num-b.num;
};
const visiblePageSize=()=>matchMedia('(max-width:600px)').matches?4:12;
let work=null,editions=[],workVolumes=[],progressEditionId='',allMode=false,visibleCount=12,quoteCount=3;
const findEdition=id=>editions.find(e=>e.id===id);
const getSelectedProgress=()=>findEdition(progressEditionId);
const workQuotes=()=>{
 // Los textos antiguos se preservan, aunque estuviesen asociados a una edición.
 const seen=new Set(),all=[...(state.quotes?.[work.id]||[])];
 editions.forEach(ed=>{(state.quotes?.[ed.id]||[]).forEach(q=>all.push(q))});
 return all.filter(q=>{const key=String(q.id||'')+':'+String(q.author||'');if(seen.has(key))return false;seen.add(key);return true});
};
function renderWork(){
 $v('#pageHeading').textContent=work.name.toUpperCase();
 $v('#seriesTitle').textContent=work.name;
 const primary=editions.find(e=>e.primary)||editions[0];
 const values=[['Autor',work.author||'Por verificar'],['Obra',work.name],['Género',primary?.genre||'Por verificar'],['Ediciones verificadas',String(editions.length)]];
 $v('#seriesMeta').innerHTML=values.map(([label,value])=>`<p><strong>${esc(label)}</strong><br>${esc(value)}</p>`).join('');
 $v('#rateSeries').textContent='Valorar esta serie';
 renderRatings();renderQuotes();renderFollow();
}
function renderRatings(){
 const prior=editions.filter(e=>Array.isArray(state.ratings[e.id]));
 // Una única valoración antigua de una edición se muestra como referencia.
 // Si hay varias distintas, no las fusionamos arbitrariamente en una valoración de obra.
 const mine=state.ratings[work.id]||(prior.length===1?state.ratings[prior[0].id]:null);
 const names=['Historia','Protagonista','Arte','Personajes secundarios'];
 $v('#ratingDetails').innerHTML=names.map((name,i)=>`<div class="rating-row"><strong>${name}</strong><span class="stars">${mine?`${'★'.repeat(Number(mine[i]))}${'☆'.repeat(5-Number(mine[i]))} ${mine[i]}/5`:'Sin valoraciones'}</span></div>`).join('');
 $v('#ratingInputs').innerHTML=names.map((name,i)=>`<label class="rating-row">${name}<select class="control">${[1,2,3,4,5].map(num=>`<option value="${num}" ${num===Number(mine?.[i]||4)?'selected':''}>${num} ★</option>`).join('')}</select></label>`).join('');
 $v('#generalRating').textContent=mine?'★ '+(mine.reduce((a,b)=>a+Number(b),0)/mine.length).toFixed(1)+' / 5 · Personal':'★ — / 5';
 $v('#ratingCount').textContent=state.ratings[work.id]?'Tu valoración personal de la obra; no representa una media comunitaria.':mine?'Tu valoración anterior de una edición, conservada como referencia. Puedes guardarla para la obra.':prior.length>1?'Conservamos varias valoraciones personales de ediciones anteriores; no se han fusionado automáticamente.':'Todavía no hay valoraciones reales de la comunidad.';
 $v('#rateSeries').textContent=mine?'Editar mi valoración':'Valorar esta serie';
}
function renderFollow(){
 const b=$v('#followSeries');
 const ed=getSelectedProgress();
 b.textContent=ed && state.follow[ed.id]?'✓ Siguiendo':'Seguir serie';
 b.title=ed?'Seguir la edición seleccionada: '+ed.editionName:'Selecciona una edición en Mi progreso para seguir su colección';
 b.setAttribute('aria-pressed',String(!!(ed&&state.follow[ed.id])));
}
function renderProgress(){
 const ed=getSelectedProgress();
 const s=$v('#progressBox');
 const options=`<label for="progressEdition"><strong>Edición para mi progreso</strong></label><select class="control tm-progress-choose" id="progressEdition"><option value="">Seleccionar edición</option>${editions.map(e=>`<option value="${esc(e.id)}" ${progressEditionId===e.id?'selected':''}>${esc(e.publisher)} · ${esc(country(e.market))} · ${esc(e.editionName)}</option>`).join('')}</select>`;
 if(!ed){
  s.innerHTML=`<h3>COMIENZA TU COLECCIÓN</h3>${options}<p>Selecciona una edición para consultar o comenzar tu colección. Los tomos de cada editorial se contabilizan por separado.</p><div class="tm-progress-actions"><button type="button" class="button" id="startCollecting">Comenzar a coleccionar</button></div>`;
 }else{
  const selectedVolumes=workVolumes.filter(v=>v.editionId===ed.id&&v.published);
  const owned=selectedVolumes.filter(v=>state.owned[v.id]).length;
  const total=Number.isInteger(ed.publishedCount)&&ed.publishedCount>0?ed.publishedCount:null;
  const progress=total?Math.min(100,Math.round(100*owned/total)):null;
  const label=`${owned} tomo${owned===1?'':'s'} adquirido${owned===1?'':'s'}${total!==null?` de ${total} publicados declarados`:' · total de publicados por verificar'}`;
  const caveat=`${selectedVolumes.length} tomos publicados individualmente verificados en Tomori para esta edición.`;
  const bar=total?`<p><strong>${progress}%</strong> de la edición seleccionada</p><div class="progress-bar" role="progressbar" aria-label="Progreso de colección" aria-valuenow="${owned}" aria-valuemax="${total}"><div class="progress-fill" style="width:${progress}%"></div></div>`:'';
  s.innerHTML=`<h3>${owned?'Mi colección':'COMIENZA TU COLECCIÓN'}</h3>${options}<p><strong>${esc(ed.publisher)} · ${esc(ed.editionName)}</strong></p><p>${esc(label)}</p>${bar}<p class="note">${esc(caveat)}</p>${!owned?'<div class="tm-progress-actions"><button type="button" class="button" id="startCollecting">Comenzar a coleccionar</button></div>':''}`;
 }
 $v('#progressEdition').onchange=e=>{
  progressEditionId=findEdition(e.target.value)?e.target.value:'';
  renderProgress();renderFollow();
  if(allMode){$v('#volumeEdition').value=progressEditionId||'all';resetVolumes()}
 };
 const start=$v('#startCollecting');
 if(start)start.onclick=()=>openAll(progressEditionId||'all');
}
function renderEditions(){
 // Cada ficha representa una edición; la imagen solo puede ser su propio tomo 01.
 // No sustituimos el tomo 01 por otro número ni por una portada de otro mercado.
 $v('#editionResults').innerHTML=editions.map(ed=>{
  const individ=workVolumes.filter(v=>v.editionId===ed.id && v.published).length;
  const total=ed.totalPlanned;
  const first=workVolumes.find(v=>v.editionId===ed.id && Number(v.num)===1 && v.published===true);
  const hasLicensedCover=!!(first && first.coverAuthorized===true &&
   typeof first.coverUrl==='string' && /^https:\/\//i.test(first.coverUrl));
  const coverLabel=!first?'Tomo 01 pendiente de verificación':'Portada del tomo 01 pendiente de autorización';
  const img=hasLicensedCover?
   `<img loading="lazy" decoding="async" src="${esc(first.coverUrl)}" alt="Portada del tomo 01 de ${esc(work.name)}, ${esc(ed.editionName)}" data-edition-cover-volume="${esc(first.id)}">`:'';
  const placeholder=`<span class="tm-edition-cover-fallback"><strong>${first?'TOMO 01':'SIN TOMO 01'}</strong><small>${esc(!first?'Aún no verificado':'Portada pendiente de autorización')}</small></span>`;
  return `<button type="button" class="tm-edition-card" data-select-edition="${esc(ed.id)}" aria-label="Ver los tomos de ${esc(ed.editionName)} de ${esc(ed.publisher)}"><span class="tm-edition-cover${hasLicensedCover?' tm-edition-cover-has-image':''}" role="img" aria-label="${esc(coverLabel)}" data-first-volume-id="${esc(first?.id||'')}">${placeholder}${img}</span><span class="tm-edition-info"><strong>${esc(ed.editionName)}</strong><span>${esc(ed.publisher)}</span><span>${esc(country(ed.market))} · ${esc(language(ed.language))} · ${esc(ed.format||'Formato por verificar')}</span><span>${esc(statusName[ed.status]||'Por verificar')}</span><span>${individ} tomos publicados verificados individualmente${ed.publishedCount!=null?` · ${ed.publishedCount} publicados declarados`:''}${total!=null?` · total previsto ${total}`:''}</span></span></button>`;
 }).join('')||'<p class="empty">No se han encontrado ediciones verificadas de esta obra.</p>';
 $v('#editionResults').querySelectorAll('[data-select-edition]').forEach(el=>el.onclick=()=>openAll(el.dataset.selectEdition));
 // Si una imagen autorizada falla, restauramos la portada genérica existente.
 $v('#editionResults').querySelectorAll('.tm-edition-cover > img').forEach(img=>{
  img.addEventListener('error',()=>{
   const parent=img.closest('.tm-edition-cover');
   if(parent){parent.classList.remove('tm-edition-cover-has-image');parent.setAttribute('aria-label','Portada del tomo 01 no disponible')}
   img.remove();
  },{once:true});
 });
}

function enhanceLatestCard(v){
 const wrap=document.createElement('div');
 wrap.innerHTML=tomoCard(v,false);
 const container=wrap.querySelector('.volume-info');
 const actions=container?.querySelector('.volume-actions');
 if(container&&actions){
  const paragraph=document.createElement('p');paragraph.className='tm-release-date';
  paragraph.textContent='Publicado: '+dateLabel(v.releaseDate);
  container.insertBefore(paragraph,actions);
 }
 return wrap.innerHTML;
}
function renderLatest(){
 const dates=workVolumes.filter(v=>v.published&&dateVerified(v.releaseDate)).sort((a,b)=>verifiedLatest(a,b));
 const latest=dates.slice(0,5);
 $v('#latestVolumeResults').innerHTML=latest.map(enhanceLatestCard).join('')||'<p class="empty">Aún no hay fechas de lanzamiento verificadas para esta obra. Puedes consultar los tomos identificados en «Ver todos los tomos».</p>';
}
function renderEditionFilter(){
 const control=$v('#volumeEdition');
 control.innerHTML='<option value="all">Todas las ediciones</option>'+editions.map(ed=>`<option value="${esc(ed.id)}">${esc(ed.publisher)} · ${esc(country(ed.market))} · ${esc(ed.editionName)}</option>`).join('');
}
function showMode(isAll){
 allMode=isAll;
 for(const id of ['descubre','ediciones','ultimosTomos'])$v('#'+id).hidden=isAll;
 $v('#tomos').hidden=!isAll;
}
function openAll(editionId='all'){
 // Los dos puntos de entrada no arrastran el filtro usado anteriormente.
 showMode(true);
 $v('#volumeSearch').value='';
 $v('#volumeSort').value='recent';
 $v('#volumeFilter').value='all';
 $v('#volumeEdition').value=findEdition(editionId)?editionId:'all';
 if(editionId!=='all'&&findEdition(editionId)){
  progressEditionId=editionId;renderProgress();renderFollow();
 }
 resetVolumes();
 $v('#tomos').scrollIntoView({behavior:'auto',block:'start'});
}
function returnToMain(){
 showMode(false);
 $v('#descubre').scrollIntoView({behavior:'auto',block:'start'});
}
function resetVolumes(){visibleCount=visiblePageSize();renderVolumes()}
function renderVolumes(){
 if(!work)return;
 let items=workVolumes.slice();
 const selected=$v('#volumeEdition').value;
 if(selected!=='all')items=items.filter(v=>v.editionId===selected);
 const q=$v('#volumeSearch').value.trim();
 if(q){if(/^\d+$/.test(q)){items=items.filter(v=>Number(v.num)===Number(q))}else{items=[]}}
 const personal=$v('#volumeFilter').value;
 if(personal==='owned')items=items.filter(v=>!!state.owned[v.id]);
 if(personal==='wanted')items=items.filter(v=>!!state.wanted[v.id]&&!state.owned[v.id]);
 if(personal==='missing')items=items.filter(v=>v.published&&!state.owned[v.id]);
 const sort=$v('#volumeSort').value;
 const note=$v('#volumeSortNote');
 if(sort==='rated'||sort==='collected'){
  note.hidden=false;
  note.textContent='Todavía no existen valoraciones o cifras de coleccionistas verificadas para ordenar los tomos. Se mantiene el orden por fecha editorial conocida.';
  items.sort((a,b)=>verifiedLatest(a,b));
 }else{
  note.hidden=false;
  note.textContent='Los tomos sin fecha verificada aparecen después de los fechados; no se presupone su cronología a partir del número.';
  items.sort((a,b)=>verifiedLatest(a,b,sort==='old'));
 }
 $v('#volumeResults').innerHTML=items.slice(0,visibleCount).map(v=>tomoCard(v,false)).join('')||'<p class="empty">No hay tomos verificados que cumplan estos filtros.</p>';
 $v('#volumeMore').hidden=items.length<=visibleCount;
}
function renderQuotes(){
 const entries=workQuotes().sort((a,b)=>Number(b.votes||0)-Number(a.votes||0)||Number(b.created||0)-Number(a.created||0));
 $v('#quotes').innerHTML=entries.slice(0,quoteCount).map(q=>`<div class="quote"><small>${esc(q.author||'Usuario')}</small><p>${esc(q.text)}</p><small class="tm-quote-votes">Votos positivos registrados: ${Number(q.votes||0)}</small></div>`).join('')||'<p class="note">Todavía no hay frases aportadas por usuarios.</p>';
 $v('#moreQuotes').hidden=entries.length<=quoteCount;
}
function init(){
 const params=new URLSearchParams(location.search);
 const edition=SERIES.find(e=>e.id===params.get('edicion'));
 work=WORKS.find(w=>w.id===edition?.workId)||WORKS.find(w=>w.name.toLocaleLowerCase('es')===(params.get('serie')||'').toLocaleLowerCase('es'))||WORKS[0];
 if(!work)return;
 editions=editionsByWork(work.id);
 workVolumes=VOLUMES.filter(v=>v.workId===work.id && editions.some(ed=>ed.id===v.editionId));
 const owns=editions.find(ed=>workVolumes.some(v=>v.editionId===ed.id&&!!state.owned[v.id]));
 progressEditionId=edition&&edition.workId===work.id?edition.id:owns?.id||'';
 renderWork();renderProgress();renderEditions();renderLatest();renderEditionFilter();showMode(false);
 $v('#openAllVolumes').onclick=()=>openAll('all');
 $v('#returnToSeries').onclick=returnToMain;
 $v('#volumeMore').onclick=()=>{visibleCount+=visiblePageSize();renderVolumes()};
 $v('#volumeSearch').oninput=resetVolumes;
 $v('#volumeEdition').onchange=e=>{
  if(findEdition(e.target.value)){progressEditionId=e.target.value;renderProgress();renderFollow()}
  resetVolumes();
 };
 $v('#volumeSort').onchange=resetVolumes;
 $v('#volumeFilter').onchange=resetVolumes;
 // Viñetas aprobadas: únicamente se cambia el destino lógico.
 const discover=$v('[data-scroll="descubre"]'),volumes=$v('[data-scroll="tomos"]');
 discover.onclick=()=>{if(allMode)showMode(false);$v('#descubre').scrollIntoView({behavior:'smooth',block:'start'})};
 volumes.onclick=()=>{if(!allMode)openAll('all');else $v('#tomos').scrollIntoView({behavior:'smooth',block:'start'})};
 $v('#rateSeries').onclick=()=>{$v('#ratingEditor').hidden=!$v('#ratingEditor').hidden};
 $v('#saveRating').onclick=()=>{
  state.ratings[work.id]=[...document.querySelectorAll('#ratingInputs select')].map(e=>Number(e.value));
  save();$v('#ratingEditor').hidden=true;renderRatings();toast('Tu valoración personal se guardó para la obra');
 };
 $v('#followSeries').onclick=()=>{
  const ed=getSelectedProgress();
  if(!ed){toast('Selecciona una edición en Mi progreso para seguirla');$v('#progressEdition').focus();return}
  if(window.TomoriCollector){TomoriCollector.changeFollow(ed.id);state=TomoriCollector.read()}
  else{state.follow[ed.id]=!state.follow[ed.id];save()}
  renderFollow();renderEditions();
 };
 $v('#quoteForm').onsubmit=e=>{
  e.preventDefault();const input=$v('#quoteText'),text=input.value.trim();
  if(!text)return;
  if(/spoiler/i.test(text)){toast('Evita spoilers en tu frase');return}
  // Las frases pasan a tener la identidad de la obra, no de cada edición.
  if(!Array.isArray(state.quotes[work.id]))state.quotes[work.id]=[];
  const old=workQuotes().find(q=>q.id==='mine'&&q.author==='Tú');
  const current=state.quotes[work.id].find(q=>q.id==='mine');
  if(current)current.text=text;
  else state.quotes[work.id].push({id:'mine',author:'Tú',text,votes:Math.max(0,Number(old?.votes||0)),created:old?.created||Date.now()});
  save();input.value='';quoteCount=3;renderQuotes();
 };
 $v('#moreQuotes').onclick=()=>{quoteCount+=3;renderQuotes()};
 addEventListener('resize',()=>{if(allMode){visibleCount=Math.max(visiblePageSize(),visibleCount);renderVolumes()}});
}
window.TomoriSerieV2={refreshAfterMark(){renderProgress();renderFollow();renderLatest();if(allMode)renderVolumes()},openAll,returnToMain};
init();
})();
