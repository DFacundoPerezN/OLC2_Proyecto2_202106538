import { getType, getDefaultValue, getNewType } from "./synthesis.js";
import { globalPower } from "./compiler.js";
import { translateExpression } from "./expresions.js";

function translateArrayDec (node) {
    //console.log('Array Declaration: '+ JSON.stringify(node, null, 2));
    const type = node.children[0].type;
    console.log('Array of Type: '+type);
    const id = node.children[0].children[1].value;    
    //console.log('Array of ID: '+id);
    // const size = node.children[2].value;
    // const varType = getNewType(type);
    // globalPower.IdMap.set(id, {type: varType, value: new Array(size).fill(getDefaultValue(varType))});
    if (node.children[1].type === 'list'){
        transleteDeclarationList(id, type, node.children[1]);
    } else if (node.children[1].type === 'new'){
        translateDeclarationNew(id, type, node.children[1]);
    } else { //if (node.children[1].type === 'identifier' )
        translateDeclarationCopy(id, type, node.children[1]);
    } 
    
    globalPower.data += "\n";
    console.log(globalPower.IdMap);
}

function transleteDeclarationList(id, type, node){
    const values = [];
    const varType = getNewType(type);
    globalPower.data += "\t" + id + ": ."+varType+" ";
    for (const element of node.children){
        globalPower.data += element.value + " ";
        values.push(element.value);
    }

    globalPower.IdMap.set(id, {type: type, value: values});
}

function translateDeclarationNew(id, type, node){
    const values = [];
    const size = node.children[1].value;
    const defaultValue = getDefaultValue(type);
    const varType = getNewType(type);
    //console.log('Default Value: '+defaultValue);
    globalPower.data += "\t" + id + ": ."+varType+" ";
    for (let i = 0; i < size; i++){
        globalPower.data += defaultValue + " ";
        values.push(defaultValue);
    }
    globalPower.IdMap.set(id, {type: type, value: values});
}

function translateDeclarationCopy(id, type, node){
    const values = [];
    const copyId = node.value;
    const copy = globalPower.IdMap.get(copyId);
    const varType = getNewType(type);
    globalPower.data += "\t" + id + ": ."+varType+" ";
    for (const value of copy.value){
        globalPower.data += value + " ";
        values.push(value);
    }
    globalPower.IdMap.set(id, {type: type, value: values});
}

function arrayValue(node){
    const id = node.children[0].value;      //
    const array = globalPower.IdMap.get(id);
    const type = array.type;
    const index = translateExpression(node.children[1]); //value of the index in t0
    globalPower.output += "\t# Accessing array value\n";
    if (type ==='int' || type === 'float'){
        globalPower.output += "\t" + "li t1, 4\t# bytes de .word(int) o .float\n";
    } else if (type === 'boolean' || type === 'char'){
        globalPower.output += "\t" + "li t1, 1\t# 1 .byte\n";
    }
    globalPower.output += "\tmul t0, t0, t1\t# Multiplicar el índice por el tamaño del tipo\n";
    globalPower.output += "\t" + "la t4, "+ id + "\t# Cargar la dirección\n";
    globalPower.output += "\t" + "add t4, t4, t0\t# Sumar la dirección con el índice\n";
    if (type === 'float'){
        globalPower.output += "\t" + "flw ft0, (t4)\t# Cargar el valor del arreglo a ft0\n";
        return 'ft0';
    }   
    globalPower.output += "\t" + "lw t0, (t4)\t# Cargar el valor del arreglo a t0\n";
    return 't0';
}

function translateArrayAssign(node){
    //get the type of the expression
    const type = getType(node.children[2]);
    //the first node is the id of the array
    const id = node.children[0].value;
    //the second node is the index
    globalPower.output += "\t# Assigning value to array\n";
    const index = translateExpression(node.children[1]);
    if (type ==='int' || type === 'float'){
        globalPower.output += "\t" + "li t1, 4\t# bytes de .word(int) o .float\n";
    } else if (type === 'boolean' || type === 'char'){
        globalPower.output += "\t" + "li t1, 1\t# 1 .byte\n";
    }
    globalPower.output += "\tmul t1, t1, t0\t# Multiplicar el índice por el tamaño del tipo\n";
    globalPower.output += "\t" + "la t4, "+ id + "\t# Cargar la dirección\n";
    globalPower.output += "\t" + "add t4, t4, t1\t# Sumar la dirección con el índice\n";
    //the third node is the expression value
    const exp = translateExpression(node.children[2]); //value of the expression in t0 or ft0
    //If the type is float, the value must be stored in a floating point register
    if( type === 'float'){
        globalPower.output += "\t" + "fsw ft0, (t4) \t# Almacenar el flotante\n";
        return "ft0";
    } //If the type is char or boolean, the value must be stored in a byte
    else if (type === 'char' || type === 'boolean') { 
        globalPower.output += "\t" + "sb t0, (t4)\t# Almacenar el byte\n";
    }
    else if (type === 'int'){//If the type is int, the value must be stored in a word
        globalPower.output += "\t" + "sw t0, (t4)\t# Almacenar el int(word)\n";
    } else {
        globalPower.output += "\t ##TYPE: "+type+" IS NOT IMPLEMENTED YET\n";
    }

    //console.log(globalPower.IdMap);
    return "t0";
}


export { 
    translateArrayDec,
    arrayValue,
    translateArrayAssign
};