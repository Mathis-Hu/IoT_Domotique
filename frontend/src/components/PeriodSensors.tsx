import React from "react";
import {useNavigate} from "react-router-dom";
import {Sensor} from "../models/sensor.ts";
import SensorStatus from "./SensorStatus.tsx";

// Déclarer que le composant attend un objet contenant les propriétés de Sensor
interface SensorProps extends Sensor {
}

const PeriodSensors: React.FC<SensorProps> = ({
                                                  sensor_id,
                                                  name,
                                                  room,
                                                  status,
                                                  last_value,
                                                  unit,
                                              }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/sensors/${sensor_id}`);
    };

    return (
        <div
            className="bg-blue-950 p-6 rounded-lg shadow-lg max-w-sm border border-transparent text-center relative cursor-pointer min-w-64"
            onClick={handleClick}>
            <h1 className="text-xl font-semibold mb-4 text-gray-100">{name}</h1>
            <div className="flex flex-col items-center justify-center mb-4">
                <span className="text-5xl font-bold text-gray-100">
                  {last_value}
                    <span className="text-2xl text-gray-100">{unit}</span>
                </span>
            </div>
            <div className="mt-4">
                <p className="text-gray-100 text-xl mb-1">{room}</p>
            </div>

            <SensorStatus status={status || "offline"}
                          className="absolute bottom-4 left-4 flex items-center space-x-2"/>

        </div>
    );
};

export default PeriodSensors;
