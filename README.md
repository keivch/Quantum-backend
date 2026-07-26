# Quantum Backend

Backend desarrollado con Node.js, Express y Mongoose.

## Instalación

Las dependencias ya han sido instaladas. Si necesitas instalarlas nuevamente:

```bash
npm install
```

## Configuración

1. Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Edita el archivo `.env` con tus valores:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/quantum-backend
NODE_ENV=development
```

## Scripts Disponibles

- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon (auto-recarga)
- `npm test` - Ejecuta las pruebas (aún no configurado)

## Estructura del Proyecto

```
quantum-backend/
├── config/           # Configuración (base de datos)
├── controllers/      # Lógica de negocio
├── middleware/       # Middleware personalizado
├── models/          # Modelos de Mongoose
├── routes/          # Rutas de la API
├── server.js        # Archivo principal
├── .env.example     # Variables de entorno (ejemplo)
├── .gitignore       # Archivos ignorados por Git
└── package.json     # Dependencias
```

## API Endpoints

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener un usuario por ID
- `POST /api/users` - Crear un nuevo usuario
- `PUT /api/users/:id` - Actualizar un usuario
- `DELETE /api/users/:id` - Eliminar un usuario

### Health Check
- `GET /api/health` - Verificar que el servidor está funcionando

## Dependencias

- **express** - Framework web
- **mongoose** - ODM para MongoDB
- **dotenv** - Gestión de variables de entorno
- **cors** - Manejo de CORS
- **nodemon** - Auto-recarga en desarrollo (devDependency)

## Próximos Pasos

1. Asegúrate de tener MongoDB ejecutándose localmente o en la nube
2. Ejecuta `npm run dev` para iniciar el servidor
3. Prueba la API con Postman, Insomnia o curl

## Notas

- Las contraseñas no están hasheadas (implementar bcrypt para producción)
- Considera añadir validación de entrada más robusta
- Implementa autenticación JWT si es necesario
