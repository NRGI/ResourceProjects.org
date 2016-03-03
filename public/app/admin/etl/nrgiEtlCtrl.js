angular.module('app')
    .controller('nrgiEtlCtrl', function($scope, nrgiEtlSrvc) {
        nrgiEtlSrvc.query({}, function (success) {
            for(var i=0;i<success.data.length;i++) {
                success.data[i].status = getStatus(success.data[i]);
            }
            $scope.datasets=success.data;
            
        });
        
        function getStatus(dataset) {
            var isReadyForChecked = false;
            var isLoaded = false;
            var isChecked = false;
            for(var i=0;i<dataset.actions.length;i++) {
                if ((dataset.actions[i].name == 'Load to DB (staged)') && (dataset.actions[i].status == 'Success')) isLoaded = true;
                if ((dataset.actions[i].name == 'Mark as cleaned') && (dataset.actions[i].status == 'Success')) isChecked = true;
            }
            if (isLoaded && !isChecked) isReadyForChecked = true;
            return {isLoaded: isLoaded, isChecked: isChecked, isReadyForChecked: isReadyForChecked};
        }
        
        $scope.sort_options = 	[
            {value: "name", text: "Sort by Name"},
            {value: "created", text: "Sort by Date Created"}
        ];
        $scope.sort_order = $scope.sort_options[1].value;
    });
