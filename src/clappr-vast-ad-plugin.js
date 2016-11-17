// preroll

// pauseroll
// TODO how detect - live or vod?
// TODO live pauseroll?

// common
// TODO VAST events
// TODO test VAST real examples

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
let isVPAID = false;

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

const getVideo = () => {
    for (let z of playlist) {
        if (!z.ad) {
            return z;
        }
    }
};

const getAd = () => {
    for (let z of playlist) {
        if (z.ad) {
            return z;
        }
    }
};

const getSource = () => {
    if (preroll) {
        return getAd().source;
    } else if (pauseroll) {
        return getVideo().source;
    }
};

const fsEventOn = () => {
    p.on(Clappr.Events.PLAYER_FULLSCREEN, function () {
        isFullscreen = !isFullscreen;
        if (adVideoPlayNow) {
            vastTracker.setFullscreen(isFullscreen);
        }
    })
};

const loadVAST = (urlVast, video) => {
    return new Promise(function (resolve, rejected) {
        DMVAST.client.get(urlVast, function (r, e) {
            console.log(r);

            // console.log(r.ads[0].creatives[0].mediaFiles);
            // console.log(r.ads[0].creatives[0].mediaFiles[0]);
            // console.log(r.ads[0].creatives[0].mediaFiles[0].apiFramework);
            // console.log(r.ads[0].creatives[0].mediaFiles[0].fileURL);
            // console.log(r.ads[0].creatives[0].type);

            adObject.adMediaFile = r.ads[0].creatives[0].mediaFiles[0].fileURL;
            adObject.skipDelay = r.ads[0].creatives[0].skipDelay;
            adObject.clickLink = r.ads[0].creatives[0].videoClickThroughURLTemplate;

            vastTracker = new DMVAST.tracker(r.ads[0], r.ads[0].creatives[0]);
            // console.log(vastTracker);

            const currentDate = () => {
                let d = new Date();
                return "(" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ") ";
            };

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

            // parse seconds for progress-\d* events
            for (let k in vastTracker.trackingEvents) {
                let re = /progress-\d*/;
                if (!k.search(re)) {
                    progressEventsSeconds.push(parseInt(k.split('-')[1]));
                }
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
                console.log('VPAID, skipping');
                isVPAID = true;
            }
            resolve();
            console.log('vast loaded');
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

    containerPlay: function () {
        let self = this;
        // console.log('play called');
        p.core.mediaControl.container.settings.seekEnabled = !adVideoPlayNow;
        if (preroll) {
            if (adVideoPlayNow) {
                if (firstStart) {
                    p.setVolume(100);
                    vastTracker.setDuration(p.getDuration());
                    vastTracker.load();
                    vastTracker.setProgress(0.1);
                    firstStart = false;
                    if (isFullscreen) {
                        vastTracker.setFullscreen(isFullscreen);
                    }
                } else {
                    vastTracker.setPaused(false);
                }
            }

            if (this.videoWasCompleted) {
                this.videoWasCompleted = false;
                loadVAST(vastUrl, mainVideo).then(function () {
                    self.initPlayerFor('ad');
                });
            }
        } else if (pauseroll) {
            if (adVideoPlayNow)
                if (p.getCurrentTime() == 0) {
                    vastTracker.setDuration(p.getDuration());
                    vastTracker.load();
                    vastTracker.setProgress(0.1);
                    if (isFullscreen) {
                        vastTracker.setFullscreen(isFullscreen);
                    }
                } else {
                    vastTracker.setPaused(false);
                }
            if (!adVideoPlayNow && !firstStart && pauseNow && p.getCurrentTime() != 0) {
                if (getVideo().typeVideo == 'vod') {
                    vct = p.getCurrentTime();
                }
                loadVAST(vastUrl, mainVideo).then(function () {
                    self.initPlayerFor('ad');
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
        } else if (!adVideoPlayNow && pauseroll && getVideo().typeVideo == 'live') {
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
                        console.log('ab onclick');
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
