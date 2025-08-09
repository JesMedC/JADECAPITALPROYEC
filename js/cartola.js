import { db, collection, query, orderBy, getDocs, deleteDoc, doc } from "./firebase-config.js";

const BALANCE_KEY = "balanceActual";

const tablaOperacionesBody = document.querySelector("#tablaOperaciones tbody");
const btnExportarExcel = document.getElementById("btnExportarExcel");
const btnReiniciar = document.getElementById("btnReiniciar");

// Muestra el historial en la tabla
async function mostrarHistorial() {
  tablaOperacionesBody.innerHTML = "";
  try {
    console.log("Fetching operations from Firestore...");
    const q = query(collection(db, "operaciones"), orderBy("fechaRegistro", "desc"));
    const querySnapshot = await getDocs(q);
    console.log("Operations fetched.");

    if (querySnapshot.empty) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 9;
      td.textContent = "No hay operaciones registradas.";
      tr.appendChild(td);
      tablaOperacionesBody.appendChild(tr);
      console.log("No operations found.");
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
    console.log("Operations displayed in table.");
  } catch (e) {
    console.error("Error al cargar historial: ", e);
    alert("Error al cargar el historial de operaciones.");
  }
}

// Botón para reiniciar el balance y borrar las operaciones
btnReiniciar.addEventListener("click", async () => {
  const confirmacion = confirm("¿Estás seguro de que deseas reiniciar el balance y borrar todos los registros?");
  if (confirmacion) {
    try {
      console.log("Attempting to clear operations from Firestore...");
      const q = query(collection(db, "operaciones"));
      const querySnapshot = await getDocs(q);
      const deletePromises = [];
      querySnapshot.forEach((docItem) => {
        deletePromises.push(deleteDoc(doc(db, "operaciones", docItem.id)));
      });
      await Promise.all(deletePromises);
      localStorage.setItem(BALANCE_KEY, 0);
      alert("El balance y el historial de operaciones han sido reiniciados.");
      mostrarHistorial();
      console.log("Operations cleared successfully!");
    } catch (e) {
      console.error("Error al reiniciar: ", e);
      alert("Error al reiniciar el balance y el historial.");
    }
  }
});

// Función para exportar a Excel
async function exportarAExcel() {
  try {
    console.log("Fetching operations for Excel export...");
    const q = query(collection(db, "operaciones"), orderBy("fechaRegistro"));
    const querySnapshot = await getDocs(q);
    const operaciones = [];
    querySnapshot.forEach(doc => {
      operaciones.push(doc.data());
    });
    console.log("Operations fetched for Excel export.");

    if (operaciones.length === 0) {
      alert("No hay operaciones para exportar.");
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
    console.log("Excel exported successfully!");
  } catch (e) {
    console.error("Error al exportar a Excel: ", e);
    alert("Error al exportar operaciones a Excel.");
  }
}

btnExportarExcel.addEventListener("click", exportarAExcel);

// Al cargar la página, mostrar el historial
window.addEventListener("load", mostrarHistorial);