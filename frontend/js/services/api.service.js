angular.module('gradeBookApp')
.service('ApiService', function($http, $q, AuthService) {
    var service = this;
    
    // FORCE PRODUCTION API - Override for deployment issue
    var currentHost = window.location.hostname;
    var API_BASE;
    
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        API_BASE = 'http://localhost:3000/api';
    } else {
        // Force production API for ANY non-localhost domain
        API_BASE = 'https://gradebook-app.onrender.com/api';
    }
    
    // Debug logging
    console.log('=== API Service Debug (FORCED) ===');
    console.log('Current hostname:', currentHost);
    console.log('FORCED API Base URL:', API_BASE);
    console.log('Full location:', window.location.href);
    console.log('==================================');
    
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

        httpPromise
            .then(function(response) {
                deferred.resolve(response.data);
            })
            .catch(function(error) {
                if (error.status === 401) {
                    AuthService.logout();
                }
                deferred.reject(error.data || { error: 'Request failed' });
            });

        return deferred.promise;
    }

    // Auth endpoints
    service.login = function(credentials) {
        return handleRequest($http.post(API_BASE + '/auth/login', credentials));
    };

    service.register = function(userData) {
        return handleRequest($http.post(API_BASE + '/auth/register', userData, {
            headers: getAuthHeaders()
        }));
    };

    // User endpoints
    service.getUsers = function() {
        return handleRequest($http.get(API_BASE + '/users', {
            headers: getAuthHeaders()
        }));
    };

    service.createUser = function(userData) {
        return handleRequest($http.post(API_BASE + '/users', userData, {
            headers: getAuthHeaders()
        }));
    };

    service.updateUser = function(id, userData) {
        return handleRequest($http.put(API_BASE + '/users/' + id, userData, {
            headers: getAuthHeaders()
        }));
    };

    service.deleteUser = function(id) {
        return handleRequest($http.delete(API_BASE + '/users/' + id, {
            headers: getAuthHeaders()
        }));
    };

    service.getTeachers = function() {
        return handleRequest($http.get(API_BASE + '/users/teachers', {
            headers: getAuthHeaders()
        }));
    };

    service.getStudents = function() {
        return handleRequest($http.get(API_BASE + '/users/students', {
            headers: getAuthHeaders()
        }));
    };

    service.getStudentsByTeacher = function(teacherId) {
        var url = API_BASE + '/users/students/teacher';
        if (teacherId) {
            url += '/' + teacherId;
        }
        return handleRequest($http.get(url, {
            headers: getAuthHeaders()
        }));
    };

    // Teacher-Student assignment endpoints
    service.assignStudentToTeacher = function(studentId, teacherId) {
        return handleRequest($http.post(API_BASE + '/users/assign', {
            studentId: studentId,
            teacherId: teacherId
        }, {
            headers: getAuthHeaders()
        }));
    };

    service.unassignStudentFromTeacher = function(studentId, teacherId) {
        return handleRequest($http.post(API_BASE + '/users/unassign', {
            studentId: studentId,
            teacherId: teacherId
        }, {
            headers: getAuthHeaders()
        }));
    };

    service.getTeacherAssignments = function() {
        return handleRequest($http.get(API_BASE + '/users/assignments', {
            headers: getAuthHeaders()
        }));
    };

    // Course endpoints
    service.getCourses = function() {
        return handleRequest($http.get(API_BASE + '/courses', {
            headers: getAuthHeaders()
        }));
    };

    service.createCourse = function(courseData) {
        return handleRequest($http.post(API_BASE + '/courses', courseData, {
            headers: getAuthHeaders()
        }));
    };

    service.updateCourse = function(id, courseData) {
        return handleRequest($http.put(API_BASE + '/courses/' + id, courseData, {
            headers: getAuthHeaders()
        }));
    };

    service.deleteCourse = function(id) {
        return handleRequest($http.delete(API_BASE + '/courses/' + id, {
            headers: getAuthHeaders()
        }));
    };

    service.getCoursesByTeacher = function(teacherId) {
        var url = API_BASE + '/courses/teacher';
        if (teacherId) {
            url += '/' + teacherId;
        }
        return handleRequest($http.get(url, {
            headers: getAuthHeaders()
        }));
    };

    service.getCourseEnrollments = function(courseId) {
        return handleRequest($http.get(API_BASE + '/courses/' + courseId + '/enrollments', {
            headers: getAuthHeaders()
        }));
    };

    service.enrollStudent = function(studentId, courseId) {
        return handleRequest($http.post(API_BASE + '/courses/enroll', {
            studentId: studentId,
            courseId: courseId
        }, {
            headers: getAuthHeaders()
        }));
    };

    service.unenrollStudent = function(studentId, courseId) {
        return handleRequest($http.post(API_BASE + '/courses/unenroll', {
            studentId: studentId,
            courseId: courseId
        }, {
            headers: getAuthHeaders()
        }));
    };

    service.getCourseGradingRules = function(courseId) {
        return handleRequest($http.get(API_BASE + '/courses/' + courseId + '/grading-rules', {
            headers: getAuthHeaders()
        }));
    };

    service.updateCourseGradingRules = function(courseId, rules) {
        return handleRequest($http.put(API_BASE + '/courses/' + courseId + '/grading-rules', rules, {
            headers: getAuthHeaders()
        }));
    };

    service.getCourseStudents = function(courseId) {
        return handleRequest($http.get(API_BASE + '/courses/' + courseId + '/students', {
            headers: getAuthHeaders()
        }));
    };

    // Evaluation endpoints
    service.getEvaluations = function() {
        return handleRequest($http.get(API_BASE + '/evaluations', {
            headers: getAuthHeaders()
        }));
    };

    service.createEvaluation = function(evaluationData) {
        return handleRequest($http.post(API_BASE + '/evaluations', evaluationData, {
            headers: getAuthHeaders()
        }));
    };

    service.getEvaluationsByStudent = function(studentId) {
        var url = API_BASE + '/evaluations/student';
        if (studentId) {
            url += '/' + studentId;
        }
        return handleRequest($http.get(url, {
            headers: getAuthHeaders()
        }));
    };

    service.getEvaluationsByTeacher = function(teacherId) {
        var url = API_BASE + '/evaluations/teacher';
        if (teacherId) {
            url += '/' + teacherId;
        }
        return handleRequest($http.get(url, {
            headers: getAuthHeaders()
        }));
    };

    service.updateEvaluation = function(id, evaluationData) {
        return handleRequest($http.put(API_BASE + '/evaluations/' + id, evaluationData, {
            headers: getAuthHeaders()
        }));
    };

    service.deleteEvaluation = function(id) {
        return handleRequest($http.delete(API_BASE + '/evaluations/' + id, {
            headers: getAuthHeaders()
        }));
    };

    service.getEvaluationStats = function() {
        return handleRequest($http.get(API_BASE + '/evaluations/stats', {
            headers: getAuthHeaders()
        }));
    };

    // Course grades for students
    service.getCourseGrades = function(studentId) {
        var url = API_BASE + '/evaluations/course-grades';
        if (studentId) {
            url += '/' + studentId;
        }
        return handleRequest($http.get(url, {
            headers: getAuthHeaders()
        }));
    };

    service.calculateFinalGrade = function(studentId, courseId) {
        return handleRequest($http.get(API_BASE + '/evaluations/final-grade/' + studentId + '/' + courseId, {
            headers: getAuthHeaders()
        }));
    };

    // Report endpoints - PDF and CSV
    service.downloadPDFReport = function(params) {
        var token = AuthService.getToken();
        var queryString = Object.keys(params || {}).map(function(key) {
            return key + '=' + encodeURIComponent(params[key]);
        }).join('&');

        var url = API_BASE + '/evaluations/reports/pdf';
        if (queryString) {
            url += '?' + queryString;
        }

        return url + (url.indexOf('?') > -1 ? '&' : '?') + 'token=' + encodeURIComponent(token);
    };

    service.downloadCSVReport = function(params) {
        var token = AuthService.getToken();
        var queryString = Object.keys(params || {}).map(function(key) {
            return key + '=' + encodeURIComponent(params[key]);
        }).join('&');

        var url = API_BASE + '/evaluations/reports/csv';
        if (queryString) {
            url += '?' + queryString;
        }

        return url + (url.indexOf('?') > -1 ? '&' : '?') + 'token=' + encodeURIComponent(token);
    };
});
