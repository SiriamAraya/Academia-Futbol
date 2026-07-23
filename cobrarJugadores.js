const db = firebase.database();

const params = new URLSearchParams(window.location.search);
const idCobro = params.get("id");

const tabla = document.getElementById("tablaJugadores");
const titulo = document.getElementById("tituloCobro");

window.onload = () => {

    if (!idCobro) {

        Swal.fire(
            "Error",
            "No se recibió el cobro.",
            "error"
        ).then(() => {

            location.href = "listaCobros.html";

        });

        return;
    }

    cargarCobro();

};

function cargarCobro() {

    db.ref("cobros/" + idCobro).once("value", snapshot => {

        if (!snapshot.exists()) {

            Swal.fire(
                "Error",
                "Cobro no encontrado.",
                "error"
            );

            return;
        }

        const cobro = snapshot.val();

        titulo.innerHTML =
            `${cobro.tipo} | ${cobro.fecha} | ${cobro.categoria}`;

        cargarJugadores(cobro.categoria);

    });

}

function cargarJugadores(categoria) {

    tabla.innerHTML = "";

    // Primero obtenemos los pagos (si existen)
    db.ref("pagos/" + idCobro).once("value")
    .then(pagosSnap => {

        let pagos = {};

        if (pagosSnap.exists()) {

            pagosSnap.forEach(p => {

                pagos[p.key] = p.val();

            });

        }



        // Luego cargamos jugadores
        return db.ref("jugadores").once("value")
        .then(snapshot => {


            let encontrados = false;


            snapshot.forEach(item => {


                const jugador = item.val();


                // IMPORTANTE:
                // Verifica que la categoría coincida
                if (jugador.categoria !== categoria) {
                    return;
                }


                encontrados = true;


                const pago = pagos[item.key];


                const pagado = pago ? pago.pago : false;

                const metodo = pago ? pago.metodo : "";



                const foto = jugador.foto || "imagenes/default.png";



                tabla.innerHTML += `

                <tr>

                    <td>
                        <img src="${foto}" class="foto">
                    </td>


                    <td>
                        ${jugador.nombre}
                    </td>


                    <td>
                        ${jugador.cedula}
                    </td>


                    <td class="text-center">

                        <input
                        type="checkbox"
                        class="form-check-input pago"
                        data-id="${item.key}"
                        ${pagado ? "checked" : ""}
                        onchange="habilitarMetodo('${item.key}')">

                    </td>


                    <td>

                        <select
                        id="metodo-${item.key}"
                        class="form-select"
                        ${pagado ? "" : "disabled"}>

                            <option value="">
                            Seleccione
                            </option>

                            <option value="Efectivo"
                            ${metodo === "Efectivo" ? "selected" : ""}>
                            Efectivo
                            </option>


                            <option value="SINPE"
                            ${metodo === "SINPE" ? "selected" : ""}>
                            SINPE
                            </option>

                        </select>

                    </td>


                </tr>

                `;


            });



            if(!encontrados){

                tabla.innerHTML = `

                <tr>
                    <td colspan="5" class="text-center">
                        No hay jugadores en esta categoría
                    </td>
                </tr>

                `;

            }


        });


    })

    .catch(error => {

        console.error(error);

        Swal.fire(
            "Error",
            error.message,
            "error"
        );

    });


}

function habilitarMetodo(id) {

    const check = document.querySelector(
        `[data-id="${id}"]`
    );

    const metodo = document.getElementById(
        "metodo-" + id
    );

    metodo.disabled = !check.checked;

    if (!check.checked) {

        metodo.value = "";

    }

}

function guardarPagos() {

    const checks = document.querySelectorAll(".pago");

    let contador = 0;

    checks.forEach(check => {

        const idJugador = check.dataset.id;

        const metodo = document.getElementById(
            "metodo-" + idJugador
        ).value;

        db.ref("pagos/" + idCobro + "/" + idJugador).set({

            pago: check.checked,
            metodo: metodo

        });

        if (check.checked) contador++;

    });

    Swal.fire(

        "Éxito",

        `Se registraron ${contador} pagos.`,

        "success"

    )

}