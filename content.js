// Global state for the content script
let isExtensionEnabled = true;
let isHideModeActive = false;
let currentHighlightedElement = null;

// The class name used for highlighting
const HIGHLIGHT_CLASS = 'focus-reader-hide-highlight';

// Unique data attribute for hidden elements
const HIDDEN_ATTR = 'data-focus-reader-hidden';

/**
 * Validates and sanitizes a CSS selector to ensure it doesn't cause syntax errors
 */
function sanitizeSelector(selector) {
    try {
        // Try to use the selector to see if it's valid
        document.querySelector(selector);
        return selector;
    } catch (e) {
        // If it throws, try to escape it or fall back to a simpler selector
        console.warn('Focus Reader: Invalid selector generated:', selector, e);
        return null; // Return null to indicate failure
    }
}

/**
 * Generates a unique CSS selector for a given HTML element.
 */
function generateSelector(el) {
    if (el.tagName.toLowerCase() === 'html') return 'html';
    if (el.tagName.toLowerCase() === 'body') return 'body';

    let path = [];
    let currentEl = el;

    while (currentEl && currentEl.nodeType === Node.ELEMENT_NODE && currentEl.tagName.toLowerCase() !== 'html') {
        let selector = currentEl.nodeName.toLowerCase();

        // Use ID if available and valid
        if (currentEl.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(currentEl.id)) {
            selector += '#' + currentEl.id;
            // An ID should be unique, so we can stop here if we want, but let's build the full path for robustness
            path.unshift(selector);
            break;
        } else {
            // Build an nth-child selector
            let sibling = currentEl;
            let nth = 1;
            while (sibling.previousElementSibling) {
                sibling = sibling.previousElementSibling;
                if (sibling.nodeName.toLowerCase() == selector) {
                    nth++;
                }
            }
            if (nth != 1) {
                selector += `:nth-of-type(${nth})`;
            } else {
                // Check if there are other siblings of the same type after this one
                let hasNextSiblingOfSameType = false;
                let nextSibling = currentEl.nextElementSibling;
                while (nextSibling) {
                    if (nextSibling.nodeName.toLowerCase() == selector) {
                        hasNextSiblingOfSameType = true;
                        break;
                    }
                    nextSibling = nextSibling.nextElementSibling;
                }

                if (hasNextSiblingOfSameType) {
                    selector += `:nth-of-type(1)`; // Be explicit if there are siblings of the same type
                }
            }
        }

        path.unshift(selector);
        currentEl = currentEl.parentNode;
    }

    let fullSelector = path.join(' > ');

    // Validate the generated selector
    return sanitizeSelector(fullSelector);
}

/**
 * Hides an element visually.
 */
function hideElement(el) {
    el.style.setProperty('display', 'none', 'important');
    el.setAttribute(HIDDEN_ATTR, 'true');
}

/**
 * Retrieves the hostname for storage key.
 */
function getHostname() {
    return window.location.hostname;
}

/**
 * Loads hidden elements from storage and applies them to the current page.
 */
function loadAndHideElements() {
    if (!isExtensionEnabled) return;

    const hostname = getHostname();
    chrome.storage.local.get([hostname], (result) => {
        if (chrome.runtime.lastError) {
            console.error('Focus Reader: Error loading data:', chrome.runtime.lastError);
            return;
        }

        const hiddenSelectors = result[hostname] || [];

        if (hiddenSelectors.length > 0) {
            console.log(`Focus Reader: Found ${hiddenSelectors.length} hidden elements for this site.`);

            // We use RequestAnimationFrame to ensure styles apply properly
            requestAnimationFrame(() => {
                // Apply a global style block for hidden elements as a fallback/faster method
                const styleId = 'focus-reader-hidden-styles';
                let styleEl = document.getElementById(styleId);

                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.id = styleId;
                    document.head.appendChild(styleEl);
                }

                // Generate CSS rules for all valid selectors
                const validSelectors = hiddenSelectors.filter(s => {
                    try {
                        document.querySelector(s);
                        return true;
                    } catch (e) {
                        return false;
                    }
                });

                if (validSelectors.length > 0) {
                    styleEl.textContent = validSelectors.join(', ') + ' { display: none !important; }';

                    // Also add the attribute for tracking
                    validSelectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => el.setAttribute(HIDDEN_ATTR, 'true'));
                    });
                }
            });
        }
    });
}

/**
 * Removes custom hide styles and unhides attributes.
 */
