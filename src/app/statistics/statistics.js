'use strict';

angular
  .module('stats')
  .controller('StatisticsCtrl', function($scope, $localStorage) {
    $scope.$storage = $localStorage;
  });
