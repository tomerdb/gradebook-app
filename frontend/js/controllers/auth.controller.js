angular.module('gradeBookApp')
.controller('AuthController', function($scope, $location, AuthService, ApiServiceNew) {
    $scope.credentials = {
        email: '',
        password: ''
    };
    $scope.loading = false;
    $scope.error = '';

    // Check if already authenticated
    if (AuthService.isAuthenticated()) {
        AuthService.redirectToDashboard();
        return;
    }

    $scope.login = function() {
        if (!$scope.credentials.email || !$scope.credentials.password) {
            $scope.error = 'Please enter both email and password';
            return;
        }

        $scope.loading = true;
        $scope.error = '';

        AuthService.login($scope.credentials)
            .then(function(response) {
                $scope.loading = false;
                AuthService.redirectToDashboard();
            })
            .catch(function(error) {
                $scope.loading = false;
                $scope.error = error.error || 'Login failed. Please try again.';
            });
    };

    $scope.clearError = function() {
        $scope.error = '';
    };
});
