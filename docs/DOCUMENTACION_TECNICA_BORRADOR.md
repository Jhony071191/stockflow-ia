# Documentación Técnica — StockFlow IA

> Borrador maestro para trasladar a un único Google Doc antes de la entrega.

## 1. Descripción del proyecto

StockFlow IA es una aplicación web que transforma documentos empresariales heterogéneos en decisiones operativas explicadas y priorizadas. Está dirigida a pequeños almacenes, comercios, organizaciones sociales y profesionales que trabajan con hojas de cálculo, exportaciones WMS/ERP, JSON, PDF, Word o reportes de texto y necesitan detectar rápidamente roturas de stock, exceso de mercancía, referencias sin rotación y riesgos de caducidad.

Su propuesta de valor se resume en una frase:

**“Traduce el formato de inventario de cada empresa y lo convierte en decisiones comprensibles.”**

La aplicación no pretende reemplazar un ERP. Su objetivo es hacer accesible el análisis de inventario a usuarios que no disponen de herramientas avanzadas ni conocimientos analíticos.

## 2. Problema y oportunidad

Una hoja de cálculo puede indicar cuántas unidades existen, pero no responde de forma inmediata a preguntas como:

- ¿Qué productos se agotarán antes de que llegue el proveedor?
- ¿Qué referencias concentran el mayor valor de consumo?
- ¿Cuánto capital está inmovilizado en mercancía con exceso de cobertura?
- ¿Qué debe resolver primero la persona responsable de stock?
- ¿Qué ocurriría si aumentara la demanda o se retrasara un proveedor?

StockFlow IA responde estas preguntas mediante reglas transparentes y métricas reconocibles.

## 3. Plataforma utilizada

- **Plataforma de desarrollo mediante Vibe Coding:** Codex.
- **Método:** instrucciones en lenguaje natural, iteraciones conversacionales, pruebas y correcciones solicitadas al agente.
- **Alojamiento:** servicio de despliegue web permitido por las bases.
- **Tecnologías generadas:** React, TypeScript, Next.js/Vinext, CSS y pruebas con Node Test Runner.

No se escribió manualmente la lógica principal. El código, la interfaz y las pruebas fueron generados y refinados mediante instrucciones dadas a Codex.

### 3.1 Auditoría interna simulando al jurado

Esta evaluación es una autoauditoría y no representa una nota oficial de Big School.

| Criterio | Fortaleza actual | Debilidad detectada y corrección |
|---|---|---|
| Complejidad y funcionalidad | Importación, análisis, mapa, movimientos, simulador, conteos y exportaciones integrados | Se completó la lectura multiformato, el enriquecimiento entre documentos, el conteo de gracia, el avance por ubicación y el informe de siete hojas |
| Innovación y originalidad | Traducción empresarial y recomendaciones físicas explicables | Se hizo visible la inteligencia mediante auditoría 0–100, cobertura por capacidad y prioridades de datos |
| Calidad del Vibe Coding | Evolución trazable mediante prompts, pruebas e iteraciones | Se amplió el historial y se documentó la revisión completa solicitada por el participante |
| Experiencia de usuario | Identidad premium consistente, navegación clara y responsive | Se creó un único centro de documentos con dos modos, formatos visibles, avisos de OCR y mapeo agrupado |
| Utilidad y aplicabilidad | Resuelve decisiones reales de stock, ubicaciones, APQ, lotes y picking | Se evitó ABC ficticio, valor total engañoso y destinos familiares incompatibles; se permite unir fuentes departamentales |

La principal fortaleza competitiva es que StockFlow IA no se limita a visualizar un Excel: traduce datos heterogéneos, declara qué sabe y qué no sabe, y convierte la información verificable en decisiones físicas explicadas. La limitación honesta es que un PDF escaneado necesita OCR y que ningún destino vacío puede deducirse si el WMS no aporta un maestro completo.

## 4. Funcionalidades principales

### 4.1 Centro universal de documentos

