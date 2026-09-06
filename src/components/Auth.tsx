import { useState } from "react";

// URL base del backend (Express corre en el puerto 3000)
const API = "http://localhost:3000";

// Props: App le pasa "onLogin" para avisarle cuándo el login fue exitoso.
// Así App puede guardar el token y cambiar de la pantalla de login a las tareas.
type AuthProps = {
  onLogin: (token: string) => void;
};

// Pantalla de autenticación. Muestra UNA sola cosa a la vez (login o registro),
// según la pestaña activa. El flujo React -> Express -> Prisma -> PostgreSQL -> JWT
// se prueba desde aquí (login) y desde Thunder Client (rutas GET/POST/PUT/DELETE).
function Auth({ onLogin }: AuthProps) {
  // Pestaña activa: "login" (por defecto) o "register".
  const [mode, setMode] = useState<"login" | "register">("login");

  // --- Estado del formulario de REGISTRO ---
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regMessage, setRegMessage] = useState("");

  // --- Estado del formulario de LOGIN ---
  const [logEmail, setLogEmail] = useState("");
  const [logPassword, setLogPassword] = useState("");
  const [logMessage, setLogMessage] = useState("");

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
      setRegMessage(`✅ ${data.message}. Ahora inicia sesión.`);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setMode("login"); // tras registrarse, pasa a la pestaña de login
    } else {
      setRegMessage(`❌ ${data.message}`);
    }
  };

  // LOGIN: si email + password son correctos, el backend devuelve un JWT.
  // Guardamos ese token en localStorage y avisamos a App para ver las tareas.
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
      setLogMessage(`✅ ${data.message} — bienvenido, ${data.user.name}`);
      setLogPassword("");
      onLogin(data.token); // 👈 avisa a App: hay sesión → mostrar las tareas
    } else {
      setLogMessage(`❌ ${data.message}`);
    }
  };

  return (
    <div className="auth">
      {/* Pestañas: alterna entre Iniciar sesión y Crear cuenta */}
      <nav className="view-switch">
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
        >
          Iniciar sesión
        </button>
        <button
          className={mode === "register" ? "active" : ""}
          onClick={() => setMode("register")}
        >
          Crear cuenta
        </button>
      </nav>

      {mode === "login" ? (
        /* LOGIN */
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
      ) : (
        /* REGISTRO */
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
      )}
    </div>
  );
}

export default Auth;
