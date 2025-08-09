// Almacenamiento local
const BALANCE_KEY = "balanceActual";
const OPERACIONES_KEY = "operaciones";

// Cargar el balance desde localStorage o inicializar en 0
let balanceActual = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;

// Cargar operaciones desde localStorage o inicializar como array vacío
let operaciones = JSON.parse(localStorage.getItem(OPERACIONES_KEY)) || [];

const balanceActualSpan = document.getElementById("balanceActual");
const valorInversionSpan = document.getElementById("valorInversion");

// Recalcula el balance global basado en la última operación
async function recalcularBalanceGlobal() {
    // Si hay operaciones, el último balance es el de la última operación
    if (operaciones.length > 0) {
        balanceActual = operaciones[operaciones.length - 1].balanceDespues;
    } else {
        // Si no hay operaciones, usa el valor de localStorage o 0
        balanceActual = parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;
    }
    actualizarBalanceUI(balanceActual);
}

// Actualiza el balance y muestra en pantalla
function actualizarBalanceUI(balance) {
  balanceActualSpan.textContent = balance.toFixed(2) + " USD";
  let inversion = 0;
  if (balance >= 1) {
      inversion = Math.max(1, Math.floor(balance * 0.01));
  }
  valorInversionSpan.textContent = inversion.toFixed(2) + " USD";
  localStorage.setItem(BALANCE_KEY, balance);
}

// Al cargar página, recalcular balance
window.addEventListener("load", recalcularBalanceGlobal);