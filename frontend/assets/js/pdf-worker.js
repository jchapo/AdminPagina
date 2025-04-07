// pdf-worker.js

// Flag de depuración - cambiar a true para ver logs detallados
const DEBUG_MODE = false;

function debugLog(...messages) {
  if (DEBUG_MODE) {
    console.log('[PDF Worker Debug]', ...messages);
  }
}

// Importar scripts necesarios
importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');

// Inicializar jsPDF
const { jsPDF } = self.jspdf;

// Función para cargar imágenes con retry
async function loadImageWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        debugLog(`Intentando cargar imagen (intento ${i + 1}): ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          debugLog(`Error HTTP: ${response.status} para ${url}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        debugLog(`Imagen cargada correctamente: ${url}`, blob);
        
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

// Función modificada para obtener dimensiones de imagen sin usar Image()
async function getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
        // Leer la imagen como ArrayBuffer para analizar sus dimensiones
        const binaryString = atob(dataUrl.split(',')[1]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Analizar los bytes para obtener dimensiones (soporte básico para JPEG)
        if (bytes[0] === 0xFF && bytes[1] === 0xD8) { // Es JPEG
            let width = 0, height = 0;
            let offset = 2;
            
            while (offset < bytes.length) {
                if (bytes[offset] === 0xFF && bytes[offset + 1] === 0xC0) {
                    height = (bytes[offset + 5] << 8) | bytes[offset + 6];
                    width = (bytes[offset + 7] << 8) | bytes[offset + 8];
                    break;
                }
                offset++;
            }
            
            if (width && height) {
                resolve({ width, height });
            } else {
                // Valores por defecto si no podemos leer las dimensiones
                resolve({ width: 100, height: 100 });
            }
        } else {
            // Para otros formatos o si falla, usar dimensiones por defecto
            resolve({ width: 100, height: 100 });
        }
    });
}

