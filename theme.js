// Theme Management System
class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'mlbb-theme';
        this.DARK_CLASS = 'dark-theme';
        this.LIGHT_CLASS = 'light-theme';
        this.init();
    }

    init() {
        // Load saved theme or default to dark
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) || 'dark';
        this.setTheme(savedTheme);
        this.attachToggleListener();
    }

    setTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'light') {
            html.classList.remove(this.DARK_CLASS);
            html.classList.add(this.LIGHT_CLASS);
            localStorage.setItem(this.STORAGE_KEY, 'light');
            this.updateThemeButton('light');
        } else {
            html.classList.remove(this.LIGHT_CLASS);
            html.classList.add(this.DARK_CLASS);
            localStorage.setItem(this.STORAGE_KEY, 'dark');
            this.updateThemeButton('dark');
        }
    }

    toggleTheme() {
        const currentTheme = localStorage.getItem(this.STORAGE_KEY) || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    updateThemeButton(theme) {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.textContent = theme === 'dark' ? '☀️ Sáng' : '🌙 Tối';
            btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
    }

    attachToggleListener() {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.addEventListener('click', () => this.toggleTheme());
        } else {
            // If button doesn't exist yet, wait and try again
            setTimeout(() => this.attachToggleListener(), 100);
        }
    }
}

// Initialize theme manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}
