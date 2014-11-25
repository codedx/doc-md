

module.exports = function(grunt) {

    var jade = require('jade'),
        path = require('path'),
        fs = require('fs'),
        yaml = require('js-yaml'),
        buildAndLinkHtml = require('./lib/htmlUtils').buildAndLinkHtml;


    var processMarkdown = function(options, markdownDir) {
        var docDir = path.join(options.docs, markdownDir);
        var propsFile = path.join(docDir, "properties.yml");
        var properties = yaml.safeLoad(fs.readFileSync(propsFile), {
            onWarning: function() {
                grunt.fail.warn("Could not properly parse " + propsFile + "as a yaml file");
            }
        });
        var normalizeHeaders = properties['normalizeHeaders'] === undefined ? true : properties['normalizeHeaders'];
        var htmlContent = buildAndLinkHtml({
            'docDir': docDir,
            'normalizeHeaders': normalizeHeaders
        }, properties, 1);
        var compiledTemplateName = markdownDir + ".html";
        var render = jade.compileFile(path.join(options.webDir, "index.jade"));
        var output = render({
            "content": htmlContent,
            "title": properties["name"]
        });
        grunt.file.write(path.join(options.output, compiledTemplateName), output);
    };

    var copyResources = function (options) {
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
    };
    var setupDirectories = function (options) {
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
        grunt.registerTask('docmd_setup', function () {
            grunt.file.mkdir(options.output);
            grunt.file.mkdir(path.join(options.webDir, 'lib'));
        });
        grunt.task.run('docmd_setup');
    };
    var handleWebDependencies = function (options) {
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
    };

    grunt.registerTask('doc_md', function() {
        var options = this.options({
            webDir: path.join(__dirname, "../webpage"),
            resourcesName: "resources",
            jsDir: "./js",
            cssDir: "./css"
        });
        var dataDirs = options.directories;
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
        if (!dataDirs || dataDirs.length == 0) {
            grunt.warn("markdown directory not specified");
        }

        grunt.loadNpmTasks('grunt-contrib-clean');
        grunt.loadNpmTasks('grunt-bower-concat');
        grunt.loadNpmTasks('grunt-contrib-concat');
        grunt.loadNpmTasks('grunt-contrib-copy');
        grunt.loadNpmTasks('grunt-bower-task');


        setupDirectories(options);

        handleWebDependencies(options);

        grunt.registerTask('docmd_markdown', function() {
            dataDirs.forEach(function(directory) {
                processMarkdown(options, directory);
            });
        });
        grunt.task.run('docmd_markdown');

        copyResources(options);
    });
};


