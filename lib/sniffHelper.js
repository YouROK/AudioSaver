var events = require("sdk/system/events");
var { Ci,Cc } = require("chrome");
var file = require("./fileHelper");
var prefs = require("./prefs");

//exports functions
exports.start = start;
exports.stop = stop;

function listener(event) {
	var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel);

    if (httpChannel.responseStatus !== 200)
        return;

    try
    {
        var contentType = httpChannel.getResponseHeader("Content-Type");
        var contentLength = httpChannel.getResponseHeader("Content-Length");
        if(!contentType)
            return;

        if(contentType.indexOf("audio") == -1)
            return;
    }
    catch(err)
    {
        //console.log("Error find content type :" + err);
        return;
    }

    if(!contentLength)
        contentLength = -1;

  	var channel = event.subject.QueryInterface(Ci.nsITraceableChannel);

    var fileInfo = [httpChannel.URI.asciiSpec, contentType, contentLength];

  	var newListener = new TracingListener(fileInfo);
    
    newListener.originalListener = channel.setNewListener(newListener);
}

function start()
{
    events.on("http-on-examine-response", listener);
}

function stop()
{
    events.off("http-on-examine-response", listener);
}
 
function TracingListener(fileInfo) {
    this.originalListener = null;
    this.receivedData = [];
    this.info = fileInfo;
    this.loadedLength = 0;
}

TracingListener.prototype =
{
    onDataAvailable: function(request, context, inputStream, offset, count) {
        if(file.isOpen())
        {
            var binaryInputStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
            binaryInputStream.setInputStream(inputStream);
            var storageStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
            storageStream.init(8192, count, null);
            var binaryOutputStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
            binaryOutputStream.setOutputStream(storageStream.getOutputStream(0));
            var data = binaryInputStream.readBytes(count);
            file.write(data, count);
            this.loadedLength = this.loadedLength + count;
            binaryOutputStream.writeBytes(data, count);
            this.originalListener.onDataAvailable(request, context, storageStream.newInputStream(0), offset, count);
        }
        else
        {
            this.originalListener.onDataAvailable(request, context, inputStream, offset, count);
        }
    },

    onStartRequest: function(request, context) {
        this.originalListener.onStartRequest(request, context);
        var RootPath = prefs.getRootPath();
        this.loadedLength = 0;
        if(RootPath && RootPath.length)
            file.open(RootPath+"/lastcapture");
        else
        {
            console.log("Error save file, settings is empty");
        }
    },

    onStopRequest: function(request, context, statusCode)
    {
        contentLength = this.info.pop();
        this.originalListener.onStopRequest(request, context, statusCode);
        var RootPath = prefs.getRootPath();
        this.info.push(RootPath+"/lastcapture");
        file.close();
        console.log(this.loadedLength);
        console.log(contentLength);
        if(contentLength == -1 || contentLength == this.loadedLength)
            file.copy(this.info);
        return;
    }
}