// Función para generar un PDF para un proveedor
async function generateProviderPDF(proveedor, recojosProveedor, proveedorInfo) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new jsPDF({ orientation: "portrait" });
            
            // Configuración del documento
            const margenX = 10;
            const margenY = 10;
            const anchoUtil = doc.internal.pageSize.width - (margenX * 2);

            // 1. Cargar el logo (ajusta la ruta según tu estructura de archivos)
            const logoUrl = '../../assets/img/avatars/1.png';
            let logoData;
            
            try {
                logoData = await loadImageWithRetry(logoUrl);
                
                // 2. Posicionar el logo en esquina superior derecha
                const logoWidth = 30; // Ancho deseado del logo en mm
                const logoHeight = 30; // Alto deseado del logo en mm
                const logoX = doc.internal.pageSize.width - margenX - logoWidth;
                const logoY = margenY;
                
                doc.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);
                
            } catch (error) {
                console.warn('No se pudo cargar el logo:', error);
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

            // 3. Ajustar posición del título para no solaparse con el logo
            doc.setFontSize(16);
            const titulo = "Reporte de Proveedor";
            const textoAncho = doc.getStringUnitWidth(titulo) * doc.internal.getFontSize() / doc.internal.scaleFactor;
            const xCentrado = (doc.internal.pageSize.width - textoAncho) / 2;
            
            doc.text(titulo, xCentrado, margenY + 10); // Bajar más si hay logo
            
            doc.setFontSize(12);
            doc.text(`Nombre de la empresa: ${proveedorInfo.nombreEmpresa}`, margenX, margenY + 20);
            doc.text(`Cantidad de pedidos: ${recojosProveedor.length}`, margenX, margenY + 25);
            doc.text(`Fecha de emisión: ${fechaFormateada}`, margenX, margenY + 30);
            doc.text(`Correo: ${proveedorInfo ? proveedorInfo.email : "No disponible"}`, margenX, margenY + 35);
            
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
                        message: `Procesando ${proveedor} (${i+1}/${recojosProveedor.length})`
                    }
                });
                
                // Formatear información de pagos
                let pagosInfo = recojo.pagosRegistrados && Array.isArray(recojo.pagosRegistrados) 
                    ? recojo.pagosRegistrados.map(pago => 
                        `Método: ${pago.metodoPago}\nReceptor: ${pago.receptor?.split(",")[0] || 'Desconocido'}\nMonto: S/. ${pago.monto}`
                      ).join("\n\n")
                    : 'Sin pagos registrados';
                
                // Agregar fila de datos
                data.push([
                    `Nombre: ${recojo.clienteNombre}\nTeléfono: ${recojo.clienteTelefono}\nDistrito: ${recojo.clienteDistrito}\n\n${pagosInfo}\n\nTarifa Ñanpí: ${recojo.comisionTarifa}\nCobro Cliente: ${recojo.pedidoCantidadCobrar}`,
                    "", "", ""
                ]);
                
                // Cargar imágenes en paralelo con retry
                try {
                    const imageLoaders = [];
                    
                    if (recojo.thumbnailFotoRecojo) {
                        imageLoaders.push(
                            loadImageWithRetry(`http://localhost:3000/get-image?url=${encodeURIComponent(recojo.thumbnailFotoRecojo)}`)
                                .then(data => ({ tipo: 'fotoRecojo', data }))
                                .catch(e => {
                                    console.warn(`Error cargando foto recojo: ${e.message}`);
                                    return { tipo: 'fotoRecojo', error: e.message };
                                })
                        );
                    }
                    
                    if (recojo.thumbnailFotoEntrega) {
                        imageLoaders.push(
                            loadImageWithRetry(`http://localhost:3000/get-image?url=${encodeURIComponent(recojo.thumbnailFotoEntrega)}`)
                                .then(data => ({ tipo: 'fotoEntrega', data }))
                                .catch(e => {
                                    console.warn(`Error cargando foto entrega: ${e.message}`);
                                    return { tipo: 'fotoEntrega', error: e.message };
                                })
                        );
                    }
                    
                    if (recojo.thumbnailFotoDinero) {
                        imageLoaders.push(
                            loadImageWithRetry(`http://localhost:3000/get-image?url=${encodeURIComponent(recojo.thumbnailFotoDinero)}`)
                                .then(data => ({ tipo: 'fotoDinero', data }))
                                .catch(e => {
                                    console.warn(`Error cargando foto dinero: ${e.message}`);
                                    return { tipo: 'fotoDinero', error: e.message };
                                })
                        );
                    }
                    
                    const results = await Promise.all(imageLoaders);
                    const imageResults = {};
                    
                    results.forEach(result => {
                        if (result.error) {
                            console.warn(`Error en ${result.tipo}: ${result.error}`);
                            imageResults[result.tipo] = null;
                        } else {
                            console.log(`${result.tipo} cargada correctamente (${result.data.length} bytes)`);
                            imageResults[result.tipo] = result.data;
                        }
                    });
                    
                    imagenesDataUrl.push(imageResults);
                    
                } catch (error) {
                    console.error(`Error cargando imágenes para recojo ${i}:`, error);
                    imagenesDataUrl.push({ fotoRecojo: null, fotoEntrega: null, fotoDinero: null });
                }
            }
            
            // Configurar tabla con manejo mejorado de imágenes
            // Configuración de la tabla con altura fija de filas y manejo proporcional de imágenes
            doc.autoTable({
                startY: margenY + 45,
                margin: { left: margenX, right: margenX },
                head: [["Datos del Cliente", "Foto de Recojo", "Foto de Entrega", "Foto de Dinero"]],
                body: data,
                
                // Estilos generales
                styles: {
                    fillColor: [255, 255, 255], // Fondo blanco
                    textColor: [0, 0, 0], // Texto negro
                    lineColor: [0, 0, 0], // Líneas negras
                    lineWidth: 0.2, // Grosor de las líneas
                    cellPadding: 4 // Espaciado interno
                },
                
                // Estilos específicos para el encabezado
                headStyles: {
                    fillColor: [255, 255, 255], // Fondo blanco
                    textColor: [0, 0, 0],       // Texto negro
                    fontStyle: 'bold',          // Texto en negrita
                    fontSize: 12,               // Tamaño mayor que el cuerpo
                    halign: 'center',           // Centrado horizontal
                    valign: 'middle',           // Centrado vertical
                    lineColor: [0, 0, 0],       // Líneas negras
                    lineWidth: 0.5,             // Líneas más gruesas
                    renderCell: function(cell, data) {
                        if (data.section === 'head') {
                            cell.text = cell.text.toUpperCase();
                        }
                        return cell;
                    }
                },
                
                // Altura fija para todas las filas del cuerpo
                bodyStyles: { 
                    minCellHeight: 40, // Altura mínima de 40mm
                    fillColor: [255, 255, 255], // Fondo blanco
                    textColor: [0, 0, 0], // Texto negro
                    lineColor: [0, 0, 0], // Líneas negras
                    lineWidth: 0.2 // Grosor de las líneas
                },
                
                // Estilos para las celdas
                columnStyles: {
                    0: { 
                        cellWidth: anchoUtil * 0.25,
                        valign: 'middle'
                    },
                    1: { 
                        cellWidth: anchoUtil * 0.25,
                        valign: 'middle'
                    },
                    2: { 
                        cellWidth: anchoUtil * 0.25,
                        valign: 'middle'
                    },
                    3: { 
                        cellWidth: anchoUtil * 0.25,
                        valign: 'middle'
                    }
                },
                
                // Ajustar altura de filas
                didParseCell: function(data) {
                    data.cell.height = 40; // 40mm de altura
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
                                
                                doc.addImage({
                                    imageData: imageData,
                                    x: x,
                                    y: y,
                                    width: finalWidth,
                                    height: finalHeight
                                });
                                
                            } catch (error) {
                                doc.text("Imagen no disponible", 
                                        data.cell.x + 5, 
                                        data.cell.y + data.cell.height / 2);
                            }
                        } else {
                            doc.text("Sin imagen", 
                                    data.cell.x + 5, 
                                    data.cell.y + data.cell.height / 2);
                        }
                    }
                }
            });
            
            // Generar el PDF como Blob
            const pdfBlob = doc.output('blob');
            console.log(`PDF generado exitosamente para ${proveedor}`);
            resolve({ nombreEmpresa: proveedorInfo.nombreEmpresa, blob: pdfBlob });
            
        } catch (error) {
            console.error(`Error generando PDF para ${proveedor}:`, error);
            reject(error);
        }
    });
}

