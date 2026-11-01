# MusiKit

Explorador de conexiones musicales con React, TypeScript, Vite, shadcn/ui y MusicBrainz.

## Motor del grafo — actualizado el 31/10/2026

Se reemplazó React Flow/XYFlow por [force-graph](https://github.com/vasturiano/force-graph) 1.52.0. El paquete nativo dibuja Canvas 2D y ejecuta la simulación de fuerzas; React administra datos, selección y expansiones. `force-graph-canvas.tsx` integra el motor y `force-graph-model.ts` conserva identidades de simulación sin mutar el estado de React.

- Clic solo selecciona. El panel solicita explícitamente discos, canciones, bandas/integrantes o artistas, con paginación independiente.
- Los nodos aparecen cerca del origen; la fuerza de enlace tiene una distancia objetivo de 100 unidades. El arrastre nativo deja que los vecinos respondan a las fuerzas sin trasladarlos rígidamente ni fijarlos al soltar. **Reacomodar** reactiva la simulación; **Centrar** ajusta el encuadre.
- Reducción visual general: A → B → C permite omitir A → C. No se eliminan entidades ni relaciones originales, y se preserva alcanzabilidad incluso con ciclos. Esto organiza la vista, no infiere créditos musicales.
- Se mantienen iconos por tipo, panel, lista HTML accesible, controles de zoom, temas y movimiento reducido. La simulación y los observadores se destruyen al salir.
- `GET /api/relations` admite `release-group` para discos; `category=members` consulta bandas de un artista o integrantes de una banda. Los discos agrupan reediciones y sus canciones provienen de una edición oficial.

Validación automatizada de la migración: selección sin expansión, continuidad de posiciones, vecinos directos, limpieza del motor, movimiento reducido y contratos anteriores. Pendiente validación visual real: el navegador integrado no pudo navegar por un error interno (`constraints`).

## Desarrollo

Requiere Node.js 24.16 o posterior de la rama 24 y npm. El backend usa el soporte nativo de TypeScript de Node.

```sh
npm install
npm run dev
```

El comando inicia el frontend (Vite, normalmente puerto 5173) y la API (puerto 3001). Abrí la URL que imprime Vite. Si quedó una instancia de Vite abierta, detenela primero para no probar una versión anterior.

No necesitás una API key. Opcionalmente copiá `.env.example` a `.env`. Antes de publicar configurá `MUSICBRAINZ_USER_AGENT` con una URL de proyecto o contacto real. Si cambiás `API_PORT`, actualizá también el destino del proxy en `vite.config.ts`.

## Primera entrega integrada

Ingresá un nombre en el buscador único. Después de una pausa de 650 ms aparecen dos grupos: Artistas y bandas, y Canciones · composiciones, con hasta cinco sugerencias y un total propio por grupo. Buscar o Enter permite enviar sin esperar. «Ver todos» abre esa categoría con páginas de veinte y controles Anterior/Siguiente; los botones Todo, Artistas y bandas y Canciones permiten cambiar de vista. Cada opción muestra un icono de tipo, etiqueta y metadatos disponibles, y se puede seleccionar con clic o teclado (Tab y Enter).

El inicio tiene un contenedor centrado de hasta 1120 px y contenido de hasta 800 px; el grafo conserva su lienzo más amplio. El footer queda al pie de pantalla cuando hay poco contenido y después de los resultados cuando crecen. El vinilo es un detalle pequeño. Se cargan fotos de artistas y portadas de versiones documentadas por separado de los resultados.

La selección conserva el MBID y la entidad y abre un grafo con force-graph (Canvas 2D y simulación de fuerzas). «Explorar conexiones» consulta relaciones reales y permite expandir los nodos nuevos. Vaciar el campo de nombre borra selección y resultados, cancela la petición activa y devuelve la pantalla a su estado inicial. Cambiar el texto oculta inmediatamente las coincidencias anteriores.

- Artista: `artist` filtrado por `person`.
- Banda: `artist` filtrado por `group`.
- Canción: composición `work`, no grabación `recording`.

Se conservan MBID y tipo de entidad. Los metadatos faltantes no se completan con otras peticiones. Los resultados indican si son una muestra parcial; el orden proviene de la búsqueda de MusicBrainz y no representa popularidad.

## API local

`GET /api/search?name=Gustavo%20Cerati&type=artist`

Sin `type`, o con `type=all`, se consultan artistas y obras bajo la misma cola y límite de frecuencia. La respuesta agrega `groups`: cada grupo tiene `type`, `total`, `results` y, si falla, `error`. El total de una categoría fallida es `null`, no cero. Se conservan hasta cinco sugerencias por grupo y el orden de la fuente. `results` contiene los grupos concatenados; `total` suma solo los totales conocidos y no debe presentarse como completo si alguna categoría falló.

`type=artists` consulta artistas y bandas juntos; `artist` (personas), `band` (grupos) y `song` (obras) siguen disponibles. Las categorías individuales devuelven páginas de veinte; `offset` indica la posición inicial (entero de 0 a 100000). Ejemplo: `/api/search?name=Yes&type=artists&offset=20`. La vista `all` siempre es una previsualización inicial, no una página mixta. Nombre obligatorio de hasta 200 caracteres, sin contar espacios exteriores. Respuesta: `query`, `results`, `total`, `limit`, `partial`; en una categoría `partial` indica si quedan resultados después de la página actual. Cada resultado incluye `id`, `entity`, `name`, `kind`, `country`, `disambiguation` y `languages`.

Errores JSON con campo `error`: 400 para entrada inválida, 502 para fallo de conexión/respuesta de la fuente, 503 para saturación o indisponibilidad temporal. Reintentos manuales desde la interfaz; sin reintentos automáticos contra MusicBrainz.

La API coordina las solicitudes en una cola por proceso con un mínimo de 1100 ms entre inicios y timeout de 12 segundos por llamada. El máximo de diez solicitudes pendientes evita una cola ilimitada. Ejecutar una sola instancia: varias instancias necesitarían coordinación compartida antes de desplegarse. TanStack Query conserva resultados cinco minutos en el navegador; no hay Redis ni persistencia.

## Verificación

```sh
npm run build
npm run lint
npm test
```

Para revisar el build local, ejecutar `npm run start:api` en una terminal y `npm run preview` en otra. El proxy de preview conecta con el mismo backend. Para un despliegue público, servir `dist` y enrutar `/api` al proceso Node mediante el hosting/reverse proxy elegido; el backend no sirve archivos estáticos. El hosting todavía no está elegido.

Prueba manual:

1. Buscar Yes y comprobar ambos grupos y sus contadores. Pulsar Ver todos en artistas, avanzar y retroceder una página. Probar también Gustavo Cerati, Soda Stereo y Yesterday.
2. Buscar un nombre inexistente y enviar solo espacios.
3. Detener la API, buscar, comprobar el error; reiniciarla y pulsar Reintentar búsqueda.
4. Escribir Yes, esperar la previsualización y elegir una coincidencia. Cambiar el texto y comprobar que se ocultan las opciones anteriores. Limpiar durante la espera o una petición y comprobar que no reaparecen resultados tardíos.
5. Revisar claro, oscuro, sistema, recarga, teclado y ancho móvil.
6. Desde una categoría paginada, abrir un resultado y volver: comprobar que conserva consulta, categoría y página. Cambiar el texto: debe volver a Todo. Ante un error temporal de MusicBrainz, usar Reintentar búsqueda o cambiar de categoría.

## Organización

- `server/`: servidor HTTP, cliente MusicBrainz, validación y normalización.
- `shared/search.ts`: contrato TypeScript entre API y frontend.
- `src/App.tsx`: entrada que renderiza la página de exploración.
- `src/pages/explore/`: composición de la página, hero, sección explicativa y hooks de coordinación y movimiento.
- `src/components/music-search/`: vista del buscador, hook de estado/consultas y cliente HTTP.
- `src/components/theme-selector/`: selector de apariencia y hook de tema.
- `src/components/layout/`: cabecera, pie y estructura compartida.
- `src/components/ui/`: componentes shadcn.
- `BACKLOG.md`: alcance, criterios y evidencia de cada ticket.

La pantalla inicial prioriza hero y buscador. «Cómo funciona» desplaza hacia una sección secundaria animada con Motion (`motion/react`), respetando movimiento reducido. Al enviar una búsqueda válida se compacta el hero y se oculta la explicación para priorizar resultados, errores o estado vacío. El estado de búsqueda vive en el hook de la página, sin agregarse a `App`.

[Documentación de búsqueda de MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API/Search).


## Primera página de grafo

Seleccionar una coincidencia abre `/graph/{entity}/{id}` con el nodo central y los metadatos disponibles. force-graph permite arrastrar nodos con respuesta física de sus conexiones, desplazar el lienzo y usar zoom, Centrar y Reacomodar. Seleccionar el nodo o pulsar el botón de información abre el panel con enlace a MusicBrainz. Volver a buscar conserva la consulta en la sesión actual; atrás/adelante del navegador también cambia de página.

Los datos del nodo inicial se conservan en la entrada del historial del navegador, incluso al recargarla. Una URL abierta sin ese estado muestra el buscador. El grafo se expande por acción explícita; las expansiones viven en memoria y se reinician al salir o recargar. Motion mantiene las transiciones de página. El lienzo calcula la distribución sin animación visible cuando se solicita movimiento reducido.

## Imágenes y expansión del grafo

- `GET /api/artwork?entity=artist|work|recording|release-group&id={MBID}` devuelve `{ artwork: null | { url, source, sourceUrl, caption, recordingId?, releaseId? } }`. Ausencia es null; fallos del proveedor son errores reintentables. TheAudioDB se consulta por MBID exacto. Para obras se resuelve una grabación documentada y se prueban hasta tres lanzamientos en Cover Art Archive. La portada es de esa versión, no una imagen canónica de la composición.
- `GET /api/relations?entity=artist|work|recording|release-group&id={MBID}&offset=0` devuelve `nodes`, `edges`, `total` y `nextOffset`. Cada tanda incluye hasta doce relaciones; las conexiones conservan dirección y tipo de la fuente en el modelo y en la lista accesible. El alcance incluye relaciones entre artistas, obras y grabaciones, más créditos explícitos de intérprete en grabaciones. Tipos sin traducción conservan el nombre de MusicBrainz.
- Fotos: clave pública de desarrollo de TheAudioDB `123` por defecto; `THEAUDIODB_API_KEY` permite usar otra clave en el backend. Consultar las condiciones de los proveedores antes de publicar.
- Detalles comparten la cola de MusicBrainz con la búsqueda; caché de una hora, hasta 300 entradas y deduplicación de consultas simultáneas. Imágenes: caché de 24 horas (ausencias: diez minutos), hasta 500 entradas y máximo 24 resoluciones pendientes. Portadas en serie para no saturar la cola; TheAudioDB tiene su propia cola con 2100 ms entre consultas. Los errores no se cachean como ausencias. Cachés por proceso, sin persistencia.
- Los resultados visibles solicitan imágenes mediante IntersectionObserver. El texto y la selección funcionan aunque la imagen tarde o falte. Al cerrar una vista se cancela su petición cliente; una resolución compartida ya iniciada en el servidor puede terminar y alimentar la caché.
- El panel permite expandir el nodo seleccionado, cargar la siguiente tanda y reintentar fallos. Se conservan posiciones y se deduplican identidades/conexiones. La lista bajo el lienzo permite seleccionar nodos y leer relaciones sin depender del arrastre.

Recorrido: buscar Yesterday → elegir la composición con desambiguación de The Beatles → Explorar conexiones → seleccionar John Lennon → Explorar conexiones. Probar Cargar más conexiones en la obra y arrastrar un nodo antes de expandir otro. Probar Pink Floyd para una foto de artista; la primera carga puede tardar y la cobertura de imágenes es parcial.

Fuentes: [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API), [TheAudioDB](https://www.theaudiodb.com/free_music_api), [Cover Art Archive](https://musicbrainz.org/doc/Cover_Art_Archive/API).
