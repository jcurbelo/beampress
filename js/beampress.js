(function ($) {
	"use strict";

	//all frames 
	var frames = []
    //all framesItem per frame
	var framesItems = [] 
	//last element per frame
	var lastPerFrame = [];
	//current frame
    var currentFrame = 0;
    //current slide (slide list starts at '1')
    var currentSlide = 0;

    //Process all presentation's elements
    function init() {
    	$('.frame').each(function (i) {
            var hasAgainFrame = false;
            var hasOnSlide = false;
            var frame = {'item' : $(this)};
            var intervals = $(this);

            if ($(this).attr('data-onslide'))
                hasOnSlide = true;
            
            if ($(this).attr('data-againframe')){
                hasAgainFrame = true;
                var reg = new RegExp(/\s*\[(.*)\]\s*(.*)/);
                var matches = reg.exec($(this).attr('data-againframe'));
                var id = matches[1];
                intervals = matches[2];               
                frame = getFrameFromStrId(id);                              
            }

            lastPerFrame[i] = 1;
            frame.slideIntervals = (hasOnSlide || hasAgainFrame) ? 
                                getSlideIntervals(intervals, i) : [];
    		frames[i] = frame;
            framesItems[i] = [];
            if(!hasAgainFrame)
        		$(this).find('[data-onslide]').each(function (j) {
        			var slideItem = {'item' : $(this)};
                    slideItem.slideIntervals = getSlideIntervals($(this), hasOnSlide ? null : i);
                    // slideItem.styles = undefined;
        			framesItems[i].push(slideItem);
                    if ($(this).attr('data-style')){
                        slideItem.styles = getStylesDict($(this).attr('data-style'));
                    } else {
                        //Hiding item
                        $(this).css('opacity', 0);                    
                    }                   
        		});
            else
                framesItems[i] = getFrameItems(frame.item);
            //Hiding current frame
    		$(this).css('display', 'none');
    	});
    	//Showing first slide
		frames[currentFrame].item.css('display', 'block');
		//Increasing first slide show
    	next();
    };

    function getStylesDict(str){
        //TODO: Check 'str'
        return eval("({" + str +  "})");
    }

    //Returns all slideItems given an item (frame selector)
    function getFrameItems(item){
        for (var i = 0; i < frames.length; i++) {
            if(frames[i].item === item)
                return framesItems[i];
        };

        return null;
    }   

    //Returns a new copy of the frame that
    //has 'str' Id
    function getFrameFromStrId(str){
        var frame = null;
        frames.forEach(function (f){
            if(f.item.attr('id') && f.item.attr('id') == str){
                //TODO: Think about objects for doing COPY
                frame = {'item' : f.item};
                var slideIntervals = [];
                f.slideIntervals.forEach(function (si){
                    slideIntervals.push({
                        'upper' : si.upper,
                        'lower' : si.lower});
                });
                frame.slideIntervals = slideIntervals;
            }
        });
        return frame;
    }

    //Returns the slide intervals given a selector 
    //or an array of slides (bag)
    function getSlideIntervals(bag, frameIndex){
        var slideIntervals = []
        if (!(typeof bag === 'string'))      
           bag = bag.attr('data-onslide').split(',');
        else
            bag = bag.split(',');
        var reg = new RegExp(/(\s*[1-9]\d*)?(\s*-\s*)?(\s*[1-9]\d*\s*)?/);
        bag.forEach(function (slide) {
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
            //Updating last slide per frame
            if(frameIndex !== null){
                lastPerFrame[frameIndex] = Math.max(lastPerFrame[frameIndex], interval.upper);
                lastPerFrame[frameIndex] = Math.max(lastPerFrame[frameIndex], interval.lower);
            }
            slideIntervals.push(interval);
        });

        return slideIntervals;               
    }

    //Show all slide items that are 'present' on
    //next slide 
    function next(){
    	if (lastPerFrame[currentFrame] == currentSlide){
    		currentSlide = 0;
    		nextFrame();
    	}
    	currentSlide++;
    	updateSlideItems();
    };

    //Show all slide items that are 'present' on
    //previous slide 
    function previous(){
    	if (currentSlide == 1){
    		previousFrame();
    		currentSlide = lastPerFrame[currentFrame] + 1;
    	}
    	currentSlide--;
    	updateSlideItems();
    };

    //Shows all slide items present on current slide
    //and hide all that aren't
    function updateSlideItems() {
    	//Updating all items status
        //TODO: Think about doing events
    	framesItems[currentFrame].forEach(function (slideItem){
    		var flag = false;
    		slideItem.slideIntervals.forEach(function (interval){
    			if (interval.lower <= currentSlide && (interval.upper == -1 || interval.upper >= currentSlide)){

                    //Frames also have intervals
                    var frameIntervals = frames[currentFrame].slideIntervals;
                    if(frameIntervals.length > 0) 
                        frameIntervals.forEach(function (fi) {
                            if (fi.lower <= currentSlide && (fi.upper == -1 || fi.upper >= currentSlide)){
                                flag = true;
                                return false;
                            }
                        });
                    else
                        flag = true;

    				if(flag)
    				    return false;
    			}
    		});

    		if (flag){
                if(slideItem.styles)
    			     slideItem.item.css(slideItem.styles);
                else
                    slideItem.item.css('opacity', 100);
    			//Checking for videos and audio tags
    			if (slideItem.item.is('video') || slideItem.item.is('audio')){
    				slideItem.item.trigger('play');
    			}
    		} else {
                if(slideItem.styles)
                     slideItem.item.removeAttr('style');
                else
                    slideItem.item.css('opacity', 0);
    			if (slideItem.item.is('video') || slideItem.item.is('audio')){
    				slideItem.item.trigger('pause');
    			}
    		}


    	});	
    };

    function nextFrame(){
    	if(currentFrame + 1 < frames.length){
    		//Think about doing different transitions
    		frames[currentFrame].item.css('display', 'none');
    		frames[++currentFrame].item.css('display', 'block');
    	}
    };



    function previousFrame(){
    	if(currentFrame - 1 >= 0){
    		//Think about doing different transitions
    		frames[currentFrame].item.css('display', 'none');
    		frames[--currentFrame].item.css('display', 'block');
    	}
    };

    $.fn.beampress = function (options){
    	init();
        console.log(frames);
        console.log(lastPerFrame);
        console.log(framesItems);
        // console.log(getFrameFromStrId('f-frame'));
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