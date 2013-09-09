var { Ci,Cc } = require("chrome");
var prefs = require("./prefs");
var system = require("sdk/system");

//exports functions
exports.open = open;
exports.write = write;
exports.close = close;
exports.isOpen = isOpen;
exports.copy = copy;

var stream = null;

function isOpen()
{
	return stream != null;
}

function setSeparator(fileName)
{
    if(system.platform.toLowerCase() == "winnt")
    {
        var tmp = fileName;
        tmp.split("/").join("\\");
        return tmp;
    }
    return fileName;
}

function open(filename)
{
    console.log(setSeparator(filename));
	var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
	file.initWithPath(setSeparator(filename));
	if(file.exists() == false)
	{
    	file.create( Ci.nsIFile.NORMAL_FILE_TYPE, 420);
	}
	var foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
	foStream.init(file, 0x02 | 0x08 | 0x20, 0666, 0); 
	stream = foStream;
}

function write(data,count)
{
    try
    {
    	if(stream)
    	{
			stream.write(data, count);
		}
	}
	catch(err)
    {
        console.log(err);
        return;
    }
}

function close()
{
	if(stream)
	{
		stream.close();
		stream = null;
	}
}

/*
    fileinfo[0] = uri
    fileinfo[1] = mime
    fileinfo[2] = temp file
*/
function copy(fileInfo)
{
    if(fileInfo.length != 3)
        return;

    close();

    var uri = fileInfo[0];
    var contentType = fileInfo[1];
    var tmpFile = fileInfo[2];
    var RootPath = prefs.getRootPath();
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    file.initWithPath(setSeparator(tmpFile));
    if(file.exists())
    {
        try
        {
            var targetDir = ""+RootPath+"/"+getDir(uri)+"/";
            var destDir = mkdir(targetDir);
            file.copyTo(destDir,md5(tmpFile)+getExt(contentType));
            console.log("file saved");
        }catch(err)
        {
            console.log(err);
        }
    }
}

function md5(fname)
{
    var path = fname;
    var f = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    f.initWithPath(setSeparator(path));
    var istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
    istream.init(f, 0x01, 0444, 0);
    var ch = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
    ch.init(ch.MD5);
    const PR_UINT32_MAX = 0xffffffff;
    ch.updateFromStream(istream, PR_UINT32_MAX);
    var hash = ch.finish(false);

    function toHexString(charCode)
    {
      return ("0" + charCode.toString(16)).slice(-2);
    }
    return [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
}

function getDir(uri)
{
    var regxp = new RegExp("https?://(?:.+\\.)(.+\\..+?)/", "i");
    if(regxp.test(uri))
    {
        return regxp.exec(uri)[1];
    }
    return "";
}

function getExt(cntType)
{
    switch (cntType.toLowerCase())
    {
        case "audio/basic": return ".wav";
        case "audio/mp4": return ".mp4";
        case "audio/mpeg": return ".mp3";
        case "audio/ogg": return ".ogg";
        case "audio/vorbis": return ".ogg";
        case "audio/x-ms-wma": return ".wma";
        case "audio/x-ms-wax": return ".wma";
        case "audio/vnd.rn-realaudio": return ".ra";
        case "audio/vnd.wave": return ".wav";
        case "audio/webm": return ".mkv";
        default:
        {
            var regxp = new RegExp("audio/(.+)", "ig");
            if(regxp.test(cntType))
                return regxp.exec(cntType)[1];
        }
        return "";
    }

}

function mkdir(dir)
{
    var file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
    filePath = dir;
    file.initWithPath(setSeparator(filePath));
    if(file.exists() == false ) 
    try
    {
        file.create(Ci.nsIFile.DIRECTORY_TYPE, 0775);
    }catch(err)
    {
        //console.log(err);
    }
    return file;
}