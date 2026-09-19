require("dotenv/config");

// El servidor real: importa la app ya configurada y la pone a escuchar.
// La app vive en app.ts para poder probarla sin levantar el servidor.
const app = require("./app");

// El puerto viene de la variable de entorno PORT (el Dockerfile la fija en 4000).
// Si no existe, como en desarrollo local, usa 3000.
const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
});
