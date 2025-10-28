// pdf-worker-diagnostic.js - Versión simple para diagnóstico

console.log('[WORKER DIAGNOSTIC] Worker iniciado exitosamente');

// Manejo de errores básico
self.addEventListener('error', function(error) {
    console.error('[WORKER DIAGNOSTIC] Error event:', error);
    self.postMessage({
        type: 'ERROR',
        data: { 
            error: 'Error en worker',
            message: error.message,
            filename: error.filename,
            lineno: error.lineno
        }
    });
});

self.addEventListener('unhandledrejection', function(event) {
    console.error('[WORKER DIAGNOSTIC] Unhandled rejection:', event.reason);
    self.postMessage({
        type: 'ERROR',
        data: { 
            error: 'Promise rechazada',
            details: event.reason?.message || event.reason
        }
    });
});

// Variable para token
self.authToken = null;

// Manejo de mensajes
self.onmessage = function(e) {
    console.log('[WORKER DIAGNOSTIC] Mensaje recibido:', e.data);
    
    try {
        const { type, data } = e.data;
        
        switch (type) {
            case 'SET_TOKEN':
                self.authToken = data.token;
                console.log('[WORKER DIAGNOSTIC] Token configurado:', !!self.authToken);
                self.postMessage({
                    type: 'TOKEN_SET',
                    data: { success: true }
                });
                break;
                
            case 'GENERATE_PDFS':
                console.log('[WORKER DIAGNOSTIC] Iniciando generación de PDFs...');
                console.log('[WORKER DIAGNOSTIC] Recojos recibidos:', data.recojosFiltrados?.length);
                console.log('[WORKER DIAGNOSTIC] Proveedores recibidos:', data.proveedores?.length);
                
                // Verificar librerías
                try {
                    // Intentar cargar jsPDF
                    importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
                    console.log('[WORKER DIAGNOSTIC] jsPDF cargado exitosamente');
                    
                    importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');
                    console.log('[WORKER DIAGNOSTIC] jsPDF AutoTable cargado exitosamente');
                    
                    // Verificar que jsPDF esté disponible
                    if (typeof self.jspdf !== 'undefined' && self.jspdf.jsPDF) {
                        console.log('[WORKER DIAGNOSTIC] jsPDF disponible');
                        
                        // Prueba básica de creación de PDF
                        const { jsPDF } = self.jspdf;
                        const doc = new jsPDF();
                        doc.text('Test PDF', 10, 10);
                        const pdfBlob = doc.output('blob');
                        
                        console.log('[WORKER DIAGNOSTIC] PDF de prueba creado exitosamente, tamaño:', pdfBlob.size);
                        
                        self.postMessage({
                            type: 'TEST_SUCCESS',
                            data: { 
                                message: 'Worker funcionando correctamente',
                                pdfSize: pdfBlob.size,
                                hasToken: !!self.authToken
                            }
                        });
                        
                    } else {
                        throw new Error('jsPDF no está disponible después de importar');
                    }
                    
                } catch (libError) {
                    console.error('[WORKER DIAGNOSTIC] Error cargando librerías:', libError);
                    self.postMessage({
                        type: 'ERROR',
                        data: { 
                            error: 'Error cargando librerías PDF',
                            details: libError.message
                        }
                    });
                }
                break;
                
            default:
                console.warn('[WORKER DIAGNOSTIC] Tipo de mensaje no reconocido:', type);
                self.postMessage({
                    type: 'WARNING',
                    data: { message: 'Tipo de mensaje no reconocido: ' + type }
                });
                break;
        }
        
    } catch (error) {
        console.error('[WORKER DIAGNOSTIC] Error procesando mensaje:', error);
        self.postMessage({
            type: 'ERROR',
            data: { 
                error: 'Error procesando mensaje',
                details: error.message,
                stack: error.stack
            }
        });
    }
};

console.log('[WORKER DIAGNOSTIC] Worker configurado y listo para recibir mensajes');