var cheerio = require('cheerio'),
    fs = require('fs'),
    path = require('path'),
    pagedown = require('pagedown');

var converter = new pagedown.Converter();

var idRegex = /[^\w]/g;

var setExtHeader1Regex = /^(.+)[ \t]*\n=+[ \t]*\n+/gm;
var setExtHeader2Regex = /^(.+)[ \t]*\n-+[ \t]*\n+/gm;

/*    /
    ^(\#{1,6})      // $1 = string of #'s
        [ \t]*
    (.+?)           // $2 = Header text
    [ \t]*
    \#*             // optional closing #'s (not counted)
    \n+
    /gm */
var atxHeaderRegex = /^(\#{1,6})[ \t]*(.+?)[ \t]*\#*\n+/gm;
var markdownHeaders = [
    '',
    "#",
    "##",
    "###",
    "####",
    "#####",
    "######"
];

var allHtmlHeaders = 'h1, h2, h3, h4, h5, h6';

var buildHeader = function(name, depth) {
    return '<h' + (depth) + '>' + name + '</h' + depth + '>';
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

var adjustMarkdownHeaders = function(markdown, depth) {
    markdown = markdown.replace(atxHeaderRegex, function (wholeMatch, m1, m2) {
        var currentLevel = m1.length;
        var newLevel = depth + currentLevel - 1;
        if (newLevel > 6) {
            newLevel = 6;
        }
        return '\n' + markdownHeaders[newLevel] + ' ' + m2 + '\n\n';
        }
    );

    markdown = markdown.replace(setExtHeader1Regex, function(wholeMatch, m1) {
        return '\n' + markdownHeaders[depth] + ' ' + m1 + '\n\n';
    });

    markdown = markdown.replace(setExtHeader2Regex, function(wholeMatch, m1) {
        var newLevel = depth + 1;
        if (newLevel > 6) {
            newLevel = 6;
        }
        return '\n' + markdownHeaders[newLevel] + ' ' + m1 + '\n\n';
    });
    return markdown;
};

var buildAndLinkHtml = function(options, properties, depth) {
    if (depth > 4) {
        //TODO determine if this is the correct threshold
        depth = 4;
    }
    var tocSections = cheerio.load('');
    var name,
        header,
        $,
        markdown;
    if (properties["name"]) {
        name = properties["name"];
        $ = cheerio.load(buildHeader(name, depth));
        markdown = markdownHeaders[depth] + name + '\n\n';
        header = $(allHtmlHeaders).first();
    } else if (properties["file"]) {
        var sectionFile = path.join(options['docDir'], properties["file"]);
        markdown = fs.readFileSync(sectionFile, {"encoding": "utf-8"});
        if (options['normalizeHeaders']) {
            markdown = adjustMarkdownHeaders(markdown, depth);
        }
        var markdownHtml = converter.makeHtml(markdown);
        $ = cheerio.load('');
        $.root().append(markdownHtml);
        header = $(allHtmlHeaders).first();
        name = header.text();
    } else  {
        grunt.fail.warn("A toc list contains an element that is neither a name nor a file");
    }
    var anchorId = properties["referenceId"];
    if (!anchorId) {
        anchorId = buildId(name);
    }
    header.attr('id', anchorId);
    appendTocElement(tocSections, buildSimpleTocLink(name, anchorId));

    if (properties["toc"]) {
        properties["toc"].forEach(function(section) {
            var sectionContent = buildAndLinkHtml(options, section, depth + 1);

            appendTocElement(tocSections, sectionContent["toc"]);
            $.root().append(sectionContent['main']);
            markdown = markdown + '\n\n' + sectionContent['markdown'];
        });
    }

    var toc = cheerio.load('');
    var tocContents = cheerio.load('<ul>');
    tocContents('ul').addClass('docmd-toc-list')
        .append(tocSections.html());
    toc.root().append(tocContents.html());

    return {
        "main": $.root().html(),
        "toc": toc.html(),
        "markdown": markdown
    };
};

var buildGuideLinks = function(guides) {
    var $ = cheerio.load('<div id="all-guides-list" class="list-group">');
    guides.forEach(function(guide) {
        var element = cheerio.load('<a>');
        element('a')
            .addClass("all-guides-list-item list-group-item")
            .attr('href', guide.link + '.html')
            .text(guide.text);
        $('div').append(element.root().html())
    });
    return $.root().html();
};

var highlightCurrentGuide = function(guideLinksHtml, guideLink) {
    var $ = cheerio.load(guideLinksHtml);
    $('a').each(function() {
        var link = $(this);
        if (link.attr('href') === guideLink) {
            link.addClass('docmd-selected-guide');
        }
    });
    return $.root().html();
};

var applyIconStyle = function(fullHtml, properties) {
    var $ = cheerio.load(fullHtml);
    var icon = $('#main-icon');
    for (var style in properties) {
        if (properties.hasOwnProperty(style)) {
            icon.css(style, properties[style]);
        }
    }
    return $.root().html();
};

var buildId = function(name) {
    return name.replace(idRegex, '');
};

module.exports = {
    buildAndLinkHtml: buildAndLinkHtml,
    buildGuideLinks: buildGuideLinks,
    highlightCurrentGuide: highlightCurrentGuide,
    applyIconStyle: applyIconStyle,
    buildId: buildId
};
