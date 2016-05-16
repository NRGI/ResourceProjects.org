angular.module('app')
    .factory('nrgiMethodSrvc', function(
        $q,
        nrgiCommoditiesSrvc
    ) {
        //TODO combine methods into a single controller
        var getTypeSrvc = function(type) {
            var srvc;
            switch (type) {

            }
            return srvc;
            // return function (response) {
            //     dfd.reject(rgiHttpResponseProcessorSrvc.getMessage(response, 'Save answer failure'));
            //     rgiHttpResponseProcessorSrvc.handle(response);
            // };
        };
        return {
            create: function(new_data, type) {
                var new_data_load = new srvc(new_data);
                var dfd = $q.defer();

                new_data_load.$save().then(function() {
                    dfd.resolve();
                }, function(response) {
                    dfd.reject(response.data.reason);
                });
                return dfd.promise;
            },
            update: function(new_data) {
                var dfd = $q.defer();
                new_data.$update().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            },
            deleteCommodity: function(deletion_id) {
                var dfd = $q.defer();
                var delete_ID = new srvc();
                delete_ID.id = deletion_id;

                delete_ID.$delete().then(function() {
                    dfd.resolve();
                }), function(response) {
                    dfd.reject(response.data.reason);
                };
                return dfd.promise;
            }
        }
    });