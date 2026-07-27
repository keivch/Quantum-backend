# Quantum Backend

Backend desarrollado con Node.js, Express y Mongoose para la gestión de espacios, reservas y usuarios.

## Descripción y arquitectura

Quantum es una API REST para administrar espacios de coworking, reservas y usuarios con control de acceso por roles. Se comunica con el frontend React y persiste datos en MongoDB.

```
Cliente (React)  →  Express (API REST)  →  Mongoose  →  MongoDB
                         ↓
                    Swagger UI (/api/docs)
```

**Capas del backend:**

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Rutas | `routes/` | Definición de endpoints y middleware de auth |
| Controladores | `controllers/` | Validación de entrada y respuestas HTTP |
| Servicios | `services/` | Lógica de negocio (conflictos de reserva, permisos, etc.) |
| Modelos | `models/` | Esquemas Mongoose (User, Space, Reservation) |
| Middleware | `middleware/` | Autenticación JWT, manejo centralizado de errores |

**Autenticación:** login con email/contraseña; contraseñas hasheadas con bcrypt; tokens JWT firmados con `JWT_SECRET`. Rutas protegidas exigen rol `admin` o `operator` según el caso.

**Despliegue:** Docker Compose levanta MongoDB, backend (Node) y frontend (nginx) como servicios coordinados. El perfil `seed` carga datos de ejemplo sin arrancar el stack completo de forma permanente.

## Requisitos

- Node.js 20+
- MongoDB 7+ (solo para ejecución local sin Docker)
- Docker y Docker Compose (opcional, para contenedores)

## Ejecución con Docker (recomendado)

El archivo `docker-compose.yml` levanta **MongoDB**, **backend** y **frontend**. Ambos repositorios deben estar en la misma carpeta padre:

```
git/
├── Quantum backend/
└── Quantum frontend/
```

### 1. Levantar el entorno

Desde la carpeta del backend:

```bash
docker compose up --build
```

O con el script npm:

```bash
npm run docker:up
```

### 2. Cargar datos iniciales

Con los contenedores en marcha, carga usuarios, espacios y reservas de ejemplo:

```bash
npm run docker:seed
```

Equivalente manual:

```bash
docker compose --profile seed run --rm seed
```

El seed crea:

| Recurso | Detalle |
|---------|---------|
| Usuarios | 1 administrador y 1 operador |
| Espacios | 5 espacios activos (salas, escritorios y phone booth) |
| Reservas | 20 reservas con distintas fechas, espacios y estados |

Credenciales por defecto (configurables en `.env`):

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@quantum.com` | `Admin123!` |
| Operador | `operador@quantum.com` | `Operador123!` |

Variables opcionales: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `OPERATOR_EMAIL`, `OPERATOR_PASSWORD`.

### 3. URLs y puertos

| Servicio  | URL / Puerto              | Descripción              |
|-----------|---------------------------|--------------------------|
| Frontend  | http://localhost:3000     | Interfaz web (nginx)     |
| Backend   | http://localhost:5000     | API REST                 |
| Health    | http://localhost:5000/api/health | Estado del servidor y MongoDB |
| MongoDB   | *(solo red interna)*    | Volumen `quantum_mongo_data` |

### 4. Variables de entorno (Docker)

Copia la plantilla opcional y ajusta los valores:

```bash
cp .env.docker.example .env
```

| Variable         | Descripción                                      |
|------------------|--------------------------------------------------|
| `JWT_SECRET`     | Clave para firmar tokens JWT                     |
| `JWT_EXPIRES_IN` | Expiración del token (ej. `24h`)                |
| `ADMIN_EMAIL`    | Email del admin para el seed                     |
| `ADMIN_PASSWORD` | Contraseña del admin para el seed                |
| `OPERATOR_EMAIL` | Email del operador para el seed                  |
| `OPERATOR_PASSWORD` | Contraseña del operador para el seed          |
| `VITE_API_URL`   | URL de la API usada al construir el frontend     |

> **Nota:** No uses secretos reales en el repositorio. Los valores por defecto son solo para desarrollo.

### 5. Reiniciar o limpiar el entorno

```bash
# Detener contenedores (conserva datos de MongoDB)
npm run docker:down

# Detener y eliminar volúmenes (borra todos los datos de MongoDB)
npm run docker:clean

# Reiniciar desde cero
npm run docker:clean && npm run docker:up && npm run docker:seed
```

---

## Ejecución local (sin Docker)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quantum-backend
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_muy_segura_cambiar_en_produccion
JWT_EXPIRES_IN=24h
ADMIN_EMAIL=admin@quantum.com
ADMIN_PASSWORD=Admin123!
OPERATOR_EMAIL=operador@quantum.com
OPERATOR_PASSWORD=Operador123!
```

### 3. Iniciar MongoDB

Asegúrate de tener MongoDB corriendo en `localhost:27017` (instalación local, MongoDB Atlas, etc.).

### 4. Cargar datos iniciales

```bash
npm run seed
```

Crea 2 usuarios (admin y operador), 5 espacios activos y 20 reservas de ejemplo. Ver credenciales en la sección Docker arriba.

### 5. Iniciar el servidor

```bash
# Desarrollo (auto-recarga)
npm run dev

# Producción
npm start
```

El backend estará disponible en http://localhost:5000.

### 6. Frontend en local

