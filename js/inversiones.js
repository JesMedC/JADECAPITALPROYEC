// Almacenamiento local
const BALANCE_KEY = "balanceActual";

// Cargar el balance desde localStorage o inicializar en 0
let balanceActual = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;

// Inicializar IndexedDB con Dexie
const db = new Dexie("JadeCapitalDB");
db.version(2).stores({
  operaciones: '++id, fechaOperacion, fechaRegistro, tipoOperacion, retorno, inversion, balanceAntes, balanceDespues, estado, comentario'
}).upgrade(tx => {
    // Permite que la base de datos se actualice sin perder datos si ya existía una versión 1
    return tx.table("operaciones").toCollection().modify(op => {
        op.comentario = op.comentario || ""; // Añade el campo comentario a registros antiguos
    });
});

// Elementos del DOM (declarados aquí para asegurar que estén en el ámbito correcto)
// Estas variables se asignarán dentro del DOMContentLoaded listener
let formOperacion;
let tipoOperacionSelect;
let retornoInput;
let resultadoOperacionDiv;
let comentarioInput;
let formRetiro;
let montoRetiroInput;
let formInversion;
let montoInversionInput;
let balanceActualSpan;
let valorInversionSpan;

// Recalcula el balance global basado en la última operación
async function recalcularBalanceGlobal() {
    const lastOp = await db.operaciones.orderBy('id').last();
    if (lastOp) {
        balanceActual = lastOp.balanceDespues;
    } else {
        balanceActual = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;
    }
    actualizarBalanceUI();
}

// Actualiza el balance y muestra en pantalla
function actualizarBalanceUI() {
  balanceActualSpan.textContent = balanceActual.toFixed(2) + " USD";
  let inversion = 0;
  if (balanceActual >= 1) {
      inversion = Math.max(1, Math.floor(balanceActual * 0.01));
  }
  valorInversionSpan.textContent = inversion.toFixed(2) + " USD";
  localStorage.setItem(BALANCE_KEY, balanceActual);
}

