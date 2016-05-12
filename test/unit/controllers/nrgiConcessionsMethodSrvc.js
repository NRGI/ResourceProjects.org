describe("Unit: Testing Modules", function() {
    beforeEach(module('app'));
    it('should contain an nrgiConcessionsMethodSrvc service', inject(function(nrgiConcessionsMethodSrvc) {
        expect(nrgiConcessionsMethodSrvc).not.toBeNull();
    }));
    it('should have a working nrgiConcessionsMethodSrvc service',
        inject(['nrgiConcessionsMethodSrvc',function($srvc) {
            expect($srvc.createConcession).not.toBeNull();
            expect($srvc.deleteConcession).not.toBeNull();
            expect($srvc.updateConcession).not.toBeNull();
        }]));
});
describe('nrgiConcessionsMethodSrvc', function () {
    var nrgiConcessionsMethodSrvc,
        httpBackend,
        result;

    beforeEach(function (){
        module('app');

        inject(function($httpBackend, _nrgiConcessionsMethodSrvc_) {
            nrgiConcessionsMethodSrvc = _nrgiConcessionsMethodSrvc_;
            httpBackend = $httpBackend;
        });
    });

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should create Concession', function () {
        var returnData = {
            "success": true
        };
        var concession_data = {
            concession_country: {country: "56f8c98288a7024614708f34"},
            country: "56f8c98288a7024614708f34",
            concession_name: "Concession Name",
            concession_status: {string: "Mining"},
            description:"Description",
            oo_concession_id:"junkid"
        }

        httpBackend.expectPOST('/api/concessions', concession_data).respond(returnData);

        var createConcession = nrgiConcessionsMethodSrvc.createConcession(concession_data);

        createConcession.then(function () {
            result = true;
        }, function (reason) {
            result = false;
        })

        httpBackend.flush();

        expect(result).toBeTruthy();
    });

    it('should delete Concession.', function (){
        var returnData = {
            "success": true
        };

        var id = "573476459453f8de02798c03";

        httpBackend.expectDELETE('/api/concessions/'+id).respond(returnData);

        var deleteConcession = nrgiConcessionsMethodSrvc.deleteConcession(id);

        deleteConcession.then(function() {
            result=true;
        }, function(reason) {
            result=false;
        })

        httpBackend.flush();

        expect(result).toBeTruthy();
    });
});