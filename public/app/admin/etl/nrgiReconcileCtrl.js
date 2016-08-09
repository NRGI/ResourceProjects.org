angular.module('app')
    .controller('nrgiReconcileCtrl', function(
            $scope,
            $route,
            nrgiDuplicatesSrvc
        ) {

        var limit = 50,
            currentPage = 0,
            totalPages = 0;

        $scope.count =0;
        $scope.busy = false;
        $scope.duplicate_companies=[];
        $scope.duplicate_projects=[];
        $scope.duplicates = [];

        nrgiDuplicatesSrvc.query({skip: currentPage, limit: limit}, function (response) {
            $scope.duplicates = response.data;
            $scope.count = response.count;
            totalPages = Math.ceil(response.count / limit);
            currentPage = currentPage + 1;
        });

        $scope.resolve_duplicate = function (id, action) {
            console.log(id, action)
            nrgiDuplicatesSrvc.query({id:id,action:action}, function (response) {
                currentPage = 0;
                $scope.duplicates = [];
                $scope.duplicates = response.data;
                $scope.count = response.count;
                totalPages = Math.ceil(response.count / limit);
                currentPage = currentPage + 1;
            });
        }

        $scope.loadMore = function() {
            if ($scope.busy) return;
            $scope.busy = true;
            if(currentPage < totalPages) {
                nrgiDuplicatesSrvc.query({skip: currentPage, limit: limit}, function (response) {
                    $scope.duplicates = _.union($scope.duplicates, response.data);
                    currentPage = currentPage + 1;
                    $scope.busy = false;
                });
            }
        };
    });
