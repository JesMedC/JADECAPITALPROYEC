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
const monthlyComparisonDiv = document.getElementById("monthlyComparison");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const exportDailyReportBtn = document.getElementById("exportDailyReportBtn"); // New button
let analisisChart = null; // Variable para mantener la instancia del gráfico

// Función para generar el PDF
async function generatePdf(analysisData, title = "Reporte de Operaciones") {
    const { totalGanadas, totalPerdidas, montoTotalGanado, montoTotalPerdido, totalInversiones, totalRetiros, totalOperaciones, winRate, balanceInicialRango, balanceFinalRango, gananciaPerdidaNeta, porcentajeNeto, monthlyData, avgProfitPerWin, avgLossPerLoss } = analysisData;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(title, 10, 10);

    doc.setFontSize(12);
    let y = 20;

    const addText = (label, value) => {
        doc.text(`${label}: ${value}`, 10, y);
        y += 7;
    };

    addText("Periodo", `${fechaInicioInput.value} al ${fechaFinInput.value}`);
    addText("Balance Inicial", `${balanceInicialRango.toFixed(2)} USD`);
    addText("Balance Final", `${balanceFinalRango.toFixed(2)} USD`);
    addText("Ganancia/Pérdida Neta", `${gananciaPerdidaNeta.toFixed(2)} USD (${porcentajeNeto.toFixed(2)}%)`);
    y += 5;

    addText("Total Invertido", `${totalInversiones.toFixed(2)} USD`);
    addText("Total Retirado", `${totalRetiros.toFixed(2)} USD`);
    y += 5;

    addText("Operaciones (Trading)", `${totalOperaciones}`);
    addText("Ganadas", `${totalGanadas}`);
    addText("Perdidas", `${totalPerdidas}`);
    addText("Win Rate", `${winRate.toFixed(2)}%`);
    addText("Ganancia Promedio por Ganada", `${avgProfitPerWin.toFixed(2)} USD`);
    addText("Pérdida Promedio por Perdida", `${avgLossPerLoss.toFixed(2)} USD`);
    addText("Monto Total Ganado (Trading)", `${montoTotalGanado.toFixed(2)} USD`);
    addText("Monto Total Perdido (Trading)", `${montoTotalPerdido.toFixed(2)} USD`);
    y += 5;

    doc.text("Comparativa Mensual:", 10, y);
    y += 7;
    for (const monthYear in monthlyData) {
        const data = monthlyData[monthYear];
        const monthTotalOps = data.ganadas + data.perdidas;
        const monthWinRate = monthTotalOps > 0 ? (data.ganadas / monthTotalOps) * 100 : 0;
        const monthNetProfit = data.balanceFin - data.balanceInicio;
        doc.text(`  ${monthYear}: Ganadas: ${data.ganadas}, Perdidas: ${data.perdidas}, Win Rate: ${monthWinRate.toFixed(2)}%, Ganancia Neta: ${monthNetProfit.toFixed(2)} USD`, 10, y);
        y += 7;
    }

    // Add chart if available (as an image)
    if (analisisChart) {
        const chartDataUrl = analisisChart.toBase64Image();
        doc.addImage(chartDataUrl, 'PNG', 10, y + 10, 100, 100);
    }

    doc.save(`${title.toLowerCase().replace(/ /g, '_')}.pdf`);
}

