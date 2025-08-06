const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

class DeviceDetector {
    constructor() {
        this.parser = new UAParser();
    }

    // Extract device information from request
    extractDeviceInfo(req) {
        const userAgent = req.headers['user-agent'] || '';
        const ip = this.getClientIp(req);
        
        // Parse user agent
        this.parser.setUA(userAgent);
        const result = this.parser.getResult();
        
        // Get location from IP
        const geo = geoip.lookup(ip);
        
        return {
            browser: result.browser.name || 'Unknown',
            browserVersion: result.browser.version || 'Unknown',
            os: result.os.name || 'Unknown',
            osVersion: result.os.version || 'Unknown',
            device: result.device.model || result.device.type || 'Unknown',
            userAgent: userAgent,
            ip: ip,
            location: geo ? {
                country: geo.country,
                city: geo.city,
                region: geo.region,
                timezone: geo.timezone,
                coordinates: {
                    lat: geo.ll[0],
                    lng: geo.ll[1]
                }
            } : null
        };
    }

    // Get client IP address (handles proxies)
    getClientIp(req) {
        // Check for various proxy headers
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        
        return req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               'Unknown';
    }

    // Check if device is mobile
    isMobile(userAgent) {
        this.parser.setUA(userAgent);
        const result = this.parser.getResult();
        return result.device.type === 'mobile' || result.device.type === 'tablet';
    }

    // Get device type
    getDeviceType(userAgent) {
        this.parser.setUA(userAgent);
        const result = this.parser.getResult();
        return result.device.type || 'desktop';
    }

    // Format location for display
    formatLocation(location) {
        if (!location) return 'Unknown Location';
        
        const parts = [];
        if (location.city) parts.push(location.city);
        if (location.region) parts.push(location.region);
        if (location.country) parts.push(location.country);
        
        return parts.join(', ') || 'Unknown Location';
    }

    // Check if login is from unusual location
    isUnusualLocation(currentLocation, previousLocations = []) {
        if (!currentLocation || previousLocations.length === 0) {
            return false;
        }

        // Check if country is different from any previous login
        const currentCountry = currentLocation.country;
        const previousCountries = previousLocations.map(loc => loc.country).filter(Boolean);
        
        if (previousCountries.length > 0 && !previousCountries.includes(currentCountry)) {
            return true;
        }

        // Check if location is significantly far from previous locations
        for (const prevLoc of previousLocations) {
            if (prevLoc.coordinates && currentLocation.coordinates) {
                const distance = this.calculateDistance(
                    currentLocation.coordinates,
                    prevLoc.coordinates
                );
                
                // If distance is more than 1000km, consider it unusual
                if (distance > 1000) {
                    return true;
                }
            }
        }

        return false;
    }

    // Calculate distance between two coordinates in km
    calculateDistance(coord1, coord2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(coord2.lat - coord1.lat);
        const dLon = this.toRad(coord2.lng - coord1.lng);
        const lat1 = this.toRad(coord1.lat);
        const lat2 = this.toRad(coord2.lat);

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.sin(dLon/2) * Math.sin(dLon/2) * 
                  Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }

    toRad(value) {
        return value * Math.PI / 180;
    }
}

module.exports = new DeviceDetector();