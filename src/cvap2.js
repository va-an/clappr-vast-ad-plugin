let adVideoPlayNow = true;
let mainVideoPlayNow = false;
let preroll = true;
let pauseroll = false;
let sbPressed = false;
let adFirstStart = true;
let sbp = false;
let pauseNow = false;
let progressEventsSeconds = [];
let vmv = false;
let vml = false;
let vct;

const getCurrentDate = () => {
    let d = new Date();
    return "(" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ") ";
};

const setTypeVideo = (type) => {
    if (type == 'vod') {
        vmv = true;
    } else if (type == 'live') {
        vml = true;
    }
};

const getVideoSource = () => {
    if (preroll) {
        return videoAd;
    } else if (pauseroll) {
        return videoMain;
    }
};

const setTypeAd = (type) => {
    adVideoPlayNow = false;
    preroll = false;
    pauseroll = false;

    if (type == 'preroll') {
        adVideoPlayNow = true;
        preroll = true;
    } else if (type == 'pauseroll') {
        pauseroll = true;
    }
};

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
                player.play();
            }, 300);
        } else {
            player.pause();
        }
    }
});

let clapprAdVastPlugin = Clappr.UIContainerPlugin.extend({
    name: 'clappr-vast-ad-plugin',
    version: '2.0',
    adMuted: false,

    initialize: function initialize() {
        this.render();
        this.checkAdTime();
    },

    render: function render() {

        console.log('render');

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

            console.log(adVideoPlayNow);

            if (adVideoPlayNow) {
                this.show();
            } else {
                this.hide();
            }
        }
        return this;
    },

    bindEvents: function bindEvents() {
        this.listenTo(this.container, Clappr.Events.CONTAINER_ENDED, this.containerEnded);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.containerPlay);
        this.listenTo(this.container, Clappr.Events.CONTAINER_VOLUME, this.containerVolume);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.containerPause);
        this.listenTo(this.container, Clappr.Events.CONTAINER_CLICK, this.containerClick);
    },

    containerClick: function () {
        if (adVideoPlayNow) {
            window.open(clickLink).focus();
            vastTracker.click();
        } else {
            player.pause();
        }
    },

    containerPause: function () {
        if (adVideoPlayNow && !player.ended) {
            vastTracker.setPaused(true);
        }
        // not activate 'play' event when pause
        else {
            player.pause();
            pauseNow = true;
        }
    },

    containerVolume: function () {
        if (adVideoPlayNow && player) {
            if (player.getVolume() == 0 && !this.AdMuted || player.getVolume() != 0 && this.AdMuted) {
                this.AdMuted = !this.AdMuted;
                vastTracker.setMuted(this.AdMuted);
            }
        }
    },

    containerPlay: function () {
        mainVideoPlayNow ? this.hide() : null;
        player.core.mediaControl.container.settings.seekEnabled = !adVideoPlayNow;

        if (adVideoPlayNow) {
            if (adFirstStart) {
                vastTracker.setProgress(0.1);
                adFirstStart = false;
            } else {
                vastTracker.setPaused(false);
            }
        } else {
            this.hide();
        }
        if (preroll) {

        } else if (pauseroll) {
            if (!adVideoPlayNow && pauseNow && player.isPlaying()) {
                pauseNow = false;
                if (vmv) {
                    vct = player.getCurrentTime();
                }
                this.switchSource('va');
                this.show();
            }
        }
    },

    containerEnded: function () {
        pauseNow = false;

        if (adVideoPlayNow) {
            vastTracker.complete();
        }
        this.switchSource('av');
    },

    switchSource: function (type) {
        if (player != null) {
            let f, s;
            if (type == 'av') {
                adVideoPlayNow = false;
                f = videoAd;
                s = videoMain;
            } else if (type == 'va') {
                adVideoPlayNow = true;
                f = videoMain;
                s = videoAd;
            }
            // adVideoPlayNow = false;
            // mainVideoPlayNow = true;
            let el = player.core.getCurrentPlayback().el;

            let endListener = () => {
                el.removeEventListener('ended', endListener);
                el.src = f;
                // el.load();
                el.play();
            };

            el.src = s;
            // el.load();
            el.addEventListener('ended', endListener);
            !sbPressed ? el.play() : null;

            if (type == 'av' && vmv) {
                player.seek(vct);
            }
        }
    },

    show: function () {
        const showAdButton = () => {
            this.$el.show();
            let timerId = setInterval(() => {
                let ab = document.getElementById('adButton');
                ab.textContent = 'You can skip this ad in ' + parseInt(skipDelay - player.getCurrentTime());
                if (player.getCurrentTime() > skipDelay) {
                    clearInterval(timerId);
                    ab.onclick = () => {
                        sbp = true;
                        vastTracker.skip();
                        sbPressed = true;
                        this.switchSource('av');
                    };
                    ab.textContent = 'Skip Ad';
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
    },

    hide: function () {
        this.$el.hide();
    },

    checkAdTime: function () {
        if (adVideoPlayNow) {
            let fq = false, mp = false, tq = false;
            let timerId = setInterval(function () {
                if (sbp) {
                    clearInterval(timerId);
                } else {
                    if (progressEventsSeconds.length && player.getCurrentTime() >= progressEventsSeconds[0]) {
                        vastTracker.setProgress(progressEventsSeconds.shift());
                        console.log(getCurrentDate() + " Ad event: progress")
                    }
                    if (player.getCurrentTime() >= player.getDuration() * 0.25 && !fq) {
                        vastTracker.setProgress(player.getCurrentTime());
                        fq = true;
                    } else if (player.getCurrentTime() >= player.getDuration() * 0.5 && !mp) {
                        vastTracker.setProgress(player.getCurrentTime());
                        mp = true;
                    } else if (player.getCurrentTime() >= player.getDuration() * 0.75 && !tq) {
                        vastTracker.setProgress(player.getCurrentTime());
                        tq = true;
                        clearInterval(timerId);
                    }
                }
            }, 300);
        }
    },
});
