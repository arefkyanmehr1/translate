import { SubtitleCue, PromoSettings } from '../types/subtitle';

export function parseTimestampToSeconds(timestamp: string): number {
  if (!timestamp) return 0;
  // formats: 00:01:23,456 or 00:01:23.456 or 01:23.456 or 1:23,456
  const clean = timestamp.trim().replace(',', '.');
  const parts = clean.split(':');
  
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return Math.max(0, hours * 3600 + minutes * 60 + seconds);
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return Math.max(0, minutes * 60 + seconds);
  }
  return Math.max(0, parseFloat(clean) || 0);
}

export function formatSecondsToSrtTimestamp(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  // Round to nearest millisecond to prevent floating point drift
  const totalMs = Math.round(totalSeconds * 1000);
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const s = totalS % 60;
  const totalM = Math.floor(totalS / 60);
  const m = totalM % 60;
  const h = Math.floor(totalM / 60);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

export function shiftAllTimecodes(cues: SubtitleCue[], offsetSeconds: number): SubtitleCue[] {
  return cues.map((cue) => {
    const newStart = Math.max(0, cue.startSeconds + offsetSeconds);
    const duration = Math.max(0.5, cue.endSeconds - cue.startSeconds);
    const newEnd = Math.max(newStart + 0.5, cue.endSeconds + offsetSeconds);
    return {
      ...cue,
      startSeconds: newStart,
      endSeconds: newEnd,
      startTime: formatSecondsToSrtTimestamp(newStart),
      endTime: formatSecondsToSrtTimestamp(newEnd),
    };
  });
}

export function autoFixOverlappingTimecodes(cues: SubtitleCue[]): SubtitleCue[] {
  let prevEnd = 0;
  return cues.map((cue, idx) => {
    let start = cue.startSeconds;
    let end = cue.endSeconds;

    if (idx > 0 && start < prevEnd) {
      start = prevEnd + 0.05;
    }
    if (end <= start) {
      end = start + Math.max(1.2, cue.originalText.length * 0.08);
    }
    prevEnd = end;

    return {
      ...cue,
      startSeconds: start,
      endSeconds: end,
      startTime: formatSecondsToSrtTimestamp(start),
      endTime: formatSecondsToSrtTimestamp(end),
    };
  });
}

export function parseSrtOrVtt(content: string): SubtitleCue[] {
  if (!content || !content.trim()) return [];

  // Normalize line breaks
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  const cues: SubtitleCue[] = [];
  let currentCue: Partial<SubtitleCue> | null = null;
  let textLines: string[] = [];
  let idCounter = 1;

  const timeRegex = /((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{3})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line is WebVTT header or note
    if (line.startsWith('WEBVTT') || line.startsWith('NOTE') || line.startsWith('STYLE')) {
      continue;
    }

    const match = line.match(timeRegex);
    if (match) {
      // If we had a previous cue, save it
      if (currentCue && textLines.length > 0) {
        cues.push({
          id: currentCue.id || idCounter++,
          startTime: currentCue.startTime || '00:00:00,000',
          endTime: currentCue.endTime || '00:00:02,000',
          startSeconds: currentCue.startSeconds || 0,
          endSeconds: currentCue.endSeconds || 2,
          originalText: textLines.join('\n').trim(),
        });
        textLines = [];
      }

      const rawStart = match[1];
      const rawEnd = match[2];
      const startSec = parseTimestampToSeconds(rawStart);
      const endSec = parseTimestampToSeconds(rawEnd);

      currentCue = {
        id: idCounter++,
        startTime: formatSecondsToSrtTimestamp(startSec),
        endTime: formatSecondsToSrtTimestamp(endSec),
        startSeconds: startSec,
        endSeconds: endSec,
      };
      continue;
    }

    // If it's a numeric index line right before timestamp, skip
    if (/^\d+$/.test(line) && i + 1 < lines.length && timeRegex.test(lines[i + 1])) {
      continue;
    }

    if (currentCue && line) {
      textLines.push(line);
    } else if (currentCue && !line && textLines.length > 0) {
      // Empty line marks end of cue
      cues.push({
        id: currentCue.id || idCounter++,
        startTime: currentCue.startTime || '00:00:00,000',
        endTime: currentCue.endTime || '00:00:02,000',
        startSeconds: currentCue.startSeconds || 0,
        endSeconds: currentCue.endSeconds || 2,
        originalText: textLines.join('\n').trim(),
      });
      currentCue = null;
      textLines = [];
    }
  }

  // Push remaining cue if any
  if (currentCue && textLines.length > 0) {
    cues.push({
      id: currentCue.id || idCounter++,
      startTime: currentCue.startTime || '00:00:00,000',
      endTime: currentCue.endTime || '00:00:02,000',
      startSeconds: currentCue.startSeconds || 0,
      endSeconds: currentCue.endSeconds || 2,
      originalText: textLines.join('\n').trim(),
    });
  }

  // If input was plain text without timestamps, synthesize cues
  if (cues.length === 0 && normalized.trim().length > 0) {
    const rawSentences = normalized
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    let currentTime = 0;
    rawSentences.forEach((sentence, idx) => {
      const duration = Math.max(2.5, Math.min(6, sentence.split(' ').length * 0.45));
      const startSec = currentTime;
      const endSec = currentTime + duration;
      currentTime = endSec + 0.3;

      cues.push({
        id: idx + 1,
        startTime: formatSecondsToSrtTimestamp(startSec),
        endTime: formatSecondsToSrtTimestamp(endSec),
        startSeconds: startSec,
        endSeconds: endSec,
        originalText: sentence,
      });
    });
  }

  return cues;
}

export function generateSrtContent(cues: SubtitleCue[], usePersian = true): string {
  return cues
    .map((cue, index) => {
      const text = usePersian ? (cue.persianText || cue.originalText) : cue.originalText;
      return `${index + 1}\n${cue.startTime} --> ${cue.endTime}\n${text}\n`;
    })
    .join('\n');
}

export function generateVttContent(cues: SubtitleCue[], usePersian = true): string {
  const body = cues
    .map((cue, index) => {
      const text = usePersian ? (cue.persianText || cue.originalText) : cue.originalText;
      const startVtt = cue.startTime.replace(',', '.');
      const endVtt = cue.endTime.replace(',', '.');
      return `${index + 1}\n${startVtt} --> ${endVtt}\n${text}\n`;
    })
    .join('\n');

  return `WEBVTT - Translated with StreetSub\n\n${body}`;
}

export function generateBilingualScript(cues: SubtitleCue[]): string {
  let output = `=========================================\n`;
  output += `فیلم‌نامه و زیرنویس دوزبانه (انگلیسی / فارسی خیابونی)\n`;
  output += `ترجمه شده توسط سامانه StreetSub\n`;
  output += `=========================================\n\n`;

  cues.forEach(cue => {
    output += `[${cue.startTime} --> ${cue.endTime}] (#${cue.id})\n`;
    output += `EN: ${cue.originalText}\n`;
    output += `FA: ${cue.persianText || '---'}\n`;
    if (cue.slangNote) {
      output += `اصطلاح: ${cue.slangNote}\n`;
    }
    output += `-----------------------------------------\n`;
  });

  return output;
}

export function downloadFile(content: string, filename: string, isPersianSrt = false) {
  // UTF-8 BOM (\uFEFF) ensures Persian text displays perfectly in VLC, KMPlayer, PotPlayer and Notepad
  const bom = isPersianSrt ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Smart Watermark / Promo insertion in dialogue gaps and at start
export function insertSmartPromoWatermarks(
  cues: SubtitleCue[],
  promo: PromoSettings
): { updatedCues: SubtitleCue[]; insertedCount: number } {
  if (!promo.text || !promo.text.trim() || cues.length === 0) {
    return { updatedCues: cues, insertedCount: 0 };
  }

  // Remove previously inserted promos if any
  const cleanCues = cues.filter((c) => !c.isPromo).sort((a, b) => a.startSeconds - b.startSeconds);
  if (cleanCues.length === 0) return { updatedCues: cues, insertedCount: 0 };

  const duration = Math.max(2.0, Math.min(6.0, promo.durationSeconds || 3.5));
  const minGap = Math.max(duration + 0.6, promo.minGapSeconds || 3.0);
  const inserted: SubtitleCue[] = [];

  // 1. Insert at start of the movie if requested
  if (promo.insertAtStart) {
    const firstCue = cleanCues[0];
    if (firstCue.startSeconds >= duration + 0.5) {
      // Free space before first dialogue
      const startSec = Math.max(0.5, firstCue.startSeconds - duration - 0.5);
      const endSec = startSec + duration;
      inserted.push({
        id: 0,
        startTime: formatSecondsToSrtTimestamp(startSec),
        endTime: formatSecondsToSrtTimestamp(endSec),
        startSeconds: startSec,
        endSeconds: endSec,
        originalText: `[Credit: ${promo.text}]`,
        persianText: promo.text,
        isPromo: true,
      });
    } else {
      // First cue starts early; find first available gap
      let placed = false;
      for (let i = 0; i < Math.min(cleanCues.length - 1, 10); i++) {
        const gap = cleanCues[i + 1].startSeconds - cleanCues[i].endSeconds;
        if (gap >= minGap) {
          const startSec = cleanCues[i].endSeconds + (gap - duration) / 2;
          const endSec = startSec + duration;
          inserted.push({
            id: 0,
            startTime: formatSecondsToSrtTimestamp(startSec),
            endTime: formatSecondsToSrtTimestamp(endSec),
            startSeconds: startSec,
            endSeconds: endSec,
            originalText: `[Credit: ${promo.text}]`,
            persianText: promo.text,
            isPromo: true,
          });
          placed = true;
          break;
        }
      }
      if (!placed && cleanCues.length > 0) {
        const startSec = cleanCues[0].endSeconds + 0.3;
        const endSec = startSec + duration;
        inserted.push({
          id: 0,
          startTime: formatSecondsToSrtTimestamp(startSec),
          endTime: formatSecondsToSrtTimestamp(endSec),
          startSeconds: startSec,
          endSeconds: endSec,
          originalText: `[Credit: ${promo.text}]`,
          persianText: promo.text,
          isPromo: true,
        });
      }
    }
  }

  // 2. Distributed repetition throughout the movie (default 5 times)
  const repeatCount = Math.max(0, Math.min(20, promo.repeatCount || 5));
  if (repeatCount > 0 && cleanCues.length > 2) {
    const movieStart = cleanCues[0].startSeconds;
    const movieEnd = cleanCues[cleanCues.length - 1].endSeconds;
    const totalSpan = Math.max(1, movieEnd - movieStart);
    const segmentDuration = totalSpan / (repeatCount + 1);

    for (let seg = 1; seg <= repeatCount; seg++) {
      const targetTime = movieStart + seg * segmentDuration;
      let bestGapIdx = -1;
      let maxGapSize = 0;
      let closestDistance = Infinity;

      for (let i = 0; i < cleanCues.length - 1; i++) {
        const gap = cleanCues[i + 1].startSeconds - cleanCues[i].endSeconds;
        const midGap = cleanCues[i].endSeconds + gap / 2;
        const dist = Math.abs(midGap - targetTime);

        // Check if there is collision with already inserted promos
        const hasCollision = inserted.some(
          (p) => Math.abs(p.startSeconds - midGap) < duration + 5
        );
        if (hasCollision) continue;

        if (gap >= minGap) {
          if (dist < closestDistance) {
            closestDistance = dist;
            bestGapIdx = i;
            maxGapSize = gap;
          }
        } else if (gap > maxGapSize && closestDistance === Infinity) {
          maxGapSize = gap;
          bestGapIdx = i;
        }
      }

      if (bestGapIdx !== -1) {
        const c1 = cleanCues[bestGapIdx];
        const c2 = cleanCues[bestGapIdx + 1];
        const gap = c2.startSeconds - c1.endSeconds;

        let startSec: number;
        let endSec: number;

        if (gap >= duration + 0.4) {
          startSec = c1.endSeconds + (gap - duration) / 2;
          endSec = startSec + duration;
        } else {
          startSec = c1.endSeconds + 0.15;
          endSec = startSec + Math.max(1.8, gap - 0.3);
        }

        inserted.push({
          id: 0,
          startTime: formatSecondsToSrtTimestamp(startSec),
          endTime: formatSecondsToSrtTimestamp(endSec),
          startSeconds: startSec,
          endSeconds: endSec,
          originalText: `[Watermark: ${promo.text}]`,
          persianText: promo.text,
          isPromo: true,
        });
      }
    }
  }

  // Combine, sort chronologically, and re-number IDs
  const combined = [...cleanCues, ...inserted].sort((a, b) => a.startSeconds - b.startSeconds);
  const reindexed = combined.map((c, idx) => ({ ...c, id: idx + 1 }));

  return { updatedCues: reindexed, insertedCount: inserted.length };
}

// Smart Persian Punctuation & Continuation Ellipses Polisher
export function polishPunctuationAndEllipses(cues: SubtitleCue[]): SubtitleCue[] {
  const continuationWords = [
    'که', 'و', 'اما', 'ولی', 'چون', 'اگه', 'اگر', 'یا', 'تا',
    'برای', 'واسه', 'به', 'در', 'رو', 'با', 'هم', 'حتی', 'بعد',
    'چونکه', 'هرچند', 'گرچه', 'مگر', 'مگه', 'پس', 'شاید', 'یعنی'
  ];

  return cues.map((cue, index) => {
    let fa = (cue.persianText || '').trim();
    if (!fa) return cue;

    // 1. Standardize Persian punctuation symbols
    fa = fa
      .replace(/\?/g, '؟')
      .replace(/;/g, '؛')
      .replace(/,/g, '،')
      // remove multiple spaces before punctuation
      .replace(/\s+([؟!\.،؛])/g, '$1')
      // normalize multiple exclamation or question marks
      .replace(/!{2,}/g, '!')
      .replace(/؟{2,}/g, '؟')
      // standardize 3-dots: .... or .. -> ...
      .replace(/\.{2,}/g, '...');

    // 2. Smart Continuation Ellipsis Detection
    const nextCue = cues[index + 1];
    const endsWithTerminal = /[؟!\.]$/.test(fa);
    const endsWithEllipsis = fa.endsWith('...');

    // Check if the current line ends with a continuation word
    const words = fa.split(/\s+/);
    const lastWord = words[words.length - 1].replace(/[،؛]/g, '');
    const isContinuationWord = continuationWords.includes(lastWord);

    // If next cue is very close (< 2.5s) and current cue does not end with terminal punctuation
    const nextIsClose = nextCue && (nextCue.startSeconds - cue.endSeconds < 2.5);

    if (!endsWithEllipsis) {
      if (isContinuationWord) {
        fa = fa.replace(/[،؛]?$/, '') + '...';
      } else if (!endsWithTerminal && nextIsClose && words.length < 8) {
        fa = fa + '...';
      }
    }

    return {
      ...cue,
      persianText: fa,
      isEdited: cue.isEdited || fa !== cue.persianText,
    };
  });
}

/**
 * پاکسازی کامل صداهای فیلم، سرفه، افکت‌های صوتی و زیرنویس‌های ناشنوایان (SDH Cleaner)
 * حذف عباراتی مانند: [coughing], (music playing), [صدای سرفه کردن], [صدای آهنگ پس‌زمینه], ♪ و غیره.
 */
export function stripAudioDescriptionsAndSdh(cues: SubtitleCue[]): {
  cleanedCues: SubtitleCue[];
  removedCount: number;
} {
  let removedCount = 0;

  // Regex patterns for audio descriptions
  const bracketRegex = /\[[^\]]*\]/g;
  const parenSoundRegex = /\([^\)]*(?:cough|clears throat|music|screaming|screams|gunshot|gunfire|laughter|laughs|chuckles|gasp|sighs|applause|whisper|revs|door|tires|footsteps|groans|crying|sobbing|cheering|thunder|phone rings|سرفه|آهنگ|موزیک|موسیقی|شلیک|جیغ|گریه|خنده|در زدن|همهمه|تشویق)[^\)]*\)/gi;
  const musicNotesRegex = /[♪♫#♩]+.*?([♪♫#♩]+|$)|[♪♫#♩]+/g;
  const persianSoundPhrasesRegex = /(?:^|\n|\s)(?:صدای\s+(?:سرفه(?:\s*کردن)?|آهنگ(?:\s+پس‌?زمینه)?|موزیک(?:\s+پس‌?زمینه)?|موسیقی(?:\s+پس‌?زمینه)?|شلیک(?:\s+تفنگ)?|جیغ|گریه|خنده|نفس(?:\s*نفس)?|پا|در|باد|ماشین|بوق|آژیر|انفجار|همهمه|تشویق|دست‌زدن)|آهنگ\s+پس‌?زمینه|موزیک\s+پس‌?زمینه|صدای\s+پس‌?زمینه)(?:[.:،؛!؟]|\s|$)/gi;

  const cleanText = (text: string | undefined): { cleaned: string; wasModified: boolean } => {
    if (!text) return { cleaned: '', wasModified: false };
    const original = text;
    let res = text
      .replace(bracketRegex, '')
      .replace(parenSoundRegex, '')
      .replace(musicNotesRegex, '')
      .replace(persianSoundPhrasesRegex, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return {
      cleaned: res,
      wasModified: res !== original,
    };
  };

  const cleanedCues = cues.map((cue) => {
    const origClean = cleanText(cue.originalText);
    const persClean = cleanText(cue.persianText);

    if (origClean.wasModified || persClean.wasModified) {
      removedCount++;
    }

    return {
      ...cue,
      originalText: origClean.cleaned || cue.originalText,
      persianText: cue.persianText ? persClean.cleaned : undefined,
      isEdited: cue.isEdited || persClean.wasModified,
    };
  });

  return { cleanedCues, removedCount };
}

// -----------------------------------------------------------------------------
// Netflix-Grade Subtitle Segmentation & Formatting Engine
// -----------------------------------------------------------------------------

/**
 * Splits Persian text into at most 2 lines, respecting the ~42 characters limit
 * and syntactic grammatical boundaries (avoiding breaks between صفت و موصوف، مضاف و مضاف‌الیه، etc.)
 */
export function formatNetflixTwoLines(text: string): string {
  if (!text) return '';
  const clean = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // If already multi-line, clean up and ensure max 2 lines
  if (clean.includes('\n')) {
    const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 2) {
      return lines.join('\n');
    }
    // If more than 2 lines, re-join and intelligently re-break
    return formatNetflixTwoLines(lines.join(' '));
  }

  // Netflix rule: "Prefer 1 line whenever the complete subtitle can fit naturally (~42 chars)"
  if (clean.length <= 42) {
    return clean;
  }

  const words = clean.split(/\s+/);
  if (words.length <= 2) return clean;

  const totalLen = clean.length;
  const targetHalf = totalLen / 2;

  // Find the best split point close to center that doesn't violate Persian grammar
  const avoidBreakAfter = [
    'و', 'یا', 'که', 'به', 'در', 'با', 'از', 'برای', 'واسه', 'تا',
    'این', 'آن', 'همان', 'یک', 'دو', 'سه', 'چهار', 'پنج',
    'خیلی', 'بسیار', 'کاملاً', 'اصلاً', 'هنوز', 'شاید'
  ];

  let bestIndex = -1;
  let minDiff = Infinity;
  let currentLen = 0;

  for (let i = 0; i < words.length - 1; i++) {
    currentLen += words[i].length + 1;
    const diff = Math.abs(currentLen - targetHalf);

    // Check if line 1 or line 2 exceeds 48 chars
    const line1Len = currentLen;
    const line2Len = totalLen - currentLen;
    if (line1Len > 48 || line2Len > 48) continue;

    // Grammatical check: penalize breaks after prepositions/conjunctions
    const word = words[i].replace(/[،؛]/g, '');
    const penalty = avoidBreakAfter.includes(word) ? 15 : 0;

    if (diff + penalty < minDiff) {
      minDiff = diff + penalty;
      bestIndex = i;
    }
  }

  if (bestIndex === -1) {
    // Fallback: split closest to target half
    let acc = 0;
    for (let i = 0; i < words.length - 1; i++) {
      acc += words[i].length + 1;
      if (acc >= targetHalf) {
        bestIndex = i;
        break;
      }
    }
  }

  if (bestIndex !== -1 && bestIndex < words.length - 1) {
    const line1 = words.slice(0, bestIndex + 1).join(' ');
    const line2 = words.slice(bestIndex + 1).join(' ');
    return `${line1}\n${line2}`;
  }

  return clean;
}

