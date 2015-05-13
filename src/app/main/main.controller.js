'use strict';

angular.module('stats')

.controller('MainCtrl', function($scope, $localStorage, $loading, ScriptFodder) {
    $scope.$storage = $localStorage;

    $scope.performCheck = function() {
        $loading.start('checkApiKey');
        $scope.checkResult = {};
        ScriptFodder.initialize()
        .then(function() {
            $loading.finish('checkApiKey');
            $scope.checkResult = {
              status: 'success'  
            };
            
            ScriptFodder.Scripts.query().$promise.then(function(scripts){
               console.log(scripts);
               for (var i = 0; i < scripts.length; i++) {
                   scripts[i].$info().then(function(script){
                      console.log(script);
                      console.log(scripts[i]);
                   });
               }
            });
        }, function(err) {
            $loading.finish('checkApiKey');
            $scope.checkResult = {
                status: 'error',
                error: err
            };
        });
    };
    
    if ($scope.$storage.apiKey) {
        ScriptFodder.initialize();
    }
});
