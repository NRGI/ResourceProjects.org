describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:50, skip:0},
        scope,
        companiesData = {
            "count": 2,
            "data": [{
                    _id: "56fcd522641ff90100863140",
                    company_name: "Bendon Internationa Ltd",
                    company_established_source: "56fcd522641ff901008630cc",
                    company_website: [
                        {
                            source: "56747e060e8cc07115200ee5",
                            string: "http://google.com",
                            _id: "56f8c98288a70246147090c9",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        }
                    ],
                    description: "<p>yes</p><p>no</p>",
                    open_corporates_id: "gb/06774082",
                    companies_house_id: "03323845",
                    countries_of_operation: [
                        {
                            source: "56747e060e8cc07115200ee5",
                            country: {
                                iso2: "AD",
                                name: "Andorra",
                                _id: "56f8c98288a7024614708e98"
                            },
                            _id: "56f8c98288a70246147090ca",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        }
                    ],
                    country_of_incorporation: [
                        {
                            source: String,
                            country: {
                                iso2: "MX",
                                name: "Mexico",
                                _id: "56f8c98288a7024614718e98"
                            },
                            _id: "56f8c98288a70246147090cc",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        }
                    ],
                    company_aliases: [
                        {
                            _id: "56a7d55eb04a1f2214b7b1dd",
                            alias: "company one aaa"
                        }
                    ],
                    company_groups: [
                        {
                            _id: "56a14d8ee47b92f110ce9a58",
                            company_group_name: "Exxon"
                        }
                    ],
                    company_commodity: [
                        {
                            _id: "56fcd1e3be65cd01000bd278",
                            commodity_name: "Gold",
                            commodity_type: "mining",
                            commodity_id: "gold"
                        }
                    ],
                    transfers_query: [
                        "56fcd522641ff90100863140"
                    ],
                    project_count: 1,
                    site_count: 0,
                    concession_count: 0,
                    contract_count: 0,
                    field_count: 0,
                    transfer_count: 0
                },
                { _id: "56fcd522641ff90100863140",
                    company_name: "Bendon Internationa Ltd",
                    company_established_source: "56fcd522641ff901008630cc",
                    company_website: [
                        {
                            source: "56747e060e8cc07115200ee5",
                            string: "http://google.com",
                            _id: "56f8c98288a70246147090c9",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        }
                    ],
                    description: "<p>yes</p><p>no</p>",
                    open_corporates_id: "gb/06774082",
                    companies_house_id: "03323845",
                    countries_of_operation: [
                        {
                            source: "56747e060e8cc07115200ee5",
                            country: {
                                iso2: "AD",
                                name: "Andorra",
                                _id: "56f8c98288a7024614708e98"
                            },
                            _id: "56f8c98288a70246147090ca",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        }
                    ],
                    country_of_incorporation: [
                        {
                            source: String,
                            country: {
                                iso2: "MX",
                                name: "Mexico",
                                _id: "56f8c98288a7024614718e98"
                            },
                            _id: "56f8c98288a70246147090cc",
                            timestamp: "2016-03-28T06:04:49.711Z"
                        }
                    ],
                    company_aliases: [
                        {
                            _id: "56a7d55eb04a1f2214b7b1dd",
                            alias: "company one aaa"
                        }
                    ],
                    company_groups: [
                        {
                            _id: "56a14d8ee47b92f110ce9a58",
                            company_group_name: "Exxon"
                        }
                    ],
                    company_commodity: [
                        {
                            _id: "56fcd1e3be65cd01000bd278",
                            commodity_name: "Gold",
                            commodity_type: "mining",
                            commodity_id: "gold"
                        }
                    ],
                    transfers_query: [
                        "56fcd522641ff90100863140"
                    ],
                    project_count: 1,
                    site_count: 0,
                    concession_count: 0,
                    contract_count: 0,
                    field_count: 0,
                    transfer_count: 0
                }]
        },
        companiesQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiCompaniesSrvc) {

        var companiesDetailQuerySpy;

        companiesDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(companiesData);
        });


        companiesQueryStub = sinon.stub(nrgiCompaniesSrvc, 'query', companiesDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiCompanyListCtrl', {
            $scope:  scope
        });
    }));

    it("loads the company data", function () {
        companiesQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(companiesQueryStub, expectedParams);
        scope.companies.should.be.equal(companiesData.data);

        scope.loadMore();
        companiesQueryStub.called.should.be.equal(true);
    });

    afterEach(function () {
        companiesQueryStub.restore();
    });
});

