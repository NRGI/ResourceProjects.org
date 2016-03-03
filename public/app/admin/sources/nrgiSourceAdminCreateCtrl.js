angular.module('app')
    .controller('nrgiSourceAdminCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiIdentitySrvc,
        nrgiProjectsSrvc,
        nrgiSourcesMethodSrvc
    ) {
        var user = [];
        angular.extend(user,  nrgiIdentitySrvc.currentUser);
        $scope.source =[];
        $scope.sourceCreate = function() {
            $scope.source.create_author = user._id;
            nrgiSourcesMethodSrvc.createSource($scope.source).then(function() {
                nrgiNotifier.notify('Source created!');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });