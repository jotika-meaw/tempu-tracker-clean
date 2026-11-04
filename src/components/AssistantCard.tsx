import { useEffect, useRef, useState, type FormEvent } from "react";
import { askAssistant, transcribeAudio } from "../api/client";
import type { AiLanguage } from "../api/types";
import { t, type UiLanguage } from "../i18n";
import { describeApiError } from "../lib/errors";
import {
  startVoiceRecording,
  voiceInputSupported,
  type VoiceRecording,
} from "../lib/recorder";
import { Banner } from "./Banner";

type AssistantCardProps = {
  language: UiLanguage;
  aiConfigured: boolean | null;
};

const samples: Array<{ key: "assistantSample1" | "assistantSample2" | "assistantSample3" }> = [
  { key: "assistantSample1" },
  { key: "assistantSample2" },
  { key: "assistantSample3" },
];

type VoiceState = "idle" | "recording" | "transcribing" | "done";

export function AssistantCard({ language, aiConfigured }: AssistantCardProps) {
  const [message, setMessage] = useState("");
  const [answerLanguage, setAnswerLanguage] = useState<AiLanguage>(language);
  const [answer, setAnswer] = useState("");
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionError, setQuestionError] = useState(false);
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [voiceError, setVoiceError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const recordingRef = useRef<VoiceRecording | null>(null);

  const aiDisabled = aiConfigured === false;
  const voiceSupported = voiceInputSupported();

  // Follow the page language; the user can still pick another answer language.
  const [lastPageLanguage, setLastPageLanguage] = useState(language);
  if (lastPageLanguage !== language) {
    setLastPageLanguage(language);
    setAnswerLanguage(language);
  }

  useEffect(() => () => recordingRef.current?.cancel(), []);

  async function stopVoice() {
    const recording = recordingRef.current;
    if (!recording) return;
    recordingRef.current = null;
    setVoiceState("transcribing");

    try {
      const pcm = await recording.stop();
      const result = await transcribeAudio(pcm, answerLanguage);
      setMessage(result.transcript);
      setQuestionError(false);
      setVoiceState("done");
      inputRef.current?.focus();
    } catch (voiceFailure) {
      setVoiceError(describeApiError(voiceFailure, language));
      setVoiceState("idle");
    }
  }

  async function toggleVoice() {
    if (voiceState === "recording") {
      await stopVoice();
      return;
    }

    setVoiceError("");
    try {
      recordingRef.current = await startVoiceRecording(() => void stopVoice());
      setVoiceState("recording");
    } catch {
      setVoiceError(t(language, "assistantVoiceDenied"));
      setVoiceState("idle");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();

    if (!trimmed) {
      setQuestionError(true);
      setAnswer("");
      setError("");
      return;
    }

    setQuestionError(false);
    setError("");
    setAnswer("");
    setModel("");
    setToolCalls([]);
    setLoading(true);

    try {
      const result = await askAssistant(trimmed, answerLanguage);
      setAnswer(result.answer);
      setModel(result.model);
      setToolCalls(result.toolCalls ?? []);
    } catch (requestError) {
      setError(describeApiError(requestError, language));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card assistant-card" aria-labelledby="assistant-title">
      <div className="assistant-top">
        <div className="assistant-symbol" aria-hidden="true">
          ✳
        </div>
        <span className="badge badge-ai">Meta AI</span>
      </div>

      <h2 id="assistant-title">{t(language, "assistantTitle")}</h2>
      <p className="assistant-description">{t(language, "assistantSubtitle")}</p>

      {aiDisabled ? (
        <Banner tone="warning" title={t(language, "assistantOffTitle")}>
          {t(language, "assistantOffBody")}
        </Banner>
      ) : null}

      <div className="assistant-language">
        <label htmlFor="assistant-language">{t(language, "assistantLanguage")}</label>
        <select
          id="assistant-language"
          value={answerLanguage}
          onChange={(event) => setAnswerLanguage(event.target.value as AiLanguage)}
        >
          <option value="bn">{t(language, "assistantBn")}</option>
          <option value="en">{t(language, "assistantEn")}</option>
          <option value="ctg">{t(language, "assistantCtg")}</option>
        </select>
      </div>

      {answerLanguage === "ctg" ? (
        <p className="field-note">{t(language, "assistantCtgNote")}</p>
      ) : null}

      <form className="assistant-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="assistant-question">
          {t(language, "assistantPlaceholder")}
        </label>
        <textarea
          id="assistant-question"
          ref={inputRef}
          rows={3}
          maxLength={1000}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setQuestionError(false);
          }}
          placeholder={t(language, "assistantPlaceholder")}
        />
        <div className="assistant-form-footer">
          {voiceSupported ? (
            <button
              className={`button button-secondary button-small voice-button${
                voiceState === "recording" ? " voice-button-recording" : ""
              }`}
              type="button"
              onClick={() => void toggleVoice()}
              disabled={aiDisabled || loading || voiceState === "transcribing"}
              aria-pressed={voiceState === "recording"}
            >
              <span aria-hidden="true">{voiceState === "recording" ? "■" : "🎙"}</span>{" "}
              {voiceState === "recording"
                ? t(language, "assistantVoiceStop")
                : t(language, "assistantVoiceStart")}
            </button>
          ) : null}
          <span className="character-count">{message.length}/1000</span>
          <button
            className="button button-primary"
            type="submit"
            disabled={loading || aiDisabled}
          >
            {loading ? t(language, "assistantSending") : t(language, "assistantSend")}
            {!loading ? <span aria-hidden="true">↑</span> : null}
          </button>
        </div>
      </form>

      {voiceState !== "idle" || voiceError ? (
        <p
          className={`field-note${voiceError ? " voice-error" : ""}`}
          role={voiceError ? "alert" : "status"}
        >
          {voiceError ||
            (voiceState === "recording"
              ? t(language, "assistantVoiceRecording")
              : voiceState === "transcribing"
                ? t(language, "assistantVoiceTranscribing")
                : t(language, "assistantVoiceDone"))}
        </p>
      ) : null}

      {questionError ? (
        <div className="inline-notice inline-notice-warning" role="alert">
          {t(language, "assistantQuestionRequired")}
        </div>
      ) : null}

      <div className="sample-questions">
        <span className="suggestion-label">{t(language, "assistantSampleLabel")}</span>
        <div className="sample-question-list">
          {samples.map((sample) => (
            <button
              key={sample.key}
              type="button"
              className="sample-question"
              onClick={() => {
                setMessage(t(language, sample.key));
                setQuestionError(false);
                inputRef.current?.focus();
              }}
            >
              {t(language, sample.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="assistant-answer" aria-live="polite">
        {loading ? (
          <p className="assistant-placeholder">{t(language, "assistantSending")}</p>
        ) : answer ? (
          <>
            <h3>{t(language, "assistantAnswerLabel")}</h3>
            <p className="assistant-answer-text">{answer}</p>
            {toolCalls.length > 0 ? (
              <p className="assistant-model">
                {t(language, "assistantToolsUsed", {
                  tools: [...new Set(toolCalls)].join(", "),
                })}
              </p>
            ) : null}
            {model ? (
              <p className="assistant-model">
                {t(language, "assistantModel", { model })}
              </p>
            ) : null}
          </>
        ) : (
          <div className="assistant-empty">
            <strong>{t(language, "assistantEmptyTitle")}</strong>
            <p>{t(language, "assistantEmptyBody")}</p>
          </div>
        )}
      </div>

      {error ? (
        <Banner tone="danger" title={t(language, "assistantErrorTitle")}>
          {error}
        </Banner>
      ) : null}

      <p className="assistant-footnote">{t(language, "assistantDisclaimer")}</p>
      <p className="assistant-footnote">{t(language, "assistantLiveNote")}</p>
      {voiceSupported ? (
        <p className="assistant-footnote">{t(language, "assistantVoicePrivacy")}</p>
      ) : null}
    </section>
  );
}
