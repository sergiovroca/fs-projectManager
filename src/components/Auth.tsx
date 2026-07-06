import { useState } from "react";

// URL base del backend (Express corre en el puerto 3000)
const API = "http://localhost:3000";

// Pantalla de "Cuenta": registro, login, token y prueba de la ruta protegida.
// Todo el flujo de autenticación (React -> Express -> Prisma -> PostgreSQL -> JWT)
// se puede demostrar desde aquí.
function Auth() {
  // --- Estado del formulario de REGISTRO ---
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMessage, setRegMessage] = useState("");

  // --- Estado del formulario de LOGIN ---
  const [logEmail, setLogEmail] = useState("");
  const [logPassword, setLogPassword] = useState("");
  const [logMessage, setLogMessage] = useState("");

  // --- Token guardado y resultado de /profile ---
  // Al iniciar, recuperamos el token que hubiera en localStorage.
  const [token, setToken] = useState<string>(localStorage.getItem("token") || "");
  const [profileMessage, setProfileMessage] = useState("");

  // REGISTRO: manda name, email y password al backend. La contraseña se
  // hashea con bcrypt EN EL BACKEND antes de guardarse en PostgreSQL.
  const handleRegister = async () => {
    setRegMessage("");
    const response = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: regName,
        email: regEmail,
        password: regPassword,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setRegMessage(`✅ ${data.message} (id: ${data.user.id})`);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    } else {
      setRegMessage(`❌ ${data.message}`);
    }
  };

  // LOGIN: si email + password son correctos, el backend devuelve un JWT.
  // Guardamos ese token en localStorage para usarlo en rutas protegidas.
  const handleLogin = async () => {
    setLogMessage("");
    const response = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: logEmail, password: logPassword }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token); // 👈 se guarda el token
      setToken(data.token);
      setLogMessage(`✅ ${data.message} — bienvenido, ${data.user.name}`);
      setLogPassword("");
    } else {
      setLogMessage(`❌ ${data.message}`);
    }
  };

  // RUTA PROTEGIDA: llama a /profile enviando el token en el header
  // Authorization: Bearer <token>. Sin token, el backend responde 401.
  const handleProfile = async () => {
    setProfileMessage("");
    const savedToken = localStorage.getItem("token");
    const response = await fetch(`${API}/profile`, {
      headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {},
    });
    const data = await response.json();
    if (response.ok) {
      setProfileMessage(`✅ ${data.message}: ${JSON.stringify(data.user)}`);
    } else {
      setProfileMessage(`❌ ${response.status} — ${data.message}`);
    }
  };

  // CERRAR SESIÓN: borra el token guardado.
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setProfileMessage("");
    setLogMessage("Sesión cerrada.");
  };

  // Mostramos solo el inicio del token (es muy largo).
  const shortToken = token ? `${token.slice(0, 24)}...` : "(sin token)";

  return (
    <div className="auth">
      {/* REGISTRO */}
      <div className="auth-card">
        <h3>Registro</h3>
        <input
          placeholder="Nombre"
          value={regName}
          onChange={(e) => setRegName(e.target.value)}
        />
        <input
          placeholder="Email"
          value={regEmail}
          onChange={(e) => setRegEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={regPassword}
          onChange={(e) => setRegPassword(e.target.value)}
        />
        <button onClick={handleRegister}>Crear cuenta</button>
        {regMessage && <p className="auth-message">{regMessage}</p>}
      </div>

      {/* LOGIN */}
      <div className="auth-card">
        <h3>Iniciar sesión</h3>
        <input
          placeholder="Email"
          value={logEmail}
          onChange={(e) => setLogEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={logPassword}
          onChange={(e) => setLogPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Entrar</button>
        {logMessage && <p className="auth-message">{logMessage}</p>}
      </div>

      {/* TOKEN Y RUTA PROTEGIDA */}
      <div className="auth-card">
        <h3>Token y ruta protegida</h3>
        <p className="auth-token">
          Token guardado: <code>{shortToken}</code>
        </p>
        <div className="auth-actions">
          <button onClick={handleProfile}>Probar /profile</button>
          <button className="auth-secondary" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
        {profileMessage && <p className="auth-message">{profileMessage}</p>}
      </div>
    </div>
  );
}

export default Auth;
