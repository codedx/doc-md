(function() {

	var navContainer = $('#navigation-container');
	var navigation = $('#navigation');
	var toggle = $('#guide-toc-toggle');

	var hideNavigation = function() {
		navigation.removeClass('in');
	};

	var showNavigation = function() {
		navigation.addClass('in');
	};

	var resetNavigation = function() {
		if (toggle.is(':visible')) {
			hideNavigation();
		} else {
			showNavigation();
		}

		navigation.css('height', window.innerHeight);

		navigation.trigger('docmd.resetNavigation');
	};
	$(window).resize(function() {
		resetNavigation();
	});

	toggle.click(function(event) {
		if (navigation.is('.in')) {
			hideNavigation();
		} else {
			showNavigation();
		}
	});

	resetNavigation();

	this.docMd = {};
	this.docMd.resetNavigation = resetNavigation;
}());