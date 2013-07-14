define(["js/snapshot-comparator"], function(Snapshot) {
    /*xdescribe("snapshot comparison", function() {
        it("compare total counts ", function() {
            var snapshot1 = new Snapshot();
            var snapshot2 = new Snapshot();
            snapshot1.totalCount = 10;
            snapshot2.totalCount = 15;
            snapshot1.totalPoints = 20;
            snapshot2.totalPoints = 14;
            snapshot1.doneCount = 4;
            snapshot2.doneCount = 5;
            snapshot1.donePoints = 8;
            snapshot2.donePoints = 12;
            var summary = compare(snapshot1, snapshot2);
            expect(summary.totalCountDiff).toEqual(5);
            expect(summary.totalPointsDiff).toEqual(-6);
            expect(summary.doneCountDiff).toEqual(1);
            expect(summary.donePointsDiff).toEqual(4);
        });
    });
    describe("calculating totals...", function() {
        it("add total count and points", function() {
            var issues = [{
                    key: "M-1",
                    points: 2
                }, {
                    key: "M-2",
                    points: ""
                }, {
                    key: "M-3",
                    points: 4.5
                }
            ];
            var snapshot = new Snapshot();
            snapshot.issues = issues;
            snapshot.summarize();
            expect(snapshot.total.count).toEqual(3);
            expect(snapshot.total.points).toEqual(6.5);
        });
        it("add done count and points", function() {
            var issues = [{
                    key: "M-1",
                    points: 2,
                    status: "Closed"
                }, {
                    key: "M-2",
                    points: "",
                    status: "In Progress"
                }, {
                    key: "M-3",
                    points: 3.5,
                    status: "Resolved"
                }
            ];
            var snapshot = new Snapshot();
            snapshot.issues = issues;
            snapshot.summarize();
            expect(snapshot.done.count).toEqual(2);
            expect(snapshot.done.points).toEqual(5.5);
        });
    });*/
});
