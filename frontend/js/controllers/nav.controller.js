angular.module('gradeBookApp')
    .controller('NavController', function ($scope, $rootScope, $location, AuthService) {
        $scope.user = null;

        $scope.isAuthenticated = function () {
            return AuthService.isAuthenticated();
        };

        $scope.getCurrentUser = function () {
            return AuthService.getCurrentUser();
        };

        $scope.navigateTo = function (path) {
            $location.path(path);
        };

        $scope.logout = function () {
            AuthService.logout();
        };

        // Watch for user changes
        $scope.$watch(function () {
            return AuthService.getCurrentUser();
        }, function (newUser) {
            $scope.user = newUser;
        });

        // Listen for route changes to update navbar
        $rootScope.$on('$routeChangeSuccess', function () {
            $scope.$apply();
        });

        // Initialize
    });