angular.module('gradeBookApp')

// Student Controllers
.controller('StudentDashboardController', function($scope, ApiServiceNew, AuthService) {
    $scope.courseGrades = [];
    $scope.recentEvaluations = [];
    $scope.loading = true;
    $scope.stats = {
        totalCourses: 0,
        overallGPA: 0,
        bestCourse: '',
        totalEvaluations: 0
    };

    function loadDashboard() {
        // Load course grades first
        ApiServiceNew.getCourseGrades()
            .then(function(courses) {
                $scope.courseGrades = courses;
                
                // Calculate overall statistics
                if (courses.length > 0) {
                    $scope.stats.totalCourses = courses.length;
                    
                    // Calculate GPA (average of final grades)
                    var totalGrade = courses.reduce(function(sum, course) { 
                        return sum + (course.final_grade || 0); 
                    }, 0);
                    $scope.stats.overallGPA = Math.round((totalGrade / courses.length) * 100) / 100;
                    
                    // Find best performing course
                    var bestCourse = courses.reduce(function(best, course) {
                        return (course.final_grade || 0) > (best.final_grade || 0) ? course : best;
                    });
                    $scope.stats.bestCourse = bestCourse.course_name;
                    
                    // Count total evaluations
                    $scope.stats.totalEvaluations = courses.reduce(function(sum, course) {
                        return sum + (course.total_evaluations || 0);
                    }, 0);
                }
                
                // Load recent evaluations
                return ApiServiceNew.getEvaluationsByStudent();
            })
            .then(function(evaluations) {
                $scope.recentEvaluations = evaluations.slice(0, 5); // Show last 5
                
                // Update total evaluations count with actual evaluations
                $scope.stats.totalEvaluations = evaluations.length;
                
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading dashboard:', error);
                $scope.loading = false;
            });
    }

    $scope.getGradeClass = function(grade) {
        if (grade >= 90) return 'score-excellent';
        if (grade >= 80) return 'score-good';
        if (grade >= 70) return 'score-average';
        return 'score-poor';
    };

    $scope.getPerformanceMessage = function() {
        var gpa = $scope.stats.overallGPA;
        if (gpa >= 90) return 'Excellent performance across all courses!';
        if (gpa >= 80) return 'Good performance! Keep up the great work.';
        if (gpa >= 70) return 'Average performance. Consider focusing on weaker areas.';
        return 'Below average performance. Consider seeking additional help.';
    };

    $scope.downloadPDFReport = function() {
        var user = AuthService.getCurrentUser();
        ApiServiceNew.evaluations.exportPDF({ type: 'student', studentId: user.id });
    };

    $scope.getScoreClass = function(score) {
        if (score >= 90) return 'score-excellent';
        if (score >= 80) return 'score-good';
        if (score >= 70) return 'score-average';
        return 'score-poor';
    };

    loadDashboard();
})

.controller('StudentReportsController', function($scope, ApiServiceNew, AuthService) {
    $scope.courseGrades = [];
    $scope.evaluations = [];
    $scope.filteredEvaluations = [];
    $scope.loading = true;
    $scope.selectedCourse = null;
    $scope.filters = {
        course: '',
        teacher: '',
        subject: '',
        evaluationType: ''
    };

    function loadReports() {
        // Load course grades first
        ApiServiceNew.getCourseGrades()
            .then(function(courses) {
                $scope.courseGrades = courses;
                
                // Load all evaluations
                return ApiServiceNew.getEvaluationsByStudent();
            })
            .then(function(evaluations) {
                $scope.evaluations = evaluations;
                $scope.filteredEvaluations = evaluations;
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading reports:', error);
                $scope.loading = false;
            });
    }

    $scope.applyFilters = function() {
        $scope.filteredEvaluations = $scope.evaluations.filter(function(evaluation) {
            return (!$scope.filters.course || evaluation.course_name.toLowerCase().includes($scope.filters.course.toLowerCase())) &&
                   (!$scope.filters.teacher || evaluation.teacher_name.toLowerCase().includes($scope.filters.teacher.toLowerCase())) &&
                   (!$scope.filters.subject || evaluation.subject.toLowerCase().includes($scope.filters.subject.toLowerCase())) &&
                   (!$scope.filters.evaluationType || evaluation.evaluation_type === $scope.filters.evaluationType);
        });
    };

    $scope.downloadPDFReport = function() {
        var user = AuthService.getCurrentUser();
        ApiServiceNew.evaluations.exportPDF({ type: 'student', studentId: user.id });
    };

    $scope.getGradeClass = function(grade) {
        if (grade >= 90) return 'score-excellent';
        if (grade >= 80) return 'score-good';
        if (grade >= 70) return 'score-average';
        return 'score-poor';
    };

    $scope.getScoreClass = function(score) {
        if (score >= 90) return 'score-excellent';
        if (score >= 80) return 'score-good';
        if (score >= 70) return 'score-average';
        return 'score-poor';
    };

    $scope.formatDate = function(dateString) {
        return new Date(dateString).toLocaleDateString();
    };

    $scope.viewCourseDetails = function(course) {
        $scope.selectedCourse = course;
    };

    $scope.closeCourseDetails = function() {
        $scope.selectedCourse = null;
    };

    loadReports();
});
