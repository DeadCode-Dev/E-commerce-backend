import fs from "fs";
import path from "path";
import pg from "../config/postgres";

async function SqlInit() {
  const sqlRoot = path.resolve(__dirname, "../sql");

  const folders = fs
    .readdirSync(sqlRoot)
    .filter((f) => fs.statSync(path.join(sqlRoot, f)).isDirectory());


  for (const folder of folders) {
    if (!folders.includes(folder)) continue;

    const folderPath = path.join(sqlRoot, folder);
    const files = fs.readdirSync(folderPath).sort();

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      try {
        const result = await pg.query(sql);
        console.log(`✅ Executed: ${folder}/${file}`);
      } catch (err) {
        console.error(`❌ Error in ${folder}/${file}:`, (err as any).message);
      }
    }
  }
}

export default SqlInit;
