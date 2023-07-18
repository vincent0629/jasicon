import { useEffect, useRef, useState } from 'react'
import JSZip from 'jszip';
import './App.css'

function App() {
  const [foreground, setForeground] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [bgColor, setBgColor] = useState(null);
  const bgColorRef = useRef(null);
  const bgImageRef = useRef(null);
  const launcherRef = useRef(null);
  const splashRef = useRef(null);
  const canvasRef = useRef(null);

  const onForegroundChanged = (event) => {
    if (event.target.files.length === 0)
      return;
    const image = document.createElement('IMG');
    image.onload = () => {
      setForeground(image);
    };
    image.src = URL.createObjectURL(event.target.files[0]);
  };

  const onBgColorChanged = (event) => {
    setBgColor(event.target.value);
  };

  const onResetBgColor = () => {
    setBgColor(null);
    bgColorRef.current.value = '#000000';
  };

  const onBgImageChanged = (event) => {
    if (event.target.files.length === 0)
      return;
    const image = document.createElement('IMG');
    image.onload = () => {
      setBgImage(image);
    };
    image.src = URL.createObjectURL(event.target.files[0]);
  };

  const onResetBgImage = () => {
    setBgImage(null);
    bgImageRef.current.value = null;
  };

  const draw = (context, size) => {
    context.save();
    if (bgColor) {
      context.fillStyle = bgColor;
      context.fillRect(0, 0, size, size);
    }
    context.translate(size / 2, size / 2);
    if (bgImage) {
      const [width, height] = [bgImage.naturalWidth, bgImage.naturalHeight];
      const scale = Math.min(size / width, size / height);
      context.save();
      context.scale(scale, scale);
      context.drawImage(bgImage, -width / 2, -height / 2);
      context.restore();
    }
    if (foreground) {
      const [width, height] = [foreground.naturalWidth, foreground.naturalHeight];
      const scale = Math.min(size / width, size / height);
      context.save();
      context.scale(scale, scale);
      context.drawImage(foreground, -width / 2, -height / 2);
      context.restore();
    }
    context.restore();
  };

  const clipCorner = (context, size, r) => {
    context.beginPath();
    context.moveTo(r, 0);
    context.arcTo(0, 0, 0, r, r);
    context.lineTo(0, size - r);
    context.arcTo(0, size, r, size, r);
    context.lineTo(size - r, size);
    context.arcTo(size, size, size, size - r, r);
    context.lineTo(size, r);
    context.arcTo(size, 0, size - r, 0, r);
    context.closePath();
    context.clip();
  };

  const clipRound = (context, size) => {
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    context.clip();
  }

  const exportGooglePlayIcon = (size) => {
    let canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    draw(context, size);
    return canvas.convertToBlob();
  };

  const exportLauncherIcon = (size) => {
    let canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    context.translate(size / 10, size / 10);
    clipCorner(context, Math.round(size * 0.8), Math.round(size * 0.8) / 12);
    draw(context, Math.round(size * 0.8));
    return canvas.convertToBlob();
  };

  const exportAdaptiveIcon = (size) => {
    let canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    context.translate(size / 6, size / 6);
    draw(context, Math.round(size * 2 / 3));
    return canvas.convertToBlob();
  };

  const exportSplashIcon = (size) => {
    let canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    context.translate(size / 6, size / 6);
    clipRound(context, Math.round(size * 2 / 3));
    draw(context, Math.round(size * 2 / 3));
    return canvas.convertToBlob();
  };

  const onExport = () => {
    const launcherIconName = `${launcherRef.current.value}.png`;
    const splashIconName = `${splashRef.current.value}.png`;
    const zip = new JSZip();
    const sizes = {
      mdpi: 1,
      hdpi: 1.5,
      xhdpi: 2,
      xxhdpi: 3,
      xxxhdpi: 4,
    };
    zip.file('ic_launcher-playstore.png', exportGooglePlayIcon(512));
    const res = zip.folder('res');
    Object.keys(sizes).forEach((key) => {
      const mipmap = res.folder(`mipmap-${key}`);
      mipmap.file(launcherIconName, exportLauncherIcon(48 * sizes[key]));
      const drawable = res.folder(`drawable-${key}`);
      // drawable.file('ic_launcher_foreground.png', exportAdaptiveIcon(108 * sizes[key]));
      drawable.file(splashIconName, exportSplashIcon(240 * sizes[key]));
    });
    zip.generateAsync({type: 'blob'})
      .then((blob) => {
        const anchor = document.createElement('A');
        anchor.download = 'icons.zip';
        anchor.href = URL.createObjectURL(blob);
        anchor.click();
      });
  };

  useEffect(() => {
    if (!canvasRef.current)
      return;

    const size = canvasRef.current.width;
    const context = canvasRef.current.getContext('2d');
    context.clearRect(0, 0, size, size);
    draw(context, size);
  }, [foreground, bgColor, bgImage]);

  return (
    <div className="App">
      <div className="m-2 font-bold">Legacy Android icon generator</div>
      <div className="flex flex-row">
        <div className="flex flex-col">
          <div className="m-2 border p-2">
            <div className="font-bold">Foreground image</div>
            <input type="file" accept="image/*" onChange={onForegroundChanged} />
          </div>
          <div className="m-2 border p-2">
            <div className="font-bold">Background color</div>
            <input type="color" onChange={onBgColorChanged} ref={bgColorRef} />
            <button className="float-right" onClick={onResetBgColor}>Reset</button>
          </div>
          <div className="m-2 border p-2">
            <div className="font-bold">Background image</div>
            <input type="file" accept="image/*" onChange={onBgImageChanged} ref={bgImageRef} />
            <button className="float-right" onClick={onResetBgImage}>Reset</button>
          </div>
          <div className="m-2 border p-2">
            <span className="font-bold">Launcher icon name</span>
            <input className="ml-2 p-2" type="text" defaultValue="ic_launcher" ref={launcherRef} />
          </div>
          <div className="m-2 border p-2">
            <span className="font-bold">Splash icon name</span>
            <input className="ml-2 p-2" type="text" defaultValue="splash_icon" ref={splashRef} />
          </div>
        </div>
        <div className="m-2 border p-2 grow">
          <div className="font-bold">Preview</div>
          <canvas className="border w-[192px] h-[192px]" width={`${192 * window.devicePixelRatio}`} height={`${192 * window.devicePixelRatio}`} ref={canvasRef} />
          <button className="mt-2" onClick={onExport}>Export</button>
        </div>
      </div>
    </div>
  )
}

export default App
