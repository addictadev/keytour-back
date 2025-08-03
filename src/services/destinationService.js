const Destination = require('../model/DestinationModel');
const CustomError = require('../utils/customError');
const APIFeatures = require('../utils/apiFeatures');
const Tour = require('../model/ToursModel'); // Import the Tour model
const Booking = require('../model/BookingModel'); // Import the Booking model
const Review = require('../model/ReviewModel'); 
class DestinationService {
    // Create a new destination
    async createDestination(data) {
        const destination = new Destination(data);
        await destination.save();
        return destination;
    }

    // Get a destination by ID
    async getDestinationById(id) {
        const destination = await Destination.findById(id);
        if (!destination) {
            throw new CustomError('Destination not found', 404);
        }
        return destination;
    }

    // Get all destinations with optional filtering, sorting, and pagination
    // async getAllDestinations(queryParams) {
    //     const filter = {};
    //     const features = new APIFeatures(Destination.find(filter), queryParams)
    //         .filter()
    //         .sort()
    //         .limitFields()
    //         .paginate();

    //     const destinations = await features.query;
    //     return {
    //         results: destinations.length,
    //         data: destinations
    //     };
    // }



    async getAllDestinations(queryParams) {
        const filter = {};
    
        // Applying filters, sorting, pagination, etc.
        const features = new APIFeatures(Destination.find(filter), queryParams)
            .filter()
            .sort()
            .limitFields()
            .paginate();
    
        // Fetch the destinations
        const destinations = await features.query;
    
        // Step 3: Loop through each destination and append the tourcount
        for (let destination of destinations) {
            // Count how many tours are linked to the destination
            const tourCount = await Tour.countDocuments({ destination: destination._id,status:'accepted' });
            
            // Add the tour count directly to the destination
            destination.tourcount = tourCount; // Append tourcount
        }
    
        // Step 4: Return the response with flat destinations
        return {
            results: destinations.length,
            data: destinations.map(destination => {
                // Convert to plain object and remove any nested fields like `destination`
                return {
                    _id: destination._id,
                    country: destination.country,
                    city: destination.city,
                    region: destination.region,
                    description: destination.description,
                    image: destination.image,
                    rating: destination.rating,
                    tourcount: destination.tourcount, // Now added at the root level
                    created_at: destination.created_at,
                    updated_at: destination.updated_at
                };
            })
        };
    }
    






    // async getAllDestinations(queryParams) {
    //     const filter = {};
    
    //     // Applying filters, sorting, pagination, etc.
    //     const features = new APIFeatures(Destination.find(filter), queryParams)
    //         .filter()
    //         .sort()
    //         .limitFields()
    //         .paginate();
    
    //     // Fetch the destinations
    //     const destinations = await features.query;
    
    //     // Step 3: Loop through each destination and append the tourcount
    //     for (let destination of destinations) {
    //         // Count how many tours are linked to the destination
    //         const tourCount = await Tour.countDocuments({ destination: destination._id,status:'accepted' });
    // console.log(tourCount)
    //         // Add the tour count to the destination
    //         // destination = destination.toObject(); // Convert to plain JS object
    //         destination.tourcount = tourCount; // Append tourcount
    //     }
    
    //     return {
    //         results: destinations.length,
    //         data: destinations
    //     };
    // }
    
    // Update a destination by ID
    async updateDestination(id, data) {
        console.log(id,data)
        const destination = await Destination.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!destination) {
            throw new CustomError('Destination not found', 404);
        }
        return destination;
    }

    // Delete a destination by ID
    // async deleteDestination(id) {
    //     const destination = await Destination.findByIdAndDelete(id);
    //     if (!destination) {
    //         throw new CustomError('Destination not found', 404);
    //     }
    //     return destination;
    // }

    async deleteDestination(id) {
        // Find the destination
        const destination = await Destination.findById(id);
        if (!destination) {
            throw new CustomError('Destination not found', 404);
        }

        // Find all the tours associated with the destination
        const tours = await Tour.find({ destination: id });

        // Loop through each tour and delete associated bookings and reviews
        for (const tour of tours) {
            // Delete bookings associated with the tour
            await Booking.deleteMany({ tour: tour._id });

            // Delete reviews associated with the tour
            await Review.deleteMany({ tour: tour._id });

            // Delete the tour itself
            await Tour.findByIdAndDelete(tour._id);
        }

        // Finally, delete the destination
        await Destination.findByIdAndDelete(id);

        return { message: 'Destination, related tours, bookings, and reviews deleted successfully' };
    }
}

module.exports = new DestinationService();
