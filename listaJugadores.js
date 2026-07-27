let filtroActual = "TODAS";
let jugadores = [];

// ───────── FILTRO ─────────
document.getElementById("filtro").addEventListener("change", e => {
    filtroActual = e.target.value;
    render();
});

// ───────── CATEGORÍA ─────────
// ───────── CATEGORÍA ─────────
function obtenerCategoria(fechaNacimiento) {

    const anioActual = new Date().getFullYear();
    const nacimiento = new Date(fechaNacimiento);
    const anioNacimiento = nacimiento.getFullYear();

    const edad = anioActual - anioNacimiento;

    if (edad >= 5 && edad <= 7) return "U7";
    if (edad >= 8 && edad <= 9) return "U9";
    if (edad >= 10 && edad <= 11) return "U11";
    if (edad >= 12 && edad <= 13) return "U13";

    return "Sin";
}

// ───────── FIREBASE ─────────
db.ref("jugadores").on("value", snap => {
    jugadores = [];
    snap.forEach(i => {
        let j = i.val();
        j.id = i.key;
        j.categoria = obtenerCategoria(j.fechaNacimiento);
        jugadores.push(j);
    });
    render();
});

// ───────── RENDER ─────────
function render() {
    let lista = jugadores;
    if (filtroActual !== "TODAS") {
        lista = jugadores.filter(j => j.categoria === filtroActual);
    }
    let html = `
    <table class="table table-striped align-middle">
    <thead class="table-primary">
        <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Cédula</th>
            <th>Fecha</th>
            <th>U</th>
            <th>Acciones</th>
        </tr>
    </thead>
    <tbody>
    `;
    lista.forEach(j => {
        html += `
        <tr>
            <td><img src="${j.foto}" class="foto"></td>
            <td>${j.nombre}</td>
            <td>${j.cedula}</td>
            <td>${j.fechaNacimiento}</td>
            <td><span class="badge bg-primary">${j.categoria}</span></td>
            <td>
                <button class="btn btn-info btn-sm text-white"
                    onclick="verDetalle('${j.id}')">👁</button>
                <button class="btn btn-danger btn-sm"
                    onclick="eliminarJugador('${j.id}')">🗑</button>
            </td>
        </tr>
        `;
    });
    html += `</tbody></table>`;
    document.getElementById("lista").innerHTML = html;
}

// ───────── DETALLE ─────────
function verDetalle(id) {
    let j = jugadores.find(x => x.id === id);
    if (!j) return;
    Swal.fire({
        title: "Detalle",
        html: `
        <div style="display:flex;gap:15px;align-items:center;text-align:left">
            <img src="${j.foto}" style="width:140px;height:140px;border-radius:50%;object-fit:cover">
            <div>
                <p><b>Nombre:</b> ${j.nombre}</p>
                <p><b>Cédula:</b> ${j.cedula}</p>
                <p><b>Nacimiento:</b> ${j.fechaNacimiento}</p>
                <p><b>Categoría:</b> ${j.categoria}</p>
            </div>
        </div>
        `
    });
}

// ───────── ELIMINAR ─────────
function eliminarJugador(id) {
    Swal.fire({
        title: "¿Eliminar?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí"
    }).then(r => {
        if (r.isConfirmed) {
            db.ref("jugadores/" + id).remove();
            Swal.fire("Eliminado", "", "success");
        }
    });
}

// ───────── HELPERS PDF ─────────

/**
 * Convierte cualquier src (data:image o URL) en un JPEG base64
 * recortado al cuadrado central y reducido a MAX px.
 */
