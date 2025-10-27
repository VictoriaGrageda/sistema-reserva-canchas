# 🧪 PRUEBAS COMPLETAS - SPRINT 3
## Sistema de Reservas de Canchas

---

## 📋 ÍNDICE

1. [Preparación de Datos](#preparación-de-datos)
2. [Rutas de Cliente (5)](#rutas-de-cliente)
3. [Rutas de Administrador (2)](#rutas-de-administrador)
4. [Casos de Error](#casos-de-error)
5. [Verificación Final](#verificación-final)

---

## ⚙️ PREPARACIÓN DE DATOS

### PASO 0.1: Verificar servidor
```http
GET http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "ok": true
}
```

---

### PASO 0.2: Registrar Usuario Cliente
```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "nombre": "Carlos",
  "apellidos": "García Pérez",
  "ci": "8888888",
  "correo": "carlos@test.com",
  "contrasena": "carlos123",
  "confirmarContrasena": "carlos123",
  "telefono": "70888888"
}
```

**Respuesta esperada: 201 Created**
```json
{
  "data": {
    "id": "uuid-del-usuario",
    "nombre": "Carlos",
    "correo": "carlos@test.com",
    "rol": "cliente"
  }
}
```

📝 **Guardar:** `user_id`

---

### PASO 0.3: Login Cliente
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "correo": "carlos@test.com",
  "contrasena": "carlos123"
}
```

**Respuesta esperada: 200 OK**
```json
{
  "data": {
    "user": {
      "id": "uuid-del-usuario",
      "correo": "carlos@test.com",
      "rol": "cliente"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

📝 **Guardar:** `cliente_token`

---

### PASO 0.4: Cambiar a Administrador
```http
PATCH http://localhost:3000/api/v1/usuarios/me/role
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "rol": "administrador"
}
```

**Respuesta esperada: 200 OK**

---

### PASO 0.5: Crear Complejo Deportivo
```http
POST http://localhost:3000/api/v1/complejos
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "nombre": "Complejo Los Pinos",
  "otb": "OTB Los Pinos",
  "subalcaldia": "Centro",
  "celular": "71111111",
  "telefono": "2333333",
  "diasDisponibles": ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"],
  "precioDiurnoPorHora": 50,
  "precioNocturnoPorHora": 70,
  "direccion": "Av. 6 de Agosto #456",
  "ciudad": "La Paz",
  "observaciones": "Complejo con 3 canchas sintéticas",
  "admin_id": "{user_id}"
}
```

**Respuesta esperada: 201 Created**

📝 **Guardar:** `complejo_id`

---

### PASO 0.6: Crear Cancha
```http
POST http://localhost:3000/api/v1/canchas
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "complejo_id": "{complejo_id}",
  "nombre": "Cancha Profesional 1",
  "tipoCancha": "FUT5",
  "precioDiurnoPorHora": 50,
  "precioNocturnoPorHora": 70
}
```

**Respuesta esperada: 201 Created**

📝 **Guardar:** `cancha_id`

---

### PASO 0.7: Crear Horarios de Prueba
```http
POST http://localhost:3000/api/v1/horarios/bulk
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "cancha_id": "{cancha_id}",
  "slots": [
    {
      "fecha": "2024-11-01",
      "hora_inicio": "08:00:00",
      "hora_fin": "09:00:00",
      "disponible": true
    },
    {
      "fecha": "2024-11-01",
      "hora_inicio": "09:00:00",
      "hora_fin": "10:00:00",
      "disponible": true
    },
    {
      "fecha": "2024-11-01",
      "hora_inicio": "10:00:00",
      "hora_fin": "11:00:00",
      "disponible": true
    },
    {
      "fecha": "2024-11-01",
      "hora_inicio": "18:00:00",
      "hora_fin": "19:00:00",
      "disponible": true
    },
    {
      "fecha": "2024-11-01",
      "hora_inicio": "19:00:00",
      "hora_fin": "20:00:00",
      "disponible": true
    },
    {
      "fecha": "2024-11-01",
      "hora_inicio": "20:00:00",
      "hora_fin": "21:00:00",
      "disponible": true
    }
  ]
}
```

**Respuesta esperada: 201 Created**
```json
{
  "created": [
    "horario-uuid-1",
    "horario-uuid-2",
    "horario-uuid-3",
    "horario-uuid-4",
    "horario-uuid-5",
    "horario-uuid-6"
  ]
}
```

---

### PASO 0.8: Consultar Disponibilidad
```http
GET http://localhost:3000/api/v1/canchas/disponibilidad/{cancha_id}/2024-11-01
```

**Respuesta esperada: 200 OK**
```json
{
  "cancha_id": "uuid",
  "fecha": "2024-11-01",
  "slots": [
    {
      "id": "horario-1",
      "horaIni": "08:00",
      "horaFin": "09:00",
      "tipo": "DIURNO",
      "precioBs": 50
    },
    {
      "id": "horario-2",
      "horaIni": "09:00",
      "horaFin": "10:00",
      "tipo": "DIURNO",
      "precioBs": 50
    },
    {
      "id": "horario-3",
      "horaIni": "10:00",
      "horaFin": "11:00",
      "tipo": "DIURNO",
      "precioBs": 50
    },
    {
      "id": "horario-4",
      "horaIni": "18:00",
      "horaFin": "19:00",
      "tipo": "NOCTURNO",
      "precioBs": 70
    },
    {
      "id": "horario-5",
      "horaIni": "19:00",
      "horaFin": "20:00",
      "tipo": "NOCTURNO",
      "precioBs": 70
    },
    {
      "id": "horario-6",
      "horaIni": "20:00",
      "horaFin": "21:00",
      "tipo": "NOCTURNO",
      "precioBs": 70
    }
  ]
}
```

📝 **Guardar:** `horario_1_id`, `horario_2_id`, `horario_3_id`, `horario_4_id`

---

## ✅ DATOS DE PRUEBA LISTOS

Ahora tienes:
- ✅ Usuario Cliente/Admin registrado
- ✅ Token de autenticación
- ✅ Complejo deportivo creado
- ✅ Cancha creada
- ✅ 6 horarios disponibles (3 diurnos, 3 nocturnos)

---

# 🎯 RUTAS DE CLIENTE

---

## 1️⃣ POST /api/v1/reservas - CREAR RESERVA

### Test 1.1: Crear reserva con 2 horarios diurnos

```http
POST http://localhost:3000/api/v1/reservas
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "{horario_1_id}",
      "precio": 50
    },
    {
      "horario_id": "{horario_2_id}",
      "precio": 50
    }
  ]
}
```

**Respuesta esperada: 201 Created**
```json
{
  "data": {
    "id": "reserva-uuid-1",
    "usuario_id": "user-uuid",
    "estado": "pendiente",
    "created_at": "2024-10-20T14:30:00.000Z",
    "updated_at": "2024-10-20T14:30:00.000Z",
    "items": [
      {
        "id": "item-1",
        "reserva_id": "reserva-uuid-1",
        "horario_id": "horario-1",
        "precio": 50,
        "horario": {
          "id": "horario-1",
          "fecha": "2024-11-01T00:00:00.000Z",
          "hora_inicio": "1970-01-01T08:00:00.000Z",
          "hora_fin": "1970-01-01T09:00:00.000Z",
          "disponible": false,
          "cancha": {
            "id": "cancha-uuid",
            "nombre": "Cancha Profesional 1",
            "complejo": {
              "id": "complejo-uuid",
              "nombre": "Complejo Los Pinos"
            }
          }
        }
      },
      {
        "id": "item-2",
        "reserva_id": "reserva-uuid-1",
        "horario_id": "horario-2",
        "precio": 50,
        "horario": { ... }
      }
    ],
    "pagos": [
      {
        "id": "pago-uuid",
        "reserva_id": "reserva-uuid-1",
        "estado": "pendiente",
        "fecha_pago": null
      }
    ],
    "usuario": {
      "id": "user-uuid",
      "nombre": "Carlos",
      "apellidos": "García Pérez",
      "correo": "carlos@test.com"
    }
  }
}
```

📝 **Guardar:** `reserva_1_id`

✅ **Verificaciones:**
- Estado inicial: `"pendiente"`
- 2 items creados
- Pago pendiente creado
- Horarios marcados como `disponible: false`

---

### Test 1.2: Crear segunda reserva con 1 horario nocturno

```http
POST http://localhost:3000/api/v1/reservas
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "{horario_4_id}",
      "precio": 70
    }
  ]
}
```

**Respuesta esperada: 201 Created**

📝 **Guardar:** `reserva_2_id`

---

### Test 1.3: Crear tercera reserva (para pruebas de modificación)

```http
POST http://localhost:3000/api/v1/reservas
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "{horario_3_id}",
      "precio": 50
    }
  ]
}
```

**Respuesta esperada: 201 Created**

📝 **Guardar:** `reserva_3_id`

---

## 2️⃣ GET /api/v1/reservas/mis-reservas - VER HISTORIAL

### Test 2.1: Ver todas mis reservas

```http
GET http://localhost:3000/api/v1/reservas/mis-reservas
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**
```json
{
  "data": [
    {
      "id": "reserva-3",
      "estado": "pendiente",
      "items": [...],
      ...
    },
    {
      "id": "reserva-2",
      "estado": "pendiente",
      "items": [...],
      ...
    },
    {
      "id": "reserva-1",
      "estado": "pendiente",
      "items": [...],
      ...
    }
  ]
}
```

✅ **Verificaciones:**
- Debe retornar 3 reservas
- Ordenadas por `created_at` descendente (más reciente primero)
- Todas con estado `"pendiente"`

---

### Test 2.2: Filtrar solo reservas pendientes

```http
GET http://localhost:3000/api/v1/reservas/mis-reservas?estado=pendiente
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**
- Debe retornar 3 reservas (todas están pendientes)

---

### Test 2.3: Filtrar reservas confirmadas

```http
GET http://localhost:3000/api/v1/reservas/mis-reservas?estado=confirmada
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**
```json
{
  "data": []
}
```

✅ **Verificación:** Array vacío (ninguna confirmada todavía)

---

### Test 2.4: Paginación - Límite 2

```http
GET http://localhost:3000/api/v1/reservas/mis-reservas?limit=2
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**

✅ **Verificación:** Debe retornar solo 2 reservas

---

### Test 2.5: Paginación - Offset 1

```http
GET http://localhost:3000/api/v1/reservas/mis-reservas?limit=2&offset=1
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**

✅ **Verificación:** Debe retornar la segunda y tercera reserva

---

## 3️⃣ GET /api/v1/reservas/:id - VER DETALLE

### Test 3.1: Ver detalle de reserva específica

```http
GET http://localhost:3000/api/v1/reservas/{reserva_1_id}
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**
```json
{
  "data": {
    "id": "reserva-1",
    "usuario_id": "user-uuid",
    "estado": "pendiente",
    "items": [
      {
        "id": "item-1",
        "precio": 50,
        "horario": {
          "fecha": "2024-11-01T00:00:00.000Z",
          "hora_inicio": "...",
          "hora_fin": "...",
          "cancha": {
            "nombre": "Cancha Profesional 1",
            "complejo": {
              "nombre": "Complejo Los Pinos",
              "ciudad": "La Paz"
            }
          }
        }
      },
      ...
    ],
    "pagos": [...],
    "usuario": {...}
  }
}
```

✅ **Verificaciones:**
- Incluye todos los datos relacionados
- Items con horarios completos
- Información de cancha y complejo
- Datos del usuario

---

## 4️⃣ PATCH /api/v1/reservas/:id - MODIFICAR RESERVA

### Test 4.1: Modificar reserva (cambiar horario)

```http
PATCH http://localhost:3000/api/v1/reservas/{reserva_3_id}
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "{horario_5_id}",
      "precio": 70
    }
  ]
}
```

**Respuesta esperada: 200 OK**
```json
{
  "data": {
    "id": "reserva-3",
    "estado": "pendiente",
    "items": [
      {
        "horario_id": "horario-5",
        "precio": 70,
        ...
      }
    ],
    ...
  }
}
```

✅ **Verificaciones:**
- Horario anterior (`horario_3_id`) debe estar libre (`disponible: true`)
- Nuevo horario (`horario_5_id`) debe estar ocupado (`disponible: false`)
- Precio actualizado a 70

**Verificar liberación del horario anterior:**
```http
GET http://localhost:3000/api/v1/canchas/disponibilidad/{cancha_id}/2024-11-01
```
Debe mostrar `horario_3_id` disponible nuevamente.

---

## 5️⃣ DELETE /api/v1/reservas/:id - CANCELAR RESERVA

### Test 5.1: Cancelar una reserva

```http
DELETE http://localhost:3000/api/v1/reservas/{reserva_2_id}
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**
```json
{
  "message": "Reserva cancelada exitosamente",
  "data": {
    "id": "reserva-2",
    "estado": "cancelada",
    ...
  }
}
```

✅ **Verificaciones:**
- Estado cambiado a `"cancelada"`
- Horario liberado (`horario_4_id` debe estar `disponible: true`)

**Verificar liberación:**
```http
GET http://localhost:3000/api/v1/canchas/disponibilidad/{cancha_id}/2024-11-01
```
Debe mostrar `horario_4_id` disponible.

---

### Test 5.2: Ver historial después de cancelar

```http
GET http://localhost:3000/api/v1/reservas/mis-reservas
Authorization: Bearer {cliente_token}
```

✅ **Verificación:** Debe mostrar 3 reservas, una con estado `"cancelada"`

---

# 👨‍💼 RUTAS DE ADMINISTRADOR

---

## 6️⃣ GET /api/v1/reservas/admin/panel - PANEL ADMIN

### Test 6.1: Ver todas las reservas de mis complejos

```http
GET http://localhost:3000/api/v1/reservas/admin/panel
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**
```json
{
  "data": [
    {
      "id": "reserva-3",
      "estado": "pendiente",
      "usuario": {
        "nombre": "Carlos",
        "correo": "carlos@test.com"
      },
      "items": [...],
      ...
    },
    {
      "id": "reserva-2",
      "estado": "cancelada",
      ...
    },
    {
      "id": "reserva-1",
      "estado": "pendiente",
      ...
    }
  ]
}
```

✅ **Verificaciones:**
- Muestra todas las reservas (3 en total)
- Incluye información del usuario que reservó
- Ordenadas por fecha descendente

---

### Test 6.2: Filtrar solo pendientes

```http
GET http://localhost:3000/api/v1/reservas/admin/panel?estado=pendiente
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**

✅ **Verificación:** Solo 2 reservas (las que no están canceladas)

---

### Test 6.3: Filtrar por complejo específico

```http
GET http://localhost:3000/api/v1/reservas/admin/panel?complejo_id={complejo_id}
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**

✅ **Verificación:** Muestra solo reservas de ese complejo

---

### Test 6.4: Filtrar por fecha

```http
GET http://localhost:3000/api/v1/reservas/admin/panel?fecha=2024-11-01
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**

✅ **Verificación:** Solo reservas para esa fecha

---

### Test 6.5: Filtros combinados

```http
GET http://localhost:3000/api/v1/reservas/admin/panel?estado=pendiente&fecha=2024-11-01
Authorization: Bearer {cliente_token}
```

**Respuesta esperada: 200 OK**

---

## 7️⃣ PATCH /api/v1/reservas/:id/estado - CAMBIAR ESTADO

### Test 7.1: Confirmar una reserva

```http
PATCH http://localhost:3000/api/v1/reservas/{reserva_1_id}/estado
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "estado": "confirmada"
}
```

**Respuesta esperada: 200 OK**
```json
{
  "message": "Reserva confirmada exitosamente",
  "data": {
    "id": "reserva-1",
    "estado": "confirmada",
    ...
  }
}
```

✅ **Verificación:** Estado cambiado a `"confirmada"`

---

### Test 7.2: Intentar modificar reserva confirmada (debe fallar)

```http
PATCH http://localhost:3000/api/v1/reservas/{reserva_1_id}
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "{horario_6_id}",
      "precio": 70
    }
  ]
}
```

**Respuesta esperada: 400 Bad Request**
```json
{
  "message": "Solo se pueden modificar reservas en estado pendiente"
}
```

✅ **Verificación:** No se puede modificar reserva confirmada

---

### Test 7.3: Cancelar reserva como admin

```http
PATCH http://localhost:3000/api/v1/reservas/{reserva_3_id}/estado
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "estado": "cancelada"
}
```

**Respuesta esperada: 200 OK**

✅ **Verificaciones:**
- Estado cambiado a `"cancelada"`
- Horarios liberados

---

# ❌ CASOS DE ERROR

---

## ERROR 1: Sin token (401)

```http
POST http://localhost:3000/api/v1/reservas
Content-Type: application/json

{
  "horarios": [
    {"horario_id": "cualquier-id", "precio": 50}
  ]
}
```

**Respuesta esperada: 401 Unauthorized**
```json
{
  "message": "Falta token"
}
```

---

## ERROR 2: Horario no existe (400)

```http
POST http://localhost:3000/api/v1/reservas
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "00000000-0000-0000-0000-000000000000",
      "precio": 50
    }
  ]
}
```

**Respuesta esperada: 400 Bad Request**
```json
{
  "message": "Uno o más horarios no existen"
}
```

---

## ERROR 3: Horario ya reservado (400)

```http
POST http://localhost:3000/api/v1/reservas
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "horarios": [
    {
      "horario_id": "{horario_1_id}",
      "precio": 50
    }
  ]
}
```

**Respuesta esperada: 400 Bad Request**
```json
{
  "message": "Los siguientes horarios ya están reservados: horario-1"
}
```

---

## ERROR 4: Ver reserva de otro usuario (403)

1. Crear segundo usuario:
```http
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "nombre": "María",
  "apellidos": "López",
  "ci": "7777777",
  "correo": "maria@test.com",
  "contrasena": "maria123",
  "confirmarContrasena": "maria123"
}
```

2. Login segundo usuario:
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "correo": "maria@test.com",
  "contrasena": "maria123"
}
```

