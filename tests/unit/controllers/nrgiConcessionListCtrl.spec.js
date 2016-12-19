describe("Unit: Testing Controllers", function() {

    beforeEach(module('app'));

    var expectedParams = {limit:50, skip:0},
        scope,
        concessionsData = {
            "count": 2,
            "concessions": [{
                _id: "56a2b8236e585b7316655794",
                concession_name: "Block A",
                concession_established_source: {
                    _id: "56747e060e8cc07115200ee6",
                    source_name: "source 3",
                    source_type: "source id 3",
                    source_type_id: "56e8736944442a3824141429",
                    source_archive_url: "google.com",
                    source_notes: "notes notes notes notes notes",
                    staged: true,
                    possible_duplicate: false,
                    create_date: "2016-05-12T07:39:08.723Z",
                    create_author: ["569976c21dad48f614cc8126"],
                    retrieve_date: "2016-05-12T07:39:08.723Z",
                    source_date: "2016-05-12T07:39:08.723Z"
                },
                description: "<p>yes</p><p>no</p>",
                oo_concession_id: "junkid",
                oo_url_api: "http://api.openoil.net/concession/BR/ES-M-525",
                oo_url_wiki: "http://repository.openoil.net/wiki/Brazil",
                oo_source_date: "2016-03-28T06:04:50.385Z",
                oo_details: {
                    "Vencimento1º": "20.01.2012",
                    "Operador": "Petrobras",
                    "Observacao": "",
                    "Contrato": "BM-ES-23",
                    "Concessionários": "*Petrobras - 65%, Inpex - 15%, PTTEP Brasil - 20%"
                },
                concession_polygon: [
                    {
                        loc: [
                            11.748649323579226,
                            -17.210253839242714
                        ],
                        _id: "56f8c98288a7024614708fd5",
                        timestamp: "2016-03-28T06:04:49.711Z"
                    }
                ],
                concession_type: [
                    {
                        source: "56747e060e8cc07115200ee6",
                        string: "offshore",
                        _id: "56f8c98288a7024614708fd8",
                        timestamp: "2016-03-28T06:04:49.711Z"
                    }
                ],
                concession_commodity: [
                    {
                        _id: "56f8c98288a702461470903c",
                        commodity_name: "Ferrochrome",
                        commodity_type: "mining",
                        commodity_id: "ferrochrome"
                    }
                ],
                concession_status: [
                    {
                        source: "56747e060e8cc07115200ee6",
                        _id: "56f8c98288a7024614708fd9",
                        timestamp: "2016-03-28T06:04:49.727Z",
                        string: "exploration"
                    }
                ],
                concession_company_share: Array,
                concession_operated_by: Array,
                concession_country: [
                    {
                        source: "56747e060e8cc07115200ee6",
                        _country: {
                            iso2: "AD",
                            name: "Andorra",
                            _id: "56f8c98288a7024614708e98"
                        },
                        _id: "56f8c98288a7024614708fda",
                        timestamp: "2016-03-28T06:04:49.711Z"
                    }
                ],
                concession_aliases: [
                    "56a7d75bd9caddb614ab02b3",
                    "56a7d75bd9caddb614ab02b4"
                ],
                transfers_query: [
                    "56a2b8236e585b7316655794",
                    "56a930f41b5482a31231ef43",
                    "56a930f41b5482a31231ef42",
                    "56eb117c0007bf5b2a3e4b76"
                ],
                source_type: {
                    "p": true,
                    "c": false
                },
                project_count: 3,
                company_count: 2,
                site_count: 1,
                field_count: 0,
                contract_count: 2,
                transfer_count: 60,
                production_count: 5
            }]
        },
        concessionsQueryStub,  ctrl;

    beforeEach(inject(function ($rootScope, $controller, nrgiConcessionsSrvc) {

        var concessionsDetailQuerySpy;

        concessionsDetailQuerySpy = sinon.spy(function (expectedParams, callback) {
            callback(concessionsData);
        });


        concessionsQueryStub = sinon.stub(nrgiConcessionsSrvc, 'query', concessionsDetailQuerySpy);

        scope = $rootScope.$new();
        ctrl = $controller('nrgiConcessionListCtrl', {
            $scope:  scope
        });
    }));

    it("loads the concession data", function () {
        concessionsQueryStub.called.should.be.equal(true);
        sinon.assert.calledWith(concessionsQueryStub, expectedParams);
        scope.concessions.should.be.equal(concessionsData.concessions);

        scope.loadMore();
        concessionsQueryStub.called.should.be.equal(true);
    });

    afterEach(function () {
        concessionsQueryStub.restore();
    });
});

