describe("Unit: Testing Modules", function() {
    beforeEach(module('app'));
    it('should contain an nrgiAuthSrvc service', inject(function(nrgiAuthSrvc) {
        expect(nrgiAuthSrvc).not.toBeNull();
    }));
    it('should have a working nrgiAuthSrvc service',
        inject(['nrgiAuthSrvc',function($srvc) {
            expect($srvc.authenticateUser).not.toBeNull();
            expect($srvc.logoutUser).not.toBeNull();
            expect($srvc.authorizeCurrentUserForRoute).not.toBeNull();
            expect($srvc.authorizeAuthenticatedUserForRoute).not.toBeNull();
        }]));
});
describe('nrgiAuthSrvc', function () {
    var nrgiAuthSrvc,
        httpBackend,
        result,
        logout,
        authorizeCurrentUserForRoute,
        authorizeAuthenticatedUserForRoute,
        nrgiIdentitySrvc;

    var username = 'jcust', password = 'admin';
    beforeEach(function (){
        module('app');

        inject(function($httpBackend, _nrgiAuthSrvc_,_nrgiIdentitySrvc_) {
            nrgiAuthSrvc = _nrgiAuthSrvc_;
            nrgiIdentitySrvc = _nrgiIdentitySrvc_;
            httpBackend = $httpBackend;
        });
    });

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should login and return the response.', function (){
        var returnData = {
            "success": true,
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

        httpBackend.expectPOST('/login',{username:username, password:password}).respond(returnData);

        var authenticateUser = nrgiAuthSrvc.authenticateUser(username, password);

        authenticateUser.then(function(response) {
            result = response;
        });

        nrgiIdentitySrvc.currentUser = returnData.user;
        authorizeCurrentUserForRoute = nrgiAuthSrvc.authorizeCurrentUserForRoute(returnData.user.role[0])
        authorizeAuthenticatedUserForRoute = nrgiAuthSrvc.authorizeAuthenticatedUserForRoute(returnData.user.role[0])

        httpBackend.flush();

        expect(result).toBeTruthy();
        expect(authorizeCurrentUserForRoute).toBe(true);
        expect(authorizeAuthenticatedUserForRoute).toBe(true);

        httpBackend.expectPOST('/logout',{logout:true}).respond({"success":true});

        var logoutUser = nrgiAuthSrvc.logoutUser();

        logoutUser.then(function(response) {
            logout = response;
            nrgiIdentitySrvc.currentUser =undefined;
        });

        httpBackend.flush();

        authorizeCurrentUserForRoute = nrgiAuthSrvc.authorizeCurrentUserForRoute(returnData.user.role[0])
        authorizeAuthenticatedUserForRoute = nrgiAuthSrvc.authorizeAuthenticatedUserForRoute(returnData.user.role[0])

        expect(result).toBeTruthy();
        expect(authorizeCurrentUserForRoute.$$state.value).toBe('not authorized');
        expect(authorizeAuthenticatedUserForRoute.$$state.value).toBe('not authorized');
    });
});