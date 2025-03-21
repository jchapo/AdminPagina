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
                return data.filter(row => 
                    row.fechaAnulacionPedido === null && 
                    row.fechaEntregaPedidoMotorizado !== null
                );
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
                data: 'pedidoMetodoPago',  // Mantenemos esta referencia para compatibilidad
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
                        // Fallback para cuando no hay pagos registrados
                        let clase = 'bg-label-secondary'; // Color por defecto
                        
                        // Si hay imagen, agregar el icono antes del badge
                        let icono = '';
                        if (row.pedidoFotoDinero) {
                            icono = `
                                <a href="#" class="ver-imagen me-2" data-url="${row.thumbnailFotoDinero}">
                                    <i class="fas fa-image fa-lg text-primary preview-trigger"></i>
                                </a>
                            `;
                        }
                        
                        // Mostrar el método de pago original con un color neutral
                        return `${icono}<span class="badge ${clase}">${data || 'No especificado'}</span>`;
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
                    let comision = parseFloat(row.comisionTarifa) || 0;
                    let cantidadCobrar = parseFloat(row.pedidoCantidadCobrar) || 0;
                    let diferencia = cantidadCobrar - comision;
                    return `S/ ${diferencia.toFixed(2)}`;
                }
            },
            { 
                data: 'pedidoCantidadCobrar',
                render: function (data) {
                    return data ? `S/ ${parseFloat(data).toFixed(2)}` : 'S/ 0.00';
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
                    let pedidoTotal = row.pedidoCantidadCobrar ? parseFloat(row.pedidoCantidadCobrar.replace(/[^\d.]/g, '')) || 0 : 0;
                    let comision = parseFloat(row.comisionTarifa) || 0;
                    
                    // Monto que debería recibir el proveedor (pedido total menos comisión)
                    let montoProveedorIdeal = pedidoTotal - comision;
                    
                    // Sumar al total de cobros
                    cobroSum += pedidoTotal;
                    
                    // Variables para esta fila
                    let montoÑanpi = 0;
                    let montoProveedor = 0;
                    let montoMotorizado = 0;
                    
                    // Verificar si existe pagosRegistrados y es un array
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
            
                addCell(tr, 'Subtotales ' + group, 2);
                addCell(tr, 'Recibir: ' + `S/ ${recibirSum.toFixed(2)}`);
                addCell(tr, 'Devolver: ' + `S/ ${devolverSum.toFixed(2)}`);
                addCell(tr, `Ñanpi: S/ ${ñanpiSum.toFixed(2)}` + " | " + `Proveedor: S/ ${proveedorSum.toFixed(2)}` + " | " + `Motorizado: S/ ${motorizadoSum.toFixed(2)}`);


                addCell(tr, 'T. Comisión: ' + `S/ ${comisionSum.toFixed(2)}`);
                addCell(tr, 'T. Din. Prov.: ' + `S/ ${dineroProveedor.toFixed(2)}`);
                addCell(tr, 'T. Cobro: ' + `S/ ${cobroSum.toFixed(2)}`);
            
                return tr;
            },
            dataSrc: 'proveedorNombre' // Agrupar por nombre del proveedor
        },
        //autoWidth: false
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

