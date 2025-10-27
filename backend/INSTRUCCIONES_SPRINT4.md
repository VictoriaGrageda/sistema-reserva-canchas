# 🚀 Sprint 4 - Pagos con QR - Instrucciones de Uso

## ✅ Implementación Completada

Se ha implementado el sistema completo de pagos con QR para el Sprint 4.

---

## 📂 Archivos creados

### Repositorios (src/repositories/)
- ✅ `qrs.repo.ts` - Operaciones de base de datos para QRs
- ✅ `pagos.repo.ts` - Operaciones de base de datos para pagos

### Servicios (src/services/)
- ✅ `qrs.service.ts` - Lógica de negocio de QRs
- ✅ `pagos.service.ts` - Lógica de negocio de pagos

### Controladores (src/controllers/)
- ✅ `qrs.controller.ts` - Manejo de requests HTTP para QRs
- ✅ `pagos.controller.ts` - Manejo de requests HTTP para pagos

### Rutas (src/routes/)
- ✅ `qrs.routes.ts` - Definición de endpoints de QRs
- ✅ `pagos.routes.ts` - Definición de endpoints de pagos
- ✅ `index.ts` - Actualizado para registrar las nuevas rutas

### Validaciones (src/validations/)
- ✅ `qrs.schema.ts` - Validaciones Zod para QRs
- ✅ `pagos.schema.ts` - Validaciones Zod para pagos

---

## 🔧 Configuración inicial

### 1. Instalar dependencias (si no lo hiciste)
```bash
cd backend
npm install
```

### 2. Iniciar el servidor
```bash
npm run dev
```

El servidor debe iniciar en `http://localhost:3000` (o el puerto configurado).

---

## 🧪 Cómo probar el sistema

### Herramientas recomendadas:
- **Postman** o **Thunder Client** (extensión de VS Code)
- **curl** (línea de comandos)

---

## 📝 Flujo de prueba completo

### Prerrequisitos:
1. Tener un usuario registrado como **administrador**
2. Tener un usuario registrado como **cliente**
3. Tener al menos un **complejo** creado
4. Tener al menos una **cancha** con **horarios disponibles**

---

### PASO 1: Obtener tokens JWT

#### Administrador
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "correo": "admin@example.com",
  "contrasena": "password123"
}
```

Guarda el `token` de la respuesta como `TOKEN_ADMIN`.

#### Cliente
```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "correo": "cliente@example.com",
  "contrasena": "password123"
}
```

Guarda el `token` de la respuesta como `TOKEN_CLIENTE`.

---

### PASO 2: Administrador sube su QR

```http
POST http://localhost:3000/api/v1/qrs
Content-Type: application/json
Authorization: Bearer TOKEN_ADMIN

{
  "imagen_qr": "https://via.placeholder.com/300x300.png?text=QR+PAGO",
  "vigente": true
}
```

**Respuesta esperada (201):**
```json
{
  "message": "QR subido exitosamente",
  "data": {
    "id": "uuid-del-qr",
    "admin_id": "uuid-del-admin",
    "imagen_qr": "https://via.placeholder.com/300x300.png?text=QR+PAGO",
    "vigente": true,
    "created_at": "2024-10-20T10:00:00Z",
    "updated_at": "2024-10-20T10:00:00Z"
  }
}
```

✅ **Guarda el `id` del QR** para futuras pruebas.

---

### PASO 3: Cliente crea una reserva

```http
POST http://localhost:3000/api/v1/reservas
Content-Type: application/json
Authorization: Bearer TOKEN_CLIENTE

{
  "horarios": [
    {
      "horario_id": "uuid-de-horario-disponible",
      "precio": 150
    }
  ]
}
```

**Respuesta esperada (201):**
```json
{
  "data": {
    "id": "uuid-de-reserva",
    "usuario_id": "uuid-del-cliente",
    "estado": "pendiente",
    "items": [...],
    "pagos": [
      {
        "id": "uuid-del-pago",
        "reserva_id": "uuid-de-reserva",
        "estado": "pendiente",
        "qr_id": null
      }
    ]
  }
}
```

✅ **El pago se crea automáticamente** con estado `pendiente`.

✅ **Guarda el `id` de la reserva y el `id` del pago**.

---

### PASO 4: Cliente obtiene el QR para pagar

```http
GET http://localhost:3000/api/v1/pagos/reserva/UUID_RESERVA/qr
```

**No requiere token** (facilita compartir el link).

**Respuesta esperada (200):**
```json
{
  "data": {
    "pago": {
      "id": "uuid-del-pago",
      "reserva_id": "uuid-de-reserva",
      "estado": "pendiente"
    },
    "qr": {
      "id": "uuid-del-qr",
      "imagen_qr": "https://via.placeholder.com/300x300.png?text=QR+PAGO",
      "vigente": true
    }
  }
}
```

✅ El cliente ve la imagen del QR del administrador.

---

### PASO 5: Cliente realiza el pago

🏦 **Fuera del sistema:** El cliente escanea el QR y paga por transferencia bancaria, billetera móvil, etc.

---

### PASO 6: Cliente marca que pagó

```http
POST http://localhost:3000/api/v1/pagos/reserva/UUID_RESERVA/marcar-realizado
Content-Type: application/json
Authorization: Bearer TOKEN_CLIENTE

