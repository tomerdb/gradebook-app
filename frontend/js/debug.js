// Debug script to test API URL detection
// Debug logs removed for production

// Test the API URL logic directly
var currentHost = window.location.hostname;
var isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

var API_BASE;
if (isLocalhost) {
    API_BASE = 'http://localhost:3000/api';
} else {
    API_BASE = 'https://gradebook-app.onrender.com/api';
}

// Test if we can reach the API
fetch(API_BASE + '/health')
    .then(response => {
        return response.json();
    })
    .then(data => {
        // Health check successful
    })
    .catch(error => {
        console.error('Health check failed:', error);
    });