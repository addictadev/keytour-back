



// const mongoose = require('mongoose');
// const CustomError = require('../utils/customError');

// const bookingSchema = new mongoose.Schema({
//   tour: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Tour',
//     required: true,
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   vendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Vendor',
//   },
//   availability: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Availability', // Reference to Availability, if chosen
//   },
//   bookingDate: {
//     type: Date,
//     default: Date.now,
//   },
//   startDate: {
//     type: Date,
//     required: true,
//   },
//   endDate: {
//     type: Date,
//     required: true,
//   },
//   rooms: [
//     {
//       roomType: {
//         type: String,
//         required: true,
//       },
//       pricePerRoom: {
//         type: Number,
//         min: 0,
//         required: true,
//       },
//       quantity: {
//         type: Number,
//         min: 0,
//         required: true,
//       },
//     },
//   ],
//   numberOfAdults: {
//     type: Number,
//     required: true,
//   },
//   numberOfChildren: {
//     type: Number,
//     default: 0,
//   },
//   bookingType: {
//     type: String,
//     enum: ['private', 'shared'],
//     required: true,
//   },
//   totalPrice: {
//     type: Number,
//   },
//   language: {
//     type: String,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'confirmed', 'canceled'],
//     default: 'pending',
//   },
//   sessionId: {
//     type: String,
//   },
//   printurl: {
//     type: String,
//     default: 'https://keytor.com/Login_Web',
//   },
//   successIndicator: {
//     type: String,
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['unpaid', 'paid'],
//     default: 'unpaid',
//   },
//   created_at: { type: Date, default: Date.now },
//   updated_at: { type: Date, default: Date.now },
// });

// bookingSchema.pre('save', async function (next) {
//   const booking = this;

//   // Populate the tour and vendor
//   await booking.populate({
//     path: 'tour',
//     populate: {
//       path: 'vendor',
//       select: '_id name',
//     },
//   });

//   if (!booking.tour.vendor) {
//     return next(new CustomError('The tour does not have an associated vendor.', 400));
//   }

//   booking.vendor = booking.tour.vendor._id;

//   // Check if the tour is full
//   if (booking.tour.capacity === 'full') {
//     return next(new CustomError('The tour is full.', 400));
//   }

//   let roomTotal = 0;
// console.log(booking.availability)
//   if (booking.availability) {
//     // If availability ID is provided, fetch it
    
//     const Availability = mongoose.model('Availability');
// console.log("availability",Availability)

//     const availability = await Availability.findById(booking.availability);
// console.log(availability)
//     if (!availability) {
//       return next(new CustomError('Availability not found for the selected ID.', 400));
//     }

//     // Validate room types against availability
//     const availableRoomTypes = availability.room_types.map((room) => room.name);
//     const invalidRoomTypes = booking.rooms.filter(
//       (room) => !availableRoomTypes.includes(room.roomType)
//     );

//     if (invalidRoomTypes.length > 0) {
//       return next(
//         new CustomError(
//           `Invalid room types: ${invalidRoomTypes.map((room) => room.roomType).join(', ')}`,
//           400
//         )
//       );
//     }

//     // Calculate total price based on availability room prices
//     booking.rooms.forEach((room) => {
//       const availabilityRoom = availability.room_types.find(
//         (r) => r.name === room.roomType
//       );

//       const roomPrice = availabilityRoom.price * room.quantity;

//       // Apply availability discount
//       const discount = availability.discounts.find(
//         (d) => booking.numberOfAdults >= d.min_users
//       );
//       if (discount) {
//         const discountAmount = roomPrice * (discount.discount_percentage / 100);
//         roomPrice -= discountAmount;
//         console.log(`Applied availability discount for ${room.roomType}: ${discountAmount}`);
//       }

//       roomTotal += roomPrice;
//     });
//   } else {
//     // Fallback to tour room types
//     const availableRoomTypes = booking.tour.room_types.map((room) => room.name);
//     const invalidRoomTypes = booking.rooms.filter(
//       (room) => !availableRoomTypes.includes(room.roomType)
//     );

//     if (invalidRoomTypes.length > 0) {
//       return next(
//         new CustomError(
//           `Invalid room types: ${invalidRoomTypes.map((room) => room.roomType).join(', ')}`,
//           400
//         )
//       );
//     }

//     booking.rooms.forEach((room) => {
//       const tourRoom = booking.tour.room_types.find((r) => r.name === room.roomType);

//       const roomPrice = tourRoom.price * room.quantity;

