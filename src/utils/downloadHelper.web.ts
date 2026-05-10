export const savePdf = async (
  blob: Blob,
  filename: string,
): Promise<string | null> => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Return null because the web automatically downloads it to the user's computer;
  // there is no local app URI needed for sharing on the web.
  return null;
};
