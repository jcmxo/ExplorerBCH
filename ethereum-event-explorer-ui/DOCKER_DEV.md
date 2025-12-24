# Docker - Desarrollo Frontend Next.js

## Construir la imagen

Desde el directorio `ethereum-event-explorer-ui/`:

```bash
docker build -t ethereum-frontend-dev .
```

## Ejecutar el contenedor

Para desarrollo con hot reload (montando el código como volumen):

```bash
docker run -d \
  --name ethereum-frontend \
  -p 3000:3000 \
  -v $(pwd):/app \
  -v /app/node_modules \
  -v /app/.next \
  ethereum-frontend-dev
```

**Explicación de los volúmenes:**
- `-v $(pwd):/app`: Monta el código fuente para hot reload
- `-v /app/node_modules`: Evita sobrescribir node_modules del contenedor
- `-v /app/.next`: Evita sobrescribir la caché de Next.js

## Comando para desarrollo

Una vez que el contenedor esté corriendo, el servidor de desarrollo Next.js estará disponible en:

**http://localhost:3000**

Los cambios en el código se reflejarán automáticamente gracias al hot reload.

## Detener el contenedor

```bash
docker stop ethereum-frontend
docker rm ethereum-frontend
```

## Ver logs

```bash
docker logs -f ethereum-frontend
```

