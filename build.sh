#!/bin/bash
echo "Récupération des dépendances (frontend)"
cd frontend/ || exit
npm install

echo "Lancement de la compilation (frontend)"
npm run build

echo "Démarrage des conteneurs (docker-compose)"
cd ../ || exit
docker-compose up -d --build

