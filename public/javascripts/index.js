$(function(){
	$("#arrow").click(function(){
		$("body").animate({
			scrollTop: $("#container-activity").offset().top
		}, 1500,
		'swing');	
	});
});