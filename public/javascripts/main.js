function scroll_to_div(div) {
	$("body").animate({
		scrollTop: $(div).offset().top
	}, 1200,
	'swing');	
}