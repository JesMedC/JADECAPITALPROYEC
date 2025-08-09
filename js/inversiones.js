// Almacenamiento local
const BALANCE_KEY = "balanceActual";
const OPERACIONES_KEY = "operaciones";

// Cargar el balance desde localStorage o inicializar en 0
let balanceActual = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;

// Cargar operaciones desde localStorage o inicializar como array vacío
let operaciones = JSON.parse(localStorage.getItem(OPERACIONES_KEY)) || [];

// Elementos del DOM para el formulario de Operaciones (Alcista/Bajista)
let formOperacion;
let tipoOperacionSelect;
let retornoInput;
let resultadoOperacionDiv;
let comentarioInput;

// Elementos del DOM para el formulario de Retiro
let formRetiro;
let montoRetiroInput;

// Elementos del DOM para el formulario de Inversión
let formInversion;
let montoInversionInput;

// Elementos del DOM para mostrar el balance
let balanceActualSpan;
let valorInversionSpan;


// Recalcula el balance global basado en la última operación
async function recalcularBalanceGlobal() {
    // Si hay operaciones, el último balance es el de la última operación
    if (operaciones.length > 0) {
        balanceActual = operaciones[operaciones.length - 1].balanceDespues;
    } else {
        // Si no hay operaciones, usa el valor de localStorage o 0
        balanceActual = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;
    }
    actualizarBalanceUI();
}

// Actualiza el balance y muestra en pantalla
function actualizarBalanceUI() {
  if (balanceActualSpan) balanceActualSpan.textContent = balanceActual.toFixed(2) + " USD";
  let inversion = 0;
  if (balanceActual >= 1) {
      inversion = Math.max(1, Math.floor(balanceActual * 0.01));
  }
  if (valorInversionSpan) valorInversionSpan.textContent = inversion.toFixed(2) + " USD";
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
    if (!tipoOperacionSelect) {
        console.error("CRITICAL ERROR: tipoOperacionSelect element not found in the DOM!");
    }
    console.log("retornoInput:", retornoInput);
    console.log("resultadoOperacionDiv:", resultadoOperacionDiv);
    console.log("comentarioInput:", comentarioInput);
    console.log("formRetiro:", formRetiro);
    console.log("montoRetiroInput:", montoRetiroInput);
    console.log("formInversion:", formInversion);
    console.log("montoInversionInput:", montoInversionInput);
    if (!montoInversionInput) {
        console.error("CRITICAL ERROR: montoInversionInput element not found in the DOM!");
    }
    console.log("balanceActualSpan:", balanceActualSpan);
    console.log("valorInversionSpan:", valorInversionSpan);


    // Manejo de cambios en tipo de operación (Alcista/Bajista)
    if (tipoOperacionSelect) { // Explicitly check if element exists
        tipoOperacionSelect.addEventListener("change", () => {
            const tipo = tipoOperacionSelect.value;
            // For alcista/bajista, enable retorno input and show resultadoOperacionDiv
            if (retornoInput) retornoInput.disabled = false; 
            if (resultadoOperacionDiv) resultadoOperacionDiv.style.display = "block";
            actualizarBalanceUI();
        });
    } else {
        console.warn("Warning: tipoOperacionSelect element not found, event listener not attached.");
    }

    // Al cargar página, recalcular balance
    await recalcularBalanceGlobal();

    // Manejar envío de formulario de operaciones (Alcista/Bajista)
    if (formOperacion) { // Explicitly check if element exists
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

            // Add to local operations array
            operaciones.push({
                fechaOperacion,
                fechaRegistro: new Date().toISOString(), // Store as ISO string for consistency
                tipoOperacion,
                retorno: (tipoOperacion === 'alcista' || tipoOperacion === 'bajista') ? retorno : null,
                inversion,
                balanceAntes,
                balanceDespues,
                estado,
                comentario
            });
            localStorage.setItem(OPERACIONES_KEY, JSON.stringify(operaciones)); // Save to localStorage

            balanceActual = balanceDespues;
            actualizarBalanceUI();
            alert("Operación registrada con éxito.");
            formOperacion.reset();
            if (retornoInput) retornoInput.disabled = true; // Disable after reset
            if (resultadoOperacionDiv) resultadoOperacionDiv.style.display = "none"; // Hide after reset
        });
    } else {
        console.warn("Warning: formOperacion element not found, event listener not attached.");
    }

    // Manejar formulario de retiro
    if (formRetiro) { // Explicitly check if element exists
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

            // Add to local operations array
            operaciones.push({
                fechaOperacion,
                fechaRegistro: new Date().toISOString(), // Store as ISO string for consistency
                tipoOperacion: 'retiro',
                retorno: null,
                inversion: monto,
                balanceAntes,
                balanceDespues,
                estado: 'completada',
                comentario: 'Retiro de fondos'
            });
            localStorage.setItem(OPERACIONES_KEY, JSON.stringify(operaciones)); // Save to localStorage

            balanceActual = balanceDespues;
            actualizarBalanceUI();
            alert("Retiro realizado con éxito.");
            formRetiro.reset();
        });
    } else {
        console.warn("Warning: formRetiro element not found, event listener not attached.");
    }

    // Manejar formulario de inversión
    if (formInversion) { // Explicitly check if element exists
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

            // Add to local operations array
            operaciones.push({
                fechaOperacion,
                fechaRegistro: new Date().toISOString(), // Store as ISO string for consistency
                tipoOperacion: 'inversion',
                retorno: null,
                inversion: monto,
                balanceAntes,
                balanceDespues,
                estado: 'completada',
                comentario: 'Inversión de fondos'
            });
            localStorage.setItem(OPERACIONES_KEY, JSON.stringify(operaciones)); // Save to localStorage

            balanceActual = balanceDespues;
            actualizarBalanceUI();
            alert("Inversión registrada con éxito.");
            formInversion.reset();
        });
    } else {
        console.warn("Warning: formInversion element not found, event listener not attached.");
    }
});