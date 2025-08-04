angular.module('gradeBookApp')

    // Admin Dashboard Controller
    .controller('AdminDashboardController', function ($scope, ApiService) {
        $scope.stats = {};
        $scope.recentEvaluations = [];
        $scope.loading = true;

        function loadDashboard() {
            // Load statistics
            ApiService.getEvaluationStats()
                .then(function (stats) {
                    $scope.stats = stats;
                })
                .catch(function (error) {
                    console.error('Error loading stats:', error);
                });

            // Load recent evaluations
            ApiService.getEvaluations()
                .then(function (evaluations) {
                    $scope.recentEvaluations = evaluations.slice(0, 10); // Show last 10
                    $scope.loading = false;
                })
                .catch(function (error) {
                    console.error('Error loading evaluations:', error);
                    $scope.loading = false;
                });
        }

        loadDashboard();
    })

    // Admin Users Controller
    .controller('AdminUsersController', function ($scope, ApiService) {
        $scope.users = [];
        $scope.newUser = {
            name: '',
            email: '',
            password: '',
            role: 'student'
        };
        $scope.editingUser = null;
        $scope.loading = true;
        $scope.showAddForm = false;
        $scope.showCourseManagement = false;

        // Course management data
        $scope.courses = [];
        $scope.courseEnrollments = {};
        $scope.newCourse = {
            name: '',
            description: '',
            teacher_id: ''
        };

        function loadUsers() {
            ApiService.getUsers()
                .then(function (users) {
                    $scope.users = users;
                    $scope.loading = false;
                })
                .catch(function (error) {
                    console.error('Error loading users:', error);
                    $scope.loading = false;
                });
        }

        $scope.createUser = function () {
            if (!$scope.newUser.name || !$scope.newUser.email || !$scope.newUser.password) {
                alert('Please fill in all fields');
                return;
            }

            ApiService.createUser($scope.newUser)
                .then(function (response) {
                    loadUsers();
                    $scope.newUser = {
                        name: '',
                        email: '',
                        password: '',
                        role: 'student'
                    };
                    $scope.showAddForm = false;
                    alert('User created successfully');
                })
                .catch(function (error) {
                    alert('Error creating user: ' + (error.error || 'Unknown error'));
                });
        };

        $scope.editUser = function (user) {
            $scope.editingUser = angular.copy(user);
        };

        $scope.updateUser = function () {
            ApiService.updateUser($scope.editingUser.id, $scope.editingUser)
                .then(function (response) {
                    loadUsers();
                    $scope.editingUser = null;
                    alert('User updated successfully');
                })
                .catch(function (error) {
                    alert('Error updating user: ' + (error.error || 'Unknown error'));
                });
        };

        $scope.deleteUser = function (user) {
            if (confirm('Are you sure you want to delete ' + user.name + '?')) {
                ApiService.deleteUser(user.id)
                    .then(function (response) {
                        loadUsers();
                        alert('User deleted successfully');
                    })
                    .catch(function (error) {
                        alert('Error deleting user: ' + (error.error || 'Unknown error'));
                    });
            }
        };

        // Tab management functions
        $scope.showAddUserTab = function() {
            $scope.showAddForm = true;
            $scope.showCourseManagement = false;
        };

        $scope.showCourseManagementTab = function() {
            $scope.showCourseManagement = true;
            $scope.showAddForm = false;
            loadCourseData();
        };

        $scope.cancelAddUser = function() {
            $scope.showAddForm = false;
            // Reset the form data
            $scope.newUser = {
                name: '',
                email: '',
                password: '',
                role: 'student'
            };
        };

        $scope.cancelEdit = function () {
            $scope.editingUser = null;
        };

        // Assignment functionality
        $scope.teachers = [];
        $scope.students = [];
        $scope.assignments = [];
        $scope.showAssignments = false;

        $scope.loadCourseData = function () {
            // Load courses
            ApiService.getCourses()
                .then(function (courses) {
                    $scope.courses = courses;
                    $scope.loadAllEnrollments();
                })
                .catch(function (error) {
                    console.error('Error loading courses:', error);
                });

            // Load teachers
            ApiService.getTeachers()
                .then(function (teachers) {
                    $scope.teachers = teachers;
                })
                .catch(function (error) {
                    console.error('Error loading teachers:', error);
                });

            // Load students
            ApiService.getStudents()
                .then(function (students) {
                    $scope.students = students;
                })
                .catch(function (error) {
                    console.error('Error loading students:', error);
                });
        };

        $scope.loadAllEnrollments = function () {
            $scope.courseEnrollments = {};
            $scope.courses.forEach(function (course) {
                ApiService.getCourseEnrollments(course.id)
                    .then(function (enrollments) {
                        $scope.courseEnrollments[course.id] = enrollments;
                    })
                    .catch(function (error) {
                        console.error('Error loading enrollments for course', course.id, ':', error);
                    });
            });
        };

        $scope.createCourse = function () {
            if (!$scope.newCourse.name || !$scope.newCourse.teacher_id) {
                alert('Please fill in course name and select a teacher');
                return;
            }

            ApiService.createCourse($scope.newCourse)
                .then(function (response) {
                    $scope.loadCourseData();
                    $scope.newCourse = {
                        name: '',
                        description: '',
                        teacher_id: ''
                    };
                    alert('Course created successfully');
                })
                .catch(function (error) {
                    alert('Error creating course: ' + (error.error || 'Unknown error'));
                });
        };

        $scope.deleteCourse = function (courseId) {
            if (confirm('Are you sure you want to delete this course? This will also delete all enrollments and evaluations.')) {
                ApiService.deleteCourse(courseId)
                    .then(function () {
                        $scope.loadCourseData();
                        alert('Course deleted successfully');
                    })
                    .catch(function (error) {
                        alert('Error deleting course: ' + (error.error || 'Unknown error'));
                    });
            }
        };

        $scope.enrollStudent = function (studentId, courseId) {
            ApiService.enrollStudent(studentId, courseId)
                .then(function () {
                    $scope.loadAllEnrollments();
                    alert('Student enrolled successfully');
                })
                .catch(function (error) {
                    alert('Error enrolling student: ' + (error.error || 'Unknown error'));
                });
        };

        $scope.unenrollStudent = function (studentId, courseId) {
            if (confirm('Are you sure you want to unenroll this student?')) {
                ApiService.unenrollStudent(studentId, courseId)
                    .then(function () {
                        $scope.loadAllEnrollments();
                        alert('Student unenrolled successfully');
                    })
                    .catch(function (error) {
                        alert('Error unenrolling student: ' + (error.error || 'Unknown error'));
                    });
            }
        };

        $scope.isStudentEnrolled = function (studentId, courseId) {
            var enrollments = $scope.courseEnrollments[courseId];
            if (!enrollments) return false;
            return enrollments.some(function (enrollment) {
                return enrollment.student_id === studentId;
            });
        };

        // Legacy assignment functionality (keep for compatibility)
        $scope.showAssignments = false;

        $scope.loadAssignmentData = function () {
            // Load teachers
            ApiService.getTeachers()
                .then(function (teachers) {
                    $scope.teachers = teachers;
                })
                .catch(function (error) {
                    console.error('Error loading teachers:', error);
                });

            // Load students
            ApiService.getStudents()
                .then(function (students) {
                    $scope.students = students;
                })
                .catch(function (error) {
                    console.error('Error loading students:', error);
                });

            // Load current assignments
            ApiService.getTeacherAssignments()
                .then(function (assignments) {
                    console.log('Assignments loaded:', assignments);
                    $scope.assignments = assignments;
                    $scope.processAssignments();
                })
                .catch(function (error) {
                    console.error('Error loading assignments:', error);
                    // Initialize empty assignments if API fails
                    $scope.assignments = [];
                    $scope.teacherAssignments = {};
                });
        };

        $scope.processAssignments = function () {
            // Group assignments by teacher for easier display
            $scope.teacherAssignments = {};
            $scope.assignments.forEach(function (assignment) {
                if (!$scope.teacherAssignments[assignment.teacher_id]) {
                    $scope.teacherAssignments[assignment.teacher_id] = {
                        teacher: {
                            id: assignment.teacher_id,
                            name: assignment.teacher_name
                        },
                        students: []
                    };
                }
                if (assignment.student_id) {
                    $scope.teacherAssignments[assignment.teacher_id].students.push({
                        id: assignment.student_id,
                        name: assignment.student_name,
                        email: assignment.student_email
                    });
                }
            });
        };

        $scope.assignStudent = function (studentId, teacherId) {
            ApiService.assignStudentToTeacher(studentId, teacherId)
                .then(function () {
                    $scope.loadAssignmentData();
                    alert('Student assigned successfully');
                })
                .catch(function (error) {
                    alert('Error assigning student: ' + (error.error || 'Unknown error'));
                });
        };

        $scope.unassignStudent = function (studentId, teacherId) {
            if (confirm('Are you sure you want to unassign this student?')) {
                ApiService.unassignStudentFromTeacher(studentId, teacherId)
                    .then(function () {
                        $scope.loadAssignmentData();
                        alert('Student unassigned successfully');
                    })
                    .catch(function (error) {
                        alert('Error unassigning student: ' + (error.error || 'Unknown error'));
                    });
            }
        };

        $scope.isStudentAssigned = function (studentId, teacherId) {
            var teacherAssignment = $scope.teacherAssignments[teacherId];
            if (!teacherAssignment) return false;
            return teacherAssignment.students.some(function (student) {
                return student.id === studentId;
            });
        };

        $scope.hasAnyAssignment = function (studentId) {
            for (var teacherId in $scope.teacherAssignments) {
                if ($scope.isStudentAssigned(studentId, teacherId)) {
                    return true;
                }
            }
            return false;
        };

        loadUsers();
        $scope.loadCourseData();
        $scope.loadAssignmentData();
    })

    // Admin Reports Controller
    .controller('AdminReportsController', function ($scope, ApiService, AuthService) {
        $scope.evaluations = [];
        $scope.filteredEvaluations = [];
        $scope.loading = true;
        $scope.filters = {
            teacher: '',
            student: '',
            subject: '',
            evaluationType: ''
        };

        function loadEvaluations() {
            ApiService.getEvaluations()
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
                return (!$scope.filters.teacher || evaluation.teacher_name.toLowerCase().includes($scope.filters.teacher.toLowerCase())) &&
                    (!$scope.filters.student || evaluation.student_name.toLowerCase().includes($scope.filters.student.toLowerCase())) &&
                    (!$scope.filters.subject || evaluation.subject.toLowerCase().includes($scope.filters.subject.toLowerCase())) &&
                    (!$scope.filters.evaluationType || evaluation.evaluation_type === $scope.filters.evaluationType);
            });
        };

        $scope.downloadPDFReport = function () {
            var url = ApiService.downloadPDFReport({
                type: 'all'
            });
            window.open(url, '_blank');
        };

        $scope.downloadCSVReport = function () {
            var url = ApiService.downloadCSVReport({
                type: 'all'
            });
            window.open(url, '_blank');
        };

        // Modal-related functions
        $scope.downloadType = '';
        $scope.downloadOption = '';

        $scope.showDownloadModal = function (type) {
            $scope.downloadType = type;
            $scope.downloadOption = 'all'; // Default to all

            // Check if modal element exists
            var modalElement = document.getElementById('downloadModal');
            
            if (!modalElement) {
                console.error('Modal element not found!');
                return;
            }

            try {
                // Use Bootstrap 5 modal
                var modal = new window.bootstrap.Modal(modalElement);
                modal.show();
            } catch (error) {
                console.error('Error showing modal:', error);
            }
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
                title: 'Filtered Evaluation Report',
                type: 'filtered-admin'
            };

            // Create a form and submit it to download PDF
            var form = document.createElement('form');
            form.method = 'POST';
            form.action = ApiService.getApiBase() + '/evaluations/reports/filtered-pdf';
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
            csvContent += "Student,Teacher,Course,Subject,Type,Score,Feedback,Date\n";

            $scope.filteredEvaluations.forEach(function (evaluation) {
                var row = [
                    '"' + (evaluation.student_name || 'Student') + '"',
                    '"' + (evaluation.teacher_name || 'Teacher') + '"',
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

        $scope.downloadStudentGradeSheet = function (studentId) {
            var url = ApiService.downloadPDFReport({
                type: 'student',
                studentId: studentId
            });
            window.open(url, '_blank');
        };

        $scope.getScoreClass = function (score) {
            if (score >= 90) return 'score-excellent';
            if (score >= 80) return 'score-good';
            if (score >= 70) return 'score-average';
            return 'score-poor';
        };

        loadEvaluations();
    });