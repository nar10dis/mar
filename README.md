# mar demo

React (Vite) + NestJS + Socket.io + Prisma 7 + PostgreSQL.
Un seul service en prod : Nest sert l'API (`/api/*`), le websocket (`/socket.io`) et le build React.

```
web/   front React + Vite (TypeScript)
api/   back NestJS 12 (ESM) + Prisma
  prisma/schema.prisma   modèles
  prisma/migrations/     migrations SQL (à commiter)
  prisma/seed.ts         données de démo (ne s'exécute que si la base est vide)
Dockerfile               build front + back en une image
railway.json             config de déploiement Railway
docker-compose.yml       Postgres local (port 5433)
```

## Dev local

Prérequis : Node 22+, Docker.

```bash
npm run setup                     # installe tout (racine, api, web)
cp api/.env.example api/.env      # si api/.env n'existe pas
npm run db:up                     # Postgres sur localhost:5433
npm run db:migrate                # applique les migrations + génère le client Prisma
npm run db:seed                   # données de démo
npm run dev                       # api (3000) + web (5173)
```

Ouvre http://localhost:5173. Vite redirige `/api` et `/socket.io` vers Nest, donc le front appelle
toujours sa propre origine, comme en prod.

### Modifier le schéma

1. Édite `api/prisma/schema.prisma`
2. `npm run db:migrate` (te demande un nom de migration, génère le client)
3. Commite le dossier `api/prisma/migrations/`

> Prisma 7 ne régénère plus le client automatiquement après `migrate dev`, d'où le
> `prisma generate` inclus dans le script.

## Déployer la démo sur Railway

1. Pousse le repo sur GitHub.
2. Sur [railway.com](https://railway.com) : **New Project → Deploy from GitHub repo** → choisis le repo.
   Railway détecte `railway.json` et build le `Dockerfile`.
3. Dans le projet : **+ New → Database → PostgreSQL**.
4. Dans le service de l'app → **Variables** → ajoute
   `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (référence à la base).
5. **Settings → Networking → Generate Domain** → tu obtiens l'URL publique à partager.

À chaque `git push` sur la branche principale, Railway rebuild et redéploie. Au démarrage, le
conteneur applique les migrations (`prisma migrate deploy`), seed la base si elle est vide,
puis lance Nest. Healthcheck : `/api/health`.

## Tester l'image Docker en local

```bash
docker build -t mar-demo .
docker run --rm --network host -e PORT=3999 \
  -e DATABASE_URL="postgresql://demo:demo@localhost:5433/mar_demo?schema=public" mar-demo
# → http://localhost:3999
```

## Notes

- **npm** : l'install avec npm 10 peut planter (`Cannot read properties of null (reading 'edgesOut')`)
  à cause d'un bug de résolution des peers de vitest. Si ça arrive : `npx npm@11 install` dans `api/`.
- **Prisma 7.10.1** (stable) est épinglé. Prisma 8 n'existe pour l'instant qu'en RC.
- Le dossier `api/.claude`, `api/.agents`, `api/.windsurf` contient des « skills » Prisma pour
  agents IA ajoutés par `prisma init`. Tu peux les supprimer si tu n'en veux pas.
