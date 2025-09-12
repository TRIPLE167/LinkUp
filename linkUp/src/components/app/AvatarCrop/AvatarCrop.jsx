import React, { useRef, useState, useEffect } from "react";
import "./AvatarCrop.scss";

const AvatarCrop = ({
  image,
  position,
  setPosition,
  displaySize,
  setDisplaySize,
  setCROP_SIZE,
  setOriginalSize,
}) => {
  const imgRef = useRef(null);
  const [cropSize, setCropSize] = useState(250);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 200, height: 200 });

 
  useEffect(() => {
    if (!imgSize.width || !imgSize.height) return;
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight / 2;
    const ratio = Math.min(
      maxWidth / imgSize.width,
      maxHeight / imgSize.height
    );

    const newDisplaySize = {
      width: Math.round(imgSize.width * ratio),
      height: Math.round(imgSize.height * ratio),
    };
    const newCropSize =
      Math.min(newDisplaySize.width, newDisplaySize.height) / 1.3;
    setCropSize(newCropSize);
    setCROP_SIZE?.(newCropSize);
    setDisplaySize?.(newDisplaySize);  
    setOriginalSize?.(imgSize); 
  }, [imgSize]);

  const clampPosition = (x, y) => {
    const maxX = displaySize.width - cropSize;
    const maxY = displaySize.height - cropSize;
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  };
 
  const handleDragStart = (e) => {
    setDragging(true);
    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
    setDragOffset({ x: clientX - position.x, y: clientY - position.y });
 
  };

  const handleDragMove = (e) => {
    if (!dragging) return;
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    const newPos = clampPosition(
      clientX - dragOffset.x,
      clientY - dragOffset.y
    );
    setPosition(newPos);
  };

  const handleDragEnd = () => setDragging(false);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    } else {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [dragging]);

  return (
    <>
      <div
        className="avatar-crop-container"
        style={{
          width: displaySize.width,
          height: displaySize.height,
        }}
      >
        <img
          src={image}
          alt="avatar"
          ref={imgRef}
          onLoad={(e) => {
            setImgSize({
              width: e.target.naturalWidth,
              height: e.target.naturalHeight,
            });
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: displaySize.width,
            height: displaySize.height,
            pointerEvents: "none",
          }}
        >
          <svg width={displaySize.width} height={displaySize.height}>
            <defs>
              <mask id="circle-mask">
                <rect
                  width={displaySize.width}
                  height={displaySize.height}
                  fill="white"
                />
                <circle
                  cx={position.x + cropSize / 2}
                  cy={position.y + cropSize / 2}
                  r={cropSize / 2}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width={displaySize.width}
              height={displaySize.height}
              fill="rgba(0,0,0,0.5)"
              mask="url(#circle-mask)"
            />
          </svg>
        </div>

        <div
          className="circle"
          style={{
            top: position.y,
            left: position.x,
            width: cropSize,
            height: cropSize,
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        />
      </div>
      <div className="background"></div>
    </>
  );
};

export default AvatarCrop;

 
