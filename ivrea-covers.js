/* Tomori · Experimento Ivrea v1.0. Imágenes externas solo opt-in.
   ID de tomo y edición obligatorios. Sin descarga masiva.
   No sustituir último tomo registrado por otro con portada.
   Derechos comerciales por verificar. */
(()=>{
'use strict';
const FLAG='tomori-lab-ivrea-covers-enabled-v1';
const MEDIA=Object.freeze({
  "volume:ivrea-ar-takopi-b6:001": "https://www.ivrea.com.ar/wp-content/uploads/2024/04/elpecadodetakopi1.jpg",
  "volume:ivrea-ar-takopi-b6:002": "https://www.ivrea.com.ar/elpecadodetakopi/elpecadodetakopi2_chica.jpg",
  "volume:ivrea-ar-solanin-integral:001": "https://www.ivrea.com.ar/wp-content/uploads/2020/11/solanin-2.jpg",
  "volume:ivrea-ar-slam-dunk-deluxe:002": "https://ivrea.com.ar/slamdunk/slamdunk02_chica.jpg",
  "volume:ivrea-ar-one-piece-tankoubon:001": "https://www.ivrea.com.ar/wp-content/uploads/2021/01/onepiece01.jpg"
});
const INFO=Object.freeze({
  "volume:ivrea-ar-takopi-b6:001": {"editionId": "edition:ivrea-ar-takopi-b6", "number": 1, "page": "https://www.ivrea.com.ar/titulo/el-pecado-original-de-takopi/"},
  "volume:ivrea-ar-takopi-b6:002": {"editionId": "edition:ivrea-ar-takopi-b6", "number": 2, "page": "https://www.ivrea.com.ar/anteriores1.htm"},
  "volume:ivrea-ar-solanin-integral:001": {"editionId": "edition:ivrea-ar-solanin-integral", "number": 1, "page": "https://www.ivrea.com.ar/titulo/solanin/"},
  "volume:ivrea-ar-slam-dunk-deluxe:002": {"editionId": "edition:ivrea-ar-slam-dunk-deluxe", "number": 2, "page": "https://www.ivrea.com.ar/anteriores4.htm"},
  "volume:ivrea-ar-one-piece-tankoubon:001": {"editionId": "edition:ivrea-ar-one-piece-tankoubon", "number": 1, "page": "https://www.ivrea.com.ar/titulo/one-piece/"}
});
const SELECTOR='.series-card .series-cover, .volume-card .volume-cover, .profile-overview .profile-cover';
const results=new Map(); // 'ok' / 'fail' / 'loading' para cada URL
const waiting=new Map();
const oldLabels=new WeakMap();
let enabled=false,observer=null,schedule=false,requestCount=0,lastStart=0;
const MAX_UNIQUE_REQUESTS=5,DELAY=500;
try{enabled=localStorage.getItem(FLAG)==='on'}catch(_){}
function editions(){return typeof SERIES!=='undefined'&&Array.isArray(SERIES)?SERIES:[]}
function volumes(){return typeof VOLUMES!=='undefined'&&Array.isArray(VOLUMES)?VOLUMES:[]}
function coverOfVolume(node){
 const card=node.closest('.volume-card');
 if(!card)return null;
 const button=card.querySelector('[data-id],[data-volume-id]');
 const id=button?.getAttribute('data-id')||button?.getAttribute('data-volume-id');
 const v=volumes().find(x=>x.id===id);
 return v?.published&&v?.editionId===INFO[id]?.editionId&&Number(v.num)===INFO[id]?.number?id:null;
}
function coverOfSeries(node){
 const card=node.closest('.series-card');
 const name=card?.getAttribute('data-open-series')||card?.getAttribute('data-series') ||
   new URLSearchParams(location.search).get('serie') || document.querySelector('#seriesTitle')?.textContent;
 const edition=editions().find(x=>x.name===name);
 if(!edition)return null;
 const pub=volumes().filter(v=>v.editionId===edition.id&&v.published).sort((a,b)=>Number(b.num)-Number(a.num));
 // No mostrar volumen 1 si hay volumen 108 pero la portada 108 no se verificó.
 const latest=pub[0];
 return latest && INFO[latest.id]?.editionId===edition.id && MEDIA[latest.id] ? latest.id : null;
}
function volumeId(node){return node.classList.contains('volume-cover')?coverOfVolume(node):coverOfSeries(node)}
function labelUpdate(){
 const status=document.querySelector('.tomori-ivrea-status');if(!status)return;
 if(!enabled){status.textContent='Desactivadas · portadas genéricas';return}
 const ok=[...results.values()].filter(s=>s==='ok').length;
 const fail=[...results.values()].filter(s=>s==='fail').length;
 const loading=[...results.values()].filter(s=>s==='loading').length;
 status.textContent=`${Object.keys(MEDIA).length} portadas registradas · ${ok} disponibles · ${fail} no cargadas${loading?' · '+loading+' consultando':''}`;
}
function clearImage(node){
 node.querySelectorAll(':scope > img.tomori-ivrea-cover').forEach(n=>{n.removeAttribute('src');n.remove()});
 node.classList.remove('tomori-ivrea-loaded');
 if(oldLabels.has(node))node.setAttribute('aria-label',oldLabels.get(node));
}
function placeImage(node,id){
 if(!enabled||!node.isConnected||volumeId(node)!==id||node.querySelector(':scope > img.tomori-ivrea-cover'))return;
 if(!oldLabels.has(node))oldLabels.set(node,node.getAttribute('aria-label')||'Portada provisional');
 const img=new Image();img.className='tomori-ivrea-cover';img.loading='lazy';img.decoding='async';
 img.alt=`Portada de ${INFO[id].number} de edición Ivrea, para prueba; derechos por verificar`;
 img.referrerPolicy='no-referrer';
 img.dataset.source='Ivrea Argentina';img.dataset.volumeId=id;
 img.dataset.sourceUrl=MEDIA[id];img.dataset.rights='uso-no-autorizado-para-produccion';
 img.onerror=()=>{results.set(id,'fail');clearImage(node);labelUpdate()};
 img.onload=()=>{if(img.naturalWidth<25||img.naturalHeight<25){img.onerror();return}
  node.classList.add('tomori-ivrea-loaded');node.setAttribute('aria-label',`Portada de editorial Ivrea, tomo ${INFO[id].number}; uso experimental`)};
 img.src=MEDIA[id];node.prepend(img);
}
function loadOnce(id){
 if(results.get(id)==='ok')return Promise.resolve(true);
 if(results.get(id)==='fail')return Promise.resolve(false);
 if(waiting.has(id))return waiting.get(id);
 if(requestCount>=MAX_UNIQUE_REQUESTS)return Promise.resolve(false);
 requestCount++;results.set(id,'loading');labelUpdate();
 const p=new Promise(resolve=>{
  const probe=new Image();let done=false;
  const complete=good=>{if(done)return;done=true;clearTimeout(timer);probe.onload=null;probe.onerror=null;
   results.set(id,good?'ok':'fail');waiting.delete(id);labelUpdate();resolve(good)};
  const timer=setTimeout(()=>complete(false),12000);
  probe.onload=()=>complete(probe.naturalWidth>=25&&probe.naturalHeight>=25);
  probe.onerror=()=>complete(false);
  probe.referrerPolicy='no-referrer';
  probe.src=MEDIA[id];
 });waiting.set(id,p);return p;
}
function visible(node){if(!enabled)return;const id=volumeId(node);if(!id)return;
 void loadOnce(id).then(ok=>{if(ok&&enabled)placeImage(node,id)})}
function scan(){if(!enabled)return;
 document.querySelectorAll(SELECTOR).forEach(node=>{
  if(!volumeId(node)||node.querySelector(':scope > img.tomori-ivrea-cover'))return;
  if(observer)observer.observe(node);else visible(node);
 });}
function queueScan(){if(schedule)return;schedule=true;requestAnimationFrame(()=>{schedule=false;scan()})}
function setEnabled(value,persist=true){enabled=Boolean(value);
 if(persist)try{localStorage.setItem(FLAG,enabled?'on':'off')}catch(_){}
 document.querySelectorAll('.tomori-ivrea-switch').forEach(el=>{el.checked=enabled;el.setAttribute('aria-checked',String(enabled))});
 if(!enabled){observer?.disconnect();document.querySelectorAll('img.tomori-ivrea-cover').forEach(img=>clearImage(img.parentElement))}
 else queueScan();labelUpdate();}
function mountControl(){
 const footer=document.querySelector('footer');if(!footer||footer.querySelector('.tomori-ivrea-control'))return;
 const box=document.createElement('div');box.className='tomori-ivrea-control';
 box.innerHTML='<label><input class="tomori-ivrea-switch" type="checkbox" role="switch"> Portadas Ivrea · prueba experimental</label><span class="tomori-ivrea-status" role="status"></span><small>Se cargan al visitar las fichas; sin descargas masivas. Las imágenes pertenecen a sus titulares. Derechos para uso público/comercial sin confirmar. <a href="https://www.ivrea.com.ar/" target="_blank" rel="noopener noreferrer">Fuente: Ivrea Argentina</a>.</small>';
 footer.append(box);box.querySelector('input').addEventListener('change',e=>setEnabled(e.target.checked));
 labelUpdate();box.querySelector('input').checked=enabled;
}
function init(){mountControl();
 if('IntersectionObserver'in window)observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);visible(entry.target)}})
 },{rootMargin:'120px 0px'});
 const changes=new MutationObserver(records=>{
  if(!enabled)return;
  if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&
   (n.matches?.('.series-card,.volume-card,.profile-cover')||n.querySelector?.('.series-card,.volume-card,.profile-cover')))))queueScan();
 });changes.observe(document.body,{subtree:true,childList:true});
 window.addEventListener('storage',e=>{if(e.key===FLAG)setEnabled(e.newValue==='on',false)});
 setEnabled(enabled,false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.TomoriIvreaCovers=Object.freeze({get enabled(){return enabled},setEnabled,
 sources:()=>JSON.parse(JSON.stringify(INFO))});
})();
