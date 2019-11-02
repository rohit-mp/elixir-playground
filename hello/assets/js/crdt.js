// TODO: CRDT and queue of jobs

// Assuming single character insertion and deletion (TODO: Multichar)
// Ignored Enter
// No undo feture

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
     * @param  {} position
     * @param  {} siteID
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
     * If `this` and `character` are same
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
}

class CRDT {
    /**
     * Conflict-Free Replicated Data Type on each client side
     * @param  {List{Character}} data=[]
     */
    constructor(data = [[]]) {
        this.data = data;
    }
    
    // getReadablePosition(character) {
    //     var readablePosition = 0;
    //     for(var i = 0; i <  character.identifiers.length; i++) {
    //         readablePosition += character.identifiers[i].position * Math.pow(0.1, i+1);
    //     }
    //     return readablePosition;
    // }

    localInsert(ch, lineNumber, pos) {
        var prevIdentifierList = data.lineNumber[pos-1].identifiers;
        var nextIdentifierList = data.lineNumber[pos].identifiers;
    }

    /**
     * Delete `ch` at line `lineNumber` and position `pos`
     * @param  {Number} lineNumber
     * @param  {Number} pos
     * @result {Character}
     */
    localDelete(lineNumber, pos) {
        var tempCharacter = this.data[lineNumber][pos];
        this.data[lineNumber].splice(pos, 0);
        return tempCharacter;
    }

    /**
     * Insertions directly to CRDT
     * Returns editor compliant line
     * @param  {Character} character
     * @param  {Number}    lineNumber
     * @result {string}
     */
    remoteInsert(character, lineNumber) { //Binary search insertion [pointless since splice will be O(n)]
        var characters = this.data[lineNumber];
        var pos;
        for(pos = 0; pos < characters.length(); pos++) {
            var c = characters[pos];
            if(character.isGreaterThan(c)) continue; //character == c doesn't make sense since it's like duplicate simultaneous insertion by the same user
        }
        this.data[lineNumber].splice(pos, 0, character);

        return this.getUpdatedLine(lineNumber);
    }
    
    /**
     * Deletions directly to CRDT
     * Returns editor compliat line
     * @param  {Character} character
     * @param  {Number}    lineNumber
     * @result {string}
     */
    remoteDelete(character, lineNumber) {
        for(let pos = 0; pos < data[lineNumber].length; pos++) {
            var c = data[lineNumber][pos];
            if(c.isEqualTo(character)) {
                data[lineNumber].splice(pos, 1);
            } 
        }

        return this.getUpdatedLine(lineNumber);
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
}

var testCharacter = new Character('a', createIdentifierList([[1,1], [5,2]]));
var testCharacter1 = new Character('a', createIdentifierList([[1,1], [5,3]]));
console.log(testCharacter.isGreaterThan(testCharacter1));