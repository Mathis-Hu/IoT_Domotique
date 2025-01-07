import json
import os
import random
import time

import paho.mqtt.client as mqtt

# Configuration MQTT
BROKER = os.getenv("BROKER", "mosquitto")
PORT = os.getenv("PORT", "1883")
TOPIC = os.getenv("TOPIC", "sensors/temperature")
SENSOR_ID = os.getenv("HOSTNAME", "temp_sensor")

# Génération de la température simulée
def generate_temperature():
    return round(random.uniform(15.0, 30.0), 2)


# Fonction principale
def main():
    # Connexion au broker MQTT
    client = mqtt.Client()
    client.connect(BROKER, PORT, 60)

    print("Capteur de température démarré...")

    try:
        while True:
            # Générer une température simulée
            temperature = generate_temperature()

            # Créer un message JSON
            message = {
                "sensor_id": SENSOR_ID,
                "type": "periodic",
                "value": temperature,
                "unit": "°C",
                "timestamp": int(time.time())
            }

            # Publier le message sur le topic
            client.publish(TOPIC, json.dumps(message))
            print(f"Donnée envoyée : {message}")

            # Attendre 5 minutes avant le prochain envoi
            time.sleep(5 * 60)  # 5 minutes
    except KeyboardInterrupt:
        print("\nArrêt du capteur.")
    finally:
        client.disconnect()

if __name__ == "__main__":
    main()
