# Colla Gegantera — App web

Aplicació web per a la gestió d'una colla gegantera: esdeveniments (trobades i assajos), inscripcions familiars, assignació de rols, dissenyador d'escenari, galeria de fotos, enquestes, anuncis, calendari, notificacions i administració. Interfície en català.

## Stack

- **Backend:** ASP.NET Core 9 (API REST) · SQLite (EF Core) · Identity + JWT · WebPush · SMTP Gmail
- **Frontend:** React 19 + Vite + TypeScript · Tailwind CSS v4 · shadcn/ui · sonner · axios
- **Shared:** models, DTOs i enums compartits entre backend i frontend

## Estructura

```
CollaGegantera/
├── Backend/             # API (Configuration/, Controllers/, Data/, Services/, wwwroot/uploads)
├── FrontendReact/       # SPA React
├── Shared/              # Models/, DTOs/, Enums/
├── backups/             # Còpies de seguretat de la DB (gitignored)
├── CollaGegantera.sln
├── docker-compose.yml
├── .env.example         # Plantilla de secrets per a producció
├── deploy-oracle.sh     # Desplegament a Oracle Cloud Free Tier
└── DOCUMENTATION.md     # Inventari tècnic complet
```

## Arrencada en desenvolupament

### Backend
```powershell
cd Backend
dotnet run
# API a http://localhost:5000 · Swagger a /swagger
```

Els secrets de desenvolupament es guarden amb **.NET User Secrets** (fora del repo). Configura'ls un cop:

```powershell
cd Backend
dotnet user-secrets set "Jwt:Key" "<clau JWT, mínim 32 caràcters>"
dotnet user-secrets set "CollaCode" "<codi de colla>"
dotnet user-secrets set "EmailSettings:SenderPassword" "<app password Gmail>"
dotnet user-secrets set "Vapid:PrivateKey" "<clau privada VAPID>"
dotnet user-secrets set "AdminEmail" "<email admin opcional>"
```

L'aplicació **no arrenca si falta algun d'aquests secrets** (fail-fast intencionat, sense valors per defecte). Alternativament, en entorns sense User Secrets pots usar variables d'entorn: `JWT_KEY`, `COLLA_CODE`, `SMTP_PASSWORD`, `VAPID_PRIVATE_KEY`, `DATABASE_CONNECTION`, etc. (vegeu `.env.example`).

### Frontend
```powershell
cd FrontendReact
npm install
npm run dev
# SPA a http://localhost:5173 (proxy de /api i /uploads cap a :5000)
```

Variable d'entorn opcional: `VITE_API_URL` (per defecte `/api` amb proxy de Vite). Recorda: qualsevol variable `VITE_` acaba al bundle del navegador i **no pot contenir cap secret**.

## Desplegament

- **Docker:** copiar `.env.example` a `.env` i omplir els secrets; després `docker compose up -d --build` (port 5000, BD a `./data/collagegantera.db`). Si falta un secret, compose falla (mai usa valors per defecte).
- **Oracle Cloud:** seguir `deploy-oracle.sh`. CORS de producció configurat per a `https://colla-gegantera.pages.dev` (Cloudflare Pages).

## Seguretat

- Cap secret al repositori: JWT, SMTP, VAPID i CollaCode vénen de l'entorn (producció) o User Secrets (desenvolupament).
- Validació de secrets en arrencar (`Backend/Configuration/StartupValidation.cs`).
- `.env`, `.env.*`, `*.pem`, `*.key` i `Backend/appsettings.Local.json` estan gitignored; només es versiona `.env.example`.

## Documentació

Vegeu `DOCUMENTATION.md` per a l'inventari complet (models, DTOs, controllers, serveis, rutes del frontend, rols, fluxos desplegament, backup i restauració) en l'estat `v0.1-single-colla`.