let recojosFiltrados = []; // Variable global
let proveedores = []; // Variable global para almacenar los proveedores
let pdfWorker = null;

document.addEventListener("DOMContentLoaded", function () {
    // Esperar autenticación
    function initWhenAuth() {
        if (typeof authManager === 'undefined' || !authManager.getCurrentUser()) {
            setTimeout(initWhenAuth, 500);
            return;
        }
        initDataTable();
    }
    
    function initDataTable() {
    function addCell(tr, content, colSpan = 1) {
        let td = document.createElement('td');
        td.colSpan = colSpan;
        td.textContent = content;
        tr.appendChild(td);
    }

    let tableRecojos = new DataTable('#example', {
        ajax: {
            url: '/api/recojos',
            dataSrc: function (data) {
                recojosFiltrados = data.filter(row => 
                    row.fechaAnulacionPedido === null && 
                    row.fechaEntregaPedidoMotorizado !== null
                );
                console.log(recojosFiltrados);
                return recojosFiltrados;
            },
            beforeSend: function(xhr) {
                    console.log('beforeSend ejecutándose...'); // Para debug
                    const token = localStorage.getItem('authToken');
                    console.log('Token encontrado:', token ? 'SÍ' : 'NO'); // Para debug
                    if (token) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                        console.log('Header Authorization agregado'); // Para debug
                    }
                },
                error: function(xhr, error, thrown) {
                    console.error('Error DataTables:', xhr.status, error);
                    if (xhr.status === 401) {
                        alert('Sesión expirada');
                        window.location.href = '/login.html';
                    }
                }
        },
        columns: [
            { 
                data: 'proveedorNombre',
                render: function (data) {
                    return data || 'Desconocido'; // Evitar "No group"
                }
            },
            { data: 'clienteNombre' },
            { data: 'clienteTelefono' },
            { data: 'clienteDistrito' },
            {
                //data: 'pedidoMetodoPago',  // Mantenemos esta referencia para compatibilidad
                render: function (data, type, row) {
                    // Verificar si existen pagos registrados
                    if (row.pagosRegistrados && Array.isArray(row.pagosRegistrados) && row.pagosRegistrados.length > 0) {
                        let metodosPago = [];
                        
                        // Procesar cada pago registrado
                        row.pagosRegistrados.forEach(pago => {
                            // Determinar el tipo de receptor (la parte antes de la coma)
                            const receptorInfo = pago.receptor ? pago.receptor.split(',') : [];
                            const receptorTipo = receptorInfo.length > 0 ? receptorInfo[0] : '';
                            
                            let clase = 'bg-label-secondary'; // Color por defecto
                            
                            // Asignar clase según el tipo de receptor
                            if (receptorTipo === 'Ñanpi') {
                                clase = 'bg-label-success'; // Verde para Ñanpi
                            } else if (receptorTipo === 'Proveedor') {
                                clase = 'bg-label-info'; // Morado para Proveedor
                            } else if (receptorTipo === 'Motorizado') {
                                clase = 'bg-label-warning'; // Amarillo para Motorizado
                            }
                            
                            // Formar el texto del método de pago con su monto
                            const metodoPagoText = `${pago.metodoPago}: S/ ${parseFloat(pago.monto).toFixed(2)}`;
                            
                            // Agregar el badge HTML con la clase de color correspondiente
                            metodosPago.push(`<span class="badge ${clase} me-1">${metodoPagoText}</span>`);
                        });
                        
                        // Si hay imagen, agregar el icono antes de los badges
                        let icono = '';
                        if (row.pedidoFotoDinero) {
                            icono = `
                                <a href="#" class="ver-imagen me-2" data-url="${row.thumbnailFotoDinero}">
                                    <i class="fas fa-image fa-lg text-primary preview-trigger"></i>
                                </a>
                            `;
                        }
                        
                        // Devolver todos los badges juntos
                        return `${icono}${metodosPago.join(' ')}`;
                    } else {
                        if (row.anuladoCobrado) {   // Si el pedido está anulado, no mostrar pagos
                             // Fallback para cuando no hay pagos registrados
                            let clase = 'bg-label-secondary'; // Color por defecto
                            
                            // Si hay imagen, agregar el icono antes del badge
                            let icono = '';
                            if (row.pedidoFotoDinero) {
                                icono = `
                                    <a>
                                        <i class="fas fa-ban fa-lg"></i>
                                    </a>
                                `;
                            }
                            
                            // Mostrar el método de pago original con un color neutral
                            return `${icono}<span class="badge ${clase}">Cancelado con cobro</span>`;
                        } else {
                            return 'Sin pagos';
                        }
                       
                    }
                }
            }
            ,
            { 
                data: 'comisionTarifa',
                render: function (data) {
                    return data ? `S/ ${parseFloat(data).toFixed(2)}` : 'S/ 0.00';
                }
                
            },
            { 
                data: null, // No hay un campo específico en el JSON, por eso usamos `null`
                render: function (data, type, row) {

                    if (row.anuladoCobrado) { 
                        return '';
                    } else {
                        let comision = parseFloat(row.comisionTarifa) || 0;
                        let cantidadCobrar = parseFloat(row.pedidoCantidadCobrar) || 0;
                        let diferencia = cantidadCobrar - comision;
                        return `S/ ${diferencia.toFixed(2)}`;
                    }
                }
            },
            { 
                data: null, // Se usa null para acceder a múltiples propiedades en render
                render: function (data, type, row) {
                    if (row.anuladoCobrado) { 
                        return '';
                    } else {
                        return row.pedidoCantidadCobrar ? `S/ ${parseFloat(row.pedidoCantidadCobrar).toFixed(2)}` : 'S/ 0.00';
                    }
                }
            }
            
        ],
        language: {
            url: '../assets/es-ES.json',
            paginate: {
                next: '<i class="icon-base bx bx-chevron-right scaleX-n1-rtl icon-sm"></i>',
                previous: '<i class="icon-base bx bx-chevron-left scaleX-n1-rtl icon-sm"></i>'
            }
        },
        order: [[0, 'asc'], [6, 'asc']],
        rowGroup: {
            startRender: null,
            endRender: function (rows, group) {
                let comisionSum = rows
                    .data()
                    .toArray()
                    .reduce((total, row) => total + (parseFloat(row.comisionTarifa) || 0), 0);
            
                // Inicializar variables para los diferentes cálculos
                let ñanpiSum = 0;
                let proveedorSum = 0;
                let motorizadoSum = 0;
                let recibirSum = 0;
                let devolverSum = 0;
                let cobroSum = 0;
            
                // Procesar cada fila de datos
                rows.data().toArray().forEach(row => {
                    // Obtener monto total del pedido y comisión
                    let pedidoTotal = row.anuladoCobrado 
                    ? 0 
                    : (row.pedidoCantidadCobrar ? parseFloat(row.pedidoCantidadCobrar.replace(/[^\d.]/g, '')) || 0 : 0);
                                    let comision = parseFloat(row.comisionTarifa) || 0;
                    
                    // Monto que debería recibir el proveedor (pedido total menos comisión)
                    let montoProveedorIdeal = pedidoTotal - comision;
                    
                    // Sumar al total de cobros
                    cobroSum += pedidoTotal;
                    
                    // Variables para esta fila
                    let montoÑanpi = 0;
                    let montoProveedor = 0;
                    let montoMotorizado = 0;
                    
                    if (row.pagosRegistrados && Array.isArray(row.pagosRegistrados)) {
                        // Recorrer cada pago registrado
                        row.pagosRegistrados.forEach(pago => {
                            const monto = parseFloat(pago.monto) || 0;
                            
                            // Determinar el tipo de receptor basado en el formato "Receptor,Ruta"
                            if (pago.receptor) {
                                const receptorInfo = pago.receptor.split(',');
                                const receptorTipo = receptorInfo[0];
                                
                                // Sumar según el tipo de receptor
                                if (receptorTipo === 'Ñanpi') {
                                    montoÑanpi += monto;
                                    ñanpiSum += monto;
                                } else if (receptorTipo === 'Proveedor') {
                                    montoProveedor += monto;
                                    proveedorSum += monto;
                                } else if (receptorTipo === 'Motorizado') {
                                    montoMotorizado += monto;
                                    motorizadoSum += monto;
                                }
                            }
                        });
                    }

                    // Calcular si el proveedor debe recibir o devolver dinero
                    
                    // 1. Si el proveedor cobró más de lo que debería (pedidoTotal - comisión)
                    if (montoProveedor > montoProveedorIdeal) {
                        // El proveedor debe devolver el excedente
                        recibirSum += (montoProveedor - montoProveedorIdeal);
                    } 
                    // 2. Si Ñanpi o el motorizado cobraron y el monto es mayor a la comisión
                    else {
                        // Monto cobrado por Ñanpi y Motorizado
                        let montoNoProveedor = montoÑanpi + montoMotorizado;
                        
                        // Si Ñanpi/Motorizado cobraron más que la comisión
                        if (montoNoProveedor > comision) {
                            // El excedente debe ser devuelto al proveedor
                            devolverSum += (montoNoProveedor - comision);
                        }
                        // Si Ñanpi/Motorizado cobraron menos que la comisión
                        else if (montoNoProveedor < comision) {
                            // El proveedor debe recibir menos
                            recibirSum += (montoProveedor - montoProveedorIdeal);
                        }
                    }
                });

                let dineroProveedor = cobroSum - comisionSum;
            
                let tr = document.createElement('tr');
                tr.classList.add('subtotal-row'); 
            
                addCell(tr, 'Subtotales ' + group);
                addCell(tr, 'Recibir: ' + `S/ ${recibirSum.toFixed(2)}`);
                addCell(tr, 'Devolver: ' + `S/ ${devolverSum.toFixed(2)}`);
                addCell(tr, `Ñanpi: S/ ${ñanpiSum.toFixed(2)}` + " | " + `Proveedor: S/ ${proveedorSum.toFixed(2)}` + " | " + `Motorizado: S/ ${motorizadoSum.toFixed(2)}`,2);


                addCell(tr, 'T. Comisión: ' + `S/ ${comisionSum.toFixed(2)}`);
                addCell(tr, 'T. Din. Prov.: ' + `S/ ${dineroProveedor.toFixed(2)}`);
                addCell(tr, 'T. Cobro: ' + `S/ ${cobroSum.toFixed(2)}`);
            
                return tr;
            },
            dataSrc: 'proveedorNombre' // Agrupar por nombre del proveedor
        },
        //autoWidth: false
    });


    // Reemplaza la sección del evento btnCerrarReportar con esta versión corregida:

document.getElementById("btnCerrarReportar").addEventListener("click", async function (event) {
    event.preventDefault();
    console.log("[DEBUG] Botón 'Cerrar y Reportar' presionado");

    // Validaciones iniciales
    if (!recojosFiltrados || recojosFiltrados.length === 0) {
        alert("No hay datos de recojos para procesar");
        return;
    }

    // Deshabilitar el botón para evitar múltiples clics
    const btn = this;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Preparando generación...';

    try {
        console.log("[DEBUG] Solicitando proveedores desde la API...");
        const response = await fetch("/api/proveedores", {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });

        if (!response.ok) {
            console.error("[ERROR] No se pudieron obtener los proveedores. Código de estado:", response.status);
            throw new Error(`Error al obtener los proveedores: ${response.status}`);
        }

        const proveedores = await response.json();
        console.log("[DEBUG] Proveedores obtenidos correctamente:", proveedores.length, "proveedores");

        // Validar que tenemos datos válidos
        if (!Array.isArray(proveedores)) {
            throw new Error("Los datos de proveedores no son válidos");
        }

        console.log("[DEBUG] Creando Web Worker para generación de PDFs...");
        
        // Terminar worker previo si existe
        if (pdfWorker) {
            pdfWorker.terminate();
            pdfWorker = null;
        }
        
        pdfWorker = new Worker('/assets/js/pdf-worker.js');

        // Manejar errores del worker de forma más detallada
        pdfWorker.onerror = function(error) {
            console.error('[ERROR] Error en el worker:', error);
            btn.disabled = false;
            btn.textContent = "Cerrar y Reportar";
            alert(`Error en el worker: ${error.message || 'Error desconocido'}`);
        };

        // Manejar errores no capturados
        pdfWorker.addEventListener('error', function(error) {
            console.error('[ERROR] Worker error event:', error);
            btn.disabled = false;
            btn.textContent = "Cerrar y Reportar";
            alert("Error en el worker. Ver consola para detalles.");
        });

        console.log("[DEBUG] Enviando token de autenticación al worker");
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('[WARN] No hay token de autenticación disponible');
        }
        
        pdfWorker.postMessage({
            type: 'SET_TOKEN',
            data: { token: token }
        });

        // Validar datos antes de enviar
        console.log("[DEBUG] Validando datos para envío al worker...");
        console.log("[DEBUG] Recojos filtrados:", recojosFiltrados.length);
        console.log("[DEBUG] Proveedores únicos:", [...new Set(recojosFiltrados.map(r => r.proveedorNombre))].length);

        // Enviar datos al worker
        console.log("[DEBUG] Enviando datos de generación al worker");
        pdfWorker.postMessage({
            type: 'GENERATE_PDFS',
            data: {
                recojosFiltrados: recojosFiltrados,
                proveedores: proveedores
            }
        });

        pdfWorker.onmessage = function (e) {
            const { type, data } = e.data;
            console.log(`[DEBUG] Mensaje recibido del worker: ${type}`, data);

            switch (type) {
                case 'REGISTER_PROVIDER':
                    console.log('[DEBUG] Registrando proveedor en segundo plano...');
                    registerProvider(data).catch(error => {
                        console.error('[ERROR] Error en registro de proveedor:', error);
                    });
                    // No enviamos confirmación, el worker continúa
                    break;

                case 'STARTED':
                    console.log(`[DEBUG] Worker inició generación de ${data.total} PDFs`);
                    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> 0/${data.total} PDFs generados`;
                    break;

                case 'PROVIDER_START':
                    console.log(`[DEBUG] Iniciando PDF ${data.current}/${data.total} para ${data.nombreEmpresa}`);
                    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> ${data.current}/${data.total}: ${data.nombreEmpresa}`;
                    break;

                case 'PROGRESS':
                    console.log(`[DEBUG] Progreso del proveedor: ${data.providerProgress}% - ${data.message}`);
                    break;

                case 'PDF_READY':
                    console.log(`[DEBUG] PDF listo para ${data.nombreEmpresa}. Enviando correo...`);

                    // Descargar el PDF (esto SÍ se mantiene)
                    downloadPDF(data);

                    // COMENTAR ESTA SECCIÓN PARA DESHABILITAR EMAILS:
                    /*
                    sendPDFByEmail(data).then(() => {
                        console.log('[DEBUG] Correo enviado con éxito. Moviendo documentos al historial...');
                        return moverDocumentosAHistorial(data.recojosProveedor);
                    }).then(() => {
                        console.log('[DEBUG] Documentos movidos al historial.');
                        pdfWorker.postMessage({ type: 'PDF_CONFIRMED' });
                    }).catch(error => {
                        console.error('[ERROR] Error en el proceso de email/historial:', error);
                        pdfWorker.postMessage({ type: 'PDF_CONFIRMED' });
                    });
                    */

                    // REEMPLAZAR CON ESTA VERSIÓN SIMPLIFICADA (sin email):
                    console.log('[DEBUG] Saltando envío de email. Moviendo documentos al historial...');
                    moverDocumentosAHistorial(data.recojosProveedor)
                        .then(() => {
                            console.log('[DEBUG] Documentos movidos al historial.');
                            pdfWorker.postMessage({ type: 'PDF_CONFIRMED' });
                        })
                        .catch(error => {
                            console.error('[ERROR] Error moviendo documentos al historial:', error);
                            pdfWorker.postMessage({ type: 'PDF_CONFIRMED' });
                        });
                    break;

                case 'PROVIDER_ERROR':
                    console.error(`[ERROR] Error en proveedor ${data.nombreEmpresa}:`, data.error);
                    pdfWorker.postMessage({ type: 'PDF_CONFIRMED' });
                    break;

                case 'COMPLETE':
                    console.log("[DEBUG] Proceso completo. Restaurando botón y recargando tabla.");
                    btn.disabled = false;
                    btn.textContent = "Cerrar y Reportar";
                    alert("Todos los PDFs han sido generados exitosamente");
                    if (pdfWorker) {
                        pdfWorker.terminate();
                        pdfWorker = null;
                    }
                    tableRecojos.ajax.reload(null, false);
                    break;

                case 'ERROR':
                    console.error("[ERROR] Error recibido del worker:", data.error);
                    console.error("[ERROR] Detalles:", data.details);
                    if (data.stack) {
                        console.error("[ERROR] Stack trace:", data.stack);
                    }
                    btn.disabled = false;
                    btn.textContent = "Cerrar y Reportar";
                    alert(`Ocurrió un error al generar los PDFs: ${data.error}\nVer consola para más detalles.`);
                    if (pdfWorker) {
                        pdfWorker.terminate();
                        pdfWorker = null;
                    }
                    break;

                default:
                    console.warn("[WARN] Tipo de mensaje no reconocido desde el worker:", type);
                    break;
            }
        };

    } catch (error) {
        console.error("[ERROR] Error general al iniciar la generación de PDFs:", error);
        btn.disabled = false;
        btn.textContent = "Cerrar y Reportar";
        alert(`Ocurrió un error al iniciar la generación de PDFs: ${error.message}`);
        
        // Limpiar worker si existe
        if (pdfWorker) {
            pdfWorker.terminate();
            pdfWorker = null;
        }
    }
});

// También agrega esta función mejorada para mejor manejo de errores en el registro de proveedores:

async function registerProvider(providerData) {
    try {
        // Validar datos de entrada
        if (!providerData.nombreEmpresa || !providerData.phone) {
            console.warn('[WARN] Datos incompletos para registro de proveedor:', providerData);
            return null;
        }

        const response = await fetch('/api/proveedores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify({
                phone: providerData.phone,
                nombreEmpresa: providerData.nombreEmpresa,
                email: providerData.email || 'sin-email@ejemplo.com',
                rol: 'Proveedor'
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ERROR] Error en respuesta del servidor:', response.status, errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('[DEBUG] Proveedor registrado exitosamente:', result);
        return result;
        
    } catch (error) {
        console.error('[ERROR] Error registrando proveedor:', error);
        // No lanzar el error para que el proceso continúe
        return null;
    }
}

// Y mejora la función de envío de emails con mejor manejo de errores:

async function sendPDFByEmail(pdfData) {
    const statusElement = document.getElementById('email-status');
    
    try {
        if (statusElement) {
            statusElement.textContent = `Enviando reporte a ${pdfData.nombreEmpresa}...`;
            statusElement.style.color = 'blue';
        }

        // Validar datos requeridos
        if (!pdfData.blob) {
            throw new Error('No hay datos de PDF para enviar');
        }

        if (!pdfData.email || pdfData.email === 'sin-email@ejemplo.com') {
            console.warn('[WARN] Email no válido para', pdfData.nombreEmpresa);
            if (statusElement) {
                statusElement.textContent = `Email no válido para ${pdfData.nombreEmpresa} - saltando envío`;
                statusElement.style.color = 'orange';
            }
            return; // Saltar envío pero no fallar
        }
        
        // Convertir Blob a base64 para enviarlo
        const base64Pdf = await blobToBase64(pdfData.blob);
        
        // Enviar a tu API backend
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify({
                to: pdfData.email,
                subject: `Reporte de entregas - ${pdfData.nombreEmpresa}`,
                text: 'Adjunto encontrará el reporte de entregas correspondiente.',
                pdf: base64Pdf,
                filename: `Reporte_${pdfData.nombreEmpresa}.pdf`,
                proveedor: pdfData.nombreEmpresa,
                totalPedidos: pdfData.totalPedidos
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        console.log(`[DEBUG] PDF enviado por email a ${pdfData.email}`);

        if (statusElement) {
            statusElement.textContent = `Reporte enviado a ${pdfData.email}`;
            statusElement.style.color = 'green';
        }
        
    } catch (error) {
        console.error('[ERROR] Error en sendPDFByEmail:', error);
        if (statusElement) {
            statusElement.textContent = `Error enviando a ${pdfData.nombreEmpresa}: ${error.message}`;
            statusElement.style.color = 'red';
        }
        throw error;
    }
}

// Mejora la función de conversión blob con timeout:

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        // Timeout para evitar bloqueos
        const timeout = setTimeout(() => {
            reader.abort();
            reject(new Error('Timeout convirtiendo blob a base64'));
        }, 30000); // 30 segundos
        
        reader.onloadend = () => {
            clearTimeout(timeout);
            resolve(reader.result.split(',')[1]);
        };
        
        reader.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Error leyendo blob'));
        };
        
        reader.readAsDataURL(blob);
    });
}

    setTimeout(() => {
        [{
            selector: ".dt-buttons .btn",
            classToRemove: "btn-secondary"
        }, {
            selector: ".dt-search .form-control",
            classToRemove: "form-control-sm",
            classToAdd: "ms-4"
        }, {
            selector: ".dt-length .form-select",
            classToRemove: "form-select-sm"
        }, {
            selector: ".dt-layout-table",
            classToRemove: "row mt-2"
        }, {
            selector: ".dt-layout-end",
            classToAdd: "mt-0"
        }, {
            selector: ".dt-layout-end .dt-search",
            classToAdd: "mt-0 mt-md-6"
        }, {
            selector: ".dt-layout-start",
            classToAdd: "mt-0"
        }, {
            selector: ".dt-layout-end .dt-buttons",
            classToAdd: "mb-0"
        }].forEach(({ selector: e, classToRemove: a, classToAdd: s }) => {
            document.querySelectorAll(e).forEach(t => {
                a && a.split(" ").forEach(e => t.classList.remove(e)),
                    s && s.split(" ").forEach(e => t.classList.add(e))
            }
            )
        }
        )
    }
        , 100)
    } // Cierra initDataTable()
    
    initWhenAuth(); // Inicia el proceso
});


