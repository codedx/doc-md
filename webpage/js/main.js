(function() {

    var navContainer = $('#navigation-container');
    var navigation = $('#navigation');

    var resetNavigation = function() {
        if (! ($('#guide-toc-toggle:visible').length)) {
            navigation
                .removeClass('collapse in');
        } else {
            navigation
                .addClass('collapse');
        }
        navigation.css('width', navContainer.width());

        navigation.css('height', window.innerHeight);


    };
    $(window).resize(function() {
        resetNavigation();
    });

    resetNavigation();

    this.docMd = {};
    this.docMd.resetNavigation = resetNavigation;
}());