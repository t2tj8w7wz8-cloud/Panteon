/* TOMORI · Catálogo real v1.0 · estado local por edición. Sin datos de demostración generados. */
(function(global){
'use strict';
// Se conserva la clave anterior para NO borrar registros hechos por el usuario.
const key='tomori-internacional-experimental-v12';
const DEFAULT_USER={id:'usuario-piloto-01',name:'Coleccionista01',avatar:'',title:'Cazador de tomos',unlocked:['Genin de la colección','Cazador de tomos']};
const seriesList=()=>typeof SERIES==='undefined'?[]:SERIES;
const volumesList=()=>typeof VOLUMES==='undefined'?[]:VOLUMES;
const getEdition=id=>seriesList().find(e=>e.id===id);
const getVolume=id=>volumesList().find(v=>v.id===id);
const volumeName=id=>getVolume(id)?.series||'';
const volumeNumber=id=>getVolume(id)?.num||null;
function read(){
 let raw={};try{raw=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 let s={...raw,owned:{...raw.owned},wanted:{...raw.wanted},follow:{...raw.follow},ratings:{...raw.ratings},quotes:{...raw.quotes},votes:{...raw.votes},ownedAt:{...raw.ownedAt},wantedAt:{...raw.wantedAt},activity:[...(raw.activity||[])],user:{...DEFAULT_USER,...raw.user}};
 if(!s.realCatalogMigrated){
   // Únicamente los registros auto-generados del prototipo son retirados.
   const demoEvents=s.activity.filter(e=>e.id==='pilot-owned'||e.id==='pilot-wanted');
   demoEvents.forEach(e=>{if(e.type==='owned'){delete s.owned[e.target];delete s.ownedAt[e.target]}if(e.type==='wanted'){delete s.wanted[e.target];delete s.wantedAt[e.target]}});
   s.activity=s.activity.filter(e=>!['pilot-owned','pilot-wanted'].includes(e.id));
   if(s.demoInitialized){delete s.follow['One Piece'];delete s.follow['Chainsaw Man']}
   // Seguimientos antiguos manuales, cuando no procedían de la semilla de demostración.
   else for(const [name,val] of Object.entries(s.follow)){
     if(!val)continue;
     const ed=seriesList().find(x=>x.name===name&&x.primary);
     if(ed){s.follow[ed.id]=true;delete s.follow[name]}
   }
   // Frases y votos del prototipo NO son testimonios de usuarios reales.
   for(const [name,items] of Object.entries(s.quotes))if(Array.isArray(items))s.quotes[name]=items.filter(q=>q.id==='mine'||!String(q.author||'').includes('ejemplo'));
   s.realCatalogMigrated=true;
   try{localStorage.setItem(key,JSON.stringify(s))}catch{}
 }
 return s;
}
const write=s=>{try{localStorage.setItem(key,JSON.stringify(s))}catch(e){console.warn(e)}global.dispatchEvent(new CustomEvent('tomori:state',{detail:s}));return s};
const seriesVolumes=editionId=>volumesList().filter(v=>v.editionId===editionId);
const totalPublished=editionId=>getEdition(editionId)?.publishedCount??null;
const ownCount=(state,eid)=>seriesVolumes(eid).filter(v=>v.published&&!!state.owned[v.id]).length;
const event=(s,type,target)=>{const t=Date.now();s.activity.unshift({id:'evt-'+t+'-'+Math.random().toString(36).slice(2,9),type,target,at:t});s.activity=s.activity.slice(0,250)};
function changeMark(id,kind,desired){
 const v=getVolume(id);if(!v||!['own','want'].includes(kind))return false;
 if(kind==='own'&&!v.published)return false;
 const s=read(),ownKey=kind==='own'?'owned':'wanted',opposite=kind==='own'?'wanted':'owned';
 const next=typeof desired==='boolean'?desired:!s[ownKey][id],prev=!!s[ownKey][id];if(next===prev)return next;
 const total=totalPublished(v.editionId),before=total!==null&&total>0&&ownCount(s,v.editionId)===total;
 if(next){s[ownKey][id]=true;delete s[opposite][id];s[ownKey==='owned'?'ownedAt':'wantedAt'][id]=Date.now();delete s[opposite==='owned'?'ownedAt':'wantedAt'][id];event(s,ownKey,id)}
 else{delete s[ownKey][id];delete s[ownKey==='owned'?'ownedAt':'wantedAt'][id];s.activity=s.activity.filter(a=>!(a.type===ownKey&&a.target===id))}
 const after=total!==null&&total>0&&ownCount(s,v.editionId)===total;
 if(!before&&after)event(s,'completed',v.editionId);
 if(before&&!after)s.activity=s.activity.filter(a=>!(a.type==='completed'&&a.target===v.editionId));
 write(s);return next;
}
function changeFollow(editionId,desired){const e=getEdition(editionId);if(!e)return false;const s=read(),next=typeof desired==='boolean'?desired:!s.follow[editionId];if(next)s.follow[editionId]=true;else delete s.follow[editionId];write(s);return next}
const stats=()=>{
 const s=read(),per=seriesList().map(e=>{
  const total=totalPublished(e.id),owned=ownCount(s,e.id);
  return {...e,owned,total,percent:total?Math.min(100,Math.round(100*owned/total)):0};
 });
 return {series:per.filter(x=>x.owned>0).length,volumes:volumesList().filter(v=>v.published&&s.owned[v.id]).length,completed:per.filter(x=>x.total>0&&x.owned===x.total).length,per};
};
const ownedVolumes=()=>{const s=read();return volumesList().filter(v=>v.published&&s.owned[v.id]).map(v=>({...v,addedAt:s.ownedAt[v.id]||0})).sort((a,b)=>b.addedAt-a.addedAt||a.id.localeCompare(b.id))};
const wantedVolumes=()=>{const s=read();return volumesList().filter(v=>s.wanted[v.id]&&!s.owned[v.id]).map(v=>({...v,addedAt:s.wantedAt[v.id]||0})).sort((a,b)=>b.addedAt-a.addedAt||a.id.localeCompare(b.id))};
const missingVolumes=()=>{const s=read();return volumesList().filter(v=>v.published&&s.follow[v.editionId]&&!s.owned[v.id]).sort((a,b)=>a.series.localeCompare(b.series,'es')||a.editionId.localeCompare(b.editionId)||a.num-b.num)};
const updateUser=changes=>{const s=read();if(typeof changes.name==='string')s.user.name=changes.name.trim().slice(0,40)||DEFAULT_USER.name;if(typeof changes.title==='string'&&s.user.unlocked.includes(changes.title))s.user.title=changes.title;if(typeof changes.avatar==='string')s.user.avatar=changes.avatar;write(s)};
const seedDemo=()=>false;
const clearDemo=()=>{const s=read();Object.assign(s,{owned:{},wanted:{},follow:{},ratings:{},quotes:{},votes:{},ownedAt:{},wantedAt:{},activity:[],demoInitialized:false,demoLabel:''});write(s)};
const dateTime=ts=>ts?new Date(ts).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}):'Sin fecha';
global.TomoriCollector={key,read,write,getVolume,getEdition,seriesVolumes,totalPublished,changeMark,changeFollow,stats,ownedVolumes,wantedVolumes,missingVolumes,updateUser,seedDemo,clearDemo,dateTime,bookName:volumeName,bookNumber:volumeNumber};
})(window);
