/* TOMORI · Perfil de serie v2.0 · estados vacíos etapa 1
 * Nunca altera la estructura del perfil ni crea tomos, valoraciones o portadas.
 * Solo interviene si el perfil corresponde a una obra provisional y faltan datos.
 */
(function(){
'use strict';
function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function fill(){
  if(typeof WORKS==='undefined'||typeof EDITIONS==='undefined'||typeof VOLUMES==='undefined')return;
  const params=new URLSearchParams(window.location.search);
  const requested=params.get('serie')||params.get('series')||'';
  if(!requested)return;
  const work=WORKS.find(x=>norm(x.name)===norm(requested));
  if(!work||work.importStatus!=='pendiente_validacion_individual')return;
  const editions=EDITIONS.filter(e=>e.workId===work.id);
  const count=VOLUMES.filter(v=>v.workId===work.id).length;
  const heading=document.getElementById('seriesTitle');
  if(heading&&(!heading.textContent.trim()||heading.textContent.trim()==='Serie'))heading.textContent=work.name;
  const meta=document.getElementById('seriesMeta');
  if(meta&&!meta.textContent.trim()){
    meta.append(node('p','note','Ivrea Argentina · Shonen · Autor y estado editorial pendientes de verificación individual'));
  }
  if(count!==0)return;
  const progress=document.getElementById('progressBox');
  if(progress&&!progress.textContent.trim())progress.append(node('p','note','Los tomos de esta obra se incorporarán en la etapa 2. Tu colección actual no se modifica.'));
  const latest=document.getElementById('latestVolumeResults');
  if(latest&&!latest.querySelector('.volume-card')&&!latest.textContent.trim())latest.append(node('p','note','Todavía no hay tomos individuales verificados para esta obra.'));
  const all=document.getElementById('volumeResults');
  if(all&&!all.querySelector('.volume-card')&&!all.textContent.trim())all.append(node('p','note','Los tomos de esta edición están pendientes de importación.'));
  // Si la pantalla original ya muestra las ediciones, conservarlas tal cual.
  // Solo usar el patrón de ficha existente cuando el perfil no haya dibujado ninguna.
  const editionList=document.getElementById('editionResults');
  if(!editionList||editionList.children.length||!editions.length)return;
  for(const edition of editions){
    const card=node('article','tm-edition-card');card.dataset.editionId=edition.id;
    const cover=node('div','tm-edition-cover');cover.setAttribute('role','img');cover.setAttribute('aria-label','Portada provisional sin derechos confirmados');
    const info=node('div','tm-edition-info');
    info.append(node('h3','',edition.name));
    info.append(node('p','',edition.publisher+' · Argentina'));
    info.append(node('p','note','Edición en revisión. Tomos pendientes de la etapa 2.'));
    card.append(cover,info);editionList.append(card);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fill,{once:true});else fill();
})();
