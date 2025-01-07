import paho.mqtt.client as mqtt
from pymongo import MongoClient

# Configuration MongoDB
mongo_client = MongoClient("mongodb://mongo:27017/")
db = mongo_client.mqtt
collection = db.messages

# Callback lorsqu'un message est reçu
def on_message(client, userdata, message):
    try:
        payload = message.payload.decode("utf-8")
        data = {
            "topic": message.topic,
            "payload": payload,
            "qos": message.qos
        }
        collection.insert_one(data)
        print(f"Message sauvegardé : {data}")
    except Exception as e:
        print(f"Erreur : {e}")

# Configuration du client MQTT
client = mqtt.Client()
client.on_message = on_message

# Connexion à Mosquitto
client.connect("mosquitto", 1883, 60)

# Souscrire à tous les topics
client.subscribe("#")

# Boucle principale
client.loop_forever()
