# MusiKit

Explorá conexiones entre artistas, bandas, discos y canciones en un grafo interactivo.

Buscá un nombre, seleccioná un resultado y elegí qué conexiones descubrir desde el panel. Podés mover los nodos, acercarte y seguir explorando a tu ritmo.

## Ejecutar localmente

Requiere **Node.js 24.16 o posterior de la rama 24** y npm.

```sh
npm install
npm run dev
```

Abrí la dirección que muestra Vite (normalmente `http://localhost:5173`). El comando también inicia la API local.

La configuración opcional está en [`.env.example`](.env.example).

## Comandos

```sh
npm test          # Pruebas
npm run lint      # Revisar el código
npm run build     # Generar el build
```

## Tecnologías y datos

React · TypeScript · Vite · Node.js · force-graph.

Datos de **MusicBrainz**, fotos de **TheAudioDB** y portadas de **Cover Art Archive**. La cobertura depende de cada fuente.

Proyecto en desarrollo. Próximos pasos en [BACKLOG.md](BACKLOG.md).
