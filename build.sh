#!/bin/bash
echo "Récupération des dépendances"
cd frontend/ || exit
npm install

echo "Lancement de la compilation"
npm run build

echo "Démarrage des conteneurs (docker-compose)"
cd ../ || exit
docker-compose up -d --build

