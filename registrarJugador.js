let fotoBase64 = "";

// ─────────────────────────────
// CATEGORÍA POR EDAD REAL
// ─────────────────────────────
function obtenerCategoria(fechaNacimiento) {

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);

    let edad = hoy.getFullYear() - nacimiento.getFullYear();

    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }

    if (edad >= 5 && edad <= 7) return "U7";
    if (edad >= 8 && edad <= 9) return "U9";
    if (edad >= 10 && edad <= 11) return "U11";
    if (edad >= 12 && edad <= 13) return "U13";

    return null;
}

// ─────────────────────────────
// AUTO CATEGORÍA EN INPUT
// ─────────────────────────────
document.getElementById("fechaNacimiento").addEventListener("change", function () {

    const cat = obtenerCategoria(this.value);

    document.getElementById("categoria").value =
        cat ? cat : "Sin categoría";
});

// ─────────────────────────────
// FOTO
// ─────────────────────────────
document.getElementById("foto").addEventListener("change", function (e) {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (ev) {
        fotoBase64 = ev.target.result;
        document.getElementById("preview").src = fotoBase64;
    };

    reader.readAsDataURL(file);
});

// ─────────────────────────────
// VALIDAR CÉDULA DUPLICADA
// ─────────────────────────────
function cedulaExiste(cedula) {

    return new Promise((resolve) => {

        window.db.ref("jugadores")
            .orderByChild("cedula")
            .equalTo(cedula)
            .once("value", snap => {
                resolve(snap.exists());
            });
    });
}

// ─────────────────────────────
// VALIDACIONES
// ─────────────────────────────
function validar(nombre, cedula, fechaNacimiento) {

    if (!nombre) return "Nombre obligatorio";
    if (!cedula) return "Cédula obligatoria";
    if (cedula.length < 6) return "Cédula muy corta";
    if (!fechaNacimiento) return "Fecha obligatoria";
    if (!fotoBase64) return "Debe subir foto";

    const categoria = obtenerCategoria(fechaNacimiento);
    if (!categoria) return "Edad debe ser entre 5 y 13 años";

    return null;
}

// ─────────────────────────────
// GUARDAR
// ─────────────────────────────
document.getElementById("formJugador").addEventListener("submit", async function (e) {

    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const cedula = document.getElementById("cedula").value.trim();
    const fechaNacimiento = document.getElementById("fechaNacimiento").value;

    const error = validar(nombre, cedula, fechaNacimiento);

    if (error) {
        Swal.fire("Error", error, "error");
        return;
    }

    const existe = await cedulaExiste(cedula);

    if (existe) {
        Swal.fire("Error", "La cédula ya existe", "warning");
        return;
    }

    const categoria = obtenerCategoria(fechaNacimiento);

    const jugador = {
        nombre,
        cedula,
        fechaNacimiento,
        categoria,
        foto: fotoBase64,
        fechaRegistro: new Date().toISOString()
    };

    await window.db.ref("jugadores").push(jugador);

    Swal.fire({
        icon: "success",
        title: "Jugador registrado",
        text: nombre + " agregado correctamente"
    });

    document.getElementById("formJugador").reset();
    document.getElementById("preview").src = "";
    document.getElementById("categoria").value = "";
    fotoBase64 = "";
});