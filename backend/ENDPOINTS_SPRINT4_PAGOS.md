# Sprint 4 - Endpoints de Pagos con QR

## Implementación completada ✅

Este documento describe todos los endpoints implementados para el **Sprint 4 - Pagos con QR**.

---

## 📋 Tabla de Contenidos

1. [QRs del Administrador](#qrs-del-administrador)
2. [Pagos](#pagos)
3. [Flujo completo de pago](#flujo-completo-de-pago)
4. [Modelos de datos](#modelos-de-datos)

---

## 🔐 QRs del Administrador

### 1. Subir un nuevo QR

**POST** `/api/v1/qrs`

Permite al administrador subir una imagen de QR para recibir pagos.

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Body:**
```json
{
  "imagen_qr": "https://ejemplo.com/qr.png",
  "vigente": true
}
```

O con base64:
```json
{
  "imagen_qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "vigente": true
}
```

**Validaciones:**
- Usuario debe ser administrador
- `imagen_qr` debe ser una URL válida o imagen en base64
- `vigente` es opcional (default: true)
- Si `vigente=true`, marca los demás QRs del admin como no vigentes

**Response (201):**
```json
{
  "message": "QR subido exitosamente",
  "data": {
    "id": "uuid",
    "admin_id": "uuid",
    "imagen_qr": "https://...",
    "vigente": true,
    "created_at": "2024-10-20T10:00:00Z",
    "updated_at": "2024-10-20T10:00:00Z"
  }
}
```

---

### 2. Listar mis QRs

**GET** `/api/v1/qrs/mis-qrs`

Lista todos los QRs del administrador autenticado.

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "admin_id": "uuid",
      "imagen_qr": "https://...",
      "vigente": true,
      "created_at": "2024-10-20T10:00:00Z",
      "updated_at": "2024-10-20T10:00:00Z"
    },
    {
      "id": "uuid",
      "admin_id": "uuid",
      "imagen_qr": "https://...",
      "vigente": false,
      "created_at": "2024-10-19T10:00:00Z",
      "updated_at": "2024-10-19T10:00:00Z"
    }
  ]
}
```

---

### 3. Obtener mi QR vigente

**GET** `/api/v1/qrs/vigente`

Obtiene el QR actualmente vigente del administrador.

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "admin_id": "uuid",
    "imagen_qr": "https://...",
    "vigente": true,
    "created_at": "2024-10-20T10:00:00Z",
    "updated_at": "2024-10-20T10:00:00Z"
  }
}
```

**Error (404):**
```json
{
  "message": "No tienes un QR vigente configurado"
}
```

---

### 4. Obtener QR de un complejo (para clientes)

**GET** `/api/v1/qrs/complejo/:complejo_id`

Permite a un cliente obtener el QR del administrador de un complejo para realizar el pago.

**No requiere autenticación** (público para facilitar el pago)

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "admin_id": "uuid",
    "imagen_qr": "https://...",
    "vigente": true,
    "created_at": "2024-10-20T10:00:00Z",
    "updated_at": "2024-10-20T10:00:00Z"
  }
}
```

---

### 5. Activar un QR

**PATCH** `/api/v1/qrs/:id/activar`

Marca un QR como vigente (y desactiva los demás).

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response (200):**
```json
{
  "message": "QR activado exitosamente",
  "data": {
    "id": "uuid",
    "admin_id": "uuid",
    "imagen_qr": "https://...",
    "vigente": true,
    "created_at": "2024-10-20T10:00:00Z",
    "updated_at": "2024-10-20T10:00:00Z"
  }
}
```

---

### 6. Desactivar un QR

**PATCH** `/api/v1/qrs/:id/desactivar`

Desactiva un QR específico.

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response (200):**
```json
{
  "message": "QR desactivado exitosamente",
  "data": {
    "id": "uuid",
    "admin_id": "uuid",
    "imagen_qr": "https://...",
    "vigente": false,
    "created_at": "2024-10-20T10:00:00Z",
    "updated_at": "2024-10-20T10:00:00Z"
  }
}
```

---

### 7. Eliminar un QR

**DELETE** `/api/v1/qrs/:id`

Elimina un QR. Solo se puede eliminar si no tiene pagos asociados.

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response (200):**
```json
{
  "message": "QR eliminado exitosamente"
}
```

**Error (400):**
```json
{
  "message": "No se puede eliminar un QR con pagos asociados"
}
```

---

## 💳 Pagos

### 1. Obtener pago de una reserva

**GET** `/api/v1/pagos/reserva/:reserva_id`

Obtiene el pago asociado a una reserva (cliente debe ser el dueño).

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "reserva_id": "uuid",
    "qr_id": "uuid",
    "estado": "pendiente",
    "fecha_pago": null,
    "created_at": "2024-10-20T10:00:00Z",
    "updated_at": "2024-10-20T10:00:00Z",
    "qr": {
      "id": "uuid",
      "imagen_qr": "https://...",
      "vigente": true
    },
    "reserva": {
      "id": "uuid",
      "usuario_id": "uuid",
      "estado": "pendiente",
      "items": [
        {
          "id": "uuid",
          "precio": 150.00,
          "horario": { ... }
        }
      ]
    }
  }
}
```

