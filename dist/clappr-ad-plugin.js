'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var adVideoPlayNow = '';
var p = '';
var adMediaFile = '';
var playlist = [];
var adObject = {};
var vastTracker = '';

adObject.wasStarted = false;
adObject.wasCompleted = false;
adObject.setTypeAd = function (type) {
    adObject.typeAd = type;
    if (adObject.typeAd == 'pauseroll') {
        console.log('mid');
    } else if (adObject.typeAd == 'preroll') {
        console.log('pre');
    }
};

// for containerEnded
var amf = '';

var generatePlaylist = function generatePlaylist(urlVast, video) {};

var createPromise = function createPromise(urlVast, video) {
    return new Promise(function (resolve, rejected) {
        DMVAST.client.get(urlVast, function (r, e) {

            // for containerEnded
            amf = r;
            console.log(amf);

            adMediaFile = r.ads[0].creatives[0].mediaFiles[0].fileURL;
            adObject.skipDelay = r.ads[0].creatives[0].skipDelay;
            adObject.clickLink = r.ads[0].creatives[0].videoClickThroughURLTemplate;

            vastTracker = new DMVAST.tracker(r.ads[0], r.ads[0].creatives[0]);
            console.log(vastTracker);

            var currentDate = function currentDate() {
                var d = new Date();
                return "(" + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + ") ";
            };

            vastTracker.on('start', function () {
                console.log(currentDate() + " Ad event: start");
            });
            vastTracker.on('skip', function () {
                console.log(currentDate() + " Ad event: skip");
            });
            vastTracker.on('pause', function () {
                console.log(currentDate() + " Ad event: pause");
            });
            vastTracker.on('resume', function () {
                console.log(currentDate() + " Ad event: resume");
            });
            vastTracker.on('resume', function () {
                console.log(currentDate() + " Ad event: complete");
            });

            playlist = [{
                source: adMediaFile,
                ad: true
            }, {
                source: video,
                ad: false
            }];
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
    if (p.options.source == adMediaFile) {
        if (_visibilityAPI.tabVisible()) {
            setTimeout(function () {
                p.play();
            }, 300);
        } else {
            p.pause();
        }
    }
});

var adPlugin = function () {
    function adPlugin(skipoffset, plst, plr) {
        _classCallCheck(this, adPlugin);

        this.adButtonTimer(skipoffset);
        this.playlist = plst;
        this.player = plr;
        this.ab = document.getElementById('adButton');
        this.playerEvents(this.player, this.playlist);
    }

    _createClass(adPlugin, [{
        key: 'playerEvents',
        value: function playerEvents(plr, plst) {
            plr.on(Clappr.Events.PLAYER_ENDED, function () {
                if (plst.length > 0) {
                    vastTracker.complete();
                    adObject.wasCompleted = true;
                    adPlugin.skipAd(plr, plst);
                }
            });

            plr.on(Clappr.Events.PLAYER_PLAY, function () {
                plr.core.mediaControl.container.settings.seekEnabled = plst.length <= 0;
                if (plr.getCurrentTime() <= 1) {
                    vastTracker.setProgress(1);
                    adObject.wasStarted = true;
                }
            });
        }
    }, {
        key: 'adButtonTimer',
        value: function adButtonTimer(s) {
            var self = this;
            var timerId = setInterval(function () {
                self.ab.textContent = 'You can skip this ad in ' + parseInt(s - plr.getCurrentTime());
                if (plr.getCurrentTime() > s) {
                    clearInterval(timerId);
                    self.adSkipButtonEvent();
                    self.ab.textContent = 'Skip Ad';
                    console.log('time to skip ad!');
                }
            }, 300);
        }
    }, {
        key: 'adSkipButtonEvent',
        value: function adSkipButtonEvent() {
            var self = this;
            this.ab.onclick = function () {
                console.log('ab onclick');
                adPlugin.skipAd(self.player, self.playlist);
            };
        }
    }], [{
        key: 'skipAd',
        value: function skipAd(p, playlist) {
            var playlistItem = playlist.shift();
            adVideoPlayNow = playlistItem.ad;
            p.load(playlistItem.source, '', true);
            var ab = document.getElementById('adButton');
            ab.parentNode.removeChild(ab);
            if (!adObject.wasCompleted) {
                vastTracker.skip();
            }
        }
    }]);

    return adPlugin;
}();

var adButton = Clappr.UIContainerPlugin.extend({
    name: 'ad_button',
    initialize: function initialize() {
        this.render();
    },

    bindEvents: function bindEvents() {
        // this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.show);
        this.listenTo(this.container, Clappr.Events.CONTAINER_CLICK, this.clickToContainer);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.destroyAdPlugin);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.containerPause);
    },

    containerPause: function containerPause() {
        vastTracker.setPaused(true);
    },

    destroyAdPlugin: function destroyAdPlugin() {
        if (adObject.wasStarted && !adObject.wasCompleted) {
            vastTracker.setPaused(false);
        }
        if (!adVideoPlayNow) {
            this.destroy();
        }
    },

    clickToContainer: function clickToContainer() {
        window.open(adObject.clickLink).focus();
    },

    show: function show() {
        this.$el.show();
    },

    render: function render() {
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
        this.show();
        return this;
    }
});