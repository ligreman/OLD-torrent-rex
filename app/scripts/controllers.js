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
        $scope.goto = function (path, param, name) {
            console.log("me voy de aqui " + param);
            paramService.setUrl(param);
            paramService.setTitle(name);
            $location.path('/' + path);
        };
    }]);


//Controlador de la vista de Añadir series - Capítulos
appControllers.controller('ChaptersCtrl', ['$scope', '$location', '$http', '$mdDialog', 'paramService', 'torrentService',
    function ($scope, $location, $http, $mdDialog, paramService, torrentService) {
        $scope.loading = true;
        $scope.info;
        $scope.chapLimits;

        $scope.fromSeason = 0;
        $scope.fromChapter = 0;

        $scope.url = paramService.getUrl();
        $scope.title = paramService.getTitle();
        console.log("He llegao: " + $scope.url);

        //Petición de los torrents
        $http.get('http://trex-lovehinaesp.rhcloud.com/api/tx/torrents/' + $scope.url).
            success(function (data) {
                console.log(data);
                $scope.loading = false;

                $scope.info = torrentService.processTorrents(data.torrents);
            });

        //Descarga de un torrent
        $scope.download = function (torrentId) {
            chrome.downloads.download({
                url: "http://txibitsoft.com/bajatorrent.php?id=" + torrentId
            });
        };

        //Añadir una descarga - dialogo
        $scope.showAdd = function (ev) {
            if ($scope.info === null) {
                return null;
            }

            //Limites de capitulos por temporada
            $scope.chapLimits = [];
            for (var k in $scope.info.seasons) {
                if ($scope.info.seasons.hasOwnProperty(k)) {
                    var tempo = $scope.info.seasons[k];
                    $scope.chapLimits[tempo.season] = tempo.lastChapter;
                }
            }

            paramService.setSeasonLimits(1, $scope.info.lastSeason);
            paramService.setChapterLimits(1, $scope.chapLimits);

            $mdDialog.show({
                controller: DialogController,
                templateUrl: 'views/templates/addDialog.tmpl.html',
                targetEvent: ev
            }).then(function (answer) {
                //Acepto y añado la serie
                console.log('You said the information was "' + answer.fromTemporada + answer.fromEpisodio + '".');
            }, function () {
                //Cancelo el dialogo
            });
        };

        //GoTo
        $scope.goto = function (path) {
            $location.path('/' + path);
        };
    }]);

function DialogController($scope, $mdDialog, paramService) {
    $scope.seasonLimits = paramService.getSeasonLimits();
    $scope.chapterLimits = paramService.getChapterLimits();

    $scope.hide = function () {
        $mdDialog.hide();
    };
    $scope.cancel = function () {
        $mdDialog.cancel();
    };
    $scope.answer = function (answer) {
        $mdDialog.hide(answer);
    };
}

/*
 $scope.download = function () {
 chrome.downloads.download({
 url: "http://txibitsoft.com/bajatorrent.php?id=133862"
 });
 };

 */