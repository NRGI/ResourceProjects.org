'use strict';

describe('nrgiCountriesMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiCountriesMethodSrvc;
    var $q, nrgiCountriesSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiCountriesMethodSrvc_, _$q_, _nrgiCountriesSrvc_) {
        $q = _$q_;
        nrgiCountriesSrvc = _nrgiCountriesSrvc_;
        nrgiCountriesMethodSrvc = _nrgiCountriesMethodSrvc_;
    }));

    describe('#createCountries', function () {
        var nrgiCountrySrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiCountrySrvcStub = sinon.stub(nrgiCountriesSrvc.prototype, '$save', function() {
                return {
                    then: function(callback) {
                        callback();
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCountriesMethodSrvc.createCountry([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            nrgiCountrySrvcStub = sinon.stub(nrgiCountriesSrvc.prototype, '$save', function() {
                return {
                    then: function(callbackPositive, callbackNegative) {
                        callbackNegative(REJECT_RESPONSE);
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    reject: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCountriesMethodSrvc.createCountry([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            nrgiCountrySrvcStub.restore();
        });
    });

    describe('#updateCountries', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCountriesMethodSrvc.updateCountry({
                $update: function() {
                    return {
                        then: function(callbackPositive) {
                            callbackPositive();
                        }
                    };
                }
            }).should.be.equal(expectedPromise);

            $qDeferSpy.called.should.be.equal(true);
        });

        console.log('COUNTRIES METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')

        // it('rejects the deferred in negative case', function () {
        //     expectedPromise = 'NEGATIVE';
        //     var REASON = 'REASON';
        //
        //     $qDeferSpy = sinon.spy();
        //     $qDeferStub = sinon.stub($q, 'defer', function() {
        //         return {
        //             reject: $qDeferSpy,
        //             promise: expectedPromise
        //         };
        //     });
        //
        //     nrgiCountriesMethodSrvc.updateCountry({
        //         $update: function() {
        //             return {
        //                 then: function(uselessCallbackPositive, callbackNegative) {
        //                     callbackNegative({
        //                         data: {reason: REASON}
        //                     });
        //                 }
        //             };
        //         }
        //     }).should.be.equal(expectedPromise);
        //
        //     $qDeferSpy.should.have.been.calledWith(REASON);
        // });
    });

    describe('#deleteCountries', function () {
        var nrgiCountrySrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            nrgiCountrySrvcStub = sinon.stub(nrgiCountriesSrvc.prototype, '$delete', function() {
                return {
                    then: function(callback) {
                        callback();
                    }
                };
            });

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCountriesMethodSrvc.deleteCountry([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        console.log('COUNTRIES METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        // it('resolves the deferred in negative case', function () {
        //     expectedPromise = 'NEGATIVE';
        //     var REJECT_RESPONSE = {
        //         data: {reason: 'REJECT_INSERTION'}
        //     };
        //
        //     rgiCommoditySrvcStub = sinon.stub(nrgiCommoditiesSrvc.prototype, '$delete', function() {
        //         return {
        //             then: function(callbackPositive, callbackNegative) {
        //                 callbackNegative(REJECT_RESPONSE);
        //             }
        //         };
        //     });
        //
        //     $qDeferSpy = sinon.spy();
        //     $qDeferStub = sinon.stub($q, 'defer', function() {
        //         return {
        //             reject: $qDeferSpy,
        //             promise: expectedPromise
        //         };
        //     });
        //
        //     nrgiCountriesMethodSrvc.deleteCountry([expectedPromise]).should.be.equal(expectedPromise);
        //     $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        // });

        afterEach(function () {
            $qDeferStub.restore();
            // nrgiCountriesSrvc.restore();
        });
    });


    afterEach(function () {
        $qDeferStub.restore();
    });
});