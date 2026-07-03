import fs from "fs";
import path from "path";
import axios from "axios";

// Read mock-data.ts to get the list of logo URLs
const mockDataPath = "../frontend/lib/mock-data.ts";
const publicLogosDir = "../frontend/public/logos";

if (!fs.existsSync(publicLogosDir)) {
  fs.mkdirSync(publicLogosDir, { recursive: true });
}

async function downloadFile(url, dest) {
  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });
    
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(dest);
      response.data.pipe(writer);
      let error = null;
      writer.on("error", err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on("close", () => {
        if (!error) {
          resolve(true);
        }
      });
    });
  } catch (err) {
    throw new Error(`HTTP Error: ${err.message}`);
  }
}

async function main() {
  const content = fs.readFileSync(mockDataPath, "utf-8");
  
  // Find all blocks like id: "med", ..., logoUrl: "..."
  const facultyRegex = /id:\s*"([^"]+)"[^}]+?logoUrl:\s*"([^"]+)"/gs;
  let match;
  const downloadPromises = [];

  while ((match = facultyRegex.exec(content)) !== null) {
    const id = match[1];
    const url = match[2];
    const ext = path.extname(new URL(url).pathname) || ".png";
    const dest = path.join(publicLogosDir, `${id}${ext}`);
    
    console.log(`Downloading logo for ${id}: ${url} -> ${dest}`);
    
    const promise = downloadFile(url, dest)
      .then(() => {
        console.log(`Successfully downloaded ${id} logo`);
      })
      .catch((err) => {
        console.error(`Failed to download ${id} logo: ${err.message}`);
      });
      
    downloadPromises.push(promise);
  }
  
  await Promise.all(downloadPromises);
  console.log("All downloads completed!");
}

main().catch(console.error);