// Estado del worker
let isProcessing = false;

// Manejar mensajes del hilo principal
self.onmessage = async function(e) {
    const { type, data } = e.data;
    
    if (type === 'GENERATE_PDFS' && !isProcessing) {
        isProcessing = true;
        
        try {
            const { recojosFiltrados, proveedores } = data;
            const proveedoresUnicos = [...new Set(recojosFiltrados.map(r => r.proveedorTelefono))];
            const totalProveedores = proveedoresUnicos.length;
            
            // Notificar inicio del proceso
            self.postMessage({
                type: 'STARTED',
                data: { total: totalProveedores }
            });
            
            // Generar PDFs para cada proveedor en serie
            for (let i = 0; i < totalProveedores; i++) {
                const proveedor = proveedoresUnicos[i];
                const recojosProveedor = recojosFiltrados.filter(r => r.proveedorTelefono === proveedor);
                const proveedorInfo = proveedores.find(p => p.phone === proveedor);
                // Si no se encuentra el proveedor, intentar obtener info de los recojos
                const primerRecojo = recojosProveedor[0];
                
                if (!proveedorInfo && recojosProveedor.length > 0) {
                    console.log(`[Worker] Proveedor no encontrado (${proveedor}), buscando en recojos...`);
                    
                    const primerRecojo = recojosProveedor[0];
                    console.log(`[Worker] Primer recojo encontrado para el proveedor:`, {
                        id: primerRecojo.id,
                        nombreEmpresa: primerRecojo.proveedorNombre,
                        email: primerRecojo.proveedorCorreo
                    });
                
                    // Crear objeto con la información básica del proveedor
                    const nuevoProveedorData = {
                        phone: proveedor,
                        nombreEmpresa: primerRecojo.proveedorNombre,
                        email: primerRecojo.proveedorCorreo,
                        current: i + 1,
                        total: totalProveedores
                    };
                    
                    console.log('[Worker] Preparando datos para nuevo proveedor:', nuevoProveedorData);
                    
                    try {
                        console.log('[Worker] Enviando REGISTER_PROVIDER para proveedor:', proveedor);
                        
                        const waitForConfirmation = new Promise(resolve => {
                            const handler = function(e) {
                                if (e.data.type === 'PROVIDER_REGISTERED') {
                                    self.removeEventListener('message', handler);
                                    resolve();
                                }
                            };
                            self.addEventListener('message', handler);
                            
                            self.postMessage({
                                type: 'REGISTER_PROVIDER',
                                data: nuevoProveedorData,
                                traceId: `prov-${proveedor}-${Date.now()}` // ID único para tracking
                            });
                        });
                        await waitForConfirmation;
                        
                    } catch (error) {
                        console.error('[Worker] Error en registro:', error);                    
                        console.warn('[Worker] Usando datos de fallback:', proveedorInfo);
                    }
                } else if (!proveedorInfo) {
                    console.warn(`[Worker] No se encontró información para el proveedor ${proveedor} y no hay recojos asociados`);
                }

                try {
                    // Notificar inicio de generación para este proveedor
                    self.postMessage({
                        type: 'PROVIDER_START',
                        data: {
                            current: i + 1,
                            total: totalProveedores,
                            nombreEmpresa: proveedorInfo?.nombreEmpresa || primerRecojo.proveedorNombre
                        }
                    });
                    
                    // Generar PDF
                    const pdfData = await generateProviderPDF(proveedor, recojosProveedor, proveedorInfo);
                    
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
                                email: proveedorInfo?.email,
                                totalPedidos: recojosProveedor.length,
                                recojosProveedor: recojosProveedor
                            }
                        });
                    });
                    
                    await waitForConfirmation;
                    
                } catch (error) {
                    console.error(`Error generando PDF para ${proveedor}:`, error);
                    self.postMessage({
                        type: 'PROVIDER_ERROR',
                        data: { 
                            nombreEmpresa: proveedor,
                            error: error.message,
                            current: i + 1,
                            total: totalProveedores
                        }
                    });
                }
            }
            
            // Notificar finalización
            self.postMessage({ type: 'COMPLETE' });
            
        } catch (error) {
            console.error("Error en el worker:", error);
            self.postMessage({
                type: 'ERROR',
                data: { 
                    error: "Error general en el worker",
                    details: error.message
                }
            });
        } finally {
            isProcessing = false;
        }
    }
};