$(document).on('click', '.ver-imagen', function (e) {
    e.preventDefault(); // Evita que el enlace recargue la página

    let imageUrl = $(this).data('url'); // Obtiene la URL de la imagen

    if (imageUrl) {
        $('#imagenModalSrc').attr('src', imageUrl); // Cambia la imagen del modal
        $('#imagenModal').modal('show'); // Muestra el modal
    } else {
        alert('No hay imagen disponible.');
    }
});

// Agregar eventos para mostrar y ocultar la previsualización
$(document).on({
    mouseenter: function(e) {
        const imgUrl = $(this).closest('.ver-imagen').data('url');
        const $preview = $('.imagen-preview');
        
        // Actualizar la imagen y mostrar la previsualización
        $preview.find('img').attr('src', imgUrl);
        
        // Calcular posición para que aparezca encima del icono
        const iconPosition = $(this).offset();
        const previewHeight = $preview.outerHeight();
        
        $preview.css({
            left: iconPosition.left,
            top: iconPosition.top - previewHeight - 10, // 10px de margen por encima
            display: 'block'
        });
    },
    mouseleave: function() {
        // Ocultar la previsualización al salir del icono
        $('.imagen-preview').hide();
    }
}, '.preview-trigger');


// Función para generar los PDFs
async function generarPDFs() {
    const { jsPDF } = window.jspdf;

    // Obtener los nombres únicos de los proveedores
    const proveedoresUnicos = [...new Set(recojosFiltrados.map(r => r.proveedorNombre))];

    for (const nombreProveedor of proveedoresUnicos) {
        const proveedor = proveedores.find(p => p.nombreEmpresa === nombreProveedor);
        const email = proveedor ? proveedor.email : "No hay email";

        // Filtrar recojos de este proveedor
        const recojosProveedor = recojosFiltrados.filter(r => r.proveedorNombre === nombreProveedor);

        // Crear el PDF
        const doc = new jsPDF({ orientation: "portrait" });
        
        // Definir márgenes
        const margenX = 10;
        const margenY = 10;
        const anchoUtil = doc.internal.pageSize.width - (margenX * 2);
        
        // Encabezado del PDF
        doc.setFontSize(16);
        doc.text("Reporte de Proveedor", margenX, margenY + 5);
        doc.setFontSize(12);
        doc.text(`Nombre: ${nombreProveedor}`, margenX, margenY + 15);
        doc.text(`Correo: ${email}`, margenX, margenY + 25);

        // Preparamos los datos para la tabla sin incluir las imágenes aún
        const data = [];
        
        for (let i = 0; i < recojosProveedor.length; i++) {
            const recojo = recojosProveedor[i];
            
            // Formatear pagosRegistrados
            let pagosInfo = recojo.pagosRegistrados.map(pago => {
                let receptor = pago.receptor.split(",")[0];
                return `Método: ${pago.metodoPago}\nReceptor: ${receptor}\nMonto: S/. ${pago.monto}`;
            }).join("\n\n");

            // Agregamos solo el texto de los datos del cliente
            const fila = [
                `${recojo.clienteNombre}\n${recojo.clienteTelefono}\n${recojo.clienteDistrito}\n\n${pagosInfo}\n\nComisión: ${recojo.comisionTarifa}\nCobrar: ${recojo.pedidoCantidadCobrar}`,
                "", // Celda vacía para foto de recojo
                "", // Celda vacía para foto de entrega
                ""  // Celda vacía para foto de dinero
            ];
            
            data.push(fila);
        }
        
        // Configurar dimensiones
        const anchosColumna = [
            anchoUtil * 0.25, // Primera columna (texto) 25% del ancho útil
            anchoUtil * 0.25, // Columna para imagen 1
            anchoUtil * 0.25, // Columna para imagen 2
            anchoUtil * 0.25  // Columna para imagen 3
        ];

        const startY = margenY + 35;
        const altoImagen = 50; // Altura fija para las imágenes

        // Primero, vamos a cargar todas las imágenes para todos los recojos
        // Esto nos permite precargar las imágenes antes de generar la tabla
        const imagenesDataUrl = [];
        
        for (let i = 0; i < recojosProveedor.length; i++) {
            const recojo = recojosProveedor[i];
            const imagenesRecojo = {
                fotoRecojo: null,
                fotoEntrega: null,
                fotoDinero: null
            };
            
            // Cargamos las imágenes en paralelo para cada recojo
            const promesas = [];
            
            if (recojo.thumbnailFotoRecojo) {
                const proxyUrl = `http://localhost:3000/get-image?url=${encodeURIComponent(recojo.thumbnailFotoRecojo)}`;
                promesas.push(
                    loadImage(proxyUrl)
                        .then(data => { imagenesRecojo.fotoRecojo = data; })
                        .catch(err => { 
                            console.error("Error cargando foto de recojo:", err);
                            imagenesRecojo.fotoRecojo = null;
                        })
                );
            }
            
            if (recojo.thumbnailFotoEntrega) {
                const proxyUrl = `http://localhost:3000/get-image?url=${encodeURIComponent(recojo.thumbnailFotoEntrega)}`;
                promesas.push(
                    loadImage(proxyUrl)
                        .then(data => { imagenesRecojo.fotoEntrega = data; })
                        .catch(err => { 
                            console.error("Error cargando foto de entrega:", err);
                            imagenesRecojo.fotoEntrega = null;
                        })
                );
            }
            
            if (recojo.thumbnailFotoDinero) {
                const proxyUrl = `http://localhost:3000/get-image?url=${encodeURIComponent(recojo.thumbnailFotoDinero)}`;
                promesas.push(
                    loadImage(proxyUrl)
                        .then(data => { imagenesRecojo.fotoDinero = data; })
                        .catch(err => { 
                            console.error("Error cargando foto de dinero:", err);
                            imagenesRecojo.fotoDinero = null;
                        })
                );
            }
            
            // Esperamos a que todas las imágenes para este recojo se carguen
            await Promise.all(promesas);
            
            // Guardamos las referencias a las imágenes cargadas
            imagenesDataUrl.push(imagenesRecojo);
        }
        
        // Ahora dibujamos la tabla con las imágenes ya cargadas
        doc.autoTable({
            startY,
            margin: { left: margenX, right: margenX },
            head: [["Datos del Cliente", "Foto de Recojo", "Foto de Entrega", "Foto de Dinero"]],
            body: data,
            tableWidth: anchoUtil,
            columnStyles: {
                0: { cellWidth: anchosColumna[0], valign: "middle" },
                1: { cellWidth: anchosColumna[1], valign: "middle" },
                2: { cellWidth: anchosColumna[2], valign: "middle" },
                3: { cellWidth: anchosColumna[3], valign: "middle" }
            },
            styles: {
                lineWidth: 0.5, // Grosor de los bordes
                lineColor: [0, 0, 0], // Color de los bordes (negro)
            },
            alternateRowStyles: false, // Desactiva el estilo "zebra"
            willDrawCell: function(data) {
                // Aumentar la altura de las celdas para las imágenes
                if (data.column.index > 0 && data.section === 'body') {
                    data.row.height = Math.max(data.row.height, altoImagen);
                }
            },
            willDrawCell: function(data) {
                // Aumentar la altura de las celdas para las imágenes
                if (data.column.index > 0 && data.section === 'body') {
                    data.row.height = Math.max(data.row.height, altoImagen);
                }
            },
            didDrawCell: function (data) {
                // Solo procesamos celdas de imágenes (columnas 1, 2 y 3)
                if (data.column.index > 0 && data.section === 'body') {
                    const rowIndex = data.row.index;
                    const colIndex = data.column.index;
            
                    // Si tenemos la imagen cargada para esta celda
                    let imageData = null;
            
                    if (colIndex === 1 && imagenesDataUrl[rowIndex]?.fotoRecojo) {
                        imageData = imagenesDataUrl[rowIndex].fotoRecojo;
                    } else if (colIndex === 2 && imagenesDataUrl[rowIndex]?.fotoEntrega) {
                        imageData = imagenesDataUrl[rowIndex].fotoEntrega;
                    } else if (colIndex === 3 && imagenesDataUrl[rowIndex]?.fotoDinero) {
                        imageData = imagenesDataUrl[rowIndex].fotoDinero;
                    }
            
                    if (imageData) {
                        // Obtener las dimensiones originales de la imagen
                        const img = new Image();
                        img.src = imageData;
            
                        // Calcular las dimensiones proporcionales
                        const aspectRatio = img.width / img.height; // Relación de aspecto (ancho/alto)
                        const maxHeight = data.cell.height - 6; // Altura máxima de la celda (con margen interno)
                        const newWidth = maxHeight * aspectRatio; // Nuevo ancho proporcional
            
                        // Calcular la posición para centrar la imagen horizontalmente
                        const x = data.cell.x + (data.cell.width - newWidth) / 2; // Centrado en X
                        const y = data.cell.y + 3; // Margen interno en Y
            
                        try {
                            // Añadir la imagen al PDF con las dimensiones proporcionales
                            doc.addImage(imageData, 'JPEG', x, y, newWidth, maxHeight);
                        } catch (error) {
                            console.error("Error al añadir la imagen al PDF:", error);
                        }
                    }
                }
            }
        });

        // Descargar el PDF con el nombre del proveedor
        doc.save(`Proveedor_${nombreProveedor}.pdf`);
    }

    //console.log("PDFs generados correctamente");
}

