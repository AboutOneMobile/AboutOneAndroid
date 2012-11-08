// ENUMERATIONS
var MediaType = {"Unknown": 0, "Image": 1, "Document": 2, "Audio": 3, "Video": 4};

window.onorientationchange = function() {
	setTimeout(function(){
		reloadCSSFiles();
	},100);
}

function reloadCSSFiles(){
    var queryString = '?reload=' + new Date().getTime();
    $('link[rel="stylesheet"]').each(function () {
        this.href = this.href.replace(/\?.*|$/, queryString);
    });
}

// window.onbeforeunload = function(){
	// //this will save the current page in history before leaving the page
	// aoHistory.save();
// }

function onResume(){
	// called when the cordova application is retrieved from the background
	appResumed(true);
	if(!isOnPage("offline-access.html")){
		authToken();
	}
	if( $.jStorage.get("should_be_prompted_for_rating") == true &&  $.jStorage.get("has_been_prompted_for_rating") == false){
		promptForRating();
	}
}

function promptForRating(){
	if($("#feedback-modal").length == 0){
		var html = "<div class='ao-modal hide' id='feedback-modal' style='background-color: white;'>" +
						"<div class='modal-header'>" +
							"<h3>How do you like the app?</h3>" +
						"</div>" +
						"<div class='modal-body center-text'>" +
							"<h5 class='text-left'>We'd love to hear about your experience!</h5><br>" +
							"<a href='javascript:window.open('market://details?id=com.google.earth')' class='btn btn-success text-left' id='feedback-love-it' style='width:200px;'>" +
								"<h4 class='white-text'>Love it!</h4>" +
								"<span class='small-text'>That's great! Tap to leave a review.</span>" +
							"</a>" +
							"<a href='#' class='btn btn-warning text-left' id='feedback-like-it' style='width:200px;'>" +
								"<h4 class='white-text'>So far, so good</h4>" +
								"<span class='small-text'>What can we do better? Tap to tell us.</span>" +
							"</a>" +
							"<a href='#' class='btn btn-danger text-left' id='feedback-hate-it' style='width:200px;'>" + 
								"<h4 class='white-text'>I\'m having problems.</h4>" +
								"<span class='small-text'>Let us help. Tap to send a report.</span>" +
							"</a>" +
							"<a href='#' class='btn text-left' id='feedback-no-thanks' style='width:200px;'>" +
								"<h4>Not right now.</h4>" +
								"<span class='small-text'>Tap to hide.</span>" +
							"</a>" +
						"</div><br>" +
					"</div>";
		$("body").append(html);
	}
	if($(".ao-modal-background").length == 0){
		$("body").append("<div class='ao-modal-background hide'></div>");
	}
	$("#feedback-love-it").click(function(e){
		e.preventDefault();
		hideModal("feedback-modal");
		$.jStorage.set("should_be_prompted_for_rating", false);
		$.jStorage.set("has_been_prompted_for_rating", true);
		$("#feedback-modal").remove();
		window.open($.jStorage.get("store_review_link"));
	});
	$("#feedback-like-it").click(function(e){
		e.preventDefault();
		hideModal("feedback-modal");
		$.jStorage.set("should_be_prompted_for_rating", false);
		$.jStorage.set("has_been_prompted_for_rating", true);
		$("#feedback-modal").remove();
		window.location.href = "feedback-form.html";
	});
	$("#feedback-hate-it").click(function(e){
		e.preventDefault();
		hideModal("feedback-modal");
		$.jStorage.set("should_be_prompted_for_rating", false);
		$.jStorage.set("has_been_prompted_for_rating", true);
		$("#feedback-modal").remove();
		window.location.href = "feedback-form.html";
	});
	$("#feedback-no-thanks").click(function(e){
		e.preventDefault();
		$.jStorage.set("should_be_prompted_for_rating", false);
		hideModal("feedback-modal");
		$("#feedback-modal").remove();
	});
	showModal("feedback-modal");
}

function getUserData(){
	console.log(apiPath('contact/me'));
	apiGet(apiPath('contact/me'), {}, function(json) {
		$.jStorage.set("user_data_stuff",json.Contact);
		console.log("user_data_stuff: "+JSON.stringify(json.Contact));
	});
}

function avatarUrl(avatarId, size){
	var url = apiHost() + "/10/media/" + avatarId + appendKeyAndToken();
	if(!isBlank(size)){
		url += "&square=" + size;
	}
	return url;
}

function basePath(method) {
	return apiHost() + "/10/" + method + "?applicationKey=" + applicationKey();
}

function apiPath(method) {
	var auth = authToken();
	if(isBlank(auth)){
		logOutUser();
	}else{
		return basePath(method) + "&authToken=" + auth + "&" + cacheBuster();
	}
}

function clientIdentifier() {
	if( typeof device != "undefined") {
		return device.uuid;
	} else {
		return "1234567890";
	}
}

function cacheBuster() {
	return ["cache=", (new Date().getTime())].join('');
	// return "cache=24234234234236";
}

function apiHost(host) {
	if(isBlank(host)){
		return api_host;
	}else{
		api_host = host;
		$.jStorage.set("api_host", api_host);
	}
}

function applicationKey(key) {
	if(isBlank(key)){
        if(isBlank(application_key)){
            return $.jStorage.get("application_key");
        }else{
            return application_key;
        }
	}else{
		application_key = key;
		$.jStorage.set("application_key", application_key);
	}
    return application_key;
}

function authToken(auth_token) {
	if(isBlank(auth_token)){
		var auth = $.jStorage.get("auth_token");
		if(isBlank(auth)){
			sendClientToLoginPage();
		}else{
			$.jStorage.set("auth_token", auth);
			// $.jStorage.setTTL("auth_token", 3600000); // 3600000 ms = 1 hr
			$.jStorage.setTTL("auth_token", 259200000); // 259200000 ms = 3 days
			return auth;
		}
	}else{
		$.jStorage.set("auth_token", auth_token);
		// $.jStorage.setTTL("auth_token", 3600000); // 3600000 ms = 1 hr
		$.jStorage.setTTL("auth_token", 259200000); // 259200000 ms = 3 days
	}
}

function appendKeyAndToken(){
	return "?applicationKey="+applicationKey()+"&authToken="+authToken();
}

function userId(user_id) {
	if(isBlank(user_id)) {
		var user_id = $.jStorage.get("user_id");
		return user_id;
	} else {
		return $.jStorage.set("user_id", user_id);
	}
}

function userName(user_name) {
	if(isBlank(user_name)) {
		var user_name = $.jStorage.get("user_name");
		if(isBlank(user_name)) {
			sendClientToLoginPage();
		} else {
			return user_name;
		}
	}else{
		return $.jStorage.set("user_name", user_name);
	}
}

function userToken(user_token) {
	if(isBlank(user_token)) {
		var user_token = $.jStorage.get("user_token");
		if(isBlank(user_token)) {
			sendClientToLoginPage();
		} else {
			return user_token;
		}
	} else {
		return $.jStorage.set("user_token", user_token);
	}
}