---

### 2. Obtener QR para pagar

**GET** `/api/v1/pagos/reserva/:reserva_id/qr`

Obtiene el QR del complejo para realizar el pago de una reserva.

**No requiere autenticación** (facilita compartir link de pago)

**Response (200):**
```json
{
  "data": {
    "pago": {
      "id": "uuid",
      "reserva_id": "uuid",
      "estado": "pendiente",
      "created_at": "2024-10-20T10:00:00Z"
    },
    "qr": {
      "id": "uuid",
      "imagen_qr": "https://...",
      "vigente": true
    }
  }
}
```

---

### 3. Marcar pago como realizado (Cliente)

**POST** `/api/v1/pagos/reserva/:reserva_id/marcar-realizado`

El cliente marca que ya realizó el pago. Queda pendiente hasta que el admin confirme.

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Body (opcional):**
```json
{
  "qr_id": "uuid"
}
```

**Response (200):**
```json
{
  "message": "Pago marcado como realizado. Espera la confirmación del administrador.",
  "data": {
    "id": "uuid",
    "reserva_id": "uuid",
    "qr_id": "uuid",
    "estado": "pendiente",
    "fecha_pago": null,
    "created_at": "2024-10-20T10:00:00Z",
    "updated_at": "2024-10-20T10:00:00Z"
  }
}
```

---

### 4. Listar pagos del administrador

**GET** `/api/v1/pagos/admin`

Lista todos los pagos de las reservas de los complejos del administrador.

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Query Params (opcionales):**
- `estado`: `pendiente` | `confirmado` | `rechazado`
- `complejo_id`: UUID del complejo

