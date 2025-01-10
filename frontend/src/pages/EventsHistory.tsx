import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import SelectStartEndDate from "../components/SelectStartEndDate.tsx";
import {Bounce, ToastContainer} from 'react-toastify';
import EventsHistoryTable from "../components/EventsHistoryTable.tsx";
import {Sensor} from "../models/sensor.ts";
import axios from "axios";

const EventsHistory: React.FC = () => {
    const {id} = useParams(); // Récupérer l'ID du capteur depuis l'URL
    const navigate = useNavigate(); // Hook pour naviguer entre les pages

    const [sensors, setSensors] = useState<Sensor[]>([]); // Tous les capteurs récupérés

    const [history, setHistory] = useState<{
        sensor_id: string;
        sensor_name: string;
        sensor_room: string;
        value: string | number;
        timestamp: number;
    }[]>([]); // Historique des valeurs
    const [filteredHistory, setFilteredHistory] = useState<{
        sensor_id: string;
        sensor_name: string;
        sensor_room: string;
        value: string | number;
        timestamp: number;
    }[]>([]); // Historique filtré

    const [startDate, setStartDate] = useState<string>(""); // Date de début pour le filtre
    const [endDate, setEndDate] = useState<string>(""); // Date de fin pour le filtre

    const [isLive, setIsLive] = useState<boolean>(true); // `isLive` géré par React

    // Récupérer les capteurs avec leurs dernières valeurs
    const fetchSensors = () => {
        axios.get('http://localhost:3000/api/sensors/all')
            .then(sensorsResponse => {
                if (sensorsResponse.status === 200) {
                    console.log("Capteurs récupérés : ", sensorsResponse.data);
                    setSensors(sensorsResponse.data);
                } else {
                    console.error("Erreur lors de l'appel : ", sensorsResponse);
                }
            })
            .catch(error => {
                console.error("Erreur lors de l'appel : ", error);
            });
    };

    const fetchHistory = () => {
        // Récupérer l'historique des alertes depuis l'API
        axios.get(`http://localhost:3000/api/sensors/events/history`)
            .then((response) => {
                // Enrichir les données de l'historique avec les noms et pièces des capteurs
                const enrichedHistory = response.data.map((entry: any) => {
                    const sensor = sensors.find((sensor) => sensor.sensor_id === entry.sensor_id);
                    return {
                        ...entry,
                        sensor_name: sensor ? sensor.name : 'Inconnu',
                        sensor_room: sensor ? sensor.room : 'Inconnu',
                    };
                });

                setHistory(enrichedHistory);
                setFilteredHistory(enrichedHistory);

                const timestamps = enrichedHistory.map((entry: { timestamp: number; }) => entry.timestamp * 1000);
                const oldestDate = new Date(Math.min(...timestamps));
                const latestDate = new Date(Math.max(...timestamps));

                //setstartdate with 1 hour added
                oldestDate.setHours(oldestDate.getHours() + 1);
                setStartDate(oldestDate.toISOString().slice(0, 19)); // Format for datetime-local
                latestDate.setHours(latestDate.getHours() + 1);
                setEndDate(latestDate.toISOString().slice(0, 19));
            })
            .catch((error) => {
                console.error('Erreur lors de la récupération de l\'historique :', error);
            });
    }

    useEffect(() => {
        fetchSensors();
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [sensors]);

    useEffect(() => {
        if (startDate && endDate) {
            const startTimestamp = new Date(startDate).getTime(); // En millisecondes
            const endTimestamp = new Date(endDate).getTime(); // En millisecondes

            const filtered = history.filter(
                (entry) => entry.timestamp * 1000 >= startTimestamp && entry.timestamp * 1000 <= endTimestamp
            );

            setFilteredHistory(filtered);
        }
    }, [startDate, endDate, history]);

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

                    if (parsedData.topic !== 'ping' && updatedSensor.type === 'event' && isLive) {
                        // Enrichir les données de l'historique avec les noms et pièces des capteurs
                        const sensor = sensors.find((sensor) => sensor.sensor_id === updatedSensor.sensor_id);
                        const enrichedSensor = {
                            ...updatedSensor,
                            sensor_name: sensor ? sensor.name : 'Inconnu',
                            sensor_room: sensor ? sensor.room : 'Inconnu',
                        };

                        setHistory((prevHistory) => [...prevHistory, enrichedSensor]);
                        setFilteredHistory((prevFilteredHistory) => [...prevFilteredHistory, enrichedSensor]);

                        // Mise à jour du filtre de date de fin
                        const newTimestamp = updatedSensor.timestamp * 1000;
                        const newDate = new Date(newTimestamp);
                        newDate.setHours(newDate.getHours() + 1);
                        setEndDate(newDate.toISOString().slice(0, 19));
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
    }, [id, isLive, sensors]);

    return (
        <div className="p-6">
            {/* Flèche de retour */}
            <button
                onClick={() => navigate("/")} // Redirige vers la page d'accueil
                className="flex items-center text-gray-100 bg-gray-800 p-2 rounded-md hover:bg-gray-700"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
                Retour
            </button>


            {/* Tableau + Graphique en ligne */}
            <SelectStartEndDate
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                isLive={isLive}
                setIsLive={setIsLive}
            />


            <div className="flex lg:flex-nowrap flex-wrap  mt-8 gap-8">
                <div className="w-full flex-grow lg:w-1/2">
                    <EventsHistoryTable filteredHistory={filteredHistory}/>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
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
    );
};

export default EventsHistory;