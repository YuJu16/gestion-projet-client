# Gestion de projet - Client

Interface web de l'appli de gestion de projet (test technique mentorat Ynov).

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Axios

## Prérequis

Le serveur (`gestion-projet-server`) doit tourner sur `http://localhost:4000` pour que le client fonctionne.

## Installation

```bash
git clone https://github.com/YuJu16/gestion-projet-client.git
cd gestion-projet-client
npm install
```

## Lancer le client

```bash
npm run dev
```

Accessible sur `http://localhost:5173`.

## Organisation

```
src/
  components/
    PageBackground.tsx   -> fond dégradé
    GlassCard.tsx         -> card en verre
    Button.tsx             -> bouton (2 variantes)
  pages/
    Login.tsx / Register.tsx
    Dashboard.tsx           -> liste des projets
    ProjectDetail.tsx        -> tâches, participants, kanban
  context/
    AuthContext.tsx           -> état de connexion partagé
  lib/
    api.ts                    -> axios + injection du token
  App.tsx                      -> routes
```

## Fonctionnalités

- Inscription / connexion
- Créer, consulter, supprimer un projet
- Tâches organisées en kanban (À faire / En cours / Terminé)
- Changer le statut et assigner une tâche à un participant
- Ajouter un participant, et le retirer (owner ou le participant lui-même)

## Notes

- Le token JWT est stocké dans le localStorage pour garder la session après un refresh.
- `/dashboard` et `/projects/:id` sont protégées : sans token valide, redirection vers `/login`.