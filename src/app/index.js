'use strict';

angular.module('stats', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ui.router', 'ui.bootstrap'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      })
      .state('stats', {
        url: '/stats/:statId',
        templateUrl: 'app/main/stats.html',
        controller: 'StatCtrl'
      });

    $urlRouterProvider.otherwise('/');
  })
;
