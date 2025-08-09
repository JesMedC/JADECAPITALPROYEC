// Almacenamiento local
const BALANCE_KEY = "balanceActual";
const OPERACIONES_KEY = "operaciones";

// Función para obtener el balance actual de localStorage
function getBalance() {
    return parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;
}

// Cargar operaciones desde localStorage o inicializar como array vacío
let operaciones = JSON.parse(localStorage.getItem(OPERACIONES_KEY)) || [];

const balanceActualSpan = document.getElementById("balanceActual");
const valorInversionSpan = document.getElementById("valorInversion");

// Recalcula el balance global basado en la última operación
async function recalcularBalanceGlobal() {
    let currentBalance = getBalance(); // Obtener el balance actual

    // Si hay operaciones, el último balance es el de la última operación
    if (operaciones.length > 0) {
        currentBalance = operaciones[operaciones.length - 1].balanceDespues;
    } else {
        // Si no hay operaciones, usa el valor de localStorage o 0
        currentBalance = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;
    }
    actualizarBalanceUI(currentBalance);
}

// Actualiza el balance y muestra en pantalla
function actualizarBalanceUI(balance) {
  if (balanceActualSpan) balanceActualSpan.textContent = balance.toFixed(2) + " USD";
  let inversion = 0;
  if (balance >= 1) {
      inversion = Math.max(1, Math.floor(balance * 0.01));
  }
  if (valorInversionSpan) valorInversionSpan.textContent = inversion.toFixed(2) + " USD";
  localStorage.setItem(BALANCE_KEY, balance);
}

// Al cargar página, recalcular balance
window.addEventListener("load", recalcularBalanceGlobal);