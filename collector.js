/* TOMORI · Datos compartidos del prototipo, extendiendo el almacenamiento original.
   No modifica estructuras aprobadas. Los registros predeterminados son DEMOSTRATIVOS. */
(function(global){
'use strict';
const key='panteon-lab-v11';
const DEFAULT_USER={id:'usuario-demo-01',name:'Coleccionista01',avatar:'',title:'Cazador de tomos',unlocked:['Genin de la colección','Cazador de tomos']};
const read=()=>{let s={};try{s=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{};return {...s,owned:s.owned||{},wanted:s.wanted||{},follow:s.follow||{},ownedAt:s.ownedAt||{},wantedAt:s.wantedAt||{},activity:s.activity||[],user:{...DEFAULT_USER,...s.user}}};
const write=s=>{try{localStorage.setItem(key,JSON.stringify(s))}catch(e){console.warn('Tomori: almacenamiento no disponible',e)};global.dispatchEvent(new CustomEvent('tomori:state',{detail:s}));return s};
const seriesList=()=>typeof SERIES!=='undefined'?SERIES:[];
const bookName=id=>String(id).slice(0,String(id).lastIndexOf(':'));
const bookNumber=id=>Number(String(id).split(':').at(-1));
const totalPublished=name=>seriesList().some(s=>s.name===name)?24:0;
const seriesVolumes=name=>{const meta=seriesList().find(s=>s.name===name);if(!meta)return[];return Array.from({length:totalPublished(name)},(_,i)=>({id:name+':'+(i+1),series:name,num:i+1,year:2021+Math.floor(i/4),publisher:meta.publisher,pop:100-i,author:meta.author,published:true}))};
const getVolume=id=>seriesVolumes(bookName(id)).find(v=>v.id===id);
const ownCount=(s,name)=>seriesVolumes(name).filter(v=>!!s.owned[v.id]).length;
const pushEvent=(s,type,id,when=Date.now())=>{s.activity.unshift({id:'evt-'+when+'-'+Math.random().toString(36).slice(2,8),type,target:id,at:when});s.activity=s.activity.slice(0,250)};
const changeMark=(id,kind,desired)=>{
 if(!getVolume(id)||!['own','want'].includes(kind))return false;
 const s=read(), target=kind==='own'?'owned':'wanted',opposite=kind==='own'?'wanted':'owned';
 const was=!!s[target][id],next=typeof desired==='boolean'?desired:!was;
 if(was===next)return was;
 const name=bookName(id),beforeComplete=totalPublished(name)>0&&ownCount(s,name)===totalPublished(name);
 if(next){s[target][id]=true;s[opposite][id]=false;const now=Date.now();s[target==='owned'?'ownedAt':'wantedAt'][id]=now;delete s[opposite==='owned'?'ownedAt':'wantedAt'][id];pushEvent(s,target==='owned'?'owned':'wanted',id,now)}
 else{delete s[target][id];delete s[target==='owned'?'ownedAt':'wantedAt'][id];s.activity=s.activity.filter(a=>!(a.target===id&&a.type===target));}
 if(next&&s.activity.length>250)s.activity.length=250;
 const afterComplete=totalPublished(name)>0&&ownCount(s,name)===totalPublished(name);
 if(!beforeComplete&&afterComplete)pushEvent(s,'completed',name);
 if(beforeComplete&&!afterComplete)s.activity=s.activity.filter(a=>!(a.type==='completed'&&a.target===name));
 write(s);return next;
};
const changeFollow=(name,desired)=>{if(!seriesList().some(s=>s.name===name))return false;const s=read();const next=typeof desired==='boolean'?desired:!s.follow[name];if(next)s.follow[name]=true;else delete s.follow[name];write(s);return next};
const stats=()=>{const s=read(),per=seriesList().map(x=>{const total=totalPublished(x.name),owned=ownCount(s,x.name);return {...x,total,owned,percent:total?Math.round(owned*100/total):0}});return {series:per.filter(x=>x.owned>0).length,volumes:per.reduce((n,x)=>n+x.owned,0),completed:per.filter(x=>x.total>0&&x.owned===x.total).length,per}};
const ownedVolumes=()=>{const s=read();return Object.keys(s.owned).filter(id=>s.owned[id]&&getVolume(id)).map(id=>({...getVolume(id),addedAt:s.ownedAt[id]||0})).sort((a,b)=>b.addedAt-a.addedAt||a.id.localeCompare(b.id,'es'))};
const wantedVolumes=()=>{const s=read();return Object.keys(s.wanted).filter(id=>s.wanted[id]&&!s.owned[id]&&getVolume(id)).map(id=>({...getVolume(id),addedAt:s.wantedAt[id]||0})).sort((a,b)=>b.addedAt-a.addedAt||a.id.localeCompare(b.id,'es'))};
const missingVolumes=()=>{const s=read();return seriesList().filter(x=>s.follow[x.name]).flatMap(x=>seriesVolumes(x.name).filter(v=>!s.owned[v.id]&&v.published)).sort((a,b)=>a.series.localeCompare(b.series,'es')||a.num-b.num)};
const updateUser=changes=>{const s=read();if(typeof changes.name==='string')s.user.name=changes.name.trim().slice(0,40)||DEFAULT_USER.name;if(typeof changes.title==='string'&&s.user.unlocked.includes(changes.title))s.user.title=changes.title;if(typeof changes.avatar==='string')s.user.avatar=changes.avatar;write(s)};
const seedDemo=()=>{const s=read();if(s.demoInitialized)return false;s.demoInitialized=true;s.demoLabel='Datos simulados de laboratorio';
 // Solo añadir datos de ejemplo cuando no hay ninguna marca real previa.
 if(!Object.values(s.owned).some(Boolean)&&!Object.values(s.wanted).some(Boolean)){
   const now=Date.now();const names=seriesList().map(x=>x.name);
   if(names.length>=5){
     const all=[...Array.from({length:24},(_,i)=>names[2]+':'+(i+1)),names[0]+':1',names[0]+':2',names[0]+':3',names[0]+':4',names[0]+':5',names[1]+':1',names[1]+':2',names[3]+':1',names[3]+':2',names[4]+':1'];
     all.forEach((id,i)=>{s.owned[id]=true;s.ownedAt[id]=now-(all.length-i)*7200000});
     [names[0]+':8',names[1]+':3',names[4]+':2',names[3]+':4'].forEach((id,i)=>{s.wanted[id]=true;s.wantedAt[id]=now-(4-i)*3600000});
     [names[0],names[1],names[2],names[4]].forEach(n=>s.follow[n]=true);
     s.activity=[{id:'demo3',type:'wanted',target:names[4]+':2',at:now-3600000},{id:'demo2',type:'owned',target:names[4]+':1',at:now-7200000},{id:'demo1',type:'completed',target:names[2],at:now-86400000}];
   }
 }
 write(s);return true};
const clearDemo=()=>{const s=read();Object.assign(s,{owned:{},wanted:{},ownedAt:{},wantedAt:{},activity:[],follow:{},demoInitialized:true,demoLabel:'Datos de prueba reiniciados'});write(s)};
const dateTime=ts=>ts?new Date(ts).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}):'Fecha no registrada';
global.TomoriCollector={key,read,write,getVolume,seriesVolumes,totalPublished,changeMark,changeFollow,stats,ownedVolumes,wantedVolumes,missingVolumes,updateUser,seedDemo,clearDemo,dateTime,bookName,bookNumber};
})(window);
