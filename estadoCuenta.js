const db = firebase.database();


const params = new URLSearchParams(window.location.search);

const idCobro = params.get("id");


let datosPDF = [];

let totalPagado = 0;
let totalPendiente = 0;

let montoCobro = 0;



window.onload = ()=>{


    cargarEstado();


};





function cargarEstado(){



db.ref("cobros/"+idCobro)
.once("value")
.then(cobroSnap=>{


    const cobro = cobroSnap.val();


    montoCobro = Number(cobro.monto);


    document.getElementById("titulo").innerHTML =

    `${cobro.tipo} - ${cobro.categoria} - ${cobro.fecha}`;



    cargarDatos(cobro.categoria);



});



}






function cargarDatos(categoria){



Promise.all([


db.ref("jugadores").once("value"),

db.ref("pagos/"+idCobro).once("value")


])


.then(resultado=>{



const jugadoresSnap = resultado[0];

const pagosSnap = resultado[1];



let pagos={};



pagosSnap.forEach(p=>{


    pagos[p.key]=p.val();


});




let html="";

datosPDF=[];


totalPagado=0;

totalPendiente=0;



jugadoresSnap.forEach(j=>{


const jugador=j.val();



if(jugador.categoria !== categoria)
return;



const pago = pagos[j.key];



let estado;
let metodo;



if(pago && pago.pago){


estado="PAGÓ";

metodo=pago.metodo;

totalPagado += montoCobro;



}else{


estado="PENDIENTE";

metodo="-";

totalPendiente += montoCobro;


}




html+=`

<tr class="${estado=="PAGÓ"?"pagado":"pendiente"}">


<td>${jugador.nombre}</td>

<td>${jugador.cedula}</td>

<td>

${estado}

</td>


<td>

${metodo}

</td>






</tr>


`;




datosPDF.push([

jugador.nombre,
jugador.cedula,
estado,
metodo,

]);



});




document.getElementById("tablaEstado").innerHTML=html;



document.getElementById("recaudado").innerHTML=

"₡"+totalPagado.toLocaleString();



document.getElementById("pendiente").innerHTML=

"₡"+totalPendiente.toLocaleString();



});



}






function descargarPDF(){


const {jsPDF}=window.jspdf;


const doc=new jsPDF();



doc.text(

"Estado de Cuenta",

14,
15

);



doc.autoTable({

head:[

[
"Jugador",
"Cédula",
"Estado",
"Método"
]

],


body:datosPDF,


startY:25


});



doc.save("EstadoCuenta.pdf");


}