/**
* Replace Urls in text by anchor html tag with url, usefull for attribution to be clickable
* @function addAnchors
* @param {String} url String to look for Urls
* @returns {String} Text with added anchors 
*/
export function addAnchors(url) {
    if (!url) return null;
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return url.replace(exp, "<a href='$1'>$1</a>");
}