define(['js/factories/filter-group'], function(FilterGroupFactory) {
    'use strict';
    var cachedFilters = {};

    function fetchFilter(filterId, filterGroupId) {
        var deferred = $.Deferred();
        FilterGroupFactory.get(filterGroupId).done(function(filters) {
            var filter = filters[filterId];
            deferred.resolve(filter);
        });
        return deferred.promise();
    }

    return {
        get: function(filterId, filterGroupId) {
            return cachedFilters[filterId] || (cachedFilters[filterId] = fetchFilter(filterId, filterGroupId));
        }
    };
});