 var map = null;
 var infowindow;
 var prev_infowindow = false;
 var currentLocation = { lat: 40.4, lng: -79.9 };
 var lastBounce = null

 var bounds;

 var mapDiv = $("#map");
 var geocoder;

 var gmarkers = [];
 var tags = [];
 var show = [];
 var nearEvents = $("#nearEvents")

 function initMap() {
    // Initial map
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: currentLocation
    });
    infowindow = new google.maps.InfoWindow;
     
    // Create the search box and link it to the UI element.
    var input = document.getElementById('searchAddress');
    var searchContainer = document.getElementById('searchContainer');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(searchContainer);
     
     // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
        searchBox.setBounds(map.getBounds());
    });

    var input1 = document.getElementById("address");
    var autocomplete1 = new google.maps.places.Autocomplete(input1)

    var input2 = document.getElementById("address2");
    var autocomplete2 = new google.maps.places.Autocomplete(input2);
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
        searchBox.addListener('places_changed', function() {
          var places = searchBox.getPlaces();
          if (places.length == 0) {
            return;
          }         
          geocodeAddress()
            
        });

     if (navigator.geolocation) {
         // Get the current location
         navigator.geolocation.getCurrentPosition(function(position) {
             loc = {
                 lat: position.coords.latitude,
                 lng: position.coords.longitude
             };

            currentLocation = loc;
            map.setCenter(currentLocation);

             var latlng = new google.maps.LatLng(currentLocation.lat, currentLocation.lng);
             var getAddr;
             geocoder.geocode({ 'latLng': latlng }, function(results, status) {
                 if (status !== google.maps.GeocoderStatus.OK) {
                     alert(status);
                 }
                 // This is checking to see if the Geoeode Status is OK before proceeding
                 if (status == google.maps.GeocoderStatus.OK) {
                     getAddr = (results[0].formatted_address);
                     //console.log(getAddr);
                     // Show current location in the input field
                     $("#searchAddress")[0].value = getAddr;
                 }
             });
         }, function() {
             //handleLocationError(true, infowindow, map.getCenter());
         });
     } else {
         //handleLocationError(false, infowindow, map.getCenter());
     }
 }
 function handleLocationError(browserHasGeolocation, infowindow, currentLocation) {
     infowindow.setPosition(currentLocation);
     infowindow.setContent(browserHasGeolocation ?
         'Error: The Geolocation service failed.' :
         'Error: Your browser doesn\'t support geolocation.');
     infowindow.open(map);
 }

 /* Search event button listener*/
 function geocodeAddress() {
     var address = $("#searchAddress")[0].value;
     geocoder.geocode({ 'address': address }, function(results, status) {
         
         if (status === 'OK') {
             var location = results[0].geometry.location
             map.setCenter(location);
             currentLocation = { lat: location.lat(), lng: location.lng() }
             mapDiv.data('max-time', '1970-01-01T00:00+00:00')
              
             nearEvents = nearEvents.empty()
             getUpdates()
             
         } else {
             alert('Geocode was not successful for the following reason: ' + status);
         }
     });
 }
 /* filter button event listener*/
 function removeMarkers() {
    
     let filter = $("#filterTag")[0].value;
     
     
     for (var i = 0; i < gmarkers.length; i++) {
         if (filter == "All" || tags[i] == filter) {
             gmarkers[i].setMap(map);
             show[i] = 1;       
         } else {
             gmarkers[i].setMap(null);
             show[i] = 0;
            
         }
     }
 }

 /* 
  * Ajax updates, check filter tag to make the marker show or not
  */
 function getUpdates() {

     var max_time = mapDiv.data("max-time")
     if (max_time == undefined || max_time == null || max_time == '') {
         max_time = "1970-01-01T00:00+00:00"
     }

     $.get("/get-changes/" + currentLocation.lng + "/" + currentLocation.lat + "/" + max_time)
         .done(function(data) {
             mapDiv.data('max-time', data['max-time']);
             let filter = $("#filterTag")[0].value;  
             for (let i = 0; i < data.events.length; i++) {
                 let event = data.events[i];
                 createMarker(event);
             }    
         });
 }
/* 
 * Ajax updates, check filter tag to make the marker show or not
 */
function parseLocation(locationString) {
    let startIndex = locationString.indexOf("(") + 1;
    let splitIndex = locationString.lastIndexOf(" ");
    let endIndex = locationString.lastIndexOf(")");
    let lngValue = parseFloat(locationString.substring(startIndex, splitIndex));
    let latValue = parseFloat(locationString.substring(splitIndex + 1, endIndex));
    return new google.maps.LatLng(latValue, lngValue);
}

