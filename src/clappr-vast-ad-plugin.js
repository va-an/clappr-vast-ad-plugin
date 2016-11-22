// preroll

// pauseroll
// TODO how detect - live or vod?
// TODO live pauseroll?

// common

let adVideoPlayNow = false;
let p = '';
let playlist = [];
let adObject = {};
let vastTracker = '';
let vct = '';
let typeVideo = '';
let firstStart = true;
let pauseNow = false;
let preroll = false;
let pauseroll = false;
let skipButtonPressed = false;
let isFullscreen = false;
let progressEventsSeconds = [];

adObject.adMediaFile = '';

const setTypeAd = (type) => {
    if (type == 'preroll') {
        preroll = true;
        adVideoPlayNow = true;
    } else if (type == 'pauseroll') {
        pauseroll = true;
        adVideoPlayNow = false;
    }
};

const setVideoType = (type) => {
    typeVideo = type;
};

const getSource = (type) => {
    if (type == 'video') {
        for (let z of playlist) {
            if (!z.ad) {
                return z;
            }
        }
    } else if (type == 'ad') {
        for (let z of playlist) {
            if (z.ad) {
                return z;
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

const fsEventOn = () => {
    p.on(Clappr.Events.PLAYER_FULLSCREEN, function () {
        isFullscreen = !isFullscreen;
        if (adVideoPlayNow) {
            vastTracker.setFullscreen(isFullscreen);
            // isFullscreen ?
            //     vastTracker.trackURLs(r.ads[0].creatives[0].trackingEvents['expand']) :
            //     vastTracker.trackURLs(r.ads[0].creatives[0].trackingEvents['collapse']);
            vastTracker.setExpand(isFullscreen);
        }
    })
};

const loadVAST = (urlVast, video) => {
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

            const currentDate = () => {
                let d = new Date();
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
            vastTracker.on('start', () => console.log(currentDate() + " Ad event: start"));
            vastTracker.on('skip', () => console.log(currentDate() + " Ad event: skip"));
            vastTracker.on('pause', () => console.log(currentDate() + " Ad event: pause"));
            vastTracker.on('resume', () => console.log(currentDate() + " Ad event: resume"));
            vastTracker.on('complete', () => console.log(currentDate() + " Ad event: complete"));
            vastTracker.on('firstQuartile', () => console.log(currentDate() + " Ad event: firstQuartile"));
            vastTracker.on('midpoint', () => console.log(currentDate() + " Ad event: midpoint"));
            vastTracker.on('thirdQuartile', () => console.log(currentDate() + " Ad event: thirdQuartile"));
            vastTracker.on('mute', () => console.log(currentDate() + " Ad event: mute"));
            vastTracker.on('unmute', () => console.log(currentDate() + " Ad event: unmute"));
            vastTracker.on('fullscreen', () => console.log(currentDate() + " Ad event: fullscreen"));
            vastTracker.on('exitFullscreen', () => console.log(currentDate() + " Ad event: exitFullscreen"));
            vastTracker.on('clickthrough', url => console.log(currentDate() + " Ad event: click"));
            vastTracker.on('creativeView', () => {
                console.log(currentDate() + " Ad event: impression");
                console.log(currentDate() + " Ad event: creativeView");
            });

            // parsing seconds for progress-\d* events
            for (let k in vastTracker.trackingEvents) {
                let re = /progress-\d*/;
                if (!k.search(re)) {
                    progressEventsSeconds.push(parseInt(k.split('-')[1]));
                }
            }

            // parsing extensions
            const setSkipDelay = sd => {
                if (!sd || sd >= r.ads[0].creatives[0].duration || sd < 0) {
                    adObject.skipDelay = r.ads[0].creatives[0].duration / 2;
                } else {
                    adObject.skipDelay = sd;
                }
            };
            let st2f = false;
            let customURLs = [];
            for (let w in r.ads[0].extensions) {
                if (r.ads[0].extensions[w].attributes.type.toLowerCase() == 'skiptime2' && !st2f) {
                    const prsDrExtnsn = durationString => {
                        let durationComponents, minutes, seconds, secondsAndMS;
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
                    for (let z in r.ads[0].extensions[w].children) {
                        // console.log(r.ads[0].extensions[w].children[z].value.trim());
                        customURLs.push(r.ads[0].extensions[w].children[z].value);
                    }
                    console.log(currentDate() + " Ad event: CustomTracking");
                    vastTracker.trackURLs(customURLs);
                }
            }
            if (!st2f) {
                setSkipDelay(r.ads[0].creatives[0].skipDelay);
            }

            progressEventsSeconds.sort((a, b) => a - b);
            playlist = [
                {
                    source: adObject.adMediaFile,
                    ad: true
                },
                {
                    source: video,
                    ad: false,
                    typeVideo: typeVideo
                }
            ];

            if (r.ads[0].creatives[0].mediaFiles[0].apiFramework == 'VPAID') {
                rejected('Error loading VAST - VPAID not supported');
            }
            resolve();
        });
    });
};

// main visibility API function
// use visibility API to check if current tab is active or not
const _visibilityAPI = (function () {
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
        'setHandler': function (c) {
            if (c) document.addEventListener(eventKey, c);
        },
        'tabVisible': function () {
            return !document[stateKey];
        }
    }
})();

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

let adPlugin = Clappr.UIContainerPlugin.extend({
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

    containerVolume: function () {
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
    checkAdTime: function () {
        if (adVideoPlayNow) {
            let fq = false, mp = false, tq = false;
            let timerId = setInterval(function () {
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
        }
    },

    initPlayerFor: function (type) {
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
    },

    containerPlay: function () {
        let self = this;
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
                loadVAST(vastUrl, mainVideo).then(() => self.initPlayerFor('ad'));
            }
        } else if (pauseroll) {
            if (adVideoPlayNow)
                if (p.getCurrentTime() == 0) {
                    vastTracker.setDuration(p.getDuration());
                    vastTracker.load();
                    vastTracker.setProgress(0.1);
                } else {
                    vastTracker.setPaused(false);
                }
            if (!adVideoPlayNow && !firstStart && pauseNow && p.getCurrentTime() != 0) {
                if (getSource('video').typeVideo == 'vod') {
                    vct = p.getCurrentTime();
                }
                loadVAST(vastUrl, mainVideo).then(() => self.initPlayerFor('ad'));
            }
            pauseNow = false;
            adVideoPlayNow = p.options.sources[0] != getSource('video').source;
            if (adVideoPlayNow) {
                this.show();
            } else {
                this.hide();
            }
        }
    },

    containerEnded: function () {
        let self = this;
        if (adVideoPlayNow) {
            vastTracker.complete();
            this.initPlayerFor('video');
        } else if (!adVideoPlayNow && preroll) {
            self.videoWasCompleted = true;
            firstStart = true;
        }
    },

    containerPause: function () {
        // console.log('pause called');
        if (adVideoPlayNow && !p.ended) {
            vastTracker.setPaused(true);
        }
        if (preroll) {

        } else if (pauseroll) {
            firstStart = false;
            pauseNow = true;
        }
        // vastTracker.setPaused(true);
    },

    ContainerClick: function () {
        if (adVideoPlayNow) {
            window.open(adObject.clickLink).focus();
            vastTracker.click();
        } else if (!adVideoPlayNow && pauseroll && getSource('video').typeVideo == 'live') {
            p.pause();
        }
    },

    show: function () {
        // console.log('show called');
        const showAdButton = () => {
            this.$el.show();
            let timerId = setInterval(() => {
                let ab = document.getElementById('adButton');
                ab.textContent = 'You can skip this ad in ' + parseInt(adObject.skipDelay - p.getCurrentTime());
                if (p.getCurrentTime() > adObject.skipDelay) {
                    clearInterval(timerId);
                    ab.onclick = () => {
                        skipButtonPressed = true;
                        // console.log('ab onclick');
                        vastTracker.skip();
                        this.initPlayerFor('video');
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

    hide: function () {
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
