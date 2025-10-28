import { Part } from "@google/genai";

/**
 * Converts a File object to a GoogleGenerativeAI.Part object.
 */
export async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        // The result includes the data URL prefix (e.g., "data:image/png;base64,"), 
        // which should be removed.
        const base64Data = (reader.result as string).split(',')[1];
        resolve(base64Data);
    };
    reader.readAsDataURL(file);
  });
  
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}