const formRetiro = document.getElementById("formRetiro");
const montoRetiroInput = document.getElementById("montoRetiro");
const formInversion = document.getElementById("formInversion");
const montoInversionInput = document.getElementById("montoInversion");

formInversion.addEventListener("submit", async e => {
    e.preventDefault();
    const monto = parseFloat(montoInversionInput.value);

    if(isNaN(monto) || monto <= 0){
        Toastify({
            text: "Ingrese un monto de inversión válido.",
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
    const balanceDespues = balanceActual + monto;

    try {
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
        balanceActual = balanceDespues;
        actualizarBalanceUI();
        Toastify({
            text: "Inversión registrada con éxito.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
        }).showToast();
        formInversion.reset();
    } catch (e) {
        console.error("Error adding investment document: ", e);
        Toastify({
            text: "Error al registrar la inversión.",
            duration: 3000,
            close: true,
            gravity: "top",
            position: "right",
            backgroundColor: "linear-gradient(to right, #ff5f6d, #ffc371)",
        }).showToast();
    }
});