**Ejemplos:**
- `/api/v1/pagos/admin` - Todos los pagos
- `/api/v1/pagos/admin?estado=pendiente` - Solo pendientes
- `/api/v1/pagos/admin?complejo_id=uuid&estado=confirmado` - Confirmados de un complejo

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "reserva_id": "uuid",
      "qr_id": "uuid",
      "estado": "pendiente",
      "fecha_pago": null,
      "created_at": "2024-10-20T10:00:00Z",
      "qr": { ... },
      "reserva": {
        "id": "uuid",
        "usuario": {
          "id": "uuid",
          "nombre": "Juan",
          "apellidos": "Pérez",
          "correo": "juan@example.com",
          "telefono": "12345678"
        },
        "items": [
          {
            "precio": 150.00,
            "horario": {
              "fecha": "2024-10-25",
              "hora_inicio": "14:00:00",
              "hora_fin": "15:00:00",
              "cancha": {
                "nombre": "Cancha 1",
                "complejo": {
                  "id": "uuid",
                  "nombre": "Complejo Deportivo Central",
                  "ciudad": "La Paz"
                }
              }
            }
          }
        ]
      }
    }
  ]
}
```

---

### 5. Listar pagos pendientes

**GET** `/api/v1/pagos/admin/pendientes`

Atajo para listar solo los pagos pendientes de confirmación.

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response:** Igual que el anterior, pero filtrado por `estado=pendiente`.

---

### 6. Obtener detalle de un pago

**GET** `/api/v1/pagos/:id`

Obtiene el detalle completo de un pago específico (solo admin).

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "reserva_id": "uuid",
    "qr_id": "uuid",
    "estado": "pendiente",
    "fecha_pago": null,
    "created_at": "2024-10-20T10:00:00Z",
    "qr": { ... },
    "reserva": {
      "id": "uuid",
      "estado": "pendiente",
      "usuario": { ... },
      "items": [ ... ]
    }
  }
}
```

---

### 7. Confirmar pago (Administrador)

**PATCH** `/api/v1/pagos/:id/confirmar`

El administrador confirma que recibió el pago.

**Efectos:**
- Cambia estado del pago a `confirmado`
- Cambia estado de la reserva a `confirmada`
- Registra `fecha_pago` como ahora

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response (200):**
```json
{
  "message": "Pago confirmado. La reserva ha sido confirmada.",
  "data": {
    "id": "uuid",
    "reserva_id": "uuid",
    "estado": "confirmado",
    "fecha_pago": "2024-10-20T11:30:00Z",
    "reserva": {
      "id": "uuid",
      "estado": "confirmada"
    }
  }
}
```

---

### 8. Rechazar pago (Administrador)

**PATCH** `/api/v1/pagos/:id/rechazar`

El administrador rechaza el pago (no lo recibió o hay un problema).

**Efectos:**
- Cambia estado del pago a `rechazado`
- Cambia estado de la reserva a `cancelada`
- Libera los horarios reservados (quedan disponibles nuevamente)

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Response (200):**
```json
{
  "message": "Pago rechazado. La reserva ha sido cancelada y los horarios liberados.",
  "data": {
    "id": "uuid",
    "reserva_id": "uuid",
    "estado": "rechazado",
    "fecha_pago": null,
    "reserva": {
      "id": "uuid",
      "estado": "cancelada"
    }
  }
}
```

---

### 9. Cambiar estado de pago (genérico)

**PATCH** `/api/v1/pagos/:id/estado`

Método genérico para cambiar el estado del pago.

**Headers:**
```json
{
  "Authorization": "Bearer <token_jwt>"
}
```

**Body:**
```json
{
  "estado": "confirmado"
}
```

O:
```json
{
  "estado": "rechazado"
}
```

**Response:** Igual que confirmar/rechazar según el estado.

---

## 🔄 Flujo completo de pago

### Paso a paso del proceso:

#### 1️⃣ **Administrador sube su QR**
```http
POST /api/v1/qrs
Content-Type: application/json
Authorization: Bearer <token_admin>

{
  "imagen_qr": "https://ejemplo.com/mi-qr-bancario.png",
  "vigente": true
}
```

#### 2️⃣ **Cliente crea una reserva**
```http
POST /api/v1/reservas
Content-Type: application/json
Authorization: Bearer <token_cliente>

{
  "horarios": [
    { "horario_id": "uuid-horario-1", "precio": 150 },
    { "horario_id": "uuid-horario-2", "precio": 150 }
  ]
}
```

✅ **El sistema automáticamente:**
- Crea la reserva con estado `pendiente`
- Marca los horarios como no disponibles
- **Crea un pago con estado `pendiente`**

#### 3️⃣ **Cliente obtiene el QR para pagar**
```http
GET /api/v1/pagos/reserva/{reserva_id}/qr
```

