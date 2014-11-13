
require('./js/util');

var jade = require('jade'),
    fs = require('fs'),
    path = require('path'),
    rmrf = require('rimraf'),
    mkdirp = require('mkdirp'),
    ncp = require('ncp').ncp,
    pagedown = require('pagedown'),
    yaml = require('js-yaml'),
    cheerio = require('cheerio'),
    config = require('./config');


//TODO read these from a config file
var contentDir = config["Docs Directory"];
var outputDirPath = config["Output Directory"];
var resourcesName = config["Resources Directory Name"];
var webDir = config["Web Directory"];


var converter = new pagedown.Converter();

var idRegex = /[^\w]/g;

var processDirectory = function(/*String*/ fullPath, /*Array*/ files) {
    var content = {};
    files.forEach(function(file) {
        content[file] = grabMarkdown(fullPath, file);
    });
    var properties = content["properties.yml"];
    var content = buildAndLinkHtml(content);

    applyTemplates({
        "content": content,
        "title": properties["name"]
    });

    ncp(path.join(contentDir, resourcesName), path.join(outputDirPath, resourcesName), function(err) {

    });
};

var grabMarkdown = function(/*String*/ basePath, /*String*/ fileName) {
    var fullPath = path.join(basePath, fileName);

    if (fs.statSync(fullPath).isDirectory()) {
        var subContent = {};
        fs.readdirSync(fullPath).forEach(function(subFile) {
            subContent[subFile] = grabMarkdown(fullPath, subFile);
        });
        return subContent;
    } else {
        if (fileName === "properties.yml") {
            return yaml.safeLoad(fs.readFileSync(fullPath));
        } else {
            return '' + fs.readFileSync(fullPath, {"encoding": "utf-8"});
        }
    }
};

var buildAndLinkHtml = function(content) {
    var order = content["properties.yml"]["toc"];
    var html = '';

    //TODO figure out how we're constructing table of contents. A template should probably be used.
    var toc = '';

    order.forEach(function(section) {
        var sectionHtml;
        if (typeof content[section] === "string") {
            sectionHtml = cheerio.load(converter.makeHtml(content[section]));
            var sectionHeader = sectionHtml('h1, h2, h3, h4, h5, h6');
            var anchorId = sectionHeader.text().replace(idRegex, '');
            sectionHeader.attr('id', anchorId);
            html = html + sectionHtml.html();
        } else {
            if (content[section]["base.md"]) {
                html = html + converter.makeHtml(content[section]["base.md"]);
            }

            //this feels clunky. there's probably a better way to handle this
            var subContent = buildAndLinkHtml(content[section]);
            html = html + subContent["main"];
            toc = toc + subContent["toc"];
        }
    }, '');
    return {
        "main": html,
        "toc": toc
    };
};


var applyTemplates = function(content) {
    var compiledTemplateName = "index.html";
    var render = jade.compileFile(path.join(webDir, "index.jade"));

    var output = render(content);
    fs.writeFile(path.join(outputDirPath, compiledTemplateName), output);
};

rmrf(outputDirPath, function() {
    mkdirp(outputDirPath, null, function() {

        var contentDirs = fs.readdirSync(contentDir);
        contentDirs.forEach(function(/*string*/ directoryName) {
            if (directoryName !== resourcesName) {
                var docDir = path.join(contentDir, directoryName);
                //TODO the callback needs to handle errors
                fs.readdir(docDir, function(err, files) { processDirectory(docDir, files);} );
            }
        });

    });


});


