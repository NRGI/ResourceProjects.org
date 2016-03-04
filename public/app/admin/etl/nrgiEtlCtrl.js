angular.module('app')
    .controller('nrgiEtlCtrl', function(
            $scope,
            $route,
            nrgiDatasetSrvc,
            nrgiDatasetActionMethodSrvc,
            nrgiNotifier
        ) {
        console.log("When I create a dataset controller, I get all datasets...");
        nrgiDatasetSrvc.query({}, function (success) {
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
        
        $scope.startAction = function(action, dataset_id) {
            var name = null;
            
            switch (action) {
                case "import":
                    name = "Extract from Google Sheets";
                    break;
                case "cleaned":
                    name = "Mark as cleaned";
            }
            
            if (name == null) {
                nrgiNotifier.error("Invalid dataset action requested!");
                return;
            }
            
            var new_action_data = {
                id: dataset_id,
                name: name,
                //Everything else handled by backend
            };
           
            nrgiDatasetActionMethodSrvc.createAction(new_action_data).then(function() {
                nrgiNotifier.notify('Action "' + name + '" started');
                //This makes the page jump but has the advantage of tying it to data; alternative: optimistic update or making a fully fledged actions service
                $route.reload();
            }, function(reason) {
                nrgiNotifier.error(reason);
            })
        };
        
    });
