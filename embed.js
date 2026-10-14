/*!
 * TF Widgets — Restaurant Menu v1
 * Встраивание: <script src=".../embed.js" data-id="CLIENT_ID"></script>
 * Конфиг клиента: configs/CLIENT_ID.json
 * Меню ресторана или кафе: категории вкладками, поиск, блюда с ценой, описанием и фото (ссылкой),
 * метки (Vegan, Spicy…), 14 аллергенов ЕС с расшифровкой, отметка Sold out.
 * Виджет встаёт на место тега <script>. Все стили ограничены классом .bhw-mn.
 */
(function () {
    'use strict';
    var VERSION = '1.0.0';
    var LOG = '[TFW Menu]';
    // Где работает живое превью BHWMenu.render() (конфигуратор на сайте)
    var PREVIEW_DOMAINS = ['tf-widgets.com', '*.tf-widgets.com', '9ac5za-h1.myshopify.com'];

    var TAGS = {
        vegan: { label: 'Vegan', color: '#16a34a' },
        vegetarian: { label: 'Vegetarian', color: '#65a30d' },
        spicy: { label: 'Spicy', color: '#dc2626' },
        glutenfree: { label: 'Gluten-free', color: '#b45309' },
        new: { label: 'New', color: '#2563eb' },
        chef: { label: "Chef's pick", color: '#7c3aed' }
    };
    // 14 аллергенов по Регламенту ЕС 1169/2011, номера по общепринятому порядку
    var ALLERGENS = ['Gluten', 'Crustaceans', 'Eggs', 'Fish', 'Peanuts', 'Soy', 'Milk', 'Tree nuts',
        'Celery', 'Mustard', 'Sesame', 'Sulphites', 'Lupin', 'Molluscs'];

    var ICON_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 3a7 7 0 0 1 5.6 11.2l4.6 4.6-1.4 1.4-4.6-4.6A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg>';
    var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>';

    var inlineCSS = `
        .bhw-mn { font-family: var(--bhw-font, 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif); -webkit-font-smoothing: antialiased;
            display: block; position: relative; width: 100%; max-width: var(--bhw-max, 880px); margin: 0 auto; padding: var(--bhw-pad, 24px);
            background: var(--bhw-bg, #ffffff); color: var(--bhw-text, #1f2937); border-radius: var(--bhw-r, 18px);
            line-height: 1.45; font-size: 15px; text-align: left; box-sizing: border-box; }
        .bhw-mn *, .bhw-mn *::before, .bhw-mn *::after { box-sizing: border-box; }
        .bhw-mn .bhw-mn-head { margin: 0 0 18px; text-align: center; }
        .bhw-mn .bhw-mn-h { margin: 0; padding: 0; font-size: 28px; font-weight: 800; line-height: 1.2; letter-spacing: -.01em; color: inherit; }
        .bhw-mn .bhw-mn-sub { margin: 6px 0 0; font-size: 15px; opacity: .7; color: inherit; }

        /* поиск */
        .bhw-mn .bhw-mn-search { position: relative; margin: 0 0 14px; }
        .bhw-mn .bhw-mn-search svg { position: absolute; left: 14px; top: 50%; width: 18px; height: 18px; margin-top: -9px; opacity: .5; pointer-events: none; }
        .bhw-mn .bhw-mn-q { display: block; width: 100%; height: 44px; margin: 0; padding: 0 40px 0 42px; border: 1px solid var(--bhw-line, rgba(0,0,0,.12)); border-radius: 999px;
            background: var(--bhw-card, #f8f7f4); color: inherit; font: inherit; font-size: 15px; outline: none; box-shadow: none; -webkit-appearance: none; appearance: none; }
        .bhw-mn .bhw-mn-q:focus { border-color: var(--bhw-accent, #b45309); box-shadow: 0 0 0 3px var(--bhw-accent-soft, rgba(180,83,9,.15)); }
        .bhw-mn .bhw-mn-q::placeholder { color: inherit; opacity: .5; }
        .bhw-mn .bhw-mn-q::-webkit-search-cancel-button, .bhw-mn .bhw-mn-q::-webkit-search-decoration { -webkit-appearance: none; appearance: none; display: none; }
        .bhw-mn .bhw-mn-clear { position: absolute; right: 8px; top: 50%; display: none; place-items: center; width: 28px; height: 28px; margin: -14px 0 0; padding: 0;
            border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; opacity: .6; box-shadow: none; }
        .bhw-mn .bhw-mn-clear svg { width: 16px; height: 16px; }
        .bhw-mn.bhw-mn-searching .bhw-mn-clear { display: grid; }

        /* вкладки */
        .bhw-mn .bhw-mn-tabs { display: flex; gap: 8px; margin: 0 0 18px; padding: 2px 2px 6px; overflow-x: auto; scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
        .bhw-mn .bhw-mn-tab { flex: none; margin: 0; padding: 9px 16px; border: 1px solid var(--bhw-line, rgba(0,0,0,.12)); border-radius: 999px; background: transparent;
            color: inherit; font: inherit; font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; box-shadow: none; min-height: 0; transition: background .2s, color .2s, border-color .2s; }
        .bhw-mn .bhw-mn-tab:hover { border-color: var(--bhw-accent, #b45309); }
        .bhw-mn .bhw-mn-tab.bhw-on { background: var(--bhw-accent, #b45309); border-color: var(--bhw-accent, #b45309); color: var(--bhw-accent-text, #fff); }
        .bhw-mn .bhw-mn-tab:focus-visible { outline: 3px solid var(--bhw-accent, #b45309); outline-offset: 2px; }
        .bhw-mn.bhw-mn-searching .bhw-mn-tabs { display: none; }

        /* категория и блюда */
        .bhw-mn .bhw-mn-cat { display: none; }
        .bhw-mn .bhw-mn-cat.bhw-on, .bhw-mn.bhw-mn-searching .bhw-mn-cat.bhw-has { display: block; }
        .bhw-mn .bhw-mn-cat + .bhw-mn-cat { margin-top: 18px; }
        .bhw-mn .bhw-mn-ct { display: none; margin: 0 0 10px; font-size: 13px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; opacity: .6; color: inherit; }
        .bhw-mn.bhw-mn-searching .bhw-mn-ct { display: block; }
        .bhw-mn .bhw-mn-note { margin: -6px 0 14px; font-size: 14px; opacity: .7; color: inherit; }
        .bhw-mn.bhw-mn-searching .bhw-mn-note { display: none; }
        .bhw-mn .bhw-mn-list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
        .bhw-mn.bhw-mn-wide .bhw-mn-list { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .bhw-mn .bhw-mn-item { display: flex; gap: 14px; align-items: flex-start; margin: 0; padding: 14px; border-radius: calc(var(--bhw-r, 18px) * .7); background: var(--bhw-card, #f8f7f4); }
        .bhw-mn .bhw-mn-item[hidden] { display: none; }
        .bhw-mn .bhw-mn-ph { flex: none; width: 76px; height: 76px; border-radius: calc(var(--bhw-r, 18px) * .5); overflow: hidden; background: var(--bhw-line, rgba(0,0,0,.08)); }
        .bhw-mn .bhw-mn-ph img { width: 100% !important; height: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; object-fit: cover; display: block; }
        .bhw-mn .bhw-mn-body { flex: 1 1 auto; min-width: 0; }
        .bhw-mn .bhw-mn-row { display: flex; align-items: baseline; gap: 10px; }
        .bhw-mn .bhw-mn-name { flex: 1 1 auto; min-width: 0; margin: 0; font-size: 16px; font-weight: 700; line-height: 1.3; color: inherit; overflow-wrap: anywhere; }
        .bhw-mn .bhw-mn-price { flex: none; font-size: 16px; font-weight: 700; white-space: nowrap; color: var(--bhw-price, inherit); }
        .bhw-mn .bhw-mn-desc { margin: 4px 0 0; font-size: 14px; line-height: 1.45; opacity: .72; color: inherit; overflow-wrap: anywhere; white-space: pre-line; }
        .bhw-mn .bhw-mn-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 8px 0 0; }
        .bhw-mn .bhw-mn-tg { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; line-height: 1.3;
            background: color-mix(in srgb, var(--c) 14%, transparent); color: var(--c); }
        .bhw-mn .bhw-mn-tg i { width: 6px; height: 6px; border-radius: 50%; background: var(--c); }
        .bhw-mn .bhw-mn-al { font-size: 12px; opacity: .6; color: inherit; }
        .bhw-mn .bhw-mn-item.bhw-sold { opacity: .55; }
        .bhw-mn .bhw-mn-item.bhw-sold .bhw-mn-price { text-decoration: line-through; }
        .bhw-mn .bhw-mn-so { padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; line-height: 1.3; background: var(--bhw-text, #1f2937); color: var(--bhw-bg-solid, #fff); }
        .bhw-mn .bhw-mn-empty { display: none; margin: 24px 0; text-align: center; opacity: .65; font-size: 15px; }
        .bhw-mn.bhw-mn-noresults .bhw-mn-empty { display: block; }

        /* легенда аллергенов */
        .bhw-mn .bhw-mn-legend { margin: 20px 0 0; padding: 14px 0 0; border-top: 1px solid var(--bhw-line, rgba(0,0,0,.1)); font-size: 12.5px; line-height: 1.6; opacity: .7; color: inherit; }
        .bhw-mn .bhw-mn-legend b { font-weight: 700; }
        .bhw-mn .bhw-mn-legend span { white-space: nowrap; margin-right: 10px; }

        @media (max-width: 560px) {
            .bhw-mn { padding: var(--bhw-pad-m, 16px); }
            .bhw-mn .bhw-mn-h { font-size: 23px; }
            .bhw-mn .bhw-mn-ph { width: 64px; height: 64px; }
            .bhw-mn .bhw-mn-item { padding: 12px; gap: 12px; }
        }
        @media (prefers-reduced-motion: reduce) { .bhw-mn, .bhw-mn * { transition: none !important; } }

        /* защита от тем сайта, которые красят текст и кнопки через !important */
        .bhw-mn :where(.bhw-mn-h, .bhw-mn-sub, .bhw-mn-ct, .bhw-mn-note, .bhw-mn-name, .bhw-mn-desc, .bhw-mn-al, .bhw-mn-legend, .bhw-mn-legend *, .bhw-mn-empty, .bhw-mn-q) { color: var(--bhw-text, #1f2937) !important; }
        .bhw-mn .bhw-mn-price { color: var(--bhw-price, var(--bhw-text, #1f2937)) !important; }
        .bhw-mn .bhw-mn-tab { color: var(--bhw-text, #1f2937) !important; background: transparent !important; border: 1px solid var(--bhw-line, rgba(0,0,0,.12)) !important; }
        .bhw-mn .bhw-mn-tab.bhw-on { color: var(--bhw-accent-text, #fff) !important; background: var(--bhw-accent, #b45309) !important; border-color: var(--bhw-accent, #b45309) !important; }
        .bhw-mn .bhw-mn-tg { color: var(--c) !important; }
        .bhw-mn .bhw-mn-so { color: var(--bhw-bg-solid, #fff) !important; }
        .bhw-mn .bhw-mn-clear { color: var(--bhw-text, #1f2937) !important; background: transparent !important; border: 0 !important; }
        .bhw-mn :where(h3, h4, p, span, b, button, strong, input) { font-family: inherit !important; letter-spacing: normal; text-transform: none; }
        .bhw-mn .bhw-mn-ct { letter-spacing: .06em !important; text-transform: uppercase !important; }
    `;

    /* =========================================================
       ПУБЛИЧНЫЕ API
       ========================================================= */
    window.BusinessHoursWidgets = window.BusinessHoursWidgets || {};
    window.BusinessHoursWidgets.menu = window.BusinessHoursWidgets.menu || {};

    // Живое превью для конфигуратора: BHWMenu.render(container, config) -> { update, destroy, el }
    var api = window.BHWMenu = window.BHWMenu || {};
    api.version = VERSION;
    api.defaults = getDefaultConfig;
    api.checkAccess = bhwCheckAccess;
    api.tags = TAGS;
    api.allergens = ALLERGENS;
    api.render = function (container, config) {
        var noop = { destroy: function () {}, update: function () {}, el: null };
        if (!bhwCheckAccess({ domains: PREVIEW_DOMAINS }).ok) { console.warn(LOG, 'preview is only available on tf-widgets.com'); return noop; }
        injectBaseStyles();
        if (container._bhwMnDestroy) container._bhwMnDestroy();
        var cls = container.__bhwMnClass || (container.__bhwMnClass = 'bhw-mn-preview-' + Math.random().toString(36).slice(2, 8));
        var widget = null;
        var ctrl = {
            el: null,
            update: function (cfg) {
                var state = widget ? widget.state() : null;
                if (widget) widget.destroy();
                widget = mountWidget(normalizeConfig(cfg || {}), cls, 'preview', { inline: container, state: state });
                ctrl.el = widget.root;
            },
            show: function (i) { if (widget) widget.show(i); },
            index: function () { return widget ? widget.state().cat : 0; },
            destroy: function () { if (widget) widget.destroy(); widget = null; ctrl.el = null; container._bhwMnDestroy = null; }
        };
        ctrl.update(config);
        container._bhwMnDestroy = ctrl.destroy;
        return ctrl;
    };

    /* =========================================================
       АВТОЗАПУСК ПО <script data-id="..."> (только свой тег)
       ========================================================= */
    try {
        var currentScript = document.currentScript || (function () {
            var scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (currentScript && currentScript.dataset && currentScript.dataset.id && currentScript.dataset.bhwMounted !== '1') {
            currentScript.dataset.bhwMounted = '1';
            var debug = currentScript.dataset.debug === '1';
            var clientId = normalizeId(currentScript.dataset.id);
            var baseUrl = getBasePath(currentScript.src);
            loadConfig(clientId, baseUrl)
                .then(function (fetched) {
                    var access = bhwCheckAccess(fetched);
                    if (!access.ok) {
                        console.warn(LOG, 'widget "' + clientId + '" is not active on ' + (location.hostname || 'this page') + ': ' + access.reason);
                        return;
                    }
                    var cfg = normalizeConfig(fetched);
                    if (debug) console.log(LOG, 'config "' + clientId + '":', cfg);
                    injectBaseStyles();
                    var mount = function () {
                        var w = mountWidget(cfg, 'bhw-mn-' + clientId.replace(/[^a-z0-9_-]/gi, '') + '-' + Date.now(), clientId, { anchor: currentScript });
                        window.BusinessHoursWidgets.menu[clientId] = w;
                    };
                    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
                })
                .catch(function (error) {
                    console.warn(LOG, 'config "' + clientId + '" not loaded:', error.message);
                });
        }
    } catch (error) {
        console.error(LOG, 'critical error:', error);
    }

    /* =========================================================
       ФУНКЦИИ
       ========================================================= */
    function injectBaseStyles() {
        if (!document.getElementById('tfw-menu-styles')) {
            var style = document.createElement('style');
            style.id = 'tfw-menu-styles';
            style.textContent = inlineCSS;
            (document.head || document.documentElement).appendChild(style);
        }
    }

    /* ---------------------------------------------------------
       ДОСТУП (общий блок для всех виджетов TF Widgets — копировать без изменений)
       --------------------------------------------------------- */
    function bhwCheckAccess(config) {
        config = config || {};
        if (config.active === false) return { ok: false, reason: 'widget is switched off ("active": false)' };
        var host = String(location.hostname || '').toLowerCase().replace(/^www\./, '');
        if (!host || host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:') return { ok: true };
        var list = config.domains;
        if (typeof list === 'string') list = list.split(/[\s,]+/);
        if (!Array.isArray(list) || !list.length) return { ok: false, reason: 'no "domains" in config' };
        for (var i = 0; i < list.length; i++) {
            var d = String(list[i] || '').trim().toLowerCase()
                .replace(/^[a-z]+:\/\//, '').replace(/[\/:].*$/, '').replace(/^www\./, '');
            if (!d) continue;
            if (d.indexOf('*.') === 0) {
                var base = d.slice(2);
                if (host === base || host.slice(-(base.length + 1)) === '.' + base) return { ok: true };
            } else if (host === d) {
                return { ok: true };
            }
        }
        return { ok: false, reason: 'domain is not in "domains"' };
    }

    function normalizeId(id) { return String(id || 'demo').replace(/\.(json|js)$/i, ''); }
    function getBasePath(src) {
        if (!src) return './';
        try { var url = new URL(src, location.href); return url.origin + url.pathname.replace(/\/[^\/]*$/, '/'); }
        catch (error) { return './'; }
    }
    function loadConfig(clientId, baseUrl) {
        if (clientId === 'local') {
            var el = document.querySelector('#bhw-mn-local-config');
            if (!el) return Promise.reject(new Error('#bhw-mn-local-config not found'));
            try { return Promise.resolve(JSON.parse(el.textContent)); } catch (e) { return Promise.reject(e); }
        }
        var url = baseUrl + 'configs/' + encodeURIComponent(clientId) + '.json?v=' + Date.now();
        return fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }

    function getDefaultConfig() {
        return {
            heading: 'Our menu',
            subheading: '',
            currency: '€',
            currencyPosition: 'after',     // before: €9.50 | after: 9.50 €
            categories: [],                // [{ name, note, items: [{ name, desc, price, photo, tags: [], allergens: [1..14], soldOut }] }]
            search: true,
            allergenLegend: true,
            labels: { search: 'Search the menu', soldOut: 'Sold out', allergens: 'Allergens', noResults: 'Nothing found' },
            style: {
                fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
                colors: { background: '#ffffff', text: '#1f2937', card: '#f6f4ef', accent: '#b45309', accentText: '#ffffff', price: '' },
                sizes: { maxWidth: 880, radius: 18 }
            }
        };
    }

    function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }
    function normalizeConfig(raw) {
        raw = raw || {};
        var cats = Array.isArray(raw.categories) ? raw.categories : [];
        var cfg = mergeDeep(getDefaultConfig(), raw);
        cfg.currencyPosition = cfg.currencyPosition === 'before' ? 'before' : 'after';
        cfg.currency = str(cfg.currency, 6);
        cfg.categories = cats.slice(0, 20).map(function (c) {
            c = c || {};
            return {
                name: str(c.name, 40) || 'Menu',
                note: str(c.note, 160),
                items: (Array.isArray(c.items) ? c.items : []).slice(0, 120).map(function (it) {
                    it = it || {};
                    return {
                        name: str(it.name, 80),
                        desc: str(it.desc, 240),
                        price: str(it.price, 24),
                        photo: safeImg(it.photo),
                        tags: (Array.isArray(it.tags) ? it.tags : []).filter(function (t) { return TAGS[t]; }),
                        allergens: (Array.isArray(it.allergens) ? it.allergens : []).map(Number)
                            .filter(function (n, i, a) { return n >= 1 && n <= 14 && a.indexOf(n) === i; }).sort(function (a, b) { return a - b; }),
                        soldOut: !!it.soldOut
                    };
                }).filter(function (it) { return it.name; })
            };
        });
        cfg.style.sizes.maxWidth = Math.min(1400, Math.max(320, num(cfg.style.sizes.maxWidth, 880)));
        cfg.style.sizes.radius = Math.min(32, Math.max(0, num(cfg.style.sizes.radius, 18)));
        return cfg;
    }

    function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
    function mergeDeep(base, over) {
        var out = {};
        Object.keys(base || {}).forEach(function (k) { out[k] = isObj(base[k]) ? mergeDeep(base[k], {}) : base[k]; });
        Object.keys(over || {}).forEach(function (k) {
            var v = over[k];
            if (isObj(v) && isObj(out[k])) out[k] = mergeDeep(out[k], v);
            else if (v !== undefined) out[k] = v;
        });
        return out;
    }
    function cssValue(v, fallback) { if (v === undefined || v === null || v === '') return fallback; return String(v).replace(/[;{}<>]/g, ''); }
    function num(v, fallback) { var n = Number(v); return isFinite(n) && v !== '' && v !== null ? n : fallback; }
    function escapeHtml(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function safeImg(url) {
        var u = String(url || '').trim();
        if (/^https:\/\/[^\s"'<>]+$/i.test(u)) return u;
        if (/^data:image\/(svg\+xml|png|jpe?g|webp)[;,]/i.test(u) && u.length < 200000) return u;
        return '';
    }
    function hexToRgb(hex) {
        var h = String(hex || '').replace('#', '');
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        if (!/^[0-9a-f]{6}$/i.test(h)) return null;
        var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function isDark(hex) {
        var c = hexToRgb(hex); if (!c) return false;
        return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.5;
    }
    function rgba(hex, a) { var c = hexToRgb(hex); return c ? 'rgba(' + c.join(',') + ',' + a + ')' : 'rgba(0,0,0,' + a + ')'; }
    // цена: если клиент написал только число — добавляем валюту; если уже с символом или текстом — оставляем как есть
    function formatPrice(p, cfg) {
        p = String(p || '').trim();
        if (!p) return '';
        if (!/^[0-9][0-9\s.,]*$/.test(p) || !cfg.currency) return p;
        return cfg.currencyPosition === 'before' ? cfg.currency + p : p + ' ' + cfg.currency;
    }
    function norm(s) {
        s = String(s || '').toLowerCase();
        try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
        return s;
    }

    function applyCustomStyles(uniqueClass, cfg) {
        var id = 'bhw-mn-style-' + uniqueClass;
        var el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; (document.head || document.documentElement).appendChild(el); }
        var s = cfg.style || {}, c = s.colors || {}, z = s.sizes || {};
        var bg = cssValue(c.background, '');
        var text = cssValue(c.text, '#1f2937');
        var accent = cssValue(c.accent, '#b45309');
        var solid = hexToRgb(bg) ? bg : '#ffffff';
        el.textContent = '.' + uniqueClass + '{' +
            '--bhw-font:' + cssValue(s.fontFamily, "'Inter', system-ui, sans-serif") + ';' +
            '--bhw-bg:' + (bg || 'transparent') + ';' +
            '--bhw-bg-solid:' + solid + ';' +
            '--bhw-pad:' + (bg ? '24px' : '0px') + ';' +
            '--bhw-pad-m:' + (bg ? '16px' : '0px') + ';' +
            '--bhw-text:' + text + ';' +
            '--bhw-line:' + rgba(text, isDark(solid) ? .18 : .12) + ';' +
            '--bhw-card:' + cssValue(c.card, rgba(text, .04)) + ';' +
            '--bhw-accent:' + accent + ';' +
            '--bhw-accent-soft:' + rgba(accent, .18) + ';' +
            '--bhw-accent-text:' + cssValue(c.accentText, isDark(accent) ? '#ffffff' : '#111111') + ';' +
            (c.price ? '--bhw-price:' + cssValue(c.price, text) + ';' : '') +
            '--bhw-max:' + num(z.maxWidth, 880) + 'px;' +
            '--bhw-r:' + num(z.radius, 18) + 'px;' +
            '}';
        return id;
    }

    function itemHtml(it, cfg) {
        var L = cfg.labels || {};
        var tags = it.tags.map(function (t) {
            return '<span class="bhw-mn-tg" style="--c:' + TAGS[t].color + '"><i></i>' + escapeHtml(TAGS[t].label) + '</span>';
        }).join('');
        var al = it.allergens.length ? '<span class="bhw-mn-al" title="' + escapeHtml(it.allergens.map(function (n) { return ALLERGENS[n - 1]; }).join(', ')) + '">' +
            escapeHtml(L.allergens || 'Allergens') + ': ' + it.allergens.join(', ') + '</span>' : '';
        var so = it.soldOut ? '<span class="bhw-mn-so">' + escapeHtml(L.soldOut || 'Sold out') + '</span>' : '';
        var meta = tags + so + al;
        return '<article class="bhw-mn-item' + (it.soldOut ? ' bhw-sold' : '') + '">' +
            (it.photo ? '<span class="bhw-mn-ph"><img alt="" loading="lazy" src="' + escapeHtml(it.photo) + '"></span>' : '') +
            '<div class="bhw-mn-body">' +
                '<div class="bhw-mn-row"><h4 class="bhw-mn-name">' + escapeHtml(it.name) + '</h4>' +
                    (it.price ? '<span class="bhw-mn-price">' + escapeHtml(formatPrice(it.price, cfg)) + '</span>' : '') + '</div>' +
                (it.desc ? '<p class="bhw-mn-desc">' + escapeHtml(it.desc) + '</p>' : '') +
                (meta ? '<div class="bhw-mn-meta">' + meta + '</div>' : '') +
            '</div></article>';
    }

    function mountWidget(cfg, uniqueClass, id, opts) {
        opts = opts || {};
        var inline = opts.inline || null;
        var styleId = applyCustomStyles(uniqueClass, cfg);
        var cats = cfg.categories.filter(function (c) { return c.items.length || c.note; });
        var L = cfg.labels || {};
        var st = opts.state || {};
        var cur = Math.min(Math.max(0, st.cat || 0), Math.max(0, cats.length - 1));

        var used = {};
        cats.forEach(function (c) { c.items.forEach(function (it) { it.allergens.forEach(function (n) { used[n] = 1; }); }); });
        var usedList = Object.keys(used).map(Number).sort(function (a, b) { return a - b; });

        var root = document.createElement('div');
        root.id = 'tfw-menu-' + id;
        root.className = 'bhw-mn ' + uniqueClass;

        root.innerHTML =
            ((cfg.heading || cfg.subheading) ? '<header class="bhw-mn-head">' +
                (cfg.heading ? '<h3 class="bhw-mn-h">' + escapeHtml(cfg.heading) + '</h3>' : '') +
                (cfg.subheading ? '<p class="bhw-mn-sub">' + escapeHtml(cfg.subheading) + '</p>' : '') + '</header>' : '') +
            (cfg.search && cats.length ? '<div class="bhw-mn-search">' + ICON_SEARCH +
                '<input class="bhw-mn-q" type="search" autocomplete="off" aria-label="' + escapeHtml(L.search || 'Search the menu') + '" placeholder="' + escapeHtml(L.search || 'Search the menu') + '">' +
                '<button type="button" class="bhw-mn-clear" aria-label="Clear search">' + ICON_X + '</button></div>' : '') +
            (cats.length > 1 ? '<div class="bhw-mn-tabs" role="tablist">' + cats.map(function (c, i) {
                return '<button type="button" class="bhw-mn-tab" role="tab" data-i="' + i + '">' + escapeHtml(c.name) + '</button>';
            }).join('') + '</div>' : '') +
            cats.map(function (c, i) {
                return '<section class="bhw-mn-cat" data-i="' + i + '" role="tabpanel">' +
                    '<h4 class="bhw-mn-ct">' + escapeHtml(c.name) + '</h4>' +
                    (c.note ? '<p class="bhw-mn-note">' + escapeHtml(c.note) + '</p>' : '') +
                    '<div class="bhw-mn-list">' + c.items.map(function (it) { return itemHtml(it, cfg); }).join('') + '</div></section>';
            }).join('') +
            (cats.length ? '<p class="bhw-mn-empty">' + escapeHtml(L.noResults || 'Nothing found') + '</p>' : '<p class="bhw-mn-empty" style="display:block">Add dishes to see your menu</p>') +
            (cfg.allergenLegend && usedList.length ? '<div class="bhw-mn-legend"><b>' + escapeHtml(L.allergens || 'Allergens') + ':</b> ' +
                usedList.map(function (n) { return '<span>' + n + ' ' + escapeHtml(ALLERGENS[n - 1]) + '</span>'; }).join(' ') + '</div>' : '');

        if (inline) inline.appendChild(root);
        else if (opts.anchor && opts.anchor.parentNode) opts.anchor.parentNode.insertBefore(root, opts.anchor.nextSibling);
        else document.body.appendChild(root);

        var cleanups = [];
        function on(t, e, h, o) { t.addEventListener(e, h, o); cleanups.push(function () { t.removeEventListener(e, h, o); }); }

        var sections = [].slice.call(root.querySelectorAll('.bhw-mn-cat'));
        var tabs = [].slice.call(root.querySelectorAll('.bhw-mn-tab'));
        var q = root.querySelector('.bhw-mn-q');
        var query = '';

        // текст для поиска по каждому блюду (название, описание, метки)
        var index = sections.map(function (sec, i) {
            return [].slice.call(sec.querySelectorAll('.bhw-mn-item')).map(function (el, k) {
                var it = cats[i].items[k];
                return { el: el, text: norm(it.name + ' ' + it.desc + ' ' + it.tags.map(function (t) { return TAGS[t].label; }).join(' ')) };
            });
        });

        function show(i) {
            cur = Math.min(Math.max(0, i), Math.max(0, sections.length - 1));
            sections.forEach(function (s, k) { s.classList.toggle('bhw-on', k === cur); });
            tabs.forEach(function (t, k) { t.classList.toggle('bhw-on', k === cur); t.setAttribute('aria-selected', k === cur ? 'true' : 'false'); });
        }
        function filter(v) {
            query = v;
            var words = norm(v).split(/\s+/).filter(Boolean);
            var searching = words.length > 0, total = 0;
            root.classList.toggle('bhw-mn-searching', searching);
            index.forEach(function (list, i) {
                var n = 0;
                list.forEach(function (x) {
                    var ok = !searching || words.every(function (w) { return x.text.indexOf(w) >= 0; });
                    x.el.hidden = !ok; if (ok) n++;
                });
                sections[i].classList.toggle('bhw-has', n > 0);
                total += n;
            });
            root.classList.toggle('bhw-mn-noresults', searching && total === 0);
        }

        tabs.forEach(function (t) {
            on(t, 'click', function () { show(Number(t.getAttribute('data-i'))); });
        });
        if (tabs.length) on(root.querySelector('.bhw-mn-tabs'), 'keydown', function (e) {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            var n = cur + (e.key === 'ArrowRight' ? 1 : -1);
            if (n < 0 || n >= tabs.length) return;
            show(n); tabs[n].focus(); e.preventDefault();
        });
        if (q) {
            on(q, 'input', function () { filter(q.value); });
            on(root.querySelector('.bhw-mn-clear'), 'click', function () { q.value = ''; filter(''); q.focus(); });
        }
        root.querySelectorAll('.bhw-mn-ph img').forEach(function (img) {
            img.addEventListener('error', function () { var p = img.parentNode; if (p) p.remove(); });
        });

        // две колонки, когда виджету хватает ширины
        function layout() {
            var w = (inline ? inline.clientWidth : root.clientWidth) || root.clientWidth;
            root.classList.toggle('bhw-mn-wide', Math.min(w, cfg.style.sizes.maxWidth) >= 760);
        }
        layout();
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(layout);
            ro.observe(inline || root);
            cleanups.push(function () { ro.disconnect(); });
        } else on(window, 'resize', layout);

        show(cur);
        if (q && st.query) { q.value = st.query; filter(st.query); }

        return {
            root: root, config: cfg, id: id,
            state: function () { return { cat: cur, query: query }; },
            show: function (i) { if (q && query) { q.value = ''; filter(''); } show(i); },
            destroy: function () {
                cleanups.forEach(function (f) { try { f(); } catch (e) {} });
                root.remove();
                var s = document.getElementById(styleId); if (s) s.remove();
            }
        };
    }
})();
