import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Sensor} from "../models/sensor.ts";
import axios from "axios";
import {Line} from "react-chartjs-2";
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

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

const SensorDetails: React.FC = () => {
    const {id} = useParams(); // Récupérer l'ID du capteur depuis l'URL
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

                    setStartDate(oldestDate.toISOString().slice(0, 19)); // Format for datetime-local
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
                        setSensor(res.data); // Met à jour l'état avec la réponse
                        setIsEditable(false); // Désactiver la modification
                        console.log("Capteur mis à jour avec succès :", res.data);
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

            <h1 className="text-2xl font-bold text-white mt-7">Détails du Capteur
                : {sensor?.name || "Chargement..."}</h1>

            {/* Formulaire pour modifier les détails du capteur */}
            <form
                className="mt-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    saveSensor(); // Appel de l'API PUT lors de la soumission
                }}
            >
                <label htmlFor="name" className="block text-sm font-medium text-gray-100">
                    Nom
                </label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    className="mt-1 p-2 rounded-lg w-full bg-gray-800 border border-transparent text-gray-100"
                    value={updatedSensor?.name || ""}
                    onChange={handleChange}
                    disabled={!isEditable}
                />

                <label htmlFor="room" className="block text-sm font-medium text-gray-100 mt-4">
                    Pièce
                </label>
                <input
                    type="text"
                    name="room"
                    id="room"
                    className="mt-1 p-2 rounded-lg w-full bg-gray-800 border border-transparent text-gray-100"
                    value={updatedSensor?.room || ""}
                    onChange={handleChange}
                    disabled={!isEditable}
                />

                {/* Boutons d'actions */}
                <div className="mt-6 flex space-x-4">
                    <button
                        type="button"
                        className="bg-blue-500 text-white p-2 rounded-lg cursor-pointer"
                        onClick={() => setIsEditable(!isEditable)} // Activer/désactiver la modification
                    >
                        {isEditable ? "Annuler" : "Modifier"}
                    </button>

                    {isEditable && (
                        <button
                            type="submit"
                            className="bg-green-500 text-white p-2 rounded-lg cursor-pointer"
                        >
                            Enregistrer
                        </button>
                    )}
                </div>
            </form>

            {/* Tableau + Graphique en ligne */}
            <div className="flex space-x-4 mt-6">
                <div>
                    <label className="text-white">Date de début :</label>
                    <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="ml-2 p-2 rounded-md bg-gray-700 text-white"
                    />
                </div>
                <div>
                    <label className="text-white">Date de fin :</label>
                    <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="ml-2 p-2 rounded-md bg-gray-700 text-white"
                    />
                </div>
            </div>

            <div className="flex mt-8 space-x-8">
                <div className="flex-1 bg-gray-800 p-4 rounded-lg overflow-y-auto max-h-96">
                    <h2 className="text-xl font-bold text-white mb-4">Historique des Valeurs</h2>
                    <table className="w-full text-left text-gray-100">
                        <thead>
                        <tr>
                            <th className="border-b border-gray-700 p-2">Date</th>
                            <th className="border-b border-gray-700 p-2">Valeur</th>
                            <th className="border-b border-gray-700 p-2">Unité</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredHistory.map((entry, index) => (
                            <tr key={index}>
                                <td className="p-2 border-b border-gray-700">
                                    {new Date(entry.timestamp * 1000).toLocaleString()}
                                </td>
                                <td className="p-2 border-b border-gray-700">{entry.value}</td>
                                <td className="p-2 border-b border-gray-700">{entry.unit}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex-1">
                    <div className="bg-gray-800 p-4 rounded-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Graphique</h2>
                        <div style={{height: "300px", width: "100%"}}>
                            <Line data={chartData} options={chartOptions}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SensorDetails;