function hasUserToken(){
	return !(isBlank($.jStorage.get('user_token')));
}

function userPIN(pin){
	if(isBlank(pin)){
		return $.jStorage.get('user_login_pin');
	}else{
		$.jStorage.set('user_login_pin', pin);
	}
}

function hasUserPIN(){
	return !isBlank($.jStorage.get('user_login_pin'));
}

function clearUserToken() {
	$.jStorage.deleteKey("user_token");
}

function getNewUserToken(pin) {
	showLoading();
	apiPost(apiPath('credential/usertoken'), {
		Pin : pin,
		ClientIdentifier : clientIdentifier()
	}, function(json){
		console.log("USER TOKEN: " + json.Token);
		userToken(json.Token);
		hideLoading();
		goToStream();
	});
}

function changeUserPin(pin){
	showLoading();
	apiPost(apiPath('credential/pin'), {
		"NewPin" : pin
	}, function(json) {
		userPIN(pin);
		aoAlert("Your PIN was successfully updated.","PIN Change Success");
		hideLoading();
		if(!hasUserToken()){
			getNewUserToken(pin);
		}else{
			goToStream();
		}
	});
}

function showIntroWizard(){
	var show = $.jStorage.get("show_intro_wizard");
	if(isBlank(show) || show == true){
		$.jStorage.set("show_intro_wizard", false);
		window.location.href = "intro-wizard.html";
	}
	return show;
}

function isBlank(value) {
	return (value === null) || (value === undefined) || (value.toString().trim().length < 1);
	// switch(typeof(value)){
		// case "string":
			// return (value === null) || (value === undefined);
		// case "number":
			// return isNaN(value);
		// case "object":
			// if(value == null){
				// return true;
			// }else if(Object.prototype.toString.call(value) == "[object Array]"){
				// return value.length == 0;
			// }else{
			    // for(var prop in value) {
			        // if(value.hasOwnProperty(prop))
			            // return false;
			    // }
			    // return true;
			// }
		// case "boolean":
			// return value == false;
		// case "function":
			// return false;
		// default:
			// return true;
	// }
}

function lastLocation() {
	last_location = $.jStorage.get("last_location");
	if(isBlank(last_location)) {
		return defaultLocation;
	} else {
		return last_location;
	}
}

function logOutUser(clear_cache){
	$("#app-menu").animate({left:"-260px"}, "slow");
	if(clear_cache == true){
		var resumed = appResumed();
		var pin = userPIN();
		var user_token = $.jStorage.get("user_token");
		clearLocalStorage();
		$.getScript("config.js", function(data, textStatus, jqxhr) { });
		$.jStorage.set("show_intro_wizard", false);
		$.jStorage.set("app_resumed", resumed);
		$.jStorage.set('user_login_pin', pin);
		$.jStorage.set("user_token", user_token);
	}
	clearAuthToken();
	sendClientToLoginPage();
}

function setLastLocation(last_location) {
	$.jStorage.set("last_location", last_location);
}

function clearAuthToken() {
	$.jStorage.deleteKey('auth_token');
}

function checkConnection(){
	if(typeof(navigator.connection) != "undefined"){
	    var conn = navigator.connection.type;
	    return (conn != Connection.NONE);
	}else{
		return true;
	}
}

function clearLocalStorage() {
	// console.log("FLUSHING LOCAL STORAGE");
	$.jStorage.flush();
}

function sendClientToLoginPage() {
	if(!isOnPage("login.html")){
		window.location.href = 'login.html';
	}
}

function version(){
	return $.jStorage.get("release_version");
}
function releaseDate(){
	return release_date;
}
function appResumed(increment){
	var resumed = $.jStorage.get("app_resumed");
	if(!isBlank(increment) && increment == true){
		resumed = resumed + 1;
		$.jStorage.set("app_resumed", resumed);
	} 
	if(resumed % feedback_prompt_interval == 0 && $.jStorage.get("has_been_prompted_for_rating") == false){
		$.jStorage.set("should_be_prompted_for_rating", true);
	}
	return resumed;
}

function isLoggedIn(){
	var token = $.jStorage.get("auth_token");
	if(!isBlank(token) && checkConnection()){
		return true;
	}else{
		sendClientToLoginPage();
	}
}

function onDesktop(){
	return String(window.location.href).contains('localhost:8888');
}

function apiGet(api_path, get_params, callback_function) {
    if(!api_path.contains("undefined")){
        if(checkConnection()){ //check to make sure the user has an internet connection
            $.ajax({
                "async" : true,
                "type" : "GET",
                "dataType" : "json",
                "accepts" : "json",
                "url" : api_path,
                "data" : get_params,
                "success" : function(jqXHR, textStatus, errorThrown) {
                    parseApiCallSuccess(callback_function, jqXHR, textStatus, errorThrown);
                },
                "error": function(jqXHR){
                    apiCallError(jqXHR, api_path);
                }
            });
        }else{
            aoAlert("You are not connected to the Internet. Please reconnect and try again.","Connection Required");
            sendClientToLoginPage();
            hideLoading();
            hideAllModals();
        }
    }
}

function apiPost(api_path, post_params, callback_function, method) {
    if(!api_path.contains("undefined")){
        if(checkConnection()){ //check to make sure the user has an internet connection
            if(method === undefined) {
                method = "POST";
            }
            $.ajax({
                "async" : true,
                "type" : method,
                "dataType" : "json",
                "contentType" : "application/json; charset=utf-8",
                "accepts" : "json",
                "url" : api_path,
                "data" : JSON.stringify(post_params),
                "success" : function(jqXHR) {
                    parseApiCallSuccess(callback_function, jqXHR);
                },
                "error": function(jqXHR){
                    apiCallError(jqXHR, api_path);
                }
            });
        }else{
            hideLoading();
            hideAllModals();
        }
    }
}


function displayError(code,message){
	var title = "Connection error";
	switch(code){
		case 116:
			title = "Login has timed out";
			message = "You have been logged out for security purposes.  Please login again.";
			logOutUser();
			break;
		case 158:
			title = "Scheduled Maintenance";
			message = "Our servers are currently down for scheduled " +
				"maintenance but we are working hard to bring "+
				"them back online as soon as possible.  We apologize for the inconvenience.";
			clearAuthToken();
			sendClientToLoginPage();
			break;
		case 135:
			title = "Sign Up Error";
			message = "The email address you provided is already in use. Please provide another " +
				"email address or visit AboutOne.com to recover your current password";
			break;
	}
	aoAlert(message,title);
}


function parseApiCallSuccess(callback_function, jqXHR) {
	if(jqXHR.ErrorCode == 0) {
		callback_function(jqXHR);
	}else{
		console.log("Server response indicated an error");
		console.log(JSON.stringify(jqXHR));
		displayError(jqXHR.ErrorCode, jqXHR.ErrorMessage);
		hideLoading();
		hideAllModals();
	}
}

