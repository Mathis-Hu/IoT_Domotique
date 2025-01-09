import express from 'express';
import { connect } from 'mqtt';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
const wsPort = 3001;

// Chemins des certificats SSL
const caFile = resolve(__dirname, 'ca.crt'); 
const certFile = resolve(__dirname, 'client.crt'); 
const keyFile = resolve(__dirname, 'client.key'); 

// Configuration MQTT avec SSL
const brokerUrl = 'mqtts://localhost:8883'; 
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