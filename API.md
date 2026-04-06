# Memoraia Backend — API Documentation

## Configuration

### Environment Variables

#### Requeridas (el servidor no arranca si falta alguna)

```
JWT_SECRET              # Secret para firmar JWT tokens
TWITCH_CLIENT_ID        # Twitch OAuth app client ID
TWITCH_CLIENT_SECRET    # Twitch OAuth app client secret
TWITCH_WEBHOOK_SECRET   # Secret para validar webhooks de Twitch
TWITCH_CALLBACK_URL     # Base URL pública (ngrok o dominio), SIN trailing slash ni rutas
SUPABASE_URL            # URL del proyecto Supabase
SUPABASE_SECRET_KEY     # Secret key de Supabase
```

Si alguna de estas variables no está definida al iniciar, el proceso lanza un error inmediato con el listado de las variables faltantes y no llega a servir ninguna petición.

#### Opcionales (tienen valor por defecto)

```
PORT                    # Puerto del servidor (default: 3000)
HOST                    # Host de escucha (default: 0.0.0.0)
FRONTEND_URL            # Origen del frontend para CORS (default: http://localhost:5173)
NODE_ENV                # production | development — activa secure en cookies en producción
COOKIE_DOMAIN           # Dominio de cookies para subdominios (ver sección Cookies)
```

### CORS

- **Origin permitido**: valor de `FRONTEND_URL`
- **Credentials**: habilitado

---

## Autenticación

### Mecanismo

El backend usa **JWT en cookie httpOnly**. No se usan headers `Authorization` ni `localStorage`.

1. El frontend redirige al usuario a `GET /auth/twitch`
2. El backend genera un `state` aleatorio, lo guarda en una cookie httpOnly `oauth_state` (10 min) y redirige a Twitch con el parámetro `state` (protección CSRF)
3. El usuario autoriza en Twitch con scopes `channel:read:redemptions` y `channel:read:subscriptions`
4. Twitch redirige al callback del backend. El backend:
   - Verifica que el parámetro `state` de la query coincide con la cookie `oauth_state`
   - Borra la cookie `oauth_state`
   - Guarda tokens de Twitch en Supabase (`twitch_tokens`)
   - Crea o actualiza el usuario en la tabla `users`
   - Crea un overlay key automáticamente
   - Suscribe a eventos de suscripción y canjeo de recompensas
   - Genera un JWT con datos del usuario
   - Establece la cookie `token` (httpOnly, 7 días)
   - Redirige a `{FRONTEND_URL}/api/auth/callback` **sin token en la URL**
5. El frontend en `/api/auth/callback` llama a `GET /auth/me` para confirmar la sesión y obtener los datos del usuario
6. Todas las peticiones al backend usan `credentials: "include"` — la cookie se envía automáticamente

> **Nota de seguridad**: El JWT es invisible al JavaScript del frontend (cookie `httpOnly`). No se puede leer ni robar via XSS. La cookie se envía automáticamente por el browser en cada petición al mismo dominio.

### Cookies del backend

| Cookie | TTL | httpOnly | Descripción |
|--------|-----|----------|-------------|
| `oauth_state` | 10 min | Sí | Valor CSRF del flujo OAuth. Se borra al completar el callback. |
| `token` | 7 días | Sí | JWT de sesión. `secure` en producción, `sameSite: lax`. |

Ambas cookies se setean con los flags:
- `httpOnly: true` — JavaScript del frontend **no puede** leer ni modificar estas cookies
- `secure: true` en producción (`NODE_ENV=production`) — solo se envían por HTTPS
- `sameSite: "lax"` — protección contra CSRF en requests cross-site
- `domain`: valor de `COOKIE_DOMAIN` si está definido (ver abajo)

#### Configuración de dominio para cookies (COOKIE_DOMAIN)

Las cookies se envían automáticamente al dominio que las creó. Si frontend y backend están en **subdominios distintos** del mismo dominio, hay que configurar `COOKIE_DOMAIN` en el backend.

**Desarrollo** (sin `COOKIE_DOMAIN`):
```
Frontend: localhost:5173
Backend:  localhost:3000
→ No hace falta, mismo dominio, funciona automático
```

**Producción** (con `COOKIE_DOMAIN`):
```env
# .env del backend
COOKIE_DOMAIN=.memoraia.gg
```
```
Frontend: memoraia.gg          ← cookie visible aquí
Backend:  api.memoraia.gg      ← cookie seteada aquí
→ El punto inicial (.memoraia.gg) permite que la cookie cubra todos los subdominios
```

> **El frontend NO necesita configurar nada relacionado con cookies.** Solo debe usar `credentials: "include"` en todas las peticiones fetch al backend.

### Patrón de fetch en el frontend

Todas las llamadas al backend deben incluir `credentials: "include"` para que el browser envíe la cookie automáticamente:

```typescript
const API_URL = "https://api.memoraia.gg"; // o http://localhost:3000 en dev

// Todas las llamadas al backend — siempre con credentials
const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });

// Con body (POST, PATCH, etc.)
const res = await fetch(`${API_URL}/api/cards/fuse`, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ targetCardId: "...", materialCardIds: ["..."] }),
});
```

> **No usar** `Authorization: Bearer ...`. No guardar tokens en `localStorage`. La cookie httpOnly es el mecanismo de autenticación.

### Verificar sesión

Llamar `GET /auth/me` con `credentials: "include"`. Si devuelve `401`, el usuario no está logueado o la cookie expiró.

```typescript
const res = await fetch("/auth/me", { credentials: "include" });
if (res.status === 401) {
  // redirigir a /auth/twitch
}
const user = await res.json();
```

### JWT Payload

```typescript
{
  id: string;              // UUID interno de Memoraia
  twitchId: string;        // ID numérico de Twitch
  login: string;           // Username de Twitch (minúsculas)
  displayName: string;     // Nombre visible en Twitch
  role: "user" | "admin";  // Rol en la plataforma
  streamerEnabled: boolean; // Si tiene funcionalidades de streamer activas
}
```

Expira en **7 días**. El JWT nunca es accesible al JavaScript del frontend.

### Roles y permisos

| Combinación | Puede |
|-------------|-------|
| `role: "user"` + `streamerEnabled: false` | Ver cartas, participar en batallas, misiones |
| `role: "user"` + `streamerEnabled: true` | Todo lo anterior + crear cartas, gestionar overlay, configurar canal |
| `role: "admin"` | Todo lo anterior + crear cartas globales del sistema, gestionar plataforma |

