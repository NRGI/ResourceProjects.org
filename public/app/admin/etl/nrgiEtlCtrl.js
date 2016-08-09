angular.module('app')
    .controller('nrgiEtlCtrl', function(
            $scope,
            $route,
            nrgiDatasetSrvc,
            nrgiDatasetActionMethodSrvc,
            nrgiNotifier
        ) {
        nrgiDatasetSrvc.query({}, function (success) {
            $scope.datasets=success.data;
        });
        $scope.sort_options = 	[
            {value: "name", text: "Sort by Name"},
            {value: "created", text: "Sort by Date Created"}
        ];
        $scope.sort_order = $scope.sort_options[1].value;
        $scope.startAction = function(action, dataset_id) {
            var name = null;

            switch (action) {
                case "import":
                    name = "Import from Google Sheets";
                    break;
                case "unload":
                    name = "Unload last import";
                    break;
                case "cleaned":
                    name = "Mark as cleaned";
            }
            
            if ((dataset_id === "56737e170e8cc07115211ee4") && (action === "import")) { //See server/models/Datasets.js
                name = "Import from Companies House API";
            }

            if (name === null) {
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
