var fs = require('fs')
  , path = require('path')

  , Futures = require('futures')
  , glob = require("glob")
  , mustache = require('mustache')
  ;


// We are stored the mustache templates:
var MS_TEMPLATES_DIR = path.normalize(__dirname + '/../ms_templates');
var TEMPLATES = null;

/**
 * Calls callback with a string containing a declaration of mustache templates.
 *
 * Example:
 * '{template1: "...", template2: "...", ...}'.
 *
 */
var generate_templates = function(templateFiles, callback, fallback) {
  var templates = {};
  var join = Futures.join();
  templateFiles.forEach(function(fpath) {
    join.add(function() {
      var f = Futures.future();
      fs.readFile(fpath, 'utf8', function(err, data) {
        if(err) return f.deliver(err);
        var pos1 = MS_TEMPLATES_DIR.length + 1;
        var pos2 = fpath.lastIndexOf('.ms');
        var template_name = fpath.slice(pos1, pos2);
        templates[template_name] = data;
        f.deliver();
      });
      return f;
    }());
  });
  join.when(function() {
    callback(templates);
  });
};

/**
 * Generate templates
 */
exports.generate_templates = funCtion(callback, fallback) {
  var templateFiles = glob.globSync(path.join(MS_TEMPLATES_DIR, "*.ms"));
  var set_data = function(templates_str) {
    TEMPLATES = templates_str;
  };
  generate_templates(templateFiles, function(templates_str) {
    set_data(templates_str);
    callback();
  }, fallback);
};

/**
 * Renders the template with given data and returns result.
 */
exports.render = function(template_name, data) {
  var template = TEMPLATES[template_name];
  if(!template) throw new Error('Unknown template name: ' + template_name);
  return mustache.to_html(template, data || {}, TEMPLATES);
}
