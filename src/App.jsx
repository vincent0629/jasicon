import { useCallback, useEffect, useRef, useState } from 'react'
import JSZip from 'jszip';
import './App.css'

function App() {
  const [foreground, setForeground] = useState(null);
  const [background, setBackground] = useState(null);
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

  const onBackgroundChanged = (event) => {
    if (event.target.files.length === 0)
      return;
    const image = document.createElement('IMG');
    image.onload = () => {
      setBackground(image);
    };
    image.src = URL.createObjectURL(event.target.files[0]);
  };

  const draw = (context, size, foreground, background) => {
    context.save();
    context.translate(size / 2, size / 2);
    if (background) {
      const scale = Math.min(size / background.width, size / background.height);
      context.save();
      context.scale(scale, scale);
      context.drawImage(background, -background.width / 2, -background.height / 2);
      context.restore();
    }
    if (foreground) {
      const scale = Math.min(size / foreground.width, size / foreground.height);
      context.save();
      context.scale(scale, scale);
      context.drawImage(foreground, -foreground.width / 2, -foreground.height / 2);
      context.restore();
    }
    context.restore();
  };

  const clipCorner = (context, size) => {
    const r = size / 6;
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

  const exportGooglePlayIcon = (size, foreground, background) => {
    let canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    clipCorner(context, size);
    draw(context, size, foreground, background);
    return canvas.convertToBlob();
  };

  const exportLauncherIcon = (size, foreground, background) => {
    let canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    context.translate(size / 10, size / 10);
    clipCorner(context, Math.round(size * 0.8));
    draw(context, Math.round(size * 0.8), foreground, background);
    return canvas.convertToBlob();
  };

  const exportSplashIcon = (size, foreground, background) => {
    let canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    context.translate(size / 6, size / 6);
    clipRound(context, Math.round(size * 2 / 3));
    draw(context, Math.round(size * 2 / 3), foreground, background);
    return canvas.convertToBlob();
  };

  const onExport = useCallback((event) => {
    const zip = new JSZip();
    const sizes = {
      mdpi: 1,
      hdpi: 1.5,
      xhdpi: 2,
      xxhdpi: 3,
      xxxhdpi: 4,
    };
    zip.file('google_play.png', exportGooglePlayIcon(512, foreground, background));
    Object.keys(sizes).forEach((key) => {
      let folder = zip.folder(`mipmap-${key}`);
      folder.file('ic_launcher.png', exportLauncherIcon(48 * sizes[key], foreground, background));
      folder = zip.folder(`drawable-${key}`);
      folder.file('splash.png', exportSplashIcon(240 * sizes[key], foreground, background));
    });
    zip.generateAsync({type: 'blob'})
      .then((blob) => {
        const anchor = document.createElement('A');
        anchor.download = 'icons.zip';
        anchor.href = URL.createObjectURL(blob);
        anchor.click();
      });
  }, [foreground, background]);

  useEffect(() => {
    if (!canvasRef.current)
      return;

    const size = canvasRef.current.width;
    const context = canvasRef.current.getContext('2d');
    context.clearRect(0, 0, size, size);
    draw(context, size, foreground, background);
  }, [foreground, background]);

  return (
    <div className="App">
      <div className="flex flex-row">
        <div className="flex flex-col">
          <div className="m-2 border p-2">
            <div className="font-bold">Foreground</div>
            <input type="file" accept="image/*" onChange={onForegroundChanged} />
          </div>
          <div className="m-2 border p-2">
            <div className="font-bold">Background</div>
            <input type="file" accept="image/*" onChange={onBackgroundChanged} />
          </div>
        </div>
        <div className="m-2 border p-2 grow">
          <div className="font-bold">Preview</div>
          <canvas className="border" width="192" height="192" ref={canvasRef} />
          <div className="mt-2"><button onClick={onExport}>Export</button></div>
        </div>
      </div>
    </div>
  )
}

export default App
