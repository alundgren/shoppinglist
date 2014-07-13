/*jslint nomen: true */
/*global _*/

function ItemHistory(options) {
    'use strict';

    var data, debug;

    data = {
        items : []
    };

    if(options && options.debug) {
        debug = options.debug;
    } else {
        debug =  function (msg) {};
    }

    function logEvent(eventName, itemName, date) {
        debug('logEvent(' + eventName + ', ' + itemName + ', ' + date + ')');
        if (!itemName || itemName.length < 2) {
            return; //These will just pollute the list for no good reason since they cannot be matched regardless.
        }
        var d, item;
        d = date.getTime();

        item = _.find(data.items, function (x) { return x.name === itemName; });

        if (!item) {
            item = { name : itemName, autoCompleteCount : 0, activityCount : 0 };
            data.items.push(item);
        }

        if (eventName === 'r') {
            item.lastRemoved = d;
            item.activityCount = item.activityCount + 1;
        }
        if (eventName === 'a') {
            item.lastAdded = d;
            item.activityCount = item.activityCount + 1;
        }
        if (eventName === 'd') {
            item.lastDone = d;
            item.activityCount = item.activityCount + 1;
        }
        if (eventName === 'c') {
            item.lastAutocomplete = d;
            item.autoCompleteCount = item.autoCompleteCount + 1;
        }
    }

    this.fromJson = function (d) {
        data = JSON.parse(d);
    };

    this.toJson = function () {
        return JSON.stringify(data);
    };

    this.search = function (namePrefix, currentItems) { //TODO: Also filter out any items currenty in the list
        //prefixes shorter than 2 chars seems like it will give a bit random results. May even need 3.
        if (!namePrefix || namePrefix.length < 2) {
            return [];
        }

        var p, hits;

        p = namePrefix.toLowerCase();
        hits = _.chain(data.items)
            .filter(function (x) { return x.name.toLowerCase().lastIndexOf(p, 0) === 0; })
            .filter(function (x) { return !currentItems || !_(currentItems).find(function (y) { return x.name.toLowerCase() === y.toLowerCase(); }); })
            .sortBy(function (x) { return -x.activityCount; }) //Sort by this second.
            .sortBy(function (x) { return -x.autoCompleteCount; }) //Sort by this first.
            .pluck('name')
            .value();
        if (hits.length > 3) {
            return [hits[0], hits[1], hits[2]]; //underscore really needs skip and take...
        } else {
            return hits;
        }
    };

    this.logItemAdded = function (name, date) { //added to shoppinglist
        logEvent('a', name, date);
    };
    this.logItemMarkedDone = function (name, date) { //marked done on shoppinglist
        logEvent('d', name, date);
    };
    this.logItemRemoved = function (name, date) { //removed from shoppinglist
        logEvent('r', name, date);
    };
    this.logItemAutocompleted = function (name, date) { //accepted as autocomplete option
        logEvent('c', name, date);
    }
}
