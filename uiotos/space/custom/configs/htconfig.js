function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = decodeURI(window.location.search).substr(1).match(reg); //匹配目标参数
    if (r != null) {
        return unescape(r[2]);
    }
    return null; //返回参数值
}

function setconfig(light = false) { //默认为dark风格模式，传入true为浅色模式
    window.htconfig = {
        Color: {
            background: (() => {
                return light ? '#fff' : '#333'
            })(),
            titleBackground: '#20252e', //'#20252e', //'#076186',     //最后面dialog-container设置透明了，现在对话框背景就是title的背景了！！
            titleIconBackground: 'white',
            headerBackground: '#DAECF4'
        },
        Default: {
            baseZIndex: -1,
            zoomMax: 1000,
            // pinchZoomIncrement: 1.08,
            labelColor: '#ddd',
            overviewContentBackground: '#20252e',
            dialogContentBackground: '#1f252d',
            widgetBackground: '#20252e',
            disabledBackground: 'rgb(255,255,255)',
            toolTipDelay: 200,

            /*230406，实际点击发现弹起onClick有延时，通过目录关键词搜索发现ht.js中有clickData相关处理默认为200，跟toolTipDelay关键词一起，那么就是起的这个作用！
            但实测发现这里无效，而通过ht.Default.clickDelay = xxx配置则有效！*/
            // clickDelay: 3000, 

            toolTipContinual: true,
            toolTipLabelColor: '#000',
            toolTipLabelFont: '12px arial, sans-serif',
            toolTipBackground: 'rgba(255,255,255,1)',
            toolTipShadowColor: 'rgba(61,61,61,0.5)',
            // contextMenuLabelColor: '#ddd',
            // contextMenuBackground: '#222',

            contextMenuBackground: 'rgba(224,224,224,0.3)',
            contextMenuLabelColor: 'rgba(224,224,224,0.8)',
            contextMenuHoverBackground: 'rgb(28,161,251,0.8)',
            contextMenuHoverLabelColor: 'rgba(224,224,224,0.8)',
            contextMenuCheckIcon: 'checkIcon',
            contextMenuRadioIcon: 'radioIcon',

            //230204，奇怪，为什么编辑状态下分割线/分隔线颜色没变化？
            contextMenuSeparatorColor: 'rgba(245,165,200,0.75)',

            contextMenuScrollerBorderColor: 'rgba(145,165,200,0)',
            contextMenuBorderColor: 'rgba(145,165,200,0)',

            dialogButtonBackground: 'rgb(231, 76, 60)',
            dialogButtonSelectBackground: 'rgb(196, 65, 51)',
            dialogButtonLabelColor: '#fff',

            // hoverDelay: 0,

            convertURL: function convertURL(url) {
                var storagePrefix = '';
                if (storagePrefix && url && !/^data:image/.test(url) && !/^http/.test(url) && !/^https/.test(url)) {
                    url = storagePrefix + '/' + url;
                }
                // append timestamp
                url += (url.indexOf('?') >= 0 ? '&' : '?') + 'ts=' + Date.now();
                // append sid
                var match = window.location.href.match('sid=([0-9a-z\-]*)');
                if (match) {
                    window.sid = match[1];
                }
                if (window.sid) {
                    url += '&sid=' + window.sid;
                }
                return url;
            }
        }
    };

    //默认的dialog对话框CSS样式：
    function __$styleInject(css, ref) {
        if (ref === void 0) ref = {};
        var insertAt = ref.insertAt;

        if (!css || typeof document === 'undefined') {
            return;
        }

        var head = document.head || document.getElementsByTagName('head')[0];
        var style = document.createElement('style');
        style.type = 'text/css';

        if (insertAt === 'top') {
            if (head.firstChild) {
                head.insertBefore(style, head.firstChild);
            } else {
                head.appendChild(style);
            }
        } else {
            head.appendChild(style);
        }

        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }
    }

    //对话框dialog弹出遮蔽层颜色、透明度
    __$styleInject(".dialog-overlay{\
        background: rgba(0, 0, 0, 0.4) !important;\
    }", {});
    //对话框dialog内容区背景颜色、透明度
    __$styleInject(".dialog-container > div:nth-child(1){\
        background: rgba(17, 17, 17, 0) !important;\
    }", {});
    //对话框dialog整体透明度、宽高等样式
    __$styleInject(".dialog-container{\
        opacity:0.8 !important;\
    }", {});
    //对话框dialog下方按钮区域背景色、透明度
    __$styleInject(".dialog-container-buttons{\
        background:rgb(50,60,80) !important;\
    }", {});

    // __$styleInject(".separator{\
    //     margin:1px 0px 1px 0px !important;\
    // }", {});

}

setconfig()