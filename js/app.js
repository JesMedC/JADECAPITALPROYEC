import { db, collection, query, orderBy, limit, getDocs } from "./firebase-config.js";

const BALANCE_KEY = "balanceActual";

const balanceActualSpan = document.getElementById("balanceActual");
const valorInversionSpan = document.getElementById("valorInversion");

// Recalcula el balance global basado en la última operación
async function recalcularBalanceGlobal() {
    let balanceActual = 0;
    const q = query(collection(db, "operaciones"), orderBy("fechaRegistro", "desc"), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const lastOp = querySnapshot.docs[0].data();
        balanceActual = lastOp.balanceDespues;
    } else {
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