// Function to perform analysis and update UI
async function performAnalysis(startDate, endDate) {
    const fechaInicio = new Date(startDate + 'T00:00:00');
    const fechaFin = new Date(endDate + 'T23:59:59');

    console.log("Report Date Range:");
    console.log("  fechaInicio (input):", startDate);
    console.log("  fechaFin (input):", endDate);
    console.log("  fechaInicio (parsed):", fechaInicio);
    console.log("  fechaFin (parsed):", fechaFin);

    if(fechaInicio > fechaFin){
        alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
        return;
    }

    console.log("Fetching operations for report from localStorage...");
    let operaciones = JSON.parse(localStorage.getItem(OPERACIONES_KEY)) || [];
    console.log("Operations fetched for report:", operaciones);

    let operacionesRango = operaciones.filter(op => {
        const opFecha = new Date(op.fechaRegistro);
        console.log("  Comparing opFecha:", opFecha, "between", fechaInicio, "and", fechaFin);
        return opFecha >= fechaInicio && opFecha <= fechaFin;
    });
    console.log("Filtered operations for range:", operacionesRango);

    if(operacionesRango.length === 0){
        resultadoAnalisisDiv.innerHTML = "<p>No hay operaciones en el rango de fechas seleccionado.</p>";
        monthlyComparisonDiv.innerHTML = '';
        downloadPdfBtn.style.display = 'none';
        if (analisisChart) {
            analisisChart.destroy();
            analisisChart = null;
        }
        console.log("No operations found in range for report.");
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
    let totalOperacionesTrading = 0;

    operacionesRango.forEach(op => {
        if (op.tipoOperacion === 'alcista' || op.tipoOperacion === 'bajista') {
            totalOperacionesTrading++;
            if (op.estado === 'ganada') {
                totalGanadas++;
                montoTotalGanado += op.inversion * (op.retorno / 100);
            } else if (op.estado === 'perdida') {
                totalPerdidas++;
                montoTotalPerdido += op.inversion;
            }
        } else if (op.tipoOperacion === 'inversion') {
            totalInversiones += op.inversion;
        } else if (op.tipoOperacion === 'retiro') {
            totalRetiros += op.inversion;
        }
    });

    const winRate = totalOperacionesTrading > 0 ? (totalGanadas / totalOperacionesTrading) * 100 : 0;
    const avgProfitPerWin = totalGanadas > 0 ? montoTotalGanado / totalGanadas : 0;
    const avgLossPerLoss = totalPerdidas > 0 ? montoTotalPerdido / totalPerdidas : 0;

    const balanceInicialRango = operacionesRango[0].balanceAntes;
    const balanceFinalRango = operacionesRango[operacionesRango.length - 1].balanceDespues;
    const gananciaPerdidaNeta = balanceFinalRango - balanceInicialRango;
    const porcentajeNeto = balanceInicialRango !== 0 ? (gananciaPerdidaNeta / balanceInicialRango) * 100 : 0;

    let monthlyData = {};
    operacionesRango.forEach(op => {
        const date = new Date(op.fechaRegistro);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { ganadas: 0, perdidas: 0, montoGanado: 0, montoPerdido: 0, balanceInicio: op.balanceAntes, balanceFin: op.balanceDespues };
        }
        if (op.tipoOperacion === 'alcista' || op.tipoOperacion === 'bajista') {
            if (op.estado === 'ganada') {
                monthlyData[monthYear].ganadas++;
                monthlyData[monthYear].montoGanado += op.inversion * (op.retorno / 100);
            } else if (op.estado === 'perdida') {
                monthlyData[monthYear].perdidas++;
                monthlyData[monthYear].montoPerdido += op.inversion;
            }
        }
        monthlyData[monthYear].balanceFin = op.balanceDespues; // Update final balance for the month
    });

    let monthlyComparisonHtml = '<h4>Comparativa Mensual</h4>';
    for (const monthYear in monthlyData) {
        const data = monthlyData[monthYear];
        const monthTotalOps = data.ganadas + data.perdidas;
        const monthWinRate = monthTotalOps > 0 ? (data.ganadas / monthTotalOps) * 100 : 0;
        const monthNetProfit = data.balanceFin - data.balanceInicio;
        monthlyComparisonHtml += `
            <div class="monthly-summary">
                <h5>${monthYear}</h5>
                <p>Ganadas: ${data.ganadas}, Perdidas: ${data.perdidas}, Win Rate: ${monthWinRate.toFixed(2)}%</p>
                <p>Ganancia Neta Mensual: <span style="color: ${monthNetProfit >= 0 ? 'green' : 'red'};">${monthNetProfit.toFixed(2)} USD</span></p>
            </div>
        `;
    }

    resultadoAnalisisDiv.innerHTML = `
        <h4>Resumen del Periodo</h4>
        <p><strong>Balance Inicial:</strong> ${balanceInicialRango.toFixed(2)} USD</p>
        <p><strong>Balance Final:</strong> ${balanceFinalRango.toFixed(2)} USD</p>
        <p><strong>Ganancia/Pérdida Neta:</strong> <span style="color: ${gananciaPerdidaNeta >= 0 ? 'green' : 'red'};">${gananciaPerdidaNeta.toFixed(2)} USD (${porcentajeNeto.toFixed(2)}%)</span></p>
        <hr>
        <p><strong>Total Invertido:</strong> ${totalInversiones.toFixed(2)} USD</p>
        <p><strong>Total Retirado:</strong> ${totalRetiros.toFixed(2)} USD</p>
        <hr>
        <h4>Estadísticas de Trading</h4>
        <p><strong>Operaciones de Trading:</strong> ${totalOperacionesTrading}</p>
        <p><strong>Ganadas:</strong> ${totalGanadas}</p>
        <p><strong>Perdidas:</strong> ${totalPerdidas}</p>
        <p><strong>Win Rate:</strong> ${winRate.toFixed(2)}%</p>
        <p><strong>Ganancia Promedio por Ganada:</strong> ${avgProfitPerWin.toFixed(2)} USD</p>
        <p><strong>Pérdida Promedio por Perdida:</strong> ${avgLossPerLoss.toFixed(2)} USD</p>
        <p><strong>Monto Total Ganado (Trading):</strong> ${montoTotalGanado.toFixed(2)} USD</p>
        <p><strong>Monto Total Perdido (Trading):</strong> ${montoTotalPerdido.toFixed(2)} USD</p>
    `;

    monthlyComparisonDiv.innerHTML = monthlyComparisonHtml;
    downloadPdfBtn.style.display = 'block'; // Show PDF button

    // Lógica del gráfico
    const ctx = document.getElementById('analisisChart').getContext('2d');
    if (analisisChart) {
        analisisChart.destroy();
    }

    if (totalGanadas > 0 || totalPerdidas > 0) { // Only show chart if there are trading operations
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
                        text: 'Distribución de Operaciones de Trading'
                    }
                }
            }
        });
    } else {
        // Si no hay operaciones de trading, limpia el canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    // Event listener para el botón de descarga de PDF
    downloadPdfBtn.onclick = () => {
        generatePdf({
            totalGanadas, totalPerdidas, montoTotalGanado, montoTotalPerdido, totalInversiones, totalRetiros, totalOperaciones: totalOperacionesTrading, winRate, balanceInicialRango, balanceFinalRango, gananciaPerdidaNeta, porcentajeNeto, monthlyData, avgProfitPerWin, avgLossPerLoss
        }, `Reporte de Operaciones ${startDate} al ${endDate}`);
    };
}