/* 
 * This function creates each marker and sets their Info Window content
 */
 function createMarker(event) {
     let filter = $("#filterTag")[0].value;
     let locationString = event.location;
     let latlng = parseLocation(locationString);
     
     // InfoWindow content
     
     var content = '<div class="infowindow">' +
         '<div>' +
         '<h4>' + event.brief + '</h4>' +
         '<p>' + event.detail + '</p >' +
         '<div>Contacts</div>' +
         '<p>' + event.contact + '</p >' +
         '<div>Start_time</div>' +
         '<p>' + event.startTime + '</p >' +
         '<div>End_time</div>' +
         '<p>' + event.endTime + '</p >' +
         '</div>' +
         '</div>';
    
     // A new Info Window is created and set content
     var infowindow = new google.maps.InfoWindow({
         content: content,
         // Assign a maximum value for the width of the infowindow allows
         // greater control over the various content elements
         maxWidth: 350
     });

     // marker options
     var marker = new google.maps.Marker({
         position: latlng,
         map: map,
         title: event.brief
     });
    
     // This event expects a click on a marker
     // When this event is fired the Info Window is opened.
     google.maps.event.addListener(marker, 'click', function() {
         infowindow.open(map, marker);
     });
     // Event that closes the Info Window with a click on the map
     google.maps.event.addListener(map, 'click', function() {
         infowindow.close();
     });
     
     gmarkers.push(marker);
     
     nearEvents.append("<a href='#myModal' id='" + event.id + "' address='" + event.address + "' brief='" + event.brief + "' detail='" + event.detail + "' flag='" + 0 +"' contact='" + event.contact + "' startTime='" + event.startTime + "' endTime='" + event.endTime + "' location='" + event.location + "' onclick='showOnMap(this)' class=' list-group-item list-group-item-action' data-toggle='modal'>" + event.brief + "</a>")
     tags.push(event.tag);
     if (filter == "All" || filter == event.tag) {
         show.push(1);
         marker.setMap(map);
     } else {
         show.push(0);
         marker.setMap(null);
     }
};

/*
 * Show corresponding bounce marker on map and trigger modal to
 * show event detail information.
 */
  
function showOnMap(e) {
    populateModal(e, e.getAttribute("flag"))    
    let locationString = e.getAttribute("location")
    let latlng = parseLocation(locationString)
    map.setCenter(latlng)
    for (let i = 0; i < show.length; i++) {
        if (show[i] == 1) {
            gmarkers[i].setMap(null)
        }
    }
    let newMarker = new google.maps.Marker({
         position: latlng,
         map: map,
         title: e.getAttribute("brief")
     });

    if (lastBounce != null) {
       lastBounce.setMap(null) 
    }    
    lastBounce = newMarker
    lastBounce.setAnimation(google.maps.Animation.BOUNCE)
}

/**
 * Helper function to add data to different lists
 * @args
 * list list to add events on
 * data array of events 
 **/

function populateModal(e, flag) {
    let tempString = "<div class='modal-header'><h4 class='modal-title' id='myModalLabel'>" +e.getAttribute('brief')+"</h4>" +
    "<a id='closeEventModal' href='#' data-dismiss='modal' aria-label='Close'><span" + "aria-hidden='true'><i class='fa fa-arrow-left 'aria-hidden='true'></i></span></a>" + "</div><div class='card' style='width: 450px;'>" +
      "<img class='card-img-top' src='../static/img/cardPlaceholder.jpg' height='300px' alt='Card image cap'>" +
      "<div class='card-block'>" +
        "<h5 class='card-title'>Detail description</h5>" +
        "<p class='card-text'>" + e.getAttribute('detail') + "</p>" +
        "<h5 class='card-title'>Address</h5>" + 
        "<p class='card-text'>" + e.getAttribute('address') + "</p>" +
        "<h5 class='card-title'>Contact Information</h5>" +
        "<p class='card-text'>" + e.getAttribute('contact') + "</p>" +                 
        "<h5 class='card-title'>Event Time</h5>" +
        "<p class='card-text'>From: " + e.getAttribute('startTime') + "</p>" +
        "<p class='card-text'>To:   " + e.getAttribute('endTime') + "</p>";
    
        if (flag == 0) {
            tempString += "<a href='#' class='btn btn-primary' onclick='like("+ e.getAttribute('id') +")'>Add to Favorites</a>"
        }

        if (flag == 1) {
            tempString += "<a href='#' class='btn btn-primary' onclick='stopLike("+ e.getAttribute('id') +")'>Remove</a>"
        }
        if (flag == 2) {
            tempString += "<a href='#' class='btn btn-primary' onclick='startEditEvents("+ e.getAttribute('id') +")'>Edit</a>"
        }
    $(".my-modal-content").html(tempString)
}

