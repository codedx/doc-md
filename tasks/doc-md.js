


module.exports = function(grunt) {


    var jade = require('jade'),
        path = require('path'),
        fs = require('fs'),
        yaml = require('js-yaml'),
        pagedown = require('pagedown'),
        cheerio = require('cheerio');

    var converter = new pagedown.Converter();

    var idRegex = /[^\w]/g;

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


    var processMarkdown = function(options, markdownDir) {
        var docDir = path.join(options.docs, markdownDir);
        var files = fs.readdirSync(docDir);
        var content = {};
        files.forEach(function (file) {
            content[file] = grabMarkdown(docDir, file);
        });
        var properties = content["properties.yml"];
        var htmlContent = buildAndLinkHtml(content);
        var compiledTemplateName = "index.html";
        var render = jade.compileFile(path.join(options.webDir, "index.jade"));
        var output = render({
            "content": htmlContent,
            "title": properties["name"]
        });
        grunt.file.write(path.join(options.output, compiledTemplateName), output);
    };

    grunt.registerMultiTask('doc_md', function() {
        var options = this.options({
            webDir: path.join(__dirname, "../webpage"),
            resourcesName: "resources"
        });
        var dataDir = this.data.directory;

        if (!options.docs) {
            grunt.warn("docs directory not specified");
        }
        if (!options.output) {
            grunt.warn("output directory not specified");
        }
        if (!dataDir) {
            grunt.warn("markdown directory not specified");
        }

        grunt.loadNpmTasks('grunt-contrib-clean');
        grunt.loadNpmTasks('grunt-bower-concat');
        grunt.loadNpmTasks('grunt-contrib-copy');

        //setup directories and libraries
        grunt.config('clean', {
            options: {
                force: true
            },
            docmd_lib: [
                path.join(options.webDir, "js", "lib")
            ],
            docmd_output: [
                options.output
            ]
        });
        grunt.task.run('clean:docmd_lib', 'clean:docmd_output');
        grunt.file.mkdir(options.output);
        grunt.file.mkdir(path.join(options.webDir, 'lib'));
        grunt.config('bower_concat', {
            docmd: {
                dest: path.join(options.webDir, 'lib', 'lib.js'),
                cssDest: path.join(options.webDir, 'lib', 'lib.css')
            }
        });
        grunt.task.run('bower_concat:docmd');

        //TODO convert the markdown and apply templates
        grunt.registerTask('docmd_markdown', function() {
            processMarkdown(options, dataDir);
        });
        grunt.task.run('docmd_markdown');

        grunt.config('copy', {
            docmd: {
                files: [
                    {
                        expand: true,
                        cwd: path.join(options.docs, options.resourcesName),
                        src: ["**/*"],
                        dest: path.join(options.output, options.resourcesName)
                    }
                ]
            }

        });
        grunt.task.run('copy:docmd');
    });



    var check = function(object) {
        if (! object) {
            grunt.log.writeln('object is falsey');
        }
        if (typeof object === 'string') {
            grunt.log.writeln(object);
        } else if (typeof object === 'object') {
            grunt.log.writeln("object's properties:");
            Object.keys(object).forEach(function(key) {grunt.log.writeln(key + ', ');});
        } else {
            grunt.log.writeln('type ' + typeof object);
        }
    };
};


