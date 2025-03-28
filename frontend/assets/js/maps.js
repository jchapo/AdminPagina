let map;
let mapIdGlobal = null;
let markersMap = {};
let markers = [];
let recojosFiltrados = [];
let recojosLista = [];
let globalInfoWindow;
let colorAssignments = {};
const availableColors = [
    { background: '#cfe2ff', text: '#0d6efd', border: '#9ec5fe' }, // primary
    { background: '#e2e3e5', text: '#6c757d', border: '#b1b4b6' }, // secondary
    { background: '#d1e7dd', text: '#198754', border: '#a3cfbb' }, // success
    { background: '#f8d7da', text: '#dc3545', border: '#f1aeb5' }, // danger
    { background: '#fff3cd', text: '#ffc107', border: '#ffe69c' }, // warning
    { background: '#cff4fc', text: '#0dcaf0', border: '#9eeaf9' }, // info
    { background: '#e0cffc', text: '#6610f2', border: '#c5b3f6' }, // purple
    { background: '#ffedd5', text: '#fd7e14', border: '#ffdaa5' }, // orange
    { background: '#f8f9fa', text: '#adb5bd', border: '#dfe3e6' }, // light
    { background: '#dee2e6', text: '#212529', border: '#bfc6cc' }  // dark
];


const API_URL = 'http://localhost:3000/api/recojos';


