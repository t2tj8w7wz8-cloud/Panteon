/* TOMORI · Páginas personales 04,05,06. Reutiliza serieCard/tomoCard de app.js. */
(function(){
'use strict';
const C=window.TomoriCollector;if(!C)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const page=document.body.dataset.page;
if(!['perfil de usuario','mi colección','lo quiero'].includes(page))return;
C.seedDemo();
const escapeText=t=>String(t??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
// app.js expone las tarjetas oficiales y mantiene su estado en 'state'.
function fresh(){state=C.read();return state}
function notify(msg){if(typeof toast==='function')toast(msg)}
function jump(id){const el=document.getElementById(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
function identity(){const s=fresh();$$('[data-username]').forEach(x=>x.textContent=s.user.name);$$('[data-usertitle]').forEach(x=>x.textContent=s.user.title);$$('[data-avatar]').forEach(el=>{el.classList.toggle('has-photo',!!s.user.avatar);el.replaceChildren();if(s.user.avatar){const img=document.createElement('img');img.src=s.user.avatar;img.alt='Foto de perfil';el.append(img)}})}
function statRender(){const val=C.stats();$$('[data-stat]').forEach(x=>x.textContent=val[x.dataset.stat]??0)}
function drawTileGeometries(){
  $$('.collector-tile').forEach(b=>{
    const svg=b.querySelector('svg'),poly=svg?.querySelector('polygon');if(!svg||!poly)return;
    const w=b.clientWidth,h=b.clientHeight;if(w<20||h<20)return;
    const cut=Math.min(h*.36,44,w*.20), pad=1.5,type=b.dataset.geometry;
    const left=type.startsWith('left');const a=type.endsWith('a');
    let pts;
    if((page==='perfil de usuario'||page==='mi colección') && !left){
      // Las diagonales de ambas viñetas son PARALELAS.
      // La silueta derecha se prolonga hacia la izquierda dentro del hueco
      // recortado de la izquierda; así el espacio visible es realmente 12px.
      // Mantener la forma escalonada y su separación real de 12 px.
      pts=a?[[-pad,pad],[w-pad,pad],[w-pad,h-pad],[-cut-pad,h-pad]]:
            [[-cut-pad,pad],[w-pad,pad],[w-pad,h-pad],[-pad,h-pad]];
    }else if(left)pts=a?[[pad,pad],[w-pad,pad],[w-cut,h-pad],[pad,h-pad]]:[[pad,pad],[w-cut,pad],[w-pad,h-pad],[pad,h-pad]];
    else pts=a?[[cut,pad],[w-pad,pad],[w-pad,h-pad],[pad,h-pad]]:[[pad,pad],[w-pad,pad],[w-pad,h-pad],[cut,h-pad]];
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('preserveAspectRatio','none');poly.setAttribute('points',pts.map(p=>p.join(',')).join(' '));
  });
}
function renderSeriesCard(s){return serieCard(s)}
function cardWithProgress(x){
  const base=renderSeriesCard(x);
  const addition=`<div class="collector-card-progress"><div class="progress-caption">${x.owned} de ${x.total} tomos · ${x.percent}%</div><div class="progress-bar" role="progressbar" aria-label="Progreso de ${escapeText(x.name)}" aria-valuenow="${x.owned}" aria-valuemax="${x.total}"><div class="progress-fill" style="width:${x.percent}%"></div></div></div>`;
  return base.replace('<span class="series-rating"',addition+'<span class="series-rating"');
}
function volumeWithDate(v){return tomoCard(v,true).replace('<div class="volume-actions">',`<p class="collector-added-date">Añadido: ${escapeText(C.dateTime(v.addedAt))}</p><div class="volume-actions">`)}
const empty=(message,url='catalogo.html',cta='Explorar Catálogo')=>`<div class="empty">${escapeText(message)} <a href="${url}">${escapeText(cta)}</a>.</div>`;
function refreshShared(){identity();statRender()}
let activeHistory=false,activityCount=3,followCount=4;
function renderTimeline(){
 const s=fresh(),list=s.activity.slice().sort((a,b)=>b.at-a.at);
 const display=activeHistory?list.slice(0,activityCount):list.slice(0,3);
 $('#activityList').innerHTML=display.map(a=>{
  const v=C.getVolume(a.target),ser=a.type==='completed'?a.target:v?.series||C.bookName(a.target),num=v?.num||C.bookNumber(a.target);
  let title='',icon='';
  if(a.type==='owned'){title=`Agregaste <strong>${escapeText(ser)}, tomo ${num}</strong>, a tu colección`;icon='▣'}
  else if(a.type==='wanted'){title=`Agregaste <strong>${escapeText(ser)}, tomo ${num}</strong>, a Lo quiero`;icon='♥'}
  else if(a.type==='completed'){title=`Completaste tu colección de <strong>${escapeText(ser)}</strong>`;icon='★'}
  else return '';
  return `<article class="collector-event"><span class="collector-event-icon" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${escapeText(C.dateTime(a.at))} · ${s.demoLabel?'actividad de demostración':'registro del prototipo'}</p></article>`;
 }).join('')||empty('Aún no hay actividad. Registra un tomo para empezar.');
 $('#activityAll').hidden=activeHistory;
 $('#activityMore').hidden=!activeHistory||list.length<=activityCount;
}
function openHistory(){activeHistory=true;activityCount=Math.max(4,activityCount);renderTimeline();jump('activityRecent')}
function renderFollowing(){
 const s=fresh();const list=SERIES.filter(x=>s.follow[x.name]);
 $('#followingResults').innerHTML=list.slice(0,followCount).map(renderSeriesCard).join('')||empty('Todavía no sigues ninguna serie.');
 $('#followingMore').hidden=followCount>=list.length;
}
function openFollowing(){renderFollowing();jump('followingView')}
function setupUserSettings(){
 const s=C.read();$('#userNameInput').value=s.user.name;
 $('#userTitleSelect').innerHTML=s.user.unlocked.map(t=>`<option value="${escapeText(t)}" ${t===s.user.title?'selected':''}>${escapeText(t)}</option>`).join('');
 $('#userSettingsForm').addEventListener('submit',e=>{e.preventDefault();C.updateUser({name:$('#userNameInput').value,title:$('#userTitleSelect').value});notify('Tu perfil se actualizó');identity()});
 $('#removeAvatar').addEventListener('click',()=>C.updateUser({avatar:''}));
 $('#userAvatarInput').addEventListener('change',async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!file.type.startsWith('image/')){notify('Selecciona una imagen');return}
  const url=URL.createObjectURL(file);
  try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
   const ctx=canvas.getContext('2d');const side=Math.min(image.width,image.height);ctx.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,256,256);
   C.updateUser({avatar:canvas.toDataURL('image/jpeg',.77)});notify('Foto de perfil actualizada');
  }catch(err){notify('No se pudo cargar la foto')}finally{URL.revokeObjectURL(url);e.target.value=''}
 });
 $('#clearDemo').onclick=()=>{C.clearDemo();notify('Datos de prueba vaciados')};
 $('#reloadDemo').onclick=()=>{const s=C.read();s.demoInitialized=false;C.write(s);C.seedDemo();notify('Ejemplos cargados')};
}
function initProfileUser(){
 setupUserSettings();
 $('#followingMore').onclick=()=>{followCount+=4;renderFollowing()};
 $('#followingClose').onclick=()=>{jump('header')};
 $('#activityMore').onclick=()=>{activityCount+=4;renderTimeline()};
 $('#activityAll').onclick=openHistory;
 $$('.collector-tile').forEach(b=>b.addEventListener('click',()=>{
  switch(b.dataset.personalTile){
   case 'collection':location.href='coleccion.html';break;
   case 'wishlist':location.href='lo-quiero.html';break;
   case 'following':openFollowing();break;
   case 'activity':openHistory();break;
  }
 }));
 if(new URLSearchParams(location.search).get('vista')==='siguiendo')setTimeout(openFollowing,50);
 renderTimeline();renderFollowing();
}
let seriesCount=4,volumesCount=4,onlyCompleted=false;
function renderMySeries(){
 const items=C.stats().per.filter(x=>x.owned>0&&(!onlyCompleted||x.percent===100)).sort((a,b)=>b.percent-a.percent||b.owned-a.owned||a.name.localeCompare(b.name,'es'));
 $('#mySeriesResults').innerHTML=items.slice(0,seriesCount).map(cardWithProgress).join('')||empty(onlyCompleted?'Todavía no tienes series completadas.':'Todavía no tienes tomos registrados en tu colección.');
 $('#mySeriesMore').hidden=items.length<=seriesCount;
 $('#collectionSeriesNote').textContent=onlyCompleted?'Series cuya edición publicada está completada al 100%.':'Series ordenadas por porcentaje completado · desempate por tomos registrados.';
 const completed=$('[data-personal-tile="completed"]');completed.classList.toggle('active',onlyCompleted);
}
function renderMyVolumes(){const items=C.ownedVolumes();$('#myVolumesResults').innerHTML=items.slice(0,volumesCount).map(volumeWithDate).join('')||empty('Todavía no tienes tomos. Explora el Catálogo para comenzar.');$('#myVolumesMore').hidden=items.length<=volumesCount}
function initCollection(){
 $('#mySeriesMore').onclick=()=>{seriesCount+=4;renderMySeries()};
 $('#myVolumesMore').onclick=()=>{volumesCount+=4;renderMyVolumes()};
 $$('.collector-tile').forEach(b=>b.addEventListener('click',()=>{
  switch(b.dataset.personalTile){
   case 'series':onlyCompleted=false;seriesCount=4;renderMySeries();jump('misSeries');break;
   case 'completed':onlyCompleted=true;seriesCount=4;renderMySeries();jump('misSeries');break;
   case 'volumes':jump('misTomos');break;
   case 'wishlist':location.href='lo-quiero.html';break;
  }
 }));
 renderMySeries();renderMyVolumes();
}
let wishView='wanted',wishCount=matchMedia('(max-width:600px)').matches?4:8;
function getWishList(){return wishView==='missing'?C.missingVolumes():C.wantedVolumes()}
function renderWishList(){
 fresh();const title={wanted:'LO QUIERO',grouped:'POR SERIES',missing:'ME FALTAN'}[wishView];$('#wishTitle').textContent=title;
 const hints={wanted:'Tomos que marcaste con el corazón.',grouped:'Tus tomos deseados, agrupados por serie.',missing:'Tomos publicados que te faltan de las series que sigues.'};$('#wishHint').textContent=hints[wishView]+' · Datos del prototipo (simulados).';
 $$('.collector-square-tile').forEach(b=>{const on=b.dataset.wishView===wishView;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 const query=$('#wishSearch').value.trim().toLocaleLowerCase('es');
 let items=getWishList();if(query){const numSearch=query.match(/^(?:tomo\s*)?0*(\d+)$/);items=items.filter(v=>v.series.toLocaleLowerCase('es').includes(query)||(numSearch?Number(numSearch[1])===v.num:String(v.num).includes(query)))}
 const displayed=items.slice(0,wishCount),target=$('#wishResults');
 if(!items.length){const following=SERIES.filter(x=>C.read().follow[x.name]).length;
   target.innerHTML=wishView==='missing'&&!following?empty('Sigue una serie para descubrir los tomos que te faltan.'):
    wishView==='missing'?empty('No tienes tomos publicados pendientes en las series que sigues.'):
    empty('Todavía no tienes tomos en Lo quiero.');
 }else if(wishView==='grouped'){
   const groups=new Map();displayed.forEach(v=>{if(!groups.has(v.series))groups.set(v.series,[]);groups.get(v.series).push(v)});
   target.innerHTML=[...groups].map(([name,volumes])=>`<section class="collector-wish-group"><h3 class="collector-narrator-title">${escapeText(name.toLocaleUpperCase('es'))}</h3><div class="cards volume-grid catalog-grid launch-volume-grid">${volumes.map(v=>tomoCard(v,true)).join('')}</div></section>`).join('');
 }else target.innerHTML=`<div class="cards volume-grid catalog-grid launch-volume-grid">${displayed.map(v=>tomoCard(v,true)).join('')}</div>`;
 $('#wishMore').hidden=items.length<=wishCount;
}
function initWishlist(){
 $$('.collector-square-tile').forEach(b=>b.addEventListener('click',()=>{wishView=b.dataset.wishView;wishCount=matchMedia('(max-width:600px)').matches?4:8;$('#wishSearch').value='';renderWishList()}));
 $('#wishSearch').addEventListener('input',()=>{wishCount=matchMedia('(max-width:600px)').matches?4:8;renderWishList()});
 $('#wishMore').onclick=()=>{wishCount+=matchMedia('(max-width:600px)').matches?4:8;renderWishList()};
 renderWishList();
}
function renderAll(){fresh();refreshShared();if(page==='perfil de usuario'){renderTimeline();renderFollowing()}else if(page==='mi colección'){renderMySeries();renderMyVolumes()}else renderWishList()}
if(page==='perfil de usuario')initProfileUser();if(page==='mi colección')initCollection();if(page==='lo quiero')initWishlist();
renderAll();drawTileGeometries();
if('ResizeObserver' in window){const observer=new ResizeObserver(drawTileGeometries);$$('.collector-tiles').forEach(x=>observer.observe(x))}else addEventListener('resize',drawTileGeometries);
window.addEventListener('tomori:state',renderAll);
window.addEventListener('storage',e=>{if(e.key===C.key)renderAll()});
})();
