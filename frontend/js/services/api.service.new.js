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
                $http.post(API_BASE + '/courses/enroll', 
                    { studentId: studentId, courseId: courseId }, {
                    headers: getAuthHeaders()
                })
            );
        },
        
        unenroll: function(courseId, studentId) {
            return handleRequest(
                $http.post(API_BASE + '/courses/unenroll', 
                    { studentId: studentId, courseId: courseId }, {
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
            var url = API_BASE + '/evaluations/reports/pdf';
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
            var url = API_BASE + '/evaluations/reports/csv';
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

    // Teacher-specific methods (for backward compatibility)
    service.getEvaluationsByTeacher = function(teacherId) {
        var url = API_BASE + '/evaluations/teacher';
        if (teacherId) {
            url += '/' + teacherId;
        }
        return handleRequest(
            $http.get(url, {
                headers: getAuthHeaders()
            })
        );
    };

    service.getStudentsByTeacher = function(teacherId) {
        var url = API_BASE + '/users/students/teacher';
        if (teacherId) {
            url += '/' + teacherId;
        }
        return handleRequest(
            $http.get(url, {
                headers: getAuthHeaders()
            })
        );
    };

    service.getCoursesByTeacher = function(teacherId) {
        var url = API_BASE + '/courses/teacher';
        if (teacherId) {
            url += '/' + teacherId;
        }
        return handleRequest(
            $http.get(url, {
                headers: getAuthHeaders()
            })
        );
    };

    service.getCourseStudents = function(courseId) {
        return handleRequest(
            $http.get(API_BASE + '/courses/' + courseId + '/students', {
                headers: getAuthHeaders()
            })
        );
    };

    service.getCourseEnrollments = function(courseId) {
        return service.courses.getEnrollments(courseId);
    };

    service.getCourseGradingRules = function(courseId) {
        return handleRequest(
            $http.get(API_BASE + '/courses/' + courseId + '/grading-rules', {
                headers: getAuthHeaders()
            })
        );
    };

    service.updateCourseGradingRules = function(courseId, rules) {
        return service.courses.setGradingRules(courseId, rules);
    };

    // Admin-specific methods (for backward compatibility)
    service.getUsers = function() {
        return service.users.getAll();
    };

    service.createUser = function(userData) {
        return service.users.create(userData);
    };

    service.updateUser = function(id, userData) {
        return service.users.update(id, userData);
    };

    service.deleteUser = function(id) {
        return service.users.delete(id);
    };

    service.getStudents = function() {
        return service.users.getStudents();
    };

    service.getTeachers = function() {
        return service.users.getTeachers();
    };

    service.getCourses = function() {
        return service.courses.getAll();
    };

    service.createCourse = function(courseData) {
        return service.courses.create(courseData);
    };

    service.deleteCourse = function(id) {
        return service.courses.delete(id);
    };

    service.enrollStudent = function(studentId, courseId) {
        return service.courses.enroll(courseId, studentId);
    };

    service.unenrollStudent = function(studentId, courseId) {
        return service.courses.unenroll(courseId, studentId);
    };

    service.getEvaluations = function(filters) {
        return service.evaluations.getAll(filters);
    };

    service.createEvaluation = function(evaluationData) {
        return service.evaluations.create(evaluationData);
    };

    service.updateEvaluation = function(id, evaluationData) {
        return service.evaluations.update(id, evaluationData);
    };

    service.deleteEvaluation = function(id) {
        return service.evaluations.delete(id);
    };

    // Student-specific methods (for backward compatibility)
    service.getCourseGrades = function() {
        return handleRequest(
            $http.get(API_BASE + '/evaluations/student/grades', {
                headers: getAuthHeaders()
            })
        );
    };

    service.getEvaluationsByStudent = function() {
        return handleRequest(
            $http.get(API_BASE + '/evaluations/student', {
                headers: getAuthHeaders()
            })
        );
    };

    // Report methods (for backward compatibility)
    service.downloadPDFReport = function(filters) {
        var url = API_BASE + '/evaluations/reports/pdf';
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
        
        return url;
    };

    service.downloadCSVReport = function(filters) {
        var url = API_BASE + '/evaluations/reports/csv';
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
        
        return url;
    };

    service.getEvaluationStats = function() {
        return handleRequest(
            $http.get(API_BASE + '/evaluations/stats', {
                headers: getAuthHeaders()
            })
        );
    };

    service.getTeacherAssignments = function() {
        return handleRequest(
            $http.get(API_BASE + '/users/teacher-assignments', {
                headers: getAuthHeaders()
            })
        );
    };

    service.assignStudentToTeacher = function(studentId, teacherId) {
        return handleRequest(
            $http.post(API_BASE + '/users/assign-student', 
                { studentId: studentId, teacherId: teacherId }, {
                headers: getAuthHeaders()
            })
        );
    };

    service.unassignStudentFromTeacher = function(studentId, teacherId) {
        return handleRequest(
            $http.post(API_BASE + '/users/unassign-student', 
                { studentId: studentId, teacherId: teacherId }, {
                headers: getAuthHeaders()
            })
        );
    };
});
