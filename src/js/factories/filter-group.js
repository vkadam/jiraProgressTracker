define(['jquery', 'gsloader', 'js/models/filter'], function($, GSLoader, Filter) {
    var filterGroups = {};

    /**
     * Fetch spreadsheet for {{spreadsheetId}} and returns filters array
     * @param {spreadsheetId} Spreadsheet id of filters
     */

    function loadFilterGroupSpreadsheet(spreadsheetId) {
        var deferred = $.Deferred(),
            filters = {};

        function errorCallBack(errorMessage, sSheet) {
            deferred.reject({
                'message': errorMessage,
                'spreadsheet': sSheet
            });
        }

        GSLoader.loadSpreadsheet({
            id: spreadsheetId,
            wanted: ['Filters']
        }).done(function(sSheet) {
            var wSheet = sSheet.getWorksheet('Filters'),
                filter;
            if (wSheet) {
                $.each(wSheet.rows, function(idx, row) {
                    filter = new Filter(row);
                    filters[filter.id] = filter;
                });
                deferred.resolve(filters);
            } else {
                errorCallBack('Filters worksheet not available', sSheet);
            }
        }).fail(errorCallBack);

        return deferred.promise();
    }

    return {
        get: function(filterGroupId, force) {
            return !force && filterGroups[filterGroupId] || (filterGroups[filterGroupId] = loadFilterGroupSpreadsheet(filterGroupId));
        }
    };
});
