# Mort aux Rats

Refonte de mortauxrats.fr. Roadmap, DA et modèle de données : voir [ROADMAP.md](ROADMAP.md).

React (Vite) + NestJS + Prisma 7 + PostgreSQL, déployé sur Railway.
Un seul service en prod : Nest sert l'API (`/api/*`) et le build React.

```
web/                       front React + Vite (TypeScript)
  public/assets/           pixel art (placeholders pour l'instant, voir plus bas)
  src/styles/tokens.css    palette, polices, interligne
  src/components/          Cartouche, Window98, PixelButton, PixelIcon, ReactionBubble
  src/map/map.config.ts    images de la carte (paysage + portrait), positions des POI
  src/pages/               pages (Blog et Archives encore vides)
  src/widgets/             écran des widgets (horloge, connectés, raton, calendrier) ; catalogue dans widgets.ts
  src/content/about.ts     texte « Qui sommes-nous » (Actu)
api/                       back NestJS 12 (ESM) + Prisma
  prisma/schema.prisma     modèle de données complet (cf. roadmap)
  prisma/migrations/       migrations SQL (à commiter)
  prisma/seed.ts           thèmes + contenu de démo (idempotent, tourne à chaque déploiement)
Dockerfile                 build front + back en une image
railway.json               config de déploiement Railway
docker-compose.yml         Postgres local (port 5433)
```

## Pages

| URL | Contenu |
|---|---|
| `/` | Carte + 4 POI. Carte verticale si l'écran est plus haut que large |
| `/shop` | Magazines (`GET /api/magazines`), bouton « Commander » vers HelloAsso |
| `/actu` | « Qui sommes-nous » (`web/src/content/about.ts`) + annonces (`GET /api/announcements`) |
| `/blog` | Liste des derniers articles (le vrai fil avec réactions arrive en phase 5) |
| `/blog/nouveau` | Éditeur d'article (connecté) : rangées de 1 à 3 colonnes, blocs texte / image / son / PDF / YouTube |
| `/blog/articles/:id` | Lecture d'un article ; `/modifier` pour l'auteur |
| `/archives` | Page vide, remplie en phase 6 |
| `/connexion`, `/compte`, `/admin` | Comptes, réglages du compte, back-office (admins) |
| `/design` | Démo du design system : palette, composants, assets, thèmes lus en BDD |

## Dev local

Prérequis : Node 22+, Docker.

```bash
npm run setup                     # installe tout (racine, api, web)
cp api/.env.example api/.env      # si api/.env n'existe pas
npm run db:up                     # Postgres (localhost:5433) + S3Mock (localhost:9090)
npx --prefix api prisma migrate deploy && npm run db:seed
npm run dev                       # api (3000) + web (5173)
```

Ouvre http://localhost:5173. Vite redirige `/api` vers Nest, donc le front appelle toujours sa
propre origine, comme en prod.

Compte admin local : inscris-toi avec un email listé dans `ADMIN_EMAILS` (`api/.env`,
`admin@example.com` par défaut), il devient ADMIN automatiquement. Back-office : `/admin`.

Tests e2e (`npm run test:e2e --prefix api`) : nécessitent `npm run db:up` (Postgres + S3Mock).

## Comptes et sécurité

- Auth : `@nestjs/authentication` (officiel Nest 12). Session dans un cookie `__Host-sid`
  (httpOnly, Secure, SameSite=Lax), stockée dans la table `Session` (`PrismaSessionStore`).
  Mots de passe hashés en scrypt. Protection CSRF globale (`app.enableCsrfProtection()`).
- Droits : `@nestjs/authorization`. **Toute route est fermée par défaut** : une nouvelle route doit
  déclarer `@Public()` (visiteurs), `@Can.Anyone()` (connectés) ou `@Can(AdminPolicy, 'manage')`.
- Uploads : le navigateur envoie le fichier directement au bucket via une URL de PUT signée
  (type + taille signés), puis l'API vérifie le fichier avant de l'enregistrer. Les fichiers sont
  servis par `/api/media/<clé>` (redirection vers une URL signée, le bucket étant privé).

### Modifier le schéma

1. Édite `api/prisma/schema.prisma`
2. `npm run db:migrate` dans un vrai terminal (interactif : demande un nom de migration, génère le client)
3. Commite le dossier `api/prisma/migrations/`

## Assets (pixel art)

Tous les fichiers de `web/public/assets/` sont des **placeholders** générés aux bonnes dimensions
(tableau « Templates d'assets » de la roadmap). Pour les remplacer : garder **le même nom et la
même taille**, aucun changement de code nécessaire.

- Affichage ×2, toujours en `image-rendering: pixelated`.
- Sprite sheet horizontale : `reactions.png` (9 bulles 16×16, ordre de l'enum `ReactionKind`).
- `poi-*.png` : une seule image 32×32. La sélection (4 coins bleus) est en CSS.
- `frame.png` et `window.png` : 9-slice, coins de 8 px.
- Carte : `map.png` (1920×1080, écran paysage) et `map-portrait.png` (1080×1920, écran plus haut
  que large). Après remplacement, ajuster les positions en % dans `web/src/map/map.config.ts`
  (POI, une position par orientation).
- Nouvelle icône UI : `icon-<nom>.png` en 16×16, puis `<PixelIcon src={asset('icon-<nom>.png')} size={16} />`.

## Contenu de démo

Le seed crée 4 magazines et 3 annonces **placeholders**, uniquement si les tables sont vides
(couvertures dans `web/public/assets/covers/`, liens HelloAsso génériques).
Quand le vrai contenu arrive, mettre `SEED_DEMO=false` dans les variables Railway, sinon un admin
qui vide une table verrait la démo revenir au déploiement suivant.

## Déploiement (Railway)

Chaque `git push` sur `main` redéploie. Au démarrage, le conteneur applique les migrations
(`prisma migrate deploy`), lance le seed (thèmes), puis démarre Nest. Healthcheck : `/api/health`.

### Variables du service de l'app

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `PORT` | `3000` (doit correspondre au port du domaine dans Settings → Networking) |
| `ADMIN_EMAILS` | emails des admins, séparés par des virgules |
| `S3_ENDPOINT` | `${{Bucket.ENDPOINT}}` |
| `S3_REGION` | `${{Bucket.REGION}}` |
| `S3_BUCKET` | `${{Bucket.BUCKET}}` |
| `S3_ACCESS_KEY_ID` | `${{Bucket.ACCESS_KEY_ID}}` |
| `S3_SECRET_ACCESS_KEY` | `${{Bucket.SECRET_ACCESS_KEY}}` |
| `S3_CORS_ORIGINS` | l'URL publique du site, ex. `https://mar-production.up.railway.app` |
| `SEED_DEMO` | `false` quand le vrai contenu est en place |

(`Bucket` = le nom du service bucket dans le projet Railway ; adapter si différent.)

### Bucket (médias)

1. Dans le projet Railway : **+ New → Bucket**.
2. Ajouter les variables `S3_*` ci-dessus au service de l'app (références vers le bucket).
3. Mettre l'URL du site dans `S3_CORS_ORIGINS` : au démarrage, l'app configure elle-même le CORS
   du bucket (log « CORS du bucket : … »). Ajouter le futur domaine (mortauxrats.fr) le moment venu.

Sans bucket configuré, le site tourne normalement, seuls les uploads sont refusés (503).

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
