'use strict';

angular.module('app')
    .controller('nrgiSourceCtrl', function (
        $scope,
        nrgiAuthSrvc,
        nrgiIdentitySrvc
    ) {
        $scope.source =
            {id:'AGNICOEAGLEMINESLIMITED-qgl67j',name:'Tullow 2014 Transparency Disclosure',
                description:'Manually transcribed by NRGI staff and then processed according to the details here: https://github.com/NRGI/resource-projects-etl/tree/master/process/tullow',
                type:'Mandatory payment disclosure',sourceDate:'2015-01-01',retrievedDate:'2015-09-30',accessLink:'http://www.tullowoil.com/Media/docs/default-source/5_sustainability/2014-tullow-cr-report.pdf?sfvrsn=4',
                archiveCopy:'https://drive.google.com/file/d/1o34QJPiT4v4aIS3O63p9pd8P1-ZzCM8K0ds0PjctKrd-HKMOfB5DO1VrInr0YmKQ3gqGhwgBjv0sSoo4/view',
                graph:'http://staging.resourceprojects.org/Tullow 2014'}


    });


