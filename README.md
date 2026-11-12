# Mort aux Rats

Refonte de mortauxrats.fr. Roadmap, DA et modèle de données : voir [ROADMAP.md](ROADMAP.md).

React (Vite) + NestJS + Prisma 7 + PostgreSQL, déployé sur Railway.
Un seul service en prod : Nest sert l'API (`/api/*`) et le build React.

```
web/                       front React + Vite (TypeScript)
  public/assets/           pixel art (placeholders pour l'instant, voir plus bas)
  src/styles/tokens.css    palette, polices, interligne
  src/components/          Cartouche, Window98, PixelButton, PixelIcon, ReactionBubble
  src/map/map.config.ts    image de la carte + positions des POI
  src/pages/               pages (Shop, Actu, Blog, Archives = vides pour l'instant)
api/                       back NestJS 12 (ESM) + Prisma
  prisma/schema.prisma     modèle de données complet (cf. roadmap)
  prisma/migrations/       migrations SQL (à commiter)
  prisma/seed.ts           seed des 7 thèmes (idempotent, tourne à chaque déploiement)
Dockerfile                 build front + back en une image
railway.json               config de déploiement Railway
docker-compose.yml         Postgres local (port 5433)
```

## Pages

| URL | Contenu |
|---|---|
| `/` | Carte + 4 POI |
| `/shop`, `/actu`, `/blog`, `/archives` | Pages vides, remplies aux phases 2 à 6 |
| `/design` | Démo du design system : palette, composants, assets, thèmes lus en BDD |

## Dev local

Prérequis : Node 22+, Docker.

```bash
npm run setup                     # installe tout (racine, api, web)
cp api/.env.example api/.env      # si api/.env n'existe pas
npm run db:up                     # Postgres sur localhost:5433
npx --prefix api prisma migrate deploy && npm run db:seed
npm run dev                       # api (3000) + web (5173)
```

Ouvre http://localhost:5173. Vite redirige `/api` vers Nest, donc le front appelle toujours sa
propre origine, comme en prod.

### Modifier le schéma

1. Édite `api/prisma/schema.prisma`
2. `npm run db:migrate` dans un vrai terminal (interactif : demande un nom de migration, génère le client)
3. Commite le dossier `api/prisma/migrations/`

## Assets (pixel art)

Tous les fichiers de `web/public/assets/` sont des **placeholders** générés aux bonnes dimensions
(tableau « Templates d'assets » de la roadmap). Pour les remplacer : garder **le même nom et la
même taille**, aucun changement de code nécessaire.

- Affichage ×2, toujours en `image-rendering: pixelated`.
- Sprite sheets horizontales : `poi-*.png` (2 frames 32×32 : normal, hover), `reactions.png`
  (9 bulles 16×16, ordre de l'enum `ReactionKind`).
- `frame.png` et `window.png` : 9-slice, coins de 8 px.
- Carte : remplacer `map.png` (1920×1080), puis ajuster les positions en % dans `web/src/map/map.config.ts`.
- Nouvelle icône UI : `icon-<nom>.png` en 16×16, puis `<PixelIcon src={asset('icon-<nom>.png')} size={16} />`.

## Déploiement (Railway)

Chaque `git push` sur `main` redéploie. Au démarrage, le conteneur applique les migrations
(`prisma migrate deploy`), lance le seed (thèmes), puis démarre Nest. Healthcheck : `/api/health`.

Variables du service de l'app : `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` et `PORT` = `3000`
(doit correspondre au port du domaine dans Settings → Networking).

Tester l'image en local :

```bash
docker build -t mar-demo .
docker run --rm --network host -e PORT=3999 \
  -e DATABASE_URL="postgresql://demo:demo@localhost:5433/mar_demo?schema=public" mar-demo
# → http://localhost:3999
```

## Notes

- **npm 10** peut planter dans `api/` (`Cannot read properties of null (reading 'edgesOut')`) :
  utiliser `npx npm@11 install`.
- **Prisma 7.10.1** (stable) est épinglé ; Prisma 8 n'existe qu'en RC.
- **Polices** : Pixelify Sans (OFL) auto-hébergée via `@fontsource`, aucun appel à Google.
  `--font-text` passera sur m5x7 / m6x11 une fois la licence validée.
