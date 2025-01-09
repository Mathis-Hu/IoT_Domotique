import express from 'express';
import {connect} from 'mqtt';
import {readFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import {WebSocket} from 'ws';
import {MongoClient} from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
const wsPort = 3001;

// Configuration MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'mqtt';

// Middleware pour parser le JSON
app.use(express.json());

// Chemins des certificats SSL
const caFile = resolve(__dirname, 'certs/ca.crt');
const certFile = resolve(__dirname, 'certs/client.crt');
const keyFile = resolve(__dirname, 'certs/client.key');

// Configuration MQTT avec SSL
const brokerUrl = process.env.BROKER_URL || 'mqtts://localhost:8883';
const mqttOptions = {
    clientId: 'mqtt_client_' + Math.random().toString(16).substr(2, 8),
    clean: true,
    connectTimeout: 4000,
    key: readFileSync(keyFile), 
    cert: readFileSync(certFile),
    ca: readFileSync(caFile), 
    rejectUnauthorized: true,
};

// Connexion au broker MQTT
const mqttClient = connect(brokerUrl, mqttOptions);

// Gestion des événements MQTT
mqttClient.on('connect', () => {
    console.log('Connecté au broker MQTT avec SSL');
    // Souscription au topic générique
    mqttClient.subscribe('#', (err) => {
        if (err) {
            console.error('Erreur lors de la souscription au topic # :', err);
        } else {
            console.log('Souscription réussie au topic #');
        }
    });
});


// Lancer le serveur
app.listen(port, () => {
    console.log(`Serveur Express lancé sur http://localhost:${port}`);
});

// Clients connectés au WebSocket
const webSocketClients = [];

mqttClient.on('message', (topic, message) => {
    console.log(`Message MQTT reçu : Topic = ${topic}, Message = ${message.toString()}`);

    // Diffuser le message reçu à tous les clients WebSocket connectés
    webSocketClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ topic, message: message.toString() }));
        }
    });
});

// Démarrer le serveur WebSocket
const wss = new WebSocket.Server({ port: wsPort }, () => {
    console.log(`Serveur WebSocket lancé sur ws://localhost:${wsPort}`);
});

// Handle les connexions des nouveaux clients au websocket
wss.on('connection', (ws) => {
    // Ajoute le client à la liste des clients
    console.log('Client WebSocket connecté');
    webSocketClients.push(ws);

    ws.on('close', () => {
        console.log('Client WebSocket déconnecté');
        const index = webSocketClients.indexOf(ws);
        if (index !== -1) webSocketClients.splice(index, 1);
    });
});

// Initialisation de la connexion MongoDB
let db;
MongoClient.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('[INFO] Connecté à MongoDB');
        db = client.db(dbName);
    })
    .catch(err => {
        console.error('[ERREUR] Connexion à MongoDB échouée :', err);
        process.exit(1);
    });


// Routes

// Récupérer la liste des capteurs connus
app.get('/api/sensors/known', async (req, res) => {
    try {
        const sensors = await db.collection('known_devices').find().toArray();
        res.json(sensors);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des capteurs connus' });
    }
});

// Récupérer la liste des capteurs inconnus
app.get('/api/sensors/unknown', async (req, res) => {
    try {
        const sensors = await db.collection('unknown_devices').find().toArray();
        res.json(sensors);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des capteurs inconnus' });
    }
});

// Récupérer la liste de tous les capteurs
app.get('/api/sensors/all', async (req, res) => {
    try {
        const knownSensors = await db.collection('known_devices').find().toArray();
        const unknownSensors = await db.collection('unknown_devices').find().toArray();
        res.json([...knownSensors, ...unknownSensors]);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération de tous les capteurs' });
    }
});

// Récupérer le dernier message de tous les capteurs connus
app.get('/api/sensors/all/latest', async (req, res) => {
    try {
        const knownSensors = await db.collection('known_devices').find().toArray();
        const unknownSensors = await db.collection('unknown_devices').find().toArray();
        const allSensors = [...knownSensors, ...unknownSensors];

        const messages = await Promise.all(
            allSensors.map(async sensor => {
                const message = await db.collection('messages')
                    .find({sensor_id: sensor.sensor_id})
                    .sort({timestamp: -1})
                    .limit(1)
                    .toArray();
                return message[0] || null;
            })
        );
        res.json(messages.filter(msg => msg !== null));
    } catch (err) {
        res.status(500).json({error: 'Erreur lors de la récupération des derniers messages des capteurs connus'});
    }
});

// Récupérer le dernier message d'un capteur spécifique
app.get('/api/sensors/:sensorId/latest', async (req, res) => {
    const { sensorId } = req.params;
    try {
        const message = await db.collection('messages')
            .find({ sensor_id: sensorId })
            .sort({ timestamp: -1 })
            .limit(1)
            .toArray();
        if (message.length) {
            res.json(message[0]);
        } else {
            res.status(404).json({ error: `Aucun message trouvé pour le capteur ${sensorId}` });
        }
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération du dernier message du capteur' });
    }
});

// Récupérer l'historique d'un capteur spécifique
app.get('/api/sensors/:sensorId/history', async (req, res) => {
    const {sensorId} = req.params;

    try {
        // Recherche des messages correspondant au capteur
        const history = await db.collection('messages')
            .find({sensor_id: sensorId})
            .sort({timestamp: 1})
            .toArray();

        if (history.length > 0) {
            res.json(history);
        } else {
            res.status(404).json({error: `Aucun historique trouvé pour le capteur ${sensorId}`});
        }
    } catch (err) {
        console.error('[ERREUR]', err);
        res.status(500).json({error: 'Erreur lors de la récupération de l\'historique du capteur'});
    }
});


// Définir ou modifier les informations d'un capteur
app.put('/api/sensors/:sensorId', async (req, res) => {
    const { sensorId } = req.params;
    const updateData = req.body;

    try {
        const unknownDevice = await db.collection('unknown_devices').findOne({sensor_id: sensorId});

        if (unknownDevice) {
            // Mettre à jour et déplacer dans known_devices
            await db.collection('known_devices').updateOne(
                {sensor_id: sensorId},
                {$set: {...unknownDevice, ...updateData}}, // Fusionner les anciennes et nouvelles données
                {upsert: true}
            );

            // Supprimer de unknown_devices
            await db.collection('unknown_devices').deleteOne({sensor_id: sensorId});

            return res.json({message: `Capteur ${sensorId} déplacé vers known_devices et mis à jour`});
        }

        // Vérifier dans known_devices
        const knownDevice = await db.collection('known_devices').findOne({sensor_id: sensorId});

        if (knownDevice) {
            // Mettre à jour dans known_devices
            await db.collection('known_devices').updateOne(
                {sensor_id: sensorId},
                {$set: updateData}
            );

            return res.json({message: `Capteur ${sensorId} mis à jour dans known_devices`});
        }

        // Si non trouvé dans aucune collection
        return res.status(404).json({error: `Capteur ${sensorId} introuvable dans unknown_devices ou known_devices`});
    } catch (err) {
        console.error('[ERREUR]', err);
        res.status(500).json({ error: 'Erreur lors de la mise à jour des informations du capteur' });
    }
});
