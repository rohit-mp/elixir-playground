// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
import css from "../css/app.css"

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import dependencies
//
import "phoenix_html"

// Import local files
//
// Local files can be imported directly using relative paths, for example:
import socket from "./socket"
import Codemirror from "../../priv/static/js/codemirror"

let channel = socket.channel("room:lobby", {});

channel.on('shout', function (payload) {
    cm.replaceRange(payload.changeObj.text, {line: payload.changeObj.from.line, ch: payload.changeObj.from.ch}, {line: payload.changeObj.to.line, ch: payload.changeObj.to.ch});
    // marker.clear();
    // marker = cm.setBookmark(cm.getCursor(), { widget: cursorElement });
});

channel.on("updateCursor", function(payload) {
    console.log("received update");
    console.log(payload);
    marker.clear();
    marker = cm.setBookmark(payload.cursorPos, { widget: cursorElement });
})

channel.join()

var cm = Codemirror.fromTextArea(document.getElementById("editor"), {
    mode: "python",
    theme: "darcula",
    lineNumbers: true,
    autoCloseTags: true
});

    const cursorCoords = cm.cursorCoords(cm.getCursor());
    const cursorElement = document.createElement('span');
    cursorElement.style.borderLeftStyle = 'solid';
    cursorElement.style.borderLeftWidth = '2px';
    cursorElement.style.borderLeftColor = '#ff0000';
    cursorElement.style.height = `${(cursorCoords.bottom - cursorCoords.top)}px`;
    cursorElement.style.padding = 0;
    cursorElement.style.zIndex = 0;
    var marker = cm.setBookmark(cm.getCursor(), { widget: cursorElement });

cm.on("beforeChange", (cm, changeObj) => {
    console.log(cm.getCursor());
    // console.log(socket.id);
    // marker.clear();
    
    console.log("before changing");
    if(changeObj.origin != undefined){
        changeObj.cancel();
        channel.push('shout', {
            changeObj: changeObj
        });
    }
})

cm.on("cursorActivity", (cm) => {
    var cursorPos = cm.getCursor();
    console.log(cursorPos);
    channel.push("updateCursor", {
        cursorPos: cursorPos,
        user_id: window.user_id
    });
});
