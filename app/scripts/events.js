//Logger
var DEBUG_MODE = false;
function logger(msg) {
    if (DEBUG_MODE) {
        console.log(msg);
    }
}

function checkDownloads() {
    var status = (localStorage.getItem('trexStatus') === 'true'),
        series, newTorrents = null, url, datos, lastSerie;

    logger("Comienzo la comprobación de descargas");

    //Si está activo TRex
    if (status) {
        //Cojo las series y miro una a una
        series = JSON.parse(localStorage.getItem('series'));

        if (series === undefined || series === null || series.length === 0) {
            return null;
        }

        for (var i = 0; i < series.length; i++) {
            //Si no está activa esta serie me la salto
            if (!series[i].active) {
                continue;
            }

            logger("  Miro la serie: " + series[i].title);

            newTorrents = [];
            //Pido al ws la lista de torrents de la serie
            url = atob(series[i].url);
            var xmlhttp = new XMLHttpRequest();

            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                    var data = JSON.parse(xmlhttp.responseText);
                    datos = procesarTorrents(data.torrents);

                    //Comparo con los last de temporadas y capítulos descargados para saber si he de bajar algo nuevo
                    for (var j = 0; j < datos.seasons.length; j++) {
                        //Si están en la temporada última que he descargado o más avanzado sigo
                        if (datos.seasons[j].season >= series[i].lastSeason) {

                            //Miro cada capítulo de esta temporada
                            for (var k = 0; k < datos.seasons[j].chapters.length; k++) {
                                if (datos.seasons[j].chapters[k].chapter > series[i].lastChapter) {

                                    //Lo añado a la lista de descargas
                                    newTorrents.push({
                                        id: datos.seasons[j].chapters[k].id,
                                        title: datos.seasons[j].chapters[k].title
                                    });

                                    //Actualizo la variable de series
                                    series[i].lastChapter = datos.seasons[j].chapters[k].chapter;

                                }
                            }

                            //Actualizo la variable de temporada
                            series[i].lastSeason = datos.seasons[j].season;
                        }
                    }
                }
            };
            //TODO testear las peticiones asíncronas estas
            xmlhttp.open("GET", 'http://trex-lovehinaesp.rhcloud.com/api/tx/torrents/' + series[i].url, true);
            xmlhttp.send();
        }

        //Descargo lo nuevo
        if (newTorrents !== null) {
            //Voy una a una bajando y generando notificación
            var notifications = JSON.parse(localStorage.getItem('notifications')),
                m = new Date();

            if (notifications === undefined || notifications === null) {
                notifications = [];
            }

            var dateString =
                ("0" + m.getUTCDate()).slice(-2) + "/" +
                ("0" + (m.getUTCMonth() + 1)).slice(-2) + "/" +
                m.getUTCFullYear() + " " +
                ("0" + m.getUTCHours()).slice(-2) + ":" +
                ("0" + m.getUTCMinutes()).slice(-2) + ":" +
                ("0" + m.getUTCSeconds()).slice(-2);

            for (i = 0; i < newTorrents.length; i++) {

                chrome.downloads.download({
                    //url: "http://txibitsoft.com/bajatorrent.php?id=" + newTorrents[i].id
                    url: "http://trex-lovehinaesp.rhcloud.com/api/tx/download/" + newTorrents[i].id
                });

                notifications.push({
                    text: newTorrents[i].title,
                    date: dateString
                });
            }

            //Actualizo localstorage
            localStorage.setItem('series', JSON.stringify(series));
            localStorage.setItem('notifications', JSON.stringify(notifications));

            //Pongo numerito en el icono
            if (notifications.length > 0) {
                chrome.browserAction.setBadgeText({
                    text: "" + notifications.length
                });
                chrome.browserAction.setBadgeBackgroundColor({
                    color: '#1B5E20'
                });
            }
        }
    }
}

//Listener de cuando salta la alarma
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === 'trex' || alarm.name === 'checkTrex') {
        logger("Salta la alarma");
        checkDownloads();
    }

    //última comprobación
    var d = new Date();
    localStorage.setItem('lastCheck', d.getHours() + ':' + d.getMinutes());
    logger("Guardo la hora de comprobación: " + d.getHours() + ':' + d.getMinutes());
});

//Al iniciar navegador compruebo (le doy un minuto)
//setTimeout(checkDownloads, 60 * 1000);
chrome.alarms.create('checkTrex', {
    delayInMinutes: 1
});

//Icono
var statusTrexIcon = (localStorage.getItem('trexStatus') === 'true');
if (statusTrexIcon) {
    chrome.browserAction.setIcon({path: 'images/activeIcon.png'});
}
statusTrexIcon = null; //Libero memoria

//Notificaciones
var notisTRexBadge = localStorage.getItem('notifications');
if (notisTRexBadge !== undefined && notisTRexBadge !== null) {
    notisTRexBadge = JSON.parse(notisTRexBadge);
    if (notisTRexBadge.length > 0) {
        chrome.browserAction.setBadgeText({
            text: "" + notisTRexBadge.length
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: '#1B5E20'
        });
    }
}
notisTRexBadge = null;

