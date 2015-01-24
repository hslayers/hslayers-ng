define(['angular'],
    function(angular) {
        angular.module('drag', []).
        directive('draggable', ['$document', '$window', function($document, $window) {
            return function(scope, element, attr) {
                var startX = 0,
                    startY = 0,
                    x = 0,
                    y = 0;
                element.css({
                    position: 'relative',
                    cursor: 'pointer',
                    display: 'block'
                });
                element.on('mousedown', function(event) {
                    // Prevent default dragging of selected content
                    event.preventDefault();
                    if(element.parent()[0]!=document.body){
                        var w = angular.element($window);
                        element.css("width", element.width()+"px");
                        startY = event.screenY - y + w.height() - 197;
                        startX = event.screenX - x -46;
                        element.appendTo($(document.body));
                    } else {                
                        startY = event.screenY - y;
                        startX = event.screenX - x ;
                    }                   
                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                });

                function mousemove(event) {
                    y = event.screenY - startY;
                    x = event.screenX - startX;
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
        }]);
    })
