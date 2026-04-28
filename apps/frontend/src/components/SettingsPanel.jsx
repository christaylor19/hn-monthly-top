import { createSignal } from 'solid-js';
import { verbosity, updateVerbosity, VERBOSITY_LEVELS } from '../store/settings';

export default function SettingsPanel() {
  const [open, setOpen] = createSignal(false);

  const currentIndex = () => VERBOSITY_LEVELS.findIndex((l) => l.value === verbosity().value);

  function handleSlider(e) {
    updateVerbosity(VERBOSITY_LEVELS[parseInt(e.target.value)].value);
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
        </div>
      )}
    </div>
  );
}
