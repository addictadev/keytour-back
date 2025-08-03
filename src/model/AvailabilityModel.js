const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  tour: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true }, // Reference to the Tour
  dates: [{ type: Date, required: true }], // Array of dates for availability
  room_types: [
    {
      name: { type: String, required: true }, // Room type (e.g., 'Standard Room', 'Deluxe Room')
      price: { type: Number }, // Room price for the specific dates
      netprice: { type: Number, required: true }, // Net price for the specific dates
      occupancychildren: { type: Number, required: true }, // Children occupancy for these dates
      occupancyadult: { type: Number, required: true }, // Adult occupancy for these dates
    }
  ],
  discounts: [
    {
      min_users: { type: Number, required: true }, // Minimum users for discount
      discount_percentage: { type: Number, required: true }, // Discount percentage
    }
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Pre-save hook to calculate room prices based on vendor's commission
availabilitySchema.pre('save', async function (next) {
  const availability = this;

  // Fetch the tour details to get the vendor's commission
  const tour = await mongoose.model('Tour').findById(availability.tour).populate('vendor');
  const vendorCommission = tour?.vendor?.commission || 15; // Default 15% commission
  console.log(
    vendorCommission,"vendorCommission"
)
  // Adjust the room price based on the vendor's commission
  availability.room_types.forEach((room) => {
    console.log(room.netprice)
    console.log(
        vendorCommission,"vendorCommission"
    )

    room.price = parseInt(room.netprice) + parseInt(room.netprice) * (vendorCommission / 100);
  });

  next();
});

const Availability = mongoose.model('Availability', availabilitySchema);
module.exports = Availability;