### Guards de autorización

| Guard | Comportamiento |
|-------|----------------|
| `requireAuth` | Verifica la cookie `token`. `401` si no es válida. |
| `requireAdmin` | Verifica cookie + rol `admin` en el JWT. |
| `requireStreamer` | Verifica cookie + `streamerEnabled: true` en el JWT. |
| `requireFreshAdmin` | Igual que `requireAdmin` pero hace lookup en DB para confirmar rol actual. Usado en rutas admin críticas. |
| `requireFreshStreamer` | Igual que `requireStreamer` pero hace lookup en DB. Usado en rutas streamer críticas. |

---

## Endpoints

### Health Check

```
GET /health
Auth: No
```

**Response** `200`:
```json
{ "status": "ok" }
```

---

## Auth

### Iniciar login con Twitch

```
GET /auth/twitch
Auth: No
```

Genera un `state` aleatorio, lo guarda en la cookie `oauth_state` y redirige a Twitch OAuth.

**Response**: `302` redirect a Twitch OAuth (incluye `state` como parámetro)

---

### OAuth Callback (interno)

```
GET /auth/twitch/callback?code={code}&state={state}
Auth: No
```

**On Success**:
1. Verifica que `state` coincide con la cookie `oauth_state`
2. Intercambia el `code` por tokens de Twitch
3. Establece la cookie `token` con el JWT
4. `302` redirect a `{FRONTEND_URL}/api/auth/callback` (sin token en la URL)

**On Error**: `302` redirect a `{FRONTEND_URL}/auth/error`

Causas de error: state mismatch (posible CSRF), código inválido, Twitch rechazó la autorización.

---

### Obtener usuario actual

```
GET /auth/me
Auth: Cookie token (requireAuth)
```

**Response** `200`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "twitchId": "123456789",
  "login": "mi_usuario",
  "displayName": "Mi Usuario",
  "avatarUrl": "https://static-cdn.jtvnw.net/...",
  "role": "user",
  "streamerEnabled": false,
  "streamerBio": null,
  "streamerSlug": null,
  "dust": 0
}
```

**Error** `401`:
```json
{ "error": "Unauthorized" }
```

---

### Actualizar perfil

```
PATCH /auth/me
Auth: Cookie token (requireAuth)
Content-Type: application/json
```

**Body** (al menos un campo requerido):
```json
{
  "displayName": "Nuevo Nombre",
  "streamerBio": "Streamer de Valorant y coleccionista de cartas",
  "streamerSlug": "mi-canal"
}
```

Campos aceptados: `displayName`, `streamerBio`, `streamerSlug`. Se requiere al menos uno.

Los campos `role` y `streamerEnabled` NO son actualizables por este endpoint.

**Response** `200`: Mismo shape que `GET /auth/me`

**Errors**:
- `400` — cuerpo vacío o campos no permitidos
- `409` (vía Supabase) — `streamerSlug` ya está en uso

**Notas**:
- `streamerBio` y `streamerSlug` solo tienen sentido si `streamerEnabled: true`.

---

### Activar modo streamer

```
POST /auth/me/enable-streamer
Auth: Cookie token (requireAuth)
```

Activa las funcionalidades de streamer para el usuario. Una vez activado, no se desactiva por esta vía.

**Response** `200`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "streamerEnabled": true
}
```

**Notas**:
- El JWT en la cookie seguirá teniendo `streamerEnabled: false` hasta el próximo login. Para rutas protegidas con `requireStreamer` (que usan el JWT), se recomienda re-login después de activar.
- Las rutas con `requireFreshStreamer` hacen lookup en DB y no tienen este problema.

---

### Logout

```
POST /auth/logout
Auth: No
```

Borra la cookie `token` del browser.

**Response** `200`:
```json
{ "status": "ok" }
```

---

## Overlay

### Obtener overlay key y URL

```
GET /api/overlay/key
Auth: Cookie token (requireAuth)
```

**Response** `200`:
```json
{
  "overlayKey": "550e8400-e29b-41d4-a716-446655440000",
  "overlayUrl": "https://tu-dominio.com/overlay/550e8400-e29b-41d4-a716-446655440000/events"
}
```

---

### Regenerar overlay key

```
POST /api/overlay/key/regenerate
Auth: Cookie token (requireAuth)
```

**Response** `200`:
```json
{
  "overlayKey": "nuevo-uuid",
  "overlayUrl": "https://tu-dominio.com/overlay/nuevo-uuid/events"
}
```

Invalida la key anterior. Las conexiones SSE existentes con la key vieja siguen activas hasta que se desconecten, pero no se pueden crear nuevas.

---

### Simular evento de redemption (testing)

```
POST /api/overlay/test
Auth: Cookie token (requireAuth)
```

Envía un evento fake de redemption al SSE del usuario autenticado. Sirve para probar que el overlay está recibiendo eventos sin necesidad de canjear recompensas reales en Twitch.

**Response** `200`:
```json
{
  "status": "ok",
  "connections": 1
}
```

- `connections`: cantidad de overlays SSE activos para este usuario. Si es `0`, no hay ningún overlay escuchando.

**Evento SSE enviado**:
```
event: redemption
data: {
  "id": "uuid-generado",
  "userName": "test_viewer",
  "userInput": "quiero una carta legendaria!",
  "reward": {
    "id": "test-reward-id",
    "title": "Canjear Carta",
    "cost": 5000
  },
  "redeemedAt": "2026-04-04T12:00:00.000Z"
}
```

---

## Card Categories

### Listar categorías

```
GET /api/cards/categories
Auth: Cookie token (requireAuth)
```

**Query**:
- `streamerId` (opcional) — UUID del streamer. Si se omite, usa el usuario autenticado. Admins pueden pasar cualquier ID.

Devuelve las categorías del streamer indicado más las categorías `system` (globales).

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "streamerId": "uuid | null",
      "origin": "streamer | system",
      "name": "Legends",
      "description": null,
      "sortOrder": 0,
      "createdAt": "2026-04-03T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### Crear categoría

```
POST /api/cards/categories
Auth: Cookie token (requireStreamer)
Content-Type: application/json
```

**Body**:
```json
{
  "name": "Legends",
  "description": "Cartas legendarias del canal",
  "sortOrder": 1
}
```

- `name` — requerido
- `description` — opcional
- `sortOrder` — opcional, default `0`

**Response** `201`: objeto `CardCategory`

**Errors**:
- `409` — nombre ya existe para este streamer

