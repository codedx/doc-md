


module.exports = function(grunt) {


    var jade = require('jade'),
        path = require('path'),
        fs = require('fs'),
        yaml = require('js-yaml'),
        pagedown = require('pagedown'),
        cheerio = require('cheerio');

    var converter = new pagedown.Converter();

    var idRegex = /[^\w]/g;

    var parseDocumentStructure = function(/*String*/ basePath, /*String*/ fileName, /*numeric*/ depth) {
        var fullPath = path.join(basePath, fileName);

        if (fs.statSync(fullPath).isDirectory()) {
            var subContent = {};
            fs.readdirSync(fullPath).forEach(function(subFile) {
                subContent[subFile] = parseDocumentStructure(fullPath, subFile, depth + 1);
            });
            if (!subContent["properties.yml"]) {
                grunt.fail.warn(fullPath + "did not define a properties file");
            }
            return subContent;
        } else {
            if (fileName === "properties.yml") {
                var properties = yaml.safeLoad(fs.readFileSync(fullPath), {
                    onWarning: function() {
                        grunt.fail.warn("Could not propertly parse " + fullPath + "as a yaml file");
                    }
                });
                properties['depth'] = depth;
                if (!properties || !properties['toc']) {
                    console.warn(fullPath + ' does not define a toc. None of its sections will be included.');
                } else {
                    properties['toc'].forEach(function(section) {
                        if (!section.file) {
                            grunt.fail.warn(fullPath + " has an invalid toc value");
                        }
                    })
                }
                return properties;
            } else {
                return '' + fullPath;
            }
        }
    };

    var buildAndLinkHtml = function(content) {
        var order = content["properties.yml"]["toc"] || [];
        var depth = content["properties.yml"]["depth"] + 1;
        if (depth > 4) {
            depth = 4;
        }

        var name = content["properties.yml"]["name"];
        var anchorId = name.replace(idRegex, '');
        var html = buildHeader(name, anchorId, depth);

        var tocSections = cheerio.load('');

        order.forEach(function(section) {
            var sectionHtml;
            var markdown;
            var sectionFile = content[section.file];

            if (typeof  sectionFile === "string") {
                var name = section.name;
                if (!name) {
                    grunt.fail.warn('No name was provided for ' + sectionFile);
                }
                var anchorId = name.replace(idRegex, '');
                markdown = fs.readFileSync(sectionFile, {"encoding": "utf-8"});
                var markdownHtml = converter.makeHtml(markdown);
                if (cheerio.load(markdownHtml)('h1, h2, h3, h4, h5').length > 0) {
                    console.warn(sectionFile + " makes use of markdown headers. " +
                    "These may visually clash with headers inserted by doc-md");
                }
                sectionHtml = buildHeader(name, anchorId, depth + 1) + markdownHtml;
                appendTocElement(tocSections, buildSimpleTocLink(name, anchorId));
            } else {

                if (sectionFile["base.md"]) {
                    markdown = fs.readFileSync(sectionFile["base.md"], {"encoding": "utf-8"});
                    sectionHtml = converter.makeHtml(markdown);
                }

                //this feels clunky. there's probably a better way to handle this
                var subContent = buildAndLinkHtml(sectionFile);
                sectionHtml = sectionHtml + subContent["main"];
                appendTocElement(tocSections, subContent["toc"]);
            }

            html = html + sectionHtml;
        });

        var toc = cheerio.load('<li></li>');
        appendTocElement(toc, buildSimpleTocLink(name, anchorId));
        var tocContents = cheerio.load('<ul>');
        tocContents('ul').addClass('docmd-toc-list')
            .append(tocSections.html());
        toc.root().append(tocContents.html());


        return {
            "main": html,
            "toc": toc.html()
        };
    };

    var buildHeader = function(name, id, depth) {
        var header = '<h' + (depth) + ' id="' + id + '">' + name + '</h' + depth + '>';
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


    var processMarkdown = function(options, markdownDir) {
        var docDir = path.join(options.docs, markdownDir);
        var files = fs.readdirSync(docDir);
        var content = {};
        files.forEach(function (file) {
            content[file] = parseDocumentStructure(docDir, file, 0);
        });
        var properties = content["properties.yml"];
        var htmlContent = buildAndLinkHtml(content);
        var compiledTemplateName = markdownDir + ".html";
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
            resourcesName: "resources",
            jsDir: "./js",
            cssDir: "./css"
        });
        var dataDir = this.data.directory;
        var base = grunt.option('base') || process.cwd();

        grunt.registerTask('docmd_chdir', function() {
            process.chdir(base);
        });

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
        grunt.loadNpmTasks('grunt-contrib-concat');
        grunt.loadNpmTasks('grunt-contrib-copy');
        grunt.loadNpmTasks('grunt-bower-task');

        //setup directories and libraries
        grunt.config('clean', {
            options: {
                force: true
            },
            docmd_lib: [
                path.join(options.webDir, "lib")
            ],
            docmd_output: [
                options.output
            ]
        });
        grunt.task.run('clean:docmd_lib', 'clean:docmd_output');
        grunt.registerTask('docmd_setup', function() {
            grunt.file.mkdir(options.output);
            grunt.file.mkdir(path.join(options.webDir, 'lib'));
        });
        grunt.task.run('docmd_setup');

        process.chdir(path.join(__dirname, '../'));
        grunt.config('bower', {
            'options': {
                copy: false
            },
            'install': {}
        });
        grunt.task.run('bower');
        grunt.task.run('docmd_chdir');

        grunt.config('concat', {
            'docmd_user_js': {
                options: {
                    separator: ';\n'
                },
                src: [
                    path.join(options.jsDir, '*.js')
                ],
                dest: path.join(options.webDir, 'lib', 'user.js')
            },
            'docmd_user_css': {
                src: [
                    path.join(options.cssDir, '*.css')
                ],
                dest: path.join(options.webDir, 'lib', 'user.css')
            }
        });
        grunt.task.run('concat:docmd_user_js', 'concat:docmd_user_css');


        grunt.registerTask('docmd_markdown', function() {
            processMarkdown(options, dataDir);
        });
        grunt.task.run('docmd_markdown');

        grunt.config('copy', {
            docmd_resources: {
                files: [
                    {
                        expand: true,
                        cwd: path.join(options.docs, options.resourcesName),
                        src: ["**/*"],
                        dest: path.join(options.output, options.resourcesName)
                    }
                ]
            },
            docmd_bower: {
                files: [
                    {
                        expand: true,
                        cwd: path.join(__dirname, "../bower_components"),
                        src: ["*/dist/**/*"],
                        dest: path.join(options.output, 'lib')
                    }
                ]
            },
            docmd_user_lib: {
                files: [
                    {
                        expand: true,
                        cwd: path.join(options.webDir, 'lib'),
                        src: ["*"],
                        dest: path.join(options.output, 'lib')
                    }
                ]
            }

        });
        grunt.task.run('copy:docmd_resources', 'copy:docmd_bower', 'copy:docmd_user_lib');
    });


    /**
     * Prints out the keys of an object. This is only for testing, and can
     * probably be removed
     * @param object the object whose keys should be printed
     */
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


