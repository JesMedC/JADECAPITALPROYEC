// Almacenamiento local
const OPERACIONES_KEY = "operaciones";
const BALANCE_KEY = "balanceActual";

// Función para obtener el balance actual de localStorage
function getBalance() {
    return parseFloat(localStorage.getItem(BALANCE_KEY)) || 0;
}

const formAnalisis = document.getElementById("formAnalisis");
const fechaInicioInput = document.getElementById("fechaInicio");
const fechaFinInput = document.getElementById("fechaFin");
const resultadoAnalisisDiv = document.getElementById("resultadoAnalisis");
let analisisChart = null; // Variable para mantener la instancia del gráfico

// Manejar análisis de ganancias/pérdidas
formAnalisis.addEventListener("submit", async e => {
    e.preventDefault();
    const fechaInicioStr = fechaInicioInput.value;
    const fechaFinStr = fechaFinInput.value;

    if(!fechaInicioStr || !fechaFinStr){
        alert("Seleccione un rango de fechas válido.");
        return;
    }

    const fechaInicio = new Date(fechaInicioStr + 'T00:00:00');
    const fechaFin = new Date(fechaFinStr + 'T23:59:59');

    console.log("Analysis Date Range:");
    console.log("  fechaInicio (input):", fechaInicioStr);
    console.log("  fechaFin (input):", fechaFinStr);
    console.log("  fechaInicio (parsed):", fechaInicio);
    console.log("  fechaFin (parsed):", fechaFin);

    if(fechaInicio > fechaFin){
        alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
        return;
    }

    console.log("Fetching operations for analysis from localStorage...");
    let operaciones = JSON.parse(localStorage.getItem(OPERACIONES_KEY)) || [];
    console.log("Operations fetched for analysis:", operaciones);

    let operacionesRango = operaciones.filter(op => {
        const opFecha = new Date(op.fechaRegistro);
        console.log("  Comparing opFecha:", opFecha, "between", fechaInicio, "and", fechaFin);
        return opFecha >= fechaInicio && opFecha <= fechaFin;
    });
    console.log("Filtered operations for range:", operacionesRango);

    if(operacionesRango.length === 0){
        resultadoAnalisisDiv.innerHTML = "<p>No hay operaciones en el rango de fechas seleccionado.</p>";
        if (analisisChart) {
            analisisChart.destroy();
            analisisChart = null;
        }
        console.log("No operations found in range for analysis.");
        return;
    }

    // Sort operations by date (oldest first) for balance calculation
    operacionesRango.sort((a, b) => new Date(a.fechaRegistro) - new Date(b.fechaRegistro));

    let totalGanadas = 0;
    let totalPerdidas = 0;
    let montoTotalGanado = 0;
    let montoTotalPerdido = 0;
    let totalInversiones = 0;
    let totalRetiros = 0;

    operacionesRango.forEach(op => {
        if (op.estado === 'ganada') {
            totalGanadas++;
            montoTotalGanado += op.inversion * (op.retorno / 100);
        } else if (op.estado === 'perdida') {
            totalPerdidas++;
            montoTotalPerdido += op.inversion;
        } else if (op.tipoOperacion === 'inversion') {
            totalInversiones += op.inversion;
        } else if (op.tipoOperacion === 'retiro') {
            totalRetiros += op.inversion;
        }
    });

    const totalOperaciones = totalGanadas + totalPerdidas;
    const winRate = totalOperaciones > 0 ? (totalGanadas / totalOperaciones) * 100 : 0;

    const balanceInicialRango = operacionesRango[0].balanceAntes;
    const balanceFinalRango = operacionesRango[operacionesRango.length - 1].balanceDespues;
    const gananciaPerdidaNeta = balanceFinalRango - balanceInicialRango;
    const porcentajeNeto = balanceInicialRango !== 0 ? (gananciaPerdidaNeta / balanceInicialRango) * 100 : 0;

    resultadoAnalisisDiv.innerHTML = `
        <h4>Análisis del Periodo</h4>
        <p><strong>Balance Inicial:</strong> ${balanceInicialRango.toFixed(2)} USD</p>
        <p><strong>Balance Final:</strong> ${balanceFinalRango.toFixed(2)} USD</p>
        <p><strong>Ganancia/Pérdida Neta:</strong> <span style="color: ${gananciaPerdidaNeta >= 0 ? 'green' : 'red'};">${gananciaPerdidaNeta.toFixed(2)} USD (${porcentajeNeto.toFixed(2)}%)</span></p>
        <hr>
        <p><strong>Total Invertido:</strong> ${totalInversiones.toFixed(2)} USD</p>
        <p><strong>Total Retirado:</strong> ${totalRetiros.toFixed(2)} USD</p>
        <hr>
        <p><strong>Operaciones (Trading):</strong> ${totalOperaciones}</p>
        <p><strong>Ganadas:</strong> ${totalGanadas}</p>
        <p><strong>Perdidas:</strong> ${totalPerdidas}</p>
        <p><strong>Win Rate:</strong> ${winRate.toFixed(2)}%</p>
        <p><strong>Monto Total Ganado (Trading):</strong> ${montoTotalGanado.toFixed(2)} USD</p>
        <p><strong>Monto Total Perdido (Trading):</strong> ${montoTotalPerdido.toFixed(2)} USD</p>
    `;

    // Lógica del gráfico
    const ctx = document.getElementById('analisisChart').getContext('2d');
    if (analisisChart) {
        analisisChart.destroy();
    }

    if (totalOperaciones > 0) {
        analisisChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Ganadas', 'Perdidas'],
                datasets: [{
                    label: 'Resultado de Operaciones',
                    data: [totalGanadas, totalPerdidas],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(255, 99, 132, 0.7)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Operaciones'
                    }
                }
            }
        });
    } else {
        // Si no hay operaciones de trading, limpia el canvas
        const ctx = document.getElementById('analisisChart').getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
});