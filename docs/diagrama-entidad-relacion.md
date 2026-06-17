# Especificación escrita del diagrama entidad-relación

Este documento describe por escrito el modelo entidad-relación de la base de datos del proyecto para que otra IA o una herramienta de diagramación pueda dibujarlo con cardinalidades.

## Entidades y atributos

### USERS

Entidad base abstracta que representa los datos comunes de cualquier cuenta del sistema. Usa herencia JPA `JOINED`.

- `id`: clave primaria.
- `username`: obligatorio y único.
- `password`: obligatorio.
- `token_version`: obligatorio.
- `profile_image_path`: opcional.
- No persiste `role`: el rol se deriva del subtipo JPA (`ADMIN_USERS` o `PERSONAL_USERS`).

### ADMIN_USERS

Subtipo de `USERS` que representa administradores.

- `id`: clave primaria y clave foránea hacia `USERS.id`.

### PERSONAL_USERS

Subtipo de `USERS` que representa usuarios personales.

- `id`: clave primaria y clave foránea hacia `USERS.id`.
- `organization_id`: clave foránea opcional hacia `ORGANIZATIONS.id`.
- `created_by_admin_id`: clave foránea opcional hacia `ADMIN_USERS.id`.

### ORGANIZATIONS

Entidad que representa una organización.

- `id`: clave primaria.
- `name`: obligatorio y único.
- `admin_id`: clave foránea obligatoria y única hacia `ADMIN_USERS.id`.

### EVENTS

Entidad que representa eventos de calendario.

- `id`: clave primaria.
- `title`: título del evento.
- `description`: descripción del evento.
- `start_time`: fecha y hora de inicio.
- `end_time`: fecha y hora de fin.
- `location`: ubicación.
- `category`: obligatorio. Valores: `WORK`, `PERSONAL`, `STUDY`, `HEALTH`, `MANDATORY`, `FOCUS`.
- `is_all_day`: indica si el evento dura todo el día.
- `reminder_minutes_before`: recordatorio simple en minutos.
- `assignment_batch_id`: identificador de lote de asignación.
- `user_id`: clave foránea hacia `PERSONAL_USERS.id` para indicar el usuario propietario o destinatario.
- `assigned_by_admin_id`: clave foránea opcional hacia `ADMIN_USERS.id` para indicar el administrador que asignó el evento.

### EVENTS_REMINDERS

Entidad dependiente que representa la colección de recordatorios múltiples de un evento.

- `event_id`: clave foránea hacia `EVENTS.id`.
- `minutes_before`: minutos antes del evento.

No tiene entidad Java propia; surge de la colección `@ElementCollection` de `Event`.

### OBJECTIVES

Entidad base abstracta para objetivos. Usa herencia JPA de tipo `JOINED`.

- `id`: clave primaria.
- `objective_type`: discriminador de subtipo.
- `titulo`: obligatorio.
- `description`: obligatorio.
- `active`: obligatorio.
- `created_at`: obligatorio.
- `user_id`: clave foránea obligatoria hacia `PERSONAL_USERS.id` para indicar el usuario propietario o destinatario.
- `assigned_by_admin_id`: clave foránea opcional hacia `ADMIN_USERS.id` para indicar el administrador que asignó el objetivo.
- `assignment_batch_id`: identificador de lote para reasignaciones masivas de objetivos de administrador.
- `is_numeric`: obligatorio.

### HABITS

Subtipo de `OBJECTIVES` que representa hábitos.

- `id`: clave primaria y clave foránea hacia `OBJECTIVES.id`.
- `current_streak`: obligatorio.
- `best_streak`: obligatorio.

### GOALS

Subtipo de `OBJECTIVES` que representa metas.

- `id`: clave primaria y clave foránea hacia `OBJECTIVES.id`.
- `priority`: obligatorio. Valores según el enum `ObjectivePriority`.
- `status`: obligatorio. Valores según el enum `GoalStatus`.
- `is_numeric`: obligatorio. Columna de compatibilidad sincronizada con `OBJECTIVES.is_numeric`.
- `valor_progreso`: opcional.
- `valor_objetivo`: opcional.

