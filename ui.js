var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var conf = require('./conf');
var sniff = require("./sniff");
var file = require("./file");

exports.updateUI = updateUI;

var button = buttons.ActionButton({
  id: "mozilla-link",
  label: "Save audio",
  icon: "./audiosaver_blue_32.png",
  onClick: handleClick
});

function handleClick(state) {
  if (conf.getPath()) {
    if (!conf.get("Enabled")) {
      sniff.start();
      conf.set("Enabled", true);
    } else {
      sniff.stop();
      conf.set("Enabled", false);
    }
  } else {
    require("sdk/notifications").notify({
      text: "Save audio, disabled. Set the directory to save audio"
    });
  }
  updateUI();
}

function updateUI() {
  if (!conf.getPath()) {
    button.state("window", {
      icon: "./audiosaver_gray_32.png",
      label: "Save audio, disabled. Set the directory to save audio",
    });
    sniff.stop();
    return;
  } else {
    button.state("window", {
      label: "Save audio",
    });
  }

  if (conf.get("Enabled")) {
    button.state("window", {
      icon: "./audiosaver_blue_32.png",
      label: "Save audio",
    });
  } else {
    button.state("window", {
      icon: "./audiosaver_gray_32.png",
      label: "Save audio, disabled",
    });
  }
}