function stopLike(id) {
    $.get("/stop_like/" + id).done(function(data){
        alert("Removed, now refresh the page")
        location.reload();
    });
}

function like(id) {
    $.get("/like/" + id).done(function(data){
        alert("Added");
    });
}

function startEditEvents(id) {
    var e = document.getElementById('edit_button');
    e.setAttribute("event_id", id);
    $('#editEvent').modal('show');
}

function editEvents() {
    var obj = {};
    obj['brief'] = document.getElementById('brief2').value;
    obj['detail'] = document.getElementById('detail2').value;
    obj['address'] = document.getElementById('address2').value;
    obj['contact'] = document.getElementById('contact2').value;
    var tag_e =  document.getElementById('tag2');
    if (tag_e.selectedIndex != 0) {
        obj['tag'] = tag_e.options[tag_e.selectedIndex].value;
    }
    obj['start_date'] = document.getElementById('start_date2').value;
    obj['start_time'] = document.getElementById('start_time2').value;
    obj['end_date'] = document.getElementById('end_date2').value;
    obj['end_time'] = document.getElementById('end_time2').value;

    var id = $(this).attr('event_id');
    $.post( "/edit-event/" + id + "/", JSON.stringify(obj))
        .done(function(data) {
        if (data['res'] == "success") {
            alert("Event Edited!");
            $('#editEvent').modal('hide');
            document.getElementById('brief').value="";
            document.getElementById('detail').value="";
            document.getElementById('address').value="";
            document.getElementById('contact').value="";
            document.getElementById('start_date').value="";
            document.getElementById('start_time').value="";
            document.getElementById('end_date').value="";
            document.getElementById('end_time').value="";
            location.reload();
        } else {
            alert("Editing Event Failed!");
        }
    }).fail(function(data) {
        alert("Editing Event Failed! Please make sure your inputs are correct.")
    });
}

/**
 * Helper function to add data to different lists
 * @args
 * list list to add events on
 * data array of events 
 **/
function populateList(list, events, flag) {
    // clear list before populate
    //list.empty()
    
    // traverse data to add on list
    for (let i = 0; i < events.length; i++) {
        let event = events[i];
        list.append("<a href='#myModal' id='" + event.id + "' brief='" + event.brief + "' detail='" + event.detail + "' flag='" + flag +"' contact='" 
            + event.contact + "' address='" + event.address + "' startTime='" + event.startTime + "' endTime='" + event.endTime + "' location='" + event.location + "' onclick='showOnMap(this)' class=' list-group-item list-group-item-action' data-toggle='modal'>" + event.brief + "</a>")
    }
}

/**
 * Event handler for tab button createdButton, which is used to send get request 
 * and get created events, add data on list.
 **/
function getCreated() {
    let created = $("#createdEvents")
    $.get("/event-list")
         .done(function(data){
        created.empty();
        populateList(created, data.events, 2);
    });
}

function getFavorites() {
    let favorites = $("#favoriteEvents")
    $.get("/favorites-list")
         .done(function(data){
        favorites.empty();
        populateList(favorites, data.events, 1);
    });
}

