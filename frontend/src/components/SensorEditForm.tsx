import React from "react";

interface SensorEditFormProps {
    updatedSensor: { name: string; room: string } | null;
    isEditable: boolean;
    setIsEditable: (value: boolean) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saveSensor: () => void;
}

const SensorEditForm: React.FC<SensorEditFormProps> = ({
                                                           updatedSensor,
                                                           isEditable,
                                                           setIsEditable,
                                                           handleChange,
                                                           saveSensor,
                                                       }) => {
    return (
        <form
            className="mt-6"
            onSubmit={(e) => {
                e.preventDefault();
                saveSensor();
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
                    onClick={() => setIsEditable(!isEditable)}
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
    );
};

export default SensorEditForm;
