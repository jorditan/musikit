# MusiKit

Explorador de conexiones musicales con React, TypeScript, Vite, shadcn/ui y MusicBrainz.

## Desarrollo

Requiere Node.js 24.16 o posterior de la rama 24 y npm. El backend usa el soporte nativo de TypeScript de Node.

```sh
npm install
npm run dev
```

El comando inicia el frontend (Vite, normalmente puerto 5173) y la API (puerto 3001). Abrí la URL que imprime Vite. Si quedó una instancia de Vite abierta, detenela primero para no probar una versión anterior.

No necesitás una API key. Opcionalmente copiá `.env.example` a `.env`. Antes de publicar configurá `MUSICBRAINZ_USER_AGENT` con una URL de proyecto o contacto real. Si cambiás `API_PORT`, actualizá también el destino del proxy en `vite.config.ts`.

## Primera entrega integrada

Ingresá un nombre en el buscador único. La búsqueda incluye artistas, bandas y canciones. Después de una pausa de 650 ms al escribir aparecen hasta diez coincidencias debajo del formulario. Buscar o Enter permite enviar sin esperar. Cada opción muestra su tipo y metadatos disponibles y se puede seleccionar con clic o teclado (Tab y Enter).

La selección conserva el MBID y la entidad como punto de entrada para el futuro grafo. La selección abre una página de grafo con React Flow y transición Motion. Todavía no consulta relaciones. Vaciar el campo de nombre borra selección y resultados, cancela la petición activa y devuelve la pantalla a su estado inicial. Cambiar el texto oculta inmediatamente las coincidencias anteriores.

- Artista: `artist` filtrado por `person`.
- Banda: `artist` filtrado por `group`.
- Canción: composición `work`, no grabación `recording`.

Se conservan MBID y tipo de entidad. Los metadatos faltantes no se completan con otras peticiones. Los resultados indican si son una muestra parcial; el orden proviene de la búsqueda de MusicBrainz y no representa popularidad.

## API local

`GET /api/search?name=Gustavo%20Cerati&type=artist`

Sin `type`, o con `type=all`, se combinan artistas (personas y grupos) y obras; internamente son dos consultas bajo la misma cola y límite. Se intercalan hasta diez resultados conservando el orden de cada fuente, sin afirmar una relevancia global comparable. Los filtros `artist`, `band` y `song` siguen disponibles en la API. Nombre obligatorio de hasta 200 caracteres, sin contar espacios exteriores. Respuesta: `query`, `results`, `total`, `limit`, `partial`. Cada resultado incluye `id`, `entity`, `name`, `kind`, `country`, `disambiguation` y `languages`.

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

1. Buscar Gustavo Cerati / Artista, Soda Stereo / Banda y Yesterday / Canción.
2. Buscar un nombre inexistente y enviar solo espacios.
3. Detener la API, buscar, comprobar el error; reiniciarla y pulsar Reintentar búsqueda.
4. Escribir Yes, esperar la previsualización y elegir una coincidencia. Cambiar el texto y comprobar que se ocultan las opciones anteriores. Limpiar durante la espera o una petición y comprobar que no reaparecen resultados tardíos.
5. Revisar claro, oscuro, sistema, recarga, teclado y ancho móvil.

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

Seleccionar una coincidencia abre `/graph/{entity}/{id}` con el nodo central y los metadatos disponibles. React Flow permite arrastrar el nodo, desplazar el lienzo y usar zoom/centrar. Seleccionar el nodo o pulsar el botón de información abre el panel con enlace a MusicBrainz. Volver a buscar conserva la consulta en la sesión actual; atrás/adelante del navegador también cambia de página.

Los datos del nodo se conservan en la entrada del historial del navegador, incluso al recargarla. Una URL abierta sin ese estado muestra el buscador. Aún no se consultan relaciones: el primer grafo tiene un nodo real y cero conexiones. La transición entre páginas y la entrada del nodo usan Motion respetando movimiento reducido.