---

### Actualizar categoría

```
PATCH /api/cards/categories/:id
Auth: Cookie token (requireAuth)
Content-Type: application/json
```

**Body** (todos opcionales):
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "sortOrder": 2
}
```

**Response** `200`: objeto `CardCategory` actualizado

**Errors**:
- `403` — no es el dueño ni admin
- `404` — categoría no encontrada

---

### Eliminar categoría

```
DELETE /api/cards/categories/:id
Auth: Cookie token (requireAuth)
```

**Response** `204`: sin cuerpo

**Errors**:
- `403` — no es el dueño ni admin
- `404` — categoría no encontrada
- `422` — la categoría tiene templates asociados y no puede eliminarse

---

## Card Templates

### Listar templates

```
GET /api/cards/templates
Auth: Cookie token (requireAuth)
```

**Query** (todos opcionales):
- `streamerId` — filtra por streamer (solo el propio o admin; otros IDs devuelven `403`)
- `categoryId` — filtra por categoría
- `rarity` — `common | uncommon | rare | epic | legendary`
- `origin` — `system | streamer`
- `isActive` — `true | false`
- `limit` — número de resultados
- `offset` — paginación

**Response** `200`:
```json
{
  "data": [ /* array de CardTemplate */ ],
  "total": 42
}
```

---

### Obtener template por ID

```
GET /api/cards/templates/:id
Auth: Cookie token (requireAuth)
```

Incluye el array de `media` (recuerdos multimedia vinculados).

**Response** `200`:
```json
{
  "id": "uuid",
  "streamerId": "uuid | null",
  "origin": "streamer",
  "categoryId": "uuid | null",
  "name": "El Gran Pepe",
  "description": null,
  "imageUrl": "https://...",
  "rarity": "rare",
  "baseAttack": 50,
  "baseDefense": 40,
  "baseAgility": 30,
  "growthAttack": 5,
  "growthDefense": 4,
  "growthAgility": 3,
  "dropWeight": 100,
  "isActive": true,
  "maxSupply": null,
  "createdAt": "2026-04-03T00:00:00.000Z",
  "updatedAt": "2026-04-03T00:00:00.000Z",
  "media": [
    {
      "id": "uuid",
      "templateId": "uuid",
      "mediaType": "vod",
      "url": "https://...",
      "title": "El momento épico",
      "sortOrder": 0
    }
  ]
}
```

**Errors**:
- `403` — template es `streamer` y no pertenece al usuario autenticado (ni es admin)
- `404` — template no encontrado

---

### Crear template

```
POST /api/cards/templates
Auth: Cookie token (requireAuth)
Content-Type: application/json
```

**Body**:
```json
{
  "origin": "streamer",
  "categoryId": "uuid",
  "name": "El Gran Pepe",
  "imageUrl": "https://...",
  "rarity": "rare",
  "baseAttack": 50,
  "baseDefense": 40,
  "baseAgility": 30,
  "growthAttack": 5,
  "growthDefense": 4,
  "growthAgility": 3,
  "dropWeight": 100,
  "maxSupply": null
}
```

- `origin` — requerido. Para `system` se requiere rol `admin`. Para `streamer` se requiere `streamerEnabled: true`.
- `name`, `imageUrl`, `rarity` — requeridos
- `categoryId`, `baseAttack`, `baseDefense`, `baseAgility`, `growthAttack`, `growthDefense`, `growthAgility`, `dropWeight`, `maxSupply` — opcionales

**Response** `201`: objeto `CardTemplate`

**Errors**:
- `403` — intentar crear `origin: system` sin ser admin, o `origin: streamer` sin tener streamer habilitado

---

### Actualizar template

```
PATCH /api/cards/templates/:id
Auth: Cookie token (requireAuth)
Content-Type: application/json
```

**Body** (todos opcionales):
```json
{
  "categoryId": "uuid | null",
  "name": "Nuevo nombre",
  "imageUrl": "https://...",
  "rarity": "epic",
  "baseAttack": 60,
  "baseDefense": 45,
  "baseAgility": 35,
  "growthAttack": 6,
  "growthDefense": 5,
  "growthAgility": 4,
  "dropWeight": 80,
  "maxSupply": 100
}
```

**Response** `200`: objeto `CardTemplate` actualizado

**Errors**:
- `403` — templates `system` solo admins; templates `streamer` solo el dueño o admin
- `404` — template no encontrado

---

### Eliminar template (soft delete)

```
DELETE /api/cards/templates/:id
Auth: Cookie token (requireAuth)
```

Realiza un soft delete (pone `isActive: false`). No elimina el registro.

**Response** `200`:
```json
{ "id": "uuid", "isActive": false }
```

**Errors**:
- `403` — no tiene permiso
- `404` — template no encontrado

---

### Agregar media a template

```
POST /api/cards/templates/:id/media
Auth: Cookie token (requireAuth)
Content-Type: application/json
```

**Body**:
```json
{
  "mediaType": "vod",
  "url": "https://...",
  "title": "El momento épico",
  "sortOrder": 0
}
```

- `mediaType` — `vod | image | video | link`
- `url` — requerido
- `title`, `sortOrder` — opcionales

**Response** `201`: objeto `CardMedia`
```json
{
  "id": "uuid",
  "templateId": "uuid",
  "mediaType": "vod",
  "url": "https://...",
  "title": "El momento épico",
  "sortOrder": 0
}
```

**Errors**:
- `403` — no tiene permiso sobre el template
- `404` — template no encontrado

---

### Eliminar media de template

```
DELETE /api/cards/templates/:id/media/:mediaId
Auth: Cookie token (requireAuth)
```

**Response** `204`: sin cuerpo

**Errors**:
- `403` — no tiene permiso sobre el template
- `404` — template o media no encontrado

---

## Channel Card Pool

### Listar pool del canal

```
GET /api/cards/pool
Auth: Cookie token (requireStreamer)
```

**Query** (todos opcionales):
- `isEnabled` — `true | false` — filtra por estado habilitado/deshabilitado
- `limit` — número de resultados (default: todos)
- `offset` — paginación

Devuelve las cartas globales (`origin: system`) asignadas al canal del streamer autenticado, ordenadas por `addedAt` descendente.

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "streamerId": "uuid",
      "templateId": "uuid",
      "customWeight": null,
      "isEnabled": true,
      "addedAt": "2026-04-03T00:00:00.000Z",
      "template": {
        "id": "uuid",
        "name": "El Gran Pepe",
        "rarity": "rare",
        "imageUrl": "https://...",
        "dropWeight": 100,
        "isActive": true
      }
    }
  ],
  "total": 5
}
```

