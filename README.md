# 🎬 Talking Terrence JSX

A React component that recreates the iconic "head flap" animation style from South Park's Terrance & Phillip characters. Upload any character image, draw a cut line across the jaw, and animate the head opening like a Pez dispenser - driven by audio, keyboard, or manual control.

![Head Flap Animation](https://img.shields.io/badge/Animation-Head%20Flap-ff0066)
![React](https://img.shields.io/badge/React-18%2B-61dafb)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **Image-Based Animation** - Use any transparent PNG character image
- **Interactive Cut Line Tool** - Draw exactly where the head should split
- **Selectable Pivot Point** - Choose left or right side as the hinge
- **Multiple Control Modes:**
  - 🎚️ **Manual Slider** - Direct control for testing
  - ⌨️ **Keyboard** - Hold spacebar to animate
  - 🔊 **Audio File** - Syncs mouth movement to audio waveform
- **Scene Composition** - Add custom backgrounds
- **Real-time Preview** - See animations instantly on canvas

## 🚀 Quick Start

### Try the Demo

Open `demo.html` in any modern browser for an instant preview - no build step required!

```bash
# Clone the repository
git clone https://github.com/MushroomFleet/talking-terrence-jsx.git

# Open the demo
open demo.html
# or
start demo.html  # Windows
```

### Install in Your Project

```bash
# Copy the component to your React project
cp talking-terrence.jsx your-project/src/components/
```

```jsx
import TalkingTerrence from './components/talking-terrence';

function App() {
  return <TalkingTerrence />;
}
```

## 🎮 How It Works

### Stage 1: Setup
Upload your character (transparent PNG recommended) and optionally a background image. Position, scale, and rotate the character in the scene.

### Stage 2: Cut Line
Draw a line across the character's jaw to define where the head splits. Select which side acts as the hinge (pivot point) - typically the side closest to the screen edge, matching the South Park style.

### Stage 3: Dubbing
Choose your input method and animate! The head flaps open based on the input intensity:
- **Manual**: Drag the slider to control mouth position
- **Keyboard**: Hold SPACEBAR to open the mouth
- **Audio File**: Upload audio and watch the mouth sync to the sound

## 📁 Project Structure

```
talking-terrence-jsx/
├── README.md                              # This file
├── demo.html                              # Standalone browser demo
├── talking-terrence.jsx                   # Main React component
└── talking-terrence-jsx-integration.md    # Developer integration guide
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [demo.html](demo.html) | Interactive demo - open in browser |
| [Integration Guide](talking-terrence-jsx-integration.md) | Detailed developer documentation |

## 🛠️ Technical Details

### Dependencies
- React 18+ (uses hooks)
- No external animation libraries
- Canvas API for rendering
- Web Audio API for audio analysis

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

### Key Implementation Details

**Stale Closure Prevention**: Uses refs alongside state to ensure the animation loop always reads current values:

```jsx
const mouthOpenRef = useRef(mouthOpen);
useEffect(() => { mouthOpenRef.current = mouthOpen; }, [mouthOpen]);
```

**Audio Analysis**: Focuses on voice frequencies (300-3000 Hz) for accurate mouth sync:

```jsx
const startBin = Math.floor(300 / (sampleRate / fftSize));
const endBin = Math.floor(3000 / (sampleRate / fftSize));
```

**Pivot Rotation**: The head rotates around the selected endpoint of the cut line:

```jsx
const pivot = pivotSide === 'left' ? localStart : localEnd;
ctx.translate(pivot.x, pivot.y);
ctx.rotate(angle);
ctx.translate(-pivot.x, -pivot.y);
```

## 🎨 Customization

### Adjustable Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| X Position | 0-800 | Horizontal character position |
| Y Position | 0-500 | Vertical character position |
| Scale | 0.1-3.0 | Character size multiplier |
| Rotation | -45° to 45° | Character rotation |
| Max Angle | 10-90° | Maximum head flap angle |
| Sensitivity | 0.5-5.0 | Audio response sensitivity |

### Theming

The component uses an inline `styles` object that can be easily modified. Key colors:

- Primary: `#00ff88` (green accents)
- Secondary: `#ff0066` (pink accents)
- Background: `#0a0a0f` (dark)

## 🤝 Contributing

Contributions are welcome! Some ideas:

- [ ] Multiple character support
- [ ] Video export functionality
- [ ] Microphone input (for non-sandboxed environments)
- [ ] Preset character templates
- [ ] Timeline-based animation sequencing

## 📝 License

MIT License - feel free to use in personal and commercial projects.

## 🙏 Acknowledgments

- Inspired by the animation style of **Terrance & Phillip** from South Park
- Created by Trey Parker and Matt Stone's innovative cutout animation technique

---

## 📚 Citation

### Academic Citation

If you use this codebase in your research or project, please cite:

```bibtex
@software{talking_terrence_jsx,
  title = {Talking Terrence JSX: South Park Style Head Flap Animation Component},
  author = {Drift Johnson},
  year = {2025},
  url = {https://github.com/MushroomFleet/talking-terrence-jsx},
  version = {1.0.0}
}
```

### Donate

[![Ko-Fi](https://cdn.ko-fi.com/cdn/kofi3.png?v=3)](https://ko-fi.com/driftjohnson)
