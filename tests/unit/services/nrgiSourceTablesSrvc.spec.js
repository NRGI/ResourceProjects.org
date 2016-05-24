'use strict';

describe('nrgiSourceTablesSrvc', function () {
    var nrgiSourceTablesServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiSourceTablesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiSourceTablesServiceInstance = new nrgiSourceTablesSrvc();
    }));

    it('requests source table data with a type and id', function () {
        var id = 1;
        var type = 'country';
        $httpBackend.expectGET('/api/source_table/' + type + '/' + id).respond('');
        nrgiSourceTablesServiceInstance.$get({_id: id, type: type});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});