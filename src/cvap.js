// preroll

// pauseroll
// TODO how detect - live or vod?
// TODO live pauseroll?

// common

let adVideoPlayNow = false;
let p = '';
let playlist = [];
let adObject = {};
let typeVideo = '';
let preroll = false;
let pauseroll = false;
let isFullscreen = false;
let pauseNow = false;
let firstStart = true;
let vastTracker = '';
let progressEventsSeconds = [];



adObject.adMediaFile = '';

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


let adPlugin = Clappr.UIContainerPlugin.extend({
    name: 'ad_plugin',

    initialize: function initialize() {
        this.render();
    },

    bindEvents: function bindEvents() {
        this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.containerPause);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.containerPlay);
        this.listenTo(this.container, Clappr.Events.CONTAINER_ENDED, this.containerEnded);
    },

    show: function () {

    },

    hide: function () {

    },

    render: function render() {
        return this;
    },

    containerPause: function () {
        // not activate 'play' event when pause
        if (!adVideoPlayNow) {
            pauseNow = true;
        }
        // console.log('pause');
    },

    containerPlay: function () {
        let self = this;
        // console.log('play');
        if (adVideoPlayNow) {
            vastTracker.trackURLs(customURLs);
            console.log(currentDate() + " Ad event: CustomTracking");
        }

        if (preroll) {

        } else if (pauseroll) {
            if (!adVideoPlayNow && pauseNow && !firstStart) {
                pauseNow = false;
                // loadVAST(vastUrl, mainVideo).then(() => console.log('play ad'));
                loadVAST(vastUrl, mainVideo).then(() => self.initPlayerFor('ad'));
            }
        }
        firstStart = false;
    },

    containerEnded: function () {
        firstStart = true;
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
});
