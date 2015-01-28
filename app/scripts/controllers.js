var appControllers = angular.module('appControllers', []);

//Controlador de la vista inicial
appControllers.controller('MainCtrl', ['$scope', '$location', '$http',
    function ($scope, $location, $http) {
        //GoTo
        $scope.goto = function (path) {
            $location.path('/' + path);
        };
    }]);

//Controlador de la vista de Añadir serie - Categorias
appControllers.controller('SeriesCtrl', ['$scope', '$location', '$http', 'paramService',
    function ($scope, $location, $http, paramService) {
        $scope.loading = true;

        //Consulto el WS para obtener las categorías
        $http.get('http://trex-lovehinaesp.rhcloud.com/api/tx/categories').
            success(function (data) {
                console.log(data);
                $scope.categories = data.categories;
                $scope.loading = false;
            });

        //GoTo
        $scope.goto = function (path, param) {
            console.log("me voy de aqui " + param);
            paramService.setUrl(param);
            $location.path('/' + path);
        };
    }]);


//Controlador de la vista de Añadir series - Capítulos
appControllers.controller('ChaptersCtrl', ['$scope', '$location', '$http', 'paramService', 'torrentService',
    function ($scope, $location, $http, paramService, torrentService) {
        $scope.loading = true;

        $scope.url = paramService.getUrl();
        console.log("He llegao: " + $scope.url);

        //Petición de los torrents
        $http.get('http://trex-lovehinaesp.rhcloud.com/api/tx/torrents/' + $scope.url).
            success(function (data) {
                console.log(data);
                $scope.loading = false;

                $scope.torrents = torrentService.processTorrents(data.torrents);
            });

        //GoTo
        $scope.goto = function (path) {
            $location.path('/' + path);
        };
    }]);

/*
 chrome.downloads.download({
 url: "http://your.url/to/download",
 filename: "suggested/filename/with/relative.path" // Optional
 });

 */