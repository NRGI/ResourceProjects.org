'use strict';

describe('nrgiGroupsSrvc', function () {
    var companyGroupServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiGroupsSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        companyGroupServiceInstance = new nrgiGroupsSrvc();
    }));

    it('requests company group data for a given `companyGroupId`', function () {
        var companyGroupId = 1;
        $httpBackend.expectGET('/api/companyGroups/' + companyGroupId).respond('');
        companyGroupServiceInstance.$get({_id: companyGroupId});
    });
    it('requests company group data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/companyGroups/' + limit + '/' + skip).respond('');
        companyGroupServiceInstance.$get({limit: limit, skip: skip});
    });
    it('requests company update group data for a given `companyGroupId`', function () {
        var companyGroupId = 1;
        var data = {};
        $httpBackend.expectPUT('/api/companyGroups/' + companyGroupId,data).respond('');
        companyGroupServiceInstance.$update({_id: companyGroupId});
    });
    //console.info('COMPANY GROUP SERVICE: UPDATE MISSING')

    afterEach(function() {
        $httpBackend.flush();
    });
});