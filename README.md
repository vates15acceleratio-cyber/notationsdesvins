# Nos Vins 🍷

Carnet de dégustation de vins partagé entre amis, en temps réel. Application web (PWA) : installable sur Android et iOS depuis le navigateur, sans passer par les stores.

## Fonctionnalités

- Fiches de vin (rouge, blanc, rosé, gris, pétillant, liquoreux) avec photo de l'étiquette optionnelle (ne bloque jamais la création de la fiche)
- Chaque personne attribue sa propre note sur 5 et remplit sa fiche de dégustation complète : robe (couleur, intensité, limpidité), nez (intensité, qualité, arômes), bouche (attaque, tanins, acidité, sucrosité, corps, longueur, équilibre), appréciation et accord mets-vin
- Note moyenne calculée automatiquement
- Espace commentaires visible par tous sous chaque fiche
- **Synchronisation en temps réel** : dès qu'une personne modifie une fiche, ajoute une note ou un commentaire, l'autre le voit instantanément
- Connexion simple par pseudo (pas de mot de passe à gérer)

## Stack technique

- **React + Vite + TypeScript**, Tailwind CSS
- **Supabase** : base de données Postgres, Realtime, Storage (photos), authentification anonyme
- **vite-plugin-pwa** pour l'installation sur mobile

---

## 1. Configurer Supabase (gratuit)

1. Crée un compte sur [supabase.com](https://supabase.com) et un nouveau projet.
2. Dans **Authentication → Sign In / Providers**, active **Anonymous Sign-Ins**.
   (Cela permet à chacun d'utiliser l'app avec juste un pseudo, sans mot de passe ni email — une identité technique stable est quand même créée en coulisses pour que chacun ne modifie que ses propres notes.)
3. Dans **SQL Editor**, ouvre une nouvelle requête, colle le contenu de [`supabase/schema.sql`](supabase/schema.sql) et exécute-le. Cela crée les tables, les règles de sécurité (RLS), active le temps réel et crée le bucket de stockage `labels` pour les photos.
4. Dans **Project Settings → API**, récupère :
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

## 2. Configurer le projet en local

```bash
npm install
cp .env.example .env
```

Renseigne `.env` avec les deux valeurs récupérées à l'étape précédente.

```bash
npm run dev
```

Ouvre `http://localhost:5173`.

## 3. Déployer pour le partager avec ton ami

Le plus simple est [Vercel](https://vercel.com) (gratuit) :

```bash
npm i -g vercel
vercel
```

Ou via l'interface Vercel : "Import project" → connecte ton repo GitHub → ajoute les deux variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) dans les réglages du projet → Deploy.

Netlify fonctionne aussi de façon identique (build command : `npm run build`, publish directory : `dist`).

Une fois déployée, envoie simplement le lien à ton ami.

## 4. Installer l'app sur le téléphone

**Android (Chrome) :** ouvrir le lien → menu ⋮ → "Ajouter à l'écran d'accueil" (ou une bannière d'installation apparaît automatiquement).

**iOS (Safari) :** ouvrir le lien → bouton Partager (carré avec flèche) → "Sur l'écran d'accueil".

L'app s'ouvre alors en plein écran comme une app native, avec son icône.

---

## Structure du projet

```
src/
  components/     Composants réutilisables (étoiles, formulaire de dégustation, commentaires…)
  context/        Contexte utilisateur (pseudo + session anonyme Supabase)
  hooks/          Hooks de données + abonnements temps réel (useWines, useWineDetail)
  lib/            Client Supabase, upload de photos
  pages/          Écrans (accueil, nouvelle fiche, détail d'un vin)
supabase/
  schema.sql      Schéma complet à exécuter dans Supabase (tables, RLS, realtime, storage)
```

## Notes de sécurité

Cette app est pensée pour être partagée entre quelques personnes de confiance (toi et ton ami) : n'importe qui possédant le lien et l'app peut créer un pseudo et lire/écrire les fiches, notes et commentaires. Pour un usage plus restreint, on peut évoluer vers une vraie authentification par email/mot de passe — le schéma SQL est déjà structuré pour ça (il suffit de remplacer la connexion anonyme par `supabase.auth.signInWithPassword` / `signUp`).
