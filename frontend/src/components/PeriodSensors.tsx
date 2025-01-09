import React from "react";
import { useNavigate } from "react-router-dom";

interface SensorProps {
  _id?: string;
  sensor_id?: string;
  name?: string;
  room?: string;
  status?: string;
  topic?: string;
  type?: string;
  value?: number | string;
  unit?: string;
}

const PeriodSensors: React.FC<SensorProps> = ({
  _id = "Non défini",
  name = "Sans nom",
  room = "Non attribuée",
  status = "indéterminé",
  value = "Non défini",
  unit = "Non défini",
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (_id) {
      navigate(`/sensor/${_id}`); // Redirection vers la page des détails
    }
  };

  return (
    <div
      className="bg-blue-950 p-6 rounded-lg shadow-lg max-w-sm border border-transparent text-center relative cursor-pointer"
      onClick={handleClick}
    >
      <h1 className="text-xl font-semibold mb-4 text-gray-100">{name}</h1>
      <div className="flex flex-col items-center justify-center mb-4">
        <span className="text-5xl font-bold text-gray-100">
          {value}
          <span className="text-2xl text-gray-100"> {unit}</span>
        </span>
      </div>
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

export default PeriodSensors;
