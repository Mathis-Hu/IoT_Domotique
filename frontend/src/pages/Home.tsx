import React, { useState, useEffect }  from 'react';
import EventSensors from '../components/EventSensors';
import PeriodSensors from '../components/PeriodSensors';
import axios from 'axios';


const Home: React.FC = () => {
    const sensorData = {
        _id: "677fd664f97f0260ad45e986",
        sensor_id: "09b40150279a",
        name: "Nouveau capteur (humidity)",
        room: "Salle 101",
        status: "connected",
    };

    const sensorData2 = {
        _id: "677fd8fdf97f0260ad45ed15",
        topic: "humidity",
        sensor_id: "09b40150279a",
        type: "periodic",
        value: 44.06,
        unit: "% HR",
        timestamp: 1736431869,
        qos: 0,
    };


    const [sensorDaata, setSensorDaata ] = useState([]);

    const fetchSensors = () => {
        axios.get('http://localhost:3000/api/sensors/all')
            .then(res => {
                if (res.status) {
                    setSensorDaata(res.data);
                    console.log(res);
                } else {
                    console.error(res);
                }
            })
            .catch(error => {
                console.error('Error fetching sensors:', error);
            });
    };

    fetchSensors();
    

    // Exemple de tableau pour plusieurs capteurs
    const sensors = Array(10).fill({
        ...sensorData,
        value: sensorData2.value,
        unit: sensorData2.unit,
    });

    return (
        <div className="relative w-full min-h-screen bg-gray-900 flex flex-col">
            <header className="w-full bg-gray-800 shadow-md px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-100">DomoDomo</h1>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <a href="#" className="text-gray-100 hover:text-gray-800">About</a>
                        </li>
                    </ul>
                </nav>
            </header>

            {/* Barre de recherche et filtre */}
            <div className="w-full px-6 py-4">
                <div className="flex items-center space-x-4">
                    {/* Barre de recherche */}
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-1/3 px-4 py-3 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                    {/* Menu déroulant pour filtrer Types */}
                    <h1 className="text-gray-100">Types : </h1>
                    <select
                        className="w-1/4 px-6 py-3 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        <option value="">Tous</option>
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                        <option value="option3">Option 3</option>
                    </select>

                    {/* Menu déroulant pour filtrer Pièce */}
                    <h1 className="text-gray-100">Pièces : </h1>
                    <select
                        className="w-1/4 px-6 py-3 rounded-md bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        <option value="">Tous</option>
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                        <option value="option3">Option 3</option>
                    </select>
                </div>
            </div>

            <main className="flex flex-wrap gap-8 justify-center mt-5">
                {/* Contenu principal */}
                {sensors.map((sensor, index) => (
                    <PeriodSensors
                        key={index}
                        name={sensor.name}
                        room={sensor.room}
                        status={sensor.status}
                        value={sensor.value}
                        unit={sensor.unit}
                    />
                ))}

                <EventSensors />
            </main>
        </div>
    );
};

export default Home;
