require("dotenv/config");

// El servidor real: importa la app ya configurada y la pone a escuchar.
// La app vive en app.ts para poder probarla sin levantar el servidor.
const app = require("./app");

const PORT = 3000;

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
});
