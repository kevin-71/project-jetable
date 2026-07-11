# 🎙️ Sonora — Présentation de soutenance

> **Bibliothèque de podcasts auto-générés** — transforme des articles texte en audio via TTS.
> Durée de présentation : **12 minutes**

---

## 1. Démonstration de l'application

**Sonora** est une plateforme full-stack qui permet à un utilisateur de :

1. Se connecter via **Google OAuth2**
2. Soumettre un texte / article → le backend le convertit automatiquement en **fichier audio MP3**
3. Écouter ses podcasts générés depuis une interface React
4. Organiser ses podcasts dans des **playlists réordonnables**

### Parcours utilisateur type

```
1. LoginPage  → clic "Se connecter avec Google"
2. Callback   → JWT émis par le backend, redirigé vers le frontend
3. LibraryPage → liste des jobs audio (statuts : pending / processing / success / error)
4. Soumission d'un article → génération asynchrone
5. PlaylistPage → drag-and-drop pour réordonner
6. PlayerPage  → écoute du podcast
```

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| **Frontend** | React 19 + Vite + TypeScript |
| **Main Backend** | Node.js + Express + TypeScript (port 4000) |
| **Playlist Service** | Node.js + Express + Prisma + TypeScript (port 4001) |
| **Audio Service** | Node.js + gRPC (`@grpc/grpc-js`) + TypeScript (port 50051) |
| **BDD relationnelle** | PostgreSQL 16 (playlists, users, articles) |
| **BDD document** | MongoDB 7 (jobs audio à structure variable) |
| **TTS externe** | `edge-tts` (Microsoft Edge TTS, CLI Python) — API externe intégrée |
| **Auth** | Passport.js + Google OAuth2 + JWT (`jsonwebtoken`) |
| **Orchestration** | Docker Compose (6 containers) |

---

## 3. Architecture des services

```
┌──────────────┐   REST (HTTP/JSON)   ┌─────────────────────────────────────┐
│   Frontend   │ ──────────────────── │        sonora-backend (4000)        │
│  React+Vite  │                      │  Auth Google · Gateway · JWT        │
└──────────────┘                      └────────────┬──────────────┬─────────┘
                                                   │              │
                               REST (HTTP/JSON)    │              │  gRPC (proto3)
                                                   ▼              ▼
                                    ┌──────────────────┐  ┌────────────────────┐
                                    │ playlist-service │  │  audio-service     │
                                    │ Express + Prisma │  │  gRPC + Mongoose   │
                                    │ port 4001        │  │  port 50051        │
                                    └────────┬─────────┘  └────────┬───────────┘
                                             │                      │
                                             ▼                      ▼
                                       PostgreSQL 16           MongoDB 7
                                    (playlists, users)     (AudioJobs flexibles)
```

> Le **frontend ne parle jamais directement** aux microservices.
> Le Main Backend est le **seul point d'entrée public** — il joue le rôle de gateway.

---

## 4. Les deux paradigmes API

### 🟦 Paradigme 1 : REST (HTTP/JSON)

**Utilisé entre :** Frontend ↔ Main Backend, et Main Backend ↔ Playlist Service

**Principe :**
- Architecture **client-serveur** sans état (stateless)
- Chaque ressource est identifiée par une **URL**
- On utilise les **verbes HTTP** sémantiquement : `GET`, `POST`, `PATCH`, `DELETE`
- Les réponses sont en **JSON**
- La communication est **authentifiée par JWT** dans le header `Authorization: Bearer <token>`

**Pourquoi REST ici ?**
Les playlists et la gestion des articles sont des **ressources CRUD classiques** : créer, lire, modifier, supprimer. REST est le paradigme le plus naturel et le plus lisible pour ces opérations.

**Endpoints REST exposés :**

| Verbe | Route | Description |
|---|---|---|
| `GET` | `/auth/google` | Initiation OAuth Google |
| `POST` | `/articles` | Soumettre un texte → génération audio |
| `GET` | `/articles` | Lister ses jobs audio |
| `GET` | `/articles/:jobId/status` | Statut d'un job |
| `DELETE` | `/articles/:jobId` | Supprimer un job |
| `GET` | `/playlists` | Lister ses playlists |
| `POST` | `/playlists` | Créer une playlist |
| `POST` | `/playlists/:id/items` | Ajouter un audio à une playlist |
| `PATCH` | `/playlists/:id/reorder` | Réordonner les items |
| `DELETE` | `/playlists/:id` | Supprimer une playlist |

