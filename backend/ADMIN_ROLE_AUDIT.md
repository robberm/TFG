# Auditoría técnica del estado actual (roles ADMIN/PERSONAL)

Fecha: 2026-04-14

## 1) Estado validado como correcto

### 1.1 Modelo de roles y organización
- `UserRole` está definido con `PERSONAL` y `ADMIN`.
- `User` incorpora `role`, `organization`, `createdByAdmin`, `managedUsers` y `administeredOrganization`.
- `Organization` modela la pertenencia por `users` y el propietario por `admin`.
- La decisión de **usuario único + rol** (sin herencia Admin/Personal) está bien aplicada en el dominio.

### 1.2 Registro y perfil del usuario
- El registro público fuerza `PERSONAL`, `organization=null` y `createdByAdmin=null`.
- El login ya devuelve `token`, `username`, `role`, `organizationId`, `organizationName`.
- `/users/me` ya devuelve el perfil ampliado con `hasAdminView`.

### 1.3 Gestión administrativa de subordinados
- Existen endpoints administrativos para:
  - `GET /admin/users`
  - `POST /admin/users`
  - `DELETE /admin/users/{userId}`
- El servicio valida rol `ADMIN` y limita operaciones a usuarios con `createdByAdmin = admin`.

## 2) Inconsistencias y riesgos detectados

### 2.1 Servicio admin en paquete inconsistente
- `AdminServiceImpl` está físicamente bajo `service/implementations`, pero su `package` declarado es `net.tfg.tfgapp.service`.
- No rompe necesariamente compilación, pero sí coherencia de arquitectura y mantenimiento.

### 2.2 Control de acceso insuficiente en eventos
- `CalendarController` expone `GET /events/{username}` sin validar que el token corresponda al mismo usuario o a un admin autorizado.
- También hay operaciones `PUT/DELETE` por id sin comprobación explícita de ownership/ámbito.
- Esto permite riesgo de acceso cruzado entre usuarios.

### 2.3 Posible conflicto de rutas en `CalendarController`
- Existen dos `@GetMapping` con patrón `/{...}`:
  - `@GetMapping("/{username}")`
  - `@GetMapping("/{id}")`
- Son ambiguos para Spring MVC y pueden producir comportamiento no determinista o fallo de arranque según resolución de mappings.

### 2.4 Seguridad global permisiva
- `SecurityConfig` está en `anyRequest().permitAll()`.
- Hoy la seguridad se está aplicando sobre todo de forma manual dentro de controladores, lo que incrementa superficie de error.

### 2.5 Objetivos y hábitos todavía sin flujo admin
- `GoalController` (y equivalente para hábitos) funciona sólo en modo “usuario autenticado sobre sí mismo”.
- No existe endpoint administrativo para alta/edición/baja sobre subordinados.

## 3) Acoplamiento con el siguiente paso (sin romper lo existente)

## Fase 2 (Objetivos admin) — propuesta mínima
1. Añadir endpoints administrativos específicos (sin tocar rutas actuales personales):
   - `POST /admin/users/{userId}/goals`
   - `PUT /admin/users/{userId}/goals/{goalId}`
   - `DELETE /admin/users/{userId}/goals/{goalId}`
   - `GET /admin/users/{userId}/goals`
2. Reutilizar servicios existentes añadiendo validación de ámbito:
   - Resolver admin por token.
   - Verificar que `userId` pertenece al admin (`createdByAdmin`).
   - Operar siempre sobre ese usuario destino.
3. Mantener `GoalController` actual para usuario personal sin breaking changes.

## Fase 3 (Eventos admin) — propuesta mínima
1. Añadir endpoints:
   - `GET /admin/users/{userId}/events`
   - `POST /admin/users/{userId}/events`
   - `PUT /admin/users/{userId}/events/{eventId}`
   - `DELETE /admin/users/{userId}/events/{eventId}`
2. Corregir antes `CalendarController` para eliminar el `GET /events/{username}` o convertirlo a `GET /events/me`.
3. Aplicar validación de ownership también en operaciones por `eventId`.

## Fase 4 (estadísticas admin) — propuesta mínima
1. Crear endpoints admin agregados por subordinado (ej.: métricas de objetivos cumplidos, hábitos completados y eventos por rango).
2. Toda consulta debe partir de la lista `userService.getManagedUsers(adminId)`.
3. No devolver datos fuera de ese subconjunto.

## 4) Estado frontend y precondiciones para Fase 5

### 4.1 Lo que sí está preparado
- Login backend ya devuelve `role` y `organization*`.
- `/users/me` devuelve `hasAdminView`.

### 4.2 Lo que falta para la vista admin
- En frontend no existe aún enrutado por rol ni vista administrativa.
- `ProtectedRoute` sólo verifica existencia de token.
- Login guarda token/username, pero no persiste `role` ni lógica de redirección por rol.

## 5) Siguiente paso recomendado inmediato
1. Cerrar inconsistencias críticas backend (rutas eventos + control de ownership por id + coherencia de paquete `AdminServiceImpl`).
2. Después iniciar vista admin en frontend.

## 6) Preguntas que hay que cerrar antes de implementar frontend admin
1. ¿Prefieres una ruta dedicada (`/admin`) con layout propio, o reutilizar `Home` con pestañas condicionales por rol?
2. ¿Quieres guardado de rol en `localStorage` al login, o cargar siempre `/users/me` al iniciar para evitar estado obsoleto?
3. ¿Para el MVP admin del TFG prefieres:
   - sólo gestión de usuarios subordinados,
   - o incluir ya también modales de crear objetivo/evento para usuario seleccionado?
4. ¿La UI admin debe ser totalmente separada de PERSONAL o parcialmente compartida con componentes existentes?

---

Este documento describe únicamente auditoría y plan incremental; no introduce cambios funcionales en endpoints actuales.
