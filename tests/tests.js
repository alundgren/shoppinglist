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

    QUnit.test('item added and then marked as done 1 mins later is not found when typing in at least the first two letters', function (assert) {
        var h, r;

        h = new ItemHistory();
        h.logItemAdded('Gul lök', new Date('2011-07-13T12:30:00'));
        h.logItemMarkedDone('Gul lök', new Date('2011-07-13T12:31:00'));

        r = h.search('Gu');

        assert.deepEqual(r, []);
    });

    QUnit.test('item added and then marked as done 10 mins later is found when typing in at least the first two letters', function (assert) {
        var h, r;

        h = new ItemHistory();
        h.logItemAdded('Gul lök', new Date('2011-07-13T12:30:00'));
        h.logItemMarkedDone('Gul lök', new Date('2011-07-13T13:30:00'));

        r = h.search('Gu');

        assert.deepEqual(r, ['Gul lök']);
    });

    QUnit.test('more recently added items are preferred all other things equal', function (assert) {
        var h, baseDate, r;

        h = new ItemHistory();
        baseDate = new Date('2011-07-13T12:30:00');

        addItemAndMarkDoneInXHours(h, 'Gul1', 1, addHours(baseDate, 1));
        addItemAndMarkDoneInXHours(h, 'Gul2', 1, addHours(baseDate, 2));
        addItemAndMarkDoneInXHours(h, 'Gul3', 1, addHours(baseDate, 3));
        addItemAndMarkDoneInXHours(h, 'Gul4', 1, addHours(baseDate, 4));
        addItemAndMarkDoneInXHours(h, 'Gul5', 1, addHours(baseDate, 5));
        addItemAndMarkDoneInXHours(h, 'Gul6', 1, addHours(baseDate, 6));

        r = h.search('Gu');

        assert.deepEqual(r, ['Gul6', 'Gul5', 'Gul4']);
    });

    QUnit.test('items marked as done more times are preferred all other things equal', function (assert) {
        var h, baseDate, r;

        h = new ItemHistory();
        baseDate = new Date('2011-07-13T12:30:00');

        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul1', 1, baseDate); }, 1);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul2', 1, baseDate); }, 2);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul3', 1, baseDate); }, 3);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul4', 1, baseDate); }, 4);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul5', 1, baseDate); }, 5);
        repeat(function () { addItemAndMarkDoneInXHours(h, 'Gul6', 1, baseDate); }, 6);
        r = h.search('Gu');

        assert.deepEqual(r, ['Gul6', 'Gul5', 'Gul4']);
    });

    QUnit.test('search is not case sensetive', function (assert) {
        var h, actualItemName;

        h = new ItemHistory();

        actualItemName = 'åÄöAbcDeFGh';
        addItemAndMarkDoneInXHours(h, actualItemName, 1);

        assert.deepEqual(h.search(actualItemName.toLowerCase()), [actualItemName]);
        assert.deepEqual(h.search(actualItemName.toUpperCase()), [actualItemName]);
        assert.deepEqual(h.search(actualItemName), [actualItemName]);
    });

    QUnit.test('serialization preserves items and graceperiod', function (assert) {
        var h1, h2, oneHour;

        oneHour = 60 * 60 * 1000;
        h1 = new ItemHistory();
        h1.setMistakeGracePeriodInMilliseconds(5 * oneHour);
        addItemAndMarkDoneInXHours(h1, 'A1', 3);
        addItemAndMarkDoneInXHours(h1, 'A2', 6);

        h2 = new ItemHistory();
        h2.fromJson(h1.toJson());
        addItemAndMarkDoneInXHours(h2, 'B1', 3);
        addItemAndMarkDoneInXHours(h2, 'B2', 6);

        assert.deepEqual(h2.search('A1'), [], 'young item from original history is not found');
        assert.deepEqual(h2.search('A2'), ['A2'], 'old item from original history is found');
        assert.deepEqual(h2.search('B1'), [], 'young item from restored history is not found');
        assert.deepEqual(h2.search('B2'), ['B2'], 'old item from restored history is found');
    });
}());