function parseApiCallError(jqXHR, textStatus, errorThrown, call_back) {
	if(textStatus != "error"){
		try{
			throw Error("parseApiCallError: " + textStatus + " - " + errorThrown + " - " + JSON.stringify(jqXHR));
		}catch(err){
			displayException(err);
		}
	}else if(jqXHR.status == 0){
		console.log("ANOTHER USELESS ERROR: " + JSON.stringify(jqXHR) + " - Callback function: " + call_back);
	}else{
		console.log("parseApiCallError: " + textStatus + " - " + errorThrown + " - " + JSON.stringify(jqXHR));
	}
}

function apiCallError(jqXHR, path){
	var errorText = "";
	var exception = "";
	if (jqXHR.status == 0) {
        errorText = 'Not connected! Verify Network. [0]';
    } else if (jqXHR.status == 404) {
        errorText = 'The page you requested was not found. [Code 404]';
    } else if (jqXHR.status == 500) {
        errorText = 'An internal server error occurred. [Code 500].';
    } else {
        errorText = 'An unknown error occured [Code ' + jqXHR.status + ']';
    }
    if(jqXHR.status != 0){
    	aoAlert("There was a problem processing your request. "+errorText+"\n\nPlease try again.","Connection Error");
    }
    console.log("API SERVER ERROR: " + errorText + " - " + path);
    hideAllModals();
}

function displayException(err){
	var line = "";
	if(!isBlank(err.stack)){
		line = "\nStackTrace: " + err.stack;
		console.log(err.stack);
	}
	aoAlert("Message: '" + err.message + "'" + line, "An exception was thrown");
	hideAllModals();
}

function handleSearchButton() {
	console.log("HANDLING SEARCH BUTTON");
}

function handleBackButton() {
	if($(".ao-modal-background").is(":visible")){
		hideAllModals();
	}else{
		// if(isOnPage("item-detail.html")){
			// goToStream();
		// }else if (typeof(navigator.app) != 'undefined' && typeof(navigator.app.backHistory) == 'function'){
			// navigator.app.backHistory();
		// }else{
			// history.go(-1);
		// }
		aoHistory.back();
	}
}

function handleMenuButton() {
	if($("#app-menu").length < 1){
		var html = 
			'<div id="app-menu">'+
				'<a href="javascript:closeAppMenu()"><i class="icon-remove pull-right"></i> <strong>AboutOne Menu</strong></a>';
			if(aoHistory.count() > 0)
				html += '<a href="javascript:handleBackButton()"><i class="icon-circle-arrow-left"></i> Back</a>';
			if(isOnPage("index.html")){
				html += '<a href="javascript:refreshStream()"><i class="icon-refresh"></i> Refresh Stream</a>';
			}else{
				html += '<a href="javascript:goToStream()"><i class="icon-align-justify"></i> My Stream</a>';
			}
            if(!isOnPage("contacts.html")){
                html += '<a href="javascript:goToContacts()"><i class="icon-group"></i> Contacts</a>';
            }
			html +=
				'<a href="javascript:goToItems()"><i class="icon-edit"></i> Add an Entry</a>'+
				'<a href="change-pin.html"><i class="icon-cogs"></i> Create/Change PIN</a>'+
				'<a href="javascript:promptForRating()"><i class="icon-thumbs-up"></i> Rate AboutOne</a>'+
				'<a href="intro-wizard.html"><i class="icon-magic"></i> Getting Started Wizard</a>'+
				'<a href="javascript:logOutUser()"><i class="icon-lock"></i> Log Out</a>'+
			'</div>';
		$("body").append(html);
	}
    $("#app-menu a").touch(function(){});
	$("#app-menu").animate({left:"0px"}, "slow");
}

function closeAppMenu(){
	$("#app-menu").animate({left:"-260px"}, "slow");
}

function getAppInfo(){
	var text = 
		"Release: "+release_name+
		"\nVersion: "+version()+
		"\nDate: "+releaseDate()+
		"\nLocal Storage: "+$.jStorage.storageSize()+
		"\nApp Usage: "+appResumed() +
		"\nPlatform: " + device.platform +
		"\nDevice: " + device.name + 
		"\nConnection: " + navigator.network.connection.type;
	var contacts = $.jStorage.get('contact_list_array');
	if(!isBlank(contacts)){
		text += "\nContacts: "+contacts.length;
	}
	return text;
}

function setPlatformVariables(){
	switch(device.platform.toLowerCase()){
		case "android":
			var store_review_link = "market://details?id=com.aboutone";
			var application_key = "8F93FFF9AAFE482384E66BF7F0AE5338"; //Android phone key
			break;
		case "ipad":
			var store_review_link = "https://userpub.itunes.apple.com/WebObjects/MZUserPublishing.woa/wa/addUserReview?type=Purple+Software&id=551448323&mt=8&o=i";
			var application_key = "BB23743AA7DE4CF99E8FA3EA8DDC2CA5"; //iPad key
			break;
		case "iphone":
		case "ipod":
		var store_review_link = "https://userpub.itunes.apple.com/WebObjects/MZUserPublishing.woa/wa/addUserReview?type=Purple+Software&id=551448323&mt=8&o=i";
			var application_key = "67847F7CF68B49A19E3BFCB64AD4ED90"; //iPhone key
			break;
		default:
		var store_review_link = "https://userpub.itunes.apple.com/WebObjects/MZUserPublishing.woa/wa/addUserReview?type=Purple+Software&id=551448323&mt=8&o=i";
			var application_key = "E2A58EF3A47141BFB10B6B1147EB706E"; //Testing key
			break;
	}
	$.jStorage.set("store_review_link",store_review_link);
	applicationKey(application_key);
}


// replaced onBodyLoad

document.addEventListener("deviceready", onDeviceReady, false);

function assimilate() {
	if(onDesktop()){
		onDeviceReady();
	}
}

function onDeviceReady() {
	
//	isLoggedIn();
	
	if(typeof(device) != "undefined" && typeof(device.platform) != "undefined"){
		setPlatformVariables();
	}

    reloadCSSFiles();
	
	document.addEventListener("backbutton", handleBackButton, false);
	document.addEventListener("searchbutton", handleSearchButton, false);
	document.addEventListener("menubutton", handleMenuButton, false);
	document.addEventListener("resume", onResume, false);
	
	$(".header-bar ul li:first-child, .header-bar ul li:last-child").touch(function(e){});
		
	$("#add-entry").click(function(e){
		e.preventDefault();
		goToItems();
	});
	
	aoHistory.save();
	
	if(typeof(onPageReady) == 'function') {
		onPageReady();
	}
}

function sendToLastUsedLocation() {
	if(isLoggedIn()) {
		var last_location = lastLocation("stream.html");
		//console.log("Last Location was " + last_location);
		window.location.href = last_location;
	} else {
		sendClientToLoginPage();
	}
}

