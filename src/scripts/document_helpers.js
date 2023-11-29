

function getWindowDimensions(document, window) {
    var windowHeight = 0;
    var windowWidth = 0;

    if ((document.documentElement) && (document.documentElement.clientHeight))
        windowHeight = document.documentElement.clientHeight;
    else if ((document.body) && (document.body.clientHeight))
        windowHeight = document.body.clientHeight;
    else if ((document.body) && (document.body.offsetHeight))
        windowHeight = document.body.offsetHeight;
    else if (window.innerHeight)
        windowHeight = window.innerHeight;

    if ((document.documentElement) && (document.documentElement.clientWidth))
        windowWidth = document.documentElement.clientWidth;
    else if ((document.body) && (document.body.clientWidth))
        windowWidth = document.body.clientWidth;
    else if ((document.body) && (document.body.offsetWidth))
        windowWidth = document.body.offsetWidth;
    else if (window.innerWidth)
        windowWidth = window.innerWidth;

    return {width: windowWidth, height: windowHeight};
}

export { getWindowDimensions };