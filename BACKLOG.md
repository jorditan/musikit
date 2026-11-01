# Backlog de Musikit

Trabajamos con entregables pequeños: implementar un ticket, probar el flujo completo y ajustar antes de tomar el siguiente. Este backlog evoluciona con lo que aprendamos; no es una especificación cerrada.

## Estado actual

### Migración a force-graph — 31/10/2026

Decisión vigente del usuario: **force-graph 1.52.0 reemplaza React Flow/XYFlow**. Las menciones anteriores a React Flow se conservan abajo como historial y quedan sustituidas por esta decisión.

- [x] Retirar `@xyflow/react` e integrar el paquete nativo `force-graph` en Canvas 2D.
- [x] Mantener selección sin expansión, solicitudes explícitas, paginación e identidad musical.
- [x] Conservar reducción de conexiones redundantes para todo tipo de entidad y todos los nodos originales.
- [x] Distribución próxima al origen, arrastre de vecinos directos visibles, fijación al soltar y botón Reacomodar.
- [x] Separar objetos mutables de simulación del estado React, conservar posiciones al expandir y limpiar motor/observadores al salir.
- [x] Controles de zoom/centrado, iconos, temas, movimiento reducido y lista accesible.
- [x] Actualizar README y notas de arquitectura, producto, diseño e índice en Obsidian.
- [ ] Validación visual móvil/escritorio, temas, arrastre, teclado y densidad con grafos grandes. Navegador integrado bloqueado por error interno `constraints`.

Pruebas nuevas del adaptador verifican continuidad de objetos/posiciones, selección, desplazamiento de vecinos, liberación de fijaciones, desmontaje y movimiento reducido. Contraer ramas, filtros y búsqueda contextual no se incorporan automáticamente por cambiar de biblioteca.

La revisión de MVP del 30/10/2026 al final de este documento contiene la prioridad propuesta más reciente; las entregas anteriores se conservan como historial.

- Base: React + TypeScript + Vite.
- Instalación, build y lint verificados.
- Primer flujo: buscar por nombre y tipo (artista, banda o canción) y mostrar resultados iniciales, sin detalles.
- API elegida: MusicBrainz, API pública v2 (`https://musicbrainz.org/ws/2/`).
- Inicio implementado con shadcn/ui, Tailwind, Space Grotesk y selector claro/oscuro/sistema. Buscador conectado a MusicBrainz mediante backend Node y TanStack Query.

## Forma de trabajo

- Un ticket en curso por vez.
- Cada ticket describe un resultado que podamos demostrar y criterios para aceptarlo.
- Las funcionalidades incluyen la UI y su integración real con la API en el mismo ticket.
- Contemplar carga, error y resultados vacíos cuando corresponda.
- Verificar build y lint, además del flujo afectado. Agregar pruebas automatizadas cuando aporten cobertura útil.
- Probar en claro y oscuro, y en escritorio y móvil.
- Al terminar: registrar cómo se probó, revisar juntos y decidir la siguiente iteración.

## Contexto de Obsidian

Notas de referencia: `Proyectos/Musikit/Producto · MusiKit.md`, `Proyectos/Musikit/Arquitectura y definiciones técnicas · MusiKit.md` y `Proyectos/Musikit/Design System · MusiKit.md` (consultadas el 29/10/2026).

- Visión: descubrir conexiones musicales documentadas mediante un grafo que crece por acciones explícitas. El buscador es el primer paso; el grafo y los detalles quedan fuera de la entrega actual.
- Dominio: WORK es una composición; RECORDING, una grabación; ARTIST puede ser persona o grupo. Conservar MBID y tipo de entidad. No inferir relaciones por coincidencia de nombres o títulos.
- Alcance vigente de esta conversación: nombre y selector de artista, banda o canción; primera respuesta real sin desplegar detalles. Tiene prioridad sobre las fases amplias propuestas en las notas.
- Arquitectura orientativa: fullstack ligero con backend reducido. React + Vite ya está instalado; no migrar de framework como parte de estos tickets. TanStack Query es la orientación para consultas del cliente; Redis y la persistencia no son requisitos de esta primera entrega.
- Las notas técnicas son propuestas en evolución: no tratar React Flow, Redis, hosting o una base persistente como decisiones cerradas.
- Sin cuentas, pagos, streaming ni favoritos en esta etapa. Comunicar datos faltantes y cobertura parcial sin inventar información.

## Próximos tickets

### MK-001 — Base visual con shadcn y selector de tema

