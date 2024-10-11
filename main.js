import { Compiler } from "./compiler/compiler.js";
import { parse } from "./parser/parser.js";
// import {executeSentences} from "./synthesis/synthesis.js";
// import {Synthesis} from "./synthesis/synthesis.js";

const input = document.getElementById("code");
const salida = document.getElementById("console");
//const ast = document.getElementById("ast");

const executeBtn = document.getElementById("execute");
const reportsBtn = document.getElementById("reports");

document.getElementById("console").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const texto = input.value;
    const resultado = parse(texto);
    console.log(resultado);
    resultado.execute();
    salida.innerHTML = "Resultado: " + resultado;
  }
});

execute.addEventListener("click", () => {

  const translator = new Compiler();
  translator.resetIdMap();
  translator.resetOutput();
  
  const code = input.value;
  const tree =  parse(code);
  console.log(tree);
  translator.addAst(tree);

  translator.execute();
  //salida.innerHTML = JSON.stringify(tree, null, 2);
  salida.innerHTML = translator.getOutput();
});

// Lógica para el botón "Reportes"
reportsBtn.addEventListener("click", () => {
  const translator = new Synthesis();
  translator.resetIdMap();
  translator.resetOutput();

  const code = input.value;
  const tree = parse(code);
  console.log(tree);
  translator.addAst(tree);

  // Obtener la tabla de símbolos
  translator.execute();  // Ejecuta el código para generar la tabla de símbolos
  const symbolTable = translator.getSymbolTable();

  // Formatear la tabla de símbolos para mostrarla en consola
  let reportOutput = "<h3>Tabla de Símbolos</h3>";
  reportOutput += `<table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Tipo de Símbolo</th>
                          <th>Tipo de Variable</th>
                          <th>Línea</th>
                          <th>Columna</th>
                        </tr>
                      </thead>
                      <tbody>`;

  symbolTable.forEach(symbol => {
    reportOutput += `<tr>
                        <td>${symbol.id}</td>
                        <td>${symbol.type_symbol}</td>
                        <td>${symbol.type_var}</td>
                        <td>${symbol.line}</td>
                        <td>${symbol.column}</td>
                     </tr>`;
  });

  reportOutput += "</tbody></table>";

  salida.innerHTML = reportOutput;
})