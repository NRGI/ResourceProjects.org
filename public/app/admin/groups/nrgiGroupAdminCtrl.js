angular.module('app')
    .controller('nrgiGroupAdminCtrl', function($scope, nrgiGroupsSrvc) {
        nrgiGroupsSrvc.query({skip: 0, limit: 0}, function (response) {
            $scope.groups = response.data;
        })
    });