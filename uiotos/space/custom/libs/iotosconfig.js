//中台后端
hostname = "203.189.6.3:8081"
iotos_host = "http://" + hostname;
ws_host = "ws://" + hostname;

//业务后端
/*默认为前端地址，可以修改任意指定IP:PORT
示例1："sys.aiotos.net"
示例2："203.189.6.3:9004" */
api_host = window.top.origin

//编辑模式用
if(!window._i_runningTime){
    //240815，为了避免显得一堆代码好复杂，这里对没绑定的，用空函数。有绑定iot变量的用封装了的函数作为默认调用！
    //组态变量绑定时的变量数据转换函数
    //240419，第二个参数改成oldData，原先图元对象node改成放到第三个参数!
    function __iotosParsing(rawData, oldData, node){
        try {
            let t = rawData.dev_info,
                dev = t && t.split("——");
            let name = rawData.name,
                id = rawData.data_id,
                pk = rawData.data_pk,
                devName = dev && dev[0],
                devId = dev && dev[1],
                rw = rawData.rw,
                tm = rawData.tm,
                ts = rawData.ts,
                _type = rawData.val_type,
                _value = rawData.val;
            if (_value === undefined) _value = rawData;
            return _value;
        } catch (err) {
            console.error(err);
            return rawData;
        }
    }
    function transformFilter(nVal, oVal, node) {
        /*参数1  nVal: 属性新值 */
        /*参数2  oVal：属性旧值 */
        /*返回 return：最终赋值  */
        /********* TODO **********/



        /************************/
        return nVal;
    }
    function transformFilterIot(nVal, oVal, node) {
        /*参数1  nVal: 属性新值 */
        /*参数2  oVal：属性旧值 */
        /*返回 return：最终赋值  */
        /********* TODO **********/

        //默认采用iotos解析规则。
        nVal = __iotosParsing(nVal,oVal,node);
        

        /************************/
        return nVal;
    }

    //240815，屏蔽掉之前里带有try-catch的，显得太复杂！这里就不用异常捕捉了！
    //查询返回的数据进行解析
    // function formParser(rawData, node) {
    //     try {
    //         /********* TODO **********/



    //         /************************/
    //         return rawData;
    //     } catch (err) {
    //         console.error(err);
    //         return rawData;
    //     }
    // }
    function formParser(nVal, node) {
        /*参数1  nVal: 属性新值 */
        /*返回 return：最终赋值 */
        /********* TODO **********/



        /************************/
        return nVal;
    }

    //230330
    function paramsGenerator(data, val, index, node, oldVal, form) {
        //绑定组索引对应的函数处理，用来动态生成复杂的参数变量传入
        switch (index) {
            case 0:
                break;
            case 1:
                break;
            case 2:
                break;
            default:
                break;
        }
        return val;
    }

    /*240602，为了让运行时部署，依赖的js都隐藏起来，使用时方便一句话就调用，因此将iotosCommon.min.js拆分出iotosEngines.min.js，
    并且在里面做了一个initRuntime*/
    (() => {
        // 定义一个函数来创建和添加脚本
        function loadScript(url, callback) {
            // 创建新的<script>元素
            var script = document.createElement('script');
            script.async = false;
            script.src = url;
            
            // 监听脚本的load事件
            script.addEventListener('load', function() {
                // 执行回调函数，表示脚本已经加载完成
                callback();
            });

            // 将脚本添加到文档中
            document.head.appendChild(script);
        }

        // 定义依赖的脚本URL列表
        var scriptUrls = [
            //240718，markdown相关的js，在editormd.js实例化md对象时，就已经根据配置的path路径且按照先后依赖顺序进行加载了，不需要手动都平均这里去加载一遍！因此可以删除了！
            /*240715，发现这里markdown相关的几个js，需要放到前面，而不是追加到末尾，否则发现对于拖放一个树表格，直接运行，发现表头会动一下！！往下动一下回弹！非常难以排查！！对比
            不同版本文件后，发现这就是几句位置引起的！！！放到这里前面，就没那个问题了！！*/
            "custom/libs/mqtt.min.js",

            "custom/libs/config.js",
            'libs/htiotos.js',
            "kernel/iotosCommon.js",
            "kernel/iotosEngines.js",
            "kernel/baseControls.js",
            "custom/libs/AccordionTree.js",
            "custom/libs/advanceControls.js",
            "custom/libs/TreeDropDown.js",
            "custom/js/zkys.js",
            "custom/libs/stacktrace-2.0.2.js",
            "custom/libs/eruda.min.js",
            "custom/libs/StackManager.js",
            "custom/libs/easing.js",
            "custom/js/jumpMap/geomUtil.js",
            "custom/js/jumpMap/nameMap.js",
            "custom/js/jumpMap/images.js",
            "custom/js/jumpMap/mapParser.js",
            "custom/libs/aiotos.js ",
            "custom/libs/CreateNodeInteractor.js"
        ];

        //231219，传入相对路径的js，根据浏览器url的get参数中的ip或debug，补全其通过指定IP（如果有）后的js url。
        function getUrlOverIpParam(url) {
            /*240330，将下面window.top.location.search改成了window.location.search，否则就会导致iframe加载当前页面时，如果iframe所在的是其他网站，跨域了，
            那么这里用window.top就是获取到上层域的，而无法获取到iframe的src传入进来的url参数！因此不能用window.top.xxx，改成window.xxx*/
            var urlParams = new URLSearchParams(window.location.search);
            var ip = urlParams.get('debug') || urlParams.get('ip');

            /*240208，为了让浏览器能够指定js版本，方便使用当前大包中的其他js副本测试，避免每次都得很重地去压缩、解压等方式的备份！
            现在支持这样的请求：http://localhost:8999/index.html?ip=localhost:8999&ver=iotosCommon.min%20copy%2011.js，即
            加载指定ip和端口复位下的iotosCommon.min copy 11.js版本代替默认的iotosCommon.min.js版本！！注意，ip后面的端口可省！*/
            let ver = urlParams.get('ver'),
                urlBak = url, //备份一下
                fileName = url.split('/').slice(-1)[0].slice(0, -3); //从"custom/libs/iotosCommon.js",获取"iotosCommon.min",
            if (ver && ver.indexOf(fileName) == 0) { //如果名称为"iotosCommon.min copy 13.js"这种传过来的开头部分包含了文件名称。
                url = urlBak.replace(fileName + '.js', ver);
                console.error('============ WARN：version for debugging', url, '============');
            }

            return (ip ? 'http://' + ip + (ip.indexOf(':') != -1 ? '' : ':8999') : window.location.origin) + '/' + url;
        }

        // 依次加载脚本
        function init() {
            var url = scriptUrls.shift();
            if (url) {
                url = getUrlOverIpParam(url);
                loadScript(url, function() {
                    // 所有依赖脚本都已经加载完成，可以执行代码了
                    init(); // 递归加载下一个脚本
                });
            }
        }
        init();
    })();
}