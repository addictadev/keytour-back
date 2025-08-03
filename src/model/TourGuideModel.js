const mongoose = require('mongoose');


const tourGuideSchema = new mongoose.Schema({
    image: { type: String, required: true }, // Path to the cover image
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
      created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

tourGuideSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const TourGuide = mongoose.model('TourGuide', tourGuideSchema);

module.exports = TourGuide;