{
  "qr_id": "uuid-del-qr"
}
```

**Respuesta esperada (200):**
```json
{
  "message": "Pago marcado como realizado. Espera la confirmación del administrador.",
  "data": {
    "id": "uuid-del-pago",
    "estado": "pendiente",
    "qr_id": "uuid-del-qr"
  }
}
```

✅ El pago sigue en estado `pendiente` hasta que el admin confirme.

---

### PASO 7: Administrador ve pagos pendientes

```http
GET http://localhost:3000/api/v1/pagos/admin/pendientes
Authorization: Bearer TOKEN_ADMIN
```

**Respuesta esperada (200):**
```json
{
  "data": [
    {
      "id": "uuid-del-pago",
      "reserva_id": "uuid-de-reserva",
      "estado": "pendiente",
      "reserva": {
        "id": "uuid-de-reserva",
        "estado": "pendiente",
        "usuario": {
          "nombre": "Juan",
          "apellidos": "Pérez",
          "correo": "cliente@example.com",
          "telefono": "12345678"
        },
        "items": [
          {
            "precio": 150,
            "horario": {
              "fecha": "2024-10-25",
              "hora_inicio": "14:00:00",
              "hora_fin": "15:00:00",
              "cancha": {
                "nombre": "Cancha 1",
                "complejo": {
                  "nombre": "Complejo Central"
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

✅ El admin ve la lista de pagos que los clientes marcaron como realizados.

---

### PASO 8A: Administrador CONFIRMA el pago

Después de verificar en su cuenta bancaria:

```http
PATCH http://localhost:3000/api/v1/pagos/UUID_PAGO/confirmar
Authorization: Bearer TOKEN_ADMIN
```

**Respuesta esperada (200):**
```json
{
  "message": "Pago confirmado. La reserva ha sido confirmada.",
  "data": {
    "id": "uuid-del-pago",
    "estado": "confirmado",
    "fecha_pago": "2024-10-20T11:30:00Z",
    "reserva": {
      "id": "uuid-de-reserva",
      "estado": "confirmada"
    }
  }
}
```

✅ **Efectos automáticos:**
- Pago → `confirmado`
- Reserva → `confirmada`
- Se registra la fecha de confirmación

🎉 **¡Reserva confirmada exitosamente!**

---

### PASO 8B: Administrador RECHAZA el pago (alternativa)

Si el admin NO recibió el pago:

```http
PATCH http://localhost:3000/api/v1/pagos/UUID_PAGO/rechazar
Authorization: Bearer TOKEN_ADMIN
```

**Respuesta esperada (200):**
```json
{
  "message": "Pago rechazado. La reserva ha sido cancelada y los horarios liberados.",
  "data": {
    "id": "uuid-del-pago",
    "estado": "rechazado",
    "reserva": {
      "id": "uuid-de-reserva",
      "estado": "cancelada"
    }
  }
}
```

✅ **Efectos automáticos:**
- Pago → `rechazado`
- Reserva → `cancelada`
- **Horarios liberados** (disponibles de nuevo)

---

## 🧪 Otros endpoints para probar

### Listar mis QRs (admin)
```http
GET http://localhost:3000/api/v1/qrs/mis-qrs
Authorization: Bearer TOKEN_ADMIN
```

### Activar un QR específico
```http
PATCH http://localhost:3000/api/v1/qrs/UUID_QR/activar
Authorization: Bearer TOKEN_ADMIN
```

### Desactivar un QR
```http
PATCH http://localhost:3000/api/v1/qrs/UUID_QR/desactivar
Authorization: Bearer TOKEN_ADMIN
```

### Listar todos los pagos (con filtros)
```http
GET http://localhost:3000/api/v1/pagos/admin?estado=confirmado
Authorization: Bearer TOKEN_ADMIN
```

### Obtener detalle de un pago
```http
GET http://localhost:3000/api/v1/pagos/UUID_PAGO
Authorization: Bearer TOKEN_ADMIN
```

---

## 🔍 Verificaciones en la base de datos

Puedes verificar directamente en PostgreSQL:

```sql
-- Ver QRs creados
SELECT * FROM qrs;

-- Ver pagos
SELECT * FROM pagos;

-- Ver reservas con su estado
SELECT r.id, r.estado, r.created_at, u.nombre, u.correo
FROM reservas r
JOIN usuarios u ON r.usuario_id = u.id;

-- Ver pagos con sus reservas
SELECT
  p.id as pago_id,
  p.estado as pago_estado,
  p.fecha_pago,
  r.id as reserva_id,
  r.estado as reserva_estado,
  u.nombre as cliente
FROM pagos p
JOIN reservas r ON p.reserva_id = r.id
JOIN usuarios u ON r.usuario_id = u.id;
```

---

## ❌ Posibles errores y soluciones

### Error: "Usuario no autenticado"
**Solución:** Verifica que incluiste el header `Authorization: Bearer TOKEN`.

### Error: "Solo los administradores pueden subir QRs"
**Solución:** Asegúrate de que el usuario tenga `rol: "administrador"` en la BD.

### Error: "El complejo no tiene un QR de pago configurado"
**Solución:** El admin del complejo debe subir un QR primero con `vigente: true`.

### Error: "No se encontró el pago de esta reserva"
**Solución:** Verifica que la reserva exista y tenga un pago asociado.

### Error: "El pago ya fue confirmado/rechazado"
**Solución:** No se puede cambiar el estado de un pago que ya fue procesado.

---

## 📊 Estados del sistema

### Estados de QR:
- `vigente: true` - QR activo que se muestra a los clientes
- `vigente: false` - QR desactivado (puede volver a activarse)

### Estados de Pago:
- `pendiente` - Cliente aún no pagó O marcó como pagado pero admin no confirmó
- `confirmado` - Admin verificó y confirmó el pago ✅
- `rechazado` - Admin rechazó el pago ❌

### Estados de Reserva:
- `pendiente` - Esperando confirmación de pago
- `confirmada` - Pago confirmado, reserva válida ✅
- `cancelada` - Reserva cancelada ❌

---

## 📦 Colección de Postman

Puedes importar esta colección en Postman:

```json
{
  "info": {
    "name": "Sprint 4 - Pagos con QR",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api/v1"
    },
    {
      "key": "token_admin",
      "value": ""
    },
    {
      "key": "token_cliente",
      "value": ""
    },
    {
      "key": "reserva_id",
      "value": ""
    },
    {
      "key": "pago_id",
      "value": ""
    },
    {
      "key": "qr_id",
      "value": ""
    }
  ]
}
```

---

## 🎯 Checklist de pruebas

- [ ] Admin puede subir QR
- [ ] Admin puede ver sus QRs
- [ ] Admin puede activar/desactivar QRs
- [ ] Cliente puede crear reserva (pago se crea automáticamente)
- [ ] Cliente puede ver QR del complejo
- [ ] Cliente puede marcar pago como realizado
- [ ] Admin puede ver pagos pendientes
- [ ] Admin puede confirmar pago (reserva pasa a confirmada)
- [ ] Admin puede rechazar pago (reserva se cancela, horarios se liberan)
- [ ] No se puede confirmar un pago ya confirmado
- [ ] No se puede eliminar un QR con pagos asociados
- [ ] Solo el dueño de la reserva puede marcar el pago
- [ ] Solo el admin del complejo puede confirmar/rechazar pagos

---

## 📝 Notas importantes

1. **Crear pago automático:** Al crear una reserva, el sistema crea automáticamente un pago con estado `pendiente`. No necesitas crear el pago manualmente.

2. **QR vigente:** Solo puede haber un QR vigente por administrador. Al activar uno, los demás se desactivan automáticamente.

3. **Transacciones atómicas:** Las operaciones críticas (confirmar pago, rechazar pago) usan transacciones de Prisma para garantizar consistencia.

4. **Permisos:** Los endpoints validan que:
   - Solo admins pueden subir/gestionar QRs
   - Solo el dueño de la reserva puede marcar el pago
   - Solo el admin del complejo puede confirmar/rechazar pagos

5. **Sin autenticación:** El endpoint para obtener el QR (`GET /pagos/reserva/:id/qr`) no requiere autenticación para facilitar compartir el link de pago.

---

## 🚀 Siguientes pasos

Una vez probado todo:

1. **Integrar con el frontend** (React Native)
2. **Agregar notificaciones** (cuando se confirma/rechaza un pago)
3. **Agregar historial de pagos** para el cliente
4. **Implementar reportes** de ingresos para el admin

---

## 📧 Soporte

Si encuentras algún error o tienes dudas:
1. Verifica los logs del servidor (`npm run dev`)
2. Revisa la documentación en `ENDPOINTS_SPRINT4_PAGOS.md`
3. Consulta el código fuente en `src/`

---

**¡Listo para probar! 🎉**

El Sprint 4 está completamente implementado y funcionando.
