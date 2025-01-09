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
IP_ADDRESS = ""
PORT = os.getenv("PORT", 8883)
SENSOR_ID = os.getenv("HOSTNAME", "temp_sensor")
TOPIC_PING = "ping"
CACHE_FILE = "cache.json"


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

    raise RuntimeError("[ERREUR] Impossible de déterminer le réseau local.")


# Scanner les adresses IP d'un réseau donné
def scan_network(base_ip, port=PORT):
    print(f"[INFO] Scan du réseau {base_ip}.0/24 sur le port {port}...")

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
            print(f"[INFO] Serveur Mosquitto trouvé à : {ip}:{port}")
            return ip
    except:
        return None

# Fonction appelée lorsque le capteur se connecte au broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[INFO] Message de connexion envoyé (code {rc}).")
        # Publier un message pour signaler la connexion
        client.publish(TOPIC_PING, json.dumps({
            "sensor_id": SENSOR_ID,
            "status": "connected",
            "original_topic": TOPIC,
            "timestamp": int(time.time())
        }), qos=1)
    else:
        print(f"[ERREUR] Connexion échouée avec code {rc}.")

# Fonction appelée lorsque le capteur se déconnecte du broker
def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("[ERREUR] Message de déconnexion inattendu envoyé (code : {rc}).")
        # Publier un message pour signaler une déconnexion inattendue
        client.publish(TOPIC_PING, json.dumps({
            "sensor_id": SENSOR_ID,
            "status": "disconnected_unexpectedly",
            "original_topic": TOPIC,
            "timestamp": int(time.time())
        }), qos=1)
    else:
        print("[INFO] Message de déconnexion envoyé.")
        # Publier un message pour signaler une déconnexion propre
        client.publish(TOPIC_PING, json.dumps({
            "sensor_id": SENSOR_ID,
            "status": "disconnected",
            "original_topic": TOPIC,
            "timestamp": int(time.time())
        }), qos=1)


# Fonction principale
def main():
    global IP_ADDRESS
    if TYPE == "periodic" or TYPE == "event":
        try:

            # Vérifier si le cache existe
            if os.path.exists(CACHE_FILE):
                # Réutiliser l'adresse IP précédente
                with open(CACHE_FILE, "r") as f:
                    content = json.load(f)
                    print(f"[INFO] Cache chargé : {content}")
                    if content["ip_address"]:
                        IP_ADDRESS = content["ip_address"]
                        print(f"[INFO] Adresse IP chargée : {IP_ADDRESS}")
            else:
                print(f"[INFO] Aucun cache trouvé.")

                # Récupérer la base du réseau
                base_ip, prefix = get_network_base()
                base_ip = ".".join(base_ip.split(".")[:-1])
                print(f"[INFO] Réseau détecté : {base_ip}/{prefix}")

                # Scan du réseau
                servers = scan_network(base_ip)
                if servers:
                    print("[INFO] Serveurs Mosquitto détectés :", servers)
                    IP_ADDRESS = servers[0]
                    # Sauvegarder l'adresse IP dans le cache
                    with open(CACHE_FILE, "w") as f:
                        json.dump({"ip_address": IP_ADDRESS}, f)
                        print(f"[INFO] Adresse IP sauvegardée : {IP_ADDRESS}")
                else:
                    print("[ERREUR] Aucun serveur Mosquitto trouvé.")
                    return

            if IP_ADDRESS != "":
                # Connexion au broker MQTT
                client = mqtt.Client()

                # Activer SSL/TLS
                client.tls_set(ca_certs="/app/certs/ca.crt",
                               certfile="/app/certs/client.crt",
                               keyfile="/app/certs/client.key",
                               tls_version=ssl.PROTOCOL_TLSv1_2)

                # Configuration des fonctions de connexion et déconnexion
                client.on_connect = on_connect
                client.will_set(TOPIC_PING, json.dumps({
                    "sensor_id": SENSOR_ID,
                    "status": "disconnected_unexpectedly",
                    "original_topic": TOPIC,
                    "timestamp": int(time.time())
                }), qos=1, retain=True)

                # Connexion au premier serveur trouvé
                client.connect(IP_ADDRESS, PORT, 60)
                client.loop_start()

                print("[INFO] Capteur démarré")

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
                        print(f"[INFO] Donnée envoyée : {message}")

                        if TYPE == "periodic":
                            # Attendre X secondes avant le prochain envoi
                            time.sleep(DELAY_PERIODIC)
                        elif TYPE == "event":
                            # Attendre X secondes avant le prochain envoi
                            time.sleep(round(random.uniform(DELAY_EVENT_MIN, DELAY_EVENT_MAX), 0))
                except KeyboardInterrupt:
                    print("\n[INFO] Arrêt du capteur.")
                finally:
                    on_disconnect(None, None, 0)
                    client.disconnect()
            else:
                print("[ERREUR] Aucun serveur Mosquitto trouvé.")
        except RuntimeError as e:
            print(f"[ERREUR] {e}")
    else:
        print("[ERREUR] Type invalide, indiquez 'periodic' ou 'event'. Déconnexion.")


if __name__ == "__main__":
    main()
