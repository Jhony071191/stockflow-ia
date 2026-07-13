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

## Evidencias que deben incorporarse al Google Doc

- Capturas o exportación de la conversación de Codex.
- Fecha y hora de creación del proyecto.
- Capturas de los dos hitos desplegados.
- Resultado de las pruebas.
- Relación entre cada prompt y el cambio generado.

## Nota de integridad

Este registro resume las instrucciones dadas durante la sesión. Antes de la entrega se debe cotejar con la transcripción exportada de Codex y añadir cualquier prompt posterior sin alterar el orden cronológico.
