import { db, collection, addDoc, query, orderBy, limit, getDocs } from "./firebase-config.js";

// Almacenamiento local
const BALANCE_KEY = "balanceActual";

// Cargar el balance desde localStorage o inicializar en 0
let balanceActual = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;

// Elementos del DOM para el formulario de Operaciones (Alcista/Bajista)
const formOperacion = document.getElementById("formOperacion");
const tipoOperacionSelect = document.getElementById("tipoOperacion");
const retornoInput = document.getElementById("retorno");
const resultadoOperacionDiv = document.getElementById("resultadoOperacionDiv");
const comentarioInput = document.getElementById("comentario");

// Elementos del DOM para el formulario de Retiro
const formRetiro = document.getElementById("formRetiro");
const montoRetiroInput = document.getElementById("montoRetiro");

// Elementos del DOM para el formulario de Inversión
const formInversion = document.getElementById("formInversion");
const montoInversionInput = document.getElementById("montoInversion");

// Elementos del DOM para mostrar el balance
const balanceActualSpan = document.getElementById("balanceActual");
const valorInversionSpan = document.getElementById("valorInversion");


// Recalcula el balance global basado en la última operación
async function recalcularBalanceGlobal() {
    const q = query(collection(db, "operaciones"), orderBy("fechaRegistro", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const lastOp = querySnapshot.docs[0].data();
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

// Manejo de cambios en tipo de operación (Alcista/Bajista)
tipoOperacionSelect.addEventListener("change", () => {
  const tipo = tipoOperacionSelect.value;
  // For alcista/bajista, enable retorno input and show resultadoOperacionDiv
  retornoInput.disabled = false; 
  resultadoOperacionDiv.style.display = "block";
  actualizarBalanceUI();
});

// Al cargar página, recalcular balance
window.addEventListener("load", async () => {
  await recalcularBalanceGlobal();
});

// Manejar envío de formulario de operaciones (Alcista/Bajista)
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
        console.log("Attempting to add document to Firestore...");
        await addDoc(collection(db, "operaciones"), {
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
        console.log("Document added successfully!");
        balanceActual = balanceDespues;
        actualizarBalanceUI();
        alert("Operación registrada con éxito.");
        formOperacion.reset();
        retornoInput.disabled = true; // Disable after reset
        resultadoOperacionDiv.style.display = "none"; // Hide after reset
    } catch (e) {
        console.error("Error adding document to Firestore: ", e);
        alert("Error al registrar la operación.");
    }
});

// Manejar formulario de retiro
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
        console.log("Attempting to add withdrawal document to Firestore...");
        await addDoc(collection(db, "operaciones"), {
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
        console.log("Withdrawal document added successfully!");
        balanceActual = balanceDespues;
        actualizarBalanceUI();
        alert("Retiro realizado con éxito.");
        formRetiro.reset();
    } catch (e) {
        console.error("Error adding withdrawal document to Firestore: ", e);
        alert("Error al realizar el retiro.");
    }
});

// Manejar formulario de inversión
formInversion.addEventListener("submit", async e => {
    e.preventDefault();
    const monto = parseFloat(montoInversionInput.value);

    if(isNaN(monto) || monto <= 0){
        alert("Ingrese un monto de inversión válido.");
        return;
    }

    const fechaOperacion = new Date().toLocaleDateString("es-ES");
    const balanceAntes = balanceActual;
    const balanceDespues = balanceActual + monto;

    try {
        console.log("Attempting to add investment document to Firestore...");
        await addDoc(collection(db, "operaciones"), {
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
        console.log("Investment document added successfully!");
        balanceActual = balanceDespues;
        actualizarBalanceUI();
        alert("Inversión registrada con éxito.");
        formInversion.reset();
    } catch (e) {
        console.error("Error adding investment document to Firestore: ", e);
        alert("Error al registrar la inversión.");
    }
});