//       // Apply tour discount
//       const discount = booking.tour.discounts.find(
//         (d) => booking.numberOfAdults >= d.min_users
//       );
//       if (discount) {
//         const discountAmount = roomPrice * (discount.discount_percentage / 100);
//         roomPrice -= discountAmount;
//         console.log(`Applied tour discount for ${room.roomType}: ${discountAmount}`);
//       }

//       roomTotal += roomPrice;
//     });
//   }

//   // Add private/shared booking fee
//   if (booking.bookingType === 'private') {
//     roomTotal += booking.tour.private;
//   } else if (booking.bookingType === 'shared') {
//     roomTotal += booking.tour.shared;
//   }

//   booking.totalPrice = roomTotal;

//   next();
// });









// const mongoose = require('mongoose');
// const CustomError = require('../utils/customError');
// const bookingSchema = new mongoose.Schema({
//   tour: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Tour',
//     required: true
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   vendor: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Vendor',
   
//   },
//   bookingDate: {
//     type: Date,
//     default: Date.now
//   },
//   startDate: {
//     type: Date,
//     required: true
//   },
//   endDate: {
//     type: Date,
//     required: true
//   },
//   rooms: [{
//     roomType: {
//       type: String,
//       required: true
//     },
//     pricePerRoom: {
//       type: Number,
//       min:0,
//       required: true
//     },
//     quantity: {
//       type: Number,
//       min:0,
//       required: true
//     }
//   }],
//   numberOfAdults: {
//     type: Number,
    
//   },
//   numberOfChildren: {
//     type: Number,
//     // required: true
//   },
//   bookingType: {
//     type: String,
//     enum: ['private', 'shared'],
//     required: true
//   },
//   totalPrice: {
//     type: Number
//   },
//   Language: {
//     type: String,
//     required: true


//   },
//   status: {
//     type: String,
//     enum: ['pending', 'confirmed', 'canceled'],
//     default: 'pending'
//   },
//   sessionId: {
//     type: String,
//   },
//   printurl: {
//     type: String,
//     default: 'https://keytor.com/Login_Web'
//   },
//   successIndicator: {
//     type: String,
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['unpaid', 'paid'],
//     default: 'unpaid'
//   },    created_at: { type: Date, default: Date.now },
//   updated_at: { type: Date, default: Date.now }
// });





// bookingSchema.pre('save', async function (next) {
//   const booking = this;

//   // Populate the tour to get vendor and room types, ensuring the vendor field is included
//   await booking.populate({
//     path: 'tour',
//     populate: {
//       path: 'vendor',
//       select: '_id name', // Add additional fields as needed
//     }
//   });

//   // Check if the tour has a vendor
//   if (!booking.tour.vendor) {
//     console.log(booking.tour)
//     return next(new Error('The tour does not have an associated vendor.'));
//   }

//   // Set the vendor ID from the tour
//   booking.vendor = booking.tour.vendor._id; // Ensure the vendor ID is set directly

//   // Verify that the vendor is set correctly
//   if (!booking.vendor) {
//     console.error('Booking vendor could not be set.');
//     return next(new Error('Failed to set the booking vendor.'));
//   } else {
//     console.log('Booking vendor set successfully:', booking.vendor);
//   }

//   // Check if the tour is full
//   if (booking.tour.capacity === 'full') {
//     console.log('Vendor associated with this booking:', booking.vendor);
//     return next(new Error('The tour is full.'));
//   }

//   // Check if room types in the booking exist in the tour
//   const availableRoomTypes = booking.tour.room_types.map(room => room.name);
//   const invalidRoomTypes = booking.rooms.filter(room => !availableRoomTypes.includes(room.roomType));

//   if (invalidRoomTypes.length > 0) {
//     return next(new Error(`Invalid room types: ${invalidRoomTypes.map(room => room.roomType).join(', ')}`));
//   }

//   // Calculate total price based on rooms with a conditional discount for adult room types
//   let roomTotal = 0;
//   booking.rooms.forEach((room,i) => {
//     // let roomPrice = room.pricePerRoom * room.quantity;
//     let roomPrice = booking.tour.room_types[i].price * room.quantity;


//     // Apply discount only for adult room types when it's a single-day tour
//     if (booking.tour.tour_type === 'single-day' && room.roomType.toLowerCase().includes('adult')) {
//       const discount = booking.tour.discounts.find(d => booking.numberOfAdults >= d.min_users);
//       if (discount) {
//         const discountAmount = roomPrice * (discount.discount_percentage / 100);
//         roomPrice -= discountAmount;  // Apply the discount
//         console.log(`Applied discount to roomType ${room.roomType}: ${discountAmount}`);
//       }
//     }

