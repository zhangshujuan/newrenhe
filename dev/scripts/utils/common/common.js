define(function(require, exports, module) {
	window.$ = window.jQuery = require("$");
	require("collapse");
	function showScroll(){
		$(window).scroll( function() { 
			var scrollValue=$(window).scrollTop();
			scrollValue > 100 ? $('#backToTop').fadeIn():$('#backToTop').fadeOut();
		} );	
		$('#backToTop').click(function(){
			$("html,body").animate({scrollTop:0},200);	
		});	
	}
	showScroll();
})