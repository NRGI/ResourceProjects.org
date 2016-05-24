'use strict';

describe('nrgiProductionTablesSrvc', function () {
    var nrgiProductionTablesServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiProdTablesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiProductionTablesServiceInstance = new nrgiProdTablesSrvc();
    }));

    it('requests production table data with a type and id', function () {
        var id = 1;
        var type = 'company';
        $httpBackend.expectGET('/api/prod_table/' + type + '/' + id).respond('');
        nrgiProductionTablesServiceInstance.$get({_id: id, type: type});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});