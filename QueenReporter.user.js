// ==UserScript==
// @name         Queen Reporter
// @namespace    https://github.com/geisterfurz007
// @version      0.2.1
// @description  Quick feedback to Heat Detector
// @author       geisterfurz007
// @include	 https://stackoverflow.com/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @downloadURL https://github.com/geisterfurz007/QueenReporter/raw/master/QueenReporter.user.js
// @updateURL https://github.com/geisterfurz007/QueenReporter/raw/master/QueenReporter.meta.js
// ==/UserScript==

const room = 111347;
const test_room = 167908;

const feedbackString = "@ Queen feedback ";

(function() {

	'use strict';

	if (typeof GM !== 'object') {
		GM = {};
	}

	if (typeof GM_xmlhttpRequest === 'function' && !GM.xmlHttpRequest) {
		GM.xmlHttpRequest = GM_xmlhttpRequest;
	}

	GM_addStyle(".comment-queen-feedback-icon::after {content: \"🐝\"} .comment-queen-feedback-icon dl {display: inline-block} .comment-queen-feedback-icon.queen-popup-closed dl {display:none}");

	//Listener to react to the opened comment flagging popup
	addXHRListener(checkPopup);

	//Quickfeedback
	$(".comment-actions > div:nth-child(2)").after(getQueenFeedbackElement);

})();

function addXHRListener(callback) {
	let open = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function() {
		this.addEventListener('load', callback.bind(null, this), false);
		open.apply(this, arguments);
	};
}

function checkPopup(xhr) {
	console.log("request has been made: ", xhr.responseURL);
	let matches = /flags\/comments\/\d+\/popup\?_=\d+/.exec(xhr.responseURL);
	if (matches !== null && xhr.status === 200) {
		$(".popup-submit").on("click", checkReport);
	}
}

function checkReport(event) { //event just in case it might be needed in the future
	let results = $(".action-list > .action-selected span.action-name");
	if (results.length > 0) {
		let id = $(".popup-flag-comment").attr("id").split("-")[2];
		let link = getCommentUrl(id);
		let flagName = results[0].innerHTML;
		if (flagName.indexOf("rude") > -1) {
			sendChatMessage(feedbackString + link + " tp");
		} else if (flagName.indexOf("no longer") > -1) {
			sendChatMessage(feedbackString + link + " nc");
		}
	}
}

function getCommentUrl(commentId) {
	let id = "#comment-"+commentId;
	return $(id + " .comment-link").prop("href");
}

function sendChatMessage(msg) {
  GM.xmlHttpRequest({
    method: 'GET',
    url: 'https://chat.stackoverflow.com/rooms/' + room,
    onload: function (response) {
      var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
      GM.xmlHttpRequest({
        method: 'POST',
        url: 'https://chat.stackoverflow.com/chats/' + room + '/messages/new',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: 'text=' + encodeURIComponent(msg.trim()) + '&fkey=' + fkey,
        onload: function (r) {
		  console.log("Reported to Queen"); //Change tp icon color
        }
      });
    }
  });
}

function getQueenFeedbackElement() {
	let div = document.createElement("div");
	let anchor = document.createElement("a");
	anchor.classList.add("comment-queen-feedback-icon", "queen-popup-closed");

	//Create popup
	anchor.addEventListener("mouseover", () => anchor.classList.remove("queen-popup-closed"));
	anchor.addEventListener("mouseout", () => anchor.classList.add("queen-popup-closed"));

	let dl = document.createElement("dl");
	dl.style = "margin: 0px; z-index: 1; position: absolute; white-space: nowrap; background: rgb(255, 255, 255) none repeat scroll 0% 0%; padding: 5px; border: 1px solid rgb(159, 166, 173); box-shadow: rgba(36, 39, 41, 0.3) 0px 2px 4px; cursor: default;";

	let options = getOptions();
	options.forEach(o => dl.appendChild(getDDWithText(o.report, o.desc)));

	anchor.appendChild(dl);

	div.appendChild(anchor);
	return div;
}

function getDDWithText(report, description) {
	let result = document.createElement("dd");
	result.style = "padding-left: 5px; padding-right: 5px;";

	let anchor = document.createElement("a");
	anchor.style = "display: inline-block; margin-top: 5px; width: auto;";
	anchor.innerText = description;

	anchor.addEventListener("click", ev => {
		let cId = $(ev.target).parents(".comment").attr("data-comment-id");
		sendChatMessage(feedbackString + getCommentUrl(cId) + " " + report);
	});

	result.appendChild(anchor);
	return result;
}

function getOptions() {
	return [
		{
			report: "tp",
			desc: "Rude / Abusive"
		},
		{
			report: "nc",
			desc: "No longer needed"
		},
		{
			report: "fp",
			desc: "Constructive"
		},
		{
			report: "sk",
			desc: "Hard to classify"
		}
	];	
}