function loadGoogleMapsApi() {
    fetch('/api/google-maps-key')
        .then(response => response.json())
        .then(data => {
            if (!data.apiKey) {
                console.error("No se recibió una API Key.");
                return;
            }
            mapIdGlobal = data.mapId;

            let script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&map_ids=${data.mapId}&callback=initMap&libraries=marker&loading=async`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        })
        .catch(error => console.error("Error al obtener la API Key:", error));
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -12.0464, lng: -77.0428 },
        zoom: 12,
        mapId: mapIdGlobal
    });

    globalInfoWindow = new google.maps.InfoWindow();
    cargarMarcadores();
}


function getColorForMotorizado(motorizadoName) {
    if (!motorizadoName || motorizadoName === "Asignar Recojo") {
        return { background: "#ffffff", text: "#333333", border: "#cccccc" };
    }
    
    if (!colorAssignments[motorizadoName]) {
        const hash = motorizadoName.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        colorAssignments[motorizadoName] = availableColors[Math.abs(hash) % availableColors.length];
    }
    
    return colorAssignments[motorizadoName];
}


function createCustomMarkerIcon(colorConfig, initial) {
    const { background, text, border } = colorConfig;
    
    // Crear un canvas dinámico para el marcador
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const context = canvas.getContext('2d');
    
    // Dibujar círculo exterior (fondo)
    context.beginPath();
    context.arc(20, 20, 18, 0, 2 * Math.PI);
    context.fillStyle = background;
    context.fill();
    
    // Dibujar borde (más oscuro del mismo color)
    context.lineWidth = 3;
    context.strokeStyle = border;
    context.stroke();
    
    // Texto en el centro (más intenso)
    context.fillStyle = text;
    context.font = 'bold 14px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(initial || '?', 20, 20);
    
    return {
        url: canvas.toDataURL(),
        scaledSize: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 20)
    };
}


async function obtenerListaRecojos() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        recojosFiltrados = data.filter(row => row.fechaAnulacionPedido === null);
        
        if (recojosFiltrados) {
            return recojosFiltrados.map(recojo => ({
                id: recojo.id,  
                proveedorNombre: recojo.proveedorNombre || "Proveedor Desconocido",
                motorizadoRecojo: recojo.motorizadoRecojo || "Asignar Recojo"
            }));
        }

        return [];
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return [];
    }
}

async function cargarMarcadores() {
    recojosLista = await obtenerListaRecojos();
    
    renderizarListaRecojos();

    markers.forEach(marker => marker.setMap(null));
    markers = [];
    colorAssignments = {};
    markersMap = {};

    const bounds = new google.maps.LatLngBounds();

    recojosFiltrados.forEach(row => {
        if (row.recojoCoordenadas?.lat && row.recojoCoordenadas?.lng) {
            const markerColor = getColorForMotorizado(row.motorizadoRecojo);
            const initial = getMotorizadoInitial(row.motorizadoRecojo);
            
            const position = new google.maps.LatLng(row.recojoCoordenadas.lat, row.recojoCoordenadas.lng);
            bounds.extend(position); // Expandir los límites con cada marcador
            
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: map,
                position: position,
                title: `Motorizado: ${row.motorizadoRecojo || 'No asignado'}\nProveedor: ${row.proveedorNombre}\nCliente: ${row.clienteNombre}`,
                content: (() => {
                    const img = document.createElement("img");
                    img.src = createCustomMarkerIcon(markerColor, initial).url;
                    img.style.width = "40px";
                    img.style.height = "40px";
                    return img;
                })()
            });

            marker.addListener('gmp-click', () => {
                const infoWindowContent = `
                    <strong>Proveedor:</strong> ${row.proveedorNombre}<br>
                    <strong>Cliente:</strong> ${row.clienteNombre}
                `;
            
                globalInfoWindow.setContent(infoWindowContent);
                globalInfoWindow.open(map, marker);
            
                // Esperar a que el InfoWindow se abra y modificar el contenedor vacío
                setTimeout(() => {
                    const titleContainer = document.querySelector('.gm-style-iw-ch');
                    if (titleContainer) {
                        titleContainer.innerHTML = `<strong style="color: ${markerColor.background === 'ffffff' ? '#333' : markerColor.border}; font-size: 1.5em;">
                        ${row.motorizadoRecojo || 'No asignado'}
                    </strong>`;
                        titleContainer.style.fontSize = "1.2em";
                        titleContainer.style.padding = "10px";
                        titleContainer.style.textAlign = "center";
                    }
                }, 100);
            });
            
            

            markers.push(marker);
            markersMap[row.id] = marker;
        }
    });

    if (markers.length > 0) {
        globalInfoWindow.close();
        map.fitBounds(bounds); // Ajustar el mapa a los límites de los marcadores
    } else {
        map.setCenter({ lat: -12.0464, lng: -77.0428 }); // Fallback si no hay marcadores
        map.setZoom(12);
    }
}


document.addEventListener("DOMContentLoaded", loadGoogleMapsApi);

const zonas = {
    "motorizadoEste": "ME",
    "motorizadoSur": "MS",
    "motorizadoNorte": "MN",
    "motorizadoOeste": "MO",
    "motorizadoSJL": "SJL"
};

function getMotorizadoInitial(motorizadoName) {
    if (!motorizadoName) return '?';


    // Buscar si el nombre del motorizado coincide con alguna zona
    for (const key in zonas) {
        if (motorizadoName.includes(key)) {
            return zonas[key];
        }
    }

    // Si no coincide con ninguna zona, usar la inicial normal
    return motorizadoName.charAt(0).toUpperCase();
}

  const coloresMotorizados = {
    "motorizadoEste": "bg-label-primary",
    "motorizadoSur": "bg-label-danger",
    "motorizadoNorte": "bg-label-success",
    "motorizadoOeste": "bg-label-info",
    "motorizadoSJL": "bg-label-warning",
    "Asignar Recojo": "bg-label-light"
  };

  function getMotorizadoInitial(motorizado) {
    return zonas[motorizado] || "?";
  }


  


  async function actualizarMotorizadoEnFirebase(id, nuevoMotorizado) {
    const url = `${API_URL}/${id}`;

    const updatedRecojo = { motorizadoRecojo: nuevoMotorizado };

    try {
        // Mostrar loader
        Loader.show('Actualizando motorizado...', 'wave');
        
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedRecojo)
      });

      if (!response.ok) throw new Error("Error en la actualización en el servidor.");

        // Cambiar mensaje antes de ocultar (opcional)
        Loader.changeMessage('¡Actualización completada!');
        await new Promise(resolve => setTimeout(resolve, 800));

        await cargarMarcadores();

      return response.json();
    } catch (error) {
        // Cambiar a mensaje de error
        Loader.changeMessage('Error al actualizar');
        await new Promise(resolve => setTimeout(resolve, 1500));
        throw error;
    } finally {
        // Ocultar loader
        Loader.hide();
    }
  }


  function renderizarListaRecojos() {
    
    recojosLista.sort((a, b) => {
        if (a.motorizadoRecojo === "Asignar Recojo" && b.motorizadoRecojo !== "Asignar Recojo") {
            return -1; // a va primero
        }
        if (b.motorizadoRecojo === "Asignar Recojo" && a.motorizadoRecojo !== "Asignar Recojo") {
            return 1; // b va primero
        }
        return a.motorizadoRecojo.localeCompare(b.motorizadoRecojo); // Ordenar alfabéticamente por motorizado
    });
    
    const recojoList = document.getElementById("recojoList");
    recojoList.innerHTML = "";
    recojosLista.forEach(recojo => {
        const initial = getMotorizadoInitial(recojo.motorizadoRecojo);
        const colorConfig = getColorForMotorizado(recojo.motorizadoRecojo);

        const isUnassigned = !recojo.motorizadoRecojo || recojo.motorizadoRecojo === "Asignar Recojo";

        const btnClass = isUnassigned ? "btn-warning" : "btn-primary";

        const listItem = document.createElement("li");
        listItem.className = `d-flex align-items-center justify-content-between mb-3 w-100 rounded`;

        listItem.innerHTML = `
        <div class="d-flex align-items-center w-100">
            <div class="avatar flex-shrink-0 me-3" 
                style=" 
                       --border-color: 2px solid ${colorConfig.border}; 
                       --bs-avatar-initial-bg: ${colorConfig.background};">
                <span class="avatar-initial rounded-circle" 
                      style="color: ${colorConfig.text}; font-weight: bold;">
                    ${initial}
                </span>
            </div>
            <div class="flex-grow-1">
                <h6 class="mb-0 fw-normal">${recojo.proveedorNombre}</h6>
                <small class="motorizadoText">${recojo.motorizadoRecojo || "Sin asignar"}</small>
            </div>
        </div>
        <div class="d-flex align-items-center gap-2">
            <select class="form-select form-select-sm motorizadoSelect" style="width: 160px;">
            <option value="" ${isUnassigned ? "selected" : ""}>Asignar Recojo</option>
            <option value="motorizadoNorte" ${recojo.motorizadoRecojo === "motorizadoNorte" ? "selected" : ""}>M. Norte</option>
            <option value="motorizadoSur" ${recojo.motorizadoRecojo === "motorizadoSur" ? "selected" : ""}>M. Sur</option>
            <option value="motorizadoEste" ${recojo.motorizadoRecojo === "motorizadoEste" ? "selected" : ""}>M. Este</option>
            <option value="motorizadoOeste" ${recojo.motorizadoRecojo === "motorizadoOeste" ? "selected" : ""}>M. Oeste</option>
            <option value="motorizadoSJL" ${recojo.motorizadoRecojo === "motorizadoSJL" ? "selected" : ""}>M. SJL</option>
            </select>
            <button class="btn btn-sm ${btnClass} actualizarMotorizadoBtn">Actualizar</button>
        </div>
        `;

        listItem.addEventListener("click", () => {
            const marker = markersMap[recojo.id]; // Buscar el marcador por ID
            if (marker) {
                map.panTo(marker.position); // Centrar el mapa en el marcador
                mostrarInfoWindow(marker, recojo); // Mostrar el InfoWindow
            }
        });

        recojoList.appendChild(listItem);

        const select = listItem.querySelector(".motorizadoSelect");
        const actualizarBtn = listItem.querySelector(".actualizarMotorizadoBtn");
        const motorizadoText = listItem.querySelector(".motorizadoText");

        actualizarBtn.addEventListener("click", async () => {
        const nuevoMotorizado = select.value;
        
        try {
            await actualizarMotorizadoEnFirebase(recojo.id, nuevoMotorizado);

        } catch (error) {
            console.error("Error al actualizar motorizado:", error);
            alert("No se pudo actualizar el motorizado.");
        }
        });
    });
}

function mostrarInfoWindow(marker, row) {
    const colorConfig = getColorForMotorizado(row.motorizadoRecojo);
    const infoWindowContent = `
        <strong style="color: ${colorConfig.text};">${row.motorizadoRecojo}</strong><br>
        <strong>Proveedor:</strong> ${row.proveedorNombre}<br>
        <strong>Cliente:</strong> ${row.clienteNombre}
    `;
    globalInfoWindow.setContent(infoWindowContent);
    globalInfoWindow.open(map, marker);
}


// Funciones para manejar el loader
const Loader = {
    show: function(message = 'Cargando...', type = 'spinner') {
        // Crear el elemento del loader si no existe
        let loader = document.getElementById('full-page-loader');
        
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'full-page-loader';
            loader.className = 'full-page-loader';
            
            let spinner;
            if (type === 'wave') {
                spinner = document.createElement('div');
                spinner.className = 'sk-wave';
                spinner.innerHTML = `
                    <div class="sk-rect"></div>
                    <div class="sk-rect"></div>
                    <div class="sk-rect"></div>
                `;
            } else {
                spinner = document.createElement('div');
                spinner.className = 'loader-spinner';
            }
            
            const text = document.createElement('div');
            text.className = 'loader-text';
            text.textContent = message;
            
            loader.appendChild(spinner);
            loader.appendChild(text);
            document.body.appendChild(loader);
        } else {
            // Actualizar mensaje si el loader ya existe
            const text = loader.querySelector('.loader-text');
            if (text) text.textContent = message;
        }
    },
    
    hide: function() {
        const loader = document.getElementById('full-page-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
            }, 300); // Pequeña animación al ocultar
        }
    },
    
    changeMessage: function(newMessage) {
        const loader = document.getElementById('full-page-loader');
        if (loader) {
            const text = loader.querySelector('.loader-text');
            if (text) text.textContent = newMessage;
        }
    }
};