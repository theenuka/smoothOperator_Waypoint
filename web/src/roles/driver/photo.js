// Shrink a photo from the phone camera so it fits in the offline outbox.
// A phone photo is often 3 to 5 MB. Scaled to 800 px it is about 100 KB, small enough for localStorage.
export function shrinkPhoto(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file is not a photo."));
    };
    img.src = url;
  });
}
