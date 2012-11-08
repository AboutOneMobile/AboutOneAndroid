function onPageReady(){
		console.log("calling login page ready...");
		
		showIntroWizard();
		
		$("#show-signup-form").bind("click",function(e){
			e.preventDefault();
			$("#main-login-form").hide();
			$("#signup-form").show();
			$("#signup-pin1, #signup-pin2").focus(function(){
				$(this).val("");
			});
			$("#signup-pin1").on('keyup',function(){
				if($(this).val().length == 4)
					$("#signup-pin2").focus();
			});
			$("#signup-pin2").on('keyup',function(){
				if($(this).val().length == 4)
					$(this).blur();
			});
			$("#back-icon").show();
		});
		goToPinLogin(false);
		
	};
	
	function submitLoginForm() {
		$("input").blur();
		var email = $('#login-email').val();
		var pass = $('#login-password').val();
		if(!isBlank(email) && !isBlank(pass)){
			console.log("submitting login form...");
			showLoginModal("Logging in...");
			var loginURL = api_host + "/10/Authorize/Username?applicationkey=" + application_key;			
			var post_params = {
				"Username" : email,
				"Password" : pass,
				"ClientIdentifier" : clientIdentifier()
			};			
			apiPost(loginURL, post_params, function(json) {
				if(email != userName()){
					// EMAIL IS NOT SAME AS PREVIOUS LOGIN, GOING TO FLUSH CACHE
					var host = apiHost();
                    var prompt = $.jStorage.get("prompt_for_pin");
					clearLocalStorage();
					setTimeout(
						function(){
							apiHost(host);
							JSConsoleDebug(jsc);
                            $.jStorage.set("just_logged_in", true);
							$.jStorage.set("show_intro_wizard", false);
                            $.jStorage.set("prompt_for_pin", prompt);
						}
					, 1000);
				}
				$.jStorage.set("all_user_data",json);
				userId(json["UserId"]);
				authToken(json["AuthToken"]);
				userName(email);
				$.jStorage.set("show_intro_wizard", false);
                $.jStorage.set("just_logged_in", true);
				hideModal("login-modal");
				goToStream();
				return false;
			}, 'PUT');
		}else{
			aoAlert("Username and password cannot be left blank", "Login Error");
		}
	}

	function submitLoginViaPinForm() {
		console.log("submiting pin...");		
		$('#login-pin').blur();
		var pinNum = $('#login-pin').val().trim();
		console.log("USER TOKEN: " + userToken());
		if(pinNum == userPIN()){
			if(checkConnection()){
			// if(false){
				var loginURL = api_host + "/10/authorize/usertoken?applicationkey=" + application_key;
				showLoginModal("Logging in...");
				var body = {
					"Token" : userToken(),
					"Pin" : pinNum,
					"ClientIdentifier" : clientIdentifier()
				};
				apiPost(loginURL, body, function(json) {
					userId(json["UserId"]);
					authToken(json["AuthToken"]);
	                hideModal("login-modal");
	                $.jStorage.set("just_logged_in", true);
					getNewUserToken(pinNum);
				}, 'PUT');
			}else{
				aoConfirm(
					function(){
						$.jStorage.set("offline_ttl", true);
						$.jStorage.setTTL("offline_ttl", 3600000);
						window.location.href = "offline-access.html";
					},
					"Because you are not connected to the internet, you cannot access your full account at this time.  "+
					"However, you can view your emergency contact list and emergency health information.  "+
					"Would you like to enter Offline Mode?",
					"AboutOne Offline Mode"
				);
			}	
		}else{
			hideModal("login-modal");
			aoAlert("The PIN you entered is incorrect.","PIN Login Error");
		}
	}

	function submitSignUpForm() {
		window.scrollTo(0,0);
		$("input").blur();
		showLoginModal("Creating your account...");
		var signUpURL = api_host + "/10/user?applicationkey=" + application_key;
		$("#login-alert-text").text("");
		$("#login-alert").hide();
		
		var errors = 0;
		var createdPIN = false;
		
		var first = $("#signup-first-name").val().trim();
		var last = $("#signup-last-name").val().trim();
		var email = $("#signup-email").val().trim();
		var pass1 = $("#signup-password1").val().trim();
		var pass2 = $("#signup-password2").val().trim();
		var pin1 = $("#signup-pin1").val().trim();
		var pin2 = $("#signup-pin2").val().trim();
		
		if(isBlank(first)){
			errors++;
			$("#signup-first-control").addClass("error");
			$("#login-alert-text").append("First name cannot be blank.<br>");
		}if(isBlank(last)){
			errors++;
			$("#signup-last-control").addClass("error");
			$("#login-alert-text").append("Last name cannot be blank.<br>");
		}if(isBlank(email)){
			errors++;
			$("#signup-email-control").addClass("error");
			$("#login-alert-text").append("Your email will be used as your username and cannot be left blank.<br>");
		}else{
			var patt1 = new RegExp("@"); //make sure that email string includes an '@' symbol
			if(!patt1.test(email)){
				errors++;
				$("#signup-email-control").addClass("error");
				$("#login-alert-text").append("You must use a valid email address.<br>");
			}
		}
		if(isBlank(pass1)){
			errors++;
			$("#signup-password1-control").addClass("error");
			$("#login-alert-text").append("Password is blank.<br>");
		}if(isBlank(pass2)){
			errors++;
			$("#signup-password2-control").addClass("error");
			$("#login-alert-text").append("Password verification is blank.<br>");
		}if(pass1 != pass2){
			errors++;
			$("#signup-password1-control").addClass("error");
			$("#signup-password2-control").addClass("error");
			$("#login-alert-text").append("Passwords do not match.<br>");
		}if(pass1.length < 4){
			errors++;
			$("#signup-password1-control").addClass("error");
			$("#signup-password2-control").addClass("error");
			$("#login-alert-text").append("Password must be at least 4 characters long.<br>");
		}
		if(!isBlank(pin1)){
			if(pin1 == pin2 && pin1.length == 4){
				createdPIN = true;
			}else{
				if(pin1.length != 4){
					errors++;
                    $("#signup-pin1-control").addClass("error");
					$("#signup-pin2-control").addClass("error");
					$("#login-alert-text").append("PIN must be exactly 4 characters long.<br>");
				}if(pin1 != pin2){
					errors++;
					$("#signup-pin1-control").addClass("error");
					$("#signup-pin2-control").addClass("error");
					$("#login-alert-text").append("PIN numbers do not match.<br>");
				}
			}
		}
		if(errors > 0){
			showAlert(errors);
			hideModal("login-modal");
		}else{
			var post_params = {
				"Username" : email,
				"FirstName" : first,
				"LastName" : last,
				"Pin" : pin1,
				"Password" : pass1,
				"ClientIdentifier" : clientIdentifier()
			};
			
			apiPost(signUpURL, post_params, function(json) {
				userName(email);
				userId(json["UserId"]);
				authToken(json["AuthToken"]);
                $.jStorage.set("just_logged_in", true);
                $.jStorage.deleteKey("_family_contacts_json");
				if(createdPIN){
					userPIN(pin1);
					hideModal("login-modal");
					getNewUserToken(pin1);
				}else{
					hideModal("login-modal");
					goToStream();
				}
			},"PUT");
		}
	};
	
	function goToMainLogin(){
		$("#signup-form").hide();
		$("#pin-login-form").hide();
		$("#change-environment-form").hide();
		$("#main-login-form").show();
		$("#back-icon").hide();
	};
	
	function goToPinLogin(clicked){
		if(hasUserPIN()){
			$("#signup-form").hide();
			$("#main-login-form").hide();
			$("#pin-login-form").show();
			$("#login-pin").on('keyup',function(){
				var val = $(this).val();
				if(val.length == 4){
					submitLoginViaPinForm();
				}
			});
		}
	}
	
	function showAlert(errorCount){
		if(errorCount > 0){
			if(errorCount == 1){
				$("#alert-heading").text("There was a problem...");
			}else{
				$("#alert-heading").text("There were "+errorCount+" problems...");
			}
			$("#login-alert").show();
			$("#login-alert-close").bind("click",function(e){
				e.preventDefault();
				$("#login-alert").hide();
			});
			hideLoading();
			window.scrollTo(25, 0); // scroll to the top to see the alert
		}
	}
	
	function fillInUsername(){
		
	}
	
	function showLoginModal(text){
		$("#login-modal-text").text(text);
		showModal("login-modal");
	}