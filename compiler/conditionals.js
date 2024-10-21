import {translateSentence } from './translator.js';
import {translateExpression, intOperands, floatOperands, byteOperands} from './expresions.js';
import { globalPower } from './compiler.js';
import { getType } from './synthesis.js';

function translateIf(node){
    let condition = node.children[0]; 
    let body = node.children[1];

    let conditionCode = translateExpression(condition);
    let tag = globalPower.tagCounter;

    globalPower.output += '\t# condition: if t0 == 0 jump to if_false'+globalPower.tagCounter+' if not continue\n'; 
    globalPower.output += '\tbeqz t0, if_false'+globalPower.tagCounter+'\t# \n\n'; //if t0 == 1 continue to body if not jump to if_false
    globalPower.tagCounter++;

    globalPower.output += '\t#If_true body\n';
    for (const child of body.children) {
        translateSentence(child);
    }
    globalPower.output += '\tj end_if'+tag+' \t #Jump to end of if\n';
    globalPower.output += 'if_false'+tag+': \n';

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


function translateSwitch(node){
    //hte odea is to compare the expression with the cases
    //if the case is the same as the expression, jump to the case body
    //if there is no case, jump to the default case (if there is one)
    //if there is no default case, jump to the end of the switch

    let expression = node.children[0];
    globalPower.output += '\t#Compare switch\n';
    var type = getType(expression);
    let tag = globalPower.tagCounter;
    globalPower.tagCounter++;
    globalPower.breakTag = 'end_switch_'+tag;

    translateExpression(expression);
    //save the switch expression in t5 or ft5
    if(type === 'float'){
        globalPower.output += '\tfmv.s ft5, ft0\n';
    } else {
        globalPower.output += '\tmv t5, t0\n';
    }

    for (let i = 1; i < node.children.length; i++) {
        let child = node.children[i];
        if(child.type === 'case'){
            translateCase(child, tag, i);
        } else if(child.type === 'default'){
            globalPower.output += '\tj default_'+tag+'\n';
        }
    }

    for (let i = 1; i < node.children.length; i++) {
        let child = node.children[i];
        if(child.type === 'case'){
            globalPower.output += 'case_'+tag+'_'+i+': \n';
            for (const sentence of child.children[1]){
                translateSentence(sentence);
            }
        } else if(child.type === 'default'){
            globalPower.output += 'default_'+tag+': \n';
            for (const sentence of child.children){
                translateSentence(sentence);
            }
        }
    }
    globalPower.output += 'end_switch_'+tag+': \n';
}

function translateCase(node, tag, i){
    //the value of the switch is in t5 or ft5
    //the value of the case is the first child
    let value = node.children[0];

    let type = getType(value);
    translateExpression(value);
    globalPower.output += '\t#Compare case\n';
    //compare the value of the case in t0 or ft0 with the value of the switch in t5 or ft5
    if(type === 'float'){
        globalPower.output += '\tfeq.s t0, ft0, ft5\n';
        globalPower.output += '\tbeqz t0, case_'+tag+'_'+i+'\t# Si t0 es 0 (no son iguales), no salta\n';
    } else {
        globalPower.output += '\tbeq t0, t5, case_'+tag+'_'+i+'\t# Salta si son iguales\n';
    }
    
}

export {
    translateIf,
    translateSwitch
}