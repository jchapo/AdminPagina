( () => {
    window.Helpers.initCustomOptionCheck();
    (e = [].slice.call(document.querySelectorAll(".flatpickr-validation"))) && e.forEach(e => {
        e.flatpickr({
            allowInput: !0,
            monthSelectorType: "static"
        })
    }
    );
    var e = document.querySelectorAll(".needs-validation");
    Array.prototype.slice.call(e).forEach(function(a) {
        a.addEventListener("submit", function(e) {
            a.checkValidity() ? alert("Submitted!!!") : (e.preventDefault(),
            e.stopPropagation()),
            a.classList.add("was-validated")
        }, !1)
    })
}
)(),
document.addEventListener("DOMContentLoaded", function() {
    let form = document.getElementById("recojoForm"),
        fechaEntregaInput = form.querySelector('[id="fechaEntrega"]'),
        proveedorNameInput = form.querySelector('[id="proveedorName"]'),
        proveedorTelefonoInput = form.querySelector('[id="proveedorTelefono"]'),
        proveedorDistritoInput = form.querySelector('[id="proveedorDistrito"]'),
        clienteNameInput = form.querySelector('[id="clienteName"]'),
        clienteTelefonoInput = form.querySelector('[id="clienteTelefono"]'),
        clienteDistritoInput = form.querySelector('[id="clienteDistrito"]'),
        clienteUbicacionInput = form.querySelector('[id="clienteUbicacion"]'),
        pedidoDetalleInput = form.querySelector('[id="pedidoDetalle"]'),
        cantidadCobrarInput = form.querySelector('[id="cantidadCobrar"]'),
        metodoPagoInput = form.querySelector('[id="metodoPago"]'),
        observacionesInput = form.querySelector('[id="observaciones"]'),
        formValidator = FormValidation.formValidation(form, {
            fields: {
                fechaEntrega: {
                    validators: {
                        notEmpty: { message: "Por favor ingrese la fecha de entrega" }
                    }
                },
                proveedorName: {
                    validators: {
                        notEmpty: { message: "Por favor ingrese el nombre del proveedor" },
                        stringLength: { min: 3, max: 100, message: "El nombre del proveedor debe tener entre 3 y 100 caracteres" }
                    }
                },
                proveedorTelefono: {
                    validators: {
                        notEmpty: { message: "Por favor ingrese el teléfono del proveedor" },
                        regexp: { regexp: /^\d{9}$/, message: "El teléfono debe tener 9 dígitos" }
                    }
                },
                proveedorDistrito: {
                    validators: {
                        notEmpty: { message: "Por favor seleccione el distrito del proveedor" }
                    }
                },
                clienteName: {
                    validators: {
                        notEmpty: { message: "Por favor ingrese el nombre del cliente" },
                        stringLength: { min: 3, max: 100, message: "El nombre del cliente debe tener entre 3 y 100 caracteres" }
                    }
                },
                clienteTelefono: {
                    validators: {
                        notEmpty: { message: "Por favor ingrese el teléfono del cliente" },
                        regexp: { regexp: /^\d{9}$/, message: "El teléfono debe tener 9 dígitos" }
                    }
                },
                clienteDistrito: {
                    validators: {
                        notEmpty: { message: "Por favor seleccione el distrito del cliente" }
                    }
                },
                clienteUbicacion: {
                    validators: {
                        notEmpty: { message: "Por favor ingrese la dirección de entrega" },
                        stringLength: { min: 5, max: 255, message: "La dirección debe tener entre 5 y 255 caracteres" }
                    }
                },
                pedidoDetalle: {
                    validators: {
                        stringLength: { max: 500, message: "Los detalles del pedido no deben exceder los 500 caracteres" }
                    }
                },
                cantidadCobrar: {
                    validators: {
                        notEmpty: { message: "Por favor ingrese la cantidad a cobrar" },
                        numeric: { message: "La cantidad a cobrar debe ser un número válido" }
                    }
                },
                metodoPago: {
                    validators: {
                        notEmpty: { message: "Por favor seleccione el método de pago" }
                    }
                },
                observaciones: {
                    validators: {
                        stringLength: { max: 500, message: "Las observaciones no deben exceder los 500 caracteres" }
                    }
                }
            },
            plugins: {
                bootstrap5: new FormValidation.plugins.Bootstrap5({
                    eleValidClass: "",
                    rowSelector: function(field) {
                        return ".form-control-validation";
                    }
                }),
                submitButton: new FormValidation.plugins.SubmitButton(),
                defaultSubmit: new FormValidation.plugins.DefaultSubmit(),
                autoFocus: new FormValidation.plugins.AutoFocus()
            }
        });

    // Inicialización de select2 para distritos
    let proveedorDistrito = form.querySelector('[id="proveedorDistrito"]');
    let clienteDistrito = form.querySelector('[id="clienteDistrito"]');
    
    if (proveedorDistrito && clienteDistrito) {
        jQuery(proveedorDistrito).select2({ placeholder: "Seleccione un distrito" })
            .on("change", function() {
                formValidator.revalidateField("proveedorDistrito");
            });
        jQuery(clienteDistrito).select2({ placeholder: "Seleccione un distrito" })
            .on("change", function() {
                formValidator.revalidateField("clienteDistrito");
            });
    }
});

