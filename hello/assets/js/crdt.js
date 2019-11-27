import { create } from "domain";

//TODO: CRDT and queue of jobs

//Assuming single character insertion and deletion (TODO: Multichar)
//Ignored Enter
//No undo feture

/* Convention:
*  - In CRDT, every character on line i is greater than every character on line i-1.
*/


/**
 * API:
 *
 * crdt.local_insert(char, lineNumber, pos)
 * crdt.local_delete(lineNumber, pos)
 * crdt.render_line(lineNumber)
 * crdt.remote_insert(Character, lineNumber)
 * crdt.remote_delete(Character, lineNumber)
 */

class Identifier {
    /**
     * An `Identifier` identifies the position of a `ch` in a `character`
     * @param  {Number} position
     * @param  {Number} siteID
     */
    constructor(position, siteID) {
        this.position = position;
        this.siteID = siteID;
    }
    
    /**
     * If `this` == `identifier`
     * @param  {Identifier} identifier
     * @param  {Boolean}    site=true
     */
    isEqualTo(identifier, site=true) {
        if(site) return (this.position == identifier.position && this.siteID == identifier.siteID);
        else return (this.position == identifier.position);
    }
    
    /**
     * If `this` > `identifier`
     * Based on position, ties broken by siteID
     * @param  {Identifier} identifier
     */
    isGreaterThan(identifier) {
        if(this.position > identifier.position) return true;
        if(this.position < identifier.position) return false;
        return this.siteID > identifier.siteID;
    }

    /**
     * If `this` < `identifier`
     * Based on position, ties broken by siteID
     * @param  {Identifier} identifier
     */
    isLesserThan(identifier) {
        return (!this.isEqualTo(identifier) && !this.isGreaterThan(identifier));;
    }

    toString() {
        return `[${this.position}, ${this.siteID}]`;
    }
}

/**
 * Converts 2 element list to identifier list
 * @param  {List{List[2]}} list=[]
 */
function createIdentifierList(list = []) {
    var identifierList = []
    for(let l of list) {
        identifierList.push(new Identifier(l[0], l[1]));
    }
    return identifierList;
}

function parseIdentifiers(list = []) {
    var identifierList = []
    for(let l of list) {
        identifierList.push(new Identifier(l.position, l.siteID))
    }
    return identifierList;
}

//NOTE: Element would be a better name
class Character {
    /**
     * Each `Character` of CRDT data structure
     * @param  {Char}   ch
     * @param  {List{Identifier}} identifiers
     */
    constructor(ch, identifiers) {
        this.ch = ch;
        this.identifiers = identifiers;
    }
    
    /**
     * If `this` == `character`
     * @param  {Character} character
     * @param  {Boolean}   site
     */
    isEqualTo(character, site=true) {
        if(this.ch != character.ch) return false;
        if(this.identifiers.length != character.identifiers.length) return false;
        for(let i = 0; i < this.identifiers.length; i++) {
            var i1 = this.identifiers[i];
            var i2 = character.identifiers[i];
            if(!i1.isEqualTo(i2, site)) {
                return false;
            }
        }
        return true;
    }

    /**
     * If `this` > `character`
     * Based on `identifiers`
     * @param  {Character} character
     */
    isGreaterThan(character) {
        var len = Math.min(this.identifiers.length, character.identifiers.length);
        for(let i = 0; i < len; i++) {
            var i1 = this.identifiers[i];
            var i2 = character.identifiers[i];
            if(i1.isEqualTo(i2)) continue;
            if(i1.isGreaterThan(i2)) return true;
            else return false;
        }
        if(this.identifiers.length > character.identifiers.length) return true;
        else return false;
    }

    /**
     * Pushes `identifier` to `this.identifiers`
     * @param  {Identifer} identifier
     */
    pushIdentifier(identifier) {
        this.identifiers.push(identifier);
    }

    toString() {
        var output = `{${this.ch}: [`;
        for(let i = 0; i < this.identifiers.length; i++) {
            output += this.identifiers[i].toString();
            if(i < this.identifiers.length-1)
                output += ', ';
        }
        output += ']}';
        return output;
    }
}

