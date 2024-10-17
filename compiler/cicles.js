import {translateSentence } from './translator.js';
import {translateExpression} from './expresions.js';
import { globalPower } from './compiler.js';

function translateWhile(node){
    console.log("Translating while");
    let condition = node.children[0];
    let body = node.children[1];

    var whileTag = 'while_'+globalPower.tagCounter
    globalPower.continueTag = whileTag + ':'; //continue tag

    var endTag = 'end_while_'+globalPower.tagCounter;
    globalPower.breakTag = endTag + ':'; //break tag

    globalPower.tagCounter++; //increment tag counter

    globalPower.output += '\t#While loop\n';
    globalPower.output += whileTag+': \n';
    translateExpression(condition);
    globalPower.output += '\t# condition: if t0 == 0 jump to '+ endTag +'\n';     
    globalPower.output += '\tbeqz t0, '+endTag+'\t# \n\n';
    for (const child of body.children) {
        translateSentence(child);
    }
    globalPower.output += '\tj '+whileTag+' \t #Jump to while\n';
    globalPower.output += endTag+': \n';
    
    globalPower.breakTag = '';
    globalPower.continueTag = '';

}

export {
    translateWhile
}