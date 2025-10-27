#!/bin/bash

# Script de prueba para API de Reservas
# Ejecutar con: bash test-reservas.sh

BASE_URL="http://localhost:3000/api/v1"

echo "=================================="
echo "TEST: API DE RESERVAS"
echo "=================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. HEALTHCHECK
echo -e "${YELLOW}1. Verificando servidor...${NC}"
curl -s http://localhost:3000/health | jq .
echo ""

# 2. REGISTRAR USUARIO CLIENTE
echo -e "${YELLOW}2. Registrando usuario cliente...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellidos": "Usuario",
    "ci": "9999999",
    "correo": "test@test.com",
    "contrasena": "test123",
    "confirmarContrasena": "test123",
    "telefono": "70999999"
  }')

echo "$REGISTER_RESPONSE" | jq .
echo ""

# 3. LOGIN CLIENTE
echo -e "${YELLOW}3. Login como cliente...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "correo": "test@test.com",
    "contrasena": "test123"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.data.user.id')

if [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Login exitoso${NC}"
  echo "Token: ${TOKEN:0:20}..."
  echo "User ID: $USER_ID"
else
  echo -e "${RED}✗ Error en login${NC}"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi
echo ""

# 4. CAMBIAR A ADMINISTRADOR
echo -e "${YELLOW}4. Cambiando rol a administrador...${NC}"
ROLE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/usuarios/me/role" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "rol": "administrador" }')

echo "$ROLE_RESPONSE" | jq .
echo ""

# 5. CREAR COMPLEJO
echo -e "${YELLOW}5. Creando complejo deportivo...${NC}"
COMPLEJO_RESPONSE=$(curl -s -X POST "$BASE_URL/complejos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"nombre\": \"Complejo Test\",
    \"otb\": \"OTB Test\",
    \"subalcaldia\": \"Test\",
    \"celular\": \"70000000\",
    \"telefono\": \"2222222\",
    \"diasDisponibles\": [\"LUNES\", \"MARTES\", \"MIERCOLES\"],
    \"precioDiurnoPorHora\": 50,
    \"precioNocturnoPorHora\": 70,
    \"ciudad\": \"La Paz\",
    \"admin_id\": \"$USER_ID\"
  }")

COMPLEJO_ID=$(echo "$COMPLEJO_RESPONSE" | jq -r '.id')

if [ "$COMPLEJO_ID" != "null" ]; then
  echo -e "${GREEN}✓ Complejo creado${NC}"
  echo "Complejo ID: $COMPLEJO_ID"
else
  echo -e "${RED}✗ Error al crear complejo${NC}"
  echo "$COMPLEJO_RESPONSE" | jq .
fi
echo ""

# 6. CREAR CANCHA
echo -e "${YELLOW}6. Creando cancha...${NC}"
CANCHA_RESPONSE=$(curl -s -X POST "$BASE_URL/canchas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"complejo_id\": \"$COMPLEJO_ID\",
    \"nombre\": \"Cancha Test 1\",
    \"tipoCancha\": \"FUT5\",
    \"precioDiurnoPorHora\": 50,
    \"precioNocturnoPorHora\": 70
  }")

CANCHA_ID=$(echo "$CANCHA_RESPONSE" | jq -r '.id')

if [ "$CANCHA_ID" != "null" ]; then
  echo -e "${GREEN}✓ Cancha creada${NC}"
  echo "Cancha ID: $CANCHA_ID"
else
  echo -e "${RED}✗ Error al crear cancha${NC}"
  echo "$CANCHA_RESPONSE" | jq .
fi
echo ""

# 7. CREAR HORARIOS
echo -e "${YELLOW}7. Creando horarios de prueba...${NC}"
HORARIOS_RESPONSE=$(curl -s -X POST "$BASE_URL/horarios/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"cancha_id\": \"$CANCHA_ID\",
    \"slots\": [
      {
        \"fecha\": \"2024-10-25\",
        \"hora_inicio\": \"08:00:00\",
        \"hora_fin\": \"09:00:00\",
        \"disponible\": true
      },
      {
        \"fecha\": \"2024-10-25\",
        \"hora_inicio\": \"09:00:00\",
        \"hora_fin\": \"10:00:00\",
        \"disponible\": true
      },
      {
        \"fecha\": \"2024-10-25\",
        \"hora_inicio\": \"18:00:00\",
        \"hora_fin\": \"19:00:00\",
        \"disponible\": true
      }
    ]
  }")

