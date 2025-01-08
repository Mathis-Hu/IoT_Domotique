FROM node:20

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances de production
RUN npm ci --only=production

# Copier le reste des fichiers du projet
COPY . .

# Exposer le port sur lequel Express.js écoute (par défaut 3000)
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]
