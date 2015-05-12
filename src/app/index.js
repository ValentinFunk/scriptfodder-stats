'use strict';

angular.module('stats', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngResource', 'ngSanitize', 'ui.router', 'ui.bootstrap', 'ngStorage', 'darthwade.loading'])
  .config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
      })
      
      .state('about', {
        url: '/about',
        templateUrl: 'app/about/about.html'
      });

    $urlRouterProvider.otherwise('/');
  })
;
