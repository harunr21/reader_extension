document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-hide-mode');
  const toggleText = document.getElementById('toggle-text');
  const restoreBtn = document.getElementById('restore-elements');
  const statusIndicator = document.querySelector('.status-indicator');
  const statusHint = document.getElementById('status-hint');
  const themeBtns = document.querySelectorAll('.theme-btn');
  const extensionToggle = document.getElementById('extension-toggle');
  const mainContent = document.getElementById('main-content');
  const disabledMessage = document.getElementById('disabled-message');

  // Check current hide mode state, theme and global extension state from background/storage
  chrome.storage.local.get(['isHideModeActive', 'theme', 'isExtensionEnabled'], (result) => {
    // Check if extension is enabled at all (default is true)
    const isEnabled = result.isExtensionEnabled !== false;
    extensionToggle.checked = isEnabled;
    updateVisibility(isEnabled);

    if (isEnabled) {
      const isActive = result.isHideModeActive || false;
      updateUI(isActive);

      // Set active theme button
      const currentTheme = result.theme || 'default';
      themeBtns.forEach(btn => {
        if (btn.dataset.theme === currentTheme) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }
  });

  function updateVisibility(isEnabled) {
    if (isEnabled) {
      mainContent.style.display = 'block';
      disabledMessage.style.display = 'none';

      // Update toggle UI
      document.querySelector('.header p').textContent = 'Remove distractions, focus on content.';
    } else {
      mainContent.style.display = 'none';
      disabledMessage.style.display = 'block';

      // Update toggle UI to indicate it's off
      document.querySelector('.header p').textContent = 'Extension is inactive.';
    }
  }

  extensionToggle.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;

    // Save state
    chrome.storage.local.set({ isExtensionEnabled: isEnabled });

    // Update local UI
    updateVisibility(isEnabled);

    // If turned off, ensure hide mode is disabled
    if (!isEnabled) {
      chrome.storage.local.set({ isHideModeActive: false });
      updateUI(false);
    }

    // Notify all tabs to apply extension state
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleExtension',
          isEnabled: isEnabled
        });
      }
    });
  });

  toggleBtn.addEventListener('click', () => {
    chrome.storage.local.get(['isHideModeActive'], (result) => {
      const newState = !(result.isHideModeActive || false);

      // Update storage
      chrome.storage.local.set({ isHideModeActive: newState });

      // Update UI
      updateUI(newState);

      // Send message to current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'toggleHideMode',
            isActive: newState
          });
        }
      });
    });
  });

  restoreBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Send message to clear hidden elements for this tab's hostname
        chrome.tabs.sendMessage(tabs[0].id, { action: 'restoreElements' });

        // Ensure hide mode is turned off when restoring
        chrome.storage.local.set({ isHideModeActive: false });
        updateUI(false);
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleHideMode',
          isActive: false
        });
      }
    });
  });

  function updateUI(isActive) {
    if (isActive) {
      toggleBtn.classList.add('active');
      toggleText.textContent = 'Disable Hide Mode';
      statusIndicator.textContent = 'ON';
      statusIndicator.className = 'status-indicator on';
      statusHint.textContent = 'Hover over elements and click to hide them.';
    } else {
      toggleBtn.classList.remove('active');
      toggleText.textContent = 'Enable Hide Mode';
      statusIndicator.textContent = 'OFF';
      statusIndicator.className = 'status-indicator off';
      statusHint.textContent = 'Click "Enable Hide Mode" to start hiding elements.';
    }
  }

  // Theme button listeners
  themeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedTheme = e.target.dataset.theme;

      // Update UI
      themeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      // Save theme to storage
      chrome.storage.local.set({ theme: selectedTheme }, () => {
        // Send message to current tab to apply theme
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'changeTheme',
              theme: selectedTheme
            });
          }
        });
      });
    });
  });
});