---

### Actualizar entrada del pool

```
PATCH /api/cards/pool/:templateId
Auth: Cookie token (requireStreamer)
Content-Type: application/json
```

**Body** (al menos uno requerido):
```json
{
  "isEnabled": false,
  "customWeight": 150
}
```

- `isEnabled` — habilitar/deshabilitar la carta en el canal
- `customWeight` — peso personalizado para el drop (sobreescribe `dropWeight` del template). `null` para quitar el override.

**Response** `200`: objeto `PoolEntry` actualizado

**Errors**:
- `400` — ningún campo enviado
- `404` — template no encontrado en el pool del streamer

---

## Tier Rarity Modifiers

### Listar modificadores del canal

```
GET /api/cards/modifiers
Auth: Cookie token (requireStreamer)
```

Devuelve los multiplicadores de probabilidad configurados para cada combinación de tier de suscripción y rareza del canal.

**Response** `200`:
```json
[
  {
    "id": "uuid",
    "streamerId": "uuid",
    "tier": "1000",
    "rarity": "common",
    "weightMultiplier": 1.0
  },
  {
    "id": "uuid",
    "streamerId": "uuid",
    "tier": "3000",
    "rarity": "legendary",
    "weightMultiplier": 3.0
  }
]
```

- `tier` — `1000` (Tier 1) | `2000` (Tier 2) | `3000` (Tier 3)

---

### Actualizar modificadores (bulk upsert)

```
PATCH /api/cards/modifiers
Auth: Cookie token (requireStreamer)
Content-Type: application/json
```

**Body**:
```json
{
  "modifiers": [
    { "tier": "1000", "rarity": "common", "weightMultiplier": 1.0 },
    { "tier": "2000", "rarity": "rare", "weightMultiplier": 2.0 },
    { "tier": "3000", "rarity": "legendary", "weightMultiplier": 4.0 }
  ]
}
```

Realiza un upsert por `(streamerId, tier, rarity)`. Se pueden enviar entre 1 y todas las combinaciones (15 en total: 3 tiers × 5 rarezas).

**Response** `200`: array de objetos `TierRarityModifier` actualizados

---

## User Cards (Inventario)

### Listar inventario

```
GET /api/cards/inventory
Auth: Cookie token (requireAuth)
```

**Query** (todos opcionales):
- `userId` — solo admins pueden pasar un userId distinto al propio
- `templateId` — filtra por template
- `rarity` — `common | uncommon | rare | epic | legendary`
- `isActive` — `true | false` (default: `true`)
- `limit` — número de resultados
- `offset` — paginación

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "ownerId": "uuid",
      "templateId": "uuid",
      "level": 1,
      "xp": 0,
      "attack": 50,
      "defense": 40,
      "agility": 30,
      "obtainedVia": "subscription",
      "isActive": true,
      "destroyedAt": null,
      "destroyedReason": null,
      "obtainedAt": "2026-04-03T00:00:00.000Z",
      "template": {
        "id": "uuid",
        "name": "El Gran Pepe",
        "rarity": "rare",
        "imageUrl": "https://..."
      }
    }
  ],
  "total": 12
}
```

---

### Obtener carta por ID

```
GET /api/cards/inventory/:id
Auth: Cookie token (requireAuth)
```

**Response** `200`: objeto `UserCard` completo

**Errors**:
- `403` — la carta pertenece a otro usuario y el solicitante no es admin
- `404` — carta no encontrada

---

## Card Fusion

### Fusionar cartas

```
POST /api/cards/fuse
Auth: Cookie token (requireAuth)
Content-Type: application/json
```

Consume las `materialCardIds` (destruidas permanentemente) y transfiere XP a `targetCardId`. Las cartas deben ser del mismo template.

**Body**:
```json
{
  "targetCardId": "uuid",
  "materialCardIds": ["uuid-1", "uuid-2"]
}
```

- `materialCardIds` — entre 1 y 5 elementos
- `targetCardId` no puede estar incluido en `materialCardIds`

**Response** `200`:
```json
{
  "fusion": {
    "id": "uuid",
    "targetCardId": "uuid",
    "xpGained": 100,
    "cardsConsumed": 2,
    "createdAt": "2026-04-03T00:00:00.000Z"
  },
  "targetCard": { /* UserCard actualizada */ }
}
```

**Errors**:
- `403` — alguna carta no pertenece al usuario
- `404` — carta no encontrada
- `409` — conflicto de estado
- `422` — validación fallida (cantidad inválida, templates distintos, carta inactiva, etc.)

---

## Simular Drop de Carta

### Simular drop

```
POST /api/cards/drop/simulate
Auth: Cookie token (requireAuth — admin + streamerEnabled)
Content-Type: application/json
```

Simula un drop de carta a un usuario específico sin necesidad de una suscripción real de Twitch. Solo disponible para usuarios con rol `admin` Y `streamerEnabled: true`.

**Body**:
```json
{
  "userId": "uuid-del-usuario-que-recibe-la-carta",
  "tier": "1000"
}
```

| Campo    | Tipo          | Requerido | Default  | Descripción                                  |
|----------|---------------|-----------|----------|----------------------------------------------|
| `userId` | string (UUID) | sí        | —        | ID del usuario que recibirá la carta         |
| `tier`   | string        | no        | `"1000"` | Tier de suscripción: `"1000"`, `"2000"` o `"3000"` |

El tier afecta los pesos de drop si el streamer tiene `tier_rarity_modifiers` configurados.

**Response** `201`:
```json
{
  "user_card_id": "uuid",
  "template_id": "uuid",
  "template_name": "El Gran Pepe",
  "rarity": "rare",
  "attack": 52,
  "defense": 41,
  "agility": 33
}
```

**Errors**:
- `403` — el caller no es admin o no tiene streamer habilitado
- `404` — el `userId` no existe en la tabla `users`
- `422` — el streamer no tiene templates en su pool (pool vacío o sin templates elegibles)

**Requisitos previos**: el streamer (caller) debe tener al menos un card template activo o entradas habilitadas en su channel_card_pool.

---

## Dust Economy

### Destruir carta por dust

```
POST /api/cards/dust/destroy
Auth: Cookie token (requireAuth)
Content-Type: application/json
```

Destruye una carta del inventario y acredita dust al usuario.

**Body**:
```json
{ "cardId": "uuid" }
```

**Response** `200`:
```json
{
  "dustGained": 25,
  "newBalance": 125,
  "cardId": "uuid",
  "transaction": {
    "id": "uuid",
    "amount": 25,
    "balanceAfter": 125,
    "reason": "card_destroy",
    "createdAt": "2026-04-03T00:00:00.000Z"
  }
}
```

**Errors**:
- `403` — la carta no pertenece al usuario
- `404` — carta no encontrada
- `422` — la carta no puede destruirse (inactiva, legendaria, etc.)

---

### Fabricar carta con dust

```
POST /api/cards/dust/craft
Auth: Cookie token (requireAuth)
Content-Type: application/json
```

Gasta dust del usuario para crear una instancia de un template de carta.

**Body**:
```json
{ "templateId": "uuid" }
```

**Response** `201`:
```json
{
  "card": { /* UserCard recién creada */ },
  "dustSpent": 100,
  "newBalance": 25,
  "transaction": { /* DustTransaction */ }
}
```

**Errors**:
- `404` — template no encontrado
- `422` — saldo de dust insuficiente, template inactivo, max supply alcanzado, etc.

---

### Historial de transacciones de dust

```
GET /api/cards/dust/history
Auth: Cookie token (requireAuth)
```

**Query** (todos opcionales):
- `reason` — filtra por motivo (`card_destroy`, `card_craft`, `battle_win`, `mission`, etc.)
- `userId` — solo admins pueden consultar otro usuario
- `limit` — número de resultados
- `offset` — paginación

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "amount": 25,
      "balanceAfter": 125,
      "reason": "card_destroy",
      "createdAt": "2026-04-03T00:00:00.000Z"
    }
  ],
  "total": 10,
  "currentBalance": 125
}
```

