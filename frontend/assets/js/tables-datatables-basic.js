let offCanvasEl;
let o;
// Declarar rowDataOriginal como variable global
let rowDataOriginal;
document.addEventListener("DOMContentLoaded", function (e) {

    var r, t = document.querySelector(".datatables-basic");
    t && ((s = document.createElement("h5")).classList.add("card-title", "mb-0", "text-md-start", "text-center"),
        s.innerHTML = "Tabla Pedidos",
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
                if (data.fechaAnulacionPedido == null) {
                    if (data.fechaEntregaPedidoMotorizado !== null) {
                        $(row).css('background-color', '#ccffcc'); // Verde claro si el pedido fue entregado
                    } else if (data.fechaRecojoPedidoMotorizado !== null) {
                        $(row).css('background-color', '#cce5ff'); // Azul claro si el pedido fue recogido pero aún no entregado
                    } else if (data.fechaAnulacionPedido !== null) {
                        $(row).css('background-color', '#ffcccc'); // Rojo claro si el pedido fue anulado
                    } else {
                        $(row).css('background-color', '#ffffcc'); // Amarillo claro si el pedido aún no ha sido recogido
                    }
                } else {
                    $(row).css('background-color', '#ffcccc'); // Rojo claro si el pedido fue anulado

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
                                    columns: [3, 4, 5, 6, 7, 9, 10, 12], 
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
                rowDataOriginal = o.row(e.target.closest('tr')).data();
                loadDataToModal(rowDataOriginal);
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
    document.getElementById('recojoModalLabel').textContent = 'Editar Entrega';
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


document.addEventListener('DOMContentLoaded', function () {
    const modalElement = document.getElementById('recojoForm'); // Tu formulario
    const modalCloseButtons = document.querySelectorAll('[data-bs-dismiss="modal"], .btn-close'); // Botones de cerrar y cancelar
    const modal = document.getElementById('backDropModal');
    const submitButton = document.querySelector('#recojoForm button[type="submit"]');
    const modalLabel = document.getElementById('recojoModalLabel');

    // Función para limpiar el formulario
    function clearForm() {
        modalElement.reset();
        $('#clienteDistrito').val(null).trigger('change');
        $('#proveedorDistrito').val(null).trigger('change');
        $('#metodoPago').val(null).trigger('change');
        modalElement.removeAttribute('data-edit-id');
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
    console.log("Evento change en supera30x30 disparado.");
    const comisionTarifaInput = document.getElementById('comisionTarifa');
    delete comisionTarifaInput.dataset.manual; // Reiniciar la edición manual
    calcularComision(); // Recalcular la comisión
});


function setUbicacion(elementId, direccion) {
    const element = document.getElementById(elementId);
    
    if (!direccion || direccion.trim() === '') {
        element.innerHTML = 'N/A';
    } else if (direccion.startsWith('http')) {
        element.innerHTML = `<a href="${direccion}" target="_blank" class="text-primary text-decoration-underline">Ver ubicación</a>`;
    } else {
        element.textContent = direccion;
    }
}

function loadDataToModal2(data) {
    // Información del proveedor
    document.getElementById('viewProveedorNombre').textContent = data.proveedorNombre || 'N/A';
    document.getElementById('viewProveedorTelefono').textContent = data.proveedorTelefono || 'N/A';
    document.getElementById('viewProveedorDistrito').textContent = data.proveedorDistrito || 'N/A';
    document.getElementById('viewFotoRecojo').src = data.thumbnailFotoRecojo ? data.thumbnailFotoRecojo : '../../assets/img/avatars/fondo_nanpi_75.png';

    // Información del cliente
    document.getElementById('viewClienteNombre').textContent = data.clienteNombre || 'N/A';
    document.getElementById('viewClienteTelefono').textContent = data.clienteTelefono || 'N/A';
    document.getElementById('viewClienteDistrito').textContent = data.clienteDistrito || 'N/A';
    document.getElementById('viewFotoEntrega').src = data.thumbnailFotoEntrega ? data.thumbnailFotoEntrega : '../../assets/img/avatars/fondo_nanpi_75.png';

    // Detalles adicionales
    document.getElementById('viewMetodoPago').textContent = data.pedidoMetodoPago || 'N/A';
    document.getElementById('viewCantidadCobrar').textContent = data.pedidoCantidadCobrar || 'N/A';
    document.getElementById('viewComisionTarifa').textContent = data.comisionTarifa || 'N/A';
    document.getElementById('viewObservaciones').textContent = data.pedidoDetalle || 'N/A';

    // Asignar ubicaciones con detección de URL o texto normal
    setUbicacion('viewProveedorUbicacion', data.proveedorDireccionLink);
    setUbicacion('viewClienteUbicacion', data.pedidoDireccionLink);
}

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

    let isSubmitting = false;

    formValidation.on('core.form.valid', async function () {
        if (isSubmitting) return;
        isSubmitting = true;
    
        const submitButton = document.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        const formData = new FormData(recojoForm);
        const isEdit = recojoForm.hasAttribute('data-edit-id');
        const docId = isEdit ? recojoForm.getAttribute('data-edit-id') : "";
    
        try {
            // Obtener valores del formulario
            const proveedorNombre = formData.get('proveedorName').toUpperCase();
            const proveedorTelefono = formData.get('proveedorTelefono');
            const proveedorDistrito = formData.get('proveedorDistrito');
            const proveedorDireccionLink = String(formData.get('proveedorDireccionLink') || '').trim();
            const clienteNombreFormatted = capitalizeWords(formData.get('clienteName'));
            const clienteTelefono = formData.get('clienteTelefono');
            const clienteDistrito = formData.get('clienteDistrito');
            const pedidoDetalle = formData.get('pedidoDetalle');
            const pedidoObservaciones = formData.get('observaciones');
            const pedidoMetodoPago = formData.get('metodoPago');
            const pedidoDireccionLink = String(formData.get('pedidoDireccionLink') || '').trim();
            const motorizadoRecojo = formData.get('motorizadoRecojo');
            const motorizadoEntrega = formData.get('motorizadoEntrega');
            const cantidadCobrarFormatted = parseFloat(formData.get('cantidadCobrar')).toFixed(2);
            const pedidoSeCobraValor = (cantidadCobrarFormatted === "0.00" || cantidadCobrarFormatted === "0") ? "No" : "Si";
            const comisionTarifa = parseFloat(document.getElementById('comisionTarifa').value);
            const supera30x30 = document.getElementById('supera30x30').checked ? 1 : 0;
    
            const fechaEntrega = formData.get('fechaEntrega');
            const [day, month, year] = fechaEntrega.split('-');
            const formattedFechaEntrega = `${year}-${month}-${day}`;
    
            // Crear una copia de rowDataOriginal para actualizar solo los campos editados
            const updatedRecojo = { ...rowDataOriginal };
    
            // Actualizar solo los valores modificados
            if (isEdit) {
                if (proveedorNombre !== rowDataOriginal.proveedorNombre) updatedRecojo.proveedorNombre = proveedorNombre;
                if (proveedorTelefono !== rowDataOriginal.proveedorTelefono) updatedRecojo.proveedorTelefono = proveedorTelefono;
                if (proveedorDistrito !== rowDataOriginal.proveedorDistrito) updatedRecojo.proveedorDistrito = proveedorDistrito;
                if (proveedorDireccionLink !== rowDataOriginal.proveedorDireccionLink) updatedRecojo.proveedorDireccionLink = proveedorDireccionLink;
                if (clienteNombreFormatted !== rowDataOriginal.clienteNombre) updatedRecojo.clienteNombre = clienteNombreFormatted;
                if (clienteTelefono !== rowDataOriginal.clienteTelefono) updatedRecojo.clienteTelefono = clienteTelefono;
                if (clienteDistrito !== rowDataOriginal.clienteDistrito) updatedRecojo.clienteDistrito = clienteDistrito;
                if (pedidoDetalle !== rowDataOriginal.pedidoDetalle) updatedRecojo.pedidoDetalle = pedidoDetalle;
                if (pedidoObservaciones !== rowDataOriginal.pedidoObservaciones) updatedRecojo.pedidoObservaciones = pedidoObservaciones;
                if (pedidoSeCobraValor !== rowDataOriginal.pedidoSeCobra) updatedRecojo.pedidoSeCobra = pedidoSeCobraValor;
                if (pedidoMetodoPago !== rowDataOriginal.pedidoMetodoPago) updatedRecojo.pedidoMetodoPago = pedidoMetodoPago;
                if (cantidadCobrarFormatted !== rowDataOriginal.pedidoCantidadCobrar) updatedRecojo.pedidoCantidadCobrar = cantidadCobrarFormatted;
                if (pedidoDireccionLink !== rowDataOriginal.pedidoDireccionLink) updatedRecojo.pedidoDireccionLink = pedidoDireccionLink;
                if (motorizadoRecojo !== rowDataOriginal.motorizadoRecojo) updatedRecojo.motorizadoRecojo = motorizadoRecojo;
                if (motorizadoEntrega !== rowDataOriginal.motorizadoEntrega) updatedRecojo.motorizadoEntrega = motorizadoEntrega;
                if (comisionTarifa !== rowDataOriginal.comisionTarifa) updatedRecojo.comisionTarifa = comisionTarifa;
                if (supera30x30 !== rowDataOriginal.supera30x30) updatedRecojo.supera30x30 = supera30x30;
            }
    
            // Verificar si las direcciones han cambiado para actualizar coordenadas
            if (isEdit) {
                if (proveedorDireccionLink !== rowDataOriginal.proveedorDireccionLink) {
                    console.log("Proveedor direccion cambiada:", proveedorDireccionLink);
                    const coordenadas = await procesarEntrada(proveedorDireccionLink);
                    updatedRecojo.recojoCoordenadas = { "lat": parseFloat(coordenadas.latitud), "lng": parseFloat(coordenadas.longitud) };
                }
    
                if (pedidoDireccionLink !== rowDataOriginal.pedidoDireccionLink) {
                    console.log("Pedido direccion cambiada:", pedidoDireccionLink);
                    const coordenadas2 = await procesarEntrada(pedidoDireccionLink);
                    updatedRecojo.pedidoCoordenadas = { "lat": parseFloat(coordenadas2.latitud), "lng": parseFloat(coordenadas2.longitud) };
                }
            }
    
            // Agregar fecha si es una nueva creación
            if (!isEdit) {
                updatedRecojo.fechaCreacionPedido = new Date().toISOString();
                updatedRecojo.fechaEntregaPedido = formattedFechaEntrega;
            }
    
            // Enviar `updatedRecojo` al servidor
            const url = isEdit ? `${API_URL}/${docId}` : API_URL;
            const method = isEdit ? 'PUT' : 'POST';
    
            fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRecojo)
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('recojoForm').reset();
                const modal = bootstrap.Modal.getInstance(document.getElementById('backDropModal'));
                modal.hide();
                if (typeof loadRecojos === 'function') loadRecojos();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Hubo un problema con el envío');
            })
            .finally(() => {
                isSubmitting = false;
                submitButton.disabled = false;
            });
    
        } catch (error) {
            console.error("Error processing form:", error);
            submitButton.disabled = false;
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

    // Función para anular el registro
    function deleteRecord(recordId) {
      fetch(`${API_URL}/${recordId}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              fechaAnulacionPedido: { 
                  _seconds: Math.floor(Date.now() / 1000), 
                  _nanoseconds: 0 
              }
          })
      })
      .then(response => response.json())
      .then(data => {
          console.log('Pedido anulado:', data);
  
          if (typeof loadRecojos === 'function') {
              loadRecojos();
          }
  
          alert('Pedido anulado correctamente');
      })
      .catch(error => {
          console.error('Error al anular el pedido:', error);
          alert('Hubo un problema al anular el pedido');
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






