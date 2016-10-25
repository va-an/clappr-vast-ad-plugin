'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var adPlugin = function () {
    function adPlugin(skipoffset) {
        _classCallCheck(this, adPlugin);

        this.adVideoClickEvent();
        //            this.adSkipButtonEvent();
        this.adButtonTimer(skipoffset);
        this.ab = document.getElementById('adButton');
        //            this.v = document.getElementsByTagName('video')[0];
    }

    _createClass(adPlugin, [{
        key: 'adVideoClickEvent',
        value: function adVideoClickEvent() {
            // show ad-site when ad-video was clicked
            var v = document.getElementsByTagName('video')[0];
            v.onclick = function () {
                window.open('https://rick.amigocraft.net/', '_blank').focus();
            };
        }
    }, {
        key: 'adSkipButtonEvent',
        value: function adSkipButtonEvent() {
            // click-event for adSkipButton
            console.log('adSkipButtonEvent called');
            this.ab.onclick = function () {
                console.log('skip ad');
                skipAd();
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
    }]);

    return adPlugin;
}();