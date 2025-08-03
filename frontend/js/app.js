// Grade Book AngularJS App
angular.module('gradeBookApp', ['ngRoute'])
.config(function($routeProvider, $locationProvider) {
    $routeProvider
        // Public Routes
        .when('/login', {
            templateUrl: 'views/login.html',
            controller: 'AuthController'
        })
        
        // Admin Routes
        .when('/admin/dashboard', {
            templateUrl: 'views/admin/dashboard.html',
            controller: 'AdminDashboardController',
            resolve: {
                auth: function(AuthService) {
                    return AuthService.requireRole('admin');
                }
            }
        })
        .when('/admin/users', {
            templateUrl: 'views/admin/users.html',
            controller: 'AdminUsersController',
            resolve: {
                auth: function(AuthService) {
                    return AuthService.requireRole('admin');
                }
            }
        })
        .when('/admin/reports', {
            templateUrl: 'views/admin/reports.html',
            controller: 'AdminReportsController',
            resolve: {
                auth: function(AuthService) {
                    return AuthService.requireRole('admin');
                }
            }
        })
        
        // Teacher Routes
        .when('/teacher/dashboard', {
            templateUrl: 'views/teacher/dashboard.html',
            controller: 'TeacherDashboardController',
            resolve: {
                auth: function(AuthService) {
                    return AuthService.requireRole('teacher');
                }
            }
        })
        .when('/teacher/courses', {
            templateUrl: 'views/teacher/courses.html',
            controller: 'TeacherCoursesController',
            resolve: {
                auth: function(AuthService) {
                    return AuthService.requireRole('teacher');
                }
            }
        })
        .when('/teacher/evaluate', {
            templateUrl: 'views/teacher/evaluate.html',
            controller: 'TeacherEvaluateController',
            resolve: {
                auth: function(AuthService) {
                    return AuthService.requireRole('teacher');
                }
            }
        })
        .when('/teacher/reports', {
            templateUrl: 'views/teacher/reports.html',
            controller: 'TeacherReportsController',
            resolve: {
                auth: function(AuthService) {
                    return AuthService.requireRole('teacher');
                }
            }
        })
        
        // Student Routes
        .when('/student/dashboard', {
            templateUrl: 'views/student/dashboard.html',
            controller: 'StudentDashboardController',
            resolve: {
                auth: function(AuthService) {
                    return AuthService.requireRole('student');
                }
            }
        })
        .when('/student/reports', {
            templateUrl: 'views/student/reports.html',
            controller: 'StudentReportsController',
            resolve: {
                auth: function(AuthService) {
                    return AuthService.requireRole('student');
                }
            }
        })
        
        // Default Route
        .when('/', {
            template: '',
            controller: function($location, AuthService) {
                if (AuthService.isAuthenticated()) {
                    var user = AuthService.getCurrentUser();
                    switch(user.role) {
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
            }
        })
        
        // 404 Route
        .otherwise({
            redirectTo: '/login'
        });
})
.run(function($rootScope, $location, AuthService) {
    // Check authentication on route change
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if (next.$$route && next.$$route.resolve && next.$$route.resolve.auth) {
            // Route requires authentication
            if (!AuthService.isAuthenticated()) {
                event.preventDefault();
                $location.path('/login');
            }
        }
    });
    
    // Handle route change errors
    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
        if (rejection === 'UNAUTHORIZED') {
            $location.path('/login');
        }
    });
});
