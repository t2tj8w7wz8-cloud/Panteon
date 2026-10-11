/* TOMORI v1.2 · Estado experimental de catálogo internacional. Separado de los registros del prototipo estable. */
(function(global){
'use strict';
const key='tomori-internacional-experimental-v12';
const DEFAULT_USER={id:'usuario-piloto-01',name:'Coleccionista01',avatar:'',title:'Cazador de tomos',unlocked:['Genin de la colección','Cazador de tomos']};
const now=()=>Date.now();
const seriesList=()=>typeof SERIES!=='undefined'?SERIES:[];
const volumesList=()=>typeof VOLUMES!=='undefined'?VOLUMES:[];
const read=()=>{let s={};try{s=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{};
 return {...s,owned:s.owned||{},wanted:s.wanted||{},follow:s.follow||{},ratings:s.ratings||{},quotes:s.quotes||{},votes:s.votes||{},ownedAt:s.ownedAt||{},wantedAt:s.wantedAt||{},activity:s.activity||[],user:{...DEFAULT_USER,...s.user}}};
const write=s=>{try{localStorage.setItem(key,JSON.stringify(s))}catch(e){console.warn(e)}global.dispatchEvent(new CustomEvent('tomori:state',{detail:s}));return s};
const getVolume=id=>volumesList().find(v=>v.id===id);
const bookName=id=>getVolume(id)?.series||'';
const bookNumber=id=>getVolume(id)?.num||null;
const seriesVolumes=name=>volumesList().filter(v=>v.series===name);
const totalPublished=name=>{const s=seriesList().find(x=>x.name===name);return s?.publishedCount==null?0:s.publishedCount};
const ownCount=(s,name)=>seriesVolumes(name).filter(v=>v.published&&!!s.owned[v.id]).length;
const event=(s,type,target)=>{const t=now();s.activity.unshift({id:'evt-'+t+'-'+Math.random().toString(36).slice(2,9),type,target,at:t});s.activity=s.activity.slice(0,250)};
function changeMark(id,kind,desired){
 const volume=getVolume(id);if(!volume||!['own','want'].includes(kind))return false;
 if(kind==='own'&&!volume.published)return false; // no registrar anuncios como poseídos
 const s=read(),a=kind==='own'?'owned':'wanted',b=kind==='own'?'wanted':'owned',before=!!s[a][id],next=typeof desired==='boolean'?desired:!before;
 if(next===before)return next;
 const total=totalPublished(volume.series),completeBefore=total>0&&ownCount(s,volume.series)===total;
 if(next){s[a][id]=true;delete s[b][id];s[a==='owned'?'ownedAt':'wantedAt'][id]=now();delete s[b==='owned'?'ownedAt':'wantedAt'][id];event(s,a==='owned'?'owned':'wanted',id)}
 else{delete s[a][id];delete s[a==='owned'?'ownedAt':'wantedAt'][id];s.activity=s.activity.filter(x=>!(x.target===id&&x.type===(a==='owned'?'owned':'wanted')))}
 const completeAfter=total>0&&ownCount(s,volume.series)===total;
 if(!completeBefore&&completeAfter)event(s,'completed',volume.series);
 if(completeBefore&&!completeAfter)s.activity=s.activity.filter(x=>!(x.type==='completed'&&x.target===volume.series));
 write(s);return next;
}
function changeFollow(name,desired){if(!seriesList().some(x=>x.name===name))return false;const s=read();const next=typeof desired==='boolean'?desired:!s.follow[name];if(next)s.follow[name]=true;else delete s.follow[name];write(s);return next}
const stats=()=>{const s=read(),per=seriesList().map(x=>{const total=totalPublished(x.name),owned=ownCount(s,x.name);return {...x,total,owned,percent:total?Math.round(owned*100/total):0}});
 return {series:per.filter(x=>x.owned>0).length,volumes:per.reduce((n,x)=>n+x.owned,0),completed:per.filter(x=>x.total>0&&x.owned===x.total).length,per}};
const ownedVolumes=()=>{const s=read();return volumesList().filter(v=>v.published&&s.owned[v.id]).map(v=>({...v,addedAt:s.ownedAt[v.id]||0})).sort((a,b)=>b.addedAt-a.addedAt||a.id.localeCompare(b.id))};
const wantedVolumes=()=>{const s=read();return volumesList().filter(v=>s.wanted[v.id]&&!s.owned[v.id]).map(v=>({...v,addedAt:s.wantedAt[v.id]||0})).sort((a,b)=>b.addedAt-a.addedAt||a.id.localeCompare(b.id))};
const missingVolumes=()=>{const s=read();return volumesList().filter(v=>v.published&&s.follow[v.series]&&!s.owned[v.id]).sort((a,b)=>a.series.localeCompare(b.series,'es')||a.num-b.num)};
const updateUser=changes=>{const s=read();if(typeof changes.name==='string')s.user.name=changes.name.trim().slice(0,40)||DEFAULT_USER.name;if(typeof changes.title==='string'&&s.user.unlocked.includes(changes.title))s.user.title=changes.title;if(typeof changes.avatar==='string')s.user.avatar=changes.avatar;write(s)};
const seedDemo=()=>{const s=read();if(s.demoInitialized)return false;s.demoInitialized=true;s.demoLabel='Datos de usuario simulados; fichas bibliográficas de fuentes oficiales';
 if(!Object.values(s.owned).some(Boolean)&&!Object.values(s.wanted).some(Boolean)){
  const own=volumesList().find(v=>v.series==='Solanin'&&v.published),want=volumesList().find(v=>v.series==='Chainsaw Man'&&v.published);
  if(own){s.owned[own.id]=true;s.ownedAt[own.id]=now()-86400000;s.activity.unshift({id:'pilot-owned',type:'owned',target:own.id,at:s.ownedAt[own.id]});}
  if(want){s.wanted[want.id]=true;s.wantedAt[want.id]=now()-43000000;s.activity.unshift({id:'pilot-wanted',type:'wanted',target:want.id,at:s.wantedAt[want.id]});}
  for(const n of ['One Piece','Chainsaw Man'])if(seriesList().some(x=>x.name===n))s.follow[n]=true;
 }
 write(s);return true;
};
const clearDemo=()=>{const s=read();Object.assign(s,{owned:{},wanted:{},follow:{},ownedAt:{},wantedAt:{},activity:[],demoInitialized:true});write(s)};
const dateTime=ts=>ts?new Date(ts).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}):'Sin fecha';
global.TomoriCollector={key,read,write,getVolume,seriesVolumes,totalPublished,changeMark,changeFollow,stats,ownedVolumes,wantedVolumes,missingVolumes,updateUser,seedDemo,clearDemo,dateTime,bookName,bookNumber};
})(window);