Estado: en prueba. Implementación completa; pendiente revisión visual e interactiva. Tamaño: pequeño. Sin dependencias.

Resultado: abrir Musikit y cambiar entre modo claro, oscuro y sistema.

Alcance:
- Instalar y configurar shadcn/ui y sus dependencias siguiendo la documentación vigente para Vite.
- Configurar los estilos y alias necesarios.
- Incorporar solo los componentes que se usen en esta entrega.
- Reemplazar la pantalla de ejemplo por una base mínima de Musikit con selector de tema.
- Aplicar la dirección visual de Obsidian: oscura, experimental y minimalista, con sensibilidad editorial; evitar ruido visual y neones excesivos.
- Usar Space Grotesk como única familia, cuerpo de 16 px y mínimo habitual de 14 px.
- Definir tokens semánticos para ambos temas, espaciado basado en 8 px y radio de 24 px en superficies principales, con radios adecuados para controles pequeños.
- Personalizar shadcn con estos tokens. La paleta concreta sigue pendiente de definición; los valores iniciales serán revisables.

Criterios de aceptación:
- Los componentes usan los colores del tema de forma consistente.
- La elección de tema se conserva al recargar.
- La opción sistema sigue la preferencia del dispositivo, incluidos sus cambios.
- El selector se puede operar con teclado y tiene un nombre accesible.
- Build y lint pasan.

Demostración: cambiar tema, recargar y comprobar la preferencia; probar la opción sistema.

Evidencia del 29/10/2026: `npm run build` y `npm run lint` pasan. Tipografía servida localmente, preferencia guardada con tolerancia a almacenamiento no disponible, listener de cambios del sistema y aplicación del tema antes de montar React. La automatización del navegador integrado falló al navegar con un error interno; falta verificar visualmente móvil/escritorio y probar temas, persistencia y teclado en navegador. El botón «Descubrí MusiKit» navega a la explicación; el buscador figura como próximo entregable.

### MK-002 — Buscador por nombre y tipo conectado a la API

Estado: en prueba. Implementación y validación HTTP completas; pendiente revisión visual/interactiva junto con MK-001. Tamaño objetivo: pequeño.

Resultado: ingresar un nombre, elegir artista, banda o canción y ver los resultados iniciales de una petición real a la API.

Alcance:
- Campo de nombre, selector de tipo y botón Buscar.
- Enviar la búsqueda al pulsar Buscar o Enter; no buscar por cada tecla.
- Mostrar una lista sencilla con los datos mínimos para identificar cada resultado.
- Mostrar únicamente la primera página de resultados.
- Sin navegación a detalles, reproducción, favoritos ni paginación en esta entrega.

Integración acordada:
- MusicBrainz API v2, búsqueda con respuesta JSON (`fmt=json`) y primera página de hasta 10 resultados.
- Mapeo del selector para esta entrega: artista = persona solista (`artist`, tipo `Person`); banda = grupo (`artist`, tipo `Group`); canción = composición (`work`), conforme al dominio documentado en Obsidian. Verificar los filtros contra la documentación de búsqueda y respuestas reales durante la implementación.
- No sustituir obras por grabaciones ni agrupar obras solo porque comparten título. Las grabaciones y versiones se explorarán en tickets posteriores.
- Mostrar nombre, tipo, país y desambiguación si existen para personas/grupos; título, tipo de obra, idioma y desambiguación si existen para composiciones. No pedir detalles adicionales para completar campos ausentes.
- La búsqueda pública no requiere API key ni autenticación.
- Identificar Musikit con un User-Agent significativo y respetar como máximo una petición por segundo hacia MusicBrainz, incluidos los reintentos.
- Incluir un backend mínimo de integración, alineado con la orientación de Obsidian, para identificar Musikit y coordinar solicitudes a MusicBrainz. No depender de un proxy exclusivo de Vite para producción. Definir su ejecución local y contrato dentro de este ticket, sin agregar infraestructura ajena al flujo inicial.
- Escapar el texto ingresado para la sintaxis de búsqueda de MusicBrainz y codificar los parámetros de la URL.

