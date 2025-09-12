export async function getCroppedImg(
  imageSrc,
  position,
  cropSize,
  displaySize,
  imgSize
) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;

    image.onload = () => {
      const scaleX = imgSize.width / displaySize.width;
      const scaleY = imgSize.height / displaySize.height;

 
      const sx = position.x * scaleX;
      const sy = position.y * scaleY;
      const sWidth = cropSize * scaleX;
      const sHeight = cropSize * scaleY;

      const canvas = document.createElement("canvas");
      canvas.width = sWidth;
      canvas.height = sHeight;
      const ctx = canvas.getContext("2d");

 

      ctx.drawImage(
        image,
        sx,
        sy,
        sWidth,
        sHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas is empty"));
        },
        "image/jpeg",
        0.8
      );
    };

    image.onerror = () => reject(new Error("Failed to load image"));
  });
}
