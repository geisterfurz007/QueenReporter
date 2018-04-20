// ==UserScript==
// @name         Queen Reporter
// @namespace    https://github.com/geisterfurz007
// @version      0.5
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

const feedbackString = "@Queen feedback ";

(function() {

	'use strict';

	if (typeof GM !== 'object') {
		GM = {};
	}

	if (typeof GM_xmlhttpRequest === 'function' && !GM.xmlHttpRequest) {
		GM.xmlHttpRequest = GM_xmlhttpRequest;
	}

	GM_addStyle(".comment-queen-feedback-icon::after {content: \"🐝\"} .comment-queen-feedback-icon.queen-feedback-sent::after {content: \"🍯\"} .comment-queen-feedback-icon dl {display: inline-block} .comment-queen-feedback-icon.queen-popup-closed dl {display:none}");

	window.addEventListener("click", ev => {
        console.log(ev.target.classList.contains("comment-queen-feedback-icon"));
        if (ev.target.classList.contains("comment-queen-feedback-icon")) {
            ev.target.classList.toggle("queen-popup-closed");
        } else {
            $(".comment-queen-feedback-icon").addClass("queen-popup-closed");
        }
    });
    addQuickFeedback();

    //Listener to react to the opened comment flagging popup
	addXHRListener(checkPopup);

	//When comments are loaded because a new one is added, there are more than a few comments or a comment was posted at the bottom of a longer thread, the whole comment section is reloaded causing the icon to be removed
	//Because of that we need another request listener that checks when the comments for a certain post are requested so they can be added after that.
    addXHRListener(checkCommentReload);
})();

function addQuickFeedback(preSelector) {
	preSelector = preSelector || "";
	preSelector = preSelector.trim() + " ";
    $(preSelector + ".comment-actions > div:nth-child(2)").after(getQueenFeedbackElement);
}

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

function checkCommentReload(xhr) {
    let matches = /posts\/(\d+)\/comments\?_=\d+/.exec(xhr.responseURL);
    if (matches !== null && xhr.status === 200) {
		let postId = matches[1];
		let post = document.getElementById("answer-" + postId) || document.getElementById("question");
		let preSelector = "#" + post.getAttribute("id");
        addQuickFeedback(preSelector);
    }
}

function checkReport(event) { //event just in case it might be needed in the future
	let results = $(".action-list > .action-selected span.action-name");
	if (results.length > 0) {
		let id = $(".popup-flag-comment").attr("id").split("-")[2];
		let link = getCommentUrl(id);
		let flagName = results[0].innerHTML;
		if (flagName.indexOf("rude") > -1) {
			// sendChatMessage(feedbackString + link + " tp");
			validateFeedbackRequired(link, "tp", id);
		} else if (flagName.indexOf("no longer") > -1) {
			// sendChatMessage(feedbackString + link + " nc");
			validateFeedbackRequired(link, "nc", id);
		}
	}
}

function getCommentUrl(commentId) {
	let id = "#comment-"+commentId;
	return $(id + " .comment-link").prop("href");
}

function validateFeedbackRequired(commentUrl, feedback, commentId) {

	function sendFeedback() {
		sendChatMessage(feedbackString + commentUrl + " " + feedback, r => handleResponse(r, commentId));
	}

	if (feedback === "tp")
		return sendFeedback();

	GM.xmlHttpRequest({
		method: "GET",
		url: "http://api.higgs.sobotics.org/Reviewer/Check?contentUrl=" + encodeURIComponent(commentUrl),
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
//		data: "contentUrl=" + encodeURIComponent(commentUrl),
		onload: function (r) {
			let reports = JSON.parse(r.responseText);
			if (reports.length > 0 && reports.some(report => report.dashboard === "Hydrant")) {
				sendFeedback();
			}
			else {
				displayToaster("Feedback not needed.", "#E4EB31");
			}
		}
	});
}

function sendChatMessage(msg, cb) {
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
			if (cb) cb(r);
        }
      });
    }
  });
}

function handleResponse(r, commentId) {
	if (r.status === 200) {
		addSnack("Reported to Queen!", true);
		$("#comment-" + commentId + " .comment-queen-feedback-icon").addClass("queen-feedback-sent");
	}
	else
		addSnack("Failed to report!", false);
}

function getQueenFeedbackElement() {
	let div = document.createElement("div");
	let anchor = document.createElement("a");
	anchor.classList.add("comment-queen-feedback-icon", "queen-popup-closed");

	//For onHover; I might add a checkbox somewhere where one can choose to have it onHover/onClick
	//anchor.addEventListener("mouseover", () => anchor.classList.add("queen-popup-closed"));
	//anchor.addEventListener("mouseout", () => anchor.classList.add("queen-popup-closed"));

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
		validateFeedbackRequired(getCommentUrl(cId), report, cId);
		//sendChatMessage(feedbackString + getCommentUrl(cId) + " " + report);
	});

	result.appendChild(anchor);
	return result;
}

function addSnack(message, isSuccessMessage) {
	let color = "#" + (isSuccessMessage ? "00690c" : "ba1701");  //padding 10px
	
	displayToaster(message, color);
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

//Stolen from AF and slightly altered; Thanks Rob ;)
function displayToaster(message, colour, textColour, duration) {
	let possWrapper = document.getElementById("snackbar");
	let popupWrapper = possWrapper ? $(possWrapper) : $('<div>').addClass('hide').hide().attr('id', 'snackbar');
	let popupDelay = 2000;
	let toasterTimeout = null;
	let toasterFadeTimeout = null;
	
	let div = $('<div>')
		.css({
		'background-color': colour,
		'padding': '10px'
	})
		.text(message);
	if (textColour) {
		div.css('color', textColour);
	}
	popupWrapper.append(div);
	popupWrapper.removeClass('hide').addClass('show').show();
	function hidePopup() {
		popupWrapper.removeClass('show').addClass('hide');
		toasterFadeTimeout = setTimeout(function () {
			popupWrapper.empty().hide();
		}, 1000);
	}
	if (toasterFadeTimeout) {
		clearTimeout(toasterFadeTimeout);
	}
	if (toasterTimeout) {
		clearTimeout(toasterTimeout);
	}
	toasterTimeout = setTimeout(hidePopup, duration === undefined ? popupDelay : duration);
}


