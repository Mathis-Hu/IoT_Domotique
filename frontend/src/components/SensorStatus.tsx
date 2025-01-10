import React from "react";

interface SensorStatusProps {
    status: string;
    className?: string;
}

const SensorStatus: React.FC<SensorStatusProps> = ({status, className}) => {
    return (
        <div className={className ? className : ""}>
                <span
                    className={`w-3 h-3 rounded-full ${
                        status === "connected" ? "bg-green-500" : "bg-red-500"
                    }`}
                ></span>
            <span className="text-sm font-medium text-gray-100">
                  {status === "connected" ? "En ligne" : "Hors ligne"}
                </span>
        </div>
    );
}

export default SensorStatus;