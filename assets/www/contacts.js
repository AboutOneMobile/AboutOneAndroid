var importInterval;

function onPageReady(){
	
	isLoggedIn();
	
	loadManagedContacts();
	loadContactGroups();
	getEmergencyContacts();
	var contactList = $.jStorage.get('contact_list_array');
	if(!isBlank(contactList)){
		$("#all-count").text(contactList.length);
	}
	
	var btnList = "#family-btn,#groups-btn,#emergency-btn,#all-contacts-btn,#import-btn,#new-contact-btn";
	$(btnList).on("touchstart", function(){
		$(this).find(".fade-to-white").hide();
		$(this).addClass("pressed");
	});
	$(btnList).on("touchmove", function(){
		$(this).find(".fade-to-white").show();
		$(this).removeClass("pressed");
	});
	$(btnList).on("click", function(e){
		e.preventDefault();
		var rel = $(this).attr("rel");
		eval(rel);
	});
	
	if($.jStorage.get("_currently_importing_contacts") == true){
		$("#import-btn").hide();
        $("#import-progress-btn").show();
	}
	
	
} //End of onPageReady

function loadContact(contactId) {
	// showLoading();
	if(isBlank(contactId)){
		alert("contact id is blank!");
	}
	apiGet(apiPath('contact/' + contactId), {}, function(json) {
		if(!isBlank(json.Contact.AvatarId)){
			json.Contact.AvatarUrl = avatarUrl(json.Contact.AvatarId, 400);
		}
		$.jStorage.set("_current_contact_json",json.Contact);
		console.log("contact json:");
		console.log(JSON.stringify(json.Contact));
		console.log(json.Contact);
		// hideLoading();
		window.location.href = "contacts-detail.html";
	});
}

jQuery.fn.unbindAll = function(){
	$(this).unbind('touchstart');
	$(this).unbind('touchend');
	$(this).unbind('click');
}

function getEmergencyContacts(){
	var emergency = $.jStorage.get("_emergency_contacts_json");
	if(isBlank(emergency)){
		apiGet(apiPath("contact/emergency"), {}, function(json) {
			if(json.Contacts.length > 0){
				$.each(json.Contacts, function(i, contact){
					if(!isBlank(contact.AvatarId)){
						contact.AvatarUrl = avatarUrl(contact.AvatarId)+"&square=80";
					}
				});
				$.jStorage.set("_emergency_contacts_json",json);
				$("#emergency-text").html("You have " + json.Contacts.length + " emergency contacts");
			}else{
				$("#emergency-btn").unbindAll();
				$("#emergency-text").html("You have no emergency contacts");
			}
		});
	}else{
		if(emergency.Contacts.length > 0){
			$("#emergency-text").html("You have " + emergency.Contacts.length + " emergency contacts");
		}else{
			$("#emergency-btn").unbindAll();
			$("#emergency-text").html("You have no emergency contacts");
		}
	}
}

function loadManagedContacts(){
	var managed = $.jStorage.get("_managed_contacts_json");
	if(isBlank(managed)){
		apiGet(apiPath("contact/manage"), {}, function(json) {
			if(json.Contacts.length > 0){
				$.each(json.Contacts, function(i, contact){
					if(!isBlank(contact.AvatarId)){
						contact.AvatarUrl = avatarUrl(contact.AvatarId)+"&square=80";
					}
				});
				$.jStorage.set("_managed_contacts_json",json);
				$("#family-text").html("You have " + json.Contacts.length + " managed contacts");
			}else{
				$("#family-btn").unbindAll();
				$("#family-text").html("Tap here to add family contacts");
			}
		});
	}else{
		if(managed.Contacts.length > 0){
			$("#family-text").html("You have " + managed.Contacts.length + " managed contacts");
		}else{
			$("#family-btn").unbindAll();
			$("#family-text").html("Tap here to add family contacts");
		}
	}
}

function loadContactGroups(){
	var groups = $.jStorage.get("_contact_groups_json");
	if(isBlank(groups)){
		apiGet(apiPath("group/list"), {}, function(json) {
			$.jStorage.set("_contact_groups_json", json);
			if(json.Groups.length > 0){
				$("#group-text").html("You have " + json.Groups.length + " contact groups");
			}else{
				$("#group-btn").unbindAll();
				$("#group-count").html("Visit AboutOne.com to add contact groups");;
			}
		});
	}else{
		if(groups.Groups.length > 0){
			$("#group-text").html("You have " + groups.Groups.length + " contact groups");
		}else{
			$("#group-btn").unbindAll();
			$("#group-text").html("Visit AboutOne.com to add contact groups");
		}
	}
}

function loadContactGroup(id){
	apiGet(apiPath("group/"+id+"/members"), {}, function(json) {
		console.log("group members");
		console.log(json);
		if(!isBlank(json.Group.AvatarUrl)){
			json.Group.AvatarUrl += appendKeyAndToken() + "&square=80";
		}
		$("#groupName").text(json.Group.Name);
		$('#group-members-content').html($('#groupMembersTemplate').render(json.Group));
		window.location.href = "#group-members-page";
		hideLoading();
	});
}

function showFamilyGrid(){
	window.location.href = "contacts-family.html";
}

function showGroupsGrid(){
	window.location.href = "contacts-groups.html";
}

function showEmergencyGrid(){
	window.location.href = "contacts-emergency.html";
}

function goToImportContacts(){
	if($.jStorage.get("_currently_importing_contacts") == true){
		showImportProgressModal();
	}else{
		window.location.href = "contacts-import.html";
	}
}
function showAllContacts(){
	window.location.href = "contacts-all.html";
}
function addNewContact(){
	console.log("addNewContact");
	window.location.href = "contacts-add.html";
}




