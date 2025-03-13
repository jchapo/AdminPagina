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
                data: 'pedidoMetodoPago',
                render: function (data, type, row) {
                    const metodoPagoClases = {
                        'Yape': 'bg-label-primary',
                        'Transferencia': 'bg-label-warning',
                        'Efectivo': 'bg-label-success',
                        'Pago Link': 'bg-label-dark',
                        'Plin': 'bg-label-info'
                    };
                    const clase = metodoPagoClases[data] || 'bg-label-secondary';
                    
                    // Si hay imagen, agregar el icono antes del badge
                    let icono = '';
                    if (row.pedidoFotoDinero) {
                        icono = `
                            <a href="#" class="ver-imagen me-2" data-url="${row.pedidoFotoDinero}">
                                <i class="fas fa-image fa-lg text-primary"></i>
                            </a>
                        `;
                    }
            
                    return `${icono}<span class="badge ${clase}">${data || 'No especificado'}</span>`;
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
        
                let cobroSum = rows
                    .data()
                    .toArray()
                    .reduce((total, row) => {
                        let valor = row.pedidoCantidadCobrar ? row.pedidoCantidadCobrar.replace(/[^\d.]/g, '') : '0';
                        return total + parseFloat(valor) || 0;
                    }, 0);

                // 🔹 Suma de montos por método de pago "Yape"
                let yapeSum = rows
                    .data()
                    .toArray()
                    .filter(row => row.pedidoMetodoPago === 'Yape')
                    .reduce((total, row) => {
                        let valor = row.pedidoCantidadCobrar ? row.pedidoCantidadCobrar.replace(/[^\d.]/g, '') : '0';
                        return total + parseFloat(valor) || 0;
                    }, 0);

                // 🔹 Suma de montos por método de pago "Efectivo"
                let efectivoSum = rows
                    .data()
                    .toArray()
                    .filter(row => row.pedidoMetodoPago === 'Efectivo')
                    .reduce((total, row) => {
                        let valor = row.pedidoCantidadCobrar ? row.pedidoCantidadCobrar.replace(/[^\d.]/g, '') : '0';
                        return total + parseFloat(valor) || 0;
                    }, 0);

                let otrosSum = cobroSum - yapeSum - efectivoSum;

                let tr = document.createElement('tr');
                tr.classList.add('subtotal-row'); // Agregar clase para personalización

                addCell(tr, 'Subtotal ' + group, 2);
                addCell(tr, `Otros: S/ ${otrosSum.toFixed(2)}`);
                addCell(tr, `Yape: S/ ${yapeSum.toFixed(2)}`);
                addCell(tr, `Efectivo: S/ ${efectivoSum.toFixed(2)}`);
                addCell(tr, `S/ ${comisionSum.toFixed(2)}`);
                addCell(tr, `S/ ${cobroSum.toFixed(2)}`);

                return tr;
            },
            dataSrc: 'proveedorNombre' // Agrupar por nombre del proveedor
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