function procesarTorrents(listaTorrents) {
    var torrent, metadata, aux, ultimaTemporada = 0, temporadas = [], temporadaUltimoCapitulo = [],
        temps = [], chaps = [], idiomaGeneral = '';

    //Saco los excluidos
    var seriesActuales = JSON.parse(localStorage.getItem('series')), excluded = [];
    if (seriesActuales !== undefined && seriesActuales !== null && seriesActuales.length > 0) {
        //Busco la serie
        for (var i = 0; i < seriesActuales.length; i++) {
            for (var key in seriesActuales[i].excluded) {
                if (seriesActuales[i].excluded.hasOwnProperty(key)) {
                    excluded.push(key);
                }
            }
        }
    }

    //Recorro los torrents y voy extrayendo su metainformación
    for (var key in listaTorrents) {
        if (listaTorrents.hasOwnProperty(key)) {
            torrent = listaTorrents[key];

            //Miro a ver si está excluido
            if (excluded.indexOf(torrent.id) !== -1) {
                continue;
            }

            metadata = extractMetaInfo(torrent.title);

            if (metadata !== null) {

                //categoria
                aux = torrent.category.split(' > ');

                if (temporadas[metadata.temporada] === undefined) {
                    temporadas[metadata.temporada] = [];
                }

                temporadas[metadata.temporada][metadata.capitulo] = {
                    title: torrent.title,
                    id: torrent.id,
                    chapter: metadata.capitulo,
                    language: torrent.language,
                    languageTitle: metadata.idioma,
                    //category: aux[0],
                    size: torrent.size,
                    format: metadata.formato
                };

                //Última temporada
                if (ultimaTemporada < metadata.temporada) {
                    ultimaTemporada = metadata.temporada;
                }

                //Último capítulo de la temporada
                if (temporadaUltimoCapitulo[metadata.temporada] === undefined || temporadaUltimoCapitulo[metadata.temporada] < metadata.capitulo) {
                    temporadaUltimoCapitulo[metadata.temporada] = metadata.capitulo;
                }

                //Idioma general
                if (idiomaGeneral === '') {
                    idiomaGeneral = metadata.idioma;
                }
            }
        }
    }


    for (var kk in temporadas) {
        chaps = [];

        if (temporadas.hasOwnProperty(kk)) {

            for (var jj in temporadas[kk]) {
                if (temporadas[kk].hasOwnProperty(jj)) {
                    chaps.push(temporadas[kk][jj]);
                }
            }

            temps.push({
                title: "Temporada " + kk,
                chapters: chaps,
                season: kk,
                lastChapter: temporadaUltimoCapitulo[kk]
            });
        }
    }

    return {
        lastSeason: ultimaTemporada,
        lastChapter: temporadaUltimoCapitulo[ultimaTemporada],
        language: idiomaGeneral,
        seasons: temps
    };
}


//Esta función extrae la temporada, el formato, idioma y el capítulo, del título de un torrent
function extractMetaInfo(torrentTitle) {
    var temporada = null, capitulo = null, formato = null, idioma = null;

    //La temporada
    var aux = torrentTitle.match(/Temporada ./gi);
    if (aux !== undefined && aux !== null && aux !== '') {
        aux = aux[0];
        aux = aux.split(' ');
        aux = parseInt(aux[1]);

        //Compruebo que es un número de verdad
        if (!isNaN(aux)) {
            temporada = aux;
        }
    }

    //El capitulo
    aux = torrentTitle.match(/Cap\..../gi);
    if (aux !== undefined && aux !== null && aux !== '') {
        aux = aux[0];
        //Verifico la temporada, por si antes no la pude sacar
        if (temporada === null) {
            var auxTemp = aux.charAt(aux.length - 3); //de Cap.103 es el 1
            auxTemp = parseInt(auxTemp);
            if (!isNaN(auxTemp)) {
                temporada = auxTemp;
            }
        }

        //Saco el capítulo
        var auxCap = aux.charAt(aux.length - 2) + aux.charAt(aux.length - 1); //de Cap.103 es el 03
        auxCap = parseInt(auxCap);
        if (!isNaN(auxCap)) {
            capitulo = auxCap;
        }
    }

    //El idioma
    aux = torrentTitle.match(/V.O.Sub.[A-Za-zñáéíóúÁÉÍÓÚ ]*/gi);
    if (aux !== undefined && aux !== null && aux !== '') {
        aux = aux[0];
        idioma = aux;
    } else {
        aux = torrentTitle.match(/Español[A-Za-zñáéíóúÁÉÍÓÚ ]*/gi);
        if (aux !== undefined && aux !== null && aux !== '') {
            aux = aux[0];
            idioma = aux;
        }
    }

    //El formato
    aux = torrentTitle.match(/HDTV([A-Za-z0-9 ])*/gi);
    if (aux !== undefined && aux !== null && aux !== '') {
        aux = aux[0];
        formato = aux;
    }

    if (temporada === null || capitulo === null) {
        return null;
    } else {
        return {
            temporada: temporada,
            capitulo: capitulo,
            idioma: idioma,
            formato: formato
        }
    }
}