import { globalPower } from './compiler.js';
import { Symbol_s } from '../structs/symbol.js';
import { translateSentence } from './translator.js';
import { translatePrint } from './print.js';


function translateVoid(node){
    console.log("Translating void");
    //first children is the id
    const id = node.children[0].value;
    //second children have the parameters
    const parameters = node.children[1];
    //third children have the sentences body
    const body = node.children[2];

    globalPower.output += '\tj end_'+id+'\n';
    globalPower.output += '\t#Function '+id+'\n';
    globalPower.output += id+': \n';

    //translate sentences
    for (const child of body.children) {
        if(child.type === 'print'){
            translatePrint(child, 'jal t4, ');
        }else{
            translateSentence(child);
        }
    }
    globalPower.output += '\tret\n';

    globalPower.output += 'end_'+id+': \n';
}

function translateFunction(node){

}

export {
    translateVoid,
    translateFunction
}