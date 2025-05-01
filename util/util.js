import fs from "fs";
import Jimp from "jimp";
import path from "path";

/**
 * Downloads, filters, and saves an image locally.
 * @param {string} inputURL - Publicly accessible image URL
 * @returns {Promise<string>} - Absolute path to the saved filtered image
 */
export async function filterImageFromURL(inputURL) {
  try {
    const photo = await Jimp.read(inputURL);
    const outpath = path.join('/tmp', `filtered.${Date.now()}.jpg`);

    await photo
      .resize(256, 256)
      .quality(60)
      .greyscale()
      .writeAsync(outpath);

    return outpath;
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Deletes local files from the filesystem.
 * @param {string[]} files - Array of absolute file paths
 */
export async function deleteLocalFiles(files) {
  for (const file of files) {
    try {
      fs.unlinkSync(file);
    } catch (err) {
      console.warn(`Could not delete file ${file}: ${err.message}`);
    }
  }
}
