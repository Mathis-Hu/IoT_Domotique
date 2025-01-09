import React, {useEffect, useState} from 'react';
import PeriodSensors from '../components/PeriodSensors';
import axios from 'axios';
import {Sensor} from "../models/sensor.ts";

const Home: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]); // Tous les capteurs récupérés
    const [filteredSensors, setFilteredSensors] = useState<Sensor[]>([]); // Capteurs filtrés

    const [searchTerm, setSearchTerm] = useState<string>(""); // Barre de recherche
    const [selectedType, setSelectedType] = useState<string>(""); // Filtre par type
    const [selectedRoom, setSelectedRoom] = useState<string>(""); // Filtre par pièce

    const [rooms, setRooms] = useState<string[]>([]); // Liste des pièces disponibles

    // Récupérer les capteurs avec leurs dernières valeurs
    const fetchSensors = () => {
        axios.get('http://localhost:3000/api/sensors/all')
            .then(sensorsResponse => {
                if (sensorsResponse.status === 200) {
                    axios.get('http://localhost:3000/api/sensors/all/latest')
                        .then(valuesResponse => {
                            const sensors = sensorsResponse.data.map((sensor: Sensor) => {
                                const value = valuesResponse.data.find((value: any) => value.sensor_id === sensor.sensor_id);
                                return {
                                    ...sensor,
                                    last_value: value ? value.value : null,
                                    unit: value ? value.unit : null
                                };
                            });
                            setSensors(sensors);
                            setFilteredSensors(sensors); // Initialiser les capteurs filtrés
                            extractRooms(sensors); // Extraire les pièces
                        });
                } else {
                    console.error("Erreur lors de l'appel : ", sensorsResponse);
                }
            })
            .catch(error => {
                console.error("Erreur lors de l'appel : ", error);
            });
    };

    // Extraire les pièces uniques
    const extractRooms = (sensors: Sensor[]) => {
        const uniqueRooms = Array.from(new Set(sensors.map(sensor => sensor.room).filter(Boolean)));
        setRooms(uniqueRooms);
    };

    // Appliquer les filtres sur les capteurs
    const applyFilters = () => {
        let filtered = sensors;

        // Filtrer par terme de recherche (nom du capteur)
        if (searchTerm.trim()) {
            filtered = filtered.filter(sensor =>
                sensor.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrer par type
        if (selectedType) {
            filtered = filtered.filter(sensor => sensor.status === selectedType);
        }

        // Filtrer par pièce
        if (selectedRoom) {
            filtered = filtered.filter(sensor => sensor.room === selectedRoom);
        }

        setFilteredSensors(filtered);
    };

    // Connexion WebSocket
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3001');

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const parsedData = JSON.parse(event.data); // Parse the outer structure

                if (parsedData.message) {
                    const updatedSensor = JSON.parse(parsedData.message); // Parse the nested message field

                    if (parsedData.topic === 'ping') {
                        setSensors((prevSensors) =>
                            prevSensors.map((sensor) =>
                                sensor.sensor_id === updatedSensor.sensor_id
                                    ? {
                                        ...sensor,
                                        status: updatedSensor.status
                                    }
                                    : sensor
                            )
                        );
                        return;
                    } else {
                        setSensors((prevSensors) =>
                            prevSensors.map((sensor) =>
                                sensor.sensor_id === updatedSensor.sensor_id
                                    ? {
                                        ...sensor,
                                        last_value: updatedSensor.value,
                                        unit: updatedSensor.unit
                                    }
                                    : sensor
                            )
                        );
                    }
                }
            } catch (error) {
                console.error('Erreur lors du traitement des données WebSocket :', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        // Fermer la connexion WebSocket lors du démontage
        return () => {
            ws.close();
        };
    }, []);

    // Mettre à jour les capteurs filtrés à chaque modification des filtres
    useEffect(() => {
        applyFilters();
    }, [searchTerm, selectedType, selectedRoom, sensors]);

    // Charger les capteurs au montage du composant
    useEffect(() => {
        fetchSensors();
    }, []);

    return (
        <div>
            {/* Barre de recherche et filtre */}
            <div className="w-full px-6 py-4">
                <div className="flex items-center space-x-4">
                    {/* Barre de recherche */}
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-1/3 px-4 py-3 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} // Met à jour le terme de recherche
                    />

                    {/* Menu déroulant pour filtrer Types */}
                    <h1 className="text-gray-100">Types : </h1>
                    <select
                        className="w-1/4 px-6 py-3 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)} // Met à jour le filtre de type
                    >
                        <option value="">Tous</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Error">Error</option>
                    </select>

                    {/* Menu déroulant pour filtrer Pièces */}
                    <h1 className="text-gray-100">Pièces : </h1>
                    <select
                        className="w-1/4 px-6 py-3 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)} // Met à jour le filtre de pièce
                    >
                        <option value="">Tous</option>
                        {rooms.map((room, index) => (
                            <option key={index} value={room}>
                                {room}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <main className="flex flex-wrap gap-8 justify-center mt-5">
                {/* Contenu principal */}
                {filteredSensors.map((sensor, index) => (
                    <PeriodSensors
                        key={index}
                        _id={sensor._id}
                        sensor_id={sensor.sensor_id}
                        name={sensor.name}
                        room={sensor.room}
                        status={sensor.status}
                        last_value={sensor.last_value}
                        unit={sensor.unit}
                    />
                ))}
            </main>
        </div>
    );
};

export default Home;
