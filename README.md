# API de Pastelería

API REST para administrar los productos y categorías de una pastelería. Permite listar, crear, actualizar y eliminar productos y categorías, además de hacer un respaldo de la base de datos.

Además de la API HTTP, el proyecto levanta un **servidor de sockets TCP en el puerto 6061** que acepta dos comandos:

- `{insert:{...}}` — inserta un producto nuevo. Ejemplo:
  `{insert:{"nombre":"Cupcake","precio":35,"stock":20,"categoriaId":1}}`
- `{get:<id>}` — devuelve un producto por su id. Ejemplo: `{get:1}`

Las respuestas tienen el formato `{status:<código>,data:<json>}`.

**URL pública:** http://3.16.159.47/api/... (por ejemplo http://3.16.159.47/api/productos)

La lista completa de endpoints con ejemplos está en [docs/ENDPOINTS.md](docs/ENDPOINTS.md).

## Arquitectura

- La API está hecha con **Node.js y Express**.
- Los datos se guardan en **SQLite**, usando la librería **better-sqlite3**. La base de datos es un solo archivo (`database.db`).
- La aplicación corre dentro de un **contenedor Docker**.
- El contenedor está desplegado en una instancia **AWS EC2 con procesador ARM64**. El puerto 80 es para la API HTTP y el 6061 para el servidor TCP.
- Hay un pipeline de **CI/CD en GitHub Actions**: cada vez que se hace push a `main`, se corren las pruebas automáticamente, se construye la imagen Docker, se sube a **Docker Hub** y después se despliega en la EC2 conectándose por SSH.

```
push a main → GitHub Actions → pruebas → imagen Docker → Docker Hub → EC2 (docker pull + docker run)
```

## Estructura de carpetas

```
src/        Código de la aplicación
  index.js      Punto de entrada: levanta el servidor HTTP y el TCP
  app.js        Configuración de Express y rutas
  db.js         Conexión a SQLite y datos iniciales
  dbConfig.js   Ruta de la base de datos y creación de tablas
  tcpServer.js  Servidor de sockets TCP ({insert:} y {get:})
  routes/       Rutas de categorías y productos
  utils/        Funciones de apoyo (formato de respuestas)
scripts/    Script de demostración del servidor TCP (demo-socket.js)
docs/       Documentación de los endpoints (ENDPOINTS.md)
tests/      Pruebas automatizadas con Jest y Supertest
```

## Cómo correrlo localmente

Clonar el repositorio e instalar dependencias:

```bash
git clone https://github.com/Cinthya-Garcia25/pasteleria-api-cicd.git
cd pasteleria-api-cicd
npm install
```

Correr en modo desarrollo (se reinicia solo al guardar cambios):

```bash
npm run dev
```

O correrlo normal:

```bash
node src/index.js
```

Por defecto la API queda en http://localhost:3000/api/productos y el servidor TCP en el puerto 6061.

Correr las pruebas:

```bash
npm test
npm test -- --coverage   # con reporte de cobertura
```

Probar el servidor TCP con el script de demostración (con la app ya corriendo):

```bash
node scripts/demo-socket.js
```

### Con Docker

```bash
docker build -t pasteleria-api .
docker run -d -p 80:80 -p 6061:6061 --name webapp-container pasteleria-api
```

Dentro del contenedor la API usa el puerto 80, así que queda en http://localhost/api/productos.

## Variables y configuración

La base de datos es un **archivo SQLite local** (`database.db`) que se crea solo la primera vez que arranca la app, con algunas categorías y productos de ejemplo. No hace falta instalar ningún servidor de base de datos.

No hay variables de entorno obligatorias. Las que existen son opcionales:

| Variable | Para qué sirve | Valor por defecto |
|---|---|---|
| `PORT` | Puerto de la API HTTP | `3000` (en Docker es `80`) |
| `TCP_PORT` | Puerto del servidor TCP | `6061` |
| `NODE_ENV` | Si vale `test`, usa la base `test-database.db` (lo usan las pruebas) | — |
| `TCP_HOST` | Servidor al que se conecta `scripts/demo-socket.js` | `localhost` |

> Nota: como la base de datos vive dentro del contenedor, cada despliegue crea un contenedor nuevo y los datos vuelven a los de ejemplo.

## Pipeline de CI/CD

El workflow está en [.github/workflows/main.yml](.github/workflows/main.yml) y tiene tres jobs que se ejecutan en orden:

1. **test** — Instala las dependencias con `npm ci` y corre las pruebas con cobertura. Se ejecuta en cada push y en cada pull request a `main`. Si alguna prueba falla, el pipeline se detiene.
2. **build-and-push** — Construye la imagen Docker para ARM64 (la arquitectura de la EC2) y la sube a Docker Hub con dos tags: `latest` y el hash del commit. Solo corre en push a `main` y si las pruebas pasaron.
3. **deploy** — Se conecta por SSH a la EC2, descarga la imagen nueva, detiene y borra el contenedor anterior y levanta el nuevo. Solo corre si el job anterior terminó bien.

### Secrets necesarios

Se configuran en GitHub en *Settings → Secrets and variables → Actions*:

| Secret | Qué es |
|---|---|
| `DOCKERHUB_USERNAME` | Usuario de Docker Hub |
| `DOCKERHUB_TOKEN` | Access token de Docker Hub (no la contraseña) |
| `EC2_HOST` | IP o DNS público de la instancia EC2 |
| `EC2_USER` | Usuario para entrar por SSH a la EC2 |
| `EC2_SSH_KEY` | Contenido de la llave privada `.pem` para el SSH |
