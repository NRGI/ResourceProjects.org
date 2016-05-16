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
    console.info('COMPANY GROUP UPDATE MISSING')

    afterEach(function() {
        $httpBackend.flush();
    });
});