import { globalPower } from "./compiler.js";

// Función para obtener el valor por defecto de un tipo de variable
function getDefaultValue(type) {
    switch (type) {
        case 'boolean':
        case 'int':
            return 0;
        case 'float':
            return 0.0;
        case 'char':
            return ' ';
        case 'array':
            return [];
        case 'object':
            return null;
        default:
            console.log('Error: Tipo de dato no soportado');
            return null;
    }
}

function getNewType(oldType){
    switch (oldType) {
        case 'int':
            return 'word';
        case 'float':
            return 'float';
        case 'char':
            return 'byte';
        case 'boolean':
            return 'byte';
        case 'string':
            return 'asciz';
        // case 'array':
        //     return 'array';
    }
}

function getType(node){
    if(node.type == "int" || node.type == "float" || node.type == "char" || node.type == "string" || node.type == "boolean"){
        return node.type;
    }
    if(node.type == '+'){
        const left = getType(node.children[0]);
        const right = getType(node.children[1]);
        if(left == "int" && right == "int"){
            return "int";
        } else if (left == "float" || right == "float"){
            return "float";
        } else if (left == "string" || right == "string"){
            return "string";
        } else {
            console.log("Semantic Error: Operands must be int, float or string → "+left+" "+right);
            return "Semantic Error: Operands must be int or float → "+left+" "+right;
        }
    } else if(node.type == '-'){
        if (node.children.length == 1){
            return getType(node.children[0]);
        } else {
            const left = getType(node.children[0]);
            const right = getType(node.children[1]);
            if(left == "int" && right == "int"){
                return "int";
            } else if (left == "float" || right == "float"){
                return "float";
            } else {
                console.log("Semantic Error: Operands must be int or float → "+left+" "+right);
                return "Semantic Error: Operands must be int or float → "+left+" "+right;
            }
        }
    }
    else if (node.type == '*' || node.type == '/'){ 
        const left = getType(node.children[0]);
        const right = getType(node.children[1]);
        if(left == "int" && right == "int"){
            return "int";
        } else if (left == "float" || right == "float"){
            return "float";
        } else {
            console.log("Semantic Error: Operands must be int or float → "+left+" "+right);
            return "Semantic Error: Operands must be int or float → "+left+" "+right;
        }
    }
    else if(node.type == "%"){ 
        const left = getType(node.children[0]);
        const right = getType(node.children[1]);
        if(left == "int" && right == "int"){
            return "int";
        } else {
            console.log("Semantic Error: Operands must be int → "+left+" "+right);
            return "Semantic Error: Operands must be int → "+left+" "+right;
        }
    }
    else if (node.type == "==" || node.type == "!="){
        const left = getType(node.children[0]);
        const right = getType(node.children[1]);
        if(left == right){
            return "boolean";
        } else if ((left == "int" && right == "float") || (left == "float" && right == "int")){
            return "boolean";
        } else if (left == "float" || right == "float"){
            return "boolean";
        } else {
            console.log("Semantic Error: Operands must be the same type → "+left+" "+right);
            return "Semantic Error: Operands must be the same type → "+left+" "+right;
        }
    }
    else if(node.type == "<" || node.type == ">" || node.type == "<=" || node.type == ">="){
        const left = getType(node.children[0]);
        const right = getType(node.children[1]);
        if(left == right){
            return "boolean";
        } else if ((left == "int" && right == "float") || (left == "float" && right == "int")){
            return "boolean";
        } else {
            console.log("Semantic Error: Operands must be the same type → "+left+" "+right);
            return "Semantic Error: Operands must be the same type → "+left+" "+right;
        }
    }
    else if(node.type == "||" || node.type == "&&"){ 
        const left = getType(node.children[0]);
        const right = getType(node.children[1]);
        if(left == "boolean" && right == "boolean"){
            return "boolean";
        } else {
            console.log("Semantic Error: Operands must be boolean → "+left+" "+right);
            return "Semantic Error: Operands must be boolean →"+left+" "+right;
        }
    }
    else if(node.type == "!"){ 
        const right = getType(node.children[0]);
        if(right == "boolean"){
            return "boolean";
        } else {
            console.log("Semantic Error: Operand must be boolean → "+right);
            return "Semantic Error: Operand must be boolean → "+right;
        }
    }
    else if(node.type == "identifier"){
        let id = node.value;
        try {
            let type = globalPower.IdMap.get(id).type;
            return type;
        } catch (e) {
            console.log("Error: Variable "+id+" not declared");
            throw "Error: Variable "+id+" not declared";
        }
    }
}

export {
    getType,
    getDefaultValue,
    getNewType 
}