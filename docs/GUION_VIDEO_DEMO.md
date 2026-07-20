# Guion del video de demostración — máximo 5 minutos

## 0:00–0:20 — Problema

“Muchas empresas gestionan el inventario con hojas de cálculo. Conocen el stock total, pero no siempre dónde está cada lote, qué huecos quedan libres o qué movimiento deben realizar primero.”

Mostrar brevemente un Excel ficticio.

## 0:20–0:40 — Solución

“StockFlow IA convierte esa hoja en un mapa completo del almacén y en un plan de acción comprensible. Fue creada mediante Vibe Coding con Codex durante la ventana oficial del hackathon.”

Mostrar el dashboard inicial.

## 0:40–1:25 — Centro universal de documentos

1. Pulsar **Analizar inventario**.
2. Señalar que admite XLSX, CSV, TSV, JSON, PDF con texto, DOCX y TXT; usar un Excel ficticio cuyo título esté antes de los encabezados y cuya ubicación esté dividida en varias columnas.
3. Subir el archivo y señalar la hoja y fila de encabezados detectadas.
4. Mostrar la correspondencia automática de “Item”, “Quantity”, lote, vencimiento, zona y ubicación compuesta.
5. Explicar que la correspondencia puede corregirse y se recuerda para ese formato.
6. Confirmar la traducción.

Frase clave: “StockFlow traduce el formato de cada empresa. Solo exige SKU y cantidad, y nunca convierte un dato ausente en un cero inventado.”

## 1:25–1:55 — Auditoría y documentos complementarios

1. Mostrar la puntuación de preparación operativa y los estados completo, parcial y pendiente.
2. Pulsar **Complementar datos**.
3. Explicar que otro documento puede añadir demanda, costes, familias o pedidos por SKU, y avance de conteo por ubicación, sin duplicar cantidades.
4. Señalar los tres próximos datos que más funcionalidad desbloquean.

Frase clave: “La IA no oculta lo que falta: mide la cobertura y une fuentes distintas con trazabilidad.”

## 1:55–2:15 — Dashboard

Explicar brevemente:

- Valor total del inventario.
- SKU en riesgo de rotura.
- Sobrestock y capital inmovilizado.
- Cobertura media.
- Acciones y clasificación ABC ordenadas por impacto.

Si el archivo de demostración omite costes o demanda, señalar los indicadores “Pendiente” y explicar que los cálculos dependientes quedan pausados.

## 2:15–3:25 — Mapa del almacén

1. Abrir **Mapa de almacén**.
2. Señalar ubicaciones totales, ocupadas, vacías, APQ y picking próximo.
3. Mostrar la tabla de ubicaciones originales y cómo conserva exactamente el código del WMS.
4. Filtrar por familia, ocupación y APQ.
5. Buscar un SKU o lote.
6. Abrir una ubicación ocupada y mostrar cantidad, lote, fabricación, vencimiento y picking pendiente.
7. Cambiar a la plantilla completa o explicar que, cuando existe un maestro de huecos, también se muestran las ubicaciones vacías.

Frase clave: “Si el Excel solo confirma ubicaciones ocupadas, StockFlow no inventa huecos. Con el maestro completo, la altura uno es suelo y las superiores son reserva; APQ permanece segregado.”

## 3:25–3:52 — Rutas logísticas óptimas

1. Mostrar una acción **Subir a altura**.
2. Explicar que queda un mes de demanda en suelo después del picking pendiente.
3. Leer en pantalla la ruta completa **origen → destino** y la puntuación sobre 100.
4. Mostrar los factores de decisión y abrir las tres ubicaciones alternativas.
5. Mostrar una **Reposición al suelo** desde altura, explicando FEFO.

Frase clave: “StockFlow no solo dice qué mover: indica desde dónde, hacia qué ubicación y por qué ese destino es el más adecuado. Solo fusiona con lote y fechas idénticos.”

## 3:52–4:18 — Cinco soluciones ante caducidad

1. Abrir **Acciones** y bajar al **Centro de rescate de caducidades**.
2. Seleccionar el lote de café próximo a vencer y señalar días, ubicaciones, unidades y valor en riesgo.
3. Mostrar las cinco opciones: FEFO, impulso a tiendas, promoción, donación y proveedor.
4. En donación, enseñar los accesos oficiales a FESBAL, Cáritas y Cruz Roja.
5. Señalar el control de seguridad: trazabilidad, aceptación y vida útil; un lote caducado queda bloqueado.

Frase clave: “La aplicación transforma una alerta de caducidad en cinco planes concretos y seguros, para vender, redistribuir o donar a tiempo antes de desperdiciar.”

## 4:18–4:36 — Conteos cíclicos

1. Abrir **Conteos cíclicos**.
2. Mostrar el avance importado: 300 de 420 ubicaciones, 71,4 % y 120 pendientes.
3. Señalar la fecha final del 30/09/2026, el objetivo anticipado del 30/08/2026 y la meta de 4 ubicaciones al día.
4. Explicar que la lista prioriza APQ, picking y suelo antes que reserva.

## 4:36–4:46 — Exportación integral

1. Descargar el informe Excel integral.
2. Nombrar sus ocho hojas, incluidas **Movimientos**, **Rescate caducidades** y **Avance conteo ubicaciones**.

## 4:46–4:56 — Vibe Coding

Mostrar brevemente:

- Historial de prompts.
- Evolución visual.
- Treinta y ocho pruebas lógicas, HTML renderizado, TypeScript, lint y compilación.
- Aplicación desplegada.

## 4:56–5:00 — Cierre

“StockFlow IA convierte los datos de inventario en rutas y soluciones concretas para reducir roturas, caducidades y desperdicio, y ayudar a que el excedente llegue a quien lo necesita.”

Pantalla final: nombre del proyecto y URL funcional.