Criterios de aceptación:
- No se envían búsquedas con el nombre vacío o compuesto solo por espacios.
- Se puede buscar en los tres tipos y los resultados corresponden al nombre y tipo enviados.
- El estado inicial invita a buscar; no muestra un aviso de «sin resultados» antes de la primera búsqueda.
- Durante la petición se indica la carga y se evitan envíos duplicados.
- Si se realizan búsquedas sucesivas, una respuesta anterior no reemplaza los resultados de la búsqueda más reciente.
- La acción llega a la API y su respuesta se muestra en la interfaz.
- Hay estados de carga, error con reintento y resultado vacío cuando corresponda.
- Ningún secreto queda expuesto en el cliente.
- La configuración necesaria se documenta; se agrega un ejemplo de variables de entorno si aplica.
- El recorrido se prueba con la API real y se registra el resultado.
- Build y lint pasan.

Demostración: buscar un artista, una banda y una canción; probar nombre vacío, búsqueda sin coincidencias y fallo con reintento. Verificar que no se solicitan detalles adicionales.

Evidencia del 29/10/2026:
- Build, lint y cuatro pruebas automatizadas pasan. Cubren validación, escape de Lucene, filtros por tipo, identidad de entidades, metadatos faltantes, cobertura parcial, espaciado de solicitudes y recuperación después de un error.
- API real: Gustavo Cerati → persona, Soda Stereo → grupo, Yesterday → obra (con desambiguación y lenguaje); búsqueda inexistente → cero resultados; nombre en blanco → HTTP 400.
- Recorrido HTTP a través del frontend Vite verificado: página HTTP 200 y `/api/search` → backend → MusicBrainz → respuesta normalizada con Gustavo Cerati.
- Se observó HTTP 503 temporal desde MusicBrainz y un reintento posterior exitoso. La aplicación comunica el fallo; no lo convierte en resultados vacíos.
- Backend limitado a una instancia con cola de hasta diez solicitudes, intervalo mínimo de 1100 ms y timeout de 12 segundos por llamada. Sin infraestructura persistente.
- El navegador integrado sigue fallando al navegar. Quedan pendientes las pruebas visuales, de teclado, temas y reintento desde la UI; pasos incluidos en README.
- `npm run dev` inicia ambos procesos. Contrato, configuración, límites y ejecución del build documentados en README.

### MK-003 — Iteración sobre el primer flujo

Estado: implementado; pendiente revisión visual/interactiva.

Resultado: refactor de componentes y simplificación del inicio solicitados por el usuario.

Alcance realizado:
- App renderiza ExplorePage; layout, hero y explicación son componentes separados.
- Búsqueda y temas agrupados en carpetas con sus hooks; cliente HTTP de búsqueda separado de la UI.
- La página coordina el estado inicial y el estado posterior al envío mediante useExplorePage.
- Inicio con hero breve y buscador debajo; explicación secundaria accesible por scroll con Motion y preferencia de movimiento reducido.
- Después de enviar una búsqueda, hero compacto y prioridad a los resultados.

Validación: build, lint y las cuatro pruebas del backend pasan. Pendiente revisión visual y comportamiento interactivo en navegador; no se modificó el contrato de la API.

## Funcionalidades siguientes

### MK-004 — Previsualización, selección y reinicio

Estado: implementado; pendiente revisión visual en navegador.

- Consulta tras 650 ms de pausa, opciones clickeables con tipo, país/idioma y desambiguación cuando existen.
- Selección por MBID y entidad; confirmación animada con Motion, sin consultar relaciones todavía.
- Limpiar restaura el inicio, cancela temporizador/petición y devuelve el foco al campo. Cambiar texto o tipo descarta selección y coincidencias anteriores.
- El backend propaga la desconexión a la cola y a la petición externa para evitar consultas obsoletas.
- Verificación: build, lint y ocho pruebas automatizadas pasan (cuatro de backend y cuatro de búsqueda: debounce, selección, reinicio y respuesta tardía).
- Este ticket actualiza el alcance anterior de MK-002: ahora sí se busca mientras se escribe, después de la pausa.

### MK-005 — Primera vista de grafo desde un resultado

Estado: propuesta para la siguiente entrega.

- La selección actual alimentará GraphPage con `{ id, entity }` y metadatos iniciales. El hook de página coordinará foco y vuelta a buscar; App seguirá como composición de páginas.
- Evaluar React Flow/XYFlow con nodos personalizados para lienzo, zoom y arrastre. Empezar por un nodo central real, sin conexiones ficticias.
- Motion (`motion/react`) dentro del contenido de los nodos para entrada/salida, selección y panel contextual. React Flow controla posiciones y viewport; no animar con Motion el mismo transform del contenedor que posiciona React Flow.
- Criterios: mostrar el resultado elegido como nodo inicial, conservar su identidad, volver al buscador/limpiar y soportar teclado, temas y movimiento reducido.