function getDate(val){
	if(!isBlank(val)){
		var digits = val.substring(val.indexOf('(')+1, val.indexOf(')'));
		return new Date(parseInt(digits));
	}
	return new Date();
}

function getAPIDateString(date){
	return "/Date(" + date.getTime() + ")/";
}

function formatDate(date){
	if(!isBlank(date)){
		var months = ["Jan","Feb","Mar","Apr","May","Jun","July","Aug","Sept","Oct","Nov","Dec"];
		var full = months[date.getMonth()]+" "+date.getDate()+", "+date.getFullYear();
		var quick = (date.getMonth()+1)+"/"+date.getDate()+"/"+date.getFullYear();
		var hour = date.getHours();
		var am = "AM";
		if(hour == 0){
			hour = 12;
		}else if(hour > 12){
			hour = hour - 12;
			am = "PM";
		}
		var mins = date.getMinutes();
		if (mins < 10) {
	        mins = '0' + mins
	    }
		var time = hour+":"+mins+" "+am;
		var json = {
			"Full": full,
			"Short": quick,
			"Time": time
		};
		return json;
	}
}

function addUtcOffset(date){
	var offset = new Date().getTimezoneOffset() * 60000;
	return new Date(date.getTime() + offset);
}
function removeUtcOffset(date){
	var offset = new Date().getTimezoneOffset() * 60000;
	return new Date(date.getTime() - offset);
}

function getPollToken(){
	var pollToken = $.jStorage.get("notify_poll_token");
	if(isBlank(pollToken)){
		console.log("getting new polltoken...");
		apiGet(apiPath('notify'), {}, function(json) {
			$.jStorage.set("notify_poll_token",json.PollToken);
			checkNotifications();
		});
	}
}

function checkNotifications(){
	var ImportNotif = {
		Completed: "ContactImportCompletedNotification",
		Failed: "ContactImportFailedNotification"
	};
	var ContactNotif = {
		Added: "ContactAddedNotification",
		Deleted: "ContactDeletedNotification",
		Updated: "ContactUpdatedNotification"
	};
	var ItemNotif = {
		Added: "ItemAddedNotification",
		Deleted: "ItemDeletedNotification",
		Updated: "ItemUpdatedNotification"
	};
	var pollToken = $.jStorage.get("notify_poll_token");
	if(isBlank(pollToken)){
		getPollToken();
	}else{
		apiGet(apiPath('notify/'+pollToken), {}, function(json) {
//			console.log(JSON.stringify(json));
			console.log("NEW POLLTOKEN: " + json.PollToken);
            console.log("NOTIFICATION COUNT: " + json.Notifications.length);
			$.jStorage.set("notify_poll_token",json.PollToken);
            if($.jStorage.get("_currently_importing_contacts") == true){
                handleImportNotifications(json.Notifications, ImportNotif);
                setTimeout(function(){
                    checkNotifications();
                }, 8000);
                return;
            }
            itemCount = 0;
			$.each(json.Notifications, function(i, notif){
                console.log(notif.NotificationType);
                switch(notif.NotificationType){
                    case ImportNotif.Completed:
                    case ImportNotif.Failed:
                        handleImportNotification(notif,ImportNotif);
                        break;
                    case ContactNotif.Added:
                    case ContactNotif.Deleted:
                    case ContactNotif.Updated:
                        handleContactNotification(notif,ContactNotif);
                        break;
                    case ItemNotif.Added:
                    case ItemNotif.Deleted:
                    case ItemNotif.Updated:
                        itemCount++;
                        handleItemNotification(notif,ItemNotif);
                        break;
                    default:
                        console.log("UNHANDLED NOTIFICATION: "+notif.NotificationType);
                        break;
                }
			});
            console.log("done processing notifications");
			if(itemCount > 0){
				setTimeout(function(){
					console.log("firing notificationsChecked event");
					$("#stream-list").trigger("notificationsChecked");
				},1000);
			}
		});
	}
}

function handleImportNotifications(notifs, ImportNotif){
    $.each(notifs, function(i, notif){
        if(notif.NotificationType == ImportNotif.Completed){
            var source = (notif.Source.contains("Mobile")) ? "your phone" : notif.Source;
            aoAlert("We successfully imported "+notif.NewContactsAdded+" contacts from "+source+
                ".\nWe merged "+notif.DuplicatesFound+" duplicate contacts.","Contact Import Complete");
            $.jStorage.set("_currently_importing_contacts", false);
            getFreshContactList();
            return false;
        }else if(notif.NotificationType == ImportNotif.Failed){
            var source = (notif.Source.contains("Mobile")) ? "your phone" : notif.Source;
            aoAlert("We were unable to finish importing your contacts from "+source+".\nWe successfully imported "+
                notif.NewContactsAdded+" contacts, before an error prevented us from finishing.","Contact Import Error");
            $.jStorage.set("_currently_importing_contacts", false);
            getFreshContactList();
            return false;
        }
    });
}

function handleImportNotification(notif, ImportNotif){
    console.log("CONTACT IMPORT NOTIF: "+ notif.NotificationType)
	switch(notif.NotificationType){
		case ImportNotif.Completed:
			var source = (notif.Source.contains("Mobile")) ? "your phone" : notif.Source;
			aoAlert("We successfully imported "+notif.NewContactsAdded+" contacts from "+source+
				".\nWe merged "+notif.DuplicatesFound+" duplicate contacts.","Contact Import Complete");
			$.jStorage.set("_currently_importing_contacts", false);
			$.jStorage.set("_import_contact_count", 0);
            getFreshContactList();
			break;
		case ImportNotif.Failed:
			var source = (notif.Source.contains("Mobile")) ? "your phone" : notif.Source;
			aoAlert("We were unable to finish importing your contacts from "+source+".\nWe successfully imported "+
        	notif.NewContactsAdded+" contacts, before an error prevented us from finishing.","Contact Import Error");
	        $.jStorage.set("_currently_importing_contacts", false);
	        $.jStorage.set("_import_contact_count", 0);
            getFreshContactList();
	        break;
	}
}

function handleContactNotification(notif,ContactNotif){
	var contacts = $.jStorage.get('contact_list_array');
	if(isBlank(contacts)){contacts = [];}
	var newContact = notif.Contact;
	switch(notif.NotificationType){
		case ContactNotif.Deleted:
			$.each(contacts,function(i,contact){
				if(contact.id == newContact.ContactId){
					contacts.splice(i,1);
					return false;
				}
			});
			break;
		case ContactNotif.Updated:
			$.each(contacts,function(i,contact){
				if(contact.id == newContact.ContactId){
					contacts[i].label = !isBlank(contact.Name) ? contact.Name : "Name Unknown";
					contacts[i].first = !isBlank(contact.FirstName) ? contact.FirstName.toLowerCase() : "";
					contacts[i].last = !isBlank(contact.LastName) ? contact.LastName.toLowerCase() : "";
					contacts[i].pic = !isBlank(contact.AvatarId) ? avatarUrl(contact.AvatarId,25) : "images/blank_person.png";
					contacts[i].picID = !isBlank(contact.AvatarId) ? contact.AvatarId : "";
					contacts[i].share = !isBlank(contact.Emails);
					return false;
				}
			});
			break;
		case ContactNotif.Added:
			contacts.push({
				"label": newContact.Name ? newContact.Name : (newContact.FirstName+" "+newContact.LastName),
				"first": newContact.FirstName ? newContact.FirstName.toLowerCase() : "",
				"last": newContact.LastName ? newContact.LastName.toLowerCase() : "",
				"pic": newContact.AvatarUrl ? newContact.AvatarUrl+appendKeyAndToken()+"&square=75" : "images/blank_person.png",
				"picID": newContact.AvatarId,
				"id": newContact.ContactId,
				"share": !isBlank(newContact.Emails)
			});
			contacts.sort(sortBy('label', false));
			break;
	}
	$.jStorage.set('contact_list_array', contacts);
}

