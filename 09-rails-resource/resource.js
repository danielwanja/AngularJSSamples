(function (undefined) {
    angular.module('rails', ['ng']);

    function transformObject(data, transform) {
        var newKey;

        if (data && angular.isObject(data)) {
            angular.forEach(data, function (value, key) {
                newKey = transform(key);

                if (newKey !== key) {
                    data[newKey] = value;
                    delete data[key];
                }

                transformObject(value, transform);
            });
        }
    }

    function camelize(key) {
        if (!angular.isString(key)) {
            return key;
        }

        // should this match more than word and digit characters?
        return key.replace(/_[\w\d]/g, function (match, index, string) {
            return index === 0 ? match : string.charAt(index + 1).toUpperCase();
        });
    }

    function underscore(key) {
        if (!angular.isString(key)) {
            return key;
        }

        return key.replace(/[A-Z]/g, function (match, index) {
            return index === 0 ? match : '_' + match.toLowerCase();
        });
    }

    angular.module('rails').factory('railsFieldRenamingTransformer', function () {

        return function (data) {
            transformObject(data, underscore);
            return data;
        };
    });

    angular.module('rails').factory('railsFieldRenamingInterceptor', function () {
        return function (promise) {
            return promise.then(function (response) {
                transformObject(response.data, camelize);
                return response;
            });
        };
    });

    angular.module('rails').factory('railsRootWrappingTransformer', function () {
        return function (data, resource) {
            var result = {};
            result[angular.isArray(data) ? resource.rootPluralName : resource.rootName] = data;
            return result;
        };
    });

    angular.module('rails').factory('railsRootWrappingInterceptor', function () {
        return function (promise) {
            var resource = promise.resource;

            if (!resource) {
                return promise;
            }

            return promise.then(function (response) {
                if (response.data && response.data.hasOwnProperty(resource.rootName)) {
                    response.data = response.data[resource.rootName];
                } else if (response.data && response.data.hasOwnProperty(resource.rootPluralName)) {
                    response.data = response.data[resource.rootPluralName];
                }

                return response;
            });
        };
    });

    angular.module('rails').factory('railsResourceFactory', ['$http', '$q', '$injector', function ($http, $q, $injector) {

        function railsResourceFactory(config) {
            var transformers = config.requestTransformers || ['railsRootWrappingTransformer', 'railsFieldRenamingTransformer'],
                interceptors = config.responseInterceptors || ['railsFieldRenamingInterceptor', 'railsRootWrappingInterceptor'];

            function RailsResource(value) {
                angular.extend(this, value || {});
            }

            RailsResource.url = config.url;
            RailsResource.rootName = config.name;
            RailsResource.rootPluralName = config.pluralName || config.name + 's';
            RailsResource.httpConfig = config.httpConfig || {};
            RailsResource.requestTransformers = [];
            RailsResource.responseInterceptors = [];
            RailsResource.defaultParams = config.defaultParams;

            // copied from $HttpProvider to support interceptors being dependency names or anonymous factory functions
            angular.forEach(interceptors, function (interceptor) {
                RailsResource.responseInterceptors.push(
                    angular.isString(interceptor)
                        ? $injector.get(interceptor)
                        : $injector.invoke(interceptor)
                );
            });

            angular.forEach(transformers, function (transformer) {
                RailsResource.requestTransformers.push(
                    angular.isString(transformer)
                        ? $injector.get(transformer)
                        : $injector.invoke(transformer)
                );
            });

            RailsResource.transformData = function (data) {
                angular.forEach(RailsResource.requestTransformers, function (transformer) {
                    data = transformer(data, RailsResource);
                });

                return data;
            };

            RailsResource.callInterceptors = function (promise) {

                angular.forEach(RailsResource.responseInterceptors, function (interceptor) {
                    promise.resource = RailsResource;
                    promise = interceptor(promise);
                });

                return promise;
            };

            RailsResource.processResponse = function (promise) {
                promise = RailsResource.callInterceptors(promise);

                return promise.then(function (response) {
                    var result;

                    if (angular.isArray(response.data)) {
                        result = [];

                        angular.forEach(response.data, function (value) {
                            result.push(new RailsResource(value));
                        });
                    } else if (angular.isObject(response.data)) {
                        result = new RailsResource(response.data);
                    } else {
                        result = response.data;
                    }

                    return result;
                });
            };

            RailsResource.getHttpConfig = function (queryParams) {
                var config = angular.copy(RailsResource.httpConfig, {});

                if (RailsResource.defaultParams) {
                    config.params = RailsResource.defaultParams;
                }

                if (queryParams) {
                    config.params = angular.extend(config.params || {}, queryParams);
                }

                return config;
            };

            RailsResource.resourceUrl = function (id) {
                return RailsResource.url + '/' + id;
            };

            RailsResource.query = function (queryParams) {
                return RailsResource.processResponse($http.get(RailsResource.url, RailsResource.getHttpConfig(queryParams)));
            };

            RailsResource.get = function (id) {
                return RailsResource.processResponse($http.get(RailsResource.resourceUrl(id), RailsResource.getHttpConfig()));
            };

            RailsResource.prototype.processResponse = function (promise) {
                promise = promise.then(function (response) {
                    // store off the data in case something (like our root unwrapping) assigns data as a new object
                    response.originalData = response.data;
                    return response;
                });

                promise = RailsResource.callInterceptors(promise);

                return promise.then(angular.bind(this, function (response) {
                    // we may not have response data
                    if (response.hasOwnProperty('data') && angular.isObject(response.data)) {
                        angular.extend(this, response.data);
                    }

                    return this;
                }));
            };

            RailsResource.prototype.create = function () {
                // clone so we can manipulate w/o modifying our instance
                var data = RailsResource.transformData(angular.copy(this, {}));
                return this.processResponse($http.post(RailsResource.url, data, RailsResource.getHttpConfig()));
            };

            RailsResource.prototype.update = function () {
                // clone so we can manipulate w/o modifying our instance
                var data = RailsResource.transformData(angular.copy(this, {}));
                return this.processResponse($http.put(RailsResource.resourceUrl(this.id), data, RailsResource.getHttpConfig()));
            };

            RailsResource.prototype.remove = RailsResource.prototype.delete = function (id) {
                return this.processResponse($http.delete(RailsResource.resourceUrl(this.id), RailsResource.getHttpConfig()));
            };

            return RailsResource;
        }

        return railsResourceFactory;
    }]);
}());