Respuesta incluye la imagen del QR del administrador.

#### 4️⃣ **Cliente realiza el pago** (fuera del sistema)
El cliente escanea el QR y paga por transferencia bancaria, billetera móvil, etc.

#### 5️⃣ **Cliente marca que pagó**
```http
POST /api/v1/pagos/reserva/{reserva_id}/marcar-realizado
Authorization: Bearer <token_cliente>
```

✅ Estado sigue siendo `pendiente` hasta que el admin confirme.

#### 6️⃣ **Admin ve pagos pendientes**
```http
GET /api/v1/pagos/admin/pendientes
Authorization: Bearer <token_admin>
```

Ve la lista de pagos que clientes marcaron como realizados.

#### 7️⃣ **Admin confirma el pago**
Después de verificar en su cuenta bancaria:

```http
PATCH /api/v1/pagos/{pago_id}/confirmar
Authorization: Bearer <token_admin>
```

✅ **El sistema automáticamente:**
- Cambia pago a `confirmado`
- Cambia reserva a `confirmada`
- Registra fecha de confirmación

#### 🎉 **Reserva confirmada!**

---

### Alternativa: Admin rechaza el pago

Si el admin NO recibió el pago:

```http
PATCH /api/v1/pagos/{pago_id}/rechazar
Authorization: Bearer <token_admin>
```

✅ **El sistema automáticamente:**
- Cambia pago a `rechazado`
- Cambia reserva a `cancelada`
- **Libera los horarios** (quedan disponibles de nuevo)

---

## 📊 Modelos de datos

### QR
```typescript
{
  id: string (UUID)
  admin_id: string (UUID)
  imagen_qr: string (URL o base64)
  vigente: boolean
  created_at: DateTime
  updated_at: DateTime
}
```

### Pago
```typescript
{
  id: string (UUID)
  reserva_id: string (UUID)
  qr_id: string | null (UUID)
  estado: 'pendiente' | 'confirmado' | 'rechazado'
  fecha_pago: DateTime | null
  created_at: DateTime
  updated_at: DateTime
}
```

---

## ✅ Estados de Pago

| Estado | Descripción |
|--------|-------------|
| `pendiente` | Cliente aún no ha pagado O marcó como pagado pero admin no confirmó |
| `confirmado` | Admin confirmó que recibió el pago. Reserva confirmada. |
| `rechazado` | Admin rechazó el pago o no lo recibió. Reserva cancelada. |

---

## ✅ Estados de Reserva (recordatorio)

| Estado | Descripción |
|--------|-------------|
| `pendiente` | Reserva creada, esperando confirmación de pago |
| `confirmada` | Pago confirmado por admin. Reserva válida. |
| `cancelada` | Reserva cancelada (por cliente o por rechazo de pago) |

---

## 🔒 Permisos por endpoint

### QRs

| Endpoint | Rol requerido | Descripción |
|----------|---------------|-------------|
| `POST /qrs` | Administrador | Subir QR |
| `GET /qrs/mis-qrs` | Administrador | Listar mis QRs |
| `GET /qrs/vigente` | Administrador | Mi QR vigente |
| `GET /qrs/complejo/:id` | Público | QR de un complejo |
| `PATCH /qrs/:id/activar` | Administrador | Activar QR |
| `PATCH /qrs/:id/desactivar` | Administrador | Desactivar QR |
| `DELETE /qrs/:id` | Administrador | Eliminar QR |

### Pagos

| Endpoint | Rol requerido | Descripción |
|----------|---------------|-------------|
| `GET /pagos/reserva/:id` | Cliente (dueño) | Ver pago de reserva |
| `GET /pagos/reserva/:id/qr` | Público | Obtener QR para pagar |
| `POST /pagos/reserva/:id/marcar-realizado` | Cliente (dueño) | Marcar como pagado |
| `GET /pagos/admin` | Administrador | Listar pagos |
| `GET /pagos/admin/pendientes` | Administrador | Listar pendientes |
| `GET /pagos/:id` | Administrador | Detalle de pago |
| `PATCH /pagos/:id/confirmar` | Administrador | Confirmar pago |
| `PATCH /pagos/:id/rechazar` | Administrador | Rechazar pago |
| `PATCH /pagos/:id/estado` | Administrador | Cambiar estado |

