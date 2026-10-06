import type {Reading} from './hydrology.ts';
export type Point={date:string;level:number};
export type History={station:string;name:string;readings:Point[];warning:string|null;history_checked_at?:string|null};
export type NetworkHistory={updated_at:string;histories:Record<string,History>};
export type Comparison={change:number;base:Point;last:Point;target:string;span:number};
export const formatLevel=(n:number)=>n.toLocaleString('es-PY',{minimumFractionDigits:2,maximumFractionDigits:2});
export const formatDate=(s:string)=>new Date(s+'T12:00:00Z').toLocaleDateString('es-PY',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric'});
export const dayDistance=(a:string,b:string)=>Math.round((Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/86400000);
export function shiftDate(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export const sign=(n:number|null)=>n===null?'unknown':n>0?'up':n<0?'down':'flat';
export function pointsFor(readings:Point[],through:string):Point[]{return [...new Map(readings.filter(p=>p.date<=through&&Number.isFinite(p.level)).map(p=>[p.date,p])).values()].sort((a,b)=>a.date.localeCompare(b.date));}
export function comparison(readings:Point[],last:Point,days:number):Comparison|null{
  const target=shiftDate(last.date,-days);const base=pointsFor(readings,target).at(-1);if(!base||dayDistance(target,base.date)>(days===7?3:7))return null;
  return {change:Math.round((last.level-base.level)*100)/100,base,last,target,span:dayDistance(last.date,base.date)};
}
export function positionInReference(level:number,reading:Reading):number|null{const {minimum,maximum}=reading;return minimum&&maximum&&maximum.level>minimum.level?Math.round((level-minimum.level)/(maximum.level-minimum.level)*100):null;}
export function consecutiveSignal(readings:Point[],through:string){
  const points=pointsFor(readings,through);if(points.at(-1)?.date!==through||points.length<2)return {direction:'unknown',days:0};let lastDirection='unknown',days=0;
  for(let i=points.length-1;i>0;i--){if(dayDistance(points[i].date,points[i-1].date)!==1)break;const direction=sign(Math.round((points[i].level-points[i-1].level)*100));if(lastDirection==='unknown')lastDirection=direction;if(direction!==lastDirection)break;days++;}
  return {direction:lastDirection,days};
}
export function signal(daily:number|null,week:Comparison|null,month:Comparison|null,fresh:boolean){
  if(!fresh)return {label:'Lectura anterior',kind:'unknown',priority:'Revisar dato',rank:4};
  const a=sign(week?.change??null),b=sign(month?.change??null),d=sign(daily);let label='Sin base temporal',kind='unknown';
  if(a!=='unknown'&&b!=='unknown'){
    if(a==='up'&&b==='up'){label='Ascenso sostenido';kind='up'}else if(a==='down'&&b==='down'){label='Descenso sostenido';kind='down'}else if(a==='flat'&&b==='flat'){label='Sin cambio a 7/30 días';kind='flat'}else{label='Evolución mixta';kind='mixed'}
    if((d==='up'&&a==='down')||(d==='down'&&a==='up')){label='Cambio reciente de dirección';kind='mixed'}
  }else if(a!=='unknown'||b!=='unknown'){label='Base temporal parcial';kind='partial'}
  const large=Math.max(Math.abs(week?.change??0),Math.abs(month?.change??0))>=.5||Math.abs(daily??0)>=20;
  const priority=large?'Revisar primero':kind==='mixed'?'Revisar evolución':kind==='unknown'||kind==='partial'?'Base incompleta':'Seguimiento';
  return {label,kind,priority,rank:large?3:kind==='mixed'?2:kind==='unknown'||kind==='partial'?1:0};
}
export function analyzeStation(reading:Reading,history:History|undefined,date:string){
  const points=pointsFor([...(history?.readings??[]),{date:reading.date,level:reading.level}],date),last=points.at(-1),previous=points.at(-2);const fresh=last?.date===date;
  const daily=!fresh?null:reading.date===date?reading.variation:previous?Math.round((last!.level-previous.level)*100):null;
  const week=last&&fresh?comparison(points,last,7):null,month=last&&fresh?comparison(points,last,30):null;
  return {reading,last,previous,fresh,daily,week,month,signal:signal(daily,week,month,!!fresh),streak:consecutiveSignal(points,date),position:last?positionInReference(last.level,reading):null,historyWarning:history?.warning,hasHistory:!!history};
}
export type Analysis=ReturnType<typeof analyzeStation>;
