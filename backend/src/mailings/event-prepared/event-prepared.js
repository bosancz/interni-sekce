var mustache = require("mustache");
var fs = require("fs-extra");

var config = require("../../config");

module.exports = async function (transport, params) {
  var template = await fs.readFile(__dirname + "/event-prepared.html", "utf8");

  if (!config.notifications.mails.program) return;

  let mailOptions = {
    to: config.notifications.mails.program,
    subject: "Akce ke schválení",
    html: mustache.render(template, params),
  };

  return transport.sendMail(mailOptions);
};
