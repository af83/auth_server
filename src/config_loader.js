

var config;

exports.get_config = function(alternative_config_path) {
  if (!config) {
    var configpath = alternative_config_path || './config';
    // The Third argument, if provided, is an alternative config file    
    if(!alternative_config_path && process.argv.length > 2) {
      configpath = process.cwd() + '/' + process.argv[2];
    }
    config = require(configpath);
  }
  return config;  
};

