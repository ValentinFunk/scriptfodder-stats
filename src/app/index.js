'use strict';

var app = angular.module('stats', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngResource', 'ngSanitize', 'ui.router', 'ui.bootstrap', 'ngStorage', 'darthwade.loading', 'mwl.bluebird', 'daterangepicker', 'nvd3', 'angularMoment', 'ksCurrencyConvert'])

.config(function($httpProvider) {
    $httpProvider.interceptors.push(function(LoadingIndicator, $q) {
        return {
            'request': function(config) {
                LoadingIndicator.startedLoading();
                return config;
            },

            'requestError': function(rejection) {
                LoadingIndicator.finishedLoading();
                return $q.reject(rejection);
            },

            'responseError': function(rejection) {
                LoadingIndicator.finishedLoading();
                return $q.reject(rejection);
            },

            'response': function(response) {
                LoadingIndicator.finishedLoading();
                return response;
            }
        };
    });
})

.run(function($transitions, $state, ScriptFodder){
  $transitions.onBefore({to: 'statistics.*'}, ['$state', '$transition$', function($transition$) {
    if (!ScriptFodder.loaded) {
      console.log("Scriptfodder isn't loaded, redirecting to loading");
      return $state.target('loading');
    }
  }]);

  // Matches if the destination state has a 'redirectTo' property
  var matchCriteria = { to: function (state) { return state.redirectTo != null; } };
  // Function that returns a redirect for a transition, with a TargetState created using the destination state's 'redirectTo' property
  var redirectFn = function ($transition$) { return $state.target($transition$.to().redirectTo); };
  // Register the global 'redirectTo' hook
  $transitions.onBefore(matchCriteria, redirectFn);
})

.run(['$trace', function ($trace) { $trace.enable(1); }])

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider
    .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl'
    })

    .state('statistics', {
        url: '/stats',
        templateUrl: 'app/statistics/statistics.html',
        controller: 'StatisticsCtrl',
        redirectTo: 'statistics.dashboard',
        abstract: true,
        resolve: {
          scripts: function(ScriptFodder) {
            return ScriptFodder.getScriptInfo();
          }
        }
    })

    .state('loading', {
      url: '/loading',
      templateUrl: 'app/statistics/loading.html',
      controller: 'LoadingCtrl',
      resolve: {
        returnTo: function($transition$) {
          var redirectedFrom = $transition$.previous();
          // The user was redirected to the loading state (via the a hook)
          if (redirectedFrom != null) {
              // Follow the current transition's redirect chain all the way back to the original attempted transition
              while (redirectedFrom.previous()) {
                  redirectedFrom = redirectedFrom.previous();
              }
              // return to the original attempted "to state"
              return { state: redirectedFrom.to(), params: redirectedFrom.params("to") };
          }
          // The user was not redirected to the loading state; they directly activated the loading state somehow.
          // Return them to the state they came from.
          var fromState = $transition$.from();
          var fromParams = $transition$.params("from");
          if (fromState.name !== '') {
              return { state: fromState, params: fromParams };
          }
          // If the fromState's name is empty, then this was the initial transition. Just return them to the home state
          return { state: 'home' };
        }
      }
    })

    .state('statistics.dashboard', {
        url: '',
        templateUrl: 'app/statistics/dashboard.html',
        controller: 'DashboardCtrl'
    })

    .state('statistics.related', {
        url: '/related',
        templateUrl: 'app/statistics/purchaseinfo.html',
        controller: 'PurchaseInfoCtrl'
    })

    .state('statistics.revenue', {
        url: '/revenue',
        templateUrl: 'app/statistics/revenue.html',
        controller: 'RevenueCtrl'
    })

    .state('statistics.alltime', {
        url: '/alltime',
        templateUrl: 'app/statistics/alltime.html',
        controller: 'AlltimeCtrl'
    })

    .state('statistics.monthly', {
        url: '/monthly',
        templateUrl: 'app/statistics/monthly.html',
        controller: 'MonthlyCtrl'
    })

    .state('about', {
        url: '/about',
        templateUrl: 'app/about/about.html'
    });

    $urlRouterProvider.otherwise('/');
})

.run(function($localStorage){
    $localStorage.globalCurrency = $localStorage.globalCurrency || 'USD';
});
