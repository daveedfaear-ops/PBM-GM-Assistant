/**
 * Converts a base64 string into a Blob object.
 * @param b64Data The base64 encoded data (without the data URL prefix).
 * @param contentType The MIME type of the data.
 * @param sliceSize The size of the chunks to process at a time.
 * @returns A Blob object.
 */
const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512): Blob => {
  const byteCharacters = atob(b64Data);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

/**
 * Converts a base64 string and a MIME type into a browser-managed blob URL.
 * This is more memory-efficient for displaying large images than using data URLs.
 * @param base64Data The base64 encoded data.
 * @param mimeType The MIME type of the image.
 * @returns A string containing the object URL (e.g., "blob:http://...").
 */
export const base64ToBlobUrl = (base64Data: string, mimeType: string): string => {
  const blob = b64toBlob(base64Data, mimeType);
  return URL.createObjectURL(blob);
};

/**
 * Converts a Blob object into a base64-encoded data URL.
 * @param blob The Blob object to convert.
 * @returns A promise that resolves with the data URL string.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to base64 data URL."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
