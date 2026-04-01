# TwitchSub Backend — API Documentation

## Configuration

### Environment Variables

```
PORT                    # Server port (default: 3000)
FRONTEND_URL            # Frontend origin for CORS (default: http://localhost:5173)
JWT_SECRET              # Secret for signing JWT tokens
TWITCH_CLIENT_ID        # Twitch OAuth app client ID
TWITCH_CLIENT_SECRET    # Twitch OAuth app client secret
TWITCH_CALLBACK_URL     # Base URL pública (ngrok o dominio), SIN trailing slash ni rutas
TWITCH_WEBHOOK_SECRET   # Secret para validar webhooks de Twitch
TWITCH_BROADCASTER_ID   # ID numérico del canal
SUPABASE_URL            # URL del proyecto Supabase
SUPABASE_SECRET_KEY     # Secret key de Supabase
```

### CORS

- **Origin permitido**: valor de `FRONTEND_URL`
- **Credentials**: habilitado

---

## Autenticación

### Mecanismo

El backend usa **JWT via Bearer token**. No se usan cookies.

1. El frontend redirige al usuario a `GET /auth/twitch`
2. El usuario autoriza en Twitch con scope `channel:read:redemptions`
3. Twitch redirige al callback del backend
4. El backend:
   - Guarda tokens de Twitch en Supabase
   - Crea un overlay key automáticamente
   - Suscribe a eventos de canjeo de recompensas
   - Genera un JWT
   - Redirige a `{FRONTEND_URL}/api/auth/callback?token={JWT}`
5. El frontend lee el `token` del query param y lo guarda (localStorage, cookie propia, etc.)
6. En cada request al backend, el frontend envía el header `Authorization: Bearer {token}`

### Verificar sesión

Llamar `GET /auth/me` con el header `Authorization: Bearer {token}`. Si devuelve `401`, el usuario no está logueado o el token expiró.

### JWT Payload

```typescript
{
  userId: string;      // ID numérico de Twitch
  login: string;       // Username de Twitch (minúsculas)
  displayName: string; // Nombre visible en Twitch
}
```

Expira en **7 días**.

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

### Iniciar login con Twitch

```
GET /auth/twitch
Auth: No
```

**Response**: `302` redirect a Twitch OAuth

---

### OAuth Callback (interno)

```
GET /auth/twitch/callback?code={code}
Auth: No
```

**On Success**: `302` redirect a `{FRONTEND_URL}/api/auth/callback?token={JWT}`

**On Error**: `302` redirect a `{FRONTEND_URL}/auth/error`

El frontend debe leer el `token` del query param en `/api/auth/callback` y almacenarlo.

---

### Obtener usuario actual

```
GET /auth/me
Auth: Bearer token
Header: Authorization: Bearer {token}
```

**Response** `200`:
```json
{
  "userId": "123456789",
  "login": "mi_usuario",
  "displayName": "Mi Usuario"
}
```

**Error** `401`:
```json
{ "error": "Unauthorized" }
```

---

### Logout

```
POST /auth/logout
Auth: No
```

**Response** `200`:
```json
{ "status": "ok" }
```

El frontend debe eliminar el token almacenado localmente.

---

### Obtener overlay key y URL

```
GET /api/overlay/key
Auth: Bearer token
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
Auth: Bearer token
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
Auth: Bearer token
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
  "redeemedAt": "2026-03-31T12:00:00.000Z"
}
```

---

## SSE — Server-Sent Events (Overlay)

### Conectar al stream

```
GET /overlay/{key}/events
Auth: No (la key en la URL actúa como token)
```

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

1. En OBS → Fuentes → Browser Source
2. URL: el `overlayUrl` de `GET /api/overlay/key`
3. Ancho/Alto: según tu overlay
4. No necesita autenticación
5. EventSource se reconecta automáticamente si se pierde conexión

---

## Tipos de datos

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

---

## Flujo completo

```
1. Usuario abre el frontend
2. Click "Login con Twitch" → GET /auth/twitch
3. Autoriza en Twitch → redirect al backend
4. Backend genera JWT → redirect a {FRONTEND_URL}/api/auth/callback?token={JWT}
5. Frontend guarda el token → redirige a /dashboard
6. Dashboard llama GET /auth/me (con Bearer token) → muestra info del usuario
7. Dashboard llama GET /api/overlay/key (con Bearer token) → muestra URL del overlay
8. Usuario copia URL → la pega en OBS Browser Source
9. OBS conecta al SSE → recibe evento "connected"
10. Para probar: POST /api/overlay/test → simula redemption → OBS muestra la carta
11. En producción: viewer canjea recompensa → Twitch webhook → backend → SSE → OBS
```

---

## Testing

Para probar el pipeline completo sin recompensas reales de Twitch:

1. Loguearse via `/auth/twitch`
2. Obtener el overlay URL via `GET /api/overlay/key`
3. Abrir el overlay URL en otra pestaña del browser (simula OBS)
4. Llamar `POST /api/overlay/test` con el Bearer token
5. Verificar que la pestaña del overlay recibe el evento `redemption`

También se puede probar `channel.update` cambiando el título del canal en el dashboard de Twitch.

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `401 Unauthorized` | Token ausente, inválido o expirado | Redirigir a `/auth/twitch` para re-autenticar |
| `404 Invalid overlay key` | Key no existe o fue regenerada | Llamar `GET /api/overlay/key` para obtener la actual |
| `redirect_mismatch` en Twitch | `TWITCH_CALLBACK_URL` no coincide con Twitch Developer Console | Verificar que la redirect URI en Twitch sea exactamente `{TWITCH_CALLBACK_URL}/auth/twitch/callback` |
| SSE se desconecta | Network issue | `EventSource` se reconecta automáticamente |
| `409 Conflict` en subscription | Ya existe la subscription | Se ignora automáticamente |
| `connections: 0` en test | No hay overlay escuchando | Abrir el overlay URL en una pestaña primero |
