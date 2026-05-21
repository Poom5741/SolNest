const fs = require("fs");
const path = require("path");

const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
const abisDir = path.join(__dirname, "..", "..", "src", "abis");

if (!fs.existsSync(abisDir)) {
  fs.mkdirSync(abisDir, { recursive: true });
}

function copyAbis(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      copyAbis(fullPath);
    } else if (entry.name.endsWith(".json") && !entry.name.endsWith(".dbg.json")) {
      const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      const abi = content.abi;
      const outputName = entry.name.replace(".json", ".abi.json");
      const outputPath = path.join(abisDir, outputName);
      fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
      console.log(`Exported ABI: ${outputName}`);
    }
  }
}

copyAbis(artifactsDir);
console.log("\nABI export complete. Files in:", abisDir);
