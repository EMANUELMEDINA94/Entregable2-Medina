const LS_KEY = "banco_proyecto_final_v1";

// DOM root
const $app = document.querySelector("#app");

// Estado
let cuentas = [];
let cuentaActual = null;

// -----------------------------
// MODELO
// -----------------------------
function Cuenta(usuario, pin, saldo, movimientos = []) {
    this.usuario = usuario;
    this.pin = pin;
    this.saldo = saldo;
    this.movimientos = movimientos;

    // Métodos
    this.depositar = (monto) => {
        validarMonto(monto);
        this.saldo += monto;
        this.agregarMovimiento("DEPÓSITO", monto);
    };

    this.retirar = (monto) => {
        validarMonto(monto);
        if (monto > this.saldo) throw new Error("No tenés saldo suficiente.");
        this.saldo -= monto;
        this.agregarMovimiento("RETIRO", -monto);
    };

    this.agregarMovimiento = (tipo, monto, detalle = "") => {
        this.movimientos.unshift({
            id: crypto.randomUUID(),
            fecha: new Date().toISOString(),
            tipo,
            monto,
            detalle
        });
    };
}

// -----------------------------
// STORAGE
// -----------------------------
function guardarCuentas() {
    localStorage.setItem(LS_KEY, JSON.stringify(cuentas));
}

function cargarCuentasDesdeLS() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;

    try {
        const data = JSON.parse(raw);
        return data.map(c => new Cuenta(c.usuario, c.pin, c.saldo, c.movimientos || []));
    } catch {
        return null;
    }
}

// -----------------------------
// JSON ASÍNCRONO
// -----------------------------
async function cargarCuentasDesdeJSON() {
    const res = await fetch("./data/cuentas.json");
    if (!res.ok) throw new Error("No se pudo cargar el JSON de cuentas.");
    const data = await res.json();
    return data.map(c => new Cuenta(c.usuario, c.pin, c.saldo, c.movimientos || []));
}

// -----------------------------
// UTILIDADES
// -----------------------------
function formatearMoneda(n) {
    return "$" + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(n);
}

function formatearFecha(iso) {
    return new Date(iso).toLocaleString("es-AR");
}

function validarMonto(monto) {
    if (!Number.isFinite(monto) || monto <= 0) throw new Error("Monto inválido.");
}

function buscarCuenta(usuario) {
    const u = String(usuario).trim().toLowerCase();
    return cuentas.find(c => c.usuario === u) || null;
}

// -----------------------------
// UI (HTML generado desde JS)
// -----------------------------
function render() {
    $app.innerHTML = `
    <h1>Simulador de Banco</h1>
    <p>Proyecto Final</p>

    <div id="mensaje" class="mensaje"></div>

    ${cuentaActual ? renderPanelCuenta() : renderAuth()}
  `;
}

function renderAuth() {
    return `
    <section id="loginBox" class="box">
      <h2>Ingresá a tu cuenta</h2>
      <form id="formLogin">
        <input id="loginUsuario" type="text" placeholder="Usuario" required />
        <input id="loginPin" type="password" placeholder="PIN" required minlength="4" />
        <button type="submit">Ingresar</button>
      </form>
    </section>

    <section id="registroBox" class="box">
      <h2>Crear cuenta</h2>
      <form id="formRegistro">
        <input id="regUsuario" type="text" placeholder="Nuevo usuario" required minlength="3" />
        <input id="regPin" type="password" placeholder="PIN (mín. 4)" required minlength="4" />
        <input id="regSaldo" type="number" min="0" step="1" placeholder="Saldo inicial" required />
        <button type="submit">Crear</button>
      </form>
    </section>
  `;
}

