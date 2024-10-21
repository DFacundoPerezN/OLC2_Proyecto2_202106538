import {translateSentence } from './translator.js';
import {translateExpression} from './expresions.js';
import { globalPower } from './compiler.js';
import { getDefaultValue, getNewType } from './synthesis.js';
import { addSymbol } from './compiler.js';

function translateWhile(node){
    console.log("Translating while");
    let condition = node.children[0];
    let body = node.children[1];

    var whileTag = 'while_'+globalPower.tagCounter
    globalPower.continueTag = whileTag; //continue tag

    var endTag = 'end_while_'+globalPower.tagCounter;
    globalPower.breakTag = endTag; //break tag

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

    var endTag = 'end_for_'+globalPower.tagCounter;
    globalPower.breakTag = endTag; //break tag

    var continueTag = 'continue_for_'+globalPower.tagCounter;
    globalPower.continueTag = continueTag; //continue tag

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
    globalPower.output += '\t# Change of local variable\n';   
    
    globalPower.output += continueTag+': #Jump for continue\n';
    translateSentence(increment);

    globalPower.output += '\tj '+forTag+' \t #Jump to for\n';
    globalPower.output += endTag+': \n';
    
    globalPower.breakTag = '';
    globalPower.continueTag = '';
}

function translateForEach(node){
    let type = node.children[0];
    const id_element = node.children[1].value;
    const id_array = node.children[2].value;
    const body = node.children[3];
    //Start adding the element in the data segment
    let value = getDefaultValue(type);
    globalPower.IdMap.set(id_element, { type, value });
    globalPower.data += "\t" + id_element + ": ."+getNewType(type)+" " + value + "\n";
    addSymbol(id_element, type, 'variable', node.children[1].line, node.children[1].column);
    //Translate the for each
    var forTag = 'for_'+globalPower.tagCounter

    var endTag = 'end_for_'+globalPower.tagCounter;
    globalPower.breakTag = endTag; //break tag

    var continueTag = 'continue_for_'+globalPower.tagCounter;
    globalPower.continueTag = continueTag; //continue tag
    globalPower.tagCounter++; //increment tag counter

    let array = globalPower.IdMap.get(id_array).value;

    globalPower.output += '\t#For each loop\n';
    //index < array.length
    globalPower.output += '\tla t5, '+id_array+'\t\n';
    globalPower.output += forTag+': \n';
    globalPower.output += '\t'+ 'li t2, '+array.length+'\t# t2 = cantidad elementos\n';
    if(type === 'int' || type === 'float'){
        globalPower.output += '\t'+ 'li t3, 4\t# t3 = 4 bytes\n';
        globalPower.output += '\t'+ 'mul t2, t2, t3\t# t2 = cantidad elementos * 4 bytes\n';
    }
    globalPower.output += '\tla t1, '+id_array+'\t\n';
    globalPower.output += '\t'+ 'add t1, t1, t2\t# t1 = array direction + espacio elementos\n';
    //salta si t1 == t5
    globalPower.output += '\t'+ 'beq t1, t5, '+endTag+'\t# \n';
    globalPower.output += "\t" + "la t4, "+ id_element + "\t# Cargar la dirección\n";
    if(type === 'int'){
        globalPower.output += '\tlw t3, (t5)\t #\n';
        globalPower.output += '\tsw t3, (t4)';
    } else if(type === 'float'){
        globalPower.output += '\tflw ft3, (t5)\t #\n';
        globalPower.output += '\tfsw ft3, (t4)';
    } else if(type === 'char' || type === 'boolean'){
        globalPower.output += '\tlb t3, (t5)\t #\n';
        globalPower.output += '\tsb t3, (t4)';
    }
    globalPower.output += '\t # guardamos el valor en '+id_element+'\n';
    for(const child of body.children){
        translateSentence(child);
    }
    globalPower.output += continueTag+': #\n';
    if(type === 'int' || type === 'float'){
        globalPower.output += '\t'+ 'addi t5, t5, 4\t# t5 = t5 + 4\n';
    } else if(type === 'char' || type === 'boolean'){
        globalPower.output += '\t'+ 'addi t5, t5, 1\t# t5 = t5 + 1\n';
    }
    globalPower.output += '\tj '+forTag+' \t #Jump to for\n';
    globalPower.output += endTag+': \n';
}

export {
    translateWhile,
    translateFor,
    translateForEach
}