---

### 🟣 Paradigme 2 : gRPC (Protocol Buffers / proto3)

**Utilisé entre :** Main Backend ↔ Audio Service

**Principe :**
- Communication **binaire** via Protocol Buffers (pas du JSON lisible)
- **Contrat formel** défini dans un fichier `.proto` : les deux services s'accordent sur les types avant même d'écrire du code
- Les méthodes sont appelées comme des **fonctions distantes** (Remote Procedure Call)
- Beaucoup plus **performant** que REST pour les communications inter-services : pas de parsing JSON, frames HTTP/2 multiplexées
- Les **types sont générés automatiquement** à partir du `.proto` → moins d'erreurs, TypeScript peut vérifier le contrat à la compilation

**Pourquoi gRPC ici ?**
La génération audio est une **opération asynchrone lourde**. gRPC est parfait pour ce cas :
- `GenerateAudio` : démarre la génération, retourne immédiatement un `job_id`
- `GetJobStatus` : interroge l'état en cours
- Communication **efficace et typée** entre deux services Node.js internes

**Contrat gRPC (`proto/audio.proto`) :**

```protobuf
syntax = "proto3";
package sonora.audio;

service AudioService {
  rpc GenerateAudio (GenerateAudioRequest) returns (GenerateAudioResponse);
  rpc GetJobStatus  (JobStatusRequest)     returns (JobStatusResponse);
  rpc ListJobs      (ListJobsRequest)      returns (ListJobsResponse);
  rpc DeleteJob     (DeleteJobRequest)     returns (DeleteJobResponse);
}

message GenerateAudioRequest {
  string article_id   = 1;
  string article_text = 2;
  string user_id      = 3;
}

message GenerateAudioResponse {
  string job_id  = 1;
  string status  = 2;  // "pending"
}

message JobStatusResponse {
  string job_id            = 1;
  string status            = 2;  // pending | processing | success | error
  string audio_url         = 3;
  int32  duration_seconds  = 4;
  string error_message     = 5;
}
```

**Comparaison REST vs gRPC :**

| | REST | gRPC |
|---|---|---|
| **Format** | JSON (texte lisible) | Protocol Buffers (binaire) |
| **Contrat** | OpenAPI / convention | `.proto` (obligatoire) |
| **Perf réseau** | Moyen | Excellent (HTTP/2 + binaire) |
| **Typage** | Optionnel | Strict, généré |
| **Usage idéal** | API publiques, CRUD | Comm. inter-services |
| **Usage dans Sonora** | Front ↔ Backend, Backend ↔ Playlist | Backend ↔ Audio |

---

## 5. Authentification

### Flux Google OAuth2 → JWT

```
1. User clique "Se connecter avec Google"
   GET http://localhost:4000/auth/google
   → redirect vers accounts.google.com

2. Google redirige vers le callback
   GET http://localhost:4000/auth/google/callback?code=...
   → Passport.js vérifie le code
   → Le backend crée/retrouve l'utilisateur dans le playlist-service (upsert)
   → Émet un JWT signé (7 jours, HS256)

3. Redirect vers le frontend avec le token
   http://localhost:5173/?token=eyJhbGci...&user=...

4. Pour tous les appels suivants, le frontend envoie :
   Authorization: Bearer <JWT>

5. requireAuth() middleware vérifie la signature JWT
   → 401 si absent ou invalide
   → Injecte request.user = { sub, email, displayName }
```

**Ce qui est protégé :** toutes les routes `/articles` et `/playlists` → 401 si non connecté.

---

## 6. API externe intégrée (bonus)

- **Microsoft Edge TTS** (`edge-tts`) — CLI Python qui appelle l'API TTS de Microsoft
- Voix utilisée : `fr-FR-DeniseNeural` (configurable via `TTS_VOICE`)
- Abstraction dans `ttsProvider.ts` → possibilité de switcher vers ElevenLabs, Google TTS, etc.

