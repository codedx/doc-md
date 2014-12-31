Doc MD
======

Doc MD is a grunt.js plugin designed to take multiple help or guide files, written in markdown, and compile them into a single html help document, complete with a Table of Contents that links the sections of the document. While it would certainly be possible to build a single markdown document, as systems grow in complexity (and their documentation grows along with them), it's often easier to maintain up to date documentation if it's broken up by section. However, no one likes clicking through multiple pages of user guides (especially if a page only has a couple paragraphs). Doc MD solves that problem.

Installation
------------

If you don't already have one, set up a "package.json" file in your project directory. You can use npm do this if necessary by running `npm init` and following the prompts, or by using an editor to create it.

This plugin requires Grunt 0.4 or greater. If you don't already have it, from in your project directory run

`npm install grunt --save-dev`

This will install grunt and update the `devDependencies` property in your package.json file.
Then run 

`npm install ${path-to-docmd} --save-dev` 

where `${path-to-docmd}` is the path to a location where you've cloned Doc MD. (At some point once it's more stable, we'll publish Doc MD to the npm registry, and you'll be able to install it more easily.)

Configuration
-------------

Add to your `Gruntfile.js` (first creating the file in your project directory if necessary):

`grunt.loadTasks('${path to docmd}/tasks');`

again where `${path-to-docmd}` is the path to the location where you've cloned Doc MD.

You also need to configure the `docs` and `output` options to point to the location in your filesystem where you've stored your markdown documents (see the [Markdown Structure](#markdown-structure) section for details) and to where you want the output from Doc MD to go, respectively. For each html guide you want, you should specify a Doc MD task, with the single property `directory`, specifying the path to the guide in question, relative to the markdown directory specified by the `docs` option.

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

Before running grunt the first time, you need to run `npm install` from the Doc MD directory, to grab the necessary node dependencies. 

Then you can simply define a grunt task that calls the Doc MD plugin. For example:

`grunt.registerTask('default', ['doc_md']);`

Run
---

To run Doc MD `grunt ${task}`, where ${task} is the name of the task specified above, from the command line. If you've set up and configured everything correctly, your output should appear in the directory specified in the `output` option.

Markdown Structure
------------------

The markdown-content directory (or whatever you choose to call it) needs to contain a valid properties.yml file that defines the organization of the final output document and its Table of Contents. 
###properties.yml
####name
A properties.yml file should contain, at minimum a `name` property, defining the human-readable name for the guide (or section). If this property is used within a `toc` element, Doc MD will insert a header into the final html output as well as an element within the table of contents for that name.
####description
A description of the guide. This is currently unused.
####referenceId
In the case of a top-level element, this will be the name given to the guide file. For instances nested within the `toc` element, this will be used as the id of the section in question and can be used within the markup for purposes of linking within the overall document.
####icon
A set of properties which define the icon for the guide. This should at minimum include a `file` property which should contain the path to the icon's location within the resources directory. It can also include a `style` property, which can include any valid css property. The icon is placed within a standard <img> tag, so keep that in mind when using styles.
####toc
This defines the structure to be used when including content within the guide. It's an array of items. Each item needs to define, at minimum a `file` property (which should be the relative path to a markdown file) or a `name` property (which will appear as the name of the section, in both the table of contents and the main content). It can also optionally contain a `referenceId` or its own `toc` property.
####normalizeHeaders
By default, Doc MD will attempt to normalize the headers used throughout the final html document so the header levels are consistent with the structure defined in the table of contents. If `normalizeHeaders: false` appears in the properties file, Doc MD will not normalize headers.

###Example
Given the following directory structure:
  - markdown-content
    - resources
      - icon.png
    - guide1
      - properties.yml
      - section1.md
      - section2.md
      - section3
        - subsection3.1.md
        - subsection3.2.md
      - section4
        - section4.md
        - subsection4.1.md
      - section5.md

a properties.yml file could be
```
name: Guide One
icon:
  file: icon.png
  style:
    height: 32px
toc:
  -
    file: section1.md
  -
    file: section2.md
    referenceId: section_two
  -
    name: section3
    referenceId: section3
    toc:
      -
        file:subsection3.1.md
      -
        file:subsection3.2.md
  -
    file: section4.md
    toc:
      -
        file: subsection4.1.md
  -
    file: section5.md
```

Users should also note that the numbers in the example above are for purposes of illustration only--they're not necessary.

Custom Styles and JavaScript
----------------------------

Users can define custom stylesheets and JavaScript files to be included in the final document. The `cssDir` and `jsDir` properties in the grunt config can be set to the directory where stylesheets and scripts are located. The contents of these directories will be concatenated into a single "user.css" and "user.js" files and included in the final document. These properties default to "css" and "js", respectively.
