export default function () {
  const ctrl = this;

  ctrl.endpoint = angular.isDefined(ENDPOINT) ? ENDPOINT : '';

  ctrl.curImg = 0;

  ctrl.changeSlide = function(n) {
    ctrl.curImg = (ctrl.curImg + ctrl.images.length + n) % ctrl.images.length;
    document.querySelectorAll('.hs-preview-column')[ctrl.curImg].scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'nearest'});
  }
};