---

## Battles

### Crear batalla

```
POST /api/battles
Auth: Cookie token (requireStreamer)
Content-Type: application/json
```

El streamer inicia una batalla entre dos cartas de viewers.

**Body**:
```json
{
  "challengerCardId": "uuid",
  "defenderCardId": "uuid",
  "streamId": "opcional-string"
}
```

- `challengerCardId` y `defenderCardId` deben ser UUIDs válidos y distintos entre sí

**Response** `201`: objeto `Battle`
```json
{
  "id": "uuid",
  "streamerId": "uuid",
  "challengerCardId": "uuid",
  "defenderCardId": "uuid",
  "status": "pending",
  "streamId": null,
  "createdAt": "2026-04-03T00:00:00.000Z"
}
```

**Validaciones de ownership** (todas devuelven `422`):
- Las cartas deben existir y estar activas (`isActive: true`)
- Las cartas deben pertenecer a usuarios distintos
- Ninguna carta puede pertenecer al streamer que crea la batalla
- (Validación de batalla en curso: las cartas no pueden estar ya en una batalla `pending` o `active`)

**Errors**:
- `400` — challenger y defender son la misma carta
- `404` — carta no encontrada
- `422` — carta inactiva, cartas del mismo dueño, o la carta pertenece al streamer

---

### Resolver batalla

```
POST /api/battles/:id/resolve
Auth: Cookie token (requireStreamer)
Content-Type: application/json
```

El streamer declara el ganador. Distribuye XP y dust al ganador.

Al resolverse, emite un evento SSE `battle.resolved` al canal del streamer.

**Body**:
```json
{ "winnerCardId": "uuid" }
```

- `winnerCardId` debe ser el `challengerCardId` o `defenderCardId` de la batalla

**Response** `200`:
```json
{
  "id": "uuid",
  "status": "finished",
  "winnerCard": { /* UserCard ganadora */ },
  "xpGained": 50,
  "finishedAt": "2026-04-03T00:00:00.000Z"
}
```

**Errors**:
- `400` — la carta no es participante en esta batalla
- `403` — el streamer no es el dueño de la batalla
- `404` — batalla no encontrada
- `422` — la batalla ya está resuelta

---

### Listar batallas

```
GET /api/battles
Auth: Cookie token (requireAuth)
```

**Query** (todos opcionales):
- `streamerId` — filtra por canal del streamer
- `status` — `pending | finished`
- `limit` — número de resultados
- `offset` — paginación

**Response** `200`:
```json
{
  "data": [ /* array de Battle */ ],
  "total": 20
}
```

---

### Obtener batalla por ID

```
GET /api/battles/:id
Auth: Cookie token (requireAuth)
```

**Response** `200`: objeto `Battle` completo

**Errors**:
- `404` — batalla no encontrada

---

## Missions

### Listar misiones disponibles

```
GET /api/missions
Auth: Cookie token (requireAuth)
```

**Query** (todos opcionales):
- `missionType` — `daily | weekly | special`
- `isActive` — `true | false`
- `limit` — número de resultados
- `offset` — paginación

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Primera batalla",
      "description": "Participa en tu primera batalla",
      "missionType": "daily",
      "rewardType": "dust",
      "rewardAmount": 50,
      "rewardCardId": null,
      "requirements": {},
      "isActive": true,
      "createdAt": "2026-04-03T00:00:00.000Z"
    }
  ],
  "total": 5
}
```

---

### Mis misiones (progreso)

```
GET /api/missions/me
Auth: Cookie token (requireAuth)
```

**Query** (todos opcionales):
- `status` — `in_progress | completed | claimed`
- `limit` — número de resultados
- `offset` — paginación

**Response** `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "missionId": "uuid",
      "status": "in_progress",
      "progress": 0,
      "claimedAt": null,
      "createdAt": "2026-04-03T00:00:00.000Z"
    }
  ],
  "total": 3
}
```

---

### Reclamar recompensa de misión

```
POST /api/missions/:id/claim
Auth: Cookie token (requireAuth)
```

El `:id` es el ID de la misión (`mission.id`), no el `user_mission.id`.

**Response** `200`:
```json
{
  "userMission": {
    "id": "uuid",
    "status": "claimed"
  },
  "reward": {
    "type": "dust",
    "amount": 50,
    "card": null
  }
}
```

- `reward.card` — objeto `UserCard` si `rewardType` es `card`, `null` en caso contrario

**Errors**:
- `404` — misión no encontrada para este usuario
- `422` — misión no completada o recompensa ya reclamada

---

### [Admin] Crear misión

```
POST /api/admin/missions
Auth: Cookie token (requireAdmin)
Content-Type: application/json
```

**Body**:
```json
{
  "name": "Primera batalla",
  "description": "Participa en tu primera batalla",
  "missionType": "daily",
  "rewardType": "dust",
  "rewardAmount": 50,
  "rewardCardId": null,
  "requirements": {}
}
```

- `rewardCardId` — requerido si `rewardType` es `card`
- `requirements` — objeto libre para condiciones de la misión

**Response** `201`: objeto `Mission`

**Errors**:
- `400` — `rewardType: card` sin `rewardCardId`

---

### [Admin] Actualizar misión

```
PATCH /api/admin/missions/:id
Auth: Cookie token (requireAdmin)
Content-Type: application/json
```

**Body** (todos opcionales):
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "missionType": "weekly",
  "rewardType": "dust",
  "rewardAmount": 100,
  "rewardCardId": null,
  "requirements": {},
  "isActive": false
}
```

