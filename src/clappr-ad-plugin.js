// preroll

// pauseroll
// TODO how detect - live or vod?
// TODO live pauseroll?

// common
// TODO VAST events
// TODO test VAST real examples
// TODO move code in plugin by maximum

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
let videoWasCompleted = false;

adObject.wasStarted = false;
adObject.adMediaFile = '';
adObject.wasCompleted = false;

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

// for tests
let amf = '';

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

let loadVAST = (urlVast, video) => {
    return new Promise(function (resolve, rejected) {
        DMVAST.client.get(urlVast, function (r, e) {

            // for containerEnded
            amf = r;
            // console.log(amf);

            adObject.adMediaFile = r.ads[0].creatives[0].mediaFiles[0].fileURL;
            adObject.skipDelay = r.ads[0].creatives[0].skipDelay;
            adObject.clickLink = r.ads[0].creatives[0].videoClickThroughURLTemplate;

            vastTracker = new DMVAST.tracker(r.ads[0], r.ads[0].creatives[0]);
            // console.log(vastTracker);

            const currentDate = () => {
                let d = new Date();
                return "(" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ") ";
            };

            vastTracker.on('start', () => {
                console.log(currentDate() + " Ad event: start");
            });
            vastTracker.on('skip', () => {
                console.log(currentDate() + " Ad event: skip");
            });
            vastTracker.on('pause', () => {
                console.log(currentDate() + " Ad event: pause");
            });
            vastTracker.on('resume', () => {
                console.log(currentDate() + " Ad event: resume");
            });
            vastTracker.on('resume', () => {
                console.log(currentDate() + " Ad event: complete");
            });

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
    initialize: function initialize() {
        this.render();
    },

    bindEvents: function bindEvents() {
        // console.log('bind events - called');
        this.listenTo(this.container, Clappr.Events.CONTAINER_CLICK, this.ContainerClick);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.containerPlay);
        this.listenTo(this.container, Clappr.Events.CONTAINER_ENDED, this.containerEnded);

        if (preroll) {
            // this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.containerPause);
        } else if (pauseroll) {
            this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.containerPause);
            // this.listenTo(this.container, Clappr.Events.CONTAINER_READY, this.containerReady);
        }
    },

    initPlayerFor: function (type) {
        if (type == 'video') {
            // console.log('ipfv in plugin');
            adVideoPlayNow = false;
            pauseNow = false;
            p.load(getVideo().source);
            if (getVideo().typeVideo == 'vod') {
                p.seek(vct);
            }
        } else if (type == 'ad') {
            // console.log('ipfa in plugin');
            adVideoPlayNow = true;
            p.load(getAd().source);
        }
    },

    containerPlay: function () {
        p.core.mediaControl.container.settings.seekEnabled = !adVideoPlayNow;
        if (preroll) {
            if (firstStart) {
                vastTracker.setProgress(1);
                firstStart = false;
            }
            if (videoWasCompleted) {
                videoWasCompleted = false;
                this.initPlayerFor('ad');
            }
            // p.load(getAd().source);
            // p.stop();
            // this.initPlayerFor('ad');
            // if (adObject.wasStarted && !adObject.wasCompleted) {
            //     vastTracker.setPaused(false);
            // }
        } else if (pauseroll) {
            // console.log('play called');

            if (!adVideoPlayNow && !firstStart && pauseNow && p.getCurrentTime() != 0) {
                if (getVideo().typeVideo == 'vod') {
                    vct = p.getCurrentTime();
                }
                this.initPlayerFor('ad');
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
        if (preroll) {
            if (!adVideoPlayNow) {
                videoWasCompleted = true;
            } else if (adVideoPlayNow) {
                vastTracker.complete();
            }
        }
        // console.log('ce');
        if (adVideoPlayNow) {
            // console.log('end');
            this.initPlayerFor('video');
        }
    },

    containerPause: function () {
        // console.log('pause called');
        firstStart = false;
        pauseNow = true;
        // vastTracker.setPaused(true);
    },

    ContainerClick: function () {
        if (preroll) {
            if (adVideoPlayNow) {
                window.open(adObject.clickLink).focus();
            }
        } else if (pauseroll) {
            if (adVideoPlayNow) {
                window.open(adObject.clickLink).focus();
            } else if (getVideo().typeVideo == 'live') {
                p.pause();
            }
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
        // console.log('hide called');
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
