/*jslint nomen: true */
/*global QUnit, _, ItemHistory*/

(function () {
    'use strict';

    function addHours(date, h) {
        var copiedDate = new Date(date.getTime());
        copiedDate.setTime(copiedDate.getTime() + (h * 60 * 60 * 1000));
        return copiedDate;
    }

    function addItemAndMarkDoneInXHours(h, itemName, ageInHours, addedDate) {
        addedDate = addedDate || new Date('2014-07-01T12:15:00');
        ageInHours = ageInHours || 1;

        h.logItemAdded(itemName, addedDate);
        h.logItemMarkedDone(itemName, addHours(addedDate, ageInHours));
    }

    function repeat(f, n) {
        var i;
        for (i = 0; i < n; i = i + 1) {
            f();
        }
    }
    var baseDate = new Date('2011-07-13T12:30:00');

    QUnit.test('item added can be found later by autocomplete', function (assert) {
        var h, r;

        h = new ItemHistory();
        h.logItemAdded('Gul lök', baseDate);

        r = h.search('Gu');

        assert.deepEqual(r, ['Gul lök']);
    });

    QUnit.test('item added is not found by autocomplete if already present', function (assert) {
        //NOTE: This could be inferred by the item not having been removed after the last add but it feels risky since they may get out of synch for various reasons.
        var h, r;

        h = new ItemHistory();
        h.logItemAdded('Gul lök', baseDate);

        r = h.search('Gu', ['Gul lök']);

        assert.deepEqual(r, []);
    });

    QUnit.test('serialization preserves items', function (assert) {
        var h1, h2, oneHour;

        h1 = new ItemHistory();
        addItemAndMarkDoneInXHours(h1, 'A1');

        h2 = new ItemHistory();
        h2.fromJson(h1.toJson());

        assert.deepEqual(h2.search('A1'), ['A1'], 'item from original history is found');
    });

    QUnit.test('items marked as done more times are preferred all other things equal', function (assert) {
        var h, r;
        h = new ItemHistory();

        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul1'); }, 1);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul2'); }, 2);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul3'); }, 3);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul4'); }, 4);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul5'); }, 5);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul6'); }, 6);
        r = h.search('Gu');

        assert.deepEqual(r, ['Gul6', 'Gul5', 'Gul4']);
    });
}());