### OBJECTIVE_LOGS

Entidad que representa el histórico de cumplimiento o progreso de un objetivo.

- `id`: clave primaria.
- `objective_id`: clave foránea obligatoria hacia `OBJECTIVES.id`.
- `log_date`: obligatorio.
- `completed`: opcional. Se usa principalmente para hábitos.
- `progress_value`: opcional. Se usa principalmente para metas numéricas.
- `notes`: opcional.
- `created_at`: obligatorio.

Restricción única: no puede haber dos registros con la misma combinación `objective_id` + `log_date`.

## Modelado de administradores y usuarios personales

Ahora sí hay herencia JPA real de usuario con estrategia `JOINED` pura. La tabla base `USERS` contiene las credenciales y datos comunes; `ADMIN_USERS` y `PERSONAL_USERS` contienen las relaciones específicas de cada subtipo.

No se usa columna discriminadora `role` en el modelo nuevo. El subtipo queda definido por la fila hija correspondiente: `ADMIN_USERS` o `PERSONAL_USERS`.

El administrador se relaciona con otras entidades de estas formas:

1. Como administrador principal de una organización:
   - `ORGANIZATIONS.admin_id` referencia `USERS.id`.
   - Cardinalidad: `ORGANIZATIONS (1,1) — (0,1) USERS`.

2. Como creador o gestor de usuarios:
   - `USERS.created_by_admin_id` referencia `USERS.id`.
   - Cardinalidad reflexiva: `USERS administrador (0,N) — (0,1) USERS usuario_gestionado`.

3. Como asignador de eventos:
   - `EVENTS.assigned_by_admin_id` referencia `USERS.id`.
   - Cardinalidad: `USERS administrador (0,N) — (0,1) EVENTS`.

4. Como asignador de objetivos:
   - `OBJECTIVES.assigned_by_admin_id` referencia `USERS.id`.
   - Cardinalidad: `USERS administrador (0,N) — (0,1) OBJECTIVES`.

Por tanto, si otra IA dibuja el diagrama, debe representar `ADMIN_USERS` y `PERSONAL_USERS` como subentidades de `USERS` mediante herencia `JOINED`.

## Relaciones y cardinalidades

### ORGANIZATIONS — USERS como administrador

- Relación: una organización tiene un administrador principal.
- Desde `ORGANIZATIONS` hacia `USERS`: cada organización debe tener exactamente `1` usuario administrador.
- Desde `USERS` hacia `ORGANIZATIONS`: un usuario puede administrar `0..1` organizaciones.
- Cardinalidad: `ORGANIZATIONS (1,1) — (0,1) USERS`.
- Clave foránea: `ORGANIZATIONS.admin_id` referencia `USERS.id`.
- Observación: `admin_id` es único, por lo que un mismo usuario no puede ser administrador principal de varias organizaciones.

### ORGANIZATIONS — USERS como miembros

- Relación: una organización puede tener usuarios miembros.
- Desde `ORGANIZATIONS` hacia `USERS`: una organización puede tener `0..N` usuarios.
- Desde `USERS` hacia `ORGANIZATIONS`: un usuario puede pertenecer a `0..1` organizaciones.
- Cardinalidad: `ORGANIZATIONS (0,N) — (0,1) USERS`.
- Clave foránea: `USERS.organization_id` referencia `ORGANIZATIONS.id`.
- Observación: los usuarios personales pueden no pertenecer a ninguna organización.

### USERS — USERS como creador administrativo

- Relación reflexiva: un usuario administrador puede crear o gestionar otros usuarios.
- Desde el usuario administrador hacia usuarios gestionados: un administrador puede gestionar `0..N` usuarios.
- Desde el usuario gestionado hacia administrador creador: un usuario puede haber sido creado por `0..1` administradores.
- Cardinalidad: `USERS administrador (0,N) — (0,1) USERS usuario_gestionado`.
- Clave foránea: `USERS.created_by_admin_id` referencia `USERS.id`.

