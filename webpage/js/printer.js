(function() {


    var params = (function() {
        var params = {};
        var pairs = document.location.search.substring(1).split('&');
        pairs.forEach(function(p) {
            var pair = p.split('=');
            var key = decodeURIComponent(pair[0]);
            var value = decodeURIComponent(pair[1]);
            if (params[key] === undefined) {
                params[key] = value === undefined ? null : value;
            } else if (Array.isArray(params[key])) {
                params[key].push(value);
            } else {
                params[key] = [params[key]];
                params[key].push(value);
            }
        });
        return params;
    }());

    document.getElementsByClassName('footer-center')[0].innerHTML = params['page'];
}());