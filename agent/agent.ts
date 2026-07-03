import { defineAgent } from "eve";
import { minimax } from "vercel-minimax-ai-provider";

/**
 * Provider natif MiniMax (Anthropic-compatible par défaut).
 * Reads MINIMAX_API_KEY from env automatically; apiKey peut aussi être passé
 * explicitement à `minimax({ apiKey, baseURL, ... })`.
 *
 * Modèles disponibles : `MiniMax-M3` (1M contexte, défaut), `MiniMax-M2.1`,
 * `MiniMax-M2.1-lightning`, `MiniMax-M2`, et tout identifiant custom conforme
 * à l'API MiniMax.
 *
 * Pour le mode OpenAI-compatible, importer plutôt `minimaxOpenAI` depuis le même
 * package (utile si l'endpoint MiniMax exposé est /v1).
 */

const modelId = process.env.MINIMAX_MODEL_ID ?? "MiniMax-M3";

const contextWindow = (() => {
  const raw = process.env.MINIMAX_MODEL_CONTEXT_WINDOW;
  if (!raw) return 1_000_000;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      "MINIMAX_MODEL_CONTEXT_WINDOW doit être un entier positif.",
    );
  }
  return parsed;
})();

export default defineAgent({
  model: minimax(modelId),
  modelContextWindowTokens: contextWindow,
});
