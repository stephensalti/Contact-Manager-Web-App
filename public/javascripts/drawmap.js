//For Final Project!! Draws google maps map to page and places markers based on latitude and longitude of entered by user
var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map') , {
    	center: {lat: 41.0819319, lng: -74.175816},
         zoom: 9
    	});
    //console.log("init map is executing");
    addMarkers();
}
function addMarkers() {
	//getting latitude and longitude from each row/contact in table
	var lats = $(".lat");
	var lat_coords = [];
	var lngs = $(".lng");
	var lng_coords =[];
	for (var i = 0; i < lats.length; i++) { lat_coords[i] = $(lats[i]).text(); }
	for (var i = 0; i < lngs.length; i++) { lng_coords[i] = $(lngs[i]).text(); }
	for (var i = 0; i < lat_coords.length; i++) {
		var formatted_address = $(lats[i]).siblings(".formattedAddress").text();
		//console.log(formatted_address);
		coords = {lat: Number(lat_coords[i]), lng: Number(lng_coords[i])}; //have to convert lat_coords to number!
		var marker = new google.maps.Marker({
			position: coords, //position excepts two properties: lat, and lng
			map: map,
			title: formatted_address //tooltip will be attached to marker showing its address
		}); 
	} 
} 	
	 

