import React from 'react';


interface SensorProps {
    _id?: string; 
    sensor_id?: string;
    name?: string;
    room?: string;
    status?: string;
    topic?: string;
    type?: string;
    value?: GLfloat;
   
  }

const EventSensors: React.FC<SensorProps> = ({
  name = "Sans nom",
  room = "Non attribuée",
  status = "indéterminé",
  value = "Non défini",
  
}) => {
  return (
    <div className="bg-blue-950 p-6 rounded-lg shadow-lg max-w-sm border border-transparent text-center relative">
      {/* Indicateur online/offline */}
      

      {/* Titre */}
      <h1 className="text-xl font-semibold mb-4 text-gray-100 ">{name}</h1>

      {/* Valeur centrale */}
      <div className="flex flex-col items-center justify-center mb-4">
        <span className="text-5xl font-bold text-gray-100">
          {value}
        </span>
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-4">
        <p className="text-gray-100 text-sm mb-1">{room}</p>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center space-x-2">
        <span
          className={`w-3 h-3 rounded-full ${
            status === "connected" ? "bg-green-500" : "bg-red-500"
          }`}
        ></span>
        <span className="text-sm font-medium text-gray-100">
          {status === "connected" ? "Online" : "Offline"}
        </span>
      </div>
    </div>
  );
};
export default EventSensors;
