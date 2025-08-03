const Availability = require('../model/AvailabilityModel');
const Tour = require('../model/ToursModel');
const CustomError = require('../utils/customError');

class AvailabilityService {
    // Create availability entries
    async createAvailability(data) {
        const { tour, dates, room_types, discounts } = data;

        // 1. Fetch the tour details
        const tourDetails = await Tour.findById(tour).populate('vendor');
        if (!tourDetails) {
            throw new CustomError('Tour not found', 404);
        }

        const vendorCommission = tourDetails.vendor?.commission || 15; // Default commission if not provided

        // 2. Validate dates
        const invalidDates = dates.filter((date) => {
            const dateObj = new Date(date);

            // Check if the date is outside the range
            if (dateObj < tourDetails.availability.from || dateObj > tourDetails.availability.to) {
                return true;
            }

            // Check if the date is in the offDays
            if (tourDetails.availability.offDays.some((offDay) => new Date(offDay).toDateString() === dateObj.toDateString())) {
                return true;
            }

            return false;
        });

        if (invalidDates.length > 0) {
            throw new CustomError(
                `Invalid dates: ${invalidDates.join(', ')}. Dates must be within the tour's availability range and not on off days.`,
                400
            );
        }

        // 3. Calculate room prices based on vendor commission
        const adjustedRoomTypes = room_types.map((room) => {
            return {
                ...room,
                price: parseInt(room.netprice) + parseInt(room.netprice) * (vendorCommission / 100),
            };
        });

        
        // 4. Create availability entries
        const availabilityEntries = dates.map((date) => ({
            tour,
            dates: [new Date(date)], // Single date as an array
            room_types: adjustedRoomTypes,
            discounts,
        }));

        if (tourDetails.status=='accepted'){
            tourDetails.note=`there is a  a new special days added`
            // tourDetails.status = 'pending'
          await  tourDetails.save({validateBeforeSave:false})
        }
        // 5. Save to the database
        const savedAvailability = await Availability.insertMany(availabilityEntries);
        return savedAvailability;
    }

    async deleteAvailabilityById(id) {
        const availability = await Availability.findById(id);
        if (!availability) {
            throw new CustomError('Availability not found', 404);
        }
        const tourDetails = await Tour.findById(availability.tour).populate('vendor');
        console.log("availability",availability.tour)
        if (tourDetails.status=='accepted'){
            tourDetails.note=`there is a  removing special days added`
            tourDetails.status = 'pending'
          await  tourDetails.save({validateBeforeSave:false})
        }
        await availability.deleteOne();
        return { message: 'Availability deleted successfully' };
    }
    async getAvailabilityByIdAndTour(availabilityId, tourId) {
        const availability = await Availability.findOne({
            _id: availabilityId,
            tour: tourId,
        }) // Populate the tour details if needed

        if (!availability) {
            throw new CustomError('Availability not found for the given ID and Tour ID', 404);
        }

        return availability;
    }
    // Delete all availability for a tour
    async deleteAvailabilityByTour(tourId) {
        const result = await Availability.deleteMany({ tour: tourId });
        const tourDetails = await Tour.findById(tourId).populate('vendor');
        if (tourDetails.status=='accepted'){
    
                tourDetails.note=`the vendor removing all special days `
                // tourDetails.status = 'pending'
              await  tourDetails.save({validateBeforeSave:false})
            }
        if (result.deletedCount === 0) {
            throw new CustomError('No availability found for the given tour', 404);
        }

        return { message: `${result.deletedCount} availability entries deleted successfully` };
    }
}

module.exports = new AvailabilityService();