**Response** `200`: objeto `Mission` actualizado

**Errors**:
- `404` — misión no encontrada

---

## Physical Cards

### Solicitar carta física

```
POST /api/cards/physical
Auth: Cookie token (requireAuth)
Content-Type: application/json
```

El usuario solicita convertir una carta digital de su inventario en una carta física.

**Body**:
```json
{
  "userCardId": "uuid",
  "shippingInfo": {
    "name": "Juan Pérez",
    "address": "Calle Falsa 123",
    "city": "Madrid",
    "country": "ES"
  }
}
```

- `shippingInfo` — objeto libre, opcional en el body pero recomendado para el proceso de envío

**Response** `201`:
```json
{
  "id": "uuid",
  "userCardId": "uuid",
  "userId": "uuid",
  "status": "pending",
  "verificationCode": null,
  "shippingInfo": { /* ... */ },
  "createdAt": "2026-04-03T00:00:00.000Z"
}
```

**Errors**:
- `403` — la carta no pertenece al usuario
- `404` — carta no encontrada
- `409` — ya existe una solicitud para esta carta
- `422` — la carta no está activa

---

### Mis solicitudes de carta física

```
GET /api/cards/physical
Auth: Cookie token (requireAuth)
```

**Query** (todos opcionales):
- `status` — `pending | approved | shipped | delivered | rejected`
- `limit` — número de resultados
- `offset` — paginación

**Response** `200`:
```json
{
  "data": [ /* array de PhysicalCard */ ],
  "total": 2
}
```

---

### [Admin] Actualizar estado de solicitud física

```
PATCH /api/admin/physical/:id
Auth: Cookie token (requireAdmin)
Content-Type: application/json
```

**Body** (al menos uno requerido):
```json
{
  "status": "shipped",
  "verificationCode": "ABC-123",
  "shippingInfo": { "trackingNumber": "ES123456789" }
}
```

**Response** `200`: objeto `PhysicalCard` actualizado

**Errors**:
- `400` — ningún campo enviado, o transición de estado inválida
- `404` — solicitud no encontrada

---

## SSE — Server-Sent Events (Overlay)

### Conectar al stream

```
GET /overlay/{key}/events
Auth: No (la key en la URL actúa como token)
```

El SSE del overlay NO usa cookies. La autenticación es la `overlayKey` en la propia URL, pensada para ser usada directamente desde OBS Browser Source.

**Response Headers**:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
Access-Control-Allow-Origin: *
```

**Error** `404`:
```json
{ "error": "Invalid overlay key" }
```

---

### Eventos SSE

#### `connected` — al establecer conexión

```
event: connected
data: {"userId":"123456789"}
```

#### `redemption` — cuando alguien canjea una recompensa (o se usa el endpoint de test)

```
event: redemption
data: {
  "id": "redemption-uuid",
  "userName": "nombre_del_viewer",
  "userInput": "texto que escribió el viewer (puede ser vacío)",
  "reward": {
    "id": "reward-uuid",
    "title": "Nombre de la recompensa",
    "cost": 5000
  },
  "redeemedAt": "2026-03-30T12:34:56Z"
}
```

#### `channel.update` — cuando el streamer cambia título o categoría

```
event: channel.update
data: {
  "channel": "nombre_del_canal",
  "title": "Nuevo título del stream",
  "category": "Just Chatting",
  "language": "es"
}
```

#### Keep-alive (cada 30s)

```
:keepalive
```

Comentario SSE, no es un evento. Evita que la conexión se cierre por timeout.

---

### Ejemplo de integración SSE en React

```typescript
function useOverlayEvents(overlayUrl: string) {
  useEffect(() => {
    const source = new EventSource(overlayUrl);

    source.addEventListener("connected", (e) => {
      const data = JSON.parse(e.data);
      console.log("Overlay conectado, userId:", data.userId);
    });

    source.addEventListener("redemption", (e) => {
      const data = JSON.parse(e.data);
      // data.id, data.userName, data.reward.title, data.reward.cost, data.userInput
    });

    source.addEventListener("channel.update", (e) => {
      const data = JSON.parse(e.data);
      // data.channel, data.title, data.category, data.language
    });

    source.onerror = () => {
      // EventSource se reconecta automáticamente
      console.warn("SSE desconectado, reconectando...");
    };

    return () => source.close();
  }, [overlayUrl]);
}
```

### OBS Browser Source

1. En OBS -> Fuentes -> Browser Source
2. URL: el `overlayUrl` de `GET /api/overlay/key`
3. Ancho/Alto: según tu overlay
4. No necesita autenticación
5. EventSource se reconecta automáticamente si se pierde conexión

---

## Base de datos — Schema

### Tablas existentes (auth/overlay)

| Tabla | Propósito |
|-------|-----------|
| `twitch_tokens` | Tokens OAuth de Twitch (access_token, refresh_token) |
| `overlay_keys` | Keys para conectar overlays de OBS via SSE |

### Tablas Memoraia

| Tabla | Propósito |
|-------|-----------|
| `users` | Entidad central. Roles (user/admin), flag streamer, saldo de dust |
| `card_categories` | Categorías de cartas por streamer + globales del sistema |
| `card_templates` | Diseños de cartas con stats base, rareza, drop_weight, growth rates |
| `card_media` | Recuerdos multimedia (VOD, imagen, video, link) vinculados al template |
| `channel_card_pool` | Cartas globales habilitadas/deshabilitadas por canal con peso custom |
| `tier_rarity_modifiers` | Multiplicadores de probabilidad de drop por tier de suscripción y rareza |
| `user_cards` | Instancias de cartas con nivel, XP, stats propios |
| `subscription_drops` | Historial de entregas de cartas por suscripción (idempotente) |
| `card_fusions` | Registro de fusiones de cartas duplicadas |
| `card_fusion_materials` | Detalle de cartas consumidas en cada fusión |
| `battles` | Batallas en stream entre cartas |
| `dust_transactions` | Ledger de la economía de polvo (source of truth) |
| `missions` | Templates de misiones (daily/weekly/special) |
| `user_missions` | Progreso de misiones por usuario |
| `physical_cards` | Conversión y envío de cartas físicas |

### Relaciones clave

```
users ─┬── card_categories (streamer crea)
       ├── card_templates (streamer o admin crea)
       │       ├── card_media (recuerdos del template)
       │       └── channel_card_pool (control de globales por canal)
       ├── user_cards (viewer posee instancias)
       │       ├── subscription_drops (historial de entregas)
       │       ├── card_fusions + card_fusion_materials (merge duplicadas)
       │       ├── battles (pelea entre cartas)
       │       └── physical_cards (conversión a física)
       ├── dust_transactions (ledger de polvo)
       └── user_missions (progreso de misiones)
