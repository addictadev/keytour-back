const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const tourSchema = new mongoose.Schema({
    title: { type: String, required: true },
    note: { type: String },

    destination: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Destination', 
        required: true 
    },
    tour_type: { type: String, enum: ['single-day', 'multi-day', 'activity', 'transfer'], required: true },
    image: { type: String, required: true },
    imagesthubnails: [{ type: String, required: true }],
    brief: {
 type: String, required: true },
    programdays: { type: Number },
    program: [{
        day: { type: Number },
        details: {
            type: String 
        },
        inclusions: [{ type: String }],
        exclusions: [{ type: String }]
    }],
    cancellation_policy: {
        type: String, required: true 
    },
    availability: {
        from: { type: Date, required: true },
        to: { type: Date, required: true },
        offDays: [{ 
            type: Date, 
            // validate: {
            //     validator: function(value) {
            //         return value.every(offDay => offDay >= this.availability.from && offDay <= this.availability.to);
            //     },
            //     message: 'Off days must be within the availability period'
            // }
        }]
    },
    languages: [{ type: String, required: true }],
    includes: [{
        type: String, required: true }
    ],
    excludes: [{ 
        type: String, required: true 
        
    }],
    capacity: { type: String, enum: ['pending', 'full'], default: 'pending' },
    room_types: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            default: () => new ObjectId() // Generate new ObjectId correctly
        },
        name: {
             type: String, required: true 
        },
        price: { type: Number},
        netprice: { type: Number, required: true ,min: 0},
        occupancychildern: { type: Number, required: true }, 
        occupancyadult: { type: Number, required: true } 
    }],
    discounts: [{
        min_users: { type: Number, required: true },  // Minimum number of users required for discount
        discount_percentage: { type: Number, required: true },  // Discount as a percentage
    }],
    private: {
        type: Number, required: true 
    },
    shared: {
        type: Number, default: 0
    },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    ratings: {
        average: { type: Number, default: 0 }, 
        count: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected','cancelled'],
        default: 'pending'
    },
    wishlis: { type: Boolean, default: false, select: false }, 
    resend: { type: Boolean, default: false },
    cancelByVendor: { type: Boolean, default: false },

    availabilityToCancel: { type: Number, default: 0 },
    
    numberofresend: { type: Number },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});


tourSchema.virtual('AvailabilityDays', {
    ref: 'Availability',
    localField: '_id',
    foreignField: 'tour',
    justOne: false,
  });
// Pre-save hook to apply vendor's commission to room prices
tourSchema.pre('save', async function (next) {
    const tour = this;

    // Populate the vendor details to get the commission
    await tour.populate('vendor'); // No need for execPopulate()

    const vendorCommission = tour.vendor?.commission || 15; // Default commission if not provided

    // Update room prices based on vendor's commission
    tour.room_types.forEach(room => {
        
        room.price = parseInt(room.netprice) + (room.netprice * (vendorCommission/100));
    });

    // Set the updated_at timestamp
    tour.updated_at = Date.now();
    next();
});


// Virtual field to populate reviews
tourSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'tour',
    justOne: false
});


// Adding Indexes for efficient querying
tourSchema.index({ "availability.from": 1, "availability.to": 1 });

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'destination',
    }).populate({
        path: 'vendor',
        select:'name commission' // Add this to populate the vendor field
    });
    next();
});
// tourSchema.pre(/^find/, function(next) {
//     this.populate({
//         path: 'destination',
//     });
//     next();
// });

// Ensure virtual fields are serialized
tourSchema.set('toObject', { virtuals: true });
tourSchema.set('toJSON', { virtuals: true });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
