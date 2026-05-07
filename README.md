# Dashboard Comercial CCLA — LAR GROUP

Dashboard estático de la presentación comercial mensual de LAR Group para los proyectos Holley, Bellet e IMU.

## Contenido

- **Resumen Consolidado** — KPIs de cartera, ocupación, retención (3 proyectos)
- **Leads** × 3 proyectos — agendamientos, leads totales, KPI visita y cierre
- **Ocupación** × 3 proyectos — YTD, forecast 4 meses, desglose por tipología y UF/m²
- **Vencimientos** × 3 proyectos — renueva, no renueva, sin respuesta, KPI retención
- **Análisis de Salidas Anticipadas** × 3 proyectos — categorización por causa, atribución LAR, top departamentos por UF perdida

## Datos

Información consolidada al **07-05-2026**. Datos cargados desde:
- `Input_Holley_Bellet_IMU_07.05.2026.xlsx` (hojas PPT1_Leads, PPT2_Ocupacion, PPT3_Vencimientos)
- `feedback dayana.xlsx` (KPIs y salidas anticipadas más recientes con detalle de motivos)

## Marca

Diseño aplicado siguiendo el **Manual de Marca LAR GROUP** (b2o, 2016):
- Turquesa primario `#00A8B4` (Pantone 7467 C)
- Gris secundario `#747678` (Pantone Cool Gray 9 C)
- Tipografía Arial (sistema)
- Slogan "Tu nueva forma de arrendar"
- Arquitectura: franja superior turquesa "presenta" + endoso negro "Un proyecto LAR GROUP"

## Deploy en Vercel

### Opción 1 — CLI (recomendado)
```bash
npm i -g vercel
cd vercel-deploy
vercel --prod
```

### Opción 2 — Drag & drop
1. Comprimir el contenido de esta carpeta (`index.html` + `vercel.json`)
2. Subir el ZIP a https://vercel.com/new

### Opción 3 — Git
1. Crear repo en GitHub y pushear esta carpeta
2. Importar en Vercel desde el dashboard
3. Build settings: framework = Other, output dir = .

## Stack

- HTML estático puro (sin build step)
- Chart.js 4.4.0 desde CDN
- Sin dependencias externas, sin tracking, sin localStorage
- Compatible con cualquier hosting estático (Vercel, Netlify, Cloudflare Pages, GitHub Pages)

## Uso

Abrir `index.html` y usar los controles de la barra superior para navegar:
- **Proyecto**: Todos / Holley / Bellet / IMU
- **Vista**: Todos / Leads / Ocupación / Vencimientos / Salidas Anticipadas
- **Período**: Últimos 7 meses / YTD 2026 / Todo

Cada slide tiene formato 16:9 (1280px ancho) listo para captura de pantalla y pegado directo en PowerPoint.

El botón **Imprimir / PDF** convierte cada slide en una página PDF, lista para distribución.

---

Última actualización: 07-05-2026
