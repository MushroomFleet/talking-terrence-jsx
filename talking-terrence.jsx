import React, { useState, useRef, useEffect } from 'react';

const STAGES = {
  SETUP: 'setup',
  CUT_LINE: 'cutLine',
  DUBBING: 'dubbing'
};

export default function TalkingTerrence() {
  const [stage, setStage] = useState(STAGES.SETUP);
  const [background, setBackground] = useState(null);
  const [backgroundImg, setBackgroundImg] = useState(null);
  const [character, setCharacter] = useState(null);
  const [characterImg, setCharacterImg] = useState(null);
  const [charTransform, setCharTransform] = useState({ x: 400, y: 280, scale: 1, rotation: 0 });
  const [cutLine, setCutLine] = useState({ start: null, end: null });
  const [isDrawing, setIsDrawing] = useState(false);
  const [pivotSide, setPivotSide] = useState('left');
  const [mouthOpen, setMouthOpen] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sensitivity, setSensitivity] = useState(2);
  const [maxAngle, setMaxAngle] = useState(35);
  const [audioData, setAudioData] = useState(null);
  const [inputMode, setInputMode] = useState('manual');
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  
  // Refs to avoid stale closures in animation loop
  const cutLineRef = useRef(cutLine);
  const mouthOpenRef = useRef(mouthOpen);
  const stageRef = useRef(stage);
  const pivotSideRef = useRef(pivotSide);
  const maxAngleRef = useRef(maxAngle);
  const charTransformRef = useRef(charTransform);
  
  // Keep refs in sync with state
  useEffect(() => { cutLineRef.current = cutLine; }, [cutLine]);
  useEffect(() => { mouthOpenRef.current = mouthOpen; }, [mouthOpen]);
  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { pivotSideRef.current = pivotSide; }, [pivotSide]);
  useEffect(() => { maxAngleRef.current = maxAngle; }, [maxAngle]);
  useEffect(() => { charTransformRef.current = charTransform; }, [charTransform]);

  // Load background image
  useEffect(() => {
    if (background) {
      const img = new Image();
      img.onload = () => setBackgroundImg(img);
      img.src = background;
    } else {
      setBackgroundImg(null);
    }
  }, [background]);

  // Load character image
  useEffect(() => {
    if (character) {
      const img = new Image();
      img.onload = () => setCharacterImg(img);
      img.src = character;
    } else {
      setCharacterImg(null);
    }
  }, [character]);

  // Keyboard controls
  useEffect(() => {
    if (stage !== STAGES.DUBBING || inputMode !== 'keyboard') return;
    
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpaceHeld(true);
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpaceHeld(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [stage, inputMode]);

  // Animate mouth based on space key
  useEffect(() => {
    if (inputMode === 'keyboard') {
      setMouthOpen(isSpaceHeld ? 1 : 0);
    }
  }, [isSpaceHeld, inputMode]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let frameId;
    
    const render = () => {
      // Read current values from refs to avoid stale closures
      const currentCutLine = cutLineRef.current;
      const currentMouthOpen = mouthOpenRef.current;
      const currentStage = stageRef.current;
      const currentPivotSide = pivotSideRef.current;
      const currentMaxAngle = maxAngleRef.current;
      const currentCharTransform = charTransformRef.current;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      if (backgroundImg) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#2d5a27');
        grad.addColorStop(1, '#1a3d15');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#3d2914';
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
      }
      
      // Draw character
      if (characterImg) {
        const { x, y, scale, rotation } = currentCharTransform;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rotation * Math.PI) / 180);
        
        if (currentStage === STAGES.DUBBING && currentCutLine.start && currentCutLine.end) {
          drawAnimatedCharacter(ctx, characterImg, scale, currentCutLine, currentCharTransform, currentPivotSide, currentMouthOpen, currentMaxAngle);
        } else {
          ctx.scale(scale, scale);
          ctx.drawImage(characterImg, -characterImg.width / 2, -characterImg.height / 2);
        }
        
        ctx.restore();
      }
      
      // Draw cut line in CUT_LINE stage
      if (currentStage === STAGES.CUT_LINE && currentCutLine.start) {
        ctx.save();
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -Date.now() / 50;
        ctx.beginPath();
        ctx.moveTo(currentCutLine.start.x, currentCutLine.start.y);
        if (currentCutLine.end) {
          ctx.lineTo(currentCutLine.end.x, currentCutLine.end.y);
        }
        ctx.stroke();
        
        if (currentCutLine.end) {
          ctx.fillStyle = currentPivotSide === 'left' ? '#00ff88' : '#ff6b6b';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(currentCutLine.start.x, currentCutLine.start.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = currentPivotSide === 'right' ? '#00ff88' : '#ff6b6b';
          ctx.beginPath();
          ctx.arc(currentCutLine.end.x, currentCutLine.end.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          const pivotPoint = currentPivotSide === 'left' ? currentCutLine.start : currentCutLine.end;
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pivotPoint.x, pivotPoint.y, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
      
      frameId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [backgroundImg, characterImg]);

  const drawAnimatedCharacter = (ctx, img, scale, currentCutLine, currentCharTransform, currentPivotSide, currentMouthOpen, currentMaxAngle) => {
    if (!currentCutLine.start || !currentCutLine.end) return;
    
    const { x, y } = currentCharTransform;
    const imgW = img.width;
    const imgH = img.height;
    
    // Convert cut line from canvas coords to local image coords
    const localStart = {
      x: (currentCutLine.start.x - x) / scale + imgW / 2,
      y: (currentCutLine.start.y - y) / scale + imgH / 2
    };
    const localEnd = {
      x: (currentCutLine.end.x - x) / scale + imgW / 2,
      y: (currentCutLine.end.y - y) / scale + imgH / 2
    };
    
    const cutY = Math.min(localStart.y, localEnd.y);
    
    ctx.scale(scale, scale);
    
    // Draw BOTTOM part (body + jaw) - stays fixed
    ctx.save();
    ctx.beginPath();
    ctx.rect(-imgW / 2, cutY - imgH / 2, imgW, imgH);
    ctx.clip();
    ctx.drawImage(img, -imgW / 2, -imgH / 2);
    ctx.restore();
    
    // Draw TOP part (head above cut) - this rotates
    const pivot = currentPivotSide === 'left' ? localStart : localEnd;
    const pivotX = pivot.x - imgW / 2;
    const pivotY = pivot.y - imgH / 2;
    
    const rotationDir = currentPivotSide === 'left' ? -1 : 1;
    const currentAngle = (currentMouthOpen * currentMaxAngle * rotationDir * Math.PI) / 180;
    
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(currentAngle);
    ctx.translate(-pivotX, -pivotY);
    
    ctx.beginPath();
    ctx.rect(-imgW / 2, -imgH / 2, imgW, cutY);
    ctx.clip();
    ctx.drawImage(img, -imgW / 2, -imgH / 2);
    ctx.restore();
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (type === 'audio') {
      const url = URL.createObjectURL(file);
      setAudioData(url);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (type === 'background') {
        setBackground(ev.target.result);
      } else {
        setCharacter(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

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

  const handleCanvasMouseDown = (e) => {
    if (stage !== STAGES.CUT_LINE) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const newCutLine = { start: coords, end: null };
    setCutLine(newCutLine);
    cutLineRef.current = newCutLine;
    setIsDrawing(true);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || stage !== STAGES.CUT_LINE) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const newCutLine = { ...cutLineRef.current, end: coords };
    setCutLine(newCutLine);
    cutLineRef.current = newCutLine;
  };

  const handleCanvasMouseUp = (e) => {
    if (isDrawing) {
      e?.preventDefault();
      setIsDrawing(false);
    }
  };

  const playAudio = () => {
    if (!audioData || !audioRef.current) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    
    audioRef.current.play();
    setIsPlaying(true);
    analyzeAudio();
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setMouthOpen(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current || !audioRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const analyze = () => {
      if (audioRef.current.paused || audioRef.current.ended) {
        setIsPlaying(false);
        setMouthOpen(0);
        return;
      }
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      let sum = 0;
      const startBin = Math.floor(300 / (audioContextRef.current.sampleRate / analyserRef.current.fftSize));
      const endBin = Math.min(dataArray.length, Math.floor(3000 / (audioContextRef.current.sampleRate / analyserRef.current.fftSize)));
      
      for (let i = startBin; i < endBin; i++) {
        sum += dataArray[i];
      }
      const avg = sum / (endBin - startBin);
      
      const normalized = Math.min(1, (avg / 128) * sensitivity);
      const threshold = 0.08;
      const openAmount = normalized > threshold ? Math.pow(normalized, 0.7) : 0;
      
      setMouthOpen(openAmount);
      
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    
    analyze();
  };

  const proceedToNextStage = () => {
    if (stage === STAGES.SETUP && characterImg) {
      setStage(STAGES.CUT_LINE);
    } else if (stage === STAGES.CUT_LINE && cutLine.start && cutLine.end) {
      setStage(STAGES.DUBBING);
    }
  };

  const goBack = () => {
    if (stage === STAGES.DUBBING) {
      stopAudio();
      setStage(STAGES.CUT_LINE);
    } else if (stage === STAGES.CUT_LINE) {
      const emptyCutLine = { start: null, end: null };
      setCutLine(emptyCutLine);
      cutLineRef.current = emptyCutLine;
      setStage(STAGES.SETUP);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleAccent}>TERRANCE & PHILLIP</span>
          <span style={styles.subtitle}>Head Flap Studio</span>
        </h1>
        <div style={styles.stageIndicator}>
          {[
            { key: STAGES.SETUP, label: 'SETUP' },
            { key: STAGES.CUT_LINE, label: 'CUT' },
            { key: STAGES.DUBBING, label: 'DUB' }
          ].map((s, i) => (
            <div key={s.key} style={{
              ...styles.stageStep,
              background: stage === s.key ? '#00ff88' : '#333',
              color: stage === s.key ? '#000' : '#666',
              borderColor: stage === s.key ? '#00ff88' : '#444'
            }}>
              <span style={styles.stageNum}>{i + 1}</span>
              <span style={styles.stageLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.workspace}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          style={styles.canvas}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
        
        {stage === STAGES.DUBBING && (
          <div style={styles.volumeMeter}>
            <div style={styles.volumeLabel}>FLAP</div>
            <div style={styles.volumeTrack}>
              <div style={{
                ...styles.volumeBar,
                height: `${mouthOpen * 100}%`
              }} />
            </div>
            <div style={styles.volumeValue}>{Math.round(mouthOpen * 100)}%</div>
          </div>
        )}
      </div>

      <div style={styles.controls}>
        {stage === STAGES.SETUP && (
          <div style={styles.setupPanel}>
            <div style={styles.uploadSection}>
              <label style={styles.uploadBtn}>
                <span style={styles.uploadIcon}>🖼️</span>
                <span>BACKGROUND</span>
                <span style={styles.uploadHint}>(optional)</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'background')} style={styles.hiddenInput} />
              </label>
              <label style={{...styles.uploadBtn, borderColor: characterImg ? '#00ff88' : '#ff0066'}}>
                <span style={styles.uploadIcon}>🧍</span>
                <span>CHARACTER</span>
                <span style={styles.uploadHint}>(transparent PNG)</span>
                <input type="file" accept="image/png" onChange={(e) => handleFileUpload(e, 'character')} style={styles.hiddenInput} />
              </label>
            </div>
            
            {characterImg && (
              <div style={styles.transformControls}>
                <div style={styles.sliderGroup}>
                  <label style={styles.sliderLabel}>X Position</label>
                  <input type="range" min="0" max="800" value={charTransform.x}
                    onChange={(e) => setCharTransform(prev => ({ ...prev, x: Number(e.target.value) }))}
                    style={styles.slider} />
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.sliderLabel}>Y Position</label>
                  <input type="range" min="0" max="500" value={charTransform.y}
                    onChange={(e) => setCharTransform(prev => ({ ...prev, y: Number(e.target.value) }))}
                    style={styles.slider} />
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.sliderLabel}>Scale: {charTransform.scale.toFixed(1)}x</label>
                  <input type="range" min="0.1" max="3" step="0.1" value={charTransform.scale}
                    onChange={(e) => setCharTransform(prev => ({ ...prev, scale: Number(e.target.value) }))}
                    style={styles.slider} />
                </div>
                <div style={styles.sliderGroup}>
                  <label style={styles.sliderLabel}>Rotation: {charTransform.rotation}°</label>
                  <input type="range" min="-45" max="45" value={charTransform.rotation}
                    onChange={(e) => setCharTransform(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                    style={styles.slider} />
                </div>
              </div>
            )}
          </div>
        )}

        {stage === STAGES.CUT_LINE && (
          <div style={styles.cutLinePanel}>
            <p style={styles.instruction}>
              Draw a line across the jaw where the head should split.
              <br />Click + drag from one side to the other.
            </p>
            <div style={styles.pivotSelector}>
              <span style={styles.pivotLabel}>HINGE SIDE:</span>
              <button
                style={{...styles.pivotBtn, background: pivotSide === 'left' ? '#00ff88' : '#222', color: pivotSide === 'left' ? '#000' : '#888'}}
                onClick={() => setPivotSide('left')}>
                ◀ LEFT
              </button>
              <button
                style={{...styles.pivotBtn, background: pivotSide === 'right' ? '#00ff88' : '#222', color: pivotSide === 'right' ? '#000' : '#888'}}
                onClick={() => setPivotSide('right')}>
                RIGHT ▶
              </button>
            </div>
            {cutLine.start && cutLine.end && (
              <p style={styles.helpText}>
                <span style={{color: '#00ff88'}}>●</span> Green = hinge point &nbsp;
                <span style={{color: '#ff6b6b'}}>●</span> Red = free end
              </p>
            )}
          </div>
        )}

        {stage === STAGES.DUBBING && (
          <div style={styles.dubbingPanel}>
            <div style={styles.modeSelector}>
              <button style={{...styles.modeBtn, background: inputMode === 'manual' ? '#ff0066' : '#222'}}
                onClick={() => { setInputMode('manual'); stopAudio(); }}>
                🎚️ MANUAL
              </button>
              <button style={{...styles.modeBtn, background: inputMode === 'keyboard' ? '#ff0066' : '#222'}}
                onClick={() => { setInputMode('keyboard'); stopAudio(); }}>
                ⌨️ KEYBOARD
              </button>
              <button style={{...styles.modeBtn, background: inputMode === 'audio' ? '#ff0066' : '#222'}}
                onClick={() => setInputMode('audio')}>
                🔊 AUDIO FILE
              </button>
            </div>

            {inputMode === 'manual' && (
              <div style={styles.manualControls}>
                <label style={styles.sliderLabel}>Mouth Open: {Math.round(mouthOpen * 100)}%</label>
                <input type="range" min="0" max="1" step="0.01" value={mouthOpen}
                  onChange={(e) => setMouthOpen(Number(e.target.value))}
                  style={{...styles.slider, width: '300px'}} />
              </div>
            )}

            {inputMode === 'keyboard' && (
              <div style={styles.keyboardInfo}>
                <div style={{...styles.spaceKey, background: isSpaceHeld ? '#00ff88' : '#333', color: isSpaceHeld ? '#000' : '#fff'}}>
                  SPACEBAR
                </div>
                <p style={styles.helpText}>Hold SPACEBAR to open mouth</p>
              </div>
            )}

            {inputMode === 'audio' && (
              <div style={styles.audioControls}>
                <label style={styles.audioUploadBtn}>
                  📁 LOAD AUDIO FILE
                  <input type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'audio')} style={styles.hiddenInput} />
                </label>
                {audioData && (
                  <>
                    <audio ref={audioRef} src={audioData} onEnded={() => { setIsPlaying(false); setMouthOpen(0); }} />
                    <button style={{...styles.playBtn, background: isPlaying ? '#ff0066' : '#00ff88'}}
                      onClick={isPlaying ? stopAudio : playAudio}>
                      {isPlaying ? '⏹ STOP' : '▶ PLAY'}
                    </button>
                  </>
                )}
              </div>
            )}

            <div style={styles.dubbingSettings}>
              <div style={styles.sliderGroup}>
                <label style={styles.sliderLabel}>Sensitivity: {sensitivity.toFixed(1)}x</label>
                <input type="range" min="0.5" max="5" step="0.1" value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  style={styles.slider} />
              </div>
              <div style={styles.sliderGroup}>
                <label style={styles.sliderLabel}>Max Angle: {maxAngle}°</label>
                <input type="range" min="10" max="90" value={maxAngle}
                  onChange={(e) => setMaxAngle(Number(e.target.value))}
                  style={styles.slider} />
              </div>
            </div>
          </div>
        )}

        <div style={styles.navButtons}>
          {stage !== STAGES.SETUP && (
            <button style={styles.backBtn} onClick={goBack}>← BACK</button>
          )}
          {stage !== STAGES.DUBBING && (
            <button
              style={{...styles.nextBtn,
                opacity: (stage === STAGES.SETUP && !characterImg) || 
                         (stage === STAGES.CUT_LINE && (!cutLine.start || !cutLine.end)) ? 0.4 : 1}}
              onClick={proceedToNextStage}
              disabled={(stage === STAGES.SETUP && !characterImg) || 
                        (stage === STAGES.CUT_LINE && (!cutLine.start || !cutLine.end))}>
              {stage === STAGES.SETUP ? 'DRAW CUT LINE →' : 'START DUBBING →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0f',
    padding: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#fff'
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px'
  },
  title: {
    margin: '0 0 12px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  titleAccent: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#00ff88',
    textShadow: '0 0 20px rgba(0,255,136,0.5)',
    letterSpacing: '3px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 400,
    letterSpacing: '6px',
    textTransform: 'uppercase'
  },
  stageIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px'
  },
  stageStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '2px solid',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'all 0.3s'
  },
  stageNum: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px'
  },
  stageLabel: {
    letterSpacing: '1px'
  },
  workspace: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '16px'
  },
  canvas: {
    border: '3px solid #ff0066',
    borderRadius: '8px',
    boxShadow: '0 0 40px rgba(255,0,102,0.2)',
    cursor: 'crosshair',
    maxWidth: '100%',
    height: 'auto'
  },
  volumeMeter: {
    width: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  volumeLabel: {
    fontSize: '10px',
    color: '#666',
    letterSpacing: '2px'
  },
  volumeTrack: {
    width: '24px',
    height: '200px',
    background: '#1a1a1a',
    borderRadius: '12px',
    border: '2px solid #333',
    position: 'relative',
    overflow: 'hidden'
  },
  volumeBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(to top, #00ff88, #88ff00, #ffff00, #ff8800, #ff0066)',
    borderRadius: '10px',
    transition: 'height 0.05s ease-out'
  },
  volumeValue: {
    fontSize: '11px',
    color: '#00ff88',
    fontWeight: 600
  },
  controls: {
    maxWidth: '820px',
    margin: '0 auto',
    padding: '20px',
    background: 'rgba(20,20,25,0.8)',
    borderRadius: '12px',
    border: '1px solid #222'
  },
  setupPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  uploadSection: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  uploadBtn: {
    padding: '20px 28px',
    background: '#151518',
    border: '2px dashed #ff0066',
    borderRadius: '12px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    minWidth: '160px'
  },
  uploadIcon: {
    fontSize: '28px'
  },
  uploadHint: {
    fontSize: '10px',
    color: '#555'
  },
  hiddenInput: {
    display: 'none'
  },
  transformControls: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    padding: '16px',
    background: '#111',
    borderRadius: '8px'
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  sliderLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  slider: {
    width: '100%',
    accentColor: '#ff0066',
    cursor: 'pointer',
    height: '6px'
  },
  cutLinePanel: {
    textAlign: 'center'
  },
  instruction: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#aaa',
    marginBottom: '20px'
  },
  pivotSelector: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  pivotLabel: {
    fontSize: '12px',
    color: '#666',
    letterSpacing: '1px'
  },
  pivotBtn: {
    padding: '10px 20px',
    border: '2px solid #00ff88',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  },
  helpText: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px'
  },
  dubbingPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  modeSelector: {
    display: 'flex',
    gap: '8px'
  },
  modeBtn: {
    padding: '12px 20px',
    border: '2px solid #ff0066',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  },
  manualControls: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '20px',
    background: '#111',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '400px'
  },
  keyboardInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px'
  },
  spaceKey: {
    padding: '16px 48px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '2px',
    border: '3px solid #555',
    boxShadow: '0 4px 0 #222',
    transition: 'all 0.1s'
  },
  audioControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  audioUploadBtn: {
    padding: '12px 24px',
    background: '#222',
    border: '2px solid #555',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 600
  },
  playBtn: {
    padding: '14px 32px',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  dubbingSettings: {
    display: 'flex',
    gap: '24px',
    padding: '16px',
    background: '#111',
    borderRadius: '8px'
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '20px'
  },
  backBtn: {
    padding: '12px 28px',
    background: 'transparent',
    border: '2px solid #444',
    borderRadius: '8px',
    color: '#888',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  nextBtn: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #ff0066 0%, #ff4488 100%)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 15px rgba(255,0,102,0.3)'
  }
};
