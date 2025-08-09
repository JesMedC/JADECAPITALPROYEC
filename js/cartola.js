// Almacenamiento local
const BALANCE_KEY = "balanceActual";
const OPERACIONES_KEY = "operaciones";

const tablaOperacionesBody = document.querySelector("#tablaOperaciones tbody");
const btnExportarExcel = document.getElementById("btnExportarExcel");
const btnReiniciar = document.getElementById("btnReiniciar");

// Muestra el historial en la tabla
async function mostrarHistorial() {
  tablaOperacionesBody.innerHTML = "";
  try {
    let operaciones = JSON.parse(localStorage.getItem(OPERACIONES_KEY)) || [];

    if (operaciones.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 9;
      td.textContent = "No hay operaciones registradas.";
      tr.appendChild(td);
      tablaOperacionesBody.appendChild(tr);
      return;
    }

    // Sort operations by date (newest first) for display
    operaciones.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));

    operaciones.forEach(op => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${op.fechaOperacion}</td>
        <td>${new Date(op.fechaRegistro).toLocaleString()}</td>
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
    alert("Error al cargar el historial de operaciones.");
  }
}

// Botón para reiniciar el balance y borrar las operaciones
btnReiniciar.addEventListener("click", async () => {
  const confirmacion = confirm("¿Estás seguro de que deseas reiniciar el balance y borrar todos los registros?");
  if (confirmacion) {
    try {
      localStorage.removeItem(OPERACIONES_KEY); // Clear operations from localStorage
      localStorage.setItem(BALANCE_KEY, 0); // Reset balance in localStorage
      alert("El balance y el historial de operaciones han sido reiniciados.");
      mostrarHistorial();
    } catch (e) {
      console.error("Error al reiniciar: ", e);
      alert("Error al reiniciar el balance y el historial.");
    }
  }
});

// Función para exportar a Excel
async function exportarAExcel() {
  try {
    let operaciones = JSON.parse(localStorage.getItem(OPERACIONES_KEY)) || [];

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
        new Date(op.fechaRegistro).toLocaleString(),
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
    alert("Error al exportar operaciones a Excel.");
  }
}

btnExportarExcel.addEventListener("click", exportarAExcel);

// Al cargar la página, mostrar el historial
window.addEventListener("load", mostrarHistorial);