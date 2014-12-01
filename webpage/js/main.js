(function() {
    var toc = $('#toc');
    var toggle = $('#guide-toc-toggle');

    toc.stick_in_parent()
        .on('sticky_kit:stick', function(e) {
            console.log("toggle display: " + toggle.css('display'));
            toc.parent()
                .attr('id', 'sticky-toc-parent')
                .addClass('collapse in');
            if (toggle.css('display') !== 'none') {
                toggle.trigger('click');
            }
        });


    toggle.attr('data-target', '#sticky-toc-parent');


}());