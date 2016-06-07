'use strict';

describe('nrgiSiteFieldTablesSrvc', function () {
    var nrgiSiteFieldTablesServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiSiteFieldTablesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiSiteFieldTablesServiceInstance = new nrgiSiteFieldTablesSrvc();
    }));

    it('requests site and field table data with a type and id', function () {
        var id = 1;
        var type = 'country';
        $httpBackend.expectGET('/api/site_table/' + type + '/' + id).respond('');
        nrgiSiteFieldTablesServiceInstance.$get({_id: id, type: type});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});