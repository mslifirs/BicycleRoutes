/**
 * Enables auto complete service for places and form handling
 */

var autocompleteService; // global for google places autocomplete service

$(document).ready(function () {
	initAutoComplete();
});

/**
 * Initiates the auto completition feature
 */
function initAutoComplete() {
	// load autocomplete service
	autocompleteService = new google.maps.places.AutocompleteService();
	
	// add handler on input fields if text is entered
	$('input').keyup(function () {
		$("body").data("currentInputId", this.id); // store id of current input
		getAutoCompletePredictions($(this).val()); // get predictions for current value
	});
	
	// add handler if element loses focus
	// FIXME: This a really bad hack that depends on how fast the browser works.
	//		  The blur event is delayed so the function that is called clicking a 
	//		  can be processed before the list is being removed.
	//		  Would be better to check if the focus is now on the list so the list 
	//		  wont be removed but this didn't work, because on blur the new element
	//		  hasn't already gained the focus.
	$('input').blur(function() {
		var id = this.id;
		var delay = function() {
			remover(id);
		};
		setTimeout(delay, 200,1);
		function remover(id)
		{
			$("#" + "predictions_" + id).remove();
		}
	});
}

/**
 * Is being called when an input changes.
 * Gets predictions from google autocomplete service and hands them to autocompleteCallback
 */
function getAutoCompletePredictions(inputval) {
	if (inputval.length > 0) {
		autocompleteService.getQueryPredictions({
			input: inputval
		}, autocompleteCallback);
	} else {
		autocompleteCallback(null, null);
	}
}

/**
 * Is called from getAutoCompletePredictions if results were retrieved (esp. if input was not empty).
 * Generates html code for prediction list and appends it to current input field
 */
function autocompleteCallback(predictions, status) {
	var currentInputId = $("body").data("currentInputId"); // get current input field
	var currentInputPredictionsId = "predictions_" + currentInputId; // id for current input field
	
	// if a list is already present remove it first
	if ($('#' + currentInputPredictionsId)) {
		$('#' + currentInputPredictionsId).remove();
	}
	if (predictions != null) { // if text was entered add predictions list
		// check if status was ok
		if (status != google.maps.places.PlacesServiceStatus.OK) {
			alert(status);
			return;
		}
		
		var predictionStr = '<ul class="predictions" id="' + currentInputPredictionsId + '">';
		for (var i = 0, prediction; prediction = predictions[i]; i++) {
			predictionStr += '<li><a href="javascript:void(0);" onclick="setFocusedFieldToString(this)">' 
				+ prediction.description + '</a></li>';
		}
		predictionStr += "</ul>";
		
		// add list after input field node
		$("#" + currentInputId).after(predictionStr);
		
	}
};

/**
 * adds the value of the selected link to the current input field
 */
function setFocusedFieldToString(e) {
	var currentInputId = $("body").data("currentInputId"); // get current input field
	var currentInput = $("#" + currentInputId);
	$(currentInput).attr("value", $(e).html());
	$(currentInput).focus();
}