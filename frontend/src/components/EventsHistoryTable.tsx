import React from "react";

interface EventsHistoryTableProps {
    filteredHistory: {
        sensor_id: string;
        sensor_name: string;
        sensor_room: string;
        value: string | number;
        timestamp: number;
    }[];
}

const EventsHistoryTable: React.FC<EventsHistoryTableProps> = ({filteredHistory}) => {
    return (
        <div className="flex-1 bg-gray-800  p-4 rounded-lg overflow-y-auto max-h-96">
            <h2 className="text-xl font-bold text-white mb-4">Historique des alertes</h2>
            <table className="w-full text-left text-gray-100">
                <thead>
                <tr>
                    <th className="border-b border-gray-700 p-2">Date</th>
                    <th className="border-b border-gray-700 p-2">Nom</th>
                    <th className="border-b border-gray-700 p-2">Pièce</th>
                    <th className="border-b border-gray-700 p-2">Valeur</th>
                </tr>
                </thead>
                <tbody>
                {filteredHistory
                    .slice()
                    .sort((a, b) => b.timestamp - a.timestamp) // Tri décroissant par timestamp
                    .map((entry, index) => (
                        <tr key={index}>
                            <td className="p-2 border-b border-gray-700">
                                {new Date(entry.timestamp * 1000).toLocaleString()}
                            </td>
                            <td className="p-2 border-b border-gray-700">{entry.sensor_name}</td>
                            <td className="p-2 border-b border-gray-700">{entry.sensor_room}</td>
                            <td className="p-2 border-b border-gray-700">{entry.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default EventsHistoryTable;