# Sonora — Architecture technique complète

Bibliothèque de podcasts auto-générés : transforme des articles techniques en audio via TTS.
4 dépôts/dossiers indépendants, orchestrés en local par un seul `docker-compose.yml`.

```
sonora/
├── docker-compose.yml
├── .env.example
├── sonora-frontend/         # React + Vite
├── sonora-backend/          # Main backend — gateway + auth Google
├── sonora-playlist-service/ # REST + PostgreSQL
└── sonora-audio-service/    # gRPC + MongoDB + TTS
```

Stack retenue pour les 3 services Node : **TypeScript**, pour que le contrat gRPC (types générés) soit partagé sans dupliquer de code entre backend et audio-service.

---

## 1. `sonora-frontend/` (React + Vite)

```
sonora-frontend/
├── package.json
├── vite.config.ts
├── .env                        # VITE_API_URL=http://localhost:4000
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/
    │   ├── client.ts            # instance axios/fetch, base URL = main backend
    │   ├── auth.ts               # login Google, refresh token
    │   ├── articles.ts           # POST /articles (soumettre un article à convertir)
    │   └── playlists.ts          # CRUD playlists + reorder
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── LibraryPage.tsx       # liste des podcasts générés + statut (pending/ready/error)
    │   ├── PlaylistPage.tsx      # détail + drag-and-drop reorder
    │   └── PlayerPage.tsx        # lecteur audio (streaming depuis audio_url)
    ├── components/
    │   ├── AudioPlayer.tsx
    │   ├── PlaylistItem.tsx
    │   └── JobStatusBadge.tsx    # poll / websocket sur le statut de génération
    ├── hooks/
    │   └── useJobStatus.ts       # polling toutes les 3s tant que status = "processing"
    └── types/
        └── index.ts              # types partagés front (Article, Playlist, AudioJob)
```

**Rôle** : ne parle **qu'au Main backend**, jamais directement au Playlist ni à l'Audio service (le gateway masque la topologie interne).

---

## 2. `sonora-backend/` (Main backend — gateway + auth)

```
sonora-backend/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
├── proto/
│   └── audio.proto              # copie du contrat gRPC (source de vérité dans audio-service)
└── src/
    ├── server.ts                 # bootstrap Express
    ├── config/
    │   └── env.ts
    ├── auth/
    │   ├── google.strategy.ts    # Passport Google OAuth2 / vérif id_token
    │   ├── jwt.ts                 # émission/vérification des JWT internes
    │   └── auth.middleware.ts     # requireAuth() pour toutes les routes protégées
    ├── gateway/
    │   ├── playlist.proxy.ts      # relaie REST → Playlist service (fetch/axios)
    │   └── audio.client.ts        # client gRPC → Audio service (généré depuis audio.proto)
    ├── routes/
    │   ├── auth.routes.ts         # GET /auth/google, GET /auth/google/callback, POST /auth/logout
    │   ├── articles.routes.ts     # POST /articles  → déclenche génération (appel gRPC audio-service)
    │   └── playlists.routes.ts    # proxy vers playlist-service (CRUD + reorder)
    ├── middleware/
    │   └── errorHandler.ts
    └── types/
        └── index.ts
```

**Rôle du Main backend** :
- Seul point d'entrée public (REST) pour le frontend.
- Auth Google : gère la session, émet un JWT réutilisé sur tous les appels internes.
- Gateway : traduit REST → REST (playlist) et REST → gRPC (audio), le front n'a jamais besoin de connaître gRPC.

