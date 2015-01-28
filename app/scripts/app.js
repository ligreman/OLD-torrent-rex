var myApp = angular.module('TorrentRex', [
    'appControllers',
    'ngRoute',
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngMaterial'
]).config(['$routeProvider', '$mdThemingProvider',
    function ($routeProvider, $mdThemingProvider) {
        //Routing
        $routeProvider.
            when('/main', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            }).
            when('/series', {
                templateUrl: 'views/series.html',
                controller: 'SeriesCtrl'
            }).
            when('/about', {
                templateUrl: 'views/about.html',
                //controller: 'PhoneDetailCtrl'
            }).
            otherwise({
                redirectTo: '/main'
            });

        //El Theme
        $mdThemingProvider.theme('default')
            .primaryColor('indigo')
            .accentColor('cyan');
    }]);