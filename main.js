const API_KEY = "16a55ffbd18fb4ec84b9b3ef921a15ead098854f215a99c3a003d0e299824ba5";

// 🔹 cargar legajo guardado
const legajoGuardado = localStorage.getItem("legajo");
if (legajoGuardado) {
  document.getElementById("legajo").value = legajoGuardado;
}

// 🔹 mostrar cache si existe
const cache = localStorage.getItem("asignaciones");
if (cache) {
  mostrarAsignaciones(JSON.parse(cache));
}

// 🔹 submit
document.getElementById("formulario").addEventListener("submit", async function (e) {
  e.preventDefault();

  const legajo = document.getElementById("legajo").value;

  if (!/^\d+$/.test(legajo)) {
    alert("Ingresá solo números.");
    return;
  }

  localStorage.setItem("legajo", legajo);

  const loader = document.getElementById("loader");
  loader.classList.remove("hidden");

  const url = `https://script.google.com/macros/s/AKfycbxQqpGwucHkfiSZf12mgvbtgOkD9Q8R4krySPRJZGB-aqxSxyyDIZs84Cp4TWh7uz6wrA/exec?legajo=${legajo}&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Respuesta inválida");
    }

    localStorage.setItem("asignaciones", JSON.stringify(data));
    mostrarAsignaciones(data);

  } catch (err) {
    console.error(err);

    if (cache) {
      alert("Sin conexión. Mostrando datos guardados.");
      mostrarAsignaciones(JSON.parse(cache));
    } else {
      alert("Error al consultar.");
    }
  }

  loader.classList.add("hidden");
});

// 🔥 MOSTRAR DATOS (con total incluido)
function mostrarAsignaciones(data) {
  const lista = document.getElementById("asignaciones");
  lista.innerHTML = "";

  if (!data.asignaciones || data.asignaciones.length === 0) {
    lista.innerHTML = "<li>No hay asignaciones.</li>";
    return;
  }

  let totalHoras = 0;

  data.asignaciones.forEach(a => {
    const esOff = a.Trabaja && a.Trabaja.toLowerCase().includes("off");

    let horas = 0;

    if (!esOff && a.Entrada && a.Salida) {
      horas = calcularHoras(a.Entrada, a.Salida);
      totalHoras += horas;
    }

    const li = document.createElement("li");
    li.classList.add("fila-asignacion");

    li.innerHTML = `
      <span class="col-fecha">${a.Fecha}</span>
      <span class="col-hora">${esOff ? "OFF" : `${a.Entrada} a ${a.Salida}`}</span>
      <span class="col-tiempo">${esOff ? "OFF" : horas.toFixed(2) + " hs"}</span>
    `;

    lista.appendChild(li);
  });

  // 🔥 TOTAL
  const total = document.createElement("li");
  total.classList.add("fila-asignacion");

  total.innerHTML = `
    <span class="col-fecha"><strong>Total</strong></span>
    <span class="col-hora"></span>
    <span class="col-tiempo"><strong>${totalHoras.toFixed(2)} hs</strong></span>
  `;

  lista.appendChild(total);
}

// 🔹 cálculo de horas (soporta noche)
function calcularHoras(entrada, salida) {
  const [h1, m1] = entrada.split(":").map(Number);
  const [h2, m2] = salida.split(":").map(Number);

  const inicio = new Date(0, 0, 0, h1, m1);
  const fin = new Date(0, 0, salida < entrada ? 1 : 0, h2, m2);

  return (fin - inicio) / (1000 * 60 * 60);
}
