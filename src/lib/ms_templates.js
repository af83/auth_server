var fs = require('fs')
  , path = require('path')

  , CLB = require('nodetk/orchestration/callbacks')
  , tkfs = require('nodetk/fs')
  , mustache = require('mustache')
  ;


// We are stored the mustache templates:
var MS_TEMPLATES_DIR = path.normalize(__dirname + '/../static/js/ms_templates');
var TEMPLATES = null;


var generate_templates = function(fpaths, callback, fallback) {
  /* Calls callback with a string containing a declaration of mustache templates.
   *
   * Example:
   * '{template1: "...", template2: "...", ...}'.
   *
   */
  var templates = {};
  var waiter = CLB.get_waiter(fpaths.length, function() {
    //var res = JSON.stringify(templates);
    callback(templates);
  }, fallback);
  fpaths.forEach(function(fpath) {
    fs.readFile(fpath, 'utf8', function(err, data) {
      if(err) return waiter.fall(err);
      var pos1 = MS_TEMPLATES_DIR.length + 1;
      var pos2 = fpath.lastIndexOf('.ms');
      var template_name = fpath.slice(pos1, pos2);
      templates[template_name] = data;
      waiter();
    });
  });
};


exports.generate_refresh_templates = function(data, callback, fallback) {
  /* Generate templates + update then whenever they change.
   */
  tkfs.getFilesDirs(MS_TEMPLATES_DIR, function(fpaths) {
    fpaths = fpaths.filter(function(fpath) {return fpath.match(/\.ms$/)});

    var set_data = function(templates_str) {
      data.ms_templates = templates_str;
      TEMPLATES = templates_str;
    };
    generate_templates(fpaths, function(templates_str) {
      set_data(templates_str);
      callback();
    }, fallback);
    fpaths.forEach(function(fpath) {
      fs.watchFile(fpath, set_data);
    });
  });
};


exports.render = function(template_name, data) {
  /* Renders the template with given data and returns result.
   */
  var template = TEMPLATES[template_name];
  if(!template) throw new Error('Unknown template name: ' + template_name);
  return mustache.to_html(template, data, TEMPLATES);
}

