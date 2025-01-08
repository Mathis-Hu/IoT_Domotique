import json
import ssl

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
        # Décodage de la payload
        payload = message.payload.decode("utf-8")

        # Analyse du topic
        if message.topic == "ping":
            process_ping(message, payload)
        else:
            process_message(message, payload)

        process_sensor(message, payload)
    except Exception as e:
        print(f"[ERROR] Erreur : {e}")


# Mise à jour de l'état du capteur
def process_ping(message, payload):
    # Mise à jour de l'état du capteur
    sensor_id = get_sensor_id(payload)
    print("[INFO] Ping reçu")

    if sensor_id:
        status = get_sensor_status(payload)
        # Si existe dans "known_devices", mettre à jour le statut
        if known_devices_collection.find_one({"sensor_id": sensor_id}):
            known_devices_collection.update_one({"sensor_id": sensor_id}, {"$set": {"status": status}})
            print(f"[INFO] Statut du capteur mis à jour : {sensor_id} - {status}")
        # Si existe dans "unknown_devices", mettre à jour le statut
        elif unknown_devices_collection.find_one({"sensor_id": sensor_id}):
            unknown_devices_collection.update_one({"sensor_id": sensor_id}, {"$set": {"status": status}})
            print(f"[INFO] Statut du capteur mis à jour : {sensor_id} - {status}")
        else:
            print(f"[ERROR] Capteur inconnu : {sensor_id}")
    else:
        print("[ERROR] Payload ne contient pas de 'sensor_id'")


# Sauvegarde du message dans la collection "messages"
def process_message(message, payload):
    data = {
        "topic": message.topic,
        "payload": payload,
        "qos": message.qos
    }
    print(f"[INFO] Message reçu : {data}")

    # Sauvegarde du message dans la collection "messages"
    messages_collection.insert_one(data)
    print(f"[INFO] Message sauvegardé : {data}")


# Vérification de l'existence du "sensor_id" dans les collections "known_devices" et "unknown_devices"
def process_sensor(message, payload):
    try:
        # Analyse de la payload pour vérifier le "sensor_id"
        sensor_id = get_sensor_id(payload)
        if sensor_id:
            # Vérification dans "known_devices"
            if not known_devices_collection.find_one({"sensor_id": sensor_id}):
                # Ajout à "unknown_devices" s'il n'est pas connu
                if not unknown_devices_collection.find_one({"sensor_id": sensor_id}):
                    data = {
                        "sensor_id": sensor_id,
                        "name": f"Nouveau capteur ({message.topic})",
                        "room": "",
                        "status": "connected"
                    }
                    unknown_devices_collection.insert_one(data)
                    print(f"[INFO] Sensor ID ajouté à unknown_devices : {sensor_id}")
        else:
            print("[ERROR] Payload ne contient pas de 'sensor_id'")
    except json.JSONDecodeError:
        print("[ERROR] Payload n'est pas un JSON valide")


# Callback lorsqu'une connexion est établie
def on_connect(client, userdata, flags, rc):
    print("[INFO] Connecté au broker MQTT")


def get_sensor_status(payload):
    try:
        payload_json = json.loads(payload)
        return payload_json.get("status")
    except json.JSONDecodeError:
        return


def get_sensor_id(payload):
    try:
        payload_json = json.loads(payload)
        return payload_json.get("sensor_id")
    except json.JSONDecodeError:
        return


def main():
    # Configuration du client MQTT
    client = mqtt.Client()

    # Activer SSL/TLS
    client.tls_set(ca_certs="/app/certs/ca.crt",
                   certfile="/app/certs/client.crt",
                   keyfile="/app/certs/client.key",
                   tls_version=ssl.PROTOCOL_TLSv1_2)

    # Configuration des callbacks
    client.on_connect = on_connect
    client.on_message = on_message

    # Connexion à Mosquitto
    client.connect("192.168.2.10", 8883, 60)

    # Souscrire à tous les topics
    client.subscribe("#")

    # Boucle principale
    client.loop_forever()


if __name__ == "__main__":
    main()
