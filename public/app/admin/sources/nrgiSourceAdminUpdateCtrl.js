angular.module('app')
    .controller('nrgiSourceAdminUpdateCtrl', function(
        $scope,
        $routeParams,
        $location,
        nrgiNotifier,
        nrgiProjectsSrvc,
        nrgiSourcesMethodSrvc,
        nrgiSourcesSrvc

    ) {
        $scope.source = nrgiSourcesSrvc.get({_id:$routeParams.id});
        $scope.sourceUpdate = function() {
            $scope.source.retrieve_date = new Date();
            nrgiSourcesMethodSrvc.updateSource($scope.source).then(function() {
                nrgiNotifier.notify('Source has been updated');
                $location.path('/admin/source-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };

        $scope.sourceDelete = function() {
            var source_deletion = $scope.source._id;
            nrgiSourcesMethodSrvc.deleteSource(source_deletion).then(function() {
                nrgiNotifier.notify('Source has been deleted');
                $location.path('/admin/source-admin');
            }, function(reason) {
                nrgiNotifier.error(reason);
            });
        };
    });