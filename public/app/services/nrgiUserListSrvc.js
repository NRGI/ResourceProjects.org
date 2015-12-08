'use strict';

angular.module('app')
    .factory('nrgiUserListSrvc', function($resource) {
        var UserResource = $resource('/api/user-list/:_id', {_id: "@id"}, {});

        return UserResource;
    });