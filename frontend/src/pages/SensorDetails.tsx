import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sensor } from "../models/sensor.ts";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from "chart.js";
import SensorEditForm from "../components/SensorEditForm.tsx";
import SelectStartEndDate from "../components/SelectStartEndDate.tsx";
import SensorHistoryTable from "../components/SensorHistoryTable.tsx";
import SensorStatus from "../components/SensorStatus.tsx";

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

const SensorDetails: React.FC = () => {
    const { id } = useParams(); // Récupérer l'ID du capteur depuis l'URL
    const navigate = useNavigate(); // Hook pour naviguer entre les pages

    const [sensor, setSensor] = useState<Sensor | null>(null); // État pour stocker les détails du capteur
    const [isEditable, setIsEditable] = useState(false); // État pour activer/désactiver la modification
    const [updatedSensor, setUpdatedSensor] = useState<Sensor | null>(null); // État pour les modifications
    const [history, setHistory] = useState<{ timestamp: number; value: number; unit: string }[]>([]); // Historique des valeurs
    const [filteredHistory, setFilteredHistory] = useState<{ timestamp: number; value: number; unit: string }[]>([]); // Historique filtré

    const [startDate, setStartDate] = useState<string>(""); // Date de début pour le filtre
    const [endDate, setEndDate] = useState<string>(""); // Date de fin pour le filtre

    // Récupérer les détails du capteur
    const fetchSensor = () => {
        axios.get(`http://localhost:3000/api/sensors/${id}`)
            .then(res => {
                if (res.status === 200) {
                    setSensor(res.data); // Stocker les détails du capteur
                    setUpdatedSensor(res.data); // Initialiser les valeurs modifiables
                } else {
                    console.error("Erreur lors de l'appel : ", res);
                }
            })
            .catch(error => {
                console.error("Erreur lors de l'appel : ", error);
            });
    };

    // Récupérer l'historique du capteur
    const fetchHistory = () => {
        axios.get(`http://localhost:3000/api/sensors/${id}/history`)
            .then(res => {
                if (res.status === 200) {
                    const data = res.data.map((entry: any) => ({
                        timestamp: entry.timestamp,
                        value: entry.value,
                        unit: entry.unit,
                    }));
                    setHistory(data);
                    setFilteredHistory(data);

                    const timestamps = data.map((entry: { timestamp: number; }) => entry.timestamp * 1000);
                    const oldestDate = new Date(Math.min(...timestamps));
                    const latestDate = new Date(Math.max(...timestamps));

                    //setstartdate with 1 hour added
                    oldestDate.setHours(oldestDate.getHours() + 1);
                    setStartDate(oldestDate.toISOString().slice(0, 19)); // Format for datetime-local
                    latestDate.setHours(latestDate.getHours() + 1);
                    setEndDate(latestDate.toISOString().slice(0, 19));
                } else {
                    console.error("Erreur lors de l'appel à l'historique : ", res);
                }
            })
            .catch(error => {
                console.error("Erreur lors de l'appel à l'historique : ", error);
            });
    };

    // Envoyer les modifications via un PUT
    const saveSensor = () => {
        if (updatedSensor) {
            axios.put(`http://localhost:3000/api/sensors/${id}`, updatedSensor)
                .then(res => {
                    if (res.status === 200) {
                        fetchSensor(); // Récupérer les détails mis à jour
                        setIsEditable(false); // Désactiver la modification
                    } else {
                        console.error("Erreur lors de l'appel PUT : ", res);
                    }
                })
                .catch(error => {
                    console.error("Erreur lors de l'appel PUT : ", error);
                });
        }
    };

    useEffect(() => {
        fetchSensor(); // Récupérer les détails du capteur
        fetchHistory(); // Récupérer l'historique du capteur
    }, []);

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

    // Gérer les changements dans les champs du formulaire
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (updatedSensor) {
            setUpdatedSensor({
                ...updatedSensor,
                [e.target.name]: e.target.value,
            });
        }
    };

    // Fonction pour appliquer une moyenne mobile
    const movingAverage = (data: number[], windowSize: number) => {
        return data.map((_, index, arr) => {
            const start = Math.max(0, index - windowSize + 1);
            const subset = arr.slice(start, index + 1);
            const sum = subset.reduce((a, b) => a + b, 0);
            return sum / subset.length;
        });
    };

    // Utilisation dans le graphique
    const smoothedValues = movingAverage(filteredHistory.map(entry => entry.value), 5); // Moyenne mobile sur 5 points
    const chartData = {
        labels: filteredHistory.map(entry =>
            new Date(entry.timestamp * 1000).toLocaleString()
        ),
        datasets: [
            {
                label: `Valeur (${filteredHistory[0]?.unit || ""})`,
                data: smoothedValues,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Permet d'ajuster la taille
        plugins: {
            legend: {
                position: "top" as const,
            },
        },
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

                    if (updatedSensor.sensor_id === id) {
                        if (parsedData.topic === 'ping') {
                            // Met à jour le status du capteur
                            // {topic: 'ping', message: '{"sensor_id": "6d162c67e4e2", "status": "disconnec…re", "type": "periodic", "timestamp": 1736452422}'}
                            setSensor((prevSensor) => {
                                if (prevSensor) {
                                    return {
                                        ...prevSensor,
                                        status: updatedSensor.status,
                                    };
                                }
                                return prevSensor;
                            });
                            return;
                        } else {
                            // Ajout de la nouvelle valeur à l'historique
                            const newHistoryEntry = {
                                timestamp: updatedSensor.timestamp,
                                value: updatedSensor.value,
                                unit: updatedSensor.unit,
                            };

                            setHistory((prevHistory) => [...prevHistory, newHistoryEntry]);
                            setFilteredHistory((prevFilteredHistory) => [...prevFilteredHistory, newHistoryEntry]);

                            // Mise à jour du filtre de date de fin
                            const newTimestamp = updatedSensor.timestamp * 1000;
                            const newDate = new Date(newTimestamp);
                            newDate.setHours(newDate.getHours() + 1);
                            setEndDate(newDate.toISOString().slice(0, 19));

                            return;
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
    }, [id]);


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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Retour
            </button>

            <h1 className="text-2xl font-bold text-white mt-7">Détails du Capteur
                : {sensor?.name || "Chargement..."}</h1>

            <SensorStatus status={sensor?.status || "offline"}
                className="left-4 flex items-center space-x-2" />

            {/* Formulaire de modification */}
            <SensorEditForm
                updatedSensor={updatedSensor}
                isEditable={isEditable}
                setIsEditable={setIsEditable}
                handleChange={handleChange}
                saveSensor={saveSensor}
            />

            {/* Tableau + Graphique en ligne */}
            <SelectStartEndDate
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
            />


            <div className="flex lg:flex-nowrap flex-wrap mt-8 gap-8">
                <div className="w-full lg:w-1/2">
                    <SensorHistoryTable filteredHistory={filteredHistory} />
                </div>

                {sensor?.type === "periodic" && (
                    <div className="w-full lg:w-1/2">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-xl font-bold text-white mb-4">Graphique</h2>
                            <div style={{ height: "300px", width: "100%" }}>
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SensorDetails;