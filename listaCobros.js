const db = firebase.database();

const tabla = document.getElementById("tablaCobros");
const filtro = document.getElementById("filtroCategoria");
const filtroFecha = document.getElementById("filtroFecha"); // 👈 nuevo input de fecha

window.onload = () => {
    listarCobros();

    filtro.addEventListener("change", listarCobros);
    filtroFecha.addEventListener("change", listarCobros); // 👈 nuevo listener
};

// ============================
// GUARDAR COBRO
// ============================

function guardarCobro() {

    const tipo = document.getElementById("tipo").value;
    const fecha = document.getElementById("fecha").value;
    const categoria = document.getElementById("categoria").value;
    const monto = Number(document.getElementById("monto").value);

    if (fecha == "") {
        Swal.fire("Error", "Seleccione la fecha.", "warning");
        return;
    }

    const nuevo = db.ref("cobros").push();

    nuevo.set({
        tipo,
        fecha,
        categoria,
        monto,
        creado: Date.now() // 👈 nuevo: guarda el momento exacto de creación (para ordenar bien)
    }).then(() => {

        Swal.fire("Éxito", "Cobro registrado.", "success");

        bootstrap.Modal
            .getInstance(document.getElementById("modalCobro"))
            .hide();

        document.getElementById("fecha").value = "";
        document.getElementById("monto").value = 1000;

        listarCobros();

    });

}

// ============================
// LISTAR
// ============================

function listarCobros() {

    tabla.innerHTML = "";

    db.ref("cobros").once("value", snapshot => {

        const items = [];

        snapshot.forEach(item => {
            items.push({ id: item.key, ...item.val() });
        });

        // Orden: del más reciente al más viejo
        // Usa "creado" si existe; si no (cobros viejos sin ese campo), usa la key como respaldo
        items.sort((a, b) => {
            const va = a.creado || 0;
            const vb = b.creado || 0;
            return vb - va;
        });

        let hayResultados = false;

        items.forEach(c => {

            if (filtro.value != "TODAS" && c.categoria != filtro.value) return;

            if (filtroFecha.value && c.fecha != filtroFecha.value) return;

            hayResultados = true;

            tabla.innerHTML += `

            <tr>
                <td>${c.tipo}</td>
                <td>${c.fecha}</td>
                <td>${c.categoria}</td>
                <td>₡${c.monto}</td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="cobrar('${c.id}')">💵 Cobrar</button>
                    <button class="btn btn-primary btn-sm" onclick="estadoCuenta('${c.id}')">📄 Estado</button>
                    <button class="btn btn-danger btn-sm" onclick="eliminar('${c.id}')">🗑</button>
                </td>
            </tr>

            `;

        });

        if (!hayResultados) {
            tabla.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No hay cobros con ese filtro</td>
            </tr>
            `;
        }

    });

}

// ============================
// ELIMINAR
// ============================

function eliminar(id) {

    Swal.fire({
        title: "¿Eliminar?",
        text: "No podrá recuperarlo. También se eliminarán los pagos relacionados.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí"
    }).then(r => {

        if (!r.isConfirmed) return;

        const actualizaciones = {};
        actualizaciones["cobros/" + id] = null;
        actualizaciones["pagos/" + id] = null;

        db.ref().update(actualizaciones)
            .then(() => {
                Swal.fire("Eliminado", "Cobro y pagos relacionados eliminados.", "success");
                listarCobros();
            })
            .catch(error => {
                console.error(error);
                Swal.fire("Error", error.message, "error");
            });

    });

}

// ============================
// COBRAR
// ============================

function cobrar(id) {
    location.href = "cobrarJugadores.html?id=" + id;
}

// ============================
// ESTADO CUENTA
// ============================

function estadoCuenta(id) {
    location.href = "estadoCuenta.html?id=" + id;
}

// ============================
// PDF
// ============================

function descargarPDF() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Listado de Cobros", 14, 15);

    let filas = [];

    document.querySelectorAll("#tablaCobros tr").forEach(tr => {
        const tds = tr.querySelectorAll("td");
        if (tds.length < 4) return; // evita la fila de "no hay resultados"
        filas.push([tds[0].innerText, tds[1].innerText, tds[2].innerText, tds[3].innerText]);
    });

    doc.autoTable({
        head: [["Tipo", "Fecha", "Categoría", "Monto"]],
        body: filas,
        startY: 20
    });

    doc.save("Cobros.pdf");

}