/*jslint nomen: true */
/*global _*/

function ItemHistory(options) {
    'use strict';

    var data, debug;

    data = {
        items : [],
        mistakeGracePeriodInMilliseconds :  1000 * 60 * 10 //A known item flagged as done. Provided more than 10 minutes have elapsed (to avoid adding spelling errors and other things that are quickly removed) we add it.
    };

    debug = options.debug || function (msg) {};

    function logEvent(eventName, itemName, date) {
        debug('logEvent(' + eventName + ', ' + itemName + ', ' + date + ')');
        if (!itemName || itemName.length < 2) {
            return; //These will just pollute the list for no good reason since they cannot be matched regardless.
        }
        var d, item;
        d = date.getTime();

        item = _.find(data.items, function (x) { return x.name === itemName; });

        if (item) {
            //Already seen before
            if (eventName === 'd' && d - item.lastAdded >= data.mistakeGracePeriodInMilliseconds) {

                item.lastDone = d;
                if (item.doneCount) {
                    item.doneCount = item.doneCount + 1;
                } else {
                    item.doneCount = 1;
                }
            }
        } else if (eventName === 'a') {
            //New item is added. Other events happening if the item doesnt exists make no sense so we just ignore those.
            data.items.push({ name : itemName, lastAdded : d });
        }
    }

    this.fromJson = function (d) {
        data = JSON.parse(d);
    };

    this.toJson = function () {
        return JSON.stringify(data);
    };

    this.setMistakeGracePeriodInMilliseconds = function (ms) {
        data.mistakeGracePeriodInMilliseconds = ms;
    };

    this.search = function (namePrefix) { //TODO: Also filter out any items currenty in the list
        //prefixes shorter than 2 chars seems like it will give a bit random results. May even need 3.
        if (!namePrefix || namePrefix.length < 2) {
            return [];
        }

        var p, hits;

        p = namePrefix.toLowerCase();
        hits = _.chain(data.items)
            .filter(function (x) { return x.doneCount && x.name.toLowerCase().lastIndexOf(p, 0) === 0; })
            .sortBy(function (x) { return -x.lastAdded; }) //Sort by this second. If habits change, new items will eventually win out over old items.
            .sortBy(function (x) { return -(x.doneCount || 0); }) //Sort by this first. Items marked done often are preferred.
            .pluck('name')
            .value();
        if (hits.length > 3) {
            return [hits[0], hits[1], hits[2]]; //underscore really needs skip and take...
        } else {
            return hits;
        }
    };

    this.logItemAdded = function (name, date) {
        logEvent('a', name, date);
    };
    this.logItemMarkedDone = function (name, date) {
        logEvent('d', name, date);
    };
    this.logItemRemoved = function (name, date) {
        logEvent('r', name, date);
    };
}
