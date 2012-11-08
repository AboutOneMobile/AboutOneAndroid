function filterContacts(){
	return true;
}


function contactList(callback_function) {
	var contact_list = $.jStorage.get('contact_list_data');
	if(isBlank(contact_list)) {
		refreshContactList();
		setTimeout(loadContacts,3000);
	} else {
		//console.log('using cached contact list');
		callback_function(contact_list.Contacts.filter(filterContacts));
	}
}

function clearCachedContactList() {
	$.jStorage.deleteKey('contact_list');
	clearCachedContactListHTML();
}

function loadContacts() {
	showLoading();
	var htmllist = $.jStorage.get('contact_list_cached_html');
	if(isBlank(htmllist)){
		$("#contact-list").empty();
		contactList(function(contacts) {
			var listhtml = "";
			if(contacts.length == 0) {
				listhtml += $('#contactListEmptyTemplate').render();
			} else {
				listhtml += $('#contactManagedTemplate').render();
				listhtml += $('#contactGroupsTemplate').render();
				listhtml += $('#contactEmergencyTemplate').render();
				var last_letter = "";
				$.each(contacts, function(index, contact) {
					if((isBlank(contact.LastName) || isBlank(contact.FirstName) || !isNaN(contact.LastName.substr(0,1))) && index == 0){
						listhtml += $('#contactListDividerTemplate').render({"Letter" : "First Name Only"});
					}else if(isBlank(contact.LastName) || !isNaN(contact.LastName.substr(0,1)) ){
						listhtml += $('#contactListEntryTemplate').render(contact);
					}else{
						var letter = (contact.LastName).substr(0, 1).toUpperCase();
						if(letter != last_letter) {
							last_letter = letter;
							listhtml += $('#contactListDividerTemplate').render({"Letter" : last_letter});
						}
						listhtml += $('#contactListEntryTemplate').render(contact);
					}
				});
				$("#contact-list").html(listhtml);
				console.log("storing the new cached contact list html");
				$.jStorage.set('contact_list_cached_html', listhtml);
				$("#contact-list").listview('refresh');
			}
			hideLoading();
		});
	}else{
		console.log('using cached html contacts list');
		$("#contact-list").html(htmllist);
		$("#contact-list").listview('refresh');
		hideLoading();
	}
	
}

function loadContact(contactId) {
	$('#contact-detail-name').text('Loading');
	showLoading();
	if(isBlank(contactId)){
		alert("contact id is blank!");
	}
	apiGet(apiPath('contact/' + contactId), {}, function(json) {
		if(!isBlank(json.Contact.AvatarUrl)){
			json["Contact"].AvatarUrl += appendKeyAndToken()+"&square=90";
		}
		$.jStorage.set("_current_contact_json",json.Contact);
		console.log("contact json:");
		console.log(json.Contact);
		$('#contact-detail').html($('#contactDetailTemplate').render(json.Contact)).trigger("create");
		$('#contact-detail-name').text(json.Contact.FirstName+" "+json.Contact.LastName);
		hideLoading();
	});
}

function loadContactForEditing(contactId){
	showLoading();
	apiGet(apiPath('contact/' + contactId), {}, function(json) {
		$.jStorage.set("_current_contact_json",json["Contact"]);
		if(!isBlank(json.Contact.AvatarUrl)){
			json["Contact"].AvatarUrl += appendKeyAndToken();
		}
		$('#contact-edit').html($('#contactEditTemplate').render(json["Contact"])).trigger("create");
		$('#updateContactFooter').bind("click",submitUpdateContactForm);
		$('#deleteContactFooter').bind("click",deleteContact);
		hideLoading();
	});
}

function getEmergencyContacts(){
	showLoading();
	// var path = apiPath("contact/emergency");
	var path = "https://dev.go.aboutone.com:8080/10/contact/emergency"+appendKeyAndToken();
	apiGet(path, {}, function(json) {
		$.each(json.Contacts, function(index,contact){
			if(!isBlank(contact.AvatarUrl)){
				contact.AvatarUrl += appendKeyAndToken() + "&square=75";
			}else if(!isBlank(contact.AvatarId)){
				contact.AvatarUrl = avatarUrl(contact.AvatarId) + "&square=75";
			}
		});
		$('#emergency-list-content').html($('#managedListTemplate').render(json)).trigger("create");
		window.location.href = "#emergency-list-page";
		hideLoading();
	});
}

