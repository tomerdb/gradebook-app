angular.module('gradeBookApp')
.service('ApiServiceNew', function($http, $q, AuthService) {
    var service = this;
    
    // HARDCODED PRODUCTION API URL - NO CONDITIONALS
    var API_BASE = 'https://gradebook-app.onrender.com/api';
    
    console.log('=== NEW API SERVICE LOADED ===');
    console.log('HARDCODED API Base URL:', API_BASE);
    console.log('==============================');
    
    // Expose API base URL
    service.getApiBase = function() {
        return API_BASE;
    };

    function getAuthHeaders() {
        var token = AuthService.getToken();
        return {
            'Authorization': token ? 'Bearer ' + token : '',
            'Content-Type': 'application/json'
        };
    }

    function handleRequest(httpPromise) {
        var deferred = $q.defer();
        
        httpPromise.then(function(response) {
            deferred.resolve(response.data);
        }).catch(function(error) {
            console.error('API Request failed:', error);
            if (error.status === 401) {
                AuthService.logout();
                window.location.href = '#!/login';
            }
            deferred.reject(error.data || { error: 'Request failed' });
        });
        
        return deferred.promise;
    }

    // Auth endpoints
    service.auth = {
        login: function(credentials) {
            console.log('LOGIN REQUEST TO:', API_BASE + '/auth/login');
            return handleRequest(
                $http.post(API_BASE + '/auth/login', credentials, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        register: function(userData) {
            return handleRequest(
                $http.post(API_BASE + '/auth/register', userData, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        verifyToken: function() {
            return handleRequest(
                $http.get(API_BASE + '/auth/verify', {
                    headers: getAuthHeaders()
                })
            );
        }
    };

    // Users endpoints
    service.users = {
        getAll: function() {
            return handleRequest(
                $http.get(API_BASE + '/users', {
                    headers: getAuthHeaders()
                })
            );
        },
        
        getById: function(id) {
            return handleRequest(
                $http.get(API_BASE + '/users/' + id, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        create: function(userData) {
            return handleRequest(
                $http.post(API_BASE + '/users', userData, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        update: function(id, userData) {
            return handleRequest(
                $http.put(API_BASE + '/users/' + id, userData, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        delete: function(id) {
            return handleRequest(
                $http.delete(API_BASE + '/users/' + id, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        getStudents: function() {
            return handleRequest(
                $http.get(API_BASE + '/users/students', {
                    headers: getAuthHeaders()
                })
            );
        },
        
        getTeachers: function() {
            return handleRequest(
                $http.get(API_BASE + '/users/teachers', {
                    headers: getAuthHeaders()
                })
            );
        }
    };

    // Courses endpoints
    service.courses = {
        getAll: function() {
            return handleRequest(
                $http.get(API_BASE + '/courses', {
                    headers: getAuthHeaders()
                })
            );
        },
        
        getById: function(id) {
            return handleRequest(
                $http.get(API_BASE + '/courses/' + id, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        create: function(courseData) {
            return handleRequest(
                $http.post(API_BASE + '/courses', courseData, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        update: function(id, courseData) {
            return handleRequest(
                $http.put(API_BASE + '/courses/' + id, courseData, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        delete: function(id) {
            return handleRequest(
                $http.delete(API_BASE + '/courses/' + id, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        enroll: function(courseId, studentId) {
            return handleRequest(
                $http.post(API_BASE + '/courses/' + courseId + '/enroll', 
                    { studentId: studentId }, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        unenroll: function(courseId, studentId) {
            return handleRequest(
                $http.delete(API_BASE + '/courses/' + courseId + '/enroll/' + studentId, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        getEnrollments: function(courseId) {
            return handleRequest(
                $http.get(API_BASE + '/courses/' + courseId + '/enrollments', {
                    headers: getAuthHeaders()
                })
            );
        },
        
        setGradingRules: function(courseId, rules) {
            return handleRequest(
                $http.post(API_BASE + '/courses/' + courseId + '/grading-rules', 
                    { rules: rules }, {
                    headers: getAuthHeaders()
                })
            );
        }
    };

    // Evaluations endpoints
    service.evaluations = {
        getAll: function(filters) {
            var url = API_BASE + '/evaluations';
            if (filters) {
                var params = new URLSearchParams();
                Object.keys(filters).forEach(function(key) {
                    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                        params.append(key, filters[key]);
                    }
                });
                if (params.toString()) {
                    url += '?' + params.toString();
                }
            }
            
            return handleRequest(
                $http.get(url, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        getById: function(id) {
            return handleRequest(
                $http.get(API_BASE + '/evaluations/' + id, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        create: function(evaluationData) {
            return handleRequest(
                $http.post(API_BASE + '/evaluations', evaluationData, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        update: function(id, evaluationData) {
            return handleRequest(
                $http.put(API_BASE + '/evaluations/' + id, evaluationData, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        delete: function(id) {
            return handleRequest(
                $http.delete(API_BASE + '/evaluations/' + id, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        exportPDF: function(filters) {
            var url = API_BASE + '/evaluations/export-pdf';
            var token = AuthService.getToken();
            
            if (filters) {
                var params = new URLSearchParams();
                Object.keys(filters).forEach(function(key) {
                    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                        params.append(key, filters[key]);
                    }
                });
                if (token) {
                    params.append('token', token);
                }
                if (params.toString()) {
                    url += '?' + params.toString();
                }
            } else if (token) {
                url += '?token=' + token;
            }
            
            window.open(url, '_blank');
        },
        
        exportCSV: function(filters) {
            var url = API_BASE + '/evaluations/export-csv';
            var token = AuthService.getToken();
            
            if (filters) {
                var params = new URLSearchParams();
                Object.keys(filters).forEach(function(key) {
                    if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                        params.append(key, filters[key]);
                    }
                });
                if (token) {
                    params.append('token', token);
                }
                if (params.toString()) {
                    url += '?' + params.toString();
                }
            } else if (token) {
                url += '?token=' + token;
            }
            
            window.open(url, '_blank');
        },
        
        getStudentReport: function(studentId) {
            var url = API_BASE + '/evaluations/student-report/' + studentId;
            var token = AuthService.getToken();
            if (token) {
                url += '?token=' + token;
            }
            window.open(url, '_blank');
        }
    };
});
