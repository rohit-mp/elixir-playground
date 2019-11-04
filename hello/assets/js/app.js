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
import crdt from "./crdt"
var CRDT = require('./crdt')

let channel = socket.channel("room:lobby", {});

channel.on('shout', function (payload) {
    // if(payload.user_id != my_id){
    //     cm.replaceRange(payload.changeObj.text, {line: payload.changeObj.from.line, ch: payload.changeObj.from.ch}, {line: payload.changeObj.to.line, ch: payload.changeObj.to.ch});
    // }
    if(payload.user_id != my_id) {
        console.log(payload)
        if(payload.type == "input") {
            crdt.remoteInsert(payload.character, payload.lineNumber)
            cm.replaceRange(crdt.getUpdatedLine(payload.lineNumber), {line: payload.lineNumber, ch:0}, {line: payload.lineNumber})
        }
        else if(payload.type == "delete") {
            crdt.remoteDelete(payload.character, payload.lineNumber)
            cm.replaceRange(crdt.getUpdatedLine(payload.lineNumber), {line: payload.lineNumber, ch:0}, {line: payload.lineNumber})
        }
        else if(payload.type == "newline") {
            crdt.remoteInsertNewline(payload.character, payload.lineNumber)
            var line = payload.lineNumber
            //Updates `line` and inserts new line
            cm.replaceRange([crdt.getUpdatedLine(line), ""], {line: line, ch:0}, {line: line})
            //Updates `line+1`
            cm.replaceRange(crdt.getUpdatedLine(line+1), {line: line+1, ch:0}, {line: line+1})
        }
        else {
            console.log(payload.type, " not handled yet")
        }
        console.log(crdt.toString())
    }
});

channel.on("updateCursor", function(payload) {
    if(my_id != payload.user_id){
        // console.log("received update");
        // console.log(payload);
        // marker.clear();
        // marker = cm.setBookmark(payload.cursorPos, { widget: cursorElement });
        var cursor = document.createElement('span');
        cursor.style.borderLeftStyle = 'solid';
        cursor.style.borderLeftWidth = '1px';
        cursor.style.height = `${(payload.cursorPos.bottom - payload.cursorPos.top)}px`;
        cursor.style.padding = 0;
        cursor.style.zIndex = 0;
        cursor.style.borderLeftColor = '#' + payload.user_id.toString(16);
        if(markers[payload.user_id] != undefined){
            markers[payload.user_id].clear();
        }
        markers[payload.user_id] = cm.setBookmark(payload.cursorPos, {widget: cursor});
    }
})

channel.on("createCursor", function(payload) {
    // const cursorCoords = cm.cursorCoords(cm.getCursor());
    if(my_id != payload.user_id){
        const cursorCoords = {ch: 0, line:0};
        var cursorElement = document.createElement('span');
        cursorElement.style.borderLeftStyle = 'solid';
        cursorElement.style.borderLeftWidth = '1px';
        cursorElement.style.borderLeftColor = '#' + payload.user_id.toString(16);
        // cursorElement.style.borderLeftColor = '0xff0000'
        console.log('#' + payload.user_id.toString(16))
        cursorElement.style.height = `${(cursorCoords.bottom - cursorCoords.top)}px`;
        cursorElement.style.padding = 0;
        cursorElement.style.zIndex = 0;
        // myMarker = cm.setBookmark(cursorCoords, {widget: cursorElement});
        markers[payload.user_id] = cm.setBookmark(cursorCoords, {widget: cursorElement});
        // console.log("payload:")
        // console.log(payload)
        // console.log("myMarker:")
        // console.log(myMarker);
    }
})

channel.join()
// console.log(channel)