3. Intentar ver reserva de Carlos:
```http
GET http://localhost:3000/api/v1/reservas/{reserva_1_id}
Authorization: Bearer {token_de_maria}
```

**Respuesta esperada: 403 Forbidden**
```json
{
  "message": "No tienes permiso para ver esta reserva"
}
```

---

## ERROR 5: Datos inválidos (400)

```http
POST http://localhost:3000/api/v1/reservas
Authorization: Bearer {cliente_token}
Content-Type: application/json

{
  "horarios": []
}
```

**Respuesta esperada: 400 Bad Request**
```json
{
  "message": "Validación fallida",
  "issues": [
    {
      "path": "horarios",
      "message": "Debe seleccionar al menos un horario para reservar"
    }
  ]
}
```

---

# ✅ VERIFICACIÓN FINAL

## Checklist de Funcionalidades

- [ ] **Crear reserva:** Cliente puede crear reserva con múltiples horarios
- [ ] **Ver historial:** Cliente ve todas sus reservas
- [ ] **Filtrar historial:** Por estado (pendiente/confirmada/cancelada)
- [ ] **Paginación:** Funciona con limit y offset
- [ ] **Ver detalle:** Cliente ve detalles completos de su reserva
- [ ] **Modificar reserva:** Cliente puede cambiar horarios si está pendiente
- [ ] **Cancelar reserva:** Cliente puede cancelar y libera horarios
- [ ] **Panel admin:** Admin ve todas las reservas de sus complejos
- [ ] **Filtros admin:** Por estado, complejo y fecha
- [ ] **Confirmar reserva:** Admin puede confirmar reservas
- [ ] **Rechazar reserva:** Admin puede cancelar reservas
- [ ] **Validación duplicados:** No permite reservar horario ocupado
- [ ] **Validación ownership:** Usuario solo ve/modifica sus reservas
- [ ] **Validación estado:** No permite modificar reservas confirmadas
- [ ] **Liberación horarios:** Al cancelar/modificar libera horarios
- [ ] **Transacciones:** Todo es atómico (todo o nada)

---

## Resumen de Estados

```
RESERVA CREADA
      ↓
  pendiente ─────┬────→ confirmada (por admin)
                 │
                 └────→ cancelada (por cliente o admin)
```

---

## Conteo Final

Después de todas las pruebas deberías tener:

- **3 reservas totales:**
  - 1 confirmada (reserva_1)
  - 1 cancelada por cliente (reserva_2)
  - 1 cancelada por admin (reserva_3)

- **Horarios:**
  - `horario_1` y `horario_2`: Ocupados (reserva_1 confirmada)
  - `horario_3`, `horario_4`, `horario_5`: Libres (reservas canceladas)
  - `horario_6`: Libre (nunca usado)

---

## 🎉 PRUEBAS COMPLETADAS

Has probado exitosamente:
- ✅ 7 rutas del Sprint 3
- ✅ 20+ casos de prueba
- ✅ Casos de error y validaciones
- ✅ Flujo completo cliente → admin
- ✅ Transacciones y liberación de horarios

---

**Fecha:** Sprint 3 - Octubre 2024
**Autor:** Sistema de Reservas de Canchas
