<?php
define('STORE', '27');
require __DIR__ . '/../../_sistema/core.php';
admin_page();

ob_start();
require __DIR__ . '/../../_sistema/dashboard.php';
$html = ob_get_clean();

$theme = <<<'CSS'
<style>
@media screen {
  :root {
    --bg: #0a0a0a;
    --panel: #121214;
    --line: #292b35;
    --ink: #f7f6f2;
    --muted: #a3a3ad;
    --accent: #ffd21e;
  }

  body {
    background: var(--bg);
    color: var(--ink);
  }

  .sidebar {
    background: #101c3d;
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
    border-top: 2px solid #1b2f63;
  }

  input, textarea, select {
    background: #0a0a0a;
    color: var(--ink);
    border-color: var(--line);
  }

  .button, button {
    background: #ffd21e;
    color: #0a0a0a;
  }

  .secondary {
    background: #1b2f63;
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
    background: #1b2f63;
    color: var(--accent);
  }

  .chart-track {
    background: var(--line);
  }

  .chart-fill {
    background: linear-gradient(90deg, #f5a300, #ffd21e);
  }

  .pill {
    background: #1b2f63;
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