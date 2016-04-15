'use strict';

angular
    .module('app')
    .directive("whenScrolled", function(){
        return{
            restrict: 'EA',
            link: function(scope, elem, attrs){
                var raw = elem[0];
                elem.bind("scroll", function(){
                    if(raw.scrollTop+raw.offsetHeight+5 >= raw.scrollHeight){
                        scope.loading = true;
                        scope.$apply(attrs.whenScrolled);
                    }
                });
            }
        }
    });