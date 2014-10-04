(function ($) {
	"use strict";

	//all frames 
	var frames = []
    //all framesItem per frame
	var framesItems = [] 
	//last element per frame
	var lastPerFrame = [];
	//curent frame
    var currentFrame = 0;

    //current slide (slide list starts at '1')
    var currentSlide = 0;

    //Process all presentation's elements
    var processFrames = function() {
        var againFrames = []
    	$('.frame').each(function (i) {
            var hasAgainFrame = false;
            var hasOnSlide = false;
            //Checks for frames [data-onslide]
            // For some browsers, `attr` is undefined; for others,
            // `attr` is false.  Check for both.
            if ($(this).attr('data-onslide') !== undefined && $(this).attr('data-onslide') !== false)
                hasOnSlide = true;

            if ($(this).attr('data-againframe') !== undefined && $(this).attr('data-againframe') !== false)
                hasAgainFrame = true;            

            var frame = {'item' : $(this)};
            frame.slideIntervals = hasOnSlide ? getSlideIntervals($(this), i) : [];
    		frames[i] = frame;
            framesItems[i] = [];
    		$(this).find('[data-onslide]').each(function (j) {
    			var slideItem = {'item' : $(this)};
                slideItem.slideIntervals = getSlideIntervals($(this), hasOnSlide ? null : i);
    			framesItems[i].push(slideItem);
    			//Hiding item
    			$(this).css('opacity', 0);
    		});
            //Hiding current frame
    		$(this).css('display', 'none');

            //Adding the 'againframe' to the list of pendings againframes
            if(hasAgainFrame){
                var reg = new RegExp(/\s*\[(.*)\]\s*(.*)/);
                var matches = reg.exec($(this).attr('data-againframe'));
                var id = matches[1];
                var intervals = matches[2];               
                var frame = getFrameFromStrId(id);
                if (frame !== null){
                    againFrames.push({'pos' : i + 1, 'frame' : frame, 'intervals': intervals});
                }    
            }
    	});
    	//Showing first slide
		frames[currentFrame].item.css('display', 'block');
        //Processing pending againFrames
        proccessAgainFrames(againFrames);
		//Increasing first slide show
    	next();
    };


    var proccessAgainFrames = function (againFrames){
        againFrames.forEach(function (af) {
            //Inserting the new frame
            frames.splice(af.pos, 0, af.frame);
            //Adding the same items that previous frame have
            framesItems.splice(af.pos, 0, framesItems[af.pos - 1]);
            //Updating the new intervals if they exists
            af.frame.slideIntervals = af.intervals ? getSlideIntervals(af.intervals, af.pos) : [];


        });
    }


    //Returns a new copy of the frame that
    //has 'str' Id
    var getFrameFromStrId = function (str){
        var frame = null;
        frames.forEach(function (f){
            if(f.item.attr('id') !== undefined && 
                f.item.attr('id') !== false && f.item.attr('id') == str){
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
    var getSlideIntervals = function (bag, frameIndex){
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
                lastPerFrame[frameIndex] = 0;
                lastPerFrame[frameIndex] = Math.max(lastPerFrame[frameIndex], interval.upper);
                lastPerFrame[frameIndex] = Math.max(lastPerFrame[frameIndex], interval.lower);
            }
            slideIntervals.push(interval);
        });

        return slideIntervals;               
    }

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
    		frames[currentFrame].item.css('display', 'none');
    		frames[++currentFrame].item.css('display', 'block');
    	}
    };



    var previousFrame = function(){
    	if(currentFrame - 1 >= 0){
    		//Thing about doing different transitions
    		frames[currentFrame].item.css('display', 'none');
    		frames[--currentFrame].item.css('display', 'block');
    	}
    };

    $.fn.beampress = function (options){
    	processFrames();
        // console.log(frames);
        // console.log(lastPerFrame);
        // console.log(framesItems);
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