// Al cargar la página, establecer el rango de fechas por defecto y generar el reporte
window.addEventListener("load", () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    fechaInicioInput.value = formattedDate;
    fechaFinInput.value = formattedDate;

    // Automatically generate report for today
    performAnalysis(formattedDate, formattedDate);
});

// Manejar el envío del formulario de análisis
formAnalisis.addEventListener("submit", async e => {
    e.preventDefault();
    performAnalysis(fechaInicioInput.value, fechaFinInput.value);
});

// Function to export daily report (PDF)
exportDailyReportBtn.addEventListener("click", async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    // Filter operations for today
    let operaciones = JSON.parse(localStorage.getItem(OPERACIONES_KEY)) || [];
    let dailyOperations = operaciones.filter(op => {
        const opDate = new Date(op.fechaRegistro);
        return opDate.getFullYear() === today.getFullYear() &&
               opDate.getMonth() === today.getMonth() &&
               opDate.getDate() === today.getDate();
    });

    if (dailyOperations.length === 0) {
        alert("No hay operaciones para el día de hoy.");
        return;
    }

    // Perform a quick analysis for today's data to pass to PDF generator
    let totalGanadas = 0;
    let totalPerdidas = 0;
    let montoTotalGanado = 0;
    let montoTotalPerdido = 0;
    let totalInversiones = 0;
    let totalRetiros = 0;
    let totalOperacionesTrading = 0;

    dailyOperations.forEach(op => {
        if (op.tipoOperacion === 'alcista' || op.op.tipoOperacion === 'bajista') {
            totalOperacionesTrading++;
            if (op.estado === 'ganada') {
                totalGanadas++;
                montoTotalGanado += op.inversion * (op.retorno / 100);
            } else if (op.estado === 'perdida') {
                totalPerdidas++;
                montoTotalPerdido += op.inversion;
            }
        } else if (op.tipoOperacion === 'inversion') {
            totalInversiones += op.inversion;
        } else if (op.tipoOperacion === 'retiro') {
            totalRetiros += op.inversion;
        }
    });

    const winRate = totalOperacionesTrading > 0 ? (totalGanadas / totalOperacionesTrading) * 100 : 0;
    const avgProfitPerWin = totalGanadas > 0 ? montoTotalGanado / totalGanadas : 0;
    const avgLossPerLoss = totalPerdidas > 0 ? montoTotalPerdido / totalPerdidas : 0;

    const balanceInicialRango = dailyOperations[0].balanceAntes;
    const balanceFinalRango = dailyOperations[dailyOperations.length - 1].balanceDespues;
    const gananciaPerdidaNeta = balanceFinalRango - balanceInicialRango;
    const porcentajeNeto = balanceInicialRango !== 0 ? (gananciaPerdidaNeta / balanceInicialRango) * 100 : 0;

    generatePdf({
        totalGanadas, totalPerdidas, montoTotalGanado, montoTotalPerdido, totalInversiones, totalRetiros, totalOperaciones: totalOperacionesTrading, winRate, balanceInicialRango, balanceFinalRango, gananciaPerdidaNeta, porcentajeNeto, monthlyData: {}, avgProfitPerWin, avgLossPerLoss
    }, `Reporte Diario ${formattedDate}`);
});