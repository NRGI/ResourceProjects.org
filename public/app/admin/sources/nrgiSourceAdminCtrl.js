angular.module('app')
    .controller('nrgiSourceAdminCtrl', function($scope, nrgiSourcesSrvc) {
        nrgiSourcesSrvc.query({skip: 0, limit: 0}, function (response) {
            $scope.sources = response.data;
        })
    });