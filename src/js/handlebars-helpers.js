define(['handlebars'], function(Handlebars) {
    Handlebars.registerHelper('snapshot', function(context, options) {
        return context[options].val;
    });
});
