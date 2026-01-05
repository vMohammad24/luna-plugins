import { ftch, LunaUnload, Tracer } from "@luna/core";
import { redux, MediaItem } from "@luna/lib";
import { languages, settings, Settings } from "./Settings";

export const { trace } = Tracer("[Translate]");
export const unloads = new Set<LunaUnload>();
export { Settings };
// thanks to meowarex
const createTranslateButton = () => {
    if (settings.alwaysTranslate) return;
    const reqFS = document.querySelector('[data-test="request-fullscreen"]');
    const parent = reqFS?.parentElement;
    if (!parent) {
        setTimeout(() => createTranslateButton(), 1000);
        return;
    }
    if (parent.querySelector(".translate-button")) return;
    const button = document.createElement("button");
    button.className = reqFS.classList.toString() + " translate-button";
    const text = "Translate Lyrics";
    button.innerText = text;
    button.setAttribute('aria-label', text);
    button.setAttribute('title', text);
    button.addEventListener('click', handleTranslate);
    parent.insertBefore(button, reqFS.nextSibling);
}

createTranslateButton();


interface GoogleData {
    src: string;
    sentences: {
        trans: string;
        orig: string;
        src_translit?: string;
    }[];
}

async function translate(text: string, targetLang: string = 'en', romanize = false): Promise<GoogleData> {
    const params = new URLSearchParams({
        client: 'gtx',
        sl: 'auto',
        tl: targetLang,
        dt: romanize ? 'rm' : 't',
        dj: '1',
        q: text
    });
    return ftch.json<GoogleData>(`https://translate.googleapis.com/translate_a/single?${params.toString()}`)
}

// Original lyrics either declared through MediaItem or null
let mediaItem = await MediaItem?.fromPlaybackContext();
let lyricsResult = await mediaItem?.lyrics();
let currentLyrics = null;
if (typeof lyricsResult !== undefined) {
    currentLyrics = lyricsResult;
}

async function processLyrics(
    lyrics: redux.Lyrics,
    targetLang: string,
): Promise<[redux.Lyrics, Map<string,string>] | null> {
    if (!lyrics) return null;

    try {
        const translatedLyricsData = await translate(lyrics.lyrics, targetLang, settings.romanize);
        const translatedLyrics = translatedLyricsData.sentences
            .map(sentence => sentence.trans)
            .join('');

        const originalLines = lyrics.lyrics.split('\n');
        const translatedLines = translatedLyrics.split('\n');
        const translationMap = new Map<string, string>();

        for (let i = 0; i < Math.min(originalLines.length, translatedLines.length); i++) {
            const original = originalLines[i].trim();
            const translated = translatedLines[i].trim();
            if (original) {
                translationMap.set(original, translated);
            }
        }

        const translatedSubtitlesText = lyrics.subtitles?.split("\n").map(subtitle => {
            const timestampMatch = subtitle.match(/^\[[\d:.]+\]\s*/);
            if (timestampMatch) {
                const timestamp = timestampMatch[0];
                const text = subtitle.substring(timestamp.length).trim();

                if (text) {
                    const translatedText = translationMap.get(text) || text;
                    return timestamp + translatedText;
                }
            }
            return subtitle;
        }).join("\n");
        
        // I am returning the map as well to make it easier to update the lyrics in the Tidal window
        return [{
            ...lyrics,
            lyrics: translatedLyrics,
            subtitles: translatedSubtitlesText,
            isRightToLeft: settings.targetLanguage ? languages.find(lang => lang.value === settings.targetLanguage)?.rightToLeft ?? false : false, 
        }, translationMap];
        } catch (error) {
            trace.msg.err('Error translating lyrics:', error);
            return null;
        }
}



async function handleTranslate() {
    // Original lyrics either declared through MediaItem or null
    let mediaItem = await MediaItem?.fromPlaybackContext();
    let lyricsResult = await mediaItem?.lyrics();
    let currentLyrics = null;
    if (typeof lyricsResult !== undefined) {
        currentLyrics = lyricsResult;
    }
    
    if (!currentLyrics) {
        trace.msg.log('No lyrics available to translate');
        return;
    }

    try {
        const result = await processLyrics(currentLyrics, settings.targetLanguage ?? 'en');
        const translatedLyrics = result![0] as redux.Lyrics;
        const map = result![1] as Map<string, string>;
        if (translatedLyrics && map) {
            // From LangRomanizer: https://github.com/Henr1ES/TidalLunaPlugins
            const lyricsSpans = document.querySelector('[class^="_lyricsText"]')
            ?.querySelector("div")
            ?.querySelectorAll("span[class]") as NodeListOf<HTMLSpanElement>;
            
            lyricsSpans.forEach(span => {
                const originalText = span.textContent?.trim();
                if (!originalText) return;
                
                const translatedText = map.get(originalText)!;

                 span.innerHTML = '';  // Full reset
                 span.appendChild(document.createTextNode(translatedText));

            });
            trace.msg.log('Lyrics translated successfully');
        } else {
            trace.msg.err('Failed to translate lyrics');
        }
    } catch (error) {
        trace.msg.err('Failed to translate:', error);
    }
}