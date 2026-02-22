chrome.runtime.onInstalled.addListener(() => {
    // Initialize default state
    chrome.storage.local.set({ isHideModeActive: false });
});

// Handle tab switches - ensure the hide mode state resets when changing tabs
// to avoid confusion, or keep it per-tab/global.
// For now, let's keep it global but reset cursor on inactive tabs
chrome.tabs.onActivated.addListener((activeInfo) => {
    // Optional: Reset hide mode when switching tabs
    // chrome.storage.local.set({ isHideModeActive: false });
});