- Carga mediante selector o arrastrar y soltar.
- Acepta Excel `.xlsx`, CSV, TSV, JSON, PDF con texto, Word `.docx` y TXT.
- Extrae hojas, tablas, objetos JSON anidados, registros clave-valor y reportes tabulados.
- Examina todas las hojas y elige la tabla de inventario con mayor confianza.
- Localiza la fila real de encabezados aunque existan títulos o metadatos anteriores.
- Reconoce alias habituales de ERP/WMS en español, inglés, francés y otros formatos frecuentes.
- Combina encabezados y muestras de valores para diferenciar, por ejemplo, una zona de una ubicación completa.
- Reconstruye direcciones logísticas divididas en varias columnas y conserva el código original.
- Presenta un asistente de correspondencia editable antes de incorporar los datos.
- Recuerda localmente la correspondencia de cada estructura de encabezados.
- En modo **Nuevo análisis** solo exige SKU y cantidad; cualquier otro campo ausente se declara como no disponible.
- En modo **Complementar datos** admite SKU con un campo adicional o una ubicación con campos de conteo; une la información sin duplicar el inventario.
- Los campos de ubicación, cantidad, lote y picking solo se actualizan cuando la ubicación puede identificarse de manera inequívoca.
- Permite incorporar demanda, costes, familias, lotes, fechas, picking y capacidad desde documentos independientes.
- Nunca interpreta un indicador de picking 0/1 como unidades comprometidas.
- Limita el tamaño del archivo a 20 MB.
- Incluye una plantilla Excel de dos hojas con datos ficticios e instrucciones.
- Admite una fila por ubicación y agrega automáticamente el stock por SKU.
- Activa un modo de origen seguro cuando no existe un maestro completo de huecos: muestra únicamente direcciones confirmadas y pausa los destinos no justificables.
- Detecta PDF escaneados sin texto y solicita OCR o una exportación digital en lugar de inventar una tabla.

### 4.2 Auditoría de preparación operativa

- Puntúa de 0 a 100 la preparación real de los datos.
- Mide SKU/cantidades, ubicaciones, demanda, costes, familias, lotes, vencimientos y picking.
- Distingue capacidad completa, parcial y pendiente mediante porcentajes de cobertura.
- Prioriza los tres datos faltantes que más funcionalidad desbloquearían.
- Muestra cuántas fuentes se han integrado y cuántos módulos pueden operar.

### 4.3 Motor analítico

- Clasificación ABC.
- Demanda media de los últimos tres periodos.
- Variabilidad de demanda.
- Cobertura en días.
- Rotación mensual.
- Punto de pedido.
- Pedido sugerido.
- Valor de existencias.
- Detección de caducidad próxima.
- Suspensión explícita de cobertura, sobrestock, reposición, valor y ABC cuando faltan las variables que necesita cada cálculo.
- La clase ABC nunca se sustituye por una clase C ficticia cuando faltan demanda o coste.

### 4.4 Centro de acciones

- Priorización por nivel crítico, atención o estable.
- Explicación de la situación detectada.
- Recomendación concreta por referencia.
- Panel lateral con variables y fórmulas utilizadas.
- Filtros por estado y clasificación ABC.
- Panel destacado de rutas logísticas con origen, destino, puntuación y alternativas.
- Centro de rescate de caducidades con cinco escenarios comparables por lote.

### 4.5 Simulador de escenarios

- Variación de demanda entre −20 % y +50 %.
- Retraso adicional del proveedor entre 0 y 30 días.
- Comparación entre situación actual y escenario proyectado.
- Recalcula SKU en riesgo, unidades recomendadas e inversión estimada.
- No modifica los datos originales.

### 4.6 Exportación

- Descarga CSV del análisis completo.
- Incluye ABC, cobertura, punto de pedido, pedido sugerido, estado y recomendación.
- Informe Excel integral con ocho hojas: resumen ejecutivo, inventario, ubicaciones, movimientos optimizados, rescate de caducidades, calidad de datos, plan de conteos y avance de conteo por ubicación.
- Los totales económicos parciales se identifican como valor conocido y no como valor completo.

### 4.7 Conteos cíclicos por cliente

