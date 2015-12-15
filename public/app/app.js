angular.module('app', ['ngResource', 'ngRoute', 'ngDialog','leaflet-directive','tableSort']);

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
            })






            .when('/projects', {
                templateUrl: '/partials/projects/projects',
                controller: 'nrgiProjectsCtrl'
            })
            .when('/project/:id_country/:id', {
                templateUrl: '/partials/projects/project',
                controller: 'nrgiProjectCtrl'
            })
            .when('/map', {
                templateUrl: '/partials/projects/map'
            })
            .when('/production/:id_country/:id', {
                templateUrl: '/partials/common/production'
            })
            .when('/countries', {
                templateUrl: '/partials/countries/countries',
                controller: 'nrgiCountriesCtrl'
            })
            .when('/country/:id', {
                templateUrl: '/partials/countries/country',
                controller: 'nrgiCountryCtrl'
            })
            .when('/commodities', {
                templateUrl: '/partials/commodities/commodities',
                controller: 'nrgiCommoditiesCtrl'
            })
            .when('/commodity/:id', {
                templateUrl: '/partials/commodities/commodity',
                controller: 'nrgiCommodityCtrl'
            })
            .when('/companies', {
                templateUrl: '/partials/companies/companies',
                controller: 'nrgiCompaniesCtrl'

            })
            .when('/company/:id', {
                templateUrl: '/partials/companies/company',
                controller: 'nrgiCompanyCtrl'
            })
            .when('/groups', {
                templateUrl: '/partials/companies/groups',
                controller: 'nrgiGroupsCtrl'
            })
            .when('/group/:id', {
                templateUrl: '/partials/companies/group',
                controller: 'nrgiGroupCtrl'
            })
            .when('/governmentReceipt/:id', {
                templateUrl: '/partials/common/receipt'
            })
            .when('/sources', {
                templateUrl: '/partials/sources/sources',
                controller: 'nrgiSourcesCtrl'
            })
            .when('/source/:id', {
                templateUrl: '/partials/sources/source',
                controller: 'nrgiSourceCtrl'
            })
            .when('/glossary', {
                templateUrl: '/partials/common/glossary'
            })
            .when('/contribute', {
                templateUrl: '/partials/common/contribute'
            })
            .when('/about', {
                templateUrl: '/partials/common/about'
            })
            .when('/model', {
                templateUrl: '/partials/common/dataModel'
            })
            .when('/namedGraphs', {
                templateUrl: '/partials/common/namedGraphs'
            })
            .when('/governmentreceipt/:id_country/:id', {
                templateUrl: '/partials/common/governmentreceipt'
            })
            //.when('/classes', {
            //    templateUrl: '/partials/main/classes'
            //})
            //.when('/instances/:id', {
            //    templateUrl: '/partials/main/instances'
            //})



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
        document.body.scrollTop = document.documentElement.scrollTop = 0;
        if(rejection === 'not authorized') {
            $location.path('/');
        }
    });
    $rootScope.$on('$routeChangeSuccess', function() {
        document.body.scrollTop = document.documentElement.scrollTop = 0;

    })
});