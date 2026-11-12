# Mort aux Rats — Roadmap du site

> Refonte complète de mortauxrats.fr (l'ancien site ne sert pas de base).
> Version **ordi uniquement** pour l'instant, mobile en bonus.

---

## Stack

| Couche | Techno | Rôle |
|---|---|---|
| Front | React 19 + Vite 8 + TypeScript | Interface, dans `web/` |
| Back | NestJS 12 (ESM) + TypeScript | API REST sous `/api/*`, dans `api/` |
| Temps réel | — | Socket.io retiré du setup, voir Bonus |
| Médias | Railway Storage Buckets (S3-compatible) | Images, sons, PDF ; upload direct navigateur → bucket via URL présignée |
| ORM | Prisma 7.10.1 + adaptateur `pg` | Accès BDD, migrations, seed |
| BDD | PostgreSQL 17 | Docker en local (port 5433), Railway en prod |
| Hébergement | Railway | Build du Dockerfile, déploiement à chaque `git push` |
| Vidéo | Liens YouTube (embed) | Pas d'upload vidéo |

---

## Direction artistique

**Concept** : structure et ergonomie des menus Nintendo DS / Pokémon DS + fenêtres Windows 98, dans une ambiance **sombre** (Mort aux Rats). La nostalgie pixel tient la forme, le sombre tient l'ambiance.

### Palette (proposition, à ajuster)

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#1a1714` | Fond général, noir brun |
| `--grid` | `#2a2520` | Lignes du quadrillage façon menu DS |
| `--panel` | `#2e2a26` | Fenêtres, menus |
| `--paper` | `#e8dcc4` | Cartouches d'article (papier vieilli) |
| `--paper-line` | `#b8a888` | Lignes pointillées des cartouches |
| `--ink` | `#2a2118` | Texte sur papier |
| `--text` | `#d8cfc0` | Texte sur fond sombre |
| `--accent-blue` | `#4a6a8a` | Bleu DS désaturé (roue, sélection) |
| `--accent-rust` | `#a8452e` | Rouille (actions, réactions, alertes) |

### Règles visuelles

- **Fond** : quadrillage fin façon menu DS, mais sombre.
- **Cartouche d'article** : fond `--paper`, lignes pointillées horizontales alignées sur l'interligne (comme la fiche de description d'un Pokémon), coins arrondis pixel, bordure épaisse.
- **Menus / fenêtres** : style Windows 98 (ombre dure, séparateurs gravés, icônes 16 px).
- **Roue des thèmes** : disque à cercles concentriques (bleu DS assombri), pastilles colorées en orbite, rotation au clic, thème actif au centre.
- **Pixel art** : toujours `image-rendering: pixelated`, mise à l'échelle par multiples entiers (×2, ×3).
- **Aucun asset Nintendo** (sprites, polices) : uniquement des créations originales inspirées.

### Polices (gratuites, licence à vérifier avant mise en prod)

- **Pixelify Sans** (Google Fonts, OFL) pour les titres et l'UI.
- **m5x7 / m6x11** (Daniel Linssen, gratuites avec crédit) pour le texte des cartouches, le plus proche de la police des descriptions Pokémon.
- Texte long en police pixel : 16 px minimum, interligne calé sur les pointillés.

### Templates d'assets (à produire par l'équipe)

En attendant, Claude Code crée des **placeholders** aux bonnes dimensions dans `web/public/assets/`.

| Asset | Fichier | Taille native | Affichage | Notes |
|---|---|---|---|---|
| Carte | `map.png` | 1920×1080 | plein écran | Positions des POI en % dans `map.config.ts` |
| Icônes POI | `poi-{shop,actu,blog,archives}.png` | 32×32 | ×2 | État hover = 2e frame (sheet 64×32) |
| Bulles de réaction | `reactions.png` | sheet 9 × 16×16 = 144×16 | ×2 | Ordre : cœur, goutte, ?, …, sourire, Zz, !, note, colère |
| Pastilles roue | `theme-{slug}.png` | 32×32 | ×2 | 7 thèmes + « tous » |
| Cartouche | `frame.png` | 24×24 | 9-slice, coins 8 px | Via `border-image` |
| Fenêtre Win98 | `window.png` | 24×24 | 9-slice | Idem |
| Avatar par défaut | `avatar-default.png` | 32×32 | ×2 | |
| Icônes UI | `icon-{nom}.png` | 16×16 | ×2 | Profil, nouvel article, recherche… |

---

## Modèle de données (base)

```
User         id, email (unique), passwordHash, pseudo (unique, modifiable), avatarUrl, role (USER|ADMIN), createdAt
Theme        id, slug, name, color, order          -- seed : cinéma, littérature, jeux vidéo, arts plastiques, photo, politique, intime
Article      id, title, authorId, themeId, coverUrl?, content (JSON blocs), createdAt, updatedAt
Media        id, articleId?, uploaderId, type (IMAGE|AUDIO|PDF), url, mime, size
Reaction     id, articleId, kind (enum 9 bulles), voterKey, createdAt   -- unique(articleId, voterKey)
Comment      id, articleId, authorId, parentId?, body, createdAt         -- arbre façon Reddit
Magazine     id, title, issue?, coverUrl, price, description?, helloAssoUrl, order, published
Announcement id, title, body, createdAt, published
InventorySlot id, userId, position (0-7), articleId                     -- unique(userId, position)
```

- `voterKey` : `user:<id>` si connecté, sinon un UUID anonyme en cookie httpOnly. Une réaction par article et par voterKey, modifiable.
- `content` en JSON de blocs, pour pouvoir faire évoluer l'éditeur sans casser les anciens articles.

---

## Phases

### Phase 0 — Setup & design system
- [x] Monorepo `web/` + `api/`, Docker Compose Postgres 17 (port 5433), Prisma init, seed des thèmes
- [ ] Déploiement Railway qui marche dès le début (page vide en prod)
- [x] Tokens CSS (palette), polices, fond quadrillé
- [x] Composants de base : `Cartouche`, `Window98`, `PixelButton`, `PixelIcon`, `ReactionBubble`
- [x] Placeholders de tous les assets du tableau ci-dessus
- ✅ **Fini quand** : une page de démo affiche tous les composants, en local et sur Railway.

### Phase 1 — Carte + navigation
- [x] Carte placeholder fixe, 4 POI cliquables positionnés via `map.config.ts`
- [x] Routes : `/` (carte), `/shop`, `/actu`, `/blog`, `/archives`
- [x] Un clic sur un POI ouvre la page ; bouton retour vers la carte sur chaque page
- ✅ **Fini quand** : on navigue entre les 5 pages, la carte se remplace en changeant un seul fichier.

### Phase 2 — Shop + Actu (lecture)
- [ ] Shop : grille de magazines (couverture + titre + prix), bouton vers HelloAsso (lien externe, aucun paiement géré)
- [ ] Actu : bloc intro « qui sommes-nous » + liste d'annonces
- [ ] Données en BDD via seed
- ✅ **Fini quand** : shop et actu affichent les données de la base.

### Phase 3 — Comptes + rôles + admin
- [ ] Inscription / connexion email + mot de passe (hash argon2 ou bcrypt), session JWT en cookie httpOnly
- [ ] Pseudo modifiable, avatar uploadable
- [ ] Rôles : tout le monde est `USER` (rédacteur), certains `ADMIN`
- [ ] Back-office admin simple : CRUD magazines + annonces, suppression d'articles et de commentaires, changement de rôle
- ✅ **Fini quand** : un admin modifie un magazine sans toucher au code.

### Phase 4 — Éditeur d'articles + médias
- [ ] Page « nouvel article » : titre, thème, couverture, contenu en blocs
- [ ] Types de blocs : texte riche, image, son, PDF, vidéo YouTube (URL → embed)
- [ ] Mise en page : rangées de 1 à 3 colonnes, chaque bloc placé librement dans les rangées, réordonnables (voir question éditeur)
- [ ] Upload : le front demande une URL présignée à l'API, puis envoie le fichier directement dans le bucket ; validation MIME + taille max ; formats image (png, jpg, webp, gif), son (mp3, ogg, wav), pdf
- [ ] Publication immédiate, sans validation
- [ ] Édition et suppression par l'auteur
- ✅ **Fini quand** : on crée un article mixte texte + image + son + YouTube, et il s'affiche correctement dans sa cartouche.

### Phase 5 — Blog : feed, article, réactions, commentaires
- [ ] Feed des articles, du plus récent au plus ancien
- [ ] Page article dans la cartouche pointillée
- [ ] Réactions en bulles : ouvertes à tous, une par article et par personne, modifiable, compteur par bulle
- [ ] Commentaires avec réponses imbriquées façon Reddit, réplier/déplier un fil
- [ ] Boutons « profil » et « nouvel article » dans le POI Blog
- ✅ **Fini quand** : un visiteur non connecté réagit, un connecté commente et répond à un commentaire.

### Phase 6 — Archives : roue + recherche + tri
- [ ] Roue des thèmes en bas à gauche : « tous » par défaut + 7 thèmes
- [ ] Barre de recherche (full-text Postgres en config française : titre, contenu, pseudo de l'auteur)
- [ ] Tri sous la recherche : récent → ancien, ancien → récent, A → Z, Z → A, aléatoire (défaut)
- [ ] Combinables, ex. thème + Z-A + recherche « BD » ; état reflété dans l'URL (`?theme=cinema&sort=za&q=BD`)
- [ ] Thèmes modifiables en dev (seed), pas d'UI admin
- ✅ **Fini quand** : toutes les combinaisons filtre × tri × recherche renvoient le bon résultat.

### Phase 7 — Profil + inventaire
- [ ] Page profil (privée, visible seulement par son propriétaire) : pseudo, avatar, articles écrits, inventaire
- [ ] Inventaire de 8 slots façon sac Pokémon, rempli avec des articles des autres (ajout depuis la page article, retrait, réordonnancement)
- ✅ **Fini quand** : on remplit, vide et réordonne les 8 slots.

### Phase 8 — Finitions + mise en ligne
- [ ] Accessibilité : contrastes, focus clavier, taille de police
- [ ] Performance : compression et redimensionnement des images à l'upload, lazy-loading
- [ ] RGPD : mentions légales, suppression de compte, aucun tracking
- [ ] Rate limiting sur l'auth, les réactions et les commentaires
- [ ] Nom de domaine mortauxrats.fr → Railway

---

## Bonus (plus tard)

- [ ] **Sons** façon menu DS (originaux, désactivables)
- [ ] **Version mobile** : les deux « écrans » DS empilés en vertical
- [ ] Inventaire : slot **article random** + slot **notebook** (notes perso privées)
- [ ] Profils publics
- [ ] Modération avancée (signalements, validation avant publication)
- [ ] Temps réel via Socket.io (nouveaux commentaires et réactions en live)
- [ ] Gestion des thèmes depuis l'admin
