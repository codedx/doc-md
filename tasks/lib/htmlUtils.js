var cheerio = require('cheerio'),
    fs = require('fs'),
    path = require('path'),
    pagedown = require('pagedown');

var converter = new pagedown.Converter();

var idRegex = /[^\w]/g;

var allHeaders = 'h1, h2, h3, h4, h5, h6';

var buildHeader = function(name, depth) {
    var header = '<h' + (depth) + '>' + name + '</h' + depth + '>';
    return header;
};

var appendTocElement = function(toc, link) {
    var element = cheerio.load('<li></li>');
    element('li')
        .addClass('docmd-toc-item')
        .append(link);
    toc.root().append(element.html());
};

var buildSimpleTocLink = function(name, anchorId) {
    return cheerio.load('<a>')('a')
        .attr('href', '#' + anchorId)
        .addClass("docmd-toc-link")
        .text(name);
};

var adjustHeaders = function($, depth) {
    $(allHeaders).each(function(index, element) {
        var level = element.tagName.match(/\d/);
        var newLevel = parseInt(level) + depth - 1;
        if (newLevel > 6) {
            newLevel = 6;
        }
        element.tagName = 'h' + newLevel;
    });
};

var buildAndLinkHtml = function(options, properties, depth) {
    if (depth > 4) {
        //TODO determine if this is the correct threshold
        depth = 4;
    }
    var tocSections = cheerio.load('');
    var name,
        header,
        $;
    if (properties["name"]) {
        name = properties["name"];
        $ = cheerio.load(buildHeader(name, depth));
        header = $(allHeaders).first();
    } else if (properties["file"]) {
        var sectionFile = path.join(options['docDir'], properties["file"]);
        var markdown = fs.readFileSync(sectionFile, {"encoding": "utf-8"});
        var markdownHtml = converter.makeHtml(markdown);
        $ = cheerio.load('');
        $.root().append(markdownHtml);
        if (options["normalizeHeaders"]) {
            adjustHeaders($, depth);
        }
        header = $(allHeaders).first();
        name = header.text();
    } else  {
        grunt.fail.warn("A toc list contains an element that is neither a name nor a file");
    }
    var anchorId = properties["anchor"];
    if (!anchorId) {
        anchorId = name.replace(idRegex, '');
    }
    header.attr('id', anchorId);
    appendTocElement(tocSections, buildSimpleTocLink(name, anchorId));

    if (properties["toc"]) {
        properties["toc"].forEach(function(section) {
            var sectionContent = buildAndLinkHtml(options, section, depth + 1);

            appendTocElement(tocSections, sectionContent["toc"]);
            $.root().append(sectionContent['main']);
        });
    }

    var toc = cheerio.load('');
    var tocContents = cheerio.load('<ul>');
    tocContents('ul').addClass('docmd-toc-list')
        .append(tocSections.html());
    toc.root().append(tocContents.html());

    return {
        "main": $.root().html(),
        "toc": toc.html()
    };
};

module.exports = {
    buildAndLinkHtml: buildAndLinkHtml
};