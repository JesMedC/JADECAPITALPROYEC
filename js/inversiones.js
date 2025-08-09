import { db, collection, addDoc, query, orderBy, limit, getDocs } from "./firebase-config.js";
import Toastify from "https://cdn.jsdelivr.net/npm/toastify-js";

// Almacenamiento local
const BALANCE_KEY = "balanceActual";

// Cargar el balance desde localStorage o inicializar en 0
let balanceActual = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;

const form = document.getElementById("formOperacion");
const tipoOperacionSelect = document.getElementById("tipoOperacion");
const retornoInput = document.getElementById("retorno");
const balanceActualSpan = document.getElementById("balanceActual");
const valorInversionSpan = document.getElementById("valorInversion");
const valorInversionManualInput = document.getElementById("valorInversionManual");
const valorInversionManualLabel = document.getElementById("valorInversionManualLabel");
const resultadoOperacionDiv = document.getElementById("resultadoOperacionDiv");
const comentarioInput = document.getElementById("comentario");
const formRetiro = document.getElementById("formRetiro");
const montoRetiroInput = document.getElementById("montoRetiro");

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

// Manejo de cambios en tipo de operación
tipoOperacionSelect.addEventListener("change", () => {
  const tipo = tipoOperacionSelect.value;
  if (tipo === "inversion") {
    retornoInput.value = "75"; // Reset to default
    retornoInput.disabled = true;
    valorInversionManualLabel.style.display = "block"; // Show for inversion
    valorInversionManualInput.style.display = "block"; // Show for inversion
    resultadoOperacionDiv.style.display = "none";
  } else {
    retornoInput.disabled = false; // Habilitar para alcista/bajista
    valorInversionManualLabel.style.display = "none"; // Hide for alcista/bajista
    valorInversionManualInput.style.display = "none"; // Hide for alcista/bajista
    if (tipo === "alcista" || tipo === "bajista") {
        resultadoOperacionDiv.style.display = "block";
    } else {
        resultadoOperacionDiv.style.display = "none";
    }
  }
  actualizarBalanceUI();
});

// Al cargar página, recalcular balance
window.addEventListener("load", async () => {
  await recalcularBalanceGlobal();
});

// Manejar envío de formulario de operaciones
form.addEventListener("submit", async e => {
    e.preventDefault();

    const comentario = comentarioInput.value.trim();
    if (comentario.split(/\s+/).length > 10) {
        Toastify({
            text: "El comentario no puede tener más de 10 palabras.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
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
            Toastify({
                text: `No tienes suficiente balance para la inversión mínima de ${inversion.toFixed(2)} USD.`,
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
            }).showToast();
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

    } else if (tipoOperacion === "inversion") {
        inversion = parseFloat(valorInversionManualInput.value);
        if (isNaN(inversion) || inversion <= 0) {
            Toastify({
                text: "Por favor, ingresa un valor de inversión válido.",
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
            }).showToast();
            return;
        }
        balanceDespues += inversion;
    }

    const fechaOperacion = new Date().toLocaleDateString("es-ES");

    try {
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
        balanceActual = balanceDespues;
        actualizarBalanceUI();
        Toastify({
            text: "Operación registrada con éxito.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
        }).showToast();
        form.reset();
        retornoInput.disabled = true;
        valorInversionManualLabel.style.display = "none";
        valorInversionManualInput.style.display = "none";
        resultadoOperacionDiv.style.display = "none";
    } catch (e) {
        console.error("Error adding document: ", e);
        Toastify({
            text: "Error al registrar la operación.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
    }
});

// Manejar formulario de retiro
formRetiro.addEventListener("submit", async e => {
    e.preventDefault();
    const monto = parseFloat(montoRetiroInput.value);

    if(isNaN(monto) || monto <= 0){
        Toastify({
            text: "Ingrese un monto de retiro válido.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
        return;
    }

    if(monto > balanceActual){
        Toastify({
            text: "No puede retirar más de su balance actual.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
        return;
    }

    const fechaOperacion = new Date().toLocaleDateString("es-ES");
    const balanceAntes = balanceActual;
    const balanceDespues = balanceActual - monto;

    try {
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
        balanceActual = balanceDespues;
        actualizarBalanceUI();
        Toastify({
            text: "Retiro realizado con éxito.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
        }).showToast();
        formRetiro.reset();
    } catch (e) {
        console.error("Error adding document: ", e);
        Toastify({
            text: "Error al realizar el retiro.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
    }
});