- Configuración del cliente, año y tolerancia permitida.
- Modalidad contractual de uno o dos conteos durante el año.
- Conteo de gracia opcional con fecha independiente, sin alterar el servicio contratado.
- Fechas independientes para cada campaña.
- Orden recomendado de ejecución A, B y C.
- Registro de stock físico por referencia.
- Diferencia absoluta y porcentual frente al sistema.
- Identificación de referencias fuera de tolerancia.
- Indicadores de progreso, exactitud, coincidencias y ajuste valorado.
- Cierre de campaña únicamente cuando todas las referencias han sido contadas.
- Exportación de un acta CSV independiente por campaña.
- Importación de campaña, estado, conteo físico y fecha de conteo por ubicación, incluso cuando el documento complementario no incluye SKU.
- Porcentaje calculado sobre ubicaciones elegibles, con ubicaciones excluidas separadas del denominador.
- Lista de ubicaciones pendientes con búsqueda, filtro de zona y prioridad APQ, picking, suelo y reserva.
- Fecha objetivo situada un mes calendario antes de la fecha final del cliente.
- Meta diaria redondeada hacia arriba según ubicaciones pendientes y días operativos restantes configurables a 5, 6 o 7 días por semana.
- Exportación CSV de ubicaciones pendientes y hoja específica en el informe integral.

### 4.8 Mapa y slotting del almacén

- Generación de ubicaciones vacías y ocupadas cuando el archivo aporta un maestro estructurado del almacén.
- Estructura por pasillo, módulo y entre 5 y 7 alturas; la altura 1 representa suelo/picking cuando esas coordenadas existen en el archivo.
- Conservación de la ubicación original y modo de origen seguro cuando no se informa un maestro completo.
- Distribución visual por grupos familiares.
- Segregación de pasillos y ubicaciones APQ para mercancía peligrosa.
- Detalle de ubicación con cantidad, SKU, lote, fabricación, vencimiento y picking pendiente.
- Cálculo de unidades comprometidas en pedidos próximos.
- Plan de movimientos con origen, destino, cantidad y motivo explicable.
- Puntuación del destino entre 1 y 99 según fusión exacta, familia, segregación APQ, recorrido, capacidad y posibilidad de completar el movimiento.
- Hasta tres ubicaciones alternativas ordenadas, con capacidad libre y motivo de compatibilidad.
- Subida del excedente a altura conservando un mes de demanda disponible en suelo tras el picking.
- Fusión únicamente cuando coinciden exactamente SKU, lote, fecha de fabricación y fecha de vencimiento.
- Selección de un hueco vacío compatible cuando la fusión no es posible y el archivo confirma ese hueco.
- Bloqueo explícito cuando el único hueco disponible pertenece a una familia incompatible.
- Reposición desde reserva hacia una ubicación de suelo compatible, aplicando prioridad de vencimiento, solo cuando existen los datos necesarios.
- Exportación del mapa completo si hay maestro o de las ubicaciones de origen confirmadas en los demás casos.

### 4.9 Prevención de caducidades

- Agrupación del riesgo por SKU, lote, fabricación y vencimiento, conservando todas las ubicaciones de origen.
- Cálculo de días restantes, stock del lote, picking comprometido, salida prevista, unidades y valor económico potencialmente expuestos.
- Cinco vías de actuación: FEFO y reposición a suelo, impulso a tiendas, promoción transparente, donación social y devolución o transferencia con proveedor.
- Escenario recomendado sin ocultar las demás alternativas y con plazo, cantidad, impacto y requisitos para cada una.
- Enlaces a los canales oficiales de FESBAL, Cáritas Española y Cruz Roja Española para consultar aceptación; StockFlow no transmite datos ni confirma una donación.
- Bloqueo de la donación para APQ o cuando no queda margen suficiente y bloqueo de todas las vías comerciales cuando el lote ya está caducado.
- Nota visible de trazabilidad, integridad, etiquetado, cadena de frío, aceptación del receptor y vida útil suficiente.

## 5. Arquitectura

La solución utiliza una arquitectura sin servidor para el tratamiento de los datos:

1. **Capa de interfaz:** componentes React y estilos responsive.
2. **Entrada multiformato:** XLSX, CSV, TSV, JSON, PDF con texto, DOCX o TXT seleccionado por el usuario.
3. **Extractor documental:** convierte hojas, tablas y registros estructurados en matrices tabulares comunes.
4. **Detector:** selección de hoja/página/tabla, fila de encabezados, columnas y muestras.
5. **Traductor empresarial:** aliases, inferencia por valores, ubicación compuesta, perfil editable y matriz de capacidades.
6. **Integrador:** crea un inventario nuevo o complementa por SKU información comercial y por ubicación el avance de conteo, con protección para campos dependientes de ubicación.
7. **Validación:** normalización de números, fechas, coordenadas y filas sin completar datos ausentes.
8. **Auditoría de datos:** calcula cobertura por capacidad y preparación operativa ponderada.
9. **Motor analítico:** funciones TypeScript puras y deterministas.
10. **Motor de almacén:** preservación de ubicaciones de origen o generación estructurada, segregación APQ y reglas de movimiento.
11. **Motor de caducidades:** agrupación por lote, estimación de riesgo, cinco vías de rescate y controles de seguridad.
12. **Módulo de conteos:** planificación contractual, captura física por SKU, progreso importado por ubicación, priorización y cálculo del ritmo diario.
13. **Presentación:** dashboard, mapa o tabla de origen, rutas óptimas, centro de rescate, filtros, explicación y simulador.
14. **Salida:** informe Excel de ocho hojas, análisis, mapa, ubicaciones pendientes y actas CSV generados en el navegador.