class CRDT {
    /**
     * Conflict-Free Replicated Data Type on each client side
     * @param  {List{Character}} data=[]
     */
    constructor(data = [
            [new Character('', createIdentifierList([[0, -1]])), new Character('', createIdentifierList([[1, Infinity]]))]
        ]) {
        this.data = data;
        // this.data[0].push(new Character('', createIdentifierList([0, -1])));
        // this.data[0].push(new Character('', createIdentifierList([1, Infinity])));
        console.log(this.data)
        // for(let i = 0; i < data.length; i++) {
        //     this.data.push([]);
        //     this.data[i].push(new Character('', createIdentifierList([0, -1], [1, Infinity])))  
        // }
    }

    findNextGreaterIdentifierList(prevIdentifierList, nextIdentifierList, siteID) {
        var maxLen = Math.max(prevIdentifierList.length, nextIdentifierList.length);
        var newIdentifierList = []
        
        //Keep track of siteID before current Identifier
        var lastPrevSiteID = -1;
        var lastNextSiteID = Infinity;

        //Keeps track if the identifierList is found
        var identifierListFound = false;
        //Keeps track if next greater identifier of prev identifier is being found out
        var nextGreaterIdentifierFound = false;

        //Iterate over prev and next Identifier and get IdentifierList of `insertCharacter`
        for(let i = 0; i < maxLen; i++) {
            //TODO: Check this
            var prevIdentifier = ((i < prevIdentifierList.length) ? prevIdentifierList[i] : new Identifier(0, lastPrevSiteID));
            var nextIdentifier = ((i < nextIdentifierList.length) ? nextIdentifierList[i] : new Identifier(0, lastNextSiteID));
            
            if(!nextGreaterIdentifierFound) {
                if(prevIdentifier.position < nextIdentifier.position) {
                    //Being greedy on size of identifier list
                    if(siteID > prevIdentifier.siteID && prevIdentifier.siteID != -1) { //TODO: check if ch is same? idempotency?
                        //If by siteID alone identifier order can be obtained, then push and done!
                        //Edge case of first character inserted in line handled by 2nd condition
                        newIdentifierList.push(new Identifier(prevIdentifier.position, siteID));
                        identifierListFound = true;
                    }
                    else if(prevIdentifier.positon + 1 < nextIdentifier.position) {
                        //If there is atleast a gap of 2 between prevIdentifier and nextIdentifier, take
                        //prevIdentifier.position+1 and done!
                        newIdentifierList.push(new Identifier(prevIdentifier.position+1, siteID));
                        identifierListFound = true;
                    }
                    else { //prevIdentifier.position + 1 == nextIdentifier.position
                        //IdentifierList lesser than nextIndentifierList is found;
                        //Next find IdentifierList greater than prevIdentifier
                        newIdentifierList.push(new Identifier(prevIdentifier.position, prevIdentifier.siteID));
                        nextGreaterIdentifierFound = true;
                    }
                }
                else { //prevIdentifier.position == nextIdentifer.position
                    //NOTE: prevIdentifier.siteID < nextIdentifier.siteID
                    if(prevIdentifier.siteID < siteID && siteID < nextIdentifier.siteID) {
                        //By siteID alone order can be obtained, then push and done!
                        newIdentifierList.push(new Identifier(prevIdentifier.position, siteID));
                        identifierListFound = true;
                    }
                    else {
                        //Positions are same and siteIDs don't help in ordering. Have to go ahead
                        newIdentifierList.push(new Identifier(prevIdentifier.position, prevIdentifier.siteID));
                    }
                }
            }
            else {
                //IdentifierList is already less then nextIdentifierList;
                //This section finds IdentifierList greater than prevIdentifierList
                if(siteID > prevIdentifier.siteID) {
                    //By siteId alone order can be obtained, then push and done!
                    newIdentifierList.push(new Identifier(prevIdentifier.position, siteID));
                    identifierListFound = true;
                }
                else if(prevIdentifier.position < 9) {
                    //If prevIdentifier.position is not 9, then can always add 1 to position, push and done!
                    newIdentifierList.push(new Identifier(prevIdentifier.position+1, siteID));
                    identifierListFound = true;
                }
                else { //prevIdentifier.position == 9
                    //If prevIdentifier.position is 9, then have to go ahead
                    newIdentifierList.push(new Identifier(prevIdentifier.position, prevIdentifier.siteID));
                }
            }

            lastPrevSiteID = prevIdentifier.siteID;
            lastNextSiteID = nextIdentifier.siteID;

            if(identifierListFound) break;
        }

        if(!identifierListFound) {
            newIdentifierList.push(new Identifier(1, siteID));
            identifierListFound = true;
        }

        return newIdentifierList;
    }



