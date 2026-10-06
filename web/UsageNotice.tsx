import {Info} from 'lucide-react';

export default function UsageNotice({compact=false}:{compact?:boolean}){
 return <aside className={`usage-notice${compact?' compact':''}`} aria-label="Alcance de la información">
  {!compact&&<div className="usage-intro"><Info size={16}/><p><strong>Tendencia observada</strong> · Los cambios describen registros pasados; no anticipan el nivel del próximo mes.</p></div>}
  <details><summary>{compact?'Observaciones, no pronóstico · Ver alcance':'Cómo interpretar estos datos'}</summary><div className="usage-details">
   <p><b>Colores:</b> verde = sube, rojo = baja y amarillo = estable. Indican dirección del cambio, no condiciones seguras ni peligro. Gris indica lectura anterior o variación no disponible.</p>
   <p><b>Vigencia:</b> comprobá la fecha de lectura de cada estación. La hora de consulta a la fuente no es la hora de medición; pueden existir demoras, faltantes o correcciones.</p>
   <p><b>Nivel y navegación:</b> el nivel está referido a la escala local de cada estación. No equivale a profundidad disponible ni a calado admisible, y no permite comparar directamente la profundidad entre estaciones. Para una maniobra, verificá las mediciones locales y los criterios del astillero.</p>
   <p><b>Pronósticos:</b> este tablero todavía no incorpora estimaciones futuras. Una tendencia sostenida no garantiza que continúe. Los pronósticos que se incorporen deberán mostrar su fuente, fecha de emisión, período de validez e incertidumbre.</p>
   <p><b>Alcance:</b> herramienta independiente de La Barca del Pescador, basada en publicaciones de la DMH / DINAC. Las interpretaciones del tablero no son pronósticos ni alertas oficiales.</p>
  </div></details>
 </aside>;
}
