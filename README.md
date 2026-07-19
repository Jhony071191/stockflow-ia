# StockFlow IA

StockFlow IA convierte documentos empresariales heterogéneos en un inventario operativo y un plan de acción comprensible: qué reponer, qué tiene exceso, dónde ubicar cada lote y qué referencias requieren atención inmediata.

**Aplicación:** https://stockflow-ia.jamz071191.chatgpt.site

## Problema que resuelve

Pequeños comercios, almacenes y organizaciones suelen disponer de datos de stock, pero no de una herramienta sencilla que traduzca esos datos en decisiones diarias. El resultado puede ser rotura de stock, mercancía inmovilizada, compras innecesarias y desperdicio.

## Funcionalidades

- Centro universal de documentos para Excel (`.xlsx`), CSV, TSV, JSON, PDF con texto, Word (`.docx`) y TXT.
- Detección de la tabla principal, la fila real de encabezados, alias en varios idiomas, tipos de datos y tablas incrustadas.
- Asistente de correspondencia editable y perfiles de formato recordados localmente por empresa.
- Dos modos de trabajo: crear un análisis o complementar el inventario existente por SKU —o por ubicación para conteos— con datos procedentes de otros documentos.
- Importación segura con solo SKU y cantidad como campos imprescindibles; los datos ausentes nunca se inventan.
- Auditoría de preparación operativa de 0 a 100 con cobertura completa, parcial o pendiente para cada capacidad.
- Generación del mapa completo cuando el archivo contiene el maestro de ubicaciones, incluidas vacías y ocupadas.
- Modo de ubicaciones de origen cuando la extracción solo contiene posiciones confirmadas: conserva el código exacto y no crea huecos ficticios.
- Estructura configurable por pasillos, módulos y entre 5 y 7 alturas.
- Agrupación por familias y segregación visual de ubicaciones APQ.
- Trazabilidad por ubicación, SKU, lote, fabricación, vencimiento y cantidad.
- Picking pendiente por ubicación y unidades comprometidas en pedidos próximos.
- Recomendaciones de subida a altura, fusión segura y reposición a suelo.
- Fusión permitida únicamente cuando coinciden SKU, lote, fabricación y vencimiento.
- Clasificación ABC por valor de consumo acumulado, únicamente cuando existen demanda y coste verificables.
- Cálculo de demanda media, variabilidad, rotación, cobertura y punto de pedido.
- Detección de roturas, sobrestock, falta de rotación y caducidad próxima.
- Centro de acciones explicado y priorizado.
- Simulador de cambios de demanda y retrasos de proveedor.
- Planificación de uno o dos conteos cíclicos anuales por cliente y conteo de gracia opcional.
- Registro de conteo físico, diferencias, tolerancia, exactitud y acta exportable.
- Importación del avance de conteo por ubicación, incluidas las posiciones vacías: porcentaje, ubicaciones pendientes y prioridades APQ/picking/suelo.
- Meta diaria calculada con los días operativos del Excel para terminar exactamente un mes antes de la fecha final del cliente.
- Informe Excel integral de siete hojas, exportaciones CSV especializadas y plantilla compatible.
- Diseño responsive, navegación por teclado y reducción de movimiento.

## Flujo principal

1. Pulsar **Analizar inventario** y seleccionar un XLSX, CSV, TSV, JSON, PDF, DOCX o TXT de la empresa.
2. Revisar la hoja, fila de encabezados y correspondencia de columnas detectadas.
3. Confirmar la traducción; solo SKU y cantidad son obligatorios.
4. Consultar las ubicaciones originales o, si existe un maestro completo, el mapa de huecos vacíos y ocupados.
5. Consultar indicadores, clasificación ABC y acciones recomendadas.
6. Utilizar **Complementar datos** para unir por SKU información comercial o por ubicación el avance de conteo, sin duplicar el inventario.
7. Consultar el porcentaje contado, las ubicaciones pendientes y cuántas deben contarse al día para acabar un mes antes del compromiso final.
8. Probar escenarios o ejecutar uno, dos o un conteo de gracia.
9. Descargar el informe Excel integral, el mapa, el análisis o el acta.

## Campos de documentos empresariales

Imprescindibles —el nombre original de la columna puede variar—:

- `sku`
- `cantidad_ubicacion` o `stock_actual`

Opcionales:

- `producto`
- `categoria`
- `coste_unitario`
- `demanda_mensual`, `consumo_mensual` o `ventas_mes_1`–`ventas_mes_3`
- `lead_time_dias`
- `stock_seguridad`
- `fecha_caducidad`
- `pasillo`, `modulo`, `altura` o `ubicacion`
- `lote`, `fecha_fabricacion`, `fecha_vencimiento`
- `apq`
- `picking_pendiente`
- `capacidad_ubicacion`
- `total_pasillos`, `modulos_por_pasillo`, `alturas_almacen`
- `campana_conteo`, `estado_conteo`, `conteo_fisico`, `fecha_conteo`
- `fecha_limite_conteo`, `dias_conteo_semana`

Se aceptan hojas XLSX, delimitadores por tabulación, punto y coma, barra vertical o coma, objetos JSON anidados, tablas DOCX, reportes de texto y tablas de PDF digital. También se reconocen alias habituales en español, inglés, francés y otros formatos frecuentes de ERP/WMS. Si la detección no es inequívoca, el usuario puede corregir la correspondencia antes de importar; el perfil se recuerda en ese dispositivo.

Los PDF escaneados sin texto seleccionable, archivos protegidos o corruptos y formatos heredados como `.xls`/`.doc` requieren OCR o conversión previa a un formato moderno. La aplicación lo comunica explícitamente; no simula una lectura que no pueda verificar.

Las ubicaciones pueden llegar en una sola columna o divididas en varios segmentos. StockFlow IA conserva el código original completo. Si el archivo no contiene un maestro de huecos, muestra únicamente las ubicaciones confirmadas y pausa las propuestas que necesitarían inventar un destino. Para generar todos los huecos vacíos, el archivo debe aportar pasillo, módulo y altura o incluir filas explícitas para esas ubicaciones.

## Motor de decisión

- **ABC:** ordena las referencias por demanda media × coste unitario y las distribuye por consumo acumulado: A hasta el 80 %, B hasta el 95 % y C el resto.
- **Cobertura:** stock actual ÷ demanda diaria media.
- **Punto de pedido:** demanda durante el plazo de entrega + stock de seguridad.
- **Pedido sugerido:** cantidad necesaria para alcanzar una cobertura objetivo adaptada al plazo.
- **Prioridad:** combina estado, cobertura e importancia ABC.
- **Objetivo de picking:** disponibilidad en suelo después de pedidos pendientes = un mes de demanda media.
- **Excedente:** unidades de suelo por encima del objetivo; se proponen para reserva en altura.
- **Fusión segura:** solo con coincidencia exacta de SKU, lote, fabricación y vencimiento.
- **Reposición:** traslada desde reserva a una ubicación de suelo compatible, priorizando el vencimiento más próximo.
- **Conteo anticipado:** objetivo = un mes calendario antes de la fecha final; meta diaria = ubicaciones pendientes ÷ días operativos restantes, redondeada hacia arriba.

Las recomendaciones son deterministas y explicables. La aplicación no presenta predicciones opacas como certezas.

## Arquitectura

- React 19 + TypeScript.
- Next.js/Vinext sobre Vite.
- Motor analítico puro en `lib/inventory.ts`.
- Motor de ubicaciones y movimientos en `lib/warehouse.ts`.
- Motor de campañas y progreso por ubicación en `lib/cycle-counts.ts`.
- Detector y traductor de formatos empresariales en `lib/universal-import.ts`.
- Extractor multiformato en `lib/document-import.ts` y auditoría de calidad en `lib/readiness.ts`.
- Procesamiento local de todos los documentos en el navegador.
- Sin base de datos, cuentas ni datos personales.
- Despliegue como aplicación web.

## Desarrollo local

Requiere Node.js 22.13 o superior.

```bash
npm install
npm run dev
```

## Verificación

```bash
npm run lint
npm run test:logic
npm run build
```

Las 35 pruebas lógicas y la prueba del HTML renderizado verifican, entre otros casos, ABC, simulación, documentos multiformato, enriquecimiento seguro, ubicaciones vacías, APQ, fusión exacta, reposición a suelo y conteos por ubicación. Incluyen la resta de un mes calendario, días operativos de 5/6/7 días, meta diaria, prioridad APQ y enriquecimiento de conteos sin SKU. También se ejecutan TypeScript, ESLint y compilación de producción.

## Privacidad

Los archivos se procesan localmente en el dispositivo. StockFlow IA no almacena ni transmite el contenido del inventario.

## Hackathon Vibe Coding — Big School, Edición 6

El proyecto fue iniciado el 14 de julio de 2026 y generado mediante instrucciones en lenguaje natural con Codex, dentro de la ventana oficial del hackathon.