### USERS — EVENTS como propietario o destinatario

- Relación: un usuario tiene eventos en su calendario.
- Desde `USERS` hacia `EVENTS`: un usuario puede tener `0..N` eventos.
- Desde `EVENTS` hacia `USERS`: un evento puede estar asociado a `0..1` usuarios según la anotación JPA actual, porque `user_id` no está marcado como obligatorio.
- Cardinalidad: `USERS (0,N) — (0,1) EVENTS`.
- Clave foránea: `EVENTS.user_id` referencia `USERS.id`.

### USERS — EVENTS como administrador asignador

- Relación: un administrador puede asignar eventos a usuarios.
- Desde `USERS` administrador hacia `EVENTS`: un administrador puede asignar `0..N` eventos.
- Desde `EVENTS` hacia `USERS` administrador: un evento puede haber sido asignado por `0..1` administradores.
- Cardinalidad: `USERS administrador (0,N) — (0,1) EVENTS`.
- Clave foránea: `EVENTS.assigned_by_admin_id` referencia `USERS.id`.

### EVENTS — EVENTS_REMINDERS

- Relación: un evento puede tener varios recordatorios adicionales.
- Desde `EVENTS` hacia `EVENTS_REMINDERS`: un evento puede tener `0..N` recordatorios.
- Desde `EVENTS_REMINDERS` hacia `EVENTS`: cada recordatorio pertenece a exactamente `1` evento.
- Cardinalidad: `EVENTS (0,N) — (1,1) EVENTS_REMINDERS`.
- Clave foránea: `EVENTS_REMINDERS.event_id` referencia `EVENTS.id`.
- Tipo: entidad dependiente surgida de una colección de valores, no una entidad asociativa muchos-a-muchos.

### USERS — OBJECTIVES como propietario o destinatario

- Relación: un usuario tiene objetivos.
- Desde `USERS` hacia `OBJECTIVES`: un usuario puede tener `0..N` objetivos.
- Desde `OBJECTIVES` hacia `USERS`: cada objetivo debe pertenecer a exactamente `1` usuario.
- Cardinalidad: `USERS (0,N) — (1,1) OBJECTIVES`.
- Clave foránea: `OBJECTIVES.user_id` referencia `USERS.id`.

### USERS — OBJECTIVES como administrador asignador

- Relación: un administrador puede asignar objetivos a usuarios.
- Desde `USERS` administrador hacia `OBJECTIVES`: un administrador puede asignar `0..N` objetivos.
- Desde `OBJECTIVES` hacia `USERS` administrador: un objetivo puede haber sido asignado por `0..1` administradores.
- Cardinalidad: `USERS administrador (0,N) — (0,1) OBJECTIVES`.
- Clave foránea: `OBJECTIVES.assigned_by_admin_id` referencia `USERS.id`.

### OBJECTIVES — HABITS por herencia

- Relación: `HABITS` es un subtipo de `OBJECTIVES`.
- Desde `HABITS` hacia `OBJECTIVES`: cada hábito corresponde a exactamente `1` objetivo base.
- Desde `OBJECTIVES` hacia `HABITS`: un objetivo base puede tener `0..1` fila en `HABITS`, solo si su tipo es hábito.
- Cardinalidad: `OBJECTIVES (0,1) — (1,1) HABITS`.
- Clave foránea: `HABITS.id` referencia `OBJECTIVES.id`.
- Tipo: especialización/herencia, no entidad de relación.

### OBJECTIVES — GOALS por herencia

- Relación: `GOALS` es un subtipo de `OBJECTIVES`.
- Desde `GOALS` hacia `OBJECTIVES`: cada meta corresponde a exactamente `1` objetivo base.
- Desde `OBJECTIVES` hacia `GOALS`: un objetivo base puede tener `0..1` fila en `GOALS`, solo si su tipo es meta.
- Cardinalidad: `OBJECTIVES (0,1) — (1,1) GOALS`.
- Clave foránea: `GOALS.id` referencia `OBJECTIVES.id`.
- Tipo: especialización/herencia, no entidad de relación.

