import {translateSentence } from './translator.js';
import {translateExpression} from './expresions.js';
import { globalPower } from './compiler.js';

function translateIf(node){
    let condition = node.children[0];
    let body = node.children[1];

    let conditionCode = translateExpression(condition);
    globalPower.output += '\t# condition: if t0 == 1 continue if not jump to if_false'+globalPower.tagCounter+'\n';
    globalPower.output += '\tbeqz t0, if_false'+globalPower.tagCounter+'\t# \n\n';
    globalPower.output += '\t#If body\n';
    for (const child of body.children) {
        translateSentence(child);
    }
    let tag = globalPower.tagCounter;
    globalPower.output += '\tj end_if'+tag+' \t #Jump to end of if\n';
    globalPower.output += 'if_false'+tag+': \n';
    globalPower.tagCounter++;

    if(node.children.length > 2){

        for (let i = 2; i < node.children.length; i++) {
            let elseNode = node.children[i];
            if(elseNode.type === 'else if'){
                translateElseIf(elseNode, i, tag);
            } else if(elseNode.type === 'else'){
                translateElse(elseNode, tag);
            } 
        }
    }
    globalPower.output += 'end_if'+tag+': \n';
}

function translateElseIf(node, tagNum, endTag){
    let condition = node.children[0];
    let body = node.children[1];
    let tag = globalPower.tagCounter;
    globalPower.tagCounter++;
    
    translateExpression(condition);
    globalPower.output += '\tbeqz t0, if_else_false'+tag+'_'+tagNum+'\t# \n\n';
    globalPower.output += '\t#Else If body\n';
    for (const child of body.children) {
        translateSentence(child);
    }
    globalPower.output += '\tj end_if'+endTag+'\t #Jump to end of if\n';
    globalPower.output += 'if_else_false'+tag+'_'+tagNum+': \n';
}

function translateElse(node, tag){
    let body = node.children[0];
    globalPower.output += '\t#Else body\n';
    for (const child of body.children) {
        translateSentence(child);
    }
}

export {
    translateIf
}