// Función mejorada para cargar una imagen como base64
function loadImage(url) {
    return new Promise((resolve, reject) => {
        if (!url || typeof url !== 'string') {
            reject(new Error("URL de imagen inválida"));
            return;
        }

        const img = new Image();
        img.crossOrigin = "Anonymous"; // Importante para CORS
        
        img.onload = function() {
            try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Convertir a formato base64 para jsPDF
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8); // Comprimir un poco para mejorar rendimiento
                resolve(dataUrl);
            } catch (error) {
                console.error("Error al procesar la imagen:", error);
                reject(error);
            }
        };
        
        img.onerror = function(e) {
            console.error(`No se pudo cargar la imagen: ${url}`, e);
            reject(new Error(`Error al cargar la imagen: ${url}`));
        };
        
        // Añadimos un parámetro random para evitar la caché del navegador
        const urlSinCache = url + (url.includes('?') ? '&' : '?') + 'nocache=' + Date.now();
        img.src = urlSinCache;
        
        // Establecer un timeout para la carga de la imagen
        setTimeout(() => {
            if (!img.complete) {
                img.src = ""; // Cancelar la carga
                reject(new Error(`Timeout al cargar la imagen: ${url}`));
            }
        }, 15000); // 15 segundos de timeout
    });
}


// Función para descargar el PDF
function downloadPDF(data) {
    try {
        // Crear URL para el blob del PDF
        const pdfUrl = URL.createObjectURL(data.blob);
        
        // Crear enlace de descarga invisible
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `Proveedor_${data.nombreEmpresa}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // Trigger de la descarga
        a.click();
        
        // Limpieza
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(pdfUrl); // Liberar memoria
        }, 100);
        
        //console.log(`PDF descargado: ${data.nombreEmpresa} (${data.current}/${data.total})`);
    } catch (error) {
        console.error("Error al descargar PDF:", error);
    }
}

async function sendPDFByEmail(pdfData) {
    const statusElement = document.getElementById('email-status');
    //console.log(pdfData);
    try {
        statusElement.textContent = `Enviando reporte a ${pdfData.nombreEmpresa}...`;
        statusElement.style.color = 'blue';

        // Extraer el email del proveedor del nombre del PDF (asumiendo formato "Proveedor_Nombre")
        const proveedorNombre = pdfData.nombreEmpresa;
        console.log(proveedorNombre);
        
        // Obtener el email del proveedor desde tus datos
        const proveedorEmail = pdfData.email;
        
        // Convertir Blob a base64 para enviarlo
        const base64Pdf = await blobToBase64(pdfData.blob);
        
        // Enviar a tu API backend
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            },
            body: JSON.stringify({
                to: proveedorEmail,
                subject: `Reporte de entregas - ${proveedorNombre}`,
                text: 'Adjunto encontrará el reporte de entregas correspondiente.',
                pdf: base64Pdf,
                filename: `Reporte_${proveedorNombre}.pdf`,
                proveedor: proveedorNombre,
                totalPedidos: pdfData.totalPedidos
            })
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        //console.log(`PDF enviado por email a ${proveedorEmail}`);

        statusElement.textContent = `Reporte enviado a ${proveedorEmail}`;
        statusElement.style.color = 'green';
    } catch (error) {
        console.error('Error en sendPDFByEmail:', error);
        statusElement.textContent = `Error enviando a ${pdfData.nombreEmpresa}: ${error.message}`;
        statusElement.style.color = 'red';
        throw error;
    }
}

// Función auxiliar para convertir Blob a base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function registerProvider(providerData) {
    try {
        const response = await fetch('/api/proveedores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        },
            body: JSON.stringify({
                phone: providerData.phone,
                nombreEmpresa: providerData.nombreEmpresa,
                email: providerData.email,
                rol: 'Proveedor' // Asegurar que tenga el rol correcto
            })
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error registrando proveedor:', error);
        throw error;
    }
}

async function moverDocumentosAHistorial(listaDeDocumentos) {
    try {
      const response = await fetch('/api/mover-a-historial', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        },
        body: JSON.stringify({ documentos: listaDeDocumentos })
      });
  
      if (!response.ok) {
        throw new Error(await response.text());
      }
  
      const resultado = await response.json();
      console.log('Documentos movidos:', resultado);
      return resultado;
  
    } catch (error) {
      console.error('Error al mover documentos:', error);
      throw error;
    }
  }
  
  