import { db, collection, query, orderBy, getDocs, deleteDoc, doc } from "./firebase-config.js";
import Toastify from "https://cdn.jsdelivr.net/npm/toastify-js";

const BALANCE_KEY = "balanceActual";

const tablaOperacionesBody = document.querySelector("#tablaOperaciones tbody");
const btnExportarExcel = document.getElementById("btnExportarExcel");
const btnReiniciar = document.getElementById("btnReiniciar");

// Muestra el historial en la tabla
async function mostrarHistorial() {
  tablaOperacionesBody.innerHTML = "";
  try {
    const q = query(collection(db, "operaciones"), orderBy("fechaRegistro", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 9;
      td.textContent = "No hay operaciones registradas.";
      tr.appendChild(td);
      tablaOperacionesBody.appendChild(tr);
      return;
    }

    querySnapshot.forEach(doc => {
      const op = doc.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${op.fechaOperacion}</td>
        <td>${new Date(op.fechaRegistro.seconds * 1000).toLocaleString()}</td>
        <td>${op.tipoOperacion}</td>
        <td>${op.retorno ? op.retorno + '%' : '-'}</td>
        <td>${op.inversion.toFixed(2)}</td>
        <td>${op.balanceAntes.toFixed(2)}</td>
        <td>${op.balanceDespues.toFixed(2)}</td>
        <td>${op.estado}</td>
        <td>${op.comentario || '-'}</td>
      `;
      tablaOperacionesBody.appendChild(tr);
    });
  } catch (e) {
    console.error("Error al cargar historial: ", e);
    Toastify({
        text: "Error al cargar el historial de operaciones.",
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
    }).showToast();
  }
}

// Botón para reiniciar el balance y borrar las operaciones
btnReiniciar.addEventListener("click", async () => {
  const confirmacion = confirm("¿Estás seguro de que deseas reiniciar el balance y borrar todos los registros?");
  if (confirmacion) {
    try {
      const q = query(collection(db, "operaciones"));
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      querySnapshot.forEach((docItem) => {
        deletePromises.push(deleteDoc(doc(db, "operaciones", docItem.id)));
      });
      await Promise.all(deletePromises);
      localStorage.setItem(BALANCE_KEY, 0);
      Toastify({
          text: "El balance y el historial de operaciones han sido reiniciados.",
          duration: 3000,
          close: true,
          gravity: "top",
          position: "right",
          backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
      }).showToast();
      mostrarHistorial();
    } catch (e) {
      console.error("Error al reiniciar: ", e);
      Toastify({
          text: "Error al reiniciar el balance y el historial.",
          duration: 3000,
          close: true,
          gravity: "top",
          position: "right",
          backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      }).showToast();
    }
  }
});

// Función para exportar a Excel
async function exportarAExcel() {
  try {
    const q = query(collection(db, "operaciones"), orderBy("fechaRegistro"));
    const querySnapshot = await getDocs(q);
    const operaciones = [];
    querySnapshot.forEach(doc => {
      operaciones.push(doc.data());
    });

    if (operaciones.length === 0) {
      Toastify({
        text: "No hay operaciones para exportar.",
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
      }).showToast();
      return;
    }

    const datos = [
      [
        "Fecha Operación",
        "Fecha Registro",
        "Tipo de Operación",
        "% Retorno",
        "Inversión (USD)",
        "Balance Antes (USD)",
        "Balance Después (USD)",
        "Estado",
        "Comentario"
      ]
    ];

    operaciones.forEach(op => {
      datos.push([
        op.fechaOperacion,
        new Date(op.fechaRegistro.seconds * 1000).toLocaleString(),
        op.tipoOperacion,
        op.retorno ? op.retorno : '-',
        op.inversion.toFixed(2),
        op.balanceAntes.toFixed(2),
        op.balanceDespues.toFixed(2),
        op.estado,
        op.comentario || ''
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    const wscols = [
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 30 }
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Operaciones");
    XLSX.writeFile(wb, `JadeCapital_Operaciones_${new Date().toISOString().slice(0,10)}.xlsx`);
  } catch (e) {
    console.error("Error al exportar a Excel: ", e);
    Toastify({
        text: "Error al exportar operaciones a Excel.",
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
    }).showToast();
  }
}

btnExportarExcel.addEventListener("click", exportarAExcel);

// Al cargar la página, mostrar el historial
window.addEventListener("load", mostrarHistorial);