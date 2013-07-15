define(['handlebars'], function(Handlebars) {
    Handlebars.registerHelper("get", function(context, key) {
        return context[key];
    });
});
