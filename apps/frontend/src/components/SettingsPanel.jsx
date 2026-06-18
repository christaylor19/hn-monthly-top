import { createSignal, createEffect, Show } from 'solid-js';
import { verbosity, updateVerbosity, VERBOSITY_LEVELS } from '../store/settings';
import { session, isConfigured } from '../store/auth';
import { getKeyStatus, saveKey, deleteKey } from '../api/keys';

export default function SettingsPanel() {
  const [open, setOpen] = createSignal(false);

  // API key state
  const [keyStatus, setKeyStatus] = createSignal(null); // { hasKey, lastFour }
  const [keyInput, setKeyInput] = createSignal('');
  const [keyBusy, setKeyBusy] = createSignal(false);
  const [keyError, setKeyError] = createSignal(null);

  const currentIndex = () => VERBOSITY_LEVELS.findIndex((l) => l.value === verbosity().value);

  function handleSlider(e) {
    updateVerbosity(VERBOSITY_LEVELS[parseInt(e.target.value)].value);
  }

  // Load key status whenever a logged-in user opens the panel.
  createEffect(() => {
    if (open() && session()) {
      getKeyStatus()
        .then(setKeyStatus)
        .catch((e) => setKeyError(e.message));
    }
  });

  async function handleSaveKey(e) {
    e.preventDefault();
    setKeyError(null);
    setKeyBusy(true);
    try {
      const status = await saveKey(keyInput());
      setKeyStatus(status);
      setKeyInput(''); // never keep the plaintext key around
    } catch (err) {
      setKeyError(err.message);
    } finally {
      setKeyBusy(false);
    }
  }

  async function handleRemoveKey() {
    setKeyError(null);
    setKeyBusy(true);
    try {
      const status = await deleteKey();
      setKeyStatus(status);
    } catch (err) {
      setKeyError(err.message);
    } finally {
      setKeyBusy(false);
    }
  }

  return (
    <div class="settings-wrap">
      <button
        class={`settings-cog${open() ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title="Settings"
      >
        ⚙
      </button>
      {open() && (
        <div class="settings-panel">
          <div class="settings-row">
            <span class="settings-label">Verbosity</span>
            <div class="settings-slider-wrap">
              <input
                type="range"
                min="0"
                max={VERBOSITY_LEVELS.length - 1}
                step="1"
                value={currentIndex()}
                onInput={handleSlider}
                class="settings-slider"
              />
              <div class="settings-slider-labels">
                {VERBOSITY_LEVELS.map((l) => (
                  <span class={l.value === verbosity().value ? 'active' : ''}>{l.label}</span>
                ))}
              </div>
            </div>
          </div>

          <Show when={isConfigured()}>
            <div class="settings-row">
              <span class="settings-label">OpenAI API key</span>
              <Show
                when={session()}
                fallback={<div class="settings-hint">Log in to add your key.</div>}
              >
                <Show when={keyStatus()?.hasKey}>
                  <div class="settings-key-current">
                    Saved: <code>sk-…{keyStatus().lastFour}</code>
                    <button class="settings-key-remove" onClick={handleRemoveKey} disabled={keyBusy()}>
                      remove
                    </button>
                  </div>
                </Show>
                <form onSubmit={handleSaveKey} class="settings-key-form">
                  <input
                    type="password"
                    placeholder={keyStatus()?.hasKey ? 'Replace key…' : 'sk-…'}
                    value={keyInput()}
                    onInput={(e) => setKeyInput(e.target.value)}
                    class="settings-key-input"
                    autocomplete="off"
                  />
                  <button type="submit" class="settings-key-save" disabled={keyBusy() || !keyInput()}>
                    {keyBusy() ? '…' : 'Save'}
                  </button>
                </form>
                <Show when={keyError()}>
                  <div class="settings-key-error">{keyError()}</div>
                </Show>
                <div class="settings-hint">
                  Your key is encrypted and stored server-side. It's never shown again after saving.
                </div>
              </Show>
            </div>
          </Show>
        </div>
      )}
    </div>
  );
}
