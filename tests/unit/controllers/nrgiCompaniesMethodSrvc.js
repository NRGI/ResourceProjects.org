describe("Unit: Testing Modules", function() {
    beforeEach(module('app'));
    it('should contain an nrgiCompaniesMethodSrvc service', inject(function(nrgiCompaniesMethodSrvc) {
        expect(nrgiCompaniesMethodSrvc).not.toBeNull();
    }));
    it('should have a working nrgiCompaniesMethodSrvc service',
        inject(['nrgiCompaniesMethodSrvc',function($srvc) {
            expect($srvc.createCompany).not.toBeNull();
            expect($srvc.deleteCompany).not.toBeNull();
            expect($srvc.updateCompany).not.toBeNull();
        }]));
});
describe('nrgiCompaniesMethodSrvc', function () {
    var nrgiCompaniesMethodSrvc,
        httpBackend,
        result;

    beforeEach(function (){
        module('app');

        inject(function($httpBackend, _nrgiCompaniesMethodSrvc_) {
            nrgiCompaniesMethodSrvc = _nrgiCompaniesMethodSrvc_;
            httpBackend = $httpBackend;
        });
    });

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should create Company', function () {
        var returnData = {
            "success": true
        };
        var company_data = {
            companies_house_id:"companies_house_id",
            company_name:"company_name",
            company_website:{string: "company_name"},
            countries_of_operation:{country: "56a7e6c02302369318e16bb8"},
            country_of_incorporation:{country: "56f8c98288a7024614708e98"},
            description: "description",
            open_corporates_id:"open_corporates_id"
        }


        httpBackend.expectPOST('/api/companies', company_data).respond(returnData);

        var createCompany = nrgiCompaniesMethodSrvc.createCompany(company_data);

        createCompany.then(function () {
            result = true;
        }, function (reason) {
            result = false;
        })

        httpBackend.flush();

        expect(result).toBeTruthy();
    });

    it('should delete Company.', function (){
        var returnData = {
            "success": true
        };
        var id = "57346b2ca9ac648323dccc23";

        httpBackend.expectDELETE('/api/companies/'+id).respond(returnData);

        var deleteCompany = nrgiCompaniesMethodSrvc.deleteCompany(id);

        deleteCompany.then(function() {
            result=true;
        }, function(reason) {
            result=false;
        })

        httpBackend.flush();

        expect(result).toBeTruthy();
    });
});