'use strict';

angular
  .module('stats')
  .controller(
    'NavbarCtrl',
    function($scope, ScriptFodder, LoadingIndicator) {
      $scope.ScriptFodder = ScriptFodder;
      $scope.loadingIndicator = LoadingIndicator;
    }
  );