function loadManagedContacts(){
	apiGet(apiPath("contact/manage"), {}, function(json) {
		console.log("managed contacts:");
		console.log(json);
		$.each(json.Contacts, function(index,contact){
			if(!isBlank(contact.AvatarUrl)){
				contact.AvatarUrl += appendKeyAndToken() + "&square=75";
			}else if(!isBlank(contact.AvatarId)){
				contact.AvatarUrl = avatarUrl(contact.AvatarId) + "&square=75";
			}
		});
		$('#managed-list-content').html($('#managedListTemplate').render(json)).trigger("create");
		window.location.href = "#managed-list-page";
	});
}

function loadContactGroups(){
	showLoading();
	apiGet(apiPath("group/list"), {}, function(json) {
		console.log("group list");
		console.log(json);
		$.each(json.Groups, function(index,group){
			if(!isBlank(group.AvatarUrl)){
				group.AvatarUrl += appendKeyAndToken() + "&square=75";
			}
			if(group.MemberCount == 0){
				group.MemberCount = 999;
			}
		});
		$('#group-list-content').html($('#groupListTemplate').render(json));
		window.location.href = "#group-list-page";
		hideLoading();
	});
}

function loadContactGroup(id){
	apiGet(apiPath("group/"+id+"/members"), {}, function(json) {
		console.log("group members");
		console.log(json);
		if(!isBlank(json.Group.AvatarUrl)){
			json.Group.AvatarUrl += appendKeyAndToken() + "&square=75";
		}
		if(json.Group.Emails.length > 0){
			json.Group.Email = json.Group.Emails[0].Email;
		}
		if(json.Group.Phones.length > 0){
			json.Group.Phone = json.Group.Phones[0].Phone;
		}
		$("#groupName").text(json.Group.Name);
		$('#group-members-content').html($('#groupMembersTemplate').render(json.Group));
		window.location.href = "#group-members-page";
		hideLoading();
	});
}

function showContactInfo(id){
	loadContact(id);
	window.location.href = "#contact-detail-page";
}

function getContactNotes(){
	showLoading();
	var contact = $.jStorage.get("_current_contact_json");
	apiGet(apiPath("contact/"+contact.ContactId+"/Note"), {}, function(json) {
		var notes = json.Notes;
		for(var i=0; i<notes.length; i++){
			var date = getDate(notes[i].Timestamp);
			notes[i].Timestamp = formatDate(date).Short;
		}
		contact.TodayDate = formatDate(new Date()).Short;
		contact.Notes = notes;
		$('#contact-notes-content').html($('#contactNotesTemplate').render(contact)).trigger("create");
		window.location.href = "#contact-notes-page";
		hideLoading();
	});
}

function saveNewNote(){
	var contactId = $.jStorage.get("_current_contact_json").ContactId;
	var text = $("#addNoteText").val();
	var dateText = $("#addNoteDate").val();
	var parts = dateText.split("/");
	var date = new Date();
	if(parts.length == 3){
		date.setMonth(parts[0]-1);
		date.setDate(parts[1]);
		date.setFullYear(parts[2]);
	}
	console.log(date);
	var newnote = {
		"Text": text,
		"Timestamp": "/Date("+date.getTime()+")/"
	};
	console.log(newnote)
	apiPost(apiPath("contact/"+contactId+"/Note"), newnote, function(json) {
		getContactNotes();
	}, "PUT");
}

function getContactAttachments(){
	var contact = $.jStorage.get("_current_contact_json");
	var path = apiPath("item/list")
	apiGet(path+"&contact="+contact.ContactId, {}, function(json) {
		console.log("attachments:");
		console.log(json);
		var items = json.Items;
		$.each(items, function(index, item){
			if(!isBlank(item.AvatarUrl)){
				item.AvatarUrl = item.AvatarUrl + appendKeyAndToken() + "&square=75";
			}
			var date = getDate(item.Date);
			item.Date = formatDate(date).Short;
		});
		contact.Items = items;
		$('#contact-attachments-content').html($('#contactAttachmentsTemplate').render(contact)).trigger("create");
		window.location.href = "#contact-attachments-page";
		hideLoading();
	});
	// alert("attachments doesn't work yet");
}

