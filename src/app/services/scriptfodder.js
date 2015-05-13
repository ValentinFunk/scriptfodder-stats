function appendTransform(defaults, transform) {

  // We can't guarantee that the default transformation is an array
  defaults = angular.isArray(defaults) ? defaults : [defaults];

  // Append the new transformation to the defaults
  return defaults.concat(transform);
}

angular.module('stats')

.config(function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
})

.factory('ScriptFodder', function($resource, $localStorage, $http, $q) {
    var ScriptFodder = {};
    
     var initApi = function() {
        ScriptFodder.Scripts = $resource('https://scriptfodder.com/api/scripts/info/:scriptId?api_key=' + $localStorage.apiKey, {scriptId: '@id'}, {
            query: {
                method: 'GET',
                url: 'https://scriptfodder.com/api/scripts?api_key=' + $localStorage.apiKey,
                isArray: true,
                transformResponse: appendTransform($http.defaults.transformResponse, function(response) {
                    return response.scripts;
                })
            },
            info: {
                method: 'GET',
                transformResponse: appendTransform($http.defaults.transformResponse, function(response) {
                    return response.script;
                })
            },
            purchases: {
                method: 'GET', 
                url: 'https://scriptfodder.com/api/scripts/purchases/:scriptId?api_key=' + $localStorage.apiKey,
                isArray: true,
                transformResponse: appendTransform($http.defaults.transformResponse, function(response) {
                    response.purchases = _(response.purchases)
                    .mapValues(function(val){
                       val.price = val.price && parseFloat(val.price) || 0;
                       return val;
                    })
                    .toArray()
                    .value();
                    return response.purchases;
                })
            }
        });
    };
    
    ScriptFodder.ready = false;
    ScriptFodder.initialize = function() {
        if (this.ready) {
            $q.resolve();
        }
        
        this.initializing = true;
        initApi();
        return this.Scripts.query().$promise.then(function(){
           ScriptFodder.ready = true; 
        });
    };
    
    ScriptFodder.isReady = function() {
        return this.ready;  
    };
    
   
    return ScriptFodder;
});