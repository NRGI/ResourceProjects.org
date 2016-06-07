'use strict';

describe('nrgiProjectsSrvc', function () {
    var projectServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiProjectsSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        projectServiceInstance = new nrgiProjectsSrvc();
    }));

    it('requests project data for a given `projectId`', function () {
        var projectId = 1;
        $httpBackend.expectGET('/api/projects/' + projectId).respond('');
        projectServiceInstance.$get({_id: projectId});
    });
    it('requests project data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/projects/' + limit + '/' + skip).respond('');
        projectServiceInstance.$get({limit: limit, skip: skip});
    });
    it('requests project update data for a given `projectId`', function () {
        var projectId = 1;
        $httpBackend.expectPUT('/api/projects/' + projectId).respond('');
        projectServiceInstance.$update({_id: projectId});
    });
    //console.info('PROJECT SERVICE: UPDATE MISSING')

    afterEach(function() {
        $httpBackend.flush();
    });
});