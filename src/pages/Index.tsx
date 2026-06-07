import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";

type Stage = "input" | "preview" | "generating" | "done";

const STYLE_PRESETS = [
  { id: "cinematic", label: "CINEMATIC" },
  { id: "anime", label: "ANIME" },
  { id: "realistic", label: "REALISTIC" },
  { id: "timelapse", label: "TIMELAPSE" },
  { id: "slowmo", label: "SLOW-MO" },
  { id: "retro", label: "RETRO" },
];

const DURATION_OPTIONS = ["5s", "10s", "15s", "30s"];
const RATIO_OPTIONS = ["16:9", "9:16", "1:1", "4:3"];

export default function Index() {
  const [stage, setStage] = useState<Stage>("input");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [duration, setDuration] = useState("10s");
  const [ratio, setRatio] = useState("16:9");
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newImages: string[] = [];
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push(e.target?.result as string);
        if (newImages.length === validFiles.length) {
          setUploadedImages((prev) => [...prev, ...newImages].slice(0, 6));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeImage = (idx: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = () => {
    setStage("generating");
    setProgress(0);

    const steps = [
      { pct: 12, label: "АНАЛИЗ ИЗОБРАЖЕНИЙ..." },
      { pct: 28, label: "ИЗВЛЕЧЕНИЕ КЛЮЧЕВЫХ КАДРОВ..." },
      { pct: 45, label: "ПРИМЕНЕНИЕ СТИЛЯ..." },
      { pct: 63, label: "ГЕНЕРАЦИЯ ДВИЖЕНИЯ..." },
      { pct: 78, label: "РЕНДЕРИНГ ВИДЕО..." },
      { pct: 91, label: "ФИНАЛЬНАЯ ОБРАБОТКА..." },
      { pct: 100, label: "ЗАВЕРШЕНО" },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(interval);
        setTimeout(() => setStage("done"), 300);
        return;
      }
      setProgress(steps[i].pct);
      setProgressLabel(steps[i].label);
      i++;
    }, 800);
  };

  const handleReset = () => {
    setStage("input");
    setUploadedImages([]);
    setPrompt("");
    setProgress(0);
    setProgressLabel("");
  };

  const canProceed = uploadedImages.length > 0 && prompt.trim().length > 0;

  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-hidden">
      {/* Scanline */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[2px] opacity-[0.07]"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(185,100%,50%), transparent)",
            animation: "scanline 8s linear infinite",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border border-[hsl(185,100%,50%)] flex items-center justify-center animate-pulse-glow">
            <div className="w-2 h-2 bg-[hsl(185,100%,50%)]" />
          </div>
          <span className="font-mono text-sm font-semibold tracking-[0.2em] cyan-glow">VIDAI</span>
          <span className="font-mono text-xs text-muted-foreground tracking-widest hidden sm:block">
            // AI VIDEO ENGINE v1.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs text-muted-foreground">
            <span className="text-[hsl(185,100%,50%)]">●</span> ONLINE
          </div>
          <div className="font-mono text-xs text-muted-foreground border border-border px-2 py-1 hidden sm:block">
            GPU: A100
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">

        {/* ====== INPUT / PREVIEW STAGES ====== */}
        {(stage === "input" || stage === "preview") && (
          <div className="animate-fade-in-up">
            <div className="mb-8 animate-fade-in-up-delay-1">
              <p className="font-mono text-xs text-muted-foreground tracking-[0.3em] mb-2">
                [ МОДУЛЬ ГЕНЕРАЦИИ ВИДЕО ]
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Преврати фото в{" "}
                <span className="cyan-glow">видео</span> с помощью ИИ
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT */}
              <div className="space-y-4 animate-fade-in-up-delay-2">
                {/* Upload */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground tracking-widest block mb-2">
                    01 // ЗАГРУЗКА ФОТОГРАФИЙ
                  </label>
                  <div
                    className={`upload-zone rounded cursor-pointer min-h-[180px] flex flex-col items-center justify-center p-4 ${isDragging ? "dragging" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    {uploadedImages.length === 0 ? (
                      <>
                        <div className="w-12 h-12 border border-[hsl(185,100%,50%,0.4)] flex items-center justify-center mb-3">
                          <Icon name="Upload" size={20} className="text-[hsl(185,100%,50%)]" />
                        </div>
                        <p className="font-mono text-sm text-muted-foreground text-center">
                          ПЕРЕТАЩИ ФОТО СЮДА
                        </p>
                        <p className="font-mono text-xs text-muted-foreground/50 mt-1">
                          или кликни для выбора · JPG, PNG, WEBP · до 6 фото
                        </p>
                      </>
                    ) : (
                      <div className="w-full">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {uploadedImages.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square">
                              <img
                                src={img}
                                alt={`photo-${idx}`}
                                className="w-full h-full object-cover border border-border"
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/70 border border-red-500/50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Icon name="X" size={10} />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 font-mono text-[9px] text-center text-muted-foreground py-0.5">
                                #{String(idx + 1).padStart(2, "0")}
                              </div>
                            </div>
                          ))}
                          {uploadedImages.length < 6 && (
                            <div className="aspect-square border border-dashed border-[hsl(185,100%,50%,0.2)] flex items-center justify-center">
                              <Icon name="Plus" size={16} className="text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground text-center">
                          {uploadedImages.length}/6 фото · кликни чтобы добавить ещё
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground tracking-widest block mb-2">
                    02 // ПРОМТ — ОПИСАНИЕ ВИДЕО
                  </label>
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={"Опиши, что должно происходить в видео...\nНапример: «камера плавно отдаляется, закат переходит в ночь»"}
                      rows={4}
                      className="w-full bg-[hsl(220,18%,9%)] border border-border px-3 py-3 font-sans text-sm text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:border-[hsl(185,100%,50%,0.6)] transition-colors"
                    />
                    <div className="absolute bottom-2 right-3 font-mono text-xs text-muted-foreground/40">
                      {prompt.length}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {["плавное движение камеры", "смена дня и ночи", "замедленная съёмка", "кинематографичный переход"].map((q) => (
                      <button
                        key={q}
                        onClick={() => setPrompt((p) => p ? p + ", " + q : q)}
                        className="param-tag"
                      >
                        + {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-5 animate-fade-in-up-delay-3">
                {/* Style */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground tracking-widest block mb-3">
                    03 // СТИЛЬ
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {STYLE_PRESETS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`param-tag py-2 text-center ${style === s.id ? "active" : ""}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground tracking-widest block mb-3">
                    04 // ДЛИТЕЛЬНОСТЬ
                  </label>
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map((d) => (
                      <button key={d} onClick={() => setDuration(d)}
                        className={`param-tag flex-1 py-2 text-center ${duration === d ? "active" : ""}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ratio */}
                <div>
                  <label className="font-mono text-xs text-muted-foreground tracking-widest block mb-3">
                    05 // СООТНОШЕНИЕ СТОРОН
                  </label>
                  <div className="flex gap-2">
                    {RATIO_OPTIONS.map((r) => (
                      <button key={r} onClick={() => setRatio(r)}
                        className={`param-tag flex-1 py-2 text-center ${ratio === r ? "active" : ""}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="border border-border p-4 space-y-2 bg-[hsl(220,15%,10%)]">
                  <p className="font-mono text-xs text-muted-foreground tracking-widest mb-3">ПАРАМЕТРЫ ЗАДАЧИ</p>
                  {[
                    { key: "СТИЛЬ", val: style.toUpperCase() },
                    { key: "ДЛИТ.", val: duration },
                    { key: "ФОРМАТ", val: ratio },
                    { key: "КАДРОВ", val: uploadedImages.length > 0 ? `${uploadedImages.length} фото` : "—" },
                  ].map(({ key, val }) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="font-mono text-xs text-muted-foreground">{key}</span>
                      <span className="font-mono text-xs text-[hsl(185,100%,50%)]">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => setStage("preview")}
                    disabled={!canProceed}
                    className="w-full py-3 border border-[hsl(185,100%,50%,0.4)] font-mono text-sm text-[hsl(185,100%,50%)] tracking-widest transition-all hover:border-[hsl(185,100%,50%)] hover:bg-[hsl(185,100%,50%,0.05)] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Icon name="Eye" size={14} className="inline mr-2" />
                    ПРЕДПРОСМОТР
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!canProceed}
                    className="btn-primary w-full py-3 text-sm tracking-widest"
                  >
                    <Icon name="Clapperboard" size={14} className="inline mr-2" />
                    СГЕНЕРИРОВАТЬ ВИДЕО
                  </button>
                  {!canProceed && (
                    <p className="font-mono text-xs text-muted-foreground text-center">
                      {uploadedImages.length === 0 ? "⚡ Загрузи хотя бы 1 фото" : "⚡ Введи описание"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* PREVIEW PANEL */}
            {stage === "preview" && (
              <div className="mt-10 animate-fade-in-up">
                <div className="section-line mb-6" />
                <p className="font-mono text-xs text-muted-foreground tracking-[0.3em] mb-5">
                  [ ПРЕДПРОСМОТР РЕЗУЛЬТАТА ]
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div
                      className="relative border border-[hsl(185,100%,50%,0.35)] overflow-hidden bg-[hsl(220,18%,9%)]"
                      style={{ aspectRatio: ratio.replace(":", "/") }}
                    >
                      {uploadedImages.length > 0 && (
                        <img src={uploadedImages[0]} alt="preview"
                          className="w-full h-full object-cover opacity-65" />
                      )}
                      <div className="absolute inset-0 grid-bg opacity-40" />
                      {["top-0 left-0 border-t border-l","top-0 right-0 border-t border-r","bottom-0 left-0 border-b border-l","bottom-0 right-0 border-b border-r"].map((cls, i) => (
                        <div key={i} className={`absolute w-4 h-4 border-[hsl(185,100%,50%)] ${cls}`} />
                      ))}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center bg-black/50 px-4 py-2 border border-[hsl(185,100%,50%,0.25)]">
                          <p className="font-mono text-xs text-[hsl(185,100%,50%)]">PREVIEW FRAME</p>
                          <p className="font-mono text-xs text-muted-foreground mt-1">
                            {style.toUpperCase()} · {ratio} · {duration}
                          </p>
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-2">
                        <div className="w-7 h-7 border border-[hsl(185,100%,50%)] flex items-center justify-center bg-black/60">
                          <Icon name="Play" size={11} className="text-[hsl(185,100%,50%)]" />
                        </div>
                        <div className="h-0.5 w-24 bg-[hsl(185,100%,50%,0.2)]">
                          <div className="h-full w-1/3 bg-[hsl(185,100%,50%)]" />
                        </div>
                      </div>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground mt-2 text-center">
                      ★ Предварительный вид · финальное видео будет с анимацией
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="border border-border p-4 bg-[hsl(220,15%,10%)]">
                      <p className="font-mono text-xs text-muted-foreground tracking-widest mb-3">ОПИСАНИЕ ЗАДАЧИ</p>
                      <p className="text-sm text-foreground leading-relaxed">{prompt}</p>
                    </div>
                    <div className="border border-border p-4 bg-[hsl(220,15%,10%)]">
                      <p className="font-mono text-xs text-muted-foreground tracking-widest mb-3">
                        ИСХОДНЫЕ КАДРЫ ({uploadedImages.length})
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {uploadedImages.map((img, idx) => (
                          <img key={idx} src={img}
                            className="w-14 h-14 object-cover border border-border" alt={`src-${idx}`} />
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="btn-primary w-full py-4 text-sm tracking-widest"
                    >
                      <Icon name="Zap" size={14} className="inline mr-2" />
                      ЗАПУСТИТЬ ГЕНЕРАЦИЮ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== GENERATING ====== */}
        {stage === "generating" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
            <div className="w-full max-w-lg text-center space-y-8">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-2 border-[hsl(185,100%,50%,0.15)] rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-[hsl(185,100%,50%)] rounded-full animate-spin-slow" />
                <div className="absolute inset-3 flex items-center justify-center">
                  <Icon name="Clapperboard" size={28} className="text-[hsl(185,100%,50%)]" />
                </div>
              </div>

              <div>
                <p className="font-mono text-xs text-muted-foreground tracking-[0.3em] mb-2">
                  [ ГЕНЕРАЦИЯ ВИДЕО ]
                </p>
                <p className="font-mono text-sm text-[hsl(185,100%,50%)] tracking-widest">
                  {progressLabel}
                  <span className="animate-blink">_</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="h-1 bg-[hsl(220,15%,14%)] w-full">
                  <div
                    className="h-full bg-[hsl(185,100%,50%)] transition-all duration-700"
                    style={{ width: `${progress}%`, boxShadow: "0 0 8px hsl(185,100%,50%,0.8)" }}
                  />
                </div>
                <div className="flex justify-between font-mono text-xs text-muted-foreground">
                  <span>ПРОГРЕСС</span>
                  <span className="text-[hsl(185,100%,50%)]">{progress}%</span>
                </div>
              </div>

              <div className="text-left space-y-1 border border-border p-4 bg-[hsl(220,18%,9%)]">
                {[
                  { label: "Анализ входных данных", done: progress >= 12 },
                  { label: "Ключевые кадры", done: progress >= 28 },
                  { label: "Применение стиля", done: progress >= 45 },
                  { label: "Генерация движения", done: progress >= 63 },
                  { label: "Финальный рендер", done: progress >= 91 },
                ].map(({ label, done }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`font-mono text-xs w-4 ${done ? "text-[hsl(185,100%,50%)]" : "text-muted-foreground/30"}`}>
                      {done ? "✓" : "○"}
                    </span>
                    <span className={`font-mono text-xs ${done ? "text-foreground" : "text-muted-foreground/40"}`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====== DONE ====== */}
        {stage === "done" && (
          <div className="animate-fade-in-up max-w-2xl mx-auto text-center space-y-8 py-12">
            <div>
              <div className="w-16 h-16 border-2 border-[hsl(185,100%,50%)] flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Icon name="Check" size={28} className="text-[hsl(185,100%,50%)]" />
              </div>
              <p className="font-mono text-xs text-muted-foreground tracking-[0.3em] mb-2">[ ГОТОВО ]</p>
              <h2 className="text-2xl font-bold cyan-glow">Видео сгенерировано!</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Стиль: <span className="text-[hsl(185,100%,50%)] font-mono">{style.toUpperCase()}</span> ·{" "}
                Длина: <span className="text-[hsl(185,100%,50%)] font-mono">{duration}</span> ·{" "}
                Формат: <span className="text-[hsl(185,100%,50%)] font-mono">{ratio}</span>
              </p>
            </div>

            <div
              className="relative border border-[hsl(185,100%,50%,0.4)] overflow-hidden mx-auto animate-pulse-glow bg-[hsl(220,18%,9%)]"
              style={{ aspectRatio: ratio.replace(":", "/"), maxWidth: "480px" }}
            >
              <img
                src="https://cdn.poehali.dev/projects/f9d35422-02a0-4f48-b1e4-b2cda9b120ce/files/6118d778-de6b-4009-94bd-e54d93398927.jpg"
                alt="result"
                className="w-full h-full object-cover opacity-55"
              />
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-black/70 border border-[hsl(185,100%,50%)] flex items-center justify-center cursor-pointer hover:bg-[hsl(185,100%,50%,0.15)] transition-colors">
                  <Icon name="Play" size={28} className="text-[hsl(185,100%,50%)]" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-3 py-2 flex items-center gap-2">
                <Icon name="Play" size={12} className="text-[hsl(185,100%,50%)]" />
                <div className="h-0.5 flex-1 bg-[hsl(185,100%,50%,0.3)]">
                  <div className="h-full w-0 bg-[hsl(185,100%,50%)]" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">{duration}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <button className="btn-primary px-6 py-3 text-sm tracking-widest flex items-center gap-2">
                <Icon name="Download" size={14} />
                СКАЧАТЬ ВИДЕО
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-border font-mono text-sm tracking-widest text-muted-foreground hover:border-[hsl(185,100%,50%,0.4)] hover:text-foreground transition-all flex items-center gap-2"
              >
                <Icon name="RefreshCw" size={14} />
                НОВАЯ ГЕНЕРАЦИЯ
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-border px-6 py-4 mt-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="font-mono text-xs text-muted-foreground">VIDAI ENGINE // BUILD 2026.06</span>
          <span className="font-mono text-xs text-muted-foreground">
            <span className="text-[hsl(185,100%,50%)]">▲</span> POWERED BY NEURAL RENDERING
          </span>
        </div>
      </footer>
    </div>
  );
}
