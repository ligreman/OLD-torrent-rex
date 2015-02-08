var myApp = angular.module('TorrentRex', [
    'appControllers',
    'appServices',
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
            when('/chapters', {
                templateUrl: 'views/chapters.html',
                controller: 'ChaptersCtrl'
            }).
            when('/torrents', {
                templateUrl: 'views/torrents.html',
                controller: 'TorrentsCtrl'
            }).
            otherwise({
                redirectTo: '/main'
            });

        //El Theme
        $mdThemingProvider.theme('default')
            .primaryColor('indigo')
            .accentColor('green');
    }]);

/*$rootScope.DEBUG_MODE = true;
 $rootScope.logger = function logger(msg) {
 if ($rootScope.DEBUG_MODE) {
 console.log(msg);
 }
 };*/