El inventario se mantiene únicamente en memoria durante la sesión. No se utiliza base de datos ni se transmite el archivo a un servicio externo. Las bibliotecas de Excel, PDF y Word se cargan en el navegador únicamente cuando son necesarias.

## 6. Modelo de datos

Cada referencia contiene:

| Campo | Descripción |
|---|---|
| SKU | Identificador único del producto |
| Producto | Nombre legible |
| Categoría | Familia del producto |
| Stock actual | Existencias disponibles |
| Coste unitario | Coste de adquisición |
| Plazo de entrega | Días previstos del proveedor |
| Stock de seguridad | Unidades de protección |
| Ventas meses 1–3 | Historial reciente de demanda |
| Caducidad | Campo opcional |
| Pasillo, módulo y altura | Coordenadas físicas de la ubicación |
| Lote | Identificador del lote almacenado |
| Fabricación y vencimiento | Fechas usadas en trazabilidad y fusión |
| APQ | Indicador de mercancía peligrosa |
| Picking pendiente | Unidades comprometidas en pedidos próximos |
| Capacidad de ubicación | Límite utilizado para proponer destinos |
| Campaña y estado de conteo | Identifican el ciclo y si una ubicación está contada, pendiente o excluida |
| Conteo físico y fecha | Evidencia registrada para una ubicación contada |
| Fecha final y días operativos | Parámetros para la fecha objetivo anticipada y la meta diaria |

La matriz de capacidades acompaña a cada importación e indica si están realmente disponibles producto, familia, coste, demanda, ubicación, maestro completo, APQ, fabricación, vencimiento y picking pendiente. La interfaz utiliza esa matriz para decidir qué métricas y recomendaciones puede calcular con rigor.

## 7. Reglas de cálculo

### Clasificación ABC

1. Valor de consumo mensual = demanda media × coste unitario.
2. Las referencias se ordenan de mayor a menor valor.
3. Clase A: primeras referencias hasta aproximadamente el 80 % acumulado.
4. Clase B: tramo siguiente hasta el 95 %.
5. Clase C: valor restante.

### Cobertura

`Cobertura = stock actual ÷ demanda diaria media`

### Punto de pedido

`Punto de pedido = demanda durante el plazo de entrega + stock de seguridad`

### Priorización

La puntuación combina:

- Riesgo de rotura o caducidad.
- Exceso de cobertura o ausencia de movimiento.
- Diferencia frente a la cobertura objetivo.
- Importancia ABC.

### Reglas de ubicación y movimiento

`Disponible tras picking = stock en suelo − picking pendiente`

`Objetivo de suelo = demanda mensual media`

- Si una referencia con sobrestock queda por encima del objetivo, el excedente se propone para altura.
- Si queda por debajo del objetivo y existe mercancía en reserva, se propone reposición hacia suelo.
- Una ubicación ocupada solo puede recibir una fusión cuando coinciden SKU, lote, fabricación y vencimiento y existe capacidad libre.
- Si no existe coincidencia exacta, se busca una ubicación vacía de altura compatible con la familia y la zona.
- La mercancía APQ solo puede recibir destinos APQ; no se mezcla con ubicaciones generales.
- Para reposiciones se priorizan las existencias con vencimiento más próximo.

### Avance anticipado de conteos

`Fecha objetivo = fecha final del cliente − 1 mes calendario`

`Meta diaria = techo(ubicaciones pendientes ÷ días operativos restantes)`