function handleItemNotification(notif,ItemNotif){
	var itemlist = $.jStorage.get("item_list_data");
	switch(notif.NotificationType){
		case ItemNotif.Deleted:
			$.each(itemlist,function(i,item){
				if(item.ItemId == notif.ItemId){
					itemlist.splice(i,1);
					return false;
				}
			});
			break;
		case ItemNotif.Updated:
			if(isBlank(notif.Item)){
				apiGet(apiPath('item/'+notif.itemId), {}, function(updatedItem){
				console.log(JSON.stringify(updatedItem));
					$.each(itemlist,function(i,item){
						if(item.ItemId == updatedItem.Item.ItemId){
							itemlist[i] = formatStreamItem(updatedItem.Item);
							return false;
						}
					});
					$.jStorage.set("item_list_data", itemlist);
				});
			}else{
				$.each(itemlist,function(i,item){
					if(item.ItemId == notif.Item.ItemId){
						itemlist[i] = formatStreamItem(notif.Item);
						return false;
					}
				});
				$.jStorage.set("item_list_data", itemlist);
			}
			
			break;
		case ItemNotif.Added:
			if(isBlank(notif.Item)){
				apiGet(apiPath('item/'+notif.ItemId), {}, function(addedItem){
					var brandnew = true;
					$.each(itemlist,function(i,item){
						if(item.ItemId == addedItem.Item.ItemId){ //already have a saved local copy, just need to update it
							itemlist[i] = formatStreamItem(addedItem.Item);
							brandnew = false;
							return false;
						}
					});
					if(brandnew){ //no local copy of the item, so need to add it to the front of the array
						itemlist.unshift(formatStreamItem(addedItem.Item));
					}
					$.jStorage.set("item_list_data", itemlist);
				});
			}else{
				console.log("NEW ITEM IN NOTIFICATION " + JSON.stringify(notif.Item));
				var brandnew = true;
				$.each(itemlist,function(i,item){
					if(item.ItemId == notif.Item.ItemId){ //already have a saved local copy, just need to update it
						itemlist[i] = formatStreamItem(notif.Item);
						brandnew = false;
						return false;
					}
				});
				if(brandnew){ //no local copy of the item, so need to add it to the front of the array
					itemlist.unshift(formatStreamItem(notif.Item));
				}
				$.jStorage.set("item_list_data", itemlist);
			}
			break;
	}
	$.jStorage.set("item_list_data", itemlist);
}

function formatStreamItem(item){
	if(!isBlank(item.AvatarUrl) && !item.AvatarUrl.contains("authToken")){
		// item.AvatarUrl = avatarUrl(item.AvatarId, 75);
		if(item.AvatarUrl.length == 32){ // bug in api where AvatarUrl is returning AvatarId
			item.AvatarUrl = avatarUrl(item.AvatarUrl, 75);
		}else{
			item.AvatarUrl += appendKeyAndToken() + "&square=75";
		}
	}else if(!isBlank(item.AvatarId)){
		item.AvatarUrl = avatarUrl(item.AvatarId, 75);
	}else{ //else, set the static image url based on the item category
		switch(item.ItemType){
			case "Memory":
				item.AvatarUrl = "images/memory-solid-75.png";
				break;
			case "PossessionProject":
			case "PossessionDocument":
				item.AvatarUrl = "images/home-solid-75.png";
				break;
			case "EducationActivity":
			case "EducationAward":
			case "Grade":
				item.AvatarUrl = "images/education-75.png";
				break;
			case "Health":
			case "Condition":
			case "HealthInsurance":
			case "Medication":
			case "Prescription":
			case "HealthAppointment":
				item.AvatarUrl = "images/health-solid-75.png";
				break;
			case "CommunityService":
			case "VolunteerHours":
				item.AvatarUrl = "images/service-75.png";
				break;
			case "GeneralDocument":
			case "EducationDocument":
			case "HealthDocument":
				item.AvatarUrl = "images/document-75.png";
				break;
			case "Career":
				item.AvatarUrl = "images/career-75.png";
				break;
			default:
				item.AvatarUrl = "images/stream-75.png";
				break;
		}
	}
	return item;
}

function getFreshContactList(){
	apiGet(apiPath('contact/list'), {}, function(json) {
		console.log(json.Contacts.length);
		var contactsArray = [];
		$.each(json.Contacts, function(index, contact){
			var pic = "images/blank_person.png";
			var mediaID = "";
			if(!isBlank(contact.AvatarId)){
				pic = avatarUrl(contact.AvatarId, 25);
			}
			contactsArray.push({
				"label": contact.Name ? contact.Name : (contact.FirstName+" "+contact.LastName),
				"first": contact.FirstName ? contact.FirstName.toLowerCase() : "",
				"last": contact.LastName ? contact.LastName.toLowerCase() : "",
				"pic": contact.AvatarUrl ? contact.AvatarUrl+appendKeyAndToken()+"&square=75" : "images/blank_person.png",
				"picID": contact.AvatarId,
				"id": contact.ContactId,
				"share": !isBlank(contact.Emails)
			});
		});
		contactsArray.sort(sortBy('label', false));
		console.log("storing contacts array");
		$.jStorage.set('contact_list_array', contactsArray);
		$.jStorage.deleteKey('contact_list_cached_html');
		$.jStorage.set('contact_list_data', json);
		$.jStorage.deleteKey("_managed_contacts_json");
		$.jStorage.deleteKey("_emergency_contacts_json");
		$.jStorage.deleteKey("_contact_groups_json");
		$.jStorage.deleteKey("_family_contacts_json");
	});
}

function getFreshStreamList(){
	apiGet(apiPath('item/list')+"&size="+max_stream_length, {}, function(json) {
		console.log("refreshing stream data...");
        console.log("stream length: " + json.Items.length);
        var itemlist = json.Items;
		if(isBlank(itemlist)){
			itemlist = "empty";
		}else{
			$.each(itemlist,function(i,item){
				itemlist[i] = formatStreamItem(item);
			});
		}
		$.jStorage.set("item_list_data", itemlist);
		$.jStorage.setTTL("item_list_data", 259200000); // 3 days
		if(typeof(loadItems) == "function"){
			//if on the stream page, then refresh to load the stream html
			loadItems();
		}
	});
}

