/*!
 * Beampress plugin 
 * Original author: @jcurbelo
 */

;(function ( $, window, document, undefined ) {
	"use strict";

    // Create the defaults once
    var pluginName = 'beampress',
        defaults = {
            //Repeating all effects going to a prev. Frame 
            repeatPrev: true,
            maxItems: 100,
            identity: function ($el, args){

            },
            hideItem: function ($el, args){
                $el.css('opacity', 0);
            },
            showItem: function ($el, args){
                $el.css('opacity', 100);
            },
            hideFrame: function ($el, args){
                $el.css('display', 'none');
            },
            showFrame: function ($el, args){
                $el.css('display', 'block');
            }               
        },

        //Helpers
        helpers = {
            //Gets the value of obj given a sequence of properties, 
            //if some property is undefined then 'def' is returned
            //Ex: getValRec(post, [author, company], 'Home') is the 
            //equivalent to try: post.author.company
            getValRec : function (obj, keys, def) {
                var i = 0,
                    prop = keys[i];

                while(obj.hasOwnProperty(prop)){
                    if(keys.length == ++i) return obj[prop];
                    obj = obj[prop];
                    prop = keys[i];
                }
                return def;
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

        //Changes item's state according to specified animation function
        //and slide interval
        SlideItem.prototype.slide = function(slide){
            //Getting current function for a given slide (interval)
            // console.log(this.slides);
            var keyValue =  this.slides[slide - 1],

                func = helpers.getValRec(keyValue, [slide, 'func'], 'identity'),
                args = helpers.getValRec(keyValue, [slide, 'args'], {});

            //If no function is defined, then the 'identity'  is used
            return self.options[func](this.$el, args);

        };

        SlideItem.prototype.hide = function () {
            if(this.showed || this.$el.css('opacity') == '1'){
                if(this.styles)
                    this.$el.removeAttr('style');
                else
                    self.options.hideItem(this.$el);

                //Checking for videos and audio tags

                if (this.$el.is('video') || this.$el.is('audio')){
                    this.$el.trigger('pause');
                }                      
                // this.$el.css('opacity', 0); 
                this.showed = false;               
            }

        };

        SlideItem.prototype.show = function () {
            if(!this.showed || this.$el.css('opacity') == '0'){
                if(this.styles)
                    this.$el.css(this.styles);
                else
                    self.options.showItem(this.$el);

                //Checking for videos and audio tags
                if (this.$el.is('video') || this.$el.is('audio')){
                    this.$el.trigger('play');
                }  
                
                // this.$el.css('opacity', 100);
                this.showed = true;                
            }

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

        Frame.prototype.update = function (slide){
            // console.log(this.items);
            this.items.forEach(function (item) {
                 item.slide(slide);
            });
        };

        Frame.prototype.hide = function () {
            if(this.showed){
                self.options.hideFrame(this.$el);
                this.showed = false;
            }
            // this.$el.css('display', 'none');
        };

        Frame.prototype.show = function () {
            if(!this.showed){
                self.options.showFrame(this.$el);
                this.showed = true;    
            }        
            
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
                var frame = new Frame($(this));
                // var hasAgainFrame = false,
                //     hasOnSlide = ($(this).attr('data-onslide')),
                //     frame = new Frame($(this)),
                //     // frame = {'item' : $(this)},
                //     intervals = $(this);
                
                // if ($(this).attr('data-againframe')){
                //     hasAgainFrame = true;
                //     var reg = new RegExp(/\s*\[(.*)\]\s*(.*)/),
                //         matches = reg.exec($(this).attr('data-againframe')),
                //         id = matches[1];
                //     intervals = matches[2];               
                //     frame = getFrameFromStrId(id);                              
                // }

                //Has slides contrains 
                // var isOverlayed = hasOnSlide || hasAgainFrame;

                // var hasUpperLimit = true;
                // self.lastPerFrame[i] = 1;
                self.firstPerFrame[i] = 1;
                // var prevFirstSlide = 1;
                // frame.slideIntervals = [];

                // if(isOverlayed){
                //     self.firstPerFrame[i] = self.options.maxItems;
                //     hasUpperLimit = setSlideIntervals(frame, intervals, i);
                //     prevFirstSlide = self.firstPerFrame[i];    
                // }

                self.frames[i] = frame;
                self.framesItems[i] = [];

                //Setting all the 'slide-items'         
                $(frame.$el).find('[data-onslide]').each(function (j) {
                    var slideItem = new SlideItem($(this));
                    // setSlideIntervals(slideItem, $(this), (hasUpperLimit && isOverlayed) ? null : i);
                    setSlides(slideItem, i);
                    // slideItem.styles = undefined;
                    self.framesItems[i].push(slideItem);
                    // if ($(this).attr('data-style')){
                    //     slideItem.styles = getStylesDict($(this).attr('data-style'));
                    // } else {
                    //     //Hiding item
                    //     slideItem.$el.css('opacity', 0);                    
                    // }                   
                });

                // self.firstPerFrame[i] = prevFirstSlide;

                //Referencing all the frame's items within the actual frame object
                frame.items = self.framesItems[i];

                //Hiding current frame
                $(this).css('display', 'none');
                // frame.firstSlide = self.firstPerFrame[i];
                // frame.lastSlide = self.lastPerFrame[i];
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

        //Sets the animation functions to all slideItem's interval
        function setSlides(slideItem, frameIndex){
            // console.log(slideItem.$el.attr('data-onslide'));
            var slidesJSON = slideItem.$el.attr('data-onslide'),
                slides = $.parseJSON(slidesJSON);

            slideItem.slides = slides;
            self.lastPerFrame[frameIndex] = slides.length;
        }

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

        function update(){
            var frame = self.frames[self.currentFrame];
            frame.update(self.currentSlide);
        }

        //Show all slide items that are 'present' on
        //next slide 
        function next(){
            if (self.lastPerFrame[self.currentFrame] == self.currentSlide){
                if(self.currentFrame + 1 >= self.frames.length) return;
                nextFrame();
                // self.currentSlide = self.firstPerFrame[self.currentFrame] - 1;
                self.currentSlide = 0;
            }
            self.currentSlide++;
            // self.currentSlide = self.frames[self.currentFrame].getNextSlide(self.currentSlide);
            // updateSlideItems();
            update();
        }

        //Show all slide items that are 'present' on
        //previous slide 
        function previous(){
            if(self.currentSlide == 1){
            // if (self.currentSlide == self.firstPerFrame[self.currentFrame]){
                if(self.currentFrame - 1 < 0) return;
                previousFrame();
                self.currentSlide = self.lastPerFrame[self.currentFrame] + 1;
            }
            self.currentSlide--;
            // self.currentSlide = self.frames[self.currentFrame].getPrevSlide(self.currentSlide);;
            // updateSlideItems();
            update();
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
                if(self.options.repeatPrev)
                    self.framesItems[self.currentFrame].forEach(function (si){
                        si.showed = false;
                    });                
                self.frames[++self.currentFrame].show();
            // }
        }



        function previousFrame(){
            // if(self.currentFrame - 1 >= 0){
                //Think about doing different transitions
                self.frames[self.currentFrame].hide();
                self.framesItems[self.currentFrame].forEach(function (si){
                    si.showed = false;
                });
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