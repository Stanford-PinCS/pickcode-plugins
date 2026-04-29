/**
 * NOTE: THIS FILE IS DEPRECATED.
 * It is highly likely that this file is out of date and does not contain
 * full functionality. If you wish to use/edit this file, you should confirm
 * with @pseay or @tmaster628 before starting your work.
 */
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { JSRuntime } from "./JSRuntime";
import { PyRuntime } from "./PyRuntime";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

type SandboxLanguage = "BasicJS" | "Python";
type SandboxRuntime = JSRuntime | PyRuntime;
type PluginsManifest = Record<string, Record<string, { implUrl: string }>>;

async function loadImplementationCode(
  name: string,
  language: SandboxLanguage
): Promise<string> {
  const url = `/plugins-code/${name}/languages/${language}/implementation.js`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.statusText}`);
  return res.text();
}

async function loadStarterCode(
  name: string,
  language: SandboxLanguage
): Promise<string | undefined> {
  const extension = language === "Python" ? "py" : "js";
  const url = `/plugins-code/${name}/languages/${language}/starter-code/main.${extension}`;
  const res = await fetch(url);
  if (!res.ok) return undefined;
  const text = await res.text();
  // Vite dev server can return index.html for missing static files.
  if (text.trimStart().startsWith("<!DOCTYPE html>")) return undefined;
  return text;
}

async function loadLanguages(name: string): Promise<SandboxLanguage[]> {
  const res = await fetch("/plugins-manifest.json");
  if (!res.ok) return ["BasicJS"];
  const manifest = (await res.json()) as PluginsManifest;
  const pluginEntry = manifest[name];
  if (!pluginEntry) return ["BasicJS"];
  const languages = Object.keys(pluginEntry).filter(
    (lang): lang is SandboxLanguage => lang === "BasicJS" || lang === "Python"
  );
  return languages.length > 0 ? languages : ["BasicJS"];
}

export const Sandbox = () => {
  const { pluginName } = useParams();
  const runtimeRef = useRef<SandboxRuntime | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<SandboxLanguage[]>([
    "BasicJS",
  ]);
  const [language, setLanguage] = useState<SandboxLanguage>("BasicJS");
  const [implementation, setImplementation] = useState<string | undefined>(
    undefined
  );
  const [codeText, setCodeText] = useState("");

  useEffect(() => {
    const savedCode = localStorage.getItem(`codeText:${language}`);
    if (savedCode) {
      setCodeText(savedCode);
    } else {
      setCodeText("");
    }
  }, [language]);

  useEffect(() => {
    if (!pluginName) return;
    loadLanguages(pluginName).then((languages) => {
      setAvailableLanguages(languages);
      if (!languages.includes(language)) {
        setLanguage(languages[0]);
      }
    });
  }, [pluginName, language]);

  useEffect(() => {
    if (!pluginName) return;
    loadImplementationCode(pluginName, language).then((c) => {
      setImplementation(c);
    }).catch(() => {
      setImplementation(undefined);
    });
    loadStarterCode(pluginName, language).then((starter) => {
      if (!starter) return;
      setCodeText(starter);
      localStorage.setItem(`codeText:${language}`, starter);
    });
  }, [pluginName, language]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    runtimeRef.current =
      language === "Python"
        ? new PyRuntime((message) => {
            iframe.contentWindow?.postMessage(message, "*");
          })
        : new JSRuntime((message) => {
            iframe.contentWindow?.postMessage(message, "*");
          });
    return () => {
      runtimeRef.current = null;
    };
  }, [language]);

  return (
    <div className="flex flex-row w-full h-full">
      <div className="flex flex-col grow">
        {availableLanguages.length > 1 && (
          <div className="flex gap-2 px-2 pt-2">
            {availableLanguages.includes("BasicJS") && (
              <button
                className={`px-3 py-1 rounded border ${language === "BasicJS" ? "bg-slate-200" : "bg-white"}`}
                onClick={() => setLanguage("BasicJS")}
              >
                JavaScript
              </button>
            )}
            {availableLanguages.includes("Python") && (
              <button
                className={`px-3 py-1 rounded border ${language === "Python" ? "bg-slate-200" : "bg-white"}`}
                onClick={() => setLanguage("Python")}
              >
                Python
              </button>
            )}
          </div>
        )}
        <CodeMirror
          value={codeText}
          className="h-full grow m-2 b-2 border border-slate-500 rounded-lg overflow-hidden"
          height="100%"
          extensions={language === "BasicJS" ? [javascript()] : []}
          onChange={(value) => {
            setCodeText(value);
            localStorage.setItem(`codeText:${language}`, value);
          }}
        />
      </div>
      <div className="flex m-2 b-2 flex-col grow">
        <iframe
          ref={iframeRef}
          className="flex grow border border-slate-500 rounded-lg"
          src={`/embed/${pluginName}`}
        />
      </div>
      <div
        className="absolute cursor-pointer right-5 bottom-5 bg-green-500 text-green-50 px-4 py-2 rounded-lg and-i-need-it-now hover:ring-2 hover:ring-green-800"
        onClick={() => {
          runtimeRef.current?.startExecution(codeText, implementation ?? "");
        }}
      >
        Play
      </div>
    </div>
  );
};
