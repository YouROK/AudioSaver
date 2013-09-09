var sniffer = require("./sniffHelper")
var prefs = require("./prefs");
var data = require("sdk/self").data;
var notifications = require("sdk/notifications");
var toolbarbutton = require("toolbarbutton");


var button;

function createButton(options) {
    return toolbarbutton.ToolbarButton({
        id: "audio-saver-widget",
        label: "AudioSaver",
        tooltiptext: "Save music",
        image: data.url("audiosaverd32.png"),
        onCommand: function() {
        	var enable = prefs.get("enable", false);
            if(prefs.getRootPath().length)
			{
				if(enable)
				{
					sniffer.stop();
					prefs.set("enable", false);
					button.button().setAttribute('image', data.url("audiosaverd32.png"));
				}
				else
				{
					sniffer.start();
					prefs.set("enable", true);
					button.button().setAttribute('image', data.url("audiosavere32.png"));
				}
			}else
			{
				button.button().setAttribute('image', data.url("audiosaverd32.png"));
				notifications.notify({text: "Error directory to save music is empty, please set the preference"});
			}
        }
    });
}


exports.main = function(options) {
    button = createButton(options);
    if (options.loadReason == "install") {
        button.moveTo({
            toolbarID: "nav-bar",
            insertbefore: "home-button",
            forceMove: true
        });
    }

    if(prefs.getRootPath().length)
	{
		if(prefs.get("enable", false))
		{
			sniffer.start();
			button.button().setAttribute('image', data.url("audiosavere32.png"));
		}
		else
		{
			sniffer.stop();
			button.button().setAttribute('image', data.url("audiosaverd32.png"));
		}
	}
};