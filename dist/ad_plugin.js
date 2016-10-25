'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var adPlugin = function () {
    function adPlugin(skipoffset, plst, plr) {
        _classCallCheck(this, adPlugin);

        this.adButtonTimer(skipoffset);
        this.ab = document.getElementById('adButton');
        this.playlist = plst;
        this.player = plr;
    }

    _createClass(adPlugin, [{
        key: 'adSkipButtonEvent',
        value: function adSkipButtonEvent() {
            var self = this;
            // click-event for adSkipButton
            this.ab.onclick = function () {
                console.log('skipped ad');
                self.skipAd();
            };
        }
    }, {
        key: 'adButtonTimer',
        value: function adButtonTimer(s) {
            var self = this;
            var timerId = setInterval(function () {
                //                console.log(player.getCurrentTime());
                self.ab.textContent = 'You can skip this ad in ' + parseInt(s / 1000 - player.getCurrentTime() + 1);
                if (player.getCurrentTime() > s / 1000) {
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
    }, {
        key: 'skipAd',
        value: function skipAd(currentPlayer) {
            console.log(playlist);
            //    delete player and create new with new config
            function reloadClappr(plr, newconf) {
                var newplayer = plr.configure(newconf);
                //            v.onclick = '';
                newplayer = new Clappr.Player(newplayer.options);
                plr.destroy();
                currentPlayer = newplayer;
            }

            if (playlist.length > 0) {
                reloadClappr(player, {
                    mediacontrol: { seekbar: "#ff43a4", buttons: "#ff43a4" },
                    autoPlay: true,
                    hideMediaControl: false
                });
                currentPlayer.load(playlist.shift());
                var ab = document.getElementById('adButton');
                ab.parentNode.removeChild(ab);
            }
        }
    }]);

    return adPlugin;
}();