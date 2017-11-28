<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <title>Rogainonline</title>
  <meta name="description" content="A rogaining simulation game">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black" />
  <?php if (isset($_GET['image'])) { ?>
      <meta name="description" content="<?php echo "I just ran ".$_GET['image']." km" ?>" />
      <!-- Twitter Card data -->
      <meta name="twitter:card" value="<?php echo "I just ran ".$_GET['image']." km" ?>">

      <!-- Open Graph data -->
      <meta property="og:title" content="My run on Rogainonline" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="<?php echo "http://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"; ?>" />
      <meta property="og:image" content="<?php echo "http://$_SERVER[HTTP_HOST]" . explode('?', $_SERVER["REQUEST_URI"])[0] . "images/".$_GET['image'].'.png'; ?>" />
      <meta property="og:description" content="<?php echo "I just ran ".$_GET['km']." km" ?>" />
      <?php } ?>
</head>

<body>
  <div hs ng-app="hs" ng-controller="Main" style="position: relative;"></div>
  <script src="../../node_modules/jquery/dist/jquery.min.js"></script>
  <script src="../../node_modules/requirejs/require.js"></script>
  <script src="hslayers.js"></script>
  <style>
      .cesium-viewer .cesium-widget-credits {
        font-size: 7px !important
      }
  
      .cesium-viewer-bottom {
        right: auto !important;
        width: 10000px;
      }
  
      .search-results {
        z-index: 101
      }
  
      .hud {
        position: absolute !important;
        left: 0px;
        top: 10px;
        z-index: 100;
        pointer-events: none;
      }
  
      .hud .well {
        pointer-events: auto;
      }
      .hud h3{display: inline-block}
      .game-settings-row {margin-bottom: 2px}
      .game-settings-row .btn-group .btn:first-child  {width: 9em}
    </style>
</body>

</html>