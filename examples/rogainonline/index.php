<?php
if(strpos($_SERVER['HTTP_HOST'], 'ng.hslayers') !== false && (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] == "off")){
  $redirect = 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
  header('HTTP/1.1 301 Moved Permanently');
  header('Location: ' . $redirect);
  exit();
}
?>
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
      <meta property="og:url" content="<?php echo "https://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"; ?>" />
      <meta property="og:image" content="<?php echo "http://$_SERVER[HTTP_HOST]" . explode('?', $_SERVER["REQUEST_URI"])[0] . "images/".$_GET['image'].'.png'; ?>" />
      <?php
        $imageinfo = getimagesize("images/".$_GET['image'].'.png');
      ?>
      <meta property="og:image:width" content="<?php echo $imageinfo[0] ?>"/>
      <meta property="og:image:height" content="<?php echo $imageinfo[1] ?>"/>
      <meta property="og:description" content="<?php echo "I just ran ".$_GET['km']." km" ?>" />
      <?php } ?>
</head>

<body>
  <div hs ng-app="hs" ng-controller="Main" style="position: relative;"></div>
  <script src="../../node_modules/jquery/dist/jquery.min.js"></script>
  <script src="../../node_modules/requirejs/require.js"></script>
  <script src="hslayers.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-touch-events/1.0.5/jquery.mobile-events.js"></script>
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
    <div id='flip-div' title="Use this to lock the screen" style='position: absolute; bottom: 0; left: 0; background: white; border-top-right-corner-shape: bevel; border-top-right-radius: 50px;  opacity: 0.05; z-index: 1000'></div>
    <img id='page-fliper' title="Use this to lock the screen" src='jantonalcor-corner-up2.png'  draggable="false" style='position: absolute; bottom: 0; left: 0; z-index: 1001; opacity: 0.6;' />
    <script>
       var $dragging = null;

    $(document.body).on("mousemove", function(e) {
        if ($dragging) {
            $dragging.offset({
                top: e.pageY - $dragging.cy,
                left: e.pageX - $dragging.cx
            });
            adjustFlipDiv()
        }
    });

    function adjustFlipDiv(){
      $('#flip-div').css({width: ($("#page-fliper").offset().left + 50) + 'px', height: ($(window).height() - $("#page-fliper").offset().top- 5)+'px' });
    }

    $(document.body).on("mousedown", "#page-fliper", function (e) {
        $dragging = $(e.target);
        $dragging.cx = e.offsetX;
        $dragging.cy = e.offsetY;
    });

    var screen_locked = false;

    function swipeUp(){
      $("#page-fliper").css({right: '0', top: '0', left: 'auto', bottom: 'auto',  '-moz-transform': 'scale(-1, -1)',
        '-o-transform': 'scale(-1, -1)',
        '-webkit-transform': 'scale(-1, -1)',
        transform: 'scale(-1, -1)',
        filter: 'FlipH FlipV',
        '-ms-filter': "FlipH FlipV"});
        adjustFlipDiv();
        screen_locked = true
    }

    function swipeDown(){
      $("#page-fliper").css({right: 'auto', top: 'auto', left: '0', bottom: '0',  '-moz-transform': 'scale(1, 1)',
        '-o-transform': 'scale(1, 1)',
        '-webkit-transform': 'scale(1, 1)',
        transform: 'scale(1, 1)',
        filter: 'none',
        '-ms-filter': "none" });
        adjustFlipDiv();
        screen_locked = false;
    }

    $(document.body).on("mouseup", function (e) {
        if($dragging == null) return;
        if(e.pageX>$(window).width()/2 || e.pageY<$(window).height()/2){
          swipeUp()
        } else {
          swipeDown()
        }
        $dragging = null;
    });

    $("#page-fliper").swipe(function(e, data) { 
        if((data.direction=='up' || data.direction=='right') && (data.xAmount>40 && data.yAmount>40))
          swipeUp();

        if((data.direction=='down' || data.direction=='left') && (data.xAmount>20 && data.yAmount>20))
          swipeDown();
    });

    window.history.forward(1);     
    window.onbeforeunload = function() { return "Closing"; };
    </script>
</body>

</html>