angular.module('gradeBookApp')
    .service('AuthService', function ($http, $q, $location) {
        var self = this;
        var currentUser = null;
        var token = localStorage.getItem('authToken');
        var API_BASE = 'https://gradebook-app.onrender.com/api';

        console.log('=== AUTH SERVICE LOADED ===');
        console.log('HARDCODED API Base URL:', API_BASE);
        console.log('==========================');

        // Initialize user from token if exists
        if (token) {
            try {
                var payload = JSON.parse(atob(token.split('.')[1]));
                currentUser = {
                    id: payload.id,
                    name: payload.name,
                    email: payload.email,
                    role: payload.role
                };
            } catch (e) {
                localStorage.removeItem('authToken');
                token = null;
            }
        }

        this.login = function (credentials) {
            var deferred = $q.defer();

            $http.post(API_BASE + '/auth/login', credentials)
                .then(function (response) {
                    token = response.data.token;
                    currentUser = response.data.user;
                    localStorage.setItem('authToken', token);
                    deferred.resolve(response.data);
                })
                .catch(function (error) {
                    deferred.reject(error.data || {
                        error: 'Login failed'
                    });
                });

            return deferred.promise;
        };

        this.logout = function () {
            token = null;
            currentUser = null;
            localStorage.removeItem('authToken');
            $location.path('/login');
        };

        this.isAuthenticated = function () {
            return !!token && !!currentUser;
        };

        this.getCurrentUser = function () {
            return currentUser;
        };

        this.getToken = function () {
            return token;
        };

        this.requireRole = function (role) {
            var deferred = $q.defer();

            if (!this.isAuthenticated()) {
                deferred.reject('UNAUTHORIZED');
            } else if (currentUser.role !== role && role !== 'any') {
                deferred.reject('FORBIDDEN');
            } else {
                deferred.resolve();
            }

            return deferred.promise;
        };

        this.hasRole = function (role) {
            return currentUser && (currentUser.role === role || role === 'any');
        };

        this.redirectToDashboard = function () {
            if (currentUser) {
                switch (currentUser.role) {
                    case 'admin':
                        $location.path('/admin/dashboard');
                        break;
                    case 'teacher':
                        $location.path('/teacher/dashboard');
                        break;
                    case 'student':
                        $location.path('/student/dashboard');
                        break;
                    default:
                        $location.path('/login');
                }
            } else {
                $location.path('/login');
            }
        };
    });