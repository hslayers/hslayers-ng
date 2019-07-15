export default ['Core',
function (Core) {
    /**
    * @function togglePanelspace
    * @memberOf hs.mobile_toolbar.service
    * @params {} to_state
    * @description (PRIVATE) TODO
    */
    function togglePanelspace(to_state) {
        if (angular.isDefined(to_state)) {
            me.panelspace0pened = to_state;
        } else {
            me.panelspace0pened = !me.panelspace0pened;
        }
        Core.sidebarExpanded = me.panelspace0pened;
        if ($(".menu-switch.btn-mobile .icon-menu-hamburger")[0]) {
            $(".menu-switch.btn-mobile .icon-menu-hamburger").removeClass("icon-menu-hamburger");
            $(".menu-switch.btn-mobile .menu-icon").addClass(Core.sidebarRight ? "icon-menu-right" : "icon-menu-left");
        } else {
            $(".menu-switch.btn-mobile .menu-icon").removeClass(Core.sidebarRight ? "icon-menu-right" : "icon-menu-left");
            $(".menu-switch.btn-mobile .menu-icon").addClass("icon-menu-hamburger");
        }
        $(".panelspace, #toolbar, #map, #menu").toggleClass("panelspace-opened", me.panelspace0pened);
    }

    var me = {
        panelspace0pened: false,
        togglePanelspace: togglePanelspace
    };
    return me;
}
]