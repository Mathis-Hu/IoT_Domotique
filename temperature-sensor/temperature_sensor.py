import json
import os
import random
import socket
import ssl
import time
from concurrent.futures import ThreadPoolExecutor
from ipaddress import ip_network

import netifaces as ni
import paho.mqtt.client as mqtt

# Configuration MQTT
PORT = os.getenv("PORT", 8883)
TOPIC = os.getenv("TOPIC", "sensors/temperature")
SENSOR_ID = os.getenv("HOSTNAME", "temp_sensor")


# Permet de récupérer le réseau local
def get_network_base():
    interfaces = ni.interfaces()

    # Parcourir les interfaces pour trouver une adresse IPv4
    for interface in interfaces:
        try:
            # Récupérer les informations IPv4 de l'interface
            addrs = ni.ifaddresses(interface)[ni.AF_INET][0]
            ip = addrs['addr']
            netmask = addrs['netmask']

            # Exclure les adresses localhost (127.0.0.1)
            if ip.startswith("127."):
                continue

            # Calculer la base du réseau
            network = ip_network(f"{ip}/{netmask}", strict=False)
            return str(network.network_address), network.prefixlen
        except KeyError:
            # L'interface ne supporte pas IPv4 ou n'a pas d'adresse
            continue

    raise RuntimeError("Impossible de déterminer le réseau local.")


# Scanner les adresses IP d’un réseau donné
def scan_network(base_ip, port=PORT):
    print(f"Scan du réseau {base_ip}.0/24 sur le port {port}...")

    # Créer une liste d'adresses IP à scanner (de 2 à 254)
    ips = [f"{base_ip}.{i}" for i in range(2, 255)]

    with ThreadPoolExecutor(max_workers=10) as executor:
        # Tester chaque adresse IP en parallèle via un pool
        results = executor.map(lambda ip: test_mosquitto_server(ip, port), ips)
    return [ip for ip in results if ip]


# Tester une IP pour voir si Mosquitto est disponible
def test_mosquitto_server(ip, port=PORT):
    try:
        with socket.create_connection((ip, port), timeout=1):
            print(f"Serveur Mosquitto trouvé à : {ip}:{port}")
            return ip
    except:
        return None


# Génération de la température simulée
def generate_temperature():
    return round(random.uniform(15.0, 30.0), 2)


# Fonction principale
def main():
    try:
        # Récupérer la base du réseau
        base_ip, prefix = get_network_base()
        base_ip = ".".join(base_ip.split(".")[:-1])
        print(f"Réseau détecté : {base_ip}/{prefix}")

        # Scan du réseau
        servers = scan_network(base_ip)
        if servers:
            print("Serveurs Mosquitto détectés :", servers)

            # Connexion au broker MQTT
            client = mqtt.Client()

            # Activer SSL/TLS
            client.tls_set(ca_certs="/app/certs/ca.crt",
                           certfile="/app/certs/client.crt",
                           keyfile="/app/certs/client.key",
                           tls_version=ssl.PROTOCOL_TLSv1_2)

            client.connect(servers[0], PORT, 60)

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
                    time.sleep(5 * 60)
            except KeyboardInterrupt:
                print("\nArrêt du capteur.")
            finally:
                client.disconnect()
        else:
            print("Aucun serveur Mosquitto trouvé.")
    except RuntimeError as e:
        print(f"Erreur : {e}")


if __name__ == "__main__":
    main()
