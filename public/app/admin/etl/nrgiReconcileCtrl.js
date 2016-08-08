angular.module('app')
    .controller('nrgiReconcileCtrl', function(
            $scope,
            $route,
            nrgiDuplicatesSrvc
        ) {
        $scope.duplicate_companies=[];
        $scope.duplicate_projects=[];
        $scope.duplicates = [];
        function unionArrays(company,projects){
            if(!_.isEmpty(company)){
                $scope.duplicate_companies = company;
                $scope.duplicates = company;
            }
            if(!_.isEmpty(projects)) {
                $scope.duplicate_projects = projects;
                $scope.duplicates = projects;
                if(!_.isEmpty(company)) {
                    $scope.duplicates = _.union($scope.duplicate_companies, $scope.duplicate_projects);
                }
            }
        }

        function getDuplicates(){
            nrgiDuplicatesSrvc.query({}, function (success) {
                unionArrays(success[0],success[1])
            });
        }

        $scope.resolve = function (id, action) {
            nrgiDuplicatesSrvc.get({id:id,action:action}, function (success) {
                getDuplicates()
            });
        }

        getDuplicates();
    });
