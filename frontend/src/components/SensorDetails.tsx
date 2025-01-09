import React from "react";
import { useParams } from "react-router-dom";

const SensorDetails: React.FC = () => {
  const { id } = useParams(); // Récupérer l'ID du capteur depuis l'URL

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Détails du Capteur</h1>
      <p>ID du capteur : {id}</p>
      {/* Ajouter ici d'autres informations ou requêtes API pour obtenir les détails */}

      heeelo
    </div>
  );
};

export default SensorDetails;
