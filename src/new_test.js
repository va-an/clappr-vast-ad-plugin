let adVideoPlayNow = '';
let p = '';
let adMediaFile = '';
let playlist = [];
let adSkipDelay = '';

let createPromise = (urlVast, video) => {
    return new Promise(function (resolve, rejected) {
        DMVAST.client.get(urlVast, function (r, e) {
            adMediaFile = r.ads[0].creatives[0].mediaFiles[0].fileURL;
            adSkipDelay = r.ads[0].creatives[0].skipDelay;
            playlist = [
                {
                    source: adMediaFile,
                    ad: true
                },
                {
                    source: video,
                    ad: false
                }];
            resolve();
        });
    });
};

// main visibility API function
// use visibility API to check if current tab is active or not
var _visibilityAPI = (function () {
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

class adPlugin {
    constructor(skipoffset, plst, plr) {
        this.adButtonTimer(skipoffset);
        this.playlist = plst;
        this.player = plr;
        this.ab = document.getElementById('adButton');
        this.playerEvents(this.player, this.playlist);
    }

    playerEvents(plr, plst) {
        console.log('player events called');
        plr.on(Clappr.Events.PLAYER_ENDED, function () {
            if (plst.length > 0) {
                console.log('pew skip');
                adPlugin.skipAd(plr, plst);
            }
        });

        plr.on(Clappr.Events.PLAYER_PLAY, function () {
            plr.core.mediaControl.container.settings.seekEnabled = plst.length <= 0;
        });
    }

    adButtonTimer(s) {
        let self = this;
        var timerId = setInterval(function () {
            self.ab.textContent = 'You can skip this ad in ' + parseInt(s - plr.getCurrentTime() + 1);
            if (plr.getCurrentTime() > s) {
                clearInterval(timerId);
                self.adSkipButtonEvent();
                self.ab.textContent = 'Skip Ad';
                console.log('time to skip ad!');
            }
        }, 1000);
    }

    adSkipButtonEvent() {
        var self = this;
        this.ab.onclick = () => {
            console.log('ab onclick');
            adPlugin.skipAd(self.player, self.playlist);
        };
    }

    static skipAd(p, playlist) {
        var playlistItem = playlist.shift();
        adVideoPlayNow = playlistItem.ad;
        p.load(playlistItem.source, '', true);
        var ab = document.getElementById('adButton');
        ab.parentNode.removeChild(ab);
    }
}

var adButton = Clappr.UIContainerPlugin.extend({
    name: 'ad_button',
    initialize: function initialize() {
        this.render();
    },

    bindEvents: function bindEvents() {
        // this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.show);
        this.listenTo(this.container, Clappr.Events.CONTAINER_CLICK, this.clickToAdVideo);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.destroyAdPlugin);
    },

    destroyAdPlugin: function () {
        if (!adVideoPlayNow) {
            this.destroy();
        }
    },

    clickToAdVideo: function () {
        window.open('https://rick.amigocraft.net/', '_blank').focus();
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
