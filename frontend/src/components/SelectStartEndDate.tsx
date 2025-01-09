import React from "react";

interface SelectStartEndDateProps {
    startDate: string;
    endDate: string;
    setStartDate: (value: string) => void;
    setEndDate: (value: string) => void;
}

const SelectStartEndDate: React.FC<SelectStartEndDateProps> = ({
                                                                   startDate,
                                                                   endDate,
                                                                   setStartDate,
                                                                   setEndDate,
                                                               }) => {
    return (
        <div className="flex space-x-4 mt-6 ">
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
    );
};

export default SelectStartEndDate;
