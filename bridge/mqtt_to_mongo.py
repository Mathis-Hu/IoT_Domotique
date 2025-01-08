import json

import paho.mqtt.client as mqtt
from pymongo import MongoClient

# Configuration MongoDB
mongo_client = MongoClient("mongodb://mongo:27017/")
db = mongo_client.mqtt
messages_collection = db.messages
known_devices_collection = db.known_devices
unknown_devices_collection = db.unknown_devices

# Callback lorsqu'un message est reçu
def on_message(client, userdata, message):
    try:
        payload = message.payload.decode("utf-8")
        data = {
            "topic": message.topic,
            "payload": payload,
            "qos": message.qos
        }

        # Sauvegarde du message dans la collection "messages"
        messages_collection.insert_one(data)
        print(f"Message sauvegardé : {data}")

        # Analyse de la payload pour vérifier le "sensor_id"
        try:
            payload_json = json.loads(payload)
            sensor_id = payload_json.get("sensor_id")

            if sensor_id:
                # Vérification dans "known_devices"
                if not known_devices_collection.find_one({"sensor_id": sensor_id}):
                    # Ajout à "unknown_devices" s'il n'est pas connu
                    if not unknown_devices_collection.find_one({"sensor_id": sensor_id}):
                        data = {
                            "sensor_id": sensor_id,
                            "name": "",
                            "room": ""
                        }
                        unknown_devices_collection.insert_one(data)
                        print(f"Sensor ID ajouté à unknown_devices : {sensor_id}")
            else:
                print("Payload ne contient pas de 'sensor_id'")
        except json.JSONDecodeError:
            print("Payload n'est pas un JSON valide")

    except Exception as e:
        print(f"Erreur : {e}")


def init(client, userdata, flags, rc):
    print("Connecté au broker MQTT")

# Configuration du client MQTT
client = mqtt.Client()
client.on_connect = init
client.on_message = on_message

# Connexion à Mosquitto
client.connect("mosquitto", 1883, 60)

# Souscrire à tous les topics
client.subscribe("#")

# Boucle principale
client.loop_forever()
