# Focus Reader Extension 読 🌙

A lightweight Google Chrome extension designed to eliminate distractions (like headers, sidebars, or ads) so you can focus entirely on your reading. Perfect for documentation sites, blogs, programming tutorials (e.g., W3Schools, GeeksForGeeks), and Wikipedia.

## Features ✨

*   **Turn On/Off Anytime:** A simple switch to enable or completely disable the extension globally without removing it from your browser.
*   **Interactive Hide Mode (`Eye Icon`):** Activate "Hide Mode" to turn your cursor into a selection tool. Hovering over webpage elements outlines them in red. Simply click on an element to hide it instantly.
*   **Smart Storage Mechanism:** The extension automatically remembers all the elements you've hidden. Even if you refresh the page or restart your browser, the unwanted elements will remain hidden for that specific website!
*   **One-Click Restore (`Sync Icon`):** Did you hide a vital part by mistake? Use the "Restore Hidden Elements" button to bring back everything you've hidden on the current site.
*   **Dark Mode Support:** A built-in dark theme option provides a soothing reading experience on any site by intelligently inverting colors while preserving images and videos so they look natural.

## How to Install (Developer Mode) 🛠️

Since this extension isn't published on the Chrome Web Store yet, you can easily install it manually:

1.  Clone or download this repository to your local machine:
    ```bash
    git clone https://github.com/harunr21/reader_extension.git
    ```
2.  Open Google Chrome and navigate to your extensions page: `chrome://extensions/`
3.  Turn **ON** the "Developer mode" toggle switch in the top right corner.
4.  Click on the **"Load unpacked"** button in the top left corner.
5.  Select the folder where you cloned or extracted the `reader_extension` repository.

That's it! The Focus Reader icon will now appear in your browser toolbar.

## Usage Guide 📖

1.  Click the Focus Reader extension icon.
2.  Ensure the extension is toggled **ON** via the switch at the top.
3.  Click **"Enable Hide Mode"**.
4.  Move your mouse around the webpage. Distracting structural elements will be highlighted in red.
5.  **Click** the highlighted element to hide it.
6.  If you want to view a page normally again, open the extension and click **"Restore Hidden Elements"**.
7.  To try out dark mode, simply click the **"Dark Mode"** button underneath the Theme Options!

## Technologies Used 💻

*   **HTML & CSS:** Extension UI popup and focus effect styling.
*   **Vanilla JavaScript (ES6+):** Pure DOM manipulation, algorithms to generate unique and robust CSS selectors, and logic handling.
*   **Chrome Extension APIs:**
    *   `Manifest V3`: Modern Chrome extension standard.
    *   `chrome.storage.local`: To securely save hidden element selectors and user theme choices on a per-site basis.
    *   `chrome.tabs` and `chrome.scripting`: To communicate messages dynamically between the extension interface and the physical webpage (content scripts).

## Contributing 🤝

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a Pull Request.

## License 📜

[MIT License](LICENSE)