    /**
     * Insert `ch` at line `lineNumber` and position `pos` by `siteID`
     * Enters at `pos`, characters after `pos` are shifted ahead
     * @param  {Char}   ch
     * @param  {Number} lineNumber
     * @param  {Number} pos
     * @param  {Number} siteID
     * @result {Character}
     */
    localInsert(ch, lineNumber, pos, siteID) {

        pos = pos + 1;
        // if(ch == '') {
        //     this.data.push([]);
        //     return new Character('', [[]]);
        // }

        var len = this.data[lineNumber].length;

        //Find prev and next Identifiers (assuming imaginary first and last characters)
        // var prevIdentifierList = ((pos != 0) ? this.data[lineNumber][pos-1].identifiers : createIdentifierList([[0, -1]]));
        var prevIdentifierList = this.data[lineNumber][pos-1].identifiers;
        // var nextIdentifierList = ((pos != len) ? this.data[lineNumber][pos].identifiers : createIdentifierList([[1, Infinity]]));
        var nextIdentifierList = this.data[lineNumber][pos].identifiers;
        
        var insertCharacter = new Character(ch, this.findNextGreaterIdentifierList(prevIdentifierList, nextIdentifierList, siteID));
        // var maxLen = Math.max(prevIdentifierList.length, nextIdentifierList.length);
        // var insertCharacter = new Character(ch, []);
        
        // //Keep track of siteID before current Identifier
        // var lastPrevSiteID = -1;
        // var lastNextSiteID = Infinity;

        // //Keeps track if the identifierList is found
        // var identifierListFound = false;
        // //Keeps track if next greater identifier of prev identifier is being found out
        // var findNextGreaterIdentifier = false;

        // //Iterate over prev and next Identifier and get IdentifierList of `insertCharacter`
        // for(let i = 0; i < maxLen; i++) {
        //     //TODO: Check this
        //     var prevIdentifier = ((i < prevIdentifierList.length) ? prevIdentifierList[i] : new Identifier(0, lastPrevSiteID));
        //     var nextIdentifier = ((i < nextIdentifierList.length) ? nextIdentifierList[i] : new Identifier(0, lastNextSiteID));
            
        //     if(!findNextGreaterIdentifier) {
        //         if(prevIdentifier.position < nextIdentifier.position) {
        //             //Being greedy on size of identifier list
        //             if(siteID > prevIdentifier.siteID && prevIdentifier.siteID != -1) { //TODO: check if ch is same? idempotency?
        //                 //If by siteID alone identifier order can be obtained, then push and done!
        //                 //Edge case of first character inserted in line handled by 2nd condition
        //                 insertCharacter.pushIdentifier(new Identifier(prevIdentifier.position, siteID));
        //                 identifierListFound = true;
        //             }
        //             else if(prevIdentifier.positon + 1 < nextIdentifier.position) {
        //                 //If there is atleast a gap of 2 between prevIdentifier and nextIdentifier, take
        //                 //prevIdentifier.position+1 and done!
        //                 insertCharacter.pushIdentifier(new Identifier(prevIdentifier.position+1, siteID));
        //                 identifierListFound = true;
        //             }
        //             else { //prevIdentifier.position + 1 == nextIdentifier.position
        //                 //IdentifierList lesser than nextIndentifierList is found;
        //                 //Next find IdentifierList greater than prevIdentifier
        //                 insertCharacter.pushIdentifier(new Identifier(prevIdentifier.position, prevIdentifier.siteID));
        //                 findNextGreaterIdentifier = true;
        //             }
        //         }
        //         else { //prevIdentifier.position == nextIdentifer.position
        //             //NOTE: prevIdentifier.siteID < nextIdentifier.siteID
        //             if(prevIdentifier.siteID < siteID && siteID < nextIdentifier.siteID) {
        //                 //By siteID alone order can be obtained, then push and done!
        //                 insertCharacter.pushIdentifier(new Identifier(prevIdentifier.position, siteID));
        //                 identifierListFound = true;
        //             }
        //             else {
        //                 //Positions are same and siteIDs don't help in ordering. Have to go ahead
        //                 insertCharacter.pushIdentifier(new Identifier(prevIdentifier.position, prevIdentifier.siteID));
        //             }
        //         }
        //     }
        //     else {
        //         //IdentifierList is already less then nextIdentifierList;
        //         //This section finds IdentifierList greater than prevIdentifierList
        //         if(siteID > prevIdentifier.siteID) {
        //             //By siteId alone order can be obtained, then push and done!
        //             insertCharacter.pushIdentifier(new Identifier(prevIdentifier.position, siteID));
        //             identifierListFound = true;
        //         }
        //         else if(prevIdentifier.position < 9) {
        //             //If prevIdentifier.position is not 9, then can always add 1 to position, push and done!
        //             insertCharacter.pushIdentifier(new Identifier(prevIdentifier.position+1, siteID));
        //             identifierListFound = true;
        //         }
        //         else { //prevIdentifier.position == 9
        //             //If prevIdentifier.position is 9, then have to go ahead
        //             insertCharacter.pushIdentifier(new Identifier(prevIdentifier.position, prevIdentifier.siteID));
        //         }
        //     }

        //     lastPrevSiteID = prevIdentifier.siteID;
        //     lastNextSiteID = nextIdentifier.siteID;

        //     if(identifierListFound) break;
        // }

        // if(!identifierListFound) {
        //     insertCharacter.pushIdentifier(new Identifier(1, siteID));
        //     identifierListFound = true;
        // }

        //insert new Character to CRDT and return it
        this.data[lineNumber].splice(pos, 0, insertCharacter);
        return insertCharacter;
    }

