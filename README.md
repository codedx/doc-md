Doc-MD
======

Doc-MD is a node.js script designed to take multiple help or guide files, written in markdown, and compile them into a single html help document, complete with a Table of Contents that links the sections of the document. While it would certainly be possible to build a single markdown document, as systems grow in complexity (and their documentation grows along with them), it's often easier to maintain up to date documentation if it's broken up by section. However, no one likes clicking through multiple pages of user guides (especially if a page only has a couple paragraphs). Doc-MD solves that problem.

Setup
-----

By default, the script will look for the markdown files in the "markdown-content" directory, which should be a sibling of the directory containing the script. Doc-MD prefers convention over configuration, so the structure of the markdown-content directory should follow the guidelines in the [Markdown Structure](#markdown-structure) section. 

Also by default, it will write its output to the "build" directory, which will be deleted (if necessary) and then created, also as a sibling of the Doc-MD directory.

Both of these defaults can be overridden by modifying the "config.json" file.

Before running Doc-MD the first time, you need to run `npm install` from the Doc-MD directory, to grab the necessary node dependencies.

Run
---

To run Doc-MD, run `node build` from the command line. If you've set up and configured everything correctly, your output should appear in the directory specified in "config.json".

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
