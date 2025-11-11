import "dotenv/config";
import app from './app';

const PORT = Number(process.env.PORT) || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
