const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Quantum API',
    version: '1.0.0',
    description:
      'API REST para la gestión de reservas de espacios de coworking. Autenticación JWT. Roles: admin y operator.',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Servidor local',
    },
  ],
  tags: [
    { name: 'Autenticación', description: 'Inicio de sesión y perfil del usuario autenticado' },
    { name: 'Usuarios', description: 'Gestión de cuentas (solo admin)' },
    { name: 'Espacios', description: 'Espacios reservables' },
    { name: 'Reservas', description: 'Reservas de espacios' },
    { name: 'Analytics', description: 'Estadísticas y métricas' },
    { name: 'Health', description: 'Estado del servidor' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token obtenido en POST /api/auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensaje de error' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'María García' },
          email: { type: 'string', format: 'email', example: 'maria@quantum.com' },
          role: { type: 'string', enum: ['admin', 'operator'], example: 'operator' },
          active: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      CreateUserRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'María García' },
          email: { type: 'string', format: 'email', example: 'maria@quantum.com' },
          password: { type: 'string', minLength: 6, example: 'Operador123!' },
          role: { type: 'string', enum: ['admin', 'operator'], default: 'operator' },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'operator'] },
          active: { type: 'boolean' },
        },
      },
      Space: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Sala A' },
          type: {
            type: 'string',
            enum: ['sala', 'escritorio', 'sala_reuniones', 'phone_booth', 'otro'],
            example: 'sala_reuniones',
          },
          location: { type: 'string', example: 'Piso 2' },
          capacity: { type: 'integer', minimum: 1, example: 8 },
          openingTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '08:00' },
          closingTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '20:00' },
          active: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateSpaceRequest: {
        type: 'object',
        required: ['name', 'type', 'location', 'capacity', 'openingTime', 'closingTime'],
        properties: {
          name: { type: 'string', example: 'Sala A' },
          type: {
            type: 'string',
            enum: ['sala', 'escritorio', 'sala_reuniones', 'phone_booth', 'otro'],
          },
          location: { type: 'string', example: 'Piso 2' },
          capacity: { type: 'integer', minimum: 1, example: 8 },
          openingTime: { type: 'string', example: '08:00' },
          closingTime: { type: 'string', example: '20:00' },
        },
      },
      UpdateSpaceRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['sala', 'escritorio', 'sala_reuniones', 'phone_booth', 'otro'],
          },
          location: { type: 'string' },
          capacity: { type: 'integer', minimum: 1 },
          openingTime: { type: 'string' },
          closingTime: { type: 'string' },
        },
      },
      ReservationStatus: {
        type: 'string',
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      },
      Reservation: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          title: { type: 'string', example: 'Reunión con cliente' },
          clientName: { type: 'string', example: 'Juan Pérez' },
          clientEmail: { type: 'string', format: 'email', example: 'juan@empresa.com' },
          attendees: { type: 'integer', minimum: 1, example: 4 },
          space: { oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Space' }] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          status: { $ref: '#/components/schemas/ReservationStatus' },
          notes: { type: 'string', example: '' },
          createdBy: {
            oneOf: [
              { type: 'string' },
              {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            ],
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateReservationRequest: {
        type: 'object',
        required: [
          'title',
          'clientName',
          'clientEmail',
          'attendees',
          'space',
          'startDate',
          'endDate',
        ],
        properties: {
          title: { type: 'string', example: 'Reunión con cliente' },
          clientName: { type: 'string', example: 'Juan Pérez' },
          clientEmail: { type: 'string', format: 'email', example: 'juan@empresa.com' },
          attendees: { type: 'integer', minimum: 1, example: 4 },
          space: { type: 'string', description: 'ID del espacio', example: '507f1f77bcf86cd799439011' },
          startDate: { type: 'string', format: 'date-time', example: '2026-08-01T10:00:00.000Z' },
          endDate: { type: 'string', format: 'date-time', example: '2026-08-01T12:00:00.000Z' },
          status: { type: 'string', enum: ['pending', 'confirmed'], default: 'pending' },
          notes: { type: 'string', example: 'Proyector requerido' },
        },
      },
      UpdateReservationRequest: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          clientName: { type: 'string' },
          clientEmail: { type: 'string', format: 'email' },
          attendees: { type: 'integer', minimum: 1 },
          space: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'completed'] },
          notes: { type: 'string' },
        },
      },
      ReservationListResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Reservation' },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 42 },
              totalPages: { type: 'integer', example: 5 },
            },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'], example: 'ok' },
          message: { type: 'string', example: 'Servidor ejecutándose correctamente' },
          database: { type: 'string', enum: ['connected', 'disconnected'], example: 'connected' },
        },
      },
      AnalyticsResponse: {
        type: 'object',
        properties: {
          period: {
            type: 'object',
            properties: {
              startDateFrom: { type: 'string', format: 'date-time' },
              startDateTo: { type: 'string', format: 'date-time' },
            },
          },
          summary: {
            type: 'object',
            properties: {
              totalReservations: { type: 'integer' },
              confirmedCount: { type: 'integer' },
              cancelledCount: { type: 'integer' },
              cancellationRate: { type: 'number', format: 'float' },
              topSpace: {
                type: 'object',
                nullable: true,
                properties: {
                  spaceId: { type: 'string' },
                  name: { type: 'string' },
                  confirmedCount: { type: 'integer' },
                },
              },
            },
          },
          reservationsByDay: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string', format: 'date', example: '2026-08-01' },
                count: { type: 'integer' },
              },
            },
          },
          statusDistribution: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                status: { $ref: '#/components/schemas/ReservationStatus' },
                count: { type: 'integer' },
              },
            },
          },
          usageBySpace: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                spaceId: { type: 'string' },
                name: { type: 'string' },
                confirmedHours: { type: 'number' },
                confirmedCount: { type: 'integer' },
              },
            },
          },
          usageMetric: {
            type: 'object',
            properties: {
              unit: { type: 'string', example: 'hours' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'No autenticado o token inválido',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Sin permisos suficientes',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      BadRequest: {
        description: 'Solicitud inválida',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Iniciar sesión',
        description: 'Devuelve un token JWT y los datos del usuario autenticado.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@quantum.com' },
                  password: { type: 'string', example: 'Admin123!' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login exitoso',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { description: 'Credenciales incorrectas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Cuenta inactiva', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Autenticación'],
        summary: 'Obtener usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Perfil del usuario',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de usuarios',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear usuario',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } } },
        },
        responses: {
          201: {
            description: 'Usuario creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Usuario encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Actualizar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRequest' } } },
        },
        responses: {
          200: {
            description: 'Usuario actualizado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/users/{id}/deactivate': {
      patch: {
        tags: ['Usuarios'],
        summary: 'Desactivar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Usuario desactivado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/users/{id}/activate': {
      patch: {
        tags: ['Usuarios'],
        summary: 'Reactivar usuario',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Usuario reactivado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/spaces': {
      get: {
        tags: ['Espacios'],
        summary: 'Listar espacios',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de espacios',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Space' } },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Espacios'],
        summary: 'Crear espacio',
        description: 'Solo administradores.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateSpaceRequest' } } },
        },
        responses: {
          201: {
            description: 'Espacio creado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Space' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/spaces/{id}': {
      get: {
        tags: ['Espacios'],
        summary: 'Obtener espacio por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Espacio encontrado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Space' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Espacios'],
        summary: 'Actualizar espacio',
        description: 'Solo administradores.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateSpaceRequest' } } },
        },
        responses: {
          200: {
            description: 'Espacio actualizado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Space' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/spaces/{id}/deactivate': {
      patch: {
        tags: ['Espacios'],
        summary: 'Desactivar espacio',
        description:
          'Solo administradores. Falla con 409 si el espacio tiene reservas futuras pendientes o confirmadas.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Espacio desactivado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Space' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { description: 'Conflicto por reservas futuras', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/reservations': {
      get: {
        tags: ['Reservas'],
        summary: 'Listar reservas',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Busca en título, cliente o correo' },
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/ReservationStatus' } },
          { name: 'space', in: 'query', schema: { type: 'string' }, description: 'ID del espacio' },
          { name: 'startDateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'startDateTo', in: 'query', schema: { type: 'string', format: 'date' } },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: ['startDate', 'createdAt'], default: 'startDate' },
          },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          200: {
            description: 'Lista paginada de reservas',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ReservationListResponse' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Reservas'],
        summary: 'Crear reserva',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReservationRequest' } } },
        },
        responses: {
          201: {
            description: 'Reserva creada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Reservation' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { description: 'Espacio no encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Conflicto de horario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/reservations/export': {
      get: {
        tags: ['Reservas'],
        summary: 'Exportar reservas a CSV',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/ReservationStatus' } },
          { name: 'space', in: 'query', schema: { type: 'string' } },
          { name: 'startDateFrom', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'startDateTo', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['startDate', 'createdAt'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: {
            description: 'Archivo CSV',
            headers: {
              'Content-Disposition': { schema: { type: 'string' }, description: 'Nombre del archivo descargado' },
              'X-Total-Count': { schema: { type: 'integer' }, description: 'Total de filas exportadas' },
            },
            content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/reservations/{id}': {
      get: {
        tags: ['Reservas'],
        summary: 'Obtener reserva por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Reserva encontrada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Reservation' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Reservas'],
        summary: 'Actualizar reserva',
        description: 'No se pueden editar reservas canceladas o completadas.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateReservationRequest' } } },
        },
        responses: {
          200: {
            description: 'Reserva actualizada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Reservation' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { description: 'Conflicto de horario', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/reservations/{id}/cancel': {
      patch: {
        tags: ['Reservas'],
        summary: 'Cancelar reserva',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Reserva cancelada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Reservation' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/analytics/reservations': {
      get: {
        tags: ['Analytics'],
        summary: 'Estadísticas de reservas',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'startDateFrom',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
            example: '2026-08-01',
          },
          {
            name: 'startDateTo',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'date' },
            example: '2026-08-31',
          },
        ],
        responses: {
          200: {
            description: 'Métricas del periodo',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalyticsResponse' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Estado del servidor',
        responses: {
          200: {
            description: 'Servidor y base de datos operativos',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
          },
          503: {
            description: 'Base de datos desconectada',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } } },
          },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