- El porcentaje usa únicamente ubicaciones elegibles; las excluidas se informan aparte.
- Los días operativos se calculan de forma inclusiva con semanas de 5, 6 o 7 días.
- Si falta la fecha final, la app muestra el dato pendiente y no inventa una meta diaria.
- Si la fecha objetivo ya venció, el panel lo advierte y presenta la carga pendiente como urgente.

## 8. Casos de uso

### Responsable de un pequeño almacén

Sube su hoja semanal y obtiene una lista de compras priorizada.

### Comercio minorista

Identifica productos con exceso de cobertura y reduce el siguiente pedido.

### Organización o banco de alimentos

Detecta referencias próximas a caducar y prioriza su salida.

### Jefatura logística

Simula un retraso de proveedor y cuantifica el impacto antes de decidir.

### Responsable de ubicaciones

Importa una extracción del WMS, visualiza todos los huecos vacíos y ocupados y recibe destinos exactos para sobrestock o reposición.

### Operación con mercancía peligrosa

Identifica las ubicaciones APQ y evita que una recomendación mezcle mercancía peligrosa con la zona general.

### Empresa de servicios de inventario

Configura un contrato de uno o dos conteos anuales, importa el avance real por ubicación, conoce la carga diaria necesaria y entrega al cliente un acta de diferencias.

## 9. Proceso iterativo con IA

1. Lectura de las bases y comparación de tres conceptos de proyecto.
2. Selección de StockFlow IA por utilidad, conocimiento del dominio y viabilidad.
3. Inicio del proyecto el 14 de julio, dentro de la ventana oficial.
4. Generación de tres direcciones visuales mediante instrucciones.
5. Selección de la dirección “Control operativo premium”.
6. Construcción del primer dashboard y navegación.
7. Primera validación y despliegue funcional.
8. Generación del motor de análisis, importador, simulador y exportación.
9. Incorporación de pruebas automatizadas y validaciones.
10. Segunda compilación y despliegue completo.
11. Incorporación del módulo de conteos cíclicos solicitado por experiencia de negocio.
12. Ampliación de pruebas y actualización de entregables.
13. Incorporación del mapa integral de almacén solicitado tras una revisión operativa de la aplicación.
14. Ampliación del importador a Excel y del modelo a pasillo, módulo, altura, familia, lote, fechas, APQ y picking.
15. Creación del motor de slotting con reglas de un mes en suelo, subida de excedente, fusión exacta y reposición.
16. Sustitución preventiva de una dependencia Excel con vulnerabilidades conocidas por bibliotecas sin vulnerabilidades propias detectadas.
17. Añadido de pruebas de Excel real, ubicaciones vacías, APQ, fusión segura y reposición.
18. Diagnóstico de una extracción WMS real con título previo, encabezados en una fila desplazada, nombres en inglés y ubicación repartida en varios segmentos.
19. Sustitución del importador rígido por un traductor universal asistido con detección de hoja, encabezados, aliases, muestras y mapeo editable.
20. Incorporación de perfiles locales por estructura de archivo y modo seguro para datos parciales.
21. Adaptación de dashboard, inventario, simulador, mapa y exportación para mostrar “No disponible” o “Pendiente” en lugar de inventar ceros.
22. Seis nuevas pruebas para encabezados desplazados, corrección manual de hoja/fila, ubicación compuesta, múltiples hojas, formato mínimo, datos parciales y maestro completo.
23. Revisión integral actuando como jurado especializado en IA, con evaluación de complejidad, innovación, calidad del Vibe Coding, experiencia de usuario y aplicabilidad.
24. Ampliación del traductor a TSV, JSON, PDF con texto, Word y reportes TXT.
25. Creación del modo “Complementar datos” para unir demanda, costes, familias, lotes, fechas y pedidos desde fuentes separadas sin duplicar cantidades.
26. Incorporación de una auditoría operativa de 0 a 100 con cobertura completa, parcial o pendiente.
27. Corrección preventiva de ABC ficticio, totales económicos parciales y destinos de familias incompatibles.
28. Incorporación del conteo de gracia y del informe Excel integral de seis hojas.
29. Nuevas pruebas de inteligencia documental, enriquecimiento, valores inválidos, cobertura parcial, compatibilidad familiar y CSV entrecomillado.
30. Creación del dataset retail de demostración con 14 familias, 420 ubicaciones y escenarios logísticos verificables.
31. Ampliación del traductor universal con campaña, estado, conteo físico, fecha, compromiso final y días operativos por ubicación.
32. Creación del panel de avance importado con porcentaje, pendientes, prioridad operativa, objetivo un mes antes y meta diaria.
33. Incorporación de conteos sin SKU mediante unión inequívoca por ubicación.
34. Ampliación del informe integral a siete hojas y de la plantilla Excel a los campos de conteo.
35. Validación del Excel del video mediante el mismo lector de archivos y el mismo motor de traducción utilizados por la aplicación.
36. Revisión operativa de los movimientos al detectar que la tabla no hacía suficientemente visible por qué un destino era el mejor.
37. Sustitución de la selección simple por un ranking explicable de destinos con puntuación, capacidad, recorrido y alternativas.
38. Creación del centro de rescate de caducidades con cinco escenarios y enlaces oficiales de consulta a entidades sociales.
39. Incorporación de controles de seguridad para APQ, vida útil insuficiente y lotes ya caducados.
40. Ampliación del informe integral a ocho hojas, actualización del guion y validación con 38 pruebas lógicas.

