//ID google store: ccjildcogcgklkpedpomlbghfbikmeaa

//Obtengo el localStorage
var datos = localStorage.getItem('series'),
    schema = '{"$schema":"http://json-schema.org/draft-04/schema#","id":"http://jsonschema.net","type":"array","items":{"id":"http://jsonschema.net/0","type":"object","properties":{"title":{"id":"http://jsonschema.net/0/title","type":"string"},"url":{"id":"http://jsonschema.net/0/url","type":"string"},"language":{"id":"http://jsonschema.net/0/language","type":"string"},"lastSeason":{"id":"http://jsonschema.net/0/lastSeason","type":"string"},"lastChapter":{"id":"http://jsonschema.net/0/lastChapter","type":"integer"},"excluded":{"id":"http://jsonschema.net/0/excluded","type":"object","properties":{"128862":{"id":"http://jsonschema.net/0/excluded/128862","type":"object","properties":{"title":{"id":"http://jsonschema.net/0/excluded/128862/title","type":"string"},"torrentId":{"id":"http://jsonschema.net/0/excluded/128862/torrentId","type":"string"}}}}},"active":{"id":"http://jsonschema.net/0/active","type":"boolean"}},"required":["title","url","language","lastSeason","lastChapter","excluded","active"]},"required":["0"]}';

if (datos !== null) {
    document.getElementById('linkImportar').setAttribute('download', "TRex-backup-" + ahora() + ".txt");

    var hh = btoa(datos);
    var url = URL.createObjectURL(new Blob([hh], {type: 'text/plain'}));
    document.getElementById('linkImportar').setAttribute('href', url);
} else {
    document.getElementById('importar').innerHTML = "No hay datos.";
}

document.getElementById('aImportar').addEventListener('change', handleFileSelect, false);

function handleFileSelect(evt) {
    var files = evt.target.files, error = '', todoBien = '';

    document.getElementById('importError').innerText = '';

    if (files.length > 1) {
        //console.log("No me metas mas....");
        error = 'Selecciona un solo fichero';
    } else {
        var f = files[0];
        //console.log(f);
        if (!f.type === 'text/plain' || f.size > 100000) { //dejo 100kB
            //console.log("Esto no me mola");
            error = 'El fichero seleccionado no es un fichero TRex';
        } else {
            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function (theFile) {
                return function (e) {

                    //console.log("El contenido es...");
                    //console.log(theFile);
                    //console.log(e);
                    var data = atob(e.target.result);

                    //Intento calidar el schema
                    var valid = tv4.validate(JSON.parse(data), schema);

                    if (valid) {
                        localStorage.setItem('series', data);
                        //console.log("TODO OK");
                        todoBien = 'Fichero TRex importado correctamente.';
                    } else {
                        error = 'El contenido del fichero seleccionado no es correcto, puede haberse corrompido.';
                    }

                    if (error !== '') {
                        document.getElementById('importError').innerText = error;
                    } else {
                        document.getElementById('importOK').innerText = todoBien;
                    }
                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsText(f);
        }
    }

    if (error !== '') {
        document.getElementById('importError').innerText = error;
    }
}


function ahora() {
    var fecha = new Date();

    var res = '', mes = (fecha.getMonth() + 1), dia = fecha.getDate();

    if (dia < 10) {
        res += '0' + dia;
    } else {
        res += dia;
    }

    if (mes < 10) {
        res += '0' + mes;
    } else {
        res += mes;
    }

    res += fecha.getFullYear();

    return res;
}