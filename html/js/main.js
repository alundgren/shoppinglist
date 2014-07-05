/*global angular, Dropbox*/
var storage, main, logger;

logger = (function () {
    'use strict';
    return {
        exception : function (e) {
            if (localStorage) {
                localStorage.shoppinglist_lasterrormessage_v1 = e.message;
            }
        }
    };
}());

storage = (function () {
    'use strict';
    function loadDataFromLocalStorage(name, defaultValue) { //Or return sane defaults if nothing exists (maybe prefilled with tutorial like items??)
        if (!localStorage) {
            return defaultValue;
        }
        try {
            var d, p;
            d = localStorage[name];
            if (d) {
                p = JSON.parse(d);
            }
            if (p) {
                return p;
            } else {
                return defaultValue;
            }
        } catch (err) {
            logger.exception(err);
            return defaultValue;
        }
    }

    function saveDataToLocalStorage(name, value) {
        if (!localStorage) {
            return;
        }
        if (value) {
            localStorage[name] = angular.toJson(value); //angular.toJson instead of JSON.stringify to have angular strip out it's internal $-properties before serialization
        } else {
            localStorage[name] = null;
        }
    }

    return {
        load : loadDataFromLocalStorage,
        save : saveDataToLocalStorage
    };
}());

main = (function () {
    'use strict';
    var app;
    function loadDataFromLocalStorage() { //Or return sane defaults if nothing exists (maybe prefilled with tutorial like items??)
        if (!localStorage) {
            return {
                items : []
            };
        }/*http://blog.notdot.net/2010/07/Damn-Cool-Algorithms-Levenshtein-Automata     https://github.com/universal-automata/liblevenshtein*/
        try {
            var d, p;
            d = localStorage.shoppinglist_data_v1;
            if (d) {
                p = JSON.parse(d);
            }
            if (p) {
                return p;
            } else {
                return {
                    items : []
                };
            }
        } catch (err) {
            localStorage.shoppinglist_lasterrormessage_v1 = err.message;
            return {
                items : []
            };
        }
    }
    function saveDataToLocalStorage(d) {
        if (!localStorage || !d) {
            return;
        }
        localStorage.shoppinglist_data_v1 = angular.toJson(d);
    }
    app = angular
        .module('ShoppingListApp', [])
        .controller('ShoppingListController', function ($scope) {
            $scope.items = storage.load('shoppinglist_items_v1',  []);

            $scope.removeDoneItems = function () {
                var newItems = [];
                angular.forEach($scope.items, function (item, index) {
                    if (!item.done) {
                        newItems.push(item);
                    }
                });
                $scope.items = newItems;
            };

            $scope.addItem = function (item) {
                if (item) {
                    $scope.items.unshift({ text : $scope.newItem });
                    $scope.newItem = "";
                }
            };

            $scope.hasDoneItems = function () {
                var count = 0;
                angular.forEach($scope.items, function (x, index) {
                    if (x.done) {
                        count = count + 1;
                    }
                });
                return count > 0;
            };

            $scope.$watch('items', function () {
                storage.save('shoppinglist_items_v1', $scope.items);
            }, true);
        });
    return {
        app : app
    };
}());