function renderPanelCuenta() {
    const movs = cuentaActual.movimientos || [];
    return `
    <section id="cuentaBox" class="box">
      <div class="row">
        <h2>Cuenta activa</h2>
        <button id="btnLogout" class="ghost">Cerrar sesión</button>
      </div>

      <p><strong>Usuario:</strong> <span id="usuarioActual">${cuentaActual.usuario}</span></p>
      <p><strong>Saldo:</strong> <span id="saldoActual">${formatearMoneda(cuentaActual.saldo)}</span></p>

      <div class="acciones">
        <button id="btnConsultar">Consultar saldo</button>

        <form id="formDeposito" class="inline">
          <input id="montoDeposito" type="number" min="1" step="1" placeholder="Monto a depositar" required />
          <button type="submit">Depositar</button>
        </form>

        <form id="formRetiro" class="inline">
          <input id="montoRetiro" type="number" min="1" step="1" placeholder="Monto a retirar" required />
          <button type="submit" class="danger">Retirar</button>
        </form>

        <form id="formTransfer" class="inline">
          <input id="userDestino" type="text" placeholder="Usuario destino" required minlength="3" />
          <input id="montoTransfer" type="number" min="1" step="1" placeholder="Monto a transferir" required />
          <button type="submit">Transferir</button>
        </form>
      </div>

      <div class="movHeader">
        <h3>Movimientos</h3>
        <span class="badge">Últimos ${Math.min(10, movs.length)} / ${movs.length}</span>
      </div>

      ${renderMovimientos(movs)}
    </section>
  `;
}

function renderMovimientos(movs) {
    if (!movs || movs.length === 0) {
        return `<p class="mensaje">Todavía no hay movimientos.</p>`;
    }

    return `
    <ul>
      ${movs.slice(0, 10).map(m => {
        const claseMonto = m.monto >= 0 ? "montoPositivo" : "montoNegativo";
        const signo = m.monto >= 0 ? "+" : "−";
        return `
          <li>
            <div class="row">
              <span class="badge">${m.tipo}</span>
              <span class="${claseMonto}">${signo} ${formatearMoneda(Math.abs(m.monto))}</span>
            </div>
            <small>${formatearFecha(m.fecha)}${m.detalle ? " · " + m.detalle : ""}</small>
          </li>
        `;
    }).join("")}
    </ul>
  `;
}

