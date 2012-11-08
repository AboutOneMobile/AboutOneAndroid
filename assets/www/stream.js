 var stream_mode = "mine";

function getTempItem(){
	var json = {
		"ItemId": "",
		"Title": "",
		"Description": "",
		"Date": "",
		"Category": "",
		"Location": "",
		"LatLong": {"Lat":"","Long":""},
		"PicUrl": "",
		"Date": "",
		"Contacts": []
	};
	return json;
}

function loadItems(items) {
	showLoading();
	var listItemTemplate = $('#streamListItemTemplate');
	var streamList = $("#stream-list");
	var search = true;
	if(isBlank(items)){
		search = false;
		items = $.jStorage.get('item_list_data');
	}
	if(isBlank(items)){
		setTimeout(loadItems, 1000);
	}else{
		var itemslist = "";
		streamList.empty();
		if(items == "empty"){ // the case where there are no items in a user's stream...
			if(search){
				streamList.append($('#streamSearchEmptyTemplate').render());
			}else{
				streamList.append($('#streamListEmptyTemplate').render());
			}
			hideLoading();
		}else{
			var index = 0;
			$.each(items,function(i,item){
				setTimeout(function(){ //setTimeout so that items appear asynchronously, rather than all at once
					streamList.append(listItemTemplate.render(item));
				},10);
			});
			hideLoading();
		}
	}
}

function loadItem(itemId,shared){
	console.log("loading: "+itemId);
	showLoading();
	var path = (shared) ? apiPath('item/sharedwithme/'+itemId) : apiPath('item/'+itemId);
	apiGet(path, {}, function(json){
		$.each(json.Item.Attachments,function(i,file){
			if(file.MediaType == 1){
				file.Url = shared ? file.Url + appendKeyAndToken() + "&square=400" : avatarUrl(file.MediaItemId,400);
			}
		});
		$.jStorage.set("_current_item_data",json.Item);
		window.location.href = "item-detail.html";
	});
}

function loadFamilyMembers(){
	var family = $.jStorage.get("_family_contacts_json");
	if(isBlank(family)){
		apiGet(apiPath("group/me"), {}, function(json) {
			$.jStorage.set("_family_contacts_json", json);			
			displayFamilyContacts(json);
		});
	}else{
		displayFamilyContacts(family);
	}
}

function displayFamilyContacts(json){
	var filter = $.jStorage.get("stream_contact_filter");
	var contacts = $.extend(true, [], json.Group.GroupMembers);
	contacts.push({"ContactId": json.Group.ContactId, "AvatarUrl": "", "FirstName": json.Group.Name});
	$.each(contacts, function(i, contact){
		var pic = "images/blank_person.png";
		if(!isBlank(contact.AvatarId)){
			contact.AvatarUrl = avatarUrl(contact.AvatarId, 80);
			pic = contact.AvatarUrl;
		}
		if(isBlank(contact.FirstName)){
			contact.FirstName = contact.Name.split(' ')[0];
		}
		var html = "<div class='family-filter-div' id='"+contact.ContactId+"' onclick=\'familyFilter(\""+contact.ContactId+"\")'><img src='"+pic+"'> "+contact.FirstName+"</div>";
		if(contact.ContactId == filter){
			html = "<div class='family-filter-div selected' id='"+contact.ContactId+"' onclick=\'familyFilter(\""+contact.ContactId+"\")'><img src='"+pic+"'> "+contact.FirstName+"</div>";
			$("#filter-text").text("Family Filter: " + contact.FirstName);
			$("#stream-filter-container").show();
		}
		$("#stream-filter-menu").append(" " + html + " ");
	});
}

function getEmergencyContacts(){
	var emergency = $.jStorage.get("_emergency_contacts_json");
	if(isBlank(emergency) || !aoStore.exists("emergency_contacts")){
		apiGet(apiPath("contact/emergency"), {}, function(json) {
			$.jStorage.set("_emergency_contacts_json",json);
			aoStore.set("emergency_contacts", json.Contacts);
		});
	}
}

function loadManagedContacts(){
	var managed = $.jStorage.get("_managed_contacts_json");
	if(isBlank(managed) || !aoStore.exists("managed_contacts")){
		apiGet(apiPath("contact/manage"), {}, function(json) {
			$.jStorage.set("_managed_contacts_json", json);
			aoStore.set("managed_contacts", []);
			$.each(json.Contacts, function(i,contact){
				apiGet(apiPath('contact/' + contact.ContactId), {}, function(info) {
					aoStore.set(info.Contact.ContactId, info.Contact);
					var list = aoStore.get("managed_contacts");
					list.push(info.Contact.ContactId);
					aoStore.set("managed_contacts", list);
				});
			});
		});
	}
}

