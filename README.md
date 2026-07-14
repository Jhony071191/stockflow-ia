# StockFlow IA

StockFlow IA convierte una hoja de inventario en un plan de acción comprensible: qué reponer, qué tiene exceso, dónde ubicar cada lote y qué referencias requieren atención inmediata.

**Aplicación:** https://stockflow-ia.jamz071191.chatgpt.site

## Problema que resuelve

Pequeños comercios, almacenes y organizaciones suelen disponer de datos de stock, pero no de una herramienta sencilla que traduzca esos datos en decisiones diarias. El resultado puede ser rotura de stock, mercancía inmovilizada, compras innecesarias y desperdicio.

## Funcionalidades

- Importación y validación de inventarios Excel (`.xlsx`) y CSV.
- Generación del mapa completo del almacén, incluidas ubicaciones vacías y ocupadas.
- Estructura configurable por pasillos, módulos y entre 5 y 7 alturas.
- Agrupación por familias y segregación visual de ubicaciones APQ.
- Trazabilidad por ubicación, SKU, lote, fabricación, vencimiento y cantidad.
- Picking pendiente por ubicación y unidades comprometidas en pedidos próximos.
- Recomendaciones de subida a altura, fusión segura y reposición a suelo.
- Fusión permitida únicamente cuando coinciden SKU, lote, fabricación y vencimiento.
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

1. Descargar la plantilla Excel y registrar una fila por ubicación ocupada.
2. Indicar pasillo, módulo, altura, lote, fechas, APQ y picking pendiente.
3. Pulsar **Analizar inventario** y seleccionar el archivo.
4. Revisar el mapa completo de ubicaciones y el plan de movimientos.
5. Consultar indicadores, clasificación ABC y acciones recomendadas.
6. Probar escenarios o ejecutar conteos cíclicos.
7. Exportar el análisis, el mapa o el acta.

## Columnas Excel o CSV

Obligatorias:

- `sku`
- `producto`
- `cantidad_ubicacion` o `stock_actual`
- `coste_unitario`
- `demanda_mensual`, o al menos una de `ventas_mes_1`, `ventas_mes_2`, `ventas_mes_3`

Opcionales:

- `categoria`
- `lead_time_dias`
- `stock_seguridad`
- `fecha_caducidad`
- `pasillo`, `modulo`, `altura` o `ubicacion`
- `lote`, `fecha_fabricacion`, `fecha_vencimiento`
- `apq`
- `picking_pendiente`
- `capacidad_ubicacion`
- `total_pasillos`, `modulos_por_pasillo`, `alturas_almacen`

Se aceptan separadores por punto y coma o coma y distintos alias habituales en español.

La plantilla utiliza una fila por ubicación ocupada. Si faltan coordenadas, StockFlow IA asigna huecos automáticamente. Si no se indican las dimensiones, utiliza una demostración de 6 pasillos × 8 módulos × 6 alturas; siempre completa entre 5 y 7 alturas.

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

Las recomendaciones son deterministas y explicables. La aplicación no presenta predicciones opacas como certezas.

## Arquitectura

- React 19 + TypeScript.
- Next.js/Vinext sobre Vite.
- Motor analítico puro en `lib/inventory.ts`.
- Motor de ubicaciones y movimientos en `lib/warehouse.ts`.
- Procesamiento local de Excel y CSV en el navegador.
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

Las 12 pruebas automatizadas verifican el análisis ABC, el simulador, los conteos, la importación Excel real, la generación de huecos vacíos, la zona APQ, la fusión exacta y la reposición a suelo.

## Privacidad

Los archivos se procesan localmente en el dispositivo. StockFlow IA no almacena ni transmite el contenido del inventario.

## Hackathon Vibe Coding — Big School, Edición 6

El proyecto fue iniciado el 14 de julio de 2026 y generado mediante instrucciones en lenguaje natural con Codex, dentro de la ventana oficial del hackathon.
