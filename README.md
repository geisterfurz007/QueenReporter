# QueenReporter

Queen Reporter is a small userscript that adds a flag listener to comment flags on stackoverflow and reports them to [HeatDetector](https://github.com/SOBotics/SOCVFinder) in the [SOBotics SO-Chat room](https://chat.stackoverflow.com/rooms/111347).

## Usage

Follow the browser-specific instructions below. If you installed it correctly, a new icon should have appeared next to comments on stackoverflow:

![](https://i.imgur.com/BodGYct.jpg)

When you hover over it, you can give a quick feedback in the popup. This will NOT flag the post accordingly!

![](https://i.imgur.com/p4q0Zks.jpg)

Further automatic feedback will be sent when flagging a comment. Chosing one using the icon is not necessary after!

### Chrome / Firefox

1. Install TamperMonkey [for Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)  / [for Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) or [Greasemonkey for FF](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)
2. Open [the `user.js` file](https://github.com/geisterfurz007/JavaRoomStockComments/blob/master/JavaRoomStockComments.user.js)
3. Click on "Raw"
4. Tampermonkey/Greasemonkey should open up and give you the option to install the extension
5. _(Optional)_ If you have SO-chat open, reload the page

## Notes

This was written and tested with Tampermonkey 4.6.5757. If you are using Greasemonkey, please inform me about possible issues and I will see if I can get it fixed.

## Todo

 - [ ] Get consent about positioning of the icon and move if needed
 - [ ] Only show icon when the mouse is over the comment like upvote and flag icon