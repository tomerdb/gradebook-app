angular.module('gradeBookApp')

// Teacher Dashboard Controller
.controller('TeacherDashboardController', function($scope, ApiService, AuthService) {
    $scope.evaluations = [];
    $scope.students = [];
    $scope.recentEvaluations = [];
    $scope.loading = true;

    function loadDashboard() {
        // Load teacher's evaluations
        ApiService.getEvaluationsByTeacher()
            .then(function(evaluations) {
                $scope.evaluations = evaluations;
                $scope.recentEvaluations = evaluations.slice(0, 5); // Show last 5
            })
            .catch(function(error) {
                console.error('Error loading evaluations:', error);
            });

        // Load teacher's students
        ApiService.getStudentsByTeacher()
            .then(function(students) {
                $scope.students = students;
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading students:', error);
                $scope.loading = false;
            });
    }

    $scope.getScoreClass = function(score) {
        if (score >= 90) return 'score-excellent';
        if (score >= 80) return 'score-good';
        if (score >= 70) return 'score-average';
        return 'score-poor';
    };

    loadDashboard();
})

// Teacher Evaluate Controller
.controller('TeacherEvaluateController', function($scope, ApiService, AuthService) {
    $scope.courses = [];
    $scope.students = [];
    $scope.evaluation = {
        student_id: '',
        course_id: '',
        subject: '',
        evaluation_type: 'exam',
        score: '',
        feedback: ''
    };
    $scope.loading = true;
    $scope.submitting = false;

    $scope.evaluationTypes = [
        { value: 'exam', label: 'Exam' },
        { value: 'homework', label: 'Homework' },
        { value: 'participation', label: 'Participation' },
        { value: 'project', label: 'Project' },
        { value: 'quiz', label: 'Quiz' }
    ];

    function loadTeacherCourses() {
        var user = AuthService.getCurrentUser();
        ApiService.getCoursesByTeacher(user.id)
            .then(function(courses) {
                $scope.courses = courses;
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading courses:', error);
                $scope.loading = false;
            });
    }

    $scope.onCourseSelect = function() {
        if ($scope.evaluation.course_id) {
            $scope.loadingStudents = true;
            ApiService.getCourseStudents($scope.evaluation.course_id)
                .then(function(students) {
                    $scope.students = students;
                    $scope.loadingStudents = false;
                    // Reset student selection when course changes
                    $scope.evaluation.student_id = '';
                })
                .catch(function(error) {
                    console.error('Error loading students:', error);
                    $scope.loadingStudents = false;
                });
        } else {
            $scope.students = [];
            $scope.evaluation.student_id = '';
        }
    };

    $scope.submitEvaluation = function() {
        console.log('Submit evaluation called with data:', $scope.evaluation);
        
        if (!$scope.evaluation.student_id || !$scope.evaluation.course_id || !$scope.evaluation.subject || 
            !$scope.evaluation.score || $scope.evaluation.score < 0 || $scope.evaluation.score > 100) {
            console.log('Validation failed:', {
                student_id: $scope.evaluation.student_id,
                course_id: $scope.evaluation.course_id,
                subject: $scope.evaluation.subject,
                score: $scope.evaluation.score
            });
            alert('Please fill in all required fields and ensure score is between 0-100');
            return;
        }

        $scope.submitting = true;
        console.log('Submitting evaluation:', $scope.evaluation);

        ApiService.createEvaluation($scope.evaluation)
            .then(function(response) {
                console.log('Evaluation submitted successfully:', response);
                $scope.submitting = false;
                alert('Evaluation submitted successfully!');
                // Reset form
                $scope.evaluation = {
                    student_id: '',
                    course_id: '',
                    subject: '',
                    evaluation_type: 'exam',
                    score: '',
                    feedback: ''
                };
                $scope.students = [];
            })
            .catch(function(error) {
                console.error('Error submitting evaluation:', error);
                $scope.submitting = false;
                alert('Error submitting evaluation: ' + (error.error || 'Unknown error'));
            });
    };

    loadTeacherCourses();
})

