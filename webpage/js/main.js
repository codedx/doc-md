(function() {

    var navContainer = $('#navigation-container');
    var navigation = $('#navigation');
    var toggle = $('#guide-toc-toggle');

    var hideNavigation = function() {
        navigation.addClass('hidden');
        navigation.css('left', -1 * navContainer.width() - 1);
    };

    var showNavigation = function() {
        navigation.removeClass('hidden');
        navigation.css('left', 0);
    };

    var resetNavigation = function() {
        if (toggle.is(':visible')) {
            hideNavigation();
        } else {
            showNavigation();
        }
        navigation.css('width', navContainer.width());

        navigation.css('height', window.innerHeight);

        navigation.trigger('docmd.resetNavigation');
    };
    $(window).resize(function() {
        resetNavigation();
    });

    toggle.click(function(event) {
        if (navigation.is('.hidden')) {
            showNavigation();
        } else {
            hideNavigation();
        }
    });

    resetNavigation();

    this.docMd = {};
    this.docMd.resetNavigation = resetNavigation;
}());