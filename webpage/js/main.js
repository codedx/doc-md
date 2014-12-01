(function() {
    var toc = $('#toc');
    var toggle = $('#guide-toc-toggle');

    toc.stick_in_parent()
        .on('sticky_kit:stick', function(e) {
            toc.parent()
                .attr('id', 'sticky-toc-parent')
                .addClass('collapse in');
        });


    toggle.attr('data-target', '#sticky-toc-parent');


}());