function toggleFilter(){
	if(stream_mode == "mine"){
		$("#filter-btn").toggleClass("pushed");
		if($("#filter-btn").hasClass("pushed")){
			$("#stream-filter-container").show();
		}else{
			loadItems();
			$("#stream-filter-container").hide();
		}
	}else{
		$("#stream-filter-container").hide();
	}
	
	window.scrollTo(0,-50);
}

function refreshStream(){
	closeAppMenu();
	setTimeout(function(){
		getFreshStreamList();
		getFreshContactList();
		getSharedPendingStream();
		checkNotifications();
	}, 500);
}

function moveStreamArrow(elem){
	$("#stream-mine, #stream-shared").removeClass("selected");
	var left = $(elem).position().left;
	var pos = left + ($(elem).width()/2);
	$("#stream-arrow").css("left",pos+"px");
	$(elem).addClass("selected");
}

function getSharedWithMeStream(){
	// api/item/sharedwithme/list
	apiGet(apiPath("item/sharedwithme/list"), {}, function(json) {
        JSON.stringify(json,null,2);
		if(!isBlank(json.Items) && json.Items.length > 0){
			$("#approved-loading").remove();
			$(".approved-share").remove();
			$.each(json.Items, function(i,item){
				$("#approved-divider").after($("#stream-list-shared-template").render(formatStreamItem(item)));
			});
		}else{
			$("#approved-loading").remove();
			$("#approved-divider").after($("#streamApprovedEmptyTemplate").render());
		}
	});
}

function getSharedPendingStream(){
	apiGet(apiPath("item/sharedwithme/list") + "&state=pending", {}, function(json) {
		if(!isBlank(json.Items) && json.Items.length > 0){
			$.jStorage.set("shared-pending-json",json);
			$("#share-count").text(json.Items.length);
			$(".pending-share").remove();
			$("#share-count").show();
			$("#pending-divider").show();
			$("#pending-loading").remove();
			$.each(json.Items, function(i,item){
				item = formatStreamItem(item);
				var html = $("#stream-share-pending-template").render({AvatarUrl:item.AvatarUrl, Title: item.Title, SharedBy: item.Sharer.Name, ItemId:item.ItemId});
				$("#pending-divider").after(html);
			});
		}
	});
}

function acceptShare(id){
	// item/sharedwithme/accept/<id>
	showLoading();
	apiGet(apiPath("item/sharedwithme/accept/"+id), {}, function(json) {
		console.log("ACCEPTED ITEM: " + JSON.stringify(json));
		var pending = $.jStorage.get("shared-pending-json");
		$.each(pending.Items, function(i,item){
			if(item.ItemId == id){
				$("#approved-divider").after($("#stream-list-shared-template").render(formatStreamItem(item)));
				$("#"+id).remove();
				$("#approved-empty").remove();
				var count = parseInt($("#share-count").text()) - 1;
				if(count > 0){
					$("#share-count").text(count);
				}else{
					$("#pending-divider").hide();
					$("#share-count").hide();
				}
				return false;
			}
		});
		hideLoading();
	});
}

function rejectShare(id){
	// item/sharedwithme/deny/<id>
	showLoading();
	apiGet(apiPath("item/sharedwithme/deny/"+id), {}, function(json) {
		console.log("REJECTED ITEM: " + JSON.stringify(json));
		$("#"+id).remove();
		var count = parseInt($("#share-count").text()) - 1;
		if(count > 0){
			$("#share-count").text(count);
		}else{
			$("#pending-divider").hide();
			$("#share-count").hide();
		}
		hideLoading();
	});
}

function familyFilter(id){
	console.log("family filter");
	var div = $("#"+id);
	if(div.hasClass("selected")){
		div.removeClass("selected");
		showLoading();
		loadItems();
		$("#filter-text").text("Family Filter");
	}else{
		$(".family-filter-div").removeClass("selected");
		div.addClass("selected");
		showLoading();
		var path = apiPath('item/list')+"&contact="+div.attr("id")+"&size="+max_stream_length;
		apiGet(path, {}, function(json) {
			var itemlist = json.Items;
			if(isBlank(itemlist)){
				itemlist = "empty";
			}else{
				$.each(itemlist,function(i,item){
					itemlist[i] = formatStreamItem(item);
				});
			}
			loadItems(itemlist);
		});
		$("#filter-text").text("Family Filter: " + div.text());
	}
}

