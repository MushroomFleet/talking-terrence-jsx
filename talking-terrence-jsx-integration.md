# Talking Terrence JSX - Integration Guide

This guide covers how to integrate the Talking Terrence head flap animation component into your React projects.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Basic Integration](#basic-integration)
4. [Component API](#component-api)
5. [Customization](#customization)
6. [Programmatic Control](#programmatic-control)
7. [Advanced Usage](#advanced-usage)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- React 18+ (hooks-based)
- Modern browser with Canvas API support
- Web Audio API support (for audio file analysis)

## Installation

### Option 1: Direct File Copy

Copy `talking-terrence.jsx` into your project's components directory:

```
src/
  components/
    talking-terrence.jsx
```

### Option 2: NPM Package (if published)

```bash
npm install talking-terrence-jsx
```

## Basic Integration

### Step 1: Import the Component

```jsx
import TalkingTerrence from './components/talking-terrence';
```

### Step 2: Add to Your App

```jsx
function App() {
  return (
    <div className="app">
      <TalkingTerrence />
    </div>
  );
}
```

### Step 3: Ensure Container Sizing

The component needs sufficient space. Ensure the parent container allows for at least 850px width:

```css
.app {
  min-height: 100vh;
  width: 100%;
}
```

## Component API

### Default Export

The component exports as a default React functional component with no required props.

```jsx
<TalkingTerrence />
```

### Internal State

The component manages all state internally through React hooks:

| State | Type | Description |
|-------|------|-------------|
| `stage` | `'setup' \| 'cutLine' \| 'dubbing'` | Current workflow stage |
| `character` | `string \| null` | Base64 data URL of character image |
| `background` | `string \| null` | Base64 data URL of background image |
| `cutLine` | `{start: Point, end: Point}` | Cut line coordinates |
| `mouthOpen` | `number` | 0-1 value for mouth animation |
| `pivotSide` | `'left' \| 'right'` | Which side of cut line is the hinge |

## Customization

### Styling

The component uses inline styles via a `styles` object. To customize, you can:

#### Option A: Fork and Modify

Edit the `styles` constant at the bottom of the component:

```jsx
const styles = {
  container: {
    minHeight: '100vh',
    background: '#your-color', // Change background
    // ...
  },
  // ...
};
```

#### Option B: CSS Override Wrapper

Wrap the component and use CSS specificity:

```jsx
<div className="terrence-wrapper">
  <TalkingTerrence />
</div>
```

```css
.terrence-wrapper canvas {
  border-color: #your-color !important;
}
```

### Canvas Dimensions

Default canvas size is 800x500. To modify, find and update:

```jsx
<canvas
  ref={canvasRef}
  width={800}   // Change width
  height={500}  // Change height
  // ...
/>
```

Also update the position slider max values accordingly.

### Color Scheme

Key colors to modify for theming:

| Element | Current | Variable Location |
|---------|---------|-------------------|
| Primary accent | `#00ff88` | `titleAccent`, `pivotBtn`, `volumeBar` |
| Secondary accent | `#ff0066` | `canvas` border, `uploadBtn`, `modeBtn` |
| Background | `#0a0a0f` | `container` |
| Panel background | `rgba(20,20,25,0.8)` | `controls` |

## Programmatic Control

### Exposing Controls via Ref

To control the component programmatically, modify it to accept a ref:

```jsx
import { forwardRef, useImperativeHandle } from 'react';

const TalkingTerrence = forwardRef((props, ref) => {
  // ... existing state ...

  useImperativeHandle(ref, () => ({
    setMouthOpen: (value) => {
      setMouthOpen(value);
      mouthOpenRef.current = value;
    },
    getMouthOpen: () => mouthOpenRef.current,
    setStage: (stage) => setStage(stage),
    getStage: () => stageRef.current,
    loadCharacter: (dataUrl) => setCharacter(dataUrl),
    loadBackground: (dataUrl) => setBackground(dataUrl),
  }));

  // ... rest of component ...
});
```

Usage:

```jsx
const terrenceRef = useRef();

// Control mouth programmatically
terrenceRef.current.setMouthOpen(0.5);

// Load character from URL
fetch('/character.png')
  .then(r => r.blob())
  .then(blob => {
    const reader = new FileReader();
    reader.onload = () => terrenceRef.current.loadCharacter(reader.result);
    reader.readAsDataURL(blob);
  });
```

### Real-time Microphone Input

For environments that support microphone access (not sandboxed):

```jsx
const startMicrophone = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  const analyze = () => {
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate RMS volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const normalized = Math.min(1, rms / 128);
    
    terrenceRef.current.setMouthOpen(normalized);
    requestAnimationFrame(analyze);
  };
  
  analyze();
};
```

## Advanced Usage

### Multiple Characters

To support multiple characters in a scene, you can instantiate state for each:

```jsx
const [characters, setCharacters] = useState([
  { id: 1, image: null, transform: { x: 200, y: 280, scale: 1, rotation: 0 }, cutLine: null },
  { id: 2, image: null, transform: { x: 600, y: 280, scale: 1, rotation: 0 }, cutLine: null },
]);
```

### Animation Export

To export the animation as video, integrate with MediaRecorder:

```jsx
const exportVideo = () => {
  const canvas = canvasRef.current;
  const stream = canvas.captureStream(30); // 30 FPS
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks = [];
  
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    // Download or use the video URL
  };
  
  recorder.start();
  // Stop after duration or user action
  setTimeout(() => recorder.stop(), 10000);
};
```

### Integration with Text-to-Speech

Combine with Web Speech API for automated dialogue:

```jsx
const speak = (text) => {
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Animate mouth during speech
  utterance.onstart = () => {
    const animateMouth = () => {
      if (speechSynthesis.speaking) {
        // Pseudo-random mouth movement for speech
        const openAmount = 0.3 + Math.random() * 0.5;
        terrenceRef.current.setMouthOpen(openAmount);
        setTimeout(animateMouth, 100 + Math.random() * 100);
      } else {
        terrenceRef.current.setMouthOpen(0);
      }
    };
    animateMouth();
  };
  
  speechSynthesis.speak(utterance);
};
```

## Troubleshooting

### Cut Line Not Drawing Correctly

**Symptom:** Line starts from wrong position or doesn't follow mouse.

**Solution:** Ensure canvas scaling is accounted for:

```jsx
const getCanvasCoords = (e) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
};
```

### Animation Not Updating

**Symptom:** Changing `mouthOpen` doesn't animate the character.

**Solution:** Ensure both state and ref are updated:

```jsx
setMouthOpen(value);
mouthOpenRef.current = value;
```

### Audio Not Playing

**Symptom:** Audio file mode doesn't produce sound.

**Solution:** AudioContext requires user interaction to start. Ensure `playAudio()` is called from a click handler.

### Character Image Not Loading

**Symptom:** Uploaded image doesn't appear on canvas.

**Solution:** Verify the image is loaded before rendering:

```jsx
useEffect(() => {
  if (character) {
    const img = new Image();
    img.onload = () => setCharacterImg(img);  // Wait for load
    img.onerror = () => console.error('Failed to load image');
    img.src = character;
  }
}, [character]);
```

### Performance Issues

**Symptom:** Animation is choppy or laggy.

**Solutions:**
1. Reduce canvas size
2. Simplify background image (or use solid color)
3. Ensure no memory leaks in animation frame loop:

```jsx
useEffect(() => {
  let frameId;
  const render = () => {
    // ... render logic ...
    frameId = requestAnimationFrame(render);
  };
  render();
  
  return () => {
    if (frameId) cancelAnimationFrame(frameId);  // Cleanup!
  };
}, [dependencies]);
```

---

## Support

For issues, feature requests, or contributions, visit:
**https://github.com/MushroomFleet/talking-terrence-jsx**

---

*Happy animating! 🎬*
