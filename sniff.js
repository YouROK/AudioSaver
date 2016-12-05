var events = require("sdk/system/events");
var {
    Ci,
    Cc
} = require("chrome");
var file = require("./file");

//exports functions
exports.start = start;
exports.stop = stop;

function start() {
    events.on("http-on-examine-response", listener);
}

function stop() {
    events.off("http-on-examine-response", listener);
}

function listener(event) {
    var httpChannel = event.subject.QueryInterface(Ci.nsIHttpChannel);
    try {
        if (httpChannel && (httpChannel.responseStatus !== 200 && httpChannel.responseStatus !== 206 && httpChannel.responseStatus !== 304)) {
            return;
        }
        var channel = event.subject.QueryInterface(Ci.nsITraceableChannel);
        var newListener = new TracingListener();
        newListener.originalListener = channel.setNewListener(newListener);
    } catch (err) {
        // console.log("Error set listner:", err)
    }
}

function TracingListener() {
    this.originalListener = null;
    this.receivedChunks = [];
}

TracingListener.prototype = {
    onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
        try {
            if (aRequest.contentType && aRequest.contentType.indexOf("audio") != -1) {
                var iStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
                var sStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
                var oStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
                iStream.setInputStream(aInputStream);
                sStream.init(8192, aCount, null);
                oStream.setOutputStream(sStream.getOutputStream(0));

                var data = iStream.readBytes(aCount);
                this.receivedChunks.push(data);

                oStream.writeBytes(data, aCount);
                this.originalListener.onDataAvailable(aRequest, aContext, sStream.newInputStream(0), aOffset, aCount);
                return;
            }
        } catch (err) {}
        this.originalListener.onDataAvailable(aRequest, aContext, aInputStream, aOffset, aCount);
    },
    onStartRequest: function(aRequest, context) {
        this.originalListener.onStartRequest(aRequest, context);
        if (aRequest.name.indexOf("yandex.net") != -1 && aRequest.contentType.indexOf("audio") != -1)
            console.log("start:", aRequest.name)
    },
    onStopRequest: function(aRequest, context, statusCode) {
        this.originalListener.onStopRequest(aRequest, context, statusCode);
        if (aRequest.name.indexOf("yandex.net") != -1 && aRequest.contentType.indexOf("audio") != -1)
            console.log("stop:", aRequest.name)
            /*if (aRequest.name.indexOf("yandex.net")!=-1){
                console.log(this.receivedChunks.length);
                console.log(aRequest.contentType);
                console.log(aRequest.contentType.indexOf("audio"));
            }*/

        if (this.receivedChunks.length > 0 && aRequest.contentType && aRequest.contentType.indexOf("audio") != -1) {
            if (this.file == null)
                this.file = new file.BinaryFile(aRequest.name, aRequest.contentType);
            this.file.create();
            for (index = 0; index < this.receivedChunks.length; ++index) {
                this.file.write(this.receivedChunks[index], this.receivedChunks[index].length);
            }
            //TODO optimize
            this.file.close();
            delete this.receivedChunks;
        }
    }
}
