import React, {useEffect, useState} from 'react';
import PeriodSensors from '../components/PeriodSensors';
import axios from 'axios';
import {Sensor} from "../models/sensor.ts";
import {Bounce, toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {useNavigate} from 'react-router-dom';

const Home: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]); // Tous les capteurs récupérés
    const [filteredSensors, setFilteredSensors] = useState<Sensor[]>([]); // Capteurs filtrés
    const [searchTerm, setSearchTerm] = useState<string>(""); // Barre de recherche
    const [selectedRoom, setSelectedRoom] = useState<string>(""); // Filtre par pièce
    const [rooms, setRooms] = useState<string[]>([]); // Liste des pièces disponibles 

    const navigate = useNavigate();

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
                                    unit: value ? value.unit : null,
                                    type: value ? value.type : null
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

        // Filtrer par pièce
        if (selectedRoom) {
            filtered = filtered.filter(sensor => sensor.room === selectedRoom);
        }

        // Trie par statut
        filtered = filtered.sort((a, b) => a.status.localeCompare(b.status));

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
                        // Vérifie si le capteur existe déjà
                        const existingSensor = sensors.find(sensor => sensor.sensor_id === updatedSensor.sensor_id);
                        if (!existingSensor) {
                            // Ajouter le nouveau capteur
                            fetchSensors();
                        } else {
                            // Met à jour le statut du capteur
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
                        }
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

                        if (updatedSensor.type === 'event' && updatedSensor.value) {
                            console.log('Event received:', updatedSensor.value);
                            const foundSensor = sensors.find(sensor => sensor.sensor_id === updatedSensor.sensor_id);
                            const message = foundSensor?.name + ": " + updatedSensor.value
                            toast.warning(message, {
                                position: "top-right",
                                hideProgressBar: true,
                                autoClose: false, // Le toast reste ouvert
                                closeOnClick: true, // Se ferme quand on clique dessus
                                pauseOnHover: true,
                                draggable: true,
                                theme: "colored",
                                transition: Bounce,
                                toastId: updatedSensor.sensor_id, // Identifiant unique basé sur le capteur
                                onClick: () => navigate(`/sensors/${updatedSensor.sensor_id}`)
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur lors du traitement des données WebSocket :', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        // Fermer la connexion WebSocket lors du démontage
        return () => {
            ws.close();
        };
    }, [sensors]);


    // Mettre à jour les capteurs filtrés à chaque modification des filtres
    useEffect(() => {
        applyFilters();
    }, [searchTerm, selectedRoom, sensors]);

    // Charger les capteurs au montage du composant
    useEffect(() => {
        fetchSensors();
    }, []);

    return (
        <div>
            {/* Search and Filter Section */}
            <div className="w-full px-6 py-4">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                    {/* Search Bar */}
                    <div className="flex-grow mt-7">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full px-4 py-3 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filter by Room */}
                    <div className="flex-grow">
                        <label htmlFor="roomFilter" className="block text-sm mb-2 text-gray-100">Emplacement :</label>
                        <select
                            id="roomFilter"
                            className="w-full px-4 py-3 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            value={selectedRoom}
                            onChange={(e) => setSelectedRoom(e.target.value)}
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
                        type={sensor.type}

                    />
                ))}
            </main>

            <div>
                <ToastContainer
                    position="top-right"
                    autoClose={false}
                    hideProgressBar={true}
                    newestOnTop={false}
                    closeOnClick={false}
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                    transition={Bounce}
                />
            </div>

        </div>
    );
};

export default Home;
