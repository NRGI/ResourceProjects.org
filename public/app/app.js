angular.module('app', ['ngResource', 'ngRoute', 'ngDialog']);

angular.module('app')
    .config(function($routeProvider, $locationProvider) {
        // role checks
        var routeRoleChecks = {
            supervisor: {auth: function(nrgiAuthSrvc) {
                return nrgiAuthSrvc.authorizeCurrentUserForRoute('supervisor')
            }},
            researcher: {auth: function(nrgiAuthSrvc) {
                return nrgiAuthSrvc.authorizeCurrentUserForRoute('researcher')
            }},
            reviewer: {auth: function(nrgiAuthSrvc) {
                return nrgiAuthSrvc.authorizeCurrentUserForRoute('reviewer')
            }},
            user: {auth: function(nrgiAuthSrvc) {
                return nrgiAuthSrvc.authorizeAuthenticatedUserForRoute()
            }}
        };

        $locationProvider.html5Mode(true);
        $routeProvider
            .when('/', {
                templateUrl: '/partials/main/main',
                controller: 'nrgiMainCtrl'
            })
            // Admin Routes
            .when('/admin/create-user', {
                templateUrl: '/partials/admin/users/create-user',
                controller: 'nrgiUserAdminCreateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/user-admin', {
                templateUrl: '/partials/admin/users/user-admin',
                controller: 'nrgiUserAdminCtrl',
                resolve: routeRoleChecks.supervisor
            })
            .when('/admin/user-admin/:id', {
                templateUrl: '/partials/admin/users/user-admin-update',
                controller: 'nrgiUserAdminUpdateCtrl',
                resolve: routeRoleChecks.supervisor
            })
            // User Account Routes
            .when('/profile', {
                templateUrl: '/partials/account/profile',
                controller: 'nrgiProfileCtrl',
                resolve: routeRoleChecks.user
            });
//    .when('/admin/question-admin', {
//        templateUrl: '/partials/admin/questions/question-admin',
//        controller: 'nrgiQuestionAdminCtrl',
//        resolve: routeRoleChecks.supervisor
//    })
//    .when('/admin/question-admin/:id', {
//        templateUrl: '/partials/admin/questions/question-admin-update',
//        controller: 'nrgiQuestionAdminUpdateCtrl',
//        resolve: routeRoleChecks.supervisor
//    })
//    .when('/admin/assessment-admin', {
//        templateUrl: '/partials/admin/assessments/assessment-admin',
//        controller: 'nrgiAssessmentAdminCtrl',
//        resolve: routeRoleChecks.supervisor
//    })
//    .when('/admin/assessment-assign/:assessment_ID', {
//        templateUrl: '/partials/admin/assessments/assessment-admin-assign',
//        controller: 'nrgiAssessmentAdminAssignCtrl',
//        resolve: routeRoleChecks.supervisor
//    })
//    .when('/admin/assessments/assessment-dashboard', {
//        templateUrl: '/partials/admin/assessments/assessment-dashboard',
//        controller: 'nrgiAssessmentDashboardCtrl',
//        resolve: routeRoleChecks.user
//    })
//    .when('/admin/assessments/assessment-dashboard/:assessment_ID', {
//        templateUrl: '/partials/admin/assessments/assessment-dashboard-detail',
//        controller: 'nrgiAssessmentDashboardDetailCtrl',
//        resolve: routeRoleChecks.user
//    })
//    // Assessment overview routes
//    .when('/assessments', {
//        templateUrl: '/partials/user/assessments/assessments-list',
//        controller: 'nrgiAssessmentsListCtrl',
//        resolve: routeRoleChecks.user
//    })
//    .when('/assessments/:assessment_ID', {
//        templateUrl: '/partials/user/assessments/assessment-detail',
//        // controller: '',
//        controller: 'nrgiAssessmentDetailCtrl',
//        resolve: routeRoleChecks.user
//    })
//    .when('/assessments/assessment/:answer_ID', {
//        templateUrl: '/partials/user/assessments/answer-page',
//        controller: 'nrgiAnswerCtrl'
//    })
//    .when('/answer-page', {
//        templateUrl: '/partials/answer-page',
//        constant: 'nrgiAnswerCtrl'
//    })
//    .when('/answer-page-bolivia', {
//        templateUrl: '/partials/bolivia-answer-page',
//        constant: 'boliviaCtrl'
//    });
//    .when('/reporting', {
//        templateUrl: '/partials/questions/reporting',
//        controller: 'nrgiReportingCtrl'
//    })
//    .when('/assessment/:nav_ID', {
//         templateUrl:'/partials/assessments/assessment-details',
//         controller: 'nrgiAssessmentDetailCtrl'
//    });
    });

angular.module('app').run(function($rootScope, $location) {
    $rootScope.$on('$routeChangeError', function(evt, current, previous, rejection) {
        if(rejection === 'not authorized') {
            $location.path('/');
        }
    })
});