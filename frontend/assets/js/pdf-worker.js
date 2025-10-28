// pdf-worker.js

// Flag de depuración - cambiar a true para ver logs detallados
const DEBUG_MODE = true;

function debugLog(...messages) {
  if (DEBUG_MODE) {
    console.log('[PDF Worker Debug]', ...messages);
  }
}

// Importar scripts necesarios con manejo de errores
try {
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');
    debugLog('Scripts de jsPDF cargados exitosamente');
} catch (error) {
    console.error('[Worker] Error cargando scripts:', error);
    self.postMessage({
        type: 'ERROR',
        data: { 
            error: 'Error cargando librerías PDF',
            details: error.message
        }
    });
}

// Verificar que jsPDF esté disponible
let jsPDF;
try {
    jsPDF = self.jspdf?.jsPDF;
    if (!jsPDF) {
        throw new Error('jsPDF no está disponible');
    }
    debugLog('jsPDF inicializado correctamente');
} catch (error) {
    console.error('[Worker] jsPDF no disponible:', error);
    self.postMessage({
        type: 'ERROR',
        data: { 
            error: 'jsPDF no disponible',
            details: error.message
        }
    });
}

// Manejo de errores globales en el worker
self.addEventListener('error', function(error) {
    console.error('[Worker Error]:', error);
    self.postMessage({
        type: 'ERROR',
        data: { 
            error: 'Error no capturado en worker',
            details: error.message,
            filename: error.filename,
            lineno: error.lineno
        }
    });
});

self.addEventListener('unhandledrejection', function(event) {
    console.error('[Worker Unhandled Rejection]:', event.reason);
    self.postMessage({
        type: 'ERROR',
        data: { 
            error: 'Promise rechazada en worker',
            details: event.reason?.message || event.reason
        }
    });
});

