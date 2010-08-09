
var fs = require('fs')
  , path = require('path')

  , CLB = require('nodetk/orchestration/callbacks')
  , tkfs = require('nodetk/fs')
  ;


// We are stored the mustache templates:
MS_TEMPLATES_DIR = path.normalize(__dirname + '/../static/js/ms_templates');


exports.generate_templates = function(callback, fallback) {
  /* Calls callback with a string containing a declaration of mustache templates.
   *
   * Example:
   * '{template1: "...", template2: "...", ...}'.
   *
   */
  tkfs.getFilesDirs(MS_TEMPLATES_DIR, function(fpaths) {
    fpaths = fpaths.filter(function(fpath) {return fpath.match(/\.ms$/)});
    var templates = {};
    var waiter = CLB.get_waiter(fpaths.length, function() {
      var res = JSON.stringify(templates);
      callback(res);
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
  }, fallback);
};

