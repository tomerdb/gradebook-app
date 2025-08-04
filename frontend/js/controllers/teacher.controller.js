angular.module('gradeBookApp')

    // Teacher Dashboard Controller
    .controller('TeacherDashboardController', function ($scope, $location, ApiServiceNew, AuthService) {
        $scope.evaluations = [];
        $scope.students = [];
        $scope.recentEvaluations = [];
        $scope.loading = true;

        // Navigation functions for quick actions
        $scope.navigateToEvaluate = function() {
            console.log('Navigating to evaluate page');
            $location.path('/teacher/evaluate');
        };

        $scope.navigateToReports = function() {
            console.log('Navigating to reports page');
            $location.path('/teacher/reports');
        };

        function loadDashboard() {
            // Load teacher's evaluations
            ApiServiceNew.getEvaluationsByTeacher()
                .then(function (evaluations) {
                    $scope.evaluations = evaluations;
                    $scope.recentEvaluations = evaluations.slice(0, 5); // Show last 5
                })
                .catch(function (error) {
                    console.error('Error loading evaluations:', error);
                });

            // Load teacher's students
            ApiServiceNew.getStudentsByTeacher()
                .then(function (students) {
                    $scope.students = students;
                    $scope.loading = false;
                })
                .catch(function (error) {
                    console.error('Error loading students:', error);
                    $scope.loading = false;
                });
        }

        $scope.getScoreClass = function (score) {
            if (score >= 90) return 'score-excellent';
            if (score >= 80) return 'score-good';
            if (score >= 70) return 'score-average';
            return 'score-poor';
        };

        loadDashboard();
    })

    // Teacher Evaluate Controller
    .controller('TeacherEvaluateController', function ($scope, ApiServiceNew, AuthService) {
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

        $scope.evaluationTypes = [{
                value: 'exam',
                label: 'Exam'
            },
            {
                value: 'homework',
                label: 'Homework'
            },
            {
                value: 'participation',
                label: 'Participation'
            },
            {
                value: 'project',
                label: 'Project'
            },
            {
                value: 'quiz',
                label: 'Quiz'
            }
        ];

        function loadTeacherCourses() {
            var user = AuthService.getCurrentUser();
            ApiServiceNew.getCoursesByTeacher(user.id)
                .then(function (courses) {
                    $scope.courses = courses;
                    $scope.loading = false;
                })
                .catch(function (error) {
                    console.error('Error loading courses:', error);
                    $scope.loading = false;
                });
        }

        $scope.onCourseSelect = function () {
            if ($scope.evaluation.course_id) {
                $scope.loadingStudents = true;
                ApiServiceNew.getCourseStudents($scope.evaluation.course_id)
                    .then(function (students) {
                        $scope.students = students;
                        $scope.loadingStudents = false;
                        // Reset student selection when course changes
                        $scope.evaluation.student_id = '';
                    })
                    .catch(function (error) {
                        console.error('Error loading students:', error);
                        $scope.loadingStudents = false;
                    });
            } else {
                $scope.students = [];
                $scope.evaluation.student_id = '';
            }
        };

        $scope.submitEvaluation = function () {
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

            ApiServiceNew.createEvaluation($scope.evaluation)
                .then(function (response) {
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
                .catch(function (error) {
                    console.error('Error submitting evaluation:', error);
                    $scope.submitting = false;
                    alert('Error submitting evaluation: ' + (error.error || 'Unknown error'));
                });
        };

        loadTeacherCourses();
    })

    // Teacher Reports Controller
    .controller('TeacherReportsController', function ($scope, ApiServiceNew, AuthService) {
        $scope.evaluations = [];
        $scope.filteredEvaluations = [];
        $scope.loading = true;
        $scope.filters = {
            student: '',
            subject: '',
            evaluationType: ''
        };

        function loadEvaluations() {
            ApiServiceNew.getEvaluationsByTeacher()
                .then(function (evaluations) {
                    $scope.evaluations = evaluations;
                    $scope.filteredEvaluations = evaluations;
                    $scope.loading = false;
                })
                .catch(function (error) {
                    console.error('Error loading evaluations:', error);
                    $scope.loading = false;
                });
        }

        $scope.applyFilters = function () {
            $scope.filteredEvaluations = $scope.evaluations.filter(function (evaluation) {
                return (!$scope.filters.student || evaluation.student_name.toLowerCase().includes($scope.filters.student.toLowerCase())) &&
                    (!$scope.filters.subject || evaluation.subject.toLowerCase().includes($scope.filters.subject.toLowerCase())) &&
                    (!$scope.filters.evaluationType || evaluation.evaluation_type === $scope.filters.evaluationType);
            });
        };

        $scope.downloadPDFReport = function () {
            var user = AuthService.getCurrentUser();
            ApiServiceNew.evaluations.exportPDF({
                type: 'teacher',
                teacherId: user.id
            });
        };

        $scope.downloadCSVReport = function () {
            var user = AuthService.getCurrentUser();
            ApiServiceNew.evaluations.exportCSV({
                type: 'teacher',
                teacherId: user.id
            });
        };

        // Modal-related functions
        $scope.downloadType = '';
        $scope.downloadOption = '';

        $scope.showDownloadModal = function (type) {
            $scope.downloadType = type;
            $scope.downloadOption = 'all'; // Default to all

            // Use Bootstrap 5 modal
            var modalElement = document.getElementById('downloadModal');
            var modal = new window.bootstrap.Modal(modalElement);
            modal.show();
        };

        $scope.executeDownload = function () {
            if ($scope.downloadOption === 'filtered') {
                $scope.downloadFilteredData();
            } else {
                if ($scope.downloadType === 'pdf') {
                    $scope.downloadPDFReport();
                } else {
                    $scope.downloadCSVReport();
                }
            }

            // Close modal
            var modalElement = document.getElementById('downloadModal');
            var modal = window.bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        };

        $scope.downloadFilteredData = function () {
            if ($scope.downloadType === 'pdf') {
                $scope.generateFilteredPDF();
            } else {
                $scope.generateFilteredCSV();
            }
        };

        $scope.generateFilteredPDF = function () {
            // Send filtered data to backend for PDF generation
            var filteredData = {
                evaluations: $scope.filteredEvaluations,
                title: 'My Filtered Evaluation Report',
                type: 'filtered-teacher'
            };

            // Create a form and submit it to download PDF
            var form = document.createElement('form');
            form.method = 'POST';
            form.action = ApiServiceNew.getApiBase() + '/evaluations/reports/filtered-pdf';
            form.target = '_blank';

            // Add auth token
            var tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'token';
            tokenInput.value = AuthService.getToken();
            form.appendChild(tokenInput);

            // Add filtered data
            var dataInput = document.createElement('input');
            dataInput.type = 'hidden';
            dataInput.name = 'data';
            dataInput.value = JSON.stringify(filteredData);
            form.appendChild(dataInput);

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        };

        $scope.generateFilteredCSV = function () {
            var csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Student,Course,Subject,Type,Score,Feedback,Date\n";

            $scope.filteredEvaluations.forEach(function (evaluation) {
                var row = [
                    '"' + (evaluation.student_name || 'Student') + '"',
                    '"' + (evaluation.course_name || 'Course') + '"',
                    '"' + (evaluation.subject || '') + '"',
                    '"' + (evaluation.evaluation_type || '') + '"',
                    '"' + evaluation.score + '/100"',
                    '"' + (evaluation.feedback || 'No feedback').replace(/"/g, '""') + '"',
                    '"' + (evaluation.date_created || '') + '"'
                ];
                csvContent += row.join(',') + '\n';
            });

            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "filtered-evaluations.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        $scope.getScoreClass = function (score) {
            if (score >= 90) return 'score-excellent';
            if (score >= 80) return 'score-good';
            if (score >= 70) return 'score-average';
            return 'score-poor';
        };

        // Edit evaluation functionality
        $scope.editingEvaluation = {};

        $scope.editEvaluation = function(evaluation) {
            // Create a copy of the evaluation for editing
            $scope.editingEvaluation = angular.copy(evaluation);
            // Show the modal
            var modal = new bootstrap.Modal(document.getElementById('editEvaluationModal'));
            modal.show();
        };

        $scope.updateEvaluation = function() {
            if (!$scope.editingEvaluation.id) {
                console.error('No evaluation ID found');
                return;
            }

            var updateData = {
                subject: $scope.editingEvaluation.subject,
                evaluation_type: $scope.editingEvaluation.evaluation_type,
                score: $scope.editingEvaluation.score,
                feedback: $scope.editingEvaluation.feedback
            };

            ApiServiceNew.updateEvaluation($scope.editingEvaluation.id, updateData)
                .then(function(response) {
                    console.log('Evaluation updated successfully');
                    // Hide the modal
                    var modal = bootstrap.Modal.getInstance(document.getElementById('editEvaluationModal'));
                    modal.hide();
                    // Reload evaluations to show updated data
                    loadEvaluations();
                })
                .catch(function(error) {
                    console.error('Error updating evaluation:', error);
                    alert('Error updating evaluation. Please try again.');
                });
        };

        loadEvaluations();
    })

    // Teacher Courses Controller
    .controller('TeacherCoursesController', function ($scope, ApiServiceNew) {
        $scope.courses = [];
        $scope.courseEnrollments = {};
        $scope.gradingRules = {};
        $scope.showGradingRules = {};
        $scope.loading = true;

        function loadCourses() {
            ApiServiceNew.getCoursesByTeacher()
                .then(function (courses) {
                    $scope.courses = courses;
                    $scope.loadEnrollmentsAndRules();
                    $scope.loading = false;
                })
                .catch(function (error) {
                    console.error('Error loading courses:', error);
                    $scope.loading = false;
                });
        }

        $scope.loadEnrollmentsAndRules = function () {
            $scope.courses.forEach(function (course) {
                // Load enrollments
                ApiServiceNew.getCourseEnrollments(course.id)
                    .then(function (enrollments) {
                        $scope.courseEnrollments[course.id] = enrollments;
                    })
                    .catch(function (error) {
                        console.error('Error loading enrollments:', error);
                    });

                // Load grading rules
                ApiServiceNew.getCourseGradingRules(course.id)
                    .then(function (rules) {
                        $scope.gradingRules[course.id] = rules;
                    })
                    .catch(function (error) {
                        console.error('Error loading grading rules:', error);
                    });
            });
        };

        $scope.toggleGradingRules = function (courseId) {
            $scope.showGradingRules[courseId] = !$scope.showGradingRules[courseId];
        };

        $scope.getTotalWeight = function (courseId) {
            var rules = $scope.gradingRules[courseId];
            if (!rules) return 0;

            return (rules.participation_weight || 0) +
                (rules.homework_weight || 0) +
                (rules.exam_weight || 0) +
                (rules.project_weight || 0) +
                (rules.quiz_weight || 0);
        };

        $scope.updateGradingRules = function (courseId) {
            if ($scope.getTotalWeight(courseId) !== 100) {
                alert('Grading weights must sum to 100%');
                return;
            }

            ApiServiceNew.updateCourseGradingRules(courseId, $scope.gradingRules[courseId])
                .then(function () {
                    $scope.showGradingRules[courseId] = false;
                    alert('Grading rules updated successfully');
                })
                .catch(function (error) {
                    alert('Error updating grading rules: ' + (error.error || 'Unknown error'));
                });
        };

        loadCourses();
    });