function getContactFieldData(form) {
	var json = $.jStorage.get("_current_contact_json");
	//Name
	var contactType = "IndividualContact";
	var fullName = $("input[name='FullName']").val().split(" ");
	for(var x=0; x<fullName.length; x++){
		if(isBlank(fullName[x].trim())){
			fullName.splice(x,1);
		}
	}
	var firstName = fullName.shift();
	var lastName = fullName.pop();
	var middleName = fullName.join(" ");
	json.FirstName = firstName;
	json.LastName = lastName;
	json.MiddleName = middleName;
	//Address
	var addressJSON = {
		"AddressType": $("select[name=AddressType] option:selected").val(),
		"StateProvince": $("select[name=StateProvince] option:selected").val(),
		"CountryCode": $("select[name=CountryCode] option:selected").val(),
		"City": $("input[name=City]").val(),
		"PostCode": $("input[name=PostCode]").val(),
		"Address1": $("textarea[name=Address1]").text()
	};
	json.Addresses[0] = addressJSON;
	//Phone
	var phones = [];
	$(".ContactPhone").each(function(){
		var phonenum = $(this).find("input[name=Phone]").val();
		if(!isBlank(phonenum)){
			var fone = {
				"CountryCode": "",
				"IsPreferred": false,
				"PhoneType": $(this).find("select[name=PhoneType] option:selected").val(),
				"Phone": phonenum
			};
			phones.push(fone);
		}
	});
	json.Phones = phones;
	//Email
	var emails = [];
	$(".ContactEmail").each(function(){
		var address = $(this).find("input[name=Email]").val();
		if(!isBlank(address)){
			var email = {
				"IsPreferred": false,
				"EmailType": $(this).find("select[name=EmailType] option:selected").val(),
				"Email": address
			};
			emails.push(email);
		}
	});
	json.Emails = emails;
	//Websites
	var sites = [];
	$(".ContactWebsite").each(function(){
		var url = $(this).find("input[name=Url]").val();
		if(!isBlank(url)){
			var site = {
				"WebsiteType": $(this).find("select[name=WebsiteType] option:selected").val(),
				"Url": $(this).find("input[name=Url]").val()
			};
			sites.push(site);
		}
	});
	json.Websites = sites;
	//Emergency and Managed Contact
	json.IsEmergencyContact = Boolean($("select[name=IsEmergencyContact] option:selected").val());
	json.IsManagedContact = Boolean($("select[name=IsManagedContact] option:selected").val());
	//BirthDate
	var bday = $("input[name=BirthDate]").val();
	if(!isBlank(bday)){
		var bdate = bday.split("/");
		if(bdate.length == 3){
			json.BirthDate = {"Year": bdate[2],"Month": bdate[0],"Day": bdate[1],"Display": bday};
		}else{
			json.BirthDate = {"Year": 0,"Month": 0,"Day": 0,"Display": bday};
		}
	}
    //Anniversary
    var anni = $("input[name=Anniversary]").val();
    if(!isBlank(anni)){
    	var annidate = anni.split("/");
    	if(annidate.length == 3){
    		json.Anniversary = {"Year": annidate[2],"Month": annidate[0],"Day": annidate[1],"Display": anni};
    	}else{
    		json.Anniversary = {"Year": 0,"Month": 0,"Day": 0,"Display": anni};
    	}
    }
    //SocialProfile
    json.SocialProfile.Twitter = $("input[name=Twitter]").val();
    json.SocialProfile.Facebook = $("input[name=Facebook]").val();
    json.SocialProfile.LinkedIn = $("input[name=LinkedIn]").val();
    json.SocialProfile.Google = $("input[name=Google]").val();
    json.SocialProfile.Skype = $("input[name=Skype]").val();
    
	// console.log("new json:");
	// console.log(json);
	return json;
}
function deleteContact(){
	var contjson = $.jStorage.get("_current_contact_json");
	var ok = confirm("Are you sure you want to delete the contact '"+contjson.FirstName+" "+contjson.LastName+"'?");
	if(ok){
		submitDeleteContactForm();
	}
}
function submitDeleteContactForm() {
	clearCachedContactList();
	var conjson = $.jStorage.get("_current_contact_json");
	$.jStorage.deleteKey("_current_contact_json");
	apiPost(apiPath('contact/' + conjson.ContactId), {}, function(json) {
		window.location.href = "#contact-list-page";
	}, "DELETE");
}

