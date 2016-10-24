class adPlugin {
    constructor(skipoffset) {
        this.adVideoClickEvent();
//            this.adSkipButtonEvent();
        this.adButtonTimer(skipoffset);
        this.ab = document.getElementById('adButton');
//            this.v = document.getElementsByTagName('video')[0];
    }

    adVideoClickEvent() {
        // show ad-site when ad-video was clicked
        let v = document.getElementsByTagName('video')[0];
        v.onclick = function () {
            window.open('https://rick.amigocraft.net/', '_blank').focus();
        };
    }

    adSkipButtonEvent() {
        // click-event for adSkipButton
        console.log('adSkipButtonEvent called');
        this.ab.onclick = function () {
            console.log('skip ad');
            skipAd();
        };
    }

    adButtonTimer(s) {
        let self = this;
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
}

exports.adPlugin = adPlugin;
