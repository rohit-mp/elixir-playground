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
    myCodemirror.replaceRange(payload.changeObj.text, {line: payload.changeObj.from.line, ch: payload.changeObj.from.ch}, {line: payload.changeObj.to.line, ch: payload.changeObj.to.ch});
});

channel.join()

var myCodemirror = Codemirror.fromTextArea(document.getElementById("editor"), {
    mode: "python",
    theme: "darcula",
    lineNumbers: true,
    autoCloseTags: true
});

myCodemirror.on("beforeChange", (myCodemirror, changeObj) => {
    console.log("before changing");
    if(changeObj.origin != undefined){
        changeObj.cancel();
        channel.push('shout', {
            changeObj: changeObj
        });
    }
})
