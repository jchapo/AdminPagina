// URL de la API del servidor backend
const API_URL = 'http://localhost:3000/api/recojos';

// Esperar a que el documento esté completamente cargado
$(document).ready(function() {
    // Inicializar DataTable
    const table = $('.dt-multilingual').DataTable({
        language: {
            url: '../assets/es-ES.json',
        },
        responsive: true,
        dom: `
        <"card"
            <"row card-header flex-column flex-md-row pb-0"
                <"col-md-auto me-auto"
                    <"d-md-flex align-items-center"
                        <"card-title mb-0">
                    >
                >
                <"col-md-auto ms-auto"
                    <"dt-buttons btn-group flex-wrap mb-0"B>
                >
            >
            <"row m-3 my-0 justify-content-between"
                <"col-md-6"l>
                <"col-md-6 d-flex justify-content-end"f>
            >
            t
            <"row mx-2"
                <"col-sm-12 col-md-6"i>
                <"col-sm-12 col-md-6"p>
            >
        >`,
        buttons: [
            {
                extend: 'collection',
                className: 'btn btn-collection btn-label-primary dropdown-toggle me-4',
                text: `
                    <span class="d-flex align-items-center gap-2">
                        <i class="icon-base bx bx-export me-sm-1"></i>
                        <span class="d-none d-sm-inline-block">Exportar</span>
                    </span>
                `,
                buttons: [
                    {
                        extend: 'print',
                        text: '<i class="bx bx-printer me-1"></i>Imprimir',
                        className: 'dropdown-item'
                    },
                    {
                        extend: 'csv',
                        text: '<i class="bx bx-file me-1"></i>CSV',
                        className: 'dropdown-item'
                    },
                    {
                        extend: 'excel',
                        text: '<i class="bx bx-file me-1"></i>Excel',
                        className: 'dropdown-item'
                    },
                    {
                        extend: 'pdf',
                        text: '<i class="bx bx-file me-1"></i>PDF',
                        className: 'dropdown-item'
                    }
                ]
            },
            {
                text: `
                    <span class="d-flex align-items-center gap-2">
                        <i class="icon-base bx bx-plus icon-sm"></i>
                        <span class="d-none d-sm-inline-block">Agregar Nuevo</span>
                    </span>
                `,
                className: 'btn create-new btn-primary',
                action: function (e, dt, node, config) {
                    // Aquí puedes agregar la acción para el botón "Agregar Nuevo"
                    // Por ejemplo, abrir un modal
                }
            }
        ],
        initComplete: function () {
            // Remover la clase btn-secondary de los botones generados automáticamente
            $('.dt-buttons .btn-secondary').removeClass('btn-secondary');
        },
        columns: [
            { data: 'fechaEntrega' },
            { data: 'proveedor' },
            { data: 'cliente' },
            { data: 'telefonoCliente' },
            { data: 'destino' },
            { 
                data: 'cobro',
                render: function(data) {
                    return `S/ ${parseFloat(data).toFixed(2)}`;
                }
            },
            { 
                data: 'metodoPago',
                render: function(data) {
                    const badgeClass = data === 'Efectivo' ? 'bg-label-success' : 'bg-label-primary';
                    return `<span class="badge ${badgeClass}">${data}</span>`;
                }
            },
            { 
                data: null,
                defaultContent: '',
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="d-inline-block">
                            <a href="javascript:;" class="btn btn-sm btn-icon dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                <i class="bx bx-dots-vertical-rounded"></i>
                            </a>
                            <ul class="dropdown-menu dropdown-menu-end m-0">
                                <li><a href="javascript:;" class="dropdown-item edit-btn" data-id="${row.DT_RowId}">
                                    <i class="bx bx-edit-alt me-1"></i> Editar</a></li>
                                <li><a href="javascript:;" class="dropdown-item delete-btn text-danger" data-id="${row.DT_RowId}">
                                    <i class="bx bx-trash me-1"></i> Eliminar</a></li>
                            </ul>
                        </div>
                        <a href="javascript:;" class="btn btn-sm btn-icon item-edit">
                            <i class="bx bx-edit"></i>
                        </a>
                    `;
                }
            }
        ]
    });

    // Cargar los recojos desde la API
    // Cargar los recojos desde la API
async function loadRecojos() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Verificar la respuesta de la API
        console.log('Datos obtenidos desde la API:', data);

        // Limpiar la tabla antes de agregar los nuevos recojos
        //table.clear();

        // Agregar los datos a la tabla
        data.forEach(recojo => {
            // Verificar los datos de cada recojo
            console.log('Datos de recojo:', recojo);

            const fechaEntrega = recojo.fechaEntregaPedido
                ? new Date(recojo.fechaEntregaPedido._seconds * 1000).toLocaleDateString('es-ES')
                : '';
            
            // Acceder a los campos correctos de cada recojo
            const proveedor = recojo.proveedorNombre || 'No disponible';
            const cliente = recojo.clienteNombre || 'No disponible';
            const telefono = recojo.clienteTelefono || 'No disponible';
            const destino = recojo.pedidoDireccionFormulario || 'No disponible';
            const cobro = recojo.pedidoCantidadCobrar || 0;
            const metodoPago = recojo.pedidoMetodoPago || 'No disponible';

            // Verificar los valores que se van a agregar a la tabla
            console.log('Valores a agregar a la tabla:', {
                fechaEntrega: fechaEntrega,
                proveedor: proveedor,
                cliente: cliente,
                telefonoCliente: telefono,
                destino: destino,
                cobro: cobro,
                metodoPago: metodoPago
            });

            // Agregar fila a la tabla
            table.row.add({
                fechaEntrega: fechaEntrega,
                proveedor: proveedor,
                cliente: cliente,
                telefonoCliente: telefono,
                destino: destino,
                cobro: cobro,
                metodoPago: metodoPago
            }).draw();
        });

        // Actualizar el título de la tabla
        $('.card-title').html('<h5 class="mb-0">Tabla de Recojos</h5>');

    } catch (error) {
        console.error('Error al cargar los recojos:', error);
    }
}


    // Llamar a la función para cargar los datos
    loadRecojos();
});
