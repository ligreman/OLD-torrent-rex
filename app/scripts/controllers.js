var appControllers = angular.module('appControllers', []);

//Controlador de la vista inicial
appControllers.controller('MainCtrl', ['$scope', '$route', '$location', '$http', '$mdDialog', 'paramService',
    function ($scope, $route, $location, $http, $mdDialog, paramService) {
        $scope.series = JSON.parse(localStorage.getItem('series'));
        $scope.trexStatus = (localStorage.getItem('trexStatus') === 'true');
        $scope.lastCheck = localStorage.getItem('lastCheck');

        $scope.changeTrexStatus = function () {
            localStorage.setItem('trexStatus', $scope.trexStatus);
            checkAlarms();

            if ($scope.trexStatus) {
                chrome.browserAction.setIcon({path: 'images/activeIcon.png'});
            } else {
                chrome.browserAction.setIcon({path: 'images/defaultIcon38x38.png'});
            }
        };

        //Actualizar las series ya que he cambiado el status de alguna
        $scope.updateSeries = function () {
            localStorage.setItem('series', JSON.stringify($scope.series));
        };

        //Quitar una serie
        $scope.removeSerie = function (ev, serieTitle) {
            var confirm = $mdDialog.confirm()
                .title('¿Eliminar descarga?')
                .content('Se dejará de descargar ' + serieTitle + '.')
                .ariaLabel('')
                .ok('Aceptar')
                .cancel('Cancelar')
                .targetEvent(ev);
            $mdDialog.show(confirm).then(function () {
                var auxSeries = JSON.parse(localStorage.getItem('series'));

                for (var i = 0; i < auxSeries.length; i++) {
                    if (auxSeries[i].title == serieTitle) {
                        auxSeries.splice(i, 1);
                        break;
                    }
                }

                $scope.series = auxSeries;
                localStorage.setItem('series', JSON.stringify($scope.series));
            }, function () {
            });
        };

        //Alarmas
        checkAlarms();

        //Notificaciones
        checkNotifications();

        //Go a una serie
        $scope.goToSerie = function (url, name, quien) {
            paramService.setUrl(url);
            paramService.setTitle(name);
            paramService.setSource(quien);
            $location.path('/chapters');
        };

        //GoTo
        $scope.goto = function (path) {
            $location.path('/' + path);
        };

        //Exclusiones
        $scope.showExclusions = function (ev, serie) {
            var auxSeries = $scope.series;

            for (var i = 0; i < auxSeries.length; i++) {
                if (auxSeries[i].title == serie) {
                    paramService.setExclusionInfo(auxSeries[i].excluded);
                    paramService.setTitle(auxSeries[i].title);
                    $mdDialog.show({
                        controller: ExcludeDialogController,
                        templateUrl: 'views/templates/excludeDialog.tmpl.html',
                        targetEvent: ev
                    }).then(function (answer) {
                        if (answer > 0) {
                            $route.reload();
                        }
                    }, function () {
                    });
                }
            }
        };

        //Contar exclusiones
        $scope.countExcluded = function (exclusions) {
            return Object.keys(exclusions).length;
        };

        //About
        $scope.about = function (ev) {
            $mdDialog.show(
                $mdDialog.alert()
                    .title('Acerca de Torrent Rex')
                    .content('Torrent Rex comprobará al arrancar el navegador, al activarse y cada hora (siempre que esté activo) si existen nuevos episodios de tus series favoritas, descargando automáticamente los torrents a la carpeta de Descargas predefinida en tu navegador.')
                    .ariaLabel('')
                    .ok('¡Me mola!')
                    .targetEvent(ev)
            );
        }
    }]);

