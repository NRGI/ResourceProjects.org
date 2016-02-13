'use strict';

angular.module('app')
    .factory('nrgiConcessionsSrvc', function($resource) {
        var ConcessionResource = $resource('/api/concessions/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ConcessionResource;

    });



//'use strict';
//
//angular.module('app')
//    .factory('nrgiConcessionsSrvc', function($http,$q) {
//        return {
//            getAllConcessions:function(limit,skip) {
//                var dfd = $q.defer();
//                $http.get('/api/concessions/'+limit+"/"+skip).then(function (response) {
//                    if(response.data) {
//                        dfd.resolve(response.data);
//                    } else {
//                        dfd.resolve(false);
//                    }
//                });
//                return dfd.promise;
//            },
//            getConcessionById:function(id) {
//                var dfd = $q.defer();
//                $http.get('/api/concessions/'+id).then(function (response) {
//                    if(response.data) {
//                        dfd.resolve(response.data);
//                    } else {
//                        dfd.resolve(false);
//                    }
//                });
//                return dfd.promise;
//            }
//        }
//    });