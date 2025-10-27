# Guía de Testing - API Reservas

## 🔐 Paso 1: Autenticación

### Login (obtener token)
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "correo": "usuario@example.com",
  "contrasena": "password123"
}
```

**Respuesta:**
```json
{
  "data": {
    "user": {
      "id": "uuid-del-usuario",
      "correo": "usuario@example.com",
      "rol": "cliente"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InV1aWQiLCJjb3JyZW8iOiJ1c3VhcmlvQGV4YW1wbGUuY29tIiwicm9sIjoiY2xpZW50ZSIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoxNjMwMDg2NDAwfQ.abc123",
    "expiresIn": 86400
  }
}
```

**⚠️ IMPORTANTE:** Copia el valor de `data.token`

---

## 📋 Paso 2: Obtener horarios disponibles

### Consultar disponibilidad de una cancha
```http
GET http://localhost:3000/api/v1/canchas/disponibilidad/{{cancha_id}}/2024-10-25
```

Ejemplo:
```http
GET http://localhost:3000/api/v1/canchas/disponibilidad/a1b2c3d4-e5f6-7890-abcd-ef1234567890/2024-10-25
```

**Respuesta:**
```json
{
  "cancha_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fecha": "2024-10-25",
  "slots": [
    {
      "id": "horario-uuid-1",
      "horaIni": "08:00",
      "horaFin": "09:00",
      "tipo": "DIURNO",
      "precioBs": 50
    },
    {
      "id": "horario-uuid-2",
      "horaIni": "09:00",
      "horaFin": "10:00",
      "tipo": "DIURNO",
      "precioBs": 50
    },
    {
      "id": "horario-uuid-3",
      "horaIni": "18:00",
      "horaFin": "19:00",
      "tipo": "NOCTURNO",
      "precioBs": 70
    }
  ]
}
```

**⚠️ IMPORTANTE:** Copia los `id` de los horarios que quieras reservar

---

## 🎫 Paso 3: Crear una reserva

### Crear reserva con los horarios seleccionados
```http
POST http://localhost:3000/api/v1/reservas
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "horario-uuid-1",
      "precio": 50
    },
    {
      "horario_id": "horario-uuid-2",
      "precio": 50
    }
  ]
}
```

**Respuesta exitosa (201):**
```json
{
  "data": {
    "id": "reserva-uuid",
    "usuario_id": "usuario-uuid",
    "estado": "pendiente",
    "created_at": "2024-10-20T10:00:00.000Z",
    "updated_at": "2024-10-20T10:00:00.000Z",
    "items": [
      {
        "id": "item-uuid-1",
        "reserva_id": "reserva-uuid",
        "horario_id": "horario-uuid-1",
        "precio": 50,
        "horario": {
          "id": "horario-uuid-1",
          "fecha": "2024-10-25T00:00:00.000Z",
          "hora_inicio": "1970-01-01T08:00:00.000Z",
          "hora_fin": "1970-01-01T09:00:00.000Z",
          "disponible": false,
          "cancha": {
            "id": "cancha-uuid",
            "nombre": "Cancha 1",
            "complejo": {
              "id": "complejo-uuid",
              "nombre": "Complejo Deportivo Central"
            }
          }
        }
      }
    ],
    "pagos": [
      {
        "id": "pago-uuid",
        "reserva_id": "reserva-uuid",
        "estado": "pendiente",
        "fecha_pago": null
      }
    ],
    "usuario": {
      "id": "usuario-uuid",
      "nombre": "Juan",
      "apellidos": "Pérez",
      "correo": "usuario@example.com"
    }
  }
}
```

---

## 📚 Paso 4: Ver mis reservas

### Obtener historial de reservas
```http
GET http://localhost:3000/api/v1/reservas/mis-reservas
Authorization: Bearer {{token}}
```

### Con filtros
```http
GET http://localhost:3000/api/v1/reservas/mis-reservas?estado=pendiente&limit=10&offset=0
Authorization: Bearer {{token}}
```

---

## ✏️ Paso 5: Modificar una reserva

### Cambiar horarios de una reserva
```http
PATCH http://localhost:3000/api/v1/reservas/{{reserva_id}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "nuevo-horario-uuid",
      "precio": 60
    }
  ]
}
```

---

## ❌ Paso 6: Cancelar una reserva

```http
DELETE http://localhost:3000/api/v1/reservas/{{reserva_id}}
Authorization: Bearer {{token}}
```

---

## 👨‍💼 ADMIN: Panel de Reservas

### Ver todas las reservas de tus complejos
```http
GET http://localhost:3000/api/v1/reservas/admin/panel
Authorization: Bearer {{admin_token}}
```

### Con filtros
```http
GET http://localhost:3000/api/v1/reservas/admin/panel?estado=pendiente&complejo_id={{complejo_id}}
Authorization: Bearer {{admin_token}}
```

### Confirmar una reserva
```http
PATCH http://localhost:3000/api/v1/reservas/{{reserva_id}}/estado
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "estado": "confirmada"
}
```

### Cancelar una reserva
```http
PATCH http://localhost:3000/api/v1/reservas/{{reserva_id}}/estado
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "estado": "cancelada"
}
```

---

## 🔍 Solución de Problemas Comunes

### Error 401: "Falta token"
**Causa:** No enviaste el token de autorización
**Solución:**
1. Haz login primero
2. Copia el token
3. Agrégalo en el header: `Authorization: Bearer {token}`

### Error 400: "Uno o más horarios no existen"
**Causa:** El `horario_id` no existe en la base de datos
**Solución:**
1. Primero consulta disponibilidad: `GET /canchas/disponibilidad/:cancha_id/:fecha`
2. Usa los `id` que te devuelve ese endpoint

### Error 400: "Los siguientes horarios no están disponibles"
**Causa:** El horario tiene `disponible: false`
**Solución:** Ese horario ya no está disponible, selecciona otro

### Error 400: "Los siguientes horarios ya están reservados"
**Causa:** Alguien más ya reservó ese horario
**Solución:** Consulta nuevamente disponibilidad y selecciona otro horario

### Error 403: "No tienes permiso"
**Causa:** Intentas modificar una reserva que no es tuya
**Solución:** Solo puedes modificar tus propias reservas

### Error 400: "Solo se pueden modificar reservas en estado pendiente"
**Causa:** La reserva ya fue confirmada o cancelada
**Solución:** No puedes modificar reservas que no estén pendientes

---

## 🧪 Casos de Prueba Recomendados

### ✅ Test 1: Flujo completo de reserva
1. Login como cliente
2. Consultar disponibilidad
3. Crear reserva con 2 horarios
4. Verificar que los horarios quedaron `disponible: false`
5. Ver mis reservas
6. Cancelar la reserva
7. Verificar que los horarios volvieron a `disponible: true`

### ✅ Test 2: Modificar reserva
1. Crear reserva con horario A
2. Modificar a horario B
3. Verificar que A quedó libre y B ocupado

### ✅ Test 3: Validación de duplicados
1. Usuario A crea reserva con horario X
2. Usuario B intenta reservar mismo horario X
3. Debe fallar con error 400

### ✅ Test 4: Panel de admin
1. Login como admin
2. Ver panel de reservas
3. Filtrar por complejo
4. Confirmar una reserva pendiente
5. Verificar cambio de estado

### ✅ Test 5: Seguridad - Ownership
1. Usuario A crea reserva
2. Usuario B intenta modificar reserva de A
3. Debe fallar con error 403

---

## 📊 Estados de Reserva

```
pendiente ──┬──> confirmada (admin)
            │
            └──> cancelada (cliente o admin)
```

**Estados posibles:**
- `pendiente`: Recién creada, esperando confirmación del admin
- `confirmada`: Aprobada por el admin, cliente puede asistir
- `cancelada`: Rechazada o cancelada

---

## 🔑 Variables de Entorno Recomendadas (Postman/Insomnia)

Crea estas variables en tu colección:

```
base_url = http://localhost:3000/api/v1
token = (se llena después del login)
admin_token = (token de un usuario admin)
cancha_id = uuid-de-una-cancha
reserva_id = uuid-de-una-reserva
horario_id = uuid-de-un-horario
```

Luego usa:
```
POST {{base_url}}/reservas
Authorization: Bearer {{token}}
```

---

**Autor:** Sistema de Reservas
**Sprint:** 3
**Fecha:** Octubre 2024