//     roomTotal += roomPrice;
//   });

//   console.log('Total after discount for single-day tour with adult rooms:', roomTotal);

//   // Add price for private or shared option
//   if (booking.bookingType === 'private') {
//     roomTotal += booking.tour.private;  // Add private price from the tour
//   } else if (booking.bookingType === 'shared') {
//     roomTotal += booking.tour.shared;  // Add shared price from the tour
//   }

//   // Set total price
//   booking.totalPrice = roomTotal;

//   next();
// });

// bookingSchema.pre(/^find/, function(next) {
//   this.populate({
//     path: 'tour',
//     select: 'title vendor room_types tour_type image private shared brief languages',
//   }).populate({
//     path: 'vendor',
//     select: 'name commission',
//   })

//   console.log("Query middleware running for:", this.getQuery());
//   next();
// });





const mongoose = require('mongoose');
const CustomError = require('../utils/customError');
const moment = require('moment');
const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
  },
  availability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Availability', // Reference to Availability, if chosen
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  rooms: [
    {
      roomType: {
        type: String,
        required: true,
      },
      pricePerRoom: {
        type: Number,
        min: 0,
        required: true,
      },
      quantity: {
        type: Number,
        min: 0,
        required: true,
      },
    },
  ],
  numberOfAdults: {
    type: Number,
    required: true,
  },
  numberOfChildren: {
    type: Number,
    default: 0,
  },
  bookingType: {
    type: String,
    enum: ['private', 'shared'],
    required: true,
  },
  totalPrice: {
    type: Number,
  },
  language: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'canceled', 'canceledbyvendor','full capacity'],
    default: 'pending',
  },
  sessionId: {
    type: String,
  },
  printurl: {
    type: String,
    default: 'https://keytor.com/Login_Web',
  },
  successIndicator: {
    type: String,
  },
  opentopaid: { type: Boolean, default: false },
  datetopiad: { type: Date },

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

bookingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'tour',
    select: 'title vendor room_types tour_type image private shared brief languages',
  }).populate({
    path: 'vendor',
    select: 'name commission',
  })

  // console.log("Query middleware running for:", this.getQuery());
  next();
});

