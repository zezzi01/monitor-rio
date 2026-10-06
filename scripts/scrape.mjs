import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {SOURCE,parseDMH,parseHistory} from '../web/hydrology.ts';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const DATA=resolve(ROOT,'public/data');
export async function download(url){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  try{const r=await fetch(url,{headers:{'User-Agent':'LaBarcaRiverMonitor/1.0 (+https://github.com/zezzi01/monitor-rio)'},signal:AbortSignal.timeout(25000)});if(!r.ok)throw new Error(`DMH: HTTP ${r.status}`);return await r.text();}catch(e){last=e;if(attempt<2)await new Promise(r=>setTimeout(r,1000*(attempt+1)));}
 }throw last;
}
const read=async(file,fallback)=>{try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}};
async function atomic(file,value){await mkdir(dirname(file),{recursive:true});await writeFile(file+'.tmp',JSON.stringify(value,null,2)+'\n');await rename(file+'.tmp',file);}
export function mergeReadings(existing,incoming){const records=new Map(existing.map(r=>[r.date,r]));for(const r of incoming)records.set(r.date,{date:r.date,level:r.level});return [...records.values()].sort((a,b)=>a.date.localeCompare(b.date));}
async function sync(){
 const stamp=new Date().toISOString();const last=await read(resolve(DATA,'latest.json'),{stations:[],state:null});
 try{
  const stations=parseDMH(await download(SOURCE));let warnings=[];
  // Preserve latest snapshot from the main source. History is hydrated once and then checked daily.
  for(let i=0;i<stations.length;i+=2){await Promise.all(stations.slice(i,i+2).map(async station=>{
   const file=resolve(DATA,'history',station.station+'.json');const old=await read(file,{station:station.station,name:station.name,readings:[],history_checked_at:null,warning:null});
   let readings=mergeReadings(old.readings,[station]),warning=old.warning??null,checked=old.history_checked_at;
   const day=stamp.slice(0,10);
   if(!checked||checked.slice(0,10)!==day){try{warning=null;
    const pages=old.readings.length<80?6:1;
    for(let page=1;page<=pages;page++){const url=new URL(station.source);url.searchParams.set('page',String(page));const rows=parseHistory(await download(url.href),station);if(!rows.length){warning='La fuente no devolvió historial utilizable.';break;}readings=mergeReadings(readings,rows);if(rows.length<15)break;}
    checked=stamp;
   }catch{warning='No se pudo recuperar todo el historial de la DMH. Se conservan las lecturas guardadas.';warnings.push(station.name);}}
   // The current table is authoritative for the latest reading.
   readings=mergeReadings(readings,[station]);await atomic(file,{station:station.station,name:station.name,readings,history_checked_at:checked,warning});
  }));console.log(`Historial: ${Math.min(i+2,stations.length)}/${stations.length}`);}
  const histories={};for(const station of stations)histories[station.station]=await read(resolve(DATA,'history',station.station+'.json'),null);
  await atomic(resolve(DATA,'analysis.json'),{updated_at:stamp,histories});
  await atomic(resolve(DATA,'latest.json'),{stations:stations.map(s=>({...s,fetched_at:stamp})),state:{last_attempt:stamp,last_success:stamp,error:null,count:stations.length},history_warnings:warnings});
  console.log(`DMH: ${stations.length} estaciones guardadas · ${stamp}`);
 }catch(e){await atomic(resolve(DATA,'latest.json'),{...last,state:{...last.state,last_attempt:stamp,error:'No se pudo actualizar desde la DMH. Se conserva la última consulta válida.'}});throw e;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))sync().catch(e=>{console.error(e.message);process.exitCode=1;});

