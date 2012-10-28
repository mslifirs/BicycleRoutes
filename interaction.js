var geocoder;
var position;
var formatted_adress;
var rendererOptions = {
	draggable: true
};
var directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);;
var directionsService = new google.maps.DirectionsService();
var map;
var chart;
var elevator;
var path;
var distance;
var elevationPathlocations = [];
var marker;

// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {
	packages: ['corechart']
	});
			
// do when page is loaded
$(document).ready(function() {
				
	// call init function:
	initialize();
				
	// enable autocomplete
	var input = document.getElementById('start');
	var options = {
		bounds: defaultBounds,
		types: ['establishment']
	};
	autocomplete = new google.maps.places.Autocomplete(input, options);
				
	// prevent search form from submitting / reloading site
	$(searchform).submit(function(e) {
		e.preventDefault();
	});
});
				
			
function initialize() {
	map = getMap();
	
	// Create marker
	marker = new google.maps.Marker({
		map: map
	});			
	// Create an ElevationService.
	elevator = new google.maps.ElevationService();				
				
	// Create WeatherLayer
	var weatherLayer = new google.maps.weather.WeatherLayer({
		temperatureUnits: google.maps.weather.TemperatureUnit.CELSIUS
	});
	weatherLayer.setMap(map);

	var cloudLayer = new google.maps.weather.CloudLayer();
	cloudLayer.setMap(map);
		
	// Create BikeLayer
	var bikeLayer = new google.maps.BicyclingLayer();
	bikeLayer.setMap(map);
				
	// Create DirectionDisplay
	directionsDisplay.setMap(map);
	directionsDisplay.setPanel(document.getElementById('directionsPanel'));
				
	geocoder = new google.maps.Geocoder();
	initPosition(); // get user position, set map and search field in callback
	$('#start').focus(); // focus on search field
}
			
function getMap() {
	var mapOptions = {
		center: new google.maps.LatLng(60.17295,24.93981),
		disableDefaultUI: true,
		zoom: 12,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
				
	return new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}
			
function initPosition() {
	$('#usedetectedposition').hide();
	try {
		navigator.geolocation.getCurrentPosition(success, error);
	} catch (e) {
		alert('geolocation not supported, ' + e.msg );
	}
	function success(currentPosition) {
		position = currentPosition;
		var lat = position.coords.latitude;
		var lng = position.coords.longitude;
		var latlen = new google.maps.LatLng(lat, lng);
		map.setCenter(latlen, 13);
		setStartByLatLng(latlen);
	}
	function error(msg) {
		alert('error: ' + msg);
	}
}
			
function setStartByLatLng(latlng) {
	geocoder.geocode({
		'latLng': latlng
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
			formatted_adress = results[0].formatted_address.toString();
			$('#usedetectedposition').text("Starting from \"" + formatted_adress + "\"?");
			$('#usedetectedposition').slideDown('fast');
		} else {
			alert("Geocoder failed due to: " + status);
		}
	});
}
			
function setStartToPosition() {
	$('#start').val(formatted_adress);
	$('#start').focus();
}
			
			
function calcRoute() {

	var request = {
		origin: 'Metsala, Helsinki, Suomi',
		destination: 'Albertinkatu, Helsinki, Suomi',
		travelMode: google.maps.DirectionsTravelMode.BICYCLING
	};
		
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);
			path = response;
			drawPath();
		}
		else {
			recalcRoute();
		}
          
	});
		
}
function recalcRoute() {

	var request = {
		origin: 'Metsala, Helsinki, Suomi',
		destination: 'Albertinkatu, Helsinki, Suomi',
		travelMode: google.maps.DirectionsTravelMode.DRIVING
	};
		  
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(response);
			path = response;
			drawPath();
		}
	});
		 
        
}
	  
	  
function drawPath() {

	// Create a new chart in the elevation_chart DIV.
	var pathpoints = [];
	pathpoints = path.routes[0].overview_path;
	distance = path.routes[0].legs[0].distance.value;

	// Create a PathElevationRequest object using this array.
	// Ask for 256 samples along that path.
	var pathRequest = {
		'path': pathpoints,
		'samples': 500
	}

	// Initiate the path request.
	elevator.getElevationAlongPath(pathRequest, plotElevation);
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(results, status) {
	if (status == google.maps.ElevationStatus.OK) {
		elevations = results;

		// Extract the elevation samples from the returned results
		// and store them in an array of LatLngs.
		var elevationPath = [];
		for (var i = 0; i < results.length; i++) {
			elevationPath.push(elevations[i].location);
			elevationPathlocations.push(elevations[i].location);
		}
			

		// Count total elevation
			var max = Math.max.apply(Math, elevationPath);
			var min = Math.min.apply(Math, elevationPath);
			var totalelevation = max.toFixed(0) - min.toFixed(0);
			totalelevation = parseFloat(totalelevation);
			if (totalelevation < 30){
				//alert("Route profile: flat. Total elevation: " + totalelevation);
				}
			else if (totalelevation > 30 && totalelevation < 100){
				//alert("Route profile: hilly. Total elevation: " + totalelevation);
				}
			else if (totalelevation > 100 && totalelevation < 500){
				//alert("Route profile: hard. Total elevation: " + totalelevation);
				}
			else if (totalelevation > 500){
				//alert("Route profile: extreme. Total elevation: " + totalelevation);
				}

          // Extract the data from which to populate the chart and decrease precision
          var dataTable = new google.visualization.DataTable();
		  var sample = distance/results.length; 
		  sample = sample.toFixed(2);
		  sample = parseFloat(sample);
          dataTable.addColumn('number', 'Distance');
          dataTable.addColumn('number', 'Elevation');
          for (var i = 0; i < results.length; i++) {
		var temp = elevations[i].elevation;
		temp = temp.toFixed(2);
		temp = parseFloat(temp);
        	dataTable.addRow([i*sample, temp]);
          }
		var formatter1 = new google.visualization.NumberFormat({suffix: 'm'});
		formatter1.format(dataTable, 0); // Apply formatter to first column
		var formatter2 = new google.visualization.NumberFormat({suffix: 'm'});
		formatter2.format(dataTable, 1); // Apply formatter to first column
		  
		  // Draw the chart using the data within its DIV.
		  chart = new google.visualization.ColumnChart(document.getElementById('elevation_chart'));
		
          document.getElementById('elevation_chart').style.display = 'block';
          var options = {
            	width: 1000,
           	height: 200,
		legend: 'none',
            	titleY: 'Elevation (m)',
		titleX: 'Distance (m)'
          }
		
		chart.draw(dataTable, options);
		  
		// Adding event listener to chart
		google.visualization.events.addListener(chart, 'select', selectHandler);
		var marker = new google.maps.Marker({
            		position: position,
            		map: map
        	});
			
	}
}

function selectHandler(e) {
		var selection = chart.getSelection()
		for (var i = 0; i < selection.length; i++){
		var number = selection[i].row;
		var position = elevationPathlocations[number];
			marker.setPosition(position);
		}
		}