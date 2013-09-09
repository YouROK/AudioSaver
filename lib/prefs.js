var pref = require("sdk/preferences/service");

exports.get = get;
exports.set = set;
exports.getRootPath = getRootPath;

var defprefix = "extensions.AudioSaver.";

function get(name,defval)
{
	return pref.get(defprefix+name, defval);
}

function set(name,val)
{
	pref.set(defprefix+name, val);
}

function getRootPath()
{
	return require('sdk/simple-prefs').prefs['RootPath'];
}


// var RootPath = require('sdk/simple-prefs').prefs['RootPath'];
// function onPrefChange(prefName) 
// {
    // RootPath = require('sdk/simple-prefs').prefs['RootPath'];
// }
// require("sdk/simple-prefs").on("RootPath", onPrefChange);