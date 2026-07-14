# Documentación Técnica — StockFlow IA

> Borrador maestro para trasladar a un único Google Doc antes de la entrega.

## 1. Descripción del proyecto

StockFlow IA es una aplicación web que transforma datos básicos de inventario en decisiones operativas explicadas y priorizadas. Está dirigida a pequeños almacenes, comercios, organizaciones sociales y profesionales que trabajan con hojas de cálculo y necesitan detectar rápidamente roturas de stock, exceso de mercancía, referencias sin rotación y riesgos de caducidad.

Su propuesta de valor se resume en una frase:

**“Convierte cualquier hoja de inventario en un plan de acción comprensible en menos de un minuto.”**

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

## 4. Funcionalidades principales

### 4.1 Importación y validación Excel/CSV

- Carga mediante selector o arrastrar y soltar.
- Acepta Excel `.xlsx` y CSV con delimitadores por coma o punto y coma.
- Reconoce alias habituales de columnas en español.
- Valida encabezados obligatorios y campos numéricos.
- Limita el tamaño del archivo a 10 MB.
- Incluye una plantilla Excel de dos hojas con datos ficticios e instrucciones.
- Admite una fila por ubicación ocupada y agrega automáticamente el stock por SKU.

### 4.2 Motor analítico

- Clasificación ABC.
- Demanda media de los últimos tres periodos.
- Variabilidad de demanda.
- Cobertura en días.
- Rotación mensual.
- Punto de pedido.
- Pedido sugerido.
- Valor de existencias.
- Detección de caducidad próxima.

### 4.3 Centro de acciones

- Priorización por nivel crítico, atención o estable.
- Explicación de la situación detectada.
- Recomendación concreta por referencia.
- Panel lateral con variables y fórmulas utilizadas.
- Filtros por estado y clasificación ABC.

### 4.4 Simulador de escenarios

- Variación de demanda entre −20 % y +50 %.
- Retraso adicional del proveedor entre 0 y 30 días.
- Comparación entre situación actual y escenario proyectado.
- Recalcula SKU en riesgo, unidades recomendadas e inversión estimada.
- No modifica los datos originales.

### 4.5 Exportación

- Descarga CSV del análisis completo.
- Incluye ABC, cobertura, punto de pedido, pedido sugerido, estado y recomendación.

### 4.6 Conteos cíclicos por cliente

- Configuración del cliente, año y tolerancia permitida.
- Modalidad contractual de uno o dos conteos durante el año.
- Fechas independientes para cada campaña.
- Orden recomendado de ejecución A, B y C.
- Registro de stock físico por referencia.
- Diferencia absoluta y porcentual frente al sistema.
- Identificación de referencias fuera de tolerancia.
- Indicadores de progreso, exactitud, coincidencias y ajuste valorado.
- Cierre de campaña únicamente cuando todas las referencias han sido contadas.
- Exportación de un acta CSV independiente por campaña.

### 4.7 Mapa y slotting del almacén

- Generación de todas las ubicaciones del almacén, tanto vacías como ocupadas.
- Estructura por pasillo, módulo y entre 5 y 7 alturas; la altura 1 representa suelo/picking.
- Configuración de dimensiones desde el archivo y valores seguros por defecto si no se informan.
- Distribución visual por grupos familiares.
- Segregación de pasillos y ubicaciones APQ para mercancía peligrosa.
- Detalle de ubicación con cantidad, SKU, lote, fabricación, vencimiento y picking pendiente.
- Cálculo de unidades comprometidas en pedidos próximos.
- Plan de movimientos con origen, destino, cantidad y motivo explicable.
- Subida del excedente a altura conservando un mes de demanda disponible en suelo tras el picking.
- Fusión únicamente cuando coinciden exactamente SKU, lote, fecha de fabricación y fecha de vencimiento.
- Selección de un hueco vacío compatible cuando la fusión no es posible.
- Reposición desde reserva hacia una ubicación de suelo compatible, aplicando prioridad de vencimiento.
- Exportación del mapa completo con filas para ubicaciones vacías y ocupadas.

## 5. Arquitectura

La solución utiliza una arquitectura sin servidor para el tratamiento de los datos:

1. **Capa de interfaz:** componentes React y estilos responsive.
2. **Entrada:** archivo Excel o CSV seleccionado por el usuario.
3. **Validación:** normalización de encabezados, números, fechas, coordenadas y filas.
4. **Motor analítico:** funciones TypeScript puras y deterministas.
5. **Motor de almacén:** generación de ubicaciones, segregación APQ y reglas de movimiento.
6. **Módulo de conteos:** planificación, captura física y conciliación por campaña.
7. **Presentación:** dashboard, mapa de pasillos, tablas, filtros, explicación y simulador.
8. **Salida:** análisis, mapa de ubicaciones y actas CSV generados en el navegador.

El inventario se mantiene únicamente en memoria durante la sesión. No se utiliza base de datos ni se transmite el archivo a un servicio externo.

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

Configura un contrato de uno o dos conteos anuales, registra el stock físico y entrega al cliente un acta de diferencias.

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

## 10. Challenges y soluciones

### Equilibrar innovación y alcance

**Challenge:** construir una solución útil en siete días sin intentar replicar un ERP.

**Solución:** concentrar el producto en una promesa clara: transformar un CSV en decisiones explicadas.

### Importar archivos heterogéneos

**Challenge:** los CSV pueden utilizar delimitadores, decimales y nombres de columnas distintos.

**Solución:** detección de separador, normalización de encabezados, alias en español y mensajes de error por fila.

### Generar recomendaciones confiables

**Challenge:** evitar que una recomendación parezca una predicción infalible.

**Solución:** usar reglas deterministas, mostrar las métricas y explicar las fórmulas en cada producto.

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
- Generación e importación de un archivo Excel real.
- Fusión permitida con lote y fechas idénticos.
- Bloqueo de fusión cuando cambia la fecha de fabricación.
- Reposición desde altura hacia una ubicación de suelo.
- Navegación accesible mediante botones y teclado.
- Compatibilidad responsive definida para escritorio, tableta y móvil.

## 12. Privacidad, seguridad y ética

- No se solicitan datos personales.
- No se incluyen credenciales reales.
- Los datos de demostración son ficticios.
- El CSV se procesa localmente.
- Las recomendaciones son apoyo a la decisión y muestran sus fundamentos.
- El usuario conserva la responsabilidad sobre compras y ajustes reales.

## 13. Limitaciones actuales

- No existe persistencia entre sesiones.
- No se conecta a un ERP ni a proveedores.
- El análisis utiliza tres periodos recientes y no sustituye una previsión estadística avanzada.
- Los costes y plazos dependen de la calidad del archivo proporcionado.
- El mapa es una herramienta de apoyo y no ejecuta movimientos físicos ni escribe en un WMS.
- La marca APQ evita mezclas generales, pero la compatibilidad química y el cumplimiento normativo deben validarse por personal cualificado.

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
2. Modal de importación Excel/CSV.
3. Inventario con clasificación ABC.
4. Mapa completo del almacén y detalle de ubicación.
5. Plan de movimientos, fusión y reposición.
6. Centro de acciones.
7. Simulador de escenarios.
8. Panel explicativo de una referencia.
