document.addEventListener("DOMContentLoaded", function () {
    const API_URL = 'http://localhost:3000/api/recojos';
    const recojoForm = document.getElementById('recojoForm');
    const recojoModal = new bootstrap.Modal(document.getElementById('backDropModal')); // Inicializar el modal

    // Inicializar Select2 para los dropdowns
    const selects = document.querySelectorAll('.select2');
    selects.forEach(select => {
        $(select).select2({
            dropdownParent: $(select).parent()
        });
    });

    function generateUniqueId() {
        const now = new Date();
        const padToTwoDigits = (num) => num.toString().padStart(2, '0');
    
        const day = padToTwoDigits(now.getDate());
        const month = padToTwoDigits(now.getMonth() + 1);
        const year = now.getFullYear();
        const hours = padToTwoDigits(now.getHours());
        const minutes = padToTwoDigits(now.getMinutes());
        const seconds = padToTwoDigits(now.getSeconds());
        const randomId = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
        return `${day}-${month}-${year}-${hours}${minutes}${seconds}-${randomId}`;
    }

    function capitalizeWords(str) {
        return str
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    const formValidation = FormValidation.formValidation(recojoForm, {
        fields: {
            fechaEntrega: {
                validators: {
                    notEmpty: { message: 'La fecha de entrega es requerida' },
                    date: { format: 'DD-MM-YYYY', message: 'La fecha no es válida' }
                }
            },
            proveedorName: {
                validators: {
                    notEmpty: { message: 'El nombre del proveedor es requerido' },
                    stringLength: { min: 3, max: 100, message: 'Debe tener entre 3 y 100 caracteres' }
                }
            },
            proveedorTelefono: {
                validators: {
                    notEmpty: { message: 'El teléfono es requerido' },
                    regexp: { regexp: /^\d{9}$/, message: 'Debe tener 9 dígitos' }
                }
            },
            proveedorDistrito: { validators: { notEmpty: { message: 'Debe seleccionar un distrito' } } },
            clienteName: {
                validators: {
                    notEmpty: { message: 'El nombre del cliente es requerido' },
                    stringLength: { min: 3, max: 100, message: 'Debe tener entre 3 y 100 caracteres' }
                }
            },
            proveedorDireccionLink: {
                validators: {
                    notEmpty: { message: 'La dirección es requerida' },
                    stringLength: { min: 5, max: 200, message: 'Debe tener entre 5 y 200 caracteres' }
                }
            },
            clienteTelefono: {
                validators: {
                    notEmpty: { message: 'El teléfono es requerido' },
                    regexp: { regexp: /^\d{9}$/, message: 'Debe tener 9 dígitos' }
                }
            },
            clienteDistrito: { validators: { notEmpty: { message: 'Debe seleccionar un distrito' } } },
            pedidoDireccionLink: {
                validators: {
                    notEmpty: { message: 'La dirección es requerida' },
                    stringLength: { min: 5, max: 200, message: 'Debe tener entre 5 y 200 caracteres' }
                }
            },
            cantidadCobrar: {
                validators: {
                    notEmpty: { message: 'La cantidad a cobrar es requerida' },
                    numeric: { message: 'Debe ser numérico', decimalSeparator: '.' }
                }
            },
            metodoPago: { validators: { notEmpty: { message: 'Debe seleccionar un método de pago' } } },
            comisionTarifa: {
                validators: {
                    notEmpty: { message: 'La comisión de tarifa es requerida' },
                    numeric: { message: 'Debe ser numérico', decimalSeparator: '.' }
                }
            },
            motorizadoRecojo: {
                validators: {
                    notEmpty: { message: 'Debe seleccionar un motorizado para recojo' }
                }
            },
            motorizadoEntrega: {
                validators: {
                    notEmpty: { message: 'Debe seleccionar un motorizado para entrega' }
                }
            }
        },
        plugins: {
            trigger: new FormValidation.plugins.Trigger(),
            bootstrap5: new FormValidation.plugins.Bootstrap5({
                eleValidClass: '',
                rowSelector: '.form-control-validation'
            }),
            submitButton: new FormValidation.plugins.SubmitButton(),
            autoFocus: new FormValidation.plugins.AutoFocus()
        },
        init: instance => {
            instance.on('plugins.message.placed', function (e) {
                if (e.element.parentElement.classList.contains('input-group')) {
                    e.element.parentElement.insertAdjacentElement('afterend', e.messageElement);
                }
            });
        }
    });

    // Manejo de Select2 para revalidación
    const select2Elements = document.querySelectorAll('.select2');
    select2Elements.forEach(element => {
        $(element).on('change', function () {
            formValidation.revalidateField(element.id);
        });
    });

    // Función para limpiar el formulario
    function clearForm() {
        recojoForm.reset(); // Limpia todos los campos del formulario
        recojoForm.removeAttribute('data-edit-id'); // Elimina el atributo de edición
        document.getElementById('recojoModalLabel').textContent = 'Nueva Entrega'; // Restaurar título
        document.querySelector('#recojoForm button[type="submit"]').textContent = 'Guardar'; // Restaurar texto del botón
    }


    // Capturar el envío con AJAX en lugar del DefaultSubmit
    formValidation.on('core.form.valid', async function () {
        const formData = new FormData(recojoForm);
        const isEdit = recojoForm.hasAttribute('data-edit-id');
        const docId = isEdit ? recojoForm.getAttribute('data-edit-id') : generateUniqueId();
    
        // Obtener el valor de comisionTarifa (puede ser automático o manual)
        const comisionTarifa = parseFloat(document.getElementById('comisionTarifa').value);
    
        // Format data
        const proveedorNombre = formData.get('proveedorName').toUpperCase();
        const proveedorDireccionLink = String(formData.get('proveedorDireccionLink') || '').trim();
        const pedidoDireccionLink = String(formData.get('pedidoDireccionLink') || '').trim();
        const clienteNombreFormatted = capitalizeWords(formData.get('clienteName'));
        const cantidadCobrarFormatted = parseFloat(formData.get('cantidadCobrar')).toFixed(2);
        const pedidoSeCobraValor = (cantidadCobrarFormatted === "0.00" || cantidadCobrarFormatted === "0") ? "No" : "Si";
        const fechaEntrega = formData.get('fechaEntrega'); // Assuming this is in DD-MM-YYYY format
        const [day, month, year] = fechaEntrega.split('-');
        const formattedFechaEntrega = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD
    
        try {
            // Use await to get coordinates
            const coordenadas = await procesarEntrada(proveedorDireccionLink);
            console.log("Coordenadas proveedor:", coordenadas);
            
            const coordenadas2 = await procesarEntrada(pedidoDireccionLink);
            console.log("Coordenadas pedido:", coordenadas2);
            
            
            const newRecojo = {
            id: docId,
            proveedorNombre: proveedorNombre,
            proveedorTelefono: formData.get('proveedorTelefono'),
            proveedorDistrito: formData.get('proveedorDistrito'),
            proveedorDireccionLink: formData.get('proveedorDireccionLink'),
            clienteNombre: clienteNombreFormatted,
            clienteTelefono: formData.get('clienteTelefono'),
            clienteDistrito: formData.get('clienteDistrito'),
            pedidoDetalle: formData.get('pedidoDetalle'),
            fechaEntregaPedido: formattedFechaEntrega,
            pedidoObservaciones: formData.get('observaciones'),
            pedidoSeCobra: pedidoSeCobraValor,
            pedidoMetodoPago: formData.get('metodoPago'),
            pedidoCantidadCobrar: cantidadCobrarFormatted,
            pedidoDireccionLink: formData.get('pedidoDireccionLink'),
            
            fechaRecojoPedidoMotorizado: null,
            fechaAnulacionPedido: null,
            fechaAsignaciónPedido: null,
            fechaEntregaPedidoMotorizado: null,
            motorizadoRecojo: formData.get('motorizadoRecojo'),
            motorizadoEntrega: formData.get('motorizadoEntrega'),
            pedidoFotoEntrega: null,
            thumbnailFotoRecojo: null,
            thumbnailFotoEntrega: null,
            comisionTarifa: comisionTarifa,
            supera30x30: document.getElementById('supera30x30').checked ? 1 : 0,
            
            pedidoFotoRecojo: coordenadas ? {"lat": parseFloat(coordenadas.latitud),"lng": parseFloat(coordenadas.longitud)} : null,
            pedidoCoordenadas: coordenadas2 ? {"lat": parseFloat(coordenadas2.latitud),"lng": parseFloat(coordenadas2.longitud)} : null,
            
            recojoCoordenadas: null,
        };
    
        // Si es una edición, no incluir fechaCreacionPedido
        if (!isEdit) {
            newRecojo.fechaCreacionPedido = new Date().toISOString();
        }
    
        const url = isEdit ? `${API_URL}/${docId}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';
    
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRecojo)
        })
            .then(response => response.json())
            .then(data => {
                // Limpiar el formulario y cerrar el modal
                document.querySelector('.btn-close[data-bs-dismiss="modal"]').click();
    
                // Recargar la lista de recojos si es necesario
                if (typeof loadRecojos === 'function') {
                    loadRecojos();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Hubo un problema con el envío');
            });
        } catch (error) {
            console.error("Error processing coordinates:", error);
          }
        });

    // Función para cargar recojos
    function loadRecojos() {
        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                // Limpiar la tabla actual
                o.clear();

                // Agregar los nuevos datos a la tabla
                o.rows.add(data).draw();

                console.log('Tabla actualizada correctamente');
            })
            .catch(error => {
                console.error('Error al cargar recojos:', error);
            });
    }

    // Event listener para el botón de confirmar eliminación
    document.getElementById('confirmDeleteButton').addEventListener('click', function () {
        // Obtener el ID del registro a eliminar
        const recordId = this.getAttribute('data-id');

        // Llamar a la función para eliminar el registro
        deleteRecord(recordId);

        // Cerrar el modal de confirmación
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
        deleteModal.hide();
    });

    // Función para eliminar el registro
    function deleteRecord(recordId) {
        fetch(`${API_URL}/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                //console.log('Registro eliminado:', data);

                // Recargar la lista de recojos si es necesario
                if (typeof loadRecojos === 'function') {
                    loadRecojos();
                }

                // Mostrar un mensaje de éxito (opcional)
                //alert('Registro eliminado correctamente');
            })
            .catch(error => {
                console.error('Error al eliminar el registro:', error);
                alert('Hubo un problema al eliminar el registro');
            });
    }

    function esURL(texto) {
        // Verificar si el texto comienza con http:// o https:// o www.
        if (texto.startsWith('http://') || texto.startsWith('https://') || texto.startsWith('www.')) {
            console.log("esURL");
            return true;
          
        }
        
        // Verificar si tiene un dominio común
        const dominiosComunes = ['.com', '.org', '.net', '.gob', '.edu', '.pe', '.maps'];
        if (dominiosComunes.some(dominio => texto.includes(dominio))) {
          return true;
        }
        
        return false;
      }
      
      async function expandUrl(url) {
        try {
            const response = await fetch(`https://unshorten.me/s/${url}`); // Usar unshorten.me para expandir URLs
            const longUrl = await response.text(); // Retorna un string directamente
            
            console.log("URL expandida:", longUrl);
            return longUrl;
        } catch (error) {
            console.error("Error al expandir la URL:", error);
            return url;
        }
    }
    
      
      function extraerCoordenadasURL(url) {
        // Decodificar URL para manejar caracteres especiales
        const decodedUrl = decodeURIComponent(url);
        
        // Método 1: Buscar el patrón @latitud,longitud (común en URLs de Google Maps)
        const regexAt = /@(-1[1-2]\.\d+),(-7[6-7]\.\d+)/;
        const matchAt = decodedUrl.match(regexAt);
        if (matchAt) {
          return {
            latitud: matchAt[1],
            longitud: matchAt[2]
          };
        }
        
        // Método 2: Extraer desde parámetros de consulta
        try {
          const urlObj = new URL(url);
          const params = new URLSearchParams(urlObj.search);
          
          // Opción 1: Parámetro 'q' directo (formato latitud,longitud)
          if (params.has('q')) {
            const coords = params.get('q').split(',');
            if (coords.length === 2) {
              const lat = parseFloat(coords[0]);
              const lng = parseFloat(coords[1]);
              if (lat >= -12.999999 && lat <= -11.000000 && lng >= -77.999999 && lng <= -76.000000) {
                return {
                  latitud: lat.toFixed(6),
                  longitud: lng.toFixed(6)
                };
              }
            }
          }
        } catch (e) {
          // Si hay un error al parsear la URL, continuamos con otros métodos
        }
        
        // Método 3: Buscar coordenadas en cualquier parte de la URL
        const regexLat = /(-1[1-2]\.\d+)/g;
        const regexLng = /(-7[6-7]\.\d+)/g;
        
        const latMatches = [...decodedUrl.matchAll(regexLat)].map(m => m[1]);
        const lngMatches = [...decodedUrl.matchAll(regexLng)].map(m => m[1]);
        
        if (latMatches.length > 0 && lngMatches.length > 0) {
          for (const lat of latMatches) {
            for (const lng of lngMatches) {
              // Verificar que las coordenadas estén en el rango apropiado
              const latFloat = parseFloat(lat);
              const lngFloat = parseFloat(lng);
              if (latFloat >= -12.999999 && latFloat <= -11.000000 && 
                  lngFloat >= -77.999999 && lngFloat <= -76.000000) {
                return {
                  latitud: lat,
                  longitud: lng
                };
              }
            }
          }
        }
        
        // Método 4: Buscar en fragmentos de URL específicos
        const lat3dMatch = decodedUrl.match(/!3d(-1[1-2]\.\d+)/);
        const lng4dMatch = decodedUrl.match(/!4d(-7[6-7]\.\d+)/);
        
        if (lat3dMatch && lng4dMatch) {
          return {
            latitud: lat3dMatch[1],
            longitud: lng4dMatch[1]
          };
        }
        
        return null;
      }
      
      async function obtenerCoordenadasGeocoding(direccion) {
        // Añadir contexto "Lima, Perú" si no está especificado
        if (!direccion.toLowerCase().includes("lima") && 
            !direccion.toLowerCase().includes("perú") && 
            !direccion.toLowerCase().includes("peru")) {
          direccion += ", Lima, Perú";
        }
        
        // API Key de Geocoding
        const API_KEY = 'AIzaSyCRW58a_3iVfoD1WFCU7UbtZ9dZddw-L9w';
        
        // Codificar la dirección para la URL
        const direccionCodificada = encodeURIComponent(direccion);
        
        // Construir la URL de la API
        const urlGeocoding = `https://maps.googleapis.com/maps/api/geocode/json?address=${direccionCodificada}&key=${API_KEY}`;
        
        try {
          // Realizar la petición HTTP
          // Dependiendo del entorno, usa fetch o UrlFetchApp
          let data;
          
          if (typeof UrlFetchApp !== 'undefined') {
            // Si estamos en Google Apps Script
            const response = UrlFetchApp.fetch(urlGeocoding);
            data = JSON.parse(response.getContentText());
          } else {
            // Si estamos en un entorno de navegador moderno
            const response = await fetch(urlGeocoding);
            data = await response.json();
          }
          
          if (data.status === 'OK') {
            const lat = data.results[0].geometry.location.lat;
            const lng = data.results[0].geometry.location.lng;
            
            // Verificar que las coordenadas estén en el rango apropiado para Lima
            if (lat >= -12.999999 && lat <= -11.000000 && lng >= -77.999999 && lng <= -76.000000) {
              return {
                latitud: lat.toFixed(6),
                longitud: lng.toFixed(6)
              };
            } else {
              // Si están fuera del rango pero parecen válidas, podemos aún devolverlas
              return {
                latitud: lat.toFixed(6),
                longitud: lng.toFixed(6)
              };
            }
          } else {
            console.log("Error en Geocoding API: " + data.status);
            return null;
          }
        } catch (e) {
          console.error("Error en la petición de geocodificación:", e);
          return null;
        }
      }
      
      function extraerNombreLugar(url) {
        const decodedUrl = decodeURIComponent(url);
        
        // Intenta extraer nombre del lugar desde el formato /place/NOMBRE/data=
        const placeMatch = decodedUrl.match(/\/place\/(.*?)(\/data=|\/\@)/);
        if (placeMatch) {
          let lugar = placeMatch[1];
          lugar = lugar.replace(/\+/g, ' ').replace(/%20/g, ' ').replace(/%2C/g, ',');
          return lugar;
        }
        
        return null;
      }
      
      function extraerNombreLugar2(url) {
        const decodedUrl = decodeURIComponent(url);
        
        const placeMatch = decodedUrl.match(/\/maps\?q=(.*?)&ftid/);
        if (placeMatch) {
          let lugar = placeMatch[1];
          lugar = lugar.replace(/\+/g, ' ').replace(/%20/g, ' ').replace(/%2C/g, ',');
          return lugar;
        }
        
        return null;
      }
      
      async function obtenerCoordenadasDesdeURL(url) {
        // Verificar si las coordenadas ya están en la URL original
        let coords = extraerCoordenadasURL(url);
        if (coords) {
          return coords;
        }
      
        try {
            const expandedUrl = await expandUrl(url);
            console.log(`URL expandida: ${expandedUrl}`);
      
          
          // Si la URL contiene "sorry", es posible que Google esté bloqueando
          if (expandedUrl.includes("google.com/sorry")) {
            const continueMatch = expandedUrl.match(/continue=([^&]+)/);
            if (continueMatch) {
              const originalContinueUrl = decodeURIComponent(continueMatch[1]);
              
              // Intentar extraer coordenadas de esta URL
              coords = extraerCoordenadasURL(originalContinueUrl);
              if (coords) {
                return coords;
              }
              
              // Si no se encontraron coordenadas, intentar extraer el nombre del lugar
              const lugar = extraerNombreLugar(originalContinueUrl);
              if (lugar) {
                // Intentar obtener coordenadas a partir del nombre del lugar
                coords = obtenerCoordenadasGeocoding(lugar);
                if (coords) {
                  return coords;
                }
              }
            }
          }
      
          // Intentar extraer coordenadas desde la URL expandida
          coords = extraerCoordenadasURL(expandedUrl);
          if (coords) {
            return coords;
          }
      
          // Verificar si la URL contiene "/place/"
          if (expandedUrl.includes("/place/")) {
            const lugar = extraerNombreLugar(expandedUrl);
            if (lugar) {
              coords = obtenerCoordenadasGeocoding(lugar);
              if (coords) {
                return coords;
              }
            }
          }
      
          // Verificar si la URL contiene "/place/"
          if (expandedUrl.includes("maps?q=")) {
            const lugar = extraerNombreLugar2(expandedUrl);
            if (lugar) {
              coords = obtenerCoordenadasGeocoding(lugar);
              if (coords) {
                return coords;
              }
            }
          }
      
          // Verificar si la URL contiene "%3Fq%3D"
          else if (expandedUrl.includes("%3Fq%3D")) {
            const qMatch = expandedUrl.match(/%3Fq%3D(.*?)(%26|\Z)/);
            if (qMatch) {
              let texto = decodeURIComponent(qMatch[1]);
              while (texto.includes('%') && /[0-9a-fA-F]/.test(texto)) {
                const textoNuevo = decodeURIComponent(texto);
                if (textoNuevo === texto) {
                  break;
                }
                texto = textoNuevo;
              }
              coords = obtenerCoordenadasGeocoding(texto);
              if (coords) {
                return coords;
              }
            }
          }
      
          return null;
        } catch (error) {
            console.error("Error expanding URL:", error);
            return null;
          }
        }
      
      async function procesarEntrada(entrada) {
        // Convertir a string y eliminar espacios innecesarios
        const texto = String(entrada || "").trim();  
        
        console.log("Entrada procesada:", texto);
        
        if (esURL(texto)) {
          return await obtenerCoordenadasDesdeURL(texto);
        } else {
          return await obtenerCoordenadasGeocoding(texto);
        }
      }
    
    
    
    
});