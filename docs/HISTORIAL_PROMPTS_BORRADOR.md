# Historial de Prompts — StockFlow IA

> Documento independiente. Debe trasladarse a un Google Doc separado de la documentación técnica.

## Información del proceso

- Inicio oficial del desarrollo: 14 de julio de 2026, hora peninsular española.
- Plataforma de Vibe Coding: Codex.
- Código manual de la lógica principal: ninguno.
- Metodología: instrucciones conversacionales, generación, prueba, revisión y nueva iteración.

## Prompt 01 — Inicio oficial

**Autor:** participante
**Fecha:** 14/07/2026  
**Prompt literal:**

> Allan podemos dar inicio al proyecto del hackaton

**Resultado:** creación oficial del proyecto StockFlow IA dentro de la ventana permitida.

## Prompt 02 — Objetivo heredado de la ideación

**Instrucción consolidada dada a Codex:**

> Crea StockFlow IA, una aplicación web que permita cargar un inventario y convierta los datos en decisiones claras. Debe analizar clasificación ABC, rotación, cobertura, riesgo de rotura, sobrestock y caducidades. La experiencia tiene que ser profesional, accesible, responsive y demostrable en menos de cinco minutos. Usa datos ficticios y no incluyas información personal real.

**Resultado:** definición del alcance, arquitectura sin datos personales y flujo principal.

## Prompt 03 — Alternativas visuales

**Instrucción dada a Codex:**

> Propón tres direcciones visuales comparables para StockFlow IA. Todas deben mostrar el mismo dashboard y contenido realista, pero diferenciarse en identidad: una opción logística premium azul marino, una opción clara y humana y una opción tecnológica oscura.

**Resultado:** tres propuestas visuales presentadas para selección.

## Prompt 04 — Selección visual

**Autor:** participante
**Prompt literal:**

> La opción 1

**Resultado:** adopción de “Control operativo premium”: azul marino profundo, superficies claras, turquesa, indicadores semafóricos y navegación lateral.

## Prompt 05 — Primer hito funcional

**Instrucción dada a Codex:**

> Construye el primer viewport de StockFlow IA siguiendo la opción 1 seleccionada. Incluye navegación entre Resumen, Inventario, Acciones y Simulador; cabecera con propuesta de valor; cuatro KPI; centro de acciones con datos ficticios; responsive y navegación mediante teclado. Conserva una estética logística premium y alta legibilidad.

**Resultado:** dashboard, navegación, tablas iniciales y primer despliegue verificado.

## Prompt 06 — Motor de inventario

**Instrucción dada a Codex:**

> Convierte la maqueta en una aplicación real. Crea un motor determinista que calcule demanda media, variabilidad, valor de consumo, clasificación ABC, cobertura, rotación, punto de pedido, pedido sugerido, valor en stock y nivel de prioridad. Explica cada recomendación y evita presentar estimaciones como certezas.

**Resultado:** módulo analítico central y recomendaciones explicables.

## Prompt 07 — Importador CSV

**Instrucción dada a Codex:**

> Añade carga CSV por selección y arrastre. Detecta delimitadores por coma o punto y coma, normaliza encabezados en español, admite decimales habituales, valida columnas y filas, limita el tamaño del archivo y ofrece una plantilla descargable con datos ficticios. Procesa todo localmente.

**Resultado:** importación, validación, mensajes de error, plantilla y protección de privacidad.

## Prompt 08 — Inventario y acciones

**Instrucción dada a Codex:**

> Crea una vista de inventario con buscador, filtros ABC y estado, tabla de métricas y exportación. Crea también un centro de acciones ordenado por impacto y un panel de detalle que muestre por qué se recomienda cada decisión y qué fórmulas se utilizaron.

**Resultado:** vistas completas de Inventario y Acciones, filtros, explicación y exportación.

## Prompt 09 — Simulador

**Instrucción dada a Codex:**

> Añade un simulador que permita cambiar la demanda entre −20 % y +50 % y añadir hasta 30 días de retraso del proveedor. Compara la situación actual con el escenario en SKU de riesgo, unidades sugeridas e inversión estimada, sin modificar el inventario original.

**Resultado:** simulador interactivo y tabla de impacto proyectado.

