var appControllers = angular.module('appControllers', []);

//Controlador de la vista inicial
appControllers.controller('MainCtrl', ['$scope', '$location', '$http',
    function ($scope, $location, $http) {
        /*$http.get('phones/phones.json').success(function (data) {
         $scope.phones = data;
         });

         $scope.orderProp = 'age';*/

        console.log("controlo");


        //GoTo
        $scope.goto = function (path) {
            console.log("Voy palla " + path);
            $location.path('/' + path);
        };
    }]);

//Controlador de la vista de Añadir serie - Categorias
appControllers.controller('SeriesCtrl', ['$scope', '$http',
    function ($scope, $http) {
        $scope.loading = true;
        console.log("loading es " + $scope.loading);

        //Consulto el WS para obtener las categorías
        $http.get('http://trex-lovehinaesp.rhcloud.com/api/tx/categories').
            success(function (data) {
                console.log(data);
                $scope.categories = data.categories;
                $scope.loading = false;
                console.log("loading es " + $scope.loading);
            });
    }]);