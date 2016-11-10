'use strict';

angular.module('app')
    .factory('nrgiProjectsSrvc', function($resource) {
        var ProjectResource = $resource('/api/projects/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })
    .factory('nrgiAllProjectsSrvc', function($resource) {
        var ProjectResource = $resource('/api/all_projects/:limit/:skip/:_id', {_id: "@id", limit: "@limit", skip: "@skip"}, {
            query:  {method:'GET', isArray: false},
            update: {method: 'PUT', isArray: false}
        });

        return ProjectResource;
    })
    //.factory('nrgiProjectsWithIsoSrvc', function($resource) {
    //    var ProjectResource = $resource('/api/projects/:_iso2/:limit/:skip', {_iso2: "@iso2", limit: "@limit", skip: "@skip"}, {
    //        query:  {method:'GET', isArray: false},
    //        update: {method: 'PUT', isArray: false}
    //    });
    //
    //    return ProjectResource;
    //});