function refreshItemList(){
	if(isBlank($.jStorage.get('item_list_data'))){
		getFreshStreamList();
	}
}
function refreshContactList(){
	if(isBlank($.jStorage.get('contact_list_array'))){
		getFreshContactList();
	}
}

var interval;
jQuery.fn.loadspinner = function () {
    this.css("position","absolute");
    this.css("z-index","999999");
    this.css("top", ( $(window).height() - this.height() ) / 3 + $(window).scrollTop() + "px");
    this.css("left", ( $(window).width() - this.width() ) / 2 + $(window).scrollLeft() + "px");
    return this;
}

function showLoading(){
	if($(".ao-modal-background").length > 0){
		$(".ao-modal-background").show();
	}else{
		$("body").append('<div class="ao-modal-background"></div>');
	}
	$("#loading-spinner").loadspinner();
	$("#loading-spinner").show();
}

function hideLoading(){
	$(".ao-modal-background").hide();
	$("#loading-spinner").hide();
}

function goToStream(){
	if(!isOnPage("index.html")){
		window.location.href = "index.html";
	}
}
function goToItems(){
	window.location.href = "quick-add.html";
}
function goToContacts(){
	if(!isOnPage("contacts.html")){
		window.location.href = "contacts.html";
	}
}

function getCurrentLocation(){
	var lat;
	var lon;
	var json = {"Lat": 40.4299881142,"Lon": -111.8935348857};
	function onSuccess(position) {
		lat = position.coords.latitude;
		lon = position.coords.longitude;
		getGPSAddress(lat,lon);
	}
    function onError(error) {
        console.log('code: ' + error.code + ' - message: ' + error.message);
        var code = "";
        switch(error.code){
        	case PositionError.PERMISSION_DENIED:
        		code = "Permission to use GPS was denied. Please enable GPS in your phone's settings.";
        		break;
        	case PositionError.POSITION_UNAVAILABLE:
        		code = "Your phone was unable to locate your current position. Please make sure GPS is enabled in your phone's settings and try again.";
        		break;
        	case PositionError.TIMEOUT:
        		code = "The request to retreive your location was taking too long. Please try again later.";
        		break;
        	default:
        		code = "The error source is unknown (" + error.message + "). Please make sure GPS is enabled in your phone's settings and try again.";
        		break;
        }
        aoAlert(code, "GPS Location Error");
    }
    navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function getGPSAddress(lat,lon,cb){
	var path = "http://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lon+"&sensor=true";
	$.ajax({
		url: path,
		success: function(data){
			// console.log(data);
			var parts = data.results[0].formatted_address.trim().split(",");
			var statezip = parts[2].trim().split(" ");
			var address = {
				"Street": parts[0].trim(),
				"City": parts[1].trim(),
				"State": statezip[0],
				"Zip": statezip[1],
				"Country": parts[3].trim()
			};
			cb(address.City, address.State);
		},
		dataType: "json"
	});
}

function sortBy(field, reverse, primer){
   if(isBlank(primer)){
   		primer = function(a){return a.toUpperCase()};
   }
   var key = function (x) {
   		if(x[field]){
   			return primer ? primer(x[field]) : x[field];
   		}else{
   			return "";
   		}
    };
    return function (a,b) {
        var A = key(a), B = key(b);
        return (A < B ? -1 : (A > B ? 1 : 0)) * [1,-1][+!!reverse];
    }
}

function aoAlert(message, title, func, buttonName){
	if( typeof(navigator.notification) == "undefined"){
		if(!isBlank(title)){
			message = title + "\n\n" + message;
		}
		alert(message);
	}else{
		if(isBlank(title)){
			title = "AboutOne Alert";
		}
		if(isBlank(func)){
			func = function(){};
		}
		if(isBlank(buttonName)){
			buttonName = "OK";
		}
		navigator.notification.alert(message, func, title, buttonName);
	}
}

function aoConfirm(callback, message, title, btns){
	if( typeof(navigator.notification) == "undefined"){
		var ok = confirm(title+"\n"+message);
		if(ok){
			callback();
		}	
	}else{
		function onConfirm(btn){
			if(btn == 2){ // this is the index for 'OK'
				callback();
			}
		};
		if(isBlank(btns)){
			btns = "Cancel,OK";
		}
		navigator.notification.confirm(
	        message,      // message
	        onConfirm,    // callback to invoke with index of button pressed
	        title,        // title
	        btns   		  // buttonLabels
	    );
	}
}

function showModal(id){
	$("#app-menu").animate({left:"-260px"}, "slow");
	$(".ao-modal-background").show();
	$("#"+id).show();
	// var y = ( $(window).height() - $("#"+id).height() ) / 4 + $(window).scrollTop();
	// if(y < 60) { y = 60; }
    // $("#"+id).css("top", y + "px");
    $("#"+id).css("top", "60px");
    $("#"+id).css("left", ( $(window).width() - $("#"+id).width() ) / 2 + $(window).scrollLeft() + "px");
}

function hideModal(id){
	$(".ao-modal-background").hide();
	$("#"+id).hide();
}

function hideAllModals(){
	$("#loading-spinner").hide();
	$(".ao-modal-background").hide();
	$(".ao-modal").hide();
}

function noClick(e){
	e.preventDefault();
}

function ellipsis(str, num){
	if(str.length > num){
		return str.substr(0,num) + "...";
	}else{
		return str;
	}
}

// CUSTOM TOUCH EVENT TO BE AS FAST AS POSSIBLE
jQuery.fn.touch = function(subelem, callback) {
	// if(onDesktop()){
		// if(isBlank(subelem)){
			// this.on("click", function(){
				// setTimeout($.proxy(callback, this), 1);
			// });
		// }else{
			// this.on("click", subelem, function(){
				// setTimeout($.proxy(callback, this), 1);
			// });
		// }
	// }else{
		var delay;
		if(isBlank(subelem)){
			this.on("touchstart", function(){
				$(this).addClass("active");
				delay = setTimeout(
						$.proxy(function(){
							$(this).removeClass("active");
							if(typeof(callback) == "function")
								callback(this);
						}, this), 
					tap_delay);
			});
			this.on("touchmove", function(){
				clearTimeout(delay);
				$(this).removeClass("active");
			});
		}else{
			this.on("touchstart", subelem, function(){
				$(this).addClass("active");
				delay = setTimeout(
						$.proxy(function(){
							$(this).removeClass("active");
							if(typeof(callback) == "function")
								callback(this);
						}, this), 
					tap_delay);
			});
			this.on("touchmove", subelem, function(){
				clearTimeout(delay);
				$(this).removeClass("active");
			});
		}
	// }
};


function downloadFile(url, fileName){
	console.log("Downloading file: " + fileName + " at " + url);
	function downloadFail(error){
		console.log(JSON.stringify(error));
	}
    var remoteFile = url;
    var localFileName = fileName;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
        fileSystem.root.getFile(localFileName, {create: true, exclusive: false}, function(fileEntry) {
            var localPath = fileEntry.fullPath;
            if (device.platform === "Android" && localPath.indexOf("file://") === 0) {
                localPath = localPath.substring(7);
            }
            var ft = new FileTransfer();
            ft.download(remoteFile, localPath, function(entry) {
                    // var dwnldImg = document.getElementById("dwnldImg");
                    // dwnldImg.src = entry.fullPath;
                    // dwnldImg.style.visibility = "visible";
                    // dwnldImg.style.display = "block";
                    console.log("FilePath: " + entry.fullPath);
                }, downloadFail);
        }, downloadFail);
    }, downloadFail);
}

