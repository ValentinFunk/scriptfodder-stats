angular.module('stats')

.config(function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
})

.factory('ScriptFodder', function($resource, $localStorage) {
    var ScriptFodder = {};
    ScriptFodder.Scripts = $resource('http://scriptfodder.com', {}, {
        query: {
            method: 'GET',
            url: 'https://scriptfodder.com/api/scripts?api_key=' + $localStorage.apiKey,
            isArray: true,
            transformResponse: function(response) {
                console.log(response);
                response.data = response.data;
            }
        },
        info: {
            method: 'GET',
            url: '/api/scripts/info/:id',
            transformResponse: function(response) {
                response.data = response.data;
            }
        }
    });

    return ScriptFodder;
});