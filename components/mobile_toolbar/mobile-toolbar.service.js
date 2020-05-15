import layoutService from "../layout/layout.service";

export default ['HsCore', 'HsLayoutService',
function (HsCore, layoutService) {
    /**
    * @function togglePanelspace
    * @memberOf HsMobileToolbarService
    * @params {} to_state
    * @description (PRIVATE) TODO
    */
    function togglePanelspace(to_state) {
        if (angular.isDefined(to_state)) {
            me.panelspaceOpened = to_state;
        } else {
            me.panelspaceOpened = !me.panelspaceOpened;
        }
        layoutService.sidebarExpanded = me.panelspaceOpened;
        if ($(".menu-switch.btn-mobile .icon-menu-hamburger")[0]) {
            $(".menu-switch.btn-mobile .icon-menu-hamburger").removeClass("icon-menu-hamburger");
            $(".menu-switch.btn-mobile .menu-icon").addClass(layoutService.sidebarRight ? "icon-menu-right" : "icon-menu-left");
        } else {
            $(".menu-switch.btn-mobile .menu-icon").removeClass(layoutService.sidebarRight ? "icon-menu-right" : "icon-menu-left");
            $(".menu-switch.btn-mobile .menu-icon").addClass("icon-menu-hamburger");
        }
        $(".hs-panelspace, .hs-toolbar, .hs-ol-map, #menu").toggleClass("panelspace-opened", me.panelspaceOpened);
    }

    var me = {
        panelspaceOpened: false,
        togglePanelspace: togglePanelspace
    };
    return me;
}
]