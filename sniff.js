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
        if (httpChannel && httpChannel.responseStatus !== 200)
            return;
        var channel = event.subject.QueryInterface(Ci.nsITraceableChannel);
        var newListener = new TracingListener();
        newListener.originalListener = channel.setNewListener(newListener);
    } catch (err) {
        console.log("Error set listner:", err)
    }
}

function TracingListener() {
    this.originalListener = null;
}

TracingListener.prototype = {
    onDataAvailable: function(aRequest, aContext, aInputStream, aOffset, aCount) {
        try {
            if (this.file && aRequest.contentType && aRequest.contentType.indexOf("audio") != -1) {
                var iStream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
                var sStream = Cc["@mozilla.org/storagestream;1"].createInstance(Ci.nsIStorageStream);
                var oStream = Cc["@mozilla.org/binaryoutputstream;1"].createInstance(Ci.nsIBinaryOutputStream);
                iStream.setInputStream(aInputStream);
                sStream.init(8192, aCount, null);
                oStream.setOutputStream(sStream.getOutputStream(0));

                var data = iStream.readBytes(aCount);
                this.file.write(data, aCount);

                oStream.writeBytes(data, aCount);
                this.originalListener.onDataAvailable(aRequest, aContext, sStream.newInputStream(0), aOffset, aCount);
                return;
            }
        } catch (err) {}
        this.originalListener.onDataAvailable(aRequest, aContext, aInputStream, aOffset, aCount);
    },
    onStartRequest: function(aRequest, context) {
        if (aRequest.contentType && aRequest.contentType.indexOf("audio") != -1) {
            if (this.file == null) {
                this.file = new file.BinaryFile(aRequest.name, aRequest.contentType);
            }
            this.file.create();
        }
        this.originalListener.onStartRequest(aRequest, context);
    },
    onStopRequest: function(aRequest, context, statusCode) {
        this.originalListener.onStopRequest(aRequest, context, statusCode);
        if (this.file && aRequest.contentType && aRequest.contentType.indexOf("audio") != -1) {
            this.file.close();
        }
    }
}