### OBJECTIVES — OBJECTIVE_LOGS

- Relación: un objetivo tiene registros históricos de progreso o cumplimiento.
- Desde `OBJECTIVES` hacia `OBJECTIVE_LOGS`: un objetivo puede tener `0..N` logs.
- Desde `OBJECTIVE_LOGS` hacia `OBJECTIVES`: cada log pertenece a exactamente `1` objetivo.
- Cardinalidad: `OBJECTIVES (0,N) — (1,1) OBJECTIVE_LOGS`.
- Clave foránea: `OBJECTIVE_LOGS.objective_id` referencia `OBJECTIVES.id`.
- Restricción: combinación única `objective_id` + `log_date`.

## Entidades de relación o entidades surgidas por relaciones

No hay una relación muchos-a-muchos pura en el modelo actual que exija una entidad asociativa clásica. Sí hay herencia de usuario: `ADMIN_USERS` y `PERSONAL_USERS` son subtablas de `USERS`.

Sí aparecen entidades o tablas surgidas de relaciones o estructuras del modelo:

1. `EVENTS_REMINDERS`:
   - Surge de la lista de enteros `reminderMinutesBeforeList` en `Event`.
   - Es una tabla dependiente de `EVENTS`.
   - Cardinalidad: un evento tiene `0..N` recordatorios y cada recordatorio pertenece a `1` evento.
   - No representa una relación muchos-a-muchos.

2. `HABITS`:
   - Surge por herencia/especialización de `OBJECTIVES`.
   - No es una entidad de relación.
   - Comparte identificador con `OBJECTIVES`.

3. `GOALS`:
   - Surge por herencia/especialización de `OBJECTIVES`.
   - No es una entidad de relación.
   - Comparte identificador con `OBJECTIVES`.

4. `OBJECTIVE_LOGS`:
   - Es una entidad dependiente del objetivo.
   - No es una entidad asociativa muchos-a-muchos.
   - Sirve para registrar el histórico diario de cada objetivo.

## Resumen compacto para dibujar

Usa estas entidades:

- `USERS(id PK, username UK, password, token_version, profile_image_path)`
- `ADMIN_USERS(id PK/FK)`
- `PERSONAL_USERS(id PK/FK, organization_id FK, created_by_admin_id FK)`
- `ORGANIZATIONS(id PK, name UK, admin_id FK UK)`
- `EVENTS(id PK, title, description, start_time, end_time, location, category, is_all_day, reminder_minutes_before, assignment_batch_id, user_id FK, assigned_by_admin_id FK)`
- `EVENTS_REMINDERS(event_id FK, minutes_before)`
- `OBJECTIVES(id PK, objective_type, titulo, description, active, created_at, user_id FK, assigned_by_admin_id FK, assignment_batch_id, is_numeric)`
- `HABITS(id PK/FK, current_streak, best_streak)`
- `GOALS(id PK/FK, priority, status, is_numeric, valor_progreso, valor_objetivo)`
- `OBJECTIVE_LOGS(id PK, objective_id FK, log_date, completed, progress_value, notes, created_at)`

Dibuja estas relaciones. Importante: dibuja herencia `JOINED` para usuarios; `ADMIN_USERS` y `PERSONAL_USERS` heredan de `USERS`.