### MK-006 — Primera expansión con relaciones reales

Estado: por refinar después de MK-005.

- Un endpoint de relaciones acotado por MBID y entidad, respetando la coordinación actual con MusicBrainz.
- Expandir por acción explícita, incorporar una tanda pequeña de nodos y vínculos etiquetados y mostrar cobertura parcial.
- Deduplicar por identidad, conservar posiciones existentes y mostrar carga/error sobre la expansión afectada.
- Motion para aparición de nodos y trazado de vínculos SVG; transición de cámara coordinada por el lienzo. Mantener alternativa en lista accesible.

Se agregarán una vez definido el producto. Evitar crear tickets genéricos de «todo el backend» o «todo el frontend»: cada nueva funcionalidad debe poder demostrarse de punta a punta.

## Referencias de la API

- [MusicBrainz API: formato, búsqueda, identificación y límites](https://musicbrainz.org/doc/MusicBrainz_API).
- [Grabaciones: significado y campos](https://musicbrainz.org/doc/Recording).

## Plantilla de ticket

- ID y título:
- Estado: pendiente / en curso / en prueba / terminado.
- Resultado visible para el usuario:
- Alcance y límites:
- Integración con la API:
- Criterios de aceptación:
- Dependencias:
- Cómo demostrarlo y verificarlo:
- Evidencia de prueba y ajustes pendientes:

### MK-004 — Ajuste: buscador único

Se eliminó el selector y el estado de tipo del formulario. Las sugerencias combinan artistas (incluidas bandas) y canciones, manteniendo sus etiquetas individuales. El backend consulta los índices artist y work con la misma cola y frecuencia, e intercala hasta diez coincidencias. Se conservan selección, debounce, animación y limpieza. Build, lint y nueve pruebas pasan, incluida una prueba de resultados mixtos.

## Actualización vigente — 30/10/2026

Esta sección prevalece sobre las descripciones históricas anteriores.

- Home editorial clara: marfil, negro y rojo, tipografía grande, bordes rectos y vinilo gráfico. Se conservan oscuro y sistema; claro es la opción inicial sin preferencia guardada.
- Se retiraron la franja [01—∞] y la explicación Cómo funciona.
- Motion React: entrada del titular, rotación lenta del vinilo y compactación del hero, respetando movimiento reducido.
- Buscador universal con debounce; vaciar el campo limpia selección, resultados y errores y cancela solicitudes. Se retiró el botón Limpiar búsqueda.
- Países con banderas SVG locales y nombres en español; idiomas con icono y nombres localizados.

### MK-005 — Página de grafo con React Flow

Estado: implementado; pendiente validación visual e interactiva con el usuario.

Decisión confirmada por el usuario: usar React Flow (@xyflow/react). Se reemplaza la evaluación de alternativas prevista anteriormente.

Criterios de aceptación solicitados:
1. El grafo vive en una page aparte y la navegación tiene animación de transición.
2. Los nodos muestran información de la canción seleccionada.
3. Los nodos pueden arrastrarse.
4. El lienzo utiliza React Flow.

Implementación:
- GraphPage separada de ExplorePage; URL /graph/{entity}/{id}, navegación con History API y transición de entrada/salida mediante Motion. Respeta movimiento reducido.
- Seleccionar una coincidencia abre su grafo. La consulta permanece al volver al buscador; navegación atrás/adelante sincronizada con la página.
- Nodo central real con MBID y entidad conservados, título, tipo, idiomas, país y desambiguación disponibles. También soporta artistas y bandas del buscador universal.
- React Flow administra posiciones, arrastre, pan, zoom y centrar. Motion anima solamente el contenido interior del nodo.
- Selección abre información contextual con enlace a MusicBrainz; botón de información alternativo al lienzo. Flechas de teclado para mover el nodo enfocado.
- Sin conexiones inventadas ni nuevas consultas de relaciones; estas pertenecen a MK-006.
- La navegación conserva los datos en history.state y permite recargar la entrada actual. Una URL compartida sin ese estado vuelve a mostrar el buscador; resolver enlaces directos mediante lookup por MBID queda para una entrega posterior.

Demostración: buscar Yesterday, elegir la obra correcta, comprobar transición y datos; arrastrar nodo, usar zoom/centrar y teclado; abrir/cerrar información; volver y comprobar la búsqueda. Repetir con una banda, móvil, temas y movimiento reducido.

MK-006 sigue pendiente: primera expansión explícita con relaciones documentadas, deduplicación, carga/error y cobertura parcial.

Evidencia MK-005 (30/10/2026): build y lint pasan; 12 pruebas pasan (5 backend, 4 búsqueda y 3 navegación al grafo, restauración de datos e historial). React Flow añade un aviso de tamaño de bundle; división de carga del explorador queda como optimización futura. El control del navegador integrado falló al inspeccionar la pestaña; queda pendiente probar visualmente arrastre, zoom, transiciones, móvil y temas. No se declara cerrado el ticket hasta esa revisión.

### MK-007 — Abrir artista o canción en servicios musicales

Estado: propuesto; pendiente implementación. Ticket independiente de MK-006.

Resultado: desde el panel del nodo, abrir una búsqueda del artista/banda o canción en Spotify o YouTube Music.

Primera entrega recomendada:
- Enlaces externos de búsqueda generados con el nombre disponible; no requiere integrar otra API para construirlos.
- Etiquetas explícitas: «Buscar en Spotify» y «Buscar en YouTube Music». No presentarlos como enlaces a una coincidencia verificada.
- Artistas/bandas: buscar su nombre. Canciones: título y artista relacionado solo si ese dato está documentado; no inferir intérprete a partir de texto de desambiguación.
- Mantener MusicBrainz como fuente de identidad y relaciones del grafo.
- Abrir en otra pestaña con rel="noreferrer noopener", conservar el recorrido y codificar correctamente nombres con espacios, tildes y símbolos.
- Acciones en el panel contextual, fuera del área que arrastra el nodo; accesibles por teclado y con nombre de servicio visible.
- Validar las URL de búsqueda en ambos servicios antes de implementar: la consulta de documentación externa del 30/10/2026 falló por indisponibilidad del buscador; los formatos exactos no se verificaron todavía.

Criterios de aceptación:
1. Artista/banda y canción ofrecen ambas acciones en el panel.
2. Los enlaces buscan el elemento elegido, codifican el texto y no cambian el estado del grafo.
3. No se afirma que una búsqueda sea el perfil o la grabación exacta.
4. Sin credenciales ni llamadas adicionales por cada nodo para esta primera versión.
5. Comprobar teclado, móvil y apertura real en ambos servicios.

Evolución posterior (fuera de este ticket): resolver enlaces exactos documentados por la fuente o mediante integración de catálogo. Una obra WORK no equivale a una grabación concreta; antes de enlazar una pista exacta hay que identificar la interpretación. Evaluar APIs, permisos y cobertura vigentes cuando se aborde esta fase, sin asumir equivalencia entre los catálogos de Spotify y YouTube Music.

Orden sugerido: validar MK-005 con el usuario; MK-007 como mejora pequeña opcional; MK-006 para expansión del grafo con relaciones reales. MK-005 continúa en prueba: abrir la página no verifica por sí solo arrastre, teclado, temas y navegación.

## Revisión del MVP — búsqueda e identificación (30/10/2026)

Motivo: el usuario encuentra demasiadas coincidencias sin poder recorrerlas, poca separación entre entidades, identificación difícil sin imágenes, metadatos insuficientes y una pantalla demasiado ancha. Los tickets siguientes son propuestas pendientes de implementación, no funcionalidades entregadas. Este orden propuesto reemplaza el orden sugerido anterior.

### Evidencia y alcance

- El backend consulta artistas y obras, intercala hasta diez filas y suma los totales. No expone paginación ni totales por categoría. La UI no permite explorar las coincidencias restantes. El ejemplo de unas 800 coincidencias es una observación del usuario, no una medición repetida en esta revisión.
- Ya existen banderas SVG locales y nombres de países/idiomas en español en `result-metadata-view.tsx`. Solo se muestra bandera cuando hay país y un recurso correspondiente; falta comprobar qué recibe la búsqueda reportada y qué renderiza el navegador.
- La normalización conserva nombre, entidad, tipo, país, idiomas y desambiguación. No conserva imágenes ni créditos musicales. Los metadatos ausentes no pueden resolverse solo con estilos.
- El CSS vigente amplía `.site-shell` a 1800 px y elimina el ancho máximo de `.explore-entry`.
- Mantener por ahora canción = composición (`work`). Hacer visible esa distinción. Incorporar grabaciones requiere un ticket y una decisión de producto separados.

Propuesta de corte del MVP: encontrar e identificar una entidad, seleccionarla y explorar al menos una relación documentada. MK-008 a MK-011 mejoran la entrada; MK-005 debe completar su validación y MK-006 sigue siendo necesario para demostrar la promesa de conexiones musicales. Por acuerdo con el usuario, fotos de artistas y bandas (MK-012) forman parte del MVP. Portadas de versiones (MK-013) y enlaces a servicios (MK-007) quedan como evolución posterior. La ausencia de imagen en una entidad no bloquea el recorrido.

### MK-008 — Separar y recorrer resultados de búsqueda

Estado: implementado para prueba; pendiente revisión visual/interactiva. Prioridad: MVP. Primera entrega de búsqueda.

Resultado: distinguir artistas/bandas de canciones y acceder a resultados más allá de la primera muestra.

- Mantener un campo universal. En «Todo», mostrar secciones «Artistas y bandas» y «Canciones · composiciones», con hasta cinco sugerencias por sección, total propio y acción «Ver todos».
- Ofrecer vistas «Todo», «Artistas y bandas» y «Canciones» después de buscar. La separación ocurre en resultados; no exige elegir un tipo antes de escribir.
- «Ver todos» abre la categoría para la misma consulta, con páginas de 20 y controles Anterior/Siguiente. No paginar una mezcla artificial de dos índices.
- Extender el contrato con categoría, posición de página y totales por categoría. Conservar la cola y cancelación; cachear por consulta, categoría y página. No cargar las cientos de coincidencias por anticipado.
- Mantener el orden de cada fuente en esta entrega. El orden de artistas y obras no se presenta como una relevancia global ni como popularidad.

Criterios de aceptación:
1. «Yes» muestra categorías explícitas y permite llegar más allá de los diez resultados iniciales cuando existen. El contador describe la categoría y el rango real mostrado.
2. «Ver todos», Anterior/Siguiente y volver del grafo conservan consulta y categoría; al cambiar el texto se reinicia la página.
3. No se repite una entidad dentro de la página; conservar MBID + entidad y no fusionar homónimos.
4. Carga, vacío, error y reintento no se confunden entre categorías. Si una fuente falla, los resultados de la otra se conservan y el total fallido no figura como cero.
5. Probar navegación por teclado, respuestas tardías, última página y errores sin perder los resultados ya visibles.

### MK-009 — Relevancia verificable de la búsqueda

Estado: propuesto. Prioridad: MVP. Después de MK-008.

Resultado: que una consulta conocida permita reconocer pronto la entidad buscada.

- Armar un conjunto pequeño de búsquedas reales: Yes, Gustavo Cerati, Soda Stereo, Yesterday, nombres con tildes y homónimos. Registrar entidad esperada por MBID, categoría y posición observada antes/después.
- Evaluar consulta y puntuación de MusicBrainz por índice; verificar capacidades vigentes antes de modificar el ranking. Probar coincidencia exacta de nombre y alias documentados; no introducir una supuesta popularidad sin fuente.
- No prometer ranking global a partir de reordenar diez resultados locales. Si se priorizan coincidencias exactas mediante otra consulta, definir deduplicación, paginación y coste dentro del límite compartido.

Criterios: la banda Yes exacta aparece entre las primeras cinco sugerencias de artistas/bandas; registrar resultados del resto del conjunto, explicar ambigüedades y no degradar casos existentes sin revisión. Verificar puntuación por índice, latencia y cantidad de solicitudes. La política final se documenta con la evidencia de esta prueba.

### MK-010 — Identificación consistente y metadatos útiles

Estado: propuesto. Prioridad: MVP. Puede entregarse sin proveedor de imágenes.

Resultado: entender qué representa cada fila, incluso sin foto ni metadatos completos.

- Icono estable por tipo (persona, grupo, composición), nombre destacado y etiqueta textual siempre visible. Usar «Composición» como aclaración de canción; no depender solo de color o icono.
- Segunda línea: desambiguación y país para artistas/bandas; desambiguación e idioma para obras. Mantener alturas y espaciados coherentes sin reservar filas vacías para cada dato ausente.
- Revisar datos adicionales disponibles en la respuesta de búsqueda (por ejemplo área o fechas) y conservar únicamente los que ayuden a distinguir entidades. No consultar detalles para cada fila.
- Unificar el modelo de presentación usado por lista, nodo y panel. País asociado no significa nacionalidad y el idioma de una obra no determina un país.
- Auditar las banderas existentes con país válido, ausente, código especial y recurso faltante. Mantener nombre textual y fallback de ubicación; no derivar bandera de idioma o nombre.
- Mostrar «Información limitada» cuando no haya datos para desambiguar. Créditos de compositor o intérprete solo con relación explícita y rol correcto; el texto libre no acredita relaciones.

Criterios: reconocer el tipo sin imagen; homónimos distinguibles con los datos disponibles; faltantes honestos; banderas y nombres legibles en Windows, móvil y ambos temas; mismo significado de los datos en búsqueda y grafo. Registrar un caso real con país y otro sin él para distinguir un fallo de render de una ausencia en la fuente.

### MK-011 — Inicio y resultados compactos y centrados

Estado: implementado para prueba; pendiente revisión visual en tamaños objetivo. Prioridad: MVP. Entrega pequeña independiente.

Resultado: reducir el recorrido horizontal entre nombre, tipo y contexto.

- Referencia aportada: [uiFromMars](https://uifrommars.com/). Tomar la intención de contenido editorial centrado y ancho contenido; los valores siguientes son propuestas para Musikit, no medidas extraídas de esa web. Se consultó su contenido; no se hizo comparación visual en navegador.
- Probar contenedor de inicio de hasta 1120 px y buscador/lista de hasta 800 px, centrados; márgenes laterales de 16–24 px en móvil. Alinear título, campo y resultados en un mismo eje.
- Reducir tamaño y espacio del hero al buscar; mantener filas compactas con texto alineado a la izquierda, controles cómodos y nombres largos legibles.
- Aplicar el límite al inicio/búsqueda. El lienzo del grafo necesita su propia distribución adaptable para conservar espacio de exploración.

Criterios: revisión a 360, 768, 1440 y 1920 px; sin scroll horizontal; resultados centrados; texto y foco sin recortes; teclado, zoom al 200 %, temas y movimiento reducido. Comparar capturas antes/después con el usuario para ajustar densidad.

### MK-012 — Fotos de artistas y bandas mediante TheAudioDB

Estado: acordado para el backlog; pendiente implementación. Prioridad: MVP.

Resultado: reconocer artistas y bandas mediante miniaturas reales en los resultados, conservando MusicBrainz como fuente de identidad.

- Integrar TheAudioDB desde el backend mediante lookup por MBID de artista (`artist-mb.php?i={mbid}`), documentado en su [API oficial](https://www.theaudiodb.com/free_music_api). No asociar imágenes solo por coincidencia de nombre.
- Mostrar primero los resultados y solicitar imágenes únicamente para las entidades visibles. Cargar miniaturas de forma independiente, reservar su espacio y mantener el icono de tipo cuando falten o fallen, sin ocultar nombre, etiqueta ni metadatos.
- Conservar URL, proveedor e identidad asociada en el contrato de imagen; reutilizar la asociación al seleccionar la entidad y mostrarla en su nodo/panel.
- Cachear asociaciones y ausencias por proveedor + MBID con expiración; deduplicar solicitudes concurrentes y limitar la cola. Una respuesta tardía no debe asignarse a otra fila cuando cambie la consulta.
- Configurar el acceso en el backend y documentar límites, atribución y condiciones vigentes. La documentación consultada el 30/10/2026 publica 30 solicitudes por minuto para el acceso gratuito; verificar el límite al implementar y respetarlo también durante paginación y reintentos.
- Validar cobertura real con Yes, Soda Stereo y Gustavo Cerati, además de un homónimo y una entidad sin imagen. Registrar aciertos, ausencias, latencia y cantidad de consultas; no prometer cobertura completa.

Criterios de aceptación:
1. Las fotos disponibles corresponden al MBID solicitado; la prueba con homónimos no intercambia identidades.
2. La búsqueda y selección funcionan antes de cargar imágenes y ante ausencia, error de imagen, timeout o límite del proveedor.
3. Repetir una búsqueda reutiliza la caché; las solicitudes simultáneas de una misma entidad se deduplican y la cola respeta el límite configurado.
4. Miniaturas sin saltos de distribución, con alternativa accesible coherente con el nombre visible; comprobar móvil, temas y navegación por teclado.
5. Registrar resultados de la muestra real y probar respuesta tardía, fallo del proveedor y ausencia de imagen. Documentar configuración y ejecutar build, lint y pruebas pertinentes.

### MK-013 — Portadas de versiones con identidad comprobada

Estado: propuesto; pendiente implementación. Prioridad: posterior al MVP. Incremento separado de MK-012.

Resultado: ilustrar canciones con una portada de una versión relacionada e identificar su intérprete y disco.

- Resolver composición → grabación → lanzamiento mediante relaciones documentadas. Una composición no tiene una única portada; definir qué versión se muestra y explicitarlo en la interfaz.
- Integrar [Cover Art Archive](https://musicbrainz.org/doc/Cover_Art_Archive/API) por MBID de lanzamiento, usando sus miniaturas. No buscar portadas únicamente por título.
- Reutilizar carga independiente, caché y fallback de MK-012, conservando también los identificadores de grabación y lanzamiento que justifican la asociación.
- Mantener el icono de composición si no se puede resolver una versión o no existe portada. Incorporar grabaciones como categoría de búsqueda requiere una decisión de producto adicional; este ticket no cambia el significado actual de canción.

Criterios de aceptación: portada trazable a un lanzamiento relacionado, versión e intérprete explícitos, comprobación de una obra con varias interpretaciones y otra sin portada, y selección funcional ante ausencia o fallo. Registrar cobertura y coste de consultas sin bloquear la búsqueda inicial.

### Orden y validación propuestos

1. MK-011 para compactar la vista y MK-008 para separar/recorrer resultados, trabajando un ticket por vez.
2. MK-010 para reconocer entidades y MK-012 para incorporar fotos al MVP; MK-009 para evaluar y mejorar relevancia con ejemplos comprobables.
3. Completar validación de MK-005 e implementar MK-006 para cerrar el recorrido mínimo de descubrimiento.
4. MK-007 y MK-013 como siguientes incrementos.

Revisión documental: se contrastaron contrato, normalización, mezcla de resultados, componentes de metadatos y estilos actuales. No se modificó la aplicación ni se ejecutaron pruebas de UI en esta revisión; los criterios anteriores son verificaciones futuras, no resultados obtenidos.

### Primera implementación para probar — 30/10/2026

- MK-011: contenedor de inicio de 1120 px, contenido centrado de 800 px, titular y controles más compactos y filas con nombres de 20 px. El grafo conserva su ancho anterior.
- MK-008: grupos con cinco sugerencias, totales independientes, selección de categoría, Ver todos y páginas de veinte con Anterior/Siguiente. Consulta, categoría y offset forman la clave de caché y se conservan al volver del grafo en la sesión; cambiar el texto reinicia la vista. Un fallo de una fuente conserva los resultados exitosos de la otra y se comunica como cobertura incompleta.
- Adelanto de MK-010: iconos de persona/grupo/composición y etiqueta explícita Composición. El resto del ticket, el ranking MK-009 y las fotos MK-012 siguen pendientes.
- Pruebas agregadas: offsets inválidos, última página, fallo parcial de una fuente, debounce sin sobrescribir categoría/página y controles de categoría/paginación renderizados. Se agregó el alias de la aplicación a Vitest para probar componentes reales.
- Validación final: build y lint pasan; 17 pruebas pasan (7 de backend y 10 de hooks/componentes). Continúa el aviso existente de bundle mayor a 500 kB.
- HTTP real a través de Vite: Yes devuelve 174 artistas y 845 obras en esta consulta; grupos de cinco. Categoría artistas: primera página con veinte y última con catorce, sin siguiente página. La consulta con offset 20 devolvió 503 de MusicBrainz en dos intentos; ese caso se comunica como error reintentable. No se afirma validación real exitosa de todas las páginas.
- Pendiente: revisión visual móvil/escritorio, temas, zoom y foco con teclado. Browser no pudo navegar por un error interno (`constraints`); las pruebas de componentes no sustituyen esa revisión. Durante carga/cambio de página se oculta la lista anterior; conservarla y gestionar el foco durante esa transición queda como ajuste pendiente de MK-008.

### Ajuste de física nativa — 31/10/2026

Se retira el arrastre rígido de vecinos y la fijación automática implementados en la primera migración. El movimiento usa los valores nativos de amortiguación, repulsión, centrado y enfriamiento de force-graph, como el ejemplo medium-graph. Solo se conserva la distancia de enlace de 100 para los iconos/etiquetas. La red responde mediante fuerzas y sigue acomodándose al soltar; Reacomodar reactiva la simulación. Movimiento reducido y expansión manual se conservan. Se actualizaron las pruebas para comprobar que la aplicación no modifica ni fija a los vecinos durante el arrastre. La suavidad visual requiere validación en navegador.
