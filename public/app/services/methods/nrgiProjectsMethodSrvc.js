angular.module('app')
    .factory('nrgiProjectsMethodSrvc', function(
        $q,
        nrgiProjectsSrvc
    ) {
        return {
            createSource: function(new_project_data) {
                var new_project = new nrgiProjectsSrvc(new_project_data);
                var dfd = $q.defer();

                new_project.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteSource: function(project_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiProjectsSrvc();
                delete_ID.id = project_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            updateSource: function(new_project_data) {
                var dfd = $q.defer();
                new_project_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            }
        }
    });