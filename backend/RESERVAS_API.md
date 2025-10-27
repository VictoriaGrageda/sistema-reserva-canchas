# API de Reservas - Sprint 3

## Endpoints Implementados

### 🎫 CLIENTE - Gestión de Reservas

#### 1. Crear Reserva
```http
POST /api/v1/reservas
Authorization: Bearer <token>
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "uuid-del-horario",
      "precio": 50
    }
  ]
}
```

**Respuesta exitosa (201):**
```json
{
  "data": {
    "id": "uuid",
    "usuario_id": "uuid",
    "estado": "pendiente",
    "created_at": "2024-10-20T10:00:00.000Z",
    "items": [...],
    "pagos": [...]
  }
}
```

#### 2. Mis Reservas (Historial)
```http
GET /api/v1/reservas/mis-reservas?estado=pendiente&limit=20&offset=0
Authorization: Bearer <token>
```

**Query params opcionales:**
- `estado`: `pendiente` | `confirmada` | `cancelada`
- `limit`: número (default: 20, max: 100)
- `offset`: número (default: 0)

#### 3. Detalle de Reserva
```http
GET /api/v1/reservas/:id
Authorization: Bearer <token>
```

#### 4. Modificar Reserva
```http
PATCH /api/v1/reservas/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "uuid-nuevo-horario",
      "precio": 60
    }
  ]
}
```

**Restricciones:**
- Solo si estado = `pendiente`
- Solo el usuario dueño puede modificar

#### 5. Cancelar Reserva
```http
DELETE /api/v1/reservas/:id
Authorization: Bearer <token>
```

**Efecto:**
- Cambia estado a `cancelada`
- Libera horarios (disponible = true)
- Actualiza pago a `rechazado`

---

### 👨‍💼 ADMINISTRADOR - Panel de Reservas

#### 6. Panel de Administrador
```http
GET /api/v1/reservas/admin/panel?complejo_id=uuid&estado=pendiente&fecha=2024-10-20
Authorization: Bearer <token>
```

**Query params opcionales:**
- `complejo_id`: filtrar por complejo específico
- `estado`: filtrar por estado
- `fecha`: filtrar por fecha (YYYY-MM-DD)

**Requiere:** `rol = "administrador"`

#### 7. Cambiar Estado de Reserva
```http
PATCH /api/v1/reservas/:id/estado
Authorization: Bearer <token>
Content-Type: application/json

{
  "estado": "confirmada"
}
```

**Estados válidos:**
- `confirmada`
- `cancelada`

**Requiere:**
- `rol = "administrador"`
- Ser dueño del complejo

---

## Lógica de Negocio

### Crear Reserva
1. ✅ Valida que todos los horarios existan
2. ✅ Valida que estén `disponible: true`
3. ✅ Valida que no tengan `reserva_items` (ya reservados)
4. ✅ Crea reserva con estado `pendiente`
5. ✅ Crea `reserva_items` asociados
6. ✅ Marca horarios como `disponible: false`
7. ✅ Crea registro de pago `pendiente`
8. ✅ Todo en **transacción atómica**

### Modificar Reserva
1. ✅ Valida que la reserva pertenezca al usuario
2. ✅ Valida que esté en estado `pendiente`
3. ✅ Libera horarios antiguos (transacción)
4. ✅ Asigna nuevos horarios
5. ✅ Actualiza precios

### Cancelar Reserva
1. ✅ Valida propiedad
2. ✅ Cambia estado a `cancelada`
3. ✅ Libera todos los horarios
4. ✅ Actualiza pago a `rechazado`

---

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Datos inválidos o regla de negocio violada |
| 401 | No autenticado (token faltante o inválido) |
| 403 | Sin permiso (no es dueño o no es admin) |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

---

## Ejemplos de Uso

### Flujo Cliente: Crear una Reserva

```javascript
// 1. Usuario busca disponibilidad
GET /api/v1/canchas/disponibilidad/cancha-uuid/2024-10-25

// 2. Selecciona horarios y crea reserva
POST /api/v1/reservas
{
  "horarios": [
    { "horario_id": "h1", "precio": 50 },
    { "horario_id": "h2", "precio": 50 }
  ]
}

// 3. Ve su historial
GET /api/v1/reservas/mis-reservas

// 4. Modifica si es necesario (antes del plazo)
PATCH /api/v1/reservas/reserva-uuid
{
  "horarios": [
    { "horario_id": "h3", "precio": 60 }
  ]
}

// 5. Cancela si es necesario
DELETE /api/v1/reservas/reserva-uuid
```

### Flujo Admin: Gestionar Reservas

```javascript
// 1. Ver todas las reservas de sus complejos
GET /api/v1/reservas/admin/panel

// 2. Filtrar por estado pendiente
GET /api/v1/reservas/admin/panel?estado=pendiente

// 3. Confirmar una reserva
PATCH /api/v1/reservas/reserva-uuid/estado
{
  "estado": "confirmada"
}

// 4. Rechazar/Cancelar una reserva
PATCH /api/v1/reservas/reserva-uuid/estado
{
  "estado": "cancelada"
}
```

---

## Estructura de Base de Datos

### Modelo `reservas`
```prisma
model reservas {
  id         String        @id @default(uuid())
  usuario_id String
  estado     EstadoReserva @default(pendiente)
  created_at DateTime      @default(now())
  updated_at DateTime      @updatedAt

  items   reserva_items[]
  pagos   pagos[]
  usuario usuarios
}

enum EstadoReserva {
  pendiente
  confirmada
  cancelada
}
```

### Modelo `reserva_items`
```prisma
model reserva_items {
  id         String   @id @default(uuid())
  reserva_id String
  horario_id String   @unique // Un horario solo puede reservarse una vez
  precio     Decimal?

  reserva reservas
  horario horarios
}
```

---

## Seguridad Implementada

✅ **Autenticación JWT**: Todas las rutas requieren `requireAuth`
✅ **Validación Zod**: Todos los inputs validados con schemas
✅ **Ownership**: Usuario solo puede ver/modificar sus propias reservas
✅ **Role-based**: Admin solo puede modificar reservas de sus complejos
✅ **Transacciones**: Operaciones atómicas (todo o nada)
✅ **Constraint único**: `horario_id` es unique en `reserva_items`

---

## Testing Recomendado

### Casos a probar:

1. ✅ Crear reserva con horarios válidos
2. ✅ Intentar reservar horario ya ocupado (debe fallar)
3. ✅ Intentar reservar horario no disponible (debe fallar)
4. ✅ Modificar reserva pendiente (debe funcionar)
5. ✅ Intentar modificar reserva confirmada (debe fallar)
6. ✅ Cancelar reserva y verificar que libera horarios
7. ✅ Usuario A no puede modificar reserva de Usuario B
8. ✅ Admin puede ver reservas de sus complejos
9. ✅ Admin no puede ver reservas de otros complejos
10. ✅ Confirmar reserva como admin

---

## Próximos Pasos (Sprint 4 potencial)

- [ ] Sistema de notificaciones (email/SMS)
- [ ] Recuperación de contraseña
- [ ] Editar perfil de usuario
- [ ] Plazo límite de modificación/cancelación (ej: 24h antes)
- [ ] Reportes y estadísticas para admin
- [ ] Sistema de penalizaciones por cancelaciones
- [ ] Reservas recurrentes (semanal)

---

**Fecha de implementación:** Sprint 3
**Arquitectura:** Repository Pattern + Service Layer + Controller
**Validación:** Zod Schemas
**Seguridad:** JWT + Role-based Access Control
