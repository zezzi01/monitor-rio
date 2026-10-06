# Centro de Observación Hidrológico · La Barca del Pescador

Web inspirada en el Observatorio Hidrológico del Paraguay de GEOlab/AEP: https://geolabaep.github.io/.

## Qué muestra

- Mapa Mapbox con todas las estaciones convencionales publicadas por la DMH.
- Niveles, variaciones publicadas y fecha real de cada lectura.
- Centro operativo por fecha: síntesis, cobertura, cambios destacados, persistencia, matriz por río y datos para revisar.
- Comparaciones a 7 y 30 días con la fecha real de la base. Sin interpolar días ausentes.
- Historial por estación con fechas personalizadas, referencias históricas DMH opcionales en el gráfico, tabla de variaciones y descarga CSV.
- Mínimos y máximos históricos oficiales con sus fechas y posición relativa entre extremos.
- Metodología, trazabilidad de la fuente y aviso cuando la consulta falla.

## Publicación en GitHub Pages

En Settings → Pages → Build and deployment, seleccionar GitHub Actions. El workflow `.github/workflows/monitor.yml` consulta la DMH, guarda los datos, prueba y publica la web. Ejecuta al subir cambios a main, manualmente y cada hora al minuto 17 (UTC). GitHub puede demorar ejecuciones programadas. Los schedules de repositorios públicos pueden desactivarse después de 60 días sin actividad.

La dirección prevista es https://zezzi01.github.io/monitor-rio/ . No se considera publicada hasta que el workflow termine correctamente.

## Datos y actualización

Fuente: https://meteorologia.gov.py/nivel-rio/indexconvencional.php . El proceso obtiene todas las estaciones, valida que la tabla no sea una respuesta incompleta y guarda cada lectura por estación y fecha. Recupera hasta seis páginas de historial inicial por estación (90 observaciones) y revisa diariamente la página reciente. Las correcciones reemplazan la lectura de la misma fecha sin duplicarla. No se interpolan fechas ausentes.

Los archivos `public/data/latest.json` y `public/data/history/*.json` permanecen en el repositorio. Si falla la tabla principal, se conserva la última información válida y se publica un aviso. La web revisa los archivos cada cinco minutos; Revisar datos lee los archivos publicados, no consulta directamente la DMH. Hora de Paraguay: America/Asuncion.

Los marcadores son localidades aproximadas; no son coordenadas relevadas de las escalas. Los niveles no equivalen a profundidad ni calado disponible. No se emiten pronósticos ni alertas oficiales.

## Criterios del análisis

El proceso publica `public/data/analysis.json` con las series guardadas de la red. Las fechas operativas anteriores se reconstruyen usando solo observaciones hasta la fecha elegida. Las lecturas anteriores no entran en los conteos ni en las comparaciones de esa fecha. En la fecha publicada por la tabla DMH se conserva su variación; en fechas anteriores se calcula frente al registro previo disponible.

Las bases a 7 y 30 días son el registro igual o anterior al objetivo, admitiendo hasta 3 y 7 días de antigüedad respecto a la fecha base. Cada comparación muestra el intervalo real. La persistencia cuenta únicamente cambios de la misma dirección en días consecutivos y se corta ante huecos.

«Revisar primero» ordena estaciones con un cambio absoluto de al menos 50 cm a 7/30 días o 20 cm frente al registro anterior. Es un criterio explícito de revisión, no un umbral oficial ni una clasificación de riesgo. Los valores no establecen la viabilidad de una maniobra.

La posición histórica es `(nivel − mínimo DMH) / (máximo DMH − mínimo DMH) × 100`. Conserva valores fuera de 0–100% si los extremos de referencia fueron superados. No es un percentil. La media de la serie describe solo las observaciones cargadas, no toda la historia hidrológica.

## Mapbox

En Settings → Secrets and variables → Actions, crear un repository secret llamado MAPBOX_TOKEN con el token público Mapbox. El build lo inyecta como VITE_MAPBOX_TOKEN. Para prueba local usar `.env.local` (ignorado por Git) con VITE_MAPBOX_TOKEN. Un token público termina visible en el navegador; restringir sus URL permitidas a https://zezzi01.github.io y, si se necesita prueba local, http://127.0.0.1:5174 . No usar tokens secretos `sk.` en la web. Su disponibilidad y consumo dependen de la cuenta Mapbox.

## Desarrollo

Node 24. `npm ci`, `npm run scrape`, `npm test`, `npm run dev`, `npm run build`. El despliegue publica `dist/`.
