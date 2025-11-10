<h1>Sistema de Reservas de Canchas SintÃ©ticas</h1>

Este tablero corresponde al desarrollo del Sistema de Reservas de Canchas SintÃ©ticas y Complejos Deportivos, realizado como proyecto universitario en la materia ProgramaciÃ³n MÃ³vil â€“ UMSS (2025/2).

El proyecto se gestionarÃ¡ bajo la metodologÃ­a Ã¡gil Scrum. Se contemplan las siguientes herramientas:

Figma â†’ DiseÃ±o de la interfaz de usuario (prototipos de pantallas).

GitHub â†’ Repositorio de control de versiones (frontend y backend).

Trello â†’ GestiÃ³n de backlog, tareas y seguimiento de sprints.

VS Code + Postman â†’ Entorno de desarrollo y pruebas.

Objetivo General

Desarrollar una aplicaciÃ³n web y mÃ³vil que permita a los usuarios consultar disponibilidad en tiempo real, realizar reservas de canchas deportivas, y gestionar pagos con QR, optimizando la administraciÃ³n de complejos deportivos y mejorando la experiencia de los clientes.
## Ubicación de canchas y complejos

Para ubicar canchas o complejos deportivos en un mapa no se necesita Google Maps: se utiliza un `MapView` con tiles de OpenStreetMap y se apoya en LocationIQ para convertir direcciones o coordinar la selección. El flujo es el siguiente:

1. Crea una cuenta gratuita en https://locationiq.com y copia tu clave pública.
2. Define la variable de entorno `EXPO_PUBLIC_LOCATIONIQ_KEY=<tu_clave>` (por ejemplo en `.env` o `app.config.js`).
3. En los formularios de registro (cancha individual o complejo), presiona el botón “Seleccione Ubicación” para abrir el MapLocationPicker. Puedes buscar una dirección, tocar el mapa o mover el marcador para finalizar la selección.

El mapa no pide una API de Google: está basado en `react-native-maps` con `UrlTile` apuntando a `https://a.tile.openstreetmap.org/{z}/{x}/{y}.png`, así que solo necesitas la clave de LocationIQ para geocodificar/reverse. Si la clave falta, el selector mostrará un mensaje y aún podrás colocar un marcador manualmente.
