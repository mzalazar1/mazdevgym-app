# MAZGym — App Móvil (gymmazdev-app)

> Este archivo documenta **solo el cliente móvil** (React Native/Expo): pantallas, navegación, estado, consumo de API. Los modelos de datos, endpoints y reglas de migración del backend viven en el `CLAUDE.md` del repo `gym26-backend`, no acá — este proyecto consume esa API, no tiene base de datos propia.

## Stack

- **Framework:** React Native + Expo (Expo Router — rutas basadas en archivos dentro de `app/`)
- **Backend:** consume la API de `gym26-backend` (`/app/*`) — ver ese repo para modelos y endpoints
- **Auth:** JWT propio de `AppUser` (separado del login admin del panel web)

## Pantallas conocidas (mapeadas hasta el momento)

- `app/(app)/index.tsx` — Inicio (primer tab). Saludo + nombre del gym, cartel de avisos y grilla de accesos (Rutinas, Turnos, Tienda, Mi progreso). Los avisos vienen de `GET /app/announcements` vía `getAnnouncementsApi` (backend ya filtra vigentes y ordena urgentes primero; `[]` sin gym). La query solo corre si `user.gymId` existe; si falla la primera carga el cartel no se renderiza, y si falla un refresco se siguen mostrando los últimos avisos cargados; en ningún caso se afecta el resto de Inicio. El render está en `components/AnnouncementsBoard.tsx` (3 visibles + "Ver todos (n)", acento rojo para urgentes, etiqueta "Para vos" si `targetMemberId` viene con valor). Debajo de la grilla, solo con `gymId`, hay una tarjeta ancha "Horarios y cómo llegar" que abre `/gym-info`.
- `app/gym-info.tsx` — "Horarios y cómo llegar" (pantalla del Stack, registrada en `app/_layout.tsx`). Usa `GET /app/gym` vía `getGymApi` (query key `["app-gym"]`), con pull-to-refresh y estado de error con "Reintentar".
  - Horarios de lunes a domingo desde `schedule.monday..sunday`; un día sin datos, con `open: false` o sin `from`/`to` se muestra "Cerrado", y `schedule: null` muestra un aviso de que el gym no cargó horarios. Hoy se resalta mapeando `getDay()` (que arranca en domingo) a la clave del día con un array explícito.
  - Próximos cierres (el backend ya filtra desde hoy, máx. 10; `reason` puede ser `null`). **Las fechas de cierre son medianoche UTC**: se formatean desde `date.slice(0, 10)` y nunca con la zona horaria del celular, porque si no se muestra el día anterior.
  - Botón "Cómo llegar" (solo si hay `address`): abre Google Maps con `openURL` de `expo-linking`, armando la query con address, city y province no vacíos.
- `app/workout-history.tsx` — historial semanal en bloques + modal con `Calendar` de `react-native-calendars` (marca custom por día). El estado de cada día sale de `getDayStatus`, compartido entre ambas vistas: "faltó" solo aplica a días pasados y posteriores al registro; los futuros con rutina quedan como "Pendiente".

- `app/log-progress.tsx` — formulario de carga de `BodyProgress` (peso, %grasa, cintura, cadera, pecho, brazo, muslo + notas). Llama a `logBodyProgressApi` → `POST /app/progress/body`.
- `app/(app)/profile.tsx` — perfil del usuario. Muestra el **último** registro de `BodyProgress` únicamente (`bodyProgress[bodyProgress.length - 1]`) — no hay gráfico de evolución todavía. También consume `GET /app/stats/monthly` para la barra de progreso, % completado, medalla y promedios (duración, RPE).
- `app/log-workout/[routineId].tsx` — pantalla de logueo de entrenamiento. Precarga automáticamente todos los ejercicios de la rutina asignada como candidatos, y el usuario marca `toggleSkip` si no hizo alguno. Arma el payload de sets (peso, reps, descanso, completado) y lo manda a `POST /app/workouts` vía `logWorkoutApi`.
  - **Ojo:** hoy el cliente **no envía** `scheduledFor` ni `completionPct` en el payload, aunque el backend los acepta — quedan `null`/sin calcular. Si se necesita cumplimiento real contra el calendario planificado, hay que agregar el envío de estos campos acá.

## Convenciones (completar a medida que se confirmen)

- [ ] Gestión de estado (¿Context, Zustand, Redux?) — pendiente de documentar
- [ ] Cliente HTTP usado (¿axios, fetch nativo?) y manejo de refresh token de `AppUser`
- **Datos con React Query** (`QueryClient` en `app/_layout.tsx`: `staleTime` 5 min, `retry: 1`). Los tabs de `(app)` quedan montados, así que volver a un tab **no** dispara `refetchOnMount`.
  - Pull-to-refresh: `RefreshControl` sobre el `ScrollView` con `tintColor="#2563eb"` (profile, routines, shifts, shop usan `refreshing={isRefetching}`).
  - Refresco al volver al tab (por ahora solo en Inicio): `useFocusEffect` de `expo-router` llamando a `refetch()`, salteando el primer foco con un `useRef` porque el montaje ya hace el fetch. En pantallas que combinan esto con pull-to-refresh, usar un estado local (`manualRefreshing`) para el `RefreshControl` en vez de `isRefetching`; si no, el spinner aparece en cada refresco por foco.
- `.npmrc` tiene `legacy-peer-deps=true` y debe quedar en UTF-8 (en UTF-16 npm lo ignora y arrastra `react-dom` y copias duplicadas de React). Instalar paquetes con `npx expo install`.
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
