angular.module('app')
    .controller('nrgiSourceTypeAdminCtrl', function($scope, nrgiSourceTypesSrvc) {
        nrgiSourceTypesSrvc.query({skip: 0, limit: 0}, function (response) {
            $scope.sourceTypes = response.data;
        })
    });