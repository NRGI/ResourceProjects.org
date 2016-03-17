angular.module('app')
    .controller('nrgiDatasetCreateCtrl', function(
        $scope,
        $location,
        nrgiNotifier,
        nrgiDatasetMethodSrvc
    ) {

        $scope.datasetCreate = function() {
            var new_dataset_data = {
                name: $scope.name,
                source_url: $scope.source_url,
                //NB username is taken care of by session on server side
            };
            nrgiDatasetMethodSrvc.createDataset(new_dataset_data).then(function() {
                nrgiNotifier.notify('New dataset created!');
                $location.path('/admin/etl/datasets');
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
    });