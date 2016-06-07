'use strict';

describe('nrgiProjectTablesSrvc', function () {
    var nrgiProjectTablesServiceInstance, $httpBackend;

    beforeEach(module('app'));

    beforeEach(inject(function(nrgiProjectTablesSrvc, _$httpBackend_) {
        $httpBackend = _$httpBackend_;
        nrgiProjectTablesServiceInstance = new nrgiProjectTablesSrvc();
    }));

    it('requests project table data with a type and id', function () {
        var id = 1;
        var type = 'company';
        $httpBackend.expectGET('/api/project_table/' + type + '/' + id).respond('');
        nrgiProjectTablesServiceInstance.$get({_id: id, type: type});
    });

    afterEach(function() {
        $httpBackend.flush();
    });
});