function prepararFoto(src) {
    return new Promise(resolve => {
        if (!src) return resolve(null);
        const img = new Image();
        img.onload = () => {
            try {
                const MAX     = 200;
                const size    = Math.min(img.naturalWidth, img.naturalHeight);
                const offsetX = (img.naturalWidth  - size) / 2;
                const offsetY = (img.naturalHeight - size) / 2;
                const output  = Math.min(size, MAX);
                const canvas  = document.createElement("canvas");
                canvas.width  = output;
                canvas.height = output;
                canvas.getContext("2d").drawImage(
                    img, offsetX, offsetY, size, size, 0, 0, output, output
                );
                resolve(canvas.toDataURL("image/jpeg", 0.85));
            } catch (e) {
                console.warn("prepararFoto error:", e);
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        if (src.startsWith("data:")) {
            img.src = src;
        } else {
            img.crossOrigin = "anonymous";
            img.src = src;
        }
    });
}

// ───────── PDF BONITO ─────────
window.descargarPDF = async function () {
    const { jsPDF } = window.jspdf;

    // ── Constantes de página ──────────────────────────────────────────────
    const PAGE_W    = 210;
    const PAGE_H    = 297;
    const MARGIN    = 12;
    const CW        = PAGE_W - MARGIN * 2;   // ancho de contenido: 186

    // ── Colores ───────────────────────────────────────────────────────────
    const VERDE      = [22, 101, 52];         // verde oscuro encabezado
    const VERDE_LT   = [187, 247, 208];       // verde claro filas alternas
    const VERDE_MID  = [34, 197, 94];         // verde medio acento
    const GRIS_TH    = [241, 245, 249];       // fondo cabecera tabla
    const GRIS_BRD   = [203, 213, 225];       // borde tabla
    const TEXTO_OSC  = [15,  23,  42];        // texto principal
    const TEXTO_DIM  = [100, 116, 139];       // texto secundario

    // ── Columnas ─────────────────────────────────────────────────────────
    const COL = {
        foto:   { x: MARGIN,        w: 22 },
        nombre: { x: MARGIN + 22,   w: 68 },
        cedula: { x: MARGIN + 90,   w: 52 },
        nac:    { x: MARGIN + 142,  w: 44 },
    };

    const ROW_H    = 22;
    const FOTO_SZ  = 16;   // mm de la foto en la celda
    const HEAD_H   = 9;    // altura fila cabecera tabla

    // ── Lista a exportar ─────────────────────────────────────────────────
    const lista = filtroActual === "TODAS"
        ? jugadores
        : jugadores.filter(j => j.categoria === filtroActual);

    const tituloCategoria = filtroActual === "TODAS" ? "TODAS LAS CATEGORÍAS" : `Categoría ${filtroActual}`;

    // ── Pre-cargar fotos ─────────────────────────────────────────────────
    await Promise.all(lista.map(async j => {
        j._foto64 = await prepararFoto(j.foto || null);
    }));

    // ── Crear doc ────────────────────────────────────────────────────────
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 0;
    let pageNum = 1;

    // ═══════════════════════════════════════════════════════════════════════
    // ENCABEZADO
    // ═══════════════════════════════════════════════════════════════════════
    function drawHeader() {
        // Franja verde principal
        doc.setFillColor(...VERDE);
        doc.rect(0, 0, PAGE_W, 38, "F");

        // Franja decorativa inferior del header
        doc.setFillColor(...VERDE_MID);
        doc.rect(0, 38, PAGE_W, 3, "F");

        // Logo (izquierda)
        if (window._logoPDF) {
            doc.addImage(window._logoPDF, "JPEG", MARGIN, 6, 26, 26);
        }

        // Título centrado
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text("LISTA DE JUGADORES", PAGE_W / 2, 18, { align: "center" });

        // Subtítulo categoría
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...VERDE_LT);
        doc.text(tituloCategoria, PAGE_W / 2, 28, { align: "center" });

        // Fecha — derecha
        doc.setFontSize(7.5);
        doc.setTextColor(180, 230, 180);
        const fecha = new Date().toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" });
        doc.text("Fecha: " + fecha, PAGE_W - MARGIN, 35, { align: "right" });

        doc.setTextColor(0);
        return 50; // y de inicio
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CABECERA DE TABLA
    // ═══════════════════════════════════════════════════════════════════════
    function drawTableHeader(yy) {
        // Fondo
        doc.setFillColor(...GRIS_TH);
        doc.rect(MARGIN, yy, CW, HEAD_H, "F");

        // Borde superior e inferior
        doc.setDrawColor(...VERDE_MID);
        doc.setLineWidth(0.4);
        doc.line(MARGIN, yy, MARGIN + CW, yy);
        doc.line(MARGIN, yy + HEAD_H, MARGIN + CW, yy + HEAD_H);
        doc.setLineWidth(0.1);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...VERDE);

        const midH = yy + HEAD_H / 2 + 2.5;
        doc.text("FOTO",       COL.foto.x   + COL.foto.w / 2,   midH, { align: "center" });
        doc.text("NOMBRE",     COL.nombre.x + 2,                midH);
        doc.text("CÉDULA",     COL.cedula.x + 2,                midH);
        doc.text("NACIMIENTO", COL.nac.x    + 2,                midH);

        // Divisores de columna
        doc.setDrawColor(...GRIS_BRD);
        [COL.nombre.x, COL.cedula.x, COL.nac.x].forEach(cx => {
            doc.line(cx, yy, cx, yy + HEAD_H);
        });

        doc.setTextColor(0);
        doc.setDrawColor(0);
        return yy + HEAD_H;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // FILA DE JUGADOR
    // ═══════════════════════════════════════════════════════════════════════
    function drawRow(yy, jugador, idx) {
        // Fondo alternado: par = blanco, impar = verde muy claro
        if (idx % 2 === 0) {
            doc.setFillColor(255, 255, 255);
        } else {
            doc.setFillColor(240, 253, 244);   // green-50
        }
        doc.rect(MARGIN, yy, CW, ROW_H, "F");

        // Borde inferior de fila
        doc.setDrawColor(...GRIS_BRD);
        doc.setLineWidth(0.1);
        doc.line(MARGIN, yy + ROW_H, MARGIN + CW, yy + ROW_H);

        // Borde izquierdo acento verde cada 2 filas
        if (idx % 2 !== 0) {
            doc.setFillColor(...VERDE_MID);
            doc.rect(MARGIN, yy, 1.2, ROW_H, "F");
        }

        // Divisores de columna
        doc.setDrawColor(...GRIS_BRD);
        [COL.nombre.x, COL.cedula.x, COL.nac.x].forEach(cx => {
            doc.line(cx, yy, cx, yy + ROW_H);
        });

        // ── Foto ──────────────────────────────────────────────────────────
        if (jugador._foto64) {
            const fx = COL.foto.x + (COL.foto.w - FOTO_SZ) / 2;
            const fy = yy + (ROW_H - FOTO_SZ) / 2;
            try {
                // Círculo de fondo verde claro
                doc.setFillColor(...VERDE_LT);
                doc.circle(fx + FOTO_SZ / 2, fy + FOTO_SZ / 2, FOTO_SZ / 2 + 0.5, "F");
                doc.addImage(jugador._foto64, "JPEG", fx, fy, FOTO_SZ, FOTO_SZ);
            } catch (e) {
                console.warn("addImage:", e.message);
            }
        }

        // ── Texto ─────────────────────────────────────────────────────────
        const midY = yy + ROW_H / 2 + 2.8;
        doc.setFontSize(8.5);

        // Nombre — negrita, color oscuro
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...TEXTO_OSC);
        let nombre = jugador.nombre || "";
        const maxW = COL.nombre.w - 4;
        while (doc.getTextWidth(nombre) > maxW && nombre.length > 1) nombre = nombre.slice(0, -1);
        if (nombre !== (jugador.nombre || "")) nombre += "…";
        doc.text(nombre, COL.nombre.x + 3, midY);

        // Cédula y fecha — normal, gris
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...TEXTO_DIM);
        doc.text(jugador.cedula          || "—", COL.cedula.x + 3, midY);
        doc.text(jugador.fechaNacimiento || "—", COL.nac.x    + 3, midY);

        doc.setTextColor(0);
        doc.setDrawColor(0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PIE DE PÁGINA
    // ═══════════════════════════════════════════════════════════════════════
    function drawFooter(n, total) {
        doc.setFillColor(...VERDE);
        doc.rect(0, PAGE_H - 10, PAGE_W, 10, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(180, 230, 180);
        doc.text(`Página ${n} de ${total}`, PAGE_W / 2, PAGE_H - 3.5, { align: "center" });
        doc.text(`Total: ${lista.length} jugadores`, MARGIN, PAGE_H - 3.5);
        doc.setTextColor(0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BORDE EXTERIOR (llamar al final de cada página)
    // ═══════════════════════════════════════════════════════════════════════
    function drawPageBorder() {
        doc.setDrawColor(...VERDE_MID);
        doc.setLineWidth(0.6);
        doc.rect(4, 4, PAGE_W - 8, PAGE_H - 8);
        doc.setLineWidth(0.1);
        doc.setDrawColor(0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CARGAR LOGO
    // ═══════════════════════════════════════════════════════════════════════
    window._logoPDF = null;
    try {
        window._logoPDF = await prepararFoto("img/logo.jpg");
    } catch (_) {}

    // ═══════════════════════════════════════════════════════════════════════
    // CALCULAR TOTAL DE PÁGINAS (estimado)
    // ═══════════════════════════════════════════════════════════════════════
    const FIRST_PAGE_ROWS = Math.floor((PAGE_H - 50 - HEAD_H - 16) / ROW_H);
    const OTHER_PAGE_ROWS = Math.floor((PAGE_H - MARGIN - HEAD_H - 16) / ROW_H);
    let totalPages = 1;
    if (lista.length > FIRST_PAGE_ROWS) {
        totalPages += Math.ceil((lista.length - FIRST_PAGE_ROWS) / OTHER_PAGE_ROWS);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DIBUJAR
    // ═══════════════════════════════════════════════════════════════════════
    y = drawHeader();
    y = drawTableHeader(y);

    // Borde exterior tabla
    doc.setDrawColor(...VERDE_MID);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y - HEAD_H, CW, HEAD_H, "S");   // sólo el header

    for (let i = 0; i < lista.length; i++) {
        // ¿Cabe la fila?
        if (y + ROW_H > PAGE_H - 14) {
            drawFooter(pageNum, totalPages);
            drawPageBorder();
            pageNum++;
            doc.addPage();
            y = MARGIN + 4;
            y = drawTableHeader(y);
        }

        drawRow(y, lista[i], i);
        y += ROW_H;
    }

    // Línea inferior cierre tabla
    doc.setDrawColor(...VERDE_MID);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, MARGIN + CW, y);

    // Bordes laterales de la última página
    doc.setDrawColor(...GRIS_BRD);
    doc.setLineWidth(0.2);
    const tableTop = (pageNum === 1) ? (50 - HEAD_H) : (MARGIN + 4);
    doc.line(MARGIN,      tableTop, MARGIN,      y);
    doc.line(MARGIN + CW, tableTop, MARGIN + CW, y);

    drawFooter(pageNum, totalPages);
    drawPageBorder();

    const nombreArchivo = filtroActual === "TODAS"
        ? "Jugadores_Todos.pdf"
        : `Jugadores_${filtroActual}.pdf`;

    doc.save(nombreArchivo);
};