## 10. Challenges y soluciones

### Equilibrar innovación y alcance

**Challenge:** construir una solución útil en siete días sin intentar replicar un ERP.

**Solución:** concentrar el producto en una promesa clara: traducir una tabla de inventario y convertirla en decisiones explicadas.

### Importar archivos heterogéneos

**Challenge:** cada ERP o WMS puede exportar hojas, filas de encabezados, idiomas, nombres y ubicaciones diferentes.

**Solución:** detector puntuado de hoja y encabezado, diccionario multilingüe, similitud tolerante, análisis de muestras, constructor de ubicación compuesta y confirmación editable. La correspondencia se recuerda por la firma de encabezados, sin transmitir el archivo.

### Evitar conclusiones falsas con datos parciales

**Challenge:** una extracción física puede contener SKU, lotes y cantidades, pero no coste, demanda, APQ o pedidos pendientes.

**Solución:** solo SKU y cantidad son obligatorios. Una matriz de capacidades pausa cada cálculo que dependa de campos ausentes, muestra el motivo y permite seguir consultando el stock físico.

### Unir información repartida entre departamentos

**Challenge:** el inventario físico, la demanda, los costes y los pedidos próximos suelen exportarse desde sistemas o documentos diferentes.

**Solución:** modo de enriquecimiento por SKU. Los datos comerciales pueden aplicarse a todas las posiciones del SKU, mientras cantidad, lote y picking exigen una ubicación inequívoca. Los SKU no encontrados y las filas ambiguas se informan y se omiten.

### Convertir el avance contractual en una carga diaria realista

**Challenge:** el número de SKU no representa el trabajo físico cuando un almacén contiene cientos de ubicaciones, incluidas posiciones vacías que también deben verificarse.

**Solución:** el conteo operativo se calcula por ubicación. StockFlow importa estados contados, pendientes o excluidos, resta un mes calendario a la fecha final, cuenta únicamente los días operativos configurados y redondea hacia arriba las ubicaciones necesarias por día. APQ, picking y suelo encabezan la lista de pendientes.

### Comunicar calidad sin una falsa sensación de completitud

**Challenge:** disponer del coste o la demanda de una sola referencia no significa que el análisis completo esté preparado.

**Solución:** puntuación ponderada de 0 a 100 y porcentaje de cobertura por capacidad. La interfaz distingue completo, parcial y pendiente y propone el siguiente dato más valioso.

### Extraer tablas desde documentos no tabulares

**Challenge:** PDF, Word, JSON y reportes de texto no tienen una estructura uniforme.

**Solución:** extractores especializados que convierten tablas, objetos anidados, registros clave-valor y texto alineado a un modelo tabular común. Los PDF se reconstruyen por posición visual y siempre exigen confirmación del mapeo.

### Distinguir ubicaciones confirmadas de un maestro completo

**Challenge:** una lista de stock ocupado no demuestra cuántos huecos vacíos existen ni permite proponer destinos reales.

**Solución:** modo de origen para conservar únicamente las ubicaciones incluidas en la extracción y modo estructurado cuando el archivo aporta pasillo, módulo y altura. Los huecos vacíos y movimientos solo se ofrecen cuando hay evidencia suficiente.

### Generar recomendaciones confiables

**Challenge:** evitar que una recomendación parezca una predicción infalible.

