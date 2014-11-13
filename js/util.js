(function() {
    //TODO find a better way to handle this polyfill
    if (typeof String.prototype.endsWith !== 'function') {
        String.prototype.endsWith = function(/*String*/suffix) {
            var end;
            if (suffix == null || typeof suffix !== "string") {
                return false;
            }
            if (suffix.length <= this.length) {
                end = this.substr(this.length - suffix.length, suffix.length);
                return end === suffix;
            } else {
                return false;
            }
        }
    }
}());