/**
 * Re-segments raw, word-by-word ASR / ACP speech fragments into professional
 * Netflix-compliant semantic subtitle events (duration between 1.0s and 7.0s,
 * combined characters <= 84, natural sentence closure).
 */
export function netflixSegmentAndMerge(cues: SubtitleCue[]): SubtitleCue[] {
  if (cues.length <= 1) return cues;

  const result: SubtitleCue[] = [];
  let current: SubtitleCue = { ...cues[0] };

  const terminalRegex = /[؟!\.]$/;

  for (let i = 1; i < cues.length; i++) {
    const next = cues[i];
    const gap = next.startSeconds - current.endSeconds;

    // Conditions to merge:
    // 1. Gap is small (< 0.85s)
    // 2. Current cue doesn't end with a terminal sentence mark (. ? !)
    // 3. Combined duration <= 6.5s (Netflix maximum duration is 7.0s)
    // 4. Combined original length <= 90 characters
    // 5. Neither is a promo watermark
    const currentText = (current.persianText || current.originalText).trim();
    const nextText = (next.persianText || next.originalText).trim();
    const combinedDuration = next.endSeconds - current.startSeconds;
    const combinedLength = currentText.length + nextText.length + 1;

    const canMerge =
      !current.isPromo &&
      !next.isPromo &&
      gap >= 0 &&
      gap < 0.85 &&
      !terminalRegex.test(currentText) &&
      combinedDuration <= 6.5 &&
      combinedLength <= 85;

    if (canMerge) {
      // Merge next into current
      current.endSeconds = next.endSeconds;
      current.endTime = next.endTime;
      current.originalText = `${current.originalText} ${next.originalText}`.trim();
      if (current.persianText || next.persianText) {
        current.persianText = `${current.persianText || ''} ${next.persianText || ''}`.trim();
      }
      current.isEdited = true;
    } else {
      result.push(current);
      current = { ...next };
    }
  }

  result.push(current);

  // Post-process: Format lines adhering to Netflix 2-line & 42-char limit
  return result.map((cue, idx) => {
    let fa = cue.persianText;
    if (fa) {
      fa = formatNetflixTwoLines(fa);
    }
    return {
      ...cue,
      id: idx + 1,
      persianText: fa,
    };
  });
}