**Solución:** usar reglas deterministas, mostrar las métricas y explicar las fórmulas en cada producto.

### Convertir “hay que moverlo” en una ruta ejecutable

**Challenge:** indicar que existe sobrestock o una rotura no basta si el operario no sabe desde qué ubicación recoger ni en cuál depositar.

**Solución:** evaluar únicamente destinos verificables y compatibles, puntuarlos por lote, familia, APQ, distancia y capacidad y mostrar de forma prominente origen → destino, puntuación y alternativas. Una ubicación vacía reservada para un lote no puede adjudicarse después a otro lote incompatible.

### Reducir caducidad sin crear un riesgo de seguridad

**Challenge:** una recomendación de donación o promoción puede ser peligrosa si el producto está caducado, es APQ, no conserva trazabilidad o no dispone de vida útil suficiente.

**Solución:** separar prevención de retirada. Para lotes aún vigentes se comparan cinco escenarios con requisitos y cantidades; la donación exige aceptación previa del receptor y controles logísticos. Para lotes caducados se bloquean venta, redistribución y donación y se indica retirada segura.

### Privacidad de los inventarios

**Challenge:** demostrar el sistema sin almacenar datos reales.

**Solución:** datos ficticios incorporados y procesamiento local del archivo.

### Experiencia en móvil

**Challenge:** representar tablas logísticas extensas en pantallas pequeñas.

**Solución:** navegación adaptable, tablas con desplazamiento controlado y paneles reordenables.

### Representar un almacén completo sin perder legibilidad

**Challenge:** mostrar cientos de ubicaciones, incluidas las vacías, con datos de lote y picking.

**Solución:** agrupar por pasillo, representar alturas de arriba hacia abajo, mantener desplazamiento por estantería y añadir filtros por pasillo, familia, ocupación, APQ, SKU y lote.

### Evitar fusiones logísticas inseguras

**Challenge:** una coincidencia de SKU no garantiza que dos existencias puedan mezclarse.

**Solución:** exigir coincidencia simultánea de SKU, lote, fecha de fabricación y vencimiento; cuando falta un dato o no coincide, seleccionar un hueco vacío.

### Importar Excel sin añadir una dependencia vulnerable

**Challenge:** la primera biblioteca evaluada presentaba vulnerabilidades conocidas sin corrección.

**Solución:** sustituirla antes de publicar por lectores y escritores de Excel con procesamiento local y sin vulnerabilidades propias detectadas en la auditoría.

## 11. Pruebas realizadas

- Compilación de producción y validación del artefacto desplegable.
- Revisión estática con ESLint.
- Prueba de clasificación ABC.
- Prueba de efecto del simulador.
- Importación correcta de la plantilla.
- Detección de columnas obligatorias ausentes.
- Generación correcta de planes de uno y dos conteos.
- Programación del segundo conteo seis meses después.
- Cálculo de progreso, coincidencias y diferencias fuera de tolerancia.
- Generación de 288 ubicaciones de demostración con huecos vacíos, ocupados y APQ.
- Importación de múltiples ubicaciones y agregación correcta por SKU.
- Generación e importación de un archivo `.xlsx` de prueba.
- Fusión permitida con lote y fechas idénticos.
- Bloqueo de fusión cuando cambia la fecha de fabricación.
- Reposición desde altura hacia una ubicación de suelo.
- Detección de encabezados desplazados después de títulos y metadatos.
- Reconstrucción de una ubicación repartida en seis columnas.
- Selección automática de la hoja de inventario entre varias hojas.
- Corrección manual de la hoja y fila de encabezados cuando la detección inicial no coincide.
- Importación segura con solo SKU y cantidad.
- Conservación del estado “no disponible” cuando una columna existe pero una referencia no contiene demanda o coste.
- Generación estructurada de huecos cuando existen pasillo, módulo y altura.
- Navegación accesible mediante botones y teclado.
- Compatibilidad responsive definida para escritorio, tableta y móvil.
- Conversión de JSON empresarial anidado a una tabla traducible.
- Interpretación de registros clave-valor procedentes de Word o texto.
- Reconstrucción de filas y columnas mediante posiciones de texto PDF.
- Enriquecimiento de demanda y coste sin duplicar cantidades.
- Rechazo de valores numéricos inválidos sin activar capacidades falsas.
- Medición de cobertura parcial cuando solo una parte de los SKU tiene coste.
- Ausencia de una clase ABC ficticia cuando faltan coste o demanda.
- Conteo de gracia opcional independiente de uno o dos conteos contratados.
- Bloqueo de un destino vacío perteneciente a una familia incompatible.
- Conservación de campos CSV entrecomillados que contienen comas.
- Resta exacta de un mes calendario, incluido el último día de febrero.
- Cómputo de días operativos para semanas de 5, 6 y 7 días.
- Porcentaje, pendientes, fecha objetivo y ritmo diario por ubicación.
- Prioridad APQ dentro de las ubicaciones pendientes.
- Ausencia de una meta ficticia cuando el Excel no incluye fecha final.
- Importación del avance dentro del inventario principal.
- Enriquecimiento de conteos únicamente por ubicación, sin exigir SKU.
- Lectura integral del Excel de demostración: 420 ubicaciones, 300 contadas, 120 pendientes, 71,4 % y 4 ubicaciones al día.
- Selección de un destino óptimo del mismo pasillo con puntuación, factores explicativos y ubicaciones alternativas.
- Conservación de la asignación de un hueco vacío para impedir mezclas entre lotes incompatibles.
- Generación de exactamente cinco vías para un lote próximo a caducar, incluidas entidades sociales oficiales.
- Bloqueo de todas las vías comerciales y de donación para un lote ya caducado.

