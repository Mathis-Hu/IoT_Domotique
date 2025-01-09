import React from "react";

interface SensorHistoryTableProps {
    filteredHistory: {
        timestamp: number;
        value: string | number;
        unit: string;
    }[];
}

const SensorHistoryTable: React.FC<SensorHistoryTableProps> = ({filteredHistory}) => {
    return (
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
                {filteredHistory
                    .slice()
                    .sort((a, b) => b.timestamp - a.timestamp) // Tri décroissant par timestamp
                    .map((entry, index) => (
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
    );
};

export default SensorHistoryTable;