'use strict';

angular.module('stats')
.controller('NavbarCtrl', function($scope, ScriptFodder, LoadingIndicator, $rootScope) {
    $scope.ScriptFodder = ScriptFodder

    $scope.loadingIndicator = LoadingIndicator;
});