// Teacher Reports Controller
.controller('TeacherReportsController', function($scope, ApiService, AuthService) {
    $scope.evaluations = [];
    $scope.filteredEvaluations = [];
    $scope.loading = true;
    $scope.filters = {
        student: '',
        subject: '',
        evaluationType: ''
    };

    function loadEvaluations() {
        ApiService.getEvaluationsByTeacher()
            .then(function(evaluations) {
                $scope.evaluations = evaluations;
                $scope.filteredEvaluations = evaluations;
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading evaluations:', error);
                $scope.loading = false;
            });
    }

    $scope.applyFilters = function() {
        $scope.filteredEvaluations = $scope.evaluations.filter(function(evaluation) {
            return (!$scope.filters.student || evaluation.student_name.toLowerCase().includes($scope.filters.student.toLowerCase())) &&
                   (!$scope.filters.subject || evaluation.subject.toLowerCase().includes($scope.filters.subject.toLowerCase())) &&
                   (!$scope.filters.evaluationType || evaluation.evaluation_type === $scope.filters.evaluationType);
        });
    };

    $scope.downloadPDFReport = function() {
        var user = AuthService.getCurrentUser();
        var url = ApiService.downloadPDFReport({ type: 'teacher', teacherId: user.id });
        window.open(url, '_blank');
    };

    $scope.downloadCSVReport = function() {
        var user = AuthService.getCurrentUser();
        var url = ApiService.downloadCSVReport({ type: 'teacher', teacherId: user.id });
        window.open(url, '_blank');
    };

    $scope.downloadStudentGradeSheet = function(studentId) {
        var url = ApiService.downloadPDFReport({ type: 'student', studentId: studentId });
        window.open(url, '_blank');
    };

    $scope.getScoreClass = function(score) {
        if (score >= 90) return 'score-excellent';
        if (score >= 80) return 'score-good';
        if (score >= 70) return 'score-average';
        return 'score-poor';
    };

    loadEvaluations();
})

// Teacher Courses Controller
.controller('TeacherCoursesController', function($scope, ApiService) {
    $scope.courses = [];
    $scope.courseEnrollments = {};
    $scope.gradingRules = {};
    $scope.showGradingRules = {};
    $scope.loading = true;

    function loadCourses() {
        ApiService.getCoursesByTeacher()
            .then(function(courses) {
                $scope.courses = courses;
                $scope.loadEnrollmentsAndRules();
                $scope.loading = false;
            })
            .catch(function(error) {
                console.error('Error loading courses:', error);
                $scope.loading = false;
            });
    }

    $scope.loadEnrollmentsAndRules = function() {
        $scope.courses.forEach(function(course) {
            // Load enrollments
            ApiService.getCourseEnrollments(course.id)
                .then(function(enrollments) {
                    $scope.courseEnrollments[course.id] = enrollments;
                })
                .catch(function(error) {
                    console.error('Error loading enrollments:', error);
                });

            // Load grading rules
            ApiService.getCourseGradingRules(course.id)
                .then(function(rules) {
                    $scope.gradingRules[course.id] = rules;
                })
                .catch(function(error) {
                    console.error('Error loading grading rules:', error);
                });
        });
    };

    $scope.toggleGradingRules = function(courseId) {
        $scope.showGradingRules[courseId] = !$scope.showGradingRules[courseId];
    };

    $scope.getTotalWeight = function(courseId) {
        var rules = $scope.gradingRules[courseId];
        if (!rules) return 0;
        
        return (rules.participation_weight || 0) + 
               (rules.homework_weight || 0) + 
               (rules.exam_weight || 0) + 
               (rules.project_weight || 0) + 
               (rules.quiz_weight || 0);
    };

    $scope.updateGradingRules = function(courseId) {
        if ($scope.getTotalWeight(courseId) !== 100) {
            alert('Grading weights must sum to 100%');
            return;
        }

        ApiService.updateCourseGradingRules(courseId, $scope.gradingRules[courseId])
            .then(function() {
                $scope.showGradingRules[courseId] = false;
                alert('Grading rules updated successfully');
            })
            .catch(function(error) {
                alert('Error updating grading rules: ' + (error.error || 'Unknown error'));
            });
    };

    loadCourses();
});