function submitUpdateContactForm(e) {
	e.preventDefault();
	var contactjson = getContactFieldData();
	//console.log(contactjson);
	postContactUpdate(contactjson);
}

function postContactUpdate(contact){
	console.log("updating the following contact:");
	console.log(contact);
	apiPost(apiPath('Contact/'+contact.ContactId), contact, function(json) {
		loadContact(contact.ContactId);
		window.location.href = "#contact-detail-page";
	}, "POST");
}

function submitNewContactForm() {
	showLoading();
	var contactjson = getContactFieldData();
	// console.log("submitting new contact: "+contactjson.FirstName+" "+contactjson.LastName);
	// console.log(contactjson);
	apiPost(apiPath('Contact'), contactjson, function(json) {
		$.jStorage.deleteKey('contact_list_cached_html');
		showContactInfo(contactjson.ContactId);
		hideLoading();
	}, "PUT");
}

function loadNewContactForm() {
	showLoading();
	var newjson = getNewContactJSON();
	$.jStorage.set("_current_contact_json",newjson);
	hideLoading();
	window.location.href = "#contact-new-page";
	$("#newContactBtn").bind("click",submitNewContactForm);
}

function refreshContacts() {
	clearCachedContactList();
	$("#contac5-list").html($('#contactDetailLoading').render());
	loadContacts();
}

function loadSearchPage() {
	$('#contact-search').html($('#contactSearchForm').render({})).trigger("create");
}

function submitSearchForm() {
	var form = $('#contact-search form.contact-search-form');
	var query = $.trim(form.find('input[name=query]').val());
	if(query.length < 1) {
		return false;
	}
	contactList(function(contact_list) {
		var regexp = new RegExp(query, "i");
		$('#contact-search-results').empty();
		var matched_contacts = [];
		$.each(contact_list, function(i, contact) {
			if(!!contact.FirstName.match(regexp) || !!contact.LastName.match(regexp)) {
				matched_contacts.push(contact);
			}
		});
		if(matched_contacts.length > 0) {
			$.each(matched_contacts, function(i, contact) {
				$('#contact-search-results').append($('#contactListEntryTemplate').render(contact));
			});
		} else {
			$('#contact-search-results').append($('#contactSearchNoResults').render({
				Query : query
			}));
		}
		$('#contact-search-results').listview('refresh');
	});
}

function updateContactFilter() {
	if(current_contact_filter == "all") {
		current_contact_filter = "family";
		$('#contacts-filter-link').text('Family');
	} else {
		current_contact_filter = "all";
		$('#contacts-filter-link').text('All Contacts');
	}
	clearCachedContactListHTML();
	loadContacts();
}

function showPhotoConfirmDialog(){
	var currcontact = $.jStorage.get("_current_contact_json");
	$("#contactPicName").text(currcontact.FirstName+" "+currcontact.LastName);
	window.location.href = "#getPicDialog";
}

function getPhotoFromAlbum(){
	function onSuccess(imageUri){
		var options = new FileUploadOptions();
		options.fileKey = "File";
		options.mimeType = "image/jpeg";
		var ft = new FileTransfer();
		ft.upload(imageUri, apiPath('media'), function(r) {
            var contact = $.jStorage.get("_current_contact_json");
            var obj = jQuery.parseJSON(r.response);
            console.log(obj);
            contact.AvatarId = obj.MediaItemId;
            contact.AvatarUrl = obj.Url;
            alert("Success: \n The photo was uploaded successfully!");
            postContactUpdate(contact);
		}, function(error) {
			alert("An error has occurred: Code = " = error.code);
		}, options);
	}
	function onError(message){
		alert("An error occured: "+message+"\nPlease try again.");
	}
	
	destinationType = navigator.camera.DestinationType;
	pictureSource = navigator.camera.PictureSourceType;
	navigator.camera.getPicture(onSuccess, onError, { 
		quality: 50, 
		destinationType: destinationType.FILE_URI,
		sourceType: pictureSource.PHOTOLIBRARY
	});
}

