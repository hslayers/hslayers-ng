/**
 * @namespace hs.calendar
 * @memberOf hs
 */
define(['angular', 'moment'],
    function(angular, moment) {
    moment.locale('cs', {
        months : 'leden_únor_březen_duben_květen_červen_červenec_srpen_září_říjen_listopad_prosinec'.split('_'),
        monthsShort : 'led_úno_bře_dub_kvě_čvn_čvc_srp_zář_říj_lis_pro'.split('_')
    })
    angular.module('hs.calendar', [])
    
    .directive("calendar", function() {
        return {
            restrict: "E",
            templateUrl: "partials/calendar.html",
            scope: {
                selected: "="
            },
            link: function(scope) {
                scope.selected = _removeTime(scope.selected || moment());
                scope.month = scope.selected.clone();

                var start = scope.selected.clone();
                start.date(1);
                _removeTime(start.day(1));

                _buildMonth(scope, start, scope.month);

                scope.select = function(day) {
                    if (!scope.rangeContains(day.date)) return;
                    scope.selected = day.date;
                    var start = scope.selected.clone();
                    start.date(1);
                    _removeTime(start.day(1));
                    scope.month = scope.selected.clone();
                    _buildMonth(scope, start, scope.month);
                };
                
                scope.rangeContains = scope.$parent.rangeContains;
                
                scope.next = function() {
                    var next = scope.month.clone();
                    _removeTime(next.month(next.month()+1)).date(1);
                    scope.month.month(scope.month.month()+1);
                    _buildMonth(scope, next, scope.month);
                };

                scope.previous = function() {
                    var previous = scope.month.clone();
                    _removeTime(previous.month(previous.month()-1).date(1));
                    scope.month.month(scope.month.month()-1);
                    _buildMonth(scope, previous, scope.month);
                };
                
                scope.$on('day.changed',function(e,day){
                    var wrapper = {};
                    wrapper.date = day;
                    scope.select(wrapper);
                });
            }
        };
        
        function _removeTime(date) {
            return date.hour(0).minute(0).second(0).millisecond(0);
        }

        function _buildMonth(scope, start, month) {
            scope.weeks = [];
            var done = false, date = start.clone(), monthIndex = date.month(), count = 0;
            while (!done) {
                scope.weeks.push({ days: _buildWeek(date.clone(), month) });
                date.add(1, "w");
                done = count++ > 2 && monthIndex !== date.month();
                monthIndex = date.month();
            }
        }

        function _buildWeek(date, month) {
            var days = [];
            for (var i = 0; i < 7; i++) {
                days.push({
                    name: date.format("dd").substring(0, 1),
                    number: date.date(),
                    isCurrentMonth: date.month() === month.month(),
                    isToday: date.isSame(new Date(), "day"),
                    date: date
                });
                date = date.clone();
                date.add(1, "d");
            }
            return days;
        }
    })
})
