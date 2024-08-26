var $container = document.getElementById('container');

var showOperateBtns = true; // 是否显示按钮
var forceNoOffscreen = true; //
var jessibuca = null;

function create() {
    jessibuca = new Jessibuca({
        container: $container,
        videoBuffer: 0.2, // 缓存时长
        isResize: true,
        text: "",
        loadingText: "",
        useMSE: false,
        debug: false,
        showBandwidth: showOperateBtns, // 显示网速
        operateBtns: {
            fullscreen: showOperateBtns,
            screenshot: showOperateBtns,
            play: showOperateBtns,
            audio: false,
            recorder: false
        },
        forceNoOffscreen: forceNoOffscreen,
        isNotMute: false,
    }, );

    jessibuca.onLog = msg => console.error(msg);
    jessibuca.onRecord = (status) => console.log('onRecord', status);
    jessibuca.onPause = () => console.log('onPause');
    jessibuca.onPlay = () => console.log('onPlay');
    jessibuca.onFullscreen = msg => console.log('onFullscreen', msg);
    jessibuca.onMute = msg => console.log('onMute', msg);
}

create();