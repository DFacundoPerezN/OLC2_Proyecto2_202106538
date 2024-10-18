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

function translateFor(node){
    console.log("Translating for");
    let init = node.children[0];
    let condition = node.children[1];
    let increment = node.children[2];
    let body = node.children[3];

    var forTag = 'for_'+globalPower.tagCounter
    globalPower.continueTag = forTag + ':'; //continue tag

    var endTag = 'end_for_'+globalPower.tagCounter;
    globalPower.breakTag = endTag + ':'; //break tag

    globalPower.tagCounter++; //increment tag counter

    globalPower.output += '\t#For loop\n';
    translateSentence(init);
    globalPower.output += forTag+': \n';
    translateExpression(condition);
    globalPower.output += '\t# condition: if t0 == 0 jump to '+ endTag +'\n';     
    globalPower.output += '\tbeqz t0, '+endTag+'\t# \n\n';
    for (const child of body.children) {
        translateSentence(child);
    }
    translateExpression(increment);

    globalPower.output += '\tj '+forTag+' \t #Jump to for\n';
    globalPower.output += endTag+': \n';
    
    globalPower.breakTag = '';
    globalPower.continueTag = '';
}

export {
    translateWhile,
    translateFor
}