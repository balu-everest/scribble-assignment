import { useState } from "react";
import { useRoomStore } from "../state/roomStore";

interface GuessFormProps {
  disabled?: boolean;
}

export function GuessForm({ disabled = false }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const roomStore = useRoomStore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = guessText.trim();

    if (trimmed.length === 0) {
      setError("Guess cannot be empty");
      return;
    }

    try {
      await roomStore.submitGuess(trimmed);
      setGuessText("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit guess. Please try again.";
      setError(message);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => setGuessText(event.target.value)}
          placeholder="Type your guess here..."
          disabled={disabled}
        />
      </label>
      {error && (
        <p style={{ color: "var(--red, #dc2626)", fontSize: "0.875rem", marginTop: "4px" }}>
          {error}
        </p>
      )}
      <div className="button-row button-row--compact">
        <button className="button button--primary" type="submit" disabled={disabled}>
          Submit Guess
        </button>
      </div>
    </form>
  );
}
