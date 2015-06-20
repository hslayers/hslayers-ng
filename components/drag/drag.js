define(['angular'],
    function(angular) {
        angular.module('hs.drag', []).
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
                scope.unpinned = false;
                scope.drag_panel = element;
                $(".panel-heading", element).append($('<button>').attr('type', 'button').addClass('but-title-sm').click(function() {
                        scope.unpinned = true;
                        $(".panel-heading", element).css('cursor', 'move');
                    })
                    .append($('<span>').addClass('glyphicon glyphicon-share').attr('aria-hidden', 'true'))
                    .append($('<span>').addClass('sr-only').attr('translate', '').html('Unpin')));
                element.on('mousedown', function(event) {
                    if (!scope.unpinned) return;
                    // Prevent default dragging of selected content
                    event.preventDefault();
                    if (event.offsetY > 37) return;
                    if (element.parent()[0] != document.body) {
                        var w = angular.element($window);
                        element.css("width", element.width() + "px");
                        startY = event.pageY - 4;
                        startX = event.pageX - 47;
                        scope.original_container = element.parent()[0];
                        element.appendTo($(document.body));
                        element.css({
                            top: 5 + 'px',
                            left: 46 + 'px',
                            position: 'absolute'
                        });
                    } else {
                        startY = event.pageY - y;
                        startX = event.pageX - x;
                    }
                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                });

                function mousemove(event) {
                    y = event.pageY - startY;
                    x = event.pageX - startX;
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