```

### Card origin

Las cartas tienen un campo `origin`:
- `system` — Creadas por admins, aparecen en todos los canales (via `channel_card_pool`)
- `streamer` — Creadas por el streamer, solo aparecen en su canal

Cuando un admin crea una carta `system`, un trigger la inserta automáticamente en el `channel_card_pool` de todos los streamers activos. El streamer puede deshabilitarla o ajustar su peso.

### Rarezas

```
common | uncommon | rare | epic | legendary
```

### Sistema de drop por suscripción

El pool de cartas de un streamer se calcula así:

```
Pool = cartas propias del streamer (origin: streamer)
     + cartas globales habilitadas (channel_card_pool WHERE is_enabled)
```

El peso efectivo para el random:

```
peso_efectivo = drop_weight × tier_rarity_modifier

Ejemplo: template "Pepe Raro" (rare, drop_weight: 100) + Tier 3 (rare multiplier: 2.00)
         peso_efectivo = 100 × 2.00 = 200
```

### Sistema de niveles y fusión

- Las cartas suben de nivel ganando XP (batallas, fusión, misiones)
- Fusionar cartas duplicadas del mismo template otorga XP a la carta objetivo
- Las cartas consumidas se destruyen permanentemente
- Stats por nivel: `stat = base_stat + (level - 1) × growth_rate`
- XP para nivel N: `100 × N²`

### Economía de dust

- `users.dust` es el saldo cacheado (para queries rápidos)
- `dust_transactions` es el ledger (source of truth)
- Se gana dust al: destruir cartas, ganar batallas, completar misiones, bonus diario
- Se gasta dust al: fabricar cartas

---

## Tipos de datos

### JWT Payload

```typescript
{
  id: string;               // UUID interno de Memoraia
  twitchId: string;         // ID numérico de Twitch
  login: string;            // Username de Twitch (minúsculas)
  displayName: string;      // Nombre visible en Twitch
  role: "user" | "admin";   // Rol en la plataforma
  streamerEnabled: boolean; // Si tiene funcionalidades de streamer activas
}
```

El JWT nunca es accesible al JavaScript del frontend. Vive exclusivamente en la cookie `httpOnly`.

### User (response de /auth/me)

```typescript
{
  id: string;
  twitchId: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  role: "user" | "admin";
  streamerEnabled: boolean;
  streamerBio: string | null;
  streamerSlug: string | null;
  dust: number;
}
```

### Redemption Event (evento SSE)

```typescript
{
  id: string;           // ID único del canjeo
  userName: string;     // Quién canjeó
  userInput: string;    // Texto del viewer (puede estar vacío)
  reward: {
    id: string;         // ID de la recompensa en Twitch
    title: string;      // Nombre de la recompensa
    cost: number;       // Costo en puntos de canal
  };
  redeemedAt: string;   // ISO 8601 timestamp
}
```

### Channel Update Event (evento SSE)

```typescript
{
  channel: string;      // Nombre del canal
  title: string;        // Título del stream
  category: string;     // Categoría/juego
  language: string;     // Idioma (ej: "es")
}
```

### CardCategory

```typescript
{
  id: string;
  streamerId: string | null;
  origin: "system" | "streamer";
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;     // ISO 8601
}
```

### CardTemplate

```typescript
{
  id: string;
  streamerId: string | null;
  origin: "system" | "streamer";
  categoryId: string | null;
  name: string;
  description: string | null;
  imageUrl: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  baseAttack: number;
  baseDefense: number;
  baseAgility: number;
  growthAttack: number;
  growthDefense: number;
  growthAgility: number;
  dropWeight: number;
  isActive: boolean;
  maxSupply: number | null;
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
  // solo en GET /api/cards/templates/:id:
  media?: CardMedia[];
}
```

### CardMedia

```typescript
{
  id: string;
  templateId: string;
  mediaType: "vod" | "image" | "video" | "link";
  url: string;
  title: string | null;
  sortOrder: number;
}
```

### UserCard

```typescript
{
  id: string;
  ownerId: string;
  templateId: string;
  level: number;
  xp: number;
  attack: number;
  defense: number;
  agility: number;
  obtainedVia: string;    // "subscription" | "craft" | "fusion" | "mission" | ...
  isActive: boolean;
  destroyedAt: string | null;
  destroyedReason: string | null;
  obtainedAt: string;    // ISO 8601
  template: {
    id: string;
    name: string;
    rarity: string;
    imageUrl: string;
  };
}
```

### Battle

```typescript
{
  id: string;
  streamerId: string;
  challengerCardId: string;
  defenderCardId: string;
  status: "pending" | "finished";
  streamId: string | null;
  createdAt: string;     // ISO 8601
}
```

### Mission

```typescript
{
  id: string;
  name: string;
  description: string;
  missionType: "daily" | "weekly" | "special";
  rewardType: "dust" | "card";
  rewardAmount: number;
  rewardCardId: string | null;
  requirements: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;     // ISO 8601
}
```

### PhysicalCard

```typescript
{
  id: string;
  userCardId: string;
  userId: string;
  status: "pending" | "approved" | "shipped" | "delivered" | "rejected";
  verificationCode: string | null;
  shippingInfo: Record<string, unknown> | null;
  createdAt: string;     // ISO 8601
}
```

---

## Seguridad

### OAuth CSRF (state parameter)

Cada vez que se inicia el flujo OAuth, el backend genera un `state` de 32 bytes aleatorios, lo guarda en una cookie httpOnly `oauth_state` con TTL de 10 minutos y lo envía a Twitch como parámetro. En el callback, verifica que el `state` de la query coincide con el de la cookie. Un mismatch aborta el flujo y redirige a `/auth/error`.

### JWT en cookie httpOnly

El JWT no viaja en la URL ni se almacena en `localStorage`. Vive en una cookie `httpOnly`, invisible al JavaScript del frontend. Esto elimina la superficie de ataque de XSS para el robo de tokens.

### Verificación de webhooks de Twitch

Los webhooks entrantes de Twitch se validan con HMAC-SHA256 usando `TWITCH_WEBHOOK_SECRET`. La comparación se realiza con `timingSafeEqual` para evitar timing attacks.

### Validación de variables de entorno al arranque

Todas las variables de entorno requeridas se validan antes de que el servidor acepte conexiones. Una variable faltante produce un error inmediato con el listado de las variables ausentes.

### Validación de inputs con Zod

Todos los request bodies y query strings se validan con esquemas Zod. Un input inválido devuelve `400` con el detalle del error de validación. Los path params UUID se validan con un esquema de UUID.

### Ownership en batallas

`POST /api/battles` verifica que ambas cartas existen, están activas, pertenecen a usuarios distintos y ninguna pertenece al streamer que crea la batalla. Las funciones RPC de resolución de batallas usan row-level locking para prevenir condiciones de carrera.

### Guards con DB lookup

`requireFreshAdmin` y `requireFreshStreamer` hacen un lookup en base de datos en cada petición para confirmar que el rol o flag del usuario no fue revocado entre la emisión del JWT y la petición actual. Se usan en rutas críticas de admin y streamer.

---

## Flujo completo

```
── AUTH Y CONFIGURACIÓN ────────────────────────────────────────────────────
1. Usuario abre el frontend
2. Click "Login con Twitch" → GET /auth/twitch
3. Backend genera state CSRF, guarda cookie oauth_state, redirige a Twitch
4. Usuario autoriza en Twitch → redirect al backend con code y state
5. Backend verifica state, crea/actualiza usuario, establece cookie token
6. Redirect a {FRONTEND_URL}/api/auth/callback (sin token en la URL)
7. Frontend llama GET /auth/me → confirma sesión, muestra info del usuario
8. Si el usuario quiere ser streamer → POST /auth/me/enable-streamer → re-login

