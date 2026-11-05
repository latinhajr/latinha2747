<?php
define('STORE','47');require __DIR__.'/../_sistema/core.php';
header('Content-Type: application/javascript; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
$source=file_get_contents(__DIR__.'/assets/data.js');
try {
 if(!config()['database']) {echo $source;exit;}
 $list=products();
 // Escape text before existing HTML template renderers receive it.
 foreach($list as &$p) {
  foreach(["name","category","tag","short","description"] as $key) $p[$key]=htmlspecialchars($p[$key],ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');
  foreach(["sizes"] as $key) $p[$key]=array_map(fn($s)=>htmlspecialchars($s,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8'),$p[$key]);
 }unset($p);
 $json=json_encode($list,JSON_UNESCAPED_UNICODE|JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT);
 echo $source."\nwindow.Q47.products = ".$json.";";
}catch(Throwable $e) {http_response_code(503);echo "console.error('Catálogo indisponível: verifique o banco de dados.');";}
