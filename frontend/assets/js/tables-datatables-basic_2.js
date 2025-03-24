let recojosFiltrados = []; // Variable global
let proveedores = []; // Variable global para almacenar los proveedores


document.addEventListener("DOMContentLoaded", function () {
    function addCell(tr, content, colSpan = 1) {
        let td = document.createElement('td');
        td.colSpan = colSpan;
        td.textContent = content;
        tr.appendChild(td);
    }

    new DataTable('#example', {
        ajax: {
            url: 'http://localhost:3000/api/recojos',
            dataSrc: function (data) {
                recojosFiltrados = data.filter(row => 
                    row.fechaAnulacionPedido === null && 
                    row.fechaEntregaPedidoMotorizado !== null
                );
                return recojosFiltrados;
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


    document.getElementById("btnCerrarReportar").addEventListener("click", async function (event) {
        event.preventDefault(); // Evita que el enlace recargue la página

        try {
            // Obtener proveedores de la API
            const response = await fetch("http://localhost:3000/api/proveedores");
            if (!response.ok) throw new Error("Error al obtener los proveedores");

            proveedores = await response.json(); // Guardar los proveedores en la variable global
            //console.log("Proveedores obtenidos:", proveedores);

            // Generar un PDF por cada proveedor en recojosFiltrados
            generarPDFs();

        } catch (error) {
            console.error("Error:", error);
        }
    });
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

    console.log("PDFs generados correctamente");
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