function editInterests() {
    var tags = []
    var all = document.getElementsByTagName('INPUT');
    for (var i = 0; i < all.length; i ++) {
        if (all[i].getAttribute("type") == "checkbox") {
            if (all[i].checked) {
                tags.push(all[i].getAttribute("value"));
            }
        }
    }
    if (tags.length == 0) {
        alert("Please pick at least one interest!");
    } else {
        var obj = {'tags' : tags};
        $.post( "/edit-profile", JSON.stringify(obj), function(data) {
            if (data['res'] == "success") {
                alert("Edits Submitted!");
                $('#editInterest').modal('hide');
            } else {
                alert("Edits Failed!");
            }
        });
    }
};
function addEvents() {
    var obj = {};
    obj['brief'] = document.getElementById('brief').value;
    if (obj['brief'] == '') {
        alert("Title is required");
        return;
    }
    obj['detail'] = document.getElementById('detail').value;
    if (obj['detail'] == '') {
        alert("Detail is required");
        return;
    }
    obj['address'] = document.getElementById('address').value;
    if (obj['address'] == '') {
        alert("Address is required");
        return;
    }
    obj['contact'] = document.getElementById('contact').value;
    if (obj['address'] == '') {
        alert("Address is required");
        return;
    }
    var tag_e =  document.getElementById('tag');
    if (tag_e.selectedIndex == 0) {
        alert("Tag is required");
        return;
    } 
    obj['tag'] = tag_e.options[tag_e.selectedIndex].value;
    obj['start_date'] = document.getElementById('start_date').value;
    obj['start_time'] = document.getElementById('start_time').value;
    obj['end_date'] = document.getElementById('end_date').value;
    obj['end_time'] = document.getElementById('end_time').value;
    if (obj['start_date'] == '' || obj['start_time'] == '' || obj['end_date'] == '' || obj['end_time'] == '') {
        alert("Date and Time are required");
        return;
    }

    $.post( "/add-event", JSON.stringify(obj))
        .done(function(data) {
        if (data['res'] == "success") {
            alert("Event Added!");
            $('#addEvent').modal('hide');
            document.getElementById('brief').value="";
            document.getElementById('detail').value="";
            document.getElementById('address').value="";
            document.getElementById('contact').value="";
            document.getElementById('start_date').value="";
            document.getElementById('start_time').value="";
            document.getElementById('end_date').value="";
            document.getElementById('end_time').value="";
        } else {
            alert("Adding Event Failed!");
        }
    }).fail(function(data) {
        alert("Adding Event Failed! Please make sure your inputs are correct.")
    });
};
// Function to validate address field
function doGeocode() {
  var addr = document.getElementById("address");
  // Get geocoder instance
  var geocoder = new google.maps.Geocoder();

  // Geocode the address
  geocoder.geocode({
    'address': addr.value
  }, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK && results.length > 0) {

      // set it to the correct, formatted address if it's valid
      //addr.value = results[0].formatted_address;;

      // show an error if it's not
    } else {alert("Invalid address");return;}
  });
};

/**
 * Function called when document is loaded.
 **/
$(document).ready(function() {
    // sidebar animations
    $("#sidebar").mCustomScrollbar({
        theme: "minimal"
    });
    
    // click dismiss and event button will close sideBar 
    $('#dismiss, #eventsButton, .overlay').on('click', function () {
        $('#sidebar').removeClass('active');
        $('.overlay').fadeOut();
     });
    
    // click menu button and close event modal will triger the sidebar active
    $('#sidebarCollapse, #closeModal').on('click', function () {
        $('#sidebar').addClass('active');
        $('.overlay').fadeIn();
        $('.collapse.in').toggleClass('in');
        $('a[aria-expanded=true]').attr('aria-expanded', 'false');
     });

    // event modal actions
    $("#eventModal").mCustomScrollbar({
       theme: "minimal"
    });
    
    // when event modal close
    $('#closeModal, .overlay').on('click', function () {
        $('#eventModal').removeClass('active');
        $('.overlay').fadeOut();
        // clear the bounce button
        if (lastBounce != null) {
            lastBounce.setMap(null)
        }
        lastBounce = null
        
        
        // clear nearEvents list
        nearEvents = nearEvents.empty()
        // reset max-time to enable showing all nearest events use current location
        mapDiv.data('max-time', '1970-01-01T00:00+00:00')
        map.setCenter(currentLocation)
                    
    });

    $('#eventsButton').on('click', function () {
        $('#eventModal').addClass('active');
        $('.overlay').fadeIn();
        $('.collapse.in').toggleClass('in');
        $('a[aria-expanded=true]').attr('aria-expanded', 'false');
    });
    
    // set Ajax request interval
    window.setInterval(getUpdates, 5000);
    
    $("#searchEvent").click(geocodeAddress);
    $("#filter").click(removeMarkers);
    
    $("#createdButton").click(getCreated);
    $("#favoritesButton").click(getFavorites);

    $("#interest_button").click(editInterests);
    $("#add_button").click(addEvents);
    $('#edit_button').click(editEvents);


    function getCookie(name) {
         var cookieValue = null;
         if (document.cookie && document.cookie != '') {
             var cookies = document.cookie.split(';');
             for (var i = 0; i < cookies.length; i++) {
                 var cookie = jQuery.trim(cookies[i]);
                 // Does this cookie string begin with the name we want?
                 if (cookie.substring(0, name.length + 1) == (name + '=')) {
                     cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                     break;
                 }
             }
         }
         return cookieValue;
     }
     var csrftoken = getCookie('csrftoken');
     $.ajaxSetup({
         beforeSend: function(xhr, settings) {
             xhr.setRequestHeader("X-CSRFToken", csrftoken);
         }
     });
 });