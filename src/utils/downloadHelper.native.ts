// src/utils/downloadHelper.native.ts
import * as FileSystem from "expo-file-system";

// Bypass the IDE's strict web-shim typing by casting to 'any'
const NativeFS: any = FileSystem;

export const savePdf = async (
  blob: Blob,
  filename: string,
): Promise<string | null> => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64data = (reader.result as string).split(",")[1];

        // Now NativeFS won't throw TypeScript errors!
        if (!NativeFS.documentDirectory) {
          throw new Error("File system not available");
        }

        const fileUri = `${NativeFS.documentDirectory}${filename}`;

        await NativeFS.writeAsStringAsync(fileUri, base64data, {
          encoding: NativeFS.EncodingType.Base64,
        });

        resolve(fileUri);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
