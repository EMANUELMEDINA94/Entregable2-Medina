const LS_KEY = "banco_entrega2_cuentas";

// FUNCION CONSTRUCTORA
function Cuenta(usuario, saldo) {
    this.usuario = usuario;
    this.saldo = saldo;
}

// DEMO INICIAL
const cuentasDemo = [
    new Cuenta("emanuel", 150000),
    new Cuenta("rodrigo", 90000),
    new Cuenta("paula", 120000),
];

// ESTADO 
let cuentas = [];
let cuentaActual = null;

// DOM
const $ = (sel) => document.querySelector(sel);

const mensaje = $("#mensaje");

const loginBox = $("#loginBox");
const registroBox = $("#registroBox");
const cuentaBox = $("#cuentaBox");

const formLogin = $("#formLogin");
const loginUsuario = $("#loginUsuario");

const formRegistro = $("#formRegistro");
const regUsuario = $("#regUsuario");
const regSaldo = $("#regSaldo");

const usuarioActual = $("#usuarioActual");
const saldoActual = $("#saldoActual");

const btnConsultar = $("#btnConsultar");
const formRetiro = $("#formRetiro");
const montoRetiro = $("#montoRetiro");
const btnLogout = $("#btnLogout");

// STORAGE + JSON 
function guardarCuentas() {
    localStorage.setItem(LS_KEY, JSON.stringify(cuentas));
}

function cargarCuentas() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return cuentasDemo;

    try {
        const data = JSON.parse(raw);
        return data.map(c => new Cuenta(c.usuario, c.saldo));
    } catch {
        return cuentasDemo;
    }
}

// UTILIDADES UI 
function setMensaje(texto, tipo = "info") {
    mensaje.textContent = texto || "";
    mensaje.style.color =
        tipo === "error" ? "rgba(151, 34, 34, 1)" :
            tipo === "ok" ? "rgba(18, 146, 116, 1)" :
                "rgb(207, 214, 230)";
}

function formatearMoneda(n) {
    return "$" + n.toLocaleString("es-AR");
}

function mostrarPanelCuenta(visible) {
    cuentaBox.classList.toggle("hidden", !visible);
    loginBox.classList.toggle("hidden", visible);
    registroBox.classList.toggle("hidden", visible);
}

function renderCuentaActual() {
    if (!cuentaActual) return;
    usuarioActual.textContent = cuentaActual.usuario;
    saldoActual.textContent = formatearMoneda(cuentaActual.saldo);
}

// filter
function buscarCuenta(usuario) {
    const resultado = cuentas.filter(c => c.usuario === usuario);
    return resultado.length ? resultado[0] : null;
}

// EVENTOS

// Login
formLogin.addEventListener("submit", (e) => {
    e.preventDefault();

    const usuario = loginUsuario.value.trim().toLowerCase();
    const cuenta = buscarCuenta(usuario);

    if (!cuenta) {
        setMensaje("Usuario no encontrado.", "error");
        return;
    }

    cuentaActual = cuenta;
    setMensaje(`Bienvenido/a ${cuentaActual.usuario}.`, "ok");

    renderCuentaActual();
    mostrarPanelCuenta(true);
});

// Crear cuenta
formRegistro.addEventListener("submit", (e) => {
    e.preventDefault();

    const usuario = regUsuario.value.trim().toLowerCase();
    const saldo = Number(regSaldo.value);

    if (!usuario) {
        setMensaje("Usuario inválido.", "error");
        return;
    }

    if (!Number.isFinite(saldo) || saldo < 0) {
        setMensaje("Saldo inicial inválido.", "error");
        return;
    }

    if (buscarCuenta(usuario)) {
        setMensaje("Ese usuario ya existe.", "error");
        return;
    }

    const nueva = new Cuenta(usuario, saldo);
    cuentas.push(nueva);

    guardarCuentas();

    regUsuario.value = "";
    regSaldo.value = "";

    setMensaje("Cuenta creada y guardada en LocalStorage.", "ok");
});

// Consultar saldo
btnConsultar.addEventListener("click", () => {
    if (!cuentaActual) return;
    setMensaje(`Tu saldo es ${formatearMoneda(cuentaActual.saldo)}.`, "ok");
});

// Retirar 
formRetiro.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cuentaActual) return;

    const monto = Number(montoRetiro.value);

    if (!Number.isFinite(monto) || monto <= 0) {
        setMensaje("Monto inválido.", "error");
        return;
    }

    if (monto > cuentaActual.saldo) {
        setMensaje("No tenés saldo suficiente.", "error");
        return;
    }

    cuentaActual.saldo = cuentaActual.saldo - monto;

    guardarCuentas();
    renderCuentaActual();

    montoRetiro.value = "";
    setMensaje("Retiro exitoso.", "ok");
});

// Logout
btnLogout.addEventListener("click", () => {
    cuentaActual = null;
    loginUsuario.value = "";
    mostrarPanelCuenta(false);
    setMensaje("Sesión cerrada.");
});

// INIT
function init() {
    cuentas = cargarCuentas();
    guardarCuentas();

    mostrarPanelCuenta(false);
}

init();