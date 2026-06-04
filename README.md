# Task Manager Simple - Serverless en Vercel

Esta versión migra la app legacy monolítica a una arquitectura Serverless en Vercel. El frontend sigue siendo JavaScript puro, pero ahora consume endpoints independientes bajo `/api` en lugar de depender de `localStorage`.

## Por qué Serverless

Serverless encaja mejor que el monolito original porque escala por función, no exige mantener un servidor persistente, cobra por uso y se integra de forma natural con despliegues automáticos desde GitHub a Vercel.

## Arquitectura

```text
Browser
   -> index.html + style.css
   -> js/api.js
   -> js/ui.js
   -> js/app.js
   -> /api/auth/login
   -> /api/tasks
   -> /api/tasks/:id
   -> /api/projects
   -> /api/projects/:id
   -> /api/comments
   -> /api/history
   -> /api/notifications
   -> /api/reports
   -> Vercel KV (si está configurado)
   -> fallback en memoria por función (demo)
```

## Funcionalidades mantenidas

- Login con `admin/admin`, `user1/user1`, `user2/user2`
- CRUD de tareas y proyectos
- Sistema de comentarios
- Historial y auditoría
- Notificaciones
- Búsqueda avanzada
- Reportes y exportación CSV

## Variables de entorno

No son necesarias para el modo demo.

Si configuras una base compartida, el proyecto ya está preparado para Vercel KV:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## Deploy

1. Sube el proyecto a GitHub.
2. Importa el repositorio en [vercel.com](https://vercel.com).
3. Vercel detectará `api/` y desplegará las funciones serverless automáticamente.
4. Cada push a la rama principal publicará una nueva versión.

## Nota importante

Si no configuras Vercel KV, cada función usa un store en memoria simulado e independiente. Eso sirve para demo y desarrollo rápido, pero no da persistencia real entre funciones ni entre invocaciones frías.

## Estructura

```text
TaskManagerSimple/
├── index.html
├── style.css
├── vercel.json
├── README.md
├── js/
│   ├── api.js
│   ├── ui.js
│   └── app.js
└── api/
      ├── _shared.js
      ├── auth/login.js
      ├── tasks/index.js
      ├── tasks/[id].js
      ├── projects/index.js
      ├── projects/[id].js
      ├── comments/index.js
      ├── notifications/index.js
      ├── history/index.js
      └── reports/index.js
```

## Limitaciones conocidas (ambiente demo)

- Contraseñas en texto plano (en producción: bcrypt)
- Token de sesión simulado (en producción: JWT)
- CORS abierto (en producción: restringir al dominio)
- Datos en localStorage (en producción: base de datos persistente como Supabase)
