import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Sensor} from "../models/sensor.ts";
import axios from "axios";

const SensorDetails: React.FC = () => {
    const {id} = useParams(); // Récupérer l'ID du capteur depuis l'URL
    const navigate = useNavigate();

    const [sensor, setSensor] = useState<Sensor | null>(null); // État pour le capteur
    const [isEditable, setIsEditable] = useState(false); // État pour activer/désactiver la modification
    const [updatedSensor, setUpdatedSensor] = useState<Sensor | null>(null); // État pour les modifications

    // Récupérer les détails du capteur
    const fetchSensor = () => {
        axios.get(`http://localhost:3000/api/sensors/${id}`)
            .then(res => {
                if (res.status === 200) {
                    setSensor(res.data);
                    setUpdatedSensor(res.data); // Initialiser les valeurs modifiables
                } else {
                    console.error("Erreur lors de l'appel : ", res);
                }
            })
            .catch(error => {
                console.error("Erreur lors de l'appel : ", error);
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
        fetchSensor();
    }, []);

    // Gérer les changements dans les champs du formulaire
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (updatedSensor) {
            setUpdatedSensor({
                ...updatedSensor,
                [e.target.name]: e.target.value,
            });
        }
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

            <h1 className="text-2xl font-bold text-white mt-7">Détails du Capteur</h1>

            <form
                className="mt-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    saveSensor(); // Appel de l'API PUT lors de la soumission
                }}
            >
                <input type="hidden" name="sensor_id" value={sensor?.sensor_id}/>

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
        </div>
    );
};

export default SensorDetails;
