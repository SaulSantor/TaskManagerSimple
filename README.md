# Task Manager Simple - Serverless en Vercel

Esta versión migra la app legacy monolítica a una arquitectura Serverless en Vercel.
El frontend sigue siendo JavaScript puro y usa localStorage como fuente de verdad,
mientras que los endpoints bajo `/api` actúan como validadores y procesadores stateless.

## Por qué Serverless

Serverless encaja mejor que el monolito original porque escala por función, no exige
mantener un servidor persistente, cobra por uso y se integra de forma natural con
despliegues automáticos desde GitHub a Vercel.

## Arquitectura

```text
Browser (localStorage como fuente de verdad)
   -> index.html + style.css
   -> js/api.js     (lee/escribe localStorage, llama a /api para validar)
   -> js/ui.js      (renderizado del DOM)
   -> js/app.js     (orquestación)
        |
        v
   Funciones Serverless (stateless - solo validan y procesan)
   -> /api/auth/login       (valida credenciales)
   -> /api/tasks            (valida y formatea tareas)
   -> /api/tasks/:id        (valida updates y deletes)
   -> /api/projects         (valida y formatea proyectos)
   -> /api/projects/:id
   -> /api/comments         (valida comentarios)
   -> /api/history          (valida entradas de historial)
   -> /api/notifications    (valida notificaciones)
   -> /api/reports          (genera reportes en texto)
```

## Cómo funciona la persistencia

A diferencia del monolito original donde todo vivía en un solo `app.js`,
ahora la responsabilidad está separada:

- **localStorage** → guarda todos los datos en el navegador (tareas, proyectos, comentarios, etc.)
- **Funciones serverless** → reciben datos del frontend, los validan, asignan IDs y timestamps, y regresan el resultado
- **El frontend** → guarda el resultado de vuelta en localStorage

Esto permite que los datos persistan entre recargas sin necesitar una base de datos externa.

## Funcionalidades mantenidas

- Login con `admin/admin`, `user1/user1`, `user2/user2`
- CRUD de tareas y proyectos
- Sistema de comentarios
- Historial y auditoría
- Notificaciones
- Búsqueda avanzada
- Reportes y exportación CSV

## Deploy

1. Sube el proyecto a GitHub.
2. Importa el repositorio en [vercel.com](https://vercel.com).
3. Vercel detectará `api/` y desplegará las funciones serverless automáticamente.
4. Cada push a la rama principal publicará una nueva versión.

## Estructura

```text
TaskManagerSimple/
├── index.html
├── style.css
├── vercel.json
├── package.json
├── README.md
├── js/
│   ├── api.js       (cliente: localStorage + llamadas a /api)
│   ├── ui.js        (renderizado DOM)
│   └── app.js       (orquestación y eventos)
└── api/
    ├── _shared.js           (helpers: CORS, parseBody, send)
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
- Los datos son por navegador — cada usuario ve sus propios datos locales