    localInsertNewline(lineNumber, pos, siteID) {
        pos = pos + 1;

        // var retCharacter = this.data[lineNumber][pos-1];

        var prevIdentifierList = this.data[lineNumber][pos-1].identifiers;
        var nextIndentifierList = this.data[lineNumber][pos].identifiers;
        var beginIdentifierList = this.findNextGreaterIdentifierList(prevIdentifierList, nextIndentifierList, siteID);
        var endIdentifierList = parseIdentifiers(beginIdentifierList);
        endIdentifierList[endIdentifierList.length-1].siteID = -1;
        beginIdentifierList[beginIdentifierList.length-1].siteID = Infinity;
        var beginCharacter = new Character('', beginIdentifierList);
        var endCharacter = new Character('', endIdentifierList);


        // // var beginCharacter = new Character('', createIdentifierList([[0, -1]]));
        // var beginIdentifierList = this.data[lineNumber][pos-1].identifiers;
        // beginIdentifierList[beginIdentifierList.length-1].siteID = Infinity;
        // var beginCharacter = new Character('', beginIdentifierList);
        // var endIdentifierList = this.data[lineNumber][pos-1]
        // var endPosition = this.data[lineNumber][pos-1].identifiers[0].position+1; //position one more than of the last element in the line after inserting new line
        // var endCharacter = new Character('', createIdentifierList([[endPosition, Infinity]]));
        
        //Inserts a new line at lineNumber+1, `splices` out characters after `pos` (inclusive)
        //in this.data[lineNumber] to this.data[lineNumber+1] (splice returns the removed part)
        this.data.splice(lineNumber+1, 0, this.data[lineNumber].splice(pos));
        this.data[lineNumber].push(endCharacter);
        this.data[lineNumber+1].unshift(beginCharacter);
        return beginCharacter;
    }

    /**
     * Delete `character` at line `lineNumber` and position `pos`
     * @param  {Number} lineNumber
     * @param  {Number} pos
     * @result {Character}
     */
    localDelete(lineNumber, pos) {
        pos = pos + 1;
        var tempCharacter = this.data[lineNumber][pos];
        this.data[lineNumber].splice(pos, 1);
        return tempCharacter;
    
    }

