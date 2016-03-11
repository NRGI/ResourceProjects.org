angular.module('app')
    .factory('nrgiGroupsMethodSrvc', function(
        $q,
        nrgiGroupsSrvc
    ) {
        return {
            createGroup: function(new_group_data) {
                var new_group = new nrgiGroupsSrvc(new_group_data);
                var dfd = $q.defer();

                new_group.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            deleteGroup: function(group_deletion) {
                var dfd = $q.defer();
                var delete_ID = new nrgiGroupsSrvc();
                delete_ID.id = group_deletion;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            updateGroup: function(new_group_data) {
                var dfd = $q.defer();
                new_group_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            }
        }
    });