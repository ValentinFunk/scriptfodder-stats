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
        abstract: true,
        resolve: {
            scripts: function(ScriptFodder, $state) {
                return ScriptFodder.initialize().then(function() {
                    return ScriptFodder.Scripts.query().$promise;
                })
                .map(function(script) {
                    return script.$info();
                })
                .map(function(script) {
                    return ScriptFodder.Scripts.purchases({
                        scriptId: script.id
                    }).$promise.then(function(purchases) {
                        script.purchases = purchases;
                        return script;
                    }).catch(console.log.bind(console));
                })
                .catch(function(){
                    $state.go('home');
                });
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