String.prototype.contains = function(str){
	return (this.indexOf(str) != -1);
}

String.prototype.startsWith = function(str){
	return this.substr(0,str.length) == str;
}

// Object.prototype.exists = function(key, val){
	// if(val == 'undefined' && this[key] != 'undefined'){
		// return this[key] == val;
	// }else{
		// return this[key] == 'undefined';
	// }
// }

function getPlatform(){
	if(onDesktop()){
		return "Desktop";
	}else if(device.platform == "iPhone Simulator"){
		return "iphone";
	}
	return device.platform.toLowerCase();
}

function isOnPage(page){
	return window.location.href.contains(page);
}

function getFileEntry(uri,success){
	window.resolveLocalFileSystemURI(uri, success, function(error){
		console.log(JSON.stringify(error,null,2));
	});
}

function getMedia(camera, video, onSuccess, onUploadError, onUploadSuccess, onUploadProgress){
	console.log("getting media, using camera: " + camera + ", getting video: " + video);
	// if camera == true, then source is camera, else source is PHOTOLIBRARY
	hideAllModals();
	if(onDesktop()){
		onSuccess("images/tulips.jpg");
		setTimeout(function(){
			onUploadSuccess({
				"MediaItemId":"A600DF0C8F0D4D6290F04EDF698701D6",
				"Url":"images/tulips.jpg",
				"MediaType":1,
				"FileName":"tulips",
				"FileExtension":".jpg",
				"ErrorCode":0,
				"ErrorMessage":""
			});
		}, 3000);
	}else{
		var source = camera ? navigator.camera.PictureSourceType.CAMERA : navigator.camera.PictureSourceType.PHOTOLIBRARY;
		var videoMime = getPlatform() == "iphone" ? "video/quicktime" : "video/mp4";
		var media = video ? Camera.MediaType.VIDEO : Camera.MediaType.PICTURE;
		var ext = video ? (getPlatform() == "iphone" ? ".mov" : ".mp4") : ".jpg";
		function onGetSuccess(imageUri){
            onSuccess(video ? "images/video-file.png" : imageUri);
			var options = new FileUploadOptions();
			options.fileName = getPlatform() + "_" + new Date().stamp() + ext;
			options.mimeType = video ? videoMime : "image/jpeg";
			options.fileKey = "file";
			options.chunkedMode = true;
			var ft = new FileTransfer();
            if(onUploadProgress){
                ft.onprogress = function(e){
                    if(e.lengthComputable){
                        onUploadProgress(e.loaded, e.total);
                    }
                };
            }
			ft.upload(imageUri, encodeURI(apiPath('media')), function(r){
				var obj = jQuery.parseJSON(decodeURIComponent(r.response));
				obj.Extension = obj.FileExtension;
				onUploadSuccess(obj);
			}, 
			function(error) {
				var text = "An error occured while ";
				switch(error.code){
					case FileTransferError.FILE_NOT_FOUND_ERR:
						text += " accessing the media file on your device.";
						break;
					case FileTransferError.INVALID_URL_ERR:
						text += " accessing the media file on your device.";
						break;
					case FileTransferError.CONNECTION_ERR:
						text += "connecting to our servers to upload your media file.";
						break;
				}
				aoAlert(text + " Please try again.","Media Upload Error");
				console.log("Upload Error: " + JSON.stringify(error));
				hideAllModals();
				onUploadError(error);
			}, options, false);
		}
		function onGetError(message){
			if(message == "Camera cancelled." || message == "no image selected"){
				hideAllModals();
			}else{
				aoAlert("We were unable to locate your photo for the following reason: "+message+"\n\nPlease try again.","Oops..");
				hideAllModals();
			}
		}
		var params = {
			quality: photo_quality,
			destinationType: navigator.camera.DestinationType.FILE_URI,
			sourceType: source,
			correctOrientation: true,
			mediaType: media
		};
		navigator.camera.getPicture(onGetSuccess, onGetError, params);
	}
}

function pressed(elem){
	$(elem).find(".fade-to-white").toggle();
	$(elem).toggleClass("pressed");
}

jQuery.fn.press = function(subelem, callback) {
	if(typeof device === 'undefined'){
		if(isBlank(subelem)){
			$(this).on("click",function(){
				callback(this);
			});
		}else{
			$(this).on("click",subelem,function(){
				callback(this);
			});
		}
	}else{
		if(isBlank(subelem)){
			$(this).on("touchstart",function(){
				// navigator.notification.vibrate(tap_vibrate);
				pressed(this);
			});
			$(this).on("touchmove",function(){
				pressed(this);
			});
			$(this).on("touchend",function(){
				callback(this);
			});
		}else{
			$(this).on("touchstart",subelem,function(){
				// navigator.notification.vibrate(tap_vibrate);
				pressed(this);
			});
			$(this).on("touchmove",subelem,function(){
				pressed(this);
			});
			$(this).on("touchend",subelem,function(){
				callback(this);
			});
		}
	}
};

jQuery.fn.tap = function(subelem, feedback, callback) {
	// feedback is the function that will provide immediate visual feedback
	// callback is the function that will happen on the touchend event
	if(isBlank(feedback)){
		feedback = pressed;
	}
	if(typeof device === 'undefined'){
		if(isBlank(subelem)){
			$(this).on("click",function(){
				callback(this);
			});
		}else{
			$(this).on("click",subelem,function(){
				callback(this);
			});
		}
	}else{
		if(isBlank(subelem)){
			$(this).on("touchstart",function(){
				// navigator.notification.vibrate(tap_vibrate);
				feedback(this);
			});
			$(this).on("touchmove",function(){
				feedback(this);
			});
			$(this).on("touchend",function(){
				callback(this);
			});
		}else{
			$(this).on("touchstart",subelem,function(){
				// navigator.notification.vibrate(tap_vibrate);
				feedback(this);
			});
			$(this).on("touchmove",subelem,function(){
				feedback(this);
			});
			$(this).on("touchend",subelem,function(){
				callback(this);
			});
		}
	}
};

Date.prototype.stamp = function(){
	var date = "" + (this.getMonth()+1) + this.getDate() + this.getFullYear();
	return date + this.getHours() + this.getMinutes() + this.getSeconds();
}

