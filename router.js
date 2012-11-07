/*
 Copyright 2012 Alexander Khotyanov
 http://NexusJS.com/
 @NexusJS

 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

(function(obj){
    obj.Route = function(urlRoute, resolve) {
        this.urlRoute = urlRoute;
        this.resolve = resolve;
    };
    var Router = {
        RouteNameNotFoundError: 'Error.RouteNameNotFound',
        registeredRoutes: [],
        deriveModel: function(urlRoute, url){
            var urlRouteArr = urlRoute.split('/');
            var urlArr = url.split('/');
            var model = {};
            if (urlRouteArr.length !== urlArr.length){
                throw 'urlRoute does not match url';
            }
            for (var i = 0, l = urlRouteArr.length; i < l; i++){
                if (Router.isRegisteredPartAVariable(urlRouteArr[i])){
                    model[urlRouteArr[i].substring(1, urlRouteArr[i].length)] = urlArr[i];
                }
            }
            return model;
        },
        isRegisteredPartAVariable: function(registeredRoutePart){
            return registeredRoutePart.indexOf(':') == 0;
        },
        getRouteToResolve: function(registeredRoutes, unresolvedUrl, routePartNumber){
            var position = routePartNumber || 0;
            var unresolvedUrlPart = unresolvedUrl.split('/')[position];
            var lastPosition = unresolvedUrl.split('/').length - 1;
            var matchingRegisteredRoutes = [];
            for (var i = 0, l = registeredRoutes.length; i < l; i++){
                var registeredRoute = registeredRoutes[i];
                if(registeredRoute.urlRoute.split('/').length == unresolvedUrl.split('/').length){
                    var registeredRoutePart = registeredRoute.urlRoute.split('/')[position];
                    if (Router.isRegisteredPartAVariable(registeredRoutePart) || registeredRoutePart == unresolvedUrlPart){
                        matchingRegisteredRoutes.push(registeredRoute);
                    }
                }
            }
            if (matchingRegisteredRoutes.length === 0){
                throw 'route to resolve was not found';
            }else if (position == lastPosition && matchingRegisteredRoutes.length > 0){
                return matchingRegisteredRoutes[0];
            }else{
                return Router.getRouteToResolve(matchingRegisteredRoutes, unresolvedUrl, ++position);
            }
        },
        resolveRoute: function(url){
            var deferred = $.Deferred();
            url = url || '/';
            var registeredRoutes =  $.extend(true, [], Router.registeredRoutes);
            if (registeredRoutes.length > 0){
                var routeToResolve = Router.getRouteToResolve(registeredRoutes, url);
                if (routeToResolve){
                    var model = Router.deriveModel(routeToResolve.urlRoute, url);
                    var promise = routeToResolve.resolve({
                        model: model
                    });
                    if (promise && promise.hasOwnProperty('done') && promise.hasOwnProperty('then')){
                        promise.done(function(){
                            deferred.resolve();
                        });
                    }else{
                        deferred.resolve();
                    }
                }else{
                    throw "Url " + url + " not found in registered routes";
                }
            }else{
                throw 'There are no registered routes';
            }
            return deferred.promise();
        },
        registerAllRoutes: function(routes){
            routes.map(function(route){
                Router.registerRoute(route);
            });
        },
        registerRoute: function(route){
            Router.registeredRoutes.push(route);
        },
        init: function(){
            window.onhashchange = function(){
                var urlRoute = location.hash.substring(1,location.hash.length);
                Router.resolveRoute(urlRoute || '/');
            }
        }
    };
    Router.init();
    obj.route = {
        register: Router.registerRoute,
        registerAll: Router.registerAllRoutes,
        to: Router.resolveRoute
    };
})(window);