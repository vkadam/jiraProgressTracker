define(["js/comparator/snapshot"], function(Snapshot) {
    describe("comparator/snapshot.js", function() {
        var issues = [{
            points: 1,
            status: "Closed"
        }, {
            points: "3"
        }, {
            points: 2
        }, {
            points: "1.3",
            status: "Resolved"
        }];

        it("Snapshot.summarize method returns summary of total issues", function() {
            var snapshot = new Snapshot(issues),
                result = snapshot.summarize();
            expect(result["Total Count"]).toBe(4);
            expect(result["Total Points"]).toBe(7.3);
        });

        it("Snapshot.summarize method returns summary of done issues", function() {
            var snapshot = new Snapshot(issues),
                result = snapshot.summarize();
            expect(result["Done Count"]).toBe(2);
            expect(result["Done Points"]).toBe(2.3);
        });

    });
});
