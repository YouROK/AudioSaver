var preferences = require('sdk/simple-prefs').prefs;

exports.get = get;
exports.set = set;
exports.getPath = getPath;

function get(name){
  return preferences[name];
}

function set(name,val){
  preferences[name] = val;
}

function getPath(){
  return preferences['TargetDir'];
}
