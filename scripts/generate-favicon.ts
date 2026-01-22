import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const SOURCE_IMAGE = "public/images/profile.png";
const APP_DIR = "app";

async function generateFavicons() {
  console.log("Generating favicons from", SOURCE_IMAGE);

  // Ensure source image exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error(`Source image not found: ${SOURCE_IMAGE}`);
    process.exit(1);
  }

  // Generate 32x32 PNG for standard browser tabs
  await sharp(SOURCE_IMAGE)
    .resize(32, 32, { fit: "cover" })
    .png()
    .toFile(path.join(APP_DIR, "icon.png"));
  console.log("Created app/icon.png (32x32)");

  // Generate 180x180 PNG for Apple Touch Icon
  await sharp(SOURCE_IMAGE)
    .resize(180, 180, { fit: "cover" })
    .png()
    .toFile(path.join(APP_DIR, "apple-icon.png"));
  console.log("Created app/apple-icon.png (180x180)");

  // Generate favicon.ico with multiple sizes (16x16 and 32x32)
  // sharp doesn't support ICO natively, so we'll create a 32x32 PNG
  // and rename it. Modern browsers support PNG favicons well.
  // For true ICO support, we'd need another library, but this works for most cases.

  // Generate 16x16 for favicon
  const favicon16 = await sharp(SOURCE_IMAGE)
    .resize(16, 16, { fit: "cover" })
    .png()
    .toBuffer();

  const favicon32 = await sharp(SOURCE_IMAGE)
    .resize(32, 32, { fit: "cover" })
    .png()
    .toBuffer();

  // For simplicity, use the 32x32 as the favicon.ico (most browsers handle PNG)
  await sharp(SOURCE_IMAGE)
    .resize(32, 32, { fit: "cover" })
    .png()
    .toFile(path.join(APP_DIR, "favicon.ico"));
  console.log("Created app/favicon.ico (32x32 PNG)");

  console.log("\nFavicon generation complete!");
  console.log("Next.js will automatically use these files from the app/ directory.");
}

generateFavicons().catch((err) => {
  console.error("Error generating favicons:", err);
  process.exit(1);
});