// Event listener para asegurar que el DOM esté completamente cargado
window.addEventListener('DOMContentLoaded', async () => {
    // Asignación de elementos del DOM
    formOperacion = document.getElementById("formOperacion");
    tipoOperacionSelect = document.getElementById("tipoOperacion");
    retornoInput = document.getElementById("retorno");
    resultadoOperacionDiv = document.getElementById("resultadoOperacionDiv");
    comentarioInput = document.getElementById("comentario");
    formRetiro = document.getElementById("formRetiro");
    montoRetiroInput = document.getElementById("montoRetiro");
    formInversion = document.getElementById("formInversion");
    montoInversionInput = document.getElementById("montoInversion");
    balanceActualSpan = document.getElementById("balanceActual");
    valorInversionSpan = document.getElementById("valorInversion");

    // Debugging logs
    console.log("DOM elements fetched:");
    console.log("formOperacion:", formOperacion);
    console.log("tipoOperacionSelect:", tipoOperacionSelect);
    console.log("retornoInput:", retornoInput);
    console.log("resultadoOperacionDiv:", resultadoOperacionDiv);
    console.log("comentarioInput:", comentarioInput);
    console.log("formRetiro:", formRetiro);
    console.log("montoRetiroInput:", montoRetiroInput);
    console.log("formInversion:", formInversion);
    console.log("montoInversionInput:", montoInversionInput);
    console.log("balanceActualSpan:", balanceActualSpan);
    console.log("valorInversionSpan:", valorInversionSpan);


    // Manejo de cambios en tipo de operación (Alcista/Bajista)
    if (tipoOperacionSelect) { // Check if element exists
        tipoOperacionSelect.addEventListener("change", () => {
            const tipo = tipoOperacionSelect.value;
            // For alcista/bajista, enable retorno input and show resultadoOperacionDiv
            retornoInput.disabled = false; 
            resultadoOperacionDiv.style.display = "block";
            actualizarBalanceUI();
        });
    }

    // Al cargar página, recalcular balance
    await recalcularBalanceGlobal();

    // Manejar envío de formulario de operaciones (Alcista/Bajista)
    if (formOperacion) { // Check if element exists
        formOperacion.addEventListener("submit", async e => {
            e.preventDefault();

            const comentario = comentarioInput.value.trim();
            if (comentario.split(/\s+/).length > 10) {
                alert("El comentario no puede tener más de 10 palabras.");
                return;
            }

            const tipoOperacion = tipoOperacionSelect.value;
            const retorno = parseFloat(retornoInput.value);
            let inversion = 0;
            let estado = "completada";

            const balanceAntes = balanceActual;
            let balanceDespues = balanceAntes;

            if (tipoOperacion === "alcista" || tipoOperacion === "bajista") {
                inversion = Math.max(1, Math.floor(balanceActual * 0.01));

                if (balanceActual < inversion) {
                    alert(`No tienes suficiente balance para la inversión mínima de ${inversion.toFixed(2)} USD.`);
                    return;
                }
                const resultado = document.querySelector('input[name="resultado"]:checked').value;
                
                if (resultado === 'ganada') {
                    balanceDespues += inversion * (retorno / 100);
                    estado = 'ganada';
                } else {
                    balanceDespues -= inversion;
                    estado = 'perdida';
                }

            }

            const fechaOperacion = new Date().toLocaleDateString("es-ES");

            try {
                await db.operaciones.add({
                    fechaOperacion,
                    fechaRegistro: new Date(),
                    tipoOperacion,
                    retorno: (tipoOperacion === 'alcista' || tipoOperacion === 'bajista') ? retorno : null,
                    inversion,
                    balanceAntes,
                    balanceDespues,
                    estado,
                    comentario
                });
                balanceActual = balanceDespues;
                actualizarBalanceUI();
                alert("Operación registrada con éxito.");
                formOperacion.reset();
                retornoInput.disabled = true; // Disable after reset
                resultadoOperacionDiv.style.display = "none"; // Hide after reset
            } catch (e) {
                console.error("Error adding document: ", e);
                alert("Error al registrar la operación.");
            }
        });
    }

    // Manejar formulario de retiro
    if (formRetiro) { // Check if element exists
        formRetiro.addEventListener("submit", async e => {
            e.preventDefault();
            const monto = parseFloat(montoRetiroInput.value);

            if(isNaN(monto) || monto <= 0){
                alert("Ingrese un monto de retiro válido.");
                return;
            }

            if(monto > balanceActual){
                alert("No puede retirar más de su balance actual.");
                return;
            }

            const fechaOperacion = new Date().toLocaleDateString("es-ES");
            const balanceAntes = balanceActual;
            const balanceDespues = balanceActual - monto;

            try {
                await db.operaciones.add({
                    fechaOperacion,
                    fechaRegistro: new Date(),
                    tipoOperacion: 'retiro',
                    retorno: null,
                    inversion: monto,
                    balanceAntes,
                    balanceDespues,
                    estado: 'completada',
                    comentario: 'Retiro de fondos'
                });
                balanceActual = balanceDespues;
                actualizarBalanceUI();
                alert("Retiro realizado con éxito.");
                formRetiro.reset();
            } catch (e) {
                console.error("Error adding document: ", e);
                alert("Error al realizar el retiro.");
            }
        });
    }

    // Manejar formulario de inversión
    if (formInversion) { // Check if element exists
        formInversion.addEventListener("submit", async e => {
            e.preventDefault();
            console.log("formInversion submit event fired!"); // Debugging log
            let monto;
            try {
                console.log("montoInversionInput before value access:", montoInversionInput); // Debugging log
                monto = parseFloat(montoInversionInput.value);
                console.log("Value of montoInversionInput:", montoInversionInput.value); // Debugging log
                console.log("Type of montoInversionInput.value:", typeof montoInversionInput.value); // Debugging log
                console.log("Parsed monto:", monto); // Debugging log
            } catch (error) {
                console.error("Error accessing montoInversionInput.value: ", error);
                alert("Error: No se pudo obtener el monto de inversión. Por favor, recargue la página.");
                return;
            }

            if(isNaN(monto) || monto <= 0){
                alert("Ingrese un monto de inversión válido.");
                return;
            }

            const fechaOperacion = new Date().toLocaleDateString("es-ES");
            const balanceAntes = balanceActual;
            const balanceDespues = balanceActual + monto;

            try {
                await db.operaciones.add({
                    fechaOperacion,
                    fechaRegistro: new Date(),
                    tipoOperacion: 'inversion',
                    retorno: null,
                    inversion: monto,
                    balanceAntes,
                    balanceDespues,
                    estado: 'completada',
                    comentario: 'Inversión de fondos'
                });
                balanceActual = balanceDespues;
                actualizarBalanceUI();
                alert("Inversión registrada con éxito.");
                formInversion.reset();
            } catch (e) {
                console.error("Error adding investment document: ", e);
                alert("Error al registrar la inversión.");
            }
        });
    }
});