---

## 7. Bases de données : justification du choix dual

### PostgreSQL (Playlist Service)
- Playlists = relations many-to-many avec **ordre à préserver** (`position INT`)
- Les réordonnements nécessitent des **transactions ACID**
- Le modèle relationnel est parfait pour des données structurées et stables

### MongoDB (Audio Service)
- Un `AudioJob` change de forme selon son statut :
  - `pending` → juste `articleId`, `createdAt`
  - `processing` → + timestamp de démarrage
  - `success` → + `audioUrl`, `durationSeconds`, `providerUsed`
  - `error` → + `errorMessage`
- Un **document flexible** évite les colonnes nullable en cascade d'une table SQL
- Aucun besoin de jointure : l'Audio Service ne connaît pas les playlists

> Pas de Foreign Key inter-base : la liaison se fait **uniquement par `audioJobId`** (référence externe).

---

## 8. Lancement du projet

```bash
# A la racine du repo
docker compose up --build

# Services disponibles :
#   http://localhost:5173  → Frontend React
#   http://localhost:4000  → Main Backend (REST)
#   http://localhost:4001  → Playlist Service (REST, interne)
#   localhost:50051        → Audio Service (gRPC, interne)
#   localhost:5432         → PostgreSQL
#   localhost:27017        → MongoDB
```

---

## 9. Tests API avec curl

> **Pre-requis** : les services tournent (`docker compose up --build`).

### 9.1 — Health checks

```bash
# Main backend
curl http://localhost:4000/health
# → {"ok":true,"service":"sonora-backend"}

# Playlist service
curl http://localhost:4001/health
# → {"ok":true,"service":"sonora-playlist-service"}
```

---

### 9.2 — Obtenir un JWT de développement

```bash
curl -s -X POST http://localhost:4000/auth/dev-token \
  -H "Content-Type: application/json" \
  -d '{"userId": "demo-user-001", "email": "demo@sonora.io", "name": "Demo User"}'
```

**Réponse attendue :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "demo-user-001",
    "email": "demo@sonora.io",
    "displayName": "Demo User"
  }
}
```

> Stocker le token dans une variable (bash/zsh) :
> ```bash
> TOKEN=$(curl -s -X POST http://localhost:4000/auth/dev-token \
>   -H "Content-Type: application/json" \
>   -d '{"userId":"demo-user-001","email":"demo@sonora.io","name":"Demo"}' \
>   | python -c "import sys,json; print(json.load(sys.stdin)['token'])")
> echo "Token: $TOKEN"
> ```

---

### 9.3 — Démonstration "Access Denied" (sans token)

```bash
# Sans JWT → 401 Unauthorized
curl -s http://localhost:4000/articles
# → {"error":"missing_token"}

# Avec un JWT invalide → 401 Unauthorized
curl -s http://localhost:4000/articles \
  -H "Authorization: Bearer token.invalide.ici"
# → {"error":"invalid_token"}
```

---

### 9.4 — Soumettre un article pour génération audio

```bash
curl -s -X POST http://localhost:4000/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"articleText\": \"Les microservices permettent de decoupler les responsabilites applicatives. Chaque service est autonome, deployable independamment, et communique via des APIs bien definies.\"}"
```

**Réponse attendue (202 Accepted) :**
```json
{
  "job_id": "6872a1f3c4e2a00012b3d4e5",
  "status": "pending"
}
```

> Stocker le job_id :
> ```bash
> JOB_ID="6872a1f3c4e2a00012b3d4e5"
> ```

---

### 9.5 — Consulter le statut d'un job

```bash
curl -s http://localhost:4000/articles/$JOB_ID/status \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse si en cours :**
```json
{
  "job_id": "6872a1f3c4e2a00012b3d4e5",
  "status": "processing",
  "audio_url": "",
  "duration_seconds": 0,
  "error_message": ""
}
```

**Réponse si terminé (success) :**
```json
{
  "job_id": "6872a1f3c4e2a00012b3d4e5",
  "status": "success",
  "audio_url": "http://localhost:4000/audio/6872a1f3c4e2a00012b3d4e5.mp3",
  "duration_seconds": 4,
  "error_message": ""
}
```