String.prototype.noSpaces = function(){
    return this.replace(/\s/g, '');
}

String.prototype.capitalize = function(delim){
	//Will capitalize all words in any string
	//Ex: "hello world".capitalize() -> "Hello World"
	if(arguments.length == 0){
		delim = ' ';
	}
	var words = this.split(delim);
	for(var i=0; i<words.length; i++){
		var chars = words[i].split('');
		if(chars.length > 0){
			chars[0] = chars[0].toUpperCase();
			words[i] = chars.join('');
		}
	}
	return words.join(' ');
}

function checkLimits(){
	aoStore.set("managed_limit_status","far");
	aoStore.set("item_limit_status","far");
	aoStore.set("media_limit_status","far");
    //{"Proximity":"Far","Limit":6,"Actual":0,"ErrorCode":0,"ErrorMessage":"","Duration":null}
//	apiGet(apiPath('contact/managedlimit'), {}, function(json) {
//		console.log("MANAGED LIMIT: "+JSON.stringify(json));
//		$.jStorage.set("managed_limit_status",json.Proximity.toLowerCase());
//		displayLimitAlert(json.Proximity.toLowerCase(),"managed");
//	});
//	apiGet(apiPath('item/limit'), {}, function(json) {
//		console.log("ITEM LIMIT: "+JSON.stringify(json));
//		$.jStorage.set("item_limit_status",json.Proximity.toLowerCase());
//		displayLimitAlert(json.Proximity.toLowerCase(),"items");
//	});
//	apiGet(apiPath('media/limit'), {}, function(json) {
//		console.log("DATA LIMIT: "+JSON.stringify(json));
//		$.jStorage.set("media_limit_status",json.Proximity.toLowerCase());
//		displayLimitAlert(json.Proximity.toLowerCase(),"media");
//	});
//	function displayLimitAlert(flag,type){
//		if(flag == "over" || flag == "near"){
//			var text = "You ";
//			switch(flag){
//				case "over":
//					text += "have exceeded";
//					break;
//				case "near":
//					text += "are nearing";
//					break;
//			}
//			text += " the limitations of your free account.  Free accounts only permit you to have ";
//			switch(type){
//				case "managed":
//					text += "6 managed contacts.";
//					break;
//				case "items":
//					text += "100 entries.";
//					break;
//			}
//			text += "  To upgrade your account, please visit AboutOne.com and sign in to view your pricing options.";
//			aoAlert(text,"Upgrade Your Account");
//		}
//	}
}

var aoHistory = aoHistory || {};
aoHistory = (function(){
	function refreshHistory(){
		var stak = $.jStorage.get("history_stack");
		return stak ? stak : [];
	}
	var stack = refreshHistory();
	var blacklist = ["login.html","intro-wizard.html","quick-add.html",
		"offline-access.html","change-pin.html","view-pdf.html"];
	function isBlacklisted(page){
		return blacklist.indexOf(page) != -1;
	}
	function popFromStack(){
		if(stack && stack.length > 0){
			var next = stack.pop();
			$.jStorage.set("history_stack",stack);
			return next;
		}
	}
	function getPage(url){
		//extract .html file name from the url
		return url.substring(url.lastIndexOf('/')+1,url.length);
	}
	function addToStack(url){
		var page = getPage(url);
		//if okay to add, then add the page to the stack
		if(!isBlacklisted(page) && stack[stack.length-1] != page){
			stack.push(page);
			$.jStorage.set("history_stack",stack);
		}
	}
	return {
		back: function(){
			var backpage = popFromStack();
			if(isBlank(backpage)){backpage = "index.html";}
			while(isBlacklisted(backpage) || getPage(window.location.href) == backpage){
				// just makes sure we're not going back to the current page
				backpage = popFromStack();
				if(isBlank(backpage)){backpage = "index.html";break;}
			}
			window.location.href = backpage;
		},
		save: function(){
			addToStack(window.location.href);
		},
		count: function(){
			if(stack[stack.length-1] == getPage(window.location.href)){
				return stack.length - 1;
			}else{
				return stack.length;
			}
		},
		print: function(){
			return stack.toString();
		},
		blacklisted: function(){
			return isBlacklisted(window.location.href);
		},
		refresh: function(){
			stack = refreshHistory();
		}
	}
})();

var aoStore = aoStore || {};
aoStore = (function() {
	function Set(key, val){
		if(typeof(val) == 'object'){
			val = JSON.stringify(val);
		}
		localStorage[key] = val;
	}
	function KeyExists(key){
		return !isBlank(localStorage[key]);
	}
	function Get(key){
		var result = localStorage[key];
		try{
			result = JSON.parse(result);
		}catch(e){}
		return result;
	}
	function Delete(key){
		localStorage.removeItem(key);
	}
	function getAll(){
		var keys = [];
		for(var i=0; i<localStorage.length; i++) {
		    var key = localStorage.key(i);
		    var value = localStorage[key];
		    keys.push({key: value});
		}
		return keys;
	}
	function getCache(key){
		var result = localStorage["aostore_cache"];
		if(isBlank(result)){
			result = {};
		}else{
			result = JSON.parse(result)[key];
			try{
				result = JSON.parse(result);
			}catch(e){}
		}
		return result;
	}
	function setCache(key,val){
		if(typeof(val) == 'object'){
			val = JSON.stringify(val);
		}
		var result = localStorage["aostore_cache"];
		localStorage[key] = val;
	}
	
	return {
		set: function(key, val){
			Set(key,val);
		},
		get: function(key){
			return Get(key);
		},
		del: function(key){
			Delete(key);
		},
		all: function(){
			return getAll();
		},
		exists: function(key){
			KeyExists(key);
		},
		getCache: function(key){
			return Get("aostore_cache")[key];
		},
		setCache: function(key,val){
			var temp = Get("aostore_cache");
			temp[key] = val;
			Set("aostore_cache",temp);
		}
	}
})();








// THIS HIDES THE BOTTOM FOOTER WHEN THE KEYBOARD IS VISIBLE
$("input").live("focus", function(){
	$(".footer-nav").hide();
});
$("input").live("blur", function(){
	$(".footer-nav").show();
});
$("textarea").live("focus", function(){
	$(".footer-nav").hide();
});
$("textarea").live("blur", function(){
	$(".footer-nav").show();
});
// $("#back-btn").live("click", function(e){
	// e.preventDefault();
	// var href = $(this).attr("href");
	// console.log(href);
	// if(isBlank(href) || href == "#"){
		// handleBackButton();
	// }else{
		// window.location.href = href;
	// }
// });

if(!isOnPage("login.html") && !isOnPage("offline-access.html")){
	setInterval( function(){isLoggedIn();}, login_check_interval); // check if logged in every X minutes
}

showIntroWizard();



function getBase64Image(img) {
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL("image/jpg");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

function chunkString(str){
    return String(str).match(/.{1,2}/g);
}


