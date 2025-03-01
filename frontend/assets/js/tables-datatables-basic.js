let offCanvasEl;
let o;
document.addEventListener("DOMContentLoaded", function (e) {

    var r, t = document.querySelector(".datatables-basic");
    t && ((s = document.createElement("h5")).classList.add("card-title", "mb-0", "text-md-start", "text-center"),
        s.innerHTML = "Tabla de Entregas",
        o = new DataTable(t, {
            ajax: {
                url: 'http://localhost:3000/api/recojos',
                dataSrc: ''
            },
            columns: [
                {
                    data: null,
                    defaultContent: '',
                    orderable: false,
                    searchable: false
                },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: DataTable.render.select()
                },
                { data: 'id' },
                {
                    data: 'fechaEntregaPedido',
                    render: function (data) {
                        return formatDate(data); // Usar la función formatDate para formatear la fecha
                    }
                },
                {
                    data: 'proveedorNombre',
                    render: function (data) {
                        if (data) {
                            // Truncar el texto a 20 caracteres y añadir puntos suspensivos si es más largo
                            return data.length > 20 ? data.substring(0, 20) + '...' : data;
                        } else {
                            return 'No disponible';
                        }
                    }
                },
                {
                    data: 'clienteNombre',
                    render: function (data) {
                        if (data) {
                            // Truncar el texto a 20 caracteres y añadir puntos suspensivos si es más largo
                            return data.length > 20 ? data.substring(0, 20) + '...' : data;
                        } else {
                            return 'No disponible';
                        }
                    }
                },
                {
                    data: 'clienteTelefono',
                    render: function (data) {
                        return data || 'No disponible';
                    }
                },
                {
                    data: 'clienteDistrito',
                    render: function (data) {
                        return data || 'No disponible';
                    }
                },
                // Nueva columna para comisionTarifa
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
                },
                {
                    data: 'pedidoMetodoPago',
                    render: function (data) {
                        const metodoPagoClases = {
                            'Yape': 'bg-label-primary',
                            'Transferencia': 'bg-label-warning',
                            'Efectivo': 'bg-label-success',
                            'Pago Link': 'bg-label-dark',
                            'Plin': 'bg-label-info'
                        };
        
                        const clase = metodoPagoClases[data] || 'bg-label-secondary';
                        return `<span class="badge ${clase}">${data || 'No especificado'}</span>`;
                    }
                },
                {
                    data: null,
                    title: "Acciones",
                    orderable: false,
                    searchable: false
                },
                { data: 'pedidoDetalle'}
            ],
            columnDefs: [{
                className: "control",
                orderable: !1,
                searchable: !1,
                responsivePriority: 2,
                targets: 0,
                render: function (e, t, a, s) {
                    return ""
                }
            }, {
                targets: 1,
                orderable: !1,
                searchable: !1,
                responsivePriority: 3,
                checkboxes: !0,
                checkboxes: {
                    selectAllRender: '<input type="checkbox" class="form-check-input">'
                },
                render: function () {
                    return '<input type="checkbox" class="dt-checkboxes form-check-input">'
                }
            }, {
                targets: 2,
                searchable: !1,
                visible: !1
            }, {
                targets: 3,
                responsivePriority: 4,
                /*render: function (e, t, a, s) {
                    var n = a.avatar
                        , r = a.full_name
                        , a = a.post;
                    let o;
                    if (n)
                        o = `<img src="${assetsPath}img/avatars/${n}" alt="Avatar" class="rounded-circle">`;
                    else {
                        n = ["success", "danger", "warning", "info", "dark", "primary", "secondary"][Math.floor(6 * Math.random())];
                        let e = r.match(/\b\w/g) || [];
                        e = ((e.shift() || "") + (e.pop() || "")).toUpperCase(),
                            o = `<span class="avatar-initial rounded-circle bg-label-${n}">${e}</span>`
                    }
                    return `
              <div class="d-flex justify-content-start align-items-center user-name">
                <div class="avatar-wrapper">
                  <div class="avatar me-2">
                    ${o}
                  </div>
                </div>
                <div class="d-flex flex-column">
                  <span class="emp_name text-truncate text-heading">${r}</span>
                  <small class="emp_post text-truncate">${a}</small>
                </div>
              </div>
            `
                }*/
            }, {
                responsivePriority: 1,
                targets: 4
            }, {
                targets: -1,
                searchable: !1,
                visible: !1
            }, {
                targets: -2,
                title: "Actions",
                orderable: !1,
                searchable: !1,
                className: "d-flex align-items-center",
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block">
                            <a href="javascript:;" class="btn btn-icon item-view" data-id="${row.id}">
                                <i class="icon-base bx bx-show icon-sm"></i> <!-- Icono de ojo -->
                            </a>
                            <a href="javascript:;" class="btn btn-icon item-edit" data-id="${row.id}">
                                <i class="icon-base bx bx-edit icon-sm"></i> <!-- Icono de editar -->
                            </a>
                            <a href="javascript:;" class="btn btn-icon text-danger delete-record" data-id="${row.id}">
                                <i class="icon-base bx bx-trash icon-sm"></i> <!-- Icono de eliminar -->
                            </a>
                        </div>`;
                }
            }],
            select: {
                style: "multi",
                selector: "td:nth-child(2)"
            },
            rowCallback: function (row, data) {
                if (data.fechaAnulacionPedido !== null) {
                    $(row).css('background-color', '#ffcccc'); // Rojo claro si el pedido fue anulado
                } else if (data.fechaEntregaPedidoMotorizado !== null && data.fechaRecojoPedidoMotorizado !== null) {
                    $(row).css('background-color', '#ccffcc'); // Verde claro si el pedido fue entregado
                } else if (data.fechaRecojoPedidoMotorizado !== null) {
                    $(row).css('background-color', '#ffffcc'); // Verde claro si el pedido fue entregado
                }
                
                
            },
            order: [[3, "desc"]],
            displayLength: 7,
            layout: {
                top2Start: {
                    rowClass: "row card-header flex-column flex-md-row pb-0",
                    features: [s]
                },
                top2End: {
                    features: [{
                        buttons: [{
                            extend: "collection",
                            className: "btn btn-label-primary dropdown-toggle me-4",
                            text: '<span class="d-flex align-items-center gap-2"><i class="icon-base bx bx-export me-sm-1"></i> <span class="d-none d-sm-inline-block">Exportar</span></span>',
                            buttons: [{
                                extend: "print",
                                text: '<span class="d-flex align-items-center"><i class="icon-base bx bx-printer me-1"></i>Print</span>',
                                className: "dropdown-item",
                                exportOptions: {
                                    columns: [3, 4, 5, 6, 7, 8, 9, 10, 12], 
                                    format: {
                                        body: function (e, t, a) {
                                            if (e.length <= 0)
                                                return e;
                                            e = (new DOMParser).parseFromString(e, "text/html");
                                            let s = "";
                                            var n = e.querySelectorAll(".user-name");
                                            return 0 < n.length ? n.forEach(e => {
                                                e = e.querySelector(".fw-medium")?.textContent || e.querySelector(".d-block")?.textContent || e.textContent;
                                                s += e.trim() + " "
                                            }
                                            ) : s = e.body.textContent || e.body.innerText,
                                                s.trim()
                                        }
                                    }
                                },
                                customize: function (e) {
                                    e.document.body.style.color = config.colors.headingColor,
                                        e.document.body.style.borderColor = config.colors.borderColor,
                                        e.document.body.style.backgroundColor = config.colors.bodyBg;
                                    e = e.document.body.querySelector("table");
                                    e.classList.add("compact"),
                                        e.style.color = "inherit",
                                        e.style.borderColor = "inherit",
                                        e.style.backgroundColor = "inherit"
                                }
                            }, {
                                extend: "csv",
                                text: '<span class="d-flex align-items-center"><i class="icon-base bx bx-file me-1"></i>Csv</span>',
                                className: "dropdown-item",
                                exportOptions: {
                                    columns: [3, 4, 5, 6, 7, 8, 9, 10, 12], 
                                    format: {
                                        body: function (e, t, a) {
                                            if (e.length <= 0)
                                                return e;
                                            e = (new DOMParser).parseFromString(e, "text/html");
                                            let s = "";
                                            var n = e.querySelectorAll(".user-name");
                                            return 0 < n.length ? n.forEach(e => {
                                                e = e.querySelector(".fw-medium")?.textContent || e.querySelector(".d-block")?.textContent || e.textContent;
                                                s += e.trim() + " "
                                            }
                                            ) : s = e.body.textContent || e.body.innerText,
                                                s.trim()
                                        }
                                    }
                                }
                            }, {
                                extend: "excel",
                                text: '<span class="d-flex align-items-center"><i class="icon-base bx bxs-file-export me-1"></i>Excel</span>',
                                className: "dropdown-item",
                                exportOptions: {
                                    columns: [3, 4, 5, 6, 7, 8, 9, 10, 12], 
                                    format: {
                                        body: function (e, t, a) {
                                            if (e.length <= 0)
                                                return e;
                                            e = (new DOMParser).parseFromString(e, "text/html");
                                            let s = "";
                                            var n = e.querySelectorAll(".user-name");
                                            return 0 < n.length ? n.forEach(e => {
                                                e = e.querySelector(".fw-medium")?.textContent || e.querySelector(".d-block")?.textContent || e.textContent;
                                                s += e.trim() + " "
                                            }
                                            ) : s = e.body.textContent || e.body.innerText,
                                                s.trim()
                                        }
                                    }
                                }
                            }, {
                                extend: "pdf",
                                text: '<span class="d-flex align-items-center"><i class="icon-base bx bxs-file-pdf me-1"></i>Pdf</span>',
                                className: "dropdown-item",
                                exportOptions: {
                                    columns: [3, 4, 5, 6, 7, 8, 9, 10, 12], 
                                    format: {
                                        body: function (e, t, a) {
                                            if (e.length <= 0)
                                                return e;
                                            e = (new DOMParser).parseFromString(e, "text/html");
                                            let s = "";
                                            var n = e.querySelectorAll(".user-name");
                                            return 0 < n.length ? n.forEach(e => {
                                                e = e.querySelector(".fw-medium")?.textContent || e.querySelector(".d-block")?.textContent || e.textContent;
                                                s += e.trim() + " "
                                            }
                                            ) : s = e.body.textContent || e.body.innerText,
                                                s.trim()
                                        }
                                    }
                                }
                            }, {
                                extend: "copy",
                                text: '<i class="icon-base bx bx-copy me-1"></i>Copy',
                                className: "dropdown-item",
                                exportOptions: {
                                    columns: [3, 4, 5, 6, 7, 8, 9, 10, 12], 
                                    format: {
                                        body: function (e, t, a) {
                                            if (e.length <= 0)
                                                return e;
                                            e = (new DOMParser).parseFromString(e, "text/html");
                                            let s = "";
                                            var n = e.querySelectorAll(".user-name");
                                            return 0 < n.length ? n.forEach(e => {
                                                e = e.querySelector(".fw-medium")?.textContent || e.querySelector(".d-block")?.textContent || e.textContent;
                                                s += e.trim() + " "
                                            }
                                            ) : s = e.body.textContent || e.body.innerText,
                                                s.trim()
                                        }
                                    }
                                }
                            }]
                        }, {
                            text: '<span class="d-flex align-items-center gap-2"><i class="icon-base bx bx-plus icon-sm"></i> <span class="d-none d-sm-inline-block">Nueva Entrega</span></span>',
                            className: "btn btn-primary",
                            attr: {
                                "data-bs-toggle": "modal",
                                "data-bs-target": "#backDropModal"
                            }
                        }]
                    }]
                },
                topStart: {
                    rowClass: "row m-3 my-0 justify-content-between",
                    features: [{
                        pageLength: {
                            menu: [7, 10, 25, 50, 100],
                            text: "Mostrar_MENU_registros"
                        }
                    }]
                },
                topEnd: {
                    search: {
                        placeholder: ""
                    }
                },
                bottomStart: {
                    rowClass: "row mx-3 justify-content-between",
                    features: ["info"]
                },
                bottomEnd: {
                    paging: {
                        firstLast: !1
                    }
                }
            },
            language: {
                url: '../assets/es-ES.json',
                paginate: {
                    next: '<i class="icon-base bx bx-chevron-right scaleX-n1-rtl icon-sm"></i>',
                    previous: '<i class="icon-base bx bx-chevron-left scaleX-n1-rtl icon-sm"></i>'
                }
            },
            responsive: {
                details: {
                    display: DataTable.Responsive.display.modal({
                        header: function (e) {
                            return "Details of " + e.data().full_name
                        }
                    }),
                    type: "column",
                    renderer: function (e, t, a) {
                        var s, n, r, a = a.map(function (e) {
                            return "" !== e.title ? `<tr data-dt-row="${e.rowIndex}" data-dt-column="${e.columnIndex}">
                      <td>${e.title}:</td>
                      <td>${e.data}</td>
                    </tr>` : ""
                        }).join("");
                        return !!a && ((s = document.createElement("div")).classList.add("table-responsive"),
                            n = document.createElement("table"),
                            s.appendChild(n),
                            n.classList.add("table"),
                            n.classList.add("datatables-basic"),
                            (r = document.createElement("tbody")).innerHTML = a,
                            n.appendChild(r),
                            s)
                    }
                }
            }
        }),
        r = 101,
        // Event listener para el botón de visualizar detalles
        document.addEventListener('click', function(e) {
            if (e.target.closest('.item-view')) {
                const row = o.row(e.target.closest('tr')).data();
                loadDataToModal2(row); // Llenar el modal con datos
                //console.log(row); // Verifica si los datos se están obteniendo correctamente
                const modal = new bootstrap.Modal(document.getElementById('viewDetailsModal')); // Abrir el modal correcto
                modal.show();
            }
        }),

        // Event listener para el botón de editar
        document.addEventListener('click', function(e) {
            if (e.target.closest('.item-edit')) {
                const row = o.row(e.target.closest('tr')).data();
                loadDataToModal(row);
                //console.log(row); // Verifica si los datos ocultos siguen en el objeto
                const modal = new bootstrap.Modal(document.getElementById('backDropModal'));
                modal.show();
            }
        }),

        // Event listener para el botón de eliminar
        document.addEventListener('click', function (e) {
            if (e.target.closest('.delete-record')) {
                // Obtener el ID del registro a eliminar
                const recordId = e.target.closest('.delete-record').getAttribute('data-id');
        
                // Mostrar el modal de confirmación
                const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
                deleteModal.show();
        
                // Asignar el ID al botón de confirmar eliminación
                document.getElementById('confirmDeleteButton').setAttribute('data-id', recordId);
            }
        })

        
        
    );


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
});

// Asegúrate de inicializar Firebase antes de usar Firestore
const db = firebase.firestore(); // Si no has inicializado Firebase, hazlo antes

// Referencia a la colección en Firestore
const recojosRef = db.collection("recojos"); 

// Escuchar cambios en tiempo real
recojosRef.onSnapshot((snapshot) => {
    let datosActualizados = [];
    
    snapshot.forEach((doc) => {
        datosActualizados.push(doc.data());
    });

    // Actualizar la DataTable con los nuevos datos
    o.clear().rows.add(datosActualizados).draw();
});




// Función auxiliar para formatear la fecha
function formatDate(timestamp) {
    if (!timestamp || !timestamp._seconds) return '';

    // Convertir el timestamp en un objeto Date
    const date = new Date(timestamp._seconds * 1000);

    // Obtener día, mes y año con formato adecuado
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes en base 0
    const year = date.getFullYear();

    // Retornar la fecha en formato DD-MM-YYYY
    return `${day}-${month}-${year}`;
}

function loadDataToModal(data) {
    // Cargar datos básicos
    document.getElementById('fechaEntrega').value = formatDate(data.fechaEntregaPedido);
    document.getElementById('proveedorName').value = data.proveedorNombre || '';
    document.getElementById('proveedorTelefono').value = data.proveedorTelefono || '';
    document.getElementById('proveedorDireccionLink').value = data.proveedorDireccionLink || '';
    
    // Asignar valor al select de proveedorDistrito y actualizar select2
    const proveedorDistritoSelect = document.getElementById('proveedorDistrito');
    proveedorDistritoSelect.value = data.proveedorDistrito || '';
    $(proveedorDistritoSelect).trigger('change'); // Actualizar select2

    // Información del cliente
    document.getElementById('clienteName').value = data.clienteNombre || '';
    document.getElementById('clienteTelefono').value = data.clienteTelefono || '';
    
    // Asignar valor al select de clienteDistrito y actualizar select2
    const clienteDistritoSelect = document.getElementById('clienteDistrito');
    clienteDistritoSelect.value = data.clienteDistrito || '';
    $(clienteDistritoSelect).trigger('change'); // Actualizar select2
    
    document.getElementById('pedidoDireccionLink').value = data.pedidoDireccionLink || '';

    // Detalles del pedido
    document.getElementById('pedidoDetalle').value = data.pedidoDetalle || '';
    document.getElementById('cantidadCobrar').value = data.pedidoCantidadCobrar || '';

    // Asignar valor al select de metodoPago y actualizar select2
    const metodoPagoSelect = document.getElementById('metodoPago');
    metodoPagoSelect.value = data.pedidoMetodoPago || '';
    $(metodoPagoSelect).trigger('change'); // Actualizar select2

    // Asignar valor al select de motorizadoEntrega y actualizar select2
    const motorizadoEntregaSelect = document.getElementById('motorizadoEntrega');
    motorizadoEntregaSelect.value = data.motorizadoEntrega || '';
    $(motorizadoEntregaSelect).trigger('change'); // Actualizar select2

    // Asignar valor al select de motorizadoRecojo y actualizar select2
    const motorizadoRecojoSelect = document.getElementById('motorizadoRecojo');
    motorizadoRecojoSelect.value = data.motorizadoRecojo || '';
    $(motorizadoRecojoSelect).trigger('change'); // Actualizar select2
    
    // Observaciones
    document.getElementById('observaciones').value = data.pedidoObservaciones || '';

    // Cargar comisionTarifa y supera30x30
    document.getElementById('comisionTarifa').value = data.comisionTarifa || '';
    document.getElementById('supera30x30').checked = data.supera30x30 === 1;

    // Agregar un campo oculto para fechaCreacionPedido
    document.getElementById('fechaCreacionPedido').value = data.fechaCreacionPedido;

    // Agregar un data attribute al formulario para identificar que es una edición
    document.getElementById('recojoForm').setAttribute('data-edit-id', data.id);

    // Cambiar el texto del botón de guardar
    document.querySelector('#recojoForm button[type="submit"]').textContent = 'Actualizar';
}

// Event listener para el botón de editar
/*document.addEventListener('click', function(e) {
    if (e.target.closest('.item-edit')) {
        const row = o.row(e.target.closest('tr')).data();
        loadDataToModal(row);
        console.log(row); // Verifica si los datos ocultos siguen en el objeto
        const modal = new bootstrap.Modal(document.getElementById('backDropModal'));
        modal.show();
    }
});*/

// Event listener para el botón de eliminar
/*document.addEventListener('click', function (e) {
    if (e.target.closest('.delete-record')) {
        // Obtener el ID del registro a eliminar
        const recordId = e.target.closest('.delete-record').getAttribute('data-id');

        // Mostrar el modal de confirmación
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
        deleteModal.show();

        // Asignar el ID al botón de confirmar eliminación
        document.getElementById('confirmDeleteButton').setAttribute('data-id', recordId);
    }
});*/

document.addEventListener('DOMContentLoaded', function () {
    const modalElement = document.getElementById('recojoForm'); // Tu formulario
    const modalCloseButtons = document.querySelectorAll('[data-bs-dismiss="modal"], .btn-close'); // Botones de cerrar y cancelar
    const modal = document.getElementById('backDropModal');
    const submitButton = document.querySelector('#recojoForm button[type="submit"]');
    const modalLabel = document.getElementById('recojoModalLabel');

    // Función para limpiar el formulario
    function clearForm() {
        // Limpiar todos los campos del formulario
        modalElement.reset();
    
        // Limpiar campos de Select2
        $('#clienteDistrito').val(null).trigger('change'); // Limpiar Select2 de clienteDistrito
        $('#proveedorDistrito').val(null).trigger('change'); // Limpiar Select2 de proveedorDistrito (si existe)
        $('#metodoPago').val(null).trigger('change'); // Limpiar Select2 de metodoPago (si existe)
    
        // Eliminar el atributo de edición
        modalElement.removeAttribute('data-edit-id');
    
        // Restaurar título y texto del botón
        modalLabel.textContent = 'Nueva Entrega';
        submitButton.textContent = 'Guardar';
    }

    // Evento para el botón de cancelar o cerrar modal
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', clearForm);
    });

    // Event listener para el cierre del modal
    modal.addEventListener('hidden.bs.modal', clearForm);
});

// Función para calcular la comisión automáticamente
function calcularComision() {
    const clienteDistrito = document.getElementById('clienteDistrito').value;
    const supera30x30 = document.getElementById('supera30x30').checked;
    const comisionTarifaInput = document.getElementById('comisionTarifa');

    // Si el usuario ha editado manualmente el valor, no lo sobrescribimos
    if (comisionTarifaInput.dataset.manual) {
        return;
    }

    let comisionBase = 10; // Valor base para distritos distintos de Chaclacayo
    if (['Carabayllo (Lima)', 'Ventanilla (Callao)', 'Puente Piedra (Lima)'].includes(clienteDistrito)) {
        comisionBase = 15;
    } else if (['Comas (Lima)', 'Villa El Salvador (Lima)', 'Villa María del Triunfo (Lima)', 'Oquendo (Callao)', 'Santa Clara (Ate, Lima)'].includes(clienteDistrito)) {
        comisionBase = 13;
    }
    

    // Sumar 5 si el checkbox está activado
    const comisionFinal = supera30x30 ? comisionBase + 5 : comisionBase;

    // Actualizar el valor del input de comisión
    comisionTarifaInput.value = comisionFinal;
}

// Función para determinar el grupo según el distrito
function determinarGrupo(distrito) {
    const grupos = {
        norte: ["Carabayllo (Lima)", "Comas (Lima)", "Independencia (Lima)", "Los Olivos (Lima)", 
               "Puente Piedra (Lima)", "San Martín de Porres (Lima)", "Santa Rosa (Callao)", 
               "Ventanilla (Callao)", "Mi Perú (Callao)", "Oquendo (Callao)"],
        sur: ["Chorrillos (Lima)", "Lurín (Lima)", "San Juan de Miraflores (Lima)", 
             "Santiago de Surco (Lima)", "Surco (Santiago de Surco, Lima)", "Surquillo (Lima)", 
             "Villa El Salvador (Lima)", "Villa María del Triunfo (Lima)"],
        este: ["Ate (Lima)", "Chaclacayo (Lima)", "El Agustino (Lima)", "Huachipa (Ate, Lima)", 
              "San Juan de Lurigancho (Lima)", "Santa Anita (Lima)", "Santa Clara (Ate, Lima)"],
        oeste: ["Bellavista (Callao)", "Callao (Callao)", "Carmen de la Legua (Callao)", 
               "La Perla (Callao)", "La Punta (Callao)"],
        centro: ["Barranco (Lima)", "Breña (Lima)", "Cercado de Lima (Lima)", "Jesús María (Lima)", 
                "La Molina (Lima)", "La Victoria (Lima)", "Lince (Lima)", "Magdalena del Mar (Lima)", 
                "Pueblo Libre (Lima)", "Rímac (Lima)", "San Borja (Lima)", "San Isidro (Lima)", 
                "San Luis (Lima)", "San Miguel (Lima)"]
    };
    
    for (const grupo in grupos) {
        if (grupos[grupo].includes(distrito)) {
            return grupo;
        }
    }
    return null;
}

// Función para asignar motorizado según el grupo
function asignarMotorizado(distrito) {
    const grupo = determinarGrupo(distrito);
    if (!grupo) return "";  // Valor vacío para Select2
    return `motorizado${grupo.charAt(0).toUpperCase() + grupo.slice(1)}`;
}

// Eventos para recalcular la comisión
$(document).ready(function () {
    // Inicializar Select2 en el campo clienteDistrito
    //$('#clienteDistrito').select2();

    // Event listener para el distrito del proveedor
    $('#proveedorDistrito').on('select2:select', function(e) {
        const motorizadoValue = asignarMotorizado(e.params.data.text);
        
        // Actualizar Select2 para motorizado recojo
        $('#motorizadoRecojo').val(motorizadoValue).trigger('change');
        
        // Revalidar el campo
        if (typeof formValidation !== 'undefined') {
            formValidation.revalidateField('motorizadoRecojo');
        }
    });

    // Event listener para el distrito del cliente
    $('#clienteDistrito').on('select2:select', function(e) {
        // Asignar motorizado de entrega
        const motorizadoValue = asignarMotorizado(e.params.data.text);
        
        // Actualizar Select2 para motorizado entrega
        $('#motorizadoEntrega').val(motorizadoValue).trigger('change');
        
        // Revalidar el campo
        if (typeof formValidation !== 'undefined') {
            formValidation.revalidateField('motorizadoEntrega');
        }

        // Recalcular la comisión
        const comisionTarifaInput = document.getElementById('comisionTarifa');
        delete comisionTarifaInput.dataset.manual; // Reiniciar la edición manual
        calcularComision(); // Recalcular la comisión
    });
});

document.getElementById('supera30x30').addEventListener('change', function () {
    const comisionTarifaInput = document.getElementById('comisionTarifa');
    delete comisionTarifaInput.dataset.manual; // Reiniciar la edición manual
    calcularComision(); // Recalcular la comisión
});


function loadDataToModal2(data) {
    // Información del proveedor
    document.getElementById('viewProveedorNombre').textContent = data.proveedorNombre || 'N/A';
    document.getElementById('viewProveedorTelefono').textContent = data.proveedorTelefono || 'N/A';
    document.getElementById('viewProveedorDistrito').textContent = data.proveedorDistrito || 'N/A';
    document.getElementById('viewFotoRecojo').src = data.thumbnailFotoRecojo ? data.thumbnailFotoRecojo : '../../assets/img/avatars/1.png';

    // Información del cliente
    document.getElementById('viewClienteNombre').textContent = data.clienteNombre || 'N/A';
    document.getElementById('viewClienteTelefono').textContent = data.clienteTelefono || 'N/A';
    document.getElementById('viewClienteDistrito').textContent = data.clienteDistrito || 'N/A';
    document.getElementById('viewFotoEntrega').src = data.thumbnailFotoEntrega ? data.thumbnailFotoEntrega : '../../assets/img/avatars/1.png';

    // Detalles adicionales
    document.getElementById('viewMetodoPago').textContent = data.pedidoMetodoPago || 'N/A';
    document.getElementById('viewCantidadCobrar').textContent = data.pedidoCantidadCobrar || 'N/A';
    document.getElementById('viewComisionTarifa').textContent = data.comisionTarifa || 'N/A';
    document.getElementById('viewObservaciones').textContent = data.pedidoObservaciones || 'N/A';
}







