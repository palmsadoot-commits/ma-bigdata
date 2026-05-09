/**
 * centralize data cleaning and conversion helpers
 */

const toNull = (val) => (val === '' || val === undefined || val === 'null' || val === null) ? null : val;

const toInt = (val, defaultVal = null) => {
    if (val === '' || val === undefined || val === null) return defaultVal;
    const parsed = parseInt(val);
    return isNaN(parsed) ? defaultVal : parsed;
};

const toFloat = (val, defaultVal = null) => {
    if (val === '' || val === undefined || val === null) return defaultVal;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultVal : parsed;
};

// Improved XSS filter for better prevention (Express 5 Compatible)
const simpleSanitize = (html) => {
    if (!html || typeof html !== 'string') return html;
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove onEvent="auth()" or onEvent='auth()'
        .replace(/on\w+\s*=\s*[^\s>]+/gi, '') // Remove onEvent=auth() (no quotes)
        .replace(/javascript:\s*[^"'>\s]*/gi, '') // Remove javascript: protocol
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
        .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, ''); // Remove objects
};


module.exports = {
    toNull,
    toInt,
    toFloat,
    simpleSanitize
};
