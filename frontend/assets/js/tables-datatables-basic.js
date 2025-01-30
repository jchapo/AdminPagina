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
                        if (data && data._seconds) {
                            // Convertir los segundos y nanosegundos a milisegundos
                            const milliseconds = data._seconds * 1000 + (data._nanoseconds / 1000000);
                            return new Date(milliseconds).toLocaleDateString();
                        }
                        return 'No disponible';
                    }
                },
                {
                    data: 'proveedorNombre',
                    render: function (data) {
                        return data || 'No disponible';
                    }
                },
                {
                    data: 'clienteNombre',
                    render: function (data) {
                        return data || 'No disponible';
                    }
                },
                {
                    data: 'clienteTelefono',
                    render: function (data) {
                        return data || 'No disponible';
                    }
                },
                {
                    data: 'pedidoDireccionFormulario',
                    render: function (data) {
                        return data || 'No disponible';
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
                    searchable: false,
                    render: function (data, type, row) {
                        return `
                            <div class="d-inline-block">
                                <a href="javascript:;" class="btn btn-icon item-edit" data-id="${row.id}">
                                    <i class="icon-base bx bx-edit icon-sm"></i>
                                </a>
                                <a href="javascript:;" class="btn btn-icon text-danger delete-record" data-id="${row.id}">
                                    <i class="icon-base bx bx-trash icon-sm"></i>
                                </a>
                            </div>`;
                    }
                }
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
                render: function (e, t, a, s) {
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
                }
            }, {
                responsivePriority: 1,
                targets: 4
            }, {
                targets: -2,
                render: function (e, t, a, s) {
                    var a = a.status
                        , n = {
                            1: {
                                title: "Current",
                                class: "bg-label-primary"
                            },
                            2: {
                                title: "Professional",
                                class: "bg-label-success"
                            },
                            3: {
                                title: "Rejected",
                                class: "bg-label-danger"
                            },
                            4: {
                                title: "Resigned",
                                class: "bg-label-warning"
                            },
                            5: {
                                title: "Applied",
                                class: "bg-label-info"
                            }
                        };
                    return void 0 === n[a] ? e : `
              <span class="badge ${n[a].class}">
                ${n[a].title}
              </span>
            `
                }
            }, {
                targets: -1,
                title: "Actions",
                orderable: !1,
                searchable: !1,
                className: "d-flex align-items-center",
                render: function (e, t, a, s) {
                    return '<div class="d-inline-block"><a href="javascript:;" class="btn btn-icon dropdown-toggle hide-arrow" data-bs-toggle="dropdown"><i class="icon-base bx bx-dots-vertical-rounded"></i></a><ul class="dropdown-menu dropdown-menu-end m-0"><li><a href="javascript:;" class="dropdown-item">Details</a></li><li><a href="javascript:;" class="dropdown-item">Archive</a></li><div class="dropdown-divider"></div><li><a href="javascript:;" class="dropdown-item text-danger delete-record">Delete</a></li></ul></div><a href="javascript:;" class="btn btn-icon item-edit"><i class="icon-base bx bx-edit icon-sm"></i></a>'
                }
            }],
            select: {
                style: "multi",
                selector: "td:nth-child(2)"
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
                                    columns: [3, 4, 5, 6, 7],
                                    format: {
                                        body: function (e, t, a) {
                                            if (e.length <= 0 || !(-1 < e.indexOf("<")))
                                                return e;
                                            {
                                                e = (new DOMParser).parseFromString(e, "text/html");
                                                let t = "";
                                                var s = e.querySelectorAll(".user-name");
                                                return 0 < s.length ? s.forEach(e => {
                                                    e = e.querySelector(".fw-medium")?.textContent || e.querySelector(".d-block")?.textContent || e.textContent;
                                                    t += e.trim() + " "
                                                }
                                                ) : t = e.body.textContent || e.body.innerText,
                                                    t.trim()
                                            }
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
                                    columns: [3, 4, 5, 6, 7],
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
                                    columns: [3, 4, 5, 6, 7],
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
                                    columns: [3, 4, 5, 6, 7],
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
                                    columns: [3, 4, 5, 6, 7],
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

        document.addEventListener("click", function (e) {
            e.target.classList.contains("delete-record") && (o.row(e.target.closest("tr")).remove().draw(),
                e = document.querySelector(".dtr-bs-modal")) && e.classList.contains("show") && bootstrap.Modal.getInstance(e)?.hide()
        }));


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
// Función para cargar los datos en el modal
function loadDataToModal(data) {
    // Cambiar el título del modal
    document.getElementById('recojoModalLabel').textContent = 'Editar Entrega';
    
    // Cargar datos básicos
    document.getElementById('fechaEntrega').value = formatDate(data.fechaEntregaPedido);
    document.getElementById('proveedorName').value = data.proveedorNombre || '';
    document.getElementById('proveedorTelefono').value = data.proveedorTelefono || '';
    document.getElementById('proveedorDistrito').value = data.proveedorDistrito || '';
    
    // Información del cliente
    document.getElementById('clienteName').value = data.clienteNombre || '';
    document.getElementById('clienteTelefono').value = data.clienteTelefono || '';
    document.getElementById('clienteDistrito').value = data.clienteDistrito || '';
    document.getElementById('clienteUbicacion').value = data.pedidoDireccionFormulario || '';
    
    // Detalles del pedido
    document.getElementById('pedidoDetalle').value = data.pedidoDetalle || '';
    document.getElementById('cantidadCobrar').value = data.pedidoCantidadCobrar || '';
    document.getElementById('metodoPago').value = data.pedidoMetodoPago || '';
    
    // Observaciones
    document.getElementById('observaciones').value = data.observaciones || '';
    
    // Agregar un data attribute al formulario para identificar que es una edición
    document.getElementById('recojoForm').setAttribute('data-edit-id', data.id);
    
    // Cambiar el texto del botón de guardar
    document.querySelector('#recojoForm button[type="submit"]').textContent = 'Actualizar';
}

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


// Event listener para el botón de editar
document.addEventListener('click', function(e) {
    if (e.target.closest('.item-edit')) {
        const row = o.row(e.target.closest('tr')).data();
        loadDataToModal(row);
        const modal = new bootstrap.Modal(document.getElementById('backDropModal'));
        modal.show();
    }
});



document.addEventListener('DOMContentLoaded', function () {
    const modalElement = document.getElementById('recojoForm'); // Tu formulario
    const modalCloseButtons = document.querySelectorAll('[data-bs-dismiss="modal"], .btn-close'); // Botones de cerrar y cancelar
    const modal = document.getElementById('backDropModal');
    const submitButton = document.querySelector('#recojoForm button[type="submit"]');
    const modalLabel = document.getElementById('recojoModalLabel');

    // Función para limpiar el formulario
    function clearForm() {
        modalElement.reset(); // Limpia todos los campos del formulario
        modalElement.removeAttribute('data-edit-id'); // Elimina el atributo de edición
        modalLabel.textContent = 'Nueva Entrega'; // Restaurar título
        submitButton.textContent = 'Guardar'; // Restaurar texto del botón
    }

    // Evento para el botón de cancelar o cerrar modal
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', clearForm);
    });

    // Event listener para el cierre del modal
    modal.addEventListener('hidden.bs.modal', clearForm);
});


