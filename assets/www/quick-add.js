	function onPageReady(){
		
		$("#entry-type").change(function(){
			switch($(this).val()){
				case "MiscThing":
					$("#item-location").attr("placeholder","Where is it?");
					$("#item-location").val("");
					$("#share-names, #share-icon, #item-date, #item-time, #contacts-row").hide();
					break;
				case "HealthAppointment":
					$("#health-for-option").text("Appointment For...");
					$("#health-for-row").show();
					$("#contacts-input").attr("placeholder","Include Doctors or other contacts");
					break;
				case "Prescription":
					$("#health-for-option").text("Medication For...");
					$("#health-for-row").show();
					$("#contacts-input").attr("placeholder","Include Doctors or other contacts");
					break;
				case "Condition":
					$("#health-for-option").text("Condition For...");
					$("#health-for-row").show();
					$("#contacts-input").attr("placeholder","Include Doctors or other contacts");
					break;
				default:
					$("#contacts-row").show();
					$("#item-location").attr("placeholder","Location");
					$("#share-icon, #item-date, #item-time, #contacts-row").show();
					$("#health-for-row").hide();
					$("#contacts-input").attr("placeholder","Include family or friends");
					break;
			}
		});
		
		$.jStorage.set("quick_add_photo_list",[]);
		
		var contact_list = $.jStorage.get('contact_list_array');
		if(isBlank(contact_list)){getFreshContactList();}
		var ul = $("#contacts-list");
		var div = $("#contacts-results");
		$("#contacts-input").keyup(function(e){
			e.preventDefault();
			if(isBlank(contact_list)){contact_list = $.jStorage.get('contact_list_array');}
			var inputVal = $(this).val().trim().toLowerCase();
			if(inputVal.length > 1){
				var count = 0;
				ul.empty();
				$.each(contact_list, function(i, contact){
					if(contact.first.startsWith(inputVal) || contact.last.startsWith(inputVal)){
						var html = "<li><a href='javascript:addContact(\""+contact.id+"\",\""+contact.label+"\",\""+contact.pic+"\")'>d"+contact.label+"</a></li>";
						ul.append(html);
						count++;
					}
					if(count >= 5){
						return false; // break out if more than 5 contacts in the list
					}
				});
				if(count == 0){
					ul.append("<li><a href='javascript:quickAddContact(\""+inputVal+"\")'><span class='small-help-text'>Create a new contact named:</span><br> '"+inputVal.capitalize()+"'</a></li>");
				}
				div.show();
			}else{
				div.hide();
			}
		});
		
		var sul = $("#share-list");
		var sdiv = $("#share-results");
		$("#share-input").keyup(function(e){
			if(isBlank(contact_list)){contact_list = $.jStorage.get('contact_list_array');}
			var inputVal = $(this).val().trim().toLowerCase();
			if(inputVal.length > 1){
				var count = 0;
				sul.empty();
				$.each(contact_list, function(i, contact){
					if(contact.first.startsWith(inputVal) || contact.last.startsWith(inputVal)){
						var html = "<li><a href='javascript:shareContact(\""+contact.label+"\",\""+contact.id+"\",\""+contact.share+"\")' style='width:90%;'>"+contact.label+"</a></li>";
						sul.append(html);
						count++;
					}
					if(count >= 5){
						return false; // break out if more than 5 contacts in the list
					}
				});
				if(count == 0){
					sul.append("<li><a href='javascript:shareContact(\""+inputVal.capitalize()+"\")' style='width:100%;'><span class='small-help-text'>Create a new contact named:</span><br> '"+inputVal.capitalize()+"'</a></li>");
				}
				sdiv.show();
			}else{
				sdiv.hide();
			}
		});
		
		$("#add-health").click(function(e){
			e.preventDefault();
			aoConfirm(function(){
					window.location.href="add-health.html";
				},
				"Would you like to create a Health entry?",
				"Add Health Entry"
			);
		});
		
		$.jStorage.set('now_editing_item', false);
		
		if($.jStorage.get('should_edit_item') == true){
			$.jStorage.set('should_edit_item', false);
			$.jStorage.set('now_editing_item', true);
			var currItem = $.jStorage.get("_current_item_data");
			$.jStorage.set('temp_editing_item', $.extend(true, {}, currItem));
			if(isBlank(currItem.Sharing)){currItem.Sharing = [];}
			$.each(currItem.Sharing, function(i, share){
				if(share.ShareAction != "Unshare"){
					$("#share-names").append(shareHTML(share.ContactId,share.Email,share.Name)).show();
				}
			});
			$("#delete-row").show();
			$("#page-title").text("Edit an Entry");
			$("#entry-type").val(currItem.ItemType);
			$("#entry-type").attr("disabled","disabled");
			$("#item-title").val(currItem.Title);
			$("#item-description").val(currItem.Description);
			switch(currItem.ItemType){
				case "HealthAppointment":
					$("#health-for-option").text("Appointment For...");
					$("#health-for-row").show();
					break;
				case "Prescription":
					$("#health-for-option").text("Medication For...");
					$("#health-for-row").show();
					break;
				case "Condition":
					$("#health-for-option").text("Condition For...");
					$("#health-for-row").show();
					break;
			}
			if(!isBlank(currItem.LocationAspect) && !isBlank(currItem.LocationAspect.Location)){
				$("#item-location").val(currItem.LocationAspect.Location);
			}
			if(!isBlank(currItem.CalendarAspect) && !isBlank(currItem.CalendarAspect.StartDate)){
				setDateTime(getDate(currItem.CalendarAspect.StartDate));
			}
			if(!isBlank(currItem.Contacts)){
				$.each(currItem.Contacts, function(index, contact){
					if(!isBlank(contact)){
						if(!isBlank(contact.AvatarId)){
							contact.AvatarUrl = avatarUrl(contact.AvatarId, 25);
						}else{
							contact.AvatarUrl = "images/blank_person.png";
						}
						addContact(contact.ContactId, contact.Name, contact.AvatarUrl);
					}
				});
			}
			if(!isBlank(currItem.Attachments)){
				var picList = $.jStorage.get("quick_add_photo_list");
				$.each(currItem.Attachments, function(index, file){
					if(file.MediaType == MediaType.Image){
						var path = avatarUrl(file.MediaItemId, 60), extension = ".jpg", mediatype = MediaType.Image;
					}else if(file.MediaType == MediaType.Video){
						var path = "images/video-file.png", extension = ".mp4", mediatype = MediaType.Video
					}else{
						return true;
					}
					var html = '<div class="pic-container thumbnail" onclick="removePic(this)" id="'+file.MediaItemId+'"'+
							'style="background-image: url('+path+')">'+
							'<button class="btn btn-danger btn-mini btn-del">' +
							'<i class="icon-remove icon-white icon-small"></i></button></div>';
			        $("#item-photos").append(" " + html + " ");
			        $("#item-photos").show();
			        // var picList = $.jStorage.get("quick_add_photo_list");
			        picList.push({"MediaItemId":file.MediaItemId, "Extension":file.FileExtension, "MediaType":file.MediaType});
			        // $.jStorage.set("quick_add_photo_list", picList);
				});
				$.jStorage.set("quick_add_photo_list", picList);
			}
			
			if($.jStorage.get('should_share_item') == true){
				$.jStorage.set('should_share_item', false);
				showShare();
			}
		}else{
			setDateTime(new Date());
			setTimeout(getLocation, 2000);
		}
		
		var tempContactId = $.jStorage.get("_add_contact_to_item");
		if(!isBlank(tempContactId)){
			$.jStorage.set("_add_contact_to_item","");
			$.each(contact_list, function(i, contact){
				if(tempContactId == contact.id){
					addContact(contact.id, contact.label, contact.pic);
					return false;
				}
			});
		}
		loadManagedContacts();
	}
	
	function setDateTime(date){
		var hour = date.getHours();
		$("#item-month").val(date.getMonth());
		$("#item-day").val(date.getDate());
		$("#item-year").val(date.getFullYear());
		$("#item-hour").val((hour < 12) ? hour : (hour - 12));
		$("#item-min").val(Math.round(date.getMinutes()/15));
		$("#item-pm").val((hour > 11) ? 1 : 0);
	}
	
	function removeSharedContact(id,email){
		console.log("removing shared contact...");
		$("#"+(id ? id : email)).remove();
		if(nowEditing()){
        	var currItem = $.jStorage.get('temp_editing_item');
        	if(!isBlank(currItem.Sharing) && currItem.Sharing.length > 0){
        		$.each(currItem.Sharing, function(i,share){
        			if(share.ContactId == id || share.Email == email){
        				console.log("unsharing with contact "+id+email);
        				share.ShareAction = "Unshare";
        			}
        		});
        	}
        	$.jStorage.set('temp_editing_item', currItem);
        }
		if($("#share-names .share-name").length == 0){
			$("#share-names").hide();
		}
	}
	
	function addContact(id, name, pic){
		$("#contacts-input").val("");
		$("#contacts-results").hide();
		if(isBlank(pic)){
			pic = "images/blank_person.png";
		}
		$("#contacts-table").append("<tr id='"+id+"' rel='"+name+"'><td style='width:25px !important; padding:3px;'><img src='"+pic+"'></td><td>"+name+" <i class='icon-remove icon-large pull-right' onclick=removeContact('"+id+"')></i></td></tr>");
		$("#contacts-table").show();
		if(nowEditing()){
        	var currItem = $.jStorage.get('temp_editing_item');
        	var saveContact = true;
        	$.each(currItem.Contacts,function(i,cont){
        		//make sure contact isn't already in the list
        		if(cont.ContactId == id){
        			saveContact = false;
        			return false;
        		}
        	});
        	if(saveContact){
        		var newContact = {ContactId:id, AvatarUrl:pic, Name:name};
	        	newContact.Action = 1;
	        	currItem.Contacts.push(newContact);
	        	$.jStorage.set('temp_editing_item', currItem);
        	}
        }
	}
	
	function quickAddContact(name){
		$("#contacts-input").val("");
		$("#contacts-results").hide();
		$.jStorage.set("_quick_contact_name", name.capitalize());
		aoConfirm(
			function(){
				var name = $.jStorage.get("_quick_contact_name");
				var id = new Date().getTime();
				addContact(id, name, "");
			},
			"Would you like to create a new contact for '"+name+"'?\n\nYou can edit the details for this contact later.",
			"Contact Quick Add"
		);
	}
	
	function saveEntry(){
		if(!$("#save-entry").hasClass("no-save")){
			showLoading();
			var type = $("#entry-type").val();
			var title = $("#item-title").val();
			var inventory = false;
			if(type == 0){
				aoAlert("Please select an entry type from the dropdown menu.","Missing Information");
				hideLoading();
				hideAllModals();
			}else if(isBlank(title)){
				aoAlert("Please add a name to your entry.","Missing Information");
				hideLoading();
				hideAllModals();
			}else if(nowEditing()){
				updateItem();
			}else if(type == "MiscThing"){
				var newItem = {
					"ThingId": "",
					"AvatarId": "",
					"Description": $("#item-description").val(),
					"ThingType": type,
					"Name": $("#item-title").val(),
					"WhereIsIt": $("#item-location").val()
				};
				//Get the first photo and set as the avatar
				var photos = $.jStorage.get("quick_add_photo_list");
				if(!isBlank(photos) && photos.length > 0){
					newItem.AvatarId = photos[0].MediaItemId;
				}
				sendThing(newItem);
			}else{
				console.log("Must be a new item...");
				var newItem = {
					"ItemId": "",
					"AvatarId": "",
					"AvatarUrl": "",
					"Description": $("#item-description").val(),
					"ItemType": type,
					"Title": title,
					"Attachments": [],
					"Contacts": [],
					"LocationAspect": {
						"Location": $("#item-location").val(),
						"AspectType": "LocationAspect"
					},
					"CalendarAspect": {
						"StartDate": "",
						"EndDate": "",
						"AspectType": "CalendarAspect"
					}
				}
				console.log(newItem);
				//Get all attached photos
				var photos = $.jStorage.get("quick_add_photo_list");
				if(!isBlank(photos)){
					for(var i=0; i<photos.length; i++){
						if(photos[i].MediaItemId.length < 32){
							aoAlert("One or more of your media files is still uploading. Please wait until all files have finished loading before saving your entry","Media Uploading");
							hideLoading();
							hideAllModals();
							return false;
						}else{
							if(isBlank(newItem.AvatarId) && photos[i].MediaType == 1){
								newItem.AvatarId = photos[i].MediaItemId;
								newItem.AvatarUrl = avatarUrl(newItem.AvatarId, 75);
							}
							newItem.Attachments.push(photos[i]);
						}
					}
				}
				//Get all attached contacts
				var contactRows = $("#contacts-table tr");
				$.each(contactRows,function(i,row){
					var tempID = $(row).attr("id");
					var contactID = (isBlank(tempID) || tempID.length < 32) ? "" : tempID;
					var contactName = $(row).attr("rel");
					if(contactID){
						newItem.Contacts.push({ContactId:contactID, AvatarUrl:"images/blank_person.png", Name:contactName});
					}else if(contactName){
						newItem.Contacts.push({"Name":contactName});
					}
				});
				// Get all shared contacts
				var shareNames = [];
				$.each($("#share-names .share-name"),function(i,div){
					var div = $(div);
					var name = div.find('.name').text();
					var id = div.attr('id');
					var email = div.attr('rel');
					shareNames.push({
						Name: name ? name : "",
						ContactId: id.contains('@') ? "" : id,
						Email: email ? email : "",
						ShareAction: "Share"
					});
				});
				if(shareNames.length > 0){
					newItem.Sharing = shareNames;
				}
				// Get the date given
				var month = $("#item-month").val(), hour = parseInt($("#item-hour").val()), pm = ($("#item-pm").val() == 1);
				if(month != -1 && hour != -1){
					newItem.CalendarAspect.StartDate = new Date( $("#item-year").val(), month, $("#item-day").val(), pm ? hour : (hour + 12), ($("#item-min").val()*15) );
					// console.log(newItem.CalendarAspect.StartDate);
				}
				var contactID = $("#health-for").find("option:selected").val();
				var name = $("#health-for").find("option:selected").text();
				var contactObj = {ContactId: contactID, Name: name};
				var checkFor = "";
				switch(type){
					case "HealthAppointment":
						checkFor = "appointment";
						newItem.AppointmentFor = contactObj;
						break;
					case "Prescription":
						checkFor = "medication";
						newItem.PrescriptionFor = contactObj;
						newItem.PrescribedDate = newItem.CalendarAspect.StartDate;
						break;
					case "Condition":
						checkFor = "condition";
						newItem.ConditionFor = contactObj;
						break;
				}
				if(!isBlank(checkFor) && contactID == "0"){
					aoAlert("You must select a name from the '"+checkFor+" for' menu.","Add Entry Error");
				}else{
					console.log(JSON.stringify(newItem));
					sendItem(newItem);
					$.jStorage.set("quick_add_photo_list",[]);
				}
			}
		}
	}
	
	function nowEditing(){
		return $.jStorage.get('now_editing_item') == true;
	}
	
	function updateItem(){
		//ACTION FLAGS: 0 none, 1 add, 2 update, 3 delete
		var currItem = $.jStorage.get('temp_editing_item');
		currItem.Action = 2;
		currItem.Title = $("#item-title").val();
		currItem.Description = $("#item-description").val();
		if(isBlank(currItem.LocationAspect)){
			currItem.LocationAspect = {Location:$("#item-location").val(), AspectType:"LocationAspect", Action: 1};
		}else{
			currItem.LocationAspect.Location = $("#item-location").val();
			currItem.LocationAspect.Action = 2;
		}
		var month = $("#item-month").val(), hour = parseInt($("#item-hour").val()), pm = ($("#item-pm").val() == 1);
		if(month != -1 && hour != -1){
			if(isBlank(currItem.CalendarAspect)){
				currItem.CalendarAspect = {AspectType:"CalendarAspect", Action:1};
			}else{
				currItem.CalendarAspect.Action = 2;
			}
			currItem.CalendarAspect.StartDate = new Date( $("#item-year").val(), month, $("#item-day").val(), pm ? hour : (hour + 12), ($("#item-min").val()*15) );
			// console.log(newItem.CalendarAspect.StartDate);
		}
		
		var contactID = $("#health-for").find("option:selected").val();
		var name = $("#health-for").find("option:selected").text();
		var contactObj = {ContactId: contactID, Name: name};
		switch(currItem.ItemType){
			case "HealthAppointment":
				currItem.AppointmentFor = contactObj;
				break;
			case "Prescription":
				currItem.PrescriptionFor = contactObj;
				break;
			case "Condition":
				currItem.ConditionFor = contactObj;
				break;
		}
		console.log(JSON.stringify(currItem));
		delete currItem.__type;
		//Send off the updated json
		apiPost(apiPath('Item/' + currItem.ItemId), {"Item":currItem}, function(json) {
			if(!isBlank(currItem.CalendarAspect) && !isBlank(currItem.CalendarAspect.StartDate)){
				currItem.CalendarAspect.StartDate = getAPIDateString(currItem.CalendarAspect.StartDate);
			}
			if(currItem.AvatarId){
				currItem.AvatarUrl = avatarUrl(currItem.AvatarId,75);
			}
            var contacts = [];
            $.each(currItem.Contacts, function(i,contact){
               if(contact.Action != 3){
                   contacts.push(contact);
               }
            });
            currItem.Contacts = contacts;
			$.jStorage.set("_current_item_data", currItem);
			var streamList = $.jStorage.get("item_list_data");
			$.each(streamList, function(index, item){
				if(item.ItemId == currItem.ItemId){
					streamList[index] = currItem;
					$.jStorage.set("item_list_data", streamList);
					return false;
				}
			});
			aoAlert("Your entry was updated successfully","Entry Updated");
			hideLoading();
			hideAllModals();
			window.location.href = "item-detail.html";
		}, "POST");
		
		
	}
	
	function sendItem(item){
		apiPost(apiPath("Item"), {"Item": item}, function(json) {
			console.log(JSON.stringify(json));
			item.ItemId = json.ItemId;
			item = formatStreamItem(item);
			if(!isBlank(item.CalendarAspect) && !isBlank(item.CalendarAspect.StartDate)){
				item.CalendarAspect.StartDate = getAPIDateString(item.CalendarAspect.StartDate);
			}
			var streamList = $.jStorage.get("item_list_data");
			if(isBlank(streamList) || streamList == "empty"){
				streamList = [item];
			}else{
				streamList.unshift(item);
			}
			$.jStorage.set("item_list_data", streamList);
			$.jStorage.set("_current_item_data", item);
			aoAlert("Your entry '" + item.Title + "' was added successfully", "Save Successful");
			hideLoading();
			hideAllModals();
			window.location.href = "item-detail.html";
		}, "PUT");
	}
	
	function sendThing(thing){
		console.log(JSON.stringify(thing));
		apiPost(apiPath("Thing"), {"Thing": thing}, function(json) {
			console.log("THING SAVED SUCCESSFULLY: "+JSON.stringify(json));
			aoAlert("Your inventory item was saved successfully.\n\nTo view or edit this item, please visit AboutOne.com.","Save Successful");
			hideLoading();
			hideAllModals();
			window.location.href = "index.html";
		},"PUT");
	}
	
	function getCamera(){
		attachMedia(true,false);	
	}
	function getPicture(){
		attachMedia(false,false);
	}
	function getVideo(){
		attachMedia(false,true);
	}
	function attachMedia(camera, video){
		var tempID = new Date().getTime();
		getMedia(camera, video, 
			function(imageUri){
				var img = new Image();
				img.src = imageUri;
				img.onload = function(){
			    	if(img.height > img.width){ // image is in portrait orientation, need to modify CSS
			    		$("#"+tempID).css("background-size", "100% auto");
			    	}
			    };
				var html = $("#media-template").render({imageUri: imageUri, tempID: tempID})
		        $("#item-photos").append(" " + html + " ").show();
		        setTimeout(toggleSave,250);
			},
			function(error){ // onUploadError
				$("#"+tempID).remove();
				var picList = $.jStorage.get("quick_add_photo_list");
		        for(var i=0; i<picList.length; i++){
		        	if(picList[i].MediaItemId == tempID){
		        		picList.splice(i,1);
		        		break;
		        	}
		        }
                setTimeout(toggleSave,250);
		        $.jStorage.set("quick_add_photo_list", picList);
			},
			function(obj){
				var pic = $("#"+tempID);
		        pic.find(".loader").remove();
                pic.find(".progress").remove();
		        pic.attr("id", obj.MediaItemId);
		        var picList = $.jStorage.get("quick_add_photo_list");
		        picList.push(obj);
		        $.jStorage.set("quick_add_photo_list", picList);
                setTimeout(toggleSave,250);
		        if(nowEditing()){
		        	var currItem = $.jStorage.get('temp_editing_item');
		        	obj.Action = 1;
		        	currItem.Attachments.push(obj);
		        	$.jStorage.set('temp_editing_item', currItem);
		        }
			},
            function(sofar, total){
                var perc = Math.floor((sofar/total)*100);
                var pic = $("#"+tempID);
                pic.find(".bar").css("width",perc+"%");
            }
		);
	}
	
	function removePic(elem){
		var div = $(elem);
		div.fadeOut("slow");
		var tempID = div.attr("id");
		var picList = $.jStorage.get("quick_add_photo_list");
		for(var i=0; i<picList.length; i++){
        	if(picList[i].MediaItemId == tempID){
        		picList.splice(i,1);
        		break;
        	}
        }
        if(picList.length == 0){
        	$("#item-photos").hide();
        }
        $.jStorage.set("quick_add_photo_list", picList);
        if(nowEditing()){
        	var currItem = $.jStorage.get('temp_editing_item');
        	$.each(currItem.Attachments, function(i, attach){
        		if(attach.MediaItemId == tempID){
        			attach.Action = 3;
        			$.jStorage.set('temp_editing_item', currItem);
        			return false;
        		}
        	});
        }
	}
	
	function removeContact(id){
		$("#"+id).remove();
		if($("#contacts-table tr").length < 2){
			$("#contacts-table").hide();
		}
		if(nowEditing()){
        	var currItem = $.jStorage.get('temp_editing_item');
        	$.each(currItem.Contacts, function(i, contact){
        		if(contact.ContactId == id){
        			console.log("set Contact "+id+" to be deleted");
        			contact.Action = 3;
        			$.jStorage.set('temp_editing_item', currItem);
        			return false;
        		}
        	});
        }
	}
	
	function showShare(){
		var share = $("#share-container");
		var pos = $("#share-icon").position();
		share.css("top",(pos.top + 90) + "px" );
		share.css("left",(pos.left - 188) + "px");
		if(share.hasClass("active")){
			share.hide();
		}else{
			share.show();
		}
		share.toggleClass("active");
	}
	
	function shareContact(name, id, share){
		var input = $("#share-input").val("");
		$("#share-results").hide();
		showShare();
		if(share){
			$("#share-names").append(shareHTML(id,"",name)).show();
			if(nowEditing()){
				var currItem = $.jStorage.get('temp_editing_item');
				currItem.Sharing = currItem.Sharing ? currItem.Sharing : [];
				currItem.Sharing.push({
					Name: name ? name : "",
					ContactId: id ? id : "",
					ShareAction: "Share"
				});
				$.jStorage.set('temp_editing_item', currItem);
			}
		}else{
			$("#share-email").val("");
			$("#share-email-name").text(name);
			$("#share-temp-name").text(name);
			$("#share-id").text(id);
			showModal("add-share-email");
		}
	}
	
	function addShareEmail(){
		var email = $("#share-email").val().trim();
		if(!isBlank(email)){
			hideModal("add-share-email");
			$("#share-email").val("");
			var name = $("#share-temp-name").text();
			var id = $("#share-id").text();
			$("#share-names").append(shareHTML(id,email,name));
			$("#share-names").show();
			if(nowEditing()){
				var currItem = $.jStorage.get('temp_editing_item');
				currItem.Sharing = currItem.Sharing ? currItem.Sharing : [];
				currItem.Sharing.push({
					Name: name ? name : "",
					ContactId: id ? id : "",
					Email: email,
					ShareAction: "Share"
				});
				$.jStorage.set('temp_editing_item', currItem);
			}
		}
	}
	
	function shareHTML(id,email,name){
		var divID = (id?id:email);
		email = email ? email : "";
		id = id ? id : "";
		return '<div class="share-name" id="'+divID.trim()+'" rel="'+email.trim()+
			'" onclick="removeSharedContact(\''+id.trim()+'\',\''+email.trim()+
			'\')"> <i class="icon-remove pull-right"></i> <span class="name">'+
			name + '</span></div>';
	}
	
	function getLocation(){
		function onSuccess(position) {
			var lat = position.coords.latitude;
			var lon = position.coords.longitude;
			$.ajax({
				url: "http://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lon+"&sensor=true",
				success: function(data){
					var parts = data.results[0].formatted_address.trim().split(",");
					var statezip = parts[2].trim().split(" ");
					$("#item-location").val(parts[1].trim() + ", " + statezip[0]);
				},
				dataType: "json"
			});
		}
	    function onError(error) {
	        console.log("GPS Location Error", code, JSON.stringify(error));
	    }
	    navigator.geolocation.getCurrentPosition(onSuccess, onError);
	}
	
	function toggleSave(){
		var picList = $.jStorage.get("quick_add_photo_list");
		var picCount = picList.length;
		var divCount = $("#item-photos div").length;
		if(picCount == divCount){
			$("#save-entry").removeClass("no-save");
        	$("#ok-sign").show();
        	$("#wait-loader").hide();
        }else{
        	$("#save-entry").addClass("no-save");
        	$("#ok-sign").hide();
        	$("#wait-loader").show();
        }
	}
	
	function deleteEntry(){
		var onConfirm = function(){
			showLoading();
			var currItemID = $.jStorage.get("_current_item_data").ItemId;
			apiPost(apiPath('item/' + currItemID), {}, function(json) {
				$.jStorage.deleteKey("_current_item_data");
				$.jStorage.deleteKey('item_list_cached_html');
				var streamList = $.jStorage.get("item_list_data");
				$.each(streamList, function(index, item){
					if(item.ItemId == currItemID){
						streamList.splice(index, 1) //removes the item from the array
						$.jStorage.set("item_list_data", streamList);
						return false;
					}
				});
				hideLoading();
				goToStream();
			}, "DELETE");
		};
		var title = $.jStorage.get("_current_item_data").Title;
		aoConfirm(onConfirm, "Are you sure you want to delete your '"+title+"' entry?", "Are you sure?");
	}
	
	function loadManagedContacts(){
		var managed = $.jStorage.get("_managed_contacts_json");
		function displayManaged(data){
			var healthFor = $("#health-for");
			$("#health-for-loading").remove();
			$.each(data.Contacts, function(i, contact){
				healthFor.append("<option value='"+contact.ContactId+"'>"+contact.Name+"</option>");
			});
			if(nowEditing()){
				var currItem = $.jStorage.get('temp_editing_item');
				switch(currItem.ItemType){
					case "HealthAppointment":
						console.log(currItem.AppointmentFor.ContactId);
						healthFor.val(currItem.AppointmentFor.ContactId);
						break;
					case "Prescription":
						console.log(currItem.PrescriptionFor.ContactId);
						healthFor.val(currItem.PrescriptionFor.ContactId);
						break;
					case "Condition":
						console.log(currItem.ConditionFor.ContactId);
						healthFor.val(currItem.ConditionFor.ContactId);
						break;
				}
			}
			hideLoading();
		}
		if(isBlank(managed)){
			apiGet(apiPath("contact/manage"), {}, displayManaged);
		}else{
			displayManaged(managed);
		}
	}