function capturePhoto() {
	navigator.camera.getPicture(function(imageUri) {
		var options = new FileUploadOptions();
		options.fileKey = "File";
		options.mimeType = "image/jpeg";
		var ft = new FileTransfer();
		ft.upload(imageUri, apiPath('media'), function(r) {
            var contact = $.jStorage.get("_current_contact_json");
            var obj = jQuery.parseJSON(r.response);
            console.log(obj);
            contact.AvatarId = obj.MediaItemId;
            contact.AvatarUrl = obj.Url;
            alert("Success: \n The photo was uploaded successfully!");
            postContactUpdate(contact);
		}, function(error) {
			alert("An error has occurred: Code = " = error.code);
		}, options);
	}, function(message) {
		alert('An error occured: ' + message+"\nPlease try again.");
	}, {
		quality : 50,
		destinationType : Camera.DestinationType.FILE_URI
	});
}

function getNewContactJSON(){
	var send = {
		"AvatarId": "",
		"AvatarUrl": "",
        "FirstName": "",
        "LastName": "",
        "MiddleName": "",
        "Prefix": "",
        "Suffix": "",
        "NickName": "",
        "PreferredLocale": "en-US",
        "IsEmergencyContact": false,
        "IsManagedContact": false,
        "HideFromFamilyDisplays": false,
        "ManagedContactRole": false,
        "Gender": "",
        "BirthDate": {
            "Year": 0,
            "Month": 0,
            "Day": 0,
            "Display": ""
        },
        "DeceasedDate": {
            "Year": 0,
            "Month": 0,
            "Day": 0,
            "Display": ""
        },
        "MaritalStatus": "",
        "Anniversary": {
            "Year": 0,
            "Month": 0,
            "Day": 0,
            "Display": ""
        },
        "ContactType": "",
        "SocialProfile": {
            "Twitter": "",
            "Facebook": "",
            "Flickr": "",
            "LinkedIn": "",
            "Google": "",
            "Live": "",
            "Skype": ""
        },
        "Addresses": [],
        "Phones": [],
        "Emails": [],
        "Websites": []
    };
    return send;
}

function onPageReady() {

	$('#contact-edit-page').live('pagebeforeshow', function(event) {
		var contID = $.jStorage.get("_current_contact_json").ContactId;
		loadContactForEditing(contID);
	});

	$('#contact-search-page').live('pagebeforeshow', function(event) {
		loadSearchPage();
		$('#contact-search-page form.contact-search-form').submit(submitSearchForm);
		$('#contact-search-page form.contact-search-form').keypress(function(e) {
			if(e.which == 13) {
				e.preventDefault();
				submitSearchForm();
			}
		});
	});
	
	//These three functions just make it so the edit fields add an extra row after the are used
	$(".extraPhone").live("blur",function(){
		if(!isBlank($(this).val())){
			$(this).parents("tr").unbind("blur");
			var newrow = $(this).parents("tr").clone();
			$(this).removeClass("extraPhone");
			newrow.find("input[name=Phone]").addClass("extraPhone");
			newrow.find("input[name=Phone]").val("");
			$(this).parents("tr").after(newrow);
		}
	});
	$(".extraEmail").live("blur",function(){
		if(!isBlank($(this).val())){
			$(this).parents("tr").unbind("blur");
			var newrow = $(this).parents("tr").clone();
			$(this).removeClass("extraEmail");
			newrow.find("input[name=Email]").addClass("extraEmail");
			newrow.find("input[name=Email]").val("");
			$(this).parents("tr").after(newrow);
		}
	});
	$(".extraWebsite").live("blur",function(){
		if(!isBlank($(this).val())){
			$(this).parents("tr").unbind("blur");
			var newrow = $(this).parents("tr").clone();
			$(this).removeClass("extraWebsite");
			newrow.find("input[name=Website]").addClass("extraWebsite");
			newrow.find("input[name=Website]").val("");
			$(this).parents("tr").after(newrow);
		}
	});
	
	$("#home-btn").click(function(e){e.preventDefault();window.location.href="index.html";});
	$("#stream-btn").click(function(e){e.preventDefault();window.location.href="index.html";});
	$("#additems-btn").click(function(e){e.preventDefault();window.location.href="index.html";});
	$("#contacts-btn").click(function(e){e.preventDefault();window.location.href="contacts.html";});
	$("#contacts-btn").addClass("ui-btn-active");
	
	loadContacts();
}

