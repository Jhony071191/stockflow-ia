# Guion del video de demostración — máximo 5 minutos

## 0:00–0:20 — Problema

“Muchas empresas gestionan el inventario con hojas de cálculo. Conocen el stock total, pero no siempre dónde está cada lote, qué huecos quedan libres o qué movimiento deben realizar primero.”

Mostrar brevemente un Excel ficticio.

## 0:20–0:40 — Solución

“StockFlow IA convierte esa hoja en un mapa completo del almacén y en un plan de acción comprensible. Fue creada mediante Vibe Coding con Codex durante la ventana oficial del hackathon.”

Mostrar el dashboard inicial.

## 0:40–1:25 — Traductor universal de Excel

1. Pulsar **Analizar inventario**.
2. Mostrar un Excel ficticio cuyo título esté antes de los encabezados y cuya ubicación esté dividida en varias columnas.
3. Subir el archivo y señalar la hoja y fila de encabezados detectadas.
4. Mostrar la correspondencia automática de “Item”, “Quantity”, lote, vencimiento, zona y ubicación compuesta.
5. Explicar que la correspondencia puede corregirse y se recuerda para ese formato.
6. Confirmar la traducción.

Frase clave: “StockFlow traduce el formato de cada empresa. Solo exige SKU y cantidad, y nunca convierte un dato ausente en un cero inventado.”

## 1:25–1:50 — Dashboard

Explicar brevemente:

- Valor total del inventario.
- SKU en riesgo de rotura.
- Sobrestock y capital inmovilizado.
- Cobertura media.
- Acciones y clasificación ABC ordenadas por impacto.

Si el archivo de demostración omite costes o demanda, señalar los indicadores “Pendiente” y explicar que los cálculos dependientes quedan pausados.

## 1:50–3:15 — Mapa del almacén

1. Abrir **Mapa de almacén**.
2. Señalar ubicaciones totales, ocupadas, vacías, APQ y picking próximo.
3. Mostrar la tabla de ubicaciones originales y cómo conserva exactamente el código del WMS.
4. Filtrar por familia, ocupación y APQ.
5. Buscar un SKU o lote.
6. Abrir una ubicación ocupada y mostrar cantidad, lote, fabricación, vencimiento y picking pendiente.
7. Cambiar a la plantilla completa o explicar que, cuando existe un maestro de huecos, también se muestran las ubicaciones vacías.

Frase clave: “Si el Excel solo confirma ubicaciones ocupadas, StockFlow no inventa huecos. Con el maestro completo, la altura uno es suelo y las superiores son reserva; APQ permanece segregado.”

## 3:15–4:00 — Plan de movimientos explicable

1. Mostrar una acción **Subir a altura**.
2. Explicar que queda un mes de demanda en suelo después del picking pendiente.
3. Mostrar una **Fusión exacta** y leer la regla de lote y fechas.
4. Mostrar un destino vacío cuando la fusión no es posible.
5. Mostrar una **Reposición al suelo** con origen y destino concretos.

Frase clave: “Solo fusionamos si coinciden SKU, lote, fabricación y vencimiento; si no, buscamos un hueco vacío compatible.”

## 4:00–4:25 — Conteos cíclicos

1. Abrir **Conteos cíclicos**.
2. Mostrar uno o dos conteos anuales.
3. Pulsar **Cargar ejemplo**.
4. Enseñar brevemente avance, diferencias, tolerancia y exactitud.

## 4:25–4:40 — Simulador y exportación

1. Abrir **Simulador** y aumentar la demanda.
2. Mostrar el cambio en riesgo.
3. Volver al mapa y señalar que puede exportarse completo, incluidas las ubicaciones vacías.

## 4:40–4:53 — Vibe Coding

Mostrar brevemente:

- Historial de prompts.
- Evolución visual.
- Dieciocho pruebas automatizadas.
- Aplicación desplegada.

## 4:53–5:00 — Cierre

“StockFlow IA convierte los datos de inventario en decisiones físicas claras para reducir pérdidas, aprovechar el espacio y trabajar con menos incertidumbre.”

Pantalla final: nombre del proyecto y URL funcional.
