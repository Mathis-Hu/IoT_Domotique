import express from 'express';
import bodyParser from 'body-parser';
import mqtt from 'mqtt';
import WebSocket from 'ws';
import mongoose from 'mongoose';
import cors from 'cors';


const app = express();
const port = 3000;

app.use(cors());

app.use(cors({
    origin: 'http://localhost:5173', // Autorise seulement cette origine
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Autorise ces méthodes HTTP
    allowedHeaders: ['Content-Type', 'Authorization'] // Autorise ces en-têtes
  }));

// Middleware pour parser le JSON
app.use(bodyParser.json());

// Connexion au broker MQTT
const mqttClient = mqtt.connect("mqtt://<adresse_broker>");
mqttClient.on("connect", () => {
    console.log("Connecté au broker MQTT");
    mqttClient.subscribe("#", (err) => {
        if (!err) {
            console.log("Souscrit à tous les topics MQTT");
        } else {
            console.error("Erreur de souscription :", err);
        }
    });
});

// Gestion des WebSockets
const wss = new WebSocket.Server({ noServer: true });
let wsClients = [];

// Envoie des messages MQTT aux clients WebSocket connectés
mqttClient.on("message", (topic, message) => {
    console.log(`MQTT -> Topic: ${topic}, Message: ${message.toString()}`);
    wsClients.forEach((ws) => {
        ws.send(JSON.stringify({ topic, message: message.toString() }));
    });
});

// Endpoint REST pour récupérer l'historique des messages
let messageHistory = []; // Stocke un historique local des messages
mqttClient.on("message", (topic, message) => {
    messageHistory.push({ topic, message: message.toString() });
});

// Configuration des WebSockets
wss.on("connection", (ws) => {
    console.log("Client WebSocket connecté");
    wsClients.push(ws);

    ws.on("close", () => {
        console.log("Client WebSocket déconnecté");
        wsClients = wsClients.filter((client) => client !== ws);
    });
});

// Gestion du serveur Express avec WebSocket intégré
const server = app.listen(port, () => {
    console.log(`API en écoute sur http://localhost:${port}`);
});

server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
    });
});

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mqtt', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