    /**
     * Deletes new line at the end of line `lineNumber`.
     * Merges line `lineNumber+1` at the end of `lineNumber`
     * @param  {Number} lineNumber
     */
    localDeleteNewline(lineNumber) {
        //Remove the 'terminating' character of line `lineNumber`
        // console.log(`current line: ${this.data[lineNumber]}`)
        var endCharacter = this.data[lineNumber].pop();
        // console.log(`current line: ${this.data[lineNumber]}`)
        var endIdentifier = endCharacter.identifiers[0];
        var retCharacter1 = this.data[lineNumber][this.data[lineNumber].length-1]
        // console.log(lineNumber, retCharacter1)
        var retCharacter = this.data[lineNumber][-1]; //Return character will be the last character in `lineNumber`
        // console.log(lineNumber, retCharacter);
        // console.log(this.data[lineNumber])
        var lineToMerge = this.data.splice(lineNumber+1, 1)[0]; //Remove line `lineNumber+1`.
        lineToMerge.shift(); //Remove 'starting' character from line to be merged
        // console.log(`lineToMerge: ${lineToMerge}`);
        //Merge `lineToMerge` to line `lineNumber` by offseting each character in `lineToMerge`
        for(var character of lineToMerge) { //TODO: Replace by splice/slice
            var modifiedCharacter = character;
            // modifiedCharacter.identifiers[0].position += endIdentifier.position;
            this.data[lineNumber].push(modifiedCharacter);
        }
        // console.log(retCharacter);
        return retCharacter1;
    }

    /**
     * Insertions directly to CRDT
     * Returns editor compliant line
     * @param  {Character} character
     * @param  {Number}    lineNumber
     * @result {string}
     */
    remoteInsert(character, lineNumber) { //Binary search insertion [pointless since splice will be O(n)]
        var cchar = new Character(character.ch, parseIdentifiers(character.identifiers));
        
        var lineNumber1;
        for(lineNumber1 = 0; lineNumber1 < this.data.length; lineNumber1++) {
            var lineLength = this.data[lineNumber1].length;
            if(this.data[lineNumber1][lineLength-1].isGreaterThan(cchar)) {
                var characters = this.data[lineNumber1];
                var pos;
                for(pos = 0; pos < lineLength; pos++) {
                    var c = characters[pos];    
                    if(!cchar.isGreaterThan(c)) break;
                }
                this.data[lineNumber1].splice(pos, 0, cchar);
                break;
            }
        }
        return lineNumber1;
        // var characters = this.data[lineNumber];
        // var pos;
        // for(pos = 0; pos < characters.length; pos++) {
        //     var c = characters[pos];
        //     if(!cchar.isGreaterThan(c)) break;
        //     // if(character.isGreaterThan(c)) continue; //character == c doesn't make sense since it's like duplicate simultaneous insertion by the same user
        // }
        // this.data[lineNumber].splice(pos, 0, cchar);
    }
    
    remoteInsertNewline(character, lineNumber) {
        var cchar = new Character(character.ch, parseIdentifiers(character.identifiers));
        var lineNumber1;
        for(lineNumber1 = 0; lineNumber1< this.data.length; lineNumber1++) {
            var lineLength = this.data[lineNumber1].length;
            if(this.data[lineNumber1][lineLength-1].isGreaterThan(cchar)) {

                var characters = this.data[lineNumber1];
                var pos;
                for(pos=0; pos<characters.length; pos++) {
                    var c = characters[pos];
                    if(!cchar.isGreaterThan(c)) break;
                }
                // var beginCharacter = new Character('', createIdentifierList([[0, -1]]));
                // var endCharacter = new Character('', createIdentifierList([[1, Infinity]]));
                // var prevIdentifierList = this.data[lineNumber1][pos-1];
                // var nextIdentifierList = this.data[lineNumber1][pos];
                // console.log(prevIdentifierList, nextIdentifierList)
                // var beginIdentifierList = this.findNextGreaterIdentifierList(prevIdentifierList, nextIdentifierList, cchar.identifiers[cchar.identifiers.length-1].siteID);
                // var endIdentifierList = parseIdentifiers(beginIdentifierList);
                // console.log(beginIdentifierList)
                // endIdentifierList[endIdentifierList.length-1].siteID = -1;
                // beginIdentifierList[beginIdentifierList.length-1].siteID = Infinity;
                // var beginCharacter = new Character('', beginIdentifierList);
                // var endCharacter = new Character('', endIdentifierList);
                // console.log(beginCharacter);
                // console.log(endCharacter);
                // this.data.splice(lineNumber1+1, 0, this.data[lineNumber1].splice(pos));
                // this.data[lineNumber1].push(endCharacter);
                // this.data[lineNumber1+1].unshift(beginCharacter);
                var beginCharacter = new Character('', parseIdentifiers(character.identifiers));
                var endCharacter = new Character('', parseIdentifiers(character.identifiers));
                beginCharacter.identifiers[beginCharacter.identifiers.length-1].siteID = Infinity;
                endCharacter.identifiers[endCharacter.identifiers.length-1].siteID = -1;
                
                //Inserts a new line at lineNumber1+1, `splices` out characters after `pos` (inclusive)
                //in this.data[lineNumber1] to this.data[lineNumber1+1] (splice returns the removed part)
                this.data.splice(lineNumber1+1, 0, this.data[lineNumber1].splice(pos));
                this.data[lineNumber1].push(endCharacter);
                this.data[lineNumber1+1].unshift(beginCharacter);

                break;
            }
        }
        return lineNumber1;
    }

