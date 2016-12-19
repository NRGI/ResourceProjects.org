describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var scope,
        controller,
        ID = '56a13a758f224f670e6a376e',
        expectedID = {_id:'56a13a758f224f670e6a376e'},
        data = {
            'company': {
                "_id": "56a13a758f224f670e6a376e",
                "company_name": "company 1 a",
                "company_established_source": "56747e060e8cc07115200ee5",
                "company_website": {
                    "source": "56747e060e8cc07115200ee5",
                    "string": "http://google.com",
                    "_id": "56f8c98288a70246147090c9",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                "description": "<p>yes</p><p>no</p>",
                "open_corporates_id": "gb/06774082",
                "companies_house_id": "03323845",
                "countries_of_operation": [
                    {
                        "source": "56747e060e8cc07115200ee5",
                        "country": "56f8c98288a7024614708e98",
                        "_id": "56f8c98288a70246147090cb",
                        "timestamp": "2016-03-28T06:04:49.711Z"
                    },
                    {
                        "source": "56747e060e8cc07115200ee5",
                        "country": "56a7e6c02302369318e16bb8",
                        "_id": "56f8c98288a70246147090ca",
                        "timestamp": "2016-03-28T06:04:49.711Z"
                    }
                ],
                "country_of_incorporation": [
                    {
                        "source": "56747e060e8cc07115200ee5",
                        "country": "56f8c98288a7024614708e98",
                        "_id": "56f8c98288a70246147090cc",
                        "timestamp": "2016-03-28T06:04:49.711Z"
                    }
                ],
                "company_aliases": [
                    {
                        "_id": "56a7d55eb04a1f2214b7b1dd",
                        "alias": "company one aaa"
                    }
                ],
                "__v": 0,
                "company_groups": [
                    {
                        "_id": "56a14d8ee47b92f110ce9a58",
                        "company_group_name": "Exxon"
                    },
                    {
                        "_id": "56a14d8ee47b92f110ce9a57",
                        "company_group_name": "Shell"
                    }
                ],
                "proj_coordinates": [
                    {
                        "lat": -73.15392307,
                        "lng": 17.50168983,
                        "message": "Jubilee Field",
                        "timestamp": "2016-03-28T06:04:49.711Z",
                        "type": "project", "id": "ad-jufi-yqceeo"
                    }
                ],
                "contracts_link": [],
                "concessions": [],
                "company_commodity": [
                    {
                        "_id": "56f8c98288a702461470900f",
                        "commodity_name": "Ferrotitanium",
                        "commodity_type": "mining",
                        "commodity_id": "ferrotitanium"
                    }
                ]
            }
        },
        resultID = {
            'company': {
                "_id": "56a13a758f224f670e6a376e",
                "company_name": "company 1 a",
                "company_established_source": "56747e060e8cc07115200ee5",
                "company_website": {
                    "source": "56747e060e8cc07115200ee5",
                    "string": "http://google.com",
                    "_id": "56f8c98288a70246147090c9",
                    "timestamp": "2016-03-28T06:04:49.711Z"
                },
                "description": "<p>yes</p><p>no</p>",
                "open_corporates_id": "gb/06774082",
                "companies_house_id": "03323845",
                "countries_of_operation": [
                    {
                        "source": "56747e060e8cc07115200ee5",
                        "country": "56f8c98288a7024614708e98",
                        "_id": "56f8c98288a70246147090cb",
                        "timestamp": "2016-03-28T06:04:49.711Z"
                    },
                    {
                        "source": "56747e060e8cc07115200ee5",
                        "country": "56a7e6c02302369318e16bb8",
                        "_id": "56f8c98288a70246147090ca",
                        "timestamp": "2016-03-28T06:04:49.711Z"
                    }
                ],
                "country_of_incorporation": [
                    {
                        "source": "56747e060e8cc07115200ee5",
                        "country": "56f8c98288a7024614708e98",
                        "_id": "56f8c98288a70246147090cc",
                        "timestamp": "2016-03-28T06:04:49.711Z"
                    }
                ],
                "company_aliases": [
                    {
                        "_id": "56a7d55eb04a1f2214b7b1dd",
                        "alias": "company one aaa"
                    }
                ],
                "__v": 0,
                "company_groups": [
                    {
                        "_id": "56a14d8ee47b92f110ce9a58",
                        "company_group_name": "Exxon"
                    },
                    {
                        "_id": "56a14d8ee47b92f110ce9a57",
                        "company_group_name": "Shell"
                    }
                ]
            }
        },
        companyIdSrvc, companySrvc, controller, scope, CompanyIDStub, CompanyStub, ctrl;

    beforeEach(inject(function ($controller, nrgiCompaniesSrvc, nrgiCompanyDataSrvc, $rootScope) {
        scope = $rootScope.$new;
        controller = $controller;
        companyIdSrvc = nrgiCompaniesSrvc;
        companySrvc = nrgiCompanyDataSrvc;
    }));

    it('requests company id', function () {
        var companyIDQuerySpy;
        var  companyDetailQuerySpy;
        companyIDQuerySpy = sinon.spy(function (id, callback) {
            callback(resultID);
        });

        CompanyIDStub = sinon.stub(companyIdSrvc, 'get', companyIDQuerySpy);

        companyDetailQuerySpy = sinon.spy(function (id, callback) {
            callback(data);
        });

        CompanyStub = sinon.stub(companySrvc, 'get', companyDetailQuerySpy);
        ctrl = controller('nrgiCompanyDetailCtrl', {
            $scope: scope,
            $routeParams: {
                id: ID
            }
        });

        companyIDQuerySpy.called.should.be.equal(true);

        sinon.assert.calledWith(companyIDQuerySpy, expectedID);

        scope.company.should.be.equal(resultID.company);

        companyDetailQuerySpy.called.should.be.equal(true);

        sinon.assert.calledWith(companyDetailQuerySpy, expectedID);

    });
    afterEach(function () {
        CompanyIDStub.restore();
        CompanyStub.restore();
    });
});

