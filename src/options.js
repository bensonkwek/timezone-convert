const timezoneModeInputs = document.querySelectorAll('input[name="timezoneMode"]');
const offsetInput = document.getElementById('offsetInput');
const localTimezoneLabel = document.getElementById('localTimezoneLabel');
const saveButton = document.getElementById('saveButton');

function normalizeOffset(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return null;
  const sign = match[1];
  const hour = Number(match[2]);
  const minute = match[3] ? Number(match[3]) : 0;
  if (hour > 14 || minute > 59) return null;
  return `${sign}${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getSelectedMode() {
  const selected = document.querySelector('input[name="timezoneMode"]:checked');
  return selected ? selected.value : 'LOCAL';
}

function updateModeState() {
  const mode = getSelectedMode();
  offsetInput.disabled = mode !== 'CUSTOM';
  if (mode !== 'CUSTOM') {
    offsetInput.classList.remove('invalid');
  }
}

function loadSavedTimezone() {
  const defaultValue = 'LOCAL';
  chrome.storage.sync.get({ preferredTimeZone: defaultValue }, (result) => {
    const saved = result.preferredTimeZone;
    if (saved === 'UTC') {
      document.querySelector('input[value="UTC"]').checked = true;
    } else if (saved === 'LOCAL') {
      document.querySelector('input[value="LOCAL"]').checked = true;
    } else if (typeof saved === 'string' && saved.startsWith('GMT')) {
      document.querySelector('input[value="CUSTOM"]').checked = true;
      offsetInput.value = saved.slice(3);
    } else {
      document.querySelector('input[value="LOCAL"]').checked = true;
    }
    updateModeState();
  });
}

function saveTimezone() {
  const mode = getSelectedMode();
  let value = 'LOCAL';
  if (mode === 'UTC') {
    value = 'UTC';
  } else if (mode === 'CUSTOM') {
    const normalized = normalizeOffset(offsetInput.value);
    if (!normalized) {
      offsetInput.focus();
      return;
    }
    value = `GMT${normalized}`;
  }

  chrome.storage.sync.set({ preferredTimeZone: value }, () => {
    saveButton.textContent = 'Saved ✓';
    setTimeout(() => (saveButton.textContent = 'Save timezone'), 1200);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  localTimezoneLabel.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  timezoneModeInputs.forEach((input) => input.addEventListener('change', updateModeState));
  loadSavedTimezone();
});

saveButton.addEventListener('click', saveTimezone);