    /**
     * Deletions directly to CRDT
     * Returns editor compliant line
     * @param  {Character} character
     * @param  {Number}    lineNumber
     * @result {string}
     */
    remoteDelete(character, lineNumber) {
        var cchar = new Character(character.ch, parseIdentifiers(character.identifiers))
        var lineNumber1;
        for(lineNumber1 = 0; lineNumber1<this.data.length; lineNumber1++) {
            var lineLength = this.data[lineNumber1].length;
            if(this.data[lineNumber1][lineLength-1].isGreaterThan(cchar)) {
                for(let pos = 0; pos < this.data[lineNumber1].length; pos++) {
                    var c = this.data[lineNumber1][pos];
                    // if(c.isEqualTo(character)) {
                    if(c.isEqualTo(cchar)) {
                        this.data[lineNumber1].splice(pos, 1);
                    } 
                }
                break;
            }
        }
        return lineNumber1;
        // for(let pos = 0; pos < this.data[lineNumber].length; pos++) {
        //     var c = this.data[lineNumber][pos];
        //     // if(c.isEqualTo(character)) {
        //     if(c.isEqualTo(cchar)) {
        //         this.data[lineNumber].splice(pos, 1);
        //     } 
        // }
    }

    /**
     * Newline deletions directly to CRDT
     * Returns editor compliant line
     * @param  {Character} character
     * @result {string}
     */
    remoteDeleteNewline(character, lineNumber) {
        var cchar = new Character(character.ch, parseIdentifiers(character.identifiers))
        var lineNumber1;
        for(lineNumber1 = 0; lineNumber1<this.data.length; lineNumber1++) {
            var lineLength = this.data[lineNumber1].length;
            if(this.data[lineNumber1][lineLength-1].isGreaterThan(cchar)) {
                this.data[lineNumber1].pop();
                var lineToMerge = this.data.splice(lineNumber1+1, 1)[0]; //Remove line `lineNumber+1`.
                lineToMerge.shift(); //Remove 'starting' character from line to be merged
                // console.log(`lineToMerge: ${lineToMerge}`);
                //Merge `lineToMerge` to line `lineNumber` by offseting each character in `lineToMerge`
                for(var character of lineToMerge) { //TODO: Replace by splice/slice
                    var modifiedCharacter = character;
                    // modifiedCharacter.identifiers[0].position += endIdentifier.position;
                    this.data[lineNumber1].push(modifiedCharacter);
                }
                break;
            }
        }
        return lineNumber1;
    }

    
    /**
     * Converts a line of CRDT into editor compliant line
     * @param  {Number} lineNumber
     */
    getUpdatedLine(lineNumber) {
        var characters = this.data[lineNumber];
        var lineString = ""; 
        for(let c of characters) {
            lineString += c.ch;
        }
        return lineString;
    }

    /**
     * Get string representation of `this`.
     * Useful for debugging.
     */
    toString() {
        var output = "";
        for(let i = 0; i < this.data.length; i++) {
            for(let j = 0; j < this.data[i].length; j++) {
                var character = this.data[i][j];
                output += character.toString();
                if(j < this.data[i].length-1)
                    output += ", "  
            }
            output += "\n"
        }
        return output;
    }

    getCode() {
        var output = "";
        for(let i = 0; i < this.data.length; i++) {
            for(let j = 0; j < this.data[i].length; j++) {
                output += this.data[i][j].ch;
            }
            output += "\n";
        }
        return output;
    }
}

// var testCharacter = new Character('a', createIdentifierList([[1,1], [5,2]]));
// var testCharacter1 = new Character('a', createIdentifierList([[1,1], [5,3]]));
// console.log(testCharacter.isGreaterThan(testCharacter1));

var crdt = new CRDT();

export default crdt