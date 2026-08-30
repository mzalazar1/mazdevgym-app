# MAZGym — App Móvil (gymmazdev-app)

> Este archivo documenta **solo el cliente móvil** (React Native/Expo): pantallas, navegación, estado, consumo de API. Los modelos de datos, endpoints y reglas de migración del backend viven en el `CLAUDE.md` del repo `gym26-backend`, no acá — este proyecto consume esa API, no tiene base de datos propia.

## Stack

- **Framework:** React Native + Expo (Expo Router — rutas basadas en archivos dentro de `app/`)
- **Backend:** consume la API de `gym26-backend` (`/app/*`) — ver ese repo para modelos y endpoints
- **Auth:** JWT propio de `AppUser` (separado del login admin del panel web)

## Pantallas conocidas (mapeadas hasta el momento)

- `app/log-progress.tsx` — formulario de carga de `BodyProgress` (peso, %grasa, cintura, cadera, pecho, brazo, muslo + notas). Llama a `logBodyProgressApi` → `POST /app/progress/body`.
- `app/(app)/profile.tsx` — perfil del usuario. Muestra el **último** registro de `BodyProgress` únicamente (`bodyProgress[bodyProgress.length - 1]`) — no hay gráfico de evolución todavía. También consume `GET /app/stats/monthly` para la barra de progreso, % completado, medalla y promedios (duración, RPE).
- `app/log-workout/[routineId].tsx` — pantalla de logueo de entrenamiento. Precarga automáticamente todos los ejercicios de la rutina asignada como candidatos, y el usuario marca `toggleSkip` si no hizo alguno. Arma el payload de sets (peso, reps, descanso, completado) y lo manda a `POST /app/workouts` vía `logWorkoutApi`.
  - **Ojo:** hoy el cliente **no envía** `scheduledFor` ni `completionPct` en el payload, aunque el backend los acepta — quedan `null`/sin calcular. Si se necesita cumplimiento real contra el calendario planificado, hay que agregar el envío de estos campos acá.

## Convenciones (completar a medida que se confirmen)

- [ ] Gestión de estado (¿Context, Zustand, Redux?) — pendiente de documentar
- [ ] Cliente HTTP usado (¿axios, fetch nativo?) y manejo de refresh token de `AppUser`
- [ ] Estructura de carpetas de `app/` (Expo Router) — pendiente de mapear completo
- [ ] Componentes de UI reutilizables — pendiente
- [ ] Manejo de notificaciones push (Expo push token, se guarda en `AppUser.pushToken` del lado backend)

## Segmentos de usuario (relevante para UI condicional)

La app sirve a 3 tipos de usuario distintos, que probablemente necesiten pantallas/flujos diferentes:
- **Socio de gym tradicional** — `AppUser.role = member`, `gym.orgType = gym`. Tiene asistencia física (check-in).
- **Cliente de un Personal Trainer independiente** — `AppUser.role = member`, `gym.orgType = personal_trainer`. Sin check-in físico.
- **Usuario independiente** — `AppUser.role = free_user`, sin `gymId`. Define sus propios objetivos (`AppUser.goal`), sin supervisión.

Ver `gym.orgType` devuelto en `GET /app/profile` para renderizar condicionalmente según el segmento.

## Pendiente / a definir

- Evaluar si usar Supabase para algo (se consideró para auth, no está en uso todavía — decisión pendiente).
- Documentar el resto de las pantallas a medida que se mapeen (rutinas, historial de workouts, tienda/carrito, notificaciones).