//Controlador de la vista de Añadir serie - Categorias
appControllers.controller('SeriesCtrl', ['$scope', '$location', '$http', 'paramService',
    function ($scope, $location, $http, paramService) {
        $scope.loading = true;

        //Consulto el WS para obtener las categorías
        $http.get('http://trex-lovehinaesp.rhcloud.com/api/tx/categories').
            success(function (data) {
                $scope.categories = data.categories;
                $scope.loading = false;
            });

        //GoTo
        $scope.goto = function (path, param, name, category, source) {
            paramService.setUrl(param);
            paramService.setTitle(name);
            paramService.setSource(source);
            paramService.setCategory(category);
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
        $scope.category = paramService.getCategory();
        $scope.title = generateTitle(paramService.getTitle(), $scope.category);
        $scope.source = paramService.getSource();

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
                $scope.loading = false;

                $scope.info = torrentService.processTorrents(data.torrents);
            });

        //Descarga de un torrent
        $scope.download = function (torrentId) {
            chrome.downloads.download({
                //url: "http://txibitsoft.com/bajatorrent.php?id=" + torrentId
                url: "http://trex-lovehinaesp.rhcloud.com/api/tx/download/" + torrentId
            });
        };

        //Auxiliar para borrar el storage
        /*$scope.deleteStorage = function () {
         localStorage.removeItem('series');
         };*/

        //Comprueba si un torrent está excluido
        $scope.isExcluded = function (id) {
            var seriesActuales = JSON.parse(localStorage.getItem('series')), excluded = false;
            if (seriesActuales !== undefined && seriesActuales !== null && seriesActuales.length > 0) {
                //Busco la serie
                for (var i = 0; i < seriesActuales.length; i++) {
                    if (seriesActuales[i].title == $scope.title && seriesActuales[i].excluded[id] !== undefined) {
                        excluded = true;
                    }
                }
            }
            return excluded;
        };

        //Excluye un torrent de la descarga de esta serie (tiene que estar añadida antes)
        $scope.excludeTorrent = function (id, capiTitle, ev) {
            var seriesActuales = JSON.parse(localStorage.getItem('series')), error = false, encontrado = false;

            if (seriesActuales !== undefined && seriesActuales !== null && seriesActuales.length > 0) {
                //Busco la serie
                for (var i = 0; i < seriesActuales.length; i++) {
                    if (seriesActuales[i].title == $scope.title) {
                        //Esta es la serie, añado a la lista de exclusiones este torrent
                        seriesActuales[i].excluded[id] = {title: capiTitle, torrentId: id};
                        encontrado = true;
                        break;
                    }
                }

                if (encontrado) {
                    localStorage.setItem('series', JSON.stringify(seriesActuales));
                    $scope.showSimpleToast('Episodio excluido.');
                }
            } else {
                error = true;
            }

            if (error || !encontrado) {
                $mdDialog.show(
                    $mdDialog.alert()
                        .title('No se pudo excluir')
                        .content('Antes de excluir un episodio has de añadir la serie a las descargas automáticas. Después ya puedes excluir manualmente los episodios que quieras.')
                        .ariaLabel('')
                        .ok('De acuerdo')
                        .targetEvent(ev)
                );
            }
        };

        //Incluye un torrent a las descargas, previamente exluido
        $scope.desExcludeTorrent = function (id, ev) {
            desexcluir($scope, id, true);
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
                addSerieDownload($scope, answer);
            }, function () {
            });
        };

        //Añadir directamente
        $scope.addDirectly = function (answer) {
            addSerieDownload($scope, answer);
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

function ExcludeDialogController($scope, $mdDialog, paramService) {
    $scope.exclusions = paramService.getExclusionInfo();
    $scope.title = paramService.getTitle();
    $scope.cambios = 0;

    $scope.hide = function () {
        $mdDialog.hide();
    };
    $scope.ok = function () {
        $mdDialog.hide($scope.cambios);
    };

    $scope.incluir = function (id) {
        desexcluir($scope, id, false);
        if ($scope.exclusions[id] !== undefined) {
            $scope.cambios++;
            delete $scope.exclusions[id];
        }
    };
}

//Añade series a descarga
function addSerieDownload($scope, answer) {
    //La añado a las ya existentes
    var yaExiste = false,
        actualSeries = JSON.parse(localStorage.getItem('series'));

    if (actualSeries === null || actualSeries === undefined) {
        actualSeries = [];
    }

    //Compruebo que la serie no esté ya añadida
    for (var i = 0; i < actualSeries.length; i++) {
        if (actualSeries[i].title == $scope.title) {
            //Error serie ya existe
            $scope.showSimpleToast('La serie ya estaba descargándose.');
            yaExiste = true;
        }
    }
    if (!yaExiste) {
        //Resto 1 porque así bajo el que me ha indicado el usuario
        var epi = answer.fromEpisodio - 1;

        //Inicializo si hace falta
        actualSeries.push({
            title: $scope.title,
            url: $scope.url,
            language: $scope.info.language,
            lastSeason: answer.fromTemporada,
            lastChapter: epi,
            excluded: {},
            active: true
        });

        //Actualizo el storage
        chrome.storage.local.set({'series': actualSeries}, function () {
            //Todo ok
            $scope.showSimpleToast('Serie añadida correctamente.');
        });
        localStorage.setItem('series', JSON.stringify(actualSeries));
    }
}

function generateTitle(titulo, categoria) {
    var newTitle = titulo;

    //Miro a ver si tiene HD o V.O
    if (categoria.search('HD') !== -1) {
        newTitle += ' HD';
    } else if (categoria.search('V.O') !== -1) {
        newTitle += ' V.O.';
    }

    return newTitle;
}

function checkAlarms() {
    var status = (localStorage.getItem('trexStatus') === 'true'),
        alarma;

    if (status) {
        //La creo. Como va con nombre no hay problema de duplicados
        chrome.alarms.create('trex', {
            delayInMinutes: 1,
            periodInMinutes: 60
        });
    } else {
        //Desactivo alarmas
        chrome.alarms.clear('trex');
    }
}

function checkNotifications() {
    var notis = JSON.parse(localStorage.getItem('notifications')),
        listaNotis = [];

    if (notis !== undefined && notis !== null && notis.length > 0) {
        for (var i = 0; i < notis.length; i++) {
            chrome.notifications.create('', {
                type: "basic",
                title: "TRex - " + notis[i].date,
                message: notis[i].text,
                iconUrl: "images/downloaded.png"
            }, function (nid) {
            });
        }

        //Limpio las notificaciones ya mostradas
        localStorage.setItem('notifications', JSON.stringify([]));
        chrome.browserAction.setBadgeText({
            text: ""
        });
    }
}

function desexcluir($scope, id, showMsg) {
    var seriesActuales = JSON.parse(localStorage.getItem('series')), error = false, encontrado = false;
    if (seriesActuales !== undefined && seriesActuales !== null && seriesActuales.length > 0) {
        //Busco la serie
        for (var i = 0; i < seriesActuales.length; i++) {
            if (seriesActuales[i].title == $scope.title) {
                //Esta es la serie, añado a la lista de exclusiones este torrent
                if (seriesActuales[i].excluded[id] !== undefined) {
                    delete seriesActuales[i].excluded[id];
                }

                //var index = seriesActuales[i].excluded.indexOf(id);
                //seriesActuales[i].excluded.splice(index, 1);
                localStorage.setItem('series', JSON.stringify(seriesActuales));
                if (showMsg) {
                    $scope.showSimpleToast('Episodio incluido de nuevo.');
                }
                break;
            }
        }
    } else {
        if (showMsg) {
            $scope.showSimpleToast('La serie no está en descarga actualmente.');
        }
    }
}

//*****************************************************************//

//Controlador de la vista de buscar torrents
appControllers.controller('TorrentsCtrl', ['$scope', '$location', '$http',
    function ($scope, $location, $http) {
        $scope.loading = false;
        $scope.currentPage = 0;
        $scope.maxPages = 0;
        $scope.searchTerm = '';

        $scope.search = function (term, page) {
            $scope.loading = true;
            $scope.currentPage = 0;
            $scope.maxPages = 0;

            //Consulto el WS para obtener las categorías
            $http.get('http://trex-lovehinaesp.rhcloud.com/api/tx/search/' + btoa(term) + '/' + page).
                success(function (data) {
                    $scope.torrents = data.torrents;
                    $scope.loading = false;

                    $scope.maxPages = data.maxPages;
                    $scope.currentPage = page;
                });
        };

        //Descarga de un torrent
        $scope.download = function (torrentId) {
            chrome.downloads.download({
                //url: "http://txibitsoft.com/bajatorrent.php?id=" + torrentId
                url: "http://trex-lovehinaesp.rhcloud.com/api/tx/download/" + torrentId
            });
        };

        //GoTo
        $scope.goto = function (path) {
            $location.path('/' + path);
        };
    }]);