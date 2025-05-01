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

    // Apply filters
    photo
      .resize(256, 256)    // resize to 256x256
      .quality(60)         // set JPEG quality
      .greyscale();        // convert to greyscale

    await photo.writeAsync(outpath); // save image

    // Ensure file exists before returning
    if (!fs.existsSync(outpath)) {
      throw new Error("Filtered image was not saved properly.");
    }

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
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    } catch (err) {
      console.warn(`Could not delete file ${file}: ${err.message}`);
    }
  }
}
