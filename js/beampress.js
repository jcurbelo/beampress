/*!
 * Beampress plugin 
 * Original author: @jcurbelo
 */

;(function ( $, window, document, undefined ) {
    "use strict";

    // Create the defaults once
    var pluginName = 'beampress',
        defaults = {
            // Repeating all effects going to a prev. Frame 
            repeatPrev: true,
            maxItems: 100,
            // current frame
            currentFrame: 0,
            // current slide (slide list starts at '1')
            currentSlide: 0,
            identity: function ($el, args){

            },
            hideItem: function ($el, args){
                $el.css('opacity', 0);
            },
            showItem: function ($el, args){
                $el.css('opacity', 1);
            },
            addStyle: function($el, args){
                $el.css(args);
            },
            removeStyle: function($el, args){
                $el.attr('style', '');
            },
            hideFrame: function ($el, args){
                $el.css('display', 'none');
            },
            showFrame: function ($el, args){
                $el.css('display', 'block');
            },
            slowShowFrame: function ($el, args){
                $el.css('opacity', 0);
                $el.css('display', 'block');
                var args = $.extend({}, {'values':{'opacity': 1}, 'speed': 'slow'}, args);
                $el.animate(args['values'], args['speed']);                
            },
            slowHideFrame: function ($el, args){
                var args = $.extend({}, {'values':{'opacity': 0}, 'speed': 'slow'}, args);
                $el.animate(args['values'], args['speed'], function(){
                    $el.css('display', 'none');
                });                
            },
            slowHideItem: function ($el, args){
                var args = $.extend({}, {'values':{'opacity': 0}, 'speed': 'slow'}, args);
                $el.animate(args['values'], args['speed']);
            },
            slowShowItem: function ($el, args){
                var args = $.extend({}, {'values':{'opacity': 1}, 'speed': 'slow'}, args);
                $el.animate(args['values'], args['speed']);
            },
            playAudio: function ($el, args){
                var args = $.extend({}, {'currentTime': 0, 'volume': 1}, args);
                $el.trigger('play');
                $el.prop('currentTime', args['currentTime']);
                $el.prop('volume', args['volume']);
            },
            playVideo: function ($el, args){
                var args = $.extend({}, {'currentTime': 0, 'volume': 1}, args);                                                                
                $el.trigger('play');
                $el.css('display', 'block');
                $el.prop('currentTime', args['currentTime']);
                $el.prop('volume', args['volume']);
            },            
            stopAudio: function ($el, args){
                $el.trigger('pause');
                $el.prop("currentTime", 0);  
            },
            stopVideo: function ($el, args){
                $el.trigger('pause');
                // $el.css({"display": "none"});
                $el.prop("currentTime", 0);  
            },            
            fadeInAudio: function ($el, args){
                var args = $.extend({}, {'currentTime': 0, 'speed': 'slow', 'values':{'volume' : 1}}, args);
                $el.trigger('play');
                $el.prop('currentTime', args['currentTime']);
                $el.prop('volume', 0);                
                $el.animate(args['values'], args['speed']);
            },
            fadeInVideo: function ($el, args){
                var args = $.extend({}, {'currentTime': 0, 'speed': 'slow', 'values':{'volume' : 1}}, args);
                $el.css('display', 'block');
                $el.trigger('play');
                $el.prop('currentTime', args['currentTime']);
                $el.prop('volume', 0);                
                $el.animate(args['values'], args['speed']);                
            },
            fadeOutAudio: function ($el, args){
                var args = $.extend({}, {'speed': 'slow', 'values':{'volume' : 0}}, args);
                $el.animate(args['values'], args['speed'], function () {
                    $el.trigger('pause');
                    $el.prop("currentTime", 0);
                });
            },
            fadeOutVideo: function ($el, args){
                var args = $.extend({}, {'speed': 'slow', 'values':{'volume' : 0}}, args);
                $el.animate(args['values'], args['speed'], function () {
                    $el.trigger('pause');
                    $el.css({"display": "none"});
                    $el.prop("currentTime", 0);
                });
            },
            //Kinda boxing and unboxing params (I know is not so clear :( )
            ex: function(bag){
                bag.args = $.extend({}, {'id': bag.$el.attr('id')}, bag.args);
                bag.$el = $('#' + bag.args['id']);
                delete bag.args['id'];
            },
            playAudioEx: function($el, args){
                var bag = {'$el': $el, 'args': args};
                defaults.ex(bag);
                defaults.playAudio(bag.$el, bag.args);
            },
            playVideoEx: function($el, args){
                var bag = {'$el': $el, 'args': args};
                defaults.ex(bag);
                defaults.playVideo(bag.$el, bag.args);
            },            
            stopAudioEx: function($el, args){
                var bag = {'$el': $el, 'args': args};
                defaults.ex(bag);
                defaults.stopAudio(bag.$el, bag.args);
            },
            stopVideoEx: function($el, args){
                var bag = {'$el': $el, 'args': args};
                defaults.ex(bag);
                defaults.stopVideo(bag.$el, bag.args);
            },            
            fadeInAudioEx: function($el, args){
                var bag = {'$el': $el, 'args': args};
                defaults.ex(bag);
                defaults.fadeInAudio(bag.$el, bag.args);
            },
            fadeInVideoEx: function($el, args){
                var bag = {'$el': $el, 'args': args};
                defaults.ex(bag);
                defaults.fadeInVideo(bag.$el, bag.args);
            },            
            fadeOutAudioEx: function($el, args){
                var bag = {'$el': $el, 'args': args};
                defaults.ex(bag);
                defaults.fadeOutAudio(bag.$el, bag.args);
            },
            fadeOutVideoEx: function($el, args){
                var bag = {'$el': $el, 'args': args};
                defaults.ex(bag);
                defaults.fadeOutVideo(bag.$el, bag.args);
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
            },
            convertToDict: function(txt){
                var keyValue = txt.split(':');
                return $.parseJSON('{"' + keyValue[0] + '" : "' + keyValue[1] + '"}');
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
        // this.currentFrame = 0;
        //current slide (slide list starts at '1')
        // this.currentSlide = 0;
        //starting slide for each frame
        this.firstPerFrame = [];  

        this.init();
    }

    Plugin.prototype.init = function () { 

        //Avoiding namespace confusions
        var self = this;

        //Custom 'objects'
        //Slide objects
        function SlideItem($el, fSlide, lSlide){
            this.$el = $el;
            var slides = Array(lSlide - fSlide + 1);
            this.slides = $.map(slides, function (el, i) {return '' + (i + 1);});
        }

        SlideItem.prototype.showed = false;

        //Changes item's state according to specified animation function
        //and slide interval
        SlideItem.prototype.slide = function(slide){
            //Getting current function for a given slide (interval)
            // console.log(this.slides);
            var keyValue =  this.slides[slide - 1],

                func = helpers.getValRec(keyValue, [slide, 'next', 'func'], 'identity'),
                args = helpers.getValRec(keyValue, [slide, 'next', 'args'], {});

            //If no function is defined, then the 'identity'  is used
            return self.options[func](this.$el, args);

        };

        //Changes item's state according to specified 'prev' animation function,
        //equivalent to 'inverse animation function'
        SlideItem.prototype.prevSlide = function(slide){
            var keyValue =  this.slides[slide - 1],

                func = helpers.getValRec(keyValue, [slide, 'prev', 'func'], 'identity'),
                args = helpers.getValRec(keyValue, [slide, 'prev', 'args'], {});

            //If no function is defined, then the 'identity'  is used
            return self.options[func](this.$el, args);

        };        

        //Frame objects
        function Frame($el){
            this.$el = $el;
            this.hideFrame = self.options.hideFrame;
            this.showFrame = self.options.showFrame;
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

        Frame.prototype.updatePrevious = function (slide){
            this.items.forEach(function (item) {
                 item.prevSlide(slide);
            });
        };

        Frame.prototype.hide = function () {
            if(this.showed){
                this.hideFrame(this.$el, {});
                this.showed = false;
            }
            // this.$el.css('display', 'none');
        };

        Frame.prototype.show = function () {
            if(!this.showed){
                this.showFrame(this.$el, {});
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
                self.firstPerFrame[i] = 1;
                self.lastPerFrame[i] = 1;
                self.frames[i] = frame;
                self.framesItems[i] = [];

                //Checking 'show' and 'hide' for frame
                //TODO: Quick DRY this and do it the way i did with 'slideItems'
                var show = frame.$el.attr('data-onshow'),
                    hide = frame.$el.attr('data-onhide');
                if(show){
                    show = $.parseJSON(show);
                    frame.showFrame = self.options[show.func];
                }
                if(hide){
                    hide = $.parseJSON(hide);
                    frame.hideFrame = self.options[hide.func];
                }                

                //Updating frame intervals
                $(frame.$el).find('[data-onslide]').each(function (j) {
                    updateFrameIntervals($(this), i);                  
                });

                var first = self.firstPerFrame[i],
                    last = self.lastPerFrame[i];

                //Setting all the 'slide-items'         
                $(frame.$el).find('[data-onslide]').each(function (j) {
                    var slideItem = new SlideItem($(this), first, last);
                    setSlides(slideItem);
                    self.framesItems[i].push(slideItem);                  
                });


                //Referencing all the frame's items within the actual frame object
                frame.items = self.framesItems[i];

                //Hiding current frame
                $(this).css('display', 'none');
            });
            //Showing first slide
            self.frames[self.options.currentFrame].show();
            //Increasing first slide show
            // Experimental: performing fastfoward
            var limit = self.options.currentSlide;
            self.options.currentSlide = 0;
            for (var i = 0; i <= limit; i++) {
                next();
            }
        } 

        function setSlides(slideItem){
            var reg = new RegExp(/([1-9]\d*)?(-)?([1-9]\d*)?/),
                // regRepl = new RegExp(/\{"[1-9]\d*"\:[^,]*,[^,]*,[^,]*,[^,]*,?/g),
                // regMatch = new RegExp(/\{"[1-9]\d*"\:[^,]*,[^,]*,[^,]*,[^,]*/g),
                slides = slideItem.$el.attr('data-onslide').replace(/[ \t\r]+/g, ""),
                style = slideItem.$el.attr('data-style'),
                // slideObjs = slides.match(regMatch),
                lower, upper, matches,
                addStyle = {"func": "addStyle", "args": {}},
                removeStyle = {"func": "removeStyle", "args": {}},
                hide = {"func": "hideItem", "args": {}},
                show = {"func": "showItem", "args": {}};

            slides = slides.split(';');
            if(!style)
                //Hiding slide item in the first slide
                slideItem.slides[0] = {"1":{"next": hide}};
            else
                addStyle['args'] = helpers.convertToDict(style);
            slides.forEach(function (s){
                //Just in case, you'll never know
                if(s === '') return;
                //Actually parsing a JSON, wow
                if(s.substr(0, 1) === "{"){
                    var data =  $.parseJSON(s),
                        i = parseInt(Object.keys(data)[0]);
                    slideItem.slides[i - 1] = data;
                    return;                     
                }
                matches = reg.exec(s);
                lower = parseInt(matches[1]) || 0;
                var fSlide = {}, sSlide = {};
                fSlide[lower] = !style ? {"next": show, "prev": hide} : {"next": addStyle, "prev": removeStyle};

                slideItem.slides[lower - 1] = fSlide;
                //Only one slide
                if(!matches[2]){
                    sSlide[lower + 1] = !style ? {"next": hide, "prev": show} : {"next": removeStyle, "prev": addStyle};
                    slideItem.slides[lower] = sSlide;                                                          
                } else //Has interval
                    if (matches[3]){
                        upper = parseInt(matches[3]);
                        sSlide[upper + 1] = !style ? {"next": hide, "prev": show} : {"next": removeStyle, "prev": addStyle};
                        slideItem.slides[upper] = sSlide;                                                                                  
                    }               
            });
        }

        function updateFrameIntervals($slide, frameIndex){
            var reg = new RegExp(/([1-9]\d*)?(-)?([1-9]\d*)?/),
                // regRepl = new RegExp(/\{"[1-9]\d*"\:[^,]*,[^,]*,[^,]*,[^,]*,?/g),
                // regMatch = new RegExp(/\{"[1-9]\d*"\:[^,]*,[^,]*,[^,]*,[^,]*/g),
                slides = $slide.attr('data-onslide').replace(/[ \t\r]+/g, ""),
                // slideObjs = slides.match(regMatch),
                _update = function(l, u){
                    //Updating last and first slide per frame
                    var lpf = self.lastPerFrame[frameIndex],
                        fpf = self.firstPerFrame[frameIndex];

                    //Getting max interval
                    self.lastPerFrame[frameIndex] = Math.max(Math.max(u, l), lpf);
                    //Getting min interval
                    self.firstPerFrame[frameIndex] = Math.min(l, fpf);
                },
                lower, upper, matches;

            slides = slides.split(';');
            slides.forEach(function (s){
                //Just in case, you'll never know
                if(s === '') return;
                //Actually parsing a JSON, wow
                if(s.substr(0, 1) === "{"){
                    var data =  $.parseJSON(s),
                        i = parseInt(Object.keys(data)[0]);
                    _update(i, i); 
                    return;                     
                }             
                matches = reg.exec(s); 
                lower = matches[1] || 0;
                //Only one slide
                if(!matches[2]){
                    upper = matches[1] || -1;
                } else 
                    if (matches[3]){
                        upper = matches[3];
                    } else {
                        upper = -1;
                    }
                _update(lower, upper);   
            });

        }

        function update(){
            var frame = self.frames[self.options.currentFrame];
            frame.update(self.options.currentSlide);
        }

        function updatePrevious(){
            var frame = self.frames[self.options.currentFrame];
            frame.updatePrevious(self.options.currentSlide);
        }

        //Show all slide items that are 'present' on
        //next slide 
        function next(){
            if (self.lastPerFrame[self.options.currentFrame] == self.options.currentSlide){
                if(self.options.currentFrame + 1 >= self.frames.length) return;
                nextFrame();
                self.options.currentSlide = 0;
            }
            self.options.currentSlide++;
            update();
        }

        //Show all slide items that are 'present' on
        //previous slide 
        function previous(){
            if(self.options.currentSlide == 1){
                if(self.options.currentFrame - 1 < 0) return;
                previousFrame();
                self.options.currentSlide = self.lastPerFrame[self.options.currentFrame] + 1;
            } else { 
                updatePrevious();
            }
            self.options.currentSlide--;
            update();
        }


        function nextFrame(){
            self.frames[self.options.currentFrame].hide();
            if(self.options.repeatPrev)
                self.framesItems[self.options.currentFrame].forEach(function (si){
                    si.showed = false;
                });                
            self.frames[++self.options.currentFrame].show();
        }


        function previousFrame(){

            self.frames[self.options.currentFrame].hide();
            self.framesItems[self.options.currentFrame].forEach(function (si){
                si.showed = false;
            });
            self.frames[--self.options.currentFrame].show();

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
        // console.log(self.options);
        console.log(self.frames);
        console.log(self.lastPerFrame);
        console.log(self.firstPerFrame);
        // console.log(self.framesItems);

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