---

### 9.6 — Lister tous ses jobs audio

```bash
curl -s http://localhost:4000/articles \
  -H "Authorization: Bearer $TOKEN"
```

---

### 9.7 — Créer une playlist

```bash
curl -s -X POST http://localhost:4000/playlists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Ma playlist tech"}'
```

**Réponse (201 Created) :**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userId": "demo-user-001",
  "name": "Ma playlist tech",
  "createdAt": "2026-07-11T23:00:00.000Z",
  "items": []
}
```

> ```bash
> PLAYLIST_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
> ```

---

### 9.8 — Ajouter un audio dans la playlist

```bash
curl -s -X POST http://localhost:4000/playlists/$PLAYLIST_ID/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"audioJobId\": \"$JOB_ID\", \"title\": \"Les microservices expliques\", \"position\": 1}"
```

---

### 9.9 — Réordonner les items d'une playlist

```bash
curl -s -X PATCH http://localhost:4000/playlists/$PLAYLIST_ID/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"itemIds\": [\"$JOB_ID\"]}"
```

---

### 9.10 — Lister ses playlists

```bash
curl -s http://localhost:4000/playlists \
  -H "Authorization: Bearer $TOKEN"
```

---

### 9.11 — Supprimer un job audio

```bash
curl -s -X DELETE http://localhost:4000/articles/$JOB_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

### 9.12 — Supprimer une playlist

```bash
curl -s -X DELETE http://localhost:4000/playlists/$PLAYLIST_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. Récapitulatif des critères du brief

| Critère | OK | Détail |
|---|---|---|
| Frontend interactif | ✅ | React + Vite, lecteur audio, drag-and-drop |
| Main backend | ✅ | Express, port 4000, gateway REST+gRPC |
| 2 microservices | ✅ | `playlist-service` (REST) + `audio-service` (gRPC) |
| 2 bases de données | ✅ | PostgreSQL (playlists) + MongoDB (audio jobs) |
| Auth Google | ✅ | Passport.js + Google OAuth2 |
| JWT pour les routes protégées | ✅ | `requireAuth()` sur toutes les routes `/articles` et `/playlists` |
| Redirect si non-authentifié | ✅ | 401 JSON + redirect frontend vers `/login` |
| API as a Service (JWT externe) | ✅ | `POST /auth/dev-token` + toutes les routes acceptent un JWT |
| Demo accès refusé sans JWT | ✅ | `{"error":"missing_token"}` ou `{"error":"invalid_token"}` |
| 2 paradigmes API | ✅ | **REST** (front/backend/playlist) + **gRPC** (backend/audio) |
| API externe (bonus) | ✅ | Microsoft Edge TTS (`fr-FR-DeniseNeural`) |
| Docker Compose | ✅ | 6 services orchestrés |

---

## 11. Points de code à montrer en présentation

### Middleware JWT (`auth.middleware.ts`)
```typescript
export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const header = request.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'missing_token' });  // acces refuse
  }
  try {
    const token = header.slice('Bearer '.length);
    request.user = verifyInternalToken(token);  // verifie signature HMAC-SHA256
    return next();
  } catch {
    return response.status(401).json({ error: 'invalid_token' });
  }
}
```

### Gateway gRPC (`audio.client.ts`) — REST → gRPC
```typescript
export function generateAudio(request: GenerateAudioRequest) {
  return new Promise<GenerateAudioResponse>((resolve, reject) => {
    client.GenerateAudio(request, (error, response) => {  // appel gRPC
      if (error) { reject(error); return; }
      resolve(response);
    });
  });
}
```

### Worker asynchrone (`ttsWorker.ts`) — coeur du service audio
```typescript
export async function processAudioJob(jobId: string) {
  const job = await AudioJobModel.findById(jobId);
  job.status = 'processing'; await job.save();
  const audio = await synthesizeSpeech(job.articleText);  // appel edge-tts (API externe)
  const filePath = await storeAudio(jobId, audio);
  job.status = 'success';
  job.audioUrl = `file://${filePath}`;
  await job.save();
}
```
