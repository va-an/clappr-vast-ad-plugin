var adPlugin =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	module.exports = __webpack_require__(2);


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

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
	            media_file[media_attributes[i].nodeName] = media_attributes[i].value;
	        }
	        this.media_file = media_file;
	    } else {
	        for (var i = 0; i < media_files.length; i++) {
	            media_file = {};
	            media_attributes = media_files[i].attributes;
	            media_file['file'] = media_files[i].childNodes[0].nodeValue;
	            for (var j = 0; j < media_attributes.length; j++) {
	                media_file[media_attributes[j].nodeName] = media_attributes[j].value;
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
	    this.impression = imp[0].childNodes[0].nodeValue;
	};

	Parser.prototype.get_vast = function (adSrc) {
	    var xhttp = new window.XMLHttpRequest();
	    xhttp.onreadystatechange = function () {
	        if (this.readyState == 4 && this.status == 200) {
	            var xmlDoc = this.responseXML;
	            parser = new Parser(xmlDoc);
	        }
	    };

	    xhttp.onerror = function () {
	        alert('error ' + this.status);
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

/***/ },
/* 2 */
/***/ function(module, exports) {

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

	exports.adPlugin = adPlugin;

/***/ }
/******/ ]);