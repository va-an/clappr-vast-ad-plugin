'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// div adButton in player
var adButton = Clappr.UIContainerPlugin.extend({
    name: 'ad_button',
    initialize: function initialize() {
        this.render();
    },

    bindEvents: function bindEvents() {
        this.listenTo(this.container, Clappr.Events.CONTAINER_PAUSE, this.show);
        this.listenTo(this.container, Clappr.Events.CONTAINER_CLICK, this.clickToAdVideo);
        // this.listenTo(this.container, Clappr.Events.CONTAINER_PLAY, this.hide);
    },

    clickToAdVideo: function clickToAdVideo() {
        window.open('https://rick.amigocraft.net/', '_blank').focus();
    },

    hide: function hide() {
        this.$el.hide();
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

var mediaControlSeekDisable = function (_Clappr$MediaControl) {
    _inherits(mediaControlSeekDisable, _Clappr$MediaControl);

    function mediaControlSeekDisable(options) {
        _classCallCheck(this, mediaControlSeekDisable);

        return _possibleConstructorReturn(this, (mediaControlSeekDisable.__proto__ || Object.getPrototypeOf(mediaControlSeekDisable)).call(this, options));
    }

    _createClass(mediaControlSeekDisable, [{
        key: 'getSettings',
        value: function getSettings() {
            var newSettings = $.extend({}, this.container.settings);
            newSettings.seekEnabled = false;
            return newSettings;
        }
    }]);

    return mediaControlSeekDisable;
}(Clappr.MediaControl);