<?php
define('STORE', '47');
require __DIR__ . '/../_sistema/core.php';
admin_page();

ob_start();
require __DIR__ . '/../_sistema/dashboard.php';
$html = ob_get_clean();

$theme = <<<'CSS'
<style>
@media screen {
  :root {
    --bg: #0a0a0a;
    --panel: #121212;
    --line: #383030;
    --ink: #ffffff;
    --muted: #b8aaaa;
    --accent: #ff6868;
  }

  body {
    background: var(--bg);
    color: var(--ink);
  }

  .sidebar {
    background: #180909;
    border-right-color: var(--line);
  }

  .sidebar .wordmark {
    color: var(--ink);
    border-bottom: 3px solid var(--accent);
    padding-bottom: 18px;
  }

  .box, .stat, dialog {
    background: var(--panel);
    border-color: var(--line);
  }

  .box {
    border-top: 2px solid #5c0000;
  }

  input, textarea, select {
    background: #0a0a0a;
    color: var(--ink);
    border-color: var(--line);
  }

  .button, button {
    background: #8b0000;
    color: #ffffff;
  }

  .secondary {
    background: #5c0000;
    color: var(--ink);
  }

  .danger {
    background: #641f25;
    color: #ffffff;
  }

  .sidebar button {
    background: transparent;
    color: var(--muted);
  }

  .sidebar button.active {
    background: #5c0000;
    color: var(--accent);
  }

  .chart-track {
    background: var(--line);
  }

  .chart-fill {
    background: linear-gradient(90deg, #8b0000, #ff6868);
  }

  .pill {
    background: #5c0000;
    color: var(--ink);
  }

  .notice {
    background: #441f24;
    color: #ffe5e5;
  }
}
</style>
CSS;

$anchor = str_contains($html, '</head>') ? '</head>' : '<body>';
echo str_replace($anchor, $theme . $anchor, $html);