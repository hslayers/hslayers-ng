export default ['$document', '$window', 'config', function ($document, $window, config) {
    return function (scope, element, attr) {

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
        var header = element[0].querySelector(".card-header");
        var closeButton = angular.element('<button class="but-title-sm"><span class="icon-share" aria-hidden="true"></span><span class="sr-only" translate>Unpin</span><button>')[0];
        closeButton.onclick = () => {
            scope.unpinned = true;
            header.style.cursor = 'move';
        };
        header.appendChild(closeButton);
        element.on('mousedown', function (event) {
            if (!scope.unpinned && isPanel()) return;
            // Prevent default dragging of selected content
            event.preventDefault();
            if (event.offsetY > 37) return;
            var rect = element[0].getBoundingClientRect();
            orig_left = rect.left + document.body.scrollLeft;
            orig_top = rect.top + document.body.scrollTop;
            startY = event.pageY;
            startX = event.pageX;
            if (element.parent()[0] != document.body) {
                var w = angular.element($window);
                element.css("width", getComputedStyle(element[0], null).width);
                scope.original_container = element.parent()[0];
                document.body.appendChild(element[0]);
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
            if (scope[attr.hsDraggableOnmove])
                scope[attr.hsDraggableOnmove](
                    x + parseFloat(getComputedStyle(element[0], null).width.replace("px", "")) / 2,
                    y + parseFloat(getComputedStyle(element[0], null).height.replace("px", "")) / 2);
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