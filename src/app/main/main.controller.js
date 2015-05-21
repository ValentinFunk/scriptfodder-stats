'use strict';

angular.module('stats')

.controller('MainCtrl', function($scope, $localStorage, $loading, ScriptFodder, $rootScope) {
    $scope.$storage = $localStorage;
    $scope.$storage.globalCurrency = $scope.$storage.globalCurrency || 'USD';

    $scope.performCheck = function() {
        $loading.start('checkApiKey');
        $scope.checkResult = {};
        ScriptFodder.initialize()
        .then(function() {
            $loading.finish('checkApiKey');
            $scope.checkResult = {
              status: 'success'  
            };
        }, function(err) {
            $loading.finish('checkApiKey');
            $scope.checkResult = {
                status: 'error',
                error: err
            };
        });
    };
    
    if ($scope.$storage.apiKey) {
        $scope.performCheck();
    }
});
