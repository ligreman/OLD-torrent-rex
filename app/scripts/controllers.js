var appControllers = angular.module('appControllers', []);

//Controlador de la vista inicial
appControllers.controller('MainCtrl', ['$scope', '$location', '$http',
    function ($scope, $location, $http) {
        $scope.series = JSON.parse(localStorage.getItem('series'));
        $scope.trexStatus = (localStorage.getItem('trexStatus') === 'true');

        $scope.changeTrexStatus = function () {
            localStorage.setItem('trexStatus', $scope.trexStatus);
            checkAlarms();
        };

        //Actualizar las series ya que he cambiado el status de alguna
        $scope.updateSeries = function () {
            localStorage.setItem('series', JSON.stringify($scope.series));
        };

        //Alarmas
        checkAlarms();

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
appControllers.controller('ChaptersCtrl', ['$scope', '$location', '$http', '$mdDialog', '$mdToast', 'paramService', 'torrentService',
    function ($scope, $location, $http, $mdDialog, $mdToast, paramService, torrentService) {
        $scope.loading = true;
        $scope.info;
        $scope.chapLimits;

        $scope.fromSeason = 0;
        $scope.fromChapter = 0;

        //URL y título de la serie. El título no tiene metainformación
        $scope.url = paramService.getUrl();
        $scope.title = paramService.getTitle();
        console.log("He llegao: " + $scope.url);

        //Toasts
        $scope.toastPosition = {bottom: true, top: false, left: false, right: true};
        $scope.getToastPosition = function () {
            return Object.keys($scope.toastPosition).filter(function (pos) {
                return $scope.toastPosition[pos];
            }).join(' ');
        };
        $scope.showSimpleToast = function (msg) {
            $mdToast.show(
                $mdToast.simple()
                    .content(msg)
                    .position($scope.getToastPosition())
                    .hideDelay(3000)
            );
        };

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


        $scope.deleteStorage = function () {
            //chrome.storage.local.set({'series': []});
            localStorage.removeItem('series');
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
                console.log("Voy a guardar " + answer);
                //La añado a las ya existentes
                //chrome.storage.local.get('series', function (items) {
                var yaExiste = false,
                    actualSeries = JSON.parse(localStorage.getItem('series'));
                //actualSeries = items.series;
                console.log("Tengo:");
                console.log(actualSeries);

                if (actualSeries === null || actualSeries === undefined) {
                    actualSeries = [];
                }

                //Compruebo que la serie no esté ya añadida
                for (var i = 0; i < actualSeries.length; i++) {
                    console.log("A ver si esta ya existe: " + actualSeries[i].title)
                    if (actualSeries[i].title == $scope.title) {
                        console.log("Pozi");
                        //Error serie ya existe
                        $scope.showSimpleToast('La serie ya estaba descargándose.');
                        yaExiste = true;
                    }
                }
                console.log("Existia: " + yaExiste);
                if (!yaExiste) {
                    console.log("Amo a ver");
                    //Inicializo si hace falta
                    console.log("uyuyuyu");
                    actualSeries.push({
                        title: $scope.title,
                        url: $scope.url,
                        language: $scope.info.language,
                        lastSeason: answer.fromTemporada,
                        lastChapter: answer.fromEpisodio - 1, //-1 porque así bajo el que me ha indicado el usuario
                        active: true
                    });
                    console.log("Meto");
                    console.log(actualSeries);
                    //Actualizo el storage
                    chrome.storage.local.set({'series': actualSeries}, function () {
                        //Todo ok
                        $scope.showSimpleToast('Serie añadida correctamente.');
                        console.log("TOOK");
                        //Lanzo un chequeo de series
                    });
                    localStorage.setItem('series', JSON.stringify(actualSeries));
                }
                //});
            }, function () {
            });
        };

        //GoTo
        $scope.goto = function (path) {
            $location.path('/' + path);
        };
    }]);


/*********** FUNCIONES AUXILIARES ****************/

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

function checkAlarms() {
    console.log("alarm");
    var status = (localStorage.getItem('trexStatus') === 'true'),
        alarma;

    if (status) {
        //La creo. Como va con nombre no hay problema de duplicados
        chrome.alarms.create('trex', {
            delayInMinutes: 1,
            periodInMinutes: 1
        });
        console.log("alarma creada");
    } else {
        //Desactivo alarmas
        chrome.alarms.clear('trex');
        console.log("alarma desactivada");
    }
}