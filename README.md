# LivingCSS

Parse comments in your CSS to generate a living style guide. Uses [Handlebars](http://handlebarsjs.com/) templates and [Prism](http://prismjs.com/) syntax highlighter to generate the style guide.

## Installation

`$ npm install --save livingcss`

## Usage

```js
var livingcss = require('livingcss');

// options is optional
livingcss('input.css', 'styleguide.html', options);
```

## How it works

LivingCSS parses JSDoc-like comments for documentation in order to create a living style guide. A documentation comment follows the following format.

```css
/**
 * A shot description or lengthy explanation about the style. Will be parsed
 * using `markdown`.
 *
 * @section Section Name
 * @example
 * <div class="my-awesome-class">Example</div>
 */
```

The comments are parsed and then saved into an object which is passed to a Handlebars template to create the HTML file.

What makes LivingCSS different than other tag-like comment parsers is that it does not try to impose a strict tag rule set. Instead, it defines a few basic tags for you to use, but any tag can be used and will be parsed so long as it follows the `@tag {type} name - description` format (where type, name, and description are all optional).

## Defined tags

* `@section` - Add a new section to the style guide. The `@section` tag can define the name of the section, otherwise the first line of the comment description will be used as the section name.
    
    ```css
    /**
     * My Section
     *
     * A description of the section and how to use it.
     *
     * @section
     */

    /**
     * A description of the section and how to use it.
     *
     * @section My Section
     */
    ```

* `@sectionof` - Add a section as a child of another section. There is no limit to the number of nested sections.

    ```css
    /**
     * A description of the parent section.
     *
     * @section Parent Section
     */

    /**
     * A description of the child section.
     *
     * @section Child Section
     * @sectionof Parent Section
     */
    ```

* `@example` - Provide an example that will be displayed in the style guide. Can provide a type to change the language for code highlighting, and you can also provide a filename to be used as the example.

    ```css
    /**
     * A simple example.
     *
     * @section Example
     * @example
     * <div>foo</div>
     */

    /**
     * An example with a language type.
     *
     * @section Example
     * @example {javascript}
     * console.log('foo');
     */

    /**
     * An example from a file
     *
     * @section Example
     * @example
     * path/to/file.html
     */
    ```

* `@code` - Same as `@example`, but can be used to override the code output to be different than the example output. Useful if you need to provide extra context for the example that does not need to be shown in the code.

    ```css
    /**
     * Different example output than code output
     *
     * @section Code Example
     * @example
     * <div class="container">
     *   <div class="my-awesome-class">Example</div>
     * </div>
     *
     * @code
     * <div class="my-awesome-class">Example</div>
     */
    ```

* `@hideCode` - Use this tag to hide the code output.

    ```css
    /**
     * You can only see the example, the code is hidden.
     *
     * @section hideCode Example
     * @example
     * <div class="container">
     *   <div class="my-awesome-class">Example</div>
     * </div>
     * @hideCode
     */
    ```

## Options

* `handlebars` - If the style guide should use Handlebars. Set to false to use a different templating engine, then use the `preprocess` function to get the JSON context object. Defaults to `true`.
* `loadcss` - If the style guide should load the css files that were used to generate it. Defaults to `true`.
* `minify` - If the generated HTML should be minified. Defaults to `true`.
* `partials` - List of glob file paths to Handlebars partials to use in the template. Each partial will be registered with Handlebars using the name of the file.
* `preprocess` - Function that will be executed right before Handlebars is called with the context object. Will be passed the context object, the Handlebars object, and the options passed to `livingcss` as parameters. Use this function to modify the context object or register Handlebars helpers or decorators.
* `sectionOrder` - List of root section names (a section without a parent) in the order they should be sorted. Any root section not listed will be added to the end in the order encountered.
* `tags` - Object of custom tag names to callback functions that are called when the tag is encountered. The tag, the parsed comment, the block object, the list of sections, and the file is passed on the `this` object to the callback function.
* `template` - Path to the Handlebars template to use for generating the HTML. Defaults to the LivingCSS template `template/template.hbs'.`

## Custom Tags

You can create your own tags to modify how the documentation is generated. Because most tags are automatically parsed for you, you will not need to create custom tags very often. To create a custom tag, use the `options.tags` option. 

A tag is defined as the tag name and a callback function that will be called when the tag is encountered. The current tag, the parsed comment, the block object, the list of sections, and the current file is passed on the `this` object to the callback function.

The comment is parsed using [comment-parser](https://github.com/yavorskiy/comment-parser), so the current tag and the parsed comment will follow the output returned by it. The block object is the current state of the comment, including the comments description, all parsed tag associated with the comment, and any other modifications done by other tags. The block object is also the object saved to the `sections` array when a `section` tag is used.

For example, if you wanted to generate a color palette for your style guide, you could create a custom tag to add the color to a section.

```css
/**
 * @color {#F00} Brand Red - Section Name
 */
```

```js
livingcss('input.css', 'styleguide.html', {
  tags: {
    color: function() {
      for (var i = 0; i < this.sections.length; i++) {
        var section = this.sections[i];

        // found the corresponding section
        if (section.name === this.tag.description) {
          section.colors = section.colors || [];
          section.colors.push({
            name: this.comment.name,
            value: this.tag.type
          });
        }
      }
    }
  }
});
```

## Context Object

Use the `options.preprocess` option to modify or use the context object before it is passed to Handlebars. The `preprocess` function will be passed the context object, the Handlebars object, and the options passed to `livingcss` as parameters.

```js
livingcss('input.css', 'styleguide.html', {
  preprocess: function(context, handlebars, options) {
    context.title = 'My Awesome Style Guide';
  }
});
```

* `allSections` - List of all sections, not sorted and not nested.
* `scripts` - List of all JS files to load in the style guide.
* `sections` - List of all root sections (sections without a parent) and their children.
* `stylesheets` - List of all CSS files to load in the style guide. If the `options.loadcss` option is set, this list will contain all css files used to generate the style guide.
* `title` - Title of the style guide.