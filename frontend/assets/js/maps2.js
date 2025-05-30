let map;
let mapIdGlobal = null;
let markersMap = {};
let markers = [];
let entregasFiltradas = [];
let entregasLista = [];
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


const assignedColors = new Set();


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
    map = new google.maps.Map(document.getElementById("map2"), {
        center: { lat: -12.0464, lng: -77.0428 },
        zoom: 12,
        mapId: mapIdGlobal
    });

    globalInfoWindow = new google.maps.InfoWindow();
    cargarMarcadores();
}

function generateRandomColorFromName(name) {
    // Crear un hash a partir del nombre
    const hash = name.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    // Usar el hash para generar un tono de HSL (Hue-Saturation-Lightness)
    const hue = Math.abs(hash) % 360;              // Color en el círculo cromático
    const saturation = 70 + (Math.abs(hash) % 20); // Saturación entre 70-90%
    const lightness = 50 + (Math.abs(hash) % 10);  // Luminosidad entre 50-60%

    const background = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const border = `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`;
    const text = lightness > 60 ? "#222222" : "#ffffff"; // Contraste automático

    return { background, border, text };
}


function getColorForMotorizado(motorizadoName) {
    if (!motorizadoName || motorizadoName === "Asignar Recojo") {
        return { background: "#ffffff", text: "#333333", border: "#ff0000" };
    }

    if (!colorAssignments[motorizadoName]) {
        colorAssignments[motorizadoName] = generateRandomColorFromName(motorizadoName);
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


async function obtenerListaEntregas() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        entregasFiltradas = data.filter(row => row.fechaAnulacionPedido === null);
        
        if (entregasFiltradas) {
            return entregasFiltradas.map(entrega => ({
                id: entrega.id,  
                proveedorNombre: entrega.proveedorNombre || "Proveedor Desconocido",
                clienteNombre: entrega.clienteNombre || "Cliente Desconocido",
                motorizadoEntrega: entrega.motorizadoEntrega || "Asignar Entrega",
                clienteDistrito: entrega.clienteDistrito || "Cliente Desconocido",
                pedidoDireccionLink: entrega.pedidoDireccionLink || "Direccion Desconocida"

            }));
        }

        return [];
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        return [];
    }
}

function isValidUrl(str) {
    const pattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
    return pattern.test(str);
}

