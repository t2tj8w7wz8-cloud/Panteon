/* VISTA PRIVADA de referencias de portada del primer tomo (Etapa 2).
 * SOLO con ?previewPortadas=1 en un entorno de prueba; no habilita permiso comercial.
 * Sin guardado ni redistribucion de imagenes; se conserva el diseno aprobado.
 */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('previewPortadas')!=='1')return;
const css=document.createElement('style');
css.textContent=`.profile-cover.tm-etapa2-cover{position:relative!important;overflow:hidden!important;
  padding:0!important;justify-self:center!important;align-self:center!important;margin-inline:auto!important;
  border-radius:inherit!important;isolation:isolate}
 .profile-cover.tm-etapa2-cover>img.tm-etapa2-cover-img{position:absolute!important;
 inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;
 object-position:center!important;transform:scale(1.06)!important;transform-origin:center!important;
 border:0!important;margin:0!important;z-index:1!important;border-radius:inherit!important}
 .profile-cover.tm-etapa2-cover .rating-seal{position:absolute!important;z-index:3!important;
 bottom:4px!important;left:0!important;right:auto!important;top:auto!important;
 background:rgba(232,232,232,.70)!important;color:#111!important;border-radius:0 14px 14px 0!important;
 padding:10px 14px 9px!important;box-shadow:none!important}`;
document.head.append(css);
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function run(){
 if(typeof WORKS==='undefined'||typeof EDITIONS==='undefined')return;
 const requested=new URLSearchParams(location.search).get('serie')||new URLSearchParams(location.search).get('series')||'';
 const display=document.getElementById('seriesTitle')?.textContent||'';
 const work=WORKS.find(w=>norm(w.name)===norm(requested)||norm(w.name)===norm(display));
 if(!work)return;
 const primary=EDITIONS.find(e=>e.workId===work.id&&e.primary===true&&e.firstVolumeCoverReferenceUrl)||
   EDITIONS.find(e=>e.workId===work.id&&e.firstVolumeCoverReferenceUrl);
 const url=primary?.firstVolumeCoverReferenceUrl || work.firstVolumeCoverReferenceUrl;
 if(!url||!/^(https:\/\/www\.ivrea\.com\.ar\/)/i.test(url))return;
 const host=document.querySelector('.profile-cover');if(!host||host.querySelector('.tm-op-cover-img,.tm-etapa2-cover-img'))return;
 host.classList.add('tm-etapa2-cover');
 const img=document.createElement('img');img.className='tm-etapa2-cover-img';img.alt='Portada editorial de referencia, tomo 1 de '+work.name;
 img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
 img.onerror=()=>{img.remove();host.classList.remove('tm-etapa2-cover');};
 host.insertBefore(img,host.firstChild);img.src=url;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();