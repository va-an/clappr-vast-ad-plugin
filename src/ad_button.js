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

    clickToAdVideo: function () {
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

class mediaControlSeekDisable extends Clappr.MediaControl {
    constructor(options) {
        super(options);
    }

    getSettings() {
        let newSettings = $.extend({}, this.container.settings);
        newSettings.seekEnabled = false;
        return newSettings;
    }
}