**Endpoints clés (REST, exposés au front)** :
| Méthode | Route | Description |
|---|---|---|
| GET | `/auth/google` | redirige vers Google OAuth |
| GET | `/auth/google/callback` | callback, crée/retrouve l'utilisateur, pose le JWT |
| POST | `/articles` | soumet une URL/texte d'article → appelle `AudioService.GenerateAudio` en gRPC → retourne un `job_id` |
| GET | `/articles/:jobId/status` | interroge le statut de génération (proxy gRPC `GetJobStatus`) |
| GET | `/playlists` | liste des playlists de l'utilisateur (proxy → playlist-service) |
| POST | `/playlists` | créer une playlist |
| POST | `/playlists/:id/items` | ajouter un audio à une playlist |
| PATCH | `/playlists/:id/reorder` | réordonner les items (payload: liste d'IDs ordonnée) |

---

## 3. `sonora-playlist-service/` (REST + PostgreSQL)

```
sonora-playlist-service/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
├── prisma/
│   ├── schema.prisma             # models: User, Article, Playlist, PlaylistItem
│   └── migrations/
└── src/
    ├── server.ts
    ├── db/
    │   └── prisma.ts
    ├── routes/
    │   ├── playlists.routes.ts   # CRUD
    │   └── items.routes.ts       # add/remove/reorder
    ├── controllers/
    │   ├── playlist.controller.ts
    │   └── item.controller.ts
    ├── services/
    │   └── reorder.service.ts    # logique de calcul du nouvel ordre (transaction ACID)
    └── types/
        └── index.ts
```

**Pourquoi PostgreSQL ici** : les playlists sont une relation many-to-many avec un **ordre à préserver** (`PlaylistItem.position`), des reorders fréquents, et un vrai besoin de transactions ACID pour ne jamais désynchroniser les positions. Un modèle relationnel classique convient mieux qu'un document.

**Schéma simplifié (`prisma.schema`)** :
```prisma
model Playlist {
  id        String   @id @default(uuid())
  userId    String
  name      String
  items     PlaylistItem[]
  createdAt DateTime @default(now())
}

model PlaylistItem {
  id          String   @id @default(uuid())
  playlistId  String
  audioJobId  String   // référence l'ID du job côté Audio service (Mongo), pas de FK cross-DB
  position    Int
  playlist    Playlist @relation(fields: [playlistId], references: [id])
}
```

Note : `audioJobId` est une simple référence externe (pas de foreign key inter-base) — le couplage entre Postgres et Mongo se fait uniquement via cet identifiant, jamais par jointure.

---

## 4. `sonora-audio-service/` (gRPC + MongoDB + TTS)

```
sonora-audio-service/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
├── proto/
│   └── audio.proto               # source de vérité du contrat gRPC
└── src/
    ├── server.ts                  # bootstrap serveur gRPC (@grpc/grpc-js)
    ├── db/
    │   └── mongoose.ts
    ├── models/
    │   └── AudioJob.model.ts      # schéma flexible selon status
    ├── grpc/
    │   ├── audio.service.ts       # implémentation des méthodes du .proto
    │   └── handlers/
    │       ├── generateAudio.ts   # crée le job, lance la génération async
    │       └── getJobStatus.ts
    ├── workers/
    │   └── ttsWorker.ts           # job queue (BullMQ/Redis ou simple worker) → appelle l'API TTS
    ├── providers/
    │   └── ttsProvider.ts         # abstraction sur le provider TTS (ElevenLabs, Google TTS...)
    └── storage/
        └── audioStorage.ts        # upload du fichier audio généré (S3/local) → audio_url
```

**Pourquoi MongoDB ici** : chaque `AudioJob` a une forme qui **varie selon le statut** :
- `pending` → juste `article_id`, `created_at`
- `error` → + `error_message`
- `success` → + `audio_url`, `duration_seconds`, `provider_used`

Un document flexible évite les colonnes nullable en cascade qu'imposerait une table SQL rigide, et il n'y a ici aucun besoin de jointure (l'Audio service ne connaît pas les playlists).

**Contrat gRPC (`proto/audio.proto`)** :
```protobuf
syntax = "proto3";
package sonora.audio;

service AudioService {
  rpc GenerateAudio (GenerateAudioRequest) returns (GenerateAudioResponse);
  rpc GetJobStatus (JobStatusRequest) returns (JobStatusResponse);
}

message GenerateAudioRequest {
  string article_id = 1;
  string article_text = 2;
  string user_id = 3;
}

message GenerateAudioResponse {
  string job_id = 1;
  string status = 2; // "pending"
}

message JobStatusRequest {
  string job_id = 1;
}

message JobStatusResponse {
  string job_id = 1;
  string status = 2;        // pending | processing | success | error
  string audio_url = 3;     // vide si pas encore prêt
  int32 duration_seconds = 4;
  string error_message = 5; // vide si succès
}
```

---

## 5. `docker-compose.yml` (racine du repo)

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: sonora
      POSTGRES_USER: sonora
      POSTGRES_PASSWORD: sonora
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongodata:/data/db"]

  playlist-service:
    build: ./sonora-playlist-service
    env_file: ./sonora-playlist-service/.env.example
    depends_on: [postgres]
    ports: ["4001:4001"]

  audio-service:
    build: ./sonora-audio-service
    env_file: ./sonora-audio-service/.env.example
    depends_on: [mongo]
    ports: ["50051:50051"]   # port gRPC

  backend:
    build: ./sonora-backend
    env_file: ./sonora-backend/.env.example
    depends_on: [playlist-service, audio-service]
    ports: ["4000:4000"]

  frontend:
    build: ./sonora-frontend
    depends_on: [backend]
    ports: ["5173:5173"]

volumes:
  pgdata:
  mongodata:
```

---

## 6. Checklist du brief

- [x] Frontend React + Vite, ne parle qu'au Main backend en REST
- [x] Main backend : auth Google + rôle de gateway (REST → REST et REST → gRPC)
- [x] Playlist service : REST, PostgreSQL, relation many-to-many ordonnée avec transactions
- [x] Audio service : gRPC, MongoDB, schéma flexible par statut de job
- [x] Séparation justifiée par l'asynchronicité réelle de la génération audio (pas un découpage artificiel)
- [x] Contrat gRPC formel fourni (`.proto`)
- [x] `docker-compose.yml` de démarrage prêt à lancer
- [x] Aucune FK inter-base : couplage uniquement par ID de référence (`audioJobId`)

Ce fichier peut être donné tel quel à un agent de code (Claude Code, Cursor...) comme spec de départ pour scaffolder les 4 projets.