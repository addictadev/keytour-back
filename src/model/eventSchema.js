const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., "14:30"
  status: { type: String, enum: ['scheduled', 'completed'], default: 'scheduled' }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
