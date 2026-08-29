# Documentació de l'aplicació Colla Gegantera

Document d'inventari complet de l'estat actual de l'aplicació (FASE 0 — Congelació i inventari, tag `v0.1-single-colla`).

- **Data:** 27 d'agost de 2026
- **Commit de referència:** `a2910a3` (Initial commit)
- **Tag:** `v0.1-single-colla`
- **Idioma de la interfície:** català

---

## 1. Resum de l'aplicació

Aplicació web per gestionar una colla gegantera: autenticació, esdeveniments (trobades i assajos), inscripcions familiars, assignació de rols, dissenyador d'escenari, galeria de fotos, enquestes, anuncis, calendari, notificacions (in-app + push + correu), sistema de famílies (arbre genealògic, invitacions, caps de família) i administració (usuaris, rols, configuració de la colla).

## 2. Arquitectura i stack

| Capa | Tecnologia |
|---|---|
| Backend | ASP.NET Core 9.0 (C#), API REST |
| Base de dades | SQLite (EF Core 9.0.0) |
| Autenticació | ASP.NET Core Identity + JWT Bearer |
| Frontend | React 19 + Vite + TypeScript |
| Estils | Tailwind CSS v4 + shadcn/ui |
| Estat del frontend | Contexts de React (Auth, Theme, CollaSettings) |
| Notificacions push | WebPush (NuGet `WebPush` 1.0.13) + Service Worker |
| Emmagatzematge d'imatges | Local a `Backend/wwwroot/uploads/` (avatars i photos) |
| Correu | SMTP de Gmail (smtp.gmail.com:587, SSL) |

### Estructura del repositori

```
CollaGegantera/
├── Backend/               # API ASP.NET Core (net9.0)
│   ├── Controllers/       # 15 controllers
│   ├── Data/              # ApplicationDbContext + DbSeeder
│   ├── Services/          # 5 serveis
│   └── wwwroot/uploads/   # Avatars i fotos (gitignored)
├── FrontendReact/         # Frontend React 19 + Vite
├── Shared/                # Models, DTOs i enums compartits
├── backups/               # Còpies de seguretat de la DB (gitignored)
├── CollaGegantera.sln     # Solució (Backend + Shared)
├── docker-compose.yml
├── deploy-oracle.sh
└── .gitignore
```

## 3. Models (Shared/Models, 20 fitxers)

Tots els models tenen `Id` de tipus `string` (GUID) tret d'on s'indica.

| Model | Propietats principals | Relacions |
|---|---|---|
| `AppUser` (hereta `IdentityUser`) | `Nom`, `Cognoms`, `DataNaixement`, `FamilyGroupId`, `FamilyGroup?`, `AvatarUrl`, `EncryptedFamilyRole`, `IsFamilyHead`, `NotificationsEnabled` (true) | FamilyGroup 1---N AppUser |
| `Event` | `Nom` (requerit), `DataHora` (requerit), `Descripcio`, `Lloc`, `Latitud`, `Longitud`, `MaterialImprescindible`, `Normes`, `Tipus` (TipusEvent), `RecurringPatternId?`, `[NotMapped] GoogleMapsUrl` | Event 1---1 RecurringPattern, 1---N Attendance, EventRegistration, EventStagePosition, EventUserDanceRole, Notification (RelatedEventId), Photo |
| `FamilyGroup` | `NomFamilia`, `Membres` (ICollection<AppUser>), `ParentUserId?` | 1---N AppUser, FamilyMemberRole, FamilyInvitation |
| `FamilyMemberRole` | `FamilyGroupId`, `UserId`, `Role`, `HasAccount`, `Nom`, `Cognoms`, `Email` | N:1 FamilyGroup i AppUser; índex únic (FamilyGroupId, UserId) |
| `FamilyInvitation` | `FamilyGroupId`, `InvitedByUserId`, `TargetUserId`, `Role`, `Status` (Pending/Accepted/Rejected), `CreatedAt`, `RespondedAt?` | N:1 FamilyGroup i AppUser |
| `Announcement` | `Title`, `Body`, `AuthorId`, `CreatedAt`, `IsPinned`, `ImageUrl?` | AppUser 1---N Announcement |
| `Attendance` | Clau composta `(EventId, AppUserId)`, `DataConfirmacio` | N:1 Event i AppUser |
| `CollaSettings` | `Id` = 1 (fila única), `CollaName` ("Colla Gegantera"), `PrimaryColor` ("#e63946"), `LogoUrl?`, `AvailableRoles` (llista separada per comes), `AvailableRoleGroups?` (JSON) | Sense relacions |
| `Dance` | `Nom` (requerit), `Descripcio` | 1---N DanceRole |
| `DanceRole` | `Nom`, `DanceId` | N:1 Dance; 1---N DanceRoleMaterial i EventUserDanceRole |
| `DanceRoleMaterial` | Clau composta `(DanceRoleId, RequiredMaterialId)`, `Quantitat` | N:N DanceRole <-> RequiredMaterial amb quantitat |
| `EventRegistration` | `EventId`, `UserId`, `RegisteredAt`, `AssignedRole?` | N:1 Event i AppUser; índex únic (EventId, UserId) |
| `EventStagePosition` | `EventId`, `UserId`, `DanceName`, `X`, `Y`, `Notes?` | N:1 Event i AppUser |
| `EventUserDanceRole` | Clau composta `(EventId, AppUserId, DanceRoleId)` | N:N Event + AppUser + DanceRole |
| `Notification` | `UserId`, `Title`, `Body`, `Type` ("General"), `RelatedEventId?`, `IsRead`, `CreatedAt` | N:1 AppUser, Event (opcional) |
| `Photo` | `EventId`, `Url`, `Description?`, `UploadedById?`, `UploadedAt`, `Year` | N:1 Event i AppUser |
| `PushSubscription` | `UserId`, `Endpoint`, `P256dh`, `Auth`, `CreatedAt` | N:1 AppUser; índex únic sobre Endpoint |
| `RecurringPattern` | `DayOfWeek`, `IntervalWeeks` (1), `TotalOccurrences` (10), `StartDate`, `EndDate?` | 1:1 amb Event |
| `RequiredMaterial` | `Nom`, `Descripcio` | 1---N DanceRoleMaterial |
| `Survey` | `Title`, `Description`, `OptionsJson` (string JSON), `VotesJson` (string JSON), `CreatedByUserId`, `IsActive` (true), `CreatedAt`, `ExpiresAt?`; mètodes `GetOptions/SetOptions/GetVotes/SetVotes` | N:1 AppUser |

### Resum de relacions

- `FamilyGroup 1---N AppUser` · `AppUser 1---N {Attendance, EventRegistration, EventStagePosition, EventUserDanceRole, Notification, Announcement, Photo, PushSubscription, Survey, FamilyMemberRole, FamilyInvitation}`
- `Event 1---N {Attendance, EventRegistration, EventStagePosition, EventUserDanceRole, Notification, Photo}` · `Event 1---1 RecurringPattern` (opcional)
- `Dance 1---N DanceRole` · `DanceRole 1---N {DanceRoleMaterial, EventUserDanceRole}` · `RequiredMaterial 1---N DanceRoleMaterial`
- `FamilyGroup 1---N {FamilyMemberRole, FamilyInvitation}`
- Entitats d'unió amb clau composta: `Attendance` (EventId+AppUserId), `EventUserDanceRole` (EventId+AppUserId+DanceRoleId), `DanceRoleMaterial` (DanceRoleId+RequiredMaterialId)

### ApplicationDbContext

- Hereta `IdentityDbContext<AppUser>` (inclou taules d'Identity: Users, Roles, UserRoles, UserClaims, UserLogins, UserTokens, RoleClaims).
- 19 `DbSet`: FamilyGroups, Events, Dances, DanceRoles, RequiredMaterials, DanceRoleMaterials, EventUserDanceRoles, Attendances, Notifications, RecurringPatterns, Surveys, Announcements, Photos, CollaSettings, FamilyMemberRoles, EventRegistrations, EventStagePositions, PushSubscriptions, FamilyInvitations.
- `OnModelCreating`: noms de taula explícits, claus primàries compostes (`DanceRoleMaterial`, `EventUserDanceRole`, `Attendance`), clau explícita per `EventStagePosition.Id`, índexs únics (FamilyMemberRole, EventRegistration, PushSubscription.Endpoint). **No hi ha cap configuració explícita d'OnDelete**: s'apliquen les convencions per defecte d'EF Core.

## 4. Enums (Shared/Enums)

```csharp
public enum TipusEvent { Assaig = 0, Trobada = 1 }
```

## 5. DTOs (Shared/DTOs, 9 fitxers)

| DTO | Ús | Campos |
|---|---|---|
| `RegisterDto` | Registre | Nom*, Cognoms*, Email*, Password* (min 6), DataNaixement, NomFamilia?, CodiColla* |
| `LoginDto` | Inici de sessió | Email*, Password* |
| `EventCreateDto` (+ `RecurringDto`) | Crear esdeveniment | Nom*, DataHora*, Descripcio, Lloc, Latitud, Longitud, MaterialImprescindible, Normes, Tipus*; Recurring: DayOfWeek, IntervalWeeks, TotalOccurrences, EndDate? |
| `FamilyMemberDto` | Resposta de membre | Id, Nom, Cognoms |
| `AddFamilyMemberDto` | Afegir membre sense compte | Nom*, Cognoms*, DataNaixement |
| `AssignRoleDto` | Assignar rol de ball | EventId*, AppUserId*, DanceRoleId* |
| `GroupAttendanceDto` | Inscripció en grup | EventId*, UserIds* (min 1) |
| `MyEventMaterialDto` (+ `MaterialEspecificDto`) | Material de l'usuari | MaterialGeneralEsdeveniment, MaterialEspecificRol (Nom, Quantitat) |
| `LeaderboardDto` | Rànquing d'assistències | Nom, Cognoms, TotalAssistencies |

## 6. Controllers i endpoints (Backend/Controllers, 15 fitxers)

Convencions: rols organitzadors = `Admin`, `OrganitzadorTrobades`, `OrganitzadorAssajos`; fotògraf = `Fotograf`. Ruta base habitual `api/[controller]`.

### AnnouncementsController — `api/Announcements`
| Mètode | Ruta | Accés | Descripció |
|---|---|---|---|
| GET | `/api/announcements` | autenticat | Llista anuncis (fixats primer, després per data) |
| POST | `/api/announcements` | Admin, Org.* | Crea anunci + notificació push a tothom |
| PUT | `/api/announcements/{id}` | Admin, Org.* | Actualitza (títol/cos/pinned/imatge) |
| DELETE | `/api/announcements/{id}` | Admin, Org.* | Elimina |

### AttendanceController — `api/Attendance`
| GET | `/api/attendance/group-enroll` | autenticat | Inscripció en bloc dels membres de la família (valida nucli) |
| GET | `/api/attendance/{eventId}/attendees` | autenticat | Assistents (org. veuem llista completa, resta només el total) |
| GET | `/api/attendance/leaderboard` | autenticat | Top 10 d'assistències |

### AuthController — `api/Auth`
| POST | `/api/auth/register` | públic | Registre: valida CodiColla, crea família, assigna `GeganterBase`, retorna JWT |
| POST | `/api/auth/login` | públic | Login, JWT vàlid 7 dies amb rols i FamilyGroupId |
| POST | `/api/auth/add-family-member` | autenticat | Afegeix familiar dependent (email fictici) |
| GET | `/api/auth/my-family` | autenticat | Membres de la família (id + nom) |
| POST | `/api/auth/avatar` | autenticat | Puja/actualitza avatar (multipart) |
| GET | `/api/auth/profile` | autenticat | Perfil + rols |
| PUT | `/api/auth/profile` | autenticat | Actualitza nom/cognoms/data naixement |
| PUT | `/api/auth/profile/notifications` | autenticat | Activa/desactiva notificacions |
| DELETE | `/api/auth/profile` | autenticat | Elimina el compte (requereix contrasenya) |
| PUT | `/api/auth/profile/password` | autenticat | Canvia contrasenya |

### EventAssignmentsController — `api/EventAssignments`
| POST | `/api/eventassignments/assign` | Org.* | Assigna `DanceRole` a usuari en esdeveniment (evita duplicats) |
| GET | `/api/eventassignments/{eventId}/my-material` | autenticat | Material general + específic del rol de l'usuari |

### EventRegistrationController — `api/events/{eventId}/registration`
| GET | `{eventId}/registration` | autenticat | Si està inscrit + RegistrationId |
| POST | `{eventId}/registration` | autenticat | S'inscriu (rebutja si l'esdeveniment ja ha començat) |
| POST | `{eventId}/registration/bulk` | autenticat | Inscripció en bloc (comptes i familiars) |
| DELETE | `{eventId}/registration` | autenticat | Cancel·la la pròpia |
| DELETE | `{eventId}/registration/{userId}` | autenticat | Cancel·la d'un usuari (interessat, admin o org.) |
| PUT | `{eventId}/registration/roles` | Admin, Org.* | Actualitza rols dels inscrits + notificacions de canvi |

### EventsController — `api/Events`
| GET | `/api/events/{id}` | autenticat | Detall amb nombre d'inscrits |
| GET | `/api/events/{id}/registrations` | autenticat | Inscripcions amb dades usuaris/familiars |
| GET | `/api/events` | autenticat | Llista, filtre opcional `start`/`end` |
| GET | `/api/events/upcoming` | autenticat | Esdeveniments propers (DataHora >= ara) |
| POST | `/api/events` | Admin, Org.* | Crea esdeveniment (+ recurrència) i notifica tothom |
| PUT | `/api/events/{id}` | Admin, Org.* | Actualitza |
| DELETE | `/api/events/{id}` | Admin, Org.* | Elimina + dades relacionades (inscripcions, posicions, notificacions) |

### FamilyController — `api/Family`
| GET | `/api/family/my` | autenticat | Grup familiar (membres, rols, no-compte) |
| GET | `/api/family/members` | autenticat | Membres de la família de l'usuari |
| PUT | `/api/family/role` | autenticat | Actualitza rol familiar (xifrat) d'un membre de la mateixa família |
| GET | `/api/family/tree` | autenticat | Arbre genealògic amb rols desxifrats |
| POST | `/api/family/reset` | Admin | Reinicia la família (grup nou + cap) |
| POST | `/api/family/member` | cap de família | Afegeix membre (amb compte → invitació; sense → directe) |
| POST | `/api/family/invitation/{invitationId}/accept` | destinatari | Accepta invitació |
| POST | `/api/family/invitation/{invitationId}/reject` | destinatari | Rebutja invitació |
| GET | `/api/family/invitations` | autenticat | Invitacions pendents |
| GET | `/api/family/migration-candidates` | autenticat | Membres candidats a migrar |
| POST | `/api/family/migrate` | autenticat | Migra membres entre famílies |
| POST | `/api/family/leave` | autenticat | Abandona família (opció migrar; promociona nou cap) |
| POST | `/api/family/transfer-head` | cap de família | Transfereix el rol de cap |
| DELETE | `/api/family/member/{userId}` | cap de família | Elimina membre i el deixa amb família pròpia |
| PUT | `/api/family/member` | cap de família | Actualitza dades d'un membre |
| POST | `/api/family/member/link` | cap de família | Vincula compte existent a un membre |

### GalleryController — `api/Gallery`
| POST | `/api/gallery/upload/{eventId}` | Fotograf, Admin, Org.* | Puja foto (multipart) |
| GET | `/api/gallery/{eventId}` | autenticat | Fotos de l'esdeveniment |

### NotificationsController — `api/Notifications`
| GET | `/api/notifications` | autenticat | Notificacions (màxim 50, recents) |
| GET | `/api/notifications/unread-count` | autenticat | Comptador no llegides |
| PUT | `/api/notifications/{id}/read` | autenticat | Marca pròpia com a llegida |
| DELETE | `/api/notifications/{id}` | autenticat | Elimina pròpia |
| POST | `/api/notifications/send` | Admin, Org.* | Envia a un usuari |
| POST | `/api/notifications/broadcast` | Org.* | Envia a tots excepte el remitent |

### PhotosController — `api/Photos`
| GET | `/api/photos` | autenticat | Totes, filtre opcional `year` |
| GET | `/api/photos/grouped` | autenticat | Agrupades per any i esdeveniment |
| POST | `/api/photos` | Fotograf, Admin, Org.* | Crea registre de foto publicada |
| DELETE | `/api/photos/{id}` | Fotograf, Admin | Elimina foto |

### PushController — `api/Push`
| GET | `/api/push/vapid-public-key` | públic | Clau pública VAPID |
| POST | `/api/push/subscribe` | autenticat | Registra subscripció push |
| POST | `/api/push/unsubscribe` | autenticat | Elimina subscripció |

### RolesController — `api/Roles`
| GET | `/api/roles/users` | autenticat | Usuaris amb rols |
| GET | `/api/roles/available` | autenticat | Llista de rols del sistema |
| POST | `/api/roles/assign` | Admin | Assigna rol + notifica |
| POST | `/api/roles/remove` | Admin | Treu rol + notifica |
| DELETE | `/api/roles/users/{userId}` | Admin | Elimina usuari (no a si mateix) i dades relacionades |
| GET | `/api/roles/non-account-members` | Admin | Membres sense compte (FamilyMemberRoles) |
| DELETE | `/api/roles/non-account-members/{id}` | Admin | Elimina membre sense compte i les seves inscripcions |

### SettingsController — `api/Settings`
| GET | `/api/settings` | públic | Ajustos de la colla (crea per defecte si no existeix) |
| PUT | `/api/settings` | Admin | Nom, color primari, logo |
| POST | `/api/settings/logo` | Admin | Puja logo (multipart) |
| GET | `/api/settings/roles` | públic | Rols disponibles de la colla |
| PUT | `/api/settings/roles` | Admin, Org.* | Actualitza rols disponibles |
| GET | `/api/settings/role-groups` | públic | Grups de rols |
| PUT | `/api/settings/role-groups` | Admin, Org.* | Actualitza grups i en deriva rols |

### StagePositionsController — `api/events/{eventId}/stage`
| GET | `{eventId}/stage` | autenticat | Posicions, filtre opcional `dance` |
| GET | `{eventId}/stage/dances` | autenticat | Noms de ball amb posicions desades |
| POST | `{eventId}/stage` | Admin, Org.* | Desa posicions (reemplaça les existents per ball) |
| DELETE | `{eventId}/stage/{id}` | Admin, Org.* | Elimina posició |

### SurveysController — `api/Surveys`
| GET | `/api/surveys` | autenticat | Enquestes actives amb recompte de vots |
| POST | `/api/surveys` | Admin, Org.* | Crea enquesta + notifica tothom excepte creador |
| POST | `/api/surveys/{id}/vote` | autenticat | 1 vot per usuari (el canvia si ja n'ha votat) |
| DELETE | `/api/surveys/{id}` | Admin, Org.* | Tanca enquesta |
| DELETE | `/api/surveys/{id}/permanent` | Admin | Elimina definitivament |

## 7. Serveis (Backend/Services, 5 fitxers)

### DailyReminderWorker.cs
`BackgroundService` (hosted service) que actua com a cron natiu. Cada dia a les **01:00** executa:
- Usuaris contactables: `Email != null` i que no acabi en `@familiar.local`.
- Recordatoris: **Trobades → a 30 i 15 dies**; **Assajos → a 7 dies**.
- Per a cada esdeveniment amb `DataHora.Date == Today.AddDays(dies)`: notificació in-app a tothom (`notificationService.SendToAllAsync`) amb títol `"Recordatori: {trobada/assaig} d'aquí a {dies} dies"`, i correus individuals (`emailService.SendEmailAsync`) amb missatges diferents segons si l'usuari està inscrit o no, amb `Task.Delay(500)` entre correus.
- Tota la lògica va en try/catch que loggeja errors sense aturar el bucle.

### EmailService.cs
Correu HTML via SMTP de Gmail. Llegeix `EmailSettings:SmtpServer`, `SmtpPort`, `SenderEmail`, `SenderPassword`, `SenderName`. `EnableSsl = true`, `IsBodyHtml = true`. Únic mètode `SendEmailAsync(toEmail, subject, bodyHtml)`. Errors loggejats però no rellançats. DI: `AddTransient`.

### GoogleDriveService.cs
Malgrat el nom, **no utilitza Google Drive**: emmagatzema fitxers en local a `{WebRootPath}/uploads/{avatars|photos}` (crea els directoris si no existeixen).
- `UploadImageAsync(Stream, fileName, mimeType, isAvatar = false)` → retorna la URL virtual `/uploads/{avatars|photos}/{fileName}`.
- `DeleteFileByUrlAsync(url)` → si la URL comença per `/uploads/` esborra el fitxer local.
Registrat com a `AddSingleton`.

### NotificationService.cs
Persistència de notificacions + reenviament push.
- `SendAsync(userId, title, body, relatedEventId?)`: afegeix `Notification` (Type "General"); si `NotificationsEnabled` → push.
- `SendToAllExceptAsync(excludeUserId, ...)`, `SendToAllAsync(...)`.
- Nota: `SendToAllAsync` **no estableix `Body`** a la BD (només `Title`, `Type`, `RelatedEventId`), tot i que l'envia per push. És el mètode que usa `DailyReminderWorker`.
DI: `AddTransient`.

### PushNotificationService.cs
WebPush (NuGet `WebPush` 1.0.13). Les claus VAPID es llegeixen de la configuració (`Vapid:PublicKey`, `Vapid:PrivateKey`, `Vapid:Subject`) — **mai a mà al codi**. La pública es pot exposar (l'appsettings la conté); la privada només viu a l'entorn/User Secrets.
- Mètodes: `GetPublicKey()`, `SubscribeAsync(userId, endpoint, p256dh, auth)`, `UnsubscribeAsync(userId, endpoint)`, `SendToUserAsync(...)`, `SendToAllAsync(...)`. En cas de `WebPushException` elimina les subscripcions invàlides. DI: `AddTransient`.

## 8. Program.cs i configuració de secrets (Backend)

- `SecretEnvironment.Apply(...)`: accepta variables d'entorn genèriques (`JWT_KEY`, `SMTP_PASSWORD`, `VAPID_PRIVATE_KEY`, `COLLA_CODE`, `DATABASE_CONNECTION`, ...) a més del patró nadiu ASP.NET (`Jwt__Key`, `EmailSettings__SenderPassword`, ...).
- `StartupValidation.ValidateRequiredSettings(...)`: **fail-fast** — si falta un secret crític (JWT, SMTP password, VAPID, CollaCode, ConnectionStrings) l'aplicació **no arrenca**. No hi ha cap valor per defecte.
- Secrets locals de desenvolupament: **.NET User Secrets** (`dotnet user-secrets set ...`). `appsettings.Local.json` ja no s'utilitza.
- Swagger: "API Colla Gegantera v1" amb definició de seguretat Bearer.
- DbContext: SQLite amb connection string `DefaultConnection`.
- Identity: `AppUser` + `IdentityRole`, política contrasenya: dígit requerit, longitud mínima 6.
- JWT: `Jwt:Key` (ASCII), `Jwt:Issuer`, `Jwt:Audience`, `ClockSkew = Zero`.
- CORS `AllowPWA`: origen fix `https://colla-gegantera.pages.dev`; en desenvolupament qualsevol `http(s)://localhost` amb credentials.
- Middleware: Swagger UI (dev), UseHttpsRedirection, UseStaticFiles, UseCors, UseAuthentication, UseAuthorization, MapControllers.
- Al final: `DbSeeder.SeedRolesAsync(services)` (crea els rols d'Identity).

## 9. Rols d'Identity

| Rol | Permisos principals |
|---|---|
| `Admin` | Tot: administra usuaris, rols, configuració, carpetes, esdeveniments, enquestes, anuncis, notificacions, galeria (+ elimina fotos) |
| `OrganitzadorTrobades` | Crea/edita/elimina esdeveniments (trobades), assigna rols, escenari, enquestes, anuncis, notificacions, galeria, rols d'esdeveniment |
| `OrganitzadorAssajos` | Igual que l'anterior per a assajos |
| `Fotograf` | Puja fotos a la galeria; elimina fotos (amb Admin) |
| `GeganterBase` | Rol per defecte al registrar-se: participació, inscripcions, família, enquestes, votació, perfil |

Els rols es retornen com a array de strings (`roles: string[]`). Els guards del frontend comproven `Admin`, `OrganitzadorTrobades` i `OrganitzadorAssajos` (galeria també `Fotograf`).

## 10. Frontend (FrontendReact)

### Configuració de xarxa
- `src/services/api.ts`: instància **axios** amb base `import.meta.env.VITE_API_URL || '/api'`, interceptor que afegeix `Authorization: Bearer <token>` (de localStorage) i interceptor de resposta que en **401** neteja sessió i redirigeix a `/login`.
- `vite.config.ts`: proxy de `/api` i `/uploads` cap a `http://localhost:5000`.

### 10.1 Rutes (src/App.tsx)

Públiques:
| Path | Component |
|---|---|
| `/` | Landing |
| `/login` | Login |
| `/register` | Register |
| `/politica-privacitat` | PrivacyPolicy |

Protegides (dins ProtectedRoute + Layout):
| Path | Component | Protecció |
|---|---|---|
| `/dashboard` | Dashboard | autenticat |
| `/esdeveniments` | Events | autenticat |
| `/esdeveniment/:id` | EventDetail | autenticat |
| `/esdeveniment/:id/inscripcio` | EventRegistration | autenticat |
| `/esdeveniment/:id/galeria` | EventGallery | autenticat |
| `/esdeveniment/:id/assignacions` | EventAssignments | autenticat |
| `/esdeveniment/:id/escenari` | StageDesigner | autenticat |
| `/calendari` | Calendar | autenticat |
| `/enquestes` | Surveys | autenticat |
| `/notificacions` | Notifications | autenticat |
| `/perfil` | Profile | autenticat |
| `/anuncis` | Announcements | autenticat |
| `/familia` | Family | autenticat |
| `/galeria` | Gallery | autenticat |
| `/admin/rols` | AdminRoles | AdminRoute |
| `/admin/configuracio` | AdminSettings | AdminRoute |
| `/organitzacio/rols-esdeveniment` | EventRoles | OrganizerRoute |
| `*` | redirecte a `/` | — |

### 10.2 Pàgines i crides a l'API

| Pàgina | Funcionalitat | Crides API |
|---|---|---|
| Landing | Hero + funcionalitats; si autenticat redirigeix a `/dashboard` | — |
| Login | Formulari login | `POST /auth/login` (via AuthContext) |
| Register | Registre amb checkbox de privacitat obligatori | `POST /auth/register` (via AuthContext) |
| Dashboard | Comptadors + classificació assistència + notificacions recents | `GET /events/upcoming`, `GET /attendance/leaderboard`, `GET /notifications` |
| Events | Llista filtrable per tipus; creació (org.) | `GET /events`, `POST /events` |
| EventDetail | Detall amb pestanyes (detalls, inscrits, rols, material, galeria), mapa Google, inscriure's, editar/esborrar, assignació de rols | `GET /events/:id`, `GET /events/:id/registration`, `GET /events/:id/registrations`, `GET /settings/role-groups`, `PUT /events/:id/registration/roles`, `PUT /events/:id`, `DELETE /events/:id` |
| EventRegistration | Inscripció familiar massiva dels membres no inscrits | `GET /events/:id`, `GET /family/members`, `GET /events/:id/registrations`, `POST /events/:id/registration/bulk`, `DELETE /events/:id/registration/:memberId` |
| EventGallery | Galeria de fotos de l'esdeveniment + pujada (org.) | `GET /events/:id`, `GET /gallery/:id`, `POST /gallery/upload/:id` (multipart) |
| EventAssignments | **WIP/legacy**: crida endpoints que no existeixen als controllers (`GET /events/:id/material`, `GET /users`, `POST/DELETE /events/:id/material/:materialId/assign`) | — |
| StageDesigner | Dissenyador d'escenari drag&drop per ball, agrupat per rols | `GET /events/:id`, `GET /events/:id/registrations`, `GET /events/:id/stage/dances`, `GET /settings/role-groups`, `GET /events/:id/stage?dance=`, `POST /events/:id/stage` |
| Calendar | Calendari mensual amb esdeveniments | `GET /events` amb `start`/`end` |
| Surveys | CRUD enquestes + vot | `GET /surveys`, `POST /surveys`, `POST /surveys/:id/vote`, `DELETE /surveys/:id`, `DELETE /surveys/:id/permanent` |
| Notifications | Llista amb filtres, marcar/eliminar | `GET /notifications`, `PUT /notifications/:id/read`, `DELETE /notifications/:id` |
| Profile | Perfil, avatar, dades, contrasenya, notificacions, eliminar compte | `GET /auth/profile`, `POST /auth/avatar`, `PUT /auth/profile`, `PUT /auth/profile/password`, `PUT /auth/profile/notifications`, `DELETE /auth/profile` |
| Announcements | Llista/CRUD anuncis | `GET /announcements`, `POST /announcements`, `PUT /announcements/:id`, `DELETE /announcements/:id` |
| Family | Arbre genealògic, invitacions, afegir/editar/eliminar membres, vincular, transferir cap, migrar, abandonar | `GET /family/my`, `GET /family/invitations`, `GET /family/members`, `POST /family/member`, `PUT /family/member`, `DELETE /family/member/:id`, `POST /family/member/link`, `POST /family/invitation/:id/accept`, `POST /family/invitation/:id/reject`, `POST /family/migrate`, `GET /family/migration-candidates`, `POST /family/leave`, `POST /family/transfer-head` |
| Gallery | Galeria global per any > esdeveniment, pujada i eliminació | `GET /photos`, `GET /events`, `POST /gallery/upload/:eventId`, `POST /photos`, `DELETE /photos/:id` |
| AdminRoles | Gestió rols usuaris i membres sense compte | `GET /roles/users`, `GET /roles/non-account-members`, `POST /roles/assign`, `POST /roles/remove`, `DELETE /roles/users/:id`, `DELETE /roles/non-account-members/:id` |
| AdminSettings | Configuració de la colla (nom, color, logo) | `GET /settings`, `POST /settings/logo`, `PUT /settings` |
| EventRoles | CRUD grups/sub-rols d'esdeveniment | `GET /settings/role-groups`, `PUT /settings/role-groups` |
| PrivacyPolicy | Política de privacitat estàtica | — |

### 10.3 Contexts, serveis i components

- **AuthContext**: estat global (`user`, `token`, `isAuthenticated`, `isLoading`), restauració des de localStorage, `login`, `register`, `logout`, `refreshUser`. Després de login/register crida `subscribeToPush()`; al logout `unsubscribeFromPush()`. Mapeja el perfil (id, email, nom, cognoms, avatarUrl, **roles**, notificationsEnabled, isFamilyHead).
- **ThemeContext**: tema clar/fosc.
- **CollaSettingsContext**: configuració de la colla (nom, color, logo) carregada de `/settings`.
- **push.ts**: `requestPushPermission()`, `subscribeToPush()` (registra `public/sw.js`, obté la clau VAPID per `GET /push/vapid-public-key`, es subscriu a `pushManager` i envia a `POST /push/subscribe`), `unsubscribeFromPush()`.
- **Components**: `Layout`, `Sidebar` (menús per secció i rol, tancar sessió), `MobileHeader` (dropdown de notificacions, toggle de tema, menú), `BottomNav` (5 pestanyes), `BackButton`, `FamilyTree` (arbre SVG per generacions, colors per rol/cap, menú contextual si és cap de família), `EventGalleryInline`.
- **Tipus TS**: `src/types/index.ts`. **Utils**: `src/lib/utils.ts` (`cn`, `formatDate`/`formatDateTime` en `ca-ES`).

## 11. Fluxos clau

### Registre
1. L'usuari omple RegisterDto (nom, cognoms, email, contrasenya, data naixement, codi de colla opcionalment + nom de família) i accepta la política de privacitat (checkbox obligatori).
2. El backend valida el `CodiColla` contra `CollaCode` de configuració.
3. Es crea l'`AppUser` + un `FamilyGroup` (amb `NomFamilia` o predeterminat) i se li assigna `GeganterBase`.
4. Es retorna el JWT (7 dies); el frontend desa sessió i registra la subscripció push.

### Inscripció / assistència
- Individual: `POST /events/{id}/registration` (comprova que no hagi començat; índex únic EventId+UserId).
- Familiar en bloc: `POST /events/{id}/registration/bulk` o `POST /attendance/group-enroll` (només membres del mateix nucli).
- L'històric d'assistències alimenta el leaderboard.

### Famílies
- Cada usuari pertany a un `FamilyGroup`. Els membres sense compte es modelen amb `FamilyMemberRole` (HasAccount = false).
- El cap de família pot afegir/editar/eliminar membres, vincular comptes existents (`POST /family/member/link`), i transferir el rol de cap (`POST /family/transfer-head`).
- Els membres amb compte s'uneixen per invitació (`FamilyInvitation`: Pending/Accepted/Rejected).
- Els rols familiars es desen **xifrats** (`EncryptedFamilyRole`) i es desxifren per a l'arbre (`GET /family/tree`).
- Migració entre famílies: `POST /family/migrate` i `POST /family/leave`.

### Galeria / fotos
- Pujada: `POST /gallery/upload/{eventId}` (multipart, rols Fotograf/Admin/Org.) → `GoogleDriveService` desa el fitxer a `wwwroot/uploads/photos` i retorna la URL `/uploads/photos/...`.
- Publicació: `POST /photos` crea el registre (eventId, url, description, year). Consulta per any (`GET /photos?year=`), agrupada (`GET /photos/grouped`) o per esdeveniment (`GET /gallery/{eventId}`).
- Eliminació: `DELETE /photos/{id}` (Fotograf/Admin).

### Notificacions i push
- In-app: taula `Notification` (Type "General"); consulta limitada a 50 recents als endpoints de NotificationsController.
- Push: WebPush; subscripcions a `PushSubscriptions` (índex únic per endpoint). Les claus VAPID vénen de configuració (pública a appsettings, privada a l'entorn/User Secrets).
- Recordatoris: `DailyReminderWorker` a les 01:00 (Trobades a 30/15 dies, Assajos a 7 dies) amb notificació in-app + correu.
- Correus: `EmailService` (SMTP Gmail).

### Rols d'esdeveniment i escenari
- `Dance` → `DanceRole` → materials requerits (`DanceRoleMaterial`). Una inscripció pot tenir un `AssignedRole`; `EventAssignmentsController` manté les assignacions `EventUserDanceRole`.
- El dissenyador d'escenari desa posicions X/Y per ball a `EventStagePosition`.

### Enquestes
- Creació amb opcions serialitzades a JSON (`OptionsJson`); vots a `VotesJson` (Dictionary usuari → opció). 1 vot per usuari (re-votació permessa, canvia el vot).

## 12. Configuració i secrets

Model de secrets (FASE 1 — Security Baseline):

| Què | On viu |
|---|---|
| Configuració pública (JWT Issuer/Audience, SMTP host/port/sender, VAPID public key, CORS, AllowedHosts, connection string SQLite sense credencials) | `appsettings.json` (versionat) |
| Secrets de desenvolupament (Jwt:Key, CollaCode, SMTP password, VAPID private key, AdminEmail) | **.NET User Secrets** (fora del repo, a `%APPDATA%\Microsoft\UserSecrets`) |
| Secrets de producció (JWT_KEY, SMTP_PASSWORD, VAPID_PRIVATE_KEY, COLLA_CODE...) | **Variables d'entorn / `.env` (gitignored)** |

### appsettings.json (versionat, sense secrets)
- `ConnectionStrings:DefaultConnection` = `Data Source=colla.db`
- `Jwt`: Issuer `CollaGeganteraApi`, Audience `CollaGeganteraClient` (la clau **no hi és**)
- `EmailSettings`: `smtp.gmail.com`, port 587, SenderName "Colla Gegantera", SenderEmail (públic — no és una credencial)
- `Vapid`: PublicKey + Subject (públics — el frontend els necessita)
- `Logging`, `AllowedHosts`

### Secrets locals (User Secrets)
```powershell
cd Backend
dotnet user-secrets set "Jwt:Key" "<mínim 32 caràcters>"
dotnet user-secrets set "CollaCode" "<codi de colla>"
dotnet user-secrets set "EmailSettings:SenderPassword" "<app password Gmail>"
dotnet user-secrets set "Vapid:PrivateKey" "<clau privada VAPID>"
dotnet user-secrets set "AdminEmail" "<email admin opcional>"
```
`appsettings.Local.json` ja no s'utilitza (es va eliminar a la FASE 1).

### Plantilla d'entorn (.env.example)
`JWT_KEY`, `COLLA_CODE`, `ADMIN_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_SENDER_NAME`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `ConnectionStrings__DefaultConnection`, `VITE_API_URL`. Noms genèrics acceptats pel backend mitjançant `SecretEnvironment`.

## 13. Desplegament

### Variables d'entorn
| Variable | Ús |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` en desplegament |
| `ASPNETCORE_URLS` | `http://+:5000` (Docker) |
| `ConnectionStrings__DefaultConnection` (o `DATABASE_CONNECTION`) | Ruta de la BD SQLite (Docker: `/app/data/collagegantera.db`) |
| `JWT_KEY` | Clau JWT (mínim 32 caràcters, **obligatòria, sense fallback**) |
| `COLLA_CODE` | Codi per al registre (obligatori) |
| `SMTP_PASSWORD` (i SMTP_HOST/PORT/USERNAME) | Credencial SMTP (obligatori) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Parell VAPID (obligatori) |
| `Jwt__Issuer` / `Jwt__Audience` | Docker: `CollaGeganteraAPI` / `CollaGeganteraApp` |

### Docker (docker-compose.yml)
- Servei únic `api`: build multi-stage .NET 9, port `5000:5000`, volume `./data:/app/data`, healthcheck sobre `/swagger/index.html`, `restart: unless-stopped`.
- **Cap secret hardcoded**: tots els valors crítics es llegeixen del `.env`/host amb `${VAR:?}` (si falten, el compose falla en lloc d'usar un valor per defecte).

### Oracle Cloud Free Tier (deploy-oracle.sh)
1) Actualitzar sistema → 2) Instal·lar Docker → 3) Instal·lar Docker Compose → 4) Crear directori `/home/$USER/colla-gegantera` → 5) Clonar/copiar projecte → 6) Generar `.env`: `JWT_KEY` aleatòria (openssl rand) + plantilles buides per COLLA_CODE, SMTP i VAPID (amb instruccions: `npx web-push generate-vapid-keys`) → 7) `docker compose up -d --build` → 8) Firewall ufw (5000/80/443). Següents passos recomanats: Cloudflare DNS, Cloudflare Pages pel frontend (origen CORS `https://colla-gegantera.pages.dev`).

