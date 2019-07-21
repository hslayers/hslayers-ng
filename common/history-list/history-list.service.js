export default ['$cookies', function ($cookies) {
    var me = this;
    /** 
     * items is a dictionary/cache of various history lists. 
     * It is populated from history.directive by readSourceHistory function 
     * and then appended by addSourceHistory function
    */
    me.items = {};
    
    me.readSourceHistory = function (forWhat) {
        var sourceString = $cookies.get(`last${forWhat}Sources`);
        if (angular.isDefined(sourceString)) {
            me.items[forWhat] = uniq(JSON.parse(sourceString));
        } else {
            me.items[forWhat] = [];
        }
        return me.items[forWhat]
    }

    function uniq(a) {
        return a.sort().filter(function (item, pos, ary) {
            return !pos || item != ary[pos - 1];
        })
    }

    me.addSourceHistory = function (forWhat, url) {
        if (angular.isUndefined(me.items[forWhat])) me.items[forWhat] = [];
        if (me.items[forWhat].indexOf(url) == -1) {
            me.items[forWhat].push(url);
            $cookies.put(`last${forWhat}Sources`, JSON.stringify(me.items[forWhat]));
        }
    }

    return me;
}]