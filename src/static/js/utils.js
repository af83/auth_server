

var utils = {

  param: function(params) {
    /* Returns URL encoded param corresponding to given hash (params).
     *
     * Values undefined, null or empty list/string are ignored.
     */
    var res = [],
        attr;
    for(attr in params) {
      var val = params[attr];
      if(val === undefined || val === null || val === "") continue;
      if($.isArray(val)) {
        if(val.length == 0) continue;
        val = val.map(encodeURIComponent).join(',');
      }
      else val = encodeURIComponent(val);
      res.push(attr + '=' + val);
    }
    return res.join('&');
  }

};