// -----------------------------
// BIND EVENTS (Interactividad)
// -----------------------------
function bindEvents() {
    const $mensaje = document.querySelector("#mensaje");

    function setMensaje(texto, tipo = "info") {
        $mensaje.textContent = texto || "";
        $mensaje.style.color =
            tipo === "error" ? "rgba(151, 34, 34, 1)" :
                tipo === "ok" ? "rgba(18, 146, 116, 1)" :
                    "rgb(207, 214, 230)";
    }

    if (!cuentaActual) {
        const formLogin = document.querySelector("#formLogin");
        const formRegistro = document.querySelector("#formRegistro");

        formLogin.addEventListener("submit", (e) => {
            e.preventDefault();

            const usuario = document.querySelector("#loginUsuario").value.trim().toLowerCase();
            const pin = document.querySelector("#loginPin").value.trim();

            const cuenta = buscarCuenta(usuario);
            if (!cuenta) {
                setMensaje("Usuario no encontrado.", "error");
                return;
            }
            if (String(cuenta.pin) !== String(pin)) {
                setMensaje("PIN incorrecto.", "error");
                return;
            }

            cuentaActual = cuenta;
            setMensaje(`Bienvenido/a ${cuentaActual.usuario}.`, "ok");
            render();
            bindEvents();
        });

        formRegistro.addEventListener("submit", (e) => {
            e.preventDefault();

            const usuario = document.querySelector("#regUsuario").value.trim().toLowerCase();
            const pin = document.querySelector("#regPin").value.trim();
            const saldo = Number(document.querySelector("#regSaldo").value);

            if (!usuario || usuario.length < 3) {
                setMensaje("Usuario inválido (mínimo 3 caracteres).", "error");
                return;
            }
            if (!pin || pin.length < 4) {
                setMensaje("PIN inválido (mínimo 4 caracteres).", "error");
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

            const nueva = new Cuenta(usuario, pin, saldo, []);
            nueva.agregarMovimiento("ALTA CUENTA", saldo, "Registro de usuario");

            cuentas.push(nueva);
            guardarCuentas();

            Swal.fire({
                icon: "success",
                title: "Cuenta creada",
                text: "Se guardó en LocalStorage y ya podés ingresar.",
                timer: 1600,
                showConfirmButton: false
            });

            render();
            bindEvents();
        });

        return;
    }

    // Eventos del panel
    document.querySelector("#btnConsultar").addEventListener("click", () => {
        setMensaje(`Tu saldo es ${formatearMoneda(cuentaActual.saldo)}.`, "ok");
    });

    document.querySelector("#formDeposito").addEventListener("submit", (e) => {
        e.preventDefault();

        const monto = Number(document.querySelector("#montoDeposito").value);

        try {
            cuentaActual.depositar(monto);
            guardarCuentas();
            setMensaje("Depósito exitoso.", "ok");
            render();
            bindEvents();
        } catch (err) {
            setMensaje(err.message, "error");
        }
    });

    document.querySelector("#formRetiro").addEventListener("submit", (e) => {
        e.preventDefault();

        const monto = Number(document.querySelector("#montoRetiro").value);

        try {
            cuentaActual.retirar(monto);
            guardarCuentas();
            setMensaje("Retiro exitoso.", "ok");
            render();
            bindEvents();
        } catch (err) {
            setMensaje(err.message, "error");
        }
    });

    document.querySelector("#formTransfer").addEventListener("submit", async (e) => {
        e.preventDefault();

        const destino = document.querySelector("#userDestino").value.trim().toLowerCase();
        const monto = Number(document.querySelector("#montoTransfer").value);

        try {
            validarMonto(monto);

            const cuentaDestino = buscarCuenta(destino);
            if (!cuentaDestino) throw new Error("El usuario destino no existe.");
            if (cuentaDestino.usuario === cuentaActual.usuario) throw new Error("No podés transferirte a vos mismo.");
            if (monto > cuentaActual.saldo) throw new Error("No tenés saldo suficiente.");

            const confirmacion = await Swal.fire({
                icon: "question",
                title: "Confirmar transferencia",
                html: `Vas a transferir <b>${formatearMoneda(monto)}</b> a <b>${destino}</b>.`,
                showCancelButton: true,
                confirmButtonText: "Confirmar",
                cancelButtonText: "Cancelar"
            });

            if (!confirmacion.isConfirmed) return;

            // Procesamiento 
            cuentaActual.saldo -= monto;
            cuentaDestino.saldo += monto;

            cuentaActual.agregarMovimiento("TRANSFERENCIA ENVIADA", -monto, `A: ${cuentaDestino.usuario}`);
            cuentaDestino.agregarMovimiento("TRANSFERENCIA RECIBIDA", monto, `De: ${cuentaActual.usuario}`);

            guardarCuentas();
            setMensaje("Transferencia realizada.", "ok");

            render();
            bindEvents();
        } catch (err) {
            setMensaje(err.message, "error");
        }
    });

    document.querySelector("#btnLogout").addEventListener("click", async () => {
        const r = await Swal.fire({
            icon: "question",
            title: "Cerrar sesión",
            text: "¿Querés cerrar la sesión?",
            showCancelButton: true,
            confirmButtonText: "Salir",
            cancelButtonText: "Cancelar"
        });

        if (!r.isConfirmed) return;

        cuentaActual = null;
        setMensaje("Sesión cerrada.");
        render();
        bindEvents();
    });
}

// -----------------------------
// INIT 
// -----------------------------
async function init() {
    $app.innerHTML = `<div class="loader">Cargando cuentas...</div>`;

    // 1) Intentar cargar desde LocalStorage
    const desdeLS = cargarCuentasDesdeLS();
    if (desdeLS) {
        cuentas = desdeLS;
        render();
        bindEvents();
        return;
    }

    // 2) Si no hay LS, cargar desde JSON asíncrono y persistir
    try {
        cuentas = await cargarCuentasDesdeJSON();
        guardarCuentas();
        render();
        bindEvents();
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "Error de carga",
            text: err.message
        });
        $app.innerHTML = `<div class="loader">No se pudieron cargar los datos.</div>`;
    }
}

init();