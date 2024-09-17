// Initialize the map
let map = L.map('map').setView([48.1351, 11.5820], 14); // Centered on Munich by default

// Add OpenStreetMap tiles to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Event listener for the button
document.getElementById('findBiergartenBtn').addEventListener('click', getUserLocation);

// Get the user's location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, {
            enableHighAccuracy: true,  // Use GPS if available
            timeout: 10000,            // Wait up to 10 seconds to get location
            maximumAge: 0              // No cached location
        });
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Show the user's position on the map
function showPosition(position) {
    let lat = position.coords.latitude;
    let lng = position.coords.longitude;

    // Center the map on the user's location
    map.setView([lat, lng], 14);

    // Place a marker for the user location
    L.marker([lat, lng]).addTo(map)
        .bindPopup('You are here')
        .openPopup();

    // Find nearby Biergärten
    findNearestBiergarten(lat, lng);
}

// Handle geolocation errors
function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}

// Use the Overpass API to find the nearest Biergarten
function findNearestBiergarten(lat, lng) {
    let overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:2000,${lat},${lng})[amenity=biergarten];out;`;

    fetch(overpassUrl)
        .then(response => response.json())
        .then(data => {
            let biergartens = data.elements;
            if (biergartens.length === 0) {
                document.getElementById('info').innerHTML = 'No Biergärten found nearby.';
                return;
            }

            // Find the nearest Biergarten
            let nearestBiergarten = findNearest(lat, lng, biergartens);
            
            // Display only the nearest Biergarten
            displayBiergartenInfo(nearestBiergarten);
        })
        .catch(error => {
            console.error('Error fetching Biergärten data:', error);
            document.getElementById('info').innerHTML = 'Error fetching data.';
        });
}

// Calculate the distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

// Find the nearest Biergarten
function findNearest(userLat, userLng, biergartens) {
    let nearest = null;
    let minDistance = Infinity;

    biergartens.forEach(biergarten => {
        let distance = calculateDistance(userLat, userLng, biergarten.lat, biergarten.lon);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = biergarten;
        }
    });

    return nearest;
}

// Display information about the nearest Biergarten
function displayBiergartenInfo(biergarten) {
    let { lat, lon, tags } = biergarten;
    let name = tags.name || 'Unnamed Biergarten';

    // Add marker to the map for the nearest Biergarten
    L.marker([lat, lon]).addTo(map)
        .bindPopup(`<strong>${name}</strong><br>Lat: ${lat}, Lon: ${lon}`)
        .openPopup();

    // Show Biergarten info in the 'info' div
    document.getElementById('info').innerHTML = `
        <strong>${name}</strong><br>
        Latitude: ${lat}, Longitude: ${lon}<br>
        Distance: ${calculateDistance(lat, lon, map.getCenter().lat, map.getCenter().lng).toFixed(2)} km
    `;
}