async function cargarMarcadores() {
    entregasLista = await obtenerListaEntregas();
    
    renderizarListaEntregas();

    markers.forEach(marker => marker.setMap(null));
    markers = [];
    colorAssignments = {};
    markersMap = {};

    const bounds = new google.maps.LatLngBounds();

    entregasFiltradas.forEach(row => {
        if (row.pedidoCoordenadas?.lat && row.pedidoCoordenadas?.lng) {
            const markerColor = getColorForMotorizado(row.motorizadoEntrega);
            const initial = (row.motorizadoEntrega);
            
            const position = new google.maps.LatLng(row.pedidoCoordenadas.lat, row.pedidoCoordenadas.lng);
            bounds.extend(position); // Expandir los límites con cada marcador
            
            const marker = new google.maps.marker.AdvancedMarkerElement({
                map: map,
                position: position,
                title: `Motorizado: ${row.motorizadoEntrega || 'No asignado'}\nProveedor: ${row.proveedorNombre}\nCliente: ${row.clienteNombre}`,
                content: (() => {
                    const img = document.createElement("img");
                    img.src = createCustomMarkerIcon(markerColor, initial).url;
                    img.style.width = "40px";
                    img.style.height = "40px";
                    return img;
                })()
            });

            marker.addListener('gmp-click', () => {

                let direccionLink = row.pedidoDireccionLink;


                // Si pedidoDireccionLink no es una URL válida, usar Google Maps con las coordenadas
                if (!isValidUrl(direccionLink)) {
                    direccionLink = `https://www.google.com/maps?q=${row.pedidoCoordenadas.lat},${row.pedidoCoordenadas.lng}`;
                }

                const infoWindowContent = `
                    <strong>Proveedor:</strong> ${row.proveedorNombre}<br>
                    <strong>Cliente:</strong> ${row.clienteNombre}<br>
                    <strong>Distrito:</strong> ${row.clienteDistrito}<br>
                    <strong>Dirección:</strong> <a href="${direccionLink}" target="_blank">${direccionLink}</a>
                `;
            
                globalInfoWindow.setContent(infoWindowContent);
                globalInfoWindow.open(map, marker);
            
                // Esperar a que el InfoWindow se abra y modificar el contenedor vacío
                setTimeout(() => {
                    const titleContainer = document.querySelector('.gm-style-iw-ch');
                    if (titleContainer) {
                        titleContainer.innerHTML = `<strong style="color: ${markerColor.background === 'ffffff' ? '#333' : markerColor.border}; font-size: 1.5em;">
                        ${row.motorizadoEntrega || 'No asignado'}
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
        //map.fitBounds(bounds); // Ajustar el mapa a los límites de los marcadores
        map.setZoom(12);
    } else {
        map.setCenter({ lat: -12.0464, lng: -77.0428 }); // Fallback si no hay marcadores
        map.setZoom(12);
    }
}


document.addEventListener("DOMContentLoaded", loadGoogleMapsApi);

const zonas = {
    "EST": "EST",
    "SUR": "SUR",
    "NOR": "NOR",
    "OES": "OES",
    "SJL": "SJL"
};
/*
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
*/
  const coloresMotorizados = {
    "EST": "bg-label-primary",
    "SUR": "bg-label-danger",
    "NOR": "bg-label-success",
    "OES": "bg-label-info",
    "SJL": "bg-label-warning",
    "Asignar Entrega": "bg-label-light"
  };
/*
  function getMotorizadoInitial(motorizado) {
    return zonas[motorizado] || "?";
  }
*/

  


  async function actualizarMotorizadoEnFirebase(id, nuevoMotorizado) {
    const url = `${API_URL}/${id}`;

    const updatedEntrega = { motorizadoEntrega: nuevoMotorizado };

    try {
        // Mostrar loader
        Loader.show('Actualizando motorizado...', 'wave');
        
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEntrega)
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


  function renderizarListaEntregas() {
    
    entregasLista.sort((a, b) => {
        // 1. "Asignar Entrega" siempre primero
        if (a.motorizadoEntrega === "Asignar Entrega" && b.motorizadoEntrega !== "Asignar Entrega") {
            return -1;
        }
        if (b.motorizadoEntrega === "Asignar Entrega" && a.motorizadoEntrega !== "Asignar Entrega") {
            return 1;
        }
    
        // 2. Ordenar por grupo de motorizadoEntrega (si no son "Asignar Entrega")
        const motorizadoComparison = a.motorizadoEntrega.localeCompare(b.motorizadoEntrega);
        if (motorizadoComparison !== 0) {
            return motorizadoComparison;
        }
    
        // 3. Dentro del mismo grupo, ordenar alfabéticamente por proveedorNombre
        return a.proveedorNombre.localeCompare(b.proveedorNombre);
    });
    
    const entregaList = document.getElementById("entregaList");
    entregaList.innerHTML = "";
    entregasLista.forEach(entrega => {
        const initial = (entrega.motorizadoEntrega);
        const colorConfig = getColorForMotorizado(entrega.motorizadoEntrega);

        const isUnassigned = !entrega.motorizadoEntrega || entrega.motorizadoEntrega === "Asignar Entrega";

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
                <h6 class="mb-0 fw-normal">${entrega.proveedorNombre}</h6>
                <small class="motorizadoText">${entrega.clienteDistrito || "Sin asignar"}</small>
            </div>
        </div>
        <div class="d-flex align-items-center gap-2">
            <select class="form-select form-select-sm motorizadoSelect" style="width: 160px;">
            <option value="" ${isUnassigned ? "selected" : ""}>Asignar Entrega</option>
            <option value="NOR" ${entrega.motorizadoEntrega === "NOR" ? "selected" : ""}>M. Norte</option>
            <option value="SUR" ${entrega.motorizadoEntrega === "SUR" ? "selected" : ""}>M. Sur</option>
            <option value="EST" ${entrega.motorizadoEntrega === "EST" ? "selected" : ""}>M. Este</option>
            <option value="OES" ${entrega.motorizadoEntrega === "OES" ? "selected" : ""}>M. Oeste</option>
            <option value="SJL" ${entrega.motorizadoEntrega === "SJL" ? "selected" : ""}>M. SJL</option>
            </select>
            <button class="btn btn-sm ${btnClass} actualizarMotorizadoBtn">Actualizar</button>
        </div>
        `;

        const avatar = listItem.querySelector(".avatar");
        avatar.addEventListener("click", (event) => {
            event.stopPropagation(); // Evitar propagación del clic a otros elementos
    
            const marker = markersMap[entrega.id]; // Buscar el marcador por ID
            if (marker) {
                map.panTo(marker.position); // Centrar el mapa en el marcador
                mostrarInfoWindow(marker, entrega); // Mostrar la información
            }
        });

        entregaList.appendChild(listItem);

        const select = listItem.querySelector(".motorizadoSelect");
        const actualizarBtn = listItem.querySelector(".actualizarMotorizadoBtn");
        const motorizadoText = listItem.querySelector(".motorizadoText");

        actualizarBtn.addEventListener("click", async () => {
        const nuevoMotorizado = select.value;
        
        try {
            await actualizarMotorizadoEnFirebase(entrega.id, nuevoMotorizado);

        } catch (error) {
            console.error("Error al actualizar motorizado:", error);
            alert("No se pudo actualizar el motorizado.");
        }
        });
    });
}

function mostrarInfoWindow(marker, row) {
    const colorConfig = getColorForMotorizado(row.motorizadoEntrega);
    const infoWindowContent = `
        <strong style="color: ${colorConfig.text};">${row.motorizadoEntrega}</strong><br>
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

// Inicializar perfect-scrollbar después de cargar el contenido
const container = document.querySelector('.card-body');
new PerfectScrollbar(container);