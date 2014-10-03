(function ($) {
	"use strict";

	//all frames selectors
	var frames = []
	var framesItems = [] 
	//last element per frame
	var lastPerFrame = [];
	//curent frame
    var currentFrame = 0;

    //current slide (slide list starts at '1')
    var currentSlide = 0;

    //Process all presentation's elements
    var processFrames = function() {
    	$('.frame').each(function (i) {
    		lastPerFrame[i] = 0;
    		framesItems[i] = [];
    		frames[i] = $(this);
    		var currentItems = {};
    		$(this).find('[data-onslide]').each(function (j) {
    			var slides =  $(this).attr('data-onslide').split(",");
    			var slideItem = getSlideItem(slides, $(this), i);
    			framesItems[i].push(slideItem);
    			//Hiding item
    			$(this).css('opacity', 0);
    		});

    		$(this).css('display', 'none');
    	});
    	//Showing first slide
		frames[currentFrame].css('display', 'block');
		//Increasing first slide show
    	next();
    };

    //Returns a 'slideItem' object containing
    //the html selector and slide intervals given
    //[data-onslide] attr
    var getSlideItem = function (slides, item, frameIndex){
    	var slideIntervals = []
    	var slideItem = {};
    	slideItem.item = item;
    	slideItem.slideIntervals = slideIntervals;
    	//Having issues with \d (don't know why)
		var reg = new RegExp( '([1-9][0-9]*)?(-)?([1-9][0-9]*)?')
		slides.forEach(function (slide) {
			var interval = {};
			var matches = reg.exec(slide);
			//Only one slide
			if(matches[2] == undefined){
				interval.lower = matches[1] || 0;
				interval.upper = matches[1] || -1;
			} else {
				//getting lower and upper intervals
				interval.lower = matches[1] || 0;
				interval.upper = matches[3] || -1;
			}
			lastPerFrame[frameIndex] = Math.max(lastPerFrame[frameIndex], interval.upper);
			lastPerFrame[frameIndex] = Math.max(lastPerFrame[frameIndex], interval.lower);
			slideIntervals.push(interval);
		});

		return slideItem;
    };

    //Show all slide items that are 'present' on
    //next slide 
    var next = function(){
    	if (lastPerFrame[currentFrame] == currentSlide){
    		currentSlide = 0;
    		nextFrame();
    	}
    	currentSlide++;
    	updateSlideItems();
    };

    //Show all slide items that are 'present' on
    //previous slide 
    var previous = function (){
    	if (currentSlide == 0){
    		previousFrame();
    		currentSlide = lastPerFrame[currentFrame] + 1;
    	}
    	currentSlide--;
    	updateSlideItems();
    };

    //Shows all slide items present on current slide
    //and hide all that aren't
    var updateSlideItems = function () {
    	//Updating all items status
    	framesItems[currentFrame].forEach(function (slideItem){
    		var flag = false;
    		slideItem.slideIntervals.forEach(function (interval){
    			if (interval.lower <= currentSlide && (interval.upper == -1 || interval.upper >= currentSlide)){
    				flag = true;
    				return false;
    			}
    		});

    		if (flag){
    			slideItem.item.css('opacity', 100);
    			//Checking for videos and audio tags
    			if (slideItem.item.is('video') || slideItem.item.is('audio')){
    				slideItem.item.trigger('play');
    			}
    		} else {
    			slideItem.item.css('opacity', 0);
    			if (slideItem.item.is('video') || slideItem.item.is('audio')){
    				slideItem.item.trigger('pause');
    			}
    		}


    	});	
    };

    var nextFrame = function(){
    	if(currentFrame + 1 < frames.length){
    		//Thing about doing different transitions
    		frames[currentFrame].css('display', 'none');
    		frames[++currentFrame].css('display', 'block');
    	}
    };



    var previousFrame = function(){
    	if(currentFrame - 1 >= 0){
    		//Thing about doing different transitions
    		frames[currentFrame].css('display', 'none');
    		frames[--currentFrame].css('display', 'block');
    	}
    };

    $.fn.beampress = function (options){
    	processFrames();

    	//triggering key up
		$(document).keyup(function (event){

			//right arrow || space bar
			if(event.which == 39 || event.which == 32){
			    next();
			}
			//left arrow
			if(event.which == 37){
				previous();
			}
		});
		//Providing chaining
		return this;
    };



}(jQuery));