Resultado actual: 38 pruebas lógicas superadas, prueba del HTML renderizado superada, TypeScript sin errores, ESLint sin errores y compilación desplegable correcta.

## 12. Privacidad, seguridad y ética

- No se solicitan datos personales.
- No se incluyen credenciales reales.
- Los datos de demostración son ficticios.
- Todos los documentos compatibles se procesan localmente.
- Las recomendaciones son apoyo a la decisión y muestran sus fundamentos.
- El usuario conserva la responsabilidad sobre compras y ajustes reales.

## 13. Limitaciones actuales

- No existe persistencia entre sesiones.
- No se conecta a un ERP ni a proveedores.
- El análisis utiliza tres periodos recientes y no sustituye una previsión estadística avanzada.
- Los costes y plazos dependen de la calidad del archivo proporcionado.
- La compatibilidad automática cubre `.xlsx`, CSV, TSV, JSON, PDF con texto, `.docx` y TXT. Archivos protegidos, corruptos, macros, fórmulas no calculadas, formatos heredados `.xls`/`.doc` o estructuras no tabulares pueden requerir conversión previa o corrección manual del mapeo.
- Los PDF escaneados sin texto seleccionable requieren OCR previo. StockFlow lo detecta y no inventa contenido.
- “Cualquier documento” significa los formatos empresariales modernos compatibles y con información estructurable; ningún sistema puede interpretar con fiabilidad archivos cifrados, dañados o imágenes sin OCR.
- La aplicación no puede deducir huecos vacíos que no aparezcan en el archivo ni proponer destinos fiables sin un maestro de ubicaciones y capacidades.
- Sobrestock, cobertura, reposición y simulación requieren demanda, consumo o pedidos verificables; ABC económico y valor requieren además coste unitario.
- El mapa es una herramienta de apoyo y no ejecuta movimientos físicos ni escribe en un WMS.
- La marca APQ evita mezclas generales, pero la compatibilidad química y el cumplimiento normativo deben validarse por personal cualificado.
- Las cinco vías ante caducidad son propuestas de apoyo: cada empresa debe validar normativa, etiquetado, cadena de frío, trazabilidad, condiciones de transporte y aceptación expresa del receptor.
- Los enlaces a entidades sociales permiten iniciar una consulta; StockFlow no garantiza que una organización acepte un producto o una cantidad concretos.

## 14. Evolución futura

- Múltiples almacenes y transferencias internas.
- Historial de movimientos y estacionalidad.
- Comparación de proveedores.
- Reglas configurables por sector.
- Colaboración por equipos.
- Alertas programadas.
- Integración con ERP mediante API.

## 15. Screenshots pendientes de insertar

1. Dashboard principal.
2. Traductor universal con hoja, fila y mapeo de columnas detectados.
3. Inventario con clasificación ABC.
4. Mapa completo del almacén y detalle de ubicación.
5. Plan de movimientos, fusión y reposición.
6. Centro de acciones.
7. Simulador de escenarios.
8. Panel explicativo de una referencia.
