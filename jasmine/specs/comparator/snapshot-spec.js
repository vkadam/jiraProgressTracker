define(["js/comparator/snapshot"], function(Snapshot) {
    describe("comparator/snapshot.js", function() {
        var issues = [{
                points: 1,
                status: "Closed"
        }, {
                points: "3",
                status: "Ready"
        }, {
                points: 2,
                status: "Open"
        }, {
                points: "1.3",
                status: "Resolved"
        }, {
                points: 2,
                status: "In Progress"
        }, {
                points: 2,
                status: "Verified"
        }, {
                points: 2,
                status: "Complete"
        }, {
                points: 2,
                status: "QA Active"
        }, {
                points: 2,
                status: "Ready for QA"
            }];

        it("Snapshot.summarize method returns summary of total issues", function() {
            var snapshot = new Snapshot(issues),
                result = snapshot.summarize();
            expect(result["Total Count"]).toBe(9);
            expect(result["Total Points"]).toBe("17.30");
        });

        it("Snapshot.summarize method returns summary of done issues", function() {
            var snapshot = new Snapshot(issues),
                result = snapshot.summarize();
            expect(result["Done Count"]).toBe(2);
            expect(result["Done Points"]).toBe("2.30");
        });

        it("Snapshot.summarize method returns summary of wip issues", function() {
            var snapshot = new Snapshot(issues),
                result = snapshot.summarize();
            expect(result["WIP Count"]).toBe(5);
            expect(result["WIP Points"]).toBe("10.00");
        });

    });
});
