/*jslint nomen: true */ /* This is needed to be able to use underscore since jslint will whine about naming conventions everywhere otherwise. */
/*global angular, Dropbox, _, ItemHistory, console*/

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
    function loadDataFromLocalStorage(name, parse, defaultValue) {
        if (!localStorage) {
            return defaultValue;
        }
        try {
            var d, p;
            d = localStorage[name];
            if (d) {
                p = parse(d);
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

    function saveDataToLocalStorage(name, serialize, value) {
        if (!localStorage) {
            return;
        }
        if (value) {
            localStorage[name] = serialize(value); //angular.toJson instead of JSON.stringify to have angular strip out it's internal $-properties before serialization
        } else {
            localStorage[name] = null;
        }
    }

    function identity(x) { return x; }
    return {
        load : function (name, defaultValue) { return loadDataFromLocalStorage(name, JSON.parse, defaultValue); },
        loadRaw : function (name, defaultValue) { return loadDataFromLocalStorage(name, identity, defaultValue); },
        save : function (name, value) { saveDataToLocalStorage(name, angular.toJson, value); },
        saveRaw : function (name, value) { saveDataToLocalStorage(name, identity, value); }
    };
}());

main = (function () {
    'use strict';
    var app;

    app = angular
        .module('ShoppingListApp', [])
        .factory('isDevelopment', function () { return document && document.URL.lastIndexOf('http://localhost', 0) === 0; })
        .controller('ShoppingListController', function ($scope, isDevelopment) {
            var history, historySaved;

            $scope.items = storage.load('shoppinglist_items_v1',  []);

            history = new ItemHistory({ debug : function (x) { console.log(x); }});
            historySaved = storage.loadRaw('shoppinglist_history_v1',  null);
            if (historySaved) {
                history.fromJson(historySaved);
            }
            if (isDevelopment) {
                //To make it easier to test autocomplete we include even items added and removed right after one another to be included.
                history.setMistakeGracePeriodInMilliseconds(1);
            }

            $scope.removeDoneItems = function () {
                var newItems = [];
                angular.forEach($scope.items, function (item, index) {
                    if (!item.done) {
                        newItems.push(item);
                    } else {
                        history.logItemRemoved(item.text, new Date());
                        storage.saveRaw('shoppinglist_history_v1', history.toJson()); //TODO: Make the history emit events whenever it changes so we can do this once
                    }
                });
                $scope.items = newItems;
            };

            $scope.addItem = function (itemText) {
                if (itemText) {
                    $scope.items.unshift({ text : itemText });
                    $scope.newItem = '';
                    history.logItemAdded(itemText, new Date());
                    storage.saveRaw('shoppinglist_history_v1', history.toJson()); //TODO: Make the history emit events whenever it changes so we can do this once
                }
            };

            $scope.toogleItemDone = function (item) {
                if (item) {
                    if (!item.done) {
                        history.logItemMarkedDone(item.text, new Date());
                        storage.saveRaw('shoppinglist_history_v1', history.toJson()); //TODO: Make the history emit events whenever it changes so we can do this once
                    }
                    item.done = !item.done;
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

            $scope.searchhitSelected = function (itemText) {
                $scope.addItem(itemText);
            };

            $scope.$watch('items', function () {
                storage.save('shoppinglist_items_v1', $scope.items);
            }, true);

            $scope.$watch('newItem', function () {
                if ($scope.newItem && $scope.newItem.length >= 2) {
                    var hitsModel = _.map(history.search($scope.newItem), function (x) {
                        return {
                            matchedPrefixText : x.substring(0, $scope.newItem.length),
                            remainingText : x.substring($scope.newItem.length, x.length),
                            fullText : x
                        };
                    });
                    $scope.searchhits = hitsModel;
                } else {
                    $scope.searchhits = undefined;
                }
            });
        });
    return {
        app : app
    };
}());
