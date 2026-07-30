(function() {
  var DEFAULT_CSS = [
    '  :root {',
    '    font-family: \'Inter\', system-ui, sans-serif;',
    '    --background: oklch(0.985 0 0);',
    '    --foreground: oklch(0.145 0 0);',
    '    --card: oklch(1 0 0);',
    '    --card-foreground: oklch(0.145 0 0);',
    '    --popover: oklch(1 0 0);',
    '    --popover-foreground: oklch(0.145 0 0);',
    '    --primary: oklch(0.55 0.18 260);',
    '    --primary-foreground: oklch(0.985 0 0);',
    '    --secondary: oklch(0.97 0 0);',
    '    --secondary-foreground: oklch(0.205 0 0);',
    '    --muted: oklch(0.97 0 0);',
    '    --muted-foreground: oklch(0.556 0 0);',
    '    --accent: oklch(0.97 0 0);',
    '    --accent-foreground: oklch(0.205 0 0);',
    '    --border: oklch(0.922 0 0);',
    '    --radius: 0.625rem;',
    '    --pf-logo-radius: 0.75rem;',
    '    --pf-density: 1;',
    '    --pf-motion-duration: 150ms;',
    '    --sidebar: oklch(0.985 0 0);',
    '    --sidebar-foreground: oklch(0.145 0 0);',
    '    --destructive: oklch(0.577 0.245 27.3);',
    '    --success: oklch(0.6 0.18 145);',
    '    --warning: oklch(0.75 0.15 80);',
    '    --info: oklch(0.55 0.18 260);',
    '    color-scheme: light;',
    '  }'
  ].join('\n');

  var DARK_CSS = [
    '  .dark {',
    '    --background: oklch(0.13 0 0);',
    '    --foreground: oklch(0.985 0 0);',
    '    --card: oklch(0.17 0 0);',
    '    --card-foreground: oklch(0.985 0 0);',
    '    --popover: oklch(0.17 0 0);',
    '    --popover-foreground: oklch(0.985 0 0);',
    '    --primary: oklch(0.65 0.18 260);',
    '    --primary-foreground: oklch(0.985 0 0);',
    '    --secondary: oklch(0.22 0 0);',
    '    --secondary-foreground: oklch(0.985 0 0);',
    '    --muted: oklch(0.22 0 0);',
    '    --muted-foreground: oklch(0.708 0 0);',
    '    --accent: oklch(0.22 0 0);',
    '    --accent-foreground: oklch(0.985 0 0);',
    '    --border: oklch(1 0 0 / 10%);',
    '    --sidebar: oklch(0.17 0 0);',
    '    --sidebar-foreground: oklch(0.985 0 0);',
    '    color-scheme: dark;',
    '  }'
  ].join('\n');

  var SHARED_CSS = [
    '  body {',
    '    margin: 0;',
    '    background: var(--background);',
    '    color: var(--foreground);',
    '    font-family: \'Inter\', system-ui, sans-serif;',
    '  }',
    '  .pf-public-glow { position: fixed; inset: 0; z-index: 0; pointer-events: none; }',
    '  .pf-public-glow .glow-1 { position: absolute; top: -10%; left: -10%; height: 40%; width: 40%; border-radius: 50%; background: var(--primary); opacity: 0.2; filter: blur(120px); }',
    '  .pf-public-glow .glow-2 { position: absolute; bottom: -10%; right: -10%; height: 40%; width: 40%; border-radius: 50%; background: var(--info); opacity: 0.2; filter: blur(120px); }',
    '  .header { position: sticky; top: 0; z-index: 50; border-bottom: 1px solid color-mix(in oklch, var(--border), transparent 60%); background: color-mix(in oklch, var(--background), transparent 40%); backdrop-filter: blur(12px); }',
    '  .header-inner { max-width: 1024px; margin: 0 auto; padding: 0 1rem; height: 3.5rem; display: flex; align-items: center; justify-content: space-between; }',
    '  .pf-site-logo { width: 36px; height: 36px; border-radius: var(--pf-logo-radius); background: var(--primary); display: flex; align-items: center; justify-content: center; color: var(--primary-foreground); font-weight: 700; font-size: 1rem; flex-shrink: 0; }',
    '  .nav-link { font-size: 0.8125rem; font-weight: 500; color: var(--muted-foreground); }',
    '  main { position: relative; z-index: 10; max-width: 1024px; margin: 0 auto; padding: 2rem 1rem; }',
    '  .card { background: var(--card); border: 1px solid var(--border); border-radius: calc(var(--radius) * 1.2); padding: 1.5rem; margin-bottom: 1rem; }',
    '  .card h3 { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; }',
    '  .card p { margin: 0 0 1rem; font-size: 0.8125rem; color: var(--muted-foreground); line-height: 1.6; }',
    '  .btn { display: inline-flex; align-items: center; justify-content: center; height: 2.25rem; padding: 0 1rem; border-radius: calc(var(--radius) * 0.8); font-size: 0.8125rem; font-weight: 500; border: none; cursor: pointer; font-family: inherit; transition: all var(--pf-motion-duration); }',
    '  .btn-primary { background: var(--primary); color: var(--primary-foreground); }',
    '  .btn-secondary { background: var(--secondary); color: var(--secondary-foreground); }',
    '  .btn-destructive { background: var(--destructive); color: white; }',
    '  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--foreground); }',
    '  .console { max-width: 700px; margin: 0 auto; }',
    '  .pf-console-shell { display: grid; grid-template-columns: 180px 1fr; gap: 1.5rem; min-height: 200px; }',
    '  .sidebar-mock { background: color-mix(in oklch, var(--sidebar), var(--card) 50%); border: 1px solid var(--border); border-radius: calc(var(--radius) * 1.4); padding: 1rem; }',
    '  .sidebar-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.5rem; border-radius: calc(var(--radius) * 0.6); font-size: 0.75rem; color: var(--sidebar-foreground); margin-bottom: 2px; }',
    '  .sidebar-item.active { background: color-mix(in oklch, var(--primary), transparent 90%); color: var(--primary); font-weight: 500; }',
    '  .pf-console-content { background: var(--card); border: 1px solid var(--border); border-radius: calc(var(--radius) * 1.8); padding: 1.25rem; }',
    '  .content-placeholder { border: 2px dashed var(--border); border-radius: calc(var(--radius) * 1.2); padding: 2rem 1rem; text-align: center; color: var(--muted-foreground); font-size: 0.75rem; }',
    '  .upload-icon { width: 2rem; height: 2rem; margin: 0 auto 0.5rem; color: var(--muted-foreground); opacity: 0.6; }',
    '  label { font-size: 0.75rem; font-weight: 500; margin-bottom: 0.25rem; display: block; }',
    '  .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 600; background: color-mix(in oklch, var(--primary), transparent 90%); color: var(--primary); }',
    '  .badge.success { background: color-mix(in oklch, var(--success), transparent 90%); color: var(--success); }',
    '  .badge.warning { background: color-mix(in oklch, var(--warning), transparent 90%); color: var(--warning); }',
    '  .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1rem; }',
    '  .stat { background: color-mix(in oklch, var(--muted), transparent 50%); border-radius: calc(var(--radius) * 0.8); padding: 0.75rem; text-align: center; }',
    '  .stat-value { font-size: 1.125rem; font-weight: 700; }',
    '  .stat-label { font-size: 0.6875rem; color: var(--muted-foreground); margin-top: 0.125rem; }'
  ].join('\n');

  var BODY_HTML = [
    '  <div class="pf-public-glow"><div class="glow-1"></div><div class="glow-2"></div></div>',
    '  <header class="header">',
    '    <div class="header-inner">',
    '      <div style="display:flex;align-items:center;gap:0.75rem">',
    '        <div class="pf-site-logo">P</div>',
    '        <span style="font-weight:700;font-size:1.0625rem">My Site</span>',
    '      </div>',
    '      <span class="nav-link">Login</span>',
    '    </div>',
    '  </header>',
    '  <main>',
    '    <div class="card">',
    '      <h3>Welcome</h3>',
    '      <p>This is how your PicFast public page looks with your custom CSS applied. Edit the CSS on the left to see changes here instantly.</p>',
    '      <div style="display:flex;gap:0.5rem;flex-wrap:wrap">',
    '        <button class="btn btn-primary">Get Started</button>',
    '        <button class="btn btn-secondary">Learn More</button>',
    '        <button class="btn btn-outline">Documentation</button>',
    '        <button class="btn btn-destructive">Delete</button>',
    '      </div>',
    '      <div style="display:flex;gap:0.5rem;margin-top:0.75rem"><span class="badge">Default</span><span class="badge success">Success</span><span class="badge warning">Warning</span></div>',
    '    </div>',
    '    <div class="console">',
    '      <h3 style="font-size:0.875rem;margin:0 0 0.75rem">Console View</h3>',
    '      <div class="pf-console-shell">',
    '        <div class="sidebar-mock">',
    '          <div class="sidebar-item active">Upload</div>',
    '          <div class="sidebar-item">Images</div>',
    '          <div class="sidebar-item">Albums</div>',
    '          <div class="sidebar-item">Settings</div>',
    '        </div>',
    '        <div class="pf-console-content">',
    '          <div class="stats">',
    "            <div class=\"stat\"><div class=\"stat-value\">247</div><div class=\"stat-label\">Images</div></div>",
    "            <div class=\"stat\"><div class=\"stat-value\">3.2 GB</div><div class=\"stat-label\">Storage</div></div>",
    "            <div class=\"stat\"><div class=\"stat-value\">1.2k</div><div class=\"stat-label\">Views</div></div>",
    '          </div>',
    '          <label>Upload Zone</label>',
    '          <div class="content-placeholder">',
    "            <svg class=\"upload-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"><path d=\"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4\"/><polyline points=\"17 8 12 3 7 8\"/><line x1=\"12\" y1=\"3\" x2=\"12\" y2=\"15\"/></svg>",
    '            Drop files here or click to upload',
    '          </div>',
    '        </div>',
    '      </div>',
    '    </div>',
    '  </main>'
  ].join('\n');

  function buildPreviewHTML(css, dark) {
    var darkClass = dark ? ' class="dark"' : '';
    return '<!DOCTYPE html>\n<html' + darkClass + '>\n<head>\n' +
      '<style>\n' + DEFAULT_CSS + '\n\n' + DARK_CSS + '\n\n' + SHARED_CSS + '\n<\/style>\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\n' +
      '<style id="custom-css">' + css + '<\/style>\n' +
      '<\/head>\n<body>\n' + BODY_HTML + '\n<\/body>\n<\/html>';
  }

  var debounceTimer;
  var editor = document.getElementById('css-editor');
  var toggle = document.getElementById('theme-toggle-btn');
  if (!editor) return;

  // Default to current site theme
  var siteTheme = document.documentElement.getAttribute('data-theme');
  var prefersDark = siteTheme === 'dark' || (!siteTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (prefersDark && toggle) {
    toggle.classList.add('active');
  }

  function updatePreview() {
    var css = editor.value;
    var dark = toggle ? toggle.classList.contains('active') : false;
    var frame = document.getElementById('preview-frame');
    if (frame) frame.srcdoc = buildPreviewHTML(css, dark);
  }

  editor.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 200);
  });

  if (toggle) {
    toggle.addEventListener('click', function() {
      toggle.classList.toggle('active');
      updatePreview();
    });
  }

  updatePreview();
})();
