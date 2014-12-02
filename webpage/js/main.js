(function() {
    var toc = $('#toc');
    var toggle = $('#guide-toc-toggle');

    var first = true;

    toc.stick_in_parent({
        "parent": "#docmd-content"
    }).on('sticky_kit:stick', function(e) {
            if (first) {
                first = false;
                console.log("toggle display: " + toggle.css('display'));
                toc.parent()
                    .attr('id', 'sticky-toc-parent')
                    .addClass('collapse in');
                if (toggle.css('display') !== 'none') {
                    toggle.trigger('click');
                }
            }

        });

    $(window).resize(function() {
        if (! ($('#guide-toc-toggle:visible').length)) {
            toc.parent().addClass('in');
        }
    });

    toggle.attr('data-target', '#sticky-toc-parent');


}());