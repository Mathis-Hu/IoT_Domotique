export interface Sensor {
    _id: string;
    sensor_id: string;
    name: string;
    room: string;
    status: string;
    last_value: number;
    unit: string;
    type: string;
}