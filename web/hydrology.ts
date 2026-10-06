export const SOURCE = "https://meteorologia.gov.py/nivel-rio/indexconvencional.php";
export type HistoricalExtreme={level:number;date:string};
export type Reading = {station:string;name:string;river:string;date:string;level:number;variation:number|null;source:string;fetched_at?:string;minimum?:HistoricalExtreme|null;maximum?:HistoricalExtreme|null};
export const stationKey=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const clean=(s:string)=>s.replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/&amp;/g,"&").replace(/&minus;/g,"-").replace(/\s+/g," ").trim();
export function dateISO(s:string){const m=s.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);if(!m)return null;const v=`${m[3]}-${m[2]}-${m[1]}`;return new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v?v:null;}
export function parseDMH(html:string):Reading[]{
  const found:Reading[]=[];
  for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const c=[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>clean(x[1]));
    if(c.length<4)continue;
    const date=dateISO(c[1]); const level=Number(c[2].replace(",",".").match(/[-+]?\d+(?:\.\d+)?/)?.[0]);
    if(!date||!c[0]||!Number.isFinite(level))continue;
    // River heading preceding this table row; source labels are not assumed to be ASCII.
    const preceding=html.slice(0,row.index);const headings=[...preceding.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map(x=>clean(x[1]));
    const heading=headings.filter(x=>/^R[IÍ]O\s/i.test(x)).at(-1);
    const river=heading?"Río "+heading.replace(/^R[IÍ]O\s+/i,"").toLowerCase().replace(/^./,x=>x.toUpperCase()).replace("Parana","Paraná"):"Río sin identificar";
    const vm=c[3].replace(",",".").match(/[-+]?\d+(?:\.\d+)?/);const raw=vm?Number(vm[0]):null;
    const variation=raw===null?null:/\bcm\b/i.test(c[3])?raw: /\bm\b/i.test(c[3])?raw*100:raw;
    const link=row[1].match(/href=["']([^"']*vermas(?:_convencional)?\.php[^"']*)/i)?.[1];
    found.push({station:stationKey(c[0]),name:c[0],river,date,level,variation,minimum:parseExtreme(c[4]),maximum:parseExtreme(c[5]),source:link?new URL(link.replace(/&amp;/g,"&"),SOURCE).href:SOURCE});
  }
  if(found.length<20||found.some(x=>x.river==="Río sin identificar"))throw new Error("La estructura de la DMH cambió o la respuesta está incompleta. Se conserva la última consulta válida.");
  if(new Set(found.map(x=>x.station)).size!==found.length)throw new Error("La fuente contiene estaciones duplicadas.");
  return found;
}
export function parseExtreme(value?:string):HistoricalExtreme|null{
  if(!value)return null;const date=dateISO(value),match=value.replace(',','.').match(/^\s*([-+]?\d+(?:\.\d+)?)\s*m\b/i);return date&&match?{date,level:Number(match[1])}:null;
}
export function parseHistory(html:string,station:Reading):Reading[]{
  const out:Reading[]=[];
  for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const c=[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>clean(x[1]));
    if(c.length!==2)continue;const date=dateISO(c[0]);const m=c[1].replace(",",".").match(/[-+]?\d+(?:\.\d+)?/);if(date&&m)out.push({...station,date,level:Number(m[0]),variation:null});
  }return out;
}
export const todayPY=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"America/Asuncion",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
// Approximate town locations: geographic context, not surveyed station coordinates.
export const positions:Record<string,[number,number]>={
 "puerto-ladario-brasil":[-19.00,-57.60],"puerto-murtinho-brasil":[-21.70,-57.88],"caceres-brasil":[-16.07,-57.68],"isla-margarita":[-21.99,-57.97],"fuerte-olimpo":[-21.04,-57.87],"bahia-negra":[-20.23,-58.17],"vallemi":[-22.13,-57.96],"concepcion":[-23.41,-57.44],"rosario":[-24.45,-57.14],"puerto-antequera":[-24.09,-57.20],"villeta":[-25.51,-57.56],"asuncion":[-25.28,-57.64],"ita-enramada":[-25.36,-57.63],"humaita":[-27.07,-58.51],"alberdi":[-26.19,-58.14],"pilar":[-26.87,-58.30],"puerto-tigre":[-23.22,-54.29],"salto-del-guaira":[-24.06,-54.31],"ciudad-del-este":[-25.51,-54.61],"cerrito":[-27.34,-57.64],"ita-piru":[-27.27,-58.15],"paso-de-patria":[-27.24,-58.55],"ayolas":[-27.40,-56.90],"panchito-lopez":[-27.32,-56.42],"coratei":[-27.39,-56.83],"ita-cora":[-27.21,-58.20],"san-cosme-y-san-damian":[-27.32,-56.33],"encarnacion":[-27.33,-55.87],"pozo-hondo":[-22.28,-62.54],"villa-florida":[-26.41,-57.12],"estacion-arirai":[-20.22,-58.17]
};
