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
var typeVideo = '';
var preroll = false;
var pauseroll = false;
var isFullscreen = false;
var pauseNow = false;
var firstStart = true;
var vastTracker = '';
var progressEventsSeconds = [];

adObject.adMediaFile = '';

var getSource = function getSource(type) {
    if (type == 'video') {
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
    } else if (type == 'ad') {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = playlist[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _z = _step2.value;

                if (_z.ad) {
                    return _z;
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
    } else if (type == null) {
        if (preroll) {
            return getSource('ad');
        } else if (pauseroll) {
            return getSource('video');
        }
    }
};

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

            // use 'close' instead 'skip', if there is 'close' and there is no 'skip'
            if (!r.ads[0].creatives[0].trackingEvents['skip'] && r.ads[0].creatives[0].trackingEvents['close']) {
                r.ads[0].creatives[0].trackingEvents['skip'] = r.ads[0].creatives[0].trackingEvents['close'];
                delete r.ads[0].creatives[0].trackingEvents['close'];
            }

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

            var currentDate = function currentDate() {
                var d = new Date();
                return "(" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ") ";
            };

            // for vast-events: expand, collapse
            vastTracker.emitAlwaysEvents.push('expand');
            vastTracker.emitAlwaysEvents.push('collapse');
            vastTracker.setExpand = function (fullscreen) {
                console.log(currentDate() + " Ad event: " + (fullscreen ? "expand" : "collapse"));
                this.track(fullscreen ? "expand" : "collapse");
            };

            // console.log(vastTracker);
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

var adPlugin = Clappr.UIContainerPlugin.extend({
    name: 'ad_plugin',

    initialize: function initialize() {
        this.render();
    },

    bindEvents: function bindEvents() {
        this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.containerPause);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.containerPlay);
        this.listenTo(this.container, Clappr.Events.CONTAINER_ENDED, this.containerEnded);
    },

    show: function show() {},

    hide: function hide() {},

    render: function render() {
        return this;
    },

    containerPause: function containerPause() {
        // not activate 'play' event when pause
        if (!adVideoPlayNow) {
            pauseNow = true;
        }
        // console.log('pause');
    },

    containerPlay: function containerPlay() {
        var self = this;
        // console.log('play');
        if (adVideoPlayNow) {
            vastTracker.trackURLs(customURLs);
            console.log(currentDate() + " Ad event: CustomTracking");
        }

        if (preroll) {} else if (pauseroll) {
            if (!adVideoPlayNow && pauseNow && !firstStart) {
                pauseNow = false;
                // loadVAST(vastUrl, mainVideo).then(() => console.log('play ad'));
                loadVAST(vastUrl, mainVideo).then(function () {
                    return self.initPlayerFor('ad');
                });
            }
        }
        firstStart = false;
    },

    containerEnded: function containerEnded() {
        firstStart = true;
    },

    initPlayerFor: function initPlayerFor(type) {
        // console.log('ipf');
        if (type == 'video') {
            // console.log('ipfv');
            adVideoPlayNow = false;
            pauseNow = false;
            p.load(getSource('video').source);
            if (getSource('video').typeVideo == 'vod') {
                p.seek(vct);
            }
        } else if (type == 'ad') {
            // console.log('ipfa');
            adVideoPlayNow = true;
            p.load(getSource('ad').source);
            p.setVolume(100);
            skipButtonPressed = false;
        }
    }
});