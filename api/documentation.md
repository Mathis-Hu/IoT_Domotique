Voici la documentation des différents endpoints en **Markdown** :

---

# API Documentation

## Base URL

```
http://localhost:3000/api/sensors
```

---

### 1. **Récupérer la liste des capteurs connus**

- **URL**: `/known`
- **Méthode**: `GET`
- **Description**: Renvoie tous les capteurs enregistrés comme "connus".
- **Réponse (Succès)**:
    ```json
    [
        {
            "_id": "677fd663f97f0260ad45e983",
            "sensor_id": "c5f694a1a042",
            "name": "Nouveau capteur (movement)",
            "room": "Salon",
            "status": "connected"
        }
    ]
    ```

---

### 2. **Récupérer la liste des capteurs inconnus**

- **URL**: `/unknown`
- **Méthode**: `GET`
- **Description**: Renvoie tous les capteurs enregistrés comme "inconnus".
- **Réponse (Succès)**:
    ```json
    [
        {
            "_id": "678fd663f97f0260ad45e983",
            "sensor_id": "a1b2c3d4e5f6",
            "name": "Nouveau capteur (temperature)",
            "room": "",
            "status": "disconnected"
        }
    ]
    ```

---

### 3. **Récupérer la liste de tous les capteurs**

- **URL**: `/all`
- **Méthode**: `GET`
- **Description**: Combine les capteurs connus et inconnus en une seule réponse.
- **Réponse (Succès)**:
    ```json
    [
        {
            "_id": "677fd663f97f0260ad45e983",
            "sensor_id": "c5f694a1a042",
            "name": "Nouveau capteur (movement)",
            "room": "Salon",
            "status": "connected"
        },
        {
            "_id": "678fd663f97f0260ad45e983",
            "sensor_id": "a1b2c3d4e5f6",
            "name": "Nouveau capteur (temperature)",
            "room": "",
            "status": "disconnected"
        }
    ]
    ```

---

### 4. **Récupérer le dernier message d’un capteur spécifique**

- **URL**: `/:sensorId/latest`
- **Méthode**: `GET`
- **Paramètres**:
    - `sensorId` : ID du capteur dont on souhaite récupérer le dernier message.
- **Description**: Renvoie le dernier message publié par un capteur donné.
- **Réponse (Succès)**:
    ```json
    {
        "_id": "678fd663f97f0260ad45e983",
        "topic": "temperature",
        "payload": {
            "sensor_id": "c5f694a1a042",
            "type": "periodic",
            "value": 22.5,
            "unit": "°C",
            "timestamp": 1736368072
        },
        "qos": 0
    }
    ```
- **Réponse (Erreur)**:
    ```json
    {
        "error": "Aucun message trouvé pour le capteur c5f694a1a042"
    }
    ```

---

### 5. **Récupérer l'historique d'un capteur**

- **URL**: `/:sensorId/history`
- **Méthode**: `GET`
- **Paramètres**:
    - `sensorId` : ID du capteur dont on souhaite récupérer l’historique.
- **Description**: Renvoie tous les messages enregistrés pour un capteur spécifique.
- **Réponse (Succès)**:
    ```json
    [
        {
            "_id": "678fd663f97f0260ad45e983",
            "topic": "temperature",
            "payload": {
                "sensor_id": "c5f694a1a042",
                "type": "periodic",
                "value": 22.5,
                "unit": "°C",
                "timestamp": 1736368072
            },
            "qos": 0
        },
        {
            "_id": "678fd663f97f0260ad45e984",
            "topic": "temperature",
            "payload": {
                "sensor_id": "c5f694a1a042",
                "type": "periodic",
                "value": 23.1,
                "unit": "°C",
                "timestamp": 1736369072
            },
            "qos": 0
        }
    ]
    ```
- **Réponse (Erreur)**:
    ```json
    {
        "error": "Aucun historique trouvé pour le capteur c5f694a1a042"
    }
    ```

---

### 6. **Définir ou modifier les informations d’un capteur**

- **URL**: `/:sensorId`
- **Méthode**: `PUT`
- **Paramètres**:
    - `sensorId` : ID du capteur dont on souhaite mettre à jour les informations.
- **Corps (JSON)**:
    ```json
    {
        "name": "Capteur de mouvement",
        "room": "Salon",
        "status": "connected"
    }
    ```
- **Description**:
    - Si le capteur est dans `unknown_devices`, il est déplacé vers `known_devices` et mis à jour.
    - Si le capteur est dans `known_devices`, il est mis à jour.
    - Si le capteur est introuvable, une erreur est retournée.
- **Réponse (Succès, déplacé)**:
    ```json
    {
        "message": "Capteur c5f694a1a042 déplacé vers known_devices et mis à jour"
    }
    ```
- **Réponse (Succès, mis à jour)**:
    ```json
    {
        "message": "Capteur c5f694a1a042 mis à jour dans known_devices"
    }
    ```
- **Réponse (Erreur)**:
    ```json
    {
        "error": "Capteur c5f694a1a042 introuvable dans unknown_devices ou known_devices"
    }
    ```

---

### Notes :

- Assurez-vous d’utiliser des identifiants de capteur (`sensorId`) valides dans les requêtes.
- La base de données MongoDB doit contenir les collections suivantes :
    - `known_devices`
    - `unknown_devices`
    - `messages`