var cm = Codemirror.fromTextArea(document.getElementById("editor"), {
    mode: "python",
    theme: "darcula",
    lineNumbers: true,
    autoCloseTags: true
});

    // const cursorCoords = cm.cursorCoords(cm.getCursor());
    // const cursorElement = document.createElement('span');
    // cursorElement.style.borderLeftStyle = 'solid';
    // cursorElement.style.borderLeftWidth = '2px';
    // cursorElement.style.borderLeftColor = '#ff0000';
    // cursorElement.style.height = `${(cursorCoords.bottom - cursorCoords.top)}px`;
    // cursorElement.style.padding = 0;
    // cursorElement.style.zIndex = 0;
    // var marker = cm.setBookmark(cm.getCursor(), { widget: cursorElement });

    // const cursorCoords1 = cm.cursorCoords(cm.getCursor());
    // const cursorElement1 = document.createElement('span');
    // cursorElement1.style.borderLeftStyle = 'solid';
    // cursorElement1.style.borderLeftWidth = '2px';
    // cursorElement1.style.borderLeftColor = '#00ff00';
    // cursorElement1.style.height = `${(cursorCoords.bottom - cursorCoords.top)}px`;
    // cursorElement1.style.padding = 0;
    // cursorElement1.style.zIndex = 0;
    // var marker1 = cm.setBookmark(cm.getCursor(), { widget: cursorElement1 });

var markers = {};
// const my_user_id;
var reply;
var my_id;
channel.push("get_my_id", {}).receive(
    "ok", (reply) => my_id = reply.user_id
)
channel.push("createCursor", {})
// var crdt = CRDT.CRDT()


cm.on("beforeChange", (cm, changeObj) => {
    // console.log(cm.getCursor());
    // console.log(socket.id); 
    // marker.clear();
    
    // console.log("before changing");
    if(changeObj.origin != undefined){
        // changeObj.cancel();
        console.log(changeObj)
        if(changeObj.origin == "+input") {
            if(changeObj.from.line != changeObj.to.line || changeObj.from.ch != changeObj.to.ch) { //select and insert
                for(var i=changeObj.from.line; i<=changeObj.to.line; i++) {
                    for(var j=changeObj.from.ch; j<changeObj.to.ch; j++) {
                        var tempCharacter = crdt.localDelete(i, j)
                        channel.push("shout", {
                            type: "delete",
                            character: tempCharacter,
                            lineNumber: i
                        })
                    }
                }
            }
            if(changeObj.text.length > 1) { //newline
                var insertCharacter = crdt.localInsertNewline(changeObj.from.line, changeObj.from.ch);
                //insertCharacter here should be the [1,infinity] character for that line
                channel.push("shout", {
                    type: "newline",
                    character: insertCharacter,
                    lineNumber: changeObj.from.line
                })
                console.log(crdt.toString())
            }
            else { //normal case
                var insertCharacter = crdt.localInsert(changeObj.text[0], changeObj.from.line, changeObj.from.ch, my_id)
                console.log(crdt.toString())
                channel.push("shout", {
                    type: "input",
                    character: insertCharacter,
                    lineNumber: changeObj.from.line
                })
            }
        }
        else if(changeObj.origin == "+delete") {
            for(var i=changeObj.from.line; i<=changeObj.to.line; i++) {
                var begin = i==changeObj.from.line?changeObj.from.ch:1
                var end = i==changeObj.to.line?changeObj.to.ch:crdt.data[i].length-1
                for(var j = begin; j < end; j++) {
                    console.log('deleting at', i, j)
                    console.log(crdt.toString())
                    var tempCharacter = crdt.localDelete(i, j)
                    console.log('deleted', tempCharacter)
                    channel.push("shout", {
                        type: "delete",
                        character: tempCharacter,
                        lineNumber: i
                    })
                }
                if(i != changeObj.to.line) {
                    //crdt.localDeleteNewline(i); 
                }
            }   
            // var tempCharacter = crdt.localDelete(changeObj.from.line, changeObj.from.ch)
            // // console.log(tempCharacter)
            // console.log(crdt.toString())
            // channel.push("shout", {
            //     type: "delete",
            //     character: tempCharacter,
            //     lineNumber: changeObj.from.line
            // })
        }
        else {
            console.log(changeObj.origin + " not handled yet")
        }
        // channel.push('shout', {
        //     changeObj: changeObj
        // });
    }
    /*
    type: "default"/"insert"/"delete"/"newline"
    character: tempCharacter/insertCharacter
    lineNumber: lineNumber
    */
})

cm.on("cursorActivity", (cm) => {
    var cursorPos = cm.getCursor();
    // console.log(cursorPos);
    // console.log(window.user_id)
    // console.log(marker);
    // console.log(marker.find());
    channel.push("updateCursor", {
        cursorPos: cursorPos,
    });
});
