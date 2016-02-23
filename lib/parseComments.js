var parser = require('comment-parser');
var PARSERS = parser.PARSERS;
var nameRegex = /^\s*(\S+)\s+[-–—]\s+/;
var trimNewlineRegex = /^[\n\r]+|[\n\r]+$/g;

/**
 * Parse file comments.
 *
 * @param {string} data - Contents of the file.
 * @param {string} file - Name of the file.
 * @param {object} [tags={}] - Tags and their callback function.
 * @param {object[]} [sections=[]] - List of sections.
 * @param {function} [callback] - Callback to execute after a comment is parsed.
 */
function parseComments(data, file, tags, sections, callback) {
  var args = Array.prototype.slice.call(arguments);

  if (typeof args[args.length - 1] === 'function') {
    callback = args.pop();
  }

  // require parameters
  data = args.shift();
  file = args.shift();

  // options parameters
  if (Array.isArray(args[0])) {
    sections = args.shift();
  }
  else if (args[0]) {
    tags = args.shift();
  }

  tags = tags || {};
  sections = sections || args[0] || [];

  var comments = parser(data, {
    trim: false,
    parsers: [
      PARSERS.parse_tag,
      PARSERS.parse_type,
      function parse_name(str, data) {
        if (data.errors && data.errors.length) { return null; }

        // only parse the name if there is a hyphen between it and the description.
        // this way we can skip parsing the name and use the rest of the line as
        // the description for the majority of comments
        // @see https://github.com/yavorskiy/comment-parser/issues/19
        var match = str.match(nameRegex);

        if (match) {
          // parsers requires that whitespace precedes the text
          return {source: match[0].trimRight(), data: {name: match[1]}};
        }

        return null;
      },
      // remove any trailing and preceding newline characters. Modified from
      // PARSERS.parse_description.
      // @see https://github.com/yavorskiy/comment-parser/blob/master/parser.js
      function parse_description(str, data) {
        if (data.errors && data.errors.length) { return null; }

        var result = str.match(/^\s+([^$]+)?/);

        if (result) {
          return {
            source: result[0],
            data: {description: result[1] === undefined ? '' : result[1].replace(trimNewlineRegex, '')}
          };
        }

        return null;
      }
    ]
  });

  // parse comments
  comments.forEach(function(comment) {
    var block = {};

    // parse tags
    comment.tags.forEach(function(tag) {
      // tag is defined
      if (tags[tag.tag]) {
        tags[tag.tag].call({
          tag: tag,
          comment: comment,
          block: block,
          sections: sections,
          file: file
        });
      }
      // any tag that is not defined will just be parsed and added to the block as
      // a property
      else {
        var entry;

        // if the tag has no description assume it's a boolean flag and default to
        // true
        if (!tag.name && !tag.type) {
          entry = tag.description || true;
        }
        else {
          entry = {
            description: tag.description || true,
          };

          if (tag.name) {
            entry.name = tag.name;
          }
          if (tag.type) {
            entry.type = tag.type;
          }
        }

        // repeated tags will be added as an array
        if (block[tag.tag]) {

          // if an entry already exists for this tag, turn it into an array
          if (!Array.isArray(block[tag.tag])) {
            block[tag.tag] = [ block[tag.tag] ];
          }

          block[tag.tag].push(entry);
        }
        // first entry is always just the tag
        else {
          block[tag.tag] = entry;
        }
      }
    });

    // set block defaults
    if (block.example && !block.code) {
      block.code = block.example;
    }

    if (callback) {
      callback(block);
    }

  });
}

module.exports = parseComments;