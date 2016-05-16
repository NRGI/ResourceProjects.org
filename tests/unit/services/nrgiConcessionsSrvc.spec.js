'use strict';

describe('nrgiConcessionsSrvc', function () {
    var concessionServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiConcessionsSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        concessionServiceInstance = new nrgiConcessionsSrvc();
    }));

    it('requests concession data for a given `concessionId`', function () {
        var concessionId = 1;
        $httpBackend.expectGET('/api/concessions/' + concessionId).respond('');
        concessionServiceInstance.$get({_id: concessionId});
    });
    it('requests concession data list with a skip and limit var', function () {
        var limit = 10, skip = 1;
        $httpBackend.expectGET('/api/concessions/' + limit + '/' + skip).respond('');
        concessionServiceInstance.$get({limit: limit, skip: skip});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});