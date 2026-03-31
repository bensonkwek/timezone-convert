const timezoneLabel = document.getElementById('timezoneLabel');
const openOptionsButton = document.getElementById('openOptions');

function renderTimeZone(value) {
  if (value === 'LOCAL') {
    timezoneLabel.textContent = `Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
  } else if (value === 'UTC') {
    timezoneLabel.textContent = 'UTC';
  } else if (typeof value === 'string' && value.startsWith('GMT')) {
    timezoneLabel.textContent = `Custom offset ${value.slice(3)}`;
  } else {
    timezoneLabel.textContent = 'Local';
  }
}

chrome.storage.sync.get({ preferredTimeZone: 'LOCAL' }, (result) => {
  renderTimeZone(result.preferredTimeZone);
});

openOptionsButton.addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open('options.html');
  }
});