function restoreElements() {
    // Remove the global style block
    const styleEl = document.getElementById('focus-reader-hidden-styles');
    if (styleEl) {
        styleEl.remove();
    }

    // Remove the hidden attribute and inline styles
    const hiddenElements = document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`);
    hiddenElements.forEach(el => {
        el.removeAttribute(HIDDEN_ATTR);
        if (el.style.display === 'none') {
            el.style.removeProperty('display');
        }
    });

    // Clear storage for this hostname
    const hostname = getHostname();
    chrome.storage.local.remove(hostname, () => {
        console.log(`Focus Reader: Restored elements for ${hostname}`);
    });
}

/**
 * Removes highlight from the currently highlighted element.
 */
function removeHighlight() {
    if (currentHighlightedElement) {
        currentHighlightedElement.classList.remove(HIGHLIGHT_CLASS);
        currentHighlightedElement = null;
    }
}

/**
 * Event handler for mouseover - Highlights elements
 */
function handleMouseOver(e) {
    if (!isHideModeActive || !isExtensionEnabled) return;

    e.preventDefault();
    e.stopPropagation();

    // Remove highlight from previous element
    removeHighlight();

    // Add highlight to current target
    currentHighlightedElement = e.target;
    currentHighlightedElement.classList.add(HIGHLIGHT_CLASS);
}

/**
 * Event handler for click - Hides elements and saves them
 */
function handleClick(e) {
    if (!isHideModeActive || !isExtensionEnabled) return;

    e.preventDefault();
    e.stopPropagation();

    const el = e.target;

    // Don't hide html or body
    if (el.tagName.toLowerCase() === 'html' || el.tagName.toLowerCase() === 'body') {
        return;
    }

    removeHighlight();

    const selector = generateSelector(el);

    if (!selector) {
        console.error('Focus Reader: Could not generate a valid selector for this element.');
        return;
    }

    hideElement(el);

    // Save the new selector to storage
    const hostname = getHostname();
    chrome.storage.local.get([hostname], (result) => {
        const hiddenSelectors = result[hostname] || [];
        if (!hiddenSelectors.includes(selector)) {
            hiddenSelectors.push(selector);
            chrome.storage.local.set({ [hostname]: hiddenSelectors }, () => {
                console.log('Focus Reader: Hidden element saved.', selector);
            });
        }
    });
}

/**
 * Toggles the hide mode listeners
 */
function toggleHideMode(active) {
    isHideModeActive = active;

    if (isHideModeActive && isExtensionEnabled) {
        document.addEventListener('mouseover', handleMouseOver, true);
        document.addEventListener('click', handleClick, true);
        document.body.style.cursor = 'crosshair';
    } else {
        document.removeEventListener('mouseover', handleMouseOver, true);
        document.removeEventListener('click', handleClick, true);
        document.body.style.cursor = '';
        removeHighlight();
    }
}

/**
 * Applies the selected theme to the page.
 */
function applyTheme(theme) {
    document.documentElement.classList.remove('focus-reader-theme-dark');
    if (isExtensionEnabled && theme && theme !== 'default') {
        document.documentElement.classList.add(`focus-reader-theme-${theme}`);
    }
}

/**
 * Completely toggles the extension features on or off without reloading
 */
function toggleGlobalExtensionState(enabled) {
    isExtensionEnabled = enabled;

    if (enabled) {
        // Turning ON
        // Re-apply elements and themes
        loadAndHideElements();
        chrome.storage.local.get(['theme', 'isHideModeActive'], (result) => {
            applyTheme(result.theme || 'default');
            if (result.isHideModeActive) {
                toggleHideMode(true);
            }
        });
    } else {
        // Turning OFF
        // Stop hiding mode
        toggleHideMode(false);
        // Turn off theme
        document.documentElement.classList.remove('focus-reader-theme-dark');
        // Unhide elements locally without removing them from memory
        const styleEl = document.getElementById('focus-reader-hidden-styles');
        if (styleEl) {
            styleEl.remove();
        }
        const hiddenElements = document.querySelectorAll(`[${HIDDEN_ATTR}="true"]`);
        hiddenElements.forEach(el => {
            el.removeAttribute(HIDDEN_ATTR);
            if (el.style.display === 'none') {
                el.style.removeProperty('display');
            }
        });
    }
}

// Check initial state from storage
chrome.storage.local.get(['isHideModeActive', 'theme', 'isExtensionEnabled'], (result) => {
    isExtensionEnabled = result.isExtensionEnabled !== false; // Default to true if not set

    if (isExtensionEnabled) {
        if (result.isHideModeActive) {
            toggleHideMode(true);
        }
        applyTheme(result.theme || 'default');
    }
});

// Listen for messages from the popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleHideMode') {
        toggleHideMode(request.isActive);
    } else if (request.action === 'restoreElements') {
        restoreElements();
    } else if (request.action === 'changeTheme') {
        applyTheme(request.theme);
    } else if (request.action === 'toggleExtension') {
        toggleGlobalExtensionState(request.isEnabled);
    }
});

// Run load elements on startup
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadAndHideElements();
    });
} else {
    loadAndHideElements();
}

// In case it's a dynamic SPA like react/vue, re-run hiding occasionally or on mutations
// A simple mutation observer to catch dynamically added elements that match our hidden selectors
const observer = new MutationObserver((mutations) => {
    // Only check if we have the style element block (which means we have hidden elements stored)
    if (document.getElementById('focus-reader-hidden-styles')) {
        // We don't need to do much as the global CSS rules handle new elements automatically!
        // The only thing we might want to do is add the HIDDEN_ATTR if needed for tracking, 
        // but the CSS display: none !important handles the actual visual hiding.
    }
});

observer.observe(document.body, { childList: true, subtree: true });
