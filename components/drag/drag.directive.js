export default ['$document', '$window', 'config', function($document, $window, config) {
    return function(scope, element, attr) {

        function isPanel() {
            return (angular.isUndefined(attr.iswindow) || attr.iswindow == "true");
        }

        if (isPanel() && (angular.isUndefined(config.draggable_windows) || config.draggable_windows == false)) return;
        var startX = 0,
            startY = 0,
            x = 0,
            y = 0;
        element.css({
            //position: 'relative',
            cursor: 'pointer',
            display: 'block'
        });
        scope.unpinned = false;
        scope.drag_panel = element;
        var orig_left, orig_top;
        $(".card-header:first", element).append($('<button>').attr('type', 'button').addClass('but-title-sm').click(function() {
                scope.unpinned = true;
                $(".card-header", element).css('cursor', 'move');
            })
            .append($('<span>').addClass('icon-share').attr('aria-hidden', 'true'))
            .append($('<span>').addClass('sr-only').attr('translate', '').html('Unpin')));
        element.on('mousedown', function(event) {
            if (!scope.unpinned && isPanel()) return;
            // Prevent default dragging of selected content
            event.preventDefault();
            if (event.offsetY > 37) return;
            orig_left = element.offset().left;
            orig_top = element.offset().top;
            startY = event.pageY;
            startX = event.pageX;
            if (element.parent()[0] != document.body) {
                var w = angular.element($window);
                element.css("width", element.width() + "px");
                scope.original_container = element.parent()[0];
                element.appendTo($(document.body));
                element.css({
                    top: orig_top + 'px',
                    left: orig_left + 'px',
                    position: 'absolute'
                });
            }
            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
        });

        function mousemove(event) {
            y = orig_top + event.pageY - startY;
            x = orig_left + event.pageX - startX;
            scope[attr.hsDraggableOnmove](x + element.width() / 2, y + element.height() / 2);
            element.css({
                top: y + 'px',
                left: x + 'px'
            });
        }

        function mouseup() {
            $document.off('mousemove', mousemove);
            $document.off('mouseup', mouseup);
        }
    };
}]