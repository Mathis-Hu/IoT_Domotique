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

# --- Variables globales a modifier pour créer un nouveau capteur ---
TOPIC = os.getenv("TOPIC", "template")  # Topic à modifier par capteur
TYPE = "periodic"  # type du capteur, "periodic" or "event"
UNIT = "unit"  # Unité du capteur
DELAY_PERIODIC = 5 * 60  # délai en secondes, si capteur de type périodique, par défaut 5 minutes
DELAY_EVENT_MIN = 3 * 60  # délai minimum en secondes, si capteur de type événement, par défaut 3 minutes
DELAY_EVENT_MAX = 15 * 60  # délai maximum en secondes, si capteur de type événement, par défaut 15 minutes
previous_value = None  # valeur précédente, surtout utile pour les capteurs de type événement

# Génération de la valeur simulée
def generate_value():
    global previous_value

    value = 0

    previous_value = value
    return value


# --- NE PAS MODIFIER A PARTIR D'ICI ---

# Configuration MQTT
PORT = os.getenv("PORT", 8883)
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


# Scanner les adresses IP d'un réseau donné
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


# Fonction principale
def main():
    if TYPE == "periodic" or TYPE == "event":
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

                print("Capteur démarré")

                try:
                    while True:
                        # Générer une valeur simulée
                        valeur = generate_value()

                        # Créer un message JSON
                        message = {
                            "sensor_id": SENSOR_ID,
                            "type": TYPE,
                            "value": valeur,
                            "unit": UNIT,
                            "timestamp": int(time.time())
                        }

                        # Publier le message sur le topic
                        client.publish(TOPIC, json.dumps(message))
                        print(f"Donnée envoyée : {message}")

                        if TYPE == "periodic":
                            # Attendre X secondes avant le prochain envoi
                            time.sleep(DELAY_PERIODIC)
                        elif TYPE == "event":
                            # Attendre X secondes avant le prochain envoi
                            time.sleep(round(random.uniform(DELAY_EVENT_MIN, DELAY_EVENT_MAX), 2))
                except KeyboardInterrupt:
                    print("\nArrêt du capteur.")
                finally:
                    client.disconnect()
            else:
                print("Aucun serveur Mosquitto trouvé.")
        except RuntimeError as e:
            print(f"Erreur : {e}")
    else:
        print("Erreur : type invalide, indiquez 'periodic' ou 'event'. Déconnexion.")


if __name__ == "__main__":
    main()
