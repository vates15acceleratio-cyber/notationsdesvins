# Nos Vins 🍷

Carnet de dégustation de vins partagé entre amis, **hors ligne d'abord**. Application web (PWA) installable sur Android et iOS depuis le navigateur, sans passer par les stores, et **sans serveur**.

## Fonctionnalités

- Fiches de vin (rouge, blanc, rosé, gris, pétillant, liquoreux) avec photo de l'étiquette optionnelle (compressée à ~150 Ko)
- Chaque personne attribue sa propre note sur 5 et remplit sa fiche de dégustation complète : robe, nez, bouche, appréciation et accord mets-vin
- Note moyenne calculée automatiquement, commentaires sous chaque fiche
- **Fonctionne sans réseau** : tout est enregistré sur le téléphone
- **Partage via GitHub** : bouton « Publier » pour envoyer ses notes, « Mettre à jour » pour récupérer celles des autres (aussi fait automatiquement à l'ouverture)

## Comment ça marche

```
Téléphone A (IndexedDB) ──Publier──▶ nosvins-data/data/<idA>.json ◀──Publier── Téléphone B
                       ◀─Mettre à jour── (fusion de tous les fichiers) ──Mettre à jour─▶
```

- Les données vivent dans la base locale du navigateur (IndexedDB, via [Dexie](https://dexie.org)).
- « Publier » écrit l'instantané complet de la base locale dans `data/<id>.json` du dépôt public [`nosvins-data`](https://github.com/vates15acceleratio-cyber/nosvins-data), et les photos en attente dans `photos/`. Chaque personne a **son propre fichier** : aucun conflit d'écriture possible.
- « Mettre à jour » lit tous les fichiers et fusionne enregistrement par enregistrement : **la version la plus récente (`updated_at`) gagne**. Les suppressions sont des marqueurs (`deleted: true`) pour se propager elles aussi.
- La lecture ne demande aucun compte. La publication demande une **clé GitHub** saisie dans ⚙️ Réglages (stockée uniquement sur le téléphone).

## Mise en place

### 1. Créer la clé de publication (une fois)

Sur GitHub : **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**

- *Repository access* : **Only select repositories** → `nosvins-data`
- *Permissions* → *Repository permissions* → **Contents : Read and write** (rien d'autre)
- *Expiration* : 1 an

Colle la clé dans l'app (⚙️ → Clé de publication). Tu peux transmettre la même clé à un ami pour qu'il publie aussi, sans compte GitHub : elle ne donne accès qu'au dépôt de données, et se révoque à tout moment. Ses publications portent son pseudo.

### 2. Développer en local

```bash
npm install
npm run dev
```

Ouvre `http://localhost:5173/notationsdesvins/`.

### 3. Déployer

Chaque push sur `main` déclenche le workflow [`deploy.yml`](.github/workflows/deploy.yml) qui publie l'app sur GitHub Pages :
`https://vates15acceleratio-cyber.github.io/notationsdesvins/`

Le dépôt du dépôt de données se configure dans [`src/config.ts`](src/config.ts).

## Installer l'app sur le téléphone

**Android (Chrome) :** ouvrir le lien → menu ⋮ → « Ajouter à l'écran d'accueil ».

**iOS (Safari) :** ouvrir le lien → bouton Partager → « Sur l'écran d'accueil ». Sur iPhone, utilise toujours l'app installée : Safari peut effacer les données d'un site non installé après quelques semaines sans visite (tes notes publiées se récupèrent alors avec « Mettre à jour »).

**Nouveau téléphone ?** Au premier lancement, l'app récupère le carnet et propose « Tu es déjà dans le carnet ? » : touche ton pseudo pour reprendre ton identité.

## Structure du projet

```
src/
  components/     Composants (étoiles, formulaire de dégustation, commentaires, barre de synchro…)
  context/        UserContext (identité locale) et SyncContext (publier / mettre à jour)
  hooks/          Requêtes réactives sur la base locale (useWines, useWineDetail)
  lib/
    db.ts         Schéma IndexedDB (Dexie)
    data.ts       Écritures locales (création, modification, suppression)
    sync.ts       Échange avec GitHub (lecture, fusion, publication)
    photos.ts     Compression et affichage des photos
  pages/          Écrans (accueil, nouvelle fiche, détail, réglages)
  config.ts       Dépôt GitHub des données
```

## Confidentialité

Le dépôt de données est **public** : toute personne connaissant l'adresse peut lire les notes, commentaires, pseudos et photos d'étiquettes. Ne publie rien de personnel.