function getAllPhoneContacts(){
	var contactList = [];
	var count = 0;
	function onSuccess(contacts){
		var allText = "";
		for(var i=0; i<contacts.length; i++){
			var info = contacts[i].name;
			if(!isBlank(contacts[i].displayName) || !isBlank(info.formatted) || !isBlank(info.familyName) || !isBlank(info.givenName) || !isBlank(info.middleName)){
				console.log("added "+contacts[i].displayName+" - "+info.givenName+" - "+info.familyName);
				allText += contacts[i].displayName+" - "+info.givenName+" - "+info.familyName+"\n";
			}
		}
		alert(allText);
	}
	function onError(){
		console.log("no contacts found on phone!!!");
	}
	var fields = ["displayName","name","id"];
	navigator.contacts.find(fields,onSuccess,onError);
	return contactList;
}

function importAllPhoneContacts(){
	function onSuccess(contacts){
		console.log("number of contacts found: "+contacts.length);
		var allContacts = {
			"SourceName": "MobilePhone",
			"Contacts": []
		};
		for(var i=0; i<contacts.length; i++){
			var name = contacts[i].name;
			var person = contacts[i];
			if(!isBlank(contacts[i].displayName) || !isBlank(name.formatted) || !isBlank(name.familyName) || !isBlank(name.givenName) || !isBlank(name.middleName)){
				var newbie = getNewContactJSON();
				newbie["SourceRecordId"] = person.id;
				newbie.FirstName = name.givenName;
				newbie.LastName = name.familyName;
				newbie.MiddleName = name.middleName;
				var bday = person.birthday;
				if(!isBlank(bday)){
					newbie.BirthDate.Year = bday.getYear();
					newbie.BirthDate.Day = bday.getDate();
					newbie.BirthDate.Month = bday.getMonth();
				}
				newbie.NickName = name.nickname;
				if(!isBlank(person.addresses)){
					for(var j=0; j<person.addresses.length; j++){
						var addr = person.addresses[j];
						if(!isBlank(addr)){
							console.log("adding "+addr.streetAddress+" to "+newbie.FirstName+" "+newbie.LastName);
							var address = {
								"AddressType": addr.type,
								"StateProvince": addr.region,
								"CountryCode": addr.country,
								"City": addr.locality,
								"PostCode": addr.postalCode,
								"Address1": addr.streetAddress
							};
							newbie.Addresses.push(address);
						}
					}
				}
				if(!isBlank(person.phoneNumbers)){
					for(var k=0; k<person.phoneNumbers.length; k++){
						var phone = person.phoneNumbers[k];
						if(!isBlank(phone)){
							console.log("adding "+phone.value+" to "+newbie.FirstName+" "+newbie.LastName);
							var fone = {
								"CountryCode": "",
								"IsPreferred": phone.pref,
								"PhoneType": phone.type,
								"Phone": phone.value
							};
							newbie.Phones.push(fone);
						}
					}
				}
				if(!isBlank(person.emails)){
					for(var l=0; l<person.emails.length; l++){
						var email = person.emails[l];
						if(!isBlank(email)){
							console.log("adding "+email.value+" to "+newbie.FirstName+" "+newbie.LastName);
							var newemail = {
								"IsPreferred": email.pref,
								"EmailType": email.type,
								"Email": email.value
							};
							newbie.Emails.push(newemail);
						}
					}
				}
				console.log("uploading "+newbie.FirstName+" "+newbie.LastName);
				allContacts.Contacts.push(newbie);
			}
		}
		if(allContacts.Contacts.length > 0){
			console.log("uploading "+allContacts.Contacts.length+" contacts...");
			console.log(apiPath('Contact/Import'));
			apiPost(apiPath('Contact/Import'), allContacts, function() {
				$("#import-count").text(allContacts.Contacts.length);
				window.location.href = "contacts.html#importConfirmDialog";
			}, "POST");
		}else{
			alert("There were no contacts to upload");
		}
	}
	function onError(){
		alert("no contacts found on phone!!!");
	}
	var fields = ["displayName","name","id","name","nickname","phoneNumbers","emails","addresses","birthday","urls"];
	navigator.contacts.find(fields,onSuccess,onError);
}

function getPhoneContact(id){
	var contact;
	var options = new ContactFindOptions();
	options.filter=id;
	var fields = ["id","displayName","name","emails","phoneNumbers","addresses","birthday","note"];
	navigator.contacts.find(fields,function(contacts){
		console.log("found the phone contact for id: "+id);
		console.log(contacts[0]);
		contact = contacts[0];
	},function(contactError){
		console.log("could not find phone contact: "+id);
	},options);
	return contact;
}