En el repositorio del frontend:

```bash
cd "../Quantum frontend"
cp .env.example .env
npm install
npm run dev
```

Frontend en http://localhost:5173 apuntando a la API en http://localhost:5000/api.

---

## Scripts disponibles

| Script              | Descripción                              |
|---------------------|------------------------------------------|
| `npm start`         | Servidor en producción                   |
| `npm run dev`       | Servidor con nodemon (desarrollo)        |
| `npm test`          | Ejecutar pruebas con Jest                |
| `npm run seed`      | Cargar datos iniciales (usuarios, espacios, reservas) |
| `npm run seed:admin`| Alias de `npm run seed`                  |
| `npm run docker:up` | Levantar stack con Docker Compose        |
| `npm run docker:down` | Detener contenedores                   |
| `npm run docker:seed` | Cargar datos iniciales en entorno Docker |
| `npm run docker:clean`| Detener y borrar volúmenes             |

## Estructura del proyecto

```
quantum-backend/
├── config/           # Configuración (base de datos)
├── controllers/      # Controladores HTTP
├── services/         # Lógica de negocio
├── models/           # Modelos Mongoose
├── routes/           # Rutas de la API
├── middleware/       # Auth, manejo de errores
├── scripts/          # Seed de datos iniciales
├── tests/            # Pruebas Jest
├── Dockerfile
├── docker-compose.yml
├── app.js
└── server.js
```

## Documentación API (Swagger)

Con el servidor en marcha, la documentación interactiva está disponible en:

- **UI:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **OpenAPI JSON:** [http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)

Para probar endpoints protegidos, inicia sesión con `POST /api/auth/login`, copia el `token` de la respuesta y pulsa **Authorize** en Swagger UI. Introduce el valor como `Bearer <token>`.

## API Endpoints

### Autenticación
- `POST /api/auth/login` — Iniciar sesión
- `GET /api/auth/me` — Usuario autenticado

### Usuarios (admin)
- `GET /api/users` — Listar usuarios
- `POST /api/users` — Crear usuario
- `PUT /api/users/:id` — Actualizar usuario
- `PATCH /api/users/:id/deactivate` — Desactivar usuario
- `PATCH /api/users/:id/activate` — Reactivar usuario

### Espacios
- `GET /api/spaces` — Listar espacios
- `POST /api/spaces` — Crear espacio (admin)
- `PUT /api/spaces/:id` — Actualizar espacio (admin)

### Reservas
- `GET /api/reservations` — Listar reservas
- `POST /api/reservations` — Crear reserva
- `PATCH /api/reservations/:id/cancel` — Cancelar reserva
- `GET /api/reservations/export` — Exportar CSV

### Analytics
- `GET /api/analytics/reservations` — Estadísticas de reservas

### Health Check
- `GET /api/health` — Estado del servidor y conexión a MongoDB

## Dependencias principales

- **express** — Framework web
- **mongoose** — ODM para MongoDB
- **jsonwebtoken** / **bcryptjs** — Autenticación JWT
- **dotenv** — Variables de entorno
- **cors** — Manejo de CORS

## Supuestos y decisiones relevantes

- **Repositorios separados:** el `docker-compose.yml` asume que el frontend está en una carpeta hermana (`../Quantum frontend`).
- **MongoDB como única base de datos:** no hay caché ni cola de mensajes; toda la persistencia pasa por Mongoose.
- **Dos roles fijos:** `admin` (gestión completa) y `operator` (reservas y consultas). No hay registro público de usuarios; los admins crean cuentas.
- **JWT sin refresh:** el token expira según `JWT_EXPIRES_IN`; el cliente debe volver a autenticarse.
- **Seed idempotente orientado a desarrollo:** crea usuarios, espacios y reservas de ejemplo; las credenciales por defecto no deben usarse en producción.
- **Tests con MongoDB en memoria:** Jest usa `mongodb-memory-server` para aislar las pruebas de una instancia real de MongoDB.
- **Swagger como documentación viva:** los endpoints están documentados en `docs/swagger.js` y se sirven en `/api/docs`.

## Limitaciones conocidas y mejoras futuras

**Limitaciones actuales:**

- Cobertura de tests parcial: existen pruebas para espacios y reservas, pero no cubren todos los módulos (usuarios, analytics, auth).
- Sin paginación en listados (`GET /api/users`, `/api/spaces`, `/api/reservations` devuelven colecciones completas).
- Sin rate limiting ni protección adicional contra fuerza bruta en login.
- Validación de entrada manual en controladores; no se usa una librería de esquemas (Joi, Zod).
- Exportación CSV básica sin filtros avanzados ni programación.
- Sin logs estructurados ni trazabilidad de peticiones (request ID).

**Mejoras que implementaría con más tiempo:**

- Ampliar tests (auth, usuarios, analytics) y alcanzar cobertura mínima del 80 %.
- Paginación, búsqueda y filtros en todos los listados.
- Refresh tokens o rotación de sesiones para mayor seguridad.
- Validación con Zod/Joi y mensajes de error estandarizados.
- CI/CD con GitHub Actions (lint, test, build Docker) y despliegue automatizado.
- Rate limiting, helmet y auditoría de seguridad.
- Notificaciones por email al crear o cancelar reservas.
- Soft delete consistente y historial de cambios en reservas.
