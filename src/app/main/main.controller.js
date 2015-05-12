'use strict';

angular.module('stats')

.controller('MainCtrl', function($scope, $localStorage, $loading, ScriptFodder) {
    $scope.$storage = $localStorage;

    $scope.performCheck = function() {
        $loading.start('checkApiKey');
        $scope.checkResult = {};
        ScriptFodder.Scripts.query().$promise
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
});