## Prompt 10 — Pruebas y cierre técnico

**Instrucción dada a Codex:**

> Revisa la aplicación, corrige problemas de tipado y estilo, valida el artefacto de producción y añade pruebas automatizadas para ABC, simulación, importación correcta y errores de columnas obligatorias. Despliega la versión completa únicamente si todas las validaciones pasan.

**Resultado:** lint correcto, cuatro pruebas lógicas superadas, compilación verificada y segundo despliegue satisfactorio.

## Prompt 11 — Conteos cíclicos

**Autor:** participante
**Prompt literal:**

> Tienes mi autorización, es posible también insertar un apartado para que realice conteos cíclicos dado que los clientes pueden pedir realizar dos conteos en el año o aun solo conteo. Luego que me respondas si es posible y de ser positivo intégralo y continúa con la autorización por mi parte.

**Instrucción consolidada dada a Codex:**

> Integra un módulo de conteos cíclicos orientado a clientes. Debe permitir contratar y programar uno o dos conteos por año, configurar fechas y tolerancia, ordenar referencias por ABC, registrar cantidades físicas, calcular diferencias absolutas y porcentuales, medir exactitud, cerrar campañas completas y exportar un acta. Mantén el diseño premium, el procesamiento local y añade pruebas automatizadas.

**Resultado:** módulo de campañas anuales, captura física, conciliación, métricas, exportación y tres pruebas adicionales.

## Prompt 12 — Creación del repositorio público

**Autor:** participante
**Prompt literal:**

> https://github.com/Jhony071191/stockflow-ia

**Resultado:** identificación del repositorio público y preparación de la publicación del código generado.

## Prompt 13 — Validación y reparación de GitHub

**Autor:** participante
**Prompt literal:**

> listo

**Resultado:** revisión del repositorio, restauración de archivos raíz desde la fuente desplegada, corrección de permisos de scripts y comparación exacta del árbol Git. Resultado: instalación limpia, pruebas, lint, compilación y renderizado superados.

## Prompt 14 — Organización de los entregables

**Autor:** participante
**Prompt literal:**

> tienes mi autorizacion total para crear y organizar los elementos

**Resultado:** creación y organización de la carpeta oficial de Google Drive, documentación técnica, historial independiente, control visual mediante PDF y verificación de permisos públicos de lectura.

## Prompt 15 — Mapa integral de ubicaciones y slotting

**Autor:** participante
**Fecha:** 14/07/2026
**Prompt literal:**

> revisando la aplicacion me di cuenta que no dice las ubicaciones normalmente son por pasillos y por altural en los almacenes logisticos cuenta con un maximo de 6 a 7 alturas y como minimo 5 alturas tambien estan divididos por grupos familiares y tienen unas ubicaciones que con para APQ que seria articulos peligrosos Hazardous quiero que tambien lo contemple que si inserto un excel me genere las ubicaciones de todo el almacen sean vacias o ocupadas quiero que me diga que cantidad tienen en cada una de ellas y como requisito es si tengo sobre stock quiero que me diga que se debe de subir la mercancia sobrante a altura dejar lo necesario para el mes, de ser necesario fusionarlo siempre y cuando cumpla con este requisito primordial el lote debe de ser el mismo al igual que las fechas de fabricacion y vencimiento del mismo, tambien quiero que me diga en que ubicacion podria yo colocar la mercancia sobrante en caso de no poder fusionarlo y si debo de realizar un aprovicionamiento donde deberia ir en el suelo. tambien quiero que en la pantalla se muestre todos los pasillos con sus ubicaciones lotes, sku, y si tengo picking pendiente en el sistema que me diga cuantos van a salir en los pedidos proximos

**Instrucción consolidada dada a Codex:**

> Amplía StockFlow IA con un mapa completo del almacén. Importa Excel o CSV con una fila por ubicación, genera huecos vacíos y ocupados, admite entre 5 y 7 alturas, agrupa por familias y segrega APQ. Muestra pasillo, módulo, altura, cantidad, SKU, lote, fabricación, vencimiento y picking pendiente. Para sobrestock, conserva en suelo un mes de demanda después de los pedidos pendientes y sube el excedente. Solo permite fusionar si coinciden SKU, lote, fabricación y vencimiento; en caso contrario, asigna un hueco vacío compatible. Cuando falte stock en suelo, propone reposición desde altura con origen y destino exactos. Añade exportación, plantilla Excel, filtros, detalle, pruebas y documentación.