## 14. Seguretat i consideracions

- **FASE 1 — Security Baseline**: la clau privada VAPID original va quedar committada al primer commit; es va **rotar** (parell nou) i es va **netejar l'històric** (squash + force push). Idem per al fallback JWT de docker-compose (eliminat; ara `JWT_KEY` és obligatòria).
- `Jwt:Key` es llegeix d'entorn/User Secrets; **no existeix cap valor per defecte**.
- `StartupValidation` fa fail-fast a l'arrencada si falta un secret crític.
- Variables `VITE_` del frontend: només `VITE_API_URL` (pública). Mai hi pot anar un secret (va dins del bundle).
- `DailyReminderWorker` crida `SendToAllAsync`, que no desa el `Body` a la BD (els recordatoris in-app es mostren sense cos).
- Pàgina `EventAssignments` del frontend està **WIP**: crida endpoints inexistents als controllers (cal decidir si es completa o s'elimina).
- CORS de producció fixat a `https://colla-gegantera.pages.dev`.
- Secrets de GitHub: repo públic → Secret scanning automàtic; activa alertes a *Settings → Code security*. Branch protection: *Settings → Rules* (requerir PR a `master`).

## 15. Backup i restauració (FASE 0)

### Backup actual
- Fitxer: `backups/colla_v0.1_20260827_192106.db` (còpia consistent: servidor aturat, WAL checkpointat).
- `backups/`, `*.db`, `*.db-wal`, `*.db-shm` estan al `.gitignore`.

### Com restaurar
1. Backend: `git checkout <commit>` del Security Baseline (o què calgui).
2. Copiar la DB: reemplaçar `Backend/colla.db` (o el que indiqui `ConnectionStrings:DefaultConnection`) pel contingut de `backups/colla_v0.1_20260827_192106.db`.
3. Restaurar secrets: `dotnet user-secrets set ...` (desenvolupament) o variables d'entorn (producció).
4. Veure les migracions EF (22) amb `dotnet ef` / `Database.Migrate` per obtenir l'esquema idèntic.

## 16. Notes de migracions i dades

- 22 migracions EF Core SQLite.
- Rols per defecte sembrats per `DbSeeder.SeedRolesAsync`: Admin, OrganitzadorTrobades, OrganitzadorAssajos, Fotograf, GeganterBase.
- `CollaSettings` és una fila única (Id = 1) creada sota demanda.