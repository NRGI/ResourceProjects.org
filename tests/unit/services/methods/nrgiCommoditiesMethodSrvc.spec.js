'use strict';

describe('nrgiCommoditiesMethodSrvc', function () {
    beforeEach(module('app'));

    var nrgiCommoditiesMethodSrvc;
    var $q, nrgiCommoditiesSrvc;
    var $qDeferStub, $qDeferSpy, expectedPromise;

    beforeEach(inject(function (_nrgiCommoditiesMethodSrvc_, _$q_, _nrgiCommoditiesSrvc_) {
        $q = _$q_;
        nrgiCommoditiesSrvc = _nrgiCommoditiesSrvc_;
        nrgiCommoditiesMethodSrvc = _nrgiCommoditiesMethodSrvc_;
    }));

    describe('#createCommodity', function () {
        var rgiCommoditySrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            rgiCommoditySrvcStub = sinon.stub(nrgiCommoditiesSrvc.prototype, '$save', function() {
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

            nrgiCommoditiesMethodSrvc.createCommodity([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'NEGATIVE';
            var REJECT_RESPONSE = {
                data: {reason: 'REJECT_INSERTION'}
            };

            rgiCommoditySrvcStub = sinon.stub(nrgiCommoditiesSrvc.prototype, '$save', function() {
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

            nrgiCommoditiesMethodSrvc.createCommodity([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            rgiCommoditySrvcStub.restore();
        });
    });

    describe('#updateCommodity', function () {
        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';
    
            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function() {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            nrgiCommoditiesMethodSrvc.updateCommodity({
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

        //console.log('COMMODITIES METHOD SERVICE: MISSING NEGATIVE UPDATE CASE')
    
        it('rejects the deferred in negative case', function () {
             expectedPromise = 'NEGATIVE';
             var REASON = 'REASON';

             $qDeferSpy = sinon.spy();
             $qDeferStub = sinon.stub($q, 'defer', function() {
                 return {
                     reject: $qDeferSpy,
                     promise: expectedPromise
                 };
             });

             nrgiCommoditiesMethodSrvc.updateCommodity({
                 $update: function() {
                     return {
                         then: function(uselessCallbackPositive, callbackNegative) {
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

    describe('#deleteCommodity', function () {
        var rgiCommoditySrvcStub;

        it('resolves the deferred in positive case', function () {
            expectedPromise = 'POSITIVE';

            rgiCommoditySrvcStub = sinon.stub(nrgiCommoditiesSrvc.prototype, '$delete', function() {
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

            nrgiCommoditiesMethodSrvc.deleteCommodity([expectedPromise]).should.be.equal(expectedPromise);
            $qDeferSpy.called.should.be.equal(true);
        });

        //console.log('COMMODITIES METHOD SERVICE: MISSING NEGATIVE DELETE CASE')

        it('resolves the deferred in negative case', function () {
             expectedPromise = 'NEGATIVE';
             var REJECT_RESPONSE = {
                 data: {reason: 'REJECT_INSERTION'}
             };

             rgiCommoditySrvcStub = sinon.stub(nrgiCommoditiesSrvc.prototype, '$delete', function() {
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

             nrgiCommoditiesMethodSrvc.deleteCommodity([expectedPromise]).should.be.equal(expectedPromise);
             $qDeferSpy.should.have.been.calledWith(REJECT_RESPONSE.data.reason);
        });

        afterEach(function () {
            $qDeferStub.restore();
            //nrgiCommoditiesSrvc.restore();
        });
    });
    
    afterEach(function () {
        $qDeferStub.restore();
    });
});