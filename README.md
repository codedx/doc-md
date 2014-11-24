Doc-MD
======

Doc-MD is a grunt.js plugin designed to take multiple help or guide files, written in markdown, and compile them into a single html help document, complete with a Table of Contents that links the sections of the document. While it would certainly be possible to build a single markdown document, as systems grow in complexity (and their documentation grows along with them), it's often easier to maintain up to date documentation if it's broken up by section. However, no one likes clicking through multiple pages of user guides (especially if a page only has a couple paragraphs). Doc-MD solves that problem.

Installation
------------

If you don't already have one, set up a "package.json" file in your project directory. You can use npm do this if necessary by running `npm init` and following the prompts, or by using an editor to create it.

This plugin requires Grunt 0.4 or greater. If you don't already have it, from in your project directory run

`npm install grunt --save-dev`

This will install grunt and update the `devDependencies` property in your package.json file.
Then run 

`npm install ${path-to-docmd} --save-dev` 

where `${path-to-docmd}` is the path to a location where you've cloned doc-md. (At some point once it's more stable, we'll publish doc-md to the npm registry, and you'll be able to install it more easily.)

Configuration
-------------

Add to your `Gruntfile.js` (first creating the file in your project directory if necessary):

`grunt.loadTasks('${path to docmd}/tasks');`

again where `${path-to-docmd}` is the path to the location where you've cloned doc-md.

You also need to configure the `docs` and `output` options to point to the location in your filesystem where you've stored your markdown documents (see the [Markdown Structure](#markdown-structure) section for details) and to where you want the output from doc-md to go, respectively. For each html guide you want, you should specify a doc-md task, with the single property `directory`, specifying the path to the guide in question, relative to the markdown directory specified by the `docs` option.

### Config Example
```
grunt.initConfig({
  doc_md: {
    options: {
      docs: "../../documents",
      output: "../docs-build"
    },
    user_guide: {
      directory: "user_guide"
    }
  }
});
```

Before running grunt the first time, you need to run `npm install` from the doc-md directory, to grab the necessary node dependencies. 

Then you can simply define a grunt task that calls the doc-md plugin. For example:

`grunt.registerTask('default', ['doc_md']);`

Run
---

To run doc-md, run `grunt ${task}`, where ${task} is the name of the task specified above, from the command line. If you've set up and configured everything correctly, your output should appear in the directory specified in the `output` option.

Markdown Structure
------------------

The markdown-content directory (or whatever you choose to call it) needs to follow the convention expected by Doc-MD. In general, that convention is as follows:
  - markdown-content
    - resources
    - guide1
      - properties.yml
      - section1.md
      - section2.md
      - section3
        - properties.yml
        - subsection3.1.md
        - subsection3.2.md
      - section4
        - properties.yml
        - base.md
        - subsection4.1.md
      - section5.md

There are several rules to note: 

First, it's a nested structure, and that structure will be followed when building the Table of Contents for the html help document. For each direct subdirectory of the markdown-content directory, a separate html document will be generated. The resources directory is where all images, etc. should be placed. This will be copied as-is into the build directory.

Second, each directory has its own properties.yml file. This file currently defines the human-readable name for the section (meaning users aren't limited to the character set allowed by the filesystem), as well as the Table of Contents for that directory. While it would be nice if this was unnecessary, we decided it was the best way for the author of the content to define the order in which the markdown files should appear.

Third, for sections (such as section4 in the example above) where there's a need for both subsections as well as content that should appear before any subsections, but not as a part of any of them, you can define a base.md file. In directories with such a file, the content of the base.md file will appear before any of the subsections at a higher header level.

Users should also note that the numbers in the example above are for purposes of illustration only--they're not necessary.

###Sample properties.yml
```
name: "Sample Guide"
description: "Description of sample guide"
toc:
  -
    file: section1.md
    name: First Section
  -
    file: section2.md
    name: Section Two
  -
    file: section3
  -
    file: section4
  -
    file: section5.md
    name: The Last Section
```
