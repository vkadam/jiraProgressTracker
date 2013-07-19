define(['handlebars'], function(Handlebars) {
    Handlebars.registerHelper("get", function(context, key) {
        return context[key];
    });

    Handlebars.registerHelper("subtract", function(context1, context2, key) {
        return Number(context2[key]) - Number(context1[key]);
    });
});