**Resultado:** primera versión del mapa logístico con reglas APQ, trazabilidad, fusión y reposición; validación 12/12. La revisión WMS posterior descubrió que no debían inventarse huecos; se corrigió en el Prompt 16.

## Prompt 16 — Traductor universal de formatos empresariales

**Autor:** participante
**Fecha:** 14/07/2026
**Prompt literal:**

> Quiero que la aplicacion tome cualquier excel y lo traduzca al lenguaje de la misma para que de esa forma lea y se adapte a cualquier empresa

**Instrucción consolidada dada a Codex:**

> Sustituye la importación rígida por un traductor universal asistido. Debe examinar todas las hojas, localizar encabezados aunque no estén en la primera fila, reconocer alias empresariales en varios idiomas, inferir columnas mediante sus valores, reconstruir ubicaciones divididas en varios segmentos y permitir corregir el mapeo antes de importar. Solo SKU y cantidad serán obligatorios. Recuerda el perfil del formato localmente y nunca inventes producto, familia, coste, demanda, APQ, pedidos ni huecos vacíos. Cuando falten demanda o un maestro completo de ubicaciones, conserva el stock físico pero pausa los cálculos y destinos que no puedan justificarse. Añade pruebas con formatos desplazados, múltiples hojas, un fichero mínimo y un maestro completo.

**Resultado:** asistente “Traductor universal de inventarios”, detección y corrección de hoja/fila de encabezados, mapeo editable, perfiles locales, ubicación compuesta, modo seguro de datos parciales y seis pruebas adicionales. La validación alcanzó 18 pruebas lógicas, lint y compilación satisfactoria.

## Prompt 17 — Auditoría de jurado y versión premium multiformato

**Autor:** participante
**Fecha:** 18/07/2026
**Prompt literal:**

> Quieronque actues por un momento como un jurado especializado en Ia le des un vistazo a mi proyecto veas sus puntos fuertes y debiles luego quiero que refuerces esos puntos debiles y mejores la aplicacion hadta dejarla en su forma mas premium y mejorada, que todos los apartados sirvan, que pueda leer cualquier do umento y volcar laninformacuon lara realizar todas las tareas necesarias y requeridas, tambien quiero que lo revises las veces que sean necesariasnpara dejarlo perfecto para lonque se va a utilizar.

**Instrucción consolidada dada a Codex:**

> Evalúa StockFlow IA según los criterios del jurado: complejidad y funcionalidad, innovación, calidad del Vibe Coding, experiencia de usuario y utilidad. Refuerza los puntos débiles sin inventar capacidades. Amplía la entrada a los formatos empresariales modernos más frecuentes, permite complementar un inventario con documentos separados por SKU, mide la cobertura real de los datos, elimina resultados engañosos, completa los conteos con una campaña de gracia, crea un informe integral y revisa repetidamente pruebas, tipos, lint, compilación, archivo empresarial real, documentación, repositorio y despliegue.

**Resultado:** centro universal compatible con XLSX, CSV, TSV, JSON, PDF con texto, DOCX y TXT; modos de nuevo análisis y enriquecimiento; auditoría de preparación 0–100 con cobertura completa/parcial/pendiente; ABC y valor parcial honestos; conteo de gracia; compatibilidad familiar; informe Excel de seis hojas; 29 pruebas lógicas, HTML renderizado, TypeScript, ESLint y compilación superados. El Excel empresarial real se validó localmente sin incorporarlo al repositorio ni transmitir sus datos.

## Evidencias que deben incorporarse al Google Doc

- Capturas o exportación de la conversación de Codex.
- Fecha y hora de creación del proyecto.
- Capturas de los dos hitos desplegados.
- Resultado de las pruebas.
- Relación entre cada prompt y el cambio generado.

## Nota de integridad

Este registro resume las instrucciones dadas durante la sesión. Antes de la entrega se debe cotejar con la transcripción exportada de Codex y añadir cualquier prompt posterior sin alterar el orden cronológico.
