const db = firebase.database();

const tabla = document.getElementById("tablaCobros");
const filtro = document.getElementById("filtroCategoria");

window.onload = () => {
    listarCobros();

    filtro.addEventListener("change", listarCobros);
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

        Swal.fire(
            "Error",
            "Seleccione la fecha.",
            "warning"
        );

        return;
    }

    const nuevo = db.ref("cobros").push();

    nuevo.set({

        tipo,
        fecha,
        categoria,
        monto

    }).then(() => {

        Swal.fire(
            "Éxito",
            "Cobro registrado.",
            "success"
        );

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

        snapshot.forEach(item => {

            const id = item.key;
            const c = item.val();

            if (
                filtro.value != "TODAS" &&
                c.categoria != filtro.value
            ) return;

            tabla.innerHTML += `

            <tr>

                <td>${c.tipo}</td>

                <td>${c.fecha}</td>

                <td>${c.categoria}</td>

                <td>₡${c.monto}</td>

                <td>

                    <button
                    class="btn btn-success btn-sm"
                    onclick="cobrar('${id}')">

                    💵 Cobrar

                    </button>

                    <button
                    class="btn btn-primary btn-sm"
                    onclick="estadoCuenta('${id}')">

                    📄 Estado

                    </button>

                    <button
                    class="btn btn-danger btn-sm"
                    onclick="eliminar('${id}')">

                    🗑

                    </button>

                </td>

            </tr>

            `;

        });

    });

}

// ============================
// ELIMINAR
// ============================

function eliminar(id) {

    Swal.fire({

        title: "¿Eliminar?",

        text: "No podrá recuperarlo.",

        icon: "warning",

        showCancelButton: true,

        confirmButtonText: "Sí"

    }).then(r => {

        if (!r.isConfirmed) return;

        db.ref("cobros/" + id)
            .remove()
            .then(() => {

                Swal.fire(
                    "Eliminado",
                    "",
                    "success"
                );

                listarCobros();

            });

    });

}

// ============================
// COBRAR
// ============================

function cobrar(id) {

    location.href =
        "cobrarJugadores.html?id=" + id;

}

// ============================
// ESTADO CUENTA
// ============================

function estadoCuenta(id) {

    location.href =
        "estadoCuenta.html?id=" + id;

}

// ============================
// PDF
// ============================

function descargarPDF() {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    doc.text("Listado de Cobros", 14, 15);

    let filas = [];

    document
        .querySelectorAll("#tablaCobros tr")
        .forEach(tr => {

            const tds = tr.querySelectorAll("td");

            filas.push([

                tds[0].innerText,
                tds[1].innerText,
                tds[2].innerText,
                tds[3].innerText

            ]);

        });

    doc.autoTable({

        head: [[
            "Tipo",
            "Fecha",
            "Categoría",
            "Monto"
        ]],

        body: filas,

        startY: 20

    });

    doc.save("Cobros.pdf");

}