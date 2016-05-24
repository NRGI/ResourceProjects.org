'use strict';

describe('nrgiCompaniesMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiCompaniesMethodSrvc;
    var $q, nrgiCompaniesSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiCompaniesMethodSrvc_, _$q_, _nrgiCompaniesSrvc_) {
        $q = _$q_;
        nrgiCompaniesSrvc = _nrgiCompaniesSrvc_;
        nrgiCompaniesMethodSrvc = _nrgiCompaniesMethodSrvc_;
    }));

    describe('#createCompany', function () {
        var nrgiCompanySrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiCompanySrvcStub = sinon.stub(nrgiCompaniesSrvc.prototype, '$save', function () {
                return {
                    then: function (callback) {
                        callback();
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCompaniesMethodSrvc.createCompany([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiCompanySrvcStub = sinon.stub(nrgiCompaniesSrvc.prototype, '$save', function () {
                return {
                    then: function (callbackPositive, callbackNegative) {
                        callbackNegative(REJECT_RESPONSE);
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCompaniesMethodSrvc.createCompany([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiCompanySrvcStub.restore();
        });
    });

    describe('#updateCompany', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCompaniesMethodSrvc.updateCompany({
                $update: function () {
                    return {
                        then: function (callbackPositive) {
                            callbackPositive();
                        }
                    };
                }
            }).should.be.equal(expectedPromise);

            $qDeferSpy.called.should.be.equal(true);
        });

        //console.log('COMPANIES METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

        it('rejects the deferred in negative case', function () {
            expectedPromise = 'NEGATIVE';
            var REASON = 'REASON';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCompaniesMethodSrvc.updateCompany({
                $update: function () {
                    return {
                        then: function (uselessCallbackPositive, callbackNegative) {
                            callbackNegative({
                                data: {reason: REASON}
                            });
                        }
                    };
                }
            }).should.be.equal(expectedPromise);

            $qDeferSpy.should.have.been.calledWith(REASON);
        });
    });

    describe('#deleteCompany', function () {
        var nrgiCompanySrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiCompanySrvcStub = sinon.stub(nrgiCompaniesSrvc.prototype, '$delete', function () {
                return {
                    then: function (callback) {
                        callback();
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCompaniesMethodSrvc.deleteCompany([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        //console.log('COMPANIES METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        it('resolves the deferred in negative case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiCompanySrvcStub = sinon.stub(nrgiCompaniesSrvc.prototype, '$delete', function () {
                return {
                    then: function (callbackPositive, callbackNegative) {
                        callbackNegative(REJECT_RESPONSE);
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCompaniesMethodSrvc.deleteCompany([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiCompaniesSrvc.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});