echo "$HORARIOS_RESPONSE" | jq .
echo ""

# 8. CONSULTAR DISPONIBILIDAD
echo -e "${YELLOW}8. Consultando disponibilidad...${NC}"
DISPONIBILIDAD=$(curl -s "$BASE_URL/canchas/disponibilidad/$CANCHA_ID/2024-10-25")

echo "$DISPONIBILIDAD" | jq .

# Extraer IDs de horarios
HORARIO_ID_1=$(echo "$DISPONIBILIDAD" | jq -r '.slots[0].id')
HORARIO_ID_2=$(echo "$DISPONIBILIDAD" | jq -r '.slots[1].id')

echo ""
echo "Horario 1 ID: $HORARIO_ID_1"
echo "Horario 2 ID: $HORARIO_ID_2"
echo ""

# 9. CREAR RESERVA
echo -e "${YELLOW}9. Creando reserva...${NC}"
RESERVA_RESPONSE=$(curl -s -X POST "$BASE_URL/reservas" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"horarios\": [
      {
        \"horario_id\": \"$HORARIO_ID_1\",
        \"precio\": 50
      },
      {
        \"horario_id\": \"$HORARIO_ID_2\",
        \"precio\": 50
      }
    ]
  }")

RESERVA_ID=$(echo "$RESERVA_RESPONSE" | jq -r '.data.id')

if [ "$RESERVA_ID" != "null" ]; then
  echo -e "${GREEN}✓ Reserva creada exitosamente${NC}"
  echo "Reserva ID: $RESERVA_ID"
  echo "$RESERVA_RESPONSE" | jq '.data | {id, estado, items: .items | length, total_precio: [.items[].precio] | add}'
else
  echo -e "${RED}✗ Error al crear reserva${NC}"
  echo "$RESERVA_RESPONSE" | jq .
fi
echo ""

# 10. VER MIS RESERVAS
echo -e "${YELLOW}10. Consultando mis reservas...${NC}"
MIS_RESERVAS=$(curl -s "$BASE_URL/reservas/mis-reservas" \
  -H "Authorization: Bearer $TOKEN")

echo "$MIS_RESERVAS" | jq '.data | length' | xargs -I {} echo "Total de reservas: {}"
echo "$MIS_RESERVAS" | jq '.data[] | {id, estado, items: .items | length}'
echo ""

# 11. PANEL ADMIN
echo -e "${YELLOW}11. Panel de administrador...${NC}"
PANEL_ADMIN=$(curl -s "$BASE_URL/reservas/admin/panel" \
  -H "Authorization: Bearer $TOKEN")

echo "$PANEL_ADMIN" | jq '.data | length' | xargs -I {} echo "Reservas en mis complejos: {}"
echo ""

# 12. CONFIRMAR RESERVA
echo -e "${YELLOW}12. Confirmando reserva...${NC}"
CONFIRMAR=$(curl -s -X PATCH "$BASE_URL/reservas/$RESERVA_ID/estado" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "estado": "confirmada" }')

echo "$CONFIRMAR" | jq '.data | {id, estado}'
echo ""

# 13. INTENTAR MODIFICAR RESERVA CONFIRMADA (debe fallar)
echo -e "${YELLOW}13. Intentando modificar reserva confirmada (debe fallar)...${NC}"
MODIFICAR=$(curl -s -X PATCH "$BASE_URL/reservas/$RESERVA_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"horarios\": [
      {
        \"horario_id\": \"$HORARIO_ID_1\",
        \"precio\": 60
      }
    ]
  }")

echo "$MODIFICAR" | jq .
echo ""

# 14. CANCELAR RESERVA
echo -e "${YELLOW}14. Cancelando reserva...${NC}"
CANCELAR=$(curl -s -X DELETE "$BASE_URL/reservas/$RESERVA_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$CANCELAR" | jq '.data | {id, estado}'
echo ""

# RESUMEN
echo "=================================="
echo -e "${GREEN}RESUMEN DE PRUEBAS${NC}"
echo "=================================="
echo "Token generado: ✓"
echo "Complejo creado: $COMPLEJO_ID"
echo "Cancha creada: $CANCHA_ID"
echo "Horarios creados: 3"
echo "Reserva creada: $RESERVA_ID"
echo "=================================="
