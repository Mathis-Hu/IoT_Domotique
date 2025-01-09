import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  topic: String,
  payload: String,
  qos: Number,
  sensor_id: String,    // <-- identifiant unique du capteur
}, {
  timestamps: true
});

export default mongoose.model('Message', messageSchema);