- `USERS (0,1) — (1,1) ADMIN_USERS`, herencia/especialización, FK `admin_users.id`.
- `USERS (0,1) — (1,1) PERSONAL_USERS`, herencia/especialización, FK `personal_users.id`.
- `ORGANIZATIONS (1,1) — (0,1) ADMIN_USERS`, rol: administrador principal, FK `organizations.admin_id`.
- `ORGANIZATIONS (0,N) — (0,1) PERSONAL_USERS`, rol: miembros, FK `personal_users.organization_id`.
- `ADMIN_USERS administrador (0,N) — (0,1) PERSONAL_USERS usuario_gestionado`, FK `personal_users.created_by_admin_id`.
- `PERSONAL_USERS (0,N) — (0,1) EVENTS`, rol: propietario/destinatario, FK `events.user_id`.
- `ADMIN_USERS administrador (0,N) — (0,1) EVENTS`, rol: asignador, FK `events.assigned_by_admin_id`.
- `EVENTS (0,N) — (1,1) EVENTS_REMINDERS`, FK `EventsReminders.event_id`.
- `PERSONAL_USERS (0,N) — (1,1) OBJECTIVES`, rol: propietario/destinatario, FK `objectives.user_id`.
- `ADMIN_USERS administrador (0,N) — (0,1) OBJECTIVES`, rol: asignador, FK `objectives.assigned_by_admin_id`.
- `OBJECTIVES (0,1) — (1,1) HABITS`, herencia/especialización, FK `habits.id`.
- `OBJECTIVES (0,1) — (1,1) GOALS`, herencia/especialización, FK `goals.id`.
- `OBJECTIVES (0,N) — (1,1) OBJECTIVE_LOGS`, FK `objective_logs.objective_id`.

## Diagrama Mermaid de referencia

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar username UK
        varchar password
        integer token_version
        varchar profile_image_path
    }

    ADMIN_USERS {
        bigint id PK, FK
    }

    PERSONAL_USERS {
        bigint id PK, FK
        bigint organization_id FK
        bigint created_by_admin_id FK
    }

    ORGANIZATIONS {
        bigint id PK
        varchar name UK
        bigint admin_id FK UK
    }

    EVENTS {
        bigint id PK
        varchar title
        varchar description
        datetime start_time
        datetime end_time
        varchar location
        varchar category
        boolean is_all_day
        integer reminder_minutes_before
        varchar assignment_batch_id
        bigint user_id FK
        bigint assigned_by_admin_id FK
    }

    EVENTS_REMINDERS {
        bigint event_id FK
        integer minutes_before
    }

    OBJECTIVES {
        integer id PK
        varchar objective_type
        varchar titulo
        varchar description
        boolean active
        datetime created_at
        bigint user_id FK
        bigint assigned_by_admin_id FK
        varchar assignment_batch_id
        boolean is_numeric
    }

    HABITS {
        integer id PK, FK
        integer current_streak
        integer best_streak
    }

    GOALS {
        integer id PK, FK
        varchar priority
        varchar status
        boolean is_numeric
        double valor_progreso
        double valor_objetivo
    }

    OBJECTIVE_LOGS {
        integer id PK
        integer objective_id FK
        date log_date
        boolean completed
        double progress_value
        varchar notes
        datetime created_at
    }

    USERS ||--|o ADMIN_USERS : "herencia JOINED admin 0..1"
    USERS ||--|o PERSONAL_USERS : "herencia JOINED personal 0..1"
    ORGANIZATIONS |o--|| ADMIN_USERS : "admin obligatorio en organizacion, admin 0..1 organizacion"
    ORGANIZATIONS ||--o{ PERSONAL_USERS : "miembros 0..N, personal 0..1 organizacion"
    ADMIN_USERS ||--o{ PERSONAL_USERS : "admin crea 0..N, personal creado por 0..1"
    PERSONAL_USERS |o--o{ EVENTS : "personal 0..N eventos, evento 0..1 personal"
    ADMIN_USERS |o--o{ EVENTS : "admin asigna 0..N, evento 0..1 admin"
    EVENTS ||--o{ EVENTS_REMINDERS : "evento 0..N recordatorios, recordatorio 1 evento"
    PERSONAL_USERS ||--o{ OBJECTIVES : "personal 0..N objetivos, objetivo 1 personal"
    ADMIN_USERS |o--o{ OBJECTIVES : "admin asigna 0..N, objetivo 0..1 admin"
    OBJECTIVES ||--|o HABITS : "subtipo habit 0..1"
    OBJECTIVES ||--|o GOALS : "subtipo goal 0..1"
    OBJECTIVES ||--o{ OBJECTIVE_LOGS : "objetivo 0..N logs, log 1 objetivo"
```
