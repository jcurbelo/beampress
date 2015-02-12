/*!
 * Beampress plugin 
 * Original author: @jcurbelo
 */

;(function ( $, window, document, undefined ) {
	"use strict";

    // Create the defaults once
    var pluginName = 'beampress',
        defaults = {
            maxItems: 100,
            showFrameTransition: function ($el){
                        $el.css('display', 'block');
                    },
            hideFrameTransition: function ($el){
                        $el.css('display', 'none');
                    },
            showItemTransition: function ($el){
                        $el.css('opacity', 100);
                    },
            hideItemTransition: function ($el){
                        $el.css('opacity', 0);
                    }                 
            };



    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options) ;
        
        this._defaults = defaults;
        this._name = pluginName;

        //all frames 
        this.frames = [];
        //all framesItem per frame
        this.framesItems = []; 
        //last element per frame
        this.lastPerFrame = [];
        //current frame
        this.currentFrame = 0;
        //current slide (slide list starts at '1')
        this.currentSlide = 0;
        //starting slide for each frame
        this.firstPerFrame = [];  

        this.init();
    }

    Plugin.prototype.init = function () { 

        //Avoiding namespace confusions
        var self = this;

        //Custom 'objects'
        //Slide objects
        function SlideItem($el){
            this.$el = $el;
        }

        SlideItem.prototype.showed = false;

        SlideItem.prototype.hide = function () {
            if(this.styles)
                this.$el.removeAttr('style');
            else
                self.options.hideItemTransition(this.$el);

            //Checking for videos and audio tags

            if (this.$el.is('video') || this.$el.is('audio')){
                this.$el.trigger('pause');
            }                      
            // this.$el.css('opacity', 0);
        };

        SlideItem.prototype.show = function () {
            if(this.styles)
                this.$el.css(this.styles);
            else
                self.options.showItemTransition(this.$el);

            //Checking for videos and audio tags
            if (this.$el.is('video') || this.$el.is('audio')){
                this.$el.trigger('play');
            }  
            
            // this.$el.css('opacity', 100);
        }

        //Frame objects
        function Frame($el){
            this.$el = $el;

            // this.hide = function () {
            //     this.$el.css('display', 'none');
            // };

            // this.show = function () {
            //     this.$el.css('display', 'block');
            // }; 
        }

        var F = function () {}; 
        F.prototype = SlideItem.prototype; 
        Frame.prototype = new F(); 
        Frame.prototype.constructor = Frame; 

        Frame.prototype.hide = function () {
            self.options.hideFrameTransition(this.$el);
            // this.$el.css('display', 'none');
        };

        Frame.prototype.show = function () {
            self.options.showFrameTransition(this.$el);
            // this.$el.css('display', 'block');
        };

        Frame.prototype.getNextSlide = function (currentSlide) {
            currentSlide++;
            if(this.slideIntervals && this.slideIntervals.length)
                for (var i = currentSlide; i <= this.lastSlide; i++) {
                    for(var j = 0; j < this.slideIntervals.length; j++){
                        var si = this.slideIntervals[j];
                        if(si.lower <= i && (si.upper == -1 || si.upper >= i))
                            return i;
                    }
                    currentSlide = i;
                };

            return currentSlide;
        };

        Frame.prototype.getPrevSlide = function (currentSlide) {
            currentSlide--;
            if(this.slideIntervals && this.slideIntervals.length)
                for (var i = currentSlide; i >= this.firstSlide; i--) {
                    for(var j = 0; j < this.slideIntervals.length; j++){
                        var si = this.slideIntervals[j];
                        if(si.lower <= i && (si.upper == -1 || si.upper >= i))
                            return i;
                    }
                    currentSlide = i;
                };

            return currentSlide;
        };                 

        //Process all presentation's elements
        function _init() {

            $('.frame').each(function (i) {
                var hasAgainFrame = false,
                    hasOnSlide = ($(this).attr('data-onslide')),
                    frame = new Frame($(this)),
                    // frame = {'item' : $(this)},
                    intervals = $(this);
                
                if ($(this).attr('data-againframe')){
                    hasAgainFrame = true;
                    var reg = new RegExp(/\s*\[(.*)\]\s*(.*)/),
                        matches = reg.exec($(this).attr('data-againframe')),
                        id = matches[1];
                    intervals = matches[2];               
                    frame = getFrameFromStrId(id);                              
                }

                //Has slides contrains 
                var isOverlayed = hasOnSlide || hasAgainFrame;

                var hasUpperLimit = true;
                self.lastPerFrame[i] = 1;
                self.firstPerFrame[i] = 1;
                var prevFirstSlide = 1;
                frame.slideIntervals = [];

                if(isOverlayed){
                    self.firstPerFrame[i] = self.options.maxItems;
                    hasUpperLimit = setSlideIntervals(frame, intervals, i);
                    prevFirstSlide = self.firstPerFrame[i];    
                }

                self.frames[i] = frame;
                self.framesItems[i] = [];

                //Setting all the 'slide-items'         
                $(frame.$el).find('[data-onslide]').each(function (j) {
                    var slideItem = new SlideItem($(this));
                    setSlideIntervals(slideItem, $(this), (hasUpperLimit && isOverlayed) ? null : i);
                    // slideItem.styles = undefined;
                    self.framesItems[i].push(slideItem);
                    if ($(this).attr('data-style')){
                        slideItem.styles = getStylesDict($(this).attr('data-style'));
                    } else {
                        //Hiding item
                        slideItem.hide();                    
                    }                   
                });

                self.firstPerFrame[i] = prevFirstSlide;

                //Hiding current frame
                $(this).css('display', 'none');
                frame.firstSlide = self.firstPerFrame[i];
                frame.lastSlide = self.lastPerFrame[i];
                // frame.hide();
            });
            //Showing first slide
            self.frames[self.currentFrame].show();

            //Increasing first slide show
            next();
        }

        function getStylesDict(str){
            //TODO: Check 'str'
            return eval("({" + str +  "})");
        }

        //Returns all slideItems given an $el (frame selector)
        function getFrameItems($el){
            for (var i = 0; i < self.frames.length; i++) {
                if(self.frames[i].$el === $el)
                    return self.framesItems[i];
            };

            return null;
        }   

        //Returns a new copy of the frame that
        //has 'str' Id
        function getFrameFromStrId(str){
            var frame = null;
            self.frames.forEach(function (f){
                if(f.$el.attr('id') && f.$el.attr('id') == str){

                    frame =  new Frame(f.$el);
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

        
        // function setFrameSlideIntervals(obj, intervals, frameIndex){
        //     var slideIntervals = [];
        //     var hasUpperLimit = true;
        //     intervals = intervals.split(',');
        //     var reg = new RegExp(/(\s*[1-9]\d*)?(\s*-\s*)?(\s*[1-9]\d*\s*)?/);
        //     intervals.forEach(function (slide){
        //         var interval = {};
        //         var matches = reg.exec(slide);

        //         interval.lower = matches[1] || 0;
        //         //Only one slide
        //         if(matches[2] == undefined){
        //             interval.upper = matches[1] || -1;
        //         } else if (matches[3]){
        //             interval.upper = matches[3];
        //         } else {
        //             interval.upper = -1;
        //             hasUpperLimit = false;
        //         }
        //         var u = interval.upper,
        //             l = interval.lower,
        //             lpf = self.lastPerFrame[frameIndex],
        //             fpf = self.firstPerFrame[frameIndex];

        //         //Getting max interval
        //         self.lastPerFrame[frameIndex] = Math.max(Math.max(u, l), lpf);
        //         //Getting min interbal
        //         self.firstPerFrame[frameIndex] = Math.min(l, fpf);
                
        //         slideIntervals.push(interval);            

        //     });

        //     self.frames[frameIndex].slideIntervals = slideIntervals;
        //     return hasUpperLimit;
        // }

        //Returns the slide intervals given a selector 
        //or an array of slides (bag)
        function setSlideIntervals(obj, bag, frameIndex){
            var slideIntervals = [],
                hasUpperLimit = true;
            if (!(typeof bag === 'string'))      
               bag = bag.attr('data-onslide').split(',');
            else
                bag = bag.split(',');
            var reg = new RegExp(/(\s*[1-9]\d*)?(\s*-\s*)?(\s*[1-9]\d*\s*)?/);
            bag.forEach(function (slide) {
                var interval = {};
                var matches = reg.exec(slide);

                interval.lower = matches[1] || 0;
                //Only one slide
                if(matches[2] == undefined){
                    interval.upper = matches[1] || -1;
                } else 
                    if (matches[3]){
                        interval.upper = matches[3];
                    } else {
                        interval.upper = -1;
                        hasUpperLimit = false;
                    }

                //Updating last and first slide per frame
                if(frameIndex !== null){
                    var u = interval.upper,
                        l = interval.lower,
                        lpf = self.lastPerFrame[frameIndex],
                        fpf = self.firstPerFrame[frameIndex];

                    //Getting max interval
                    self.lastPerFrame[frameIndex] = Math.max(Math.max(u, l), lpf);
                    //Getting min interval
                    self.firstPerFrame[frameIndex] = Math.min(l, fpf);
                }
                slideIntervals.push(interval);
            });
            obj.slideIntervals = slideIntervals;
            return hasUpperLimit;               
        }

        //Show all slide items that are 'present' on
        //next slide 
        function next(){
            if (self.lastPerFrame[self.currentFrame] == self.currentSlide){
                if(self.currentFrame + 1 >= self.frames.length) return;
                nextFrame();
                self.currentSlide = self.firstPerFrame[self.currentFrame] - 1;
            }
            self.currentSlide = self.frames[self.currentFrame].getNextSlide(self.currentSlide);
            updateSlideItems();
        }

        //Show all slide items that are 'present' on
        //previous slide 
        function previous(){
            if (self.currentSlide == self.firstPerFrame[self.currentFrame]){
                if(self.currentFrame - 1 < 0) return;
                previousFrame();
                self.currentSlide = self.lastPerFrame[self.currentFrame] + 1;
            }
            self.currentSlide = self.frames[self.currentFrame].getPrevSlide(self.currentSlide);;
            updateSlideItems();
        }

        //Shows all slide items present on current slide
        //and hide all that aren't
        function updateSlideItems() {
            //Updating all items status
            //TODO: Think about doing events
            self.framesItems[self.currentFrame].forEach(function (slideItem){
                var flag = false;
                slideItem.slideIntervals.forEach(function (interval){
                    if (interval.lower <= self.currentSlide && (interval.upper == -1 || interval.upper >= self.currentSlide)){

                        //Frames also have intervals
                        var frameIntervals = self.frames[self.currentFrame].slideIntervals;
                        if(frameIntervals.length > 0) 
                            frameIntervals.forEach(function (fi) {
                                if (fi.lower <= self.currentSlide && (fi.upper == -1 || fi.upper >= self.currentSlide)){
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
                    slideItem.show();
                    // if(slideItem.styles)
                    //      slideItem.item.css(slideItem.styles);
                    // else
                    //     slideItem.item.css('opacity', 100);
                    // //Checking for videos and audio tags
                    // if (slideItem.item.is('video') || slideItem.item.is('audio')){
                    //     slideItem.item.trigger('play');
                    // }
                } else {
                    slideItem.hide();
                    // if(slideItem.styles)
                    //      slideItem.item.removeAttr('style');
                    // else
                    //     slideItem.item.css('opacity', 0);
                    // if (slideItem.item.is('video') || slideItem.item.is('audio')){
                    //     slideItem.item.trigger('pause');
                    // }
                }


            }); 
        }

        function nextFrame(){
            // if(self.currentFrame + 1 < frames.length){
                //Think about doing different transitions
                self.frames[self.currentFrame].hide();
                self.frames[++self.currentFrame].show();
            // }
        }



        function previousFrame(){
            // if(self.currentFrame - 1 >= 0){
                //Think about doing different transitions
                self.frames[self.currentFrame].hide();
                self.frames[--self.currentFrame].show();
            // }
        }


        function setEventHandlers () {
            //triggering key up
            $(document).on('keyup', function (event){
                 //right arrow || space bar
                 if(event.which == 39 || event.which == 32){
                     next();
                 }
                 //left arrow
                 if(event.which == 37){
                     previous();
                 }
            });            
        }


        _init();
        setEventHandlers();
        console.log(self.options);
        console.log(self.frames);
        console.log(self.lastPerFrame);
        console.log(self.firstPerFrame);
        console.log(self.framesItems);

        //Providing chaining
        return this;        
    }
    // A really lightweight plugin wrapper around the constructor, 
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, 
                new Plugin( this, options ));
            }
        });
    } 


})( jQuery, window, document );