── SETUP DEL CANAL (streamer) ──────────────────────────────────────────────
9.  Streamer crea categorías → POST /api/cards/categories
10. Streamer crea sus templates de carta → POST /api/cards/templates
11. Streamer gestiona las cartas globales del sistema → GET /api/cards/pool
    → puede deshabilitar o ajustar peso → PATCH /api/cards/pool/:templateId
12. Streamer configura multiplicadores por tier → PATCH /api/cards/modifiers
13. Streamer obtiene URL del overlay → GET /api/overlay/key
14. Streamer copia URL → la pega en OBS Browser Source
15. OBS conecta al SSE → recibe evento "connected"
16. Para probar: POST /api/overlay/test → simula redemption → OBS muestra la carta

── FLUJO DE SUBSCRIPCIÓN Y DROPS ───────────────────────────────────────────
17. En producción: viewer se suscribe → Twitch webhook → backend calcula
    → selecciona carta random → crea instancia en user_cards
    → SSE → OBS muestra animación de carta

── GESTIÓN DE INVENTARIO (viewer) ──────────────────────────────────────────
18. Viewer consulta su inventario → GET /api/cards/inventory
19. Viewer fusiona duplicados → POST /api/cards/fuse (gana XP en la carta objetivo)
20. Viewer destruye cartas → POST /api/cards/dust/destroy (gana dust)
21. Viewer fabrica cartas → POST /api/cards/dust/craft (gasta dust)
22. Viewer consulta su saldo y historial → GET /api/cards/dust/history

── BATALLAS EN STREAM ──────────────────────────────────────────────────────
23. Streamer inicia batalla → POST /api/battles (verifica ownership de cartas)
24. Después del combate: streamer declara ganador → POST /api/battles/:id/resolve
    → el ganador recibe XP y dust → SSE emite evento "battle.resolved"

── MISIONES ────────────────────────────────────────────────────────────────
25. Viewer consulta misiones disponibles → GET /api/missions
26. Viewer ve su progreso → GET /api/missions/me
27. Al completar una misión: reclama recompensa → POST /api/missions/:id/claim

── CARTAS FÍSICAS ──────────────────────────────────────────────────────────
28. Viewer solicita carta física → POST /api/cards/physical
29. Admin gestiona solicitudes → PATCH /api/admin/physical/:id
```

---

## Testing

Para probar el pipeline completo sin recompensas reales de Twitch:

1. Loguearse via `/auth/twitch`
2. Obtener el overlay URL via `GET /api/overlay/key` (con `credentials: "include"`)
3. Abrir el overlay URL en otra pestaña del browser (simula OBS)
4. Llamar `POST /api/overlay/test` (con `credentials: "include"`)
5. Verificar que la pestaña del overlay recibe el evento `redemption`

También se puede probar `channel.update` cambiando el título del canal en el dashboard de Twitch.

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | Cookie ausente, inválida o expirada | Redirigir a `/auth/twitch` para re-autenticar |
| `403 Forbidden` | Usuario no tiene el rol necesario (admin/streamer) | Verificar permisos del usuario |
| `404 Invalid overlay key` | Key no existe o fue regenerada | Llamar `GET /api/overlay/key` para obtener la actual |
| Cookie no se envía | Falta `credentials: "include"` en el fetch | Añadir `credentials: "include"` a todas las llamadas al backend |
| OAuth state mismatch | El usuario tardó más de 10 min, o abrió múltiples tabs del flujo OAuth simultáneamente | Reiniciar el flujo desde `/auth/twitch` |
| `redirect_mismatch` en Twitch | `TWITCH_CALLBACK_URL` no coincide con Twitch Developer Console | Verificar que la redirect URI en Twitch sea exactamente `{TWITCH_CALLBACK_URL}/auth/twitch/callback` |
| SSE se desconecta | Network issue | `EventSource` se reconecta automáticamente |
| `409 Conflict` en subscription | Ya existe la subscription | Se ignora automáticamente |
| `connections: 0` en test | No hay overlay escuchando | Abrir el overlay URL en una pestaña primero |
