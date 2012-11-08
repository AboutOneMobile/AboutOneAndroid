$('head').append('<link rel="stylesheet" type="text/css" href="jquery/jquery.mobile-1.1.0-rc.1.css" />');
$('head').append('<link rel="stylesheet" type="text/css" href="jquery/jquery.mobile.structure-1.1.0-rc.1.css" />');
$('head').append('<link rel="stylesheet" type="text/css" href="bootstrap/css/bootstrap.css" />');
$('head').append('<link rel="stylesheet" type="text/css" href="base.css" />');
$('head').append('<link rel="stylesheet" type="text/css" href="aboutone.css" />');

// iPad/iPhone specific css below, add after your main css
// <link rel="stylesheet" media="only screen and (max-device-width: 1024px)" href="ipad.css" type="text/css" />
// <link rel="stylesheet" media="only screen and (max-device-width: 480px)" href="iphone.css" type="text/css" />

// if (jasmine === undefined) { // dont do this in spec test mode
  $('<meta>', {
  	name: 'viewport',
   content: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no;"
  }).appendTo('head');
// }

$('<meta>', {
	name: 'charset',
 content: "utf-8"
}).appendTo('head');

// not using .getScript because that's asynchronous by default
$.ajax({ url: "base.js", async: false, dataType: "script" });
$.ajax({ url: "config.js", async: false, dataType: "script" });
$.ajax({ url: "cordova-1.7.0.js", async: false, dataType: "script" });
$.ajax({ url: "jquery/jquery.mobile-1.1.0-rc.1.js", async: false, dataType: "script" });
$.ajax({ url: "jsrender.js", async: false, dataType: "script" });
$.ajax({ url: "jstorage.js", async: false, dataType: "script" });

// Enables for all serialization
// jQuery.ajaxSettings.traditional = true;

// validate config.js values
if (api_host === undefined) {
  seriousError("'api_host' must be set in config.js");
}