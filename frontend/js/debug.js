// Debug script to test API URL detection
console.log('=== DEBUG SCRIPT LOADED ===');
console.log('Current location:', window.location.href);
console.log('Hostname:', window.location.hostname);

// Test the API URL logic directly
var currentHost = window.location.hostname;
var isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

var API_BASE;
if (isLocalhost) {
    API_BASE = 'http://localhost:3000/api';
} else {
    API_BASE = 'https://gradebook-app.onrender.com/api';
}

console.log('Is localhost:', isLocalhost);
console.log('Calculated API_BASE:', API_BASE);

// Test if we can reach the API
fetch(API_BASE + '/health')
    .then(response => {
        console.log('Health check response:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Health check data:', data);
    })
    .catch(error => {
        console.error('Health check failed:', error);
    });

console.log('=== END DEBUG SCRIPT ===');