---

## 🧪 Testing con Postman/Thunder Client

### Variables de entorno sugeridas:
```
base_url = http://localhost:3000/api/v1
token_cliente = <JWT del cliente>
token_admin = <JWT del admin>
reserva_id = <UUID de reserva de prueba>
pago_id = <UUID de pago de prueba>
qr_id = <UUID de QR de prueba>
```

### Colección de pruebas:

1. **Subir QR** → guarda `qr_id`
2. **Crear reserva** → guarda `reserva_id` y `pago_id`
3. **Obtener QR para pago** → verifica que devuelve el QR
4. **Marcar pago realizado**
5. **Listar pagos pendientes** (admin)
6. **Confirmar pago** → verifica que reserva pasa a `confirmada`

---

## 📝 Notas de implementación

### Validaciones implementadas:
- ✅ Solo el dueño puede marcar su pago como realizado
- ✅ Solo el admin del complejo puede confirmar/rechazar pagos
- ✅ Solo se puede confirmar/rechazar un pago si está `pendiente`
- ✅ No se puede eliminar un QR con pagos asociados
- ✅ Al activar un QR, los demás se desactivan automáticamente
- ✅ Al rechazar un pago, se liberan los horarios automáticamente

### Transacciones atómicas:
- Confirmar pago: actualiza pago + reserva en una transacción
- Rechazar pago: actualiza pago + reserva + horarios en una transacción
- Subir QR vigente: desactiva otros + crea nuevo en una transacción

---

## 🎯 Cumplimiento del Sprint 4

### Requerimientos cumplidos:

✅ **El administrador debe poder subir su QR de pago**
- Endpoint: `POST /api/v1/qrs`

✅ **El cliente debe poder visualizar el QR en la aplicación para realizar el pago**
- Endpoint: `GET /api/v1/pagos/reserva/:reserva_id/qr`

✅ **El cliente debe poder marcar en la aplicación que ya realizó el pago**
- Endpoint: `POST /api/v1/pagos/reserva/:reserva_id/marcar-realizado`

✅ **El administrador debe poder validar y confirmar manualmente el pago de cada reserva**
- Endpoints: `PATCH /api/v1/pagos/:id/confirmar` y `/rechazar`

✅ **El sistema debe actualizar el estado de la reserva a CONFIRMADA una vez validado el pago**
- Implementado en el repositorio de pagos con transacciones

✅ **El sistema debe permitir al administrador registrar pagos rechazados o no recibidos**
- Endpoint: `PATCH /api/v1/pagos/:id/rechazar`

---

## 🚀 Próximos pasos sugeridos

Para mejorar el sistema:

1. **Notificaciones:**
   - Notificar al cliente cuando el admin confirma/rechaza el pago
   - Notificar al admin cuando un cliente marca pago como realizado

2. **Historial de pagos:**
   - Endpoint para que el cliente vea su historial de pagos

3. **Reportes:**
   - Endpoint para generar reportes de ingresos por fecha/complejo

4. **Recordatorios:**
   - Notificar al cliente si no marca el pago en X horas
   - Notificar al admin sobre pagos pendientes hace más de X horas

5. **Validación automática (opcional):**
   - Integración con APIs de pago (QR dinámicos)
   - Webhook de confirmación automática

---

## 📧 Contacto

Para dudas o mejoras, consultar con el equipo de desarrollo.

**Fecha de implementación:** Octubre 2024
**Sprint:** 4 - Pagos con QR
**Estado:** ✅ Completado
