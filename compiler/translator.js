import { globalPower, addSymbol } from "./compiler.js";
import { getType, getDefaultValue, getNewType } from "./synthesis.js";
import { translateExpression } from "./expresions.js";
import { translatePrint } from "./print.js";

function translateSentence (node) {
    if (node.type === 'declaration') {
        translateDeclaration(node);
    } else if (node.type === 'assign') {
        translateAssignment(node);
    } else if (node.type === 'print') {
        translatePrint(node);
    } // else if (node.type === 'if') {
    //     translateIf(node);
    // } else if (node.type === 'while') {
    //     translateWhile(node);
    // } else if (node.type === 'for') {
    //     translateFor(node);
    // } else if (node.type === 'forEach') {
    //     translateForEach(node);
    // }
    // else if (node.type === 'switch') {
    //     translateSwitch(node);
    // } else if(node.type === 'array_declaration'){
    //     translateArrayDec(node);
    // } else if(node.type === 'array_assign'){
    //     translateArrayAssign(node);
    // } else if(node.value === 'function'){
    //     translateFunction(node);
    // } else if(node.type === 'void'){
    //     translateVoid(node);
    // } else if(node.type === 'call'){
    //     translateCall(node); 
    // } else if(node.type === 'struct'){
    //     translateStructPrototype(node);
    // } else if(node.type === 'structDeclaration'){
    //     translateStructDec(node);
    // } else if(node.type === 'structAssign'){
    //     translateStructAssing(node);  
    // } else if(node.type === 'break'){
    //     return 'break';
    // } else if(node.type === 'continue'){
    //     return 'continue';
    // } else if(node.type === 'return'){
    //     return 'return';
    // }
}
function translateDeclaration(node){
    let type = node.children[0];
    let id = node.children[1].value;
    let value = "null";
    //let defaultValue = "0";
    if (node.children.length === 2) {    //case: <type> <id> ";"
        //add the variable to the map; the id is the key to an object with the type and the value
        globalPower.IdMap.set(id, { type, value }); 
        //Translate the declaration with default value
        value = getDefaultValue(type)
    } 
    else { //If the declaration has a value
        if (type === "var") { //case: "var" <id> "=" <value> ";"        
        type = getType(node.children[2]);        
        } 
        else {                            //case: <type> <id> "=" <value> ";"
            let type2 = getType(node.children[2]);
            // Verify if the types are the same or if the type is float and the type1 is int
            if (type !== type2 && !(type === 'float' && type2 === 'int')) { 
                console.log("Error: Type mismatch: " + type + " !== " + type2);
            }
        }
        //Translate the declaration with default value
        if(type == "string"){
            //if (node.children[2].children.length === 0)  
            value = node.children[2].value+' ';
            //else
        } 
        else {            
            value = getDefaultValue(type);
            //Translate the value
            let exp = translateExpression(node.children[2]);
            globalPower.output += "\t" + "la t4, "+ id + "\t# Cargar la dirección\n";
            //If the type is float, the value must be stored in a floating point register
            if( type == 'float'){
                globalPower.output += "\t" + "fsw "+ exp+ ", (t4) \t# Almacenar el flotante\n";
            } //If the type is char or boolean, the value must be stored in a byte
            else if (type === 'char' || type === 'boolean') { 
                globalPower.output += "\t" + "sb "+ exp+ ", (t4)\n";
            }
            else {
                globalPower.output += "\t" + "sw "+ exp+ ", (t4)\n";
            }
        }
        //add the variable to the map; the id is the key to an object with the type and the value
        globalPower.IdMap.set(id, { type, value }); 
    }
     //Translate the declaration with default value
    globalPower.data += "\t" + id + ": ."+getNewType(type)+" " + value + "\n";
    addSymbol(id, type, 'variable', node.children[1].line, node.children[1].column);
    console.log(globalPower.IdMap);
    return globalPower.IdMap;
}

export {
    translateSentence
}