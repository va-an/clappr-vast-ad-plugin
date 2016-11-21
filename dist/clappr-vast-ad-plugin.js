'use strict';

// preroll

// pauseroll
// TODO how detect - live or vod?
// TODO live pauseroll?

// common

var adVideoPlayNow = false;
var p = '';
var playlist = [];
var adObject = {};
var vastTracker = '';
var vct = '';
var typeVideo = '';
var firstStart = true;
var pauseNow = false;
var preroll = false;
var pauseroll = false;
var skipButtonPressed = false;
var isFullscreen = false;
var progressEventsSeconds = [];

adObject.adMediaFile = '';

var setTypeAd = function setTypeAd(type) {
    if (type == 'preroll') {
        preroll = true;
        adVideoPlayNow = true;
    } else if (type == 'pauseroll') {
        pauseroll = true;
        adVideoPlayNow = false;
    }
};

var setVideoType = function setVideoType(type) {
    typeVideo = type;
};

var getVideo = function getVideo() {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = playlist[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var z = _step.value;

            if (!z.ad) {
                return z;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
};

var getAd = function getAd() {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = playlist[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var z = _step2.value;

            if (z.ad) {
                return z;
            }
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }
};

var getSource = function getSource() {
    if (preroll) {
        return getAd().source;
    } else if (pauseroll) {
        return getVideo().source;
    }
};

var fsEventOn = function fsEventOn() {
    p.on(Clappr.Events.PLAYER_FULLSCREEN, function () {
        isFullscreen = !isFullscreen;
        if (adVideoPlayNow) {
            vastTracker.setFullscreen(isFullscreen);
            // isFullscreen ?
            //     vastTracker.trackURLs(r.ads[0].creatives[0].trackingEvents['expand']) :
            //     vastTracker.trackURLs(r.ads[0].creatives[0].trackingEvents['collapse']);
            vastTracker.setExpand(isFullscreen);
        }
    });
};

var loadVAST = function loadVAST(urlVast, video) {
    return new Promise(function (resolve, rejected) {
        DMVAST.client.get(urlVast, function (r, e) {
            if (!r) {
                rejected('Error loading VAST - WTF ¯\\\_(ツ)_/¯');
            }
            console.log(r);
            // console.log(r.ads[0].creatives[0].trackingEvents.fullscreen[0]);
            // console.log(r.ads[0].creatives[0].trackingEvents.expand[0]);

            // console.log(r.ads[0].creatives[0].mediaFiles);
            // console.log(r.ads[0].creatives[0].mediaFiles[0]);
            // console.log(r.ads[0].creatives[0].mediaFiles[0].apiFramework);
            // console.log(r.ads[0].creatives[0].mediaFiles[0].fileURL);
            // console.log(r.ads[0].creatives[0].type);

            // console.log('skip delay = ' + r.ads[0].creatives[0].skipDelay);

            adObject.adMediaFile = r.ads[0].creatives[0].mediaFiles[0].fileURL;
            adObject.clickLink = r.ads[0].creatives[0].videoClickThroughURLTemplate;

            vastTracker = new DMVAST.tracker(r.ads[0], r.ads[0].creatives[0]);

            // for vast-events: expand, collapse
            vastTracker.emitAlwaysEvents.push('expand');
            vastTracker.emitAlwaysEvents.push('collapse');
            vastTracker.setExpand = function (fullscreen) {
                this.track(fullscreen ? "expand" : "collapse");
                return this.fullscreen = fullscreen;
            };

            // console.log(vastTracker);

            var currentDate = function currentDate() {
                var d = new Date();
                return "(" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ") ";
            };

            vastTracker.on('start', function () {
                return console.log(currentDate() + " Ad event: start");
            });
            vastTracker.on('skip', function () {
                return console.log(currentDate() + " Ad event: skip");
            });
            vastTracker.on('pause', function () {
                return console.log(currentDate() + " Ad event: pause");
            });
            vastTracker.on('resume', function () {
                return console.log(currentDate() + " Ad event: resume");
            });
            vastTracker.on('complete', function () {
                return console.log(currentDate() + " Ad event: complete");
            });
            vastTracker.on('firstQuartile', function () {
                return console.log(currentDate() + " Ad event: firstQuartile");
            });
            vastTracker.on('midpoint', function () {
                return console.log(currentDate() + " Ad event: midpoint");
            });
            vastTracker.on('thirdQuartile', function () {
                return console.log(currentDate() + " Ad event: thirdQuartile");
            });
            vastTracker.on('mute', function () {
                return console.log(currentDate() + " Ad event: mute");
            });
            vastTracker.on('unmute', function () {
                return console.log(currentDate() + " Ad event: unmute");
            });
            vastTracker.on('fullscreen', function () {
                return console.log(currentDate() + " Ad event: fullscreen");
            });
            vastTracker.on('exitFullscreen', function () {
                return console.log(currentDate() + " Ad event: exitFullscreen");
            });
            vastTracker.on('clickthrough', function (url) {
                return console.log(currentDate() + " Ad event: click");
            });
            vastTracker.on('creativeView', function () {
                console.log(currentDate() + " Ad event: impression");
                console.log(currentDate() + " Ad event: creativeView");
            });

            // parsing seconds for progress-\d* events
            for (var k in vastTracker.trackingEvents) {
                var re = /progress-\d*/;
                if (!k.search(re)) {
                    progressEventsSeconds.push(parseInt(k.split('-')[1]));
                }
            }

            // parsing extensions
            var setSkipDelay = function setSkipDelay(sd) {
                if (!sd || sd >= r.ads[0].creatives[0].duration || sd < 0) {
                    adObject.skipDelay = r.ads[0].creatives[0].duration / 2;
                } else {
                    adObject.skipDelay = sd;
                }
            };
            var st2f = false;
            var customURLs = [];
            for (var w in r.ads[0].extensions) {
                if (r.ads[0].extensions[w].attributes.type.toLowerCase() == 'skiptime2' && !st2f) {
                    var prsDrExtnsn = function prsDrExtnsn(durationString) {
                        var durationComponents = void 0,
                            minutes = void 0,
                            seconds = void 0,
                            secondsAndMS = void 0;
                        if (!(durationString != null)) {
                            return null;
                        }
                        durationComponents = durationString.split(":");
                        if (durationComponents.length !== 2) {
                            return null;
                        }
                        secondsAndMS = durationComponents[1].split(".");
                        seconds = parseInt(secondsAndMS[0]);
                        if (secondsAndMS.length === 2) {
                            seconds += parseFloat("0." + secondsAndMS[1]);
                        }
                        minutes = parseInt(durationComponents[0] * 60);
                        if (isNaN(minutes || isNaN(seconds || minutes > 60 * 60 || seconds > 60))) {
                            return null;
                        }
                        return minutes + seconds;
                    };
                    setSkipDelay(prsDrExtnsn(r.ads[0].extensions[w].children[0].value));
                    st2f = true;
                } else if (r.ads[0].extensions[w].attributes.type.toLowerCase() == 'customtracking') {
                    for (var z in r.ads[0].extensions[w].children) {
                        // console.log(r.ads[0].extensions[w].children[z].value.trim());
                        customURLs.push(r.ads[0].extensions[w].children[z].value);
                    }
                    vastTracker.trackURLs(customURLs);
                }
            }
            if (!st2f) {
                setSkipDelay(r.ads[0].creatives[0].skipDelay);
            }

            progressEventsSeconds.sort(function (a, b) {
                return a - b;
            });
            playlist = [{
                source: adObject.adMediaFile,
                ad: true
            }, {
                source: video,
                ad: false,
                typeVideo: typeVideo
            }];

            if (r.ads[0].creatives[0].mediaFiles[0].apiFramework == 'VPAID') {
                rejected('Error loading VAST - VPAID not supported');
            }
            resolve();
        });
    });
};

// main visibility API function
// use visibility API to check if current tab is active or not
var _visibilityAPI = function () {
    var stateKey,
        eventKey,
        keys = {
        hidden: "visibilitychange",
        webkitHidden: "webkitvisibilitychange",
        mozHidden: "mozvisibilitychange",
        msHidden: "msvisibilitychange"
    };
    for (stateKey in keys) {
        if (stateKey in document) {
            eventKey = keys[stateKey];
            break;
        }
    }
    return {
        'setHandler': function setHandler(c) {
            if (c) document.addEventListener(eventKey, c);
        },
        'tabVisible': function tabVisible() {
            return !document[stateKey];
        }
    };
}();

_visibilityAPI.setHandler(function () {
    if (adVideoPlayNow) {
        if (_visibilityAPI.tabVisible()) {
            setTimeout(function () {
                p.play();
            }, 300);
        } else {
            p.pause();
        }
    }
});

var adPlugin = Clappr.UIContainerPlugin.extend({
    name: 'ad_plugin',
    AdMuted: false,
    videoWasCompleted: false,

    initialize: function initialize() {
        this.render();
        this.checkAdTime();
    },

    bindEvents: function bindEvents() {
        // console.log('bind events - called');
        this.listenTo(this.container, Clappr.Events.CONTAINER_CLICK, this.ContainerClick);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.containerPlay);
        this.listenTo(this.container, Clappr.Events.CONTAINER_ENDED, this.containerEnded);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.containerPause);
        this.listenTo(this.container, Clappr.Events.CONTAINER_VOLUME, this.containerVolume);
    },

    containerVolume: function containerVolume() {
        if (adVideoPlayNow && p) {
            // console.log(p.getVolume());
            if (p.getVolume() == 0 && !this.AdMuted) {
                vastTracker.setMuted(true);
                this.AdMuted = true;
            } else if (p.getVolume() != 0 && this.AdMuted) {
                vastTracker.setMuted(false);
                this.AdMuted = false;
            }
        }
    },

    // VAST-events - firstQuartile, midpoint, thirdQuartile, progress
    checkAdTime: function checkAdTime() {
        if (adVideoPlayNow) {
            (function () {
                var fq = false,
                    mp = false,
                    tq = false;
                var timerId = setInterval(function () {
                    if (skipButtonPressed) {
                        clearInterval(timerId);
                    } else {
                        // if (progressEventsSeconds.length) {
                        if (progressEventsSeconds.length && p.getCurrentTime() >= progressEventsSeconds[0]) {
                            vastTracker.setProgress(progressEventsSeconds.shift());
                        }
                        // }
                        if (p.getCurrentTime() >= p.getDuration() * 0.25 && !fq) {
                            vastTracker.setProgress(p.getCurrentTime());
                            fq = true;
                        } else if (p.getCurrentTime() >= p.getDuration() * 0.5 && !mp) {
                            vastTracker.setProgress(p.getCurrentTime());
                            mp = true;
                        } else if (p.getCurrentTime() >= p.getDuration() * 0.75 && !tq) {
                            vastTracker.setProgress(p.getCurrentTime());
                            tq = true;
                            clearInterval(timerId);
                        }
                    }
                }, 300);
            })();
        }
    },

    initPlayerFor: function initPlayerFor(type) {
        // console.log('ipf');
        if (type == 'video') {
            // console.log('ipfv');
            adVideoPlayNow = false;
            pauseNow = false;
            p.load(getVideo().source);
            if (getVideo().typeVideo == 'vod') {
                p.seek(vct);
            }
        } else if (type == 'ad') {
            // console.log('ipfa');
            adVideoPlayNow = true;
            p.load(getAd().source);
            p.setVolume(100);
            skipButtonPressed = false;
        }
    },

    containerPlay: function containerPlay() {
        var self = this;
        // console.log('play called');
        p.core.mediaControl.container.settings.seekEnabled = !adVideoPlayNow;
        if (adVideoPlayNow) {
            if (isFullscreen) {
                vastTracker.setFullscreen(true);
                vastTracker.setExpand(true);
                // vastTracker.trackURLs(r.ads[0].creatives[0].trackingEvents['expand']);
            }
        }

        if (preroll) {
            if (adVideoPlayNow) {
                if (firstStart) {
                    p.setVolume(100);
                    vastTracker.setDuration(p.getDuration());
                    vastTracker.load();
                    vastTracker.setProgress(0.1);
                    firstStart = false;
                } else {
                    vastTracker.setPaused(false);
                }
            }

            if (this.videoWasCompleted) {
                this.videoWasCompleted = false;
                loadVAST(vastUrl, mainVideo).then(function () {
                    return self.initPlayerFor('ad');
                });
            }
        } else if (pauseroll) {
            if (adVideoPlayNow) if (p.getCurrentTime() == 0) {
                vastTracker.setDuration(p.getDuration());
                vastTracker.load();
                vastTracker.setProgress(0.1);
            } else {
                vastTracker.setPaused(false);
            }
            if (!adVideoPlayNow && !firstStart && pauseNow && p.getCurrentTime() != 0) {
                if (getVideo().typeVideo == 'vod') {
                    vct = p.getCurrentTime();
                }
                loadVAST(vastUrl, mainVideo).then(function () {
                    return self.initPlayerFor('ad');
                });
            }
            pauseNow = false;
            adVideoPlayNow = p.options.sources[0] != getVideo().source;
            if (adVideoPlayNow) {
                this.show();
            } else {
                this.hide();
            }
        }
    },

    containerEnded: function containerEnded() {
        var self = this;
        if (adVideoPlayNow) {
            vastTracker.complete();
            this.initPlayerFor('video');
        } else if (!adVideoPlayNow && preroll) {
            self.videoWasCompleted = true;
            firstStart = true;
        }
    },

    containerPause: function containerPause() {
        // console.log('pause called');
        if (adVideoPlayNow && !p.ended) {
            vastTracker.setPaused(true);
        }
        if (preroll) {} else if (pauseroll) {
            firstStart = false;
            pauseNow = true;
        }
        // vastTracker.setPaused(true);
    },

    ContainerClick: function ContainerClick() {
        if (adVideoPlayNow) {
            window.open(adObject.clickLink).focus();
            vastTracker.click();
        } else if (!adVideoPlayNow && pauseroll && getVideo().typeVideo == 'live') {
            p.pause();
        }
    },

    show: function show() {
        var _this = this;

        // console.log('show called');
        var showAdButton = function showAdButton() {
            _this.$el.show();
            var timerId = setInterval(function () {
                var ab = document.getElementById('adButton');
                ab.textContent = 'You can skip this ad in ' + parseInt(adObject.skipDelay - p.getCurrentTime());
                if (p.getCurrentTime() > adObject.skipDelay) {
                    clearInterval(timerId);
                    ab.onclick = function () {
                        skipButtonPressed = true;
                        console.log('ab onclick');
                        vastTracker.skip();
                        _this.initPlayerFor('video');
                    };
                    ab.textContent = 'Skip Ad';
                    // console.log('time to skip ad!');
                }
            }, 300);
        };
        if (preroll) {
            if (adVideoPlayNow) {
                showAdButton();
            } else {
                this.hide();
            }
        } else if (pauseroll) {
            showAdButton();
        }
        // console.log('show called');
    },

    hide: function hide() {
        console.log('hide called');
        this.$el.hide();
    },

    render: function render() {
        // console.log('render called');
        this.$el.css('font-size', '20px');
        this.$el.css('position', 'absolute');
        this.$el.css('color', 'white');
        this.$el.css('top', '70%');
        this.$el.css('right', '0%');
        this.$el.css('background-color', 'black');
        this.$el.css('z-index', '100500');
        this.$el.css('border', 'solid 3px #333333');
        this.$el.css('padding', '5px');
        this.container.$el.append(this.$el);
        this.$el[0].id = 'adButton';

        if (preroll) {
            this.show();
        } else if (pauseroll) {
            if (adVideoPlayNow) {
                // console.log('render - show');
                this.show();
            } else {
                this.hide();
                // console.log('render - hide');
            }
        }
        // this.$el.html('pew pew pew');
        return this;
    }
});