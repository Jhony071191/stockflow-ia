# StockFlow IA

StockFlow IA convierte una hoja de inventario en un plan de acción comprensible: qué reponer, qué tiene exceso, qué apenas rota y qué referencias requieren atención inmediata.

**Aplicación:** https://stockflow-ia.jamz071191.chatgpt.site

## Problema que resuelve

Pequeños comercios, almacenes y organizaciones suelen disponer de datos de stock, pero no de una herramienta sencilla que traduzca esos datos en decisiones diarias. El resultado puede ser rotura de stock, mercancía inmovilizada, compras innecesarias y desperdicio.

## Funcionalidades

- Importación y validación de inventarios CSV.
- Clasificación ABC por valor de consumo acumulado.
- Cálculo de demanda media, variabilidad, rotación, cobertura y punto de pedido.
- Detección de roturas, sobrestock, falta de rotación y caducidad próxima.
- Centro de acciones explicado y priorizado.
- Simulador de cambios de demanda y retrasos de proveedor.
- Planificación de uno o dos conteos cíclicos anuales por cliente.
- Registro de conteo físico, diferencias, tolerancia, exactitud y acta exportable.
- Exportación del análisis y descarga de una plantilla compatible.
- Diseño responsive, navegación por teclado y reducción de movimiento.

## Flujo principal

1. Descargar la plantilla o preparar un CSV compatible.
2. Pulsar **Analizar inventario** y seleccionar el archivo.
3. Revisar indicadores, clasificación ABC y acciones recomendadas.
4. Probar escenarios en el simulador.
5. Programar y ejecutar los conteos cíclicos contratados.
6. Exportar el informe o acta para compartir y ejecutar el plan.

## Columnas CSV

Obligatorias:

- `sku`
- `producto`
- `stock_actual`
- `coste_unitario`
- `demanda_mensual`, o al menos una de `ventas_mes_1`, `ventas_mes_2`, `ventas_mes_3`

Opcionales:

- `categoria`
- `lead_time_dias`
- `stock_seguridad`
- `fecha_caducidad`

Se aceptan separadores por punto y coma o coma y distintos alias habituales en español.

## Motor de decisión

- **ABC:** ordena las referencias por demanda media × coste unitario y las distribuye por consumo acumulado: A hasta el 80 %, B hasta el 95 % y C el resto.
- **Cobertura:** stock actual ÷ demanda diaria media.
- **Punto de pedido:** demanda durante el plazo de entrega + stock de seguridad.
- **Pedido sugerido:** cantidad necesaria para alcanzar una cobertura objetivo adaptada al plazo.
- **Prioridad:** combina estado, cobertura e importancia ABC.

Las recomendaciones son deterministas y explicables. La aplicación no presenta predicciones opacas como certezas.

## Arquitectura

- React 19 + TypeScript.
- Next.js/Vinext sobre Vite.
- Motor analítico puro en `lib/inventory.ts`.
- Procesamiento local del CSV en el navegador.
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

Las pruebas automatizadas verifican el análisis ABC, el efecto del simulador, la importación de la plantilla y los errores de columnas obligatorias.

## Privacidad

Los archivos se procesan localmente en el dispositivo. StockFlow IA no almacena ni transmite el contenido del inventario.

## Hackathon Vibe Coding — Big School, Edición 6

El proyecto fue iniciado el 14 de julio de 2026 y generado mediante instrucciones en lenguaje natural con Codex, dentro de la ventana oficial del hackathon.