// Función para cargar imágenes con retry y URL corregida
async function loadImageWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            debugLog(`Intentando cargar imagen (intento ${i + 1}): ${url}`);
            
            // Construir la URL del proxy correctamente
            const proxyUrl = url.startsWith('/get-image') ? 
                `${self.location.origin}${url}` : 
                `${self.location.origin}/get-image?url=${encodeURIComponent(url)}`;
            
            const headers = {};
            if (self.authToken) {
                headers['Authorization'] = 'Bearer ' + self.authToken;
            } else {
                console.warn('[Worker] No hay token de autenticación disponible');
            }

            const response = await fetch(proxyUrl, { 
                headers,
                mode: 'cors',
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                debugLog(`Error HTTP: ${response.status} para ${url}`);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            debugLog(`Imagen cargada correctamente: ${url}`, blob.size, 'bytes');
            
            const dataUrl = await blobToDataURL(blob);
            debugLog(`Conversión a DataURL exitosa para: ${url}`);
            
            return dataUrl;
        } catch (error) {
            debugLog(`Error en intento ${i + 1} para ${url}:`, error.message);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Convertir Blob a Data URL
function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Función para validar datos antes de procesar
function validateData(recojosFiltrados, proveedores) {
    if (!Array.isArray(recojosFiltrados)) {
        throw new Error('recojosFiltrados debe ser un array');
    }
    
    if (!Array.isArray(proveedores)) {
        throw new Error('proveedores debe ser un array');
    }
    
    if (recojosFiltrados.length === 0) {
        throw new Error('No hay recojos para procesar');
    }
    
    // Validar estructura de recojos
    const recojoEjemplo = recojosFiltrados[0];
    const camposRequeridos = ['proveedorNombre', 'clienteNombre', 'clienteTelefono', 'clienteDistrito'];
    
    for (const campo of camposRequeridos) {
        if (!(campo in recojoEjemplo)) {
            throw new Error(`Campo requerido '${campo}' no encontrado en recojos`);
        }
    }
    
    debugLog('Validación de datos exitosa');
    return true;
}

// Función para generar un PDF para un proveedor
async function generateProviderPDF(proveedorNombre, recojosProveedor, proveedorInfo) {
    return new Promise(async (resolve, reject) => {
        try {
            if (!jsPDF) {
                throw new Error('jsPDF no está disponible');
            }
            
            const doc = new jsPDF({ orientation: "portrait" });
            
            // Configuración del documento
            const margenX = 10;
            const margenY = 10;
            const anchoUtil = doc.internal.pageSize.width - (margenX * 2);

            // 1. Intentar cargar el logo (opcional)
            let logoData;
            try {
                const logoUrl = '/assets/img/avatars/1.png';
                logoData = await loadImageWithRetry(logoUrl, 1, 500); // Solo 1 intento para el logo
                
                const logoWidth = 30;
                const logoHeight = 30;
                const logoX = doc.internal.pageSize.width - margenX - logoWidth;
                const logoY = margenY;
                
                doc.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);
                debugLog('Logo añadido exitosamente');
                
            } catch (error) {
                console.warn('[Worker] No se pudo cargar el logo:', error.message);
                // Continuar sin logo si hay error
            }

            // Obtener fecha actual formateada
            const fechaEmision = new Date();
            const opcionesFecha = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            const fechaFormateada = fechaEmision.toLocaleDateString('es-ES', opcionesFecha);

            // 3. Encabezado del documento
            doc.setFontSize(16);
            const titulo = "Reporte de Proveedor";
            const textoAncho = doc.getStringUnitWidth(titulo) * doc.internal.getFontSize() / doc.internal.scaleFactor;
            const xCentrado = (doc.internal.pageSize.width - textoAncho) / 2;
            
            doc.text(titulo, xCentrado, margenY + 10);
            
            doc.setFontSize(12);
            doc.text(`Nombre de la empresa: ${proveedorInfo?.nombreEmpresa || proveedorNombre}`, margenX, margenY + 20);
            doc.text(`Cantidad de pedidos: ${recojosProveedor.length}`, margenX, margenY + 25);
            doc.text(`Fecha de emisión: ${fechaFormateada}`, margenX, margenY + 30);
            doc.text(`Correo: ${proveedorInfo?.email || "No disponible"}`, margenX, margenY + 35);
            
            // Preparar datos para la tabla
            const data = [];
            const imagenesDataUrl = [];
            
            // Procesar cada recojo
            for (let i = 0; i < recojosProveedor.length; i++) {
                const recojo = recojosProveedor[i];
                
                // Notificar progreso
                self.postMessage({
                    type: 'PROGRESS',
                    data: {
                        providerProgress: Math.round(((i + 1) / recojosProveedor.length) * 100),
                        message: `Procesando ${proveedorNombre} (${i+1}/${recojosProveedor.length})`
                    }
                });
                
                // Formatear información de pagos de forma segura
                let pagosInfo = 'Sin pagos registrados';
                if (recojo.pagosRegistrados && Array.isArray(recojo.pagosRegistrados) && recojo.pagosRegistrados.length > 0) {
                    pagosInfo = recojo.pagosRegistrados.map(pago => {
                        const receptor = pago.receptor ? pago.receptor.split(",")[0] : 'Desconocido';
                        return `Método: ${pago.metodoPago || 'N/A'}\nReceptor: ${receptor}\nMonto: S/. ${pago.monto || '0.00'}`;
                    }).join("\n\n");
                }
                
                // Agregar fila de datos
                data.push([
                    `Nombre: ${recojo.clienteNombre || 'N/A'}\nTeléfono: ${recojo.clienteTelefono || 'N/A'}\nDistrito: ${recojo.clienteDistrito || 'N/A'}\n\n${pagosInfo}\n\nTarifa Ñanpí: ${recojo.comisionTarifa || 'N/A'}\nCobro Cliente: ${recojo.pedidoCantidadCobrar || 'N/A'}`,
                    "", "", ""
                ]);
                
                // Cargar imágenes en paralelo con manejo de errores mejorado
                const imageResults = { fotoRecojo: null, fotoEntrega: null, fotoDinero: null };
                
                try {
                    const imageLoaders = [];
                    
                    if (recojo.thumbnailFotoRecojo) {
                        imageLoaders.push(
                            loadImageWithRetry(recojo.thumbnailFotoRecojo, 2, 1000)
                                .then(data => ({ tipo: 'fotoRecojo', data }))
                                .catch(e => {
                                    debugLog(`Error cargando foto recojo: ${e.message}`);
                                    return { tipo: 'fotoRecojo', error: e.message };
                                })
                        );
                    }
                    
                    if (recojo.thumbnailFotoEntrega) {
                        imageLoaders.push(
                            loadImageWithRetry(recojo.thumbnailFotoEntrega, 2, 1000)
                                .then(data => ({ tipo: 'fotoEntrega', data }))
                                .catch(e => {
                                    debugLog(`Error cargando foto entrega: ${e.message}`);
                                    return { tipo: 'fotoEntrega', error: e.message };
                                })
                        );
                    }
                    
                    if (recojo.thumbnailFotoDinero) {
                        imageLoaders.push(
                            loadImageWithRetry(recojo.thumbnailFotoDinero, 2, 1000)
                                .then(data => ({ tipo: 'fotoDinero', data }))
                                .catch(e => {
                                    debugLog(`Error cargando foto dinero: ${e.message}`);
                                    return { tipo: 'fotoDinero', error: e.message };
                                })
                        );
                    }
                    
                    if (imageLoaders.length > 0) {
                        const results = await Promise.allSettled(imageLoaders);
                        
                        results.forEach(result => {
                            if (result.status === 'fulfilled') {
                                const { tipo, data, error } = result.value;
                                if (error) {
                                    debugLog(`Error en ${tipo}: ${error}`);
                                    imageResults[tipo] = null;
                                } else {
                                    debugLog(`${tipo} cargada correctamente`);
                                    imageResults[tipo] = data;
                                }
                            } else {
                                debugLog(`Promise rejected:`, result.reason);
                            }
                        });
                    }
                    
                } catch (error) {
                    console.error(`Error general cargando imágenes para recojo ${i}:`, error);
                }
                
                imagenesDataUrl.push(imageResults);
            }
            
            // Configurar tabla con manejo mejorado de imágenes
            doc.autoTable({
                startY: margenY + 45,
                margin: { left: margenX, right: margenX },
                head: [["Datos del Cliente", "Foto de Recojo", "Foto de Entrega", "Foto de Dinero"]],
                body: data,
                
                // Estilos generales
                styles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.2,
                    cellPadding: 4
                },
                
                // Estilos específicos para el encabezado
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 12,
                    halign: 'center',
                    valign: 'middle',
                    lineColor: [0, 0, 0],
                    lineWidth: 0.5
                },
                
                // Altura fija para todas las filas del cuerpo
                bodyStyles: { 
                    minCellHeight: 40,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.2
                },
                
                // Estilos para las celdas
                columnStyles: {
                    0: { cellWidth: anchoUtil * 0.25, valign: 'middle' },
                    1: { cellWidth: anchoUtil * 0.25, valign: 'middle' },
                    2: { cellWidth: anchoUtil * 0.25, valign: 'middle' },
                    3: { cellWidth: anchoUtil * 0.25, valign: 'middle' }
                },
                
                // Ajustar altura de filas
                didParseCell: function(data) {
                    data.cell.height = 40;
                },
                
                // Dibujado de celdas con manejo de imágenes
                didDrawCell: function(data) {
                    if (data.column.index > 0 && data.section === 'body') {
                        const rowIndex = data.row.index;
                        const colIndex = data.column.index;
                        
                        let imageData = null;
                        if (colIndex === 1) imageData = imagenesDataUrl[rowIndex]?.fotoRecojo;
                        else if (colIndex === 2) imageData = imagenesDataUrl[rowIndex]?.fotoEntrega;
                        else if (colIndex === 3) imageData = imagenesDataUrl[rowIndex]?.fotoDinero;
                        
                        if (imageData) {
                            try {
                                const padding = 2;
                                const availableHeight = data.cell.height - (padding * 2);
                                const imgProps = doc.getImageProperties(imageData);
                                const aspectRatio = imgProps.width / imgProps.height;
                                const imgWidth = availableHeight * aspectRatio;
                                const maxWidth = data.cell.width - (padding * 2);
                                const finalWidth = Math.min(imgWidth, maxWidth);
                                const finalHeight = finalWidth / aspectRatio;
                                const x = data.cell.x + (data.cell.width - finalWidth) / 2;
                                const y = data.cell.y + (data.cell.height - finalHeight) / 2;
                                
                                doc.addImage(imageData, 'JPEG', x, y, finalWidth, finalHeight);
                                
                            } catch (error) {
                                debugLog("Error añadiendo imagen:", error);
                                doc.setFontSize(8);
                                doc.text("Imagen no disponible", 
                                        data.cell.x + 5, 
                                        data.cell.y + data.cell.height / 2);
                            }
                        } else {
                            doc.setFontSize(8);
                            doc.text("Sin imagen", 
                                    data.cell.x + 5, 
                                    data.cell.y + data.cell.height / 2);
                        }
                    }
                }
            });
            
            // Generar el PDF como Blob
            const pdfBlob = doc.output('blob');
            debugLog(`PDF generado exitosamente para ${proveedorNombre}`);
            resolve({ 
                nombreEmpresa: proveedorInfo?.nombreEmpresa || proveedorNombre, 
                blob: pdfBlob 
            });
            
        } catch (error) {
            console.error(`Error generando PDF para ${proveedorNombre}:`, error);
            reject(error);
        }
    });
}

