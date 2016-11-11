// TODO return main video when main video ends
// TODO check wrongs params - typeAd
// TODO preroll - adObject.typeAd == 'preroll'
// TODO seekEnabled = false for preroll ad

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

adObject.wasStarted = false;
adObject.adMediaFile = '';
adObject.wasCompleted = false;

const setTypeAd = (type) => {
    adObject.typeAd = type;
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

// for containerEnded
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

const initPlayerForAd = () => {
    console.log('ipfa');
    p.load(getAd().source);
};

const initPlayerForVideo = () => {
    console.log('ipfv');
    adVideoPlayNow = false;
    pauseNow = false;
    p.load(getVideo().source);
    if (getVideo().typeVideo == 'vod') {
        p.seek(vct);
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

// class adPlugin {
//     constructor(skipoffset, plst, plr) {
//         this.adButtonTimer(skipoffset);
//         this.playlist = plst;
//         this.player = plr;
//         this.ab = document.getElementById('adButton');
//         this.playerEvents(this.player, this.playlist);
//     }
//
//     playerEvents(plr, plst) {
//         plr.on(Clappr.Events.PLAYER_ENDED, function () {
//             if (plst.length > 0) {
//                 vastTracker.complete();
//                 adObject.wasCompleted = true;
//                 adPlugin.skipAd(plr, plst);
//             }
//         });
//
//         plr.on(Clappr.Events.PLAYER_PLAY, function () {
//             plr.core.mediaControl.container.settings.seekEnabled = plst.length <= 0;
//             if (plr.getCurrentTime() <= 1) {
//                 vastTracker.setProgress(1);
//                 adObject.wasStarted = true;
//             }
//         });
//     }
//
//     adButtonTimer(s) {
//         let self = this;
//         var timerId = setInterval(function () {
//             self.ab.textContent = 'You can skip this ad in ' + parseInt(s - plr.getCurrentTime());
//             if (plr.getCurrentTime() > s) {
//                 clearInterval(timerId);
//                 self.adSkipButtonEvent();
//                 self.ab.textContent = 'Skip Ad';
//                 console.log('time to skip ad!');
//             }
//         }, 300);
//     }
//
//     adSkipButtonEvent() {
//         var self = this;
//         this.ab.onclick = () => {
//             console.log('ab onclick');
//             adPlugin.skipAd(self.player, self.playlist);
//         };
//     }
//
//     static skipAd(p, playlist) {
//         var playlistItem = playlist.shift();
//         adVideoPlayNow = playlistItem.ad;
//         p.load(playlistItem.source, '', true);
//         var ab = document.getElementById('adButton');
//         ab.parentNode.removeChild(ab);
//         if (!adObject.wasCompleted) {
//             vastTracker.skip();
//         }
//     }
// }

let adButton = Clappr.UIContainerPlugin.extend({
    name: 'ad_plugin',
    initialize: function initialize() {
        this.render();
    },

    bindEvents: function bindEvents() {
        // console.log('bind events - called');
        this.listenTo(this.container, Clappr.Events.CONTAINER_CLICK, this.clickToContainer);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.containerPlay);
        this.listenTo(this.container, Clappr.Events.CONTAINER_ENDED, this.containerEnded);

        if (preroll) {
            // this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.containerPause);
        } else if (pauseroll) {
            this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.containerPause);
            // this.listenTo(this.container, Clappr.Events.CONTAINER_READY, this.containerReady);
        }
    },

    // containerReady: function () {
    // adVideoPlayNow = p.options.sourses[0] != getVideo().source;
    // console.log(p);
    // },

    containerPlay: function () {
        if (preroll) {
            // if (adObject.wasStarted && !adObject.wasCompleted) {
            //     vastTracker.setPaused(false);
            // }
            // if (!adVideoPlayNow) {
            //     this.destroy();
            // }
        } else if (pauseroll) {
            // console.log('play called');
            if (!adVideoPlayNow && !firstStart && pauseNow) {
                if (getVideo().typeVideo == 'vod') {
                    vct = p.getCurrentTime();
                }
                initPlayerForAd();
            }
            pauseNow = false;
            adVideoPlayNow = p.options.sources[0] != getVideo().source;
            p.core.mediaControl.container.settings.seekEnabled = !adVideoPlayNow;
            if (adVideoPlayNow) {
                this.show();
            } else {
                this.hide();
            }
        }
    },

    containerEnded: function () {
        console.log('ce');
        if (preroll) {
            // console.log('preroll ended called');
        } else if (pauseroll) {
            console.log('pauseroll');
            if (adVideoPlayNow) {
                // console.log('end');
                initPlayerForVideo();
            } else {
                // initPlayerForVideo();
            }
        }
        // console.log('container ended');
    },

    containerPause: function () {
        // console.log('pause called');
        firstStart = false;
        pauseNow = true;
        // vastTracker.setPaused(true);
        // if (!adVideoPlayNow) {
        //     // this.show();
        //     if (getVideo().typeVideo == 'vod') {
        //         vct = p.getCurrentTime();
        //     }
        //     initPlayerForAd();
        // }
    },

    clickToContainer: function () {
        if (preroll) {
            window.open(adObject.clickLink).focus();
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
            let timerId = setInterval(function () {
                let ab = document.getElementById('adButton');
                ab.textContent = 'You can skip this ad in ' + parseInt(adObject.skipDelay - p.getCurrentTime());
                if (p.getCurrentTime() > adObject.skipDelay) {
                    clearInterval(timerId);
                    ab.onclick = () => {
                        console.log('ab onclick');
                        initPlayerForVideo();
                    };
                    ab.textContent = 'Skip Ad';
                    // console.log('time to skip ad!');
                }
            }, 300);
        };
        if (preroll) {
            if (adVideoPlayNow) {
                showAdButton();
                // this.$el.show();
                // let timerId = setInterval(function () {
                //     let ab = document.getElementById('adButton');
                //     ab.textContent = 'You can skip this ad in ' + parseInt(adObject.skipDelay - p.getCurrentTime());
                //     if (p.getCurrentTime() > adObject.skipDelay) {
                //         clearInterval(timerId);
                //         ab.onclick = () => {
                //             initPlayerForVideo();
                //             console.log('ab onclick');
                //         };
                //         ab.textContent = 'Skip Ad';
                //         console.log('time to skip ad!');
                //     }
                // }, 300);
            } else {
                this.hide();
            }
        } else if (pauseroll) {
            showAdButton();
            // this.$el.show();
            // let timerId = setInterval(function () {
            //     let ab = document.getElementById('adButton');
            //     ab.textContent = 'You can skip this ad in ' + parseInt(adObject.skipDelay - p.getCurrentTime());
            //     if (p.getCurrentTime() > adObject.skipDelay) {
            //         clearInterval(timerId);
            //         ab.onclick = () => {
            //             initPlayerForVideo();
            //             console.log('ab onclick');
            //         };
            //         ab.textContent = 'Skip Ad';
            //         console.log('time to skip ad!');
            //     }
            // }, 300);
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
