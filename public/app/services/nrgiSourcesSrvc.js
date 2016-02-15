'use strict';

angular.module('app')
    .factory('nrgiSourcesSrvc', function($resource) {
        var SourceResource = $resource('/api/sources/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return SourceResource;

    });
    //.factory('nrgiSourcesSrvc', function($http,$q) {
    //    return {
    //        getAllSources: function (limit, skip) {
    //            var dfd = $q.defer();
    //            $http.get('/api/sources/'+limit +'/'+skip).then(function (response) {
    //                if (response.data) {
    //                    dfd.resolve(response.data);
    //                } else {
    //                    dfd.resolve(false);
    //                }
    //            });
    //            return dfd.promise;
    //        },
    //        getSourceByID: function (id) {
    //            var dfd = $q.defer();
    //            $http.get('/api/source/' + id).then(function (response) {
    //                if (response.data) {
    //                    dfd.resolve(response.data);
    //                } else {
    //                    dfd.resolve(false);
    //                }
    //            });
    //            return dfd.promise;
    //        }
    //    }
    //});