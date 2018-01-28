 var map = null;
 var infowindow;
 var prev_infowindow = false;
 var currentLocation = { lat: 40.4, lng: -79.9 };


 var bounds;


 var mapDiv = $("#map");
 var geocoder;

 var gmarkers = [];
 var tags = [];
 var show = [];

 function initMap() {
     // Initial map
     geocoder = new google.maps.Geocoder();
     map = new google.maps.Map(document.getElementById('map'), {
         zoom: 15,
         center: currentLocation
     });
     infowindow = new google.maps.InfoWindow;

     bounds = new google.maps.LatLngBounds();

     if (navigator.geolocation) {
         // Get the current location
         navigator.geolocation.getCurrentPosition(function(position) {
             loc = {
                 lat: position.coords.latitude,
                 lng: position.coords.longitude
             };

             currentLocation = loc;

             // Display current location
             //infowindow.setPosition(currentLocation);
             //infowindow.setContent('Location found.');
             //infowindow.open(map);

             // map.setCenter(currentLocation);



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
         // Browser doesn't support Geolocation
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
             getUpdates()
         } else {
             alert('Geocode was not successful for the following reason: ' + status);
         }
     });
 }

 function showEvent(event_id) {
     // Open the tap-target
     $('.tap-target').tapTarget('open');
     $.get("/show-event/" + event_id)
         .done(function(data) {
             var event = data;
             var ul = document.getElementById("tap-target-content");
             ul.innerHTML = null;
             var li1 = document.createElement("h5");
             var li2 = document.createElement("h5");
             var li3 = document.createElement("h5");
             var li4 = document.createElement("h5");
             console.log(event.id)
             li1.innerHTML = "Brief: " + event.brief
             li2.innerHTML = "Detail: " + event.detail
             li3.innerHTML = "Address: " + event.address
             li4.innerHTML = "Tag: " + event.tag
             console.log(event.tag)
             ul.appendChild(li1);
             ul.appendChild(li2);
             ul.appendChild(li3);
             ul.appendChild(li4);
         });
 }

 /* filter button event listener*/
 function removeMarkers() {

     let filter = $("#filterTag")[0].value;
     //console.log(filter)
     for (var i = 0; i < gmarkers.length; i++) {
         if (filter == undefined || filter == null || filter == "" || tags[i] == filter) {
             // if (show[i] == 0) {
             gmarkers[i].setMap(map);
             show[i] = 1;
             // }
         } else {
             // if (show[i] == 1) {
             gmarkers[i].setMap(null);
             show[i] = 0;
             // }
         }
     }
 }

 /* Ajax updates */
 function getUpdates() {

     var max_time = mapDiv.data("max-time")
     if (max_time == undefined || max_time == null || max_time == '') {
         max_time = "1970-01-01T00:00+00:00"
     }

     $.get("/get-changes/" + currentLocation.lng + "/" + currentLocation.lat + "/" + max_time)
         .done(function(data) {
             mapDiv.data('max-time', data['max-time']);

             //let filter = $("filterTag").val();
             let filter = $("#filterTag")[0].value;
             //console.log(filter);
             for (let i = 0; i < data.events.length; i++) {
                 let event = data.events[i];
                 createMarker(event)

             }
         });
 }

 // This function creates each marker and sets their Info Window content
 function createMarker(event) {
     let filter = $("#filterTag")[0].value;
     let locationString = event.location;
     let startIndex = locationString.indexOf("(") + 1;
     let splitIndex = locationString.lastIndexOf(" ");
     let endIndex = locationString.lastIndexOf(")");
     let lngValue = parseFloat(locationString.substring(startIndex, splitIndex));
     let latValue = parseFloat(locationString.substring(splitIndex + 1, endIndex));
     let brief = event.brief
     let detail = event.detail
     let latlng = new google.maps.LatLng(latValue, lngValue);
     // InfoWindow content
     var content = '<div id="iw-container">' +
         '<div class="iw-title">' + brief + '</div>' +
         '<div class="iw-content">' +
         '<div class="iw-subTitle">Event Description</div>' +
         '<img src="#" alt="user image" height="115" width="83">' +
         '<p>' + detail + '</p>' +
         '<div class="iw-subTitle">Contacts</div>' +
         '<p>' + event.contact + '</p>' +
         '</div>' +
         '<div class="iw-bottom-gradient"></div>' +
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
         title: brief
     });

     // This event expects a click on a marker
     // When this event is fired the Info Window is opened.
     google.maps.event.addListener(marker, 'click', function() {
         infowindow.open(map, marker);
     });

     // START INFOWINDOW CUSTOMIZE.
     // The google.maps.event.addListener() event expects
     // the creation of the infowindow HTML structure 'domready'
     // and before the opening of the infowindow, defined styles are applied.
     // *
     google.maps.event.addListener(infowindow, 'domready', function() {

         // Reference to the DIV that wraps the bottom of infowindow
         var iwOuter = $('.gm-style-iw');

         /* Since this div is in a position prior to .gm-div style-iw.
          * We use jQuery and create a iwBackground variable,
          * and took advantage of the existing reference .gm-style-iw for the previous div with .prev().
          */
         var iwBackground = iwOuter.prev();

         // Removes background shadow DIV
         iwBackground.children(':nth-child(2)').css({ 'display': 'none' });

         // Removes white background DIV
         iwBackground.children(':nth-child(4)').css({ 'display': 'none' });

         // Moves the infowindow 115px to the right.
         iwOuter.parent().parent().css({ left: '0px' });

         // Moves the shadow of the arrow 76px to the left margin.
         iwBackground.children(':nth-child(1)').attr('style', function(i, s) { return s + 'left: 76px !important;' });

         // Moves the arrow 76px to the left margin.
         iwBackground.children(':nth-child(3)').attr('style', function(i, s) { return s + 'left: 76px !important;' });

         // Changes the desired tail shadow color.
         iwBackground.children(':nth-child(3)').find('div').children().css({ 'box-shadow': 'rgba(72, 181, 233, 0.6) 0px 1px 6px', 'z-index': '1' });

         // Reference to the div that groups the close button elements.
         var iwCloseBtn = iwOuter.next();

         // Apply the desired effect to the close button
         iwCloseBtn.css({ opacity: '1', right: '0px', top: '3px', border: '7px solid #48b5e9', 'border-radius': '13px', 'box-shadow': '0 0 5px #3990B9' });

         // If the content of infowindow not exceed the set maximum height, then the gradient is removed.
         if ($('.iw-content').height() < 140) {
             $('.iw-bottom-gradient').css({ display: 'none' });
         }

         // The API automatically applies 0.7 opacity to the button after the mouseout event. This function reverses this event to the desired value.
         iwCloseBtn.mouseout(function() {
             $(this).css({ opacity: '1' });
         });
     });
     // Event that closes the Info Window with a click on the map
     google.maps.event.addListener(map, 'click', function() {
         infowindow.close();
     });


     gmarkers.push(marker);
     tags.push(event.tag);
     if (filter == undefined || filter == null || filter == "" || filter == data.events[i].tag) {
         show.push(1);
         marker.setMap(map);
     } else {
         show.push(0);
         marker.setMap(null);
     }


 }



 $(document).ready(function() {
     // Periodically refresh to-do list
     window.setInterval(getUpdates, 5000);
     // CSRF set-up copied from Django docs
     $("#searchEvent").click(geocodeAddress);
     $("#filter").click(removeMarkers);


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