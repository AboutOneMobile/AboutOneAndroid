//var api_host = "https://dev.go.aboutone.com:8080";  //DEV
//var api_host = "https://qa.go.aboutone.com:8080"; //QA
var api_host = "https://go.aboutone.com:8080"; //PROD
//var api_host = "http://10.0.1.5/aboutone.api"; // Nate

$.jStorage.set("api_host", api_host);

var application_key = "E2A58EF3A47141BFB10B6B1147EB706E"; //Testing key

var release_name = "Beta";
var release_date = "Oct 11, 2012";
var release_version = "0.1.15";
var dev_options_password = "Ab0ut0n3$";
var tap_delay = 200; // # of ms to delay until touchend is called on tap/touch event
var longpress_delay = 750; // # of ms to delay until touchend is called on longpress event
var tap_vibrate = 25; // # of ms to vibrate when user taps
var feedback_prompt_interval = 10;
var photo_quality = 10; // quality of uploaded photos (as a % of original quality)
var max_stream_length = 25; // maximum number of stream items to load

var login_check_interval = 300000; // # of ms to wait between checks for isLoggedIn()

var app_resumed = $.jStorage.get("app_resumed");
if(app_resumed == "" || app_resumed == null || app_resumed === undefined ){
	app_resumed = 1;
	$.jStorage.set("app_resumed", app_resumed);
	$.jStorage.set("should_be_prompted_for_rating", false);
	$.jStorage.set("has_been_prompted_for_rating", false);
}

var stored_version = $.jStorage.get("release_version");
if(stored_version != release_version){
	// $.jStorage.set("app_resumed", 1);
	$.jStorage.set("should_be_prompted_for_rating", false);
	$.jStorage.set("has_been_prompted_for_rating", false);
	$.jStorage.set("release_version", release_version);
}