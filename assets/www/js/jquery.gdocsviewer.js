/*
 * jQuery.gdocViewer - Embed linked documents using Google Docs Viewer
 * Licensed under MIT license.
 * Date: 2011/01/16
 *
 * @author Jawish Hameed
 * @version 1.0
 */
(function($){
	$.fn.gdocsViewer = function(options) {
		
		var h = $(window).height() - $("#ao-header-bar").height() - 15;
	
		var settings = {
			width  : '100%',
			height : h 
		};
		
		if (options) { 
			$.extend(settings, options);
		}
		
		return this.each(function() {
			var file = $(this).attr('href');
			$(this).after(function () {
				var id = $(this).attr('id');
				var gdvId = (typeof id !== 'undefined' && id !== false) ? id + '-gdocsviewer' : '';
				return '<div id="' + gdvId + '" class="gdocsviewer"><iframe src="http://docs.google.com/viewer?embedded=true&url=' + encodeURIComponent(file) + '" width="' + settings.width + '" height="' + settings.height + '" style="border: none;"></iframe></div>';
			})
		});
	};
})( jQuery );