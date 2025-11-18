import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from the project app directory regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const envLoaded = true;

