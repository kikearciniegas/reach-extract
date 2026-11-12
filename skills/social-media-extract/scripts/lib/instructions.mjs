// Copyright (c) 2026 Rafael Arciniegas

const TEXT_KEYS = ["text", "content", "transcript", "subtitle", "caption", "sentence"];
const START_KEYS = ["start", "from", "start_time", "startTime", "offset"];
const END_KEYS = ["end", "to", "end_time", "endTime"];

const STEP_CUE = /\b(?:first|second|third|next|then|finally|step\s*\d+|start by|after that|you (?:should|must|need to|have to)|make sure|remember to|try to|please)\b|(?:首先|然后|接着|最后|第[一二三四五六七八九十\d]+步|需要|必须|请)|\b(?:primero|segundo|luego|después|finalmente|debes?|necesitas?|tienes que|asegúrate)\b/i;
const IMPERATIVE = /^(?:add|allow|apply|audit|build|calculate|change|check|choose|click|close|configure|connect|copy|create|define|delete|deploy|disable|download|edit|enable|enter|extract|filter|find|generate|go|identify|install|keep|limit|load|lock|make|measure|move|open|paste|pick|prepare|record|remove|replace|review|run|save|scan|select|send|set|start|stop|test|track|transcribe|update|upload|use|validate|verify|write|agrega|añade|aplica|audita|calcula|cambia|comprueba|elige|cierra|configura|conecta|copia|crea|define|elimina|despliega|desactiva|descarga|edita|activa|ingresa|extrae|filtra|busca|genera|identifica|instala|conserva|limita|carga|bloquea|mide|mueve|abre|pega|prepara|registra|quita|reemplaza|revisa|ejecuta|guarda|escanea|selecciona|envía|establece|inicia|detén|prueba|rastrea|transcribe|actualiza|sube|usa|valida|verifica|escribe)\b/i;
const PREREQUISITE = /\b(?:before (?:you|starting|beginning)|prerequisite|required?|requires?|you(?:'ll| will) need|need to have|make sure you have|install first)\b|(?:antes de|requisito|necesitas tener)|(?:开始前|前提|需要先|先安装)/i;
const WARNING = /\b(?:warning|caution|be careful|do not|don't|never|avoid|risk|danger|important)\b|(?:advertencia|cuidado|no debes|evita)|(?:警告|注意|不要|切勿|避免|风险)/i;
const COMMAND = /(?:^|\s)(?:npm|npx|pnpm|yarn|pipx?|python3?|node|git|curl|wget|docker|opencli|agent-reach|ffmpeg|brew)\s+[^.!?]+|`[^`]+`/i;

function first(object, keys) {
  for (const key of keys) if (object?.[key] !== undefined && object[key] !== null) return object[key];
  return null;
}

function splitSentences(text) {
  return String(text)
    .replace(/[ \t]+/g, " ")
    .replace(/,\s+(?=(?:then|next|finally|luego|después|finalmente)\b)/gi, ". ")
    .replace(/，(?=(?:然后|接着|最后))/g, "。")
    .split(/(?<=[.!?。！？])\s+|\s*[•]\s*|\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4);
}

export function transcriptSegments(outputs) {
  const segments = [];
  function walk(value, meta, sourcePath = "$") {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, meta, `${sourcePath}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;
    const textKey = TEXT_KEYS.find((key) => typeof value[key] === "string" && value[key].trim());
    if (textKey) {
      segments.push({
        text: value[textKey].trim(),
        start: first(value, START_KEYS),
        end: first(value, END_KEYS),
        source_step: meta.label,
        source_path: `${sourcePath}.${textKey}`,
      });
    }
    for (const [key, child] of Object.entries(value)) {
      if (child && typeof child === "object") walk(child, meta, `${sourcePath}.${key}`);
    }
  }

  for (const output of outputs.filter((item) => item.ok && item.evidence === "transcript" && item.data)) {
    if (typeof output.data === "string") {
      segments.push({ text: output.data.trim(), start: null, end: null, source_step: output.label, source_path: "$raw" });
    } else walk(output.data, output);
  }
  return segments;
}

function classify(text) {
  if (WARNING.test(text)) return "warning";
  if (PREREQUISITE.test(text)) return "prerequisite";
  if (COMMAND.test(text)) return "command";
  if (STEP_CUE.test(text) || IMPERATIVE.test(text)) return "step";
  return null;
}

function confidence(text, category) {
  let score = 0.55;
  if (STEP_CUE.test(text)) score += 0.15;
  if (IMPERATIVE.test(text)) score += 0.15;
  if (category === "warning" && WARNING.test(text)) score += 0.2;
  if (category === "prerequisite" && PREREQUISITE.test(text)) score += 0.2;
  if (category === "command" && COMMAND.test(text)) score += 0.25;
  return Math.min(0.99, Number(score.toFixed(2)));
}

export function extractInstructions(outputs, source) {
  const segments = transcriptSegments(outputs);
  const buckets = { steps: [], prerequisites: [], warnings: [], commands: [] };
  const seen = new Set();
  let candidates = 0;
  for (const segment of segments) {
    for (const sentence of splitSentences(segment.text)) {
      const category = classify(sentence);
      if (!category) continue;
      const dedupe = sentence.toLowerCase();
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      candidates += 1;
      const item = {
        text: sentence,
        category,
        confidence: confidence(sentence, category),
        start: segment.start,
        end: segment.end,
        evidence: { quote: sentence, source_step: segment.source_step, source_path: segment.source_path },
      };
      const bucket = category === "step" ? "steps" : `${category}s`;
      buckets[bucket].push(item);
    }
  }
  buckets.steps.forEach((item, index) => { item.order = index + 1; });
  return {
    schema_version: "0.1.0",
    source,
    basis: segments.length ? "transcript" : "none",
    ...buckets,
    stats: { transcript_segments: segments.length, candidates },
  };
}
