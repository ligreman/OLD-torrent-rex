var appServices = angular.module('appServices', []);

appServices.service('paramService', function () {
    var url = '';

    var setUrl = function (newUrl) {
        url = newUrl
    };

    var getUrl = function () {
        return url;
    };

    return {
        setUrl: setUrl,
        getUrl: getUrl
    };

});

appServices.service('torrentService', function () {
    var processTorrents = function processTorrents(listaTorrents) {
        var torrent, metadata, aux, ultimaTemporada = 0, temporadas = [], temporadaUltimoCapitulo = [];

        //Recorro los torrents y voy extrayendo su metainformación
        for (var key in listaTorrents) {
            if (listaTorrents.hasOwnProperty(key)) {
                torrent = listaTorrents[key];
                metadata = extractMetaInfo(torrent.title);

                if (metadata !== null) {
                    console.log(metadata);

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
                        category: aux[0],
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
                }
                //torrent.id, .category, .language, .size


            }
        }

        console.log(temporadas);
        console.log(ultimaTemporada);
        console.log(temporadaUltimoCapitulo);
    };

    return {
        processTorrents: processTorrents
    };
});


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