// Estado del worker
let isProcessing = false;

// Variable para almacenar el token
self.authToken = null;

self.onmessage = async function(e) {
    const { type, data } = e.data;
    
    try {
        // Manejar token de autenticación
        if (type === 'SET_TOKEN') {
            self.authToken = data.token;
            debugLog('Token de autenticación configurado');
            return;
        }
        
        if (type === 'GENERATE_PDFS' && !isProcessing) {
            debugLog('Iniciando proceso GENERATE_PDFS');
            debugLog('Token disponible:', !!self.authToken);
            debugLog('Datos recibidos:', Object.keys(data));
            
            isProcessing = true;
            
            const { recojosFiltrados, proveedores } = data;
            
            // Validar datos antes de procesar
            validateData(recojosFiltrados, proveedores);
            
            // Agrupar por nombre de proveedor (consistente con el código principal)
            const proveedoresUnicos = [...new Set(recojosFiltrados.map(r => r.proveedorNombre))];
            const totalProveedores = proveedoresUnicos.length;
            
            debugLog(`Proveedores únicos encontrados: ${totalProveedores}`, proveedoresUnicos);
            
            // Notificar inicio del proceso
            self.postMessage({
                type: 'STARTED',
                data: { total: totalProveedores }
            });
            
            // Generar PDFs para cada proveedor en serie
            for (let i = 0; i < totalProveedores; i++) {
                const proveedorNombre = proveedoresUnicos[i];
                const recojosProveedor = recojosFiltrados.filter(r => r.proveedorNombre === proveedorNombre);
                const proveedorInfo = proveedores.find(p => p.nombreEmpresa === proveedorNombre);
                
                debugLog(`Procesando proveedor ${i + 1}/${totalProveedores}: ${proveedorNombre} (${recojosProveedor.length} recojos)`);
                
                // Manejar proveedor no encontrado
                let proveedorFinal = proveedorInfo;
                if (!proveedorInfo && recojosProveedor.length > 0) {
                    debugLog(`Proveedor no encontrado (${proveedorNombre}), usando datos de fallback...`);
                    
                    const primerRecojo = recojosProveedor[0];
                    proveedorFinal = {
                        nombreEmpresa: proveedorNombre,
                        email: primerRecojo.proveedorCorreo || 'sin-email@ejemplo.com',
                        phone: primerRecojo.proveedorTelefono || 'sin-telefono'
                    };
                    
                    // Enviar notificación de registro de proveedor
                    self.postMessage({
                        type: 'REGISTER_PROVIDER',
                        data: {
                            phone: proveedorFinal.phone,
                            nombreEmpresa: proveedorNombre,
                            email: proveedorFinal.email
                        }
                    });
                }

                try {
                    // Notificar inicio de generación para este proveedor
                    self.postMessage({
                        type: 'PROVIDER_START',
                        data: {
                            current: i + 1,
                            total: totalProveedores,
                            nombreEmpresa: proveedorNombre
                        }
                    });
                    
                    // Generar PDF
                    const pdfData = await generateProviderPDF(proveedorNombre, recojosProveedor, proveedorFinal);
                    
                    // Enviar el PDF al hilo principal y esperar confirmación
                    const waitForConfirmation = new Promise(resolve => {
                        const handler = function(e) {
                            if (e.data.type === 'PDF_CONFIRMED') {
                                self.removeEventListener('message', handler);
                                resolve();
                            }
                        };
                        self.addEventListener('message', handler);
                        
                        // Enviar el PDF
                        self.postMessage({
                            type: 'PDF_READY',
                            data: {
                                ...pdfData,
                                current: i + 1,
                                total: totalProveedores,
                                email: proveedorFinal?.email,
                                totalPedidos: recojosProveedor.length,
                                recojosProveedor: recojosProveedor
                            }
                        });
                    });
                    
                    await waitForConfirmation;
                    debugLog(`PDF procesado exitosamente para ${proveedorNombre}`);
                    
                } catch (error) {
                    console.error(`Error generando PDF para ${proveedorNombre}:`, error);
                    self.postMessage({
                        type: 'PROVIDER_ERROR',
                        data: { 
                            nombreEmpresa: proveedorNombre,
                            error: error.message,
                            current: i + 1,
                            total: totalProveedores
                        }
                    });
                }
            }
            
            // Notificar finalización
            self.postMessage({ type: 'COMPLETE' });
            debugLog('Proceso completado exitosamente');
            
        }
    } catch (error) {
        console.error("Error en el worker:", error);
        self.postMessage({
            type: 'ERROR',
            data: { 
                error: "Error general en el worker",
                details: error.message,
                stack: error.stack
            }
        });
    } finally {
        if (type === 'GENERATE_PDFS') {
            isProcessing = false;
        }
    }
};