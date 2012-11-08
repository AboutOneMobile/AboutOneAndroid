var AO = AO || {};

/**
 @namespace Used for storing and retrieving data from <code>localStorage</code>
 */
AO.store = AO.store || {};
AO.store = (function() {
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

/**
 @namespace Used for tracking history and backward navigation
 */
AO.history = AO.history || {};
AO.history = (function(){
	function refreshHistory(){
		var stak = AO.store.get("history_stack");
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
			AO.store.set("history_stack",stack);
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
			AO.store.set("history_stack",stack);
		}
	}
	return {
        /**
         * Gets the next page off the history stack and sends the user to that page
         */
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
        /**
         * Adds the current page to the history array
         */
		save: function(){
			addToStack(window.location.href);
		},
        /**
         * Returns the number of pages in the history array
         * @return {number}
         */
		count: function(){
			if(stack[stack.length-1] == getPage(window.location.href)){
				return stack.length - 1;
			}else{
				return stack.length;
			}
		},
        /**
         * Returns a string representation of the history
         * @return {String}
         */
		print: function(){
			return stack.toString();
		},
        /**
         *
         * @return {*}
         */
		blacklisted: function(){
			return isBlacklisted(window.location.href);
		},
        /**
         * Refreshes the history array from the local cache
         */
		refresh: function(){
			stack = refreshHistory();
		}
	}
})();

/**
 @namespace Contains basic utility functions for the app
 */
AO.util = AO.util || {};
AO.util = (function() {
    var util = {};
    util.platforms = {IOS: "ios", ANDROID: "android", DESKTOP: "desktop"};
    util.alert = function(message, title, func, buttonName){
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
    util.confirm = function(callback, message, title, btns){
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
            }
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
    util.onDesktop = function(){
        return window.location.href.indexOf('localhost:8888') != -1;
    }
    util.platform = function(){
        if(util.onDesktop()){
            return util.platforms.DESKTOP;
        }else if(device.platform == "iPhone Simulator"){
            switch(device.platform.toLowerCase()){
                case "iphone simulator":
                case "iphone":
                case "ipad":
                case "ipod":
                    return util.platforms.IOS;
                default:
                    return util.platforms.ANDROID;
            }
        }
    }
    util.log = function(str, message){
        if(message){
            console.log(message);
        }
        if(typeof(str) == "object"){
            console.log(JSON.stringify(str,null,2));
        }else{
            console.log(str);
        }
    }
	
	
	return util;
})();


/**
 @namespace Holds configuration settings
 */
AO.config = AO.config || {};
AO.config = (function() {
	var config = {};
	
	//config.api_host = "https://dev.go.aboutone.com:8080";  //DEV
	//config.api_host = "https://qa.go.aboutone.com:8080"; //QA
	config.api_host = "https://go.aboutone.com:8080"; //PROD
	

	config.release_date = "Oct 11, 2012";
	config.release_version = "0.1.15";
	config.tap_delay = 200; // # of ms to delay until touchend is called on tap/touch event
	config.feedback_prompt_interval = 10;
	config.photo_quality = 100; // quality of uploaded photos (as a % of original quality)
	config.max_stream_length = 25; // maximum number of stream items to load
	config.login_check_interval = 300000; // # of ms to wait between checks for isLoggedIn()
	
	return config;
})();


/**
 * @namespace Contains functions used for connecting to the API
 */
AO.api = AO.api || {};
AO.api = (function() {
    var api = {};
//    var api_host = "https://dev.go.aboutone.com:8080";  //DEV
//    var api_host = "https://qa.go.aboutone.com:8080"; //QA
    var api_host = "https://go.aboutone.com:8080"; //PROD
    var application_key = "E2A58EF3A47141BFB10B6B1147EB706E"; //Testing key
	function basePath(method){
		return api_host + "/10/" + method + "?applicationKey=" + application_key;
	}

    function authToken(auth_token, ttl) {
        if(isBlank(auth_token)){
            var auth_token = AO.store.get("auth_token");
            if(isBlank(auth_token)) {
                sendClientToLoginPage();
            } else {
                //reset the TTL on the authtoken
                AO.store.set("auth_token", auth_token);
                // $.jStorage.setTTL("auth_token", 3600000); // 3600000 ms = 1 hr
                // $.jStorage.setTTL("auth_token", 259200000); // 259200000 ms = 3 days
                return auth_token;
            }
        } else {
            AO.store.set("auth_token", auth_token);
            // $.jStorage.setTTL("auth_token", 3600000); // 3600000 ms = 1 hr
            // $.jStorage.setTTL("auth_token", 259200000); // 259200000 ms = 3 days
        }
    }
    api.appKey = function(key){
        return application_key;
        if(isBlank(key)){
            return application_key;
        }else{
            application_key = key;
        }
    }
    api.host = function(host) {
        if(isBlank(host)){
            return api_host;
        }else{
            api_host = host;
        }
    }
	api.path = function(method){
		return basePath(method) + "&authToken=" + authToken() + "&cache=" + new Date().getTime();
	}
    api.client = function() {
        return ( typeof device != "undefined") ? device.uuid : "1234567890";
    }



	

	
	function apiCall(api_path, post_params, callback_function, method) {
		if(checkConnection()){ //check to make sure the user has an internet connection
			if(method === undefined) {
				method = "GET";
			}
			$.ajax({
				"type" : method,
				"dataType" : "json",
				"contentType" : "application/json; charset=utf-8",
				"accepts" : "json",
				"url" : api_path,
				"data" : (post_params !== "undefined") ? JSON.stringify(post_params) : "",
				"success" : function(resp) {
					apiCallSuccess(callback_function, resp);
				},
				"error": function(resp){
					apiCallError(resp, api_path);
				}
			});
			
		}else{
			hideLoading();
			hideAllModals();
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
	
	
	function apiCallSuccess(callback_function, jqXHR) {
		if(jqXHR.ErrorCode == 0) {
			callback_function(jqXHR);
		}else {
			console.log("Server response indicated an error");
			console.log(JSON.stringify(jqXHR));
			displayError(jqXHR.ErrorCode, jqXHR.ErrorMessage);
			hideLoading();
			hideAllModals();
		}
	}
	
	function apiCallError(resp, path){
		var errorText = "";
		var exception = "";
		if (resp.status == 0) {
	        errorText = 'Not connected! Verify Network. [Code 0]';
	    } else if (resp.status == 404) {
	        errorText = 'The page you requested was not found. [Code 404]';
	    } else if (resp.status == 500) {
	        errorText = 'An internal server error occurred. [Code 500].';
	    } else {
	        errorText = 'An unknown error occured [Code ' + resp.status + ']';
	    }
	    if(resp.status != 0){
	    	aoAlert("There was a problem processing your request. "+errorText+"\n\nPlease try again.","Connection Error");
	    }
	    console.log("API SERVER ERROR: '" + errorText + "' for path: " + path);
	    hideAllModals();
	}
	
	return {
        /**
         * AJAX call using GET verb
         * @param {string} path URL to call the api
         * @param {function} success onSuccess function
         */
		get: function(path, success){
            apiCall(path, undefined, success, "GET");
        },
        /**
         * AJAX call using PUT verb
         * @param {string} path URL to call the api
         * @param {object} params object used as the payload for the ajax call
         * @param {function} success onSuccess callback
         */
		put: function(path, params, success){
			apiCall(path, params, success, "PUT");
		},
        /**
         * AJAX call using POST verb
         * @param {string} path URL to call the api
         * @param {object} params object used as the payload for the ajax call
         * @param {function} success onSuccess callback
         */
		post: function(path, params, success){
			apiCall(path, params, success, "POST");
		},
        /**
         * AJAX call using DELETE verb
         * @param {string} path URL to call the api
         * @param {function} success onSuccess function
         */
		del: function(path, success){
			apiCall(path, undefined, success, "DELETE");
		},
        /**
         * Returns a properly formatted URL for calling the API
         * @param method the shortened portion of the URL to be inserted
         * @return {string}
         */
        path: function(method){
            return apiPath(method);
        },
        /**
         * Returns the authToken if the param is blank, or saves it if it provided
         * @param {string} token
         * @return {string}
         */
        auth: function(token){
            return authToken(token);
        },
		host: apiHost
	}
})();

/**
 * @namespace {Object} Handles gathering and transferring files
 */
AO.file = AO.file || {};
AO.file = (function() {
    var file = {};
    function newOptions(video){
        var ext = video ? ((AO.util.platform() == AO.util.platforms.IOS) ? ".mov" : ".mp4") : ".jpg";
        var options = new FileUploadOptions();
        options.fileName = AO.util.platform() + "_" + new Date().getTime() + ext;
        options.mimeType = video ? ((AO.util.platform() == AO.util.platforms.IOS) ? "video/quicktime" : "video/mp4") : "image/jpeg";
        options.fileKey = "file";
        options.chunkedMode = true;
        return options;
    }
    file.upload = function(fileUri, apiPath, error, success, video){
        var ft = new FileTransfer();
        ft.upload(imageUri, encodeURI(apiPath), function(r){
            var obj = jQuery.parseJSON(decodeURIComponent(r.response));
            obj.Extension = obj.FileExtension;
            success(obj);
        },
        function(err) {
            var text = "An error occured while ";
            switch(err.code){
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
            AO.util.alert(text + " Please try again.","Media Upload Error");
            AO.util.log(err, "UPLOAD ERROR");
            error(err);
        },newOptions(video));
    }
    return file;
});

/**
 * @namespace {Object} Captures and retrieves media files from the device
 */
AO.media = AO.media || {};
AO.media = (function() {
    var media = {};
    media.source = {CAMERA: navigator.camera.PictureSourceType.CAMERA, ALBUM: navigator.camera.PictureSourceType.PHOTOLIBRARY};
    media.type = {UNKNOWN: 0, IMAGE: 1, DOCUMENT: 2, AUDIO: 3, VIDEO: 4};
    media.mediaItem = {"MediaItemId":"A600DF0C8F0D4D6290F04EDF698701D6","Url":"images/tulips.jpg",
           "MediaType":1,"FileName":"tulips","FileExtension":".jpg","ErrorCode":0,"ErrorMessage":""};
    media.testImage = "images/tulips.jpg";
    media.testVideo = "images/video-file.png";

    media.get = function(source, type, onGetSuccess, onUploadSuccess, onUploadError, format){
        if(!format) format = navigator.camera.DestinationType.FILE_URI;
        if(AO.util.onDesktop()){
            onGetSuccess(media.testImage);
            setTimeout(function(){
                onUploadSuccess(media.mediaItem);
            }, 3000);
        }else{
            function success(imageUri){
                onGetSuccess((type == media.type.VIDEO) ? media.testVideo : imageUri);
                AO.file.upload(imageUri, AO.api.path("media"), onUploadSuccess, onUploadError, (type == media.type.VIDEO));
            }
            function error(message){
                if(message != "Camera cancelled." || message != "no image selected"){
                    AO.util.alert("We were unable to locate your photo for the following reason: "+message+"\n\nPlease try again.","Oops..");
                }
            }
            var params = {
                quality: AO.config.photo_quality,
                destinationType: format,
                sourceType: source,
                correctOrientation: true,
                mediaType: type
            };
            navigator.camera.getPicture(success, error, params);
        }
    }

});