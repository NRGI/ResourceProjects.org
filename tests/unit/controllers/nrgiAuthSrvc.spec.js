'use strict';

describe('nrgiAuthSrvc', function () {
    beforeEach(module('app'));

    var nrgiAuthSrvc;
    var $q, nrgiUserSrvc,expected, nrgiIdentitySrvc;

    var $qDeferStub, $qDeferSpy,$window, $httpBackend, expectedPromise;
    var  login = {username: 'username', password: 'password'};
    var returnData = {
        "success": "true",
        "user": {
            "_id": "569976c21dad48f614cc8125",
            "first_name": "Jim",
            "last_name": "Cust",
            "username": "jcust",
            "email": "jcust@resourcegovernance.org",
            "salt": "NN517SW7g4qEJv7yPtmqvGy3cA1UYCljJTXUI6qxG0E7yvS4XZwmEGe7m2MroaVXIbMSuXo6vZGUyh5kEiGCMlJls8WjS20jVnc10BZc7gf2tDyj4mX+crkosdKOIjjJnMfc7J3J8SLpnfjcN1ZDDJ7PlWPC7SMYGop7/Hm21/o=",
            "creation_date": "2016-03-28T06:04:50.668Z",
            "role": ["admin"]
        }
    };
    beforeEach(inject(function (_nrgiAuthSrvc_,_$window_, _$q_,_$httpBackend_, _nrgiIdentitySrvc_, _nrgiUserSrvc_) {
        $q = _$q_;
        $window = _$window_;
        $httpBackend = _$httpBackend_;
        nrgiUserSrvc = _nrgiUserSrvc_;
        nrgiIdentitySrvc = _nrgiIdentitySrvc_;
        nrgiAuthSrvc = _nrgiAuthSrvc_;

    }));

    describe('#authenticateUser', function () {

        it('resolves the deferred in positive case', function () {

            expectedPromise = true;

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            $httpBackend.expectPOST('/login',{"username":"username","password":"password"}).respond(200,returnData);
            nrgiAuthSrvc.authenticateUser('username','password').should.be.equal(expectedPromise);

        });

        it('resolves the deferred in negative case', function () {

            expectedPromise = false;

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            $httpBackend.expectPOST('/login',{"username":"username","password":"password"}).respond(404,returnData);
            nrgiAuthSrvc.authenticateUser('username','password').should.be.equal(expectedPromise);
        });

        afterEach(function () {
            $qDeferStub.restore();
            $httpBackend.flush();
        });

    });

    describe('#logoutUser', function () {

        it('resolves the deferred in positive case', function () {

            expectedPromise = true;

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            $httpBackend.expectPOST('/logout',{"logout":true}).respond(200);

            nrgiAuthSrvc.logoutUser().should.be.equal(expectedPromise);
        });

        it('resolves the deferred in negative case', function () {

            expectedPromise = false;

            $qDeferSpy = sinon.spy();
            $qDeferStub = sinon.stub($q, 'defer', function () {
                return {
                    resolve: $qDeferSpy,
                    promise: expectedPromise
                };
            });

            $httpBackend.expectPOST('/logout',{"logout":true}).respond(404);

            nrgiAuthSrvc.logoutUser().should.be.equal(expectedPromise);
        });

        afterEach(function () {
            $qDeferStub.restore();
            $httpBackend.flush();
        });

    });

    describe('#authorizeCurrentUserForRoute', function () {

        it('resolves the deferred in positive case', function () {

            expected = true;

            nrgiIdentitySrvc.currentUser = returnData.user;
            nrgiAuthSrvc.authorizeCurrentUserForRoute(returnData.user.role[0]).should.be.equal(expected);
        });

        it('resolves the deferred in negative case', function () {

            expected = 'not authorized';

            nrgiAuthSrvc.authorizeCurrentUserForRoute().$$state.value.should.be.equal(expected);
        });

    });


    describe('#authorizeAuthenticatedUserForRoute', function () {

        it('resolves the deferred in positive case', function () {

            expected = true;
            nrgiIdentitySrvc.currentUser = returnData.user;

            nrgiAuthSrvc.authorizeAuthenticatedUserForRoute().should.be.equal(expected);
        });

        it('resolves the deferred in negative case', function () {

            expected = 'not authorized';

            nrgiAuthSrvc.authorizeAuthenticatedUserForRoute().$$state.value.should.be.equal(expected);
        });

    });
});


