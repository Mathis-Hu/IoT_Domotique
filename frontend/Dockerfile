FROM nginx:alpine

# Copier les fichiers construits vers le répertoire utilisé par Nginx
COPY ./dist /usr/share/nginx/html

# Copier le fichier de configuration Nginx personnalisé (si nécessaire)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Lancer Nginx
CMD ["nginx", "-g", "daemon off;"]
