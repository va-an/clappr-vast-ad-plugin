function Parser(xmlDoc) {
    this.xmlDoc = xmlDoc;
    this.tracking_events = {};
    this.media_file = [];
    this.impression = '';
    this.duration = 0;
}

Parser.prototype.get_media_file = function () {
    var media_files = this.xmlDoc.getElementsByTagName('MediaFile');
    if (media_files.length == 1) {
        var media_file = {};
        var media_attributes = media_files[0].attributes;
        media_file['file'] = media_files[0].childNodes[0].nodeValue;
        for (var i = 0; i < media_attributes.length; i++) {
            media_file[media_attributes[i].nodeName] = media_attributes[i].value
        }
        this.media_file = media_file;
    } else {
        for (var i = 0; i < media_files.length; i++) {
            media_file = {};
            media_attributes = media_files[i].attributes;
            media_file['file'] = media_files[i].childNodes[0].nodeValue;
            for (var j = 0; j < media_attributes.length; j++) {
                media_file[media_attributes[j].nodeName] = media_attributes[j].value
            }
            this.media_file.push(media_file);
        }
    }
    return media_file.file.trim();
};

Parser.prototype.get_tracking_events = function () {
    var events_tag = this.xmlDoc.getElementsByTagName('Tracking');
    for (var i = 0; i < events_tag.length; i++) {
        event_name = events_tag[i].attributes[0].value;
        event_value = events_tag[i].childNodes[0].nodeValue;
        this.tracking_events[event_name] = event_value;
    }
};

Parser.prototype.get_impression = function () {
    var imp = this.xmlDoc.getElementsByTagName('Impression');
    this.impression = imp[0].childNodes[0].nodeValue
};

Parser.prototype.get_vast = function (adSrc) {
    var xhttp = new window.XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var xmlDoc = this.responseXML;
            parser = new Parser(xmlDoc)
        }
    };

    xhttp.onerror = function() {
        alert( 'error ' + this.status );
    };

    xhttp.open("GET", adSrc, false);
    xhttp.send(null);
};

// var parser = new Parser('');
// parser.get_vast();
// parser.get_impression();
// parser.get_media_file();
// parser.get_tracking_events()
// console.log(parser.media_file)

exports.adPlugin = Parser;
