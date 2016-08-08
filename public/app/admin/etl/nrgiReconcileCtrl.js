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
        function unionArrays(company,projects,duplicates){
            if(_.isEmpty(duplicates)) {
                if (!_.isEmpty(company)) {
                    $scope.duplicate_companies = company;
                    $scope.duplicates = company;
                }
                if (!_.isEmpty(projects)) {
                    $scope.duplicate_projects = projects;
                    if(!_.isEmpty(company)) {
                        $scope.duplicates = _.union($scope.duplicate_companies, $scope.duplicate_projects);
                    }
                }
            } else{
                if (!_.isEmpty(company)) {
                    $scope.duplicate_companies = company;
                }
                if (!_.isEmpty(projects)) {
                    $scope.duplicate_projects = projects;
                    if(!_.isEmpty(company)) {
                        $scope.duplicates = _.union(duplicates,$scope.duplicate_companies, $scope.duplicate_projects);
                    }
                }
            }
            $scope.count = Object.keys($scope.duplicates).length;
            totalPages = Math.ceil(Object.keys($scope.duplicates).length / limit);
            currentPage = currentPage + 1;
            if (currentPage > 1) {
                $scope.duplicates = _.union($scope.duplicate_companies, $scope.duplicate_projects);
            }
            $scope.busy = false;
        }

        function getDuplicates(){
            nrgiDuplicatesSrvc.query({skip: currentPage*limit, limit: limit}, function (success) {
                unionArrays(success[0],success[1],{})
            });
        }

        $scope.resolve = function (id, action) {
            nrgiDuplicatesSrvc.get({id:id,action:action}, function (success) {
                getDuplicates()
            });
        }

        getDuplicates();

        $scope.loadMore = function() {
            console.log($scope.busy)
            if ($scope.busy) return;
            $scope.busy = true;

            console.log(currentPage, totalPages)
            if(currentPage <= totalPages) {
                nrgiDuplicatesSrvc.query({skip: currentPage*limit, limit: limit}, function (success) {
                    unionArrays(success[0],success[1],$scope.duplicates)
                });
            }
        };
    });
