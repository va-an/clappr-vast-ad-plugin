class adPlugin {
    constructor(skipoffset, plst, plr) {
        this.adButtonTimer(skipoffset);
        this.ab = document.getElementById('adButton');
        this.playlist = plst;
        this.player = plr;
    }

    adSkipButtonEvent() {
        let self = this;
        // click-event for adSkipButton
        this.ab.onclick = function () {
            console.log('skipped ad');
            self.skipAd();
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

    skipAd(currentPlayer) {
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
                mediacontrol: {seekbar: "#ff43a4", buttons: "#ff43a4"},
                autoPlay: true,
                hideMediaControl: false,
            });
            currentPlayer.load(playlist.shift());
            let ab = document.getElementById('adButton');
            ab.parentNode.removeChild(ab);
        }
    }
}
