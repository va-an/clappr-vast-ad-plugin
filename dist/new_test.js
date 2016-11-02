'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var adPlugin = function () {
    function adPlugin(skipoffset, plst, plr) {
        _classCallCheck(this, adPlugin);

        this.adButtonTimer(skipoffset);
        this.playlist = plst;
        this.player = plr;
        this.ab = document.getElementById('adButton');
    }

    _createClass(adPlugin, [{
        key: 'adSkipButtonEvent',
        value: function adSkipButtonEvent() {
            // click-event for adSkipButton
            //            this.ab.onclick = function () {
            // TODO move this to skipAd function
            //                console.log('click skip-button');
            //                var ab = document.getElementById('adButton');
            //                ab.parentNode.removeChild(ab);
            //                this.player.load(playlist.shift());
            //                this.player.core.mediaControl.container.settings.seekEnabled = true;
            //                this.skipAd();
            //            };
            var self = this;
            this.ab.onclick = function () {
                console.log('ab onclick');
                p.options.source = playlist.shift();
                self.player.load(p.options.source, '', true);
                var ab = document.getElementById('adButton');
                ab.parentNode.removeChild(ab);
            };
        }
    }, {
        key: 'adButtonTimer',
        value: function adButtonTimer(s) {
            var self = this;
            var timerId = setInterval(function () {
                //                console.log(player.getCurrentTime());
                self.ab.textContent = 'You can skip this ad in ' + parseInt(s / 1000 - plr.getCurrentTime() + 1);
                if (plr.getCurrentTime() > s / 1000) {
                    clearInterval(timerId);
                    self.adSkipButtonEvent();
                    self.ab.textContent = 'Skip Ad';
                    console.log('time to skip ad!');
                }
            }, 1000);

            //            setTimeout(function () {
            //                clearInterval(timerId);
            //            }, skipoffset + 100500);
        }
    }], [{
        key: 'skipAd',
        value: function skipAd() {
            console.log('ab onclick');
            //            console.log(this.player);
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
        this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.show);
        this.listenTo(this.container, Clappr.Events.CONTAINER_CLICK, this.clickToAdVideo);
        this.listenTo(this.container, Clappr.Events.CONTAINER_ENDED, this.hide);
        this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.testEvent);
        // this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.hide);
    },

    testEvent: function testEvent() {
        if (p.options.source != 'https://d11.cdnvideo.ru/videojs/files/echpochmak.mp4') {
            this.destroy();
        }
    },

    clickToAdVideo: function clickToAdVideo() {
        window.open('https://rick.amigocraft.net/', '_blank').focus();
    },

    hide: function hide() {
        console.log('hide called');
        // this.$el.hide();
    },

    show: function show() {
        this.$el.show();
    },

    render: function render() {
        //            this.$el.html('You can skip this ad in ');
        this.$el.css('font-size', '20px');
        this.$el.css('position', 'absolute');
        this.$el.css('color', 'white');
        //            this.$el.css('margin-right', '0%');
        this.$el.css('top', '70%');
        this.$el.css('right', '0%');
        this.$el.css('background-color', 'black');
        this.$el.css('z-index', '100500');
        this.$el.css('border', 'solid 3px #333333');
        this.$el.css('padding', '5px');
        this.container.$el.append(this.$el);
        this.$el[0].id = 'adButton';
        //            this.hide();
        this.show();
        return this;
    }
});