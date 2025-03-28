let map;
let markers = [];
let globalInfoWindow;
let colorAssignments = {};
const availableColors = [
    '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF',
    '#FFA500', '#A52A2A', '#800080', '#008000', '#000080'
];

function loadGoogleMapsApi() {
    fetch('/api/google-maps-key')
        .then(response => response.json())
        .then(data => {
            if (!data.apiKey) {
                console.error("No se recibió una API Key.");
                return;
            }

            let script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&callback=initMap&libraries=marker&loading=async`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        })
        .catch(error => console.error("Error al obtener la API Key:", error));
}

function initMap() {
    // Estilo de mapa con menos saturación para mejor contraste
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: -12.0464, lng: -77.0428 },
        zoom: 12,
        styles: [
            {
                featureType: "all",
                elementType: "all",
                stylers: [{ saturation: -50 }, { lightness: 0 }]
            }
        ]
    });

    globalInfoWindow = new google.maps.InfoWindow();
    cargarMarcadores();
}

function getColorForMotorizado(motorizadoName) {
    if (!motorizadoName || motorizadoName === "Asignar Recojo") {
        return 'white'; // Blanco para "Asignar Recojo"
    }
    
    if (!colorAssignments[motorizadoName]) {
        const hash = motorizadoName.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        colorAssignments[motorizadoName] = availableColors[Math.abs(hash) % availableColors.length];
    }
    
    return colorAssignments[motorizadoName];
}

function createCustomMarkerIcon(color, initial) {
    const isWhite = color === 'white';
    
    // Crear un canvas dinámico para el marcador
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const context = canvas.getContext('2d');
    
    // Dibujar círculo exterior
    context.beginPath();
    context.arc(20, 20, 18, 0, 2 * Math.PI);
    context.fillStyle = isWhite ? '#FFFFFF' : color;
    context.fill();
    
    // Borde más visible para marcadores blancos
    context.lineWidth = isWhite ? 3 : 2;
    context.strokeStyle = isWhite ? '#666666' : '#FFFFFF';
    context.stroke();
    
    // Texto en el centro
    context.fillStyle = '#FFFFFF';
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

function cargarMarcadores() {
    fetch('http://localhost:3000/api/recojos')
        .then(response => response.json())
        .then(data => {
            let recojosFiltrados = data.filter(row => row.fechaAnulacionPedido === null);

            markers.forEach(marker => marker.setMap(null));
            markers = [];
            colorAssignments = {};

            recojosFiltrados.forEach(row => {
                if (row.recojoCoordenadas?.lat && row.recojoCoordenadas?.lng) {
                    const markerColor = getColorForMotorizado(row.motorizadoRecojo);
                    const initial = row.motorizadoRecojo ? row.motorizadoRecojo.charAt(0).toUpperCase() : '?';
                    
                    const marker = new google.maps.Marker({
                        map: map,
                        position: { lat: row.recojoCoordenadas.lat, lng: row.recojoCoordenadas.lng },
                        title: `Motorizado: ${row.motorizadoRecojo || 'No asignado'}\nProveedor: ${row.proveedorNombre}\nCliente: ${row.clienteNombre}`,
                        icon: createCustomMarkerIcon(markerColor, initial),
                        zIndex: google.maps.Marker.MAX_ZINDEX + 1
                    });

                    // Añadir sombra para mejor visibilidad
                    const shadow = new google.maps.Marker({
                        map: map,
                        position: { lat: row.recojoCoordenadas.lat, lng: row.recojoCoordenadas.lng },
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#000000',
                            fillOpacity: 0.2,
                            strokeWeight: 0,
                            scale: 22
                        },
                        zIndex: google.maps.Marker.MAX_ZINDEX
                    });

                    marker.addListener('click', () => {
                        marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(() => marker.setAnimation(null), 750);
                        
                        const infoWindowContent = `
                            <div style="max-width: 250px; padding: 10px; background: white; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3)">
                                <div style="font-weight: bold; color: ${markerColor === 'white' ? '#333' : markerColor}; margin-bottom: 5px;">
                                    ${row.motorizadoRecojo || 'No asignado'}
                                </div>
                                <div><strong>Proveedor:</strong> ${row.proveedorNombre}</div>
                                <div><strong>Cliente:</strong> ${row.clienteNombre}</div>
                            </div>
                        `;

                        globalInfoWindow.setContent(infoWindowContent);
                        globalInfoWindow.open(map, marker);
                    });

                    markers.push(marker);
                    markers.push(shadow);
                }
            });
        })
        .catch(error => console.error("Error al obtener los datos:", error));
}

document.addEventListener("DOMContentLoaded", loadGoogleMapsApi);