# Backlog de Musikit

Trabajamos con entregables pequeños: implementar un ticket, probar el flujo completo y ajustar antes de tomar el siguiente. Este backlog evoluciona con lo que aprendamos; no es una especificación cerrada.

## Estado actual

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