bookingSchema.pre('save', async function (next) {
  const booking = this;

  // Populate the tour and vendor
  await booking.populate({
    path: 'tour',
    populate: {
      path: 'vendor',
      select: '_id name',
    },
  });




  if (!booking.tour.vendor) {
    return next(new CustomError('The tour does not have an associated vendor.', 400));
  }

  booking.vendor = booking.tour.vendor._id;

  // Check if the tour is full
  if (booking.tour.capacity === 'full') {
    return next(new CustomError('The tour is full.', 400));
  }







  if (!booking.tour) {
    return next(new CustomError('Tour not found.', 400));
  }

  const { availabilityToCancel, startDate: tourStartDate } = booking.tour;



  




  // if (availabilityToCancel && booking.startDate) {
  //   console.log('availabilityToCancel', availabilityToCancel);
  //   console.log('booking.startDate', booking.startDate);
    
  //   const currentDate = new Date();
  //   const diffInTime = booking.startDate.getTime() - currentDate.getTime();
  //   const diffInDays = diffInTime / (1000 * 3600 * 24); // Convert milliseconds to days
  //   console.log('diffInDays', diffInDays);
  //   console.log('diffInTime', diffInTime);

  //   console.log(diffInDays <= availabilityToCancel);

  //   // Check if the booking's start date is within the 'availabilityToCancel' window before the booking start date
  //   if (diffInDays <= availabilityToCancel) {
  //   console.log('aaaaaaaaaaaaaaaaaaaa', diffInTime);

  //     booking.opentopaid = true;  // Open payment if within the window
  //   } else {
  //     booking.opentopaid = false; // Close payment if outside the window
  //   }
  // }

  let roomTotal = 0;

  if (booking.availability) {
    // If availability ID is provided, fetch it
    const Availability = mongoose.model('Availability');
    const availability = await Availability.findById(booking.availability);

    if (!availability) {
      return next(new CustomError('Availability not found for the selected ID.', 400));
    }

    // Validate room types against availability
    const availableRoomTypes = availability.room_types.map((room) => room.name);
    const invalidRoomTypes = booking.rooms.filter(
      (room) => !availableRoomTypes.includes(room.roomType)
    );

    if (invalidRoomTypes.length > 0) {
      return next(
        new CustomError(
          `Invalid room types: ${invalidRoomTypes.map((room) => room.roomType).join(', ')}`,
          400
        )
      );
    }

    // Calculate total price based on availability room prices
    booking.rooms.forEach((room) => {
      const availabilityRoom = availability.room_types.find(
        (r) => r.name === room.roomType
      );

      let roomPrice = availabilityRoom.price * room.quantity;

      // Apply discount for "adult" room types based on quantity
      if (room.roomType.toLowerCase().includes('adult')) {
        const discount = availability.discounts.find(
          (d) => room.quantity >= d.min_users
        );
        if (discount) {
          const discountAmount = roomPrice * (discount.discount_percentage / 100);
          roomPrice -= discountAmount;
          console.log(
            `Applied availability discount for ${room.roomType}: ${discountAmount}`
          );
        }
      }

      roomTotal += parseInt(roomPrice);
    });
  } else {
    // Fallback to tour room types
    const availableRoomTypes = booking.tour.room_types.map((room) => room.name);
    const invalidRoomTypes = booking.rooms.filter(
      (room) => !availableRoomTypes.includes(room.roomType)
    );

    if (invalidRoomTypes.length > 0) {
      return next(
        new CustomError(
          `Invalid room types: ${invalidRoomTypes.map((room) => room.roomType).join(', ')}`,
          400
        )
      );
    }

    booking.rooms.forEach((room) => {
      const tourRoom = booking.tour.room_types.find((r) => r.name === room.roomType);

      let roomPrice = tourRoom.price * room.quantity;

      // Apply discount for "adult" room types based on quantity
      if (room.roomType.toLowerCase().includes('adult')) {
        const discount = booking.tour.discounts.find(
          (d) => room.quantity >= d.min_users
        );
        if (discount) {
          const discountAmount = roomPrice * (discount.discount_percentage / 100);
          roomPrice -= discountAmount;
          console.log(`Applied tour discount for ${room.roomType}: ${discountAmount}`);
        }
      }

      roomTotal += parseInt(roomPrice);
    });
  }

  // Add private/shared booking fee
  if (booking.bookingType === 'private') {
    roomTotal += booking.tour.private;
  } else if (booking.bookingType === 'shared') {
    roomTotal += booking.tour.shared;
  }

  booking.totalPrice = roomTotal;
  if (availabilityToCancel && booking.startDate) {
    console.log('availabilityToCancel:', availabilityToCancel);
    console.log('booking.startDate:', booking.startDate);
  
    const currentDate = new Date();  // Current date, the date when the booking is created
    const bookingStartDate = new Date(booking.startDate);  // Convert startDate to Date object
    
    // Calculate the date when payment should be open (subtract availabilityToCancel days from the start date)
    const paymentOpenDate = new Date(bookingStartDate);  // Create a new date object for the tour start date
    paymentOpenDate.setDate(paymentOpenDate.getDate() - availabilityToCancel);  // Subtract the availabilityToCancel days
    
    console.log('Payment open date:', paymentOpenDate);
    console.log('Payment open date:', currentDate);
    console.log('Ppppppppppp:', this._id);


  
    // Check if the current date is between the payment open date and the booking start date
    if (currentDate >= paymentOpenDate && currentDate <= bookingStartDate) {
      const paymentOpenDate = moment().add(2, 'minutes');
      // booking.opentopaid = true;  // Open payment window 
      // booking.datetopiad = paymentOpenDate // Close payment window
      booking.datetopiad = paymentOpenDate // Close payment window


      console.log('Payment is open.',paymentOpenDate);
    } else {
      const paymentOpenDate = moment().add(2, 'minutes');

      booking.opentopaid = false;
      booking.datetopiad=paymentOpenDate // Close payment window
      console.log('Payment is closed.');
    }
  } else {
    console.log('Missing availabilityToCancel or booking.startDate');
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
















// bookingSchema.index({ user: 1, tour: 1 });
  











// bookingSchema.pre('save', async function (next) {
//   const Booking = mongoose.model('Booking'); // Access the model
//   const existingBooking = await Booking.findOne({
//     user: this.user,
//     tour: this.tour,
//   });
//   // console.log(existingBooking);

//   if (existingBooking) {
//     console.log('existingBooking found:', existingBooking);
//     return next(new CustomError('Booking already exists. Please complete the payment for your pending booking.', 400));
//   }

//   next(); // Proceed with saving if no existing booking is found
// });
// bookingSchema.pre('save', async function (next) {
//   const booking = this;

//   // Populate the tour to get vendor and room types
//   await booking.populate('tour');

//   // Check if the tour has a vendor
//   if (!booking.tour.vendor) {
//     return next(new Error('The tour does not have an associated vendor.'));
//   }
//   if (booking.tour.status === 'pending') {
   

//     return next(new Error('The tour is not approved yet.'));
//   }
//   if (booking.tour.status !== 'accepted') {
//     return next(new Error('The tour was rejected by admin.'));
//   }

//   // Set the vendor ID from the tour
//   booking.vendor = booking.tour.vendor;
//   if (booking.tour.capacity === 'full') {
//   console.log(booking.vendor)
//     return next(new Error('The tour is full.'));
// }
//   // Check if room types in the booking exist in the tour
//   const availableRoomTypes = booking.tour.room_types.map(room => room.name);

//   const invalidRoomTypes = booking.rooms.filter(room => !availableRoomTypes.includes(room.roomType));

//   if (invalidRoomTypes.length > 0) {
//     return next(new Error(`Invalid room types: ${invalidRoomTypes.map(room => room.roomType).join(', ')}`));
//   }

//   // Calculate total price based on rooms with a conditional discount for adult room types
//   let roomTotal = 0;

//   booking.rooms.forEach(room => {
//     let roomPrice = room.pricePerRoom * room.quantity;

//     // Apply discount only for adult room types when it's a single-day tour
//     if (booking.tour.tour_type != 'multi-day' && room.roomType.toLowerCase().includes('adult')) {
//       const discount = booking.tour.discounts.find(d => booking.numberOfAdults >= d.min_users);
//       if (discount) {
//         const discountAmount = roomPrice * (discount.discount_percentage / 100);
//         roomPrice -= discountAmount;  // Apply the discount
//         console.log(`Applied discount to roomType ${room.roomType}: ${discountAmount}`);
//       }
//     }

//     roomTotal += roomPrice;
//   });

//   console.log("Total after discount for single-day tour with adult rooms:", roomTotal);

//   // Add price for private or shared option
//   if (booking.bookingType === 'private') {
//     roomTotal += booking.tour.private;  // Add private price from the tour
//   } else if (booking.bookingType === 'shared') {
//     roomTotal += booking.tour.shared;  // Add shared price from the tour
//   }

//   // Set total price
//   booking.totalPrice = roomTotal;

//   next();
// });

// bookingSchema.pre('save', async function (next) {
//   const booking = this;

//   // Populate the tour to get vendor and room types
//   await booking.populate('tour');

//   // Check if the tour has a vendor
//   if (!booking.tour.vendor) {
//       return next(new Error('The tour does not have an associated vendor.'));
//   }
//   if (booking.tour.status=='pending') {
//     return next(new Error('The tour does not approved yet.'));
// }
// if (!booking.tour.status=='accepted') {
//   return next(new Error('The tour regected by admin.'));
// }
//   // Set the vendor ID from the tour
//   booking.vendor = booking.tour.vendor;

//   // Check if room types in the booking exist in the tour
//   const availableRoomTypes = booking.tour.room_types.map(room => room.name); // Assuming room names are in the "name.en" field

//   const invalidRoomTypes = booking.rooms.filter(room => !availableRoomTypes.includes(room.roomType));
  
//   if (invalidRoomTypes.length > 0) {
//     return next(new Error(`Invalid room types: ${invalidRoomTypes.map(room => room.roomType).join(', ')}`));
//   }

//   // Calculate total price based on rooms
//   let roomTotal = booking.rooms.reduce((acc, room) => {

//     return acc + (room.pricePerRoom * room.quantity);
//   }, 0);
// console.log("roomTotal",roomTotal)
//   if (booking.tour.tour_type === 'single-day') {
//     const discount = booking.tour.discounts.find(d => booking.numberOfAdults >= d.min_users);
//     console.log("discount",discount)
//     if (discount) {
//       const discountAmount = roomTotal * (discount.discount_percentage / 100);
//       roomTotal -= discountAmount;  // Apply the discount
//     }
//   }
// console.log("roomTotaaaaaaaaal",roomTotal)

//   // Add price for private or shared option
//   if (booking.bookingType === 'private') {
//     roomTotal += booking.tour.private;  // Add private price from the tour
//   } else if (booking.bookingType === 'shared') {
//     roomTotal += booking.tour.shared;  // Add shared price from the tour
//   }
//   // Set total price
//   booking.totalPrice = roomTotal;

//   next();
// });