function onPageReady() {

    isLoggedIn();
	
	$("#stream-mine").touch("",function(elem){
		if(!$(elem).hasClass("selected")){
			$("#stream-shared-list").hide();
			$("#stream-list").show();
			$("#filter-btn").removeAttr("disabled").removeClass("disabled");
			stream_mode = "mine";
			moveStreamArrow(elem);
		}
	});
	
	$("#stream-shared").touch("",function(elem){
		if(!$(elem).hasClass("selected")){
			$("#stream-shared-list").show();
			$("#stream-list").hide();
			$("#filter-btn").attr("disabled",true).addClass("disabled").removeClass("pushed");
			$("#stream-filter-container").hide();
			stream_mode = "shared";
			moveStreamArrow(elem);
		}
	});
	
	$("#app-menu a").touch(function(){});
	
	$("#stream-list").touch("li.stream-list-item", function(){});
	
	var streamList = $.jStorage.get('item_list_data');
	if(isBlank(streamList)){
		getFreshStreamList();
	}else{
		loadItems();
		checkNotifications();
	}
    if(isBlank($.jStorage.get('contact_list_array'))){
        getFreshContactList();
    }

    
    var prompt_for_pin = $.jStorage.get("prompt_for_pin");
	if(isBlank(userPIN()) && $.jStorage.get("just_logged_in") == true){
	    if(isBlank(prompt_for_pin) || prompt_for_pin == true){
	        $("#create-pin-btn").click(function(e){
	            e.preventDefault();
	            $.jStorage.set("prompt_for_pin", false);
	            window.location.href = "change-pin.html";
	        });
	        $("#remind-pin-btn").click(function(e){
	            e.preventDefault();
	            $.jStorage.set("prompt_for_pin", true);
	            hideModal("add-login-pin");
	        });
	        $("#dont-prompt-btn").click(function(e){
	            e.preventDefault();
	            $.jStorage.set("prompt_for_pin", false);
	            hideModal("add-login-pin");
	        });
	        setTimeout(function(){
	            showModal("add-login-pin");
	        }, 3000);
	    }
	    $.jStorage.set("just_logged_in",  false);
	}
	
	$("#stream-search-btn").click(function(e){
		e.preventDefault();
		var search_string = $("#stream-search-input").val().trim().toLowerCase();
		if(!isBlank(search_string)){
			showLoading();
			$("#stream-search-input").val(search_string);
			$("#results-for").text(ellipsis(search_string,14));
			$("#search-results").show();
			var path = (stream_mode == "mine") ? apiPath('item/list') : apiPath("item/sharedwithme/list");
			path += "&search="+search_string+"&size="+max_stream_length;
			console.log(path);
			apiGet(path, {}, function(json) {
				var itemlist = json.Items;
				if(isBlank(itemlist)){
					itemlist = "empty";
				}else{
					$.each(itemlist, function(i,item){
						itemlist[i] = formatStreamItem(item);
					});
				}
				console.log("ITEM LIST: " + JSON.stringify(itemlist));
				if(stream_mode == "shared"){
					$("#stream-shared-list").hide();
					$("#stream-list").show();
				}
				loadItems(itemlist);
			});
		}else{
			$("#search-results").hide();
			$("#stream-search-input").val("");
		}
	});
	
	$("#clear-search").click(function(e){
		e.preventDefault();
		showLoading();
		$("#search-results").hide();
		$("#stream-search-input").val("");
		if(stream_mode == "mine"){
			$("#stream-shared-list").hide();
			$("#stream-list").show();
			loadItems();
		}else{
			$("#stream-shared-list").show();
			$("#stream-list").hide();
			loadItems();
		}
	});
	
	var query = $.jStorage.get("stream_search_string");
	if(!isBlank(query)){
		$("#stream-search-input").val(query);
		$("#results-for").text(ellipsis(query, 14));
		$("#search-results").show();
	}
	
	$("#filter-btn").click(function(e){
		window.scrollTo(0,0);
		$("#stream-filter-container").show();
	});
	

	
	$("#hide-filter-btn").click(function(e){
		e.preventDefault();
		$("#stream-filter-container").hide();
	});

    setTimeout(function(){
        loadManagedContacts();
        loadFamilyMembers();
        getEmergencyContacts();
    },2000);
	setTimeout(function(){
        getSharedWithMeStream();
        checkLimits();
	},3000);
    setTimeout(function(){
        getSharedPendingStream();
    },4000);
	
	
    
    $("#stream-list").on("notificationsChecked", function(e){
    	loadItems();
    });
	
}
