    //231219，传入相对路径的js，根据浏览器url的get参数中的ip或debug，补全其通过指定IP（如果有）后的js url。
    function getUrlOverIpParam(url, withoutOrigin = false) { //240602，默认都要带上http://ip:port头！
        var urlParams = new URLSearchParams(window.location.search);
        var ip = urlParams.get('debug') || urlParams.get('ip');
        let ver = urlParams.get('ver'),
            urlBak = url, //备份一下
            fileName = url.split('/').slice(-1)[0].slice(0, -3); //从"custom/libs/iotosCommon.min.js",获取"iotosCommon.min",
        if (ver && ver.indexOf(fileName) == 0) {
            url = urlBak.replace(fileName + '.js', ver);
            console.error('============ WARN：version for debugging', url, '============');
        }

        return (ip ? 'http://' + ip + (ip.indexOf(':') != -1 ? '' : ':8999') : (withoutOrigin ? '' : window.location.origin)) + '/' + url;
    }
    //240602，从iotosconfig中移过来！定义一个函数来创建和添加脚本
    function loadScript(url, callback) {
        if (!isScriptLoaded(url)) {
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
        } else {
            callback();
        }
    }
    //240602，判断某个js是否被加载
    function isScriptLoaded(url) {
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src === url) {
                return true;
            }
        }
        return false;
    }
    //240602，根据脚本的名称匹配，获取其url（绝对地址的）。支持传入.js后缀或者不传！
    function getScriptURL(scriptName) {
        if (scriptName.slice(-3) !== '.js') scriptName = scriptName + '.js';
        const scripts = document.getElementsByTagName('script');
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src.slice(-scriptName.length) === scriptName) {
                return scripts[i].src;
            }
        }
        return undefined;
    }

    //240602，运行时初始化
    function initRuntime(callback) {
        let scripts = document.getElementsByTagName('script'),
            curScriptName = 'iotosEngines.js',
            srctmp = '';
        for (let i = 0; i < scripts.length; i++) {
            if (scripts[i].src.slice(-curScriptName.length) === curScriptName) {
                srctmp = scripts[i].src;
                break;
            }
        }
        window._i_runningTime = true; //241023，运行环境标记
        const scriptUrls = [
            'custom/libs/iotosconfig.js',
            'custom/configs/htconfig.js',
            'custom/libs/jquery.js',
            'custom/libs/layui/layui.js',
            'custom/libs/ajax.js',
            'custom/libs/echarts.js',
            'custom/libs/hotkeys.min.js',
            'custom/libs/key.js',
            'custom/libs/lodash.core.min.js',
            'custom/libs/json-cycle.js',
            'custom/libs/md5.js',
            'custom/libs/handlebars.js',
            'custom/libs/easing.js',
            'custom/js/zkys.js',
            'custom/json/color.js',
            'custom/libs/htiotos.js',
            "custom/libs/advanceControls.js",
            'kernel/iotosCommon.js',
            'kernel/baseControls.js',
            'custom/libs/aiotos.js',
            'custom/libs/TreeDropDown.js',
            'custom/libs/mqtt.min.js',
            'custom/libs/CreateNodeInteractor.js',

            "custom/libs/markdown/codemirror/codemirror.min.js",
            "custom/libs/markdown/marked.min.js",
            "custom/libs/markdown/prettify.min.js",
            "custom/libs/markdown/flowchart.min.js",
            "custom/libs/markdown/jquery.flowchart.min.js",
            "custom/libs/markdown/katex.min.js",
            "custom/libs/markdown/raphael.min.js",
            "custom/libs/markdown/sequence-diagram.min.js"
        ];

        //230602，从iotosconfig.js中移过来！依次加载脚本
        function __loadJs() {
            let url = scriptUrls.shift();
            if (url) {
                url = getUrlOverIpParam(url, true);
                //240907，相对路径修改为'/../..'，这样kernel目录与custom目录平级
                loadScript(url.indexOf('http') != -1 ? url : (srctmp + /*'/../../..'*/'/../..' + (url[0] == '/' ? '' : '/') + url), function() {
                    // 所有依赖脚本都已经加载完成，可以执行代码了
                    __loadJs(); // 递归加载下一个脚本
                });
            } else {
                callback && callback();
            }
        }
        __loadJs();
    }

    //所有图纸初始加载的统一处理
    function commonInitDisplayLoaded(dm, url = null, gv = null) { //240709，增加参数传入gv，为了让编辑、运行时，所以图元组件都能直到自己的gv是什么！！
        //存放每个图纸加载时dm对应的url
        if (url) dm._url = url;

        //对于连线统一处理，没有TAG标签的，编辑运行都显示，有TAG标签的，运行时不显示！
        let fillCount = 0,
            fillTags = [],
            runModeTmp = runningMode(),
            baseNodeTmp = i.baseNode(dm),
            isBaseLayMode = baseNodeTmp && !dm.a('fitContent'), //241015，底板布局模式！
            topDataTmp = !runModeTmp && i.topData(dm), //240614，顶层图元，看是否是编辑时的运行对话框！
            isTopDlgEditorRunning = topDataTmp && i.isDialogEditorRunning(topDataTmp);
        let datastmp = dm.toDatas().toArray();
        datastmp.forEach((item, idx) => {
            item._i_gv = gv; //240709，增加参数传入gv，为了让编辑、运行时，所以图元组件都能直到自己的gv是什么！！

            //240710，对于运行状态下，需要对非渲染元素的初始化监听！
            if (runModeTmp) {
                //240710，需要加上这段，这样加载时，也能响应！
                if (
                    item.ca('trackPathPercent') !== undefined &&
                    item.ca('hasNoSymbolOrigin') && //避免渲染元素有i.md的也进来。造成两次响应！！
                    i.hasAttrInLocalObj(item, 'trackPathPercent')
                ) {
                    item.dm().md(e => {
                        if (e.data === item) {
                            switch (e.property) {
                                case 'a:trackPathPercent':
                                    i.setTrackPercentAsHost(item, e.newValue);
                                    break;
                            }
                        }
                    });
                }
            }
            if ((runModeTmp || (i.upperData(item) && !i.upperData(item).s('2d.editable'))) && item.getClassName() == 'ht.Edge' && item.getTag() && !dm.a('runningVisible')) { //231116，添加条件 && !dm.a('runningVisible')，页面勾选后，运行时不再不可见！
                //230318，增加条件，通过toolTip中固定的提示格式，以及或者连线的箭头图标中包含fromArrow，判断时交互操作连线这类才运行不可见！
                //240410，架上条件if (!(item.getClassName() == 'ht.Edge' && item.ca('topoLine'))) {，这样让“拓扑连线”在运行时保持继续可见！
                if (!(item.getClassName() == 'ht.Edge' && item.ca('topoLine') && item.getSource() && !i.hasAttrInLocalObj(item.getSource(), 'trackPathPercent'))) {
                    if ((item.s('icons') && i.ify(item.s('icons')).indexOf('fromArrow') != -1) || item.getToolTip() && item.getToolTip().indexOf('config_tooltip') != -1) item.s("2d.visible", false);
                }
            } else
            if (isTopDlgEditorRunning && item.getClassName() == 'ht.Edge') {
                //240614，编辑时，容器加载，如果顶层图元是对话框，而且是运行对话框，那么当前内嵌页的交互连线就不显示！！比如连线属性操作面板、收藏面板等，避免显示怪怪的！
                item.s('2d.visible', false);
            }

            /*备份图纸初始的尺寸大小，对于图纸运行状态调用i.upload后，有铺满设置后，编辑状态重新加载后背景就行尺寸会变化！
            230131，调用i.upload运行试时保存时，对图纸背景铺满的图元，备份原始编辑状态下的尺寸，避免被设置！*/
            if (
                item.s('fullscreen') == 'fill' //注意：默认只有1个全屏填充的情况，否则数据会异常！
                /* && dm.originalRect == undefined */ //230204，从loadDisplay中合并过来了，不过那里在230131，有这句，好像是没用，先屏蔽，待观察是否有BUG
            ) {
                if (item.getWidth && item.getHeight) {
                    dm.originalRect = item.getRect();
                    fillCount += 1;
                    //记录有多个全屏属性的图元TAG
                    fillTags.push(item.getTag() + '|' + item.getId());
                    dm.size() > 1 && !i.hasAttrObjectKey(item, 'bindControlsTag') && i.addAttrRunningInit(item, 's:2d.selectable', false);
                } else {
                    console.assert(0);
                }
            }

            /*230204，因为现在编辑状态对于布局，都会影响到文字提示，为了避免仅仅在编辑状态下用的提示在运行状态下也被看到，也为了差异显示，不是通过gv全局打开或关闭，
            这里在图纸遍历找fill图元的遍历中，做整个图元都需要的一些公共属性设置，比如这里的提示。*/
            if (runModeTmp && !dm.a('runningVisible')) { //如果需要图元能够运行时展示toolTip，那么增加a属性下toolTip，并且设置true即可！
                if (item.getName() == 'tip') {
                    let oldToolTips = item.ca('toolTipRaw') ? item.ca('toolTipRaw') : item.getToolTip();
                    oldToolTips = oldToolTips ? _i.replaceAll(oldToolTips, window.constLayoutedHintString, '') : '';
                    //兼容对旧的toolTip布局提示
                    if (oldToolTips && oldToolTips.indexOf(window.constLayoutedHintString_pureText) != -1) {
                        oldToolTips = oldToolTips ? _i.replaceAll(oldToolTips, window.constLayoutedHintString_pureText, '') : '';
                    }
                    if (oldToolTips && !!oldToolTips.trim()) {
                        // item.ca('toolTip', true); 组件中有暴露出属性来配置
                        item.setToolTip(oldToolTips);
                    }
                }
                if (!item.ca('toolTip') && item.getToolTip()) {
                    /*避免调用i.upload时，该属性被保存到图纸中，影响到编辑状态了！*/
                    item._saveIngored = [{
                        attr: 'p:toolTip',
                        //230819，加上item.ca('toolTipRaw') ? item.ca('toolTipRaw')，主要是为了避免运行时显示会自动去掉布局信息，导致可能通过i.upload保存到了页面中！
                        oldValue: item.ca('toolTipRaw') ? item.ca('toolTipRaw') : item.getToolTip(),
                        newValue: null
                    }];
                    //赋空，或重写data.getToolTip = () => null，只是重写在某些场合需要动态切换使能、禁止时，恢复是个问题，还需要备份原有实现
                    //230213，为了避免对应用平台3D图纸设置冲突，这里特别加上如果toolTip内容的末尾刚好是".json"，那么就不处理！如果后续不注意可能引起BUG，临时这么约定！
                    (item.getToolTip().slice(-5) != '.json') && item.setToolTip(null);
                }

                //231108，如果是注释文字，运行状态下不可见！
                if (item && item.s && item.s('label') && item.s('label.opacity') != 0 && item.s('label.font') && item.s('label.font').indexOf('26px') != -1) {
                    i.addAttrRunningInit(item, 's:label.opacity', 0);
                }else if(
                    item && item.s && item.s('label') == undefined && item.getName() != undefined
                ){
                    i.addAttrRunningInit(item, 's:label.opacity', 0);
                }
            }
            let data = item,
                basetmp = url && i.baseNode(data.dm(), !(url.slice(-12) == 'welcome.json' || url.slice(-13) == 'welcomed.json'));
            if (
                basetmp &&
                i.isControlTyped(data, 'gv') &&
                data.getHost() == basetmp &&
                !i.isContainsInRect(data, basetmp)
            ) {
                data._i_isOutside = true;
                data._i_wtmp = data.getWidth();
                data._i_htmp = data.getHeight();
                data.setWidth(1);
                data.setHeight(1);
            }
            if (runModeTmp && !dm.a('runningVisible')) {
                let classType = (item.getClassName() == 'ht.UGrid' || item.getClassName() == 'ht.Grid' || i.typeMatched(item, 'grid'));
                if (i.isSimpleData(item) || classType) i.addAttrRunningInit(item, 's:2d.selectable', false);
                if (classType) {
                    if (item.ca('borderWidth') == 3 || item.ca('borderWidth') === undefined) i.addAttrRunningInit(item, 'borderWidth', 0);
                    //230612，如果网格布局是填充铺满fill的底板base，那么除了默认自动被设置成不可选中外，其子节点要开放可选中，否则无法交互！
                    item.eachChild(child => {
                        child.s('2d.selectable', true);
                    })
                }
                let constList = ['func', 'api', 'bus', 'timer'];
                //230602，为了兼容此前拖放入页面项目的图元，图元data没有name属性，而displayName加上了tag后已经不是纯粹的func、api、bus等。因此由绝对匹配，改成包含！
                constList.forEach(typed => {
                    if (i.typeMatched(item, typed) || item.ca('_hideWhenRun')) { //230811，对于图元，attrObject属性'_hideWhenRun'为true时，编辑可见，运行时隐藏！
                        /*230811，发现设置成0不行，经过测试发现甚至小于0.5，就被当成0了，会导致像visible为false一样，无法触发进入到渲染元素。以嵌套的定时器触发随机数测试的。
                        因此，将宽高设置成0.5像素（被四舍五入作为1像素处理？），那么内嵌组件的渲染元素就能触发进入了，恰好也肉眼难辨，即便未做布局出现在界面的某个位置上。*/
                        i.addAttrRunningInit(item, 'p:height', 0.5);
                        i.addAttrRunningInit(item, 'p:width', 0.5);
                        i.addAttrRunningInit(item, 's:opacity', 0);
                        if (item.getHost() && i.isControlTyped(item.getHost(), 'grid')) item.setHost(null);
                        //240315，还存在底板上做了布局的图元组件，可能导致运行时布局改变原始设定的固定宽高，导致又变得可见，因此判断如果底板区域内有部剧的就移出布局配置！
                        if (i.isContainsInRect(item, baseNodeTmp)) {
                            i.addAttrRunningInit(item, 's:layout.h', undefined);
                            i.addAttrRunningInit(item, 's:layout.v', undefined);
                        }
                        item._i_dataNotUI = true;
                    }
                });
            }
            //     let popover = new ht.ui.Popover();
            //     popover.setContentView(htmlView);
            //     item._i_control && item._i_control.setPopover && item._i_control.setPopover(popover, 'click');
            // }

            /*241014，运行状态下，底板布局的页面，如果没有任何组件做布局，那么运行时全部默认居中布局（不影响编辑状态），这样页面窗口尺寸变化，都会相对编辑时相对位置居中，对于底板尺寸跟浏
            览器屏幕尺寸比例不统一时，方便看效果，也避免手动去布局（感觉有点复杂），对初学者更友好！*/
            //241017，加上条件!item._i_dataNotUI，否则发现新建页面背景等场景，运行时连线竟然可见！
            if(data.getHost && data !== baseNodeTmp && !item._i_dataNotUI && data.s('2d.visible') && isBaseLayMode && !data.getParent()){    //241015，加上!data.getParent()，主要是因为block这种存在，组合做布局，组合内的没且无需布局，存在这种情况！
                //241102，不是对话框，运行、编辑都默认自动布局；对话框时，运行模式下，不作自动布局，但是编辑状态下还是做，这样方便上层容器尺寸缩放嵌套能看到效果，避免初学者懵逼！
                if(!i.isControlTyped(data,'dlg') || !runModeTmp){
                    if(!data.getHost()) {
                        i.setDataAutoLayout(data,baseNodeTmp);
                    }
                }
            }
        });

        /*231017，所有组件属性变化时进入，相对于config.js中onAdded中对应的mdCbFunc监听不同，这里是兼容编辑和运行时都会触发，而config.js中的监听时编辑时的！
        为了起到编辑、运行时全局对所有组件的属性变化监听，可以给到i.installMemory()用！也即是说相关属性变化，那么表单等缓存就要更新了*/
        function __attrPropChanged(e) {
        }
        if (dm._i_attrPropChanged) dm.umd(dm._i_attrPropChanged); //避免编辑状态下重加载，导致多次重复进入和监听！！
        dm.md(__attrPropChanged);
        dm._i_attrPropChanged = __attrPropChanged;

        //230131，调用i.upload运行试时保存时，对图纸背景铺满的图元，备份原始编辑状态下的尺寸，避免被设置！
        if (fillCount > 1) console.error('node fill background setting error!!! only support one to be set,but given', fillCount, url, fillTags.join(','));

        //230225，运行模式下，存放到全局dm到window，对于全局弹窗等“静态”方法，少一个传参更方便！
        if (runningMode()) window._i_rootDM = i.rootDataModel(dm);

        //231228，主要是让初始编辑加载或者运行加载都能进入，对页面json做简化后的还原预处理。目前commonInitDisplayLoaded只是运行时进入，因此再加个工具函数，让编辑时加载进入！
        i.commonInitDisplay(dm, url);
    }

    //第2个参数时图元是否可以拖动，第三个参数有原来的stopPropagation改为了allowAllPropagation，控制可选中的组件是否允许冒泡
    function initGVLoadedRunning(gv, controlsMovable = false, allowAllPropagation = false, url = null) {
        if (gv == undefined) {
            console.error('gv undefined!')
            return;
        }
        const g2dView = gv.getView();
        g2dView.style.left = '0';
        g2dView.style.right = '0';
        g2dView.style.top = '0';
        g2dView.style.bottom = '0';

        //240927，url可能是完整url，比如'http://localhost:8999/displays/demo/3-示例/02-小示例/03B-视频选择播放暂停.json'，在示例中点击示例图标打开URL时是这样！因此去掉头给到url，否则dm._url也是http开头了！
        url = url && url.replace(window.origin + '/','');
        commonInitDisplayLoaded(gv.dm(), url, gv); 

        /*240815，对于内嵌页是底板布局，上层容器设置了适配内容，结果因为先底板已经布局了，加载完成后再改适配，导致缩放比例跟原始适配内容不一样，不美观！
        因此加载时就判断，如果上层已经设置了适配内容，那么不论如何，当前作为内嵌页，设置为适配内容，不要底板！！这样就不会加载时还来一下底板布局！*/
        //240817，对于上层为tab页签的不能这么来，因为内嵌页可能有的是fitContent，有的是fullscreen。
        let uppertmp = i.upperData(gv);
        if(uppertmp && i.baseNode(gv,false) && uppertmp.ca('innerLayoutMode') == 'fitContent' && !i.isControlTyped(uppertmp, 'tab')){
            gv.dm().a('fitContent',true);
            let basetmp = i.baseNode(gv.dm(), false);
            if (basetmp) {//参见240815中gvtmp.dm()._i_propChanged的处理！
                basetmp.s('fullscreen', undefined);
            }
        }

        /*运行状态下的图纸，极少被允许像编辑状态那样的选中时样式，固定写死*/
        // 选中边框为0
        gv.getSelectWidth = () => 0;
        // 禁止鼠标缩放
        if (!gv.dm().a('zoomable')) gv.handleScroll = () => {};
        // 禁止平移
        gv.setPannable(gv.dm().a('pannable'));
        // 禁止框选
        gv.setRectSelectable(gv.dm().a('rectSelectable'));

        // 禁止 touch 下双指缩放
        gv.handlePinch = () => {};
        // 隐藏滚动条
        gv.setScrollBarVisible(controlsMovable); //图元能移动，默认就不隐藏滚动条了！
        // 禁止图元移动
        gv.setMovableFunc(() => controlsMovable);
        gv.disableToolTip();
        let isGetContentRect = gv.getContentRect;
        gv.getContentRect = function() {
            //240725，这里重写gv.isVisible，主要是对于运行时，适配内容fitContent时，对于运行时隐藏的图元组件，不要计算区域！但是htiotos.js中的判断，在这里调用之后，完整加载完毕之前，因此这里重写下！
            let isVisibleOrigin = gv.isVisible;
            gv.isVisible = data=>{
                if((gv.dm()._url && runningMode() && i.isDataRunningInvisible(data)) || data.ca('_hideWhenRun')) return false;
                //240725，注意，重写类的方法时，需要用methodBak.call(obj,param)，而不是methodBak(param)！！因为类的方法依赖类的其他成员！！！
                else return isVisibleOrigin.call(gv,data); 
            }
            let result = isGetContentRect.call(gv); //240725，注意，类的方法重写，需要bakup.call(obj,param)这样，不能bakup(param)这样！！
            gv.isVisible = isVisibleOrigin;
            return result;
        },

        /*嵌套图纸，需要对mousedown特别处理，否则真实的弹起事件会不响应，而是在按下时响应*/
        gv.mi((e) => {
            const {
                kind,
                data
            } = e
            if (kind == 'onDown') { //tips 240410，对于矢量组件图元，点击可以进入到kind为onDown，
                /*再次优化，对于内嵌图纸的背景矩形，通过全屏填充来识别，不论其是否设置“可选中”都不会截获消息停止冒泡，免配置！
                图元设置可选中，且并非全屏填充和组合图元，同时也没有传入允许全部都冒泡参数，这种图元的事件点击，就停止冒泡！*/
                if (data.s('fullscreen') != 'fill' && data.getClassName() != 'ht.Block' && allowAllPropagation == false) {
                    e.event.stopPropagation();
                }
            }
        });
    }

    //需要有字符串数组属性"bindTabview"，第一个是tabView的tag标签，第二个是当前页，属性默认固定为'index'
    function setBindTabviewIndex(data, bindTabview) {
        if (!data.dm()) {
            console.error('WARN: dataModel of data', data, 'is null!!');
            return;
        }
        let bindtmp = bindTabview;
        if (bindtmp != undefined) {
            let tabViewTag = bindtmp[0], //关联tabView的Tag标签名
                indexSelect = bindtmp[1]; //第几页
            //240304，加上条件&& indexSelect >= 0，默认改为-1，因为可能同时有连线！实测发现，连线和tabBind同时发生，会导致切换异常！
            if (tabViewTag != undefined && indexSelect != undefined && indexSelect >= 0) {
                if (data.ca('bindControlsTag') && data.ca('bindControlsTag').indexOf('tab1') !== -1 && data.ca('bindControlsAttr') && data.ca('bindControlsAttr').indexOf('index') !== -1) {
                    console.error(`icon image button has been lined to tab1, and will ignore tabBinding!`);
                    return;
                }
                tabViewObj = data.dm().getDataByTag(tabViewTag);
                //240304，加上条件&& (tabViewObj.ca('displays').length > Number(indexSelect) && Number(indexSelect) >= 0)，避免当前有他存在tab1的页签，但是页数不够导致调测按钮组等报错！
                if (tabViewObj && (tabViewObj.ca('displays').length > Number(indexSelect) && Number(indexSelect) >= 0)) {
                    tabViewObj.a('index', Number(indexSelect)); //tabView-ui固定识别index属性！
                }
            }
        }
    }

    //属性赋值
    function updateForce(node, attr, value, type = 'a', ignoreNotifyUpper = false, setUbcQueued = false) {
        if (i.hasInner(node)) {
            /*240208.2，因为存在如果其他地方做了动态加载反弹结果把自己缓存的值在加载完成时给触发消耗掉了，等到自己显示并重加载反弹时反而没有存放的子弹了！！
            因为缓存操作缓存的是updateForce，因此得到那里面处理，利用这里封装的条件判断！
            当对话框勾选了运行加载，且目前为不可见状态，且被赋值的为非show属性，那么也需要缓存操作，否则对话框重加载时，就会把本次值冲掉！*/
            if (
                (
                    node.ca('isLoadingGet') ||
                    !i.hasInnerSymbolInited(node) && ( // 240303，之前条件里只有!hasInnerSymbolInited()，下面&&是新加的，
                        !i.isControlTyped(node, 'dlg') ||
                        node.ca('reloadWhenOpen')
                    ) ||
                    i.isDialogAttrUpdateNeedCache(node, attr)
                ) && (
                    attr != 'display' &&
                    attr != 'a:display' &&
                    /*240228，存在模板容器display继承到上层，上层去动态赋值的情况！否则比如编辑状态下在上层动态设置继承的display，会触发这里操作缓存！在加载完
                    成后又来下发，导致死循环闪动！*/
                    (!attr || attr.slice('-9') != 'a:display')
                )
            ) { //231217，容器组件初始化设置内嵌页加载时，就不要异步了，直接同步操作！
                if (!attr || i.isKeyURL(attr)) { //240108，加上条件!attr，对于表单操作，attr为null时，isKeyURL会报错，直接放过，里面有作if(!attr) return
                    //231211，改用下面的实现方式，闭包来备份函数，需要用的地方，不需要考虑传参，直接无参数调用即可恢复这里的入口调用
                    function __updateForcing(func, node, attr, value, type, ignoreNotifyUpper) {
                        // 返回一个新的函数，该函数将原始函数和参数作为闭包存储起来  
                        return function() {
                            // 在备份函数内部，可以访问原始函数和参数  
                            return func(node, attr, value, type, ignoreNotifyUpper);
                        };
                    }
                    let topDataTmp = i.topData(node);
                    if (!topDataTmp._i_formValueUpdateForcings) topDataTmp._i_formValueUpdateForcings = [];
                    /*主要是为了formValue、formReset，依旧无属性表单操作时要用到，否则赋值极可能被内嵌反弹的属性值冲掉！form绑定不会被冲掉，不用这里操作
                    都可以，不会受影响，不过还是不做区分，都放入里面来处理，即便重复赋值，因为值相同，也不会导致重复触发应该！*/
                    topDataTmp._i_formValueUpdateForcings.push({
                        node: node,
                        __updateForcing: __updateForcing(updateForce, node, attr, value, type, ignoreNotifyUpper)
                    });
                    if (!attr) return;
                    else {} //231212，不能都return掉，否则发现初始内嵌页面都不加载了！！
                }
            }
        }

        //230912，结合赋值表单操作连线（操作空属性，反向关联）
        if (attr == null) {
            let errorInfo = 'form data init to ' + node.getTag() + ' error!! value should be object or string typed object,but given：' + value;
            if (typeof(value) == 'string') {
                try {
                    value = JSON.parse(value);
                } catch (error) {
                    console.error(errorInfo);
                    return;
                }
            }
            /*目前先只支持容器嵌套，对于底层基础组件，以及容器组件的基础属性，虽然也可以做属性别名，暂时先不支持。
            如果要支持，需要用到：i.getDisplayBindingItem(data, keyURLtmp)['alias']*/
            if (isObject(value)) {
                if (node.ca('pureFormValues')) { //1）对于formValues模式，key-value，先转换成keyURL-value，再来转换成各个属性赋值
                    //230918，formValues的别名字段跟返回数据的字段做比对，如果有字段并没有返回数据的对应，那么就弹窗提示！
                    let formValuestmp = i.getFormValues(node),
                        formFieldExists = i.keys(formValuestmp),
                        dataFieldRecved = i.keys(value),
                        formLackedFields = [];
                    //240131，试图提高性能！
                    i.forEach(formFieldExists, field => {
                        if (dataFieldRecved.indexOf(field) == -1) formLackedFields.push(field);
                    });
                    let checkIgnored = value._i_attrsCheckIgnored,
                        showErrCheckingDlg = true; //是否显示校验錯誤的对话框
                    //1）没有字段_i_attrsCheckIgnored时，缺失字段都会加入到校验后的弹窗提示中！
                    if (!checkIgnored) showErrCheckingDlg = true;
                    //2）有列表但是里面有包含*时，表名忽略所有字段的校验弹窗提示
                    if (checkIgnored && checkIgnored.length > 0 && checkIgnored.indexOf('*') != -1) showErrCheckingDlg = false;
                    //3）空列表时忽略所有字段的校验提示
                    if (checkIgnored && checkIgnored.length == 0) showErrCheckingDlg = false;
                    //4）校验錯誤原本要提示的字段列表，剔除掉忽略数组中的（如果剔除后就空了那么不弹窗）
                    let lackedFieldAfterRemoved = i.clone(formLackedFields);
                    //240131，试图提高性能
                    checkIgnored && i.forEach(formLackedFields, item => {
                        if (checkIgnored.indexOf(item) != -1) i.arrayItemRemoved(lackedFieldAfterRemoved, item);
                    });

                    //231210，调整提示
                    //showErrCheckingDlg && lackedFieldAfterRemoved.length > 0 && i.alert('存在表单字段并无返回数据对应：' + lackedFieldAfterRemoved.join(','), '警告');
                    if (showErrCheckingDlg && lackedFieldAfterRemoved.length > 0) {
                        console.error('WARN:', '存在表单字段并无返回数据对应：' + lackedFieldAfterRemoved.join(','));
                    }

                    //230921，去掉了convertToFlatJson，貌似没必要，因为传入的值要么是别名后的字段key-value，要么是keyURL-value，已经是扁平化后的。
                    //240125，将下面valFlat = value改成valFlat = i.clone(value)，避免把原始的value值通过引用修改了！因为同一个value可能连线操作到多处，如果引用修改，必然导致不同连线的操作，先后用到的传入value不同了！！
                    let valFlat = i.clone(value), //convertToFlatJson(value, '#'),   
                        formValue2KeyURL = node._i_keyURL2FormValueTag ? i.reverseJson(node._i_keyURL2FormValueTag) : {};

                    /* 231030，对于结构化表单和数据，相对路径别名的情况，单独先处理！：
                    appCoreFacialRecord/company: "人员出入记录-详情>0>company>a:value"
                    appCoreFacialRecord/personnelName: "人员出入记录-详情>0>personnelName>a:value"
                    appCoreFacialRecord/personnelType: "人员出入记录-详情>0>personnelType>a:value"
                    appCoreFacialRecord/state: "人员出入记录-详情>0>state>a:value"
                    cmccGeneralDto/gender: "人员出入记录-详情>0>gender>a:value"
                    cmccGeneralDto/identityNum: "人员出入记录-详情>0>identityNum>a:value"
                    cmccGeneralDto/phone: "人员出入记录-详情>0>phone>a:value"
                    floor#value: "人员出入记录-详情>0>floor>a:value"
                    */
                    let hasDone = [];
                    //1）结构化相对路径别名的处理
                    for (let keyInfo in formValue2KeyURL) {
                        if (keyInfo.indexOf('/') != -1) {
                            hasDone.push(keyInfo);
                            let valtmp = i.stepValue(valFlat, keyInfo, '/'),
                                attrtmp = formValue2KeyURL[keyInfo];
                            //231101，为了兼容内嵌表单页的属性别名有多个重复的情况，此时表单操作赋值，会对这一个或多个相同别名字段的属性，都会对实际组件属性进行赋值！
                            if (!isArrayFn(attrtmp)) attrtmp = [attrtmp];
                            attrtmp.forEach(attrSingle => {
                                updateForce(node, attrSingle, valtmp, 'all', false, true); //231222，加上末尾参数setUbcQueued为true，让连线逻辑放到执行之后，让连线逻辑放到属性赋值的下一个队列去
                            });
                        }
                    };

                    //2）其他非结构化字段的处理
                    for (let key in valFlat) {
                        let targetKey = null,
                            keyIndex = i.keys(formValue2KeyURL).indexOf(key);
                        /*tips 230926，formValue2KeyURL数据key-value示例如下所示：
                            accountState#indexValue: "添加-滚动页>0>scroll2>a:添加>0>accountState>a:indexValue"
                            boss#value: "添加-滚动页>0>scroll2>a:添加>0>boss>a:value"
                            departName#value: "添加-滚动页>0>scroll2>a:添加>0>departName>a:value"
                            deviceIds#datas: "添加-滚动页>0>scroll2>a:添加>0>deviceIds>a:datas"
                            gender#selectedID: "添加-滚动页>0>scroll2>a:添加>0>gender>a:selectedID"
                            id#value: "添加-滚动页>0>scroll2>a:添加>0>id>a:value"
                            identityNum#value: "添加-滚动页>0>scroll2>a:添加>0>identityNum>a:value"
                            jobNumber#value: "添加-滚动页>0>scroll2>a:添加>0>jobNumber>a:value"
                            jobTitle#selectedID: "添加-滚动页>0>scroll2>a:添加>0>jobTitle>a:selectedID"
                            leader#indexValue: "添加-滚动页>0>scroll2>a:添加>0>leader>a:indexValue"
                            name#UserName: "添加-滚动页>0>scroll2>a:添加>0>name>a:value"
                            personId#value: "添加-滚动页>0>scroll2>a:添加>0>personId>a:value"
                            phone#value: "添加-滚动页>0>scroll2>a:添加>0>phone>a:value"
                            picture#value: "添加-滚动页>0>scroll2>a:添加>0>picture>a:headProtrait>0>path>a:value"
                            portal#value: "添加-滚动页>0>scroll2>a:添加>0>portal>a:value"
                            selectedRoles#idValues: "添加-滚动页>0>scroll2>a:添加>0>selectedRoles>a:idValues"
                            superiorDeptName#value: "添加-滚动页>0>scroll2>a:添加>0>superiorDeptName>a:value"
                        */

                        /*230926，指定属性keyURL经过_i_attrsCommonAccess的key-value处理。主要是一出keyURL最后一段得到底层图元，然后将_i_attrsCommonAccess
                        里的key加到末尾，作为底层图元的某个公共属性来处理，发现如果属性存在，那么用value对其赋值。*/
                        function __attrsCommonAccess(keyURL, valueFroced = undefined) {
                            if (!keyURL) return;
                            if(node.ca('formReadOnly') &&　!value._i_attrsCommonAccess){
                                value._i_attrsCommonAccess = {
                                    'readOnly': true,
                                    'disabled': false
                                }
                            }
                            for (let commonKey in value._i_attrsCommonAccess) {
                                if (commonKey == '__upper') continue;
                                //tips 230926，提取formValue表单属性的keyURL，将末尾属性换成_i_attrsCommonAccess里的，相当于对表单组件数值属性之外的其他属性按照配置赋值。
                                let keytmp = keyURL.split('>').slice(0, -1).join('>') + '>' + i.autoPrefixed(commonKey),
                                    //230926，有传入指定值时用指定值，没有传入时，用_i_attrsCommonAccess里key对应的value
                                    valtmp = valueFroced === undefined ? value._i_attrsCommonAccess[commonKey] : valueFroced;

                                /*230927，如果配置的值为undefined，那么相当于默认表单初始配置的读写方式，不会强制成只读尤其是可读写，避免原本是只读下拉列表，通过编辑状态打开*/
                                let bottomNodeTmp = i.bottomData(node,keytmp),
                                    bottomAttrTmp = i.bottomKeyURL(keytmp);
                                if((i.isControlTyped(bottomNodeTmp,'cbox') || i.isControlTyped(bottomNodeTmp,'range')) && commonKey == 'disabled') valtmp = true;
                                _i.setTimeout(() => {
                                    valtmp !== undefined && updateForce(bottomNodeTmp, bottomAttrTmp, valtmp);
                                }, 0);
                                // i.hasAttrObjectKey(node, keytmp) && _i.setTimeout(() => {
                                //     /*230927，如果配置的值为undefined，那么相当于默认表单初始配置的读写方式，不会强制成只读尤其是可读写，避免原本是只读下拉列表，通过编辑状态打开
                                //     反而成了可编辑的了！要保持原来默认的读写方式，只要限制updateForce不把当前的表单key-value向下赋值即可！*/
                            }
                        }

                        if (keyIndex != -1) { //属于formValue绑定后对应的名称字段
                            targetKey = Object.values(formValue2KeyURL)[keyIndex]; //直接匹配到时
                            if (isArrayFn(targetKey)) {
                                targetKey.forEach(attrSingle => {

                                    __attrsCommonAccess(attrSingle);    

                                    updateForce(node, attrSingle, valFlat[key], 'all', false, true); //231222，加上末尾参数setUbcQueued为true，让连线逻辑放到执行之后，让连线逻辑放到属性赋值的下一个队列去
                                });
                                continue; //对于这种，单个赋值处理即可，跳过循环后半部分的处理，continue，直接进行下一个
                            }else{
                                __attrsCommonAccess(targetKey);    
                            }
                        } else { //没有直接匹配到时，通常是因为只有一个属性做了formValue绑定，此时不体现属性名或别名，只有tag，中间以#隔开！
                            let fieldMatchedIndex = [], //比如从field1#AAA中提取field1
                                formValueKeyURLVals = i.values(formValue2KeyURL);
                            i.keys(formValue2KeyURL).forEach((keyInfo, idx) => { //tips 230926，xxx.yyy:keyURL中，xxx是否有匹配到多个
                                if (hasDone.indexOf(keyInfo) != -1) return; //231030，在前面单独对结构化处理后的，过滤掉！
                                if (keyInfo && keyInfo.split('#')) {
                                    let keytmp = keyInfo.split('#')[0];
                                    if (keytmp == key) {
                                        fieldMatchedIndex.push(idx);
                                    } else if (keytmp.trim() == key.trim()) {
                                        i.alert(`表单操作比较已自动忽略空格差异：${keytmp}，${key}\n操作组件：${node.getDisplayName()}\n操作属性：${formValueKeyURLVals[idx]}\n页面地址：${node.dm()._url}`, '警告', false, null, null, [360, 240]);
                                        fieldMatchedIndex.push(idx);
                                    } else if (keytmp.trim().toLowerCase() == key.trim().toLowerCase()) {
                                        i.alert(`表单操作比较已自动忽略大小写差异：${keytmp}，${key}\n发生组件：${node.getDisplayName()}\n操作属性：${formValueKeyURLVals[idx]}\n页面地址：${node.dm()._url}`, '警告', false, null, null, [360, 240]);
                                        fieldMatchedIndex.push(idx);
                                    }
                                }
                            });
                            if (fieldMatchedIndex.length > 1) i.alert('表单数据字段错误：' + fieldMatchedIndex, '错误');
                            else {
                                targetKey = Object.values(formValue2KeyURL)[fieldMatchedIndex[0]];
                                /*230926，默认值为undefined时，_i_attrsCommonAccess里用key对应的value，而如果属性不论是formValue对应的字段名还是属性keyURL，
                                只要在_i_attrsAlwaysForbid列表中有，那么就是指定要禁用，对_i_attrsCommonAccess中字段key的值固定设置为true，使能只读、禁用等！*/
                                let valForced = (value._i_attrsAlwaysForbid && value._i_attrsAlwaysForbid.indexOf(key) != -1) ? true : undefined;
                                //tips 230921，存在配置'_i_attrsCheckIgnored'字段true时，不校验提示！作为'_i_attrsCommonAccess'的补充！
                                __attrsCommonAccess(targetKey, valForced);
                            }
                        }
                        if (targetKey == null) {
                            /*240117，如果连线表单赋值操作，关联属性有误，尤其是容器组件的form表单属性，keyURL-value形式的，带有display、a:display，那么就报错！
                            否则出现BUG现象诡异，发现页面被关联组件的内嵌页面给代替了！*/
                            if (i.hasInner(node) && (key == 'a:display' || key == 'display')) {
                                i.alert(`表单操作赋值失败！表单数据存在页面地址属性（display）会导致页面被切换，请检查数据或关联属性是否有误！` + _i.commonTip(node), '错误', false, null, null, [480, 320]);
                                return;
                            }

                            if (i.hasAttrObjectKey(node, key)) {
                                console.error('WARN: form key', key, 'not be found in formValue2KeyURL,and will be used directly!');
                                let valForced = (value._i_attrsAlwaysForbid && value._i_attrsAlwaysForbid.indexOf(key) != -1) ? true : undefined;
                                __attrsCommonAccess(targetKey, valForced);

                                //230926，属性keyURL-value，让其值设定生效
                                targetKey = key;
                            } else if (i.isKeyURL(key)) {
                                //231006，根据keyURL获取底层图元，发现获取的是中间层并非底层时，getBottomByKeyURLFailed为true
                                let foundTag = i.bottomData(node, key)._tagToUpper,
                                    getBottomByKeyURLFailed = key.split(foundTag).at(-1).indexOf('>') != -1;
                                i.alert(`表单操作中，组件“${node.getDisplayName()}”没有keyURL属性“${key}！${getBottomByKeyURLFailed ? '获取底层图元组件失败！（' + foundTag + '）':''}”`, '错误');
                                targetKey = key;
                            }
                        }
                        targetKey && updateForce(node, targetKey, valFlat[key], 'all', false, true); //231222，加上末尾参数setUbcQueued为true，让连线逻辑放到属性赋值的下一个队列去
                    }
                    return;
                } else { //2）对于非formValues模式，对象或者对象的字符串，直接拆成key-value，转换成各个属性的赋值
                    //240821，之前有对于单个组件非容器嵌套时，获取表单（包括支持别名）的数据，现在还要支持直接对单个组件表单赋值，操作多个属性，也支持别名的情况！
                    let hasInnerTmp = i.hasInner(node),
                        valToKeyTmp = {};
                    hasInnerTmp && i.alert(`表单操作是否忘记勾选pureFormValues?\n` + i.nodeLogInfo(node), '警告', false, null, null, [360, 240]);
                    if(!hasInnerTmp){
                        /*240821，注意，这里获取表单数据，并非用，而是仅仅为了初始化属性node._i_keyURL2FormValueTag。然后颠倒key和value。注意，这里没有仔细测试各种情况，
                        只对别名../xxx，../yyy，../zzz这种形式的处理，此时对应的key为属性attr标识，value为各自别名xxx、yyy、zzz，注意，测试发现此时没带../，因此颠倒下给
                        下面对遍历传入表单对象时用！*/
                        i.getFormValues(node);
                        for(attr in node._i_keyURL2FormValueTag){
                            valToKeyTmp[node._i_keyURL2FormValueTag[attr]] = attr;
                        }
                    }
                    console.error(`WARN: pureFormvalues attr has not been checked in data ${node.getDisplayName()} whlie form setting with empty attr. page dir: ${node.dm()._url}`);
                    for (let key in value) {
                        //240821，加上hasInnerTmp ? key : valToKeyTmp[key]代替之前的key，这样对于非容器，直接表单操作时，能够也支持别名！！
                        updateForce(node, hasInnerTmp ? key : valToKeyTmp[key], value[key], null, false, true); //231222，加上末尾参数setUbcQueued为true，让连线逻辑放到执行之后，让连线逻辑放到属性赋值的下一个队列去
                    }
                    return;
                }
            } else if (value) { //230926，可能传入的是undefined，此时不处理即可！
                console.error(errorInfo);
                return;
            } else return;
        }
        if (attr.slice(1, 2) == ':') { //230218，兼容type不传，而传入attr为带前缀的full模式
            type = attr.slice(0, 1);
            attr = attr.slice(2);
        }

        //230812，根据数据绑定，自动识别未传入标识a/s/p的，哪个值存在，自动采用对应的标识。
        let prefixtmp = type == 'all' ? 'a' : type,
            bindingsList = node.getDataBindings(),
            db = null;
        if (bindingsList) {
            if (type == null || type == 'all') { //没有传入type时，会根据数据绑定中的变量自动识别变量名称是否存在且对应的类型是什么
                let foundtmp = false;
                //判断属性的数据绑定是否存在，存在则按照实际存在的自动识别出没有给出的前缀
                function __typeReChech(typeFlag) {
                    if (bindingsList[typeFlag] && bindingsList[typeFlag][attr]) {
                        prefixtmp = typeFlag;
                        db = bindingsList[typeFlag][attr];
                        if (foundtmp) console.error('dataBindings attr predix duplicated!!', node.getTag(), attr, bindingsList);
                        foundtmp = true;
                    }
                }
                __typeReChech('a'); //后面的权重更高，如果存在a/s/p重复名称，那么按照顺序以后者的为准，会覆盖！
                __typeReChech('s');
                __typeReChech('p');
            } else db = bindingsList[type] && bindingsList[type][attr]; //如果有传入type，那么指定type去匹配，不会自动去识别
            //走过滤函数
            if (db && i.isFormVarBind(db.id)) {
                if (db.func) { //函数字符串转成js函数：
                    let func = new Function('return ' + db.func)()
                    value = func(value, node); //230218，入参增加图元对象
                    //230327，加上日志打印，很多时候在属性变量绑定函数中观察值得进入情况，而进来不一定触发！可能不变！日志放到执行这里函数中，因为通常有这里函数执行的场景才会关心这条信息提示！
                    // if (i.getValue(node, attr, prefixtmp) == value) console.warn('newValue of', i.autoTag(node), 'has not been changed,and will not trigger attr md event!')
                }
            } else {
            }
        }

        let debugAfter = false;
        if (node && attr) {
            //对表单属性支持逐层上报赋值，逐层向上传递
            !node._i_isFormInitInnerFping && !ignoreNotifyUpper && i.innerNotifyUpper(node, prefixtmp + ':' + attr, value);
            let equaltmp = false;
            equaltmp = i.isEqual(i.getValue(node, attr, prefixtmp), value);
            //240207，值不相等时，表明是变化，需要逐层往上复位缓存！
            if (!equaltmp) {
                //240208，这块缓存如果不加，还会存在连线关联属性无法设置，选择关联属性后，并无法保持在属性窗口。
                i.upperDatas(node, true).forEach(data => {
                    data._i_cachedFormValue = undefined;
                    data._i_cachedFormDatas = undefined;
                });
            }
            if (isObject(value) && !i.hasLoopCycle(value, true)) {
                /*注意，data.ca()复制，如果是对象，容易成引用导致后面赋值都不会更新过去！但是如果将所有对象类型通过复制去掉引用后，又会导致值相同时也会触发！因为用==比较两个对象类型的实例，
                即便内容是一样，但是也会是false，这跟基本数据类型的比较不一样！因此这里专门处理对象类型的比较！*/
                if (equaltmp) {
                }
                //230701，tips：注意，对于userData属性，是否要特殊处理不能被copy？暂未深究和测试！！！
                value = i.copy(value);
            }

            //230921，用于做错误动态检查。不过这里与前面的 else if (node.getImage != null) {}貌似有点重复！！
            let bindTypeTmp = i.isFormVarBind(i.getDisplayBindingName(node, prefixtmp + ':' + attr)),
                isFormResetType = bindTypeTmp == 2 || bindTypeTmp == 3,
                nodeImage = node.getImage && node.getImage(),
                isImageObjected = typeof(nodeImage) === 'string' && !i.isUrl(nodeImage) && node.getImage && !i.getImage(nodeImage); //240226，通常为base64字符串！
            if (equaltmp && node.nodeImage && !isImageObjected && i.getBottomDefaultValue(node, attr) === undefined && isFormResetType) {
                console.warn('set value may occur error!! As value is the same', value, 'and attr is', attr);
            }
            //231218，清理刷新缓存！
            if (bindTypeTmp != 0) node._i_cachedFormDatas = undefined;

            /*231222，让被赋值的内嵌attr/keyURL对应的内嵌图元k设置标记_i_setUbcQueued，然后在连线触发时能够通过标记进行setTimeout(0)异步队列触发，主要是实现比如表单formValue赋值这种，让赋值先行，
            涉及内部连线逻辑的后行，确保内部连线逻辑用各自上层变量新值来触发！*/
            if (setUbcQueued && i.isKeyURL(attr)) {
                let innerNode = i.innerData(node, attr);
                //如果是keyURL，且keyURL对应的内嵌图元组件以及连线赋值配置都存在，那么就做上异步标记，让连线动作放到下一个事件队列中去。
                if (innerNode && innerNode.ca('bindControlsTag') && innerNode.ca('bindControlsTag').length > 0) {
                    innerNode._i_setUbcQueued = setUbcQueued; //标记_i_setUbcQueued的复位交给i.ubc调用的地方用到之后来！
                }
            }

            //231217，断点调试v1.0
            if (!i.window().debugCounts) i.window().debugCounts = 0;
            if (
                (node.a('_debugPointIn') && attr == 'inputs') ||
                (node.a('_debugPointOut') && attr == 'output') ||
                (node.a('_debugPointAttr') && (attr == (prefixtmp + ':' + node.a('_debugPointAttr')) || attr == node.a('_debugPointAttr'))) ||
                (node.a('_debugTriggerSend') && attr == 'triggerSend') || //240111，发送器执行发送
                (node.a('_debugTopicRecv') && attr == 'topicRecv') //240111，接收器主题接收
            ) {
                i.window().debugCounts += 1;

                console.error(`调试中：`, i.window().debugCounts, '→', node.getId(), node, `\n赋 值 前：------------------------`, `\n组件名称：${node.getDisplayName()} \n所在页面：${node.dm()._url} \n当前属性：${attr} \n待操作值：`, value, '\n调用堆栈：', new Error().stack);
                debugger;
                debugAfter = true;
            }
            i.setValue(node, prefixtmp + ':' + attr, value);
        } else {
            console.error(node, attr)
        }
        if (debugAfter) {
            console.error(`赋值后！`, i.window().debugCounts, '→', node.getId(), node.getDisplayName(), attr, value);
            debugger
        }
        return value; //230801，将最终设置的值（经过过滤函数的）返回出来
    }

    /*事件通用无代码点击绑定，包括按钮点击绑定处理、消息请求返回绑定处理
    其中controlsVal、response对应的参数，同时传（消息请求返回并解析对应组件）或同时不传（按钮点击默认返回）*/
    function setBindControls(data, controlsTag, controlsAttr, controlsVal = null, response = null, animationParam = [300], alwaysAnimHint = false, ignoreFlag = '~', valueOnly = false) {
        let destValues = [], //230607，获得值，主要是给“获取图元表单”工具函数使用
            isFuncData = i.isFuncTypeControl(data); //231130，对于工具函数单独处理
        controlsTag && controlsTag.forEach((tag, index) => {
            i.setArrayIndexValue(destValues, index, controlsVal[index]); //230607，获得值，主要是给“获取图元表单”工具函数使用
            if (controlsVal[index] === undefined || controlsVal[index] == ignoreFlag || controlsVal[index] == '!' + ignoreFlag) { //230124，对于经过paramsGenerator后（return直接返回时就是undefined）,值为undefined的就过滤不进行组件联动属性赋值！
                //230816，对于任意工具函数，输出是什么最终连线给到的赋值就是什么，不论是undefined、'~'还是什么。在bindControls中还有专门识别处理！对于ignoreFlag的，都被当做undefined输出！
                if (!isFuncData || controlsVal[index] == '!' + ignoreFlag) {
                    console.info(data.getTag(), "bindControls index", index, tag + ':' + controlsAttr[index], 'ignored!! current value:', controlsVal[index]);
                    return;
                } else controlsVal[index] = undefined;
            }
            let objtmp = get(data.dm(), tag);
            if (objtmp == undefined) {
                console.warn("tag',tag,' not fount！", data);
                return;
            }
            //231207，在i.updateBindControls中缓存的值，代替纯粹的i.getValue()避免重复算一遍！
            let bindOldAttrValTmp = objtmp && objtmp._i_attrValue && objtmp._i_attrValue[controlsAttr[index]],
                oldVal = bindOldAttrValTmp === undefined ? i.getValue(objtmp, controlsAttr[index]) : bindOldAttrValTmp,
                paramAttrIndexed = paramAttrFieldTmp = data.ca('paramControlAttr')[index],
                paramTagFieldTmp = data.ca("paramControlTag")[index];
            if (!paramTagFieldTmp) paramTagFieldTmp = data.getTag();
            paramAttrIsFuncOutput = isFuncData && paramAttrIndexed && paramAttrIndexed.slice(-8) == 'onOutput'; //如果是

            //230816，原先的i.indexAssure(controlsVal, index)对于undefined值会被转成null，因此加上逻辑判断，对于func工具函数，确保原样输出。
            //240220，加上条件|| controlsVal[index].trim() == ''，因为i.indexAssure(controlsVal, index)里面有用到.trim()，会将空字符串值' '改成''，导致出问题，比如输入框input_ui的空格值输出不出去！输出的都是''
            let controlIndexedVal = controlsVal[index];
            let valFieldTmp = controlsVal != undefined ? ((isFuncData || (typeof(controlIndexedVal) === 'string' && controlIndexedVal.trim() == '')) ? controlIndexedVal : i.indexAssure(controlsVal, index)) : undefined, //等同于controlsVal[index],
                //如果传入（或通过paramsGenerator）是对象object，那么就通过以下逻辑直接利用其，而不用response！千万注意，typeof(null)是等于"object"的！
                valIsObjectTmp = typeof(valFieldTmp) == 'object' && valFieldTmp != null;

            /*对于诸如show/requesting这种a:及bool类型的属性，如果初始传入controlsAttr为null且form为object非null时，value将被当做true来处理！省去配置1这步操作！如果要设定fase，
            则需要显式设定controlsVal的值，毕竟表单、按钮等bindControls，对bool类型属性赋值1才是操作的常态！
            tips 230419，前面有对undefined过滤：controlsVal[index] === undefined，所有undefined的都会被过滤掉！所以下面只需要判断==null就好包含了0、false，不需要判断===null*/
            let attrtmp = controlsAttr[index],
                bindedAttrValtype = i.getBindedAttrValueType(objtmp, attrtmp),
                rawControlVal = data._i_rawControlVals && data._i_rawControlVals[index]; //230927，放到这里，原始的静态解析赋值。

            //230816，对于任意工具函数，输出是什么最终连线给到的赋值就是什么，不论是undefined、'~'还是什么。在bindControls中还有专门识别处理！对于ignoreFlag的，都被当做undefined输出！
            //这里避免对undefined转换成了true
            if (!isFuncData || paramAttrIsFuncOutput) {
                if (valFieldTmp == null && response != null && typeof(response) == 'object' && bindedAttrValtype == 'Boolean') valFieldTmp = true;
            }

            //230902，将解析封装成了函数，下面要复用到。第三个参数可以默认不传，内部自动判断。
            //231016，增加参数keepRawWhileNotFound，当传入true时，若加息flatString在rawData中不存在，就用rawData，而不是默认用flatString。在第二次__parser中用到！
            function __parser(rawData, flatString, ifValObjectTmp = null, keepRawWhileNotFound = false, noCheckAlert = false) {
                if (ifValObjectTmp === null) ifValObjectTmp = (typeof(flatString) == 'object' && flatString != null);
                let retData = flatString ? flatString : rawData,
                    resJson = rawData, //JSON.parse(response)
                    rawDataObjNotFount = false;
                try {
                    if (typeof(resJson) == "object") { //对于字符串非json结构，不会到这里，会进入到异常；但是对于数值字符串，经过JSON.parse会变成number类型！
                        try {
                            //230925，将下面基础的统一成一处调用，而不是多个重复尝试，因为这个调用比较耗时貌似。此外是否有问题？convertToFlatJson应用返回修改了每次的resJson？？有待进一步测试！！
                            //240813，好像可以去掉i.hasLoopCycle(resJson, true)，因为用了i.stepValue，不管是否是循环引用的对象，都支持解析啊！尤其比如window。只有走stepValue，才能提取全局变量值，比如接收器返回的！！
                            let hasLoop = false;//i.hasLoopCycle(resJson, true),
                                //231016，如果传入noCheckAlert，那么久不提示校验解析失败的弹窗！尤其是对于第二次__parser，完全没必要！
                                normalParse = rawControlVal !== null && noCheckAlert == false; //230927，只有初始有传入静态解析赋值时，stepValue才有提取的意义，打印解析失败才有意义！
                            retData = ifValObjectTmp ? undefined : hasLoop ? undefined : i.stepValue(resJson, flatString, '>', normalParse); //230927，convertToFlatJson改成了i.stepValue，将极大提升性能
                            if (retData == undefined) { //自动兼容编辑器中用'.'间隔，但是默认都是'>'，因为属性名称很多带有'.'
                                retData = ifValObjectTmp ? undefined : hasLoop ? undefined : i.stepValue(resJson, flatString, '.', normalParse); //230927，convertToFlatJson改成了i.stepValue，将极大提升性能
                            }
                            if (retData == undefined) { //如果没有对应值，那么就把返回的数据当成是值的扁平化结构，并根据keyUrl（部分）去匹配获取，通常得到对象（剩余结构）！
                                retData = ifValObjectTmp ? undefined : hasLoop ? undefined : i.stepValue(resJson, flatString, '>', normalParse); //230927，i.flatValue改成了i.stepValue，将极大提升性能
                            }

                            //240622，好像跟上面有重复，看注释，前面之前是convertToFlatJson改成stepValue，下面这里是flatValue改成stepValue，都是stepValue了，如果retData是undefined，那是否重复了？？因此先去掉！！！！观察是否会引起BUG！！！！
                            if (retData == undefined) { //230212，同样，针对.也做下兼容！不需要严格绝对keyUrl对应，只需要对应前面的也就是到了某个节点，能获取到后面的对象、数组返回！
                            }

                            if (retData == undefined && //如果还没有，而且传入的valFieldTmp不为空，就用传入的valFieldTmp值！
                                flatString != undefined //注意，此时response是有传入值的！如果传入valFieldTmp值为空，传入的response也为空，那么就默认当成传入true
                            ) {
                                rawDataObjNotFount = true;

                                //231214，赋值解析提取不到时，直接返回undefined即可！不要给提取字符串，也不要给原对象！否则怎么知道提取不到呢？？？导致都没法判断对象内某个字段值是否存在！！
                                retData = flatString;

                                //230917，静态值解析赋值，如果传入的是文件，带有xxx.yyy，为了避免被语法规则识别为json解析字段，文件名的后缀枚举放加到这里！
                                let fileTypes = ['jpg', 'png', 'gif', 'json', 'mp4']; //230917，xxx.yyy，只要yyy属于这里枚举的，就不当做是解析！
                                //是否匹配到
                                function __hasIndexed(srcStr) {
                                    let found = false;
                                    fileTypes.forEach(item => {
                                        if (srcStr.indexOf(item) != -1) found = true;
                                    });
                                    return found;
                                }
                                if ( //230917，对于解析赋值有误的情况下，提示出来，方便排查，不过这里是运行时提示，编辑时因为数据不一定在因此不一定能排查出来！
                                    typeof(flatString) == 'string' && //1）解析赋值为字符串
                                    (
                                        (
                                            flatString.split('.').length > 1 &&
                                            !__hasIndexed(flatString.split('.')[1])
                                        ) || //2.1）根据.来识别至少有一级的结构，并且排除url
                                        i.isKeyURL(flatString) //2.2）或者是keyURL
                                    )
                                ) {
                                    let valFinalTry = undefined;
                                    if (hasLoop) {
                                        valFinalTry = i.stepValue(resJson, flatString, '.');
                                        if (valFinalTry === undefined) {
                                            valFinalTry = i.stepValue(resJson, flatString, '>');
                                        }
                                    }

                                    if (valFinalTry === undefined) {
                                        let filenametmp = urlName(data.dm()._url);
                                        if (filenametmp !== 'properties' && attrtmp && attrtmp.slice(0, 8) !== 'property') {
                                            //230928，如果最初就没有设置解析赋值，那么也不存在这里的解析！因此下面加上了开头条件：normalParse &&。 
                                            normalParse && i.alert((hasLoop ? '图元存在循环引用的js对象！' : '') + `“${filenametmp}”页面中组件“${data.getTag()}”操作“${tag}”的属性“${attrtmp}”时，解析赋值为：${flatString}\r\n在表单对象中不存在：\r\n${hasLoop ? '（图元或Window对象）' : i.ify(resJson)}`, '解析赋值可能有误', false, null, null, [320, 480]);
                                            hasLoop && console.error('value parsing not found!', 'object:', resJson, ' | ', 'step attr:', flatString);
                                        } else {
                                            console.error('WARN: bindControlsVal parsing in edgeline opened poperty dialog will be ignored!');
                                        }
                                    } else {
                                        console.error('WARN: window or node object parsed by stepValue successfully:', valFinalTry, ' | ', 'resJson: ', resJson, ',', 'flatString:', flatString);
                                        retData = valFinalTry;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                } catch (e) {
                    console.error(e);
                }

                //231214，赋值解析提取不到时，直接返回undefined即可！不要给提取字符串，也不要给原对象！否则怎么知道提取不到呢？？？导致都没法判断对象内某个字段值是否存在！！
                if (rawDataObjNotFount && keepRawWhileNotFound && retData == flatString) {
                    //231214，赋值解析提取不到且不是作为常数传递赋值的意图时，直接返回undefined即可！不要给提取字符串，也不要给原对象！否则怎么知道提取不到呢？？？导致都没法判断对象内某个字段值是否存在！！
                    retData = data.ca('parseFailedNull') ? undefined : rawData;

                }

                return retData;
            }

            /*允许Val值数组比Tag数组少，没有对应的就默认赋首个Val一样的配置
            兼容不传入bindControlsVal的情形，比如对话框等，触发默认传入值为True*/
            let datatmp = __parser(response, valFieldTmp, valIsObjectTmp, false, true);

            /*230816，对于任意工具函数，输出是什么最终连线给到的赋值就是什么，不论是undefined、'~'还是什么。在bindControls中还有专门识别处理！对于ignoreFlag的，都被当做undefined输出！
            对于工具函数，任何output的都直接输出给被连线操作的属性，即便是undefined，因此对于自动判断的转换逻辑都不走！*/
            let valtmp = valFieldTmp; //230816，貌似前面注释掉三元表达式改成if-else便于维护外，对valtmp漏掉了初始定义！补充上！！！
            /*231130，加上&& !paramAttrIsFuncOutput，也就是说对于工具函数关联的onOutput，不能当成跟output一样待遇，而是跟常规事件函数那样的处理，这样工具函数的onOutput连线操作对外，
            也要能带出表单数据！！*/
            if (!(isFuncData && !paramAttrIsFuncOutput && !!data.ca('paramControlAttr') && !!data.ca('paramControlAttr')[index])) {
                if (valFieldTmp != null) {
                    if (response != null) {
                        valtmp = datatmp; //情形1
                    } else {
                        valtmp = valFieldTmp;
                    }
                } else {
                    //230903，将上面条件改成，只要是valFieldTmp没有传入，不论response是不是null，都统一走下面逻辑，即判断操作属性是否而布尔！
                    if (
                        (oldVal && typeof(oldVal) == 'boolean') ||
                        (bindedAttrValtype && bindedAttrValtype.toLowerCase() == 'boolean')
                    ) {
                        valtmp = true; //情况2.2，【注意】好像跟上面2337行重复了！
                    } else if (response != null) { //230903，调整了下顺序逻辑
                        valtmp = response; //情形2.1
                    } else {
                        valtmp = oldVal; //情形4.2
                    }
                }
            }

            //240622，主要是连线关联属性为对象object时，赋值解析的字符串，就会用来解析这个对象，而不是仅仅被关联属性值覆盖掉！
            //240622，加上条件&& rawControlVal != ''，因为存在值为空字符串的情况''，比如连线属性弹窗的搜索框就是如此，如果进入到下面处理，会发现搜索过滤功能失效！
            if (typeof(rawControlVal) == 'string' /*&& rawControlVal != ''*/) {
                if (isFuncData && rawControlVal == ignoreFlag) {
                    //240622，工具函数过滤的情况（~会默认强制转换成undefined输出，而!~应该是不会到这里的！！）
                } else if (isObject(valtmp)) {
                    if (valFieldTmp === rawControlVal) { //230903，发现对于函数的反向关联，前面那个步骤valFieldTmp已经是bindControlVal了，相当于上一次已经获取到解析值了。这次就不做解析了，即便做也很可能报错！
                        console.warn('last generated value is the same as bindControlsVal,and will be ignored at this time', valtmp);
                    } else {
                        console.warn('parse again with', rawControlVal, 'from', valtmp);
                        /*240622，极为重要！修改这里的规则，之前是静态解析赋值，会被关联属性值覆盖掉，只有关联属性值是对象，而且能解析成功时，才会采用解析后的值，如果解析不了，就忽略静态赋值解析的配置。
                        现在是，解析赋值不了，就用静态值！而不是采用属性值了，避免属性赋值解析常数赋值和解析赋值规则不统一！*/
                        valtmp = __parser(valtmp, rawControlVal, null, /*true*/ false, true);
                        console.warn('parsed to', valtmp);
                    }
                } else if (
                    //240622，1）连线有设置解析赋值；2）并且经过一系列处理后，准输出值为非对象object类型
                    paramAttrIndexed //3）此外，有反向关联属性
                ) {
                    console.assert(rawControlVal != '!' + ignoreFlag); //240622，断言提示！不会有这种情况过来应该，直接前面忽略跳过连线执行了！
                    valtmp = rawControlVal;
                }
            } else if (typeof(rawControlVal) == 'object' && rawControlVal !== null || typeof(rawControlVal) == 'number' || typeof(rawControlVal) == 'boolean') {//240727，加上条件|| typeof(rawControlVal) == 'number'，对于非true/false、非负整数等数字，作为静态值输出！
                //240627，静态解析赋值，只要是对象（数组[]或对象{}），不论关联属性是什么，有没有关联，那么都是固定输出这个解析赋值对象！尤其是在关联了事件时，那么是在事件触发时输出这个指定的对象或数组！
                valtmp = rawControlVal;
            }else if(rawControlVal !== null && rawControlVal !== undefined && rawControlVal !== '') console.assert(0);

            //231204，从updateBindControls中拷贝过来的逻辑，主要是让这些逻辑用到赋值解析后的结果，比如输出合并发非覆盖
            { //下面原封不动，此前的逻辑。
                valFieldTmp = valtmp;
                let oldValTmp = oldVal,
                    oldValCloned3 = i.clone(oldValTmp), //230902，克隆给dbQueryToTreeTable的appendTo用。不用另两个clone，是为了兼容后面的oldValueMerge通用逻辑！
                    oldValCloned1 = i.clone(oldValTmp), //一个克隆值用于原始的操作属性值传入
                    oldValCloned2 = i.clone(oldValTmp); //另一个克隆值用于生成新的传入值

                //230901，对于树表dbQueryToTreeTable也存在追加的情况，动态插入子节点。
                function __isFuncDbQueryToTreeTable(node) {
                    return node.ca('function') == 'dbQueryToTreeTable' && node.getName() == 'func'
                }
                //231107，关联属性为底层为output或onOutput时
                let bottomKeyURL = i.bottomKeyURL(paramAttrFieldTmp), //231130，修改之前的=='a:output' || == 'a:onOutput'改成slice()比较不带a:的，因为底层直接连线操作时就不带a:
                    isCurrentParamAttrOutputTyped = bottomKeyURL && (bottomKeyURL.slice(-6) == 'output' || bottomKeyURL.slice(-8) == 'onOutput'),
                    isBottomFunc = false,
                    bottomFromNode = null;
                //231107，而且当前属性对应的底层组件确定为工具函数func类型时
                if (isCurrentParamAttrOutputTyped) {
                    bottomFromNode = i.bottomData(paramTagFieldTmp == data.getTag() ? data : d(data.dm(), paramTagFieldTmp), paramAttrFieldTmp);
                    isBottomFunc = i.isControlTyped(bottomFromNode, 'func');
                }
                //231107，兼容当前bottomFromNode本身就是底层或者上层工具函数func
                if (!bottomFromNode) bottomFromNode = data;

                //231204，变量objtmp、 attrtmp，分别代表control.obj、control.attr
                let control = {
                    obj: objtmp,
                    attr: attrtmp
                }

                if (
                    //1）tips 231107，如果当前图元为工具函数且是查询转树表
                    __isFuncDbQueryToTreeTable(data) ||
                    ( //2）231107，或如果当前属性对应底层图元为func工具函数并且是查询转树表时
                        isCurrentParamAttrOutputTyped &&
                        isBottomFunc &&
                        bottomFromNode &&
                        __isFuncDbQueryToTreeTable(bottomFromNode)
                    )
                ) {
                    /*231007，对treeTable树表操作时，自动对其columnFields属性进行覆盖，以自身的fields属性的值覆盖过去，省去连线操作，默认执行
                    并且由于索引相差一位，fields中的字段，都是从columnsFields/columnsWidth/colums字段索引为1开始对应的，因为默认id列不填充数据！*/
                    let bottomData = i.bottomData(control.obj, control.attr); //为了让该机制对于嵌套上层操作也能支持
                    if (bottomData && i.isControlTyped(bottomData, 'ttb') && control.attr && control.attr.slice(-5) == 'datas') {
                        let keyurltmp = control.attr.slice(0, -5) + 'columnFields';
                        control.obj.ca(i.np(keyurltmp), [null, ...bottomFromNode.ca('fields')]); //错位一个位置赋值，被错位的第一个元素填为null
                        console.error('WARN: automaticlly transfer value of fields to columnsFields of table by first index offsetting');
                    }

                    //节点追加时
                    //231222，将 != undefined改成了!!，避免空字符串""也进入！
                    if (!!bottomFromNode.ca('appendTo')) {
                
                        //240805，注意，这里不能i.clone()等，因为会去掉[{},[],{},{}]中数组内数组元素的.id = xx属性值！！只有内存可见，数据不可见的字段！！否则会导致下面i.getItemFromTreeTypedArray配对对应的找不到！
                        oldValCloned3 = oldValTmp;// i.copy(oldValTmp);
                        let appendToId = bottomFromNode.ca('appendTo'),
                            targetId = control.obj.ca('idField'),
                            targetItemNode = i.getItemFromTreeTypedArray(oldValCloned3, appendToId, targetId ? targetId : 'id', 'children', 'parent');    

                        if (targetItemNode) {
                            let childrentmp = /*keyChildrentmp ? keyChildrentmp : */'children';
                            if (targetItemNode[childrentmp] == undefined) targetItemNode[childrentmp] = [];
                            if (targetItemNode[childrentmp].length) i.alert('节点下已有' + targetItemNode[childrentmp].length + '条数据，将被覆盖！', '警告');
                            let newChildren = isArrayFn(valFieldTmp) ? valFieldTmp : [valFieldTmp]
                            if(isArrayFn(targetItemNode)) {
                                let idxtmp = targetItemNode._i_parent.indexOf(targetItemNode);
                                targetItemNode._i_parent[idxtmp]  = {
                                    rowData: targetItemNode
                                }
                                targetItemNode._i_parent[idxtmp][childrentmp] = newChildren;
                            }else{
                                targetItemNode[childrentmp] = newChildren;
                            }

                            targetItemNode._i_parent = undefined;
                            valFieldTmp = oldValCloned3; //230902，引用赋值修改的oldValClone3给到最新值。
                        }
                    }
                }
                if (data.ca('oldValueMerge') && data.getName() == 'func') {

                    /*231130，为了兼容旧的逻辑不动，那些工具函数没有更新，就不会自动加上新的stripSingleInput属性，因此继续走老的逻辑！通过判断
                    stripSingleInput属性是否有定义值（不是仅通过data.ca()保存值来判断），来确定是否是旧的“代码”，走兼容逻辑！*/
                    if (i.getValueUpperFormed(data, 'stripSingleInput') === undefined) {        
                        if (control.obj.getName() == 'func' && control.attr.slice(-6) == 'inputs') {
                            if (isArrayFn(oldValCloned1)) {
                                if (oldValCloned1.length == 0) oldValCloned1 = undefined; //空数组，则被当成undefined
                                else if (oldValCloned1.length == 1) oldValCloned1 = oldValCloned1[1]; //长度为1的数组，取出第一个数组的值
                                else { //本身是非空数组，那么就正常按照数组追加流程走！                                        
                                }
                            }
                        }     
                    }

                    //230813，对于通用的角度属性，不论是最底层还是嵌套暴露的，操作都会将值自动由角度做弧度转换，省去编辑器中对通用的这个属性操作还需要转换一层！
                    if (
                        (control.attr.length > 8 && control.attr.slice(-10) == 'p:rotation') ||
                        (control.attr.length == 8 && control.attr == 'rotation') //230813，注意，这里可能存在a:rotation的情况，根p:rotation冲突的BUG,咱不理会！
                    ) valFieldTmp = valFieldTmp * Math.PI / 180;

                    if (isArrayFn(oldValCloned1)) { //旧值为数组时，不论inputs输入是数组还是单个值，都整体追加到原数组上！
                        if (
                            isArrayFn(valFieldTmp) && //新值为数组
                            !(oldValCloned1.length > 0 && isArrayFn(oldValCloned1.at(-1))) //被操作值（旧值）为数组（包括空数组），且最后一个元素素并非数组类型（由其判断是否是数组的数组）
                        ) {
                            if (_i.isSubArraysAll(valFieldTmp)) { //如果新值非空数组且最后一个元素还是数组，由此判断其为数组的数组，此时现将其也做数组合并！类似于数字数组操作数字合并那样！
                                valFieldTmp = _i.mergeArrays(valFieldTmp);
                            }
                            oldValCloned1 = [...oldValCloned1, ...valFieldTmp]; //连同被操纵的旧值一起合并
                        } else {
                            oldValCloned1.push(valFieldTmp);
                        }
                        valFieldTmp = oldValCloned1;
                    } else if ((valFieldTmp !== undefined || isParamCtrlIsFunc) && valFieldTmp !== ignoreFlag) { //230809，对于连线操作过滤掉的，那也不进行对外操作了。
                        let newValTmp = valFieldTmp, //后面涉及对于数组类型输出，可能涉及数组各元素合并的情况，因此将设定值和旧值分别赋值存放。
                            typetmp = '', //如果是数组，那么获取数组元素统一类型（元素数量最多的类型）；非数组则是自身的值类型。
                            newValIsArrType = false; //231205，当前传入的就是数组类型
                        valFieldTmp = oldValCloned1;
                        if (oldValCloned1 === null || oldValCloned1 === undefined || i.isEqual(oldValCloned1, NaN)) {
                            typetmp = i.getArrItemsMostType(newValTmp);
                        }

                        //230809，如果传递到这里的值不是数组，那么自动当成数组来处理。
                        if (!isArrayFn(newValTmp)) newValTmp = [newValTmp];
                        else newValIsArrType = true;

                        //1）数字类型合并为相加。要么被操作值为非空的数字类型，要么操作值为空值且输入类型大多为数字类型。
                        if ((typetmp == '' && typeof(oldValCloned1) == 'number') || typetmp == 'number') {
                            newValTmp.forEach(inputVal => {
                                //下面不用 +=，而是再加一层MergedType转换，主要是考虑到被赋值操作的初始值原先为空的情况，那么相加需要转换类型！
                                valFieldTmp = i.toNumberMergedType(valFieldTmp) + i.toNumberMergedType(inputVal);
                            })
                        }
                        //2）字符串类型合并为追加。要么被操作值为非空的字符串类型，要么操作值为空值且输入类型大多为字符串类型。
                        else if ((typetmp == '' && typeof(oldValCloned1) == 'string') || typetmp == 'string') {
                            newValTmp.forEach(inputVal => {
                                //下面不用 +=，而是再加一层MergedType转换，主要是考虑到被赋值操作的初始值原先为空的情况，那么相加需要转换类型！
                                valFieldTmp = i.toStringMergedType(valFieldTmp) + i.toStringMergedType(inputVal);
                            })
                        }
                        //3）布尔bool类型合并为并集，即输入组整体转为布尔后，与原先被操作的值所有都在一起取或即并集操作！
                        //要么被操作值为非空的布尔类型，要么操作值为空值且输入类型大多为布尔类型。
                        else if ((typetmp == '' && typeof(oldValCloned1) == 'boolean') || typetmp == 'boolean') {
                            newValTmp.forEach(inputVal => {
                                //下面再加一层MergedType转换，主要是考虑到被赋值操作的初始值原先为空的情况，那么相加需要转换类型！
                                valFieldTmp = (i.toBooleanMergedType(valFieldTmp) || i.toBooleanMergedType(inputVal));
                            })
                        }
                        //4）对象（非数组）类型的合并为字段合并，即所有输入当成对象，跟原对象值一起做对象合并！包括数组的扁平化、合并、再结构化。 
                        //要么被操作值为非空的对象类型，要么操作值为空值且输入类型大多为对象类型（包括null也在之内）。
                        else if ((typetmp == '' && typeof(oldValCloned1) == 'object') || typetmp == 'object') {
                            /*231205，兼容下面的forEach，原始传入的数组，需要作为inputVal进行处理！相当于传入数组与对象合并时，会先将
                            数组转成对象，key为索引0、1、2*/
                            if (newValIsArrType) newValTmp = [newValTmp];

                            newValTmp.forEach(inputVal => {
                                //下面再加一层MergedType转换，主要是考虑到被赋值操作的初始值原先为空的情况，那么相加需要转换类型！
                                valFieldTmp = i.toObjectMergedType(valFieldTmp);
                                mergeJSON(valFieldTmp, i.toObjectMergedType(inputVal));
                            });
                        }
                    }
                }
                valtmp = valFieldTmp;
                if (
                    control.attr && (control.attr.slice(-11) == 'inputValues' || control.attr.slice(-11) == 'paramValues') && isArrayFn(valtmp) &&
                    (!oldValCloned3 || (oldValCloned3.length > 0 && oldValCloned3.length < valtmp.length))
                ) {
                    let errorInfo = `赋值操作异常，当前赋值数组长度：${valtmp.length}，大于键属性的长度：${oldValCloned3 && oldValCloned3.length}，需要保持一致避免被还原！通常由于jsonFormat或者inputs对象属性未初始赋值，或未设定足够的初始字段导致。${_i.commonTip(control.obj,control.attr)}\n`;
                    i.alert(errorInfo, '错误', false, null, null, [600, 400]);
                }
            }

            //230607，获得值，主要是给“获取图元表单”工具函数使用
            i.setArrayIndexValue(destValues, index, valtmp);
            if (valueOnly) return; //如果只是为了获取数据，那就不执行其他步骤了。

            let scaleBakTmp = null;
            try {
                scaleBakTmp = objtmp.getScale();
            } catch (error) {}

            //对于不传入controlsVal，默认为null时，根据上面这句那么是默认作为true，通常用于设置某个图元属性为true比如按钮触发对话框弹窗等，不需走动画避免连续多次赋值!
            if (typeof(valtmp) != 'boolean' && !isNaN(Number(valtmp, 10)) && alwaysAnimHint == false) { //确保数字滚动只给真实的返回数据使用，请求过程初始化则不进行数字滚动动画，取而代之是等待中过渡动画（sizeAnimRepeat）
                //临时创建图元遍历专门用来做数字滚动动画，不用objtmp，因为可能for循环中controlsTag多个其实是同一个图元对象，导致for中的动画先后异常！
                let animNodeTmp = null;
                let animcfg = { //随便以一个node节点data来设置动画！
                    trans: {
                        from: 0,
                        to: Number(valtmp, 10),
                        duration: animationParam[0], //数据滚动动画，只需要1个动画参数，即时间
                        easing: 'Linear', //'Cubic.easeOut'、'Linear'
                        onComplete: () => { //只要是用到动画，完成函数一定要设置，不能留空，否则容易开始或末尾发生异常，要么是duration为0时，值随机；要么是结束时，值不定上下浮动
                            i.updateForceByUBC(objtmp, iotos.indexAssure(controlsAttr, index), valtmp, 'all');
                            scaleBakTmp && objtmp.setScale(scaleBakTmp.x, scaleBakTmp.y);

                            //删除内存临时变量
                            if (animNodeTmp) {
                                animNodeTmp.setAnimation(null);
                                /*发现用objtmp.dm().removeDataById(animNodeTmp.getId())会报错：Uncaught TypeError: Cannot read properties of undefined (reading 'getAnimation')
                                dm中遍历list还会找它！改用delete，暂且先这样。隐藏有内存BUG，优化内存时需注意处理这里*/
                                delete animNodeTmp;
                            }
                            objtmp.setAnimation(null);
                        },
                        onUpdate(v) {
                            i.updateForceByUBC(objtmp, iotos.indexAssure(controlsAttr, index), Math.ceil(v), 'all'); //允许Attr值数组比Tag数组少，没有对应的就默认赋首个Attr一样的配置
                        },
                    },
                    start: ['trans']
                };
                //数据滚动动画时间延时为0时，直接显示，不进入动画机制，避免闪动
                if (animationParam[0] == 0 || animationParam.length == 0) { //对于数字，跟文字一样，如果参数空[]，那么就不做数字滚动
                    i.updateForceByUBC(objtmp, iotos.indexAssure(controlsAttr, index), valtmp, 'all');
                } else {
                    animNodeTmp = new ht.Node();
                    animNodeTmp.s('2d.visible', false);
                    objtmp.dm().add(animNodeTmp)

                    objtmp.dm().enableAnimation(); //注意，该动画函数首先需要dataModel开启动画！
                    animNodeTmp.setAnimation(animcfg); //不用objtmp，改用for循环中临时创建的图元变量，避免for循环中objtmp都是同一个对象，导致操作动画覆盖！
                }
            } else {
                if (animationParam.length == 0 || animationParam.length == 1 || alwaysAnimHint) { //0是data.a('noAnim')为true的时候
                    i.updateForceByUBC(objtmp, iotos.indexAssure(controlsAttr, index), valtmp, 'all');
                    objtmp.setAnimation(null); //需要停止动画，否则一直在跳动
                };
                alwaysAnimHint ? sizeAnimRepeat(objtmp, animationParam[0], animationParam[1]) : scaleBakTmp && objtmp.setScale(scaleBakTmp.x, scaleBakTmp.y); //请求等待动画，需要2个动画参数，时间和变化幅度
            }
        });
        //230607，返回最终值。主要在“获取图元表单”工具函数使用到
        return destValues;
    }

    function defineClass_DatabindingsImageDrawable() {
        //避免重复定义报错，该函数默认引用在iotosEngine.js中，如果不用该js，那么需要手动调用！即使多出手动调用，也避免重复定义而报错！
        if (typeof DatabindingsImageDrawable == 'function') return;

        //------------------------封装类的定义--------------------------------
        //构造函数除了传入关键的图标url，还要传入自定义的key-value，任意数量的数据绑定变量字段
        DatabindingsImageDrawable = function(url, attrsValues = {
            'icon-background': 'rgb(55,125,255)',
            'text': 'text'
        }) { //构造函数调用基类需传入this，同时注意实例化时是否有构造参数的传入！
            DatabindingsImageDrawable.superClass.constructor.call(this, url);
            this.attrsValues = attrsValues; //js对象加任意属性，供给类的成员方法访问很简单，直接.xxx=yyy赋值即可！
        }
        ht.Default.def("DatabindingsImageDrawable", ht.ui.drawable.ImageDrawable, {
            draw: function(x, y, width, height, data, view, dom) {
                let self = this, //成员函数调用基类方法，也需传入this
                    mydata = null;

                //240505，之前这里是let mydata = new ht.Node()，这必然导致内存持续增加啊！！一直在new对象！！！
                if (data) mydata = data;
                else mydata = data = new ht.Node();

                /*前面通过构造函数传入到DatabindingsImageDrawable，再通过this和成员方法
                获得传入的图标URL字符串, 以及遍历传参key-value对数据绑定的变量来动态赋值！*/
                mydata.setImage(self.getImage())
                for (let attrItem in self.attrsValues) { //使用构造函数中对当前类的自定义属性定义赋值
                    mydata.a(attrItem, self.attrsValues[attrItem]);
                }
                // /*开始调用属性，对数据绑定的变量来动态赋值！！！*/
                // mydata.a('text', 'hi iotos!')
                // mydata.a('borderColor', 'green')

                DatabindingsImageDrawable.superClass.draw.call(self, x, y, width, height, mydata, view, dom);
            }
        });
        //-------------------------------------------------------------------
    }

    //加载引擎
    function loadDisplay(graphViewControl, url, cache = null, callback = null, extra = {
        renderData: null, //内嵌图纸的渲染元素图标data对象
        renderGv: null, //渲染元素图元对应的gv，也传进来，参数保持渲染元素内一致
        multiDistinctIndex: 0, //渲染元素内多个同样图纸的嵌套，传入用于区分不同的实例
    }) {
        //231103，如果没传入gv，就自动创建，主要用于初始入口，作为公共函数来加载页面图纸json！
        let data = extra.renderData, //当前容器渲染元素在上层图纸中的图元对象
            isDiv = i.isDOMElement(graphViewControl); //240602，支持传入div，指定位置嵌入，就可以不用全屏，也不用iframe嵌套
        if (!graphViewControl || isDiv) {
            let domObj = isDiv ? graphViewControl : null; //240602，支持传入div，指定位置嵌入，就可以不用全屏，也不用iframe嵌套
            let htmlDM = new ht.DataModel(),
                htmlGV = new ht.graph.GraphView(htmlDM);
            htmlGV.addToDOM(typeof(domObj) == 'string' ? document.getElementById(domObj) : domObj); //240602，支持传入div，指定位置嵌入，就可以不用全屏，也不用iframe嵌套
            ht.Default.xhrLoad(url, function(text) {
                if(!text){
                    alert(url + ' not found!');
                    return;
                }
                var json = ht.Default.parse(text);
                if (json.title) document.title = json.title;
                htmlDM.deserialize(json);
                initGVLoadedRunning(htmlGV, false, false, url);
            });
            return;

        }
        let dmOriginal = graphViewControl.dm();
        data._i_isCompleteLoaded = false;
        //底层图纸触底反弹，或者加载失败时向上触发
        function __bubblingUpper() {
            data.ca('isLoadingGet', false);
            function __onDisplayLoaded() {
                console.info('display loaded!', url);
                console.assert(data);
                if(!data) return;

                //内嵌图纸加载完毕后回调
                let cb = new Function('return ' + data.ca('onDisplayLoaded'))();
                cb && cb(data, extra.renderGv, cache);
                data.fp('a:onDisplayLoaded', null, data.ca('onDisplayLoaded')); //231009，触发一下对该函数的属性md监听！！这样不仅是执行，更是能作为监听事件！
                //240419，主要是让顶层图纸页面dataModel，知道自己什么时候是完整加载逐层内嵌页完毕！在aiotos中加载主入口中，用来做初始化操作，比如获取内嵌页图元对象等
                if (data.dm()) {
                    let dmcb = new Function('return ' + data.dm().a('onDisplayLoaded'))();
                    dmcb && dmcb(data.dm());
                }
            }

            if (data._i_bottomSymbolLoadedIniting) {
                _i.setTimeout(() => {
                    _i.setTimeout(() => {
                        data && i.forEach(data._i_bottomSymbolLoadedIniting, (bottomSymbolLoadedInit, idx) => {
                            bottomSymbolLoadedInit && bottomSymbolLoadedInit();
                            /*240202，对于当前已经执行过的，就标记为空undefined，方便移除掉，而不是循环后整体清空[]，因为__updateForce()执行时可能存在
                            内嵌动态加载，导致当前上层data还处于加载中状态，导致还需要继续缓存操作，并且在里面继续做了.push()缓存！！*/
                            data._i_bottomSymbolLoadedIniting[idx] = undefined;
                        });
                        //240202，对清空了标记的做移除操作，而不是对整体=[]清空！因为可能存在动态加载内嵌页，导致触发赋值时还需要继续缓存操作的情况！
                        if (data) i.arrayItemsRemoved(data._i_bottomSymbolLoadedIniting, undefined);
                        _i.setTimeout(() => {
                            _i.setTimeout(() => {
                                __onDisplayLoaded();
                            }, 0)
                        }, 0);

                    }, 0);
                }, 0);
            }

            console.assert(data._multiRequestingLeft == 0);
            //231211，在容器组件加载完毕时，如果返现此前自己被做了表单操作，那么就还原之前对自己的操作，调用备份的闭包函数，内部恢复参数调用！！
            if (data._i_formValueUpdateForcings) {
                _i.setTimeout(() => {
                    _i.setTimeout(() => {
                        data && i.forEach(data._i_formValueUpdateForcings, (item, idx) => {
                            /*240206，注意，不能用data._i_isFormInitInnerFping，因为缓存赋值操作可能发生在中间的内嵌层，当恢复操作时，顶层对象与中间层
                            发生连线逻辑的图元对象不是一个时，这里对顶层图元data设置fping标记没用！因此缓存操作时，列表也用对象items列表，将对象也传递过来！*/
                            item.node._i_isFormInitInnerFping = true;
                            item.__updateForcing();
                            item.node._i_isFormInitInnerFping = false;
                            /*240202，对于当前已经执行过的，就标记为空undefined，方便移除掉，而不是循环后整体清空[]，因为__updateForce()执行时可能存在
                            内嵌动态加载，导致当前上层data还处于加载中状态，导致还需要继续缓存操作，并且在里面继续做了.push()缓存！！*/
                            data._i_formValueUpdateForcings[idx] = undefined;
                        });
                        //240202，对清空了标记的做移除操作，而不是对整体=[]清空！因为可能存在动态加载内嵌页，导致触发赋值时还需要继续缓存操作的情况！
                        if (data) i.arrayItemsRemoved(data._i_formValueUpdateForcings, undefined);
                    }, 0);
                }, 0);
            }

            //231216，加载完成标记统一这么放，而不是放到if(data._i_formValueUpdateForcings)、if(data._i_formEventBubblingUppering)等里面各自两层的setTimerout(0)里面！
            _i.setTimeout(() => {
                _i.setTimeout(() => {
                    _i.setTimeout(() => { //240125，再加一层！！因为i.md中对于加载中的顶层图元，里面加了一层队列setTimeout()，就是为了让初始加载时，渲染元素的md响应处理能够用上层form设定的最新值！
                        //231216，加载完成标记
                        if (data) {
                            /*240121，在tabView渲染元素的a:index监听，或者updateUppersWhileDynamicLoading中，有动态复位_i_isCompleteLoaded，为了避免跟isLoadingGet同时为true
                            造成可能的BUG，这里就对-1值专门判断，不再跟false等同而置位，反而设置成false复位，这样后面的反弹过来再去置位！*/
                            if (data._i_isCompleteLoaded < 0) {
                                if (data._i_isCompleteLoaded === -1) {
                                    data._i_isCompleteLoaded = false;
                                } else {
                                    data._i_isCompleteLoaded += 1;
                                }
                            } else {
                                data._i_isCompleteLoaded = true;
                                if (data._i_updateForceAfterLoaded) {
                                    i.forEach(data._i_updateForceAfterLoaded, (__updateForceAfterLoaded, idx) => {
                                        __updateForceAfterLoaded();
                                        data._i_updateForceAfterLoaded[idx] = undefined;
                                    });
                                    if (data) i.arrayItemsRemoved(data._i_updateForceAfterLoaded, undefined);
                                }
                            }
                            data._i_isFirstInitLoaded = true;
                        }
                    }, 0);
                }, 0);
            }, 0);

            if (data._i_formEventBubblingUppering || 1) { //240814，这里条件限制去掉，放到多级setTimeout里面最后去判断！！因为存在初始还没过来的情况，比如发送器先发送，内嵌接收器的对话框弹窗后弹窗监听！！
                _i.setTimeout(() => {
                    _i.setTimeout(() => {
                        /*240206，连线操作的能缓存的就缓存直到完全加载完毕，在置位标记之后。不能通过_i_formEventBubblingUppering缓存的，就用_i_updateForceAfterLoaded缓存，也是
                        在加载完毕之后，避免被初始化attrsInit覆盖掉*/
                        _i.setTimeout(() => {
                            //240814，上面条件限制去掉，放到多级setTimeout里面最后这里来判断！！因为存在初始还没过来的情况，比如发送器先发送，内嵌接收器的对话框弹窗后弹窗监听！！
                            if(data && data._i_formEventBubblingUppering){
                                // layer.load(1);
                                data && i.forEach(data._i_formEventBubblingUppering, (__formEventBubblingUpper, idx) => {
                                    console.assert(__formEventBubblingUpper !== undefined); //240813，发现有undefined的情况？？
                                    __formEventBubblingUpper && __formEventBubblingUpper();

                                    /*240202，对于当前已经执行过的，就标记为空undefined，方便移除掉，而不是循环后整体清空[]，因为__updateForce()执行时可能存在
                                    内嵌动态加载，导致当前上层data还处于加载中状态，导致还需要继续缓存操作，并且在里面继续做了.push()缓存！！*/
                                    data._i_formEventBubblingUppering[idx] = undefined;
                                });

                                //240202，对清空了标记的做移除操作，而不是对整体=[]清空！因为可能存在动态加载内嵌页，导致触发赋值时还需要继续缓存操作的情况！
                                if (data) i.arrayItemsRemoved(data._i_formEventBubblingUppering, undefined);
                            }
                        }, 0);
                    }, 0);
                }, 0);
            }

            /*231212，在加载之前将底板区域外的吸附布局的容器图元设置宽高为1，加载完毕后恢复原始尺寸！*/
            if (i.isControlTyped(data, 'gv') && data._i_isOutside) {
                _i.setTimeout(() => {
                    data.setWidth(data._i_wtmp);
                    data.setHeight(data._i_htmp);
                    data._i_isOutside = undefined;
                    data._i_wtmp = undefined;
                    data._i_htmp = undefined;
                }, 0);
            }

            /*240627，此前加载完成回调函数放到这个位置的，现在封装到函数内，这里条件调用！其中data._i_bottomSymbolLoadedIniting为true时，下面
            不执行，但是在上面多级setTimeout异步里面，初始化__init__内执行！确保初始化完毕后再执行回调函数，让回调函数内的属性赋值不会被冲掉！！*/
            if (!data._i_bottomSymbolLoadedIniting) {
                __onDisplayLoaded();
            }

            //230531，增加data.dm() &&，避免重复刷新重新加载时报错
            if (data.dm() && data.dm().handleCurrentSymbol) {
                console.info('bounced to upper!', data.dm()._url);
                data.dm().handleCurrentSymbol(true, false, data);
            }

            /*240419，所有内嵌页面，都可以关联物联中台数据，或者配置文本为时间日期格式，并且上层页面运行后，内嵌页绑定的也都能动态更新时间日期、实时显示绑定的物联中台数据！
            否则这里不处理，会导致只有顶层页面可以，因为aiotos.js中就是那么做的！若要每层都支持，目前就在这里每层分别初始化的方式实现！*/
            if (!dmOriginal._i_iotosValueUpdating) {
                //240419，内嵌页面的日期时间等自动变化，也需要这里来处理下，
                updateTime(dmOriginal);

                //2D中 扇叶、管道等动画
                fanFlowAnim(dmOriginal);
                //监听自定义消息
                function iotosValueUpdating(e) {
                    const {
                        kind,
                        para
                    } = e
                    const {
                        type,
                        data
                    } = para
                    if (kind === 'callback') {
                        const {
                            type,
                            data
                        } = para
                        for (let key in dmOriginal._i_iotVarsBinded) {
                            let innerNodetmp = dmOriginal._i_iotVarsBinded[key],
                                dataBindtmp = innerNodetmp.getDataBindings(),
                                bindType = key.slice(0, 1);
                            updateValue({
                                type,
                                data,
                                dataItem: innerNodetmp,
                                dataBindings: dataBindtmp,
                                bindType
                            })
                        }
                    }
                }
                window.appNotifier.add(iotosValueUpdating);
                dmOriginal._i_iotosValueUpdating = iotosValueUpdating; //240419，存放标记，避免重复进入初始化！
            }

            //240721，加上过滤&& !i.isControlTyped(data,'tab')，对于tab页签，也要单独处理，取当前索引页的内嵌宽高来处理useOriginSize
            if (data.ca('useOriginSize') && !i.isControlTyped(data, 'dlg') && !i.isControlTyped(data,'tab')) { //231207，对话框除外，对话框因为有顶部、底部，单独自己已经处理了！
                let basetmp = i.baseNode(dmOriginal);
                if (basetmp) {
                    /*240721，千万注意，上面dm.handleCurrentSymbol时，用到_i.setTimeout异步，导致内嵌页先初始化完毕，再到上层页面的反弹，所以在上层反弹时去
                    获取内嵌页组件的属性，都不再是页面配置时的值了，尤其是有布局的底板宽高，那肯定获取到的是宽高布局自适应后的值！因此，这里专门暂行原始配置，用
                    来给容器的使用内嵌尺寸时用！*/
                    console.assert(basetmp._i_originWidth);           
                    console.assert(basetmp._i_originHeight);                    
                    data.setWidth(basetmp._i_originWidth);
                    data.setHeight(basetmp._i_originHeight);
                }
            }

            if (!runningMode()) {
                // 重载 gv.toDataURL 方法，渲染元素位置绘制图标设置的快照
                let gv = extra.renderGv;
                let old = gv.toDataURL;
                if (!runningMode() && typeof(editor) !== 'undefined' && editor && editor.displayView && !editor.displayView.hasLoaded) return; //240613，如果是在重加载时发现进来，那就就直接return掉！ 
                gv.toDataURL = function() {
                    let self = this;
                    let draw = function(g) {
                        self.dm().each(function(data) {
                            // 节点是否可见
                            if (self.isVisible(data)) {
                                let ui = self.getDataUI(data);
                                // 渲染元素是否返回 html
                                //240613，加上条件data.ca('display')。因为对于有内嵌单元格页面的ttb树表格组件，是没有直接的display属性的
                                if (ui && ui._htmlView && i.hasInner(data) && data.ca('display')) {
                                    // 是否设置快照
                                    // if (ui._htmlInfo.img.snapshotURL) {
                                    // let snapshotURL = ui._htmlInfo.img.snapshotURL;

                                    let rect = data.getRect();
                                    let x = rect.x;
                                    let y = rect.y;
                                    let width = rect.width;
                                    let height = rect.height;

                                    //容器组件，来显示内嵌页的缩微图或者根据上层区域实时计算后的缩微图，填充到容器区域，组成当前上层页面的缩微图预览！
                                    let urltmp = i.toAbsDisplayURL(data, data.ca('display'));
                                    if (gv._i_displayIconDataURLSaved && gv._i_displayIconDataURLSaved[urltmp]) {
                                        urltmp = gv._i_displayIconDataURLSaved[urltmp];
                                    } else if (!gv._i_displayIconDataURLSaved) {
                                        gv._i_displayIconDataURLSaved = {};
                                    }

                                    //240517，为了避免保存耗时，这里加上缓存机制，相同内嵌页资源，返回同一份base64图片，不再动态计算实时生成！
                                    if (urltmp && urltmp.slice(-5) === '.json') {
                                        let innerGVtmp = i.innerGV(data),
                                            urlRaw = urltmp;
                                        if (i.baseNode(innerGVtmp) /*&& !i.upperData(data)*/ ) { //240517.3，但是注意，有的嵌套，是很薄的，也会有多层，那么这里只一层递归，还是会存在失真的情况！暂时先不考虑那么多了，避免编辑保存很慢！
                                            i.baseNode(innerGVtmp).setSize(width, height);
                                            urltmp = innerGVtmp.toDataURL();
                                        } else {
                                            urltmp = urltmp.slice(0, -4) + 'png';
                                        }
                                        gv._i_displayIconDataURLSaved[urlRaw] = urltmp;
                                    }
                                    ht.Default.drawStretchImage(g, ht.Default.getImage(urltmp), 'fill', x, y, width, height);
                                }
                            }
                        })
                    };
                    self.addTopPainter(draw);
                    let dataUrl = old.apply(self, arguments);
                    self.removeTopPainter(draw);
                    draw = null;
                    return dataUrl;
                }
            }
        }

        function clear() {
            dmOriginal.clear();
            dmOriginal.setAttrObject({});
            /*续上：解决方案是，结合addChildDataModel中的.xxx属性备份赋值，从attrObject清空后，判断.xxx中有的就重新赋值到a属性内！*/
            dmOriginal._fromBak && dmOriginal.a('_from', dmOriginal._fromBak);
            // dmOriginal._parentTagBak && dmOriginal.a('_parentTag', dmOriginal._parentTagBak); //230128，移除掉了，_parentTag属性由a属性改成了.xxx属性
            graphViewControl.reset();
        }
        var urltmp = url;
        if (urltmp != undefined && urltmp != '') {
            data.a('__loadingStatus', true);

            clear();
            try {
                //230228，相对于graphViewControl.deserialize来说，dm的deserialize不会触发网络请求，需要传入加载完后的json文本，用url去请求的是gv才支持！
                function __dmDeserialize(displayJson) {
                    function __whenError() {
                        if (data && data._multiRequestingLeft) data._multiRequestingLeft -= 1; //成功、失败都自减1，表明已经牺牲或功成身退
                        __bubblingUpper();
                        let infotmp = i.window()._i_alertDlg ? ('资源加载失败：' + url + _i.commonTip(data)) : _i.toHtmlFont(`资源加载失败：${_i.colored(url, 'red',false)} ${_i.commonTip(data)}`);
                        _i.alert(infotmp, '错误', false, null, null, [400, 280]);
                        __onPostDeserialize(dmSource, graphViewControl.dm(), graphViewControl, graphViewControl.dm().toDatas());

                        layer.closeAll(); //可能涉及loading(1)加载阻塞的地方，在异常处理特别是网络请求异常的地方，都加上这句。
                    };
                    if (displayJson) {
                        //注意：try-catch无法捕捉gv.deserialize加载错误文件的情况，比如404 not fount还是会去当ht json解析！
                        try {
                            if (data == null) { //230526，异步加载时，会存在加载完毕时，已经刷新移除了容器图元本身！
                                console.warn('url loaded but container node has been removed??', urltmp);
                                return;
                            }
                            //230912，反序列化加载支持传入字符串和json对象！！没必要把现成的对象转换成字符串！
                            graphViewControl.dm().clear(); //240110，尝试先clear一下，因为偶尔发现加载内嵌页面会有重复叠加的情况！从而也导致报错baseNode重复的错误！有待观察效果，是否起作用！
                            // data._i_innerDatas = {}; //240204，尤其对于重加载、动态加载内嵌页时，上一次保存的也清理一下！//240217，不能清理，比如在tab页签中多页加载，就会造成后页对前页有影响！
                            graphViewControl.dm().deserialize(ht.Default.stringify(displayJson));
                            displayJson = null; //231228，释放内存是否有效果？？

                            /*tips 231222，注意，这里dm.deserialize()后，页面中图元已经实例化成了对象！但是当下并未执行渲染元素renderHTML！因此下面马上做__onPostDeserialize加载内嵌页面进行
                            遍历，此时各个渲染元素图元组件都还未初始化，因此才有了data.fp需要通过setTimeout(0)放到队列中先让图元组件渲染元素初始化！*/
                            __onPostDeserialize(dmSource, graphViewControl.dm(), graphViewControl, graphViewControl.dm().toDatas());
                        } catch (error) {
                            console.error(error);
                            i.alert('发生错误：' + error.toString() + '\r\n\r\n' + '错误组件：' + data.getDisplayName() + '\r\n组件位置：' + data.dm() && data.dm()._url, '错误', false, null, null, [300, 250]);
                            __whenError();
                        }
                    } else {
                        __whenError();
                    }
                }
                //230228，xhrLoad换成了i.omImageLoaded，实测测试也发现，实际上ht.Default.getImage会做网络请求（当url资源本地不在时），所以这里监听就好，不需要通过xhrLoad去手动加载造成重复！
                i.onImageLoaded(urltmp, displayJson => { //231201，如果资源不存在，现在也会回调返回undefined
                    if (isObject(displayJson)) {
                        __dmDeserialize(displayJson);
                    } else {
                        __dmDeserialize(); //231201，必须加上也让执行—__whenError，否则对于有加载连线操作赋值的情况，会导致一致间隔循环操作，因为容器的isLoadingGet属性一直没法复位表现在加载中！！
                        console.error('ERROR: display url', urltmp, 'loaded with error format:', displayJson);
                    }
                });
                let dmSource = isObject(urltmp) ? urltmp : ht.Default.getImage(urltmp);
                if (!data._multiRequestingLeft) data._multiRequestingLeft = 1; //tips _multiRequestingLeft为0或者undefined时，初始赋值1
                data._multiRequestingLeft == 1 && data.ca('isLoadingGet', true);
                if (dmSource === undefined || dmSource === null) { //230228，开放这里，因为handleCurrentSymbol中现在除了判断dm._to，还会判断是否有display、symbol
                    /*240217，这里加上这句，实际上是传入undefined、null，为了进入到里面的__whenError()。注意，dmSource === undefined时表示资源未加载，会触发进入到onImageLoaded中处理，包括资源不存在！
                    这里是资源获取是null时进入处理，因为此时并不会触发onImageLoaded！*/
                    if (dmSource === null) __dmDeserialize(dmSource);

                } else {
                    _i.setTimeout(() => {
                        __dmDeserialize(dmSource);
                    }, 0);
                }

                function __onPostDeserialize(json, dm, gv, datas) {
                    dm.setBackground('rgba(0,0,0,0)');

                    //嵌套图纸的默认初始化
                    initGVLoadedRunning(gv, false, false, typeof(urltmp) == 'string' ? urltmp : null); //230912，为了兼容url也能传入加载后的对象！
                    gv.zoomReset();
                    //对渲染元素容器图标，默认支持名为"onPostDeserialize"的反序列化后回调！
                    let cb = new Function('return ' + data.ca('onPostDeserialize'))()
                    cb && cb(json, dm, gv, datas);

                    //上层和下层内嵌图纸之间数据双向绑定
                    upperDisplayBingding();

                    function upperDisplayBingding() {
                        /*监听渲染元素图元的事件，让属性变化值能一层层传递设置到底层的目标内嵌组件*/
                        let ingoreNotifyUpperAttrEvent = false; //避免运行实态内嵌组件交互逐层回写上层图元属性时又因为属性变化造成下发，做一个标记。
                        function upperDataPropChanged(e) {
                            //编辑状态下刷新图纸，因为前面只顾做data.dm().md，没有做umd，所以会有data.dm()为null的响应事件进到这里来！
                            function __clear() {
                                if (data._mdOldFunc) {
                                    data._mdOldFunc.forEach((funcItem, index) => {
                                        data.dm() && data.dm().umd(funcItem);
                                    });
                                }
                                console.info('删除图元：', data);
                                data = null;
                            }
                            if (data && data.dm() == null) {
                                //注意，使用e.data.dm()来做umd，这时刷新图纸保持对象不变的dm！刷新图纸后，原来在图纸上的图元就悬空了，这里就来做清理！
                                __clear();
                            }

                            //tips 231030，发现偶尔对对话框继承的文本值属性设置值时无法向下同步，主要是因为到这里datas为null了（e.data则正常）！！有待进一步分析排查。
                            if (e.data == data) {
                                /*240102，去掉条件!innerNode._i_initialLoading &&，因为整个将i.initNotifyUpperTillBottom()从loadDisplay里移除，现在
                                对上层formReset/formValue的属性初始化同步下层的属性值，恢复到data.ca()，因为没必要逐层向下同步为了初始化所谓的notifyUpper()，
                                因为后面的几个有专门做notifyUpper初始化！*/
                                if (data._i_initialToUpper) return;

                                let attrtmp = e.property.slice(2), //去掉"a:添加机构>0>input-ui1>fileType"前面的"a:"
                                    nameArr = attrtmp.split('>'),
                                    binding = data.innerDataBindings ? data.innerDataBindings[attrtmp] : null,
                                    valuetmp = e.newValue;
                                if (i.getBindedAttrValueType(data, attrtmp) == 'Function' && data._needSyncToAllInnerLayers != true) { //added 230218，添加条件，结合i.caCb，允许函数逐层传递同步设置！
                                    console.warn('function type inner downward sync will be filted!', i.autoTag(data), attrtmp, valuetmp);
                                    return;
                                }
                                if (!i.isMultiIndexMatchKeyURL(data, e.property, extra.multiDistinctIndex)) { //240218，这个方法仅仅判断是否匹配，不用for循环遍历，性能更高！
                                    return;
                                }

                                //-1）初始化给内嵌图纸/图标按照属性配置赋值，打通数据下行绑定
                                if (binding && //有这个条件就够了，剩下两个条件过滤判断有些多余
                                    nameArr.length >= 4 //&& 比如"软网关>0>table-ui1>datas"
                                    //nameArr[1] == extra.multiDistinctIndex //同一个渲染元素内多个相同内嵌图纸的实例以区别（多级的时候是否兼容？？）
                                ) {
                                    if (ingoreNotifyUpperAttrEvent) return;

                                    /*按照属性自动命名规则，索引为2的为当前内嵌图纸的图元tag（倒数第二个为tag???），比如“添加机构--->0>n666>a:查看驻点信息
                                    详情 2 2>0>combobox-ui3>a:onChange”，以>作为分隔符索引为2的为'n666'就是当前图纸中图元的tag标签*/
                                    let innerNode = d(dm, nameArr[2]);
                                    if (innerNode == undefined) {
                                        console.error('inner display node not found in this event：', e.property, data);
                                        //需要进一步测试验证，是否可以加上这句！因为通过bindControls动态往对话框dlg组件传入display时，发现会持续累积事件触发！
                                        __clear();
                                        return;
                                    }
                                    let innerAttrTmp = attrtmp.slice(String(nameArr[0] + '>' + nameArr[1] + '>' + nameArr[2] + '>').length),
                                        innerAttrName = innerAttrTmp.slice(2), //slice(2)是获取a:value中的value
                                        innerAttrType = innerAttrTmp.slice(0, 1); //slice(0,1)是获取a:value中的a
                                    if (e.oldValue != '__formResetTypeInit__' || e.oldValue == '__fucking_undefined__') {
                                        //240125，form初始化向下逐层传递时的标记，方便最底层md监听响应处理时，能知道是来自上层form初始同步。不论是底层在attrsInit的且上层form的，还是仅仅上层form的。
                                        //240205，加上条件if (data._i_isFormInitInnerFping === true)，否则运行过程中的赋值逐层向下传递操作，也会被加上_i_isFormInitInnerFping标记了！
                                        if (data._i_isFormInitInnerFping === true) innerNode._i_isFormInitInnerFping = true;
                                        updateForce(innerNode, innerAttrName, valuetmp, innerAttrType, true);
                                        innerNode._i_isFormInitInnerFping = undefined;
                                    }

                                    /*-2）随时提供回调，给下一层赋值的时候提供给下一层的图元回调，下一层调用该回调时候，就会自动调用上一层，通知给上一层，
                                    回写到当前渲染元素的配置中，保持读写数据同步，十分便利*/
                                    if (innerNode.notifyUpper == undefined) innerNode['notifyUpper'] = {};
                                    //230213，增加强制更新fpForce参数，对于值未变化的，也强行触发，以执行渲染元素逻辑！暂未用，也未测！
                                    innerNode.notifyUpper[innerAttrType + ':' + innerAttrName] = function(value, fpForce = false) {
                                        //赋值前后左上标记，避免往上逐层设定值更新属性时，又触发事件往下逐层传递了！
                                        ingoreNotifyUpperAttrEvent = true;
                                        //230213，增加强制更新，对于值未变化的，也强行触发，以执行渲染元素逻辑！暂未用，也未测！
                                        if (data == undefined) {
                                            // console.error('WARNING:data has been removed??', data);
                                            return;
                                        }
                                        fpForce ? data.fp('a' + attrtmp, null, value) : data.ca(attrtmp, value);
                                        ingoreNotifyUpperAttrEvent = false;
                                        //底层组件数值发生改变，图元逐层向上传递数据修改各自相关属性值！
                                        i.innerNotifyUpper(data, e.property, value);
                                    }
                                } else {
                                    if (data.ca('isLoadingGet') || !data._i_isCompleteLoaded) {
                                        console.error(`WARN: node ${data.getDisplayName()} is loading, while setting attr ${attrtmp},this may occur in by tab first bounce back! please check if abnormal`);
                                    } else {
                                        console.error('innerDataBindings or name error!', nameArr, i.clone(data.innerDataBindings), attrtmp, data)
                                        i.innerPendingNodeAutoDel(data); //230925，加上这个做清理试下。
                                    }
                                }
                            } else if (data == undefined) {}
                        }

                        /*监听当前渲染元素图元的属性编辑等事件*/
                        //230221-01:18，晚上卸载，现在这里清理避免重复监听
                        if (data._mdOldFunc && data._mdOldFunc[extra.multiDistinctIndex] != null) {
                            data.dm() && data.dm().umd(data._mdOldFunc[extra.multiDistinctIndex]);
                            data._mdOldFunc[extra.multiDistinctIndex] = null;
                        }
                        //再开始监听
                        if (data.dm()) {
                            data.dm().md(upperDataPropChanged);
                        } else {
                            console.error('container data has been removed?', data);
                        }
                        //最后更新备份！ 
                        if (data._mdOldFunc == undefined) data._mdOldFunc = [];
                        i.setArrayIndexValue(data._mdOldFunc, extra.multiDistinctIndex, upperDataPropChanged);

                        let curSymbolObj = null;
                        /*231004，对于data上层容器图元，比如tabView页签组件这种，外层有displaystmp.forEach()循环进行多个loadDisplay()加载多个url，因此这里不能
                        通过data.innerDataBindings = []直接清空，会导致循环中将前一次的覆盖掉！因此采用如下这种只有undefined时才初始赋空值，而不是每次清空赋值！*/
                        if (data.innerDataBindings == undefined) data.innerDataBindings = []; //图元的内嵌图纸数据绑定相关的信息（绑定了iotos.form的）

                        //231225，增加参数innerDataBubbling，也就是内嵌反弹过来的图元对象，此时forceEnable一定为true
                        dm.handleCurrentSymbol = function(forceEnable = false, setImageOnly = false, innerDataBubbling = null, _asyncForBottomSymbolInit = false, _hasInnerDisplay = null) {
                            //231225，是否是触底反弹进入
                            function __isBubblingEnter() {
                                return forceEnable && !setImageOnly;
                            }
                            if (__isBubblingEnter()) console.assert(innerDataBubbling != null);

                            //240228，清空，否则多次执行下面i.hasInnerDisplay()，会导致有重复push。
                            dm._i_dynamicInnerNodeDisplayUrls = [];
                            /*230331，如果为false，表明当前就是底层图纸，没有容器图元嵌套更下层的图纸。专门提出成变量，后面都会有道，当前容器图元data的内嵌图
                            纸中的内嵌图元是否都不再有容器图元*/
                            let innerstmp = [],
                                //240223，加上条件!setImageOnly && ，对于压缩、运行时等iamge为url时，会先setImage()从而传入setImageOnly，反正还要正式进入的，这里没必要浪费性能做i.hasInnerDisplay()遍历判断！
                                hasInnerDisplayTmp = _hasInnerDisplay === null ? (!setImageOnly && i.hasInnerDisplay(dm, innerstmp, __isBubblingEnter(), true)) : _hasInnerDisplay,
                                isTabOtherPagesIniting = false; //231101，tab页签非当前页初始加载时。主要是涉及用到i.isOrigionType，调用i.bottomData()时会出问题！
                            dm._i_innerDisplayNodes = innerstmp; //231225，存放这里查到的内嵌待反弹的数量。


                            /*240205，底层图元组件的上层容器初始加载时，需要异步一下，让内嵌渲染元素先进入初始化！否则这个初始化得在逐层反弹到最上层后才行，那么就更中间层
                            页面的内嵌图元渲染元素初始化时机就不一致了！*/
                            if (forceEnable == false && !hasInnerDisplayTmp && !innerDataBubbling && !_asyncForBottomSymbolInit) {
                                let basetmp = i.baseNode(dm,false);
                                if(basetmp){
                                    /*240721，千万注意，下面这句_i.setTimeout异步，导致内嵌页先初始化完毕，再到上层页面的反弹，所以在上层反弹时去获取内嵌页组件的属性，都不再
                                    是页面配置时的值了，尤其是有布局的底板宽高，那肯定获取到的是宽高布局自适应后的值！因此，这里专门暂行原始配置，用来给容器的使用内嵌尺寸时用！*/
                                    basetmp._i_originWidth = basetmp.getWidth();
                                    basetmp._i_originHeight = basetmp.getHeight();
                                }
                                if(data){
                                    let curBase = i.baseNode(data.dm(),false);  //231003，注意，得是data容器，对于所在页面的底板位置！而不是内嵌底板！
                                    let postmp = data.getPosition(),
                                        needVisualTriggered = data.s('2d.visible') && !data.getHost() && !i.isContainsInRect(data, curBase);
                                    curBase && needVisualTriggered && data.setPosition(curBase.getPosition());
                                _i.setTimeout(() => {
                                        needVisualTriggered && data.setPosition(postmp);
                                    //240303，末尾追加参数传入hasInnerDisplayTmp，避免再次重复计算hasInnerDisplay()，徒增耗时！
                                    dm.handleCurrentSymbol(forceEnable, setImageOnly, innerDataBubbling, true, hasInnerDisplayTmp);
                                }, 0);
                                }
                                return;
                            }

                            if (forceEnable == false && hasInnerDisplayTmp) {
                                console.warn('WARNNING:', i.autoTag(data), 'has container typed innerData,and will be paused to tranves inner display,waiting for the bottom to bounce back', url);

                                /*231008，容器组件内嵌后把display暴露出来动态配置更下一级内嵌页面的情况，需要这里手动触发display属性的赋值，否则data作为上层图元，其属性遍历触发需要通过内嵌页面
                                触底反弹，而容器组件能执行并向上反弹的前提是其display属性能传入url触发页面加载，这会导致无法触发加载内嵌页，因此需要这里手动给display属性赋值！*/
                                dm._i_dynamicInnerNodeDisplayUrls && dm._i_dynamicInnerNodeDisplayUrls.forEach(item => {
                                    item.data.ca('display', item.url);
                                    /*240228，内嵌模板容器采用最上层fom绑定设置的display url时，对这个模板容器图元做上标记_i_isDisplayInheritUpperFormUsed，在加载反弹时，逐层将这个容器组件的属性都自动继承上去，
                                    否则，在上层打开属性继承面板，就没有内嵌的属性可选择了！！注意，这里包括中间多层可能也继承了display属性并且form、formReset均有可能！*/
                                    item.data._i_isDisplayInheritUpperFormUsed = true;
                                });
                                if (!i.isControlTyped(data, 'tab') || data.ca('index') == extra.multiDistinctIndex) {
                                    if(data){
                                        let basetmp = i.baseNode(data.dm(),false);//231003，注意，得是data容器，对于所在页面的底板位置！而不是内嵌底板！
                                        let postmp = data.getPosition(),
                                            needVisualTriggered = data.s('2d.visible') && !data.getHost() && !i.isContainsInRect(data, basetmp);
                                        basetmp && needVisualTriggered && data.setPosition(basetmp.getPosition());
                                        _i.setTimeout(() => {
                                            needVisualTriggered && data.setPosition(postmp);
                                        }, 0);
                                    }
                                    return; //230921，就统一切换成这个，实现兼容！
                                } else if (i.isControlTyped(data, 'tab')) { //231101，对于tab页签的非当前页的初始化加载，做上标记！
                                    isTabOtherPagesIniting = true;
                                }
                            }

                            //230302，临时用于记录分析BUG！！！因为还是偶尔出现下层图纸数据被上层formReset的覆盖掉的情况！！
                            //tips 230331，注意，i.hasInnerDisplay(dm)是根据是否有display/s、symbols等属性，判断内嵌图纸中的内嵌图元是否有容器，并非是判断当前的data图元！既然都进入到这里，data肯定是容器图元必然有内嵌无需判断！
                            console.warn('WARNING', '【' + urlName(url) + '】', data && data.getTag(), hasInnerDisplayTmp, forceEnable, setImageOnly, url, data, dm, data && i.clone(data.getDataBindings()));
                            if (data) data.__cache = cache;
                            else {
                                console.warn('display reload??', 'data has been deleted!', url);
                                return;
                            }
                            data.setImage(curSymbolObj);
                            curSymbolObj.dataBindings.forEach(dbItem => {
                                if (dbItem.name === undefined) dbItem.name = dbItem.attr;
                            });
                            if (dm.imgAsyncLoadingCount === undefined) dm.imgAsyncLoadingCount = 0; //存在异步加载的情况，这里内部异步加载请求的次数自增，每次异步返回就自减，为0就执行循环结束的逻辑处理！

                            /*230613，加上datas = dm.toDatas()重新赋值，主要是考虑到grid等这种动态创建了图元组件，并且调用了data.dm().handleCurrentSymbol(true)来实现遍历动态向上暴露时，
                            为了避免datas值时就的，需要更新包含有新创建图元的。*/
                            datas = dm.toDatas().toArray();
                            let isRunning = runningMode(), //231017，是否运行状态，循环中尽可能用循环外一次性函数调用，避免反复进行重复的调用，性能大为降低！
                                topNode = isRunning && i.topData(data), //231017，顶部图元，主要用于加载时分析诊断
                                ignoreFinishWhileImgAsync = false, //231022，异步图片资源加载时，循环外的datasTraverseFinishedLast就不执行！否则会导致出发_multiRequestingLeft被自减1！
                                formBindedTmp = i.attrsFormBinded(data); //231023，为了进一步提高性能，公共的提取到这里
                            //231225，判断当前是否是内嵌的平级多个容器组件中，最后一个反弹过来，兼容内嵌只有一个的情况！
                            let isLastInnerBubbling = false;
                            if (
                                dm._i_innerDisplayNodes.length == 1 || //只有一个内嵌，那么当前反弹就是最后一个
                                (data._parallelMultiLeftInner && data._parallelMultiLeftInner.length == 1 && data._parallelMultiLeftInner[0] == innerDataBubbling) //或者长度为0
                            ) {
                                isLastInnerBubbling = true;
                            }

                            i.forEach(datas, (innerData, innerIndex) => {
                                let isDlg = i.isControlTyped(innerData, 'dlg'),
                                    isDlgRunning = isDlg && runningMode(),
                                    isDlgInvisible = isDlg && (!innerData.s('2d.visible') || runningMode()),
                                    isHiddenWhenLoading = innerData._multiRequestingLeft >= 1 && !(innerData.s('2d.visible') || (isDlgRunning && forceEnable));

                                /*230624，重要！！dm中有多个平级的容器组件，各自都需要触底反弹，如何让最后一个的触底反弹，才触发公共的上层触底反弹，避免多次重复反弹导致顶层多次加载导致闪动等问题，
                                以达到跟tabView、treeTable这种包含多个dm的组件类似的效果。也就是说，多个常规容器组件所在的页面，之前每个容器反弹都会触发上层反弹，现在要改成所有内嵌容器图元都反弹
                                后，才会触发公共的上层反弹。*/
                                if (
                                    (!isHiddenWhenLoading && innerData._multiRequestingLeft) ||
                                    ((data.s('2d.visible') || (i.isControlTyped(data, 'dlg') && data.ca('show') && !data.ca('embedded'))) && !isDlgInvisible && innerData._multiRequestingLeft === undefined && i.hasInner(innerData) && !setImageOnly && !isTabOtherPagesIniting)
                                ) {
                                    if (!data._parallelMultiLeftInner) data._parallelMultiLeftInner = [];
                                    if (data._parallelMultiLeftInner.indexOf(innerData) == -1 && !innerData._i_isDynamicLoadingLayersUp) {
                                        data._parallelMultiLeftInner.push(innerData);
                                        data._multiRequestingLeft += 1
                                    }

                                    /*231101，多个内嵌反弹触发上层处理合并时，任何一个内嵌反弹触发上层的处理，不会重复触发其他容器组件属性遍历，因为其本身就会有触底反弹过来！
                                    这类的innerData._multiRequestingLeft大于0！！刚好就在这里！*/
                                    if (isTabOtherPagesIniting) {
                                        console.error(`WARN: innerData._multiRequestingLeft not 0, and foreach of ${innerData.getDisplayName()} in ${url} will be ignored! data is`, data);
                                        return;
                                    }

                                } else i.arrayItemRemoved(data._parallelMultiLeftInner, innerData);
                                let dbtmp = innerData.getDataBindings(),
                                    attrIndex = -1, //230322
                                    imageObjStored = undefined; //230415，如果此前序列化image属性已经是[object]，这里就存放初始反序列化加载的，因为后面会被回写成url重新加载！对于动态创建的属性就会出问题！

                                /*231202，原先就有if (dbtmp == undefined) return，现在加上条件||innerData.ca('_forbidInherit')，对组件整体不对外继承！实测发现也有效，并不需要到里面去处理i.isFormVarBind
                                以及i.getDisplayBindingName。默认form绑定的属性都对外继承相当于public，而一旦勾选了该属性后，就只能当前页中连线操作，不被上层嵌套时继承，相当于private了！！*/
                                if (dbtmp == undefined || innerData.ca('_forbidInherit')) {
                                    return; //没有任何数据绑定的内嵌图元
                                }

                                //3）遍历该图元下的a/s/p等多种属性类型
                                for (let attrType in dbtmp) {
                                    //4）在特定类型下，遍历图元带了数据绑定的属性
                                    for (let attrKey in dbtmp[attrType]) {
                                        attrIndex += 1;
                                        //231224，运行加载反弹时，内嵌对话框的内嵌，如果没有实例化，那么暴露到上层的属性就不做遍历处理！否则也会不少报错！
                                        //231228，tips，内嵌对话框容器，加载运行时隐藏显示，同时触发更下层内去哪的加载，加载完毕后，因为作为上层容器的对话框不可见，因此不会初始化内嵌图元的渲染元素执行。
                                        if (
                                            runningMode() &&
                                            __isBubblingEnter() &&
                                            i.isControlTyped(innerData, 'dlg')
                                        ) {
                                            //240221，加上条件i.isKeyURL(attrKey) &&，避免进入容易断言错误且浪费时间！
                                            let keyURLData = i.isKeyURL(attrKey) && i.innerData(innerData, attrKey);
                                            if (keyURLData && !keyURLData._gv) {
                                            }
                                        }

                                        //231225，对于非当前反弹的容器组件过滤掉不处理属性继承、form值初始化等操作，对于非容器的常规组件，限定在最后一个反弹时才进行遍历初始化！
                                        if (
                                            __isBubblingEnter() && ( //反弹
                                                innerData != innerDataBubbling && //当前遍历的不是反弹过来的图元组件
                                                !isLastInnerBubbling //且不是最后
                                            )
                                        ) {
                                            continue;
                                        }

                                        /*231025，如果有内嵌容器图元正在加载，那么加载遍历就过滤掉这个内嵌图元组件的所有属性处理，其反弹后自己也会自行处理！
                                        对于tab页签加载后，切换tab页时可能需要用到这里，否则可能会出问题！*/
                                        if (innerData.ca('isLoadingGet') && attrKey.slice(-7) != 'display') {
                                            console.assert(i.hasInner(innerData) || innerData.ca('display') == '__init__');
                                            continue;
                                        }

                                        //5）这些属性中只处理绑定了'iotos.form'变量的
                                        let dataDbObjTmp = dbtmp[attrType][attrKey], //230618，当前图元组件数据组件的数据绑定对象
                                            idtmp = dbtmp[attrType][attrKey]['id'],
                                            attrFormBindType = i.isFormVarBind(idtmp); //231201，可选参数位置传入了图元对象，自动识别其是否勾选禁止继承，从而返回0

                                        //231228，在config.js的displayViewSaving中，对当前编辑打开的顶层页面保存时简化掉的form绑定配置，还原成内部格式！
                                        if (dataDbObjTmp.idinfo == undefined) dataDbObjTmp.idinfo = '';
                                        if (dataDbObjTmp.isTplBinded == undefined) dataDbObjTmp.isTplBinded = false;
                                        if (dataDbObjTmp.func == undefined) dataDbObjTmp.func = "function formParser(rawData, node) {\r\n    try {\r\n        /********* TODO **********/\r\n\r\n\r\n        /************************/\r\n        return rawData;\r\n    } catch (err) {\r\n        return rawData;\r\n    }\r\n}";
                                        if (dataDbObjTmp.alias == undefined) dataDbObjTmp.alias = '';
                                        if (dataDbObjTmp.id == 1) dataDbObjTmp.id = 'iotos.form';
                                        else if (dataDbObjTmp.id == 2) dataDbObjTmp.id = 'iotos.formReset';
                                        else if (dataDbObjTmp.id == 3) dataDbObjTmp.id = 'iotos.formValue';
                                        if (_i.isIotVarBind(dbtmp[attrType][attrKey])) {
                                            _i.setTimeout(() => {
                                                let iotosWs = new window.top.IotosInject();
                                                iotosWs.init(null, dbtmp[attrType][attrKey]['idinfo'], url);
                                            }, 0);
                                            //240608，存放物联网变量绑定信息，这样callback的ws数据过来，不用去遍历dm，太耗时了！尤其是高频上报时！
                                            if (!dm._i_iotVarsBinded) dm._i_iotVarsBinded = {};
                                            dm._i_iotVarsBinded[attrType + ':' + attrKey] = innerData;
                                        }

                                        if (attrFormBindType) { //230220
                                            let imageUrltmp = innerData.getImage();
                                            //230415，新增imageObjStored备份，目标是备份原先放到image中序列化的object对象，因为imageUrltmp下面被覆盖了！备份用于动态新增属性加载识别，因为这类属性在图标image中是没有的！
                                            if (typeof imageUrltmp == 'object') imageObjStored = imageUrltmp;
                                            //tips 231415，重新获取原始图标的对象，而不是序列化保存的[object]，因为可能底层图标已作编辑修改！，
                                            imageUrltmp = imageUrltmp ? typeof(imageUrltmp) == 'object' ? innerData.a('symbol') : imageUrltmp : null;
                                            let innerDataImageJson = i.getImage(imageUrltmp); //230228，代替ht.Default.getImage(imageUrltmp)，这样就不会触发多余的网络请求，对i.onImageLoaded造成干扰！
                                            //240324，前面去掉这个continue，这里加上条件|| imageUrltmp === null，否则比如地板矩形这种，image属性为null，但是如果把背景background做form绑定继承上来修改，发现继承不过来，因为即便上面屏蔽掉了continue，这里也进不来！因此加上条件！
                                            if (innerDataImageJson || imageUrltmp === null) { //对于ht.Text等不带symbol image的，也会返回json对象，只是不会带有a类型的属性
                                                createBindingItem();
                                            } else {
                                                ignoreFinishWhileImgAsync = true;
                                                //循环内部异步请求前加上计数自增1
                                                dm.imgAsyncLoadingCount += 1;

                                                //注意，因为是异步回调函数，外层for的本次循环已经过了，并且不会执行createBindingItem()！
                                                i.onImageLoaded(imageUrltmp, function(img) {

                                                    innerDataImageJson = img;

                                                    //循环内部异步回调返回后加上计数自增1
                                                    dm.imgAsyncLoadingCount -= 1;

                                                    createBindingItem();
                                                    if (
                                                        setImageOnly == false && //240227，专门做了这样的调整，确保setImageOnly为true时，整体条件不成立！
                                                        (setImageOnly == false || !hasInnerDisplayTmp) //240227，如果没有外层 setImageOnly == false &&，这里的||，会因为setImageOnly为true时，hasInnerDisplayTmp自动取反false，导致条件通过！！
                                                    ) {
                                                        if (data && dm.imgAsyncLoadingCount == 0) {
                                                            _i.setTimeout(() => {
                                                                datasTraverseFinishedLast();
                                                            }, 0);
                                                        }
                                                    }
                                                }, false);
                                                //240729，渲染元素组件路径兼容处理！以适应组件路径目录名称变化的情况
                                                imageUrltmp = i.__getPathCompatible(imageUrltmp, innerData);

                                                let imageObjBak = innerData.getImage(); //240806，为了对嵌套的工具函数统一恢复初始设置的动态属性，这里统一先备份。
                                                innerData.setImage(imageUrltmp); //tips 240219，只是将url字符串放上去，实际测试发现运行时并没触发网络请求，后面那句才触发请求！
                                                if(i.isFuncTypeControl(innerData)) innerData.setImage(imageObjBak);

                                                ht.Default.getImage(imageUrltmp); //240219，触发网络加载请求，通过前面onImageLoaded接收加载完成！
                                            }

                                            function createBindingItem() {
                                                if (data == null || curSymbolObj == null) {
                                                    console.warn('图元对象已被释放或image对象未被赋值？？', url, data);
                                                    return;
                                                }

                                                /*240221.2，对于页面压缩保存的情况下，比较频繁会出现dm.handleCurrentSymbol(true,true)进入到这里，主要是setImageOnly为true。但是因为此时innerData.getImage()为image的字符串url，
                                                因此会让下面条件dbItem为undefined，从而导致进入delete dbtmp[attrType][attrKey]被删除数据绑定。*/
                                                if (forceEnable == true && setImageOnly && !innerDataBubbling) return;
                                                if (curSymbolObj != data.getImage()) {
                                                    console.error("WARNNING: current symbol object ref to upper data has been lost!", attrKey, url, data);
                                                    let temp = curSymbolObj.dataBindings;
                                                    curSymbolObj = data.getImage();
                                                    curSymbolObj.dataBindings = temp;
                                                }
                                                let dbItem = i.getDataBindingItem(innerDataImageJson, attrKey, innerData);
                                                if (
                                                    dbItem == undefined &&
                                                    /*!(forceEnable == true && setImageOnly) && */
                                                    !isTabOtherPagesIniting &&
                                                    1
                                                ) { //内嵌图元中图标image json中没有
                                                    if (attrType == 'a') { //如果是a类型，那么就从图纸中移除掉说明是多余的
                                                        //配合下面专门处理内嵌gv图元，此时用的是object而不是原始图标的image json对象
                                                        let innerImgObjTmp = innerData.getImage();
                                                        if (innerImgObjTmp && typeof(innerImgObjTmp) == 'object') {
                                                            //240224，传入新增的图元对象参数，可以利用_i_symbolDatabindings避免重复循环遍历！//tips 240224.2，用data.innerDatabingdings，弃用_i_symbolDatabindings
                                                            dbItem = i.getDataBindingItem(innerImgObjTmp, attrKey, innerData);

                                                            if (dbItem == undefined && !innerData.dm().a('_pageCompress')) {
                                                                /*230321，对应上面data._multiRequestingLeft = 1的处理，对于反弹到上层图元进行内嵌图元遍历时，碰到内嵌容器图元此时_multiRequestingLeft
                                                                  属性不是0或undefined时，就过滤掉不处理，自然也不会触发其自动清理数据绑定和属性变量！*/
                                                                if (innerData._multiRequestingLeft) { //注意，这里不能return掉，否则会影响form绑定值。加上attrIndex，避免同一个图元所有属性都要打印输出针对图元的日志！
                                                                    attrIndex == 0 && console.error('WARNING: inner data', innerData.getTag(), 'is loading resource,and upper attrs and bindings of which will not be removed!', innerData, innerData._multiRequestingLeft)
                                                                } else {
                                                                    /*230415，在图标image原始内容没有当前属性绑定暴露时，再判断下反序列化时是否有[object]保存，并且根据上次序列化对象时是否有改对象，如果判断有
                                                                    并且标记了是动态创建的，那么久不会被当成底层去掉而同步移除清理！*/
                                                                    let attrDynamicCreate = false;
                                                                    if (typeof imageObjStored == 'object') {
                                                                        let storedAttrBind = i.getDataBindingItem(imageObjStored, attrKey); //240224，这里就没加上图元对象参数传入，怕有问题！
                                                                        attrDynamicCreate = storedAttrBind && storedAttrBind.dynamicCreate;
                                                                    }
                                                                    //tips 230624，注意，这里的移除，目的主要是针对渲染元素图标组件里动态创建属性的情况。
                                                                    if (!attrDynamicCreate && dbtmp[attrType][attrKey] && !dbtmp[attrType][attrKey].dynamicDelete) {
                                                                        //console.info('移除内嵌图元多的数据绑定，变量定义已不存在：', attrKey, i.clone(innerData.getDataBindings()));
                                                                        delete dbtmp[attrType][attrKey];
                                                                        return;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    } else {
                                                    }
                                                }
                                                let curFileName = urlName(url), //页面文件名称
                                                    //240217，页面文件名+当前页面索引整体作为key，这样当tab页签这种多个tab页签内嵌同一个页面时，可以根据索引区分！当前的attrKey应该放到哪个实例对象内！
                                                    fileIndexKey = curFileName + '>' + extra.multiDistinctIndex; //240218，注意，这里用间隔符号>，仅仅是为了恰好参考keyURL，跟keyURL本身并无关系！可以是任何甚至不用间隔符！
                                                if (data._i_fileIndex2SubIndex === undefined) data._i_fileIndex2SubIndex = {};
                                                if (data._i_fileIndex2SubIndex[fileIndexKey] === undefined) { //240217，对应key有可keyURL第二段值就用，没有就进入去计算
                                                    //240217，当前左右内嵌图元遍历时放入上层图元data的信息中，提取keyURL，并且结构化，这样根据当前文件名称就能获取到实例对象数组，如果有那么长度至少为1
                                                    let valueSimplified = {};
                                                    if (data._i_innerDatas) {
                                                        for (let tagToUpperKey in data._i_innerDatas) {
                                                            valueSimplified[tagToUpperKey] = true;
                                                        }
                                                    }
                                                    let treedTmp = i.toTreeJson(valueSimplified),
                                                        instArrTmp = treedTmp[curFileName]; //240217，'待验收>0>xxx；待验收>1>yyy'，根据“待验收”，就能获取到长度为1、2、3等的数组

                                                    //240217，结构化中没有找到当前文件对应的实力对象数组时，说明是新页面进入，那么索引自然是0。
                                                    if (instArrTmp === undefined) {
                                                        data._i_fileIndex2SubIndex[fileIndexKey] = 0;
                                                    } else { //240217，如果找到有，但是既然之前进入到这里，说明文件名+页面序号multiDistinctIndex整体没有进来过，说明是新的相同内嵌页，那么值就用此前长度+1，即用长度作为索引即可！
                                                        data._i_fileIndex2SubIndex[fileIndexKey] = instArrTmp.length;
                                                    }
                                                }

                                                //7）为了在上层图元中暴露好区分，这里自动单独做了一个特定的group，并且以图纸中设定的值为默认值，而不是对应图标内设置的暴露变量的默认值
                                                let groupInfo = curFileName + '>' + data._i_fileIndex2SubIndex[fileIndexKey] + '>' + i.autoTag(innerData, true, (paramNode) => {
                                                    return i.attrsFormBinded(paramNode).length != 0
                                                }); 
                                                innerData._tagToUpper = groupInfo; //230126，暴露给上层图纸图元的tag，即keyUrl的当前图元段

                                                /*230414，对上层图元存放找到对应内嵌图元的对应key-value！便于提供i.upperData()对应的i.innerData()获取内嵌图元对象！注意，因为同一个内嵌图元
                                                多个属性会通过innerData._tagToUpper合并到一起追加到上层图元上，补充关联信息时，也是按照覆盖的方式，这里会执行多次，最后一次覆盖为准！因为是共用
                                                同一个innerData._tagToUpper*/
                                                if (data._i_innerDatas == undefined) data._i_innerDatas = {};
                                                data._i_innerDatas[innerData._tagToUpper] = innerData;

                                                let innerDataValue = i.getValue(innerData, attrKey, attrType),
                                                    initialValue = innerDataValue != undefined ? innerDataValue : dbItem ? dbItem.defaultValue : null, //230619，默认值以配置的为准
                                                    attrToUpper = groupInfo + '>' + attrType + ':' + attrKey,
                                                    bindTypeTmp = i.isFormVarBind(i.getDisplayBindingName(data, attrToUpper)); //对应到上层图元（加载当前图纸url的渲染元素图元data）属性变量绑定
                                                if (!isRunning && topNode && topNode.dm().a('loadingAnalysis')) {
                                                    //231008，容器模板内嵌底层组件formValue绑定后，因为间隔一层才有属性暴露，导致
                                                    let curBindType = i.isFormVarBind(i.getDisplayBindingName(innerData, attrType + ':' + attrKey)),
                                                        upperAttrVals = i.getAttrFormTypedValueUpperLatest(data, attrToUpper, -1);
                                                    if (
                                                        curBindType == 3 &&
                                                        bindTypeTmp === 0 &&
                                                        upperAttrVals.length > 0
                                                    ) {
                                                        console.assert(i.hasAttrObjectKey(data, 'a:display'));
                                                        i.alert(`内嵌容器组件：“${data.dm()._url + ' - ' + data.getDisplayName()}”动态加载内嵌页面时，内嵌页面底层图元组件：“${url + ' - ' + innerData.getDisplayName()}”的属性“${attrType + ':' + attrKey}”为formValue绑定，暂不支持这种情况，需要改成form绑定，并且在编辑状态下实际上层暴露的属性中去做formValue绑定才行。`, '错误', false, null, null, [400, 250]);
                                                    }
                                                }

                                                //230418，注意，参数attrKey前面加上attrType + ':'，否则可能因为s:label等类型的绑定过来，被当成a:label就报错了！
                                                let innerBindItem = i.getDisplayBindingItem(innerData, attrType + ':' + attrKey), //231220，后面都要用到。
                                                    innerBindType = i.isFormVarBind(innerBindItem && innerBindItem.id), //内嵌图元当前属性的变量绑定类型。attrKey为内嵌图元innerData在其当前层的属性名称/keyURL
                                                    isFormResetType = bindTypeTmp != 1; //bindTypeTmp == 2 || bindTypeTmp == 3; //230220，注意，是对上层图纸图元属性的判断！230227，加上formValue类型绑定
                                                if (bindTypeTmp === 0) {
                                                    // console.warn(`WARN: formBind of upper data ${attrToUpper} is none（innerData: ${innerData.getDisplayName()}), if inner has been altered, uppers pages should be reload and save to update!`)
                                                }
                                                let innerDisplayDynamicLoad = false;
                                                if (data._i_innerDisplayDynamicLoad && (bindTypeTmp == 0 && (i.isEditing(data) || i.topData(data)._i_isEditConfigDlg)) && data.ca(attrToUpper) === undefined && innerBindType == 3) {
                                                    isFormResetType = true; //240303，之前是isFormResetType = bindTypeTmp = 3，但是显然，isFormResetType应该是true/false的布尔型啊！
                                                    bindTypeTmp = 3;
                                                    innerDisplayDynamicLoad = true;
                                                    console.error(`WARN: dynamic loading url ${url}，current attr: ${attrToUpper}`);
                                                }

                                                /*240212，能够根据下面，通过动态翻译给出新的属性名：别名就用底层属性名*/
                                                if (!runningMode()) hteditor.strings[attrToUpper] = i.charMultied(i.layersOfKeyURL(attrKey) + 1, '.') + _i.getAttrNote(_i.bottomData(innerData, attrKey), _i.bottomKeyURL(attrType + ':' + attrKey)); //attrToUpper.split('>').slice(1).join('>'); //attrToUpper.split('>').reverse().join('>');

                                                //8）首先根据内嵌图纸中的数据绑定，因为变量暴露的类型信息只有在symbols的json中有，所以由类型初步判断，形成初始的数据绑定结构用来给到上层渲染元素图标
                                                let bindingInfoTmp = {
                                                    /*数据绑定的变量名称前面，都加上类型a:/p:/s:等，用来区分！因为通过渲染元素暴露给上层的都是a,但是可能原本是s或p类型
                                                    举例："添加机构>0>n1>a:查看驻点信息详情 2 2>0>button1>s:layout.h"*/
                                                    attr: attrToUpper, //tips 240212，注意，不能放到这里用hteditor.getString(attrToUpper)，这里就是改实际数据结构了！下面name属性才只是显示，不影响数据！
                                                    name: runningMode() ? attrToUpper : hteditor.getString(attrToUpper), //240212，继承的属性，也用显示别名（只显示属性本身），跟实际的keyURL相互独立！！
                                                    valueType: dbItem == undefined ? (
                                                        dataDbObjTmp.vt ? dataDbObjTmp.vt :
                                                        (function() {
                                                            let symbolItemTmp = i.getDataBindingItem(innerData, attrKey, innerData);
                                                            if(symbolItemTmp && symbolItemTmp.valueType) return symbolItemTmp.valueType;
                                                            switch (typeof(innerDataValue)) {
                                                                case 'string':
                                                                    //逐层暴露时，不同类型，配置属性框类型保持一致！
                                                                    if (i.isColorStr(innerDataValue)) return 'Color';
                                                                    else if (attrKey.slice(-5) == '.font') return 'Font';
                                                                    else if (attrKey.slice(-14) == 'clip.direction') return 'ClipDirection';
                                                                    else return 'String';
                                                                case 'number':
                                                                    return 'Number';
                                                                case 'boolean':
                                                                    return 'Boolean';
                                                                case 'function': //注意，可能是字符串还需要识别转化！
                                                                    return 'Function';
                                                                case 'object': //注意，还需要识别转化，StringArray、NumberArray、ObjectArray等
                                                                    return isArrayFn(innerDataValue) ? 'ObjectArray' : 'Object'
                                                                default:
                                                                    console.warn('unrecogniced type:', typeof(innerDataValue), innerDataValue, attrKey, innerData);
                                                                    return 'Object';    //241004，之前默认是string类型，现在默认用object，只有这样，才能设置任意数值！尤其是对于tab这种其他页切换时才加载的情况！
                                                            }
                                                        })()
                                                    ) : dbItem.valueType,
                                                    defaultValue: initialValue, //默认采用下层配置的值
                                                    extraInfo: dbItem ? dbItem.extraInfo : null,
                                                    description: dbItem && dbItem.description, //231028，继承的属性，描述也要继承过去！
                                                    group: groupInfo // + (dbItem && dbItem.group ? '>' + dbItem.group : '') 好像没必要加
                                                };

                                                //240221，还原加载后删除掉，用完即走！
                                                if (dataDbObjTmp.vt) delete dataDbObjTmp.vt;

                                                //240615，将dataBindingItem定义的组，放到dataBindings中，这样查找时不用通过getBindingItem()去循环中遍历，速度更快！！可以用来给自动继承来判断，某些属性组的属性不被自动继承！
                                                dataDbObjTmp.group = dbItem && dbItem.group;

                                                //230619，随后属性定义的默认值结合下层属性是否为form绑定，决定采用下层属性定义的还是下层属性配置的值
                                                if (
                                                    innerBindType != 1 &&
                                                    attrType == 'a' //231008，加上这个，否则貌似对于组件图元的基础属性暴露，默认值就不会到上层去！
                                                ) bindingInfoTmp.defaultValue = dbItem ? dbItem.defaultValue : undefined;
                                                if (innerData.ca('dynamicCreate')) {
                                                    dataDbObjTmp.dynamicCreate = true;
                                                    dataDbObjTmp.dynamicDelete = undefined;
                                                }
                                                //tips 230617，【重要】上层属性初始配置化，逐层传递到底层，通过底层触发i.md后，再主动调用对上暴露handleCurrentSymbol来的这里，并不会逐层向上暴露中每一层都会进来！
                                                if (innerData.ca('dynamicDelete')) {
                                                    //需要删除的该组件的属性定义，标记上删除标记
                                                    dataDbObjTmp.dynamicCreate = undefined;
                                                    // 230619，删除也需要加上数据绑定标记，
                                                    dataDbObjTmp.dynamicDelete = true;
                                                    _i.setTimeout(() => {
                                                        dm.remove(innerData);
                                                        innerData = null;
                                                    }, 0);
                                                }
                                                //230617 tips：相对于curSymbolObj当前页面dm的属性暴露，data.innerDataBindings是多页全局的，对每页的属性暴露会统一合并！
                                                data.innerDataBindings[bindingInfoTmp.attr] = bindingInfoTmp;
                                                //240224，判断放到这里，因为下面有共用！当将要暴露过去的属性在上层并未继承时，不再做相关的初始化处理！包括data.fp向下同步notifyUpper()，以及关联影响的innerNotifyUpper等
                                                let isAutoInheritNeed = i.isAttrAutoInheritNeeded(innerData, attrKey, attrFormBindType, data, bindingInfoTmp.attr);
                                                if (bindingInfoTmp.valueType == 'Function') {
                                                    bindingInfoTmp.defaultValue = undefined;
                                                }
                                                if (
                                                    (
                                                        1 || //data.ca(bindingInfoTmp.attr) /*!= null*/ !== undefined ||
                                                        innerDisplayDynamicLoad
                                                    ) &&
                                                    bindingInfoTmp.valueType != 'Function' &&
                                                    !setImageOnly //230303，对于dm.handleCurrentSymbol(true,true)进来的情况，不进入到初始化赋值里，初始化赋值都给自下而上触底反弹来设置！
                                                ) {
                                                    //230320，日志输出记录，对于无绑定或者未获取到绑定时，打印出来提示！
                                                    if (innerBindType == 0) {
                                                        console.warn('inner data no binding??', innerData.getTag(), attrKey, i.clone(innerData.getDataBindings()));
                                                    }
                                                    //231101，tab页签非当前页初始加载时。主要是涉及用到i.isOrigionType，调用i.bottomData()时会出问题！加上条件!isTabOtherPagesIniting && 
                                                    let initIgnored = !isTabOtherPagesIniting && i.isOriginType(data, attrToUpper, 'func') && 0//230627，可能就是在最底层，并没有a:xxx这种带前缀的keyURL
                                                    if (
                                                        //240224，加上isAutoInheritNeed &&，当将要暴露过去的属性在上层并未继承时，不再做相关的初始化处理！包括data.fp向下同步notifyUpper()，以及关联影响的innerNotifyUpper等
                                                        isAutoInheritNeed &&
                                                        isFormResetType && //默认条件就是上层未formReset/formValue等绑定的情况
                                                        !initIgnored && //230627，这里对func的输入和输出也要禁掉，避免初始触发了不该触发的逻辑动作执行！
                                                        !i.isEqual(data.ca(attrToUpper), initialValue) //230629，需要判断是否相等，尤其是对象/数组类型，否则会导致向下触发不说，对于数据绑定中的函数也会触发执行，造成初始化时执行导致异常。
                                                    ) {
                                                        if (
                                                            1 //initialValue !== undefined //230628，对于null/undefined的初始值，不做向上同步，会导致触发尤其是bindControls将空值转换成form对象值来传递！注意0除外，所以要指出null和undefined
                                                        ) {
                                                            data._i_initialToUpper = true;
                                                            data.ca(attrToUpper, initialValue);
                                                            data._i_initialToUpper = false;
                                                        } else { //230919，发现有的时候不会自下往上同步值复位时，跟这里有关
                                                            console.warn(`WARN:attr ${attrToUpper} of control ${data.getTag()} will not transfer value to upper,as current init value is ${initialValue}`);
                                                        }
                                                    }
                                                    //231208，由setTimerout(0)内的data.fp拆分出来的三分中的一份，唯一成为循环内部同步执行的，用来让上层formReset等绑定的内嵌图元做好自己的notifyUpper初始化！
                                                    //240224，加上isAutoInheritNeed &&，当将要暴露过去的属性在上层并未继承时，不再做相关的初始化处理！包括data.fp向下同步notifyUpper()，以及关联影响的innerNotifyUpper等
                                                    isAutoInheritNeed && (isFormResetType || initIgnored) && data && innerData && data.fp('a:' + bindingInfoTmp.attr, '__formResetTypeInit__', data.ca(bindingInfoTmp.attr));
                                                    //240224，加上isAutoInheritNeed &&，当将要暴露过去的属性在上层并未继承时，不再做相关的初始化处理！
                                                    isAutoInheritNeed && _i.setTimeout(() => {
                                                        !(isFormResetType || initIgnored) && data && innerData && data.fp('a:' + bindingInfoTmp.attr, '__formResetTypeInit__', data.ca(bindingInfoTmp.attr));
                                                        _i.setTimeout(() => {
                                                            //231208.2，再内嵌一个异步循环，确保所有的都已经初始化过notifyUpper后，再启动真实的data.fp对form初始化向下赋值，触发业务逻辑！！！
                                                            if (
                                                                data &&
                                                                !(isFormResetType || initIgnored) &&
                                                                innerData /*&& !innerData._multiRequestingLeft*/ &&
                                                                !(i.getAttrFormTypedValueUpperLatest(data, bindingInfoTmp.attr, 1, true)) //传入参数true，这样不会递归完，找到有上层form绑定即可，都没有就返回false
                                                            ) {
                                                                //240125，form初始化向下逐层传递时的标记，方便最底层md监听响应处理时，能知道是来自上层form初始同步。不论是底层在attrsInit的且上层form的，还是仅仅上层form的。
                                                                data._i_isFormInitInnerFping = true;
                                                                /*240228，加上条件，主要是对于内嵌模板容器，将容器的display暴露继承到上层form绑定设置，加载时，内嵌会用最上层form绑定的那个url来初始化加载，同时也就得让
                                                                此前上层做了form绑定的继承的属性做好标记，在此处，不要再触发data.fp()向下同步导致再次重复加载了，这会导致加载时快速闪动的现象！！*/
                                                                if (!data._i_innerDisplayLoadUpperUsed || data._i_innerDisplayLoadUpperUsed.indexOf(bindingInfoTmp.attr) === -1) { //240301，之前貌似有bug后面!== -1，现在改成了=== -1
                                                                    data.fp('a:' + bindingInfoTmp.attr, /*undefined*/ '__fucking_undefined__', data.ca(bindingInfoTmp.attr));
                                                                }
                                                                data._i_isFormInitInnerFping = undefined;
                                                            }
                                                        }, 0);
                                                    }, 0);
                                                    if (data == null) { //230614，存在这里变成null的清空，是否是因为grid触发复制组件导致的？？
                                                        console.error('upper data has been removed??', innerData);
                                                        return;
                                                    }
                                                    if (!setImageOnly && (
                                                            (bindTypeTmp == 3 /*|| (bindTypeTmp == 0 && innerBindType == 3)*/ ) ||
                                                            (
                                                                bindTypeTmp == 0 && innerBindType == 3 && (
                                                                    i.isEditing(data) ||
                                                                    i.topData(data)._i_isEditConfigDlg ||
                                                                    data._i_isDisplayInheritUpperFormUsed
                                                                )
                                                            )
                                                        )) { //过滤掉dm.handleCurrentSymbol(true, true)进来的情况！！
                                                        let keyURLtmp = bindingInfoTmp.attr;
                                                        //用内嵌图元的tag，还是用当前上层图元的tag，取决于是从哪层扭转的formValue设置！
                                                        function __updateLatestFormValueTag(tagNode, info) {
                                                            function __exist(alias) {
                                                                return alias != undefined && alias.trim() != '';
                                                            }

                                                            if (!data._i_keyURL2FormValueTag[keyURLtmp]) data._i_keyURL2FormValueTag[keyURLtmp] = {};
                                                            //230418，注意，参数attrKey前面加上attrType + ':'，否则可能因为s:label等类型的绑定过来，被当成a:label就报错了！
                                                            let innerAttrAlias = /*i.getDisplayBindingItem(innerData, attrType + ':' + attrKey)*/ innerBindItem['alias'], //231220，用前面已经得到过的。
                                                                /*231029，存在上层容器图元熟悉变量绑定信息为空的情况，对于动态切换容器display内嵌地址时就是！此时通常innerDisplayDynamicLoad变量为true。下面这里仅仅只是
                                                                做了下非空判断，不是直接调用alias，并没有用到innerDisplayDynamicLoad，有待进一步观察测试。*/
                                                                displayDBItem = bindTypeTmp == 0 ? innerBindItem : i.getDisplayBindingItem(data, keyURLtmp),
                                                                dataAttrAlias = displayDBItem && displayDBItem['alias'],
                                                                attrAlias = __exist(dataAttrAlias) ? dataAttrAlias : innerAttrAlias;
                                                            data._i_keyURL2FormValueTag[keyURLtmp] = i.fromFlaggedRelURL(i.autoTag(tagNode) + '#' + (__exist(attrAlias) ? attrAlias : attrKey), '#');
                                                        }
                                                        if (data._i_keyURL2FormValueTag == undefined) data._i_keyURL2FormValueTag = {}
                                                        if (innerBindType == 1) { //只要有这种情况发生（可能链表中多段出现，不止初始一次），那就刷新一下    
                                                            __updateLatestFormValueTag(data, 'form → formValue');
                                                        } else if (innerBindType == 2) {
                                                            __updateLatestFormValueTag(data, 'formReset → formValue');
                                                        } else {
                                                            /*正常情况下不会为0，因为innerData是data内嵌图纸的图元，既然上层有了formValue绑定，内嵌图纸的属性起码也应该是form绑定而不是无绑定！而如果内嵌图元innerDatta
                                                            是基本图元并非容器无内嵌图纸，比如combobox_ui/input_ui等，此时上层属性为formValue绑定时，当前如果不是form或formReset，那么一定是formValue绑定！*/
                                                            console.assert(innerBindType == 3);
                                                            if (!i.hasInner(innerData)) { //没有内嵌时，就是基本图元
                                                                __updateLatestFormValueTag(innerData, 'formValue → formValue');
                                                            } else {
                                                                if (!innerData._i_keyURL2FormValueTag) return;
                                                                let displayBindingItem = bindTypeTmp == 0 ? innerBindItem : i.getDisplayBindingItem(data, keyURLtmp),
                                                                    dataAttrAlias = displayBindingItem && displayBindingItem['alias'],
                                                                    innerFormValTag = innerData._i_keyURL2FormValueTag[attrKey]; //i.autoTag(innerData);
                                                                if (!innerFormValTag && !dataAttrAlias) { //231101，发现 innerData._i_keyURL2FormValueTag为空对象！
                                                                    console.error('ERROR: _i_keyURL2FormValueTag error!', innerData.getTag(), attrKey, innerData._i_keyURL2FormValueTag);
                                                                }
                                                                //231011，加上i.fromFlaggedRelURL(属性别名URL,'#')，对于有相对路径的做处理变成绝对地址，实现字段层级的动态调整，如果没有相对路径，那么原样返回。
                                                                data._i_keyURL2FormValueTag[keyURLtmp] = i.fromFlaggedRelURL(dataAttrAlias && dataAttrAlias.trim() != '' && innerFormValTag ? innerFormValTag.split('#')[0] + '#' + dataAttrAlias : innerFormValTag, '#');
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    if (data.ca(bindingInfoTmp.attr) === undefined) { //tips 231027，属性初始配置不存在时，过滤掉初始化处理！
                                                    }
                                                }

                                                //20）开始准备回写上层图纸当前图元的图片/图标image
                                                if (curSymbolObj.dataBindings == undefined) {
                                                    curSymbolObj.dataBindings = [];
                                                }
                                                let exists = false;
                                                //15）如果存在则替换
                                                let symbolDataBinding = curSymbolObj.dataBindings;
                                                if (!symbolDataBinding) console.error('current symbol has none dataBindings!!', data, getTag(), curSymbolObj);
                                                //240131，试图提高性能
                                                symbolDataBinding && i.forEach(symbolDataBinding, (curNodeBinding, curBindingIndex) => {

                                                    /*tips 240224，注意，data.innerDataBindings只存放容器组件继承暴露的属性key-属性定义对象value，不包括组件默认的基础属性（form绑定或没绑定的），
                                                    也不包含非容器组件的基础属性！基础属性加载后就不会变动，因此如果想i.getDataBindingItem()不想每次都循环遍历，那就缓存基础属性，当传入keyURL就用上
                                                    data.innerDatabindings即可！！*/

                                                    if (exists) return; //240207，应该不会有重复的，一旦匹配到修改，就不再继续后面的，以减少性能消耗！此外，正因为是引用修改，所以其他方式优化性能不一定满足要求！
                                                    if (curNodeBinding.attr == bindingInfoTmp.attr) {
                                                        symbolDataBinding[curBindingIndex] = bindingInfoTmp; //tips 240223，如果有，那么向上更新！
                                                        exists = true;
                                                        return;
                                                    }
                                                });
                                                //230617，需要排序，合并同类型的一批，因为属性定义是数组，而group组标记相同的，可以是连续数组中不同位置，这会导致编辑器属性面板中名称重复不能合并的多段出现！
                                                if (!exists) {
                                                    isAutoInheritNeed = isAutoInheritNeed !== undefined ? isAutoInheritNeed : i.isAttrAutoInheritNeeded(innerData, attrKey, attrFormBindType, data, bindingInfoTmp.attr);
                                                    if (isAutoInheritNeed) {
                                                        let keystmp = i.arrKeyValues(symbolDataBinding, 'group'); //获取数组中指定字段的值列表，索引保持跟数组对应
                                                        let lastIndex = keystmp.length - 1,
                                                            targetIndex = lastIndex;
                                                        for (let idx = lastIndex; idx >= 0; idx--) { //反过来查找最近一次出现跟当前要追加暴露的属性group相同的项的索引
                                                            if (keystmp[idx] === groupInfo) {
                                                                targetIndex = idx;
                                                                break;
                                                            }
                                                        };
                                                        if (targetIndex === null || targetIndex === lastIndex) symbolDataBinding.push(bindingInfoTmp); //末尾则追加
                                                        else i.arrInsert(symbolDataBinding, targetIndex + 1, bindingInfoTmp); //非末尾则插入，且是在找到的组后面一个位置插入！  
                                                    }
                                                }

                                                //内嵌图纸绑定了"iotos.form"的图元属性，对应到上层图纸中自动做数据绑定
                                                if (formBindedTmp['a:' + bindingInfoTmp.attr] == undefined) {
                                                    //230220-23:37,内嵌图纸对上层图元自动暴露做的绑定，默认为formReset，因为逻辑默认都是自下往上逐层封装！上层只是粘合
                                                    if (isAutoInheritNeed !== undefined ? isAutoInheritNeed : i.isAttrAutoInheritNeeded(innerData, attrKey, attrFormBindType, data, bindingInfoTmp.attr)) { //240212，如果内嵌式formValue绑定，或者是底层属性而不是从更下级继承过来的，那么直接上层可以直接继承！
                                                        i.setAttrsFormBinded(data, bindingInfoTmp.attr, 'a', attrFormBindType == 3 ? 'formValue' : 'formReset');
                                                    }
                                                } else {}

                                                //240224，从前面移到这里实际开始被继承时才加上，结合i.isAttrAutoInheritNeeded（即便实际上并没有多大用途了，因为都取决于上层已设置好的数据绑定来来做属性暴露，但考虑到该函数逻辑还在，就走一遍）
                                                if (isAutoInheritNeed === /*!==*/ false) { //240224，只要不是false，是true或者undefined，都要记录起来！
                                                    // data.innerDataBindings[bindingInfoTmp.attr] = bindingInfoTmp;
                                                    delete data.innerDataBindings[bindingInfoTmp.attr];
                                                }
                                                //240224，加上标记，这样在遍历末尾最后处理时，不需要通过遍历完之后才知道是否有标记，如果都没有，而且multiDistinctIndex也是大多数默认0的情况，那么就白白耗费性能去了！
                                                data._i_hasBindDynamicDeleteFlag = undefined;
                                                let bindItemTmp = i.getDisplayBindingItem(data, bindingInfoTmp.attr);
                                                if (bindItemTmp) {
                                                    bindItemTmp.dynamicCreate = dataDbObjTmp.dynamicCreate;
                                                }
                                                if (dataDbObjTmp.dynamicCreate) { //230620，底层向上暴露动态新增标记时，在上层记录下来，好在暴露结束时，清理掉多余的新增标记的属性数据绑定定义。
                                                    if (!data.realDynamicCreates) data.realDynamicCreates = [];
                                                    data.realDynamicCreates.indexOf(attrToUpper) == -1 && data.realDynamicCreates.push(attrToUpper);
                                                }
                                                //230619，删除也要放到数据绑定中，因为如果减少到少于grid组件默认子节点数量/长度，那么初始刷新加载是要移除多余数据绑定的，因此也要标记删除，否则清理不掉！
                                                if (bindItemTmp) {
                                                    bindItemTmp.dynamicDelete = dataDbObjTmp.dynamicDelete;
                                                    //240224，加上标记，这样在遍历末尾最后处理时，不需要通过遍历完之后才知道是否有标记，如果都没有，而且multiDistinctIndex也是大多数默认0的情况，那么就白白耗费性能去了！
                                                    data._i_hasBindDynamicDeleteFlag = true;
                                                }
                                            }
                                        }
                                    };
                                };
                            });
                            if (forceEnable == true && setImageOnly) return;

                            //for循环后放上循环结束后的函数，确保如果for内部没有任何异步请求时，也能按顺序执行到for结束后的逻辑！
                            if (!ignoreFinishWhileImgAsync) {
                                datasTraverseFinishedLast();
                            } else if (__isBubblingEnter() && data._multiRequestingLeft) {
                            }
                            function datasTraverseFinishedLast() {
                                if (data == undefined) {
                                    console.error('upper container node has been removed??');
                                    return;
                                }
                                //240111，有的时候异常情况下，加载没体现出问题，但实际上有问题，那就是在自减前data._multiRequestingLeft已经等于甚至小于0，因此做一个断言！
                                console.assert(data._multiRequestingLeft > 0);
                                if (data._multiRequestingLeft) data._multiRequestingLeft -= 1; //成功、失败都自减1，表明已经牺牲或功成身退

                                //有多个内嵌图纸时，上层循环的末尾遍历结束。注意，该条件外，是多个内嵌图纸各自图元遍历完毕后结束，而这里是多个内嵌最后图纸的结束
                                if (!data._multiRequestingLeft) { //都处理完，data._multiRequestingLeft为0，或默认不传undefined也当成最后一个！
                                    if (i.isControlTyped(data, 'tab') || extra.multiDistinctIndex > 0 || data._i_hasBindDynamicDeleteFlag) {
                                        //对于tabView等带有多个内嵌图纸的渲染元素容器组件，在遍历最后一个页面时，把各自的属性并集一起展示，避免在编辑器中被后一个覆盖掉！   
                                        for (let attrInMuti in data.innerDataBindings) {
                                            let exists = false;
                                            //230616，对于删除标记的不能包含在内
                                            let dataBindItem = i.getDisplayBindingItem(data, attrInMuti); //tips 240224，之所以此前data.innerDataBindings是全量，但是属性暴露还是正常不会都暴露，是因为数据绑定才决定暴露与否！
                                            if (dataBindItem && !dataBindItem.dynamicDelete) {
                                                if (i.getDataBindingItem(curSymbolObj, attrInMuti, data, false)) exists = true;
                                                if (exists == false) curSymbolObj.dataBindings.push(data.innerDataBindings[attrInMuti]);
                                            } else {
                                                //230618，因为curSymbolObj只是用于当前上层的属性定义显示，不用来作为逐层向上暴露传递（逐层传递取决于data.getDataBindings())，因此可以大胆删除标记了被移除的属性。
                                                let idxInSymbol = i.arrFindIndex(curSymbolObj.dataBindings, 'attr', attrInMuti);
                                                if (idxInSymbol != -1) {
                                                    i.arrayIndexRemoved(curSymbolObj.dataBindings, idxInSymbol);
                                                    //240225，动态属性删除也要清理缓存对应的！避免i.getDataBindingsItem(data,attr)返回错误！
                                                    if (data._i_symbolAttrsDefault) delete data._i_symbolAttrsDefault[attrInMuti];
                                                    if (data.innerDataBindings) delete data.innerDataBindings[attrInMuti];
                                                }
                                            }
                                        }
                                    }
                                    //移除掉图元在上层图元数据绑定中存在而图标image里已不存在的
                                    let displayBindings = data.getDataBindings();
                                    for (let attrType in displayBindings) {
                                        for (let attrKey in displayBindings[attrType]) {
                                            // displayBindings[attrType][attrKey]['id'] == 'iotos.form'
                                            if (attrKey.split('>').length >= 4) { //数据内嵌暴露的属性
                                                //图纸当前渲染元素
                                                let dbItem = i.getDataBindingItem(curSymbolObj, attrKey, data), //240224，新传入图元参数，如果key存在就可以省去循环遍历
                                                    dbItemUpper = displayBindings[attrType][attrKey];
                                                if (attrType == 'a') {
                                                    if (dbItemUpper) {
                                                        let canBeRemoved = false;
                                                        //230619，统一通过数据绑定中的新增和删除标记来处理。未标记的表明是默认数量范围内的。
                                                        if (dbItem == undefined && !dbItemUpper.dynamicCreate && !dbItemUpper.dynamicDelete) { //1）没有属性定义，也没有数据绑定标记新增和删除标记的，那么删除数据绑定
                                                            //console.info('常规属性变量不存在:', attrKey, ',移除图元' + data.getTag() + '的数据绑定！');
                                                            canBeRemoved = true;
                                                        } else if (dbItem == undefined && dbItemUpper.dynamicDelete) { //2）没有属性定义，但有删除标记的，将属性数据绑定移除掉！对于减少到小于默认值得也兼容，刷新后不会自动增加。
                                                            //console.info('动态删除的组件:', attrKey, ',移除图元' + data.getTag() + '的数据绑定！');
                                                            canBeRemoved = true;
                                                        } else if (dbItem == undefined && dbItemUpper.dynamicCreate) { //3）没有属性定义，但有新增标记，
                                                            if (data.realDynamicCreates && data.realDynamicCreates.indexOf(attrKey) == -1) {
                                                                //console.error('WARNNING:', '动态不存在的属性绑定:', attrKey, ',移除图元' + data.getTag() + '的数据绑定！', data.realDynamicCreates);
                                                                canBeRemoved = true;
                                                            }
                                                        } else if (dbItem) {}

                                                        /*230624，需要加上条件i.upperData(data) == undefined，这样只有顶层才会移除，避免中间层被移除后，无法继续向上传递同步。主要用于
                                                        编辑状态下，打开任意层页面作为当下顶层时，属性列表移除掉无关的属性。关于用i.upperData(data)是否为null判断是否顶层图元，对于treeTable、tabView等是否符合，还有待进一步观察测试！*/
                                                        if (
                                                            canBeRemoved &&
                                                            i.upperData(data) == undefined &&
                                                            !i.isDialogAttrUpdateNeedCache(data)
                                                        ) {
                                                            delete displayBindings[attrType][attrKey]; //230616，注意，对象的delete删除，不能操作中间变量dbItemUpper，得操作原对象的层级
                                                        }
                                                    }
                                                } else {
                                                    console.error('异常！内嵌属性应该都属于a类型，请检查：' + attrType + ':' + attrKey);
                                                }
                                            }
                                        }
                                    }

                                    //移除掉图元在上层图纸中暴露变量属性赋值中内嵌已不存在的
                                    let dataAttrs = data.getAttrObject();
                                    if (dataAttrs) {
                                        for (let attrKey in dataAttrs) {
                                            if (attrKey.split('>').length >= 4) { //数据内嵌暴露的属性
                                                //图纸当前渲染元素
                                                let dbItem = i.getDataBindingItem(curSymbolObj, attrKey, data); //240224，传入新增的图元对象参数，可以利用_i_symbolDatabindings避免重复循环遍历！
                                                if (dbItem == undefined) { //渲染元素图标中没有
                                                    let dbItemUpper = displayBindings.a[attrKey];
                                                    if (dbItemUpper == undefined || !dbItemUpper.dynamicCreate) {
                                                        delete dataAttrs[attrKey];
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (!i.rdm(dm).a('saveInnerDisplays')) {
                                        console.info('触底反弹！', '【容器】', !!data && !!data.dm() && urlName(data.dm()._url), '|', data.getDisplayName(), '→', '【内嵌页（最后）】', url, '【总数量】', extra.multiDistinctIndex + 1);
                                        __bubblingUpper();
                                    } else {
                                        //i.upload(dm, function(result) { //由i.save()切换成i.upload()，这样编辑、运行状态下内嵌图纸加载结果都能正常保存！
                                        i.save(url, dm.toJSON(), function(result) { //用编辑状态的保存，运行状态下若要让内嵌图纸保存，得用i.upload()。为了提高运行加载效率，这里仅用编辑保存
                                            if (result == 0) console.error('save inner display error,may be cause some prop setting error for tag problem!');
                                            else if (data) {
                                                result == 1 && console.info(data.getTag() + '已保存内嵌图纸！' + url);
                                                /*【新】下一层图纸处理完毕后，触发上一层图纸处理！结合dm.handleCurrentSymbol函数内的初始判断，成功实现87654321的嵌套图纸
                                                加载顺序成功转成了12345678！整个数据逻辑、绑定机制就正常了！*/
                                                __bubblingUpper();
                                            }
                                        });
                                    }
                                } else {}
                            }
                        }
                        curSymbolObj = data.getImage(); //ht.Default.parse(jsonString);

                        /*这里需要兼容enableSymbolObjectSaving为true/false两种情况，即保存容器图标iamge的对象还是url都要支持！两种模式各有优劣势*/
                        if (typeof(curSymbolObj) == 'string') { //【情形1】保存的是图标url路径时，能进入渲染元素，肯定是已经自动资源加载完成了
                            data.ca('symbol', curSymbolObj);
                            let imageObjectTmp = ht.Default.getImage(curSymbolObj);
                            if (imageObjectTmp) {
                                console.info('assert enableSymbolObjectSaving is false:', curSymbolObj, url);
                                curSymbolObj = i.clone(imageObjectTmp); //230228，imageObjectTmp应该都已经是对象了啊，为什么还要ht.Default.getImage()去获取呢？？
                                console.info('force to enter handleCurrentSymbol when init!!', data.getTag(), url);
                                dm.handleCurrentSymbol(true, true); //第二个参数setImageOnly传入为true，此时就只触发进入下一步，而本身不会实际触发自身的handleCurrentSymbol处理

                            } else { //唯一出现的可能性是前面在情形2中，通过symbol的url进行setImage请求数据过程中，tabView这类多个平级内嵌for循环的下一个通过data.getImage()就获得url了！
                                console.info('multiple inner display in such symbol?', url, curSymbolObj);
                                __mergeRequestLoadingSymbol(curSymbolObj);
                            }
                        }
                        if (data.ca('symbol')) { //【情形2】保存的是图标对象[object]，当symbol路径在时根据路径加载原始对象内容
                            let symbolUrlTmp = data.ca('symbol');
                            curSymbolObj = i.clone(i.getImage(data._i_hasPopDisplay ? data : symbolUrlTmp)); //230228，代替ht.Default.getImage()，这样就不会触发多余的网络请求，对i.onImageLoaded造成干扰！当然，如果资源本地已有，那么用谁效果都一样！
                            console.info(url, 'symbol', symbolUrlTmp, 'has loaded?', curSymbolObj != undefined, symbolUrlTmp);
                            if (curSymbolObj) { //【情形2.1】如果对应的图标资源虽然不是本次渲染元素自动加载的，但是也有加载过，那么直接用
                                dm.handleCurrentSymbol();
                            } else { //【情形2.2】如果图元url资源没加载过，那么需要手动加载。
                                __mergeRequestLoadingSymbol(symbolUrlTmp);
                            }
                        } else { //【情形3】只有对象，并且也没有symbol存放原始图标的url，那只得用了，属于异常情况！
                            console.warn('abnormal! symbol image is object but url is empry!', url);
                            dm.handleCurrentSymbol();
                        }

                        //通过data.setImage来异步加载图元symbol的原始内容
                        function __mergeRequestLoadingSymbol(symbolUrl) {
                            console.info('load upper data-symbol json: ' + symbolUrl);
                            data.__cache = cache; //这里的data.setImage前也得加上这句，避免资源加载完毕后重入！
                            data._gv = extra.renderGv; //备用！注意，变量是短下划线，函数是长下划线，上面__cache长下划线是历史遗留问题！
                            data._i_containerImageGetting = true; //241102，下面存在异步，为了避免过程中内嵌组件渲染元素提前初始化，加上标记！
                            i.onImageLoaded(symbolUrl, function(img) {
                                data._i_containerImageGetting = undefined;
                                if (data == null) {
                                    console.error('data has been removed？?symbol url resource loaded', symbolUrl, 'and will be discard!', data);
                                    return;
                                }
                                if (data._symbolObject == undefined) data._symbolObject = img;
                                curSymbolObj = data._symbolObject;
                                dm.handleCurrentSymbol();
                            }, true);
                            ht.Default.getImage(symbolUrl); //240219，触发网络加载请求，通过前面onImageLoaded接收加载完成！
                        }

                    }
                    callback && callback(json, dm, gv, datas);
                    extra.renderData.iv(); //加上iv刷新界面，避免渲染元素加载内嵌图纸后位置没有对应渲染元素图元的矩形区域需点击一下才附着过去
                }
            } catch (error) {
                console.error('deserialize error!', url, error);
            }

            extra.renderData.a('__loadingStatus', false);
            // layer.closeAll();
        } else {
            clear()
        }
        return graphViewControl;
    }

    function getBrowerSize() {
        // 获取窗口宽度
        if (window.innerWidth)
            winWidth = window.innerWidth;
        else if ((document.body) && (document.body.clientWidth))
            winWidth = document.body.clientWidth;
        // 获取窗口高度
        if (window.innerHeight)
            winHeight = window.innerHeight;
        else if ((document.body) && (document.body.clientHeight))
            winHeight = document.body.clientHeight;
        return {
            width: winWidth,
            height: winHeight
        }
    }

    /*原始json对象为target，需要被合并过来的为source，经过mergeJSON后，
    target内容被修改成合并之后的内容，注意，并非由mergeJSON返回！*/
    function mergeJSON(target, source, deepRecurse = true) {
        if (deepRecurse) { //递归合并，一直到子元素的key-value，保持source的都合并到target枝叶里，而不是从主干开始key相同的整体被source替换掉！
            let o = target,
                n = source;
            let oType = Object.prototype.toString.call(o);
            let nType = Object.prototype.toString.call(n);
            if (nType == '[object Object]' && oType == '[object Object]') {
                //合并属性(object)
                for (let p in n) {
                    if (n.hasOwnProperty(p) && !o.hasOwnProperty(p)) {
                        o[p] = n[p];
                    } else if (n.hasOwnProperty(p) && (o.hasOwnProperty(p))) {
                        let oPType = Object.prototype.toString.call(o[p]);
                        let nPType = Object.prototype.toString.call(n[p]);
                        if ((nPType == '[object Object]' && oPType == '[object Object]') || (nPType == '[object Array]' && oPType == '[object Array]')) {
                            mergeJSON(o[p], n[p], true);
                        } else {
                            o[p] = n[p];
                        }
                    }
                }
            } else if (nType == '[object Array]' && oType == '[object Array]') {
                //合并属性(array)
                for (let i in n) {
                    let oIType = Object.prototype.toString.call(o[i]);
                    let nIType = Object.prototype.toString.call(n[i]);
                    if ((nIType == '[object Object]' && oIType == '[object Object]') || (nIType == '[object Array]' && oIType == '[object Array]')) {
                        mergeJSON(o[i], n[i], true);
                    } else {
                        o[i] = n[i];
                    }
                }
            }
            //合并属性(other)
            o = n;
        } else { //非递归，只到一级元素的key判断，source有跟target相同的，那么target中key对应的value，整体被source的value替换掉！
            Object.assign(target, source);
        }
    }

    //JSON对象扁平化
    function convertToFlatJson(jsonTreeObject, flag = '>') {
        try {
            let jsonList = {};
            //230925，加上过滤和日志提示，对于图元对象，不允许转换成扁平化！
            if (i.isWinOrNodeObj(jsonTreeObject)) {
                console.error('object is window or node object, and can not be converted to flat!!', jsonTreeObject);
                return jsonTreeObject;
            }
            //如果存在循环引用，则先清除掉循环引用
            if (i.hasLoopCycle(jsonTreeObject)) jsonTreeObject = JSON.decycle(jsonTreeObject);

            //231205，非简单数组就提示！！
            if (!i.isSimpleJson(jsonTreeObject)) {
                console.error('WARN: not simple json flat converting', jsonTreeObject);
            }

            function convertFromTree(jsonObj, parentKey = null) {
                for (let key in jsonObj) {
                    var val = jsonObj[key];
                    if (val == null || i.keys(val).length === 0 || !isObject(val)) {
                        if (i.__isKeyParsingValid(key) /*key != '__upper' ||*/ || key.slice(0, 3) != '_i_') {
                            jsonList[parentKey ? parentKey + key : key] = val;
                        }
                    } else {
                        key = key + flag;
                        convertFromTree(val, parentKey ? parentKey + key : key);
                    }
                }
            }
            convertFromTree(jsonTreeObject);
            return jsonList;
        } catch (error) {
            console.error(error, jsonTreeObject);
            return {}
        }
    }

    //231017，原本是convertToTreeJson内的递归函数，抽离出来，作为基础的函数用来安装记忆缓存，installMemory，提高性能效率！
    function convertArrListToJsonTree(targetJson, textArr, value = null, index = 0, nullToEmptyObject = true) {
        let lenIndexTmp = textArr.length - 1;
        if (index <= lenIndexTmp) {
            let item = textArr[index];
            if (index < lenIndexTmp) {
                targetJson[item] = {}
            } else if (index == lenIndexTmp) {
                targetJson[item] = value == null ? nullToEmptyObject ? {} : null : value;
            }
            convertArrListToJsonTree(targetJson[item], textArr, value, index + 1, nullToEmptyObject)
        }
    }
    //tips 230324。比如：tree = convertToTreeJson(raw,'/',null,false,true); 最后一个参数为true，那么返回结果任意层级里都会自动过滤去掉__upper
    function convertToTreeJson(jsonFlatObject, flag = '>', nullToEmptyObject = true, keepHtDataType = false, stringify = false) { //230311，是否移除 __upper:()=>parent
        try {
            //默认识别.，将所有的替换成>
            if (flag == "auto") { //230211，仅用于_http组件中，为了方便配置输入，key中以.为间隔，而不是>，输入麻烦。

                //240207，为了提高性能，利用chatgpt对底层forEach循环遍历相关的函数做了性能优化处理，替换原先的实现，有待观察测试：
                let newObject = {};
                for (let key in jsonFlatObject) {
                    if (key === '__upper') continue;
                    newObject[key.replaceAll('.', '>')] = jsonFlatObject[key];
                }
                //230201，返回值加上i.copy()，默认会去掉函数属性，解决__upper函数被带出来序列化的问题，需进一步观察测试是否引起新BUG
                let result = convertToTreeJson(newObject, '>', nullToEmptyObject, keepHtDataType);
                return stringify ? i.toJSON(result) : result; //230311，因为重写了JSON.stringify，会递归去掉全部__upper，因此提供移除后的返回。
            }

            let expandedtmp = {};
            for (let key in jsonFlatObject) {
                let arrtmp = key.split(flag),
                    jsonTreeTmp = {}
                if (arrtmp.length >= 2) {
                    convertArrListToJsonTree(jsonTreeTmp, arrtmp, jsonFlatObject[key], 0, nullToEmptyObject);
                    mergeJSON(expandedtmp, jsonTreeTmp);
                } else {
                    jsonTreeTmp[key] = jsonFlatObject[key];
                    mergeJSON(expandedtmp, jsonTreeTmp);
                }
            }
            expandedtmp = adjustNumKeyToArray(expandedtmp, keepHtDataType);
            return stringify ? i.toJSON(expandedtmp) : expandedtmp; //230311，因为重写了JSON.stringify，会递归去掉全部__upper，因此提供移除后的返回。
        } catch (error) { //230209,加上异常捕获和提示
            console.error(error);
            return null;
        }
    }

    function convertToTreeJsonEx(paramKeys, paramValues, jsonStringify = false, flag = '.', emptyValueDefined = '') {
        let paramtmp = {};
        //240131，试图提高性能
        paramKeys && i.forEach(paramKeys, (key, index) => {
            if (paramValues) {
                let valuetmp = paramValues[index];
                if (valuetmp) {
                    try {
                        let parsedtmp = i.jsonParse(valuetmp);
                        paramtmp[key] = parsedtmp;
                    } catch (ex) {
                        paramtmp[key] = valuetmp;
                    }
                } else { //key对应的value为空时，填入值是""、{}还是null、undefined,留给传参定义
                    paramtmp[key] = emptyValueDefined;
                }
            }
        });
        let ret = convertToTreeJson(paramtmp, flag);
        return jsonStringify ? JSON.stringify(ret, null, 4) : ret;
    }

    //配合给convertToTreeJson使用，将索引作为key的json对象格式，转换成正常的数组
    function adjustNumKeyToArray(jsonObject, keepHtDataType = false) {
        //230209，如果存在循环引用，那么也先清理掉
        //230927，在i.hasLoopCycle()第二个参数传入true，这样对于window/ht.node等可以快速判断，避免高频调用该函数造成延迟！
        if (keepHtDataType == false && i.hasLoopCycle(jsonObject, true)) jsonObject = JSON.decycle(jsonObject);
        return recurseAdjustJsonObject(jsonObject);

        //转换诸如['0','1','2','3']这样的数组成为数字数组[0,1,2,3]，如果内部元素有任何一个为非数字，那么返回空：[]
        function convertArrFromStrToNum(arr) {
            let arrtmp = [];
            /*存放数字数组中的最大、最小值，以此判断是否是从0开始依次存放的（原先是当字符串作为key，所以肯定不重复，这点不用判断）
            只有这种格式的才将数字数组返回，其他情况下都返回null，专门用来处理数组对象（键为对象key）的情况！*/
            let minmize = null,
                maxmize = null,
                len = arr.length;
            //240131，试图提高性能
            i.forEach(arr, (item, index) => {
                if (String(item) == '__upper') { //过滤掉获取父对象的函数
                    len -= 1;
                    return;
                }
                let numtmp = Number(item);
                if (isNaN(numtmp)) { // 注意：js NaN判断，并不是用：numtmp === NaN
                    return; //注意，js函数内的for循环体中的return，不是退出返回函数，而是退出循环本身，转到循环后继续执行！！
                }
                if (minmize == null || minmize > numtmp) minmize = numtmp;
                if (maxmize == null || maxmize < numtmp) maxmize = numtmp;
                arrtmp.push(numtmp);
            });

            return minmize == 0 && maxmize == len - 1 ? arrtmp : null;
        }

        /*是数组的对象格式，则返回数组的长度；否则返回null*/
        function isArrayObjectedStyle( /*jsonObject*/ objectKeys) {
            let keystmp = objectKeys;

            if (keystmp.length === 0) return null;
            let arrtmp = convertArrFromStrToNum(keystmp);
            return arrtmp ? arrtmp.length : null
        }

        //允许直接传入根对象{}，保持parentKey为null，
        function recurseAdjustJsonObject(jsonObject, parentKey = null) {
            if (i.isHtNodeData(jsonObject) && keepHtDataType || i.isWindow(jsonObject)) return jsonObject; //230310，如果是ht对象并且传参要求保持ht对象格式时，就作为最终值来处理，直接返回。
            let keystmp = i.keys(jsonObject); //240216，放到上面来，公共用！
            //240216，jsonObject换成公共算好的kestmp，避免性能浪费！
            let len = isArrayObjectedStyle( /*jsonObject*/ keystmp); //判断该对象的当前级key，是否满足数组的对象格
            if (len == null) { //不满足，是常规对象
                let jsonKeySize = keystmp.length;

                for (let idx = 0; idx < jsonKeySize; idx++) {
                    let key = keystmp[idx],
                        valtmp = jsonObject[key]
                    if (typeof(valtmp) != 'object' || valtmp == null) continue; //直接是最终值时，跳过
                    let parent = jsonObject;
                    jsonObject[key].__upper = () => parent;

                    //不能用：jsonObject[key] = recurseAdjustJsonObject(jsonObject[key], key)，会导致循环引用问题导致JSON.stringify()会报错！
                    //也无需return，对于目前for in没有下一级的，直接返回原对象就好；对于有下一级并且生成数组时，直接在函数内部通过parent()已经引用操作了！
                    recurseAdjustJsonObject(jsonObject[key], key) //传入parentKey是字符串时，表明外层循环是常规对象，非数组的对象格式
                }
                return jsonObject;
            } else { //满足，是数组的对象格式，并返回长度
                let jsonArray = [];
                //只用到返回的个数，按照索引驱对象的值来返回即可，工具函数convertArrFromStrToNum返回只要不是null，内容本身意义在此处并不大！
                for (let i = 0; i < len; i++) {
                    let itemObject = jsonObject[i + '']
                    if (itemObject) {
                        let parent = jsonObject;
                        itemObject.__upper = () => parent;
                    }
                    //这种情况是否return不重要，对于非根对象，都可以通过引用来改变值的，不像初始根对象传入{}要变成[]那一定得return
                    if (isObject(itemObject)) {
                        let ret = recurseAdjustJsonObject(itemObject, i); //传入parentKey是数字时，表明外层循环是数组的对象格式
                        itemObject = ret;
                    }
                    jsonArray.push(itemObject);
                }
                if (parentKey != null) {
                    jsonObject.__upper()[parentKey] = jsonArray;
                }
                /*如果parentKey == null，只能说明一个问题，根对象是数组的对象格式！
                注意，对于数字类型，才用返回结果*/
                return parentKey == null ? jsonArray : typeof(parentKey) == 'number' ? jsonArray : jsonObject.__upper();
            }
        }
    }

    //判断innerNode是否是parentNode任意下一级内部的子节点
    function isInnerChild(parentNode, innerNode) {
        let isChildTmp = false;
        parentNode.dm().eachByBreadthFirst((child) => {
            if (child == innerNode) {
                isChildTmp = true;
                return;
            }
        }, parentNode)
        return isChildTmp;
    }

    //230312，初始化设置，对develop和非开发账户，针对性的界面或属性显示或隐藏！
    function initDevelopOnly() {
        // //230309，非开发者账户，隐藏左上角菜单、图纸、图标tab，默认只有图纸！
        if (1 /*window._i_user != 'develop'*/ ) { //230904，任何用户下，都对“组件”项隐藏！！
            let component = editor.leftTopTabView.getTabModel().getDatas().get(3), //获取“组件”
                dataJson = editor.rightBottomTabView.getTabModel().getDatas().get(4); //“鹰眼”后面的“数据”，非开发账户，不可见，只能右上角点击“下载”
            component.setVisible(false);
        }
    }

    function initEditor(res = null, name = null, forceEnter = false, dataInvoking = null) {
        function __pureLoadEditor() {
            var urls = i.window().hteditor_config.subConfigs || [];
            layer.load(1);
            if (window.editor) {
                window.editor.reload();
                layer.closeAll();
                return;
            }
            urls.push(getUrlOverIpParam("client.js"));       
            ht.Default.loadJS(urls, function() {
                urls = [
                    getUrlOverIpParam("locales/" + hteditor.config.locale + ".js"),
                    getUrlOverIpParam("custom/locales/" + hteditor.config.locale + ".js")
                ];
                urls.push(hteditor.init);
                if (hteditor.config.libs) {
                    urls = urls.concat(hteditor.config.libs);
                }
                urls.push("vs/loader.js");
                ht.Default.loadJS(urls, function() {
                    urls = [];
                    window._i_loaderDefine = define;
                    define.amd = undefined;
                    urls.push("vs/editor/editor.main.js");
                    ht.Default.loadJS(urls, function() {
                        define.amd = undefined;
                        urls = [];
                        urls.push("vs/editor/editor.main.nls.js");
                        ht.Default.loadJS(urls, function() {
                            window.editor = hteditor.createEditor({
                            });
                            i.window().editor = window.editor;
                        });
                    });
                });
            });
        }
        //强制进入
        if (forceEnter) {
            __pureLoadEditor();
            return true;
        } else if (
            runningMode() &&
            i.getItemWithExpiration('_i_user', false) && //240525，这里第二个参数应该传入false貌似，否则应该会导致重复刷新死循环吧！
            (
                window.parent === window.top ||
                (window.parent.parent === window.top && window.top.name == 'display.html?tag=displays/develop/uiotos/aiotos.json')
            )
        ) {
            window._i_reEnteringWithSessionStorage = true;
            i.showMessage('自动登录' + i.user() + '...', 'info', null, 'center', 180, 0);
            __pureLoadEditor();
            return true;
        }

        //正常登录后进入
        if (!isObject(res) || res.code != 0) return;
        try {
            var uid = {},
                obj = null,
                tabletmp = null,
                infoStr = {},
                username = name ? name : i.jsonParse(res._requestParams.data).username;
            if (res.code === 0) {
                uid = {
                    user_id: res.user_id
                }
                window.sessionStorage.setItem('login_res', JSON.stringify(res));
                i.setItemWithExpiration('_i_user', username, 1); //240525，登录缓存24小时。缓存一分钟是这样：1 / 24 / 60
                i.window()._i_user = username;
                window.aiotos = {
                    'userName': username,
                    '_i_user': username,
                    'username': username
                };
                __pureLoadEditor();
                var user_id = JSON.stringify(uid);
                window._i_user = i.window()._i_user = username
                window.sessionStorage.setItem("user_id",user_id);
                return true;
            } else {
                uid = {
                    user_id: null
                };
            }
        } catch (error) {
            console.error(error);
        }
    }

    /*从现在起，公共的工具函数带有iotos命名空间！历史的逐步迁移*/
    var i = _i = iotos = {
            /*231017，在JavaScript中，你可以使用函数来做记忆缓存，一种常见的方式是使用闭包。闭包可以保留函数
            作用域内的变量，即使函数执行完毕后，这些变量依然可以被访问。因此，你可以利用闭包的特性来创建记忆缓存。*/
            installMemory: function(func, funcName = null) {
                let cache = {};
                return function() {
                    let argsNodeConverted = [],
                        argstmp = Array.from(arguments),
                        needUpdate = false; //是否需要刷新缓存
                    argstmp && argstmp.forEach(arg => {
                        let argtmp = arg;
                        if (i.isHtNodeData(arg)) { //ht图元对象转成url+tagname
                            let data = arg;
                            argtmp = data.dm() && data.dm()._url + ':' + data.getDisplayName();
                            function __setFlagFuncWithNodeTag(boolValue) {
                                if (!iotos._i_lastUpdated) iotos._i_lastUpdated = {};
                                if (funcName && !iotos._i_lastUpdated[funcName]) iotos._i_lastUpdated[funcName] = {}; //函数名称-图元对象地址:true/false
                                /*当前函数发现ht图元组件表单属性更新后，除了当前拿当下非缓存数据，同时给自己也按照函数名称也做好标记，如果其内部有其他记忆函数也有调用时，
                                可以判断其堆栈调用的上一级函数名称也在记忆函数中，那么根据名称和存储的结合图元地址的信息，一旦发现是true，即便新旧值相等，那么自己也重新
                                获取不用缓存！而上层函数一旦再次被调用，此时新旧值相等时，自身的标记也会复位！*/
                                if (funcName) iotos._i_lastUpdated[funcName][argtmp] = boolValue;
                            }
                            /*二、查询
                            传入上层函数名称，在标记对象中，按照上层函数名称、当前图元对象地址，查询其标记状态*/
                            function __getFlagFuncWithNodeTag(upperFuncName) {
                                return upperFuncName && iotos._i_lastUpdated && iotos._i_lastUpdated[upperFuncName] && iotos._i_lastUpdated[upperFuncName][argtmp];
                            }
                            //新旧值不相等，就认为是图元对象有变化，不能用缓存的结果了！
                            if (data._i_propChangedCountNewValue != data._i_propChangedCountOldValue) {
                                needUpdate = true;
                                __setFlagFuncWithNodeTag(true); //函数名称-图元对象地址:true/false。只要新旧计数不想等，那么就更新缓存！如果相等，那么还要判断下再决定是否采用缓存！
                            } else {
                                /*  需要索引为2，才能获得实际要的外层调用函数名，示例：
                                    0: "forEach" //当前forEach
                                    1: "hasAttrObjectKey" //当前的i.xxx函数
                                    2: "hasInner" //调用当前i.xxx的上层函数
                                */
                                let upperFuncName = i.getFuncNamesFromStack()[2],
                                    isUpperFuncMemType = [...i.memoryFuncList.iotos, ...i.memoryFuncList.others].indexOf(upperFuncName) != -1;
                                if (__getFlagFuncWithNodeTag(upperFuncName) || !isUpperFuncMemType) { //注意，如果上层函数不是记忆函数，那么当前大胆放心更新缓存！
                                    needUpdate = true;
                                    __setFlagFuncWithNodeTag(true);
                                    console.warn(`WARN: upper func "${upperFuncName}" just invoked with the same node "${arg}" as arg, so even node prop change count seems keeping no change, but will be recognized as changed!`)
                                } else { //复位标记，不论之前标记是否为true。再次调用的时候，如果值未变化，且上层并无标记为true，则对自身复位标记。
                                    __setFlagFuncWithNodeTag(false);
                                }
                            }
                        } else if (i.isWindow(arg)) { //window对象转为当前页面地址
                            argtmp = '__window__' + window.location.href
                        }
                        argsNodeConverted.push(argtmp);
                    })
                    let key = JSON.stringify(argsNodeConverted);
                    if (!cache[key] || needUpdate) {
                        cache[key] = func.apply(this, arguments);
                    } else {
                        console.info('FROM MEMORY CACHED:', key, cache[key])
                    }
                    return cache[key];
                };
            },
            arraySizeAssured: function(arr, count = 2, defaultValue = '') {
                for (var i = 0; i < count; i++) {
                    if (arr[i] == undefined) arr[i] = defaultValue;
                }
                return arr;
            },
            //对直接返回arr[index]的一个null判断保障，将原先的defaultIndex默认值0改成了index，避免动态参数时"诡异BUG"
            indexAssure: function(arr, index, defaultIndex = index) {
                if (arr == null) return null
                let ret = arr[index] != undefined ? arr[index] : arr[defaultIndex] != undefined ? arr[defaultIndex] : null;

                //注意，一定要用三个等号来判断，因为如果是两个等号，不会判断类型，if(0 == '')为true导致0被转换成null了！！
                if (typeof(ret) == 'string' && ret.trim().length == 0) {
                    ret = '';
                    arr._forcedEmpty = true; //避免重入受影响！
                } else if (!arr._forcedEmpty && ret === '') ret = null; //bindControls中每项的内容如果有空""，也当成null来处理！！

                return ret;
            },
            //240606，数组指定索引的数据。如果索引不存在，或者数组不存在，那么返回默认值！
            indexedValue: function(arr, index, defaultValue = '') {
                if (!arr || arr[index] === undefined) return defaultValue;
                else return arr[index];
            },
            //autoTag注意要求组件displayName最好不要为空，这样自动增加的后缀更可靠
            autoTag: function(node, byClass = true, tagFilterFunc = (paramNode) => { //默认是按照编辑器配置的"名称"分类统计计数，避免都是按照ht.Node
                return i.getName(paramNode); //比如dialog-ui组件，拖放进来默认"名称"属性为dlg，那么连续拖放多个，会按照图纸中有几个dlg来计算给出tag
            }) {
                if (node == undefined) {
                    console.trace(0)
                    return null
                }
                //230602，当前显示名称是否已带有tag标签信息，大写（）或者小写()，并且最后一个是反括号，这种情况就被认作是带了tag信息，而原始的显示名称是正括号前的部分！
                function __isDisplayNameWithTag(name) {
                    function __hasPairsFlag(flagLeft, flagRight) {
                        return name.indexOf(flagLeft) != -1 && name.indexOf(flagRight) != -1 && name.slice(-1) == flagRight;
                    }
                    return name && (__hasPairsFlag('(', ')') || __hasPairsFlag('（', '）'));
                }
                //通过表填后的显示名称获取原名称，如果无显示名称，则返回undefined，不会自动创建一个
                function __rawNameFromTagedDisplay(node) {
                    let nametmp = node.getDisplayName();
                    rawtmp = nametmp;
                    if (nametmp.split('(').length == 1) {
                        if (nametmp.split('（').length >= 2) rawtmp = nametmp.split('（')[0];
                    } else rawtmp = nametmp.split('(')[0];
                    return __isDisplayNameWithTag(nametmp) ? rawtmp : nametmp;
                }

                //230606，chatgpt版：js 字符串移除末尾的一个或多个连续的符号：'
                function __removeContinuousSymbols(str) {
                    return str.replace(/'+$/, '');
                }
                `
                console.log(removeContinuousSymbols("hello''''")); // 返回 'hello'
                console.log(removeContinuousSymbols("abc''_''''''")); // 返回 'abc''_'
                console.log(removeContinuousSymbols('xyz')); // 返回 'xyz'
                console.log(removeContinuousSymbols("''''")); // 返回 ''
                `
                //230707，对于标签文字，需要特殊处理，因为不能设置setName()，否则会显示在左侧，而且属性配置无法隐藏
                let nameGeted = node.getClassName() == 'ht.Text' ? 'Text' : node.getName();

                function __tag() {
                    //基础图元比如ht.Text，通常不参与里面的逻辑，因为简单重新加载并不会调用到autoTag，这回导致运行时动态计算的tag和实际保存序列化的tag不一致，导致容易引起BUG以及向下兼容问题！
                    let isTagEmpty = node.getTag() == undefined || (node.getTag().trim && node.getTag().trim() == ""); //240618，加上node.getTag().trim &&，因为可能是3659这种数字作为tag也是有可能的！
                    if (isTagEmpty || (node.getDisplayName() == node.getTag() && !i.isSimpleData(node))) {
                        let classNameTmp = node.getClassName().split('.').slice(-1)[0], //230602，如果末尾不加上[0]，会导致返回的是字符串的数组形式比如['Node']，为什么之前一直都没有，也在用？？？
                            nodeNameTmp = i.getName(node); //230408，如果没有displayName，那么在自动创建tag的同时也给其自动赋值 //230602，用i.getName()代替data.getDisplayName()
                        let nametmp = (nodeNameTmp ? nodeNameTmp : classNameTmp),
                            rawName = nametmp;
                        if (nametmp == "Node") nametmp = 'n';
                        if (nodeNameTmp == undefined) node.setDisplayName(nametmp); //230408，如果没有displayName，那么在自动创建tag的同时也给其自动赋值
                        else if (__isDisplayNameWithTag(node.getDisplayName())) { //230602，当前tag不存在，但是name和displayName都有，可能是新创建，也可能是拷贝其他的（连同name和displayName一并拷贝的）已经带有此前tag信息的显示名称！
                            rawName = __rawNameFromTagedDisplay(node);
                            node.setDisplayName(rawName);
                        } else if (nameGeted == undefined && node.getDisplayName() == node.getTag()) { //230606，name为空，但是显示名称和TAG相等时，比如同为api1/func3等
                            rawName = __removeContinuousSymbols(node.getDisplayName()).replace(/\d+$/, ''); //230606，js 移除字符串中末尾为连续数字之后的部分，包括数字的末尾如果存在连续的'''这种情况！
                            node.setDisplayName(rawName);
                        }

                        //230602，对于遗留的兼容，已经拖放到页面中的已有项目的图元，如果再次进行复制，要知道默认情况下其getName()是没有设置的！如果留空，那么对其的复制然后持续粘贴，发现全都是追加'而不是计数增加！
                        if (nameGeted == undefined) { //230706，对于基础的文本标签组件，不加上setName，否则会多出一个侧边显示还没发去掉！
                            nametmp = rawName; //赋值name后，需要更新，否则会在旧的基础上追加
                            node.setName(rawName);
                            node.s('label.opacity', 0); //230710，默认不显示左侧标签文字
                        }
                        let indextmp = i.getDataIndex(node, byClass, tagFilterFunc); //比直接用node.getId()要短很多！
                        /*230625，对于rect矩形等这种手动设置了tag，并且刷星也不会自动调用i.autoTag的，可能会因为嵌套导致调用i.autoTag，从而运行时在原有tag上加上数字，但是又没法运行时保存，导致跟可见的配置不一样，从而容易出问题！因此，当
                        发现有设置tag时，就不要自动调整追加了，手动设置的就按照手动的来！！*/
                        let tagtmp = isTagEmpty ? nametmp + indextmp : node.getTag();
                        //此前有设置tag，就返回。不额外加了，否则容易引起编辑、运行时tag不一致！如果想要统一对此前手动不规范配置的tag做统一处理，那么这段就用之前的“let tagtmp = nametmp + indextmp”即可！
                        if (!isTagEmpty) return tagtmp;
                        /*如果此前tag存在，那么就在后面加上'，比如之前Text3、4、5，后来把Text4删除了，再添加分配的index还是5，
                        避免两个冲突，所以就是Text5'，加上'后还冲突救再继续加，直到不冲突为止！*/
                        function __tailAvoidingTagConflict(node, tag) {
                            if (node.dm().getDataByTag(tag)) {
                                return __tailAvoidingTagConflict(node, tag + "'");
                            } else {
                                node.setTag(tag);
                                return tag;
                            }
                        }
                        return __tailAvoidingTagConflict(node, tagtmp);
                    } else {
                        return node.getTag();
                    }
                }
                //230602，为了方便编辑状态下右下角直观看到是什么类型的组件，而且多个的情况下各自的tag是什么
                let tagtmp = __tag(),
                    displayNameTmp = node.getDisplayName();
                if (isArrayFn(displayNameTmp)) { //230607，发现竟然有数组的情况！对于ht.Text文字属性通过form绑定暴露到上层页面之后
                    console.warn('displayName is array type??', displayNameTmp);
                    displayNameTmp = displayNameTmp.join(''); //强制转换成字符串！
                } else if (!displayNameTmp) displayNameTmp = nameGeted ? nameGeted : tagtmp; //230612，可能存在初始displayName没有的情况，比如自行创建实例化图元节点对象，只给tag时，可以通过i.autoTag(datatmp)操作下，会自动更新displayName

                //240618，加上条件|| typeof(displayNameTmp) == 'number'，避免这种情况下报错！
                if (typeof(displayNameTmp) == 'number') {
                    displayNameTmp = displayNameTmp + ''; //强制转换成字符串！
                }

                //230603，存在手动修改tag的情况，此时如果前面displayName显示已经有了上次的tag放到括号内，那么久修改，而不是追加，成为多个括号对
                let oldTagInfo = displayNameTmp && displayNameTmp.match(/（(.+?)）/), //正则表达式查找括号内的内容
                    oldTag = oldTagInfo && oldTagInfo.length >= 2 ? oldTagInfo[1] : undefined; //是否有（）内的tag标签
                if (tagtmp && displayNameTmp && (!oldTag || oldTag != tagtmp)) { //调整之前，名称显示是不会包括tag标签内容的，有包括就不再重复进入处理！
                    let newDisplayName = displayNameTmp;
                    if (oldTag) newDisplayName = displayNameTmp.replace(oldTag, tagtmp);
                    //注意，动态创建的图元，需要设置name属性，否则autoTag自动创建的tag标签总是后面加上'，而不是数字加1
                    else newDisplayName = displayNameTmp + '（' + tagtmp + '）'; //通常是有单独设置显示名称跟name名称不一致时（中文），此时括号带上tag英文，作为新的展示！区别于上面逻辑，上面显示括号里外重复的一段没意义，就干脆显示括号内的tag！
                    node.setDisplayName(newDisplayName)
                }
                console.assert(!isArrayFn(node.getDisplayName()));
                return tagtmp;
            },
            multiState: function(
                backgrounds, selectBackgrounds, activeBackgrounds, //xxxs分别对应2个，常态和划过态
                textColors, selectTextColors, activeTextColors, //xxxs分别对应2个，常态和划过态
                borderWidths, //xxxs对应3个，常态、划过态、按下态
                borderColors, //xxxs对应3个，常态、划过态、按下态
                borderRadius = [3, 3, 3, 3],
                button = null) {

                let thinColor = "rgb(255,255,255)",
                    thickColor = "rgb(22,125,255)"

                let params = {};
                //background
                params.background = backgrounds ? isArrayFn(backgrounds) ? backgrounds[0] : backgrounds : thinColor
                params.hoverBackground = backgrounds ? isArrayFn(backgrounds) ? backgrounds[1] : rgbaForced(backgrounds) : rgbaForced(thinColor)

                params.selectBackground = selectBackgrounds ? isArrayFn(selectBackgrounds) ? selectBackgrounds[0] : selectBackgrounds : thickColor
                params.selectHoverBackground = selectBackgrounds ? isArrayFn(selectBackgrounds) ? selectBackgrounds[1] : rgbaForced(selectBackgrounds) : rgbaForced(thickColor)

                params.activeBackground = activeBackgrounds ? isArrayFn(activeBackgrounds) ? activeBackgrounds[0] : activeBackgrounds : thickColor
                params.selectActiveBackground = activeBackgrounds ? isArrayFn(activeBackgrounds) ? activeBackgrounds[1] : rgbaForced(activeBackgrounds) : rgbaForced(thickColor)

                //textColor
                params.textColor = textColors ? isArrayFn(textColors) ? textColors[0] : textColors : thickColor
                params.hoverTextColor = textColors ? isArrayFn(textColors) ? textColors[1] : rgbaForced(textColors) : rgbaForced(thickColor)

                params.selectTextColor = selectTextColors ? isArrayFn(selectTextColors) ? selectTextColors[0] : selectTextColors : thinColor
                params.selectHoverTextColor = selectTextColors ? isArrayFn(selectTextColors) ? selectTextColors[1] : rgbaForced(selectTextColors) : rgbaForced(thinColor)

                params.activeTextColor = activeTextColors ? isArrayFn(activeTextColors) ? activeTextColors[0] : activeTextColors : thinColor
                params.selectActiveTextColor = activeTextColors ? isArrayFn(activeTextColors) ? activeTextColors[1]  : rgbaForced(activeTextColors) : rgbaForced(thinColor)

                //border
                /*240727，对于渲染元素普通按钮v2，貌似是因为加上了css边框后发现，设置边框后尤其是奇数，会出现明显边框与组件内边的空隙，而且是透明的！！这样体验不精细，不好！因此对于普通按钮v2，默认边框宽度就是0（此时表现正常），
                而对话框的默认脚部按钮，调用了当前方法，对于浅色背景没啥影响，深色背景的按钮就比较明显！因此判断背景颜色，然后选择性，执行下面逻辑：浅色，正常走之前的逻辑，深色背景，则一刀切全部边框强制为0！*/
                let isLightBackground = rgbaNum(params.background,0) > 245;
                let borderWidthTmp = params.borderWidth = borderWidths ? (isArrayFn(borderWidths) !== undefined ? borderWidths[0] : borderWidths) : 1;
                if(!isLightBackground && borderWidthTmp > 0){
                    borderWidthTmp = 0;
                    console.error('WARN: border of button v2 with cssborder and dark background will be auto forced to 0!');
                }
                let hoverBorderWidthTmp = params.hoverBorderWidth = borderWidths ? (isArrayFn(borderWidths) ? borderWidths[1] !== undefined ? borderWidths[1] : borderWidths[0] : borderWidths) : 1;
                if(!isLightBackground && hoverBorderWidthTmp > 0){
                    hoverBorderWidthTmp = 0;
                }
                let activeBorderWidthTmp = params.activeBorderWidth = borderWidths ? (isArrayFn(borderWidths) ? borderWidths[2] !== undefined ? borderWidths[2] : borderWidths[0] : borderWidths) : 1;
                if(!isLightBackground && activeBorderWidthTmp > 0){
                    activeBorderWidthTmp = 0;
                }

                let borderColor = params.borderColor = borderColors ? isArrayFn(borderColors) ? borderColors[0] : borderColors : thickColor
                let hoverBorderColor = params.hoverBorderColor = borderColors ? isArrayFn(borderColors) ? borderColors[1] !== undefined ? borderColors[1] : borderColors[0] : borderColors : thickColor
                let activeBorderColor = params.activeBorderColor = borderColors ? isArrayFn(borderColors) ? borderColors[2] !== undefined ? borderColors[2] : borderColors[0] : borderColors : thickColor

                //240722，需要这么做，边框宽度和颜色才能生效！
                params.border = new ht.ui.border.CSSBorder(borderWidthTmp, borderColor);
                params.hoverBorder = new ht.ui.border.CSSBorder(hoverBorderWidthTmp, hoverBorderColor);
                params.activeBorder = new ht.ui.border.CSSBorder(activeBorderWidthTmp, activeBorderColor);
                // params.disabledBorder(new ht.ui.border.CSSBorder([wtmp, wtmp, wtmp, wtmp], borderColor3));

                params.borderRadius = borderRadius

                //buttton used if exists
                if (button) {
                    button.setBackground(params.background);
                    button.setHoverBackground(params.hoverBackground);

                    button.setSelectBackground(params.selectBackground);
                    button.setSelectHoverBackground(params.selectHoverBackground);

                    button.setActiveBackground(params.activeBackground);
                    button.setSelectActiveBackground(params.selectActiveBackground);

                    button.setTextColor(params.textColor);
                    button.setHoverTextColor(params.hoverTextColor);

                    button.setSelectTextColor(params.selectTextColor);
                    button.setSelectHoverTextColor(params.selectHoverTextColor);

                    button.setActiveTextColor(params.activeTextColor);
                    button.setSelectActiveTextColor(params.selectActiveTextColor);

                    button.setBorder(new ht.ui.border.LineBorder(params.borderWidth, params.borderColor));
                    button.setHoverBorder(new ht.ui.border.LineBorder(params.hoverBorderWidth, params.hoverBorderColor));
                    button.setActiveBorder(new ht.ui.border.LineBorder(params.activeBorderWidth, params.activeBorderColor));
                    button.setBorderRadius([
                        isArrayFn(borderRadius) ? borderRadius[0] : borderRadius,
                        isArrayFn(borderRadius) ? borderRadius[1] ? borderRadius[1] : borderRadius[0] : borderRadius,
                        isArrayFn(borderRadius) ? borderRadius[2] ? borderRadius[2] : borderRadius[0] : borderRadius,
                        isArrayFn(borderRadius) ? borderRadius[3] ? borderRadius[3] : borderRadius[0] : borderRadius,
                    ]);
                }

                return params;
            },
            //230401，支持第二个参数child传入gv或dm，要构建内嵌图纸的graphView链表，建议都传入gv，只有比如treeTable等没有gv容器的才传入dm
            addChildDataModel: function(data, child, tag) { //渲染元素作为图元在父数据模型内的id、渲染元素内用到的作为子的数据模型
                let childDataModel = null,
                    len = arguments.length;
                if (len == 3) {
                    childDataModel = child.dm ? child.dm() : child; //230401，传入从dm改成gv
                } else if (len == 2) {
                    let childView = child
                    iotos.addChildDataModel(data, childView, childView.getClassName().split('.').slice(-1)[0]); //230401，传入从dm改成gv
                    return //千万别忘了return
                } else {
                    throw "argument num error";
                    return
                }

                let parentDataModel = data.dm(),
                    parentAttrObject = parentDataModel.getAttrObject();
                if (parentAttrObject == undefined) parentAttrObject = {}

                let itemtmp = {};
                let nodeTag = iotos.autoTag(data);
                itemtmp[nodeTag] = {}
                itemtmp[nodeTag][tag] = childDataModel;
                childDataModel.a("_from", parentDataModel);
                childDataModel._fromBak = parentDataModel;
                childDataModel._parentTag = nodeTag;
                //230401，与dm链表不一样，gv链表简化些，上下层仅以数组对象关联，如果要获取更详细的信息，可以通过gv.dm()走dm链表去找，没必要太冗余
                _i.setTimeout(() => { //【千万注意】渲染元素代码中对data._gv的赋值通常是在初始化末尾，而对addChildDataModel的调用通常在开头，所以这里需要到下一个循环才能取到变量，通过setTimeout(,0)！
                    if (data._gv && child.dm != undefined) {
                        if (data._gv._i_innerGV == undefined && !i.isControlTyped(data,'tab')) data._gv._i_innerGV = [];
                        data._gv._i_innerGV.push(child);
                        //231011，容器内的内嵌dm对应的gv，记录上下层gv关系，并且为内嵌gv增加属性_i_belongToNode。
                        child._i_belongToNode = data;
                    }
                }, 0);
                childDataModel.getSerializableAttrs = function() {
                    let name, map = {};
                    let keystmp = Object.keys(this._attrObject),
                        jsonKeySize = keystmp.length;
                    for (let idx = 0; idx < jsonKeySize; idx++) {
                        name = keystmp[idx];
                        if (
                            name != '_from'
                        ) 
                            map[name] = 1;
                    }
                    return map;
                };
                /*默认根数据模型也过滤掉_to避免编辑状态的图纸保存，就会序列化到图纸json中导致再次打开加载出现异常！*/
                if (parentDataModel.a('_from') == undefined) {
                    parentDataModel.getSerializableAttrs = function() {
                        var name, map = {};
                        //231016，用for代替for in尝试提高性能效率，貌似for in效率要慢几十倍！！
                        // for (name in this._attrObject) {
                        let keystmp = Object.keys(this._attrObject),
                            jsonKeySize = keystmp.length;
                        for (let idx = 0; idx < jsonKeySize; idx++) {
                            name = keystmp[idx];
                            /*调用.toJSON()会到这里，而调用JSON.stringify()时便会自动调用toJSON（如果有提供）则也会到这里！*/
                            if (name != '_from' && name != '_to') //230126，【注意】这里未做改动，没有像上面那样加上"_parentTag"，是否会出现问题，有待进一步观察测试！
                                map[name] = 1;
                        }
                        return map;
                    }
                };

                if (parentAttrObject._to == undefined) { //注意，这里是自定义的children属性，用来把嵌套的数据模型串起来，并非是图元列表！
                    parentAttrObject._to = itemtmp //默认是数组形式，便于扩展，比如base.menusideBar_center_ui控件，里面就嵌套了连个数据模型
                } else {
                    let dmChild = parentAttrObject._to[data.getTag()]

                    if (dmChild) {
                        let dmobj = dmChild[tag]
                        if (dmobj) {
                            console.warn('Inner DataModel Tag "' + tag + '" Exists,and val will be replaced!')
                                //dmobj = childDataModel; //注意，这里赋值千万不能是.toJSON()后的，否则就不是数据模型的引用赋值了，无法共享一片内存、获取最终嵌套加载的数据
                            dmChild[tag] = childDataModel;
                        } else {
                            dmChild[tag] = childDataModel; //同上。【重点】这里充分利用到dataModel.toJSON()支持递归序列化的特性，嵌套的md都会自动遍历一层层序列化！
                        }
                    } else {
                        parentAttrObject._to = { //合并json对象
                            ...parentAttrObject._to,
                            ...itemtmp
                        }
                    }
                }
                parentDataModel.setAttrObject(parentAttrObject);
            },
            rdm: function(dm) {
                return i.rootDataModel(dm);
            },
            rootDataModel: function(dm) {
                return dm.a("_from") == undefined ? dm : this.rootDataModel(dm.a("_from"));
            },
            //231209，当前图元是否在顶层页面（主入口）
            isTopDataModel: function(data) {
                let dmtmp = data.getClassName() == 'ht.DataModel' ? data : data.dm();
                if (!dmtmp) {
                    // i.alert(`图元组件${data.getDisplayName()}异常悬空！`, '错误', false, null, null, [300, 160]);
                    return undefined;
                }
                return i.rootDataModel(dmtmp) == dmtmp;
            },
            //根图元
            rootData: function(data, uppersData = null) {
                //240614，为了兼容传入图元data和dataModel！！
                if (data.getClassName() == 'ht.DataModel') {
                    let uppertmp = i.upperData(data);
                    if (!uppertmp) return data;
                    else {
                        return i.rootData(uppertmp, uppersData);
                    }
                }

                if (data.dm() == undefined) {
                    data = null;
                    return undefined;
                }

                function __parentDataModel(dm) {
                    if (dm._parentTag != undefined) {
                        tagtmp = dm._parentTag;
                        if (uppersData && tagtmp == i.autoTag(uppersData)) isUppersDataMatched = true;
                    }
                    return dm.a("_from") == undefined ? dm : __parentDataModel(dm.a("_from"));
                }
                let isUppersDataMatched = false; //230216
                if(data.getTag() == undefined && data.getDisplayName() == undefined) console.assert(0);
                let tagtmp = i.autoTag(data); //默认就是当前图元本身，没有上层图纸内嵌时，i.rootData(data)获取返回的是data本身
                let dmtmp = __parentDataModel(data.dm());
                if (dmtmp === data.dm()) return data;
                return uppersData ? isUppersDataMatched : dmtmp.getDataByTag(tagtmp); //230216，复用该方法，增加用于判断两个图元data是否在嵌套中有上下层关系
            },
            innerDataModel: function(data, multiDistinctIndex = null) {
                //231128，主要是对于tab页签，方便当传入multiDistinctIndex为-1时，获取当前index索引的内嵌页dm，而不是dm列表！
                if (multiDistinctIndex == -1 && i.hasAttrObjectKey(data, 'index')) multiDistinctIndex = data.ca('index');
                if (multiDistinctIndex === null || multiDistinctIndex === undefined) { //为了兼容tabView这种有index多页且有索引的情况，针对当前页单独来设定
                    multiDistinctIndex = data.ca('index') === undefined ? 0 : data.ca('index');
                }
                let dmtmp = /*typetmp == 'ht.DataModel' ? data :*/ data.dm(),
                    dmstmp = dmtmp && dmtmp.a('_to'),
                    curDmTmpDict = dmstmp && dmstmp[data.getTag()]; //当前图元容器对应的dm
                if (curDmTmpDict) {
                    if (multiDistinctIndex >= 0 && multiDistinctIndex <= Object.keys(curDmTmpDict).length - 1) { //231009，不是tab页签的时候为啥呢是对象结构，不统一？那么treeTable这种呢？暂未深究！
                        let targetDataModel = curDmTmpDict['ui' + multiDistinctIndex]; //Object.values(curDmTmpDict)[multiDistinctIndex];
                        return targetDataModel;
                    } else if (multiDistinctIndex < 0) { //小于0都返回数组
                        //231010，从直接return Object.values(curDmTmpDict)，改成如下，识别名称标记为ui开头的，返回对应的内嵌dm，这样排除掉链表中其他的数据dm的！
                        let targets = [];
                        i.keys(curDmTmpDict).forEach((key, idx) => {
                            if (key.slice(0, 2) == 'ui') targets.push(i.values(curDmTmpDict)[idx]);
                        });
                        console.warn('WARN: inner has multiple dataModels!', targets);
                        return targets;
                    }
                }
                return undefined;
            },
            //顶层图元组件
            topData: function(data, uppersData = null) {
                //231218，缓存
                if (!uppersData && data._i_cachedTopData) return data._i_cachedTopData;

                let rettmp = i.rootData(data, uppersData);

                if (!uppersData) data._i_cachedTopData = rettmp;

                return rettmp;
            },
            //上层图元组件
            upperData: function(data) {
                if (!data) return null;
                //230224，兼容传入的data为其dm的情况！注意，可能存在BUG！！！
                let curdm = data.dm == undefined ? data : data.dm();
                if (curdm == undefined) {
                    // console.warn('current data has not dataModel: ', data);
                    return null;
                }
                let pardm = curdm.a('_from');
                if (pardm == undefined) {
                    // console.warn('current data in top dm??', data.getTag(), data);
                    return null;
                }
                let upperTag = /*curdm.a('_parentTag')*/ curdm._parentTag;
                if (upperTag == undefined) {
                    console.warn('current data has not parentTag!', data);
                    return null;
                }
                return d(pardm, upperTag);
            },
            //231109，所有的上层图元组件
            upperDatas: function(data, includeSelf = false, keyURLInherit = null) {
                //240204，缓存上层图元组件，主要是在updateForce中频繁用到！
                if (!data._i_cachedUpperDatas) data._i_cachedUpperDatas = {};
                else if (data._i_cachedUpperDatas[includeSelf + ''] !== undefined) return data._i_cachedUpperDatas[includeSelf + ''];

                let targets = [];
                //逐层遍历递归
                function __uppers(node) {
                    if (includeSelf ? true : node !== data) {
                        if (keyURLInherit && keyURLInherit.indexOf(node._tagToUpper) === -1 && i.hasAttrObjectKey(node, keyURLInherit)) {
                            targets.push(node);
                        }

                        if (!keyURLInherit) targets.push(node); //不存当前出入的图元组件，只放上层的，除非includeSelf传入true。
                    }
                    let upper = i.upperData(node);
                    if (upper) __uppers(upper)
                }
                __uppers(data);

                data._i_cachedUpperDatas[includeSelf + ''] = targets;

                return targets;
            },
            upperTagRefered: function(data, keyURL) {
                if (!data._tagToUpper) return undefined;
                else if (!keyURL) return data._tagToUpper;
                else if (keyURL.indexOf(data._tagToUpper) === -1) return undefined;
                else {
                    keyURL = i.np(keyURL);
                    let splitArr = keyURL.split(data._tagToUpper);
                    console.assert(splitArr.length == 2); //240222，暂时先断言整个keyURL中，不会出现多次相同tagToUpper，如果是这样，应该是异常的死循环嵌套吧？？
                    let upperField = splitArr[0],
                        innerFild = splitArr[1];
                    console.assert(innerFild[0] == '>');
                    if (!i.hasAttrObjectKey(data, innerFild.slice(1))) return undefined; //240222，如果截取的里面的keyURL属性不属于自己的，那么就返回undefined！！
                    if (upperField.slice(-3) === '>a:') return upperField.slice(0, -3); //240222，注意，上面只匹配了内嵌段，更上级upperTag是否是属于自己上层keyURL段，这里不判断，只返回，需要结合i.upperDatas()再判断！
                    else return ''; //240222，注意，这里返回空字符串，而不是undefined，以区分当前keyURL就是自己的，匹配到顶了！如果是undefined，表示压根不匹配！
                }
            },
            //内嵌图元组件
            innerData: function(data, attrKeyURL, _keyUrlSubIndex = 0) { //tips 230611，参数_keyUrlSubIndex貌似不是用来初始传入，而是函数内做一次递归时的自动传参？
                if (!attrKeyURL) return;
                attrKeyURL = i.np(attrKeyURL); //240220，因为需要比对页面文件名称，因此需要去掉a:前缀！
                let tagWithoutAttr = i.keyTag(attrKeyURL); //231225，内嵌图元对象，跟属性物管，缓存也是取到keyTag为键，而不需要keyURL
                if (data._i_cachedInnerData && data._i_cachedInnerData[tagWithoutAttr + '-' + _keyUrlSubIndex] && data._i_cachedInnerData[tagWithoutAttr + '-' + _keyUrlSubIndex].dm()) return data._i_cachedInnerData[tagWithoutAttr + '-' + _keyUrlSubIndex];

                let target = undefined;
                if (data._i_innerDatas) {
                    //231022， 从上面forEach循环中移到外面来，避免深度优先的递归造成大量耗时浪费！
                    if (attrKeyURL.indexOf('>') != -1 && attrKeyURL.split('>').length >= 4) { //2）如果传入的innerTag带有>，则被认做是上层图元的keyURL来处理
                        let keyURLinfos = attrKeyURL.split('>'),
                            innerFile = keyURLinfos[0], //250219，页面名称
                            _keyUrlSubIndex = keyURLinfos[1], //自动提取keyURL中的tag和_keyUrlSubIndex，注意，丢弃了文件名信息（索引index为0）
                            innerTag = keyURLinfos[2]; //240219，内嵌图元标签tag
                        //240131，试图提高性能
                        i.forEach(i.keys(data._i_innerDatas), tagToUpper => {
                            if (target) return;
                            let infos = tagToUpper.split('>'), //比如"炉窑基本信息-表单>0>v1>a:value"中的"炉窑基本信息-表单>0>v1"
                                iData = data._i_innerDatas[tagToUpper];
                            console.assert(infos.length == 3);
                            if (
                                infos[0] === innerFile && //240219，对于tab页签，仅仅靠
                                infos[1] === _keyUrlSubIndex &&
                                infos[2] === innerTag
                            ) { //1）innerTag传入为tag，_keyUrlSubIndex为序号时，识别并返回对象
                                target = iData;
                            }
                        });
                    } else if (data._i_innerDatas[attrKeyURL]) { //240301，支持传入的attrKeyURL是._tagToUpper
                        return data._i_innerDatas[attrKeyURL];
                    } else if (i.isKeyURL(attrKeyURL)) {
                        console.assert(0);
                    }
                } else if (data.ca('isLoadingGet')) { //230921，存在此时容器组件正在加载中，那么内嵌图元组件还没有对应上来
                }

                //231022，缓存数据返回
                if (!data._i_cachedInnerData) data._i_cachedInnerData = {};
                data._i_cachedInnerData[tagWithoutAttr + '-' + _keyUrlSubIndex] = target;
                return target;
            },
            //230611，判断传入的字符串是否属于（非底层的）属性暴露的keyURL格式，比如“基础服务>1>side1>a:人员信息>0>func3>a:output”
            isKeyURL: function(keyURL) {
                if (!keyURL) return false; //240217，存在为空的情况传入
                return keyURL.split('>').length >= 4 && i.isStringNumber(keyURL.split('>')[1]);
            },
            /*240218，根据keyURL获取图元对象的multiDistinctIndex！*/
            getMultiDistinctIndex: function(data, keyURL) {
                if (!i.isKeyURL(keyURL)) return undefined;
                let nameArr = keyURL.split('>'),
                    fileName = nameArr[0],
                    subIndex = nameArr[1],
                    result = undefined;
                for (let fileIndex in data._i_fileIndex2SubIndex) {
                    if (result) return;
                    let fileIndexInfo = fileIndex.split('>');
                    if (
                        data._i_fileIndex2SubIndex[fileIndex] === Number(subIndex) &&
                        fileIndexInfo[0] === fileName
                    ) {
                        result = Number(fileIndexInfo[1]);
                    }
                }
                return result;
            },
            //240218，相对于getMultiDistinctIndex性能更高！只用判断是否匹配，不需要完整解析遍历！
            isMultiIndexMatchKeyURL: function(data, keyURL, multiDistinctIndex) {
                if (!i.isKeyURL(keyURL)) return false;
                keyURL = i.np(keyURL);
                let nameArr = keyURL.split('>'),
                    subIndex = nameArr[1],
                    fileIndexTrying = nameArr[0] + '>' + multiDistinctIndex,
                    subIndexTried = data._i_fileIndex2SubIndex && data._i_fileIndex2SubIndex[fileIndexTrying];
                return subIndexTried === Number(subIndex);
            },
            getCompatibledKeyURL: function() {

            },
            /*231225，根据keyURL获取同一个内嵌图元不同属性都对应的同一个内嵌tag的keyURL前段，比如输入“long-pages>0>treeTable-ui5>a:visibleFilterInput”，
            输出：long-pages>0>treeTable-ui5，也就是去掉末尾的“>属性”*/
            keyTag: function(keyURL) {
                return keyURL.indexOf('>') != -1 ? keyURL.split('>').slice(0, -1).join('>') : keyURL;
            },
            //获取内嵌keyURL
            innerKeyURL: function(upperKeyURL) {
                if (upperKeyURL == undefined || upperKeyURL.split('>').length < 4) return undefined;
                else return upperKeyURL.split('>').slice(3).join('>');
            },
            //231103，底层keyURL，其实就是最底层带前缀的属性名
            bottomKeyURL: function(upperKeyURL) {
                return upperKeyURL ? upperKeyURL.split('>').at(-1) : upperKeyURL;
            },
            //240214，统计有几层嵌套，主要用于继承属性时别名前面几个点：.
            layersOfKeyURL: function(keyURL) {
                let count = 0;
                //一直递归到底
                function __innerByInnerToBottom(attr) {
                    let innertmp = i.innerKeyURL(attr);
                    if (innertmp) {
                        count += 1;
                        __innerByInnerToBottom(innertmp);
                    }
                }
                __innerByInnerToBottom(keyURL);
                return count;
            },
            //240214，比如通过给定数字，返回带有几个.的字符串
            charMultied: function(num, char = '.') {
                if (num < 0) {
                    throw new Error("输入的数字不能小于0");
                }
                let dotString = '';
                for (let i = 0; i < num; i++) {
                    dotString += char;
                }
                return dotString;
            },
            //231007，从内嵌的属性获取对应暴露到上层的keyURL，与innerKeyURL对应。注意，传入和传出都带有属性前缀。
            upperKeyURL: function(data, attrPrefixed, retObjectWithUpper = false, fullPathInURL = false) { //240223，提供参数retObjectWithUpper，此时返回对象，包括{data:xxx,attr:xxx}
                if (!attrPrefixed) {
                    if (!retObjectWithUpper) console.error('input parameter attrPrefixed should not be null!');
                    else console.warn('input parameter attrPrefixed should not be null!');
                    return;
                }
                let uppertmp = i.upperData(data),
                    upperKeyURL = null;
                if (uppertmp) {
                    if (data._tagToUpper) { //存在可能没有_tagToUpper属性的情况，尤其是初始加载在loadDisplay中加载之前就用到时，此时属性还没装配上！
                        let tagToUpperTmp = !fullPathInURL ? data._tagToUpper :
                            (data.dm()._url + '>' + data._tagToUpper.split('>')[1] + '>' + data.getTag());
                        //240304，将data._tagToUpper换成tagToUpperTmp，取决于新加入的参数fullPathInURL，主要用于通过"keyURLFullPath"，能够逐级包含完整所在页面和tag的信息，而不是截取只留文件名信息！
                        upperKeyURL = 'a:' + tagToUpperTmp + '>' + i.autoPrefixed(attrPrefixed, data);
                    } else {
                        console.warn(`WARN: tag to upper of data is null,possiblly it is loading now and will guess one to return according to keyURL rule!${i.commonTip(data)}`);
                        //240126，为了提高性能，尽可能减少i.getFormValues调用，避免大量属性的forEach，这里对于上层非tab页签组件时，直接拼接成上层keyURL，判断attrObject是否有值（注意，是否可行，需要测试！！！）
                        if (!i.isControlTyped(uppertmp, 'tab') && !i.isControlTyped(uppertmp, 'ttb')) { //240222，对于树表格内嵌，也是一样，不能想当然认为keyURL中间段为0，不过后面else处理也有待完善，存在隐藏BUG！！！
                            //240304，加上条件fullPathInURL ? data.dm()._url : ，新加入的参数fullPathInURL，主要用于通过"keyURLFullPath"，能够逐级包含完整所在页面和tag的信息，而不是截取只留文件名信息！
                            let tagToUpperTmp = (fullPathInURL ? data.dm()._url : urlName(data.dm()._url)) + '>0>' + data.getTag() + '>' + i.autoPrefixed(attrPrefixed, data);
                            if (fullPathInURL) {
                                upperKeyURL = tagToUpperTmp;
                            } else {
                                upperKeyURL = i.getDisplayBindingItem(uppertmp, tagToUpperTmp) !== undefined ? ('a:' + tagToUpperTmp) : undefined;
                            }
                        } else {
                            let formtmp = i.getFormValues(uppertmp, -1),
                                tailTmp = '>' + i.upperIndexedTag(data, true) + '>' + data.getTag() + '>' + i.autoPrefixed(attrPrefixed, data);
                            upperKeyURL = i.attr(formtmp, urlName(data.dm()._url) + tailTmp);
                            //24034，兼容此前的逻辑，同时，如果传入了fullPathInURL，那么文件名称改成文件完整url追加到头上！
                            if (upperKeyURL && fullPathInURL) {
                                upperKeyURL = data.dm()._url + tailTmp;
                            }
                        }
                    }
                } else {
                    upperKeyURL = undefined;
                }
                return retObjectWithUpper ? { //240223，支持传入上层图元对象和keyURL，避免外层只获取到keyURL，有时还需要计算上层图元对象！
                    data: uppertmp,
                    attr: upperKeyURL
                } : upperKeyURL;
            },
            //240223，作为upperKeyURL的补充，逐层递归直到获取属性在顶层的keyURL
            topKeyURL: function(data, attrPrefixed, retObjectWithUpper = false, fullPathInURL = false) { //240223，提供参数retObjectWithUpper，此时返回对象，包括{data:xxx,attr:xxx}
                let upperInfo = {
                    data: null,
                    attr: null
                }
                if (isArrayFn(attrPrefixed)) {
                    upperInfo.attr = [];
                    attrPrefixed.forEach(attr => {
                        let infotmp = i.upperKeyURL(data, attr, true, fullPathInURL);
                        upperInfo.data = infotmp && infotmp.data;
                        upperInfo.attr.push(infotmp && infotmp.attr);
                    });
                } else {
                    upperInfo = i.upperKeyURL(data, attrPrefixed, true, fullPathInURL);
                }
                if (!upperInfo || !upperInfo.data) return retObjectWithUpper ? {
                    data: data, //240223，带有顶层图元对象，避免后面还需要的话，又得i.topData()获取一遍！浪费性能！
                    attr: attrPrefixed
                } : attrPrefixed;
                else return i.topKeyURL(upperInfo.data, upperInfo.attr, retObjectWithUpper, fullPathInURL);
            },
            /*根据下层图元data，获取其在上层的标记key比如ui1、ui2，以获取所在索引！当传入indexWhileUpperTab为true时，那么就返回索引数字！*/
            upperIndexedTag: function(data, indexWhileUpperTab = false) {
                let uppertmp = i.upperData(data);
                if (!uppertmp) return undefined;
                let upperDmTmp = uppertmp.dm(),
                    upperTagTmp = uppertmp.getTag();
                if (!upperDmTmp) return undefined;

                //240311，发现高频刷新重加载时，这里会是undefined，导致直接用时会报错！
                if (!upperDmTmp.a('_to')) return undefined;

                let rettmp = null;
                for (let indexedTag in upperDmTmp.a('_to')[upperTagTmp]) {
                    if (upperDmTmp.a('_to')[upperTagTmp][indexedTag] === data.dm()) {
                        if (!!rettmp) console.assert(0); //应该不可能有重复的内嵌页面dataModel
                        rettmp = indexedTag;
                    }
                }
                console.assert(!!rettmp);
                if (!rettmp) return undefined; //240311，发现高频刷新时候，为undefined！

                if (indexWhileUpperTab && i.isControlTyped(uppertmp, 'tab')) {
                    console.assert(rettmp.slice(0, 2) == 'ui');
                    rettmp = Number(rettmp.slice(2));
                }
                return rettmp; //返回比如ui1，需要自己去解析提取索引1这种有价值的数据！
            },
            //230611，获取最底层的图元，相对于innerData的只获取相邻的下一层图元。注意，实测传入的keyURL带不带最开头的前缀a:都行！
            bottomData: function(data, keyURL, fromCached = false) { //231113，加上参数fromCached，允许传入参数从缓存获取
                if (!i.isKeyURL(keyURL)) return data;
                else {
                    //231113，加上参数fromCached，允许从缓存获取数据
                    let keyURLWithoutAttr = keyURL.split('>').slice(0, -1).join('>');
                    if (fromCached && data._i_cachedBottomData && data._i_cachedBottomData[keyURLWithoutAttr]) return data._i_cachedBottomData[keyURLWithoutAttr];
                    let datatmp = i.innerData(data, keyURL);
                    if (data && !datatmp) {
                        return data; //内嵌keyURL对应的图元对象不存在？？
                    } else {
                        //231113，加上参数fromCached，允许从缓存获取数据
                        let target = i.bottomData(datatmp, i.innerKeyURL(keyURL));
                        if (!data._i_cachedBottomData) data._i_cachedBottomData = {};
                        data._i_cachedBottomData[keyURLWithoutAttr] = target;

                        return target;
                    }
                }
            },
            //简化keyURL
            __keysReduced: function(jsonObj, flags = ['a>_to>', '>gv>..', '>..n1>gv>'], replaceBy = "..") {
                //分隔符统一替换图纸嵌套标记
                let url2Value = {};
                let keystmp = Object.keys(jsonObj),
                    jsonKeySize = keystmp.length;
                for (let idx = 0; idx < jsonKeySize; idx++) {
                    let keytmp = keystmp[idx];;
                    flags.forEach((flag) => {
                        keytmp = keytmp.replaceAll(flag, replaceBy)
                    })
                    url2Value[keytmp] = jsonObj[key]
                }
                jsonObj = url2Value;
                return url2Value;
            },
            __dms: null,
            __dms_raw: null,
            //dm链表
            dms: function(dm, refresh = false, lessen = false, flag = '>') { //【重点注意】应用平台切换app时，第一个参数refresh一定要true刷新一次！否则数据是其他应用的！
                if (i.__dms && refresh == false) {
                    return lessen ? i.__keysReduced(i.__dms) : i.__dms;
                }
                let rootdm = i.rootDataModel(dm);
                let bakfunc = rootdm.getSerializableAttrs;
                rootdm.getSerializableAttrs = function() {
                    var name, map = {};
                    for (name in rootdm._attrObject) {
                        /*开放_to，否则序列化后内嵌对象的字段都没有了*/
                        if (name != '_from' /*&&  name != '_to'*/ )
                            map[name] = 1;
                    }
                    return map;
                };
                i.__dms_raw = JSON.parse(JSON.stringify(rootdm))
                i.__dms = convertToFlatJson(i.__dms_raw, flag);
                rootdm.getSerializableAttrs = bakfunc; /*还原根dm的过滤配置，让_to也过滤掉，避免编辑状态下ctrl+s保存会加到图纸文件中了*/
                return lessen ? i.__keysReduced(i.__dms) : i.__dms;
            },
            //gv链表
            gvs: function(data, selfGvInclude = true) {
                if (data._gv) {
                    let result = selfGvInclude ? [data._gv] : [];
                    //递归遍历内嵌gv，层次结构的变成水平扁平化的gv列表。__innersGV只提取当前gv内的不包含gv本身！
                    function __innersGV(gv) {
                        let gvstmp = [];
                        gv._i_innerGV && gv._i_innerGV.forEach(gvtmp => {
                            gvstmp = [...gvstmp, gvtmp, ...__innersGV(gvtmp)];
                        });
                        return gvstmp;
                    }
                    return [...result, ...__innersGV(data._gv)];
                } else return null;
            },
            //240517，容器组件的内嵌dm之外对应的内嵌gv，比如用来获取display属性url对应内嵌页的gv，从而根据gv.toDataURL获取内嵌页面的缩微图！
            innerGV: function(data, defaultIndex = 0) {
                let results = [];
                data._gv && data._gv._i_innerGV && data._gv._i_innerGV.forEach(gvtmp => {
                    if (gvtmp && gvtmp._i_belongToNode === data) {
                        results.push(gvtmp);
                    }
                });
                return (defaultIndex < 0 || defaultIndex > results.length) ? results : results[defaultIndex];
            },
            //231214，逐层往下递归清理，包括回调各个图元组件自身的公共清理函数！支持传入gv、dm、或者图元data，其中gv转成dm，dm转成遍历data
            clearDeep: function(data, ignoreRootData = undefined) {
                //240823，对于连线的点删除，不能导致这个线条被删除啊！！
                if(data && data.getClassName() == 'ht.Shape'){
                    console.assert(data.addPoint !== undefined);  //240823，确定是连线、管道这种！
                    return;
                }

                if (!data) return;
                let dmtmp = null;
                switch (data.getClassName()) {
                    case 'ht.graph.GraphView':
                        let gvtmp = data;
                        data = data.dm();
                        gvtmp.dispose(); //240101，销毁场景！但是发现并无法减少内存占用，有待进一步分析优化！
                    case 'ht.DataModel':
                        dmtmp = data;
                        dmtmp.eachByBreadthFirst(child => {
                            i.clearDeep(child);
                        });
                        //240114，尝试清理避免编辑时不停操作内存累加泄漏！
                        dmtmp.clear();
                        dmtmp.clearHistoryManager()

                        dmtmp = null; //清理内嵌dm
                        break;
                    default:
                        if (i.hasInner(data)) {
                            /*231214，注意，本函数目标是要清理指定gv/dm或者data容器图元内嵌的资源，并不包括图元data所在的dm/gv，因此不能用data._gv，
                            这是当前所在的gv而不是内嵌的！如果用data._gv，那么其下面的内嵌dm图元就是当前整个页面所有的了，删除指定图元，会删除到平级的
                            其他图元，而不是仅仅纵向的一簇！！*/
                            let innerDmTmp = i.innerDataModel(data),
                                inners = [];
                            if (!isArrayFn(innerDmTmp)) inners.push(innerDmTmp);
                            else inners = innerDmTmp;
                            inners.forEach(inner => {
                                i.clearDeep(inner); //交给递归函数内部清理innerDmTmp
                            });
                        } else {
                            //231214，清理单个图元，通常用于给渲染元素组件传入各自的释放回调函数，让其各自加上释放逻辑！在页面重加载、删除时会调用
                            data._i_onClearData && data._i_onClearData();
                            // _bottomDatas.push(data); //tips数组_bottomDatas试图获取所有内嵌底层图元对象，暂未测试也未用！
                        }
                        //231218，传入ignoreRootData为true时（只有初始调用能传入，其他定义调用都没有传入该参数）,不删除图元本身
                        if (!(ignoreRootData == true && i.isHtNodeData(data))) i.remove(data); //清理底层图元
                        break;
                }
            },
            //230209，默认true是ht图元的操作（为了兼容历史遗留），如果传入false，则当成普通js对象序列化，并且是支持循环引用处理的深度拷贝！
            ify: function(jsonObj, isHtDataType = true) { //输出要想不带牛皮癣__upper()，参数默认值isHtDataType由true改成传入false即可！
                let result = null;
                if (isHtDataType) result = ht.Default.stringify(jsonObj);
                else {
                    //如果存在循环引用，则先清除掉循环引用
                    if (i.hasLoopCycle(jsonObj)) jsonObj = JSON.decycle(jsonObj);
                    result = JSON.stringify(jsonObj, undefined, 2);
                }
                return result;
            },
            //深拷贝
            clone: function(jsonObj) { //i.clone(dm)克隆返回的dm，会丢失信息，比如dm._url会丢失！
                let objtmp = typeof(jsonObj) == 'object' ? ht.Default.clone(jsonObj) : jsonObj;
                jsonObj = null;
                return objtmp;
            },
            //浅拷贝
            copy: function(jsonObj, removeCycle = false) {
                let copyed = _.clone(jsonObj);
                if (removeCycle) {
                    console.error('json object cycle will be removed if exists', jsonObj);
                    copyed = JSON.decycle(copyed);
                }
                return copyed;
            },
            //对象转json对象
            toJSON: function(jsObj) {
                if (i.hasLoopCycle(jsObj)) {
                    jsObj = JSON.decycle(jsObj); //tips added 230228，注意，对于ht对象等大的js对象，一旦用到JSON.decycle，耗时就加到到一个数量级！会出现明显的延时而不一般所谓的程序性能优化的耗时了！
                    console.error('object has cycle,and use i.toJSON() may cost longger time as expect!');
                }
                return JSON.parse(JSON.stringify(jsObj));
            },
            //240618，代替JSON.parse()，因为发现如果传入比如：["1762769560734908417"]（对象，非字符串），那么输出竟然是：1762769560734908400
            jsonParse: function(jsonString) {
                try {
                if (isObject(jsonString)) {
                    console.assert(typeof(jsonString) != 'string');
                    console.error('WARN: expecting a string type, but actually receiving an object:', jsonString);
                    return jsonString;
                } else if (typeof(jsonString) != 'string') {
                    return JSON.parse(jsonString);
                } else return JSON.parse(jsonString);
                } catch (err) {
                    return jsonString;
                }  
            },
            //230612，兼容编辑状态和运行状态，在当前页面复制图元对象，注意，不是序列化保存和加载还原，而是复制深拷贝。
            copyNode: function(node) {
                let tempNode = new ht.Node();
                tempNode.setName(node.getName());
                node.dm().add(tempNode);
                let newNode = i.copyPasted(node);
                newNode.setPosition(node.getPosition().x, node.getPosition().y + 5);
                if (node.dm() == undefined) node = null;
                else node.dm().remove(tempNode);
                tempNode = null;
                i.rdm(newNode.dm()) != newNode.dm() && newNode.ca('dynamicCreate', true);
                return newNode;
            },
            //240616，复制粘贴
            copyPasted: function(data) {
                let dataArrs = isArrayFn(data) ? data : [data], //支持传入数组或者单个图元对象！
                    dmtmp = dataArrs[0].dm();
                let jsonSerializer = new ht.JSONSerializer(dmtmp); // 创建一个序列化器，并传入图纸的 dataModel
                // 过滤只有当前选中的节点会被序列化 (筛选条件可自定义)
                jsonSerializer.isSerializable = function(node) {
                    return dataArrs.indexOf(node) !== -1; //gv.sm().co(node);
                };
                // 序列化筛选出的节点
                let jsonText = jsonSerializer.serialize(),
                    jsonObj = JSON.parse(jsonText);

                //240616，需要调整序列化后的json结构，让加载反序列化不报错，而且符合要求（比如tag标签不能被赋值导致冲突）
                jsonObj.d.forEach((json, index) => {
                    //240616，参考setDataJson的实现！
                    if (isObject(json.p.image)) json.p.image = json.a.symbol;
                    json.p.tag = undefined; //清空掉，让自动创建分配！

                    //240616，序列化后的parent、host、souce、target这几个引用其他对象的属性，默认是tag字符串了，需要改成{__i:(id)}格式！这样deserialize加载还原才不会报错！
                    function __strToIdObject(enumType) {
                        if (typeof(json.p[enumType]) === 'string') {
                            let typedTag = json.p[enumType];
                            json.p[enumType] = {
                                __i: d(dmtmp, typedTag).getId()
                            }
                        }
                    }
                    __strToIdObject('parent');
                    __strToIdObject('host');
                    __strToIdObject('source');
                    __strToIdObject('target ');
                });
                let resulttmp = dmtmp.deserialize(jsonObj, dataArrs[0].getParent()).toArray();
                return resulttmp.length == 1 ? resulttmp[0] : resulttmp; //240616，数组长度为1，因为
            },
            //231001,日志打印，支持当前页面的url和时间
            error: function(jsonObj, node, flagString = null, strTyped = false) {
                if (flagString) console.error(flagString, i.ts2tm(), strTyped ? i.ify(jsonObj, false) : jsonObj, node && ('(' + node.getDisplayName() + ':' + node.dm()._url + ')'));
                else console.error(i.ts2tm(), strTyped ? i.ify(jsonObj, false) : jsonObj, node && ('(' + node.getDisplayName() + ':' + node.dm()._url + ')'));
            },
            warn: function(jsonObj, strTyped = false) {
                console.warn(i.ify(jsonObj, false))
            },
            getDataIndex: function(data, byClass = true, filterFunc = null) { //默认按照类型分类统计其index
                let index = 1,
                    result = null;
                data.dm().eachByDepthFirst((child) => { //eachByBreadthFirst
                    if (data.getId() == child.getId()) { //index循环里自增1，直到遍历到当前图元位置，剩余的图元循环遍历忽略掉！
                        result = index;
                    } else if (result == null) { //如果是全局计数，那么这里直接result或index做++即可，但为了让计数追加到tag后缀上更有意义
                        function add() {
                            if (filterFunc && filterFunc(data) != null) {
                                if (filterFunc(data) == filterFunc(child)) {
                                    index += 1;
                                }
                            } else {
                                index += 1;
                            }
                        }
                        if (byClass) {
                            if (data.getClassName() == child.getClassName()) add(); //按类型累加统计
                            else { //240121，兼容Node和UNode，避免计数错误！比如交互连线，base底板为旧的新创建的
                                let NodeTypes = ['ht.Node', 'ht.UNode'];
                                if (NodeTypes.indexOf(data.getClassName()) != -1 && NodeTypes.indexOf(child.getClassName()) != -1) {
                                    add();
                                }
                            }
                        } else {
                            add(); //全局累加统计
                        }
                    }
                }); //第二个参数默认空，如果填写成data，跟当前传入的data一样，那么每次遍历当前就是自己，失去了遍历的意义！
                return result;
            },
            isObjEmpty: function(jsonObj,dictOnly = false) { //230801，默认undefined、null都返回true，增加第二个参数传入true时，只有{}才认为是空对象
                if(dictOnly){
                    if(jsonObj !== null && jsonObj !== undefined && typeof(dictOnly) == 'object' && i.keys(jsonObj).length === 0) return true; //240801，单独判断{}
                    else return false;
                }else{
                    //241022，加上isObject判断，避免因为传入1、2、56这种，也返回true
                    return jsonObj == undefined ? true : (isObject(jsonObj) && i.keys(jsonObj).length === 0 ? true : false);
                }
            },
            //231109，判断是否是空对象，默认包括数组，传入true则仅识别{key:value}且不包含{}的为true
            isObjNotEmpty: function(jsonObj, excludeArray = false) {
                if (excludeArray && isArrayFn(jsonObj)) return false;
                return jsonObj && isObject(jsonObj) && !i.isObjEmpty(jsonObj);
            },
            a: function(dm, keyUrl, value = null) { //任意dm数据模型，获取当前链条所有的dms，传入keyUrl，或者带上值，实现查询和设置！
                if (dm.dm) {
                    console.error('i.a() should use dm as param 1 but data given', dm);
                    return;
                }
                let rdmtmp = i.rootDataModel(dm);
                if (value == null) {
                    return i.dms(dm, true, false)[keyUrl]
                } else {
                    let valtmp = {}
                    let keyArrTmp = keyUrl.replaceAll('a>_to>', '_attrObject>_to>')
                        .replaceAll('>a>', '>_attrObject>')
                        .replaceAll('>d>', '>_datas>_as>').split('>');
                    let len = keyArrTmp.length;
                    keyArrTmp.forEach((item, index) => {
                        if (index == len - 2 && item == '_attrObject')
                            return;
                        else if (index == len - 1) {
                            rdmtmp.a(keyArrTmp[index], value);
                        } else
                            rdmtmp = rdmtmp[item] //直接完整赋值，就不会造成引用参数传递影响到原来的i.dms中存放的内容！
                    })
                }
            },
            //230301，i.getValue()的别名。相对于data.a/data.ca，这里对传入的属性名称是否带前缀都支持：有前缀，就自动转船
            ca: function(data, attr, value = null) {
                if (!data.dm) {
                    console.error('i.ca() should use data as param 1 but dm given?', data);
                    return;
                }
                if (value == null) return i.getValue(data, attr);
                else i.update(data, attr, value);
            },
            //240123，相对于updateForce机制较为复杂，这里很纯粹，相当于子集，仅仅是代替data.ca/s/p，自动识别前缀的方式赋值！
            setValue: function(node, attr, value) {
                /*240904，对于s:2d.visible，和值为false的不能进来！因为组件默认隐藏时，渲染元素是不会执行的。如果在继承的上层也有出事form绑定赋值为false，初始再来一次不可见，
                在这里被缓存了，那么后面再对其设置可见，就会出现闪一下又自动隐藏的情况！！就是因为缓存了导致的！！*/
                if (!node._cache && i.isSymbolType(node) && attr.slice(-10) != '2d.visible') {
                    if(!node._i_setValueBeforeInits) node._i_setValueBeforeInits = [];  //240903，之前是单个函数，但是会存在覆盖！因此需要换成数组！！
                    node._i_setValueBeforeInits.push(() => {
                        if(i.autoPrefixed(attr).slice(0,1) != 'a'){
                        i.setValue(node, attr, value);
                        }else{
                            _i.setTimeout(()=>{
                                i.setValue(node, attr, value);
                            },0);
                        }
                    });
                    return;
                }

                let attrWithPrefixed = i.autoPrefixed(attr, node),
                    prefixed = attrWithPrefixed.slice(0, 1),
                    pureAttr = attrWithPrefixed.slice(2);
                switch (prefixed) {
                    case 'a':
                        node.ca(pureAttr, value);
                        break;
                    case 's':
                        node.s(pureAttr, value);
                        break;
                    case 'p':
                        p(node, pureAttr, value);
                        break;
                }
            },
            /*240206，带自动缓存的属性赋值*/
            updateForceByUBC: function(node, attr, value, type = 'a', ignoreNotifyUpper = false, setUbcQueued = false) {
                let loadingStatus = i.loadedState(node);
                if (
                    (
                        (loadingStatus !== 1 && loadingStatus !== undefined) ||
                        i.isDialogAttrUpdateNeedCache(node, attr)
                    ) &&
                    (!attr || attr.slice('-9') != 'a:display')
                ) {
                    function __updateForceAfterLoaded(func, node, attr, value, type, ignoreNotifyUpper) {
                        // 返回一个新的函数，该函数将原始函数和参数作为闭包存储起来  
                        return function() {
                            // 在备份函数内部，可以访问原始函数和参数  
                            return func(node, attr, value, type, ignoreNotifyUpper);
                        };
                    }
                    let topDataTmp = i.topData(node);
                    if (!topDataTmp._i_updateForceAfterLoaded) topDataTmp._i_updateForceAfterLoaded = [];
                    topDataTmp._i_updateForceAfterLoaded.push(__updateForceAfterLoaded(updateForce, node, attr, value, type, ignoreNotifyUpper));
                } else {
                    updateForce(node, attr, value, type, ignoreNotifyUpper);
                }
            },
            //获取属性值
            getValue: function(node, attr, type = null, callback = null) {
                if (!node) return;
                if (!attr) {
                    console.warn('attr is null!', attr, node);
                    return undefined;
                }
                if (typeof(attr) != 'string') {
                    i.alert(`属性名称类型错误：${typeof(attr)}，${i.ify(attr)}`, '错误');
                    return undefined;
                }
                if (type && attr.slice(1, 2) !== ':') attr = type + ':' + attr; //240130，有存在传入了type的情况，需要拼装好先，再传入autoPrefixed，走统一逻辑！（原本此时可以绕过）
                let attrFull = i.autoPrefixed(attr, node), //240110，加上参数node，这样能根据data.getDatabindings()获得p:xxx、s:xxx等精确的前缀！
                    valtmp = null;
                if (type == null) type = attrFull.slice(0, 1);
                attr = attrFull.slice(2);

                if (node && attr) {
                    switch (type) {
                        case 'a':
                            valtmp = node.a(attr);
                            break;
                        case 's':
                            valtmp = node.s(attr);
                            break;
                        case 'p':
                            valtmp = getProperty(node, attr)
                            break;
                        default:
                            console.error('type error! only support a、s、p, current is:', type);
                            break;
                    }
                } else {
                    console.warn(node, attr)
                }
                if (valtmp === undefined) {
                    //230408，加上支持回调回传
                    let attrExistTmp = i.hasAttrObjectKey(node, attrFull, has => {
                        if (has) {
                            callback && callback(i.getDataBindingItem(i.getImage(node.getImage()), attr).defaultValue, node);
                        } else callback && callback(undefined);
                    });
                    if (attrExistTmp === undefined) {
                        console.warn('symbol image not yet loaded???', node, node.getImage());
                    }
                } else {
                    if (valtmp == '__init__' && node._i_attrOldValue && node._i_attrOldValue[attrFull] !== undefined) {
                        valtmp = node._i_attrOldValue[attrFull];
                    }

                    callback && callback(valtmp); //230408，支持回调异步返回值
                }
                callback && callback(valtmp); //230812，这里也要有回调方式的返回。
                return valtmp;
            },
            //获取最上层form表单绑定的属性值
            getValueUpperFormed: function(data, attr, always = false) {
                //240131，加上标记，让always参数结合应用是否加载完毕，来确定是用当前值，还是上层form值！
                let keepRawData = false;
                if (!always && i.topData(data)._i_isFirstInitLoaded) {
                    keepRawData = true;
                }
                if (!keepRawData &&
                    attr && _i.upperData(data) //&&
                ) {
                    let uppersFormedValue = _i.getAttrFormTypedValueUpperLatest(data, i.autoPrefixed(attr, data));
                    if (uppersFormedValue && uppersFormedValue.length > 0) {
                        let valtmp = uppersFormedValue[0].value;
                        return valtmp;
                    }
                }
                return i.getValue(data, attr);
            },
            /*获取属性配置值*/
            attrValue: function(data, attr) {
                if (attr.indexOf(':') != -1) console.assert(attr.split(':')[0] == 'a');
                attr = i.nonePrefixed(attr);
                return data.getAttrObject()[attr];
            },
            //获得图纸序列化保存的原始配置属性值
            rawValue: function(data, attrs, retCallback = null, fromBottom = false) {
                if (attrs && !isArrayFn(attrs)) attrs = [attrs];
                //获取单个属性值，注意，这里dm是原始url的dm而不是现在data.dm()
                function __getSingleValue(dm, attr) {
                    if (fromBottom) {
                        data = i.bottomData(data, attr);
                        attr = i.bottomKeyURL(attr);
                    }
                    //缓存
                    if (data._i_rawValue && data._i_rawValue[attr] !== undefined) {
                        let ret = data._i_rawValue[attr];
                        return ret;
                    }
                    //获取值
                    let nodetmp = d(dm, data.getTag());
                    let valuetmp = i.getValue(nodetmp, attr);
                    if (!nodetmp) {
                        console.error('WARN: dm error,has not tagged data', data.getTag(), dm);
                        return;
                    }
                    //缓存
                    if (!nodetmp._i_rawValue) nodetmp._i_rawValue = {};
                    nodetmp._i_rawValue[attr] = valuetmp;
                    return valuetmp;
                }

                //返回
                function __ret(dm) {
                    let resulttmp = {};
                    attrs && attrs.forEach(attr => {
                        resulttmp[attr] = __getSingleValue(dm, attr);
                    });
                    if (i.keys(resulttmp).length == 1) resulttmp = i.values(resulttmp)[0]; //传入attrs是单个属性字符串，那么返回也是一个值，而不是键值对！
                    if (!attrs || attrs.length == 0) resulttmp = dm; //如果传入attrs为null或者空数组[]，那么回调返回就是加载的dm！！
                    retCallback && retCallback(resulttmp);
                    return resulttmp;
                };
                //tips 231123，不能用data.dm()，因为已经被改变了，需要通过i.toDataModel()去加载原先的url获取原始dm
                let dmtmp = i.toDataModel(data.dm()._url, dm => {
                    return __ret(dm);
                }, true);
            },
            //240701，对于非数组，后面改成数组类型，对值进行统一判断，如果是数组，那么获取指定索引值，如果是非数组，那么就返回本身！比如background属性，从单个颜色，改成颜色数组后！
            valArrCompatiable: function(val, idx = 0) {
                return isArrayFn(val) ? val[idx] : val;
            },
            //自动识别当前属性是否是form绑定的，如果是，则自动调用i.formEventBubblingUpper逐层向上同步，否则就不逐层同步
            fa: function(data, attr, value,
                gv = null,
                cache = null,
                selfInclude = true,
                triggerBindControls = true
            ) {
                //240214，判断属性是否是form绑定，替换方式，试图提高性能，有待测试验证！
                let fullAttr = i.autoPrefixed(attr, data);
                if (data.getDataBindings()[fullAttr.slice(0, 1)][fullAttr.slice(2)] !== undefined) {
                    //form表单的回写赋值，会逐层向上同步
                    let attrValue = {};
                    attrValue[attr] = value;
                    i.formEventBubblingUpper(data, gv, cache, null, attrValue, selfInclude, triggerBindControls);
                } else {
                    //常规回写属性赋值，不会逐层向上同步
                    data.ca(attr, value);
                }
            },
            //相对于updateForce，支持属性带或不带前缀，省去第三个参数。最后一个参数triggeredAttr，表示是哪个属性变化触发来调用的，用于处理属性相互变化触发死锁问题
            update: function(data, attr, value, triggeredAttr = null) {
                /*被回写属性值过滤*/
                if (triggeredAttr != null && i.backWriteAttrs(data, triggeredAttr)) return;
                let attrFullName = i.autoPrefixed(attr, data);
                updateForce(data, attrFullName.slice(2), value, attrFullName.slice(0, 1));
            },
            /*flatValue通常是根据扁平化结构的数据，传入“非完整”key从而获得“剩余”对象结构的value
            传入参数：
            let test = {
                "a.0.b": "h",
                "a.1.d.f.0.0": "c",
                "a.2.d.f.1.0": "c"
            };
            //函数调用：
            i.flatValue(test, 'a.1', '.');
            //返回结果：
            {
                "d": {
                    "f": [
                        [
                            "c"
                        ]
                    ]
                }
            }
            */
            /*新增enableReference参数，实现对扁平化查询到的对象结构进行修改并把修改后的结构化对象通过引用传参返回
             let test = {
                 "a.0.b": "h",
                 "a.1.d.f.0.0": "c",
                 "a.2.d.f.1.0": "c"
             };
             let res = i.flatValue(test, 'a.1', '.',true);
             res.d.f.push('e')
             console.error(res)
             console.error(test) //打印出修改后的结构化对象
            */
            flatValue: function(flatJsonObj, keyUrl, flag = '>', enableReference = false) {
                try {
                    let treeJson = convertToTreeJson(flatJsonObj, flag, true),
                        temp = treeJson;
                    let keyArr = keyUrl.split(flag);
                    //240131，试图提高性能
                    i.forEach(keyArr, keyField => {
                        temp = temp[keyField];
                    });
                    if (enableReference) i.objOverwrite(flatJsonObj, treeJson);
                    return temp;
                } catch (error) { //存在传入keyUrl为Number类型的情况，比如buttonGroup的select，此时对非字符串调用split必然报错，因此这里不用输出打印
                    return undefined;
                }
            },
            //230927，xxx.yyy.zzz通过非keyURL-value扁平化的方式去提取window或ht.Node等对象的值
            /*示例如下，全局window对象有个属性aiotos，具体结构如下：
            输入：window.aiotos = {
                    username: 'develop', 
                    password: '123456', 
                    flag: [
                        '123',
                        '456',
                        {
                            aa:'bb'
                        }
                    ]
                }
            输出：i.stepValue(window,'aiotos._i_user')，得到'develop'
            类似：i.stepValue(resJson,'aiotos.flag.2')，得到{aa: 'bb'}
                  i.stepValue(resJson,'aiotos.flag.2.aa')，得到bb
            总之，i.stepValue通过极为简便的方式，兼容了window对象、ht.Node图元对象，以及常规json结构化对象的keyURL寻址，并且服务全量扁平化再去匹配key-value，
            只需要按照传入的结构针对性逐层解析即可，而且是模拟正常人脑思维！！速度和效率将大大提升！！！*/
            stepValue: function(obj, keyURL, flag = '.', logoutput = true) {
                if (obj === null) return undefined; //240304，因为存在obj传入为null的情况，里面执行obj[Number(attr)]会报错！这里就return
                try {
                    if (typeof(keyURL) != 'string') return undefined; //对于keyURL为非字符串的，直接返回undefined
                    try {
                        if (isObject(i.jsonParse(keyURL))) return undefined;
                    } catch (error) {}

                    let attrSteps = keyURL.split(flag),
                        targetValue = null,
                        urlStepTracking = ''; //错误时追踪当前到哪步了
                    const rawObj = obj;
                    let breaktmp = false;
                    //240131，试图提高性能
                    i.forEach(attrSteps, (attr, idx) => {
                        if (breaktmp) return; //中断循环，不进行后续。
                        urlStepTracking += '.' + attr;
                        if (i.isStringNumber(attr)) { //如果是数字，那么判断对应数组是否存在，否则当字符串key处理。
                            if (obj && obj[Number(attr)] !== undefined) attr = Number(attr);
                        }
                        if (!obj) {
                            //231029，貌似存在传入obj为空的情况！下面直接用obj[]就报错了！
                            console.error('obj is null!!', keyURL);
                            return;
                        }
                        let valtmp = obj[attr];
                        //keyURL没解析到底就出现非对象数值或者没有字段值，以及解析到底时，解析完毕！
                        if (typeof(valtmp) != 'object' || idx === attrSteps.length - 1) {
                            if (idx != attrSteps.length - 1) {
                                let retFlatParsing = undefined;
                                if (i.objKeysFind(obj, attr, true).length > 0 && obj[attr] == undefined) {
                                    //231003，存在传入的obj就已经是扁平化后的数据，此时对于节点的解析，自然找不到对应的value，所以
                                    let objTreedJson = i.toTreeJson(obj);
                                    //231115，加上 i.isEqual(objTreedJson, obj)，因为对于已经是扁平化的基础json对象，转换后结果还是自身，递归调用容易产生死循环！
                                    retFlatParsing = i.isEqual(objTreedJson, obj) ? undefined : i.stepValue(objTreedJson, keyURL, '>', logoutput);
                                    console.assert(idx == 0); //通常只在第一级的时候就会出问题
                                    retFlatParsing == undefined && console.error('WARN: stepValue need tree typed object,but given flat typed seems.', keyURL, obj);
                                    breaktmp = true;
                                }
                                if (retFlatParsing !== undefined) targetValue = retFlatParsing;
                                else {
                                    breaktmp = true; //231115，加上这里，在keyURL第一级出现问题时，不再往下继续匹配了！
                                    targetValue = undefined;
                                    logoutput && i.alert(`赋值解析错误：${keyURL}\r\n错误位置：${urlStepTracking}\r\n待解析数据：${i.ify(rawObj)}`, '错误', false, null, null, [300, 200]);
                                    logoutput && console.error(`step parse error! origin object`, rawObj, `does not have keyURL ${keyURL}, while checking step field: ${urlStepTracking}`);
                                }
                            } else { //正常获得值，可以是基本类型值，可以是对象结构，可以是undefined，前提是keyURL遍历完毕！
                                targetValue = valtmp;
                            }
                        } else if (typeof(valtmp) == 'object' && idx < attrSteps.length - 1) { //下一级是对象，并且还没解析完毕时，继续
                            obj = valtmp;
                        }
                    });
                    return targetValue;
                } catch (error) {
                    console.error(error);
                    return;
                }
            },
            //传入标识列表，获取图元组件
            getDataByTags: function(dm, tags = []) {
                let regexptmp = '';
                tags.forEach((tag) => {
                    regexptmp += '(?=.*' + tag + ')'
                })
                regexptmp += '^.*';
                let datastmp = {}
                let jsonObj = i.dms(dm, true, false);
                i.keys(jsonObj).forEach((key) => {
                    if (key.match(RegExp(regexptmp))) {
                        // datastmp.push(key);
                        datastmp[key] = jsonObj[key]
                    }
                })
                return datastmp
            },
            /*通常用于数据库查询返回的单层json数组，根据id、parent等字段形成逻辑层次，转换成对应的多层次tree形式的json对象*/
            convertArrayToTree: function(rawData, flag = {
                id: 'id',
                parent: 'parent',
                children: 'children'
            },objRefForbid = false) {
                if (!isArrayFn(rawData)) {
                    console.error('param error! need array, not：', rawData);
                    return [];
                }

                //240804，兼容传入flag为null的情况也用默认值，方便仅用于传入修改第三个参数！
                if(!flag){
                    flag = {
                        id: 'id',
                        parent: 'parent',
                        children: 'children'
                    }
                }

                //240804，发现如果不用i.clone拷贝，那么（工具函数）初始传入值会被引用修改！这里就加上参数objRefForbid。默认false，向下兼容！注意，用i.copy不行，那只是浅拷贝！
                if(objRefForbid) rawData = i.clone(rawData);

                let idField = flag.id,
                    parentField = flag.parent,
                    childrenField = flag.children;

                function getItemById(items, id) {
                    let itemtmp = null; //230901，将默认{}改成了null，避免不存在时，if()判断还是true
                    items.forEach(item => {
                        if (item[idField] == id) {
                            itemtmp = item
                            return;
                        }
                    })
                    return itemtmp;
                }
                //240131，试图提高性能
                i.forEach(rawData, (item, index) => {
                    if (!item) { //230902，行数据为空时，直接进入后面会报错！
                        console.warn('row data empty!!!')
                        return;
                    }
                    if (item[parentField] == 0 ||
                        item[parentField] == undefined //230216，增加没有parent字段情况的支持，不是树表结构的table，而是常规列表行记录
                    ) {

                    } else {
                        let parentItem = getItemById(rawData, item[parentField]);
                        if (parentItem) {
                            let childItem = parentItem[childrenField];
                            if (childItem) {
                                //需要这么判断一下，否则因为对话框dialog组件因为两个gv会导致重复加载时push造成重复追加！
                                if (i.getItemsByIdKey(childItem, item[idField], idField).length == 0)
                                    childItem.push(item);
                                else console.error('multiple id or reinited??', item[idField]);
                            } else {
                                parentItem[childrenField] = [item];
                            }
                            item.isChild = true;
                        } else {
                            console.warn('parent id not fond：' + item[parentField]);
                            // console.error(rawData);
                        }
                    }
                });
                let result = [];
                //240131，试图提高性能
                i.forEach(rawData, (item, index) => {
                    if (!item) { //230902，行数据为空时，直接进入后面会报错！
                        console.warn('row data empty!!!')
                        return;
                    }
                    if (item.isChild) {
                        delete item.isChild; //删除key
                        return;
                    }
                    result.push(item)
                })
                return result;
            },
            /*230901，从父子结构的树表数组数据集中，获取某个节点对象，用于在其基础上插入新的数据或者子节点。注意，可以直接传入数据集，内部会自动转成父子节点tree
            传入：
            let raw = [
                {
                    "rowData": [
                        [
                            "一级机构"
                        ]
                    ],
                    "children": [
                        {
                            "rowData": [
                                [
                                    "iotos6"
                                ]
                            ],
                            "children": [],
                            "id": 72
                        }
                    ],
                    "id": 32
                },
                {
                    "rowData": [
                        [
                            "aaa"
                        ]
                    ],
                    "children": [
                        {
                            "rowData": [
                                [
                                    "welcome222"
                                ]
                            ],
                            "children": [
                                {
                                    "rowData": [
                                        [
                                            "hello33"
                                        ]
                                    ],
                                    "id": 123
                                }
                            ],
                            "id": 177
                        }
                    ],
                    "id": 185
                }
            ]
            调用：
            i.getItemFromTreeTypedArray(raw,177)
            输出：
            {rowData: Array(1), children: Array(1), id: 177}
            */
            getItemFromTreeTypedArray: function(rawData, idValue, id = 'id', children = 'children', parent = 'parent') {
                if (rawData == null) { //231004，存在传入rawData为null的情况
                    console.error('getItemFromTreeTypedArray input param rawData is null!');
                    return null;
                }
                /*rawData = */rawData && i.convertArrayToTree(rawData, {
                    id,
                    parent,
                    children
                });

                //递归遍历，直到找到字段为id的值为指定的，将对象返回！
                function __traverseTree(item,_parentIsArray = false) {
                    if (isArrayFn(item) && !_parentIsArray) {
                        let ret = null;
                        item.forEach(child => {
                            if (!ret) {
                                //240805，数组的子项加上父节点对象引用！因为可能存在[{},[],{},{}]这种格式中，里面数组[]添加子项appendTo，结果需要将数组[]改成对象{}，就依赖于其父节点了！
                                child._i_parent = item; 
                                ret = __traverseTree(child, true); //加上if(!ret)为了让后续没找到的数组中的不至于覆盖掉前面找到了的对象
                                if(!ret) child._i_parent = undefined; //240804，没有匹配到的，就马上自行清理掉！避免循环引用，数据废掉了！
                            }
                        });
                        return ret;
                    } else if (item[id] === idValue) return item;
                    else {
                        item._i_parent = undefined; 

                        if (item[children]) {
                            return __traverseTree(item[children],false);
                        } else return null;
                    }
                }
                return __traverseTree(rawData);
            },
            /*用于将多层次tree形式的json对象，转换成对treeTable需要的数据格式，通常结合convertArrayToTree使用！*/
            /*典型返回值格式如下：（入参为上面convertArrayToTree函数的典型返回值）
            [
                {
                    "rowData": [
                        [
                            "一级机构"
                        ]
                    ],
                    "children": [
                        {
                            "rowData": [
                                [
                                    "二级机构"
                                ]
                            ],
                            "children": [
                                {
                                    "rowData": [
                                        [
                                            "三级机构"
                                        ]
                                    ],
                                    "children": [
                                        [
                                            "四级机构"
                                        ]
                                    ]
                                }
                            ]
                        },
                        {
                            "rowData": [
                                [
                                    "二级机构"
                                ]
                            ],
                            "children": [
                                {
                                    "rowData": [
                                        [
                                            "三级机构"
                                        ]
                                    ],
                                    "children": [
                                        [
                                            "四级机构"
                                        ]
                                    ]
                                }
                            ]
                        }
                    ]
                },
                [
                    "一级机构"
                ]
            ]
            */
           //240804，加上参数ignoreExtraFields，不是所有中间场景都要extraDaTa字段！比如工具函数转下拉框数据，加上后返回的数据太冗长了！
            formatTreeTable: function(treeJsonObj, fields = ['name'], idField = 'id',ignoreExtraFields = false,objRefForbid = false) {
                if (!isArrayFn(treeJsonObj)) {
                    console.error('param error! need array, not：', treeJsonObj);
                    return [];
                }

                //240804，发现如果不用i.clone拷贝，那么（工具函数）初始传入值会被引用修改！这里就加上参数objRefForbid。默认false，向下兼容！注意，用i.copy不行，那只是浅拷贝！
                if(objRefForbid) treeJsonObj = i.clone(treeJsonObj);

                let tabletmp = [];
                let keystmp = Object.keys(treeJsonObj),
                    jsonKeySize = keystmp.length;
                for (let idx = 0; idx < jsonKeySize; idx++) {
                    let key = keystmp[idx],
                        childrentmp = treeJsonObj[key].children,
                        idtmp = treeJsonObj[key][idField]; //列表数据通常每行都带有id字段，比如数据库id
                    let rowtmp = [],
                        extraData = ignoreExtraFields ? undefined : {}; //231205，存放查询返回的多个字段中，在fields中指定配置之外的其他字段的值！

                    //added 230225，如果没有传入字段，那么默认按照字段的返回顺序完整、自动填充并且是去掉了id列之外的，方便立刻查看数据到表格上，即使先没对应上列！
                    if (fields == null || (isArrayFn(fields) && fields.length == 0)) {
                        for (let fieldtmp in treeJsonObj[key]) {
                            fieldtmp != 'id' && rowtmp.push(treeJsonObj[key][fieldtmp]);
                        }
                    } else { //保持原始逻辑不变，上面做了兼容
                        fields.forEach(field => {
                            let itemtmp = treeJsonObj[key][field];
                            if (itemtmp === undefined) {
                                console.warn(`field ${field} does not data in `, treeJsonObj[key]);
                            }
                            rowtmp.push(itemtmp);
                        });
                    }

                    //231205，存放没有设定到fields字段的其他当前数据项对象的key-value，之所以不全量存放备份，主要是避免数据大量冗余，尤其是field有指定很多字段时！
                    let fieldsAll = i.arrFieldsAll(treeJsonObj);
                    fieldsAll.forEach(extraField => {
                        if (fields.indexOf(extraField) == -1 && !ignoreExtraFields) {
                            extraData[extraField] = treeJsonObj[key][extraField];
                        }
                    });

                    if (!rowtmp || rowtmp.length == 0) continue;

                    //加上这句，为了便于强制让具备id属性的行进入到rowData处理逻辑
                    if (childrentmp == undefined) childrentmp = [];

                    if (childrentmp || idtmp != undefined) { //如果有子节点/下一行数据，或者有id字段定义，那么就用对象方式存放
                        let itemtmp = {
                            rowData: rowtmp, //230225，修复bug，原先是[rowtmp]，如果只有一列数据没问题，多列时出现数据都对应到第一列的BUG！
                            extraData: extraData, //231205，确保数据不丢失，字段未指定加入的，也存放过来，减少不必要的全量字段配置工作，方便数据解析连线
                            children: i.formatTreeTable(childrentmp, fields, idField, ignoreExtraFields) //240306，补充上递归里的参数传入，之前竟然没有！
                        };

                        //230913，原先的itemtmp['idField']改成了itemtmp['id']，固定格式中id字段名称为'id'，只是可以对应数据中的id字段为非'id'，这就是idField的用途！
                        itemtmp['id'] = idtmp; //数据库的列表数据转换成tree树形数据，保留id字段不丢失；因为表单中通常需要id来提交数据

                        tabletmp.push(itemtmp);
                    } else {
                        tabletmp.push(rowtmp);
                    }
                }
                return tabletmp;
            },
            /*将用于树表treeTable形式的json对象，转换成对下拉组合框combobox需要的数据格式，通常结合formatTreeTable使用！*/
            /*典型返回值格式（入参为上面formatTreeTable函数的典型返回值）
            [
                {
                    "name": "一级机构",
                    "value": 1,
                    "children": [
                    {
                        "name": "二级机构",
                        "value": "1.1",
                        "children": [
                        {
                            "name": "三级机构",
                            "value": "1.1.1",
                            "children": [
                            {
                                "name": "四级机构",
                                "value": "1.1.1.1",
                                "children": []
                            }
                            ]
                        }
                        ]
                    },
                    {
                        "name": "二级机构",
                        "value": "1.2",
                        "children": [
                        {
                            "name": "三级机构",
                            "value": "1.2.1",
                            "children": [
                            {
                                "name": "四级机构",
                                "value": "1.2.1.1",
                                "children": []
                            }
                            ]
                        }
                        ]
                    }
                    ]
                },
                {
                    "name": "一级机构",
                    "value": 2,
                    "children": []
                }
                ]
            */
            formatComboboxTree: function(
                treeTableJson,
                parent = null,
                idField = 'id',
                rowDataNameIndex = 0,
                objRefForbid = false
            ) {
                if (treeTableJson == undefined) {
                    return []
                }
                //240804，发现如果不用i.clone拷贝，那么（工具函数）初始传入值会被引用修改！这里就加上参数objRefForbid。默认false，向下兼容！注意，用i.copy不行，那只是浅拷贝！
                if(objRefForbid) treeTableJson = i.clone(treeTableJson);

                let result = [];
                isArrayFn(treeTableJson) && treeTableJson.forEach((item, index) => {
                    if (item == undefined) {
                        return;
                    }
                    let curnode = {
                            name: null,
                            value: null,
                            itemData: null, //231205，当前数据，比如接口查询记录集，除了name、value指定字段，还需要当前行数据都在里面，避免选中了下拉框选项，但是没有完整信息！
                            children: []
                        },
                        nametmp = null;

                    function __update() {
                        if (isArrayFn(nametmp)) nametmp = nametmp[0];
                        if (nametmp) {
                            curnode.name = nametmp;

                            //240804，可以带上剩余完整多个同行其他列的数据，但是children没必要带上！否则大量冗余数据！而且列数量大于1时，才加上itemData，否则也是多余的！！
                                let extraTmp = i.clone(item);
                                delete extraTmp.children;
                                curnode.itemData = extraTmp; //231205，当前数据，比如接口查询记录集，除了name、value指定字段，还需要当前行数据都在里面，避免选中了下拉框选项，但是没有完整信息！

                            //如果从列表list到树tree到下拉combobox都保留有id下来，那么下拉框的tree对应value就用这个id，便于提交数据保存数据库记录需要用的参数！
                            curnode.value = item[idField] != undefined ? item[idField] : parent ? parent.value + '.' + (index + 1) : (index + 1);
                        }
                    }
                    if (!isArrayFn(item) && item.rowData) {
                        //230124，注意，对rawData只支持单层[]数组，对于rawData:[[]]数组的数组形式，不支持！因为对于常规数据库返回字段对应的数据，不会这么复杂！
                        nametmp = item.rowData[rowDataNameIndex != 0 ? rowDataNameIndex : 0];
                        __update();
                        curnode.children = i.formatComboboxTree(item.children, curnode);
                    } else {
                        nametmp = item[0];
                        __update();
                    }
                    result.push(curnode);
                })
                return result;
            },
            /*230324
            与formatTreeTable不同的地方是，前者主要是对数据库table返回的数组结构转换成table/treeTable的格式，以表格数据为主。
            这里更多是treeList，纯粹json对象的格式key-value，其中key是有树形层次结构的，value为基本类型的但一值，比如下，要求原
            数据array类型的值会被当做数据列处理，而object的key则是行tree，常规值则当作默认第2列来处理（tree key列之后的，不算id列）：
            输入：
            {
                "scroll": {
                    "favoritelong": {
                        "scroll1@1679580828568.json": "displays/develop/uiotos/editor/widgets/__stored/scroll/favorite-long/scroll1@1679580828568.json"
                    },
                    "apiInst.json": "displays/develop/uiotos/editor/widgets/__stored/apiInst.json"
                },
                "grid": {
                    "grid2@1679564095991.json": "displays/develop/uiotos/editor/widgets/__stored/grid/grid2 1679564095991.json",
                    "grid2@1679564761209.json": "displays/develop/uiotos/editor/widgets/__stored/grid/grid2@1679564761209.json"
                },
                "gridInst.json": "displays/develop/uiotos/editor/widgets/__stored/gridInst.json"
            }
            输出：
            [
                {
                    "rowData": [
                        "scroll"
                    ],
                    "children": [
                        {
                            "rowData": [
                                "favoritelong"
                            ],
                            "children": [
                            {
                                "rowData": [
                                    "displays/develop/uiotos/editor/widgets/__stored/scroll/favorite-long/scroll1@1679580828568.json"
                                ]
                            }
                            ]
                        },
                        {
                            "rowData": [
                                "displays/develop/uiotos/editor/widgets/__stored/apiInst.json"
                            ]
                        }
                    ]
                },
                {
                    "rowData": [
                        "grid"
                    ],
                    "children": [
                        {
                            "rowData": [
                                "displays/develop/uiotos/editor/widgets/__stored/grid/grid2 1679564095991.json"
                            ]
                        },
                        {
                            "rowData": [
                                "displays/develop/uiotos/editor/widgets/__stored/grid/grid2@1679564761209.json"
                            ]
                        }
                    ]
                },
                {
                    "rowData": [
                        "displays/develop/uiotos/editor/widgets/__stored/gridInst.json"
                    ]
                }
            ]
            */
            /*230325，增加了参数keyFlag和keyFieldUsage，主要是因为json对象内key不能重复名称，但是table多行可以名称相同！因此允许加上@或其他
            指定间隔放在key中区分，并且显示时，不会显示@后面的。支持连续多个@间隔附带冗余信息！用途见keyFieldUsage，目前默认是追加到横向列扩展。
            */
            formatTreeList: function(treeJsonObj, keyFlag = '@', keyFieldUsage = 'append') {
                if (!(isObject(treeJsonObj) && !isArrayFn(treeJsonObj))) {
                    console.error('param error! need object list, not array or others：', treeJsonObj);
                    return [];
                }
                let tabletmp = [];
                for (let key in treeJsonObj) {
                    let val = treeJsonObj[key],
                        keyFields = key.split(keyFlag),
                        keyExtra = keyFields.length > 1 ? keyFields.slice(1) : [];
                    key = keyFields[0];
                    if (isArrayFn(val)) { //3）值为数组时，当成列数据，表明没有子节点
                        if (keyExtra.length) val = [...val, ...keyExtra];
                        tabletmp.push({
                            rowData: [key, ...val] //数据的第一列还得是key，val只能是第二列
                        })
                    } else
                    if (isObject(val)) { //1）值为对象时，当成下一行数据
                        tabletmp.push({
                            rowData: keyFields,
                            children: i.formatTreeList(val)
                        })
                    } else { //2）值为基本类型数据时，当成指定随后列的value，被包成数组类处理
                        if (keyExtra.length) keyExtra = [val, ...keyExtra];
                        tabletmp.push({
                            rowData: [keyFields[0], keyExtra] //数据的第一列还得是key，val只能是第二列
                        })
                    }
                }
                return tabletmp;
            },
            //数组列表某个字段比如id的值，获取符合的
            getItemsByIdKey: function(arr, id, idField = 'id') {
                let result = [];
                arr.forEach((item, index) => {
                    if (item[idField] == id) {
                        result.push(item);
                    }
                });
                return result;
            },
            //对数组移除指定索引，并且通过引用无需return，直接影响数组本身；230813，支持传入index为数组，删除多个指定的索引
            /*示例如下：
                let tmp = ['a','b','c','d']
                i.arrayIndexRemoved(tmp,[0,3])
                console.error(tmp)
                ['b', 'c']
            */
            arrayIndexRemoved: function(arr, index) {
                if (isArrayFn(index)) {
                    let indexArr = index;
                    newArr = [];
                    arr.forEach((item, idx) => {
                        if (indexArr.indexOf(idx) == -1) newArr.push(item);
                    })
                    i.arrOverwrite(arr, newArr);
                    return arr;
                } else {
                    if (arr == undefined || arr.length == 0) return arr;
                    let len = arr.length - 1;
                    for (let i = index; i < len; i++)
                        arr[i] = arr[i + 1];
                    arr.length = len;
                    return arr; //兼容return返回，实际通过传参引用，不用return，传入的arr数组对象内容已被修改！
                }
            },
            //230625，对数组移除指定元素，并且通过引用无需return，直接影响数组本身
            arrayItemRemoved: function(arr, item) {
                if (arr == undefined || arr.length == 0) return arr;
                let indextmp = arr.indexOf(item);
                if (indextmp != -1) i.arrayIndexRemoved(arr, indextmp);
                return arr;
            },
            //230929，多个元素相同时（常用于相同字符串出现在数组中），注意，这里传入的item是单个元素，并非数组！items指的是相同item匹配到，移出同样多个，并非是指移出数组item！！
            arrayItemsRemoved: function(arr, item) {
                console.assert(!isArrayFn(item)); //提示，避免错误传参出现BUG
                if (arr == undefined || arr.length == 0) return arr;
                let indexs = [];
                arr.forEach((ele, idx) => {
                    ele === item && indexs.push(idx);
                });
                i.arrayIndexRemoved(arr, indexs);
                return arr;
            },
            /*树形列表中根据某个字段比如id的值，找到符合条件的对象列表，treeJson传入对象或数组均可。最后一个参数removed如果传入true,
            那么除了返回匹配的对象数组外，传入参数treeJson通过引用，自动会移除掉前面匹配到的对象！默认false为不移除，保持不变，例如：
            传入结构如下，其中传入id（实际字段为value）为35：
            [
                {
                    "name": "一级机构",
                    "value": 32,
                    "children": [
                    {
                        "name": "二级机构",
                        "value": 33,
                        "children": [
                        {
                            "name": "三级机构",
                            "value": 35,
                            "children": [
                            {
                                "name": "iotos5",
                                "value": 72,
                                "children": []
                            }
                            ]
                        }
                        ]
                    },
                    {
                        "name": "iotoswelcome",
                        "value": 85,
                        "children": []
                    }
                    ]
                }
            ]
            那么当removed参数为true时，传入参数会变成如下：
            [
                {
                    "name": "一级机构",
                    "value": 32,
                    "children": [
                    {
                        "name": "二级机构",
                        "value": 33,
                        "children": []
                    },
                    {
                        "name": "iotoswelcome",
                        "value": 85,
                        "children": []
                    }
                    ]
                }
            ]
            */
            /*注意，返回的是一个数组，一般取第一个元素[0]，内容对象就是原treeJson的引用！虽然返回数组本身并非引用，但是里面的对象内容，直接修改会影响原treeJson
              如代码所示，不要直接以为返回的就是object对象，需要至少取首个后再处理：
                let rowItem = i.getTreeItemsById(oldVal,rowId)[0];
                if(rowItem.children == undefined || rowItem.length == 0) rowItem.children = []
                rowItem.children.push([
                    val
                ]);
            此外，支持传入id为null，此时返回所有id-item的key-value对象！*/
            /*TIPS 231207，除了上面对象数组[{},{},{}]，数组的数组[[],[],[]]也支持！！比如树表格式：
            [
                [
                    "jone1",
                    "134231511",
                    "170991574",
                    "id": 1         //原本没有，传入给本函数后，自动被加上的字段以及从1开始的序号值
                ],
                [
                    "jone4",
                    "134235645",
                    "170992816",
                    "id": 2         //同上，自动生成
                ],
                [
                    "jone2",
                    "13423987810",
                    "1709925248737562625",
                    "id": 3         //同上，自动生成
                ]
            ]
            如上结果中数组的数组被导入后，会自动被加上id:xxx这样的一项，其中字段为参数idField，值从1开始顺次排开，执行结果跟对象数组一模一样，不论是
            移除还是查找返回，以及引用赋值返回！
            */
            getTreeItemsById: function(treeJson, id, idField = 'id', childrenField = "children", removed = false, _parentId = null, _globalCache = null) {
                if (treeJson == undefined) return [];
                if(_globalCache === null) {
                    _globalCache = {};    //240804，需要用这个地柜时不变的原始数据对象！
                    _globalCache._i_dynamicIndexAsc = 0;
                }

                //231228，支持传入id字段对应的值列表，相当于批量查询或删除符合条件的组！
                let ids = id;
                if (!isArrayFn(id)) ids = [id];

                if (!isArrayFn(treeJson)) treeJson = [treeJson] //如果是对象，非数组，就先转换成数组
                let result = [],
                    indexArr = [],
                    id2item = {}, //id与item的key-value键值对，当传入id为null时，返回这个！
                    pureList = []; //230218，兼容数组模式，这里存放外层数组中元素为非对象的格式
                
                treeJson.forEach((item, index) => {
                    if (!isObject(item)) { //230218，非对象的内容，都存放到一个单独的列表中
                        pureList.push(item);
                        return;
                    }
                    if (_parentId !== null) item._parentId = _parentId;

                    //240804，全局自增，而且跟当前已有的ID（数字类型）来核对，不是逾期的，就警告！
                    _globalCache._i_dynamicIndexAsc += 1;
                    if(item[idField] !== undefined && typeof(item[idField]) == 'number' && item[idField] !== _globalCache._i_dynamicIndexAsc){
                        console.error(`WARN: the id field value ${item[idField]} in the tree-structured data are currently of numeric type and do not match the expected automatically assigned id value:${_globalCache._i_dynamicIndexAsc}`);
                    }
                    if (isArrayFn(item) && item[idField] == undefined) {
                        //240804，上面用全局机制来分配，此前这里有BUG！！
                        item[idField] = _globalCache._i_dynamicIndexAsc; //_parentId + index + 1 + treeJson._i_dynamicIndexAsc;
                    }
                    //判断当前节点是否满足条件
                    if (ids.indexOf(item[idField]) != -1) { //231228，替换item[idField] == id，以支持传入多个值来批量匹配！
                        result.push(item);
                        indexArr.push(index);
                    }

                    //循环遍历中存放id-item的键值对
                    id2item[item[idField]] = item;

                    //递归其子节点判断是否有满足条件的
                    let childrentmp = item[childrenField];
                    if (childrentmp) {
                        let rettmp = i.getTreeItemsById(childrentmp, id, idField, childrenField, removed, item[idField],_globalCache);
                        if (isArrayFn(rettmp) && rettmp.length) {
                            result = result.length == 0 ? rettmp : [...result, ...rettmp];
                        } else if (isObject(rettmp)) {
                            id2item = {
                                ...id2item,
                                ...rettmp
                            }
                        } else {
                            console.error('abnormal error!!!', rettmp);
                        }
                    }
                });
                if (result.length == 0 && i.isObjEmpty(id2item)) {
                    let rettmp = [];
                    ids.forEach(idtmp => {
                        if (pureList.indexOf(idtmp) != -1) rettmp.push(idtmp);
                    });
                    return rettmp;
                }

                if (removed) {
                    //连续索引移除，注意，每次循环减少的长度会影响到下一次循环原先索引，所以需要rawIndex - index
                    indexArr.forEach((rawIndex, index) => {
                        i.arrayIndexRemoved(treeJson, rawIndex - index);
                    })
                }

                return id == null ? id2item : result; //返回可以是对象（所有id与item的key-value对象）或者数组（id对应的一个或多个item），取决于id是否传入。
            },
            /*与getTreeItemsById对应，这里是根据tree的显示文字（item的name）,查找/获取到对应的序号id，注意以getTreeItemsById为主，这里功能简化的只为辅助！*/
            getTreeIdsByName: function(treeJson, name, idField = 'id', childrenField = "children", nodeInclude = false) {
                let id2item = i.getTreeItemsById(treeJson, null, idField, childrenField),
                    ids = [];
                for (let id in id2item) {
                    let rowData = id2item[id].rowData,
                        itemName = rowData[0];
                    if (isArrayFn(rowData) && itemName != undefined) {
                        if (isArrayFn(itemName)) {
                            if (nodeInclude) itemName = itemName[0]; //当前数据中节点基本都是rowData:[[name]]，非节点时rowData:[name]
                            else continue;
                        }
                        if (itemName == name) ids.push(id);
                    }
                }
                return ids;
            },
            //230307，树表/表格的行数据id（data.did）转换成索引id（data.getId/._id）
            getIndexByRowId: function(table, rowId) { //兼容传入数组或单个id
                console.assert(table.dm != undefined && table.dm() != undefined);
                let ids = rowId,
                    result = [];
                if (!isArrayFn(rowId)) ids = [rowId];
                ids.forEach(id => {
                    let idx = null;
                    table.dm().each(data => {
                        if (data.did === id) idx = data.getId();
                    });
                    result.push(idx);
                });
                return isArrayFn(rowId) ? result : result[0];
            },
            //230307，树表/表格的索引id（data.getId()）转换成数据库/API数据id（data.did）
            getRowIdByIndex: function(table, index) {
                console.assert(table.dm != undefined && table.dm() != undefined);
                let ids = index,
                    result = [];
                if (!isArrayFn(index)) ids = [index];
                ids.forEach(id => {
                    let idx = null;
                    table.dm().each(data => {
                        if (data.getId() === id) idx = data.did;
                    });
                    result.push(idx);
                });
                return isArrayFn(index) ? result : result[0];
            },
            /*isTreeChild依赖getTreeItemsById使用，典型的输入treeJson如下结构所示，这里idField对应"value"
            使用示例：
            console.error(isTreeChild(treeObj, 35, 72, 'value')); //true
            console.error(isTreeChild(treeObj, 35, 85, 'value')); //false
            console.error(isTreeChild(treeObj, 33, 72, 'value')); //true
            console.error(isTreeChild(treeObj, 32, 72, 'value')); //true
            console.error(isTreeChild(treeObj, 32, 85, 'value')); //true
            console.error(isTreeChild(treeObj, 33, 85, 'value')); //false
            [
                {
                    "name": "一级机构",
                    "value": 32,
                    "children": [
                    {
                        "name": "二级机构",
                        "value": 33,
                        "children": [
                        {
                            "name": "三级机构",
                            "value": 35,
                            "children": [
                            {
                                "name": "iotos5",
                                "value": 72,
                                "children": []
                            }
                            ]
                        }
                        ]
                    },
                    {
                        "name": "iotoswelcome",
                        "value": 85,
                        "children": []
                    }
                    ]
                }
            ]
            */
            //注意，这里parentId其实就是currentId,但是与childId对应，命名parentId即可！
            isTreeChild: function(treeJson, parentId, childId, idField = 'id', childrenField = "children") { //在示例数据中idField为"value"
                let parentItem = i.getTreeItemsById(treeJson, parentId, idField, childrenField);
                if (parentItem.length == 0) {
                    console.error('parentId对应的对象不存在！', parentId, treeJson);
                    return false;
                }
                console.assert(parentItem.length == 1); //默认id是唯一标识，不会有多个重复！虽然getTreeItemsById支持获取多个重复的。
                let childItem = i.getTreeItemsById(parentItem[0], childId, idField, childrenField);
                return childItem.length > 0;
            },
            getTreeParentId: function(treeJson, childId, idField = 'id', childrenField = "children") { //在示例数据中idField为"value"
                let childItem = i.getTreeItemsById(treeJson, childId, idField, childrenField);
                if (childItem.length == 0) {
                    console.error('childId对应的对象不存在！', childId, treeJson);
                    return undefined;
                }
                console.assert(childItem.length == 1); //默认id是唯一标识，不会有多个重复！虽然getTreeItemsById支持获取多个重复的。
                return childItem[0]._parentId;
            },
            /*i.save(displayUrl, dm.toJSON(), function(result) {});操作文件保存图纸、图标、png图片等等*/
            //编辑状态用保存图纸/图标
            save: function(jsonUrl, jsonObj, callback = null) {
                if (jsonUrl) {
                    let paramtmp = {
                        path: jsonUrl,
                        content: ht.Default.stringify(jsonObj)
                    };
                    //hteditor没有request对象！不过编辑器提供的全局对象除了hteditor之外，editor对象本身也是全局的！
                    try {
                        editor && editor.request("upload", paramtmp, function(result) {
                            if (result == 0) {
                                console.error('error in upload rewrite symbol ' + jsonUrl);
                            }
                            callback && callback(result);
                        })
                    } catch (error) { //运行时态editor未定义，但是editor &&并没起作用！打印也出错
                        console.warn(error);
                        callback && callback(2); //1是实际网络请求保存成功，2则是其他情况
                    }
                } else {
                    console.error('image path error!!')
                }
            },
            //运行状态保存图纸，最好不要用i.save()，新的增强维护都在i.upload中了！
            upload: function(dm, callback, showLoading = true, url = null) { //默认url为dm._url，也可以显式传入
                i.withLoading((closeLoadingFunc) => {
                    /*运行模式下，提交就会把当前不可见的线条也给隐藏，让编辑打开也看不到了，所以提交前对于隐藏的线条全部可见再保存，注意，这里
                    用clone后的dm对象来做连线的可见设置，否则直接对当前dm操作那么提交过程中就会闪现，即便提交完毕后恢复不可见设置！此外，clone
                    会丢失dm._url之类设置的属性，所以下面path传参中还是用的dm._url，而不是dmCopyed._url*/
                    let dmCopyed = i.clone(dm);

                    //data._xxx属性不会被i.clone/ht.Default.clone()复制过去，因此需要在复制前在原dm中找出来记录上tag
                    let nodeTagsWithAttrIgnored = {};
                    dm.eachByBreadthFirst(child => {
                        if (child._saveIngored) {
                            let tagtmp = i.autoTag(child);
                            if (nodeTagsWithAttrIgnored[tagtmp]) console.error('tag duplicated in dm!!', tagtmp, dm);
                            nodeTagsWithAttrIgnored[tagtmp] = child._saveIngored
                        }
                    });

                    runningMode() && dmCopyed.eachByBreadthFirst((child) => {
                        if (child.getClassName() == 'ht.Edge' && child.s('2d.visible') == false || //识别连线组件
                            (i.typeMatched(child, 'http') || i.typeMatched(child, 'api')) && i.hasAttrObjectKey(child, 'paramKeys')) { //识别http组件，注意如果组件不显示，那么其身上的连线也会不显示！
                            child.s('2d.visible', true);
                        }
                        /*在图纸序列化保存前，过滤掉某些图元标记的不想被保存到图纸的属性值，以修改之前的来保存，这样图纸再次加载到编辑状态不会被影响，比如连线、对话框弹窗关闭时对图元的隐藏！
                        支持的格式为对象数组，字段结构及调用示例代码如下所示。https://iotosystem.feishu.cn/docx/JEcgdyzxBog5Kixe0lxcG23mnrg：
                            if (runningMode()) data._saveIngored = [{
                                attr: 's:2d.visible',
                                oldValue: true,
                                newValue: false
                            }];*/
                        let saveIngored = nodeTagsWithAttrIgnored[i.autoTag(child)];
                        if (saveIngored) {
                            saveIngored.forEach((item, index) => updateForce(child, item.attr.slice(2), item.oldValue, item.attr.slice(0, 1)));
                        }

                        /*230131，对于图纸运行状态下调用了i.upload保存后，对于全屏铺满的图纸，需要还原原始尺寸，否则再次编辑打开时，尺寸大小被改成全屏铺满时的了！
                        注意，这里得用dm.originalRect而不是用dmCopyed.xxx，因为复制后.xxx属性会丢失！*/
                        if (dm.originalRect && child.s('fullscreen') == 'fill') {
                            let rtmp = dm.originalRect;
                            child.setRect(rtmp.x, rtmp.y, rtmp.width, rtmp.height);
                        }
                    });

                    $.post('/upload', { //server.js自带的后台post服务，i.save()内是经过editor封装的前端方法，后台也同样是/upload提供服务
                        path: url ? url : dm._url,
                        content: ht.Default.stringify(dmCopyed.toJSON())
                    }, res => {
                        closeLoadingFunc();
                        callback && callback(res);
                        i.initConfigure(); //这里一旦保存，刷新下配置
                    }, 'json').fail(function(xhr, status, info) {
                        closeLoadingFunc();
                        callback && callback(null);

                        //弹窗提示1：默认对话框alert
                        // alert("error" + info);
                        //弹窗提示2：自定义对话框
                        i.openDialog('displays/' + i.user() + '/uiotos/editor/widgets/dialog/ensure.json', editor.gv, {
                            onInit: function(data, gv, cache, formAttrs) {
                                data.ca('oneButton', true);
                                data.ca(i.np(i.attr(formAttrs, 'a:value')), info + '(' + xhr.status + ')')
                            }
                        }, '错误', [300, 150]);

                    });

                    //用完即走，避免内存垃圾悬空！此外因为不是对当前dm引用直接操作导致显示需要还原，先不说闪现的问题，至少这个步骤，clone的就可省去
                    dmCopyed.clear();
                    dmCopyed = null;
                }, showLoading);
            },
            //2310011，本地文件选择，传出base64和文件对象，注意，是异步变同步函数，不用传入回调callback，需要通过let result = await i.fileChoose()的方式得到结果，上下文保持同步！
            fileChoose: async function(acceptTypes = 'image/*') { //6）外层异步转同步
                return new Promise((res, rej) => { //7）外层resolve/reject
                    var documenttmp = window.top.document,
                        inputObj = documenttmp.createElement('input');
                    inputObj.setAttribute('id', 'file');
                    inputObj.setAttribute('type', 'file');
                    inputObj.setAttribute('name', 'file');
                    inputObj.setAttribute('accept', acceptTypes);
                    inputObj.setAttribute("style", 'visibility:hidden');
                    documenttmp.body.appendChild(inputObj);
                    inputObj.click();
                    async function fileChoosed(e) {
                        layer.load(1);
                        //2301001，异步onload函数内的结果，在外层以同步调用的方式给出并向下执行
                        async function __changeFileIntoBase64(file) { //1）asyn修饰函数
                            return new Promise((resolve, reject) => { //2）函数内固定以return new Promice((resolve,reject)=>{})形式

                                const fr = new FileReader();
                                fr.readAsDataURL(file);
                                fr.onload = (result) => { //3）函数体内有异步调用
                                    const base64Str = result.currentTarget.result;
                                    // reject(base64Str);
                                    resolve(base64Str); //4）并且在异步callback中通过前面的resolve/reject参数返回回调的值
                                };

                            });
                        };
                        let filetmp = e.target.files[0]
                        let base64tmp = await __changeFileIntoBase64(filetmp) //5）在函数外调用时，通过await修饰，将异步转成同步，后续上下文就当同步调用了
                        res({ //8）对最外层的fileChoose，返回对象
                            base64: base64tmp,
                            file: filetmp
                        });
                        documenttmp.body.removeChild(inputObj)
                        layer.closeAll();
                    }
                    _i.addEventListener(documenttmp.querySelector('#file'), 'change', fileChoosed);
                });
            },
            //选择本地文件上传
            //240104，增加首个参数url，用于指定接口，此前默认是物联中台的文件上传接口！加上params参数，用于inputs里，之前inputs中的格式换到专门的属性去！
            fileUpload: async function(url = null, params = null, paramType = 'postTypedParam', callback = null, succeedDialog = false, acceptTypes = 'image/*') {
                let choosed = await i.fileChoose(acceptTypes), //注意，当前函数内使用了await的，外层函数也必须修饰为async
                    file = choosed.file,
                    formData = new FormData(),
                    xmlHttp = new XMLHttpRequest();
                if (file) {
                    console.error(file.name)
                    formData.append('file', file);

                    //240104，上传图片等文件同时带参数，post表单参数方式，而不是放到url中get形式的参数
                    if (isObject(params)) {
                        if (paramType == 'postTypedParam') {
                            for (let pKey in params) {
                                formData.append(pKey, params[pKey]);
                            }
                        } else if (!!url && paramType == 'getTypedParam') {
                            delete params.__upper; //对于inputKeys/inputValues设置的对象，可能存在这种情况！
                            url += '?' + i.objToURLQueryStr(params);
                        }
                    }
                } else {
                    layer.msg("请选择文件！")
                }

                function isSubmit() {
                    console.info(xmlHttp);
                    if (xmlHttp.readyState == 4) {
                        let fileUrlTmp = location.origin + '/custom/uploads/' + file.name;
                        //240104，支持传入url上传到指定服务器时，回调返回接口信息。
                        callback && callback(!!url ? i.jsonParse(xmlHttp.response) : fileUrlTmp); //默认存放的文件url路径
                        layer.closeAll();
                        succeedDialog && layer.confirm(xmlHttp.response, {
                            btn: ['确认'],
                            icon: 1,
                            title: '提示'
                        }, function(index) {
                            // 按钮1的事件
                            layer.closeAll();
                        });
                    }
                }
                xmlHttp.open("POST", !!url ? url : "/file/upload"); //接口url地址
                xmlHttp.onreadystatechange = isSubmit;
                xmlHttp.send(formData);
            },
            //230327，删除文件（目前只测试图纸文件），传入url数组
            fileDelete: function(fileUrls,data = null) {
                if(runningMode()) return false;//240806，仅支持编辑状态下！
                if (fileUrls && !isArrayFn(fileUrls)) fileUrls = [fileUrls];
                let fileNodes = [],
                    invalids = [];
                fileUrls.forEach(fileUrl => {
                    let fileNodeTmp = i.window().editor.displays.dataModel._dataMap[data ? i.toAbsDisplayURL(data,fileUrl) : fileUrl];
                    if(fileNodeTmp) fileNodes.push(fileNodeTmp);
                    else{
                        invalids.push(fileUrl);
                    }
                });
                try {
                    i.window().editor.removeFiles(fileNodes);
                    //240806，存在路径不合法的情况（不属于加载的编辑器的文件！！）
                    if(invalids.length) return false;
                    else{
                        return true;
                    }
                } catch (error) {
                    console.error(error)
                    return false;
                }
            },
            //230915，判断图元组件是否有某属性，用于作为i.hasAttrObjectKey()的补充（结合一起使用），主要用于判断组件的原始p/s基础属性，而不是a尤其是内嵌暴露过来的属性
            hasBaseAttrKey: function(data, attr) {
                let bindingsList = data.getDataBindings(),
                    foundtmp = false;
                //判断属性的数据绑定是否存在，存在则按照实际存在的自动识别出没有给出的前缀
                function __typeReChech(typeFlag) {
                    if (bindingsList[typeFlag] && bindingsList[typeFlag][attr]) {
                        prefixtmp = typeFlag;
                        db = bindingsList[typeFlag][attr];
                        if (foundtmp) console.error('dataBindings attr predix duplicated!!', node.getTag(), attr, bindingsList);
                        foundtmp = true;
                    }
                }
                __typeReChech('a'); //后面的权重更高，如果存在a/s/p重复名称，那么按照顺序以后者的为准，会覆盖！
                __typeReChech('s');
                __typeReChech('p');
                if (foundtmp) return true;
            },
            //240623，判断属性是否有配置过，主要是a属性，配置过，就在getAttrObject()中有存放了有，否则旨在image.dataBindings定义中存在和初始默认值，
            hasAttrInited: function(data, attr, index = null) { //240627，属于i.isAttrConfigured()的别名！
                return i.isAttrConfigured(data, attr, index);
            },
            isAttrConfigured: function(data, attr, index = null) {
                let prefixed = i.autoPrefixed(attr, data).slice(0, 1),
                    attrPure = i.np(attr);
                switch (prefixed) {
                    case 'a':
                        let aobj = data.getAttrObject(), //这里调用获取的就是图纸保存的属性值的，不止image.dataBindings中定义的！
                            valtmp = aobj && aobj[attrPure];
                        if (valtmp && isArrayFn(valtmp)) {
                            if (index === null) return valtmp.length !== 0; //空数组，认为是没有配置。非空数组，认为是配置过！
                            else return valtmp[index] !== undefined && valtmp[index] !== null; //如果传入了索引，那么需要判断索引位置值是否是undefined或null
                        } else return aobj && aobj[attrPure] !== undefined && aobj[attrPure] !== null;
                    case 's':
                        let sobj = data.getStyleMap(); //这里调用获取的就是图纸保存的属性值的，不止image.dataBindings中定义的！
                        valtmp = sobj && sobj[attrPure];
                        if (valtmp && isArrayFn(valtmp)) {
                            if (index === null) return valtmp.length !== 0; //空数组，认为是没有配置。非空数组，认为是配置过！
                            else return valtmp[index] !== undefined && valtmp[index] !== null; //如果传入了索引，那么需要判断索引位置值是否是undefined或null
                        } else return sobj && sobj[attrPure] !== undefined && sobj[attrPure] !== null;
                    case 'p':
                        return data['_' + attrPure] !== undefined && data['_' + attrPure] !== null; //240623，有待测试！
                    default:
                        console.assert(0);
                }
            },
            /*231201，对于image为[object]的图元组件，判断当前局部object存量的定义是否有某个变量，注意，不能用下面的i.hasAttrObjectKey，那样会用到
            最新的url里的定义，可能是更新之后的，但是当前组件的p:image[object]可能还未更新！
            如果当前年image定义为字符串url不是object，那么等同于hasAttrObjectKey！*/
            hasAttrInLocalObj: function(data, attr, strict = false) {
                let imgtmp = data.getImage();
                if (typeof(imgtmp) == 'object') {
                    return i.arrFind(imgtmp.dataBindings, 'attr', attr) !== undefined;
                } else {
                    console.assert(i.getImage(imgtmp) != undefined); //如果资源暂未加载，就报错提示，暂未做回调版本支持。
                    return i.hasAttrObjectKey(data, attr, null, strict); //暂不支持回调异步提供，请注意！！
                }
            },
            /*对于图元a属性下，如果有attr:null的填充，那么根据data.ca(attr) == null进行判断是无效的，所以要判断是否有这个key；所以判断是否有
            这个key的属性在a下面，用此方法，而不能通过data.ca(attr)是否为null来判断，因为初始值可能就是null*/
            hasAttrObjectKey: function(data, attr, retCallback = null, strict = false) { //对于图标image还在加载中，则return undefined，实际结果通过callback返回
                let rawAttr = attr; //240207，用于性能优化
                attr = i.np(attr); //230927，默认去掉a:前缀，支持传入带或不带前缀！
                //初步判断，根据图纸中图元a属性下是否有attr key来判断
                let existTmp = false,
                    // attrObjectTmp = data.getAttrObject(); ////240207，为了性能优化，用其他方式代替这里，减少执行遍历！
                    symbolObjTmp = null,
                    prefixed = i.autoPrefixed(rawAttr, data).slice(0, 1);
                //240727，严格模式下，一定要取决于属性是否有定义，而不是此前配置的值是否有！有可能组件升级，属性定义没有了，但是旧版页面属性配置值还存在！！
                if (prefixed == 'a' && data.ca(attr) !== undefined && !strict) existTmp = true; //tips，这里的不存在，不代表真没定义，而可能只是没初始图纸页面上配置而已！
                /*240617，避免遍历的快捷方式！！！注意，不能根据data._i_symbolAttrsDefault存在，但是data._i_symbolAttrsDefault[i.np(attr)]为undefined，认为是没有，因为
                api里这种type http/mqtt切换的动态属性，data._i_symbolAttrsDefault中就没有！*/
                if (prefixed == 'a' && data._i_symbolAttrsDefault && data._i_symbolAttrsDefault[i.np(attr)]) {
                    retCallback && retCallback(true); //240618，注意，一定要有！因为不少情况都是用callback回调里面做逻辑的！
                    return true;
                }
                function __judged() {
                    if (existTmp) return true;
                    if (symbolObjTmp && i.getDataBindingItem(symbolObjTmp, attr, data)) existTmp = true;
                    return existTmp;
                }

                //如果没有，再进行深度判断，从图标url对应的资源内容中去匹配是否存在！
                if (!existTmp) {
                    try {
                        symbolObjTmp = data.getImage();
                    } catch (error) {
                    }

                    //240713，加上条件&& symbolObjTmp.trim() != ''，因为存在image就是空字符串的情况！比如常规node，用来设置图片用途！初始值就是空！
                    if (symbolObjTmp != null && typeof(symbolObjTmp) != 'object' && (symbolObjTmp && symbolObjTmp.trim() != '')) {
                        let objtmp = ht.Default.getImage(symbolObjTmp);
                        if (objtmp == undefined) {
                            //240703，tips，异步加载之前先清理复位hasLoaded。在异步接着执行时，通过onImageLoaded内回调传入第二个参数isAsync为true来跟.hasLoaded结合在一起来判断！
                            if (!runningMode() && typeof(editor) !== 'undefined' && editor.displayView) editor.displayView.hasLoaded = undefined;
                            i.onImageLoaded(symbolObjTmp, function(img) {
                                symbolObjTmp = img;
                                retCallback && retCallback(__judged(), true); //240702，第二个参数为true时，标明是异步加载资源后回调进来的！
                                if (!runningMode() && typeof(editor) !== 'undefined' && editor.displayView) editor.displayView.hasLoaded = true;
                            });
                            return undefined; //如果直接返回的不是true/false，而是undefined,那么最终结果得异步通过retCallback返回！
                        } else {
                            symbolObjTmp = objtmp;
                        }
                    }
                }
                //231030，根据新的symbolObjTmp再去算一遍！之前是放到retCallback判断非null之后，这会导致问题！对于data.getImage()为字符串，而i.getImage()为对象时，需要再计算！
                __judged();

                retCallback && retCallback(existTmp);

                return existTmp;
            },
            //240726，判断图元组件是否有配置交互连线，主要是为了避免连线被触发赋值时，自己没有对外连线，结果都要走一大半的逻辑处理！！
            hasOperateLines: function(data, currentLayerOnly = false){
                return (currentLayerOnly ? 0 : i.upperData(data)) || data.ca('bindControlsTag') && data.ca('bindControlsTag').length > 0;
            },
            /*【注意】作为hasAttrObjectKey的补充，能异步获取所有的attr属性*/
            syncAttrsAll: function(data, resultCb = null) {
                let ret = null;
                let symbolObjTmp = null;
                try {
                    symbolObjTmp = data.getImage();
                } catch (error) {
                    console.error('type has no image attribute!!', data.getClassName());
                    resultCb && resultCb({});
                    return {};
                }

                function __adjust() {
                    let attrtmp = {}
                    if (symbolObjTmp && symbolObjTmp.dataBindings) {
                        symbolObjTmp.dataBindings.forEach(item => {
                            attrtmp[item.attr] = data.ca(item.attr);
                        })
                    }
                    return attrtmp;
                }

                if (symbolObjTmp != null && typeof(symbolObjTmp) != 'object') {
                    let objtmp = ht.Default.getImage(symbolObjTmp);
                    if (objtmp == undefined) {
                        i.onImageLoaded(symbolObjTmp, function(img) {
                            symbolObjTmp = img;
                            ret = __adjust();
                            resultCb && resultCb(ret);
                        });
                        return undefined; //如果直接返回的不是true/false，而是undefined,那么最终结果得异步通过retCallback返回！
                    } else {
                        symbolObjTmp = objtmp;
                    }
                    // }
                }
                ret = __adjust();
                resultCb && resultCb(ret);
                return ret;
            },
            /*渲染元素中允许暴露的字符串属性设置空字符串/清空，避免一清空就被自动设置为属性的默认值导致难以设置空值！加上这句调用就支持了！
            注意，这句一定要与渲染元素中根据data.ca()获取值通过api给控件赋值这句放在一起！比如：
            cache.label.setText(data.ca('labelText'));
            i.allowEmpty(data, 'labelText);
            或者更简单，一句代码即可：
            i.allowEmpty(data, "labelText", value => cache.label.setText(value));
            如果要联动gap，则可以这样：
            i.allowEmpty(data, "labelText", value => {
                cache.label.setText(value);
                data.ca('gap', value == '' ? 0 : 15); //联动间隙
            });
            */
            allowEmpty: function(data, attr, callback = null) {
                if (data._i_defaultValueInited == undefined) { //初始第一次拖入图元到图纸，就显性设置为默认的值
                    data._i_defaultValueInited = true;
                    data.ca(attr, data.ca(attr));
                } else if (i.attrValue(data, attr) == undefined) data.ca(attr, ''); //随后只要清空值，那就真的清空了！
                (i.isControlTyped(data,'title') || data.ca('labelEmbeded')) && !data.s('label') && callback && callback(data.ca(attr));
            },
            //根据图元获取其所有做了form属性绑定的key-value形成的单层json对象表单
            getFormDatas: function(data) {
                if (data._i_cachedFormDatas && !i.isObjEmpty(data._i_cachedFormDatas) && i.hasCompleteLoaded(data)) { //240208，加载完成才能用缓存
                    return data._i_cachedFormDatas;
                }

                if (data == null) return null;
                let formDatas = {};
                i.getAttrsFormBinded(data).forEach(attr => {
                    let attrName = attr.slice(2),
                        attrType = attr.slice(0, 1);
                    let valtmp = i.getValue(data, attrName, attrType);
                    if (typeof(valtmp) == 'function') return;
                    //230925，对于图元或window对象的属性，直接从表单中移除！！
                    if (i.hasLoopCycle(valtmp, true)) {
                        let infotmp = 'WARN: node or window object will be auto removed from form datas!';
                        attr.slice(-8) == 'userData' ? console.warn(infotmp, 'KEY:', attr, '|', 'VALUE:', valtmp) : console.warn(infotmp, 'KEY:', attr, '|', 'VALUE:', valtmp);
                        return;
                    }
                    formDatas[attr] = valtmp;
                });

                //231028，缓存
                // if (data._i_cachedFormDatas === undefined) data._i_cachedFormDatas = {};
                data._i_cachedFormDatas = formDatas;

                return formDatas;
            },
            //240219，修改formType为formTypes，支持传入数组或数字，这样可以同时获取form/formValue，而不是每次获取一种类型或所有类型（-1）
            attrsFormBinded: function(data, formTypes = [-1], returnWithFormType = false) { //240215, add returnWithFormType
                //240219，兼容传入数组和数字
                if (!isArrayFn(formTypes)) formTypes = [formTypes];

                // 240209， 去掉旧的实现
                let dbtmp = data.getDataBindings();
                let resulttmp = [];
                for (let attrType in dbtmp) {
                    //在特定类型下，遍历图元带了数据绑定的属性
                    for (let attrKey in dbtmp[attrType]) {
                        //这些属性中只处理绑定了'iotos.form'变量的
                        let idtmp = dbtmp[attrType][attrKey]['id'],
                            typetmp = i.isFormVarBind(idtmp);
                        //240219，类型数组匹配！
                        if (formTypes.indexOf(-1) !== -1 || formTypes.indexOf(typetmp) !== -1) { //230227
                            let attrtmp = attrType + ':' + attrKey;
                            let desctmp = i.getNewTransNote(data, attrKey, 'description');
                            if(i.getNewTransNote(data, attrKey, 'extraInfo') == '~') continue;
                            resulttmp.push(returnWithFormType ? { //240215，传入returnWithFormType为true时，返回的通过固定字段带有属性keyURL和属性绑定类型！默认值返回属性keyURL
                                formType: idtmp,
                                attrKey: attrtmp,
                                //240609，加上定义中的属性名称对应的翻译，以及描述，用来给到属性连线和继承面板
                                attrName: runningMode() ? undefined : i.getAttrNote(data, attrType + ':' + attrKey), //240614，代替此前的，这样对于初始 i.trans(attrKey),
                                desc: runningMode() ? undefined : desctmp
                            } : attrtmp);
                        }
                    }
                }
                return resulttmp;
            },
            //获取图元的所有form绑定，注意，返回的每个元素是带有a/p/s:前缀的属性字符串！
            getAttrsFormBinded: function(data, formType = -1, returnWithFormType = false) { //-1:全部，1:form，2:formReset，3:formValue四个选项！230227
                return i.attrsFormBinded(data, formType, returnWithFormType);
            },
            //240301，发现此前没有专门一个方法，来判断属性绑定类型的，用全量获取再去indexOf就太傻大黑粗了！于是增加上！注意，返回的是绑定类型的数字形式！
            getAttrFormBindType: function(data, attr, retStringType = false) {
                let strType = [undefined, 'iotos.form', 'iotos.formReset', 'iotos.formValue'];
                let numtmp = i.isFormVarBind(i.getDisplayBindingItem(data, attr).id);
                return retStringType ? strType.indexOf(numtmp) : numtmp;
            },
            //设置图元指定一个或多个属性为form绑定。调用示例：i.setAttrsFormBinded(data, ['show']);
            //230220，默认是form绑定，符合当前图纸打开的编辑模式下所见即所得；如果主要是编辑内嵌，上层只是作为运行容器不去编辑，则手动修改成formReset绑定即可！
            setAttrsFormBinded: function(data, attrs, type = 'a', formType = 'form') { //form、formReset、formValue
                //231023，清理缓存，因为这里有新增，就让缓存更新重新计算！
                data._i_cachedFormBinded = undefined;

                if (typeof(attrs) == 'string') attrs = [attrs]; //兼容支持传入属性字符串数组，以及单个字符串
                if(attrs.indexOf('userData') == -1) attrs = ['userData',...attrs];  //240804，所有的userData属性默认form绑定，而且放到第一项
                let displayBindings = data.getDataBindings();
                if (displayBindings == undefined) {
                    displayBindings = {};
                    displayBindings[type] = {};
                    //需要回写，因为重新赋值后引用就重新指向了！！
                    data.setDataBindings(displayBindings);
                } else if (displayBindings[type] == undefined) { //初始的数据绑定可能是s或p类型，所以还要进一步判断a类型是否存在！不存在就初始化下，否则后面直接用会报错！
                    displayBindings[type] = {}
                }
                //241027，可能存在多次反复调用本函数，比如容器组件渲染元素初始调用，以及加载内嵌页面，自动继承属性时调用，当前都是合并处理的，因此这里的也要合并处理！否则会导致编辑时无法清理绑定，试图不想对更上层自动继承！
                data._i_autoFormBinds = data._i_autoFormBinds ? _i.mergeArrays([data._i_autoFormBinds, attrs],true) : attrs; //231208，记录下
                attrs.forEach(function(attr) {
                    attr = i.np(attr);
                    let bindedtmp = displayBindings[type][attr];
                    //231208，支持了对自动暴露绑定的取消
                    if (!bindedtmp) console.warn('WARN:', 'attr', attr, `has not been bound before. According to previous logic, it would be ignored, but in fact, it is supposed to be bound.`);
                    if (i.isObjEmpty(bindedtmp) && bindedtmp != '__noAutoBind__' && (i.getDataBindingItem(data, attr) || i.getDataBindingItem(i.getImage(data.ca('symbol')), attr))) { //避免加载反序列化时把此前已有做过的过滤函数逻辑覆盖掉！
                        let predixtmp = 'iotos.';
                        displayBindings[type][attr] = {
                            id: formType.slice(0, 6) == predixtmp ? formType : (predixtmp + formType),
                            idinfo: '',
                            isTplBinded: false,
                            func: "function formParser(rawData, node) {\r\n    try {\r\n        /********* TODO **********/\r\n\r\n\r\n        /************************/\r\n        return rawData;\r\n    } catch (err) {\r\n        return rawData;\r\n    }\r\n}",
                        };
                    }
                });
            },
            //图标symbol image json的数据绑定变量定义，根据变量名称获取对象
            //tips 230817，这里是传入iamge json对象，那么像i.getDisplayBindingItem()的，对应为i.getAttrItem()
            getDataBindingItem: function(symbolJson, attrName, data = null, involveCommonCached = true) { //240224，增加图元参数！因为要用到键值对_i_symbolDatabindings，可以省去循环遍历！
                //240224，兼容传入图元对象data的情况！
                if (i.isHtNodeData(symbolJson)) {
                    data = symbolJson; //240224，如果传入ht图元对象，那么第三个参数也自动被当做第一个参数的data图元
                    symbolJson = data.getImage && data.getImage(); //240224，可能是对象，也可能是字符串！
                    if (!symbolJson) return undefined; //240623，比如edge，没有iamge的！！
                }
                if (typeof(symbolJson) == 'string') {
                    symbolJson = i.getImage(symbolJson);
                }

                //240324，存在内嵌矩形、文字等组件，被loadDisplay加载时，尤其对于矩形，其image是null的！但是也要进入遍历处理，否则属性比如背景色无法继承上去！但是判断到这里，就要return，否则null继续下面执行会有问题吧！
                if (!symbolJson) return undefined;
                attrName = i.np(attrName); //240224
                if (!symbolJson) { //230920，
                    console.warn('input symbolObj is undefined!!', attrName);
                    return;
                }

                if (symbolJson.dataBindings == undefined) {
                    symbolJson.dataBindings = [];
                }
                let objectItem = undefined; //240224，默认返回undefined，之前是null，那么会导致返回判断=== undefined·失败！

                //240224，省去循环遍历操作！缓存基础属性，结合keyURL用data.innerDataBindings
                if (data && involveCommonCached) {
                    if (i.isKeyURL(attrName)) {
                        if (data.innerDataBindings && data.innerDataBindings[attrName] !== undefined) return data.innerDataBindings[attrName];
                    } else if (data._i_symbolAttrsDefault) {
                        if (data._i_symbolAttrsDefault[attrName] !== undefined) return data._i_symbolAttrsDefault[attrName];
                    }
                }

                //240208.2，还是恢复到上面的逻辑，实测发现下面用_.find竟然比上面forEach耗时更大！！！！
                //240131，用i.forEach代替symbolJson.dataBindings.forEach，试图提高性能！
                i.forEach(symbolJson.dataBindings, (dbItem, dbIndex) => {
                    //240224，所有渲染元素图元，都缓存自身的基础属性！注意，渲染元素继承属性通过data.innerDatabindings来缓存！
                    if (data && !i.isKeyURL(dbItem.attr)) {
                        if (!data._i_symbolAttrsDefault) data._i_symbolAttrsDefault = {};
                        data._i_symbolAttrsDefault[dbItem.attr] = dbItem;
                    }

                    if (objectItem) return;
                    if (dbItem.attr == attrName) {
                        objectItem = dbItem;
                    }
                });
                return objectItem;
            },
            //230220,获取图元在图纸中属性绑定的变量，返回比如"iotos.form"、"iotos.formValue"等        
            getDisplayBindingName: function(data, attr) {
                let bdItem = i.getDisplayBindingItem(data, attr);
                return bdItem && isObject(bdItem) ? bdItem['id'] : undefined;
            },
            /*230227,获取图元在图纸中属性绑定的对象，比如：
            {
                "id": "iotos.form",
                "idinfo": "",
                "isTplBinded": false,
                "func": "function formParser(rawData) {\r\n    try {\r\n  
            }
            注意，如果要删除，delete这个对象引用是不起效果的，只是对引用变量删除了成了undefined，但是原被引用的对象不会被删除！需要操作一级级下来的对象delete才行*/
            getDisplayBindingItem: function(data, attr) { //带前缀的属性名称
                if (!data) return undefined; //240218，如果通过i.innerData()获取到的内嵌图元，keyURL不存在，比如tab页签第二段索引格式变化，那么传入data就是undefined了！！
                try {
                    let attrFull = i.autoPrefixed(attr, data),
                        bindingstmp = data.getDataBindings(),
                        typeBindings = bindingstmp ? bindingstmp[attrFull.slice(0, 1)] : null;
                    if (typeBindings) {
                        let attrBindings = typeBindings[attrFull.slice(2)];
                        return attrBindings;
                    } else return undefined;
                } catch (error) {
                    console.error(error);
                    return undefined;
                }
            },
            //230219，获取图元在渲染元素iamge中的dataBindings对象，传入图元对象即可，注意，暂不支持异步加载的情况！默认已加载完的编辑器状态用
            getAttrItems: function(data, recvObject = null) { //tips 230806，注意，要传入接收的对象recvObject，不能是null，得是{}这种！因为isObject()对null过不了！
                let imgtmp = data.getImage();
                if (imgtmp == undefined) {
                    console.warn('data has not image??', data);
                    return null;
                }
                //230228，i.getImage()代替ht.Default.getImage()，这样就不会触发多余的网络请求，对i.onImageLoaded造成干扰！当然，如果资源本地已有，那么用谁效果都一样！
                if (typeof(imgtmp) == 'string') imgtmp = i.getImage(imgtmp); //当做字符串就是url
                if (imgtmp == undefined || typeof(imgtmp) != 'object') {
                    console.warn('has not get image source by url:', data.getImage(), data);
                    return null;
                }
                if (isObject(recvObject)) recvObject.image = imgtmp; //通过引用也返回下
                return imgtmp.dataBindings;
            },
            //230219，获取a属性下的默认配置
            getAttrItem: function(data, attr) {
                let recvObject = {};
                i.getAttrItems(data, recvObject)
                if (!recvObject.image) return undefined;
                //240224，传入新增的图元对象参数，可以利用_i_symbolDatabindings避免重复循环遍历！//tips 240224.2，用data.innerDatabingdings，弃用_i_symbolDatabindings
                let dbItem = i.getDataBindingItem(recvObject.image, attr, data);
                return dbItem;
            },
            //图标symbol image json的数据绑定变量定义，根据变量名称获取对象
            getBindedAttrValueType: function(data, attrName) {
                if(!attrName || attrName.trim() == '') return null;
                if (data == undefined || attrName == undefined) {
                    console.warn('WARNING: node object or attr name is null!', data, attrName);
                    return;
                }
                let imgtmp = data.getImage();
                if (imgtmp == undefined) {
                    console.warn('data has not image??', data, attrName);
                    return null;
                }

                //240727，缓存一下！加快速度。
                if(!data._i_cachedAttrValueType) data._i_cachedAttrValueType = {};
                if(data._i_cachedAttrValueType[attrName]) return data._i_cachedAttrValueType[attrName];

                //230228，i.getImage()代替ht.Default.getImage()，这样就不会触发多余的网络请求，对i.onImageLoaded造成干扰！当然，如果资源本地已有，那么用谁效果都一样！
                if (typeof(imgtmp) == 'string') imgtmp = i.getImage(imgtmp); //当做字符串就是url
                if (imgtmp == undefined || typeof(imgtmp) != 'object') {
                    console.warn('has not get image source by url:', data.getImage(), data, attrName);
                    return null;
                }
                //240224，传入新增的图元对象参数，可以利用_i_symbolDatabindings避免重复循环遍历！//tips 240224.2，用data.innerDatabingdings，弃用_i_symbolDatabindings
                let dbItem = i.getDataBindingItem(imgtmp, attrName, data),
                    typetmp = dbItem ? dbItem.valueType : null;

                data._i_cachedAttrValueType[attrName] = typetmp;
                return typetmp;
            },
            //230219，重命名，简称，只支持a属性
            getAttrType: function(data, attr) {
                return i.getBindedAttrValueType(data, attr);
            },
            /*
                attr: item.attr,
                valueType: item.valueType,
                defaultValue: item.defaultValue,
                extraInfo: item.extraInfo, //函数原型描述
                dynamicCreate: true //230415，动态创建属性的标记，这样就不会因为image原文件没有序列号保存属性定义而被上层嵌套加载反序列化时避免被清理掉！
            */
            //tips 230823，通常在调用i.insertTempAttrs()之前，需要调用i.clearTempAttrs(data)清理先。
            //240206，新增参数autoFormBinded，不是所有的都默认form绑定，尤其是所有组件的公共该属性，避免嵌套后属性表单庞大吓人！
            insertTempAttrs: function(data, attrsInfo, placeAfter = null, groupInfo = null, autoFormBinded = true) {
                let imgtmp = data.getImage(),
                    urlbak = data.ca('symbol') ? data.ca('symbol') : imgtmp;
                if (typeof imgtmp == 'string') {
                    data.ca('symbol', imgtmp); //需要有默认的symbol属性，手动创建一个即可！无需修改代码
                    data.setImage(i.clone(ht.Default.getImage(imgtmp)));
                    if (!i.hasAttrInLocalObj(data, 'symbol')) { //240709，没有的就自动加上！比如常规Node。主要用于拓扑连线到shape，做轨迹用途！
                        attrsInfo.push({
                            "attr": "symbol",
                            "valueType": "Image"
                        });
                        data.ca('hasNoSymbolOrigin', true); //240710，加上标记，让加载时能够识别到，进行data.dm().md监听，否则自动有i.md的监听，不要重复来了！
                        data.dm().md(e => {
                            if (e.data === data) {
                                switch (e.property) {
                                    case 'a:trackPathPercent':
                                        i.setTrackPercentAsHost(data, e.newValue);
                                        break;
                                }
                            }
                        });
                    }
                    imgtmp = data.getImage();
                }
                //240222，发现有出现过这种imgtmp为null的情况！
                if (!imgtmp) {
                    console.assert(0);
                    return;
                }

                if (imgtmp.dataBindings == undefined) imgtmp.dataBindings = [{
                    attr: 'symbol',
                    valueType: 'String',
                    defaultValue: urlbak,
                    extraInfo: undefined, //函数原型描述
                    /*230415，为动态创建的属性做好标记，区别于提前在编辑状态下手动对图标image做dataBindings的预制操作！
                    在loadDisplay中清理内嵌图元不存在的属性暴露中，避免被误清除！*/
                    dynamicCreate: true
                }];
                //过滤非法输入
                if (!isObject(imgtmp) || !isObject(attrsInfo)) {
                    console.error('node image value only support object type,but given', typeof imgtmp, imgtmp, attrsInfo);
                    return;
                }
                if (!isObject(attrsInfo)) {
                    console.error('attrsInfo type should be no-null object or array,but given', typeof attrsInfo, attrsInfo);
                    return;
                }
                //插入新的属性
                if (!isArrayFn(attrsInfo)) attrsInfo = [attrsInfo]; //兼容传入对象或者数组
                let indexInsert = imgtmp.dataBindings.length;
                if (placeAfter) indexInsert = i.arrFindIndex(imgtmp.dataBindings, 'attr', placeAfter);
                if (indexInsert == -1) indexInsert = imgtmp.dataBindings.length;
                let attrNames = [],
                    allDynamicAttrsTmp = []; //230713，用于返回所有动态创建的属性列表
                attrsInfo.forEach(function(item, index) {
                    //240609，动态创建的属性，默认也会让名称和属性一样，这样方便统一在zh.js中做多语言翻译！
                    if (item.name == undefined) item.name = item.attr;

                    /*230415，为动态创建的属性做好标记，区别于提前在编辑状态下手动对图标image做dataBindings的预制操作！
                    在loadDisplay中清理内嵌图元不存在的属性暴露中，避免被误清除！*/
                    item.dynamicCreate = true;
                    let indexFound = i.arrFindIndex(imgtmp.dataBindings, 'attr', item.attr);
                    if (indexFound != -1) { //230415，如果发现存在，那么替换值，避免如果存在已有的，没法更新！
                        imgtmp.dataBindings[indexFound] = item;
                    } else {
                        imgtmp.dataBindings.splice(indexInsert + index + 1, 0, item);
                        //240731，属性定义新增属性bindIgnored，此时动态新增的属性，有设置这个属性true时，就不会自动绑定，避免连线下拉太多属性！
                        item.bindIgnored !== true && attrNames.push(item.attr);
                    }
                    //230713，用于返回所有动态创建的属性列表
                    allDynamicAttrsTmp.push(item.attr);
                });
                autoFormBinded && i.setAttrsFormBinded(data, attrNames); //230226，自动创建的属性，默认做form绑定！
                /*240225，尝试去掉oldDynamicAttrs数组在attrObject的序列化保存，因为初始加载时，将涉及到动态切换新增属性的操作，依赖的某个属性变化，将该属性作为初始执行即可！
                这样就能从原始的iamge url对应的默认基础属性在加载时动态还原追加上当下需要动态创建的属性了，而且都是有dynamicCreate标记的，这样再切换属性前调用i.clearTempAttrs
                也能精准清理，不至于跟原始基础属性混一起无法区分识别！！*/
                attrsInfo.forEach(item => {
                    //240225，动态属性新增也要同步更新！
                    if (!data._i_symbolAttrsDefault) data._i_symbolAttrsDefault = {};
                    data._i_symbolAttrsDefault[item.attr] = item;
                });
                i.isEditing(data) && i.iv(data, true);
                return allDynamicAttrsTmp; //230713，将新增的属性集合返回
            },
            //240213，上层容器图元对内嵌属性手动做继承操作，其中attr为暴露继承到上层后应该的属性keyURL，而不是内嵌的属性。通常就给属性继承弹窗确定用，对于有新增属性勾选的情况！
            inheritAttrsFromInner: function(data, attr, formTypeStr = 'auto') { //iotos.form/formReset/formValue
                let curSymbolObj = i.getImage(data),
                    innerData = i.innerData(data, attr),
                    innerAttr = i.innerKeyURL(attr),
                    attrKey = i.np(innerAttr),
                    innerDataValue = i.getValue(innerData, innerAttr),
                    dbItem = i.getDataBindingItem(i.getImage(innerData), i.np(innerAttr), innerData), //240224，传入新增的图元对象参数，可以利用_i_symbolDatabindings避免重复循环遍历！
                    initialValue = innerDataValue != undefined ? innerDataValue : dbItem ? dbItem.defaultValue : null, //230619，默认值以配置的为准
                    attrToUpper = i.np(attr); //240213，注意这里不能带a:xxx前缀a:，否则会导致i.setAttrsFormBinded()失败！而且点击属性弹窗配置，发现keyURL也是a:前缀开头了，而正常是没有的！
                //230418，注意，参数attrKey前面加上attrType + ':'，否则可能因为s:label等类型的绑定过来，被当成a:label就报错了！
                let innerBindItem = i.getDisplayBindingItem(innerData, innerAttr); //231220，后面都要用到。
                if (!innerBindItem) {
                    console.error('WARN: manually inherit attr form inner error as inner dataBindings not found!', innerAttr, innerAttr); //240224，增加提示，避免属性继承面板点击确定后发现暴露不了！
                    return; //240218，存在keyURL不存在，尤其是tab页签旧的配置subIndex兼容问题时。
                }
                let innerBindType = i.isFormVarBind(innerBindItem && innerBindItem.id), //内嵌图元当前属性的变量绑定类型。attrKey为内嵌图元innerData在其当前层的属性名称/keyURL
                    bindTypeTmp = innerBindType === 3 ? 3 : 2;
                console.assert(innerBindType > 0);
                if (!runningMode()) hteditor.strings[attrToUpper] = i.charMultied(i.layersOfKeyURL(attr), '.') + _i.getAttrNote(_i.bottomData(data, attr), _i.np(_i.bottomKeyURL(attr))); //attrToUpper.split('>').slice(1).join('>'); //attrToUpper.split('>').reverse().join('>');

                //8）首先根据内嵌图纸中的数据绑定，因为变量暴露的类型信息只有在symbols的json中有，所以由类型初步判断，形成初始的数据绑定结构用来给到上层渲染元素图标
                let bindingInfoTmp = {
                    attr: attrToUpper, //tips 240212，注意，不能放到这里用hteditor.getString(attrToUpper)，这里就是改实际数据结构了！下面name属性才只是显示，不影响数据！
                    name: runningMode() ? attrToUpper : hteditor.getString(attrToUpper), //240212，继承的属性，也用显示别名（只显示属性本身），跟实际的keyURL相互独立！！
                    valueType: dbItem == undefined ? (function() {
                        switch (typeof(innerDataValue)) {
                            case 'string':
                                //逐层暴露时，不同类型，配置属性框类型保持一致！
                                if (i.isColorStr(innerDataValue)) return 'Color';
                                else if (attrKey.slice(-5) == '.font') return 'Font';
                                else if (attrKey.slice(-14) == 'clip.direction') return 'ClipDirection';
                                else return 'String';
                            case 'number':
                                return 'Number';
                            case 'boolean':
                                return 'Boolean';
                            case 'function': //注意，可能是字符串还需要识别转化！
                                return 'Function';
                            case 'object': //注意，还需要识别转化，StringArray、NumberArray、ObjectArray等
                                return isArrayFn(innerDataValue) ? 'ObjectArray' : 'Object'
                            default:
                                console.warn('unrecogniced type:', typeof(innerDataValue), innerDataValue, attrKey, innerData);
                                return 'String';
                        }
                    })() : dbItem.valueType,
                    defaultValue: initialValue, //默认采用下层配置的值
                    extraInfo: dbItem ? dbItem.extraInfo : null,
                    description: dbItem && dbItem.description, //231028，继承的属性，描述也要继承过去！
                    group: innerData._tagToUpper // + (dbItem && dbItem.group ? '>' + dbItem.group : '') 好像没必要加
                };

                //230619，随后属性定义的默认值结合下层属性是否为form绑定，决定采用下层属性定义的还是下层属性配置的值
                if (innerBindType != 1) bindingInfoTmp.defaultValue = dbItem ? dbItem.defaultValue : undefined;
                data.innerDataBindings[bindingInfoTmp.attr] = bindingInfoTmp;
                if (bindingInfoTmp.valueType == 'Function') {
                    bindingInfoTmp.defaultValue = undefined;
                }

                //20）开始准备回写上层图纸当前图元的图片/图标image
                if (curSymbolObj.dataBindings == undefined) {
                    curSymbolObj.dataBindings = [];
                }
                let symbolDataBinding = curSymbolObj.dataBindings;
                let keystmp = i.arrKeyValues(symbolDataBinding, 'group'); //获取数组中指定字段的值列表，索引保持跟数组对应
                let lastIndex = keystmp.length - 1,
                    targetIndex = lastIndex;
                for (let idx = lastIndex; idx >= 0; idx--) { //反过来查找最近一次出现跟当前要追加暴露的属性group相同的项的索引
                    if (keystmp[idx] === innerData._tagToUpper) {
                        targetIndex = idx;
                        break;
                    }
                };
                if (targetIndex === null || targetIndex === lastIndex) symbolDataBinding.push(bindingInfoTmp); //末尾则追加
                else i.arrInsert(symbolDataBinding, targetIndex + 1, bindingInfoTmp); //非末尾则插入，且是在找到的组后面一个位置插入！  

                //240213，form绑定
                let formTypeStrings = ['', 'form', 'formReset', 'formValue'];
                i.setAttrsFormBinded(data, _i.np(attr), 'a', formTypeStrings[bindTypeTmp]);
            },
            //240214，需要自动继承的情况，为内嵌基的有form绑定属性，或者是formValue绑定的继承过来的属性
            isAttrAutoInheritNeeded: function(data, attr, formType = null, upperData = null, upperAttr = null) {
                let innerData = data,
                    attrKey = attr,
                    result = false;

                //240224，对于非编辑界面的i.openDialog动态弹窗，需要无条件向上继承到顶层，因为i.attr()根据keyURL片段获取属性完整keyURL再去从对话框data.ca()获取到属性值！
                let toptmp = i.topData(data);
                if (toptmp && toptmp._i_isEditConfigDlg) return true;

                let dbtmp = innerData.getDataBindings(),
                    dbObj = dbtmp.a && dbtmp.a[i.np(attr)];
                if (dbObj) {
                    if (formType === null) formType = i.isFormVarBind(dbObj.id);
                    if (dbObj.group == '弹窗框 *') return false;
                }
                if (!upperData) upperData = i.upperData(data);
                if (!upperAttr) upperAttr = i.upperKeyURL(data, attr);
                if (upperData && upperData !== i.topData(data)) {
                    if (upperData._i_isDisplayInheritUpperFormUsed) {
                        return true;
                    } else {
                        //240228，从模板容器组件所在层开始，逐层往上，都加上_i_innerModeContainerLined属性，并且把指定属性追加到值数组，当前图元的tagToUpp为key
                        function __updateToUpper() {
                            if (!upperData._i_innerModeContainerLined) {
                                upperData._i_innerModeContainerLined = {};
                            }
                            if (!upperData._i_innerModeContainerLined[data._tagToUpper]) {
                                upperData._i_innerModeContainerLined[data._tagToUpper] = [];
                            }
                            if (upperData._i_innerModeContainerLined[data._tagToUpper].indexOf(attrKey) == -1) {
                                upperData._i_innerModeContainerLined[data._tagToUpper].push(i.np(upperAttr));
                            }
                        }
                        //240228，2）如果当前就是内嵌模板容器组件本身，那么所有form属性的不论是基础的还是继承过来的，一律对上继承，同时对上层图元的标记_i_innerModeContainerLined作更新！
                        if (data._i_isDisplayInheritUpperFormUsed) {
                            __updateToUpper();
                            return true;
                            //240228，3）对于更上层，那么自动继承的只会是keyURL了，就要根据当前图元和当前传入keyURL属性，获取下层图元对象，并根据其_i_innerModeContainerLined属性拿到内容
                        } else if (i.isKeyURL(attrKey)) { //240228，对于内嵌模板容器的上层才判断keyURL，模板容器本身，除了内嵌继承的，自身的form绑定属性也要继承上去！否则display属性咋办？？
                            let innerData = i.innerData(data, attrKey),
                                innerModeContainerLined = data._i_innerModeContainerLined,
                                //240228.，3-1）如果内嵌图元的_i_innerModeContainerLined对象中，获取到内嵌tagToUpper对应的数组，发现当前属性如果在那个数组中，那么自动继承！且同样对更上层更新标记！
                                innerLinedContainerAttrs = innerData && innerModeContainerLined && innerModeContainerLined[innerData._tagToUpper],
                                isAttrFromLinedContainer = innerLinedContainerAttrs && innerLinedContainerAttrs.indexOf(i.np(attrKey)) !== -1;
                            if (isAttrFromLinedContainer) {
                                __updateToUpper();
                                return true;
                            }
                        }
                    }
                }


                //240218，如果上层有对应当前属性的连线操作或者反向关联，那么久无条件继承过去！强制继承！
                if (!upperData._i_attrsLined) upperData._i_attrsLined = i.getAttrsLinedTo(upperData, true, true);
                if (upperData._i_attrsLined.indexOf(upperAttr) !== -1) {
                    console.warn(`WARN: attr ${attrKey} in ${innerData.getDisplayName()} has been lined and will be forced to inheritted!` + i.commonTip(innerData, attrKey));
                    result = true;
                }
                //240218，如果上层没有连线用到他
                if (!result) {
                    let dataBindingsExist = upperData._i_rawDataBindingsInherit && upperData._i_rawDataBindingsInherit.length > 0;
                    if (!dataBindingsExist) {
                        if ((_i.isEditing(upperData) || _i.topData(upperData)._i_isEditConfigDlg)) {
                            result = formType == 3 || (formType > 0 && !i.isKeyURL(attrKey));
                        }
                    } else { //240219，如果上层有对内嵌继承过去的属性做绑定并且有form/formValue绑定，那么自动继承！
                        let curAttrUpperBind = upperData.getDataBindings().a[i.np(upperAttr)];
                        if (
                            curAttrUpperBind !== undefined ||
                            (i.isEditing(upperData) || i.topData(upperData)._i_isEditConfigDlg)
                        ) result = true;
                    }
                }
                return result;
            },
            //对应insertTempAttr，用于清空。*/
            clearTempAttrs: function(data, attr = null, event = null, keepAttrValue = false) {
                if (event && event.oldValue == '__init__') return;
                if (isArrayFn(attr)) { //230821，加上支持attr为attrs，即数组格式，同时清理多个属性定义。
                    attr.forEach(item => i.clearTempAttrs(data, item));
                } else {
                    //230219，切换函数时，先恢复默认属性设置项，删除临时动态新插入的属性
                    let imgtmp = data.getImage(),
                        dbtmp = data.getDataBindings(),
                        toBeDeleteIndexs = []; //230823，待删除的在循环里记录下来然后单独删除，否则遍历会出BUG，会跳间隔！！
                    //240225，清理attrObject、data.dataBindings、image.dataBindings
                    function __clear(attr) {
                        if (!keepAttrValue) {
                            if (dbtmp && dbtmp.a && dbtmp.a[attr]) { //清理图纸中的绑定记录，让连线操作看到的是最新的列表
                                delete dbtmp.a[attr]; //清理属性定义
                            }
                            delete data.getAttrObject()[attr]; //清理初始赋值
                        }

                        //240225，动态属性删除也要清理缓存对应的！避免i.getDataBindingsItem(data,attr)返回错误！
                        if (data._i_symbolAttrsDefault) delete data._i_symbolAttrsDefault[attr];
                        if (data.innerDataBindings) delete data.innerDataBindings[attr]; //240225，这句应该没啥用，应为这里存放的是继承过来的keyURL
                    }
                    if (isObject(imgtmp)) {
                        let indexsTobeRemoved = [];
                        i.forEach(imgtmp.dataBindings, (item, idx) => {
                            if (attr == null) {
                                if (item.dynamicCreate) {
                                    indexsTobeRemoved.push(idx);
                                    __clear(item.attr);
                                }
                            } else if (item.attr === attr) {
                                indexsTobeRemoved.push(idx);
                                __clear(attr);
                            }
                        });
                        imgtmp.dataBindings = arrayIndexItemsRemoved(imgtmp.dataBindings, indexsTobeRemoved);
                    }
                }
            },
            //全局回调函数，修改成不覆盖且支持上下文时序回调的版本！
            onImageLoaded: function(url, callback, imgCloned = false, node = null) {
                if(i.getImage(url) === null) {
                    callback(null);
                    return;
                }
                
                let func = ht.Default.handleImageLoaded,
                    funcNotFound = ht.Default.handleUnfoundImage; //231201，存在资源请求不存在的情况，此时也重写，并回调传入undefined
                if (!i.window()._i_handleImageLoaded) i.window()._i_handleImageLoaded = func;
                if (!i.window()._i_handleUnfoundImage) i.window()._i_handleUnfoundImage = funcNotFound; //240111，发现这里对应的也要加上处理！
                ht.Default.handleImageLoaded = function(name, img) {
                    func && func(name, img);
                    if (name == url) {
                        callback(!imgCloned ? img : i.clone(img),node);
                    }
                };
                //231201，存在资源请求不存在的情况，此时也重写，并回调传入undefined
                ht.Default.handleUnfoundImage = function(name, img) {
                    funcNotFound && funcNotFound(name, img);
                    if (name == url) {
                        console.error('ERROR: url not found!', url);
                        callback(undefined);
                    }
                }
            },
            /*230409，图元对象图片加载完毕时回调*/
            onDataLoaded: function(data, callback) {
                if (data.getImage == undefined) {
                    callback && callback(undefined);
                    return;
                }
                let imgtmp = data.getImage();
                if (typeof imgtmp == 'object') {
                    callback && callback(imgtmp);
                } else if (typeof imgtmp == 'string' && ht.Default.getImage(imgtmp) != undefined) {
                    let imgobj = ht.Default.getImage(imgtmp);
                    console.assert(typeof imgobj == 'object');
                    callback && callback(imgobj);
                } else {
                    console.assert(typeof imgtmp == 'string');
                    i.onImageLoaded(imgtmp, imgobj => {
                        callback && callback(imgobj);
                    });
                }
            },
            //230213，增加强制更新fpForce，对于值未变化的，也强行触发，以执行渲染元素逻辑！暂未用，也未测！
            innerNotifyUpper: function(data, attr, value, fpForce = false) { //attr为带类型前缀的，比如'a:value'
                if (!runningMode() && attr.slice && attr.slice(-7) == 'display' && value && value.slice(0, 2) == './' && value.slice(-5) == '.json') {
                    let uppertmp = i.upperData(data);
                    if (!!uppertmp) value = i.getRelativePath(uppertmp.dm()._url, i.toAbsDisplayURL(data, value));
                }
                if (data.notifyUpper) {
                    if (data.notifyUpper[attr]) {
                        if (attr.split(':').length < 2) attr = i.autoPrefixed(attr, data); //240110，默认a:改成方法调用！ //'a:' + attr; //兼容不传入a:等前缀的，会自动默认带上
                        let typetmp = attr.split(':')[0]; //230808，默认是a属性，但是对于rect等对于s:shape.backgroud这种，逐层向上同步，就是s类型了！
                        if (i.isAttrFormBinded(data, attr)) {
                            data.notifyUpper[attr](value, fpForce);
                        } else {
                        }
                    } else {
                        console.info('inner notify upper abort!!', attr, ':', value, 'data.notifiUpper→', attr, 'is undefined', data.notifyUpper);
                    }
                } else {
                    if (!!i.upperData(data) && !data.ca('_forbidInherit') && i.loadedState(i.topData(data)) === 1) {
                        if (i.upperData(data).getDataBindings().a[i.np(i.upperKeyURL(data, attr))] !== undefined) {
                            //240224，在用了isAttrAutoInhert变量并不默认全量初始化md中的notifyUpper后，这里赋值也不会在逐层到顶层了，这里是判断当data.notifyUpper不存在时，那么当前属性在上层肯定没被继承！
                            console.error('inner notify upper abort!! ', attr, ':', value, 'data.notifiUpper is undefined', data);
                        }
                    }
                }
            },
            //向上同步属性值
            innerCallback: function(data, gv, cache, callbackAttrString, value, extraInfo = null) {
                if (data == undefined) return;
                let cb = new Function('return ' + data.ca(callbackAttrString))() //data.ca('onChange')换成rootDataTmp结果一样！
                let rettmp = cb && cb(data, gv, cache, value, extraInfo); //rettmp一般都用不上
                let upperTmp = i.upperData(data);
                upperTmp && i.innerCallback(upperTmp, upperTmp._gv, upperTmp._cache, data._tagToUpper + '>a:' + callbackAttrString, value, extraInfo);
                return rettmp;
            },
            //240515，公共要有的初始化！
            innerRecoveredDataCache: function(data, cache, commonRefresh = false, name = null, displayName = null, extraFuncCallback = null) {
                if(data._i_containerImageGetting) return undefined;
                if (data && !data.dm()) {
                    data = null;
                    return undefined;
                }
                if(!data.s('2d.visible') && !(i.isControlTyped(data,'dlg') && data.ca('show'))) {
                    console.assert(0);
                    console.error("WARN!! abnormal occasion, but it won't cause a runtime exception");
                    return undefined;
                }else{
                    let uppertmp = i.upperData(data);
                    if(
                        uppertmp && !uppertmp.s('2d.visible') && 
                        !data._i_gv &&
                        !(i.isControlTyped(uppertmp,'dlg') && uppertmp.ca('show'))  //注意：运行时对话框初始都是这样，2d.visible不可见、show也为false。
                    ){
                        return undefined;
                    }
                }
                //240424，公共的刷新放到这里，比如下面对initShadow，注意，组件对象指定用：cache.obj
                if (commonRefresh) {
                    //通用阴影样式
                    cache.obj && initShadow(cache.obj, data.ca('shadowBorder'), data.ca('shadowColor'), data.ca('shadowEnabled'));
                }

                //240515，仅执行一次，用于初始化tag等
                if (!data._cache && data.getTag() === undefined) {
                    let ingorePasting = false;
                    try {
                        let nametmp = editor.cloneInfo.funcArray[0][2].name;
                        if (nametmp === name) ingorePasting = true;
                    } catch (e) {

                    }
                    displayName && data.setDisplayName(displayName); //注意，每个组件带上默认的displayName，避免autoTag()时异常
                    name && data.setName(name);
                    data.s('interactive', true); //240516，这里应该默认勾选交互模式吧！否则对于iconClick图片按钮这种，导致没法出发点击事件！
                    !ingorePasting && data.s('label.opacity', 0); //需要label文字不可见，否则因为setName设置后，即便s.label属性没设置，都会初始显示name！
                    _i.autoTag(data);
                    !ingorePasting && extraFuncCallback && extraFuncCallback();
                }
                if (runningMode() && !i.isControlTyped(data, 'grid') && !i.baseNode(data, false)) {
                    data.s('interactive', true);
                    data.s('2d.selectable', true);
                }
                if (!data._cache) {
                    !i.hasInner(data) && i.getImage(data.getImage()).dataBindings.forEach(dbItem => {
                        if (dbItem.name === undefined) dbItem.name = dbItem.attr;
                    });
                    //240408，加上条件|| i.isControlTyped(data, 'bus')，主要是要运行时也能有window._i_eventBusLayersInfo。这样同一个底层内嵌发送器对外发送，实际自身绝对地址是多少可以知道！
                    if ((!runningMode() || i.isControlTyped(data, 'bus'))) {
                        let topDataTmp = i.topData(data);
                        if (!topDataTmp._i_bottomSymbolLoadedIniting) topDataTmp._i_bottomSymbolLoadedIniting = [];
                        /*240224，顶层页面的基础图元（非容器），页面编辑加载时，也需要自动遍历数据绑定清理属性！因为被嵌套后，加载到内存中能够让上层容器的属性和绑定清理，以及
                        清理底层组件自身，但是难以保存序列化！因此刷新打开基础组件所在页面，就会做自动清理，然后保存即可！*/
                        if (data == topDataTmp) {
                            /*240225，注意要放到下一个时序去清理！比如api组件，有http和mqtt两种模式，初始拖入到页面，此时有i.insertTempAttrs动态加载或切换的属性，那么在渲染
                            元素的最开头去看一旦属性未定义就删除掉绑定和配置值，显然有问题！放到下一个时序，让渲染元素图元初始化完毕后再清理也好！*/
                            _i.setTimeout(() => {
                                _i.setTimeout(() => {
                                    let dbtmp = data.getDataBindings();
                                    if (dbtmp && dbtmp.a && !i.hasInner(data)) {
                                        for (let attr in dbtmp.a) {
                                            delete dbtmp.a[attr].vt; 
                                            if (!i.isKeyURL(attr) && i.getDataBindingItem(data, attr) == undefined && i.getDataBindingItem(i.getImage(typeof(data.getImage() == 'string') ? data.getImage() : data.ca('symbol')), attr)) {
                                                console.error(`WARN: attr 【${data.getTag()}】-【${attr}】 does not in symbol definition and will be removed now!`);
                                                delete dbtmp.a[attr];
                                                delete data.getAttrObject()[attr];
                                            }
                                            if (isObject(data.ca(i.np(attr))) && i.getAttrType(data, attr) == 'Function') {
                                                console.error(`object type value ${data.ca(i.np(attr))} could not be setted to function type attr!` + i.commonTip(data, attr));
                                                data.ca(i.np(attr), undefined);
                                            }
                                        }
                                    };
                                }, 0);
                            }, 0);
                        }
                        function __checkingAttrInheritedUsed() {
                            let attrsUsedWithoutInherited = [];
                            i.getAttrsInheritUsed(data).forEach(attr => {
                                if (data.getDataBindings().a[i.np(attr)] === undefined) {
                                    attrsUsedWithoutInherited.push(attr);
                                }
                            });
                            attrsUsedWithoutInherited.length && _i.alert(`属性未继承，但连线操作有用到！可能会自动继承，请尝试保存后再刷新加载：\n${attrsUsedWithoutInherited.join('\n')}` + i.commonTip(data), '错误', false, null, null, [480, 320]);
                            i.recordEventBusLinked(data);
                        }
                        topDataTmp !== data ? topDataTmp._i_bottomSymbolLoadedIniting.push(__checkingAttrInheritedUsed) : __checkingAttrInheritedUsed(); //240221，放到加载完毕后检查！
                        //tips 240221，容器组件记录下层属性继承的依赖
                        if (data.ca('display')) {
                            //240219，放到函数中给到顶层容器图元加载完毕后再执行！否则data._i_innerDatas没有，i.innerData()也获取不到！
                            function __checkingInheriting() {
                                i.recordInheritsToInner(data, i.getAttrsInheritUsed(data));
                            }
                            //240223，加上条件topDataTmp !== data ? xxx :yyy，当目前图元组件本身就是顶层图元时，直接执行！否则以顶层收发器bus组件测试发现，顶层的没有通过加载完成触发执行进去！！原因暂未深究，区分处理先！
                            topDataTmp !== data ? topDataTmp._i_bottomSymbolLoadedIniting.push(__checkingInheriting) : __checkingInheriting(); //固定传入末尾参数false，这样异步执行就进入到外层e
                        }
                    }
                }
                if (i.isObjEmpty(cache) && data.__cache) cache = data.__cache;
                //230815，添加一个保险起见，命名可能有的不一样
                if (i.isObjEmpty(cache) && data._cache) cache = data._cache;
                //240204，加上这里的赋值，初始化进入渲染元素时，通过data._cache非undefined可以判断已进入，作为data._gv的补充！
                data._cache = data.__cache = cache;
                return cache;
            },
            /*240219，编辑时，当前容器图元data作为上层容器，将此刻其使用到的内嵌继承过来的属性信息，更新到全局editor中，这样内嵌页面指定标签的图元tag，就知道哪些属性上层有用到！
            其中结构3），加上来源的tag地址，主要是方便当上层页面保存时，通过遍历页面图元可以各自只对全局对象更新局部，而不会影响到其他页面做的内嵌继承信息保存！
            {
                "displays/develop/uiotos/editor/favoriteWidgets.json": {//1）内嵌图元所在页面地址
                    "scroll1": {//2）内嵌图元标签tag
                        "tab1@displays/develop/uiotos/editor/toolTabs.json": [//3）属于上层哪个页面哪个容器图元用到：4）对应3）中用到了哪些属性
                            "long-widgets>0>treeTable-ui5>a:onDoubleClick",
                            "long-widgets>0>treeTable-ui5>a:onDatasLoaded",
                            "long-widgets>0>treeTable-ui5>a:userData"
                        ],
                        "gv1@displays/develop/uiotos/editor/toolTabs.json": [
                            "userData"
                        ]
                    },
                    "title1": {},
                    "func1": {
                        "tab1@displays/develop/uiotos/editor/toolTabs.json": [
                            "outputByEvent"
                        ]
                    }
                },
                "displays/develop/uiotos/editor/favoritePages.json": {
                    "scroll1": {
                        "tab1@displays/develop/uiotos/editor/toolTabs.json": [
                            "long-pages>0>treeTable-ui5>a:onDoubleClick"
                        ]
                    }
                },
                "displays/develop/uiotos/editor/long-pages.json": {
                    "treeTable-ui5": {
                        "scroll1@displays/develop/uiotos/editor/favoritePages.json": [
                            "userData",
                            "onDatasLoaded"
                        ]
                    }
                },
                "displays/develop/uiotos/editor/long-widgets.json": {
                    "treeTable-ui5": {
                        "scroll1@displays/develop/uiotos/editor/favoriteWidgets.json": [
                            "userData",
                            "onDatasLoaded",
                            "onDoubleClick"
                        ]
                    }
                }
            }*/
            recordInheritsToInner: function(data, attsInheritUsed = null) {
                if (!runningMode() && data.ca('display')) {
                    let attrstmp = attsInheritUsed ? attsInheritUsed : i.getAttrsInheritUsed(data);

                    //240220，先清理，后面再更新新增！因为存在去掉某些继承的属性使用，保存那一刻有调用这里，就需要遍历当前data作为使用方，将所有自己使用的记录都清空，然后后年再根据用到的属性来填充记录！
                    if (editor._i_layersInheritRelied) {
                        // let toBeDelete = [];
                        for (let innerURL in editor._i_layersInheritRelied) {
                            let urlFieldObj = editor._i_layersInheritRelied[innerURL];
                            if (urlFieldObj) {
                                for (let innerTag in urlFieldObj) {
                                    let fromAddrObj = urlFieldObj[innerTag];
                                    for (let fromAddr in fromAddrObj) {
                                        let fromTag = fromAddr.split('@')[0],
                                            fromUrl = fromAddr.split('@').slice(1).join('@'); //240220，存在url中路径也包含@符号的情况！需要提取还原
                                        if (
                                            (fromUrl === data.dm()._url && fromTag === data.getTag()) ||
                                            (fromUrl === data.dm()._url && d(data.dm(), fromTag) === undefined) //240220，存在上层有此前使用了继承属性的容器图元删除的情况！
                                        ) {
                                            delete editor._i_layersInheritRelied[innerURL][innerTag][fromAddr];
                                        }
                                    }
                                }
                            }
                        }
                    }

                    //240219，放到函数中给到顶层容器图元加载完毕后再执行！否则data._i_innerDatas没有，i.innerData()也获取不到！
                    attrstmp.forEach(attr => {
                        let formNodeAddr = data.getTag() + '@' + data.dm() && data.dm()._url,
                            innerData = i.innerData(data, attr),
                            innerURL = innerData && innerData.dm() && innerData.dm()._url,
                            innerTag = innerData && innerData.getTag(),
                            innerFullAttr = i.innerKeyURL(attr),
                            innerAttr = i.np(innerFullAttr); //i.isKeyURL(innerFullAttr) ? i.np(innerFullAttr) : innerFullAttr; 
                        if (innerData) {
                            if (!editor._i_layersInheritRelied) editor._i_layersInheritRelied = {};
                            if (!editor._i_layersInheritRelied[innerURL]) editor._i_layersInheritRelied[innerURL] = {}; //url
                            if (!editor._i_layersInheritRelied[innerURL][innerTag]) editor._i_layersInheritRelied[innerURL][innerTag] = {}; //tag标签
                            if (!editor._i_layersInheritRelied[innerURL][innerTag][formNodeAddr]) editor._i_layersInheritRelied[innerURL][innerTag][formNodeAddr] = []; //上层使用者的地址
                            if (editor._i_layersInheritRelied[innerURL][innerTag][formNodeAddr].indexOf(innerAttr) == -1) { //属性数组
                                editor._i_layersInheritRelied[innerURL][innerTag][formNodeAddr].push(innerAttr);
                            }
                        }
                    });
                    attrstmp = null; //240219，闭包函数清理内存！
                }
            },
            //240305，keyURL中文件名称为全路径的，再次改回路径名称，这样好在formValue中作为key，跟属性attr对应获取值！
            __getKeyUrlFromFullPathed: function(keyUrlFullPathed) {
                let arrtmp = [];
                keyUrlFullPathed.split('>').forEach(field => {
                    let fieldNp = i.np(field),
                        prefix = field.slice(0, 2) == 'a:' ? 'a:' : '';
                    arrtmp.push(i.isDisplayURL(fieldNp) ? (prefix + urlName(fieldNp)) : field);
                });
                return arrtmp.join('>');
            },
            /*240304，全局每个收发器对象（底层同一个，被多个嵌套就属于多个收发器实例对象），以顶层页面地址 + 顶层图元tag + 收发器的tag标签（兼容上层继承修改或不继承），
            组成全局信息的key，全局唯一。值就是收发器关注的各个属性和值，其中属性默认为最底层的attr，逐层向上遍历，一旦有更上层继承并form绑定，那么就用这个更上层的keyURL
            作为值对象的key，对应值对象的值，就是上层form绑定设定的值！
            {
                "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检配置.json>0>tab1>a:displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检点配置.json>0>bus2": {
                    "mode": "recv",
                    "addrsRemote":  ["*"],
                    "addressLocal": "bus2@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检点配置.json",
                    "topicSend": "bus2@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检点配置.json",
                    "waitingRecv": true,
                    "topicsWhiteList":  ["*"],
                    "addrsWhiteList": [
                        "bus3@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检配置.json"
                    ]
                },
                "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检配置.json>0>dlg2>a:displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/添加巡查路线.json>0>gv2>a:displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/巡检点设置.json>0>bus1": {
                    "mode": "recv",
                    "addrsRemote":  ["*"],
                    "addressLocal": "bus1@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/巡检点设置.json",
                    "topicSend": "bus1@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/巡检点设置.json",
                    "topicsWhiteList": ["id组"],
                    "addrsWhiteList": [
                        "bus6@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检配置.json"
                    ],

                    //【240305】重点是这条，底层默认是"waitingRecv" : true，而更上层做了form绑定，key及时keyUrlFullPath了！！
                    "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检配置.json>0>dlg2>displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/添加巡查路线.json>0>gv2>a:displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/巡检点设置.json>0>bus1>a:waitingRecv": false
                },
                "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检配置.json>0>dlg9>a:displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/添加巡查路线.json>0>gv2>a:displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/巡检点设置.json>0>bus1": {
                    "mode": "recv",
                    "addrsRemote": ["*"],
                    "addressLocal": "bus1@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/巡检点设置.json",
                    "topicSend": "bus1@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/添加巡查路线/巡检点设置.json",
                    "waitingRecv": true,
                    "topicsWhiteList": [
                        "id组"
                    ],
                    "addrsWhiteList": [
                        "bus6@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/巡检管理/巡检配置/巡检配置.json"
                    ]
                }
            }*/
            recordEventBusLinked: function(data) {
                if ( /*!runningMode() &&*/ i.isControlTyped(data, 'bus')) {
                    let attrsRelatived = [
                        'a:mode',
                        'a:addrsRemote',
                        'a:addressLocal',
                        'a:topicSend',
                        'a:waitingRecv',
                        'a:topicsWhiteList',
                        'a:addrsWhiteList',
                        /*240408，存放id，这样通过某个收发器图元对象data，调用i.getBusesUppersUsed()获取上层嵌套的图元对象列表，但是根据指定data图元对象，
                        应该只能有唯一一个才是，就用这里id来对应传入data图元的id，实现唯一对应！*/
                        'p:id'
                    ];
                    //240304，所有收发器，通过层层嵌套后的各自信息记录，
                    let topInfo = i.topKeyURL(data, 'p:tag', true, true),
                        curFormed = {};
                    if(!topInfo.data || !topInfo.data.dm()) return;
                    let absTag = topInfo.data.dm()._url + '>0>' + topInfo.data.getTag() + '>' + topInfo.attr;
                    absTag = absTag.split('>').slice(0, -1).join('>');
                    if (!_i.window()._i_eventBusLayersInfo) _i.window()._i_eventBusLayersInfo = {};
                    _i.window()._i_eventBusLayersInfo[absTag] = {}; //240304，去掉末尾都有的'>p:tag'，key截至到bus的tag值即可！
                    //240304，以最底层属性key-value进行初始化，根节点key保持为tag标签在最上层的定位（keyURL形式，不一定非得上层有继承，纯粹用于唯一识别定位！）
                    attrsRelatived.forEach(attr => {
                        _i.window()._i_eventBusLayersInfo[absTag][i.np(attr)] = i.getValue(data, attr);
                        curFormed[i.np(attr)] = i.np(attr); //240304，暂存最底层默认的先
                    });
                    //240222，getAttrFormTypedValueUpperLatest的变种，递归进行改造，方便逐层往上在里面找多个属性的form值所在的图元
                    function __upperLayersTillTop(node, attrs) {
                        if (!node) return;
                        let upperDataTmp = i.upperData(node);
                        if (upperDataTmp && !node.ca('_forbidInherit')) { //231208，如果有勾选了隐藏对上继承，那么就不继续往上了，返回是空数组！
                            let formValTmp = i.formValues(upperDataTmp, 1, true), //240222，所有form类型的，注意，可能有更上层的form覆盖当前中间层的form。
                                upperAttrsTmp = [];
                            attrs.forEach(attr => {
                                let upperAttrTmp = i.upperKeyURL(node, attr, false, true);
                                //240310，用upperUpperAttr代替upperAttrTmp，这样才能精准根据keyURL定位到form绑定图元组件位置信息，否则还依赖于图元对象！此前仅是图元对象的属性keyURL！示例数据如下：
                                /*{
                                    "displays/demo/顶层页面.json>0>scroll1>a:displays/demo/中间页面.json>0>gv4>a:displays/底层页面.json>0>输出": {
                                        "mode": "send",
                                        "waitingRecv": true,
                                        "topicsWhiteList": [
                                            "*"
                                        ],
                                        "addrsWhiteList": [
                                            "*"
                                        ],

                                        //tips 240310，重点看这里，这里的属性名称是keyURL，不是底层基础属性名，而且绝对路径开头是“中间页面.json”，不是“顶层页面.json”，那么就可以知道顶层对逐层继承的addrsRemote没有form绑定而是formValue等！
                                        
                                        "displays/demo/中间页面.json>0>gv4>a:displays/底层页面.json>0>输出>a:addrsRemote": [   
                                            "bus3@displays/demo/中间页面.json",
                                            "bus4@displays/demo/中间页面.json"
                                        ],
                                        "displays/demo/中间页面.json>0>gv4>a:displays/底层页面.json>0>输出>a:addressLocal": "bus2@displays/demo/中间页面.json",
                                        "displays/demo/中间页面.json>0>gv4>a:displays/底层页面.json>0>输出>a:topicSend": "bus2@displays/demo/中间页面.json"
                                    },
                                    "displays/demo/顶层页面.json>0>scroll1>a:displays/demo/中间页面.json>0>gv5>a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json>0>bus1": {
                                        "mode": "recv",
                                        "addrsRemote": [
                                            "*"
                                        ],
                                        "topicSend": "bus1@displays/demo/中间页面.json",
                                        "waitingRecv": true,
                                        "displays/demo/中间页面.json>0>gv5>a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json>0>bus1>a:addressLocal": "bus3@displays/demo/中间页面.json",
                                        "displays/demo/中间页面.json>0>gv5>a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json>0>bus1>a:topicsWhiteList": [
                                            "删除"
                                        ],
                                        "displays/demo/中间页面.json>0>gv5>a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json>0>bus1>a:addrsWhiteList": [
                                            "bus2@displays/demo/中间页面.json"
                                        ]
                                    }
                                }*/
                                let upperUpperAttr = i.upperKeyURL(upperDataTmp, upperAttrTmp, false, true); //240310，还需要更上层的信息，才能定位到form绑定的属性绝对位置！否则还依赖于图元对象！
                                if (!upperUpperAttr) upperUpperAttr = upperDataTmp.dm()._url + '>0>' + upperDataTmp.getTag() + '>' + i.autoPrefixed(upperAttrTmp, upperDataTmp);
                                let formedValue = formValTmp[i.__getKeyUrlFromFullPathed(upperAttrTmp)];
                                upperAttrsTmp.push(upperAttrTmp); //tips 240310，这里不能用upperUpperAttr，否则逐层递归上去，再传入的attr就不是当前node的继承属性了！
                                if (formedValue !== undefined) {
                                    let bottomTmp = i.np(i.bottomKeyURL(upperUpperAttr /*upperAttrTmp*/ )), //240304，始终以最底层的属性名作为key，值为前一次最靠近上层form绑定的keyURL
                                        oldLastFormed = curFormed[bottomTmp], //240304，查到旧的form绑定的（里层的）
                                        currentFormed = i.np(upperUpperAttr /*upperAttrTmp*/ ); //240304，当前更上层form绑定的，注意，可能不是直接上层，可能是跨层的上层！
                                    delete _i.window()._i_eventBusLayersInfo[absTag][oldLastFormed]; //240304，清理掉下层attr的记录，如果有！
                                    _i.window()._i_eventBusLayersInfo[absTag][i.np(upperUpperAttr /*upperAttrTmp*/ )] = formedValue; //240304，只保留更上层form绑定的属性key-value
                                    curFormed[bottomTmp] = currentFormed; //240304，存放当前最新的上层form绑定的
                                }
                            });
                            __upperLayersTillTop(upperDataTmp, upperAttrsTmp);
                        }
                    }
                    __upperLayersTillTop(data, attrsRelatived);
                }
            },
            //240304，根据收发器全局嵌套后最终实际地址，获取相关的收发器信息列表，因为地址可能有重复！尤其多个平级上层嵌套但并未重写地址时！
            /*返回示例如下，返回数组为符合条件的收发器列表，对象元素中，除了两个冗余字段_abskey、_rawInfo，其他key字段都是收发器默认关心的属性基础名称，通常在attrsRelatived罗列出，
            每个基础属性下对象带有公共两个字段，分别为diaplay和tag，标识当前属性在当前或上层呢哪个页面中哪个tag图元组件中设置的form绑定，并且如果有多层设置了form绑定，这是最靠近顶层
            即更上蹭form绑定时对应的页面和上层图元组件tag信息！
            //240310，keyURL的第0、2段，或者-3、-1段，就是所在页面url，以及tag标签，底层图元默认设置时，从absKey去提取底层图元路径和Tag信息！
            [{
                "_abskey": "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划 2.json>0>gv5>a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json>0>bus1",
                "_rawInfo": {
                    "mode": "recv",
                    "addrsRemote": [
                        "*"
                    ],
                    "topicSend": "bus1@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划.json",
                    "waitingRecv": true,
                    "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划 2.json>0>gv5>a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json>0>bus1>a:addressLocal": "bus3@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划.json",
                    "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划 2.json>0>gv5>a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json>0>bus1>a:topicsWhiteList": [
                        "删除"
                    ],
                    "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划 2.json>0>gv5>a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json>0>bus1>a:addrsWhiteList": [
                        "bus2@displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划.json"
                    ]
                },
                "mode": {
                    "display": "a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json",
                    "tag": "bus1"
                },
                "addrsRemote": {
                    "display": "a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json",
                    "tag": "bus1"
                },
                "addressLocal": {
                    "display": "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划 2.json",
                    "tag": "gv5"
                },
                "topicSend": {
                    "display": "a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json",
                    "tag": "bus1"
                },
                "waitingRecv": {
                    "display": "a:displays/develop/__favorites/widgets/嵌套容器/__封装/树表操作点击接收@与发送对应的接收解析@1702122809947.json",
                    "tag": "bus1"
                },
                "topicsWhiteList": {
                    "display": "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划 2.json",
                    "tag": "gv5"
                },
                "addrsWhiteList": {
                    "display": "displays/develop/uiotos/aiotos/apps/统一管理平台/运维服务/维保管理/维保计划/维保计划 2.json",
                    "tag": "gv5"
                }
            }]*/
            getBusesByAddress: function(addr, mode = '*') { //240304，*、both、send、recv，支持数组[]形式多选！
                let ret = [],
                    attrsRelatived = [
                        'a:mode',
                        'a:addrsRemote',
                        'a:addressLocal',
                        'a:topicSend',
                        'a:waitingRecv',
                        'a:topicsWhiteList',
                        'a:addrsWhiteList'
                    ];
                if (!isArrayFn(mode)) mode = [mode];
                if (_i.window()._i_eventBusLayersInfo) {
                    for (let absKey in _i.window()._i_eventBusLayersInfo) {
                        let infoObj = _i.window()._i_eventBusLayersInfo[absKey],
                            addrLocalKey = i.attr(infoObj, 'addressLocal'),
                            modeTmp = infoObj[i.attr(infoObj, 'mode')],
                            addrLocalVal = infoObj[addrLocalKey];

                        /*240304，将'添加巡查路线>0>gv2>a:巡检点设置>0>bus1>a:waitingRecv'，提取出'添加巡查路线>0>gv2>a:巡检点设置>0>bus1'，
                        或者将'waitingRecv'提取出空字符串''*/
                        function __attrUpperFormedPos(attrKey) { //240304，传入attrKey为infoObj中的字段！可以是"waitingRecv"或者"添加巡查路线>0>gv2>a:巡检点设置>0>bus1>a:waitingRecv"。
                            return {
                                //240310，keyURL的第0、2段，或者-3、-1段，就是所在页面url，以及tag标签，底层图元默认设置时，从absKey去提取底层图元路径和Tag信息！
                                display: attrKey.indexOf('>') == -1 ? absKey.split('>').at(-3) : attrKey.split('>')[0], //formedDisplay,
                                tag: attrKey.indexOf('>') == -1 ? absKey.split('>').at(-1) : attrKey.split('>')[2], //formedTag
                                keyURL: i.__getKeyUrlFromFullPathed(absKey)
                            };
                        }

                        console.assert(addrLocalKey);
                        //240304，加上条件&& (mode.indexOf('*') !== -1 || mode.indexOf(modeTmp) !== -1)，默认所有类型收发器都来匹配地址，指定both/send/recv后，就精准匹配！
                        if (addrLocalVal === addr && (mode.indexOf('*') !== -1 || mode.indexOf(modeTmp) !== -1)) {
                            let objtmp = {
                                _abskey: absKey,
                                _rawInfo: infoObj,
                            }
                            attrsRelatived.forEach(attr => {
                                objtmp[i.np(attr)] = __attrUpperFormedPos(i.attr(infoObj, i.np(attr))); //tips 240310，传入实际当前属性key！
                            });
                            ret.push(objtmp);
                        }
                    };
                }
                return ret;
            },
            //240305，任意一个底层收发器图元，获取其在所有上层嵌套实际的实例信息
            getBusesUppersUsed: function(data, currentOnly = false) {
                let curPos = data.dm()._url + '>0>' + data.getTag(),
                    attrstmp = i.arrayItemsRemoved(i.attr(_i.window()._i_eventBusLayersInfo, curPos, -1), curPos);
                if (currentOnly) {
                    let targets = [];
                    attrstmp.forEach(attr => {
                        if (_i.window()._i_eventBusLayersInfo[attr].id === data.getId()) {
                            targets.push(attr);
                        }
                    });
                    attrstmp = targets;
                }
                return attrstmp;
            },
            /*240220，因为对于内嵌图元的tag，原先下级节点就是不重复的属性列表，现在改成原先用到它属性的来源图元的url+tag字符串，作为下级节点，然后用到的属性列表作为值，
            那么对于内嵌图元本身来说，不管谁用到自己的属性，只关心自己所有哪些属性是被上层用到，因此这里专门提供一个方法来提取，根据内嵌图元所在页面url和自己的tag标签！*/
            getEditorInheritRecord: function(url, tag) {
                if (!editor._i_layersInheritRelied) return [];
                let urlFieldObj = editor._i_layersInheritRelied[url],
                    tagFieldObj = urlFieldObj && urlFieldObj[tag],
                    result = [];
                i.values(tagFieldObj).forEach(attrs => {
                    attrs.forEach(attr => {
                        if (result.indexOf(attr) === -1) result.push(attr);
                    })
                });
                return result;
            },
            //240220，上面的简便方法
            getInheritRecordFromInner: function(data) {
                return i.getEditorInheritRecord(data.dm()._url, data.getTag());
            },
            //240206，清理缓存
            clearCachedAll: function(data, formOnly = false) {
                if (formOnly) {
                    data._i_cachedFormBinded = undefined;
                    data._i_cachedFormValue = undefined;
                    data._i_cachedFormDatas = undefined;
                } else {
                    data._i_cachedFormBinded = undefined;
                    data._i_cachedFormValue = undefined;
                    data._i_cachedFormDatas = undefined;
                    data._i_cachedAttrFormTypedValueUpperLatest = undefined;
                    data._i_cachedHasInner = undefined;
                    data._i_cachedInnerData = undefined;
                    data._i_cachedTopData = undefined;
                    data._i_cachedUpperDatas = undefined;
                }
            },
            /*判断dm是否有包含有内嵌图纸。*/
            hasInnerDisplay: function(dm, retNodesCb = [], isBubbliingUpper = false, upperRefered = false, urlShortWordAllowed = false) { //231225，引用传参返回内嵌容器组件对象列表
                if (!dm) return false;
                let hasInner = false,
                    upperData = null;
                dm.eachByBreadthFirst((child) => {
                    if (i.hasInner(child, upperRefered, urlShortWordAllowed)) {
                        if (!upperData) upperData = i.upperData(child);
                        //231222，内嵌对话框容器格外要注意，因为运行状态下，内嵌页的对话框组件容器有更下级内嵌页时，不会触底反弹，不能被当做是有内嵌页来处理！
                        if (
                            !upperData ||
                            (
                                (
                                    upperData.s('2d.visible') ||
                                    (
                                        i.isControlTyped(upperData, 'dlg') &&
                                        upperData.ca('show')
                                    )
                                ) &&
                                //231223，同时，内嵌图元一定要可见，否则无法触发其渲染元素初始化，更别说加载更下级内嵌页了！
                                (
                                    child.s('2d.visible') ||
                                    (
                                        isBubbliingUpper &&
                                        child._gv && //渲染元素已初始化，对于对话框而言，执行渲染元素初始化就会将默认可见自动改成不可见
                                        i.isControlTyped(child, 'dlg')
                                    )
                                )
                            )
                        ) {
                            hasInner = true;
                            retNodesCb && retNodesCb.push(child); //231225，引用传参返回内嵌容器组件对象列表
                        }
                    }
                });
                return hasInner;
            },

            //230422，判断url为内嵌图纸路径url*/
            isDisplayURL: function(str, data = null, upperRefered = false, urlShortWordAllowed = false) { //240121，加上参数data，因为对于tab页签组件，displays里的项可以是url，也可以是去掉.json，以及相对路径之前的部分！
                if (str && urlShortWordAllowed && str.trim && str.trim() !== '') return true;

                //230929，添加条件|| str.slice(0,2) == './' || str.slice(0,3) == '../'，以及str.indexOf('.') != -1改成str.slice(-5) == '.json'，要求末尾必须为.json
                if (str && typeof str == 'string' && (str.slice(0, 9) == 'displays/' || str.slice(0, 2) == './' || str.slice(0, 3) == '../') && str.slice(-5) == '.json') {
                    if (data && upperRefered && i.getAttrFormTypedValueUpperLatest(data, 'display', 1, true)) {
                        return false;
                    }
                    return true;
                } else {
                    //对于tab页签组件，displays中逐个元素字符串都会传入判断，此时是支持不带.json后缀，以及结合relativePath的，不需要完整路径或相对路径！
                    let strs = [];
                    if (data && i.isControlTyped(data, 'tab')) { //页签tab组件
                        if (isArrayFn(str)) {
                            strs = str;
                        } else if (typeof(str) == 'string') {
                            strs = [str]
                        } else {
                            console.assert(0);
                        }
                        let found = false;
                        strs.forEach(urlSeg => {
                            if (typeof(urlSeg) == 'string' && urlSeg.trim() != '') { //displays中的项为非空字符串
                                found = true;
                            }
                        });
                        return found;
                    } else if (data && i.isControlTyped(data, 'ttb')) { //240121，treeTable树表格，新增innerDisplays属性，从datas解析中自动提取同步过来，如果有单元格有内嵌页！
                        if (data.ca('innerDisplays') && data.ca('innerDisplays').length) {
                            return true;
                        }
                    } else {
                        return false;
                    }
                }
            },
            //是否是iframe网页内嵌图元
            isIframe: function(data) {
                return (i.typeMatched(data, 'ifm') || i.typeMatched(data, 'iframe')) && data.ca('src') != undefined;
            },
            //230224，作为i.hasInnerDisplay()的补充，传入图元，判断是否包含内嵌图纸
            hasInner: function(data, upperRefered = false, urlShortWordAllowed = false) {
                if (!data) return false;
                if (!data._i_cachedHasInner) data._i_cachedHasInner = {};
                let cachedResult = data._i_cachedHasInner[upperRefered + String(urlShortWordAllowed) + ''];
                if (cachedResult !== undefined) {
                    if (!( //240613，加上条件，如果发现缓存是false，但是有display属性并且非空，这个时候就不用缓存，要来重新判断下！！！
                            cachedResult === false &&
                            data.ca('display') &&
                            data.ca('display').trim &&
                            data.ca('display').trim() != ''
                        )) {
                        return data._i_cachedHasInner[upperRefered + String(urlShortWordAllowed) + ''];
                    }
                }

                //230422，是iframe且有内嵌src地址时。注意，对于iframe，需要是内嵌图纸的才返回true，如果是内嵌网页http url则不算返回false
                if (i.isIframe(data)) i.isDisplayURL(data.ca('src'), false, urlShortWordAllowed);

                //240121，树表格的是否有内嵌的判断
                if (i.isControlTyped(data, 'ttb')) {
                    return i.isDisplayURL(data.ca('innerDisplays'), data, urlShortWordAllowed);
                }
                //231108，判断是否是带有内嵌页面的树表drawCell，而且有至少一个非空的display内嵌页面
                function __chooseOneUrlForTableWithInner() {
                    let attrstmp = i.isControlTyped(data, 'ttb') && i.attr(i.getFormDatas(data), 'a:display', -1), //传入-1，获取所有匹配到的
                        urlChoosed = null;
                    attrstmp && attrstmp.forEach(attrtmp => {
                        if (urlChoosed) return;
                        urlChoosed = i.getValue(data, attrtmp);
                    });

                    //240121，好像是进不来这里的，之前为什么这么写？？？加上断言，提示下！！有待进一步观察分析！
                    if (urlChoosed) console.assert(0)

                    return urlChoosed;
                }
                let hasSymbol = i.hasAttrObjectKey(data, 'symbol'), //有symbol属性字段，但是不一定有值，可能初始还未写入
                    symbol = data.ca('symbol'),
                    /*231108，加上(i.isControlTyped(data,'ttb') && i.attr(i.getFormDatas(data), 'a:display'))且限定treeTable主要避免额外的消耗计算
                    对于i.getFormDatas(data)是耗时操作！*/
                    display = data.a('display') || __chooseOneUrlForTableWithInner(),
                    displays = data.a('displays');

                function __strExists(str) {
                    //240121，完善isDisplayURL，并加上参数data，这样对于tab页签的displays数组属性，来专门判断，否则被认为没有url，就不会当成是内嵌图元组件了！！
                    return str != undefined && (str.length != 0 || (str.trim && str.trim() != '')) && i.isDisplayURL(str, data, upperRefered, urlShortWordAllowed); //230330，加上“str.length != 0 ||”，对于displays数组类型支持
                }

                let ret = !i.isSimpleData(data) && (__strExists(display) || __strExists(displays));
                //231030，将hasSymbol从上面条件&&中放到了下面仅仅用来assert，通常只要有display属性值，就是容器，但是偶然发现i.hasAttrObjectKey(data, 'symbol')竟然为false，需要进一步捕捉排查分析！
                if (ret == true) {
                    if (!hasSymbol && !i.hasAttrObjectKey(data, 'symbols')) { //231121，发现iconMenu前面ret为true，没有symbol属性，但是有symbols属性！避免错误误报！
                        console.assert(0);
                    }
                }
                //tips 240122，貌似就是i.getValueUpperFormed()并且做标记。
                if (ret == false && !__strExists(display) && i.hasAttrObjectKey(data, 'display')) {
                    let upperFormBinded = i.getAttrFormTypedValueUpperLatest(data, 'a:display');
                    if (upperFormBinded && upperFormBinded[0] && !!upperFormBinded[0].value) {
                        console.error(`WARN: container node ${data.getDisplayName()} in ${data.dm()._url} has upper display attr with form binded and none-empty value such as:`, upperFormBinded[0].value, ` and will be recognized as 'has inner':`, upperFormBinded);
                        let dynamicDisplayURL = upperFormBinded[0].value;
                        upperFormBinded.forEach(upperFromedInfo => {
                            //240228，先清空缓存
                            upperFromedInfo.data._i_innerDisplayLoadUpperUsed = [];
                        });
                        //240228，再设置缓存！避免多次调用i.hasInnerDisplay，结果多次push相同的属性到数组中！
                        upperFormBinded.forEach(upperFromedInfo => {
                            upperFromedInfo.data._i_innerDisplayLoadUpperUsed.push(i.np(upperFromedInfo.attr));
                        });
                        if (!data.dm()._i_dynamicInnerNodeDisplayUrls) data.dm()._i_dynamicInnerNodeDisplayUrls = [];
                        data.dm()._i_dynamicInnerNodeDisplayUrls.push({
                            data,
                            url: dynamicDisplayURL
                        });
                        ret = true;
                    }
                }
                //240206，缓存结果，兼容传入upperRefered参数的情况
                data._i_cachedHasInner[upperRefered + String(urlShortWordAllowed) + ''] = ret;
                return ret;
            },
            //240515，简单容器，主要是用于双击能够弹出输入框输入display url用！
            isSimpleContainer: function(data) {
                return i.isControlTyped(data, 'dlg') || i.isControlTyped(data, 'scroll') || i.isControlTyped(data, 'gv');
            },
            /*231231，当前容器组件的内嵌页是否有实际初始化过，通过内嵌容器组件的渲染元素是否有初始化来判断！
            只要没有初始化，那么更下级的内嵌就不会触底反弹！*/
            hasInnerSymbolInited: function(data) {
                let rettmp = undefined;
                if (data._i_cachedHasInnerSymbolInited !== undefined) return data._i_cachedHasInnerSymbolInited;
                if (i.hasInner(data)) {
                    if (!data._i_innerDatas) rettmp = false;
                } else { //240108，非容器组件，那么久返回当前图元组件的image、symbol是否有初始化渲染元素！
                    console.assert(0); //这种属于异常情况！因为简单基础图元组件有没有渲染元素，因此很容易造成BUG！！
                    rettmp = !!data._gv
                }

                let innerDatasTmp = i.values(data._i_innerDatas),
                    itemChooled = undefined; //240203，选择一个内嵌渲染元素图元组件，用来判断是否初始化过，而不是任意选择第一个来判断，比如ht.Text就不存在渲染元素！
                innerDatasTmp.forEach(inner => {
                    if (rettmp !== undefined || itemChooled !== undefined) return;
                    if (i.hasInner(inner)) {
                        rettmp = !!inner._gv;
                    } else {
                        let urltmp = inner.getImage();
                        if (
                            (
                                urltmp && //240710
                                typeof(urltmp) == 'object' && //240203，常规渲染元素
                                urltmp.renderHTML != undefined
                            ) || (
                                typeof(urltmp) == 'string' && //240203，比如ht.Text文字的iamge为__Text__，要排除在外！
                                !(
                                    urltmp.slice(0, 2) == '__' &&
                                    urltmp.slice(-2) == '__'
                                )
                            )) {
                            itemChooled = inner;
                        }
                    }
                });
                if (rettmp === undefined && !!itemChooled && innerDatasTmp.length) rettmp = !!itemChooled._gv || !!itemChooled._cache;

                //240203，如果没有内嵌容器，也没有内嵌渲染元素，都是最基础的ht.Text等，那么直接返回true，认为渲染元素已经初始化完毕！
                if (rettmp === undefined && itemChooled === undefined) rettmp = true;

                //240313，增加缓存
                if (data._i_cachedHasInnerSymbolInited !== undefined) data._i_cachedHasInnerSymbolInited = rettmp;

                return rettmp;
            },
            //240121，初始化状态，结合data._gv和data._cache
            symbolInitedState: function(data) {
                if (data._cache === undefined) {
                    console.assert(data._gv === undefined);
                    return 0;
                } else if (data._gv !== undefined) { //正常初始化完毕
                    return 1;
                } else {
                    return 2;
                }
            },
            /*240107，内嵌页面内是否有更下级的内嵌！*/
            hasInnerInner: function(data) {
                if (!data) return false;
                if (data._i_cachedHasInnerInner !== undefined) return data._i_cachedHasInnerInner;

                if (!data._i_innerDatas) return false;
                let innerDatasTmp = i.values(data._i_innerDatas),
                    rettmp = 0;
                innerDatasTmp.forEach(inner => {
                    if (i.hasInner(inner)) {
                        rettmp += 1; //返回有更下级内嵌的数量，兼容认作true/false的返回！
                    }
                });

                //240312，增加缓存
                data._i_cachedHasInnerInner = rettmp;

                return rettmp;
            },
            //240208，是否完全加载完毕，如果是内嵌。对于非内嵌，直接返回true
            hasCompleteLoaded: function(data) {
                /*240208，试图用来让缓存相关的在加载当前图元加载完毕后才采用，最新逻辑可去除，直接返回true*/
                return true;

                return data.ca('isLoadingGet') === undefined || (data.ca('isLoadingGet') == false && data._i_isCompleteLoaded === true);
            },
            /*240119，容器是否加载完成*/
            loadedState: function(data) {
                if (!(data && data._gv) || !i.hasInner(data)) return undefined;
                let isLoadingGetTmp = data.ca('isLoadingGet'),
                    isCompleteLoadedTmp = data._i_isCompleteLoaded;
                if (isLoadingGetTmp === false && isCompleteLoadedTmp === true) {
                    //tips 240206 情况1：【false,true】
                    //1）正常情况下，完全加载完成，两个标记符号分别为false和true，标记为1，相当于true
                    return 1;
                } else if (isLoadingGetTmp === false && isCompleteLoadedTmp === false) {
                    let currentIndex = 0;
                    if (i.isControlTyped(data, 'tab')) {
                        currentIndex = data.ca('index');
                    }
                    console.assert(!i.hasInnerInner(i.innerDataModel(data, currentIndex)));
                    return 2;
                } else if (isLoadingGetTmp === false && isCompleteLoadedTmp < 0) {
                    //     240206 情况3：【false，-1、-2、...】
                    return 3;
                } else if (isLoadingGetTmp === false && isCompleteLoadedTmp === undefined) {
                    //     240206 情况4：【false，undefined】
                    console.assert(0); //这种情况应该不存在！
                    return 4;
                } else if (isLoadingGetTmp === true && isCompleteLoadedTmp === false) {
                    //     240206 情况5：【true, false】
                    //3）其他情况，标记为0，也相当于false
                    return 0;
                } else if (isLoadingGetTmp === true && isCompleteLoadedTmp === true) {
                    //     240206 情况6：【true,true】
                    return -1;
                } else if (isLoadingGetTmp === true && isCompleteLoadedTmp < 0) {
                    return -2;
                } else if (isLoadingGetTmp === true && isCompleteLoadedTmp === undefined) {
                    //     240206 情况7：【true, undefined】
                    return -3;
                } else { //240206，8种情况都枚举了，其他情况应该都不存在！只有可能当前是非容器组件，不会加载内嵌，因此两个标记属性都是undefined
                    console.assert(0);
                    return -4;
                }
            },
            /*231007，内嵌图元的指定属性，自下往上逐层iotos.form绑定，并且赋值不是undefined（不包括null）时，自上往下（顶到底）iotos.form绑定和赋值的情况列表！
            用途比如：判断hasInner是否有是容器且有配置了内嵌地址的页面时，在底层判断不行，因为判断时底层配置的属性值为空，实际配置是嵌套的上层form绑定后的配置！
            如果hasInner判断失败，会导致当前层就反弹，实际上需要内嵌的反弹才行！
            i.getAttrFormTypedValueUpperLatest(data,'a:display')
            [{
                attr: 'a:数据监视-详情>0>gv2>a:面板容器>0>gv1>a:display', 
                value: 'displays/develop/uiotos/aiotos/apps/统一管理平台/物业管理/智慧消防/数据监视/数据监视-详情-内嵌面板右.json'
            },{
                attr: 'a:面板容器>0>gv1>a:display', 
                value: 'displays/develop/uiotos/aiotos/apps/统一管理平台/物业管理/智慧消防/数据监视/数据监视-详情-内嵌面板左.json'
            }]*/
            // 231213，加上参数returnIfExistOnly，仅仅判断上层是否有iotos.form绑定，不需要具体信息也不再继续向上递归浪费时间！
            getAttrFormTypedValueUpperLatest: function(data, attr, formType = 1, returnIfExistOnly = false, _layerdValue = null) { //-1：全部；1: form；2: formReset；3: formValue
                if (!data.dm()) return null;
                //240126，如果是非form绑定的属性，就不进行里面处理，避免好事影响性能！
                if (attr && !i.isAttrFormBinded(data, attr)) {
                    return returnIfExistOnly ? (_layerdValue && _layerdValue.length ? true : false) : (_layerdValue ? _layerdValue : []);
                }

                let cachedKeyTmp = data.dm()._url + '-' + data.getTag() + '-' + attr + '-' + formType + '-' + returnIfExistOnly; //240124，加上+ '-' + attr ，为啥之前没用attr加到key中区分？？忘了吗？
                //240126，去掉条件runningMode() && ，因为编辑时响应速度也非常重要，缓存之前加上条件那是运行状态才起作用，去掉，让编辑状态也生效！之前为啥呢加上条件？？现在去掉是否有影响？？有待再分析测试！
                if ( /*runningMode() && */ data._i_cachedAttrFormTypedValueUpperLatest && data._i_cachedAttrFormTypedValueUpperLatest[cachedKeyTmp] !== undefined && i.hasCompleteLoaded(data)) { //240208，加载完成才能用缓存
                    return data._i_cachedAttrFormTypedValueUpperLatest[cachedKeyTmp];
                }

                if (_layerdValue == null) {
                    _layerdValue = [];
                    _layerdValue.originNode = data; //231216，因为递归，到最后传入的data不是最初参数的data了，所以在内部参数中存放最先传入的图元对象作为属性！
                }
                let upperTmp = i.upperData(data);
                if (upperTmp && !data.ca('_forbidInherit')) { //231208，如果有勾选了隐藏对上继承，那么就不继续往上了，返回是空数组！
                    let formValTmp = i.formValues(upperTmp, formType, true), //231213，发现之前i.formValues的末尾参数竟然是默认false，这样就会只识别iotos.formValue了！！
                        upperAttrTmp = attr && i.upperKeyURL(data, attr),
                        configuredValue = formValTmp[upperAttrTmp];
                    if (configuredValue !== undefined) {
                        //231213，只要一发现有上层任何一层的有form绑定，就不继续判断了，返回true即可！
                        if (returnIfExistOnly) return true;
                        _layerdValue.push({
                            data: upperTmp, //240222，增加当前的图元对象，目前是在收发器发送接收依赖项全局关联跳转需要用到！
                            attr: upperAttrTmp,
                            value: configuredValue
                        });
                    }
                    return i.getAttrFormTypedValueUpperLatest(upperTmp, upperAttrTmp, formType, returnIfExistOnly, _layerdValue);
                } else {
                    let rettmp = null;
                    if (returnIfExistOnly) {
                        console.assert(_layerdValue.length == 0);
                        rettmp = false; //231213，如果都递归到了这里，说明前面都没有找到form绑定的！
                    } else {
                        rettmp = _layerdValue.reverse();
                    }

                    //从底层到最上层，切换成自顶层到最底层的顺序
                    //231216，尝试缓存，有待测试！！
                    let originNode = _layerdValue.originNode;
                    if (originNode) {
                        if (!originNode._i_cachedAttrFormTypedValueUpperLatest) originNode._i_cachedAttrFormTypedValueUpperLatest = {};
                        originNode._i_cachedAttrFormTypedValueUpperLatest[cachedKeyTmp] = rettmp;
                    }
                    return rettmp;
                }
            },
            /*231103，通常用于编辑状态的容器组件，指定图元的属性，逐层往下的form绑定，获得属性在指定层的绑定类型，display、bindType两个字段存放
            默认返回为form绑定列表，从顶层到底层顺序的数组：['iotos.formReset','iotos.formValue'];
            传入fullInfo为true时，详细信息：[
                {
                    tag: "dlg1",
                    attr: "a:操作-授权>0>facialAccessId>a:value",
                    bindType: 'iotos.formReset',
                    display: 'displays/develop/uiotos/aiotos/apps/统一管理平台/物业管理/通行服务/人脸出入管理/设备授权管理.json'
                },
                {
                    tag: "facialAccessId",
                    attr: "a:value",
                    bindType: 'iotos.formValue',
                    display: 'displays/develop/uiotos/aiotos/apps/统一管理平台/物业管理/通行服务/人脸出入管理/操作-授权.json'
                }
            ]*/
            getAttrFormTypesDownToBottom: function(data, attr, fullInfo = false, _layerdTypes = null) {
                if (_layerdTypes == null) _layerdTypes = [];
                _layerdTypes.push({
                    display: data.dm()._url,
                    bindType: i.getDisplayBindingName(data, attr),
                    tag: data,
                    attr: attr
                });
                let innerNodeTmp = i.innerData(data, attr),
                    innerAttrTmp = i.innerKeyURL(attr);
                if (innerNodeTmp) {
                    return i.getAttrFormTypesDownToBottom(innerNodeTmp, innerAttrTmp, fullInfo, _layerdTypes);
                } else {
                    //自顶层到最底层的顺序
                    if (fullInfo) return _layerdTypes;
                    else {
                        let simpleInfo = [];
                        _layerdTypes.forEach(item => {
                            simpleInfo.push(item.bindType);
                        });
                        return simpleInfo;
                    }
                }
            },
            /*连线执行引擎*/
            updateBindControls: function(
                data,
                response = null, //除了api组件返回response，也包括交互中常见的form传入！
                animationParam = [], //参数animationParam = [300]中的300去掉默认参数，不带数字滚动动画！因为需要数字滚动的场景少的多,对正常场景还以为事件重复触发出现BUG
                alwaysAnimHint = false,
                ignoreFlag = '~', //标记为特殊字符"~"，那么对应index索引的bind组件联动设置赋值就被过滤掉！正常调试也适用，"~"特殊标记！
                eventType = null, //230124,相当于event type，触发标记，用来作为传入参数给paramsGenerator识别、判断和过滤，区分不同类型来决定是否执行！
                _innerData = null, //230126,新增参数内部递归使用的，不需要手动传入，由函数体内递归传入，通过_tagToUpper属性可获得类似“员工>0>input-ui5”格式的tag，等同于暴露给上层图元属性的分组group名！
                valueOnly = false, //230607，仅仅用来获取处理后的值，不用来直接setBindControls对外触发，主要给到“获取图元表单数据”工具函数用，通过连线指向就能获取到输入的值！
                extraCached = {} //240227，通常用于状态引用回传，比如valueOnly为true时，这里返回自定义字段，带出值操值是否通过索引解析赋值给到原始对象摸个指定索引。不通过这里回传，很难得到函数的当下处理状态！
            ) {
                data._i_cachedFormDatas = undefined; //240208，用上加载完成后才能用缓存，就先屏蔽掉这里的复位
                if (data == undefined) return;
                if (data._tagToUpper) {
                    let innerTagToUpperTmp = '';
                    if (_innerData && _innerData._tagToUpper) innerTagToUpperTmp = '>a:' + _innerData._tagToUpper;
                    data._tagKeyurl = data._tagToUpper + innerTagToUpperTmp;
                }
                if (data.dm() == null) { //刷新重新加载图纸时，涉及到网络请求的偶尔会进来这里
                    // console.info('图元' + data.getTag() + '已从dm中被移除？？将删除图元，且不执行bindControls操作！', data);
                    data = null;
                    return;
                }
                let controlsTag = data.ca('bindControlsTag'),
                    controlsAttr = data.ca('bindControlsAttr'),
                    controlsVal = i.clone(data.ca('bindControlsVal')), //避免被回写到编辑器的配置导致作为参数时复用出问题
                    paramTag = data.ca('paramControlTag'),
                    paramAttr = data.ca('paramControlAttr'),
                    paramEvent = data.ca('paramBindEvent'), //230805，事件 //tips231130，貌似这里paramBindEvent参数没用，目前用的是_bindEvents_x
                    upperDataTmp = i.upperData(data);
                //231226，对于连线删除，但是配置还在的情况，不执行，且弹出报错
                if (controlsTag && controlsTag.length > 0 && (i.getChildLines(data).length != controlsTag.length)) {
                    let errorInfo = `连线操作失败，连线配置项异常！\n发生组件：${data.getDisplayName()}\n发生位置：${data.dm()._url}\n`;
                    i.alert(errorInfo, '错误', false, null, null, [360, 240]);
                    console.error(errorInfo + i.commonTip(data));
                    return;
                }
                //230225，1) 当前bindConorols的一次for循环各个索引时，用于多个索引之间相当于做函数的多个入参判断，任何一个invalid，就不触发后面函数的执行！
                let eventGroupHasIndexInvalid = {}; //存放key为1、2、3这样的index数字的字符串，value为true/false，期间任何一个没有return或return undefined，那么这组就不执行了！
                controlsTag && controlsTag.forEach((tag, index) => {
                    let valFieldTmp = controlsVal ? i.indexAssure(controlsVal, index) : (i.isFuncTypeControl(data) ? undefined : null), //等同于controlsVal[index]
                        paramTagFieldTmp = paramTag ? i.indexAssure(paramTag, index) : null,
                        paramAttrFieldTmp = paramAttr ? i.indexAssure(paramAttr, index) : null,
                        paramEventTmp = paramEvent ? i.indexAssure(paramEvent, index) : null, //230805，新增的事件  //tips231130，貌似这里paramBindEvent参数没用，目前用的是_bindEvents_x
                        controlObj = d(data.dm(), tag),
                        controlAttr = controlsAttr[index], //新追加的暂时未通过i.indexAssure过一道
                        valArrIndex = null; //230314，要对数组属性某个索引进行赋值时，controlVal里对应的valFieldTmp首选需要是大于等于0的正数或其字符串，放这里备份！
                    paramRetValtmp = null; //230605，移动了位置，方便函数整体后面用到
                    if (!controlObj) {
                        i.alert(`索引为${index}的连线，目标组件配置标签${tag}不存在！` + _i.commonTip(data), '错误', false, null, null, [320, 200]);
                        return;
                    }
                    let pObj = paramTagFieldTmp ? d(data.dm(), paramTagFieldTmp) : data;
                    console.assert(pObj);
                    if (!valueOnly &&
                        _innerData && _innerData._tagKeyurl && //1）是内嵌连线操作辐射过来
                        !pObj.ca('useInnerEventsAll') && //2）容器没有勾选允许内嵌事件通过useInnerEventsAll
                        (
                            !paramAttrFieldTmp || //3.1）没有反向关联属性
                            paramAttrFieldTmp.indexOf(_innerData._tagKeyurl) == -1 //3.2）或者有反向关联属性，而且不包含内嵌的信息段，不论是属性还是函数。
                        )
                    ) {
                        let isNextPartialMatchedInner = false;
                        paramAttr.slice(index + 1).forEach(paramAttrNext => { //240210，从下一个索引的连线关联属性开始来判断。
                            if (paramAttrNext && paramAttrNext.indexOf(_innerData._tagKeyurl) != -1) isNextPartialMatchedInner = true; //240210，注意，这里并没有严格判断关联事件属性，而是大致判断来过滤，不是过滤所有多余的操作！
                        });

                        if (!isNextPartialMatchedInner) {
                            controlsVal[index] = ignoreFlag; //忽略连线执行！
                            return; 
                        }
                    }
                    let bindOldValue = i.getValueUpperFormed(controlObj, controlAttr);
                    //备份下给setBindControl用，避免耗时再查一遍！
                    if (!controlObj._i_attrValue) controlObj._i_attrValue = {};
                    controlObj._i_attrValue[controlAttr] = bindOldValue;

                    //tips 240727，暂存原始配置的静态值。
                    if (!data._i_rawControlVals) data._i_rawControlVals = [];
                    let valFieldForNNIntBackup = null; 
                    //230314，为了支持非数组的动态值，结合非负整数静态值作为索引，来对数组属性的某个索引进行赋值！(前提是属性原先必须是数组类型，至少也是空数组）
                    if (i.isStringNumber(valFieldTmp) && i.isNNInt(Number(valFieldTmp))) {
                        valFieldForNNIntBackup = valFieldTmp; //240727，对于前后都不是数组，但是解析复制为整数或对应字符串时，需要能正常输出该数字！这里备份一下，前后都不是数组，交给下年专门判断
                        valArrIndex = Number(valFieldTmp);
                    }
                    //240726，去掉这里的条件，否则会导致连线对外操作，解析复制为数字/布尔对应的数字字符时，
                    else { //230902，存放原始配置的静态值，用于支持对于有反向关联属性时，也能通过静态值来做xxx.xxx.xxx的形式做解析，再对目标组件的属性做赋值！而此前只有未反向关联时才能解析。
                        i.setArrayIndexValue(data._i_rawControlVals, index, valFieldTmp);
                    }
                    if (valFieldTmp == ignoreFlag || (valFieldTmp == '!' + ignoreFlag)) {
                        console.error(`WARN: bindControlVal is ${valFieldTmp}, and will be ignored!!`);
                        return;
                    }

                    //为了方便获取本图元组件的属性，可以留空，paramControlTag中省去填充，当是空时默认用本图元组件的tag来处理
                    //230219，做成了内部函数，后面要复用，共同维护
                    function __bindParamAutoTag(idx) {
                        let tagtmp = paramTag ? i.indexAssure(paramTag, idx) : null;
                        if (tagtmp == undefined /* && tagtmp != null*/ ) return i.autoTag(data);
                        else return tagtmp;
                    }
                    paramTagFieldTmp = __bindParamAutoTag(index);
                    if (paramAttrFieldTmp != null && controlObj != null) { //230212，数组末尾追加一位：valFieldTmp，即操作设定的固定值部分（如果有）
                        controlObj._paramFromTagAttr = [paramTagFieldTmp, paramAttrFieldTmp, controlAttr, valFieldTmp];
                    }
                    if (data._paramFromTagAttr &&
                        data._paramFromTagAttr.length >= 3 &&
                        paramAttrFieldTmp != null
                    ) {
                        let valFromNodeTag = data._paramFromTagAttr[0], //操作当前图元属性赋值过来用的是哪个图元的哪个属性
                            valFromNodeAttr = data._paramFromTagAttr[1], //同上
                            valToAttr = data._paramFromTagAttr[2], //操作当前图元的哪个属性
                            valFromNodeVal = data._paramFromTagAttr[3]; //230212，新增加的操作值（固定值部分，未经过cb paramGenerator处理过的）
                        if (
                            data.ca('useAttrCORS') && //240206，新增同源操作属性配置项，默认关闭！！因此注意，此前用到该特性的浙大窑炉的几个曲线公共配置弹窗，需要更新对话框并且勾选这个属性才行。
                            paramAttrFieldTmp == valToAttr && //赋值要用的当前组件的属性，刚好是此前被from组件操作当前组件的属性
                            tag != valFromNodeTag && //对外操作to图元的tag，不是当前图元被操作时传值的tag
                            (controlsVal[index] == null || controlsVal[index] == ignoreFlag) && //bindControlsVal为默认的null，没设置任何内容；如果有任何设置（即使为空""），则会被正常赋值，不会被过滤掉！
                            i.typeMatched(data, 'dlg') && //230420，将controlObj.getDisplayName()判断改成data.getDisplayName()，因为当前是回写阶段，所以自由自身才是对话框而不是操作目标为对话框！
                            valFromNodeVal != "*" && //220212，新增条件，相对于~是过滤，*则是对于表单提交回写时，忽略“同源”机制，可以将原先打开属性过来查看/编辑的属性值，派发给任意其他外部任何连线操作的图元！
                            paramAttrFieldTmp.slice(-8) != 'userData' //tips added 230417，对于userData属性的连线传递对象，通常就是用来被外部上游操作和操作外部下游而不会回写！因此这里指定排除userData属性！
                        ) {
                            console.warn('忽略推送，', tag, controlAttr);
                            controlsVal[index] = ignoreFlag; //注意，回写后，值不再是null，就不会再次进入，需要回退删除值为null
                            return;
                        }
                    }

                    //先经过常量变量化
                    if (paramTagFieldTmp && paramAttrFieldTmp) {
                        paramRetValtmp = i.getValueUpperFormed(d(data.dm(), paramTagFieldTmp), paramAttrFieldTmp);
                        if (paramRetValtmp != undefined || (i.isFuncTypeControl(data) && paramAttrFieldTmp.slice(-8) != 'onOutput')) valFieldTmp = paramRetValtmp;
                        if (paramRetValtmp == undefined && i.np(paramAttrFieldTmp) == 'userData') valFieldTmp = data;
                    }


                    //231218，断点调试v1.0
                    let edgeLineData = i.getEdgeLineByIndex(data, index);
                    if (
                        (
                            data.a('_debugPointLine') || //当前图元有勾选连线操作断点
                            edgeLineData && edgeLineData.a('_debugPointLine') //或者其某个连线有勾选断点
                        ) && (
                            data.ca('index') === undefined ||
                            edgeLineData && edgeLineData.ca('index') === index
                        )
                    ) {
                        console.error(`调试中：`,
                            data,
                            `\n执行前：------------------------`,
                            `\n组件名称：${data.getDisplayName() + (data.a('_debugPointLine') ? '√→': '→')} ${edgeLineData && edgeLineData.getDisplayName() + (edgeLineData && edgeLineData.a('_debugPointLine') ?  '√' : '.')} \n所在页面：${data.dm()._url} \n新   值：${paramRetValtmp}`, '\n连线索引：', index, `\n目标组件：`, controlObj, '\n旧   值：', bindOldValue, `\n操作事件：`, eventType, `\n调用堆栈：`, new Error().stack
                        );
                        debugger;
                    }
                    //再将获得值经过函数处理
                    try {
                        let cb = new Function('return ' + data.ca('paramsGenerator'))();
                        //240607，为了兼容简化删减版属性！！
                        if (!cb) cb = function(data, val, index, node, oldVal, form, type, inner) {
                            return val;
                        }

                        let control = {
                            obj: controlObj, //传入要操作的图元对象，以及当前要操作的属性名，让paramsGenerator更方便处理逻辑
                            attr: controlsAttr[index],
                        };
                        let passtmp = true;
                        let paramCtrlAttrIsFunc = paramAttrFieldTmp && i.lower(i.getBindedAttrValueType(data, paramAttrFieldTmp)) == 'function' && paramTagFieldTmp == data.getTag(),
                            isParamCtrlIsFunc = i.isFuncTypeControl(d(data.dm(), paramTagFieldTmp));    //240905，关联组件是否是函数组件，函数组件的undefined可以直接输出！
                        //230217,提取出来的公共函数（内容实现未变），通过paramAttr绑定的回调函数执行的值，如果有就回写更新到valFieldTmp中
                        function __updateValFieldByParamAttrCb() {
                            if (cb) {
                                let ret = cb(data,
                                    /*valFieldTmp*/
                                    "when you see this,please be careful not to use any parameter    other than type,because it is used to filter out fault bindControls fires for events that are not current,and use type to determine if current index matches the type of event that should be fired,if not,simply return,or return undefined.",
                                    /*231207，由之前的i.getValue()改成新的并传入true，这样兼容了getValue同时保证初始加载时获取的是上层form绑定的属性值，而不是当前层属性配置值，避免上层form绑定并初始向下同步的先后顺序不对，
                                    触发内嵌页连线执行导致以来的值不正确！*/
                                    index, control.obj, i.clone(bindOldValue), response, eventType, _innerData ? _innerData._tagToUpper : null);
                                if (ret !== undefined) {
                                    if (isObject(data.ca(i.np(paramAttrFieldTmp)))) {
                                        console.error('WARN', i.commonTip(data), 'attr', i.np(paramAttrFieldTmp), 'objected type will be changed to undefined automaticlly!')
                                        data.ca(i.np(paramAttrFieldTmp), undefined);
                                    }

                                    let paramAttrCb = new Function('return ' + data.ca(i.np(paramAttrFieldTmp)))();
                                    let resulttmp = paramAttrCb ? paramAttrCb( //按照i.innerCallback支持的回调函数参数格式来：data、gv、cache、value、extra
                                        data, //给当前图元对象
                                        data._gv, //渲染元素容器图元有在loadDisplay中备份_gv作为属性
                                        data.__cache, //渲染元素容器图元有在loadDisplay中备份__cache作为属性
                                        response, //230217，原先是给上层图元的最新的form，现在修改成保持原始值即底层图元事件传递过来的原封不动！
                                        null
                                    ) : null; //注意，如果是给undefined而不是null，那么不仅不会传值，还压根不会触发过去！
                                    if (resulttmp !== undefined && resulttmp != null) valFieldTmp = resulttmp;
                                    else {
                                        valFieldTmp = response;
                                    }
                                }
                            }
                        }
                        /*如果绑定的paramControlsAttr是当前图元的回调函数属性，即使未传入_innerData（即当前图元的触发而并非内嵌图元的bindControl触发）,也默认过滤掉！是否过滤取决于接下来判断*/
                        if (_innerData || paramCtrlAttrIsFunc) passtmp = false;

                        //230219，放到外层公用，不论是内嵌的事件过来，还是当前层的事件过来，只要是做了事件的反向关联绑定，都要进行判断和过滤！不一致的不放行，避免误触发！
                        function __invokeParamAttrBindedEventCb(node) {
                            //240220，这里将paramAttrFieldTmp.indexOf(eventType) != -1改成了===，因为发现鼠标格onDoubleClick和onLastButtonClick等，包含了onXXXClick，因此indexOf()都能匹配，导致误操作了！！！
                            let isEventTypeMatching = i.np(paramAttrFieldTmp) === i.np(eventType) //paramAttrFieldTmp.indexOf(eventType) != -1;
                            if (isEventTypeMatching) __updateValFieldByParamAttrCb();
                            else if (!valueOnly) { //231109，添加条件!valueOnly，这样只测试获取触发值时，避免得到被过滤后的值！
                                passtmp = false; //不匹配时，不再进入到paramGenerator
                                valFieldTmp = ignoreFlag;
                                console.warn('WARNING:', 'Arrived eventType', '"' + eventType + '"', 'of', i.autoTag(node), 'dismatch with the current', '(', index, paramTagFieldTmp, paramAttrFieldTmp, ')', ',and will be ignored!');
                            }
                        }
                        let passAllInnerEventsTmp = false;
                        if (data.ca('useInnerEventsAll') == true && _innerData != null) {
                            //对于原先有设定值的，比如对话框显示而设定bindControlVal静态值1/true，保持设定值而不会自动当成form表单！
                            if (valFieldTmp == ignoreFlag || valFieldTmp == null) valFieldTmp = data.ca('pureFormValues') ? i.getFormValues(data) : i.getFormDatas(data);
                            passAllInnerEventsTmp = true;
                            passtmp = true;
                        }
                        if (_innerData && paramCtrlAttrIsFunc) { //1）如果是内嵌图元过来的
                            let noTagKeyUrlYet = _innerData._tagKeyurl == undefined;
                            if (noTagKeyUrlYet) {
                                console.warn(_innerData.getTag(), 'has no tagKeyUrl yet??', paramAttrFieldTmp, _innerData);
                                let formAttrFound = false,
                                    formAttrsTmp = i.getFormDatas(_innerData);
                                //240131，试图用i.forEach代替arr.forEach以提高性能。
                                i.forEach(Object.keys(formAttrsTmp), attrtmp => {
                                    if (paramAttrFieldTmp.indexOf(attrtmp) != -1) formAttrFound = true;
                                });
                                if (formAttrFound == false) {
                                    noTagKeyUrlYet = false; //本来应该是直接设置paastmp为false，但是因为是问题修复代码，最好不要对下面有影响，因为紧接着对passtmp赋值这里提前赋值了无意义！
                                    console.info(_innerData.getTag(), 'has no corresponding form binding!')
                                }
                            }
                            //240620，paramAttrFieldTmp加上i.np()，因为现在连线操作支持了前面带上a:、s:这种前缀了！
                            passtmp = noTagKeyUrlYet ? true : i.np(paramAttrFieldTmp).indexOf(_innerData._tagKeyurl) == 0; //绑定变量是回调函数，且keyUrl的开头就是tagToUpper时，匹配成功！
                            if (!passtmp) {
                                valFieldTmp = ignoreFlag; //赋值给valFieldTmp为undefined或忽略标记值，则对应索引的联动触发赋值 会被过滤掉！
                                console.warn(`WARN: edge line ${index} of node ${data.getDisplayName()} has been rejected!`);
                            } else __invokeParamAttrBindedEventCb(_innerData);
                        } else if (paramCtrlAttrIsFunc) {
                            passtmp = true; //加上pass，才能下一步进入到paramGenerator中处理，可能都会过滤掉下面__updateValFieldByParamAttrCb做的赋值，如果paramGenerator直接return或return undefined的话！
                            __invokeParamAttrBindedEventCb(data);
                        } else {
                            //不是内嵌图元传递过来的bindControls操作事件，也未用自身事件函数来方向关联的常规事件触发走这里，默认全开放，也不校验eventType，需要用户业务逻辑自行判断！
                            let __getAttrType = i.getAttrType;
                            function __getAgentEventInfo(currentIndex) {
                                function __exist(idx) {
                                    return paramAttr[idx] != undefined &&
                                        __getAttrType(d(data.dm(), __bindParamAutoTag(idx)), paramAttr[idx]) == 'Function';
                                }
                                //最后一个
                                if (currentIndex == controlsTag.length - 1) {
                                    return [__exist(currentIndex) ? paramAttr[currentIndex] : null, currentIndex]
                                }
                                //当前起的下一个到最后一个
                                for (let i = currentIndex + 1; i < controlsTag.length; i++) {
                                    if (__exist(i)) return [paramAttr[i], i]; //找到后面索引中第一个满足事件函数反向关联这个条件的，返回其反向关联的函数
                                }
                                //如果没有找到，就返回null
                                return [null, null];
                            }
                            let agentInfo = __getAgentEventInfo(index),
                                agentEventTmp = agentInfo[0],
                                agentIndexTmp = agentInfo[1]; //230225，2) 返回值除了paramAttr对应的type，再加上索引index，用来结合后面paramGenerator返回undefined而放弃执行的情况！
                            if (_innerData && agentEventTmp != null && agentIndexTmp != null) { //230905，加上了条件_innerData，让底层组件的连线不用事件关联代理，但是容器的还是能支持！

                                if (eventType && eventType.trim() != '' && //其后面存在对bool开关类型操作的事件反向关联
                                    agentEventTmp.indexOf(eventType) == -1 //那么如果当前过来的事件，并非是查到的其后面第一个事件，就忽略本次执行！
                                ) {
                                    passtmp = false;
                                    valFieldTmp = ignoreFlag;
                                    console.warn('WARNING: current (', index, paramTagFieldTmp, paramAttrFieldTmp, ') has agent eventType:', '"' + agentEventTmp + '"', ',but', '"' + eventType + '"', 'arrived,and will be ignored!');
                                } else { //230225，3) 到了index索引“组合触发段”内了
                                    if (index <= agentIndexTmp && //连同当前组合段中最后的触发函数的index都进行判断，但是注意，段内的最后一个也就是函数反向关联的index，不会进入到这里的逻辑，而是走前面的__invokeParamAttrBindedEventCb了！
                                        eventGroupHasIndexInvalid['' + agentIndexTmp] === undefined) { //一旦发现此前没有初始化过，那么说明是当前段的第一个进来的index
                                        eventGroupHasIndexInvalid['' + agentIndexTmp] = true; //初始设置为true，后面通过paramGenerator返回值进行覆盖，如果返回undefined，那么就是本组放弃
                                        eventGroupHasIndexInvalid['' + index] = '' + agentIndexTmp; //同时，将自己的索引与代理索引也关联放进去，便于paramGenerator处理中查找！
                                        passtmp = true;
                                    } else if (eventGroupHasIndexInvalid['' + agentIndexTmp] === false) { //任何一个此前对这个变量赋值了false，那么久都自动被过滤掉，不计算、不触发！
                                        passtmp = false;
                                        valFieldTmp = ignoreFlag;
                                        console.warn(`WARN: edge line ${index} of node ${data.getDisplayName()} has been ignored!`);
                                    }
                                }
                            } else { 
                                if (_innerData && !passAllInnerEventsTmp) {
                                    valFieldTmp = ignoreFlag;
                                    console.warn(`edge line ${index} of node ${data.getDisplayName()} has been ignored!`);
                                }
                            }
                        }
                        if (passtmp && cb) {
                            // 230225， 5）最后一步，到了index代表的函数触发调用，前面的index相当于参数，是否存在return undefined的，这里见分晓，是否触发执行！
                            let agentIndexStr = eventGroupHasIndexInvalid['' + index];
                            //如果当前是函数反向关联，并且查询其当前index对应的变量值，非但不是字符串，反而得到false，毫无疑问，捉到了！
                            if (paramCtrlAttrIsFunc && agentIndexStr === false && !passAllInnerEventsTmp) {
                                valFieldTmp = ignoreFlag;
                                console.warn(`WARN: edge line ${index} of node ${data.getDisplayName()} has been ignored!`);
                            } else {
                                //240305，做上标记，如果是func的onOutput关联过来自动解析的值，那么跟其他事件反向关联默认表单数据不一样，这种可提供解析后的值包括数字、布尔等值过来而不仅仅是对象！
                                let isvalueOnOutput = false;
                                if (
                                    _innerData &&
                                    paramCtrlAttrIsFunc &&
                                    paramAttrFieldTmp.slice(-8) == 'onOutput'
                                ) {
                                    //240220，注意，需要用底层图元的值，因为不一定会继承到上层并重写值，尤其是属性继承面板清理掉上层没用的继承时！用底层值，不论是上层重写同步下来，还是底层值向上同步，都能拿到正确的！
                                    let bottomData = i.bottomData(data, paramAttrFieldTmp);
                                    if (bottomData.ca('outputByEvent')) {
                                        console.error(`WARN: outputByEvent attr of inner func data ${_innerData.getDisplayName()} has been checked，and will use output value directly instead of form object!`);
                                        let keyUrlTmp = data._i_rawControlVals[index]
                                        if(typeof(keyUrlTmp) === 'string' && keyUrlTmp.indexOf('a:output') !=  -1 && i.bottomData(data,keyUrlTmp) ===  bottomData){
                                            let attrtmp = i.bottomKeyURL(keyUrlTmp);
                                            data._i_rawControlVals[index] = attrtmp.length >= 9 ?  attrtmp.slice(9) : null;
                                            console.error('WARN:When outputByEvent checked, onOutput association does not need parsing. Current is output keyURL, maybe old version or error and has been automatically ignored.',keyUrlTmp,data);
                                        }
                                        valFieldTmp = bottomData.ca('output');
                                        //240305，标记置位
                                        isvalueOnOutput = true;
                                    }
                                }
                                let oldValTmp = bindOldValue,
                                    oldValCloned3 = i.clone(oldValTmp), //230902，克隆给dbQueryToTreeTable的appendTo用。不用另两个clone，是为了兼容后面的oldValueMerge通用逻辑！
                                    oldValCloned1 = i.clone(oldValTmp), //一个克隆值用于原始的操作属性值传入
                                    oldValCloned2 = i.clone(oldValTmp); //另一个克隆值用于生成新的传入值
                                //230806，每根连线加上多选事件配置后，这里在过滤函数之前来识别处理
                                let bindEventsTmp = data.ca('_bindEvents_' + index),
                                    //事件通过
                                    eventPassAllow = bindEventsTmp === undefined || bindEventsTmp === null || bindEventsTmp == '*' || bindEventsTmp.indexOf(eventType) != -1;
                                if (!eventPassAllow) {
                                    //231006，对于获取值得时候传入，此时没有event项传入，会导致这里获取不到导致获取的值为'~'从而异常！
                                    if (!valueOnly) valFieldTmp = ignoreFlag; //事件不通过时，直接不进入到过滤函数！
                                    else {
                                        console.error(`WARN: edge line ${index} of node ${data.getDisplayName()} has been ignored as no trigger event!`);
                                    }
                                } else{
                                    let newValFieldTmp = cb(data, valFieldTmp, index, control.obj, oldValCloned1, response, eventType, _innerData ? _innerData._tagToUpper : null);
                                    
                                    //240724，如果过滤函数有做逻辑，那么以过滤函数的为准，可以覆盖静态值的内容（静态值配置可以作为参数在过滤函数中用！），通过把data._i_rawControlVals清理掉，让后续处理不以静态值优先来实现目的！
                                    if(valFieldTmp !== newValFieldTmp){
                                        data._i_rawControlVals = undefined;
                                    }

                                    valFieldTmp = newValFieldTmp;
                                }
                                //230314，为了支持非数组的动态值，结合非负整数静态值作为索引，来对数组属性的某个索引进行赋值！
                                //230315，放到生成器函数之后处理，这样代码补充编写的也只是对指定索引值的调整，经过下面处理后才组装成完整操作对外的数组值！
                                if (
                                    valArrIndex != null && //如果原先配置的静态值为非负整数（或对应的字符串）
                                    isArrayFn(oldValTmp) && //且被操纵的属性是数组类型（包含空数组）
                                    //230818，加上了&& valFieldTmp == ignoreFlag，貌似本应该就是首先判断ignoreFlag的
                                    ((valFieldTmp !== undefined || isParamCtrlIsFunc) && valFieldTmp != ignoreFlag) //230810，加上条件，因为上面经过了过滤函数，只要上面过来的有undefined的，那么就过滤不触发！何况事件过滤也是通过undefined在上面设置过滤的！
                                ) { //此时，操作值将变为对原属性数组值指定索引操作后的新数组！
                                    if (
                                        !isvalueOnOutput &&
                                        valArrIndex == valFieldTmp &&
                                        paramRetValtmp == undefined
                                    ) valFieldTmp = response;
                                    let btmNode = i.bottomData(controlObj, controlAttr);
                                    if (
                                        isArrayFn(valFieldTmp) &&
                                        (
                                            controlAttr.slice(-11) == 'paramValues' ||
                                            controlAttr.slice(-9) == 'paramKeys'
                                        ) &&
                                        i.isControlTyped(btmNode, 'api') &&
                                        btmNode.ca('convertFlatToTree') //231210，加上这个条件！只有勾选时才会被扁平化展开！
                                    ) {
                                        i.alert(`api组件的paramsValues属性有动态扁平化属性，对指定索引赋值对象或数组会导致展开！\n当重复对指定索引数组或对象赋值时，不会覆盖替换而会造成数组嵌套！当前发生在组件${paramTagFieldTmp}中索引为${index}的连线操作。\n是否忘记将结构化转换（convertFlatToTree）属性的勾选去掉？`, '警告', null, null, null, [360, 220]);
                                    }
                                    //240714，注意，存在收发器这种没有带发送内容时，传递window对象出去的情况！如果再有接收器将接收内容传递给数组的索引，此时就极容出现问题，在i.clone()调用的地方，就会出现死循环堆栈溢出！
                                    if(i.isWinOrNodeObj(valFieldTmp)){
                                        i.alertError('异常：试图用非常规数据对象对数组索引赋值，将自动忽略！否则可能会导致值拷贝时堆栈溢出！','错误',null,[320,180],data);
                                        console.error('index is:',valArrIndex,'obj is',valFieldTmp);
                                    }else{
                                        valFieldTmp = i.setArrayIndexValue(oldValCloned2, valArrIndex, valFieldTmp);
                                    }
                                    if(extraCached.indexRefered === index) extraCached.isOldValueArrIndexSetted = true; //240227，通常用于工具函数获取组件属性值时，多条连线索引方式操作输入数组，那么这里返回就知道赋值是操作了索引位置填充值！
                                } else if ( //230903，数组取值。同样在bindControlsVal中以0、1、2、3这样数值，如果要操作的是非数组类型，并且数据本身是数组，那么就是获取当前数组的索引取元素对外赋值！
                                    valArrIndex != null && //如果原先配置的静态值为非负整数（或对应的字符串）
                                    !isArrayFn(oldValTmp) && //且被操纵的属性不是数组类型
                                    isArrayFn(valFieldTmp) && //且关联属性是数组类型
                                    valFieldTmp[valArrIndex] !== undefined && //且尝试按照索引给反向关联属性值取元素，值存在

                                    //230818，加上了&& valFieldTmp == ignoreFlag，貌似本应该就是首先判断ignoreFlag的
                                    ((valFieldTmp !== undefined || !isParamCtrlIsFunc) && valFieldTmp != ignoreFlag) //230810，加上条件，因为上面经过了过滤函数，只要上面过来的有undefined的，那么就过滤不触发！何况事件过滤也是通过undefined在上面设置过滤的！

                                ) { //此时，操作值将变为反向关联属性数组按照索引取元素后的值！
                                    valFieldTmp = valFieldTmp[valArrIndex];
                                }
                                else if(valFieldForNNIntBackup !== null){
                                    console.error('WARN: int value',valFieldForNNIntBackup,'in current line with no array typed source and target, will be used as static value instead of index!');
                                    i.setArrayIndexValue(data._i_rawControlVals, index, valFieldForNNIntBackup);
                                }
                            }

                            //230225，4) 查找有没有对应的事件函数反向关联的index代理
                            if (agentIndexStr && typeof agentIndexStr == 'string') { //如果有，能进入到这里，前面肯定已经都是true，或者是当前段内的第一个
                                console.assert(eventGroupHasIndexInvalid[agentIndexStr] == true); //所以断定一定为true，前面初始化的。
                                //230818，加上了|| valFieldTmp == ignoreFlag，貌似本应该就是首先判断ignoreFlag的
                                if (valFieldTmp === undefined || valFieldTmp == ignoreFlag) eventGroupHasIndexInvalid[agentIndexStr] = false; //如果paramGenerator返回undeferend，那么久修改组合段内公共值成false!!
                            }
                        }
                    } catch (error) {
                        console.error('paramsGenerator error!!!', tag, data.getDisplayName(), data.dm()._url);
                        console.error(error, data.ca('paramsGenerator'));
                        valFieldTmp = ignoreFlag;
                        return;
                    }
                    //回写到内存用于最终使用
                    controlsVal[index] = valFieldTmp; //回写
                });

                //231218，断点调试v1.0
                if (
                    data.a('_debugPointLine')
                ) {
                    console.error(`调试中：`,
                        data,
                        `\n执行中：------------------------`,
                        `\n组件名称：${data.getDisplayName()} \n所在页面：${data.dm()._url} \n新 值： ${i.isEdgeLineActive(data) ? controlsVal[data.ca('index')] : controlsVal}`, '\n连线索引：', data.ca('index')
                    );
                    debugger;
                }
                let destVales = (i.hasOperateLines(data,true) || valueOnly) && setBindControls(data, controlsTag, controlsAttr, controlsVal, response, animationParam, alwaysAnimHint, ignoreFlag, valueOnly);

                //是否本次setBindControls都会被过滤忽略掉
                function __allValueIgnored() {
                    let result = true;
                    controlsVal && controlsVal.forEach(indexValue => {
                        if (indexValue != ignoreFlag && indexValue != undefined) result = false;
                    });
                    return result;
                }

                //230128，注意，这里条件加上判断，如果是内嵌进行向上bindControls触发时，没到最上层时，都不复位，否则前面的“忽略推送”逻辑就进不去了！
                if (
                    upperDataTmp == undefined && //到顶层才清理，注意BUG可能性，存不存在某次updaeBindConrols触发逐层线上递归时，同时又来了一个新的当前图元的触发，存在公共变量导致影响？？？
                    (_innerData == null || _innerData != null && __allValueIgnored() == false) && //如果是内嵌图元触发而来，并且通过了内嵌触发上层联动条件，默认是手动的操作，相当于打开的自定义对话框点击确定操作回写设定值！此时闭环完成，可以复位了！
                    data._paramFromTagAttr
                ) {
                    data._paramFromTagAttr = null; //【注意】，完成i.updateBindControls后，复位！避免后续都受影响！
                }
                if (valueOnly /* && upperDataTmp == undefined*/ ) return destVales;
                //230126，逐层向上传递bindControls链表触发组件联动赋值
                function __updateBindControls() {
                    //231217，断言一下，如果上层图元存在，那么data._tagToUpper一定存在，否则此时data.ca('_forbidInherit')肯定有勾选！
                    console.assert(
                        upperDataTmp && (
                            data._tagToUpper !== undefined ||
                            data.ca('_forbidInherit')
                        ) ||
                        !upperDataTmp ||
                        i.isControlTyped(data, 'cbtn') //对于特殊组件，比如图片按钮，里面直接调用了i.updateBindControls()并非是走常规途径，排除在异常提示之外！
                    );
                    let pureFormValuesTmp = upperDataTmp.ca('pureFormValues');
                    return i.updateBindControls(
                        upperDataTmp, //其他传参不变，就这里data，切换成上层图元对象i.upperData(data)即可！！在updateBindControls函数内判断首个参数为null就return掉
                        upperDataTmp ? i.getFormValues(upperDataTmp, pureFormValuesTmp ? 3 : -1, !pureFormValuesTmp) /*i.getFormDatas(upperDataTmp)*/ : response,
                        animationParam,
                        alwaysAnimHint,
                        ignoreFlag,
                        data._tagToUpper ? data._tagToUpper + '>a:' + eventType : eventType,
                        data //内部递归传入，主要是给到上层传递当前bindControl事件的内嵌图纸图元组件，目前主要是通过这个参数获取_tagToUpper
                    );
                }

                //231109，只获取值时，不能异步！！
                if (valueOnly) {
                    return __updateBindControls();
                } else {
                    //231217，加上条件&& !data.ca('_forbidInherit')，对于不对外继承派生的组件，不会逐层向上递归派发事件！
                    if (upperDataTmp && !upperDataTmp._i_preventEventUpper && !data.ca('_forbidInherit')) {
                        if (eventType && eventType.slice(-7) == 'onEvent' && (eventType.indexOf('timer') !== -1 || i.autoTag(data).indexOf('timer') != -1)) { //要求定时器timer的tag标签不能随意动！
                            let bottomNode = i.bottomData(data, eventType);
                            if (
                                i.isControlTyped(bottomNode, 'timer') &&
                                i.rawValue(bottomNode, 'a:start') && //上层继承过去启动的定时器就不管！只要不是底层原本就设置的定时器启动！
                                bottomNode.ca('interval') < 1000 //定时间隔比较大也不管，比如1000ms、1s，就正常能够向上传递！！
                            ) {
                                i.upperDatas(data).forEach(upperNode => {
                                    upperNode._i_preventEventUpper = true;
                                })
                            }
                        } else if (!eventType) {
                            console.error(`has no eventType???`, data.getDisplayName(), data.dm()._url, data);
                        }
                        __updateBindControls();
                    }
                }
            },
            /*231230，从当前容器组件开始，逐层往上直到最顶层，设置其加载完成标记为加载中未完成！通常用于动态加载内嵌页的情况*/
            updateUppersWhileDynamicLoading: function(data, force = false) {
                if (!force && data && (data._i_isCompleteLoaded <= 0 || data._i_isCompleteLoaded === undefined)) {
                    console.error('data is isLoading:', i.commonTip(data));
                    return; //一定要是内嵌加载完成的状态下才行！
                };
                runningMode() && !force && console.assert(data && i.hasInner(data)); // && !data.ca('isLoadingGet') && i.topData(data)._i_isCompleteLoaded);
                //231230，从当前层开始，逐层往上直到最顶层，让计数增1、加载完成状态复位等
                let upperstmp = i.upperDatas(data);
                //231230，要包含当前容器组件一起，都复位成正在加载中、未加载完成且计数为1的状态！
                upperstmp = [data, ...upperstmp]; //240202，将upperstmp.push(data)改成现在这样，为了让当前图元data作为遍历数组的最开始，而不是最后一个！自下而上遍历。
                /*240208，这个标记极为重要，因为内嵌有多个动态加载时，各自要把计数向上同步自增，但是要知道，触底反弹合并机制还在，所以当存在以下嵌套场景时（自左向右 == 自上而下嵌套）
                A ← B ← C ← E 
                        ..← G   //..标识简接嵌套，是通过容器E的display暴露继承到C，然后form绑定设置G的页面url 
                      ← D ← F 
                        ..← H   //同上
                其中C、D、E、F都是容器，G、H是底层页面，B是中间层容器，A是顶层容器，并且E、F是模板容器，display让C、D继承后分别设置G、H路径，然后form绑定。动态加载时，C和D都会执行到
                本函数updateUppersWhileDynamicLoading做逐层向上自增计数，增加到B会计数到2，但是注意，A只会由之前加载完成的0，变成1，而不会也跟B一样是2，因为B到A的后面反弹，是会合并
                的只会反弹一次！因此B需要对于多余的自增计数拦截掉，不再继续线上同步自增操作！*/
                let stopUpperSyncing = false;
                upperstmp.forEach(node => {
                    if (stopUpperSyncing) return; //240208，计数停止线上自增同步！参见上面说明。
                    if (node._multiRequestingLeft === undefined) node._multiRequestingLeft = 0;
                    /*231401，之前是 += 1，后来发现，如果连续先后有调用本函数，就会导致多计数，导致无法反弹完毕！暂时先这样，但是可能
                    存在BUG，比如当前正在加载中！*/
                    node._multiRequestingLeft += 1; //240101.2，处理了tab页签后，在上一句做了断言，此时计数一定是0，然后这里还是恢复计数自加1试试！
                    node._i_isDynamicLoadingLayersUp = true; //240208，存在多个这种动态url继承上层form的情况，避免反弹时被当做兄弟图元组件在加载就又被重复加上计数，因此做上标记
                    if (node.ca('isLoadingGet') === false && node._i_isCompleteLoaded <= 0 /*node._i_isCompleteLoaded === false || node._i_isCompleteLoaded === -1*/ ) {
                        console.error('WARN: update uppers while dynamic loading now，and will change _i_isCompleteLoaded state later', _i.commonTip(data));
                        node._i_isCompleteLoaded -= 1;
                    } else node._i_isCompleteLoaded = false;
                    //240206，移到末尾，否则如果像之前那样放到forEach进来的开头，那么上面判断node.ca('isLoadingGet')就是扯犊子了！
                    node.ca('isLoadingGet', true);
                    //240208，计数停止向上自增同步！参见上面说明。
                    if (node._multiRequestingLeft >= 2) stopUpperSyncing = true;
                });
            },
            //i.updateBindControls的缩写，并且简化部分字段参数传入（采用默认）
            ubc: function(data, form, eventType = null, async = false) {
                //240726，如果没有对外连线，那就不进行后面处理了！奇怪，这么重要的判断，以前竟然一直都没有做！
                if(!i.hasOperateLines(data)) return;
                let topdatatmp = i.topData(data),
                    //240202，将&&topdatatmp._i_isCompleteLoaded改成&&topdatatmp._i_isCompleteLoaded > 0，因为现在有负数！！待测试验证！
                    isTopCompleteLoaded = topdatatmp && topdatatmp != data && (topdatatmp._i_isCompleteLoaded > 0) /*.ca('isLoadingGet')*/ ;
                if (!topdatatmp) return; //231227，增加，避免刷新重加载报错！注意，data本身就是顶层时，i.topData()获得本身，而不是undefined，若是则异常！
                if (!isTopCompleteLoaded && topdatatmp != data && (data._i_isCompleteLoaded <= 0 /*|| data._i_isCompleteLoaded === undefined*/ || async)) {
                    //存放函数，给到逐层反弹加载完毕后再去执行连线逻辑的队列！
                    function __ubc(func, data, formDatas, eventType, async) {
                        // 返回一个新的函数，该函数将原始函数和参数作为闭包存储起来  
                        return function() {
                            // 在备份函数内部，可以访问原始函数和参数  
                            return func(data, formDatas, eventType, async);
                        };
                    }
                    if (!topdatatmp._i_formEventBubblingUppering) topdatatmp._i_formEventBubblingUppering = [];
                    topdatatmp._i_formEventBubblingUppering.push(__ubc(i.ubc, data, form, eventType, false)); //固定传入末尾参数false，这样异步执行就进入到外层else中的i.updateBindControls里
                } else {
                    return i.updateBindControls(data, form, [], false, '~', eventType);
                }
            },
            /*
            24个小时区间，25个时间小时整点时间，形成的数组，用来给历史曲线表（当前起的24小时周期）使用！
            [{
                hour: '01:00',
                section: ['2020-02-11 00:00:00', '2020-02-11 01:00:00']
            },]
            */
            hours24: function(latest = false) {
                let curTime = new Date()
                let hourArr = []
                for (let i = 24; i >= 0; i--) {
                    let timetmp = new Date()
                    timetmp.setHours(curTime.getHours() - i)
                    let curHouerStr = timetmp.Format('hh') + ':00'

                    function hoursBefore(hNum) {
                        let timetmp = new Date()
                        timetmp.setHours(curTime.getHours() - hNum)
                        return timetmp.Format('yyyy-MM-dd hh') + ':00:00'
                    }
                    hourArr.push({
                        hour: curHouerStr,
                        section: [
                            hoursBefore(i + 1),
                            hoursBefore(i)
                        ]
                    })
                    if (latest)
                        return [hourArr.pop()]
                }
                return hourArr
            },
            ts2tm: function(ts = null, format = 'yyyy-MM-dd hh:mm:ss.S') { //230325，传入自定义格式好像有问题，不起作用？？
                if (i.isStringNumber(ts)) ts = Number(ts);
                if (format == false) format = 'yyyy-MM-dd hh:mm:ss'; //传入false时，就是去掉毫秒！
                return (ts == null ? new Date() : new Date(Number(ts))).Format(format);
            },
            tm2ts: function(tm = null) { //不传就是当前时间戳
                return tm == null ? (new Date()).getTime() : (new Date(tm)).getTime();
            },
            /* Demo: 
            createTimePeroid(3, 17, (param) => { //指定截至过去某时间点的17s的跨度内，每间隔3s的请求时间段
                console.error(param);
            }, 's', '2022-12-17 12:27:35.321');

            createTimePeroid(3, 17, (param) => { //指定截至未来某时间点的17s的跨度内，每间隔3s的请求时间段，延时到未来第一段时间终点时触发
                console.error(param);
            }, 's', '2023-12-17 12:27:35.321');

            createTimePeroid(3, 14, (param) => { //当前立刻进行每隔3s周期请求，并且过去的14s的跨度内历史也按间隔生成时间段填充
                console.error(param);
            }, 's');
            */
            createTimePeroid: function(
                timeFreq, //周期时间段数值，结合timeTpye单位，表示1s、3分钟、1h等时间跨度内单个时间段时长
                timeSpan, //周期跨度时长数值，总共的时长跨度，比如5分钟、24小时等
                cbPeriodRequest, //同步回调函数（返回后才进行下一个时间段的请求），当前请求的时间段为传入参数
                timeType = 's', //周期单位,毫秒ms/秒s/分钟m/小时h/天d/月M/年y
                timeTo = null,
                cicleDelay = 350, //历史时间段请求的时间间隔，对于实时滚动，相当于是历史时间段内的初始化。
                _cycle = false) { //内部递归使用，一般不需要用户传入。
                let timeNow = new Date(),
                    timeObject = timeTo ? new Date(timeTo) : timeNow,
                    //A. 开始时间戳
                    timefrom_ts = null,
                    //B. 结束时间戳
                    timeto_ts = timeObject.getTime(), //时间戳精度都为毫秒
                    //C. 当前时间戳
                    timenow_ts = timeNow.getTime(),
                    sizetmp = Math.floor(timeSpan / timeFreq); //取整数，比如3s间隔，时间跨度为10s，那么跟时间跨度为9s是等同的（大于9小于12都等同）

                //【注意】23/01/21，size个区间，应该触发size+1次，比如24小时，那么应该是2个数据，而不是1个（24小时前的），而应该包含当前的
                let latested = false;
                if (sizetmp == 0) {
                    sizetmp = 1;
                    latested = true;
                }
                spantmp = timeFreq * sizetmp; //间隔timeFreq为3s、跨度timeSpan为30s;间隔为1分钟、跨度为5分钟；间隔为1小时、跨度为24小时
                switch (timeType) {
                    case 'ms': //注意，毫秒固定用'ms'
                        timeObject.setMilliseconds(timeObject.getMilliseconds() - spantmp);
                        break;
                    case 's':
                        timeObject.setSeconds(timeObject.getSeconds() - spantmp);
                        break;
                    case 'm':
                        timeObject.setMinutes(timeObject.getMinutes() - spantmp);
                        break;
                    case 'h':
                        timeObject.setHours(timeObject.getHours() - spantmp);
                        break;
                    case 'd':
                        timeObject.setDate(timeObject.getDate() - spantmp);
                        break;
                    case 'M': //注意，月份只能有大写M，小写的为分钟
                        timeObject.setMonth(timeObject.getMonth() - spantmp);
                        break;
                    case 'y':
                        timeObject.setFullYear(timeObject.getFullYear() - spantmp);
                        break;
                    default:
                        console.error('timeType error! only support ms/s/m/h/d/M/y');
                        break;
                }
                timefrom_ts = timeObject.getTime(); //起始
                //D. 间隔频率毫秒
                let timeFreq_ms = (timeto_ts - timefrom_ts) / sizetmp;
                let ftmp = timefrom_ts, //第一段起始
                    ttmp = timefrom_ts + timeFreq_ms; //第一段终止
                let periodtmp = [i.ts2tm(latested ? ttmp : ftmp), i.ts2tm(ttmp)];
                //【注意】23/01/21 结合上面size+1兼容问题！！
                if (latested == true) sizetmp = 0;
                if (ttmp <= timenow_ts) { //历史时间段，都以周期定时请求
                    if (sizetmp >= 1) { //没有到最后一个时间段时；【注意】23/01/21，从原先size > 1改成 >= 1
                        _i.setTimeout(() => {
                            /*传入参数除了timeSpan跟开始传入完全一样，如果之前传入timeTo为null，那么这里也是null。传入timeSpan减去一个间隔周期
                            timeFreq再传入，这样再次进入的时，根据timeto_ts倒推，相当于就自动到了下一个段，避免死循环（因为cicleDelay小于timeFreq）*/
                            i.createTimePeroid(
                                timeFreq,
                                timeSpan - timeFreq, //长度去掉本次已经处理的，时间终点保持不动时，往回跨过span后起始时间点就到了下一段的开始
                                cbPeriodRequest, timeType,
                                timeTo ? timeTo : timeto_ts, //时间终点始终保持初始传入的；
                                cicleDelay,
                                timeTo == null ? true : _cycle //初始没有传入timeTo时，就是true，表明要循环；如果timeTo有传入值，就用前一次循环传入的_cycle值
                            );
                        }, cicleDelay);
                    } else if (sizetmp == 0) { //到了处理最后一个时间段时；【注意】23/01/21，从原先size == 1改成 == 0
                        let timetmp = timenow_ts - ttmp; //当前时间与最后一段的末尾时间的时间差
                        let timeouttmp = null;
                        if (timetmp < timeFreq) timeouttmp = timeFreq - timetmp; //如果时间差小于一个时间段周期，那么就延时等待到达这个周期
                        else timeouttmp = cicleDelay; //如果时间差大于一个时间段周期（通常初始化时cicleDelay和cbPeriodRequest处理延时比较大时），那就小时间间隔延时，当历史数据初始化处理
                        (_cycle || !timeTo) && _i.setTimeout(() => { //需要动态滚动时，第一次处理末尾段，以及周期性处理时
                            i.createTimePeroid(
                                timeFreq,
                                timeSpan, //准备周期请求时，经过时间延时后，确保了时间段间隔肯定是大于一个周期的，而此时的timeSpan经过自减后就剩大于等于一个周期了
                                cbPeriodRequest, timeType,
                                timeto_ts + timeFreq_ms, //请求下一个周期的时间段的末尾时间，就是当下末尾时间加上一个周期，那么长度只会是1，后面周期请求都会进入到这里
                                cicleDelay, true);
                        }, timeouttmp);
                    }
                    cbPeriodRequest(periodtmp, 1 - sizetmp); //第二个参数为：-23、-22、-21、……、0这样负索引！当初始为传入toTime、自动周期时，后面的每个按最新时间实时传入时带的索引就固定为0了！
                } else { //当前段的目标时间段为未来时间，延时等待到未来时间点到，能够触发时再调用
                    _i.setTimeout(function() {
                        i.createTimePeroid(timeFreq, timeSpan, cbPeriodRequest, timeType, timeTo, cicleDelay, _cycle);
                    }, ttmp - timenow_ts);
                }
            },
            //在数组中查找所有出现item，并返回一个包含匹配索引的数组
            arrFindAll: function(arr, item) {
                var results = [],
                    len = arr.length,
                    pos = 0;
                while (pos < len) {
                    pos = arr.indexOf(item, pos);
                    if (pos === -1) { //未找到就退出循环完成搜索
                        break;
                    }
                    results.push(pos); //找到就存储索引
                    pos += 1; //并从下个位置开始搜索
                }
                return results;
            },
            /*
            console.error(JSON.stringify(i.arrOrdered(
                [{
                    ts: 2,
                    value: 123
                }, {
                    ts: 1,
                    value: 456
                }, {
                    ts: 3,
                    value: 789
                }, {
                    ts: 1,
                    value: 0
                }]
            ), undefined, 2));
            输出如下：
            [
                {
                    "ts": 1,
                    "value": 456
                },
                {
                    "ts": 1,
                    "value": 0
                },
                {
                    "ts": 2,
                    "value": 123
                },
                {
                    "ts": 3,
                    "value": 789
                }
            ]
            */
            arrOrdered: function(arr, idField = 'time') {
                let idstmp = [],
                    idsRawTmp = []
                arrSortedTmp = [];
                // 20.2.6，直接支持数组内对象字段的比较来排序
                arr.sort((a, b) => {
                    return a[idField] - b[idField];
                })
                return arr; //arrSortedTmp;
            },
            /*js 数组array自带的方法，根据数组中对象[{},{}]字段的key和value来匹配第一个满足条件的对象或索引index
            tips 230315：注意，key，value并非是对象数组中对象内的字段key和字段value，即便通常有value字段！此value非彼value！
            当前value仅仅指对应key的值，而key可以是对象的任何字段，包括value（如果有），相当于让value字段的值等于传入value的
            情况，示例：传入的arr数组为如下内容：
            [
                {
                    name: '事故灾害',
                    value: 2
                },
                {
                    name: '设备故障',
                    value: 41
                },
                {
                    name: '自然灾害',
                    value: 31
                },
            ]
            以下调用，是找到name字段为“设备故障”的对象，并且让其内的value字段值自增1，注意，这里就内部value字段和传入值value就毫不相干了！
             i.arrFind(project.emergenciesData.pieData,'name','设备故障').value += 1;
            tips 240113，注意，当前是返回匹配到的第一个对象{}或undefined，有多个匹配时并非返回数组！！！
            tips 240115，支持对象查找：
            let item = {a:1,b:2}
                obj = [{c:item,d:0},{c:{a:2,b:3},d:1}]
            i.arrFind(obj,'c',item)，能够正常输出：{c:{a:1,b:2},d:0}，如果传入的item对象改成{a:1,b:2}，看着内容相同，但是引用变了，没找到则返回undefined
            */
            arrFind: function(arr, key, value) {
                return arr.find(object => object[key] === value);
            },
            /*230224，传入多个字段的key-value，匹配满足条件的数组中的item，相当于在数据库返回结果中，条件过滤，array.find只返回匹配的第一个
            而array.filter()则可以返回数组，包含查到的所有的！*/
            arrFilter: function(arr, condition = {}) { //传入多个key:value，作为限定约束条件
                if (arr == undefined || !isArrayFn(arr)) {
                    console.error('array empty or invalid:', arr);
                    return undefined;
                }
                return arr.filter(object => {
                    let match = true;
                    for (let key in condition) {
                        if (object[key] !== condition[key]) match = false;
                    }
                    return match;
                });
            },
            arrFindIndex: function(arr, key, value) {
                return isArrayFn(arr) ? arr.findIndex(object => object[key] === value) : -1;
            },
            //231225，数组元素移动到指定索引，toIndex为-1时为移动到末尾！
            arrItemMoveTo: function(arr, item, toIndex = -1) {
                let index = arr.indexOf(item);
                if (index !== -1) {
                    let lefttmp = arr.splice(index, 1);
                    if (toIndex == -1) {
                        arr.push(item);
                    } else {
                        arr.splice(toIndex, 0, ...lefttmp);
                    }
                }
                return arr;
            },
            /*230420，移除数组中的空值，对于delete 数组中某个索引后，会留下这样的空值！有别于对象key的delete*/
            arrEmptyRemoved: function(array, backWrite = true, emptyStrInclude = true) {
                if (!isArrayFn(array)) return array; //如果不是数组，不影响不做任何处理，原样返回！
                let arrtmp = array.filter(function(element) {
                    return element !== undefined && element !== null && (emptyStrInclude ? element !== "" : 1);
                });
                backWrite && i.overWrite(array, arrtmp);
                return arrtmp;
            },
            /*230416，字符串中查找标记段字符（串），返回所有出现位置的索引index列表。使用示例：
            var indices = getIndicesOf("le", "I learned to play the Ukulele in Lebanon."); 
            输出：[2, 25, 27, 33]*/
            stringFlagIndexs: function(str, flag, caseSensitive = true) {
                var searchStrLen = flag.length;
                if (searchStrLen == 0) {
                    return [];
                }
                var startIndex = 0,
                    index, indices = [];
                if (!caseSensitive) {
                    str = str.toLowerCase();
                    flag = flag.toLowerCase();
                }
                while ((index = str.indexOf(flag, startIndex)) > -1) {
                    indices.push(index);
                    startIndex = index + searchStrLen;
                }
                return indices;
            },
            /* 230416，souece 原字符串 start 要截取的位置 newStr 要插入的字符，使用
                this.insertString('20220808', 4, '-') // 2020-0808*/
            insertString: function(source, start, newStr) {
                return source.slice(0, start) + newStr + source.slice(start)
            },
            //230617，arr数组指定索引插入对象，函数别名。其实插入可以用更简单的splice，但是由于此前有实现，就兼容用之前的
            arrInsert: function(arr, index, obj) {
                /*240214，测试发现用i.setArrayIndexValue，如果在中间索引存在，那么会替换覆盖而不是插入，如果传入索引大，则多出的自动填空，
                对于arr.splice()，则是自动插入，不会覆盖！如果索引大于长度，不管大多少，就在最后末尾追加，而不会根据索引自动创建空的！*/
                i.setArrayIndexValue(arr, index, obj);
                // return arr.splice(index, 0, obj);
            },
            //230813，arr数组追加元素时，如果指定字段，要添加的对象在原先元素中存在且值一样，则删除掉值一样的
            arrPushUnique: function(arr, field, obj, removeNull = true) {
                let indexTobeRemoved = [];
                arr.forEach((item, index) => {
                    if (
                        (removeNull && (item === null || item === undefined)) ||
                        (item && isObject(item) && obj[field] != undefined && obj[field] === item[field])
                    ) indexTobeRemoved.push(index);
                });
                i.arrayIndexRemoved(arr, indexTobeRemoved);
                arr.push(obj);
                return arr;
            },
            /*ChatGPT给的功能函数：js字符串中英文全角半角混合的的，如何转换成多行并且显示上宽度多行对其，给一个代码，要支持每行宽度可调，示例如下：
            var str = '欢迎使用 JavaScript。这是一个用于将混合的中英文字符串转换为多行显示并对齐的函数。可以自定义每行的长度和显示的空格数量。';
            convertToMultiLines(str, 40); // 将字符串转换为多行，每行长度为20
            '欢迎使用 JavaScript。这是一个用于将混合 \n的中英文字符串转换为多行显示并对齐的函数\n。可以自定义每行的长度和显示的空格数量。'*/
            stringToMultiLines: function(str, lineLength) {
                if (!str || str == '') return '';
                str = _i.replaceAll2(str, '\n', '<br>');

                var lines = [];
                var currentLine = '';
                var currentLength = 0;
                for (var i = 0; i < str.length; i++) {
                    var char = str.charAt(i);
                    if (char === '\n') { // 处理换行符
                        lines.push(currentLine);
                        currentLine = '';
                        currentLength = 0;
                    } else if (/[^\x00-\xff]/.test(char)) { // 处理中文字符
                        if (currentLength + 2 > lineLength) { // 如果当前行长度已达到限制，则放入新行
                            lines.push(currentLine);
                            currentLine = '';
                            currentLength = 0;
                        }
                        currentLine += char;
                        currentLength += 2;
                    } else { // 处理英文字符
                        if (currentLength + 1 > lineLength) { // 如果当前行长度已达到限制，则放入新行
                            lines.push(currentLine);
                            currentLine = '';
                            currentLength = 0;
                        }
                        currentLine += char;
                        currentLength += 1;
                    }
                }
                lines.push(currentLine); // 将最后一行加入到结果中
                var result = lines.map(function(line) { // 将结果数组转换为字符串
                    var spaces = '';
                    var spaceCount = lineLength - line.replace(/[^\x00-\xff]/g, '  ').length; // 计算需要填充的空格数
                    for (var i = 0; i < spaceCount; i++) {
                        spaces += ' ';
                    }
                    return line + spaces;
                }).join('\n');
                return result;
            },
            /*
            输入比如：
            [
                {
                    "name": "安防设备",
                    "value": 1,
                    "children": []
                },
                {
                    "name": "安防设备",
                    "value": 2,
                    "children": []
                },
                {
                    "name": "安防设备",
                    "value": 3,
                    "children": []
                },
                {
                    "name": "消防设备",
                    "value": 4,
                    "children": []
                },
                {
                    "name": "安防设备",
                    "value": 5,
                    "children": []
                }
            ]
            对应输出为：
            ["安防设备","消防设备"]
            */
            arrKeyTypes: function(arr, field = 'name') {
                console.assert(isArrayFn(arr));
                let result = [];
                arr.forEach(item => {
                    let valtmp = item[field];
                    if (valtmp == undefined) {
                        console.error('WARNIN: field', field, 'not exist in current item:', item, arr);
                        return;
                    }
                    if (result.indexOf(valtmp) == -1) result.push(valtmp);
                });
                return result;
            },
            /*231003，查找{'abc':1,'efg':2}，查找字段key存在'fg'的字段key列表！参数partial默认为false，严格相等；传入true时，部分匹配即可！
            也支持传入数组['abc','efg']这样来查找包含'fg'这样的元素。
            增加回到参数indexsCb，通常用于在obj为数组传入时，return直接返回keys列表的同时，作为补充，回调返回idxs列表！*/
            objKeysFind: function(obj, key, partial = false, indexsCb = []) {
                let keys = [],
                    arrtmp = [];
                if (isArrayFn(obj)) arrtmp = obj;
                else arrtmp = i.keys(obj);
                i.forEach(arrtmp, (k, idx) => {
                    if (k === null || k === undefined) return;
                    k = k.toString(); //首先强制转字符串，key当然都是字符串，但是如果传入过来的是Object.values()，值就不一定都是字符串了！
                    if (partial && k.indexOf(key) != -1) {
                        keys.push(k);
                        indexsCb.push(idx);
                    } else if (!partial && k == key) {
                        keys.push(k);
                        indexsCb.push(idx);
                    }
                });
                return keys;
            },
            /*230617，获取数组对象元素指定字段的值列表，按照数组顺序依次排序，比如用来获取symbolObj.dataBindings对应的属性定义列表的attr的所有属性名。
            对于常规的数组[{},{},{}]，按照索引获取指定字段值的数组*/
            arrKeyValues: function(arr, field = 'name') {
                console.assert(isArrayFn(arr));
                let result = [];
                arr.forEach(item => result.push(item[field]));
                return result;
            },
            arrKeysAll: function(arr, idField = 'time', idString = false) {
                let keystmp = {}
                arr && arr.forEach(item => {
                    item && item.forEach(jtem => {
                        keystmp[String(jtem[idField])] = null
                    })
                });
                let keysRaw = i.keys(keystmp),
                    keysNum = [],
                    keysStr = [];

                keysRaw && keysRaw.forEach(tstmp => {
                    keysNum.push(Number(tstmp));
                    keysStr.push(i.ts2tm(tstmp) ? i.ts2tm(tstmp) : String(tstmp));
                });
                return idString ? keysStr : keysNum;
            },
            //240506，比如[2,3,3,1,5,3,4,3]，查询到有四个3
            arrMatchCount: function(arr, value) {
                return arr.filter(item => item === value).length;
            },
            //231130，获取对象数组中，所有对象字段key的并集，比如输入为[{a:1,b:2},{a:3},{b:4,c:5,d:6},{e:7}]，输出为[a,b,c,d,e]
            arrFieldsAll: function(arr) {
                let ret = [];
                arr.forEach(item => {
                    for (let key in item) {
                        if (ret.indexOf(key) == -1) ret.push(key);
                    }
                });
                return ret;
            },
            /*240804，by gpt
            如果传入true，我们需要找出任意两个对象之间的公共字段。
            如果传入false，我们需要找出所有对象都有的字段。示例：
            const objects = [ 
                {a: 1, b: 2, c: 3}, 
                {a: 4, b: 5}, 
                {b: 6, d: 7} 
            ]; 
            console.log(findCommonFields(objects,  true)); // 输出: ['b'] 
            console.log(findCommonFields(objects,  false)); // 输出: ['a', 'b'] */
            arrFieldsCommon: function(arr,allRequired = false){
                let objects = arr;
                if (objects.length  === 0) return []; 
                let commonFields = new Set(Object.keys(objects[0]));  
                if (allRequired) { 
                    // 找出所有对象都有的字段 
                    for (let obj of objects) { 
                    commonFields = new Set([...commonFields].filter(field => obj.hasOwnProperty(field)));  
                    } 
                } else { 
                    // 找出任意两个对象之间的公共字段 
                    let fieldCounts = {}; 
                    for (let obj of objects) { 
                    for (let field of Object.keys(obj))  { 
                        if (!fieldCounts[field]) fieldCounts[field] = 0; 
                        fieldCounts[field]++; 
                    } 
                    } 
                    commonFields = new Set([...commonFields].filter(field => fieldCounts[field] > 1)); 
                } 
                return [...commonFields]; 
            },  
            //231130，提供多个数组的数组或者所有字段值都是数组的对象，比如{a:[],b:[],c:[]}，返回所有值数组的长度最大的值。
            arrsMaxLen: function(arrs) {
                if (isObject(arrs) && !isArrayFn(arrs)) arrs = i.values(arrs);
                let maxSize = 0;
                arrs.forEach(arr => {
                    console.assert(isArrayFn(arr));
                    if (arr.length > maxSize) maxSize = arr.length;
                })
                return maxSize;
            },
            /*由：
            [
                [
                    { time: 1,value: 1111 }, 
                    { time: 2,value: 2222 }, 
                    { time: 4,value: 4444}
                ],
                [
                    { time: 1,value: 11111 }, 
                    { time: 2,value: 22222 }, 
                    { time: 3,value: 33333 }
                ],
                [
                    { time: 2,value: 222222 }, 
                    { time: 3,value: 333333 }
                ],
            ]
            转换成：
            [
                [
                    { time: 1, value: 1111 },
                    { time: 2, value: 2222 },
                    { time: 3, value: 0 },
                    { time: 4, value: 4444 }
                ],
                [
                    { time: 1, value: 11111 },
                    { time: 2, value: 22222 },
                    { time: 3, value: 33333 },
                    { time: 4, value: 0 }
                ],
                [
                    { time: 1, value: 0 },
                    { time: 2, value: 222222 },
                    { time: 3, value: 333333 },
                    { time: 4, value: 0 }
                ]
            ]
            */
            arrKeyMerged: function(arr, idKey = 'time', defValue = {
                valueField: 'value',
                emptyFilled: 0
            }) {
                let keystmp = i.arrKeysAll(arr);
                arr && arr.forEach((item, index) => {
                    keystmp && keystmp.forEach(idValue => {
                        let existtmp = false;
                        item && item.forEach(jitem => {
                            if (jitem[idKey] == idValue) {
                                existtmp = true;
                            }
                        })
                        if (existtmp == false) {
                            let objtmp = {};
                            objtmp[idKey] = Number(idValue);
                            objtmp[defValue.valueField] = defValue.emptyFilled;
                            item.push(objtmp);
                        }
                    });
                    arr[index] = i.arrOrdered(item);
                });
                return arr;
            },
            /*属性列表[]中，根据属性的最后一段名称，匹配获取属性的完整keyUrl*/
            attr: function(attrs, attrFlag = 'a:datas', chooseIndex = 0) { //允许通过索引传入，来获取查询多个匹配的经过排序后获取指定的！对于不想传绝对keyUrl时的一个选择！
                let foundList = i.findKeysContainingString(attrs, attrFlag),
                    foundAttr = null;

                let lentmp = foundList.length;
                if (lentmp >= 1) {
                    if (chooseIndex >= lentmp || chooseIndex < -1 || (chooseIndex > -1 && chooseIndex < 0)) {
                        console.error('index error!! lenth is', lentmp, 'but', chooseIndex, 'given');
                        return null;
                    }
                    foundAttr = chooseIndex != -1 && foundList[chooseIndex]; //获取指定索引的，默认是首个（长度最小的），长的通常是内嵌的多段的属性，比如属性图纸中内嵌的属性对话框
                    if (lentmp > 1) console.warn('multi exist! has dialog or gv or other inner display?? auto choose first ordered by len asc.', foundList, attrFlag);
                } else {
                    console.warn('attr short field', attrFlag, 'is not matched in the list!', chooseIndex, 'attrs length:', isArrayFn(attrs) ? attrs.length : i.keys(attrs).length);
                }
                return chooseIndex == -1 ? foundList : foundAttr;
            },
            /*230905，对于同步到上层的表单数据，key成了keyURL，因此上层不能简单通过form[attr]获取值，此时attr是底层属性，相当于keyURL的小段而已，因此这里结合
            i.attr()来匹配！*/
            valueMatched: function(formData, attrSegment, chooseIndex = 0) {
                let fullAttrSegment = i.attr(formData, attrSegment, chooseIndex);
                if (fullAttrSegment) return formData[fullAttrSegment];
                else return undefined;
            },
            //230218，对回调函数的数值，需要逐层向下传递穿透同步时需要，默认函数类型只会设置当前层，不会逐层向下同步设置！
            caCb: function(data, attr, callback) {
                data._needSyncToAllInnerLayers = true; //标记
                data.ca(i.np(attr), callback);
                data._needSyncToAllInnerLayers = undefined; //取消标记
            },
            /*传入keyUrl中的部分长度（末端），获取到表单属性的值*/
            formValue: function(data, attrShort, formType = 3) { //230227，加上formType，目前增加到了3种类型，form/formReset/formValue，注意，现在调整后，默认成了formValue!!
                let attr = i.attr(i.attrsFormBinded(data, formType), attrShort),
                    form = i.getFormDatas(data);
                return attr != undefined ? form[attr] : null;
            },
            //不用传入keyUrl，直接返回当前图元指定类型的所有属性key-value，默认为'formValue'类型的全部属性key-value
            formValues: function(data, formType = 3, KeyURLtype = false, returnWithFormType = false, returnAttrWithNoteAhead = false) { //240215, add returnWithFormType
                let attrs = i.attrsFormBinded(data, formType, returnWithFormType);
                form = i.getFormDatas(data);
                let result = {},
                    customedAliasFields = [],
                    uppertmp = i.upperData(data); //240219
                //240131，用i.forEach代替arr.forEach试图提高性能：
                i.forEach(attrs, attr => {
                    let attrKey = returnWithFormType ? attr.attrKey : attr; //240215，获取到的是对象，带有formType、attrKey字段
                    if(/*!uppertmp && */formType == 3 && (!data._i_keyURL2FormValueTag || data._i_keyURL2FormValueTag[i.np(attrKey)] === undefined)){ 
                        if(!data._i_keyURL2FormValueTag) data._i_keyURL2FormValueTag = {};
                        let dbItemTmp = i.getDisplayBindingItem(data,attr),
                            aliasTmp = dbItemTmp && dbItemTmp.alias;
                        //240803,下面是参照内嵌页时的逻辑，存放到属性data._i_keyURL2FormValueTag中，这样不影响主逻辑，完全兼容之前的对嵌套容器的处理！
                        function __exist(alias) {
                            return alias != undefined && alias.trim() != '';
                        }
                        console.assert(!i.isKeyURL(attrKey));//240816，只有对于无上层容器的自身属性（非继承内嵌的）走这里才正常！否则说明此前嵌套加载有问题，因为data._i_keyURL2FormValueTag没有！就异常断言提示下！
                        data._i_keyURL2FormValueTag[i.np(attrKey)] = i.fromFlaggedRelURL(i.autoTag(data) + '#' + (__exist(aliasTmp) ? aliasTmp : attrKey), '#');
                    }

                    //tips 240803，注释下，区分前面插入的代码，下面就是此前统一处理识别formValue纯表单情况下的别名处理机制。
                    let key = (KeyURLtype || !data._i_keyURL2FormValueTag) ? attrKey : data._i_keyURL2FormValueTag[i.np(attrKey)]; //注意，当前_i_keyURL2FormValueTag中的keyUrl是不带前缀的
                    if (key !== undefined) {
                        if (returnWithFormType) { //240215，获取到的是对象，带有formType、attrKey字段
                            let curBindType = attr.formType.split('.')[1],
                                //240219，上层的绑定类型
                                upperDbs = uppertmp && uppertmp.getDataBindings(),
                                upperBind = upperDbs && upperDbs.a && upperDbs.a[i.np(i.upperKeyURL(data, attrKey))],
                                upperType = upperBind && upperBind.id,
                                upperTypeSimple = upperType && upperType.split('.')[1];
                            result[returnAttrWithNoteAhead ? attr['attrName'] : key] = {
                                _i_type: 'columns', //240215，约定对应_i_value的解析方式
                                _i_value: [
                                    returnAttrWithNoteAhead ? key : attr['attrName'], //240614，增加翻译名和描述
                                    upperTypeSimple ? ('/' + upperTypeSimple) : '--', //240219，上层的绑定类型
                                    '.' + curBindType, //240219，当前下层的绑定类型 //attr.formType.split('.')[1], //240215，去掉iotos.开头，只保留form、formReset、formValue
                                    form[attrKey],
                                    attr['desc']
                                ]
                            }
                        } else {
                            result[key] = form[attrKey]; //230911，加上条件if(key !== undefined)，否则会出现的表单中有'undefined':null这种奇怪的字段值！
                        }
                        if (key.indexOf('/') != -1) {
                            customedAliasFields.push(key.split('/')[0]);
                        }
                    }
                });

                /*231009，result数据示例如下所示。注意，通过i.fromFlaggedRelURL()处理后，'#'已经被转成了'/'，没有相对路径标识的'/'的key，还是原封不动！
                {
                    gv2/../fightingDeviceMonitorFloor_dictText: "11F"
                    gv2#fightingDeviceMonitorPosition: "产品办公室"
                    gv4#actualValue: "XX"
                    gv4#fightingDeviceMonitorId: "XXX"
                    gv4#fightingDeviceMonitorName: "XXXX设备"
                    gv4#fightingDeviceMonitorType: "XXX"
                    gv4#fightingDeviceMonitorType_dictText: "XXX"
                    gv4#standardValue: "XXX"
                }*/
                let newResult = [],
                    reduced = {};
                if (formType == 3 && !KeyURLtype) {
                    newResult = i.relativeKeysConverted(result);
                } else {
                    newResult = result;
                }
                if (formType == 3) {
                    let merged = convertToTreeJson(newResult, '#', false, true); //保持ht对象不被进一部处理（不当成常规json对象进行扁平化和结构化！）
                    merged = convertToTreeJson(merged, '/', false, true); //231012，对于有相对路径'/'的，再次做一次扁平到结构化转换
                    mergedBackup = i.clone(merged); //备份下刚转换成结构化后的数据
                    for (let tag in merged) {
                        let valtmp = merged[tag];
                        if (valtmp &&
                            /*只对对象{}来处理，单个元素的数组比如：[8]，不作处理！避免对象转成数值，造成config.js里属性选择等场景故障！那么对于对象变成了数值，会不会有其他影响或者不便？需要
                            进一步观察，是否需要加上入参，屏蔽掉不做此转换而直接返回原始数据？*/
                            isObject(valtmp) &&
                            !isArrayFn(valtmp) &&
                            i.keys(valtmp).length == 1 //230310，由Object.keys改成i.keys方法，默认自动过滤掉__upper不参与统计！
                            // Object.keys(valtmp).length == 1
                        ) { //剥离掉只有一个元素的对象，即图元下只有一个属性做了formValue绑定，那么久划归给图元的tag来对应！不再做下层对象结构！
                            let keyOnlyOne = i.keys(valtmp)[0],
                                valOnlyOne = i.values(valtmp)[0],
                                originChildKeys = i.keys(mergedBackup[tag]);
                            console.assert(originChildKeys.length == 1);
                            if ( 
                                (
                                    originChildKeys.length == 1 && //231012，如果有相对key，那么就不采用tag
                                    customedAliasFields.indexOf(tag) != -1 //231012，如果是通过相对路径../../格式处理后的别名，那么采用别名机制，不再被tag标签取代别名
                                )) {
                                reduced[tag] = valtmp;
                            } else {
                                reduced[tag] = valOnlyOne;
                            }
                        } else {
                            reduced[tag] = valtmp;
                        }
                    }
                } else {
                    reduced = newResult;
                }
                return reduced;
            },
            /*240212，内嵌对应到上层的formValues，注意，以前与上层data.getDataBindings()相同，现在不同了！现在默认不会自动继承下层原本就是继承过来的属性，formValue绑定的除外！
            i.innerFormValues最后一个参数returnWithFormType传入true后，返回的数据结构示例如下：
            "a:工单基本信息-待派发>0>cbox1": {
                "a:value": {
                    "_i_type": "columns",   //对应_i_value的解析方式
                    "_i_value": [
                        "iotos.form",
                        { name: '请选择', value: '', __upper: ƒ }   //对应a:value属性的当前值xxx，默认返回格式就是"a:value":xxx。
                    ]
                }
            }
            默认传入false时，返回格式中"a:value":xxx中的值xxx，原本是什么就放什么！*/
            //240614，增加参数returnAttrWithNoteAhead = false，如果传入true，那么attr名称位置就换作翻译名！如果两者都在，那么位置互换！
            innerFormValues: function(data, formType = -1, returnWithFormType = false, returnAttrWithNoteAhead = false) {
                let innerFormValuesTmp = {}
                i.values(data._i_innerDatas).forEach(innerData => {
                    //240212，key上要有a:前缀，否则ctrl+双击容器，展现列表会有问题！
                    innerFormValuesTmp['a:' + innerData._tagToUpper] = i.formValues(innerData, formType, true, returnWithFormType, returnAttrWithNoteAhead); //240214，加上末尾参数true，这样输出才是keyURL-value，否则是输出formValue表单数据
                });
                return innerFormValuesTmp;
            },
            //命名为了跟getFormDatas对照，保持风格一致，且功能相近，便于查阅判断
            getFormValues: function(data, formType = 3, KeyURLtype = false) {
                return i.formValues(data, formType, KeyURLtype);
            },
            //230310，代替Object.keys()，因为不少地方通过keys的个数来做判断逻辑，本方法首先就会自动过滤掉本系统通常会自动带上的__upper！
            keys: function(jsonObject, funcInclude = true, excludes = ['__upper']) {
                let result = [];
                for (let key in jsonObject) {
                    if (excludes.indexOf(key) == -1) {
                        if (!funcInclude && typeof(jsonObject[key]) == 'function') continue;
                        result.push(key);
                    }
                };
                return result;
            },
            //230325，去掉函数（包括__upper）后的长度
            pureLength: function(arr) {
                if (!isArrayFn(arr)) console.error(arr)
                console.assert(isArrayFn(arr));
                let count = 0;
                arr.forEach(item => {
                    if (typeof(item) == 'function') return;
                    count += 1;
                })
                return count;
            },
            //230310，对应Object.values()
            values: function(jsonObject, funcInclude = true, excludes = ['__upper']) {
                if (!jsonObject) return []; //240218 avoid error
                // 遍历对象的所有键值对  
                const entries = Object.entries(jsonObject);
                // 使用 filter 方法过滤出符合条件的键值对，并只提取值  
                const filteredValues = entries.filter(([key, value]) => {
                    // 不包含在给定的排除字段列表中  
                    const isExcluded = !excludes.includes(key);
                    // 返回该字段既不在排除列表中，其值也不是函数  
                    return isExcluded && (funcInclude || typeof(jsonObject[key]) !== 'function');
                }).map(([_, value]) => value); // 使用 map 提取值  
                // 返回过滤后的值列表  
                return filteredValues;
            },
            fv: function(data, attrShort, formType = -1) { //1）用途等同于formValue，缩写！注意，缩写主要用于paramGenerator中使用，这里默认formType为-1，即全部，而不是通常的formValue
                if (data.dm && data.ca) return i.formValue(data, attrShort, formType);
                else { //2）230304，复用同名函数，兼容传入form和attrShort，获得value，比如：oldVal[0] = i.fv(form,'combobox>0>dataBackup>s:text')
                    let formtmp = data;
                    console.info('current i.fv think of input data as form object', data);
                    return formtmp[i.ap(i.attr(formtmp, attrShort))]; //i.attr是根据attrShort在form中匹配以获取长的keyURL
                }
            },
            //判断是否是数组对象，且长度大于等于指定值，默认传参是判断非空数组！
            len: function(arr, len = 1) {
                return isArrayFn(arr) && arr.length >= len;
            },
            //编辑状态下打开对话框（运行状态应该也行，未测也无必要，连线即可无需代码调用！）
            /*参考示例一：
            i.openDialog('displays/develop/uiotos/editor/widgets/dialog/ensure.json', editor.gv, {
                onInit: function(data, gv, cache, formAttrs) {
                    data.ca('titleText', '提示');
                    data.ca('oneButton', true);
                    data.ca(i.attr(formAttrs, 'a:value'), '选择不能为空！')
                },
                onOk: function(data, gv, cache, form) {

                },
                onCancel: function(data, gv, cache, form) {

                },
                onFinally: function(data, gv, cache, form, isOk) {

                }
            }, '提示', [], 0.5);

            参考提示二：兼容传入gv或者dm，都行
            i.openDialog('displays/develop/uiotos/editor/widgets/dialog/ensure.json', editor.gv, {
                onInit: function(data, gv, cache, formAttrs) {
                    data.ca('oneButton', true);
                    data.ca(i.attr(formAttrs, 'a:value'), info + '(' + xhr.status + ')')
                }
            }, '错误', [300, 150]);
            */
            openDialog: function(url, desk, callback = { onInit: null, onOk: null, onCancel: null, onFinally: null }, title = '对话框', rect = [600, 400], maskDeep = 0.5, hasMaxmin = false) {
                //240615，所有的对话框弹窗，鼠标移出区域，toolTip提示自动关闭！不能像属性面板的链接提示那样，能够划入里面去点击链接！
                if (!runningMode() && editor._i_hideToolTip) ht.Default.hideToolTip = editor._i_hideToolTip;

                let dlgTmp = new ht.Node();
                dlgTmp.setDisplayName('dlg');
                dlgTmp.setName('dlg');
                dlgTmp.s('label.opacity', 0);
                dlgTmp._i_isEditConfigDlg = true;
                dlgTmp.setWidth(0);
                dlgTmp.setHeight(0);
                dlgTmp.a('footerVisible', false);
                dlgTmp._i_footerVisible = true;
                let dmtmp = desk.dm ? desk.dm() : desk; //230225，兼容传入gv和dm两种情况！
                dmtmp.add(dlgTmp);
                //230503，存在最后如果选中是edge连线时，dmtmp.sm().getLastData().getPosition()调用就会报错！
                if (dmtmp.sm() && dmtmp.sm().getLastData() && dmtmp.sm().getLastData().getPosition) dlgTmp.setPosition(dmtmp.sm().getLastData().getPosition());
                else if (i.baseNode(desk)) dlgTmp.setPosition(i.baseNode(desk).getPosition());
                //必须是可见，否则反序列化实例化对象不会触发渲染函数，导致事件监听初始化无法执行，包括a:show属性设置触发的事件没法响应！
                dlgTmp.s('2d.visible', true);
                dlgTmp.a('titleText', title);
                dlgTmp.a('enableLoading', true);
                dlgTmp.a('maskBackground', 'rgba(0,0,0,' + String(maskDeep) + ')');
                dlgTmp.a('closeButtonOnly', !hasMaxmin);
                dlgTmp.__onInit = callback.onInit; //初始化给表单展示/选择
                dlgTmp.__onOk = callback.onOk;
                dlgTmp.__onCancel = callback.onCancel;
                dlgTmp.__onFinally = callback.onFinally; //不论点击哪个，对话框关闭后都会执行到的
                if (isArrayFn(rect) && rect.length >= 2) {
                    dlgTmp._rect = rect;
                } else {
                    dlgTmp.ca('useOriginSize', true);
                }
                dlgTmp.ca('onDisplayLoaded', `function(data, gv, cache) {
                    /*注意，这句不要跟data.s('2d.visible', false);放到一个时序里去执行，因为触发事件可能先后顺序问题导致影响后面2d.visible显示隐藏事件，
                    导致出现隐藏不掉非要点击、触发一下才起作用的诡异现象，通过setTimerout(()=>{},0)，可以将两个先后执行的事件明确触发顺序*/
                    data.a('footerVisible', true);
                    //如果是指定的尺寸，在这里还原设置，避免过渡重影，
                    let rect = data._rect;
                    if (rect && isArrayFn(rect) && rect.length >= 2) {
                        data.setWidth(rect[0]);
                        data.setHeight(rect[1]);
                    }
                    //隐藏编辑状态下的图元节点，注意，通过setTimerout放到下一个事件处理，如果跟show一起，导致偶尔弹窗后图元节点不隐藏的现象！
                    _i.setTimeout(() => {
                        data.s('2d.visible', false);

                        //显示对话框
                        data.a('show', true); //对话框的显示放到下一个事件时序，以尝试解决弹出对话框不居中的情况
                    }, 0);
                    //传入给表单初始化的数据
                    data.__onInit && data.__onInit(data, gv, cache, i.getAttrsFormBinded(data));
                    //240212，打开加载对话框时，就不允许鼠标放入提示，关闭后才恢复，避免连线属性弹窗、属性继承选择弹窗都会出现布局提示，不友好！
                    gv.disableToolTip();
                }`);
                let dlgurl = 'symbols/develop/uiotos/base/dialog-ui.json';
                dlgTmp.setImage(dlgurl);
                dlgTmp.a('display', url);
                dlgTmp.a('onOk', `function(data, gv, cache, form) {
                    //ok按钮点击事件触发__onOk回调执行
                    let notDestory = data.__onOk && data.__onOk(data, gv, cache, form);
                    //ok、cancel不论哪个执行，都会再执行到__onFinally
                    data.__onFinally && data.__onFinally(data, gv, cache, form, true);
                    //删除对话框图元节点
                    if(!notDestory){
                        gv.dm().remove(data);
                        data = null;
                    }
                    //240212，关闭弹窗时，恢复滑过提示，通常是编辑状态下的弹窗和关闭，以及提示。
                    gv.enableToolTip();
                }`);
                dlgTmp.a('onCancel', `function(data, gv, cache, form) {
                    //cancel按钮点击事件触发__onCancel回调执行
                    data.__onCancel && data.__onCancel(data, gv, cache, form);
                    //ok、cancel不论哪个执行，都会再执行到__onFinally
                    data.__onFinally && data.__onFinally(data, gv, cache, form, false);
                    //删除对话框图元节点
                    gv.dm().remove(data);
                    data = null;
                    //240212，关闭弹窗时，恢复滑过提示，通常是编辑状态下的弹窗和关闭，以及提示。
                    gv.enableToolTip();
                }`);
                return dlgTmp; //返回对话框的图元node对象
            },
            /*230224，简化操作的弹窗，代替js最常见的alert，不过注意，这是异步函数，并非像alert会阻塞！
            i.alert('内嵌图xxxxx销售的房屋', '提示', () => {
                i.editorOpen(data.ca('display'));
            })*/
            alert: function(msg, title = '警告', hasCancel = false, cb = null, gv = null, size = [300, 150], overWriteOld = false) {
                if(!size || size.length == 0) size = [300,150];
                _i.setTimeout(() => { //240608，好像得放到下一个时序，才能避免初始打开偶尔弹窗内容显示问题！
                    if (!gv && window.editor && !window.editor.gv) {
                        //240524，当编辑器没有打开任何页面时，存在退出登录等操作需要提示，此时提示依赖的gv，就要换一个已经有的，避免return掉！
                        let otherGv = i.window().editor.displays.tree;
                        if (otherGv) editor.gv = otherGv;
                        else {
                            console.assert(0);
                            return;
                        }

                    }
                    console.error('WARN:', msg);
                    //230911，加上日志输出
                    if (title.indexOf('警告') != -1 || title.toLowerCase().indexOf('warn') != -1) {
                        console.warn(msg);
                    } else if (title.indexOf('错误') != -1 || title.toLowerCase().indexOf('error') != -1) {
                        i.error(msg);
                    } else if (title.indexOf('提示') != -1 || title.toLowerCase().indexOf('tip') != -1 || title.toLowerCase().indexOf('info') != -1) {
                        console.log(msg);
                    }

                    let oldContent = '';
                    if (i.window()._i_alertDlg) { //230917，多个连续弹窗（因为不是阻塞的），内容会合并而不是对话框窗口多个叠加！有待进一步测试！！
                        oldContent = i.window()._i_alertDlg._i_msg;//i.window()._i_alertDlg.ca('ensure>0>textArea-ui1>a:value');
                        oldContent += '\r\n\r\n-----------\r\n\r\n';
                        oldContent += title + '：\r\n';
                        oldContent += msg;
                        if(overWriteOld) oldContent = msg;
                        i.window()._i_alertDlg._i_msg = oldContent;
                        i.window()._i_alertDlg.ca('ensure>0>textArea-ui1>a:value', oldContent);
                        i.window()._i_alertDlg.setWidth(size[0]);
                        i.window()._i_alertDlg.setHeight(size[1]);
                        i.window()._i_alertDlg.ca('show', true);
                    } else {
                        let urltmp = 'displays/' + i.user() + '/uiotos/editor/widgets/dialog/ensure.json';
                        //230926，存在urltmp还未加载的情况，发现此时对话框显示异常，只有底部按钮，没有窗体内容！
                        if (i.getImage(urltmp)) {
                            i.window()._i_alertDlg = i.openDialog(urltmp, gv ? gv : runningMode() ? window._i_rootDM : editor.gv, {
                                onInit: function(data, gv, cache, formAttrs) {
                                    let msg = i.window()._i_alertDlg._i_msg;
                                    //231108，如果文字内有html标记的，那么切换成html格式！
                                    data.ca(i.np(i.attr(formAttrs, 'a:htmlContent')), i.isHtmlTypedText(msg));

                                    data.ca('oneButton', !hasCancel);
                                    data.ca(i.np(i.attr(formAttrs, 'a:value')), msg);
                                },
                                onFinally: function(data, gv, cache, formAttrs, isOk) { //临时加上回调，方便模拟同步，以在点击确定/取消后才进行下一步
                                    cb && cb(isOk, formAttrs);
                                    delete i.window()._i_alertDlg;
                                }
                            }, title, size);
                            i.window()._i_alertDlg._i_msg = msg;
                        } else {
                            //230926，存在url资源未加载的情况，这里需要触发下，否则无处触发加载，那么显示就会出问题！存在urltmp还未加载的情况，发现此时对话框显示异常，只有底部按钮，没有窗体内容！
                            i.setImage(urltmp, urltmp);
                            i.onImageLoaded(urltmp, (img) => {
                                /*240626，这里需要加上，避免死循环！！！因为一旦不是加载问题，而是实际就没有这个提示的.json资源文件在，那么会导致死循环重复进来！
                                所以这里根据找不到资源文件时就回调返回undefined，来避免重复死循环！*/
                                img && i.alert(msg, title, hasCancel, cb, gv, size);
                            });
                        }
                    }
                }, 0);
            },
            //240702，简单的弹窗错误警告！
            alertError: function(msg, title = '错误', color = 'red', size = [300, 200],data = null) {
                console.error(msg);
                i.alert(_i.toHtmlFont(_i.colored(msg, color ? color : 'red', false) + (data ? i.commonTip(data) : '')), title, null, null, null, size);
            },
            //230322，ht弹出层封装后的方法，主要用于代码调用，区别于工具函数中直接用layer.msg
            showMessage: function(msg, type = 'msg', title = null, region = 'top', fixedWidth = null, duration = 2000) {
                layer.msg(msg, null, type, title, region, fixedWidth, duration);
            },
            //将图元node/data的json格式转换成treeTable的datas属性支持的json格式*/
            convertNodeToTreeDatas: function(node, callback = null, includeAttrWithoutFormed = true) {
                let datastmp = null,
                    attrKey2ValTmp = {},
                    formAttrs = i.getAttrsFormBinded(node, -1, true); //240609，为了获取表单数据时能获取到对应的翻译和注释
                formAttrs && formAttrs.length && i.getValue(node, formAttrs[0].attrKey, null, val => {
                    i.syncAttrsAll(node, attrs => {
                        formAttrs.forEach(attrItem => {
                            attrKey2ValTmp[attrItem.attrKey] = i.getValue(node, attrItem.attrKey);
                        });
                        datastmp = __formatAttrs(attrs, formAttrs);
                        callback && callback(datastmp);
                    });
                });

                function __typed(val) {
                    if (typeof(val) == 'function') val = '(function)'
                    return val;
                }

                function __formatAttrs(innerAttrs, formAttrs) {
                    let attrsWithoutFormed = includeAttrWithoutFormed ? [{
                        rowData: [
                            [
                                "嵌套属性"
                            ]
                        ],
                        children: (() => {
                            let itemtmp = []
                            i.keys(innerAttrs).forEach(attr => {
                                //240731，加上过滤条件，对于忽略的属性，不要在属性继承、连线面板中出现！
                                if(i.getNewTransNote(node, attr, 'extraInfo') == '~') return;
                                if (i.arrFilter(formAttrs, { attrKey: 'a:' + attr }).length > 0) return;
                                let valtmp =  __typed(i.getValue(node, attr));
                                itemtmp.push({
                                    rowData: [
                                        //240609，为了让属性弹窗第一行显示名称，第二行还是不变显示值，对于第三、四两列，分别存放属性attr/keyURL英文以及描述description！
                                        i.getAttrNote(node, attr),
                                        i.isWinOrNodeObj(valtmp) ? '（元对象）' : valtmp, //240714，避免因为window对象等是属性值，结果属性列表报错！
                                        attr, //240609，不再用.slice(2)，保留a:、s:等前缀配置到连线属性组中！
                                        i.getNewTransNote(node, attr, 'description')
                                    ],
                                    children: []
                                })
                            });
                            return itemtmp;
                        })()
                    }] : [];
                    return [{
                            rowData: [
                                [
                                    "表单属性"
                                ],
                                '',
                                '',
                                '单击展开或收起节点。\
                                <br>（节点单选框点击，可清空关联属性）。'
                            ],
                            children: (() => {
                                let itemtmp = []
                                formAttrs.forEach(attrItem => {
                                    let attr = attrItem.attrKey;
                                    //240731，加上过滤条件，对于忽略的属性，不要在属性继承、连线面板中出现！
                                    if(i.getNewTransNote(node, attr, 'extraInfo') == '~') return;
                                    let valtmp = __typed( /*node[attr.slice(0, 1)](attr.slice(2))*/ attrKey2ValTmp[attr]);
                                    itemtmp.push({
                                        //240609，为了让属性弹窗第一行显示名称，第二行还是不变显示值，对于第三、四两列，分别存放属性attr/keyURL英文以及描述description！
                                        rowData: [
                                            i.getAttrNote(node, attr),
                                            i.isWinOrNodeObj(valtmp) ? '（元对象）' : valtmp,   //240714，避免因为window对象等是属性值，结果属性列表报错！
                                            attr, //240609，不再用.slice(2)，保留a:、s:等前缀配置到连线属性组中！
                                            i.getNewTransNote(node, attr, 'description')
                                        ],
                                        children: []
                                    })
                                });
                                return itemtmp;
                            })()
                        }, ...attrsWithoutFormed,
                    ];
                }
                return datastmp;
            },
            //重新加载当前图纸刷新
            reload: function(savedBeforeReload = false) {
                if (savedBeforeReload) {
                    i.upload(editor.dm, function(result) {
                        if (result == 0) console.error('save inner display error,may be cause some prop setting error for tag problem!');
                        else editor && editor.reload();
                    }, true, i.currentUrl());
                } else editor && editor.reload();
            },
            lower: function(str) {
                return String(str).trim().toLowerCase();
            },
            //树表递归查询
            treeDatasVisible: function(
                tree, //可以是tree/combobox._tree=/treeTable等
                queryText = '', //可以是实时输入重入此函数
                dimTextWidedCb = (data) => { //240212，单独提供一个回到用来写扩展后的字符，因为原始字符被修改后，里面需要精确比对就出问题了，而且内部硬编码用data.getName也不适合，需要与回调一致！
                    return (i.upperData(data).ca('useTreeLined') ? data._i_keyUrlTreeLined : data.getName()) + ''; //240213，treeTable的树表加载datas解析时，为行数据图元对象rowNodeData增加了属性._i_keyUrlTreeLined，性能提高了不说，省了太多事！
                },
                readTextCb = (data) => { //根据当前行data，显示的数据是什么，有默认实现，并提供回调函数自定义给，对于树表默认实现就不适用了
                    return i.upperData(data).ca('useTreeLined') ? data._i_keyUrlTreeLined : data.getName(); //240213，treeTable的树表加载datas解析时，为行数据图元对象rowNodeData增加了属性._i_keyUrlTreeLined，性能提高了不说，省了太多事！
                },
                nodeInclude = false,
                flag = '_show'
            ) {
                if (queryText == undefined) queryText = ''; //配置中为null转成空字符串'',避免直接处理null导致数据不显示！
                else if (isArrayFn(queryText)) queryText = queryText.join(' '); //231116，如果是数组，那么转成空格隔开的字符串，识别为交集条件查询！

                //先设置过滤函数
                tree.setVisibleFunc(data => {
                    let showtmp = i.attrObject(data)[flag];
                    return showtmp == undefined ? true : showtmp;
                });

                //2、递归让显示的末端节点的一级一级所有父节点都标记可显示
                function showParentFlag(dataItem, state = true) {
                    i.attrObject(dataItem)[flag] = state;
                    let ptmp = dataItem.getParent()
                    if (ptmp) showParentFlag(ptmp, state);
                }

                //240214，递归判断如果节点下的节点都不可见，自己也不可见，这样一旦没找到，整个分支就不要留着干扰了！
                function __hideParentWhenAllChildHide(dataItem) {
                    let allHide = true,
                        parenttmp = dataItem.getParent();
                    if (!parenttmp) {
                        return;
                    }
                    parenttmp.getChildren().forEach(child => {
                        if (!allHide) return;
                        if (i.attrObject(child)[flag] == true) allHide = false;
                    });
                    if (allHide) i.attrObject(parenttmp)[flag] = false;
                    __hideParentWhenAllChildHide(parenttmp); //递归继续往上处理！
                }

                //提取检索文字
                let datasMatch = [];
                //遍历数的dataModel数据模型，对所有需要显示的做好标记
                tree.dm().each(data => {
                    //240220，去掉i.lower(queryText)，因为里面带有.trim()会去掉空格！现在是要支持输入纯空格，来显示所有已勾选的，当回退到没有空格的空字符串则显示所有！
                    if ( /*i.lower(queryText)*/ queryText !== '') {
                        if (data.isEmpty() || nodeInclude) {
                            let dataText = dimTextWidedCb(data), //240212，加上了其他列模糊字段的
                                dataReal = readTextCb(data); //240212，原始显示值
                            let showtmp = i.searchFilterMatched(dataText, queryText);
                            if (queryText.toLowerCase() == (dataReal && dataReal.toLowerCase())) datasMatch.push(data); //完全匹配的

                            //240220，输入一个或多个空格' '，那么只显示已勾选的；回退空不输入任何空格等字符，则恢复显示所有！
                            if (showtmp && queryText.trim() == '' && !data.dm().sm().co(data)) showtmp = false;

                            i.attrObject(data)[flag] = showtmp;
                            if (showtmp) showParentFlag(data);
                            else __hideParentWhenAllChildHide(data); //240214，隐藏过滤掉时，判断上级节点的所有子节点是否都隐藏了，如果是，那么自己也隐藏！
                        }
                    } else {
                        i.attrObject(data)[flag] = true;
                    }
                });
                return datasMatch; //返回完全匹配的，相当于该函数的额外用途
            },
            //240725，图元运行时是否可见？枚举出来
            isDataRunningInvisible: function(data){
                let constList = ['func', 'api', 'bus', 'timer', 'ht.Block', 'interface','dlg','grid','ht.Edge'],
                    found = false;
                constList.forEach(typed=>{
                    if(!found && i.isControlTyped(data,typed)) found = true;
                });
                return found;
            },
            //240216，树表treeTable返回行数据数量（所有没有更下级节点的），以及其中已勾选了的数量。返回对象，字段分别为visibleCount、checkCount。
            getRowsCheckCount: function(treeTableDm) {
                let result = {
                    visibleCount: 0,
                    checkCount: 0,
                }
                treeTableDm.toDatas().toArray().forEach(rowNodeData => {
                    if (rowNodeData.isEmpty() && rowNodeData.ca('_show')) {
                        result.visibleCount += 1;
                        if (treeTableDm.sm().co(rowNodeData)) {
                            result.checkCount += 1;
                        }
                    }
                });
                return result;
            },
            //字符串数组，查找匹配文字的item的索引列表，用于bindControls中常用
            getArrIds: function(arr, matchString) {
                let ids = [];
                isArrayFn(arr) && arr.forEach((str, index) => {
                    if (str == matchString) ids.push(index);
                })
                return ids;
            },
            /*典型调用方式如下：
            i.withLoading(closeLoading => {
                $.post('/upload', { //耗时调用
                }, res => {
                    closeLoading(); //关闭
                }, 'json');
            }, showLoading);//可传入开关
            */
            withLoading(funcContent, enable = true) { //enable作为参数可以供外部参数设置是否显示加载
                try {
                    // enable && layer.load(1); //230729，暂时关闭这里的loading，因为存在如果资源不存在时，或者资源路径有修改，会导致卡死，loading动画阻塞不退出！

                    function __closeLoadingFunc() {
                        enable && layer.closeAll();
                    };
                    return funcContent(__closeLoadingFunc);
                } catch (error) {
                    console.error(error);
                    enable && layer.closeAll();
                    return undefined;
                }
            },
            //230326，不确定会不会报错的地方用i.try()包起来大量用就好，加一层保护模！！
            try: function(funcContent) {
                return i.withLoading(funcContent, false);
            },
            //异步加载
            xhrLoad: function(url, callback) {
                i.withLoading(closeLoading => {
                    const loadCb = (json) => {
                        if (json) {
                            try {
                                callback && callback(json, url);
                                closeLoading();
                            } catch (error) {
                                console.error(error, url, 'json内容加载如下：');
                                console.error(json)
                                closeLoading();
                            }
                        } else {
                            console.error('url加载异常', url, json);
                            closeLoading();
                        }
                    };
                    ht.Default.xhrLoad(url, loadCb);
                });
            },
            //编辑器加载图纸url
            editorOpen: function(url, callback = null, fileType = 'display') { //230327，回传加载后图纸的dm
                let upperIdxTmp = null;
                editor.mainTabView.tabs.forEach((tab,idx)=>{
                    if(tab.getTag() === url){
                        upperIdxTmp = idx;
                    }
                });
                if(upperIdxTmp !== null){
                    editor.mainTabView.select(upperIdxTmp);
                    return;
                }
                //240818，对于图表symbol，就打开图标！
                if(url.slice(0,8) == 'symbols/' && i.window().editor){
                    i.window().editor.open(url);
                    return;
                }

                function __open() {
                    i.xhrLoad(url, (json, url) => {
                        try {
                            let trytmp = editor.openByJSON
                        } catch (error) {
                            editor = i.window().editor; //240515，存在当前editor为undefined的情况！比如初始界面的小图标学习入门示例！   
                        }
                        editor.openByJSON(fileType, url, urlName(url), json, url);
                        callback && callback(editor.gv.dm());

                        // editor.gv.fitContent(true);
                    });
                }
                //230422，打开内嵌图纸时会验证是否是当前用户的，是则打开，否则会提示是否切换到当前用户下的版本！
                if (i.user() && urlUser(url) != 'demo' && urlUser(url) != i.user()) {
                    let gvtmp = i.window().editor.displayView && i.window().editor.displayView.graphView;
                    //调整目录用户后再打开
                    function __adjustOpen() {
                        let urlfield = url.split('/');
                        console.assert(urlfield[0] == 'displays');
                        urlfield[1] = i.user();
                        url = urlfield.join('/');
                        __open();
                    }
                    if (gvtmp) i.alert('内嵌图纸不属于当前用户' + i.user() + '，禁止打开，是否跳转到当前用户的版本？' + url, '警告', true, status => {
                        if (status) __adjustOpen();
                    }, gvtmp);
                    else __adjustOpen();
                } else __open();
            },
            //230329，编辑器定位左上、左下菜单定位当前文件位置
            editorLocateFile: function(filePath) {
                if (!filePath) return;
                let typestmp = ['displays', 'symbols', 'components', 'assets'],
                    indexstmp = [1, 2, 3, 5], //对应editor.leftTopTabView中上面typestmp分别对应的索引
                    curtypetmp = 'displays';
                typestmp.forEach((type, index) => {
                    if (filePath.indexOf(type) != -1) {
                        curtypetmp = typestmp[index];
                        editor.leftTopTabView.select(indexstmp[index]);
                        _i.setTimeout(() => {
                            //1）先定位目录选中左上目录
                            let tabURLTmp = filePath;
                            let foldertmp = tabURLTmp.split('/').slice(0, -1).join('/'),
                                filetmp = tabURLTmp;
                            let folderNode = i.window().editor[curtypetmp].dataModel._dataMap[foldertmp];
                            i.window().editor.explorer.tree && i.window().editor.explorer.tree.sm().ss(folderNode);
                            //2）再定位文件选中左下文件
                            let fileNode = i.window().editor[curtypetmp].dataModel._dataMap[filetmp];
                            i.window().editor.explorer.list && i.window().editor.explorer.list.sm().ss(fileNode);
                        }, 10);
                    }
                });
            },
            //字符串赋值到右键剪切板
            copyToPaste: function(str, enableTip = true, tipText = null) {
                if (!str) return false
                let dom = document.createElement('input');
                dom.value = str;
                document.body.appendChild(dom);
                dom.select(); // 选择对象
                document.execCommand("Copy"); // 执行浏览器复制命令
                document.body.removeChild(dom);
                let texttmp = tipText ? tipText : '已复制：' + str;
                console.error(texttmp);
                enableTip && layer.msg(texttmp, {
                    time: 1500,
                    offset: "t" //弹出层的位置
                })
                return true
            },
            //230328，收藏图元的复制粘贴
            copyFavorite: function(copyPath, callback = null) {
                let oldTab = i.window().editor._currentTab;
                if (copyPath == undefined || typeof copyPath != 'string') {
                    console.error('copyPath url error!', copyPath);
                    return;
                }
                i.editorOpen(copyPath, dm => {
                    let newDataNode = i.baseNode(dm);
                    dm.sm().as(newDataNode); //选中编辑图纸的base图元，默认图元就是base
                    i.window().editor.copy(); //将图元复制到剪切板    
                    i.window().editor._i_hasFavoriteCoppy = true; //标记符，场景gv中单击后会复位
                    //重要，移除临时增加的tab标签，注意，不用editor.closeTab()会触发一个确定弹窗得手动消除！
                    i.window().editor.mainTabView.removeTab(i.window().editor._currentTab);
                    //恢复此前默认的tab作为当前
                    i.window().editor.mainTabView.select(oldTab);
                    callback && callback(newDataNode);
                });
            },
            /*230328，图纸等文件的复制粘贴，暂未用未测。230402，暂时弃用，发现复制是异步事件通知的，随后的粘贴调用，需要延时一下才能有效自动粘贴！
            图纸页面的收藏（复制粘贴）改成setDataJson来保存，内容是一个新建图纸、内置图标存放被复制的图纸预览图片png即可，因为最终是要跳转到原图纸的！*/
            copyFavoriteFile: function(url, pasteFolder = null, callback = null) { //paste为false时为复制，true时为粘贴
                if (url) {
                    //先定位文件并选中
                    let folder = editor.displays.dataModel._dataMap[url.split('/').slice(0, -1).join('/')];
                    editor.explorer.tree.sm().ss(folder);
                    let file = editor.displays.dataModel._dataMap[url];
                    editor.explorer.list.sm().ss(file);
                    i.window().editor.copyFiles();
                }
            },
            //230402，配合收藏使用，合法的收藏名称或者备注描述不能有'/'或者'.'，否则会被当做路径处理了，因为信息都是放到文件名里的！最好应该放到表单提交的正则表达式里，暂未处理！
            getFavoriteValidString: function(rawInput) {
                return i.replaceAll(i.replaceAll(rawInput, '.', '-'), '/', '-'); //所有的.和/都自动替换成-
            },
            //js base64编解码
            base64Encode: function(rawString) {
                return btoa(encodeURIComponent(rawString));
            },
            base64Decode: function(base64Str) {
                try {
                    return decodeURIComponent(atob(base64Str));
                } catch (error) {
                    return base64Str;
                }
            },
            //是否是base64编码后的，注意，对于常规字符串比如"hello world"，也会通过，因为可能是另一个字符串经过base64编码过来猜的到这个的，并不是你以为的作为待编码且编码后都是乱七八糟字符的情况！
            isBase64: function(str) {
                if(str && str.slice && str.slice(0,11) == 'data:image/' && str.indexOf && str.indexOf('base64') != -1) return true;
                //方式一：
                if (str === '' || str.trim() === '') {
                    return false;
                }
                try {
                    return btoa(atob(str)) == str;
                } catch (err) {
                    return false;
                }
            },
            //231206，更新！补充图元属性的前缀
            autoPrefixed: function(attr, node = null) {
                if(!attr) return attr;
                if (attr.slice(1, 2) == ':') {
                    return attr;
                }

                //230812，根据数据绑定，自动识别未传入标识a/s/p的，哪个值存在，自动采用对应的标识。
                let prefixtmp = 'a'; //默认为a
                if (i.isKeyURL(attr)) return 'a:' + attr; //240623，避免还要进入到里面判断，没必要！

                //240623，下面好像有问题啊！！！不全属性前缀，怎么依赖于数据绑定？？？！！！如果没有做form绑定，那还获取不到了！！！！！
                bindingsList = node && node.getDataBindings();
                if (bindingsList) {
                    let foundtmp = false;
                    //判断属性的数据绑定是否存在，存在则按照实际存在的自动识别出没有给出的前缀
                    function __typeReChech(typeFlag) {
                        if (foundtmp) return;
                        if (bindingsList[typeFlag] && bindingsList[typeFlag][attr]) {
                            prefixtmp = typeFlag;
                            db = bindingsList[typeFlag][attr];
                            if (foundtmp) console.error('dataBindings attr predix duplicated!!', node.getTag(), attr, bindingsList);
                            foundtmp = true;
                        }
                    };

                    !foundtmp && __typeReChech('a'); //后面的权重更高，如果存在a/s/p重复名称，那么按照顺序以后者的为准，会覆盖！
                    !foundtmp && __typeReChech('s');
                    !foundtmp && __typeReChech('p');

                    //240130，如果还是没有，那么可能是s、p这种，且没有做form绑定导致dataBindings中没有！
                    if (foundtmp === false) {
                        //240130，让字符串首字母大写
                        function __capitalizeFirstLetter(str) {
                            if (str && typeof str === 'string') {
                                return str.charAt(0).toUpperCase() + str.slice(1);
                            } else {
                                return str;
                            }
                        }
                        if (
                            (node && getProperty(node, attr) !== undefined) ||
                            (typeof(node['get' + __capitalizeFirstLetter(attr)]) == 'function') ||
                            (node && ht.Default.getter(attr) && node[ht.Default.getter(attr)])
                        ) { //比如传入'tag'，避免被当做a:tag，实际应返回p:tag
                            return 'p:' + attr;
                        } else if (
                            (node && node.ca(attr) !== undefined) ||
                            (node && i.getDataBindingItem(node, attr, null, true))
                        ) {
                            return 'a:' + attr;
                        } else if (
                            (node && node.s(attr) !== undefined) ||
                            (node && node.getStyleMap() && node.getStyleMap()[attr] !== undefined)
                        ) {
                            return 's:' + attr;
                        } else if (attr.indexOf('.') != -1) { //比如2d.selectable，label.font等属性名称中带有.的，都默认作为s:类型！！
                            console.error('WARN: choose attr prefix head by name style only!!', attr);
                            return 's:' + attr;
                        } else if (node.ca(attr) === undefined) { //如果发现attrObject中属性值存在，那么就当作a:xxx，只是没有做form绑定而已！
                        }
                    }
                }
                return prefixtmp + ':' + attr;
            },
            nonePrefixed: function(attr) {
                attr && console.assert(typeof attr == 'string');
                if (attr && attr.slice(1, 2) == ':') attr = attr.slice(2);
                return attr;
            },
            ap: function(attr) { //简称
                return i.autoPrefixed(attr);
            },
            np: function(attr) { //简称
                return i.nonePrefixed(attr);
            },
            //通用到渲染元素组件的事件响应函数中，一个函数调用来对属性逐层向上更新、事件逐层向上传递、表单提交触发全部执行到
            /*使用示例：
            //兼具回调cb、属性逐层往上更新、表单提交处理
            i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                'value': v.newValue         //（字段参数的前缀a:可带可不带）当前渲染元素组件的属性a:value，对应实际控件ht.ui.TextArea的p:value属性，需要显式写入！
                                            //（因为可能命名为a:content等，不一定非得用a:value去对应p:value）
            });                             //最后一个参数true（默认即可）
            */
            formEventBubblingUpper: function(
                data, //渲染元素图元data
                gv,
                cache,
                formEvents, //当前事件回调函数属性，比如onClick、onResponse等
                formAttrVals, 
                selfInclude = 1, //0:逐层上报但是不更新当前图元的属性；1:回写当前图元属性值但是不触发属性监听的事件；2:回写并保持触发监听事件。
                triggerBindControls = true, //不是所有的事件都要触发bindControls表单提交，比如对话框dialog的取消按钮！这里允许传入false
                eventType = null,
                fpForce = false, //230213，增加强制更新，对于值未变化的，也强行触发
                extraInfo = null,
                formDatas = null, //230913，支持用户传入formDatas，如果不传，默认就是组件的表单数据。可以用于api组件这种传入接口返回的response作为表单而不是自动生成！
                onEventTriggerFunc = null
            ) {
                if (typeof(formEvents) == 'string') formEvents = [formEvents];
                if (formEvents && isArrayFn(formEvents)) {
                    if (formEvents.length == 1 && eventType == null) eventType = formEvents[0];//230216，当传入的事件只有一个字符串或者数组只有一个且eventType为null时，eventType就自动以formEvents的第一个（字符串）赋值！
                }
                if(onEventTriggerFunc && eventType){
                    if(!data._i_typeToEvents) data._i_typeToEvents = {};
                    data._i_typeToEvents[i.np(eventType)] = onEventTriggerFunc;
                }
                if(data._i_onEventByEventTypeInit) return; //241002，仅仅是初始化时，不需要实际上做对外连线动作！
                let /*formDatas = null,*/ //230913，支持用户传入formDatas，如果不传，默认就是组件的表单数据。可以用于api组件这种传入接口返回的response作为表单而不是自动生成！
                    formType = -1,
                    attrFull = null;

                //1）常规属性类型
                for (let attr in formAttrVals) {
                    if (attr == 'formType') { //230301，固定识别名称，相当于新增的函数参数传入
                        formType = formAttrVals[attr];
                        continue;
                    }
                    let valtmp = formAttrVals[attr],
                        hasNotifyUppered = false; //有些操作里自带了 i.innerNotifyUpper，避免重复！
                    attrFull = i.autoPrefixed(attr, data);

                    //本层当前图元的操作
                    if (selfInclude) {
                        if (fpForce) {
                            data.fp(attrFull, null, valtmp);
                        } else if (selfInclude == 1) {
                            i.backWriteOnly(data, attrFull, valtmp);
                            hasNotifyUppered = true;
                        } else {
                            updateForce(data, attrFull, valtmp);
                            hasNotifyUppered = true;
                        }
                    } else { //added 230218，当不包含当前图元操作（主要是为了避免可能发生的死循环递归），这里还是需要自动保证最新值在表单中，用来给后面使用是最新数据！
                        if (formDatas == null) formDatas = i.getFormValues(data, formType, !data.ca('pureFormValues')); //230301，代替i.getFormDatas(data)，支持获取的表单类型-1、1、2、3
                        formDatas[attrFull.slice(2)] = valtmp;
                        formDatas[attrFull] = valtmp;
                    }
                    //逐层向上传递
                    !hasNotifyUppered && i.innerNotifyUpper(data, attr, valtmp); //如果没有对attr传入指定value，就用自动获取的formDatas
                }
                if (formDatas == null) formDatas = i.getFormValues(data, formType, !data.ca('pureFormValues')); // i.getFormDatas(data);1，代替i.getFormDatas(data)，支持获取的表单类型-1、1、2、3

                //2）回调函数类型
                if (typeof(formEvents) == 'string') formEvents = [formEvents];
                if (formEvents && isArrayFn(formEvents)) {
                    //230216，当传入的事件只有一个字符串或者数组只有一个且eventType为null时，eventType就自动以formEvents的第一个（字符串）赋值！
                    if (formEvents.length == 1 && eventType == null) eventType = formEvents[0];
                    formEvents.forEach(eventCb => {
                        //230218，注意，回调函数的执行与i.ubc/bindControls触发事件是独立的！这里跟i.ubc分别都有做逐层递归向上传递！是否应该合并？？？暂未深究
                        i.innerCallback(data, gv, cache, eventCb, formDatas, extraInfo); //form属性值给到回调函数；extraInfo为230215加上！
                    })
                } else if (isObject(formEvents)) { //230225，【暂未测试】，如果是事件对象，那么value为传入的值，而不是默认form，因为有些不会放到form属性中，直接回调给
                    for (let eventCb in formEvents) {
                        i.innerCallback(data, gv, cache, eventCb, formEvents[eventCb], extraInfo);
                    }
                }
                if(!i.hasOperateLines(data)) return;

                /*230806，i.formEventBubblingUpper()调用触发时传递的事件，会自动更新注册（如果没有）到bindEvents的属性列表中。不过注意，通常这是运行状态，而bindEvents是发生在
                编辑状态，因此不能代替渲染元素组件初始手动注册事件列表！*/
                if (data.ca('bindEvents') == undefined) data.ca('bindEvents', ['*']);
                if (eventType && data.ca('bindEvents').indexOf(eventType) == -1) {
                    console.error('event type', data.getTag(), eventType, 'not exist,and will be auto added to bindEvents!', data);
                    data.ca('bindEvents').push(eventType);
                }
                //没有首个*时，在开头就加上！
                if (data.ca('bindEvents').indexOf('*') == -1) data.ca('bindEvents').splice(0, 0, '*');
                function __ubc(async = false) {
                    triggerBindControls && i.ubc(data, formDatas, eventType, async); //form属性值给到表单提交
                }
                let topdatatmp = i.topData(data);
                //240202，将!topdatatmp._i_isCompleteLoaded改成topdatatmp._i_isCompleteLoaded <= 0，因为有负数！
                if (topdatatmp && topdatatmp != data && (topdatatmp._i_isCompleteLoaded <= 0 || topdatatmp._i_isCompleteLoaded === undefined /* && topdatatmp.ca('isLoadingGet')*/ )) {
                    if (topdatatmp._i_isFirstInitLoaded) {
                        __ubc(true);
                    } else {
                        _i.setTimeout(() => {
                            __ubc(true);
                        }, 0);
                    }
                } else { //正常运行状态下操作，连线逻辑需要按照同步顺序！否则连线索引的意义先后执行顺序就变了！！data.fp初始运行加载中，而i.ubc连线操作则加载和加载后两种不同时候都有！
                    if (
                        data._i_setUbcQueued
                    ) {
                        _i.setTimeout(() => {
                            __ubc();
                        }, 0);
                        data._i_setUbcQueued = undefined;
                    } else {
                        __ubc();
                    }
                }
            },
            //获取图元在图纸序列号后的json
            getDataJson: function(data) {
                let ret = null,
                    tag = i.autoTag(data),
                    foundtmp = false; //240616，为了提前结束循环！
                data.dm().toJSON().d.forEach(dataJson => {
                    if (foundtmp) return; //240616，为了提前结束循环！
                    if (dataJson && dataJson.p && dataJson.p.tag == tag) {
                        foundtmp = true; //240616，为了提前结束循环！
                        ret = dataJson;
                    }
                });
                return ret;
            },
            //231104，解析图纸url获得dm
            toDataModel: function(url, dmCallback = null, forceLoad = true) {
                //缓存
                if (i.window()._i_displaySources && i.window()._i_displaySources[url] !== undefined) {
                    let dmtmp = i.window()._i_displaySources[url];
                    dmCallback && dmCallback(dmtmp); //240302，缓存也要执行回调！
                    return dmtmp;
                }

                let imgObj = i.getImage(url);
                //231123，返回处理
                function __ret(displayObject) {
                    let dmtmp = new ht.DataModel();
                    //加载
                    dmtmp.deserialize(displayObject);
                    dmCallback && dmCallback(dmtmp);
                    //更新缓存
                    if (i.window()._i_displaySources == undefined) i.window()._i_displaySources = {};
                    i.window()._i_displaySources[url] = dmtmp;
                    return dmtmp;
                }

                if (imgObj) {
                    return __ret(imgObj);
                } else {
                    //合并请求
                    i.onImageLoaded(url, img => {
                        console.warn('WARN: async get dataModeled value by loading', url);
                        return __ret(img);
                    });
                    forceLoad && ht.Default.getImage(url);
                    return undefined;
                }
                return undefined;
            },
            //对图元设置json并保存
            setDataJson: function(data, json, url = null, excludes = [], callback = null, setId = true) { //图纸url，默认取data.dm()._url，也可以显示传入，特别是对当前图纸的编辑时
                //参数类型核对
                console.assert(url == null || typeof(url) == 'string');
                if (typeof(json) == 'string') json = i.jsonParse(json); //兼容传入json对象或json字符串
                let dm = data.dm();
                excludes.forEach(dataRemoved => {
                    dm.remove(dataRemoved);
                });
                let displayURL = dm._url;
                if (setId) {
                    //获取图元对应的图纸url
                    tabURL = editor.tab.getTag();
                    if (url == undefined && displayURL == undefined && editor) {
                        displayURL = tabURL;
                    }
                }

                let ret = null,
                    id = data.getId(),
                    dmJson = dm.toJSON(),
                    datas = dmJson.d,
                    rect = data.getRect(); //230904，粘贴后尺寸位置保持当前的而不是内容的

                //更新局部内容（当前data对应的json）
                let indextmp = -1,
                    rawData = data,
                    tagtmp = i.autoTag(data); //230612，存放tag

                datas.forEach((data, index) => {
                    if (data.i == id) {
                        if (isObject(json.p.image)) json.p.image = json.a.symbol;
                        if (setId == false) {
                            json.p.tag = tagtmp = i.autoTag(rawData); //允许ID变了，那么只有通过tag来找回，这里设置tag也是避免被后面赋值覆盖了。
                        }
                        //230620，这句非常重要，否则复制组件，会导致里面的对象在复制的组件和原组件图元中称为引用！
                        datas[index] = i.clone(json);
                        indextmp = index
                    };
                });
                dm.clear(); //tips 240419，这句不能屏蔽掉，否则会导致网格组合grid的动态增减行列会出错，而且组件的源文本粘贴后保存也会出问题！
                try {
                    dm.deserialize(dmJson, null, setId); //230612，加上参数，让ID可以设置是否保留或者自动更新，对于当前页面图元复制粘贴时，很有必要，否则ID重复！   
                } catch (error) {
                    console.error(error);
                }
                dm._url = url ? url : displayURL; //230226，原先只有displayURL，现在加上url判断，如果有传入，就用url，表示存放到指定路径的图纸
                //dm数据图元默认选中图元
                setId && dm.getSelectionModel().as(dm.getDataById(id)); //230612，加上了tag识别

                //保存文件
                //230612，加上了参数setId后（默认值1），同时也加到序列化保存的条件上，此时当成是运行时动态内存操作，不保存序列化到图纸！
                setId && i.upload(dm, callback);

                //返回新的对象，传入的图元对象data，经过dm的反序列化重新加载，对象已经变了！！
                let newDataTmp = dm.getDataByTag(tagtmp);

                //230904，粘贴json时，对于动态创建的属性，也要支持能还原！
                _i.setTimeout(() => {
                    console.assert(!!newDataTmp);
                    newDataTmp && newDataTmp.setRect && newDataTmp.setRect(rect);
                }, 0);

                return newDataTmp;
            },
            //获取attrObject对象，避免直接赋值把已有的覆盖掉！
            attrObject: function(data) {
                let attrObj = data.getAttrObject();
                if (attrObj == undefined) {
                    attrObj = {};
                    data.setAttrObject(attrObj);
                }
                return attrObj;
            },
            /*230912，存在以下情况，因此需要特别判断！
            输入：Number("1701423817690554369")
            输出：1701423817690554400
            231201 tips 默认下：i.isStringNumber(undefined/null)都是false
            */
            isStringNumber: function(str, stringOnly = false, excludeBoolean = false) {
                //230924，非字符串，直接返回false，即便本身就是数字！
                if (stringOnly && typeof(str) != 'string') return false;
                if(typeof str == 'boolean' && !excludeBoolean) return true;
                let ret = typeof str == 'number' || (typeof str == 'string' && isFinite(str) && !isNaN(parseFloat(str)));
                if (ret && i.isNumberStringTooLong(String(str))) ret = false;
                return ret;
            },
            //240304，判断数字字符串是否太长，导致Number()转换会失真！主要是给i.isStringNumber用，避免转换成数字结果变样了！
            isNumberStringTooLong: function(numberString) {
                // 移除可能的负号  
                if (numberString[0] === '-') { 
                    numberString = numberString.slice(1);  
                } 
                // 检查长度是否大于16  
                return numberString.length > 16;
            },
            //230306，为了便于编辑器中字符串配置兼容bool/int类型变量
            getTypedValue: function(strVal) {
                if (strVal === undefined) return undefined;
                if (strVal === null) return null;
                console.assert(typeof strVal == 'string');
                let valtmp = i.lower(strVal).trim();
                if (valtmp == 'true') return true;
                if (valtmp == 'false') return false;
                if (i.isStringNumber(valtmp)) return Number(valtmp);
                else return strVal.trim();
            },
            //对数组arr指定索引位置赋值，如果数组长度不够，那么中间的索引位置自动填充默认为null的值！
            //tips 240214，注意，如果索引已存在，会替换覆盖值，而不会挤插进去！用arr.splice(index, 0, value)则会自动插入，不会替换！
            setIndexValue: function(arr, index, value, valAutoFilled = null) {
                if (!(arr == null || isArrayFn(arr))) {
                    console.assert(0);
                    return;
                }
                index = Number(index);
                if (arr == null) arr = [];
                if (arr.length >= index) { //240214，索引长度内的，用splice性能更高！不要循环遍历！
                    arr[index] = value;
                } else {
                    for (let i = 0; i <= index; i++) {
                        if (arr[i] === undefined) arr[i] = valAutoFilled;
                        if (i == index) arr[i] = value;
                    }
                }
                return arr;
            },
            //230221,别名
            setArrayIndexValue: function(arr, index, value, valAutoFilled = null) {
                return i.setIndexValue(arr, index, value, valAutoFilled);
            },
            /*遍历dm内所有图元，根据name即data.getName()，获取匹配的图元（列表），注意，待测试！！230118*/
            getDatasByName: function(dm, name, precise = true) { //默认是精确匹配查找
                let matched = [];
                dm.eachByBreadthFirst((child) => {
                    if (precise ? child.getName() == name : i.lower(child.getName()).indexOf(i.lower(name)) != -1) {
                        matched.push(child);
                    }
                })
            },
            //230226,清空，但是保持引用
            arrClear: function(arr) {
                let isArrTmp = isArrayFn(arr);
                console.assert(isArrTmp);
                if(!isArrTmp) arr = []; 
                arr.length = 0;
                return arr;
            },
            //230305,清空，但是保持引用
            objClear: function(obj) {
                console.assert(typeof(obj) == 'object');
                if(typeof(obj) != 'object') obj = {};
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) { //240208，by gtp，增加这个条件。
                        delete obj[key];
                    }
                }
                return obj;
            },
            //230226,引用赋值覆盖回写数组array
            arrOverwrite: function(arr, arrData) {
                if (!isArrayFn(arr)) {
                    console.error('need array type,but given', arr);
                    return;
                }
                i.arrClear(arr);
                if (arrData.forEach) {
                    arrData.forEach(element => {
                        arr.push(element)
                    });
                } else {
                    let arrTypedTmp = i.toTreeJson(arrData); //传入如果是对象，只识别{0:xx, 1:yy, 2:zz}这种格式并且转成数组[xx,yy,zz]
                    if (isArrayFn(arr)) {
                        if(isObject(arrTypedTmp) && !isArrayFn(arrTypedTmp)) arrTypedTmp = [arrTypedTmp];
                        i.arrOverwrite(arr, arrTypedTmp);
                    } else {
                        console.error('ERROR: overwrite to arr error, type not supported!', arrData)
                    }
                }
                return arr;
            },
            //230305,引用赋值覆盖回写对象object
            /*
            输入：
            let a = {
                'x':3,
                'y':{
                    'z':4,
                    'w':[5,6,7]
                }
            }
            执行：
            console.error(i.objClear(a));
            i.objOverwrite(a,{'o':1,'p':[9,0]});
            console.error(a)
            输出：
            {}
            {
                "o": 1,
                "p": [
                    9,
                    0
                ]
            }
            */
            //240223，加上参数ignoreClear，因为i.objClear也有循环，但是如果要覆盖的字段都一样，就没必要浪费性能多一次for循环！
            objOverwrite: function(obj, objData, ignoreClear = false) {
                !ignoreClear && i.objClear(obj);
                for (let key in objData) {
                    obj[key] = objData[key];
                }    
                return obj;
            },
            //230420，自动根据类型来做objOverwrite还是arrOverwrite，比如树表treeTable，行数据可以是[]也可以是{rowData:[],children:[]}，修改行时引用赋值就得注意了！
            overWrite: function(instance, targetValue) {
                if (isArrayFn(instance)) {
                    if (!isArrayFn(targetValue)) { //instance为数组，传入的值应该也是数组格式，这里对于treeTable树表做特别支持，如果值是行的对象格式，那取其数组格式即可！
                        if (isArrayFn(targetValue.rowData)) targetValue = targetValue.rowData;
                    }
                    return i.arrOverwrite(instance, targetValue);
                } else {
                    console.assert(isObject(instance));
                    if (isObject(targetValue)) { //instance为对象，传入的值应该也是数组格式，这里对于treeTable树表做特别支持，如果值是行的数组格式，那就转换成对象格式
                        if (isArrayFn(instance.rowData) && isArrayFn(targetValue)) targetValue = { //item为treeTable树表的行对象格式且value为数组时，将value转换成行对象格式！
                            rowData: targetValue,
                            children: []
                        }
                    }
                    return i.objOverwrite(instance, targetValue);
                }
            },
            //230722，前面的i.overWrite()是通过的对js数组或对象的处理，但是无法处理ht图元对象，现在加上传入图元对象，在里面支持逐层向上同步！并且此同步不会触发死循环
            overWriteUpper: function(data, attr, value) {
                i.innerNotifyUpper(data, attr, value);
                if (data.ca(attr) != undefined) {
                    // data.getAttrObject()[attr] = value;
                    // i.update(data, attr, value, attr)

                    i.overWrite(data.ca(attr), value);
                } else data.ca(attr, []);
            },
            /*对于渲染元素md属性监听事件函数中，对其他同样出于监听的属性进行赋值，一般不能直接用data.a()/data.ca()，极有可能导致死循环！此函数代替
            并且支持对form表单的逐层向上同步！该函数需要成对被使用，且参数分别是对象{}、字符串，回写赋值调用方式如下：
            i.backWriteAttrs(data, {
                'a:paramKeys': Object.keys(flatValue),
                'a:paramValues': Object.values(flatValue)
            });
            调用触发不需要其他任何处理，只需要对data.ca()、updateForce()等赋操作，改成i.update()即可，并且最后一个参数传入当前变化触发的属性：
            i.update(data, 'jsonFormat', i.copy(paramtmps), changedAttr);*/
            backWriteAttrs: function(data, attr2Value, triggeredAttr = null) { //最后一个参数triggeredAttr这里暂未测试，目前仅在i.update中最后参数triggeredAttr有测试！
                if (isObject(attr2Value)) {
                    for (let attr in attr2Value) {
                        let attrFullName = i.autoPrefixed(attr, data),
                            valuetmp = attr2Value[attr];
                        data[attrFullName.slice(2) + '-writing'] = true;
                        i.update(data, attr, valuetmp, triggeredAttr);
                    };
                } else {
                    console.assert(typeof attr2Value == 'string');
                    let attrFullName = i.autoPrefixed(attr2Value, data);
                    if (data[attrFullName.slice(2) + '-writing'] == true) {
                        delete data[attrFullName.slice(2) + '-writing'];
                        return true;
                    } else return false;
                }
            },

            /*230218，配合i.md使用，作为backWriteAttrs的补充或代替（前提是要用i.md()代替常规的data.dm().md()），因为backWriteAttrs用起来比较麻烦，
            而且还依赖于被回写属性函数内需要用i.update代替data.ca()，耦合性太强，不好用！这里的i.backWriteOnly结合i.md，则只管调用就好！*/
            backWriteOnly: function(data, attr, value) {
                data._i__backWriteOnly__ = true;
                updateForce(data, attr, value);
                data._i__backWriteOnly__ = undefined;
            },
            /*230218，新增封装渲染函数中都要用到的事件交互监听器：data.dm().md()
            同时加上通用处理，比如支持纯回写属性而不触发事件响应！*/
            md: function(data, gv, cache, //常规的三元素
                attr2eventFunc, //格式如{'a:value': function(data, gv, cache, control, extra){}}这样的attrKey-functionValue键值对！
                attrsInit = [],
                loadedInit = null, //230607，增加图片/图标资源加载完毕后的初始化回调，对于依赖默认值等情况的，都需要图标json资源文件提前加载完毕才行，否则会出现underfined等错误！
                control = null, //传入ui控件对象（如果有）
                commonCb = null, //属性无关的通用处理，只要事件到本图元就触发的回调函数，无入参，因为参数都是调用i.md时传入的，这里入参跟自己传入的一样！
                childrenCb = null, //230224，与commonCb不同，前者是当前图元的所有属性变化多会过，而这里则是当前图元data的子节点图元的md监听的响应！
            ) {
                let dmtmp = data.dm();
                if (dmtmp == undefined) {
                    console.error('data has been removed??', data);
                    return false;
                };
                let bAttrs = data.ca("bindControlsAttr");
                bAttrs && bAttrs.forEach((bAttr,idx)=>{
                    if(bAttr && bAttr.slice(1,2) != ':'){
                        let toNode = d(data.dm(), data.ca("bindControlsTag")[idx]);
                        console.assert(toNode);
                        bAttrs[idx] = i.autoPrefixed(bAttr,toNode);
                    }
                    let pAttr = data.ca("paramControlAttr")[idx];
                    if(pAttr && pAttr.slice(1,2) != ':'){
                        let pTag = data.ca("paramControlTag")[idx],
                            fromNode = d(data.dm(), pTag ? pTag : data.getTag());
                        console.assert(fromNode);
                        data.ca("paramControlAttr")[idx] = i.autoPrefixed(pAttr,fromNode);
                    }
                });
                let titlePopupGroupName = '弹出框 *'; //注意，不能用i.trans()因为运行状态下没这个貌似！！！
                if (control && control.getView && control.getView()) control.getView().id = data.dm()._url + '@' + i.autoTag(data);
                /*240427，动态插入pop弹出框属性，放到函数内，因为在切换内嵌display页时，需要清理上一次继承过来的，因为发现切换继承页面，没有动态清理掉！所以就通过setImage
                完整清理，然后再安装pop相关属性！*/
                function __dynamicInstallPopOverAttrs() {
                    //240620，图标按钮不支持弹出层！因为没有control！！
                    if (
                        i.isControlTyped(data, 'cbtn') ||
                        !control
                    ) return;

                    i.insertTempAttrs(data, [{
                        "attr": 'display', //"popPageURL", 240427，用display，这样就可以属性继承面板！
                        "valueType": "Image",
                        "defaultValue": "",
                        "description": `自定义页面地址。
                可以是编辑器中的其他页面，也可以
                是外部网页链接地址。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'pureTipText',
                        valueType: 'String',
                        defaultValue: '',
                        "description": `提示文字。
                    当专业用户属性中，提供display内嵌页属性，
                    如果有配置，那么本属性设置无效，将以内嵌
                    页显示为准。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'popDirection',
                        valueType: 'SideDirection',
                        defaultValue: 'right',
                        "description": `提示显示位置。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'popBackground',
                        valueType: 'Color',
                        defaultValue: 'white',
                        "description": `箭头和背景色。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'popPadding',
                        valueType: 'NumberArray',
                        defaultValue: [2, 2, 2, 2],
                        "description": `内间距。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'popWidth',
                        valueType: 'Number',
                        defaultValue: 400,
                        "description": `弹出框宽度。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'popHeight',
                        valueType: 'Number',
                        defaultValue: 300,
                        "description": `弹出框高度。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'popBorderColor',
                        valueType: 'Color',
                        defaultValue: "rgb(51,51,51)",
                        "description": `边框线颜色。
                    注意，是设置了边框宽度非0后的边框颜色。
                    默认边框宽度属性为0时，实际上是白色并
                    带有箭头指示的边框。本属性不用于修改默
                    认边框色。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'popBorderWidth',
                        valueType: 'Number',
                        defaultValue: 0,
                        "description": `边框线宽度。
                    默认值为0，此时边框默认为白色并且带有
                    箭头指示。当设置宽度后，颜色将取边框颜
                    色属性的设置，并且不再有箭头指示。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'popBorderRadius',
                        valueType: 'Number',
                        defaultValue: 0,
                        "description": `边框线圆角。
                    设置圆角线后，如果此前默认是白色边框带有
                    指示箭头，那么将自动不可见，只对内容区域
                    产生圆角。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }, {
                        attr: 'popTriggerEvent',
                        valueType: 'MouseEvent',
                        defaultValue: 'hover',
                        description: `触发方式。
                支持鼠标移入、点击（按钮时）
                两种触发提示的方式。`,
                        "group": titlePopupGroupName,
                        bindIgnored: true
                    }], 'paramsGenerator', null, false); //240705，默认不继承！！避免属性太多！！
                }
                //240428，将i.hasInner改成i.hasAttrObjectKey，避免出事display属性为空的容器组件刚拖放进来，i.hasInner判断为false，导致其原本的display属性被高级提示拿去了！
                let hasDisplayTmp = i.hasAttrObjectKey(data, 'display') || i.isControlTyped(data, 'ifm'), //i.hasInner(data),
                    symbolItemTmp = hasDisplayTmp && i.getDataBindingItem(i.getImage(data), 'display'),
                    popIgnored = i.isControlTyped(data, 'func') ||
                    i.isControlTyped(data, 'bus') ||
                    i.isControlTyped(data, 'api');
                //240427，如果不是容器组件，或者看似容器组件但实际上通用提示框内嵌页，此时标记hasPopDisplay为true
                data._i_hasPopDisplay = (!hasDisplayTmp || (symbolItemTmp && symbolItemTmp.group == titlePopupGroupName)) && !popIgnored
                if (!hasDisplayTmp && !popIgnored) { //240427，只要之前有display属性，不论是容器组件，还是提示窗的，那么就不再追加提示窗的display
                    __dynamicInstallPopOverAttrs(); //240724，从版本997开始，这里竟然莫名其妙给注释掉了，其他前后文没有对这个操作任何注解！发现这里去掉，导致专业模式也显示不出来弹出框属性组！因此加上了现在！！
                }
                let hasInnerTmp = i.hasInner(data), //tips 240130，注意，现在hasInner中有判断容器图元的display上层是否有form绑定，即在上层重新设置url，此时底层内嵌图元不被视作hasInner的容器图元，返回false，效果和执行逻辑等同于内嵌初始配置空字符串""
                    attrValueTobeFpSync = {};

                //240214，对于容器组件，实例化对象时就先缓存自己上次保存序列化的数据绑定和继承的属性。用于初始加载过程中，内嵌属性好判断此前保存的状态！注意，当前对于treeTable还没处理data.dm转i.md，属性继承暴露设置会有问题！！
                if (hasInnerTmp) {
                    data._i_rawDataBindingsInherit = []; //240214，只保存keyURL内嵌的
                    data.getDataBindings() && i.keys(data.getDataBindings().a).forEach(attr => {
                        i.isKeyURL(attr) && data._i_rawDataBindingsInherit.push(attr);
                    });
                }

                function __addCommonAttrsDynamic() {
                    //240206，所有组件都具备的同源属性操作属性
                    i.hasAttrInLocalObj(data,'paramsGenerator') && i.insertTempAttrs(data, [{
                        attr: "useAttrCORS",
                        valueType: "Boolean",
                        extraInfo:'*',
                        defaultValue: false,
                        description: `连线操作和处理回写是否一致。
                        比如多个文本框连线传值给相同对话框，弹窗修改
                        后是否限定只能写到最新赋值过来的文本框。详见<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#fFUbp' style="color:rgb(96,172,252)"target="_blank">同源属性操作</a>`,
                        bindIgnored: true
                    }], 'paramsGenerator', null, false);
                }
                //240206，非容器组件这里直接追加，容器组件动态新增属性，需要在onDisplayLoaded属性的响应监听内才行！
                if (!hasInnerTmp) {
                    __addCommonAttrsDynamic();
                }

                //条件封装成函数
                //240123，传入initDisplayOnly为false时，所有非display的属性进行初始化！传入为true时反过来只初始化display的属性！
                function __isAttrTypeForSyncFp(attr, isDisplayType) {
                    let isAttrDisplay = ( //1）容器组件，且属性名称为display，且不是tab页签组件（tab页签的加载取决于index、relativePath属性）
                            hasInnerTmp &&
                            attr.slice(-7) == 'display' &&
                            !i.isControlTyped(data, 'tab')
                        ) || //2）对于tab页签组件，index属性或者relativePath属性都要立即同步触发执行，而不是让form绑定的来异步触发，代替常规容器组件display属性的作用！
                        (
                            i.isControlTyped(data, 'tab') && (
                                attr.slice(-5) == 'index' ||
                                attr.slice(-12) == 'relativePath'
                            )
                        ),
                        isTypeIgnored = false, //i.isControlTyped(data, 'dlg'),
                        isTypeMatched = isDisplayType ? isAttrDisplay : !isAttrDisplay, //当前属性是否符合传入的设定，即是否是display属性
                        //240124，加上条件isTypeMatched，符合条件的，才判断是否有上层form绑定！
                        isUpperFormed = isTypeMatched && i.getAttrFormTypedValueUpperLatest(data, attr, 1, true); //当前属性是否有上层form绑定
                    if (isUpperFormed) {
                        if (data._i_attrOldValue === undefined) data._i_attrOldValue = {};
                        data._i_attrOldValue[i.autoPrefixed(attr, data)] = i.getValue(data, attr);

                        i.setValue(data, attr, '__init__');
                    }
                    return (isTypeIgnored || isTypeMatched) && (!isUpperFormed || isAttrDisplay); //240123，如果上层有iotos.form绑定，那么本次就不进下初始化，反正上层会再来初始化的！避免下层初显、上层覆盖，这样多次触发初始化执行。
                }

                let attrsSyncInitNeeded = []; //240225，如果属性初始化设置的是对象，且value为“__init__”，那么该属性就当下同步立即执行初始化！
                if (data._i_hasPopDisplay) attrsInit = [...attrsInit, 'a:display']; //240427，默认需要初始化的！
                if(attrsInit.indexOf('a:disabled') == -1 && attrsInit.indexOf('disabled') == -1) attrsInit.push('a:disabled');
                if(attrsInit.indexOf('a:readOnly') == -1 && attrsInit.indexOf('readOnly') == -1) attrsInit.push('a:readOnly');
                attrsInit.forEach((attr, index) => {
                    function __fpInit(attr, val) {
                        if (__isAttrTypeForSyncFp(attr, true)) { //240123，是display属性，而且上层没有做form绑定
                            if (!attrValueTobeFpSync['displayAttr']) attrValueTobeFpSync['displayAttr'] = {}; //240123，在此前attrValueTobeFpSync[attr]前面加上字段"displayAttr"这一级
                            attrValueTobeFpSync['displayAttr'][attr] = val; //240123，data.fp统一放到后面来做，否则因为在下面.mi之前就fp，就不会响应md监听
                        }
                        if (__isAttrTypeForSyncFp(attr, false)) { //240123，不是display属性，而且上层没有做form绑定
                            if (!attrValueTobeFpSync['otherAttrs']) attrValueTobeFpSync['otherAttrs'] = {}; //240123，在此前attrValueTobeFpSync[attr]前面加上字段"otherAttrs"这一级
                            attrValueTobeFpSync['otherAttrs'][attr] = val; //240123，data.fp统一放到后面来做，否则因为在下面.mi之前就fp，就不会响应md监听！
                        }
                    }
                    if (isObject(attr)) { //支持初始化的属性列表中，有对象key-value的形式存在，给出指定的固定初始值；如果只给属性名，则通过data.ca()从组态配置去取；
                        for (let key in attr) {
                            let valtmp = attr[key];
                            if (valtmp === '__init__') {
                                attrsSyncInitNeeded.push(key);
                            }
                            //tips 240225，注意，这里并未在上面if()基础上else，而是顺次执行！因此前面机制，是完全兼容过往逻辑！
                            __fpInit(key, valtmp);
                        }
                    } else if (attr != undefined) {
                        console.assert(typeof attr == 'string');
                        __fpInit(attr, i.getValue(data, attr));
                    }
                });

                function __onAttrEvent(e) {
                    if (e.data == data) {
                        /* event格式：
                        {
                            property: 'name',//发生变化的属性
                            oldValue: 'oldValue',//旧值
                            newValue: 'newValue',''新值
                            data: data//发生变化的data
                        }*/
                        //230219，所有组件公共都有的变量和属性处理
                        switch (e.property) {
                            case 'image':
                                if (data._i_imageSetting) return;
                                if (e.newValue == '[object Object]') {
                                    data._i_imageSetting = true;
                                    typeof(e.oldValue) == 'object' && data.setImage(e.oldValue);
                                    data._i_imageSetting = undefined;
                                    return;
                                }
                                break;
                                //tips 240112，注意，在config.js中：let mdCbFunc = e => {，也有对gvtmp的tag监听处理，这两处确实有重复，暂不动！
                            case 'tag': //230807，tag标签同步关联连线的bindControls；标签p:tag设置，注意，实测发现这里是'tag'而不是'p:tag'。这里用来做修改tag时，关联的连线名称自动同步更新，避免隐藏问题！
                                i.__tagChecking(data, e.oldValue, e.newValue);
                                break;
                            case 'a:value':
                                break;
                            case 'a:display': //230422，容器图元的内嵌图纸url，默认改成当前用户的版本，如果非当前用户及公共下的图纸，会自动切换成当前用户的进行保存
                            case 'a:relativePath': //__tabView里的相对路径
                                /*231015，对话框类型去掉这里清空[]，因为相对于其他容器，切换display就是切换不同的页面覆盖之前的，但是tab页签的display是用来被动读取，已有的多个以前
                                切换时，display显示当前的完整路径*/
                                if (!i.isControlTyped(data, 'tab')) {
                                    data.innerDataBindings = [];
                                    /*240219，容器组件动态切换内嵌页时，需要清理此前缓存的内嵌图元，否则会出现比如属性继承面板中，还残留上一次内嵌的属性配置！注意，当前对于tab页签的页签内嵌页动态变化暂未针对性处理！*/
                                    data._i_innerDatas = {};
                                    data._i_keyURL2FormValueTag = undefined;
                                }
                                //240122，动态变化display url时，复位清理当前图元组件是否有内嵌页面的缓存。因为出现过图元内嵌了display暴露出来form绑定动态设置内嵌页时，复制粘贴一个，再重加载就有断言报错！
                                data._i_cachedHasInner = undefined;
                                if (e.property == 'a:display' && !data._i_hasPopDisplay) {
                                    if (!e.newValue) { //240123，避免清空display url的输入或者设置空字符串时，导致此前进入下面最后的else里，误执行data._i_innerDisplayDynamicLoad对上层计数自增！
                                        break;
                                    } else if (e.oldValue == '__init__' && !data._i_isFormInitInnerFping) {
                                        data._i_innerDisplayDynamicLoad = false;
                                    } else if ( //240129，下层容器的display属性值为空""，且暴露到上层form绑定，且初始加载时data.fp传入上层动态设置的display内嵌页url下来时，实测需要做动态向上增加计数！
                                        e.oldValue == '__init__' && //初始加载display属性赋值
                                        data._i_isFormInitInnerFping && //是data.fp对form绑定的初始化
                                        i.upperData(data) && //属于内嵌的容器图元
                                        data._i_isCompleteLoaded === undefined && //没有开始加载内嵌
                                        i.getAttrFormTypedValueUpperLatest(data, 'display', 1, true) //上层对display赋值且有form绑定。tips 240208，好像有点多余，因为现在data._i_isFormInitInnerFping进来就已经表明了！
                                    ) {
                                        console.assert(data._i_isCompleteLoaded === undefined);
                                        data._i_innerDisplayDynamicLoad = false;
                                        i.updateUppersWhileDynamicLoading(data, true);
                                    } else {
                                        data._i_innerDisplayDynamicLoad = true;
                                        !i.isControlTyped(data, 'tab') && i.updateUppersWhileDynamicLoading(data);
                                    }
                                }
                                let urltmp = e.newValue;
                                if (!runningMode() && e.property == 'a:display' && data._i_hasPopDisplay && e.oldValue !== '__init__') {
                                    data.setImage(data.ca('symbol'));
                                    __dynamicInstallPopOverAttrs();
                                }

                                //240531，高级提示支持直接设置提示文字，而不是都用内嵌页面
                                let pureTextTmp = data.ca('pureTipText'),
                                    hasPureText = pureTextTmp && pureTextTmp.trim() !== '';
                                if (urltmp || pureTextTmp) {
                                    if (urltmp) {
                                        //230601，连线操作display属性动态赋值内嵌元素或者资源链接时，可能误传递过来表单对象了！
                                        if (typeof urltmp != 'string') {
                                            console.error('param error!need url string,bug given', urltmp);
                                            return;
                                        }
                                        urltmp = i.toAbsDisplayURL(data, urltmp); //230929，相对路径的，转成绝对路径再继续下面逻辑，为了兼容！
                                        let urlfield = urltmp.split('/');
                                        console.assert(urlfield[0] == 'displays');
                                        if (urlfield[0] != 'displays') { //对于iframe的src，传入可以是displays开头的图纸路径，也可以是http url
                                            console.warn(e.property, e.newValue, 'is not displays url??');
                                            break;
                                        }
                                        //demo账号的资源作为共享的可以打开，不过已经不允许编辑了，因此放行！
                                        if (i.user() && urlfield[1] != 'demo' && urlfield[1] != i.user()) {
                                            urlfield[1] = i.user();
                                            let newURL = urlfield.join('/'),
                                                msgtmp = '内嵌图纸不匹配当前用户' + i.user() + '，将被自动转换成' + newURL;
                                            console.error('WARN', msgtmp);
                                            data.ca(e.property.slice(2), newURL);
                                            return; //本次直接返回，交给下一次触发i.md监听进来执行后面display逻辑，以新的值！
                                        }
                                    }

                                    //240427，对于非容器组件的提示框内嵌动态追加的display属性，有填入内嵌页路径时，这里加载内嵌页，把自己当成容器了！参照__graphView的内嵌页加载方式！
                                    if (data._i_hasPopDisplay || hasPureText) {
                                        function createPopover(placement) {
                                            if (urltmp) {
                                                let gvtmp = data._popGv = new ht.graph.GraphView();
                                                i.addChildDataModel(data, gvtmp, 'ui0'); //230401，传入从dm改成gv；
                                                initGVLoadedRunning(gvtmp, false, false, true);
                                                if (data._popover) {
                                                    data._popover.clear();
                                                    delete data._popover;
                                                    data._popover = null;
                                                    delete data._popGv;
                                                    data._popGv = null;
                                                }
                                                let popover = data._popover = new ht.ui.Popover();
                                                popover.setPreferredSize(data.ca('popWidth'), data.ca('popHeight'));
                                                popover.setPlacements(placement == 'auto' ? undefined : [placement]);
                                                loadDisplay(gvtmp, data.ca('display'), cache, function(json, dm, gv, datas) {
                                                    //内嵌图纸加载后的事件回调
                                                }, {
                                                    renderData: data,
                                                    renderGv: gv,
                                                    multiDistinctIndex: 0
                                                })
                                                popover.setContentView(new ht.ui.HTView(gvtmp));
                                                return popover;
                                            } else { //240531，纯文字提示时，不用内嵌页的简单情况！注意，此时没有data._popover，貌似更多样式无法设置！
                                                control.setPopoverPlacements([placement]);
                                                return pureTextTmp;
                                            }
                                        }
                                        if ((e.newValue || hasPureText) && control) {
                                            //240531，如果有内嵌页，就用内嵌页显示，如果没有，但是有设置纯提示文字，那么就显示文字！
                                            control.setPopover && control.setPopover(createPopover(data.ca('popDirection')), data.ca('popTriggerEvent'));
                                            if (urltmp /*!runningMode()*/ ) { //240430，编辑、运行状态都需要这样，否则都会出现加载反弹异常的问题！
                                                control.showPopover();
                                                /*240427，这里需要处理下，因为初始编辑加载时，避免这类弹出也自动出来，需要自动再隐藏掉！否则停驻在编辑界
                                                面上怪怪的！只有在编辑时动态修改pop弹出框的display内嵌页地址时，才会弹出驻留下，初始加载不要驻留！*/
                                                if (e.oldValue == '__init__') {
                                                    data.ca('onDisplayLoaded', `function(data, gv, cache) {
                                                    data._uiView && data._uiView.hidePopover();
                                                }`);
                                                }
                                            }
                                        } else if (control && control.setPopover) control.setPopover(null);

                                        //240428，样式设置，放到这里方便生效，因为放到case里，运行时还需要找初始触发才行！
                                        if (data._popover) {
                                            data._popover.setArrowBackgroundColor(data.ca('popBackground'));
                                            data._popover.setBackground(data.ca('popBackground'));
                                            let paddingtmp = data.ca('popPadding');
                                            if (!paddingtmp || (isArrayFn(paddingtmp) && paddingtmp.length == 0)) paddingtmp = [0, 0, 0, 0];
                                            data._popover.setPadding(paddingtmp);
                                            data._popover.setPlacements(data.ca('popDirection') == 'auto' ? undefined : [data.ca('popDirection')]);
                                            data._popover.setPopoverTrigger(data.ca('popTriggerEvent'));
                                            //240428，边框或圆角，任何一个属性有设置，那么就不会再用默认的白色边框和箭头的那个边框（发现颜色没法对齐进行设置！）
                                            (data.ca('popBorderRadius') || data.ca('popBorderWidth')) && data._popover.setBorder(new ht.ui.border.CSSBorder(data.ca('popBorderWidth'), data.ca('popBorderColor')));
                                            let radiustmp = data.ca('popBorderRadius');
                                            radiustmp && data._popover.setBorderRadius([radiustmp, radiustmp, radiustmp, radiustmp]);
                                            // data._popover.setBoxShadow(100);
                                        }
                                    }
                                } else {
                                    //240427，如果display属性清空且data._i_hasPopDisplay非空，那么也清理这个标记！
                                    //240501，加上条件&& e.oldValue !== '__init__'，这样避免初始刷新加载时，原本有动态新增了高级提示属性组后，display初始化时，因为初始为""，导致进入到这里将标记_i_hasPopDisplay复位掉了！
                                    if (e.property == 'a:display' && data._i_hasPopDisplay && e.oldValue !== '__init__') data._i_hasPopDisplay = undefined;
                                }
                                break;
                            case 'a:reset': //目前变量需要手动自己去创建才有此功能，暂时为自动创建，可用i.insertDynamicAttr来动态创建！（待处理）
                                if (e.newValue > 0) {
                                    data.ca(e.property.slice(2), 0); //首先复位，避免进不来后面
                                    //遍历所有a属性
                                    let attrValstmp = i.attrObject(data),
                                        ignoredAttrs = [ //不被还原重置的属性
                                            'display',
                                            'displays',
                                            'symbol',
                                            'bindControlsTag',
                                            'bindControlsAttr',
                                            'bindControlsVal',
                                            'paramControlTag',
                                            'paramControlAttr',
                                            'paramBindEvent', //230805，新增事件     //tips231130，貌似这里paramBindEvent参数没用，目前用的是_bindEvents_x
                                            'paramsGenerator'
                                        ]
                                    for (let attr in attrValstmp) {
                                        //按照规则还原（数值为0或空的恢复成默认值）
                                        let typetmp = i.getAttrType(data, attr),
                                            valtmp = attrValstmp[attr];

                                        function __reset() {
                                            if (ignoredAttrs.indexOf(attr) != -1) {
                                                console.error('attr', attr, 'will not be reset, as it is in ignored list:', ignoredAttrs);
                                                return;
                                            }
                                            let itemtmp = i.getAttrItem(data, attr);
                                            if (itemtmp) {
                                                attrValstmp[attr] = i.getAttrItem(data, attr).defaultValue;
                                            } else {
                                                console.error('WARNING: attr', i.autoTag(data) + '→' + attr, 'will be removed! as not be found in symbol databindings which is', i.getAttrItems(data));
                                                attrValstmp[attr] = undefined; //从编辑器属性中移除掉！
                                            }

                                            //230227，全部复位，对图纸中的数据绑定form也会复位！（过滤函数也会被复位掉）。注意，delete删除定义的引用变量是没用的，需要删除对象结构一层层下来的对象！
                                            let itmp = data.getDataBindings()['a'][attr];
                                            itmp && delete data.getDataBindings()['a'][attr];
                                        }
                                        //只还原数值为0、空的数据
                                        if (e.newValue == 1 &&
                                            (
                                                valtmp == [] ||
                                                valtmp == null ||
                                                valtmp == "" ||
                                                i.isObjEmpty(valtmp)
                                            )
                                        ) {
                                            console.error(i.autoTag(data), attr, 'has been reset!');
                                            __reset();
                                        }
                                        //彻底还原复位（按照底层的默认值）
                                        if (e.newValue == 2) {
                                            __reset();
                                        }
                                    }
                                }
                                break;
                            case 'a:userDataSelfInit': //230329，配合userData初始化data赋值的开关
                                if (!e.newValue) { //如果动态设置为0，那么会将userData的保存的任何值进行清空！
                                    data.ca('userData', []);
                                }
                                break;
                            case 'a:userData':
                                if (e.oldValue == '__init__') { //所有的都是处理初始化时的逻辑，动态赋值比如连线操作时，走属性操作的正常逻辑处理！
                                    //判断初始化进来时（oldValue为__init__），如果userDataSelfInit属性值不为true，那么跳出处理，保持默认值（可以是手动设定的，不一定是空[]）
                                    if (!e.data.ca('userDataSelfInit')) return;
                                    let vtmp = e.newValue;
                                    if (vtmp != data) { //避免里面data.ca()做data赋值时死循环！
                                        if (i.isNewValueEmpty(vtmp)) {
                                            vtmp = data;
                                            data.ca('userData', data);
                                        }
                                    }
                                    //逐层向上同步
                                    i.innerNotifyUpper(data, e.property, vtmp);
                                }
                                break;
                            case 'a:bindControlsVal': //230909，静态值修改后，配置值能体现在连线的toolTip上。
                                i.__bindControlsValUpdate(e);
                                break;
                            case 'a:disabled': //230918，多有表单组件都要设置有禁用功能，用于只读！此前有a:readOnly属性的保留，配合一起来设置表单的只读！
                                if (
                                    control &&
                                    !i.isControlTyped(data, 'cbox') &&
                                    !i.isControlTyped(data, 'combobox') &&
                                    !i.isControlTyped(data, 'range') //时间跨度下拉选择器，跟下拉框类似，为了让disabled的时候，用于显示，而不是完全禁用，这里临时这样处理。禁用完全没交互、浅灰色不适合“查看”模式
                                ) { //230918，下拉框调用setDisabled后，事件完全不响应，而且文字、组件边框都是浅灰色，不太好，还是用自定义效果。
                                    if (isArrayFn(control)) {
                                        control.forEach(obj => {
                                            obj.setDisabled && obj.setDisabled(e.newValue);
                                        });
                                    } else control.setDisabled && control.setDisabled(e.newValue);
                                }
                                break;
                            case 'a:innerLayoutMode':
                                /*240721，如果是内嵌加载完毕，向上同步加载模式属性时，上层的该属性不做任何响应处理！否则影响性能不说，逻辑容易跟上层设置发生冲突吧！因为这种情况下i.isEditring没法直接区分是加载反弹来，
                                还是手动修改该属性来的出发！*/
                                if(data._i_isUpdatingLayoutModeFromInner) break;

                                //240719，如果没有设置过，那么久跟随内嵌的变化，不自动保存时就锁定！如果有设置过非空，那么久锁定，清空（设置自动），则不锁定！
                                if(i.isEditing(data)){
                                    i.showMessage(e.newValue && e.newValue !== 'none' ? '已锁定内嵌布局设置。' : '已清除内嵌布局设置！');
                                    data.ca('innerLayoutModeLocked', e.newValue && e.newValue !== '' && e.newValue !== 'none');
                                }
                                let innerDmTmp = i.innerDataModel(data, -1), //内嵌页面的数据模型
                                    innerstmp = [];
                                if (!isArrayFn(innerDmTmp)) innerstmp.push(innerDmTmp);
                                else innerstmp = innerDmTmp;
                                innerDmTmp = innerstmp[0];

                                if (innerDmTmp) { //231231，加上条件，因为对于tab页签存在初始加载非当前index的最后页初始反弹进入，_gv和innerDm是没有的！
                                    let bottomNode = i.getNodeAsBase(innerDmTmp); //数据模型页面图纸最底层、最上层节点图元，用于作为默认底板用
                                    if (e.newValue == 'fitContent') { //1）适配内容
                                        innerDmTmp.a('fitContent', true);
                                        let basetmp = i.baseNode(bottomNode);
                                        basetmp && basetmp.s('fullscreen', undefined);
                                    } else if (e.newValue == 'fullScreen') { //2）全屏填充
                                        innerDmTmp.a('fitContent', false);
                                        i.setBaseNode(bottomNode);
                                    } else if (e.newValue == 'none') { //3）无
                                        innerDmTmp.a('fitContent', false);
                                        let basetmp = i.baseNode(bottomNode);
                                        basetmp && basetmp.s('fullscreen', undefined);
                                    }
                                }
                                //231010，切换内嵌页面布局模式时，为了能即时相应变化，需要通过内嵌gv做fitContent、zoomReset、iv()的区分调用
                                _i.setTimeout(() => {
                                    data._gv._i_innerGV && data._gv._i_innerGV.forEach(gvtmp => {
                                        if (gvtmp && gvtmp._i_belongToNode === data) {
                                            gvtmp.dm().a('fitContent') && gvtmp.fitContent(false, 0);
                                            !gvtmp.dm().a('fitContent') && gvtmp.zoomReset();
                                            gvtmp.iv();
                                        }
                                    })
                                }, 0);
                                break;
                            case 'a:onDisplayLoaded': //231009，容器组件加载完毕时，统一进行的处理
                                let currentConfigured = data.ca('innerLayoutMode');
                                let modetmp = 'none';
                                let innerDm = i.innerDataModel(data, -1),
                                    inners = [];
                                if (innerDm && !isArrayFn(innerDm)) inners.push(innerDm);
                                else inners = innerDm;
                                let baseNodeTmp = i.baseNode(inners[0], false);
                                if (baseNodeTmp) modetmp = 'fullScreen';
                                else if (inners[0] && inners[0].a('fitContent')) {
                                    modetmp = 'fitContent';
                                    _i.setTimeout(() => {
                                        let innerGVtmp = i.innerGV(data);   //240920，发现有undefined的情况！
                                        innerGVtmp && innerGVtmp.fitContent();
                                    }, 10);
                                }
                                if(data.ca('innerLayoutModeLocked')){
                                    data.fp('a:innerLayoutMode', '__init__', currentConfigured);
                                }else{
                                    data._i_isUpdatingLayoutModeFromInner = true;   //240721，内嵌向上同步页面内嵌模式时的标记，避免触发上层响应，上层直接更新属性值即可！
                                    i.update(data, 'innerLayoutMode',  modetmp);
                                    data._i_isUpdatingLayoutModeFromInner = undefined;
                                }

                                //240609，内嵌页加载完成时，如果上层没有设置（颜色是×掉的），那么就用内嵌的颜色，否则就用上面配置的（透明度为0和×掉是有区别的！）
                                if (data.ca('innerBackground') == undefined || !data.ca('innerBackgroundLocked')) {
                                    //240613，tips，如果有底板，就用底板背景色；没有底板时，就用页面背景色！
                                    let backgroundtmp = baseNodeTmp && baseNodeTmp.ca('background');

                                    //240719，如果内嵌底板的background属性，是数组类型，那么上层设置的颜色，填入到内嵌数组的索引0去。现在很多情况对颜色属性做了合并，已数组形式配置，所以0为默认背景色通常！
                                    if(isArrayFn(backgroundtmp)) backgroundtmp = backgroundtmp[0]; //240719，如果背景色是数组，说明合并了其他模式的颜色，通常索引0为默认背景色！

                                    if (!backgroundtmp) backgroundtmp = baseNodeTmp && baseNodeTmp.s('shape') && baseNodeTmp.s('shape.background');
                                    if (!backgroundtmp) backgroundtmp = inners[0].a('background');

                                    data._i_isUpdatingLayoutModeFromInner = true;   //240721，内嵌向上同步页面内嵌模式时的标记，避免触发上层响应，上层直接更新属性值即可！
                                    i.update(data, 'innerBackground', backgroundtmp);
                                    data._i_isUpdatingLayoutModeFromInner = undefined;
                                } else {
                                    data.fp('a:innerBackground', '__init__', data.ca('innerBackground'));
                                }

                                //240206，非容器组件这里直接追加，容器组件动态新增属性，需要在onDisplayLoaded属性的响应监听内才行！
                                __addCommonAttrsDynamic();

                                //240925，复制粘贴的图元组件做上标记，避免初始化时候isEditing，以为是手动在编辑！这里复位！
                                data._i_isContainerCoppied = undefined;
                                break;
                            case 'a:innerBackground':
                                if(data._i_isUpdatingLayoutModeFromInner) break;

                                //240719，如果没有设置过，那么久跟随内嵌的变化，不自动保存时就锁定！如果有设置过非空，那么久锁定，清空，则不锁定！
                                if(i.isEditing(data)){
                                    i.showMessage(e.newValue ? '已锁定内嵌颜色当前配置。' : '已清除对内嵌色设置！');
                                    data.ca('innerBackgroundLocked', !!e.newValue);
                                }

                                //240609，对内嵌页的底板和dm页面都设置背景色！
                                let innerDataModelTmp = i.innerDataModel(data, -1);
                                let innersTmp = [];
                                if (!isArrayFn(innerDataModelTmp)) innersTmp.push(innerDataModelTmp);
                                else innersTmp = innerDataModelTmp;
                                innersTmp.forEach(dm => {
                                    let baseNode = i.baseNode(dm, false);
                                    let bkgColor = e.newValue;
                                    //240613，如果有底板，就设置底板背景色；没有底板时，就设置页面背景色！不一股脑儿底板、页面背景色都设置！比如switch滑动开关，就会导致形状与背景融为一体没有开源圆角了！！
                                    if (baseNode) {
                                        baseNode.s('shape') && i.update(baseNode, 's:shape.background', bkgColor);

                                        //240719，如果内嵌底板的background属性，是数组类型，那么上层设置的颜色，填入到内嵌数组的索引0去。现在很多情况对颜色属性做了合并，已数组形式配置，所以0为默认背景色通常！
                                        let attrType = i.getAttrType(baseNode,'background');
                                        if(attrType && attrType.toLowerCase().indexOf('array')){
                                            let oldValtmp = baseNode.ca('background');
                                            if(isArrayFn(oldValtmp)) {
                                                oldValtmp = i.copy(oldValtmp);
                                                oldValtmp[0] = bkgColor;
                                                bkgColor = oldValtmp;
                                            }else{
                                                bkgColor = [bkgColor];
                                            }
                                        }else if(attrType === null && i.hasAttrObjectKey(data,'innerBackground')){
                                            //240726，需要这么处理，对于内嵌容器组件，自身作为底板，没有background属性，但是有innerBackground，来逐层向下传递，否则发现这种情况下上层编辑内嵌背景色，发现没效果！
                                            i.update(baseNode, 'a:innerBackground', bkgColor);
                                            return;
                                        }

                                        i.update(baseNode, 'a:background', bkgColor);
                                    } else {
                                        dm.setBackground(bkgColor);
                                    }
                                });
                                break;
                            case 's:2d.visible':
                            case 'a:show':
                                /*231230，对于容器组件，如果旧值是隐藏显示，当前新值是打开显示，而且顶层图元以及当前图元都是已加载状态，那么当前通常就是对话框运行时弹窗且触发内嵌加载反弹的情况！*/
                                if (!e.oldValue && !!e.newValue && !!data.ca('display') && i.topData(data)._i_isCompleteLoaded == true && data._i_isCompleteLoaded == true) {
                                    //240117，编辑状态下，对话框图元可见并且为内嵌模式，此时点击'show'弹窗，不能进入里面的i.updateUppersWhileDynamicLoading()处理，否则会等待内嵌加载反弹！无法到触底反弹中置位或复位加载完相关的标记！
                                    if (e.property == 'a:show' && data.s('2d.visible') == true && data.ca('embedded') && !runningMode()) {
                                        break;
                                    }
                                    //231231，如果是对话框，而且运行时对话框不可见，通常就是编辑时对话框弹窗后关闭以显示编辑对话框情况，此时编辑时对话框的由隐藏变成显示，不应进入下面触发内嵌页加载才有的逻辑！
                                    //231231，加上条件&& !data.ca('embedded')，因为对于embeded模式下非模态弹窗+吸附布局模式，
                                    if (
                                        i.isControlTyped(data, 'dlg') && //tips 240107，对话框
                                        !data.ca('embedded') && //tips 240107，非内嵌模式
                                        data._cache && //tips 240107，有渲染元素初始化过
                                        !data._cache.controlRunning.isVisible() && //tips 240107，运行对话框不可见
                                        data._cache.control.isVisible() //240107，编辑对话框可见！注意，重点是加上这句，才能确保当前是编辑状态下非内嵌的常规对话框弹窗后，点击关闭，编辑时对话框由隐藏切换显示时！
                                    ) {
                                        console.assert(!runningMode());
                                        break;
                                    }
                                    let isInnerSymbolInited = _i.hasInnerSymbolInited(data);
                                    if (data._i_isCompleteLoaded === undefined || data.ca('reloadWhenOpen') || (!isInnerSymbolInited && i.hasInnerInner(data))) {
                                        i.updateUppersWhileDynamicLoading(data);
                                    }
                                }
                                break;
                            case 'a:enablePopover': //240427，高级自定义弹出框提示
                                break;
                            case 'a:trackPathPercent':
                                //240619，动态增加轨迹属性，值为0到100，缩放自适应内容布局模式。
                                i.setTrackPercentAsHost(data, e.newValue);
                                break;
                            default:
                                break
                        }

                        //每个组件各自特定的属性
                        for (let attr in attr2eventFunc) {
                            let functmp = attr2eventFunc[attr]; //获取函数
                            attr.split('|').forEach(attrItem => { //配置除了'a:value'单个的格式外，支持多个以|间隔传入：'a:value|s:label | a:datas'
                                let attrTrimed = attrItem.trim();
                                if (attrTrimed != '' && e.property === attrTrimed) {
                                    if (data._i__backWriteOnly__ == true) {
                                        return;
                                    }
                                    //eventFunc参数只需要e就好，其他的i.md传入的参数，调用方本身就有，不需要这里自己再返回传入！
                                    let topDataTmp = i.topData(data);
                                    /*240126，加上条件!data._i_initSyncForcing &&，这样对于赋值data.fp/data.ca对display等内嵌页面加载相关的赋值，让md同步响应执行，不加上setTimeout队列！！否则，可能通过嵌套后
                                    出现随机概率性效果的现象！极难排查！*/
                                    if (!data._i_initSyncForcing && topDataTmp != data && (data._i_isFormInitInnerFping || e.oldValue == '__init__') && topDataTmp._i_isCompleteLoaded <= 0 /*i.loadedState(topDataTmp)*/ ) {
                                        //240130，存放以下原始的oldValue，避免初始md响应处理时，oldValue能判断直到是初始加载进来，但是原先默认填充的值被冲掉了！因此这里来备份！！
                                        if (data._i_attrOldValue === undefined) data._i_attrOldValue = {};
                                        if (e.oldValue !== '__init__') data._i_attrOldValue[i.autoPrefixed(attr, data)] = e.oldValue;
                                        e.oldValue = '__init__';
                                        _i.setTimeout(() => {
                                            functmp && functmp(e);
                                        }, 0);
                                    } else {
                                        functmp && functmp(e);
                                    }
                                }
                            });
                        }
                        commonCb && commonCb(e); //也只需event参数无需其他入参，因为就是i.md调用时传入的这些，使用方本身就有！内部并无更多计算，所以暂不提供入参。
                        //230826，对于容器组件，宽度、高度等尺寸变化时，内部尺寸有勾选适配内容时，让内嵌页面适配内容实时更新自适应！
                        if (e.property == 'width' || e.property == 'height') {
                            gv._i_innerGV && gv._i_innerGV.forEach(g2d => {
                                _i.setTimeout(() => {
                                    //230828，加上条件!i.baseNode(g2d)，对于有了底板铺满布局的，即便有勾选了适配，也不在对上层容器做这里的适应，否则会发现尺寸越来越小！！
                                    g2d.dm().a('fitContent') && !i.baseNode(g2d) && g2d.fitContent(false, 0);
                                }, 0);
                            });
                        }

                        //230327，对于函数类型属性被赋值时统一处理逻辑，相当于触发图元的某个事件，通过连线时，相当于是一个事件触发另一个事件！传递事件/事件函数/关联函数/关联事件/函数传递/传递函数
                        switch (i.getAttrType(data, e.property.slice(2))) {
                            case 'Function':
                                if (e.newValue && typeof(e.newValue) != 'function') { //tips 240220，之所以i.backWriteOnly不会导致进入死循环，取决于这里if(e.newValue && ...
                                    if (!i.isFuncString(e.newValue)) {
                                        i.backWriteOnly(data, e.property, i.isFuncString(e.oldValue) ? e.oldValue : undefined);
                                        //通用：触发调用操作的事件，并且将原先传入多操作事件属性的值，在这里就作为extraInfo
                                        //240314，将此前参数data、gv、cache，改成如果操作的是内嵌属性，那么就改成用内嵌底层的图元对象和属性来触发事件，这样还可以兼容逐层向上触发！
                                        let bottomData = null,
                                            innerGv = null,
                                            innerCache = null;
                                        if (i.isKeyURL(e.property)) {
                                            bottomData = i.bottomData(data, e.property);
                                            innerGv = bottomData && bottomData._gv;
                                            innerCache = bottomData._cache;
                                        }
                                        let targetNode = bottomData ? bottomData : data,
                                            eventTypeTmp = bottomData ? i.np(i.bottomKeyURL(e.property)) : i.np(e.property),
                                            onEventFunc = eventTypeTmp && targetNode._i_typeToEvents && targetNode._i_typeToEvents[eventTypeTmp];
                                        if(targetNode._i_typeToEvents && onEventFunc){
                                            onEventFunc();
                                        }else{
                                        //240314，将此前参数data、gv、cache，改成如果操作的是内嵌属性，那么就改成用内嵌底层的图元对象和属性来触发事件，这样还可以兼容逐层向上触发！
                                        i.formEventBubblingUpper(
                                            bottomData ? bottomData : data,
                                            bottomData ? bottomData : gv,
                                            bottomData ? bottomData : cache,
                                            bottomData ? i.np(i.bottomKeyURL(e.property)) : i.np(e.property),
                                            null,
                                            false,
                                            true,
                                            null,
                                            false,
                                            e.newValue //外部操作（可以是函数）过来的，传递的值给到extraInfo字段里！
                                        );
                                    }
                                }
                                }
                                break;
                        }
                    };
                    if (data.isParentOf(e.data)) childrenCb && childrenCb(e);
                };
                //tips 230401,注意，这里的_i_mds跟i.dms没任何关系！也不是书写错误！
                if (dmtmp._i_mds == undefined) dmtmp._i_mds = {}; //后续所有iotos相关的属性名称以_i_开头，不能是单纯的_或者__，避免跟ht的冲突！
                let oldEventFunc = dmtmp._i_mds[i.autoTag(data)];
                if (oldEventFunc != undefined) dmtmp.umd(oldEventFunc); //如果有就先卸载！
                dmtmp.md(__onAttrEvent); //监听
                dmtmp._i_mds[i.autoTag(data)] = __onAttrEvent; //更新备份监听用于如果重入就先卸载
                //231209，初始化加载的时候就对容器组件标记上loading，而不是触发执行loadDisplay的时候才标记，这方便初始加载连线操作时，通过这个属性指导对方是否是正在加载的容器组件！
                if (hasInnerTmp) {
                    i.update(data, 'a:isLoadingGet', true);
                }

                //230607，图标json资源加载完毕后的回调，或者原先json就是对象，此时进入到回到函数loadedInit，用于初始化调用（不少初始化需要用到资源加载完毕）。不过注意，这里为考虑image已经是[object]，且loadDisplay中重新加载symbol中url的情况！
                let imageType = typeof(data.getImage()),
                    symbolUrl = '';

                //240123，属性初始化，排除容器组件的display属性！内嵌页的加载放到渲染元素初始化时立即同步执行，其他属性初始化放到页面加载完毕后。
                function __attrsInitOnCondition(initDisplayOnly = false) {
                    let typeFlag = initDisplayOnly ? 'displayAttr' : 'otherAttrs';
                    for (let attr in attrValueTobeFpSync[typeFlag]) { 
                        let valtmp = attrValueTobeFpSync[typeFlag][attr];
                        if (initDisplayOnly) { //240124，对于display这种触发内嵌加载的属性初始化，要判断上层form绑定的，通过其来初始化！！
                            valtmp = i.getValueUpperFormed(data, attr);
                            if (valtmp && valtmp.slice && valtmp.slice(0, 2) == './' && valtmp.slice(-5) == '.json') {
                                let uppertmp = i.upperData(data);
                                if (uppertmp) valtmp = i.getRelativePath(data.dm()._url, i.toAbsDisplayURL(uppertmp, valtmp)); //当前相对路径是上一层针对自身的相对路径，向下传递赋值同步时，需要转换成下层的相对路径！
                            }
                        }
                        data._i_initSyncForcing = initDisplayOnly; //240126，做上标记，用于当传入initDisplayOnly为true时，md响应处理前的统一处理中，是否加上延时队列！
                        if(valtmp === undefined){
                            valtmp = i.getValue(data,attr);
                            valtmp && console.error('WARN: attr init will use new value',i.commonTip(data,attr));
                        }
                        attrValueTobeFpSync && attrValueTobeFpSync[typeFlag] && data.fp(attr, '__init__', valtmp);
                        data._i_initSyncForcing = undefined;
                    };
                }

                //240125，初始回调，也要支持顶层加载时，放到事件队列中去执行！
                function __loadedInit() {
                    let topDataTmp = i.topData(data);
                    if (topDataTmp != data && topDataTmp._i_isCompleteLoaded <= 0) { //顶层未加载完成时，就放到下一个队列执行，确保回调的初始化函数内用到的其他属性，都是已经经过form向下同步的最新值。但凡顶层已经加载完成状态，那么就同步执行！
                        _i.setTimeout(() => {
                            loadedInit && loadedInit();
                        }, 0);
                    } else {
                        loadedInit && loadedInit();
                    }
                }
                //240119，封装成函数，方便同步执行或者onImageLoaded异步执行都能调用！触发加载i.md配置的初始执行的回调函数！
                function __asyncInit() {
                    attrsSyncInitNeeded.forEach(attr => {
                        let valtmp = i.getValueUpperFormed(data, attr);
                        data._i_initSyncForcing = true; //240225，强制同步初始执行，跟display属性类似！
                        data.fp(attr, '__init__', valtmp);
                        data._i_initSyncForcing = undefined;
                    });
                    let topdatatmp = i.topData(data),
                        loadedStateTmp = i.loadedState(topdatatmp);
                    if (topdatatmp && topdatatmp != data && loadedStateTmp <= 0) { //240206，将！xx改成xx<=0
                        if (!topdatatmp._i_bottomSymbolLoadedIniting) topdatatmp._i_bottomSymbolLoadedIniting = [];
                        topdatatmp._i_bottomSymbolLoadedIniting.push(__attrsInitOnCondition);
                        topdatatmp._i_bottomSymbolLoadedIniting.push(__loadedInit); //固定传入末尾参数false，这样异步执行就进入到外层else中的i.updateBindControls里
                    } else {
                        //tips 240309，这个放到上面attrsSyncInitNeeded.forEach的后面来执行！
                        if (loadedStateTmp === 2) {
                            //240119，让data.fp向下初始化同步form绑定的属性值后，在启动渲染元素初始化！
                            _i.setTimeout(() => {
                                _i.setTimeout(() => {
                                    __attrsInitOnCondition();
                                    __loadedInit();
                                }, 0);
                            }, 0);
                        } else {
                            __attrsInitOnCondition();
                            __loadedInit();
                        }
                    }
                }

                function __onImageLoaded(url) {
                    i.onImageLoaded(url, obj => {
                        __asyncInit();
                    });
                    i.setImage(url, url); //230704，在用i.onImageLoaded之前，或之后，一定要确保有setImage()来做url的加载，否则无法触发加载的响应！因此这句就是为了避免初始简单场景下，费嵌套的直接加载或初始运行，都会无法触发i.onImageLoaded进入到loadedInit里
                }
                if (imageType == 'object') symbolUrl = data.ca('symbol');
                else if (imageType == 'string') symbolUrl = data.getImage(); //不一定都有symbol属性
                else if (imageType) console.assert(imageType);
                //240729，渲染元素组件路径兼容处理！以适应组件路径目录名称变化的情况
                symbolUrl = i.__getPathCompatible(symbolUrl, data);
                if (symbolUrl && i.getImage(symbolUrl)) {
                    if (i.isControlTyped(data, 'ifm') || i.upperData(data)) {
                        __asyncInit();
                    } else { //240308，统一加上这层异步时序队列，确保页面初始加载完毕后，才执行初始化！
                        _i.setTimeout(() => {
                            __asyncInit();
                        }, 0);
                    }

                } else if (symbolUrl) __onImageLoaded(symbolUrl);
                else {
                    console.assert(0);
                }
                //231128，存放实际ui空间对象到图元对象中，以统一的_i_control命名！
                data._i_control = control;
                //231218，统一析构释放渲染元素
                data._i_onClearData = () => {
                    //240114，释放时，卸载函数，试图处理内存泄漏，测试暂无效果，需要进一步排查。这句还是保留！
                    let eventFuncTmp = dmtmp._i_mds[i.autoTag(data)];
                    if (eventFuncTmp != undefined) dmtmp.umd(eventFuncTmp); //如果有就先卸载！
                    if (control && control._i_removeViewListener) control.removeViewListener(control._i_removeViewListener);
                    control && control.removeFromDOM && control.removeFromDOM();
                    control = null;
                    data._i_control = null;
                }
                if (typeof attrsInit == 'string') attrsInit = [attrsInit];
                if (isArrayFn(attrsInit)) {
                    attrsInit.push('a:userData'); //230325，默认加上userData也参与初始化
                    __attrsInitOnCondition(true);
                }

                if (data._i_setValueBeforeInits) {
                    data._i_setValueBeforeInits.forEach(func=>{
                        func();
                    });
                    data._i_setValueBeforeInits = undefined;
                }
            },
            //编辑器打开的当前图纸url
            currentUrl: function() {
                return editor ? editor.mainTabView.getCurrentTab().getTag() : null;
            },
            /*调用方式一：使用olVal，由paramGenerator传入进来的，与下面方式二通过回调给的oldLatestVal可能一样，可能不一样（更旧）
                i.bindReturn(data,index,[oldVal,url]);
                //调用方式二：不用oldVal，而是用回调函数来处理，参数就是当下这一个最新查询的值，如果是同步处理，跟oldVal一样，如果是异步函数中
                处理，那么值可能跟oldVal不同保持是要赋值前的最新值！
                i.bindReturn(data,index,null,oldLatestVal => [oldLatestVal,url]);*/
            bindReturn: function(data, index, value, valCreateCb = null) {
                try {
                    let tagtmp = data && data.ca('bindControlsTag') ? data.ca('bindControlsTag')[index] : null,
                        attrtmp = data && data.ca('bindControlsAttr') ? data.ca('bindControlsAttr')[index] : null;
                    if (tagtmp && attrtmp) {
                        let toNode = d(data.dm(), tagtmp),
                            valtmp = i.getValue(toNode, attrtmp);
                        return i.update(toNode, attrtmp, valCreateCb ? valCreateCb(valtmp) : value);
                    } else return false;
                } catch (error) {
                    console.error(error, index, value, data);
                }
            },
            //230417，获取全局tag，保证唯一性，主要用于跨图纸、跨网页的fireEvent/addEvent
            getGlobalTag: function(data) {
                return i.autoTag(data) + '@' + (data.dm() && data.dm()._url ? data.dm()._url : 'null');
            },
            /*全局的用户自定义通信事件发送（支持跨graphView、iframe）*/
            fireEvent: function(callerData, topicSend = null, contentSend = null, addrTarget = null) {
                //用于如果key没传入是，能获取到当前data图元所在图纸的url，则以url结合图元tag作为key自动传入，对应value默认自动传入当前页window全局对象
                let topicDefault = null,
                    isNoneContent = contentSend === null || contentSend === undefined; //231023，为了区分0和''，不要作为window被填充传递出去！
                if (callerData && i.isHtNodeData(callerData)) {
                    topicDefault = i.getGlobalTag(callerData); //如果没有传入topic，就自动以消息源收发器图元的globalTag，也就是自身address作为topic
                    if (isNoneContent && !callerData.ca('userData')) {
                        console.error('will passs Window object to userData');
                        callerData.ca('userData', window);
                    }
                };
                isNoneContent && console.error('content is', contentSend, 'and will adopt window object instead', window);
                i.window().appNotifier ? i.window().appNotifier && i.window().appNotifier.fire({
                    kind: 'lowcode',
                    para: {
                        type: addrTarget,
                        data: {
                            obj: callerData,
                            //如果传入contentSend为空，而且能通过callerData获取到图纸的url，那么topicDefault就自动设置为图纸url
                            key: topicSend != null ? topicSend : topicDefault,
                            //如果传入value为空（null/undefined），就把当前的全局对象window传递过去！
                            value: isNoneContent ? window : contentSend //230925，之前默认传递window，但是耗时极大！现在默认通过window来交换数据！
                        }
                    }
                }) : console.error('fire event error: i.window().appNotifier instance not exist!!');
            },
            //全局的用户自定义通信事件监听（支持跨graphView、iframe）
            /*
            i.addEvent((data,key,value,type)=>{
                alert(key)
                console.error(data)
            });
            */
            //240603，提供参数addrOnly，当传入true时，如果发送器是图元对象，那么传入的对象source自动转成其addressLocal字符串，通常是发给代码调用方！
            addEvent: function(callback, node = null, addrOnly = false) { //callback的参数是当前data，attr/key - value
                //231214，增加自动清理，否则多次刷新充入，接收器会多次监听导致多次触发响应！
                let __eventFunc = e => {
                    if (e.kind == 'lowcode') {
                        //240603，如果传入div的dom对象，自动换成id字符串！
                        let objtmp = e.para.data.obj;
                        if (i.isDOMElement(objtmp)) objtmp = objtmp.id;
                        if (!objtmp) objtmp = ''; //如果传入null，自动转成空字符串！
                        if (addrOnly && i.isHtNodeData(objtmp)) objtmp = objtmp.ca('addressLocal');

                        callback && callback(objtmp, e.para.data.key, e.para.data.value, e.para.type);
                    }
                };
                if (node && node._i_eventAdded && i.window().appNotifier) {
                    i.window().appNotifier.remove(node._i_eventAdded);
                    node._i_eventAdded = null;
                }
                i.window().appNotifier ? i.window().appNotifier.add(__eventFunc) : console.error('add event error: i.window().appNotifier instance not exist!!');
                if (node) node._i_eventAdded = __eventFunc;
            },
            //获取dm图纸的底层矩形
            //tips 2300730，图纸页面勾选“适配内容”后，就不会自动创建底板base矩形！！
            baseNode: function(gv, autoCreate = true) { //gv也可以传入为dm，兼容！
                if (gv == undefined) return undefined;
                //240727，图标编辑时，忽略！
                try {
                    if(!runningMode() && editor && editor.tab && editor.tab.getTag() && editor.tab.getTag().slice(0,8) === 'symbols/') return;   
                } catch (error) {}
                //231031，加上&& gv._i_cachedBaseNode.dm()，否则会出现意想不到的BUG，那就是dm()为null的baseNode，导致异常！！
                if (!autoCreate && gv._i_cachedBaseNode && gv._i_cachedBaseNode.dm()) return gv._i_cachedBaseNode;

                let found = [],
                    dm = gv.dm != undefined ? gv.dm() : gv;
                dm.toDatas().each((dataItem) => {
                    if (i.isBaseNode(dataItem)) {
                        found.push(dataItem);
                    }
                });
                if (found.length > 1) {
                    found.forEach(item => { //230920，偶尔发现会有多个底板，就加上这个测试下。
                        i.innerPendingNodeAutoDel(item);
                    });
                }
                /*231118，去掉条件 || dm.size() == 0，之前忽略，现在要考虑，一旦如果之前dm就设置勾选了fitContent，那么久不自动创建底板！主要是
                容器封装时，会自动按照选中的一个或多个图元，按照封装时配置，可能是要缩放布局也可能是要底板布局，因此不要自动创建底板！*/
                if (found.length == 0 && autoCreate && (!dm.a("fitContent") /* || dm.size() == 0*/ )) { //230314，加上size判断，初始空图纸时忽略fitContent的属性！
                    //需要自动创建时，首先识别tag为base的是否有图元，存在的话，就设置为base，然后返回。不存在，则自动创建！
                    function _getIfBaseTagExist(base) {
                        let nodetmp = dm.getDataByTag(base);
                        if (nodetmp) {
                            i.setBaseNode(nodetmp);
                            return nodetmp;
                        } else return undefined;
                    }
                    let basetmp = _getIfBaseTagExist('base');
                    if (basetmp) return basetmp;
                    else {
                        basetmp = _getIfBaseTagExist('_base');
                        if (basetmp) return basetmp;
                    }
                    //base 相关tag不存在时，才自动创建！
                    let nodetmp = new ht.Node();
                    dm.add(nodetmp);
                    // dm.moveToBottom(nodetmp);
                    // dm.sendToBottom(nodetmp); //为啥都没效果？没设置到底层去？？
                    nodetmp.s('shape', 'rect');
                    // 获取浏览器内容区域宽度
                    let viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                    // 获取浏览器内容区域高度
                    let viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                    nodetmp.setRect(0, 0, viewportWidth, viewportHeight); //240623，这里不再固定用1920,1080，这样底板上图元组件不做布局时，也最好能运行时所见即所得！
                    nodetmp.s('shape.background', 'white');
                    nodetmp.s('shape.border.width', 0);
                    nodetmp.s('fullscreen', 'fill');
                    nodetmp.s('fullscreen.gap', 0);
                    nodetmp.s('2d.movable', false);
                    nodetmp.setDisplayName('底板');
                    nodetmp.setName('base');
                    nodetmp.s('label.opacity', 0);
                    nodetmp.s('label.position', 17);    
                    nodetmp.setTag('_base');
                    nodetmp.s('interactive', true);
                    dm.moveToTop(nodetmp);
                    console.warn('auto create base node', nodetmp);
                    _i.setTimeout(() => { //231212，价格定时器放到下一个消息循环，尝试解决偶尔出现的尺寸为0只有底部按钮的弹窗的情况！
                        !runningMode() && !i.window().editor._i_needQuiet && editor && editor.gv && editor.gv.dm()._url && i.alert('自动创建底板！如果不希望自动创建，请选中一个组件设定为底板，或者对页面勾选“适配内容”！重新设定底板后，就可以删除本次自动创建的。', '提示', null, null, null, [300, 190]);
                    }, 0);
                    found.push(nodetmp);
                    if (gv && gv.dm && gv.fitContent) gv.fitContent(true);
                }

                gv._i_cachedBaseNode = found[0]; //231018，缓存高频操作

                return found[0];
            },
            /*231126，支持autoBaseGap传入自动创建的底板与实际内容的四周间距，可以是数字，可以是[上,右,下,左]数组，比如 [20, 5, 10, 30]
            有一定的间隙，主要是为了确保避免边框尤其是button的被截取一半在矩形外，导致上层嵌套中显示边框有点异常！！*/
            getNodeAsBase: function(dm, ignoredTypes = ['func', 'edge', 'block'], autoBaseGap = 2) {
                //231124，缓存，数组传入时，避免重复调用结果不停自增内部自动创建的底板！因为通过引用回传，所以参数自动被修改了，重复调用时无感！
                if (isArrayFn(dm) && dm._i_cachedBaseAs) {
                    return dm._i_cachedBaseAs;
                }
                let target = isArrayFn(dm) ? null : i.baseNode(dm, false),
                    arrs = isArrayFn(dm) ? dm : dm.getDatas().toArray();
                if (target) return target;
                let maxSize = null, //尺寸最大图元组件的宽高乘积
                    originalExist = false,
                    hasMulti = false, //如果有多个区域面积相等的目标base组件，那么就用tobeTargets组成的区域，自动创建一个底板覆盖他们！
                    tobeTargets = []; //可能的多个目标组件
                arrs.forEach(data => {
                    if (originalExist) return;
                    if (i.isBaseNode(data)) {
                        target = data;
                        originalExist = true;
                    } else {
                        let needIgnore = false;
                        ignoredTypes.forEach(type => {
                            if (data && i.isControlTyped(data, type) && !needIgnore) needIgnore = true;
                        });
                        if (!needIgnore) {
                            tobeTargets.push(data);
                        }
                    }
                });
                target && console.error('WARN: node choosed as base in page', dm._url, ',node', target.getDisplayName(), 'auto selected!', 'object is:', target);

                //是否有一个图元，区域本身就包含了其他图元
                let groupRectTmp = i.groupRect(tobeTargets,null,true);
                tobeTargets.forEach(item => {
                    let curRect = item.getRect && item.getRect();
                    if (
                        groupRectTmp.x == curRect.x &&
                        groupRectTmp.y == curRect.y &&
                        groupRectTmp.width == curRect.width &&
                        groupRectTmp.height == curRect.height
                    ) {
                        target = item;
                    }
                });
                hasMulti = target == null && tobeTargets.length > 0;
                //231124，如果传入数组中多个图元组件，没法选取唯一具备底板条件的，那么就创建一个组件，将其放到这些里面最下层的，而且尺寸区域在目标具备底板条件的整体区域！
                if (hasMulti && isArrayFn(dm)) {
                    let basetmp = new ht.Node(),
                        dmtmp = tobeTargets[0].dm(),
                        groupRectTmp = i.groupRect(tobeTargets,null,true);

                    //231126，四周留下间隙
                    let gaps = [];
                    for (let idx = 0; idx < 4; idx++) {
                        if (isArrayFn(autoBaseGap)) {
                            i.setIndexValue(gaps, idx, i.indexAssure(autoBaseGap, idx, 0));
                        } else {
                            gaps.push(autoBaseGap);
                        }
                    }
                    //注意，x和y不需要这样处理，因为后面setPosition()并非是针对左上顶点，而是针对宽高中心点的！！
                    groupRectTmp.x -= (gaps[3] - gaps[1]) / 2; //左
                    groupRectTmp.y -= (gaps[0] - gaps[2]) / 2; //上
                    groupRectTmp.width += (gaps[1] + gaps[3]);
                    groupRectTmp.height += (gaps[0] + gaps[2]);
                    basetmp.setImage(null);
                    basetmp.setName('autoBase');
                    basetmp.setDisplayName('自动底板');
                    dmtmp.add(basetmp);
                    dmtmp.sm().as(basetmp); //追加选中
                    i.autoTag(basetmp);
                    dm.push(basetmp); //注意，此时传入的dm实际上是data的array数组！
                    basetmp.setRect(groupRectTmp);
                    basetmp.setPosition(groupRectTmp.x, groupRectTmp.y);
                    target = basetmp;
                    //注意，这里就要开始设置，主要是设置布局设置为fill，前面用到i.isBaseNode()是根据布局属性是否是fill来判断的！
                    basetmp.s('fullscreen', 'fill');
                    //231124，缓存，数组传入时，避免重复调用结果不停自增内部自动创建的底板！因为通过引用回传，所以参数自动被修改了，重复调用时无感！
                    dm._i_cachedBaseAs = target;
                }
                return target;
            },
            //230819，设置全局底板，传入set为取消当前data为底板，默认恢复最初的底板设置。
            setBaseNode: function(data, reset = false) {
                if (!data) return;
                if (!data.getWidth || !data.getHeight) {
                    console.assert(0);
                    return;
                }
                //2310222，复位缓存！
                if (data && data._gv) {
                    data._gv._i_cachedBaseNode = undefined;
                    data.dm()._i_cachedBaseAs = undefined;

                    //240120，发现传入i.baseNode的，可以是dm，因此_i_cachedBaseNode也可以是dm下的属性，不一定都是gv下！！因此也要复位，避免获取错误！
                    data.dm()._i_cachedBaseNode = undefined;
                }

                if (data == undefined || !data.dm()) return;
                let basetmp = i.baseNode(data.dm(), false);
                if (reset) {
                    let lastbasetmp = data.dm().a('lastBase');
                    data.s('fullscreen', undefined);
                    //如果上次底板和当前底板是同一个，那么复位就是取消当前底板设置！
                    if (lastbasetmp && lastbasetmp != data) { //230821，这里不用i.setBaseNode(xxx,false)，主要是考虑到避免布局连线，导致底板设置的gap非0的话无法保持！
                        data._i_lastDataIndex !== undefined ? data.dm().moveTo(data, data._i_lastDataIndex - 1) : data.dm().moveToTop(lastbasetmp);
                        data._i_lastDataIndex = undefined;
                        lastbasetmp.s('fullscreen') == undefined && lastbasetmp.s('fullscreen', 'fill'); //复位时，取消传入图元的底板属性，恢复最初的底板。
                    }
                } else {
                    //存放上一次底板，如果此前没有，那就存放当前的
                    data.dm().a('lastBase', basetmp ? basetmp : data);
                    //先清理掉此前的一个或多个（异常情况）底板base的全屏填充属性
                    data.dm().toDatas().each((dataItem) => {
                        i.isBaseNode(dataItem) && dataItem.s('fullscreen', undefined);
                    });
                    data.s('fullscreen') == undefined && data.s('fullscreen', 'fill');
                    // data.s('fullscreen.gap', 0); //240116，需要屏蔽掉这句，否则内嵌的gap到嵌套的上层无法生效！比如按钮作为底板，但是想要边框宽度通过gap放一点余地过来，有这句在就不行了！
                    data._i_lastDataIndex = i.getDataIndex(data); //231120，存放临时作为底板之前的层次索引，方便恢复时位置层次也能恢复！主要是布局连线时避免连线时就被遮盖到下层了！
                    data.dm().moveToTop(data); //注意，这里top是右下角组件排布的顶部，等于实际鼠标点击时底部！
                    data.s('2d.movable', false); //231119，底板不能移动！
                }

                //231118，页面数据模型的适配窗口属性自动去掉勾选！
                !reset && data && data.dm() && data.dm().a('fitContent', false);
            },
            //230819，放到单独函数，来判断是否是底板
            isBaseNode: function(data) {
                if (
                    data &&
                    data.s('fullscreen') == 'fill' &&
                    data.getWidth &&
                    data.getHeight &&
                    !(data.getParent() && data.getParent().getClassName() == 'ht.SubGraph')
                ) //230406，新增条件，如果父节点是子网，那么允许其全屏填充，比如子网桌面菜单页
                    return true;
                else return false;
            },
            //图元默认getPosition是中心点的坐标，这里转换成左上顶点的坐标！
            getPos: function(node) {
                if (i.hasNoRect(node)) return {}
                else return {
                    x: node.getPosition().x - node.getWidth() / 2,
                    y: node.getPosition().y - node.getHeight() / 2,
                }
            },
            //以左上顶点的坐标来设定，非默认的中心点设定；暂未测试！
            setPos: function(node, x, y) {
                node.setPosition({
                    x: x + node.getWidth() / 2,
                    y: y + y.getHeight() / 2
                })
            },
            //nodeArr调整位置朝nod去对齐，其中nodes可以是对象可以是数组！direction支持top/bottom/left/right
            setAlign: function(node, nodes, direction) {
                if (!isArrayFn(nodes)) nodes = [nodes];
                nodes.forEach(item => {
                    switch (direction) {
                        case 'top':
                            item.setPosition({
                                x: item.getPosition().x,
                                y: i.getPos(node).y + item.getHeight() / 2
                            });
                            break;
                        case 'bottom':
                            item.setPosition({
                                x: item.getPosition().x,
                                y: i.getPos(node).y + node.getHeight() - item.getHeight() / 2
                            });
                            break;
                        case 'left':
                            item.setPosition({
                                x: i.getPos(node).x + item.getWidth() / 2,
                                y: item.getPosition().y
                            });
                            break;
                        case 'right':
                            item.setPosition({
                                x: i.getPos(node).x + node.getWidth() - item.getWidth() / 2,
                                y: item.getPosition().y
                            });
                            break;
                    }
                });
            },
            //231122，图元curNode的矩形区域是否包含在图元组件baseNode的矩形区域内，仅交叉都不行！
            isContainsInRect: function(curNode, baseNode, diff = 1.0) {
                if (!baseNode) return undefined; //240315，如果没有底板时，返回undefined，也可以认作为false

                let curRect = i.clone(curNode.getRect()),
                    baseRect = i.clone(baseNode.getRect());

                //231229，x/y坐标，以及宽高相差小于1个像素，则忽略不计，认为相等！否则容易出现对其布局时位置偏差0.00xxx这样的，就会导致出问题！
                if (Math.abs(curRect.width - baseRect.width) < diff) { //1）宽度接近相等
                    curRect.width = baseRect.width;
                }
                if (Math.abs(curRect.height - baseRect.height) < diff) { //2）高度接近相等
                    curRect.height = baseRect.height;
                }
                if (Math.abs(curRect.x - baseRect.x) < diff) { //3）接近靠左对齐
                    curRect.x = baseRect.x;
                }
                if (Math.abs((curRect.x + curRect.width) - (baseRect.x + baseRect.width)) < diff) { //4）接近靠右对齐
                    curRect.width = baseRect.x + baseRect.width - curRect.x;
                }

                if (Math.abs(curRect.y - baseRect.y) < diff) { //5）接近靠上对齐
                    curRect.y = baseRect.y;
                }
                if (Math.abs((curRect.y + curRect.height) - (baseRect.y + baseRect.height)) < diff) { //6）接近靠下对齐
                    curRect.height = baseRect.y + baseRect.height - curRect.y;
                }
                //有效！
                return ht.Default.containsRect(baseRect, curRect);
            },
            /*返回的x、y属于组合形成的外框并集的矩形区域的中心点坐标，注意，并非左上顶点！！*/
            groupRect: function(nodeArr, groupNode = null, centerPos = false) {
                let top = null,
                    left = null,
                    right = null,
                    bottom = null;
                nodeArr.forEach(function(data, index) {
                    if (i.hasNoRect(data)) return; //230402，对于edge等连线类型没有该方法的，忽略掉，避免报错！
                    let p = data.getPosition(),
                        xleft = p.x - data.getWidth() / 2,
                        xright = p.x + data.getWidth() / 2,
                        ytop = p.y - data.getHeight() / 2,
                        ybotton = p.y + data.getHeight() / 2;
                    
                    //240721，对!xx改成了 xx === null，否则貌似存在BUG，因为值为0时，跟null也是==成立的！
                    if (xleft < left || left === null) left = xleft;
                    if (xright > right || right === null) right = xright;
                    if (ytop < top || top === null) top = ytop;
                    if (ybotton > bottom || bottom === null) bottom = ybotton;

                    groupNode && groupNode.addChild(data);
                    groupNode && data.setHost(groupNode);
                });
                if (groupNode) {
                    groupNode.setPosition(left + (right - left) / 2, top + (bottom - top) / 2);
                    groupNode.setWidth(right - left);
                    groupNode.setHeight(bottom - top);
                }
                return {
                    //240721，这里此前存在BUG，要知道get/setPositon的x、y是中心点，但get/setRect的x、y是左上顶点！！！两者是不一样的！
                    x: centerPos ? (left + (right - left) / 2) : left,
                    y: centerPos ? (top + (bottom - top) / 2) : top,
                    width: right - left,
                    height: bottom - top
                }
            },
            //230402，对于edge等连线类型没有该方法的，忽略掉，避免报错！
            hasNoRect: function(data) {
                return !data.getPosition || !data.getWidth || !data.getHeight;
            },
            averageGaps: function(nodeArr,centerPos = true) {
                let recttmp = i.groupRect(nodeArr,null, centerPos);

                //返回的中心坐标转换成左上顶点坐标：
                recttmp.x = recttmp.x - recttmp.width / 2;
                recttmp.y = recttmp.y - recttmp.height / 2;

                let wAdd = 0,
                    hAdd = 0;
                nodeArr.forEach(node => {
                    if (i.hasNoRect(node)) return; //230402，对于edge等连线类型没有该方法的，忽略掉，避免报错！
                    wAdd += node.getWidth();
                    hAdd += node.getHeight();
                });
                let xArr = [],
                    yArr = [];
                nodeArr.forEach((node, index) => {
                    if (i.hasNoRect(node)) return; //230402，对于edge等连线类型没有该方法的，忽略掉，避免报错！
                    xArr.push({
                        x: node.getPosition().x - node.getWidth() / 2,
                        index
                    });
                    yArr.push({
                        y: node.getPosition().y - node.getHeight() / 2,
                        index
                    });
                });

                let xOrdered = i.arrOrdered(xArr, 'x'),
                    yOrdered = i.arrOrdered(yArr, 'y'),
                    hGap = (recttmp.width - wAdd) / (nodeArr.length - 1), //水平
                    vGap = (recttmp.height - hAdd) / (nodeArr.length - 1), //垂直
                    horPosArr = [],
                    verPosArr = [];

                xOrdered.forEach((item, idx) => {
                    let node = nodeArr[item.index],
                        x = (horPosArr.length == 0 ? item.x : horPosArr[idx - 1].x + horPosArr[idx - 1].node.getWidth() / 2 + hGap) + node.getWidth() / 2,
                        // y = recttmp.y - node.getHeight() / 2;
                        y = recttmp.y + recttmp.height / 2; //垂直方向也居中的话
                    horPosArr.push({ x, y, node });
                    node._hPos = { x, y };
                });
                yOrdered.forEach((item, idx) => {
                    let node = nodeArr[item.index],
                        // x = recttmp.x - node.getWidth() / 2,
                        x = recttmp.x + recttmp.width / 2, //水平方向也居中的话
                        y = (verPosArr.length == 0 ? item.y : verPosArr[idx - 1].y + verPosArr[idx - 1].node.getHeight() / 2 + vGap) + node.getHeight() / 2;
                    verPosArr.push({ x, y, node });
                    node._vPos = { x, y };
                });

                return {
                    ...recttmp,
                    hGap, //水平
                    vGap, //垂直
                }
            },

            /*全选时（框选、ctrl + a、点选后先满）触发，目前用于全选时自动移除base图元的选中，比如：
            i.onSelectAll(params.displayView.graphView.dm(), sm => {
                sm.rs(i.baseNode(params.displayView.graphView));
            })*/
            onSelectAll: function(dm, callback, clearEventSupport = false, baseInclude = false) {
                let dmtmp = dm,
                    smtmp = dm.getSelectionModel();
                let onms = function(event) {
                    //240429，让点击图纸页面背景时，隐藏属性栏，因为并非那么频繁设置页面属性！非要设置，可以手动右键菜单打开面板即可！
                    if (!runningMode() && (!editor.displayView || editor.displayView && editor.displayView.hasLoaded)) {
                        if (editor.gv && editor.gv.dm().sm() === smtmp) {
                            //240615，移到外面来，避免单击、双击ctrl按下时的操作，会引起左右面板的显示隐藏！！
                            if (ht.Default.isCtrlDown()) {
                                smtmp._i_isDoubleClickWhileCtrlPressed = true;
                            } else {
                                smtmp._i_isDoubleClickWhileCtrlPressed = undefined;
                            }

                            if (event.kind == 'set') {
                                hteditor.strings = i.clone(hteditor.strings_raw);
                                //240615，加上条件&&ht.Default.isCtrlDown()，按下ctrl时，点击选中或取消，都不能有面板显示隐藏切换！
                                if (smtmp.getLastData() && !smtmp.getLastData().ca('_editDebug') && !ht.Default.isCtrlDown()) { //240523，对于勾选了编辑时双击执行的，就不要点击展开属性面板了，因为可能是免登录模式侧边栏隐藏并且允许用户双击编辑时组件来体验的情况！
                                    editor.mainSplitView.setStatus("normal"); //显示右边侧边栏
                                    editor.mainSplitView.setDividerSize(1);
                                }
                            } else if (event.kind == 'clear') {
                                editor.mainSplitView.setStatus("cr"); //隐藏右边侧边栏
                                editor.mainSplitView.setDividerSize(0);
                            } else if (event.kind == 'remove') {
                            }
                        }
                    }

                    //242526，右键右上角树tree节点，右键菜单，更新组件、示例等，将删除按钮，提示为格式化更新，并且在共享目录下右键操作，对重命名、删除，加上禁用标识！
                    if (!runningMode()) {
                        if (event.kind == 'set') {
                            //240526，对于“专属目录”，右键不再是提示删除，而是“初始化至最新”，此时会删除目录下所有内容，并且重新从admin账户拷贝过来，作为更新或初始化！
                            let urltmp = smtmp.getLastData() && smtmp.getLastData().getId(),
                                typestmp = ['displays', 'symbols', 'components', 'assets'];
                            //240526，获取右键菜单项
                            function __menuItem(fileType = 'displays', menuType = 'delete') {
                                return i.arrFilter(editor[fileType].tree.menu._items, { id: menuType })[0];
                            }
                            urltmp && smtmp.size() == 1 && typestmp.forEach(type => {
                                if (editor[type].tree.dm().getDatas().toArray().indexOf(smtmp.getLastData()) != -1) {
                                    let isUpdating = false;
                                    //240526，对于“专属空间”，右键菜单的删除，改成显示“格式化更新”！一旦点击，后台立刻删除该目录并且立即自动重新从admin账号下对应目录拷贝过来，实现格式化+初始化+升级更新！
                                    let treeMenuDeleteItem = __menuItem(type, 'delete');
                                    if (urltmp.split('/').length == 2 && typestmp.indexOf(urltmp.split('/')[0]) != -1 && urltmp.split('/')[1] != 'demo') {
                                        treeMenuDeleteItem.label = '格式化更新';
                                        isUpdating = true;
                                    } else {
                                        treeMenuDeleteItem.label = hteditor.strings['editor.delete'];
                                    }

                                    //240526，在共享目录的右键，非demo、develop账号，对重命名、删除，文字追加（禁用）提示
                                    let isReadOnly = urltmp.split('/')[1] !== hteditor.strings[pathAbs()] && (urltmp.split('/')[1] != i.user() && i.user() !== 'develop');
                                    __menuItem(type, 'rename').label = hteditor.strings['editor.rename'] + (isReadOnly ? '（禁用）' : '');
                                    //240526，加上!updating,避免把上面的格式化更新，又恢复成了删除显示！
                                    if (!isUpdating) __menuItem(type, 'delete').label = hteditor.strings['editor.delete'] + (isReadOnly ? '（禁用）' : '');

                                    //250526，待办！！对于专属空间目录名称本身，以及内部的系统、收藏，应该不允许用户删除和修改名称才对，需要做处理！！暂未做。
                                }
                            })
                        }
                    }
                    //240313，加上条件&& event.datas.length == 1，避免压缩的点击提示出来很大一堆！
                    if (dm.a('_pageCompress') && event.kind == 'set' && event.datas.length == 1) _i.showMessage(`当前页面在选项中勾选了“页面压缩保存”，已简化组件配置信息（加载时还原）。<br>如需编辑，请将勾选去掉，并刷新重加载！`, 3, '警告', 'top', null, 4000);

                    /*240224，传入当前触发的属性名称，主要是当'a:lastItemRowsText'过来时，反向关联选择适，比如传入值 [0, 0, 0, 'shadowBorder', 0, 0, 'background', __upper: ƒ]，
                    避免在里面调用dataModel.clear()将原先的勾选给去掉了！！*/
                    if (dm._i_relativeAttrChoosing) return;

                    //240214，在树表queryMatched中有table.checkDatas(xx)，这个操作实际上是模拟鼠标逐个点击勾选，因此会逐个到这里响应进来！！因此在操作前后加上标记，避免误操作触发checkSelected频繁响应！
                    if (dm._i_isTableCheckingData) return;

                    //231117，shift按下时，对于选中的交互连线，再点击空白处，不会自动去掉选中，还是允许选中状态下，持续点击空白区域，实现宽度循环快捷设置！
                    if (ht.Default.isShiftDown() && event.kind == 'clear') {
                        let lines = [];
                        event.datas.forEach(item => {
                            i.isInteractiveLine(item);
                            lines.push(item);
                        });
                        _i.setTimeout(() => {
                            smtmp.ss(lines);
                        }, 0);
                    }
                    let tobeRemoved = smtmp._i_selectedEdges = [];
                    event.kind == 'set' && smtmp.size() > 1 && smtmp.each(item => {
                        if (item && item.getClassName() == 'ht.Edge') tobeRemoved.push(item);
                    });
                    let existNodeNotBeSelected = false;
                    //编辑模式下，重新加载图纸，偶尔会出现自动创建base，而原本就有一个base在，打印发现是出现这里导致，加上这句就好了！
                    if (event.kind == 'clear' && dmtmp._url) { //240220，加上条件&& dmtmp._url，否则会出现鼠标格treeTable的序号标题头的勾选整体取消勾选，无法触发勾选监听响应！
                        clearEventSupport && callback(smtmp, event.kind);
                        return;
                    }
                    dmtmp._url && dmtmp.each(dmItem => {
                        //全选时，去掉不可见或线条
                        if (!dmItem.s('2d.visible') || dmItem.getClassName() == 'ht.Edge' || dmItem.getClassName() == 'ht.Block') return;
                        let found = false;
                        //当前图元是否有被选中
                        smtmp.each(smItem => {
                            if (!found && (smItem === dmItem)) found = true;
                        });
                        if (
                            (found == false && !smtmp.contains(i.parentRoot(dmItem))) || //当前图元没被选中时
                            (baseInclude && (smtmp.size() == 1 && smtmp.contains(i.baseNode(dm)))) //或者如果初始只是选中base底层图元，允许选中！
                        ) {
                            existNodeNotBeSelected = true;
                        }
                    });
                    //240213，新增event.datas.toArray()，把变化的图元列表也传参给过去！//240214，再在末尾加上event参数，传给里面的__click()作为参数！
                    if (existNodeNotBeSelected == false) callback && callback(smtmp, event.kind, event.datas.toArray(), event);
                };
                if (smtmp._i_oldMs) smtmp.ums(smtmp._i_oldMs);
                smtmp.ms(onms);
                smtmp._i_oldMs = onms;
            },
            /*唯一一个图元选中，除了base之外的（base可能选中、可能没选中的前提下）*/
            isOneSelectedExceptBase: function(dm) {
                let sm = dm.sm();
                if (sm.size() == 1 && !sm.contains(i.baseNode(dm))) return true; //只有1个选中，且不是base
                else if (sm.size() == 2 && sm.contains(i.baseNode(dm))) return true; //或者有2个选中，其中一个是base
                else return false;
            },
            /*
            i.round(3.1415926,4)，得到3.1416
            i.round(3.1415926,2)，得到3.14
            */
            round: function(value, decimal = 1) { //decimal是几位小数
                return Number(value.toFixed(decimal));
            },
            //根据内部child图元，一层层parent获取所属的最顶层图元，本身就是顶层，返回自身；而isInnerChild则是判断某个图元是否是自动图元节点的子节点！
            parentRoot: function(innerNode) {
                let parent = innerNode.getParent();
                return parent == undefined ? innerNode : i.parentRoot(parent);
            },
            //230917，别名
            parentNode: function(childNode) {
                return i.parentRoot(childNode);
            },
            /*用于渲染元素的布局，当组件设置有fixedHeight属性且由赋值，且用i.layoutHTML代替control.layoutHTML后，就具备了固定高度的特性
            1) 图元data增加._uiView属性关联ht ui对象
            2) 如果图元有fixedHeight属性并且设定值，那么自动固定高度*/
            layoutHTML: function(control, data, gv, cache, callback = null, fixedMode = null) {
                let topDataTmp = !runningMode() && i.topData(data); //240804，顶层图元。这是为了解决现实模糊的问题！
                control.layoutHTML = function() {
                    let fixedHeight = data.ca('fixedHeight'),
                        fixedHeightGlobal = data.dm().a('fixedHeight');
                    //如果对图纸有全局设置统一固定高度（非零），那么就用全局的设置，否则就组件自身的fixedHeight属性！
                    if (fixedHeight) data.setHeight((data.ca('layoutVertical') ? data.ca('gap') + cache.label.getHeight() : 0) + (fixedHeightGlobal ? fixedHeightGlobal : fixedHeight));
                    if (data.getWidth() < 1) data.setHeight(data.getWidth());
                    if(topDataTmp && !i.isControlTyped(data,'dlg')){
                    //240925，加上条件&& data.ca("innerLayoutMode") != 'fitContent'，否则会出现多个适配内容的嵌套，中间层的内嵌内容，无法随着整体尺寸变化而自适应缩放。
                         if(topDataTmp !== data && data.ca("innerLayoutMode") != 'fitContent') fixedMode = true;
                        //240804，暂未解决拖放到页面时，字体模糊的问题，比如树表格的显示！缩小、放大模糊没问题，但是缩放到差不多尺寸的时候应该显示清晰一下才对的啊！！暂未实现！
                        else{
                            fixedMode = false;
                        }
                    }
                    control && gv.layoutHTML(data, control, fixedMode == null ? (data.dm() && data.dm().a('fitContent') ? false : runningMode()) : fixedMode);
                    try {
                        callback && callback();
                    } catch (error) {
                        console.error(error);
                    }
                };
                //230215，做ui渲染元素组件与矢量图元data的对象关联，结合i.rootData，可以实现某个渲染元素组件比如combobox_ui，获取到其最上层的图元，继而得到对应的渲染元素组件，不然dialog_ui对话框ui对象！
                data._uiView = control; //有不少表单组件的control是布局layout，
                data._cache = cache; //所以加上data._cache属性！
                data._gv = gv;
                i.addAttrRunningInit(data, 's:2d.selectable', false);
            },
            _labelLayout: function(data, gv, cache, event) {
                switch (event.property) {
                    case 'a:layoutVertical':
                        if (!runningMode() && !data.ca('labelEmbeded') && event.newValue) {
                            data.ca('labelEmbeded', true);
                            data.fp('a:labelText', undefined, data.ca('labelText'));
                            return;
                        }
                        break;
                    case 'a:gap':
                        break;
                    case 'a:labelEmbeded':
                        //230213，label与组件在垂直布局模式下，内嵌勾线去勾选不起作用！
                        if (data.ca('layoutVertical')) {
                            data.ca('labelEmbeded', true);
                            break;
                        }
                    case 'a:labelText':
                        if (data.ca('labelEmbeded')) {
                            cache.label.setVisible(true);
                            data.s('label', undefined);
                            data.s('label.opacity', 0); //231006
                        } else {
                            cache.label.setVisible(false);
                            data.s('label', data.ca('labelText'));
                            data.s('label.opacity', 1); //231006
                        }
                        data.ca('gap', data.ca('labelText') == '' || !cache.label.isVisible() ? 0 : 15);
                }
            },
            /*当前图元获图元组件列表中是否有固定高度的*/
            hasFixedHeight: function(datas) { //兼容传入单个图元对象，其中图元对象为block组合类型时，会自动遍历判断组合内的子图元
                if (!isArrayFn(datas)) datas = [datas];
                let found = false;
                datas.forEach(data => {
                    if (data.ca('fixedHeight')) found = true;
                    if (data.getClassName() == 'ht.Block' && data.isSyncSize()) {
                        data.eachChild(function(child) { //注意，是否会遍历内部组合的下一级子节点？暂未验证，可能存在只遍历当前一层子图元的BUG！！！
                            if (child.ca('fixedHeight')) found = true;
                        });
                    }
                });
                return found;
            },
            /*获取数组中图元宽高最大的*/
            getMaxWH: function(datas) {
                if (!isArrayFn(datas)) datas = [datas];
                let h = null,
                    hNode = null,
                    w = null,
                    wNode = null;
                datas.forEach(data => {
                    if (data.getWidth() > w) {
                        w = data.getWidth();
                        wNode = data;
                    }
                    if (data.getHeight() > h) {
                        h = data.getHeight();
                        hNode = data;
                    }
                });
                return {
                    maxWidth: {
                        val: w,
                        node: wNode
                    },
                    maxHeight: {
                        val: h,
                        node: hNode
                    }
                }
            },
            /*判断js/json对象是否有循环引用
            let a = {
                a:323,
                b:[2,3,4,5,{
                    key:"hello"
                }]
            }
            alert(i.hasLoopCycle(a)); // false
            alert(i.hasLoopCycle(window)); //true
            */
            hasLoopCycle: function(obj, orHasWindowOrHtNode = false) { //230310，加上参数orHasWindowOrHtNode，true时，如果没有循环应用，但是有ht图元，也返回true，用于判断是否要做扁平化结构化

                //230311，初始传入就做判断，如果要求且确实是ht或window对象，那么hasLoopCycle直接返回true，不尽兴keys判断处理！
                function __windowOrHtNode(o) {
                    return orHasWindowOrHtNode && (i.isHtNodeData(o) || i.isWindow(o));
                }
                if (__windowOrHtNode(obj)) return true;

                //240208，这个递归对于大表单对象太耗时，现在通常用不上这里。
                return false;

                //tips 230925，由之前的深度优先，通过定时器改成广度优先，加快速度
                function findLoop(target, src, _parentKey = null) {
                    // 源数组，并将自身传入
                    const source = src.slice().concat([target])
                    for (const key in target) {
                        // 如果是对象才需要判断
                        if (typeof target[key] === 'object') {
                            // 如果在源数组中找到 || 递归查找内部属性找到相
                            //230925，条件提到前面公共地方
                            let foundInSource = source.indexOf(target[key]) > -1,
                                isWinOrNodeObj = __windowOrHtNode(target[key]); //逐层遍历如果要求且确实有ht或window对象，那么返回true
                            if (foundInSource || isWinOrNodeObj || findLoop(target[key], source, (_parentKey ? (_parentKey + '>') : '') + key)) {
                                //230925，最底层发现。注意，这是深度优先！
                                (foundInSource || isWinOrNodeObj) && console.error('WARN:current object contains node or Window object!', 'KEY: ', _parentKey + '>' + key, '|', 'VALUE: ', target[key], '|', 'ORIGIN: ', obj);
                                return true;
                            }
                        }
                    }
                    return false
                }
                // 如果传入值是对象，则执行判断，否则返回false
                let result = typeof obj === 'object' ? findLoop(obj, []) : false;
                // if (result) console.warn('current object has loop circle', obj); //230729，临时减少打印输出！

                return result;
            },
            //230310，判断是否是ht图元node/data对象，通常用于在扁平化、结构化等地方，用于区别常见的json对象，作为i.hasLoopCycle()在另一个维度上的补充
            isHtNodeData: function(jsonObject) {
                return jsonObject && jsonObject.dm && typeof(jsonObject.dm) === 'function';
            },
            isWindow: function(obj) {
                return obj != null && obj.window === obj;
            },
            //230925，判断对象是否是window或图元node对象
            isWinOrNodeObj: function(obj) {
                // console.assert(obj !== undefined);
                return obj && (i.isHtNodeData(obj) || i.isWindow(obj));
            },
            //231206，判断是否是简单json对象，不带函数、ht、window对象等
            isSimpleJson: function(obj) {
                let normalType = true;
                i.values(obj).forEach((item, idx) => {
                    if (
                        i.isWinOrNodeObj(item) ||
                        (typeof(item) == 'function' && i.keys(obj)[idx] != '__upper')
                    ) {
                        normalType = false;
                    }
                });
                return normalType;
            },
            /*230212介于扁平化和结构化之间的状态，如下示例，扁平化叫做flatJson、结构化叫做treeJson的化，下面叫做middleJson，中间态！不过从方法和用途以及
            与另两种结构转换频次的角度考虑，下面归位为结构化，不提供独立的方法来形成3个之间的两两转换！中间态结构，通常可用于http get请求参数生成
            1）扁平化：flatJson
            {
                "postStr.keyWord": "医院",
                "postStr.level": 12,
                "postStr.queryRadius": 5000,
                "postStr.pointLonlat": "116.48016,39.93136",
                "postStr.queryType": 3,
                "postStr.start": 0,
                "postStr.count": 10,
                "type": "query",
                "tk": "4958d00c288479287f00eb4b4e11a492",
                "_url": "http://api.tianditu.gov.cn/v2/search"
            }
            2）结构化：treeJson
            {
                "postStr": {
                    "keyWord": "医院",
                    "level": 12,
                    "queryRadius": 5000,
                    "pointLonlat": "116.48016,39.93136",
                    "queryType": 3,
                    "start": 0,
                    "count": 10
                },
                "type": "query",
                "tk": "4958d00c288479287f00eb4b4e11a492",
                "_url": "http://api.tianditu.gov.cn/v2/search"
            }
            3）中间态（当成结构化的一种特殊形式）：middleJson
            {
                "postStr": "{\"keyWord\":\"医院\",\"level\":12,\"queryRadius\":5000,\"pointLonlat\":\"116.48016,39.93136\",\"queryType\":3,\"start\":0,\"count\":10}",
                "type": "query",
                "tk": "4958d00c288479287f00eb4b4e11a492",
                "_url": "http://api.tianditu.gov.cn/v2/search"
            }
            */
            //convertToFlatJson的升级
            /*结构化的json转换成扁平化，其中结合toTreeJson，对于第一层值为json字符串的，也被当成是一种结构化，而不是作为扁平化，
            因为这样才好让两种结构化跟扁平化来转换，而扁平化是xxx.xxx.xxx这样方便编辑器编辑的形式，通常中间middle结构也需要扁平化
            类协助编辑去生成，所以中间结构和完整结构化，都是需要扁平化去转换的，因此从概念和提供的方法，均划分到结构化里去！*/
            toFlatJson: function(jsonTreeObject, flag = '>') {
                i.toJsonFirstLayer(jsonTreeObject);
                return convertToFlatJson(jsonTreeObject, flag);
            },
            // convertToTreeJson的升级
            /*middleStructType为true则是完整的多层对象，等同于convertToTreeJson；middleStructType为false时是单层，
            其中value为json的字符串形式而非value了，格式介于扁平化和结构化之间，可以理解为是另一种扁平化，也可以理解为是另一种结构化！
            这里接口是则是作为一种tree结构化类型类处理，并未提供单独的比如toMiddleJson这种方法！否则3个两两之间转换考虑复杂化了！*/
            toTreeJson: function(jsonFlatObject, flag = '>', middleStructType = false, stringify = false) {
                let treeJson = convertToTreeJson(jsonFlatObject, flag, true, false, stringify);
                if (middleStructType) {
                    let middleTypeJson = {};
                    for (key in treeJson) {
                        let valtmp = treeJson[key];
                        middleTypeJson[key] = typeof valtmp == 'object' ? JSON.stringify(valtmp) : valtmp;
                    }
                    return middleTypeJson
                } else {
                    return i.toJsonFirstLayer(treeJson);
                }
            },
            /*任意JSON结构转成字段、值两列格式的数据，树表子节点展开的形式，树表格式为：[{rowData:[],children:[]}, {}]
            输入示例，下面变量dataTmp对象数据如下，属于图元对象的formData数据中，keyURL-value扁平化对应的结构化模式：
            {
                "a:display": "./3_嵌套/1_3_逐层嵌套（包含平行）+属性赋值.json",
                "a:innerLayoutMode": "fullScreen",
                "a:1_3_逐层嵌套（包含平行）+属性赋值": [
                    {
                        "gv1": {
                            "a:display": "./1_逐层嵌套/4-1.json",
                            "a:4-1": [
                                {
                                    "gv1": {
                                        "a:display": "./3.json",
                                        "a:3": [
                                            {
                                                "gv1": {
                                                    "a:display": "./2-1.json",
                                                    "a:2-1": [
                                                        {
                                                            "gv1": {
                                                                "a:display": "./1-1.json",
                                                                "a:1-1": [
                                                                    {
                                                                        "func1": {
                                                                            "a:userData": [],
                                                                            "a:output": {},
                                                                            "a:inputs": [],
                                                                            "a:exec": false,
                                                                            "a:arrExec": false,
                                                                            "a:outputByEvent": true,
                                                                            "a:onOutput": {}
                                                                        },
                                                                        "dataInput": {
                                                                            "a:value": "hello",
                                                                            "a:instantTrigger": true,
                                                                            "a:onChange": {},
                                                                            "a:onEnter": {},
                                                                            "s:label": "输入A：",
                                                                            "a:readOnly": false,
                                                                            "a:initialTrigger": false
                                                                        },
                                                                        "Text1": {
                                                                            "s:text": "第5-4-3-2-1-1层"
                                                                        }
                                                                    }
                                                                ],
                                                                "a:innerLayoutMode": "fullScreen"
                                                            },
                                                            "Text1": {
                                                                "s:text": "第5-4-3-2-1层"
                                                            }
                                                        }
                                                    ],
                                                    "a:innerLayoutMode": "fullScreen"
                                                },
                                                "gv2": {
                                                    "a:display": "./2-2.json",
                                                    "a:2-2": [
                                                        {
                                                            "gv1": {
                                                                "a:display": "./1-2.json",
                                                                "a:1-2": [
                                                                    {
                                                                        "dataOutput": {
                                                                            "a:value": "",
                                                                            "a:instantTrigger": true,
                                                                            "a:onChange": {},
                                                                            "a:onEnter": {},
                                                                            "s:label": "输出B：",
                                                                            "a:readOnly": false,
                                                                            "a:initialTrigger": false
                                                                        },
                                                                        "Text1": {
                                                                            "s:text": "第5-4-3-2-1-2层"
                                                                        }
                                                                    }
                                                                ],
                                                                "a:innerLayoutMode": "fullScreen"
                                                            },
                                                            "Text1": {
                                                                "s:text": "第5-4-3-2-2层"
                                                            }
                                                        }
                                                    ],
                                                    "a:innerLayoutMode": "fullScreen"
                                                },
                                                "Text1": {
                                                    "s:text": "第5-4-1-3层"
                                                }
                                            }
                                        ],
                                        "a:innerLayoutMode": "fullScreen"
                                    },
                                    "Text1": {
                                        "s:text": "第5-4-1层"
                                    }
                                }
                            ],
                            "a:innerLayoutMode": "fullScreen"
                        },
                        "gv2": {
                            "a:display": "./1_逐层嵌套/4-2.json",
                            "a:4-2": [
                                {
                                    "gv1": {
                                        "a:display": "./3.json",
                                        "a:3": [
                                            {
                                                "gv1": {
                                                    "a:display": "./2-1.json",
                                                    "a:2-1": [
                                                        {
                                                            "gv1": {
                                                                "a:display": "./1-1.json",
                                                                "a:1-1": [
                                                                    {
                                                                        "func1": {
                                                                            "a:userData": [],
                                                                            "a:output": {},
                                                                            "a:inputs": [],
                                                                            "a:exec": false,
                                                                            "a:arrExec": false,
                                                                            "a:outputByEvent": true,
                                                                            "a:onOutput": {}
                                                                        },
                                                                        "dataInput": {
                                                                            "a:value": "uiotos",
                                                                            "a:instantTrigger": true,
                                                                            "a:onChange": {},
                                                                            "a:onEnter": {},
                                                                            "s:label": "输入B：",
                                                                            "a:readOnly": false,
                                                                            "a:initialTrigger": false
                                                                        },
                                                                        "Text1": {
                                                                            "s:text": "第1-1层"
                                                                        }
                                                                    }
                                                                ],
                                                                "a:innerLayoutMode": "fullScreen"
                                                            },
                                                            "Text1": {
                                                                "s:text": "第2-1层"
                                                            }
                                                        }
                                                    ],
                                                    "a:innerLayoutMode": "fullScreen"
                                                },
                                                "gv2": {
                                                    "a:display": "./2-2.json",
                                                    "a:2-2": [
                                                        {
                                                            "gv1": {
                                                                "a:display": "./1-2.json",
                                                                "a:1-2": [
                                                                    {
                                                                        "dataOutput": {
                                                                            "a:value": "",
                                                                            "a:instantTrigger": true,
                                                                            "a:onChange": {},
                                                                            "a:onEnter": {},
                                                                            "s:label": "输出A：",
                                                                            "a:readOnly": false,
                                                                            "a:initialTrigger": false
                                                                        },
                                                                        "Text1": {
                                                                            "s:text": "第1-2层"
                                                                        }
                                                                    }
                                                                ],
                                                                "a:innerLayoutMode": "fullScreen"
                                                            },
                                                            "Text1": {
                                                                "s:text": "第2-2层"
                                                            }
                                                        }
                                                    ],
                                                    "a:innerLayoutMode": "fullScreen"
                                                },
                                                "Text1": {
                                                    "s:text": "第3层"
                                                }
                                            }
                                        ],
                                        "a:innerLayoutMode": "fullScreen"
                                    },
                                    "Text1": {
                                        "s:text": "第4-2层"
                                    }
                                }
                            ],
                            "a:innerLayoutMode": "fullScreen"
                        },
                        "txt1": {
                            "a:value": "如果输入B到输出B也用跟输入A一样的连线配置，会导致\n死循环，因为输出A的变化时间，同样会因为顶层容器勾选\n了允许内嵌事件通过，而触发其对外的连线操作，从而触发\n输入B→输出B，输出B又会导致输入A对外操作，导致死循环。\n\n【待说明A】：初始输入已有的内容没自动同步输出？\n【待说明B】：输入A空时，初始输入有延时而输入B\n 做了输入后即可输出到输出B，且A的输入输出也正常了。",
                            "a:instantTrigger": true,
                            "a:htmlContent": false,
                            "a:readOnly": {},
                            "a:onChange": {}
                        }
                    }
                ],
                "a:_bindEvents_0": "*",
                "id": 1
            }
            调用：
            _i.convertJsonToTree(_i.toTreeJson(_i.formValues(node, -1)), (key, value) => {
                function __isAllfieldPrefixed(obj) {
                    if (obj === undefined || i.keys(obj).length === 0) return -2; //不要用Object.keys()，因为用到convertToJsonTree会带上__upper
                    let prefixs = ['a:', 'p:', 's'],
                        keystmp = i.keys(obj),
                        prefixCount = 0;
                    keystmp.forEach(key => {
                        if (prefixs.indexOf(key.slice(0, 2)) !== -1) {
                            prefixCount += 1;
                        }
                    });
                    if (prefixCount > 0 && prefixCount === keystmp.length) return 1; //所有key都是x:有前缀标记
                    if (prefixCount === 0 && 0 !== keystmp.length) return 0; //所有都没有前缀标记
                    if (prefixCount > 0 && prefixCount !== keystmp.length) return -1; //部分有前缀标记
                };
                if (/^(a:|p:|s:)/.test(key)) { // 判断键名以a:、p:、s:开头，此时是属性名  
                    if (Array.isArray(value)) { //值是数组，那么判断格式
                        let statetmp = __isAllfieldPrefixed(value[0]);
                        if (statetmp === -2) return true; //undefined，即上层为[]，则作为值
                        else return !(statetmp === 0); //选择第一个对象元素，内部字段都。return true，表示作为值，不进一步解析；return false时，就会进一步解析！
                    } else { //值是对象，那么确定就是实际最终值
                        return true;
                    }
                } else { // 键名没有以a:、p:、s:开头，此时是图元tag标签
                    if (Array.isArray(value)) { //值是数组，那么确定就是实际最终值
                        return true;
                    } else { //值是对象，那么判断格式，
                        let statetmp = __isAllfieldPrefixed(value);
                        if (statetmp === -2) return true; //undefined，即当前为{}时，作为值
                        else return !(statetmp === 1); //内部字段都有前缀，
                    }
                }
            }));
            输出：
            [{"rowData":["a:display","./3_嵌套/1_3_逐层嵌套（包含平行）+属性赋值.json"],"children":[]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]},{"rowData":["a:1_3_逐层嵌套（包含平行）+属性赋值","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：3"],"children":[{"rowData":["gv1","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./1_逐层嵌套/4-1.json"],"children":[]},{"rowData":["a:4-1","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：2"],"children":[{"rowData":["gv1","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./3.json"],"children":[]},{"rowData":["a:3","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：3"],"children":[{"rowData":["gv1","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./2-1.json"],"children":[]},{"rowData":["a:2-1","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：2"],"children":[{"rowData":["gv1","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./1-1.json"],"children":[]},{"rowData":["a:1-1","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：3"],"children":[{"rowData":["func1","    ↓ 继承下级属性统计：7"],"children":[{"rowData":["a:userData",[]],"children":[]},{"rowData":["a:output",{}],"children":[]},{"rowData":["a:inputs",[]],"children":[]},{"rowData":["a:exec",false],"children":[]},{"rowData":["a:arrExec",false],"children":[]},{"rowData":["a:outputByEvent",true],"children":[]},{"rowData":["a:onOutput",{}],"children":[]}]},{"rowData":["dataInput",{"a:value":"hello","a:instantTrigger":true,"a:onChange":{},"a:onEnter":{},"s:label":"输入A：","a:readOnly":false,"a:initialTrigger":false}],"children":[]},{"rowData":["Text1",{"s:text":"第5-4-3-2-1-1层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["Text1",{"s:text":"第5-4-3-2-1层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["gv2","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./2-2.json"],"children":[]},{"rowData":["a:2-2","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：2"],"children":[{"rowData":["gv1","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./1-2.json"],"children":[]},{"rowData":["a:1-2","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：2"],"children":[{"rowData":["dataOutput",{"a:value":"","a:instantTrigger":true,"a:onChange":{},"a:onEnter":{},"s:label":"输出B：","a:readOnly":false,"a:initialTrigger":false}],"children":[]},{"rowData":["Text1",{"s:text":"第5-4-3-2-1-2层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["Text1",{"s:text":"第5-4-3-2-2层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["Text1",{"s:text":"第5-4-1-3层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["Text1",{"s:text":"第5-4-1层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["gv2","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./1_逐层嵌套/4-2.json"],"children":[]},{"rowData":["a:4-2","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：2"],"children":[{"rowData":["gv1","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./3.json"],"children":[]},{"rowData":["a:3","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：3"],"children":[{"rowData":["gv1","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./2-1.json"],"children":[]},{"rowData":["a:2-1","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：2"],"children":[{"rowData":["gv1","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./1-1.json"],"children":[]},{"rowData":["a:1-1","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：3"],"children":[{"rowData":["func1","    ↓ 继承下级属性统计：7"],"children":[{"rowData":["a:userData",[]],"children":[]},{"rowData":["a:output",{}],"children":[]},{"rowData":["a:inputs",[]],"children":[]},{"rowData":["a:exec",false],"children":[]},{"rowData":["a:arrExec",false],"children":[]},{"rowData":["a:outputByEvent",true],"children":[]},{"rowData":["a:onOutput",{}],"children":[]}]},{"rowData":["dataInput",{"a:value":"uiotos","a:instantTrigger":true,"a:onChange":{},"a:onEnter":{},"s:label":"输入B：","a:readOnly":false,"a:initialTrigger":false}],"children":[]},{"rowData":["Text1",{"s:text":"第1-1层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["Text1",{"s:text":"第2-1层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["gv2","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./2-2.json"],"children":[]},{"rowData":["a:2-2","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：2"],"children":[{"rowData":["gv1","    ↓ 继承下级属性统计：3"],"children":[{"rowData":["a:display","./1-2.json"],"children":[]},{"rowData":["a:1-2","↓↓↓ 组件容器实例数量：1"],"children":[{"rowData":["容器实例 0","  ↓↓ 内嵌页面组件数量：2"],"children":[{"rowData":["dataOutput",{"a:value":"","a:instantTrigger":true,"a:onChange":{},"a:onEnter":{},"s:label":"输出A：","a:readOnly":false,"a:initialTrigger":false}],"children":[]},{"rowData":["Text1",{"s:text":"第1-2层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["Text1",{"s:text":"第2-2层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["Text1",{"s:text":"第3层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["Text1",{"s:text":"第4-2层"}],"children":[]}]}]},{"rowData":["a:innerLayoutMode","fullScreen"],"children":[]}]},{"rowData":["txt1","    ↓ 继承下级属性统计：5"],"children":[{"rowData":["a:value","如果输入B到输出B也用跟输入A一样的连线配置，会导致\\n死循环，因为输出A的变化时间，同样会因为顶层容器勾选\\n了允许内嵌事件通过，而触发其对外的连线操作，从而触发\\n输入B→输出B，输出B又会导致输入A对外操作，导致死循环。\\n\\n【待说明A】：初始输入已有的内容没自动同步输出？\\n【待说明B】：输入A空时，初始输入有延时而输入B\\n 做了输入后即可输出到输出B，且A的输入输出也正常了。"],"children":[]},{"rowData":["a:instantTrigger",true],"children":[]},{"rowData":["a:htmlContent",false],"children":[]},{"rowData":["a:readOnly",{}],"children":[]},{"rowData":["a:onChange",{}],"children":[]}]}]}]},{"rowData":["a:_bindEvents_0","*"],"children":[]},{"rowData":["id",1],"children":[]}]
            240216，此外，如果值是对象而且有_i_type和_i_value字段时，走特殊规则，实际取_i_value的值处理后再作为值。处理规则为，要求为数组，并且遍历数组，追加成多个列！
            相当于，如果不通过_i_type和_i_value处理，直接将_i_value的值作为值，那么就是一个数组值，但是经过这里处理后，数值的多个值，将成为输出表格数据格式的多个字
            段列的值！这样可以将json格式转成key-value两列之外的任意多个列！！*/
            convertJsonToTree: function(obj, valueRecognizedCB = null, _extraInfoChains = {}) {
                let rowsTmp = [];
                i.keys(obj).forEach(key => {
                    let curNode = {
                        rowData: [],
                        children: []
                    };

                    function __pushColumnData(key, value, columnCount) {
                        let isValueObject = valueRecognizedCB(key, value);
                        if (Array.isArray(value) && isValueObject <= 0) {

                            //240219，属性继承面板中，表单类型列之前又加了一列，对照上层的绑定类型！这里也要对应填一个空，避免显示位置错位
                            curNode.rowData.push(` `);
                            //240614，增加attrNote列
                            curNode.rowData.push(` `);
                            //240215，注意，这里是自定义硬编码的地方！除去首列序号列、树节点列，对于非底层节点还有两列的显示问题在此处调整！
                            curNode.rowData.push(` `);
                            curNode.rowData.push(`↓↓↓ 页面 | 实例数：${value.length}`);

                            value.forEach((item, idx) => {
                                curNode.children.push({
                                    //240219，属性继承面板中，表单类型列之前又加了一列，对照上层的绑定类型！这里也要对应填一个空:null，避免显示位置错位
                                    rowData: [idx + '（页面实例）', null, null, null, `  ↓↓ 实例 | 组件数：${i.keys(item).length}`],
                                    children: [...i.convertJsonToTree(item, valueRecognizedCB)]
                                });
                            });
                        } else if (typeof(value) == 'object' && isValueObject <= 0) {

                            //240219，属性继承面板中，表单类型列之前又加了一列，对照上层的绑定类型！这里也要对应填一个空，避免显示位置错位
                            curNode.rowData.push(` `);
                            //240614，增加attrNote列
                            curNode.rowData.push(` `);
                            //240215，注意，这里是自定义硬编码的地方！除去首列序号列、树节点列，对于非底层节点还有两列的显示问题在此处调整！
                            curNode.rowData.push(` `);
                            curNode.rowData.push(`    ↓ 组件 | 属性数：${i.keys(value).length}`);

                            curNode.children.push(...i.convertJsonToTree(value, valueRecognizedCB));
                        } else {
                            curNode.rowData.push(value);
                        }
                    }

                    rowsTmp.push(curNode);
                    curNode.rowData.push(key);
                    let valtmp = obj[key];
                    /*240216，如果值是对象而且有_i_type和_i_value字段时，走特殊规则，实际取_i_value的值处理后再作为值。处理规则为，要求为数组，
                    并且遍历数组，追加成多个列！
                    相当于，如果不通过_i_type和_i_value处理，直接将_i_value的值作为值，那么就是一个数组值，但是经过这里处理后，数值的多个值，将
                    成为输出表格数据格式的多个字段列的值！这样可以将json格式转成key-value两列之外的任意多个列！！*/
                    if (isObject(valtmp) && valtmp._i_type !== undefined && valtmp._i_value !== undefined) {
                        switch (valtmp._i_type) {
                            case 'columns':
                                delete valtmp._i_value.__upper; //240215，先清理掉可能存在的__upper字段！
                                valtmp._i_value.forEach(item => {
                                    __pushColumnData(key, item, valtmp._i_value.length);
                                });
                                break;
                            default:
                                console.assert(0);
                                break;
                        }
                    } else {
                        __pushColumnData(key, valtmp);
                    }
                });
                return rowsTmp;
            },
            /*231129，对象转数组、数组转对象，与toTreeJson、toFlatJson有接近的地方，但是这里只处理当前层，不递归，后者递归处理
            的太彻底、原子化了，对于接口数据解析的提取有时是麻烦*/
            toArray: (obj) => {
                return i.overWrite([], obj);
            },
            toObject: (obj) => {
                return i.overWrite({}, obj);
            },
            /*与toTreeJson的最大区别是仅处理第一层，且不是根据flag，而是将value为json字符串的还原成json对象而已，原理完全不同。
            中间结构middle typed Json转换成tree typed json，middle typed json典型特征就是只有一层结构，所有的值如果有对象的那么也是
            对象object的字符串结构。因此与flat扁平结构有相似之处，只是扁平结构的value是原子数据，不存在结构化对象的字符串形式，因此
            如果传入数据是扁平化结构时，会原样输出，兼容并不影响！*/
            toJsonFirstLayer: function(midFlatJson) {
                for (key in midFlatJson) {
                    let valtmp = midFlatJson[key];
                    if (typeof valtmp == 'string') {
                        try {
                            let parsedVal = i.jsonParse(valtmp);
                            if (typeof(parsedVal) == 'object') { //230907，加上这里，否则字符串形式的数字串，会被转换成不一样的整数！！！！
                                midFlatJson[key] = parsedVal; //如果是json字符串，那么就自动转换成对象，如果不是就会到catch不作处理
                            }
                        } catch (error) {}
                    }
                }
                return midFlatJson;
            },
            //通常用于获取编辑器的数组类型属性配置值。如果是数组且长度为1，且内容不是对象，就当固定一个值来处理，因为编辑器中实数组类型，没法直接输入单个值
            confValue: function(value) {
                let valtmp = value;
                if (isArrayFn(value) && value.length == 1 && !isObject(value[0])) valtmp = value[0];
                else valtmp = value;

                /*230912，需要移出掉强制转换！比如数据库的id可能是很长一串数字字符串，被转换成Numbber后发现会被改变，而不是原数字字符串的内容！！！因为现在
                inputs各个元素已经是对象，整体是对象数组不再是字符串数组，因此可以精准控制数据类型了，不需也不应该做强制转换了！*/
                // if (i.isStringNumber(valtmp)) valtmp = Number(valtmp);

                return valtmp;
            },
            /*231130，对于工具函数的输入，如果只有一个元素时，是否取出再作为输入*/
            __realInputs: function(data, value) {
                let useInputsAsSingle = i.getValue(data, 'stripSingleInput');
                if (useInputsAsSingle === undefined) {
                    if (value == '__FUCKING_NONE__') { //231224，初始没有设置inputs值时，就取当前inputs属性值！
                        value = data.ca('inputs');
                    }
                    return i.confValue(value);
                } else if (isArrayFn(value) && value.length == 1) { //走全新逻辑，严格按照新增的配置属性，来确保唯一这个输入的元素是否被提取出来作为输入而不走自动判断规则了！
                    if (useInputsAsSingle == false) { //新的逻辑，显式去掉了stripSingleInput属性的勾选
                        //不做任何处理，直接原始数据作为输入
                    } else {
                        value = value[0]; //只要有勾选stripSingleInput，就用第一个元素作为输入，不再判断是否是对象isObject()什么的了！！
                    }
                } else if (value == '__FUCKING_NONE__') { //231224，初始没有设置inputs值时，就取当前inputs属性值！
                    value = data.ca('inputs');
                }
                return value;
            },
            /*230215，运行模式下的属性值初始化，跟编辑状态下值一般不一样，比如不可见组件编辑状态下可见，运行状态不可见，以及渲染元素图元编辑状态也需允许点击选中
            但是运行模式下不允许点击选中（会截获事件传递！）*/
            addAttrRunningInit: function(data, attr, value, forceOldValue = undefined) {
                if (runningMode()) {
                    let currentItem = {
                        attr: i.autoPrefixed(attr, data),
                        oldValue: forceOldValue === undefined ? i.getValue(data, attr) : forceOldValue, //230414，加上forceOldValue，不为undefined时，则以传入值为准！
                        newValue: value
                    }
                    if (data._saveIngored == undefined) { //1) 初始赋值
                        data._saveIngored = [currentItem];
                    } else {
                        console.assert(isArrayFn(data._saveIngored));
                        let itemtmp = i.getTreeItemsById(data._saveIngored, attr, idField = 'attr')[0];
                        if (itemtmp) { //2) 如果此前已有赋值，那么替换覆盖
                            console.warn('saveIngored attr config of', i.autoTag(data), 'will be overwritten! old:', i.toJSON(itemtmp), 'new:', currentItem)
                            itemtmp.oldValue = currentItem.oldValue;
                            itemtmp.newValue = currentItem.newValue;
                        } else data._saveIngored.push(currentItem); //3) 如果此前有数据并且不是本次要操作的属性，则追加
                    }
                    i.update(data, attr, value);
                }
            },
            //230216，当前不区分文件路径还是http url，只要是url能访问就行
            isUrl: function(url, tails = '.json') {
                if (typeof(url) == 'string') {
                    if (!!i.getImage(url)) return true; //240105，存在"node_image"这种情况，注册图片，这就不是.json/.png等后缀！
                    if (url.trim() == '') return false; //240108，空字符串、空格，则返回false。比如矩形的image，试图动态填充显示图片时，会存在这种情况！
                }

                if (!isArrayFn(tails)) tails = [tails]; //240105，支持tails传入数组，比如['.json','.png']
                let subfixOk = false;
                tails.forEach(tail => {
                    if (url && url.slice && url.slice(0 - tail.length) == tail) subfixOk = true;
                });
                if (typeof(url) == 'string' && !subfixOk && url.slice(0, 22) != 'data:image/png;base64,' && url.slice(-4) !== '.png') {
                    console.error('WARN: url', url, 'is not recognized as image url because subfix not in', tails, ',', subfixOk, 'is given!');
                }

                return typeof(url) == 'string' && subfixOk;
            },
            //230216，图元是否是“简单图元”：没有内嵌图纸/图标、没有事件bindControls，将被自动设置运行时不可选中！
            isSimpleData: function(data, shapesExclude = false, othersExclude = []) {
                if (
                    othersExclude.indexOf(data.getClassName()) != -1 ||
                    (shapesExclude && data.s('shape'))
                ) return false;
                try {
                    if(data.getClassName() == 'ht.Shape') return true; 
                    if (data.getImage == undefined) return true;
                    let imgtmp = data.getImage(),
                        hasImage = false;
                    if (typeof imgtmp == 'string' || imgtmp == null) {
                        if (i.isUrl(imgtmp)) hasImage = true;
                    } else {
                        console.assert(isObject(imgtmp));
                        hasImage = true;
                    }
                    return !i.hasAttrObjectKey(data, 'bindControlsTag') && !hasImage;
                } catch (error) {
                    console.error(error, data);
                    return true;
                }
            },
            //240903，带有渲染元素、i.md的类型的组件！
            isSymbolType: function(data){
                if(!i.hasAttrObjectKey(data,'symbol')) return false; //240918，没有symbol属性的，都不认为有渲染元素和i.md，比如进度环等矢量图表！
                let imgtmp = data.getImage && data.getImage();
                if(imgtmp && !data.ca('hasNoSymbolOrigin')){
                    if(typeof(imgtmp) == 'string'){
                        if(imgtmp.slice(0,8) == 'symbols/' && imgtmp.slice(-5) == '.json') return true;
                    }else if(typeof(imgtmp) == 'object'){
                        imgtmp = data.ca('symbol');
                        if(imgtmp.slice(0,8) == 'symbols/' && imgtmp.slice(-5) == '.json') return true;
                    }else console.assert(0);
                }
                return false;
            },
            //判断是否是只有一层的json对象或者数组
            isJsonWithOneLayer: function(jsonObj) { //可传入json对象或者数组
                let found = false;
                if (isArrayFn(jsonObj)) {
                    jsonObj.forEach(item => {
                        if (isObject(item)) found = true;
                    });
                } else if (isObject(jsonObj)) {
                    for (let key in jsonObj) {
                        if (isObject(jsonObj[key])) found = true;
                    }
                } else { //传入的非对象或者数组，即不是json对象时！不是期望的入参！不过结果也是按照true返回，这里会打印提示异常！
                    console.assert(0);
                }
                return !found;
            },
            /*231202，tips，试图增加参数checkInheritOption，不是任何时都检查，否则内嵌也勾选了属性不被继承后，但发现当前页做连线
            逻辑发现都没有属性列表了！这肯定不行，局部要能通过!*/
            isFormVarBind: function(varName) {
                //231228，支持绑定除了iotos.formRest/value/form，还支持传入2,3,1这样的数字代替！
                if (typeof(varName) == 'number' && (varName >= 1 || varName <= 3)) return varName;
                if (varName == 'iotos.form' || varName == 'form') return 1;
                else if (varName == 'iotos.formReset' || varName == 'formReset') return 2;
                else if (varName == 'iotos.formValue' || varName == 'formValue') return 3; //2302227，增加formValue绑定，用于提供值对应接口或数据库字段
                else return 0;
            },
            //240608，判断数据绑定的是否是iot变量点位
            /*{注意，dataBindings里面的绑定，是这种格式，id和idInfo把@已经拆分了！
                alias:xx,
                func:xx,
                id:"串口设备.接收",
                idinfo: "f128a9b9-398.dd97-26006",
                isTplBinded: false
            }
            */
            isIotVarBind: function(bindItem) { //其实就是id字段
                if (bindItem.id && bindItem.id.split('.').length >= 2 &&
                    bindItem.idinfo && bindItem.idinfo.split('.').length >= 2 //240608，注意，目前没有判断idInfo中前后段里的'-'
                ) {
                    return true;
                } else return false;
            },
            //240120，判断属性是否有form绑定，当然，返回0、1、2、3，对应无、form、formReset、formValue。tips 240211，相对于频繁通过i.attrsFormBinded()再去indexOf()性能要高得多！！！
            isAttrFormBinded: function(data, attr) {
                let attrPrefixed = i.autoPrefixed(attr, data),
                    prefixed = attrPrefixed.slice(0, 1),
                    attrtmp = attrPrefixed.slice(2);
                let dbtmp = data.getDataBindings(),
                    typed = dbtmp && dbtmp[prefixed],
                    bdObj = typed && typed[attrtmp],
                    bindId = bdObj && bdObj['id'];
                return bindId !== undefined ? i.isFormVarBind(bindId) : false;
            },
            addKeysAction: function(curKey, keysAction, param = null) {
                if (param && param.data && i.isControlTyped(param.data, 'func') && param.property == 'a:function') {
                    //不是初始加载（避免无法序列化保存设置，每次都被还原成true），或者当前内容为undefined时，恢复默认true
                    if (param.oldValue != '__init__' || i.getValue(param.data, 'stripSingleInput') === undefined) {
                        if (i.hasAttrInLocalObj(param.data, 'stripSingleInput')) {
                            param.data.ca('stripSingleInput', true);
                        }
                    }
                }

                for (let key in keysAction) {
                    let functmp = keysAction[key]; //获取函数
                    key.split('|').forEach(item => { //配置除了'a:value'单个的格式外，支持多个以|间隔传入：'a:value|s:label | a:datas'
                        let itemTrimed = item.trim();
                        if (itemTrimed != '' && curKey === itemTrimed) {
                            functmp && functmp(param);
                        }
                    });
                }
            },
            //230222，网格组合/解组合
            gridBlock: function(nodeArr, hCount = 4) { //传入ht.Grid对象则是解网格；传入data数组则是打成网格
                if (isObject(nodeArr) && !isArrayFn(nodeArr) && (nodeArr.getClassName() == 'ht.Grid' || nodeArr.getClassName() == 'ht.UGrid')) {
                    let gridNode = nodeArr,
                        arrtmp = [];
                    let childrentmp = gridNode.getChildren();
                    childrentmp.forEach(child => child.s('2d.selectable', true));
                    gridNode.dm().getSelectionModel().as(childrentmp); //解组网格后，还是选中全部子节点状态
                    gridNode.clearChildren();
                    gridNode.dm().remove(gridNode);
                } else {
                    if (nodeArr.length == 0) return;
                    let dm = nodeArr[0].dm(),
                        sm = dm.getSelectionModel(),
                        gridLayout = new ht.UGrid();
                    gridLayout.setName('grid'); //230612，右键网格组合快捷键操作对应的逻辑
                    gridLayout.s('label.opacity', 0);
                    dm.add(gridLayout);
                    gridLayout.setDisplayName('网格组合');
                    gridLayout.setTag(i.autoTag(gridLayout));
                    //初始化后的回调中添加children，避免无法响应里面的onChildAdded
                    gridLayout._i_onInited = (data, gv, cache) => {
                        gridLayout.s('interactive', true);
                        gridLayout.a('grid.row.count', nodeArr.length <= hCount ? 1 : Math.ceil(nodeArr.length / hCount));
                        gridLayout.a('grid.column.count', nodeArr.length <= hCount ? nodeArr.length : hCount);
                        gridLayout.a('grid.border', 0);
                        //240719，如果列数大于1，那么默认列间距跟行间距一样有！
                        if(gridLayout.a('grid.row.count') > 1) gridLayout.a('node.margin.v',gridLayout.a('node.margin.h'));
                        gridLayout.setParent(nodeArr[0].getParent());
                        nodeArr.forEach(node => {
                            //注意，一定要设置一下setParent(null)父节点为null，然后被上层图元节点addChild添加时，才会触发父节点的onClildAdded
                            node.setParent(null);
                            gridLayout.addChild(node)
                        });
                        if (!runningMode()) { //改成选中新自动创建的grid图元，以支持网格的解组/组合切换
                            sm.cs();
                            sm.as(gridLayout);
                        }
                    }
                    let symbolUrltmp = 'symbols/develop/uiotos/base/grid.json';
                    gridLayout.setImage(symbolUrltmp);
                    i.groupRect(nodeArr, gridLayout);
                }
            },
            //根据注册的图片图标json，获取其对应的字符串url
            getImageUrl: function(imgObj) {
                if (typeof imgObj == 'string') { //230311，同时兼容支持传入图片路径url字符串和注册后的标识字符串！
                    let urlFlagSuppose = imgObj,
                        urlPathSuppose = i._imageFlag2Url[urlFlagSuppose];
                    return urlPathSuppose ? urlPathSuppose : urlFlagSuppose;
                }
                let objtmp = ht.Default.getImageMap();
                for (let key in objtmp) {
                    if (objtmp[key].uuid == imgObj.uuid) return i._imageFlag2Url[key];
                }
            },
            /*230228，用于代替或作为ht.Default.getImage()的补充*/
            getImageObj: function(url) {
                if (isObject(url)) return url;
                return ht.Default.getImageMap()[url];
            },
            //getImageObj用于跟getImageUrl命名对照功能对称。而函数别名getImage与ht.Default.getImage
            getImage: function(url) {
                if (i.isHtNodeData(url)) { //230812，兼容传入图元node对象的情况，暂未测试！
                    let node = url;
                    img = node.getImage();
                    if (typeof(img) == 'string') url = img;
                    else return img; //注意，可能存在symbol才是url字符串，需要通过字符串去获取原始image object的情况，这里直接返回未做考虑！
                }
                return i.getImageObj(url);
            },
            //231220,获取图元组件原始的image对象而并非当下image属性的[object]中保存的！通常需要结合symbol属性！
            getImageRaw: function(data) {
                if (!data.getImage) return undefined;
                let urltmp = getImage();
                if (typeof(data.getImage()) == 'object') {
                    console.assert(i.hasAttrObjectKey(data, 'symbol'));
                    urltmp = data.ca('symbol');
                }
                return i.getImageObj(urltmp);
            },
            //230311，代替ht.Default.setImage，主要是让标识和url能对应上，便于转换查找，不仅仅是找到对象，还要能找到原图片的路径url
            setImage: function(urlFlag, urlPath) {
                console.assert(!!urlPath); //240120，发现存在imageMap中url对应的值为null，啥原因？？这里做一个断言
                if (!urlPath) return; //240120，除了断言，同时return返回，不存放进去避免出现null的情况造成BUG

                ht.Default.setImage(urlFlag, urlPath);
                if (i._imageFlag2Url == undefined) i._imageFlag2Url = { urlFlag, urlPath };
                else i._imageFlag2Url[urlFlag] = urlPath;
            },
            //230303，代码动态传入图标url设置背景等，同时支持传入变量修改配置属性，计划实现getDisplayImage，暂未成功！
            getSymbolImage: function(url, symbolAttrs = {}, nodeData = null) {
                if(!url) return undefined;
                function MyDrawable(url) { //构造函数调用基类需传入this，同时注意实例化时是否有构造参数的传入！
                    MyDrawable.superClass.constructor.call(this, url);
                }
                ht.Default.def(MyDrawable, ht.ui.drawable.ImageDrawable, {
                    draw: function(x, y, width, height, data, view, dom) {
                        let self = this, //成员函数调用基类方法，也需传入this
                            mydata = null;

                        //240505，之前这里是let mydata = new ht.Node()，这必然导致内存持续增加啊！！一直在new对象！！！
                        let objtmp = nodeData ? nodeData : symbolAttrs;
                        if (objtmp._i_drawableNode) mydata = objtmp._i_drawableNode;
                        else mydata = objtmp._i_drawableNode = new ht.Node();

                        mydata.setImage(self.getImage());
                        // mydata.a('icon-background', iconColor);
                        for (let key in symbolAttrs) {
                            if (!nodeData && key == '_i_drawableNode') continue; //240505，过滤掉这个标记，因为只是借用这个对象来存入
                            mydata.a(i.np(key), symbolAttrs[key]);
                        }
                        MyDrawable.superClass.draw.call(self, x, y, width, height, mydata, view, dom);
                    }
                });
                return new MyDrawable(url);
            },
            //230820，删除图元对象，需要进一步测试！
            remove: function(data) {
                if (!data) return;
                data.dm() && data.dm().remove(data);
                data = null;
            },
            removeChildren: function(data) {
                let listtmp = data.getChildren().slice(0);
                listtmp.forEach(child => {
                    data.removeChild(child);
                    data.dm().remove(child);
                    child = null;
                });
            },
            /*tips 230912，多级节点下，不论是这里i.getChildren还是data.getChildren()，都是获得的
            直接下一级节点，而不会包括递归一层层下面的子节点*/
            /*230912，增加参数recurseAll，当为true时，递归全部子节点都放到返回的children里。
            同时，还增加了includeParentNode参数，如果传入false指不包含节点，默认true，返回子项列表也包含子节点。
            简言之，默认情况下返回当前节点下的子节点，如果子节点本身也是父节点，那么包含其本身但是不包含更下级子节点。
            如果传入recurseAll，就可以递归全部子节点！调用示例：
            1）获取多层递归网格里面的实际UI组件：
            i.getChildren(grid3Obj,null,true,false);
            2）获取当前直接下一级非连线的组件，包括有子节点的
            i.getChildren(node,['ht.Edge'],false,false);
            */
            getChildren: function(data, ignored = ['ht.Edge'], recurseAll = false, includeParentNode = true) {
                let result = new ht.List();
                data.eachChild(child => {
                    if (!ignored || ignored.indexOf(child.getClassName()) == -1) { //230912，ignore可以传入null，相当于不过滤类型
                        hasChildren = child.getChildren().size() > 0; //有子节点
                        if (includeParentNode || (!includeParentNode && !hasChildren)) result.add(child);
                        if (recurseAll && hasChildren) {
                            let childList = i.getChildren(child, ignored, recurseAll, includeParentNode);
                            result.addAll(childList.toArray());
                        }
                    }
                });
                return result;
            },
            //240110，遍历所有的子节点，提供回调自定义处理！末尾参数includeSelf为true时，回调也会包括当前初始传入的节点图元！默认不包括！
            eachChildren: function(data, callback, includeSelf = false) {
                includeSelf && data && callback && callback(data);
                data.getChildren().forEach(item => i.eachChildren(item, callback, true));
            },
            onChildAdded: function(data, callback, ignored = ['ht.Edge']) {
                data.onChildAdded = (child, index) => {
                    if (ignored.indexOf(child.getClassName()) == -1) {
                        callback && callback(child, index);
                    }
                }
            },
            onChildRemoved: function(data, callback, ignored = ['ht.Edge']) {
                data.onChildRemoved = (child, index) => {
                    if (ignored.indexOf(child.getClassName()) == -1) {
                        callback && callback(child, index);
                    }
                }
            },
            /*比如[[1,2,3,4,5]]，转换成[1,2,3,4,5]，并且是支持引用返回，不需要通过data.ca()赋值操作导致需要考虑循环递归的问题！！
            通常用于编辑状态下对数组变量批量结构化赋值，避免一个个输入，可以输入到第一个格子，自动转换，当然需求渲染元素对应支持！*/
            arrExpandByFirst: function(arr) {
                if (arr == undefined) return;
                if (isArrayFn(arr) && arr.length == 1) {
                    let firsttmp = arr[0];
                    if (typeof firsttmp == 'string') {
                        try {
                            firsttmp = JSON.parse(firsttmp);
                        } catch (error) {
                            let tmp = firsttmp.split(',');
                            if (tmp.length > 1) firsttmp = tmp;
                            else return arr;
                        }
                    }
                    if (arr.length == 1 && isArrayFn(firsttmp)) {
                        for (let idx = 1; idx < firsttmp.length; idx++) {
                            i.setIndexValue(arr, idx, firsttmp[idx]);
                        }
                        arr[0] = firsttmp[0];
                    }
                }
                return arr;
            },
            /*230830，为了方便编辑器在编辑状态下，对于数组类似属性，方便调整顺序，那么支持将数组长度调整成1，这样数组扩展的多个会合并到第一项!
            用法：在i.md()/dm().md()数组类型属性中，加入这句放在处理的开头即可！其中传入event，这样能获取到event.oldValue、event.newValue
            返回true时，表名此时是已经在合并到第一项，可以结合i.arrExpandByFirst()，避免合并到第一项的又被展开了！示例：
            if (!i.arrCollapseToFirst(data, e)) i.arrExpandByFirst(e.newValue);
            */
            arrCollapseToFirst: function(data, event) {
                if (data._i_arrCollapseToFirstUpdate || runningMode()) {
                    data._i_arrCollapseToFirstUpdate = undefined;
                    return true;
                }
                if (isArrayFn(event.oldValue) && isArrayFn(event.newValue) && event.newValue.length == 1 && event.oldValue.length > 1) {
                    data._i_arrCollapseToFirstUpdate = true;
                    i.update(data, event.property, [event.oldValue]);
                    return true; //231104，此前这里是return false，貌似是bug，这导致嵌套到上层，合并和展开失效！
                } else return false; //231104，此前这里之前没有return，这导致嵌套到上层，合并和展开失效！
            },
            //230830，代替i.arrExpandByFirst()，结合了i.arrCollapseToFirst()
            enableAttrEditByFirstItem: function(data, event) {
                /*240218，因为loadDisplay中末尾，去掉了对symbolImage中的defaultValue组件定义的初始默认值同步到图元实例的attrObject，那么初始在属性栏中改变默认值，获取
                e.oldValue为undefined，而不会获取到渲染元素初始默认值！任何手动设置保存一下到图纸页面图元的attrObject，再变化获取的oldValue就跟显示的旧值是一样而不是undefined了！*/
                if (event.oldValue === undefined && event.newValue.length === 1 && i.isEditing(data)) {
                    _i.alert(`属性值为初始默认，需要修改设置一下（即便值不变），否则会因为获取旧值未配置导致收到第一项配置失败！` + i.commonTip(data, event.property),
                        '警告', false, null, null, [360, 240]);
                }

                //230830，加上条件，这样支持数组长度为1时，编辑状态下合并成第一项方便手动批量调整，同时避免又被展开！
                if (!i.arrCollapseToFirst(data, event)) {
                    let ret = i.arrExpandByFirst(event.newValue);
                    //231104，加上这句，避免上层嵌套的就无法做到合并到第一项后的点击后展开成数组。注意，i.update会导致属性当前层本身，而i.innerNotifyUpper逐层向上操作不包括当前层属性！
                    i.innerNotifyUpper(data, event.property, ret); //1）用这个，对于嵌套上层不会死循环。对于当前层，有引用回写，所以不影响功能！
                    // i.update(data, event.property, ret, event.property); //2）用上i.update则嵌套上层的操作会导致死循环！
                }
            },
            /*230417，对于数组类型的属性，通常在bindControls连线绑定操作中会直接赋值成字符串、对象等*/
            arrAttrValue: function(data, attr, rawTypedValue = false) { //rawValue标识当前是什么值就给什么值，反之要转换成数组类型，匹配当前数组类型的属性
                let typetmp = i.getBindedAttrValueType(data, attr);
                console.assert(typetmp && typetmp.trim().toLocaleLowerCase().indexOf('array') != -1); //断言类型为数组类型，可能是StringArray、ColorArray等
                let valtmp = data.ca(attr);
                if (!isArrayFn(valtmp) && !rawTypedValue) {
                    valtmp = [valtmp];
                    data.ca(attr, valtmp); //引用回写
                }
                return valtmp;
            },
            //231005，末尾参数引用回写referAssign由默认true改成false，避免手动调用时对原始数组造成修改而不自知，导致出现难以排查的BUG！！
            arrExpandToList: function(arr, value = true, indexOffset = 0, referAssign = false, valAutoFilled = 0) {
                let inputArr = arr;
                if (i.isStringNumber(arr)) inputArr = [Number(arr)];
                if (isArrayFn(inputArr)) {
                    let tmp = []
                    inputArr.forEach(item => {
                        i.setArrayIndexValue(tmp, Number(item) + indexOffset, value, valAutoFilled);
                    });
                    if (referAssign) _i.arrOverwrite(inputArr, tmp);
                    else inputArr = tmp;
                }
                return inputArr;
            },
            /*230905，数值列表转数字数组。支持返回和引用两种方式修改数组，从[0,0,1,1,0,1]这种转换成[2,3,5]这种格式*/
            listExpandToArr: function(numList, value = true, indexOffset = 0, referAssign = false) {
                let inputArr = numList;
                if (isArrayFn(inputArr)) {
                    let tmp = []
                    inputArr.forEach((item, idx) => {
                        if (idx < indexOffset) return; //小于偏移的就不处理
                        if (item == value) tmp.push(idx - indexOffset); //从偏移的开始算索引
                    });
                    if (referAssign) _i.arrOverwrite(inputArr, tmp);
                    else inputArr = tmp;
                }
                return inputArr;
            },
            toDecimal: function(x, bit = 2) {
                var f = parseFloat(x);
                if (isNaN(f)) {
                    return false;
                }
                var f = Math.round(x * 10 ^ bit) / 10 ^ bit;
                var s = f.toString();
                var rs = s.indexOf('.');
                if (rs < 0) {
                    rs = s.length;
                    s += '.';
                }
                while (s.length <= rs + 2) {
                    s += '0';
                }
                return s;
            },
            calculation: function(method, value1, value2 = 1, reverseOpation = false) { //加、减、乘、除、自增/自减（第二个参数为幅度）、取整数
                if (
                    (method != 'SUM' && method != 'SUB') ||
                    (   //241022，存在true/false和0、1参与加减运算的情况！
                        (typeof(value1) == 'number' || typeof(value1) == 'boolean') &&
                        (typeof(value2) == 'number' || typeof(value2) == 'boolean')
                    )
                ){
                    value1 = Number(value1);
                    value2 = Number(value2);
                }
                let needValueFields = ['SUM', 'SUB', 'MUL', 'DIV', 'decimal', 'power']; //230813，需要用到_value字段的函数，列到这里，需要A和B参与运行，而不是单纯转换！
                if (reverseOpation && needValueFields.indexOf(method) != -1) {
                    let tmp = value1;
                    value1 = value2;
                    value2 = tmp;
                }
                if (method == 'SUM')
                    return value1 + value2;
                else if (method == 'SUB'){
                    if(typeof(value1) == 'number' && typeof(value2) == 'number'){  //241021，两个都是数字时
                        return value1 - value2;
                    }else{//2410221，其他情况下，字符串1移除里面的字符串2
                        value1 = String(value1);
                        value2 = String(value2);
                        return i.replaceAll(value1, value2, '');
                    }
                }else if (method == 'MUL')
                    return value1 * value2;
                else if (method == 'DIV')
                    return value1 / value2;
                else if (method == 'decimal') //取小数位
                    return value1.toFixed(value2);
                else if (method == 'power')
                    return Math.pow(value1, value2);
                else if (method == 'radians')
                    return reverseOpation ? (180 / Math.PI * value1) : (value1 * Math.PI / 180);
                else if (method == 'sin')
                    return reverseOpation ? Math.asin(value1) : Math.sin(value1);
                else if (method == 'cos')
                    return reverseOpation ? Math.acos(value1) : Math.cos(value1);
                else if (method == 'tan')
                    return reverseOpation ? Math.atan(value1) : Math.tan(value1);
                else if (method == 'cot')
                    return reverseOpation ? Math.acot(value1) : Math.cot(value1);
            },
            /*230305，两个数组合并{key1:['val1','val2'],key2:['val3','val4']}，其中arr1、arr2都是数组[]，现在转换成[{key1:'val1',key2:'val3'},{key1:'val2',key2:'val4'}]（tips231128，注释有误！）
            231128，实际测试，发现引用赋值返回的是数组[]的对象{}形式！因为{}无法引用传参函数内部修改成[]格式，反之亦然！如果想要得到之前期望获得的数组返回，需要再加上i.toTreeJson()即可！！
            {
                "0": {
                    "key1": "val1",
                    "key2": "val3"
                },
                "1": {
                    "key1": "val2",
                    "key2": "val4"
                }
            }
            */
            //230306，注意，该方法会将原数据进行改写！（引用覆盖），增加示例如下：
            /*tips 231128，下面这种格式，请求传入，输入输出示例不变！确实如此！引用、返回都一致！
            输入：
            let raw = {
                'entrance':{
                    'id':[1,2,3,4],
                    'status':[3,1,4,1,5]
                },
                'layer':{
                    'second':{
                        'guard':{
                            'hello':['h','e','l','l','o'],
                            'man':['m','a','n']
                        }
                    },
                    'hello':{
                        'num':[1,2,3],
                        'alphbat' :['h','e','l','l','o']
                    }
                }
            }
            调用：
            console.error(i.mergeArrValByIndex(raw,null,['layer>second>guard','entrance','layer>hello']))
            console.error(i.ify(raw));
            输出：
            {
                "entrance": [
                    {
                        "id": 1,
                        "status": 3
                    },
                    {
                        "id": 2,
                        "status": 1
                    },
                    {
                        "id": 3,
                        "status": 4
                    },
                    {
                        "id": 4,
                        "status": 1
                    },
                    {
                        "id": null,
                        "status": 5
                    }
                ],
                "layer": {
                    "second": {
                        "guard": [
                            {
                                "hello": "h",
                                "man": "m"
                            },
                            {
                                "hello": "e",
                                "man": "a"
                            },
                            {
                                "hello": "l",
                                "man": "n"
                            },
                            {
                                "hello": "l",
                                "man": null
                            },
                            {
                                "hello": "o",
                                "man": null
                            }
                        ]
                    },
                    "hello": [
                        {
                            "num": 1,
                            "alphbat": "h"
                        },
                        {
                            "num": 2,
                            "alphbat": "e"
                        },
                        {
                            "num": 3,
                            "alphbat": "l"
                        },
                        {
                            "num": null,
                            "alphbat": "l"
                        },
                        {
                            "num": null,
                            "alphbat": "o"
                        }
                    ]
                }
            }
            */
            /*231205，by chatgpt，合并数组，测试函数
            var arrays = [[1, 2],[3] [4, 5, 6], [7, 8, 9]];  
            console.log(mergeArrays(arrays)); // 输出: [1, 2, 3, 4, 5, 6, 7, 8, 9]
            */
            //241027，增加参数removeDuplicate，为true时对于重复的，自动移除，比如[[1,3,5],[3,5,6],[7]] → [1,3,5,6,7]，而不是默认重复3,5
            mergeArrays: function(arrays, removeDuplicate = false) {
                // 辅助函数，用于递归地合并数组  
                function mergeHelper(remainingArrays) {
                    if (!remainingArrays.length) {
                        return [];
                    }
                    const firstArray = remainingArrays[0];
                    const remainingArraysAfterFirst = remainingArrays.slice(1);
                    let result = [...firstArray]; // 将第一个数组的元素添加到结果数组中  
                    result = result.concat(mergeHelper(remainingArraysAfterFirst)); // 递归地合并剩余数组  
                    return result;
                }
                let ret = mergeHelper(arrays),
                    out = [];
                if(removeDuplicate){
                    ret.forEach(item=>{
                        if(out.indexOf(item) == -1) out.push(item);
                    });
                }else out = ret;
                return out;
            },
            mergeArrValByIndex: function(arrParentObj, emptyAutoFill = null, childObjKeys = []) {
                //231128，加上条件|| isArrayFn(arrParentObj)，当现在就剩下数组时，不处理！
                if (arrParentObj == null || isArrayFn(arrParentObj)) return;

                function __arrMeregByIndex(arrs, keys) {
                    let indexOfmaxLenArr = 0,
                        result = [],
                        lentmp = 0;

                    //tips 240225，这里有三处forEach，是否有性能问题？？？有待分析排查！

                    arrs.forEach((arr, idx) => {
                        if (arr.length > lentmp) {
                            lentmp = arr.length;
                            indexOfmaxLenArr = idx;
                        }
                    });
                    let longgestArr = arrs[indexOfmaxLenArr];
                    longgestArr.forEach((item, index) => {
                        let tmp = {};
                        arrs.forEach((arr, idx) => {
                            tmp[keys[idx]] = arr[index] ? arr[index] : emptyAutoFill;
                        });
                        result.push(tmp);
                    });
                    return result;
                }
                //递归多个处理
                if (childObjKeys == null || childObjKeys.length === 0) { //单个直接对象直接操作
                    let keys = i.keys(arrParentObj),
                        vals = i.values(arrParentObj),
                        idx = []; //存放满足val为数组[]的索引，兼容传入key-value中value有非数组的情况，直接过滤掉！
                    vals.forEach((value, index) => {
                        if (isArrayFn(value)) idx.push(index);
                        else console.warn('arrMeregByIndex: none-array type item', keys[index], '-', value, 'will be ignored!');
                    });
                    let keysTobeParam = [],
                        valTobeParam = [];
                    idx.forEach(idxVal => {
                        keysTobeParam.push(keys[idxVal]);
                        valTobeParam.push(vals[idxVal]);
                    });
                    let out = __arrMeregByIndex(valTobeParam, keysTobeParam);
                    i.overWrite(arrParentObj, out); //2311
                } else {
                    if (typeof childObjKeys == 'string') childObjKeys = [childObjKeys];
                    console.assert(isArrayFn(childObjKeys));
                    childObjKeys.forEach(childKey => {
                        let valtmp = i.flatValue(arrParentObj, childKey, '>', true); //先后两次循环，arrParentObj先后是两个不同的对象！
                        i.mergeArrValByIndex(valtmp, emptyAutoFill, null); //循环中的valtmp是引用，通过mergeArrValByIndex的修改，就自动修改了arrParentObj
                    });
                    let valueObjIndexToArr = convertToTreeJson(arrParentObj, '>', true);
                    i.overWrite(arrParentObj, valueObjIndexToArr);
                }
                return arrParentObj;
            },
            //231130，mergeArrValByIndex的反转换，注意，输入直接是被操作的数组，且不引用传参返回，通过return返回，这是与mergeArrValByIndex不同之处！示例：
            /*输入：
            [
              {
                "month": "1",
                "value": "0.00"
              },
              {
                "month": "2",
                "value": "0.00"
              },
              {
                "month": "3",
                "value": "0.00"
              },{
                "value":'2222'  
              },
              {
                "month": "4",
                "value": "0.00"
              },
              {
                "month": "5",
                "value": "0.00"
              },{
                'month':"hahah",
                "extra":888
              },
              {
                "month": "7",
                "value": "4327890.00"
              }
            ]
            输出：
            extra: (8) [null, null, null, null, null, null, 888, null]
            month: (8) ['1', '2', '3', null, '4', '5', 'hahah', '7']
            value: (8) ['0.00', '0.00', '0.00', '2222', '0.00', '0.00', null, '4327890.00']
            */
            mergeObjValByIndexFromArr: function(arr, emptyAutoFill = null) {
                let targetObject = {},
                    keysAll = i.arrFieldsAll(arr); //所有字段的并集
                i.copy(arr).forEach((itemObject, index) => {
                    keysAll.forEach(key => {
                        if (targetObject[key] === undefined) targetObject[key] = [];
                        let curVal = itemObject[key];
                        targetObject[key].push(curVal === undefined ? emptyAutoFill : curVal);
                    });
                });
                return targetObject;
            },
            //231130，对象→对象：用于将对象内多个键和数组值按索引对应交叉，{a:[x1,x2],b:[y1,y2]}转为{a.b.0:[x1,y1], a.b.1:[x2,y2]}，主要用于堆叠图那种属性填充结构
            mergeToObjByIndex: function(obj, emptyAutoFill = null, keysIndexFlag = '.', keysFieldFlag = '_') {
                let targetObject = {},
                    arrMaxLen = i.arrsMaxLen(i.values(obj)),
                    keystmp = i.keys(obj),
                    keysName = i.keys(obj).join(keysFieldFlag);
                for (let idx = 0; idx < arrMaxLen; idx++) { //垂直遍历各个字段（长度为所有字段数组值中最长的）
                    let valArrs = [];
                    keystmp.forEach((key, index) => { //水平遍历各个字段（长度为原先字段的数量）
                        let valtmp = obj[key][idx];
                        valArrs.push(valtmp === undefined ? emptyAutoFill : valtmp);
                    });
                    targetObject[keysName + keysIndexFlag + idx] = valArrs;
                }
                return targetObject;
            },
            /*判断字符串strSource中是否包含字符串strSegment（非纯空格字符串）*/
            stringInclude: function(strSouce, strSegment, caseSensitive = false) { //默认不区分大消息（大小写不敏感）
                if (strSouce == undefined || strSegment == undefined || strSegment.trim() === '') return false;
                if (!caseSensitive) { //默认大小写不敏感不区分时，都转换成小写来判断
                    strSouce = strSouce.toLowerCase();
                    strSegment = strSegment.toLowerCase();
                }
                if (strSegment.slice(-1) === ' ') { //如果字符串片段末尾有空格，那么需要判断字符串去掉头尾空格后的内容，需要刚好是原字符串的末尾才行！
                    let trimed = strSegment.trim();
                    if (strSouce.length < trimed.length) return false;
                    return strSouce.slice(-trimed.length) == trimed;
                } else return strSouce.indexOf(strSegment) != -1;
            },
            getHtmlPlainText: function(html_str) {
                //提取字符串中的文字
                let re = new RegExp('<[^<>]+>', 'g')
                let text = html_str.replace(re, '');
                //或
                //var text = html_str.replace(/<[^<>]+>/g, "");
                return text
            },
            //231108，判断是否是包含了html尖角符号描述的文本
            isHtmlTypedText: function(text) {
                return i.getHtmlPlainText(text) !== text;
            },
            /*231202，传入html的div，修改当前级的style中某个css项，返回新的html字符串，示例如：
            输入：'<p style="color: rgb(242, 83, 75);margin-bottom: 5px;">已被布局，不允许拖动</p>'
            调用：i.getHTMLTextChangeStyle('<p style="color: rgb(242, 83, 75);margin-bottom: 5px;">已被布局，不允许拖动</p>','margin-bottom','232px');
            输出：'<p style="color: rgb(242, 83, 75);margin-bottom: 232px;">已被布局，不允许拖动</p>'
            */
            getHTMLTextChangeStyle: function(htmlText, styleField, styleValue) {
                let domObj = $(htmlText).css(styleField, styleValue);
                return domObj.prop("outerHTML");
            },
            //231104，文字加上<span style></span>做颜色、加粗等
            colored: function(text, color = 'rgb(106,138,54)', bold = true) {
                return `<span style="${color ? ('color:' + color) : ''};${bold ? 'font-weight:bold' : ''}">${text}</span>`;
            },
            //240119，配合colored，通常给i.alert()用
            toHtmlFont: function(content, font = 'font-size:12px;line-height:1.5em;letter-spacing:0px') {
                return `<p style=${font}>${_i.replaceAll(content,'\n','<br>')}</p>`;
            },
            //231117，主要用于生成像属性注释风格的html文本段，可以用于标记器中的toolTip
            toHTMLDescription: function(text, style = null) {
                return `
            <div style=${style ? style : "list-style-type:disc;color:rgba(0,199,7,1);line-height:1.75em;letter-spacing:1px"}>
            ${text && text.indexOf('<br>') == -1 ? _i.stringToMultiLines(text,50) : text}
            </div>
            `;
            },
            //config.js中自定义的类型，有值和显示两部分，这里通过值获取显示！
            //231127，classify可以传入'description'，获取工具函数的tooltip注释描述
            getValueTypeName: function(type, value, classify = 'i18nLabels') {
                let configTypes = window.valueTypes,
                    indextmp = configTypes && configTypes[type].values.indexOf(value);
                return configTypes && configTypes[type][classify][indextmp];
            },
            /*230314，非负整数
            alert(i.isNNInt(0))     //true
            alert(i.isNNInt(-1))    //false
            alert(i.isNNInt(1.1))   //false，正数但是非正数，也是false
            alert(i.isNNInt(2))     //true
            */
            isNNInt: function(num) {
                var reg = /^[0-9]+?$/;
                //如果正则需要判断非负整数并带2位小数点，请使用   var reg = /^(([1-9]+)|([0-9]+\.[0-9]{1,2}))$/;
                return reg.test(num);
            },
            /*230315，通常用于渲染元素代码中，某个属性变化，要操作一个或多个其他属性刷新，原本适合放到case: xxx形式放到
            对应属性前面，不加break即可，但是多个不同的其他属性，并非在同一个case而是多个独立的case中时，可以通过这句来
            简化操作*/
            fpAttrs: function(data, attrs) {
                if (!isArrayFn(attrs)) attrs = [attrs];
                attrs.forEach(attr => {
                    data.fp(i.autoPrefixed(attr), null, i.getValue(data, attr));
                });
            },
            //230318，将字符串str中所有的s1，替换成s2
            replaceAll: function(str, s1, s2) {
                if (!s1) return str;
                if (s1 == '.') s1 = '\\' + s1; //230402，对于特殊字符替换，得加上转义\，除了'.'替换外，其他的也类似这样加！否则会出现整个字符串都被替换成s2类似这种情况！
                return str.replace(new RegExp(s1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), s2);
            },
            //230808，js正则表达式，全部替换出现a的为ab，但是对于已经是ab的不作处理，避免出现aab，以支持重入。支持传入原始值和要被替换的值，比如'\n'与'\n<br>'
            /*使用示例：
                var str = 'This is a test sentence. It contains ab, but not aab or ac.';
                i.replaceAll2(str,'a', 'ab');
                'This is ab test sentence. It contabins ab, but not abab or abc.'
            */
            //为了实现将'a'替换成'ab'，支持传入'a'、'b'，或者a、'ab'。比如'\n'全部替换成'\r<br>'，在toolTip的编辑保存和鼠标放入上面显示，都能正常换行！
            replaceAll2: function(str, a, b) {
                if (str === undefined) return undefined;
                if (b.indexOf(a) == 0) b = b.split(a).slice(1).join(''); //支持传入b或者ab
                var regex = new RegExp("(?<!" + a + ")" + a + "(?!" + b + ")", "g");
                return str.replace(regex, a + b);
            },
            //230325，统计dataModel，只算末端children，不算父节点、根节点！！
            countChildren: function(dm) {
                let count = 0;
                dm.each(d => {
                    if (d.hasChildren()) return;
                    count += 1;
                })
                return count;
            },
            //230326，给渲染元素的case属性变化判断空值用，主要是过滤掉window对象，以及[__upper:()=>parent]等情况，比如给userData默认值为图元对象data，前提是该判断成立！
            isNewValueEmpty: function(value) {
                return (!i.isHtNodeData(value) && !i.isWindow(value)) && (value == undefined || (isArrayFn(value) && i.pureLength(value) == 0));
            },
            //230329，通常用于渲染元素的md属性响应传入对应的e.oldValue，有的时候是初始、null都要进行处理，此前初始就是null，既然做了区分，现在专门提供一个方法，一句就好！
            isInitOrNull: function(value) {
                return value == '__init__' || value == null;
            },
            //230330，清除bindControls连线操作的全部配置，主要用于图元复制，不复制对外连线操作配置！
            clearBindControls: function(data) {
                if (data.ca) {
                    data.ca('bindControlsTag', []);
                    data.ca('bindControlsAttr', []);
                    data.ca('bindControlsVal', []);
                    data.ca('paramControlTag', []);
                    data.ca('paramControlAttr', []);
                    data.ca('paramBindEvent', []); //230804，多事件指定连线触发  //tips231130，貌似这里paramBindEvent参数没用，目前用的是_bindEvents_x
                    data.ca('paramsGenerator', hteditor.stringifyFunction(paramsGenerator));
                } else if (data.a) {
                    data.a['bindControlsTag'] = [];
                    data.a['bindControlsAttr'] = [];
                    data.a['bindControlsVal'] = [];
                    data.a['paramControlTag'] = [];
                    data.a['paramControlAttr'] = [];
                    data.a['paramBindEvent'] = []; //230804，多事件指定连线触发  //tips231130，貌似这里paramBindEvent参数没用，目前用的是_bindEvents_x
                    data.a['paramsGenerator'] = hteditor.stringifyFunction(paramsGenerator);
                } else {
                    console.error('clearBindControls error!', data);
                }
            },
            //240112，初始化编辑器的左侧菜单，主要是做双击展开、双击合并收起，以及拖放启用、禁用等。
            initEditorExplore: function() {
                /*240105，编辑状态下，左上菜单页面图纸目录列表树、左下页面目录及图纸列表，默认不可拖动，双击后则可以拖放移动位置，避免误操作！
                注意，双击后树表要放开，然后点击拖动而不是双击按下立即拖动！*/
                if (!runningMode()) {
                    if (!editor.displays.tree._i_handleDragAndDrop) {
                        editor.displays.tree._i_handleDragAndDrop = editor.displays.tree.handleDragAndDrop;
                        editor.displays.tree.handleDragAndDrop = function(event, state) {};
                        editor.displays.tree.onDataDoubleClicked = (data, e) => {
                            //241011，判断当前节点下是否有更下级的目录节点，不能用data.getChildren().size() != 0，因为目录下的文件，在这里也是子节点！
                            let hasChildFolder = false;
                            i.eachChildren(data, child => {
                                if (hasChildFolder) return;
                                if (child.fileType == 'dir') hasChildFolder = true;
                            });
                            //240110，通过i.eachChildren，来自行实现collapseAll(data)！原本没有这个方法，只会整体合并，不会像expandAll(data)这种指定节点下全部展开！
                            if (!editor.displays.tree.isExpanded(data) && hasChildFolder) {
                                editor.displays.tree.expandAll(data);
                            } else {
                                //指定节点下全部收起！
                                i.eachChildren(data, child => {
                                    editor.displays.tree.collapse(child);
                                }, true);

                                //240110，只有当前节点目录是合并状态下，才能双击进行拖动，节点收起模式下，双击仅仅只做展开！
                                i.showMessage((hasChildFolder ? '目录收起，并' : '') + '开启节点拖拽...');
                                editor.displays.tree.handleDragAndDrop = function(event, state) {
                                    editor.displays.tree._i_handleDragAndDrop(event, state);
                                    if (state == 'end') {
                                        _i.setTimeout(() => {
                                            editor.displays.tree.handleDragAndDrop = function(event, state) {}
                                        }, 0);
                                    }
                                }
                            }
                        }

                        editor.displays.list._i_handleDragAndDrop = editor.displays.list.handleDragAndDrop;
                        editor.displays.list.handleDragAndDrop = function(event, state) {};
                        editor.displays.list.onDataDoubleClicked = (data, e) => {
                            // i.showMessage('开启目录文件拖拽...')     //240108，屏蔽掉，因为双击文件通常是打开，避免提示误导，干脆不提示！
                            editor.displays.list.handleDragAndDrop = function(event, state) {
                                editor.displays.list._i_handleDragAndDrop(event, state);
                                if (state == 'end') {
                                    _i.setTimeout(() => {
                                        editor.displays.list.handleDragAndDrop = function(event, state) {}
                                    }, 0);
                                }
                            }
                        }
                    }
                }
            },
            //231228，编辑或运行时加载页面完成时，都会进入，可以做初始化！
            commonInitDisplay: function(dm, url = null) {
                //240709，dmtmp改成兼容gvtmp，让编辑加载跟运行加载一样，所有组件带上其gv信息！方便轨迹等功能！（这里面是备用！）
                let gv = null;
                if (dm.dm) {
                    console.assert(dm.getClassName() == 'ht.graph.GraphView');
                    gv = dm;
                    dm = gv.dm();
                }
                if (dm.a('_pageCompress') || dm.a('_i_isCompressed')) {
                    dm.a('_i_isCompressed', undefined);
                    //231220，压缩页面json文件，对于默认的配置，保存时直接剔除掉，加载时按照默认值约定的恢复即可！
                    i.isTopDataModel(dm) && dm.eachByBreadthFirst(data => {
                        if (data.getDataBindings()) {
                            let funcDefaults = [
                                'function formParser(rawData, node) {\r\n    try {\r\n        /********* TODO **********/\r\n\r\n\r\n\r\n        /************************/\r\n        return rawData;\r\n    } catch (err) {\r\n        console.error(err);\r\n        return rawData;\r\n    }\r\n}',
                                "function formParser(rawData, node) {\r\n    try {\r\n        /********* TODO **********/\r\n\r\n\r\n        /************************/\r\n        return rawData;\r\n    } catch (err) {\r\n        return rawData;\r\n    }\r\n}"
                            ];
                            //还原简化的数据绑定的配置json
                            function __simplifyDatabindings(attrType) {
                                let dataBindingItem = data.getDataBindings()[attrType];
                                for (let attrtmp in dataBindingItem) {
                                    let dataDbObjTmp = dataBindingItem[attrtmp];
                                    //231228，在config.js的displayViewSaving中，对当前编辑打开的顶层页面保存时简化掉的form绑定配置，还原成内部格式！
                                    if (dataDbObjTmp.idinfo == undefined) dataDbObjTmp.idinfo = '';
                                    if (dataDbObjTmp.isTplBinded == undefined) dataDbObjTmp.isTplBinded = false;
                                    if (dataDbObjTmp.func == undefined) dataDbObjTmp.func = funcDefaults[0]; //"function formParser(rawData, node) {\r\n    try {\r\n        /********* TODO **********/\r\n\r\n\r\n        /************************/\r\n        return rawData;\r\n    } catch (err) {\r\n        return rawData;\r\n    }\r\n}";
                                    if (dataDbObjTmp.alias == undefined) dataDbObjTmp.alias = '';
                                    if (dataDbObjTmp.id == 1) dataDbObjTmp.id = 'iotos.form';
                                    else if (dataDbObjTmp.id == 2) dataDbObjTmp.id = 'iotos.formReset';
                                    else if (dataDbObjTmp.id == 3) dataDbObjTmp.id = 'iotos.formValue';
                                }
                            }
                            __simplifyDatabindings('a');
                            __simplifyDatabindings('s');
                            __simplifyDatabindings('p');
                        }
                    });
                }
            },
            //240108，通常用于给_i.alert()报错弹窗提示用！组件基础信息  
            commonTip: function(data, attr = null) {
                let attrInfo = attr ? `发生属性：${attr}\n` : '';
                return `\n发生组件：${data.getDisplayName()}\n${attrInfo}页面地址：${data.dm() && data.dm()._url}`;
            },
            //240111，方便浏览器调试打印输出当前的图元对象信息！
            tip: function(data) {
                console.error({
                    tag: data.getDisplayName(),
                    url: data.dm()._url,
                    upper: i.upperData(data)
                })
            },
            //230419，系统配置写入，保存到“系统配置”应用中-系统字典页面图纸中
            initConfigure: function(username = null, callback = null) {
                //230419，初始自动加载注册系统字典图纸，用于系统配置文件用途！首先在图纸收藏中用到！
                if (i.window()._i_systemDictDm) i.window()._i_systemDictDm = null;
                let dictFlag = 'display.systemDict',
                    //注意，这里将路径的develop账号信息，改成动态获取当前登录用户，这样配置就支持多用户隔离了！！每个账号可以配置完全不同！
                    dictURL = 'displays/' + (username ? username : /*i.window()._i_user*/ i.user()) + '/uiotos/aiotos/apps/系统配置/系统字典.json';

                //有则先删除，让重新初始化时，前面修改了，也能更新内存数据
                ht.Default.setImage(dictFlag, null);

                i.setImage(dictFlag, dictURL);
                i.onImageLoaded(dictURL, img => {
                    if(img){
                    let dictDisplayDm = new ht.DataModel();
                    dictDisplayDm._url = dictURL; //需要存放，用于i.upload保存
                    img && dictDisplayDm.deserialize(img);
                    i.window()._i_systemDictDm = dictDisplayDm; //存放全局配置。注意，有多个iframe嵌套时，会有重复加载覆盖的情况！暂不做特殊处理！
                    }
                    callback && callback(img); //初始化加载完毕后回调返回
                });
                ht.Default.getImage(dictURL);
            },
            //存放key-value，可选的分组group
            setConfigDict: function(key, value, group = null, callback = null) {
                //230419，获取系统配置图纸对象，限定系统配置系统字段配置文件中树表的tag固定为dictTable
                let dictDm = i.window()._i_systemDictDm,
                    dictTable = dictDm && dictDm.getDataByTag('dictTable'),
                    dictDatas = dictTable.ca('datas');
                let datasNewTmp = dictDatas;
                if (dictDatas == undefined) {
                    datasNewTmp = dictDatas = [];
                    dictTable.ca('datas', dictDatas);
                }
                if (dictDatas.length == 0 && group) {
                    i.overWrite(datasNewTmp, [{ //不能直接datasNewTmp = [{}]，因为这样引用已经改变了
                        "rowData": [group],
                        "children": []
                    }]);
                }
                //先查找，若找到，那么当成修改。通过引用赋值实现修改，并更新时间
                let itemFound = i.getConfigDict(key, group, true),
                    curTime = i.ts2tm(null, 'yyyy-MM-dd hh:mm:ss');
                if (itemFound) {
                    if (value != null) i.overWrite(itemFound, [key, value, curTime]); //itemFount对象为{rowData:[],children:[]}这种
                    // else;
                } else { //如果没有找到，那么当成新增，首先查有没group，有就在group内新增，没有就新增根节点
                    itemFound = datasNewTmp.find(object => object.rowData && object.rowData[0] === group),
                        // newRowTmp = [key, value, curTime]; //支持格式1
                        newRowTmp = {
                            rowData: [key, value, curTime], //支持格式2
                            children: []
                        };
                    if (itemFound) { //如果有父节点，那么就在子节点添加
                        itemFound.children.push(newRowTmp);
                    } else { //如果没有父节点，那么就直接追加
                        dictDatas.push(newRowTmp);
                        data.ca('rowsIdReset', true);
                    }
                    dictTable.ca('datas', dictDatas);
                }
                i.upload(dictDm, () => {
                    callback && callback();
                    //任何图纸的保存，都统一在i.upload()内的成功回调中做了刷新配置。其实有多余，只要系统配置页这样就好！但是系统配置页也有多次触发保存，那就统一在这里都处理吧！
                    // i.initConfigure();
                }, true);
            },
            //根据key获取value，其中可以带入group来限定在哪个节点组内的key，以支持不同组内的key可以重复。如果key为null，则返回完整根对象！
            getConfigDict: function(key, group = null, retRowDataItem = false) {
                //230419，获取系统配置图纸对象，限定系统配置系统字段配置文件中树表的tag固定为dictTable
                let dictDm = i.window()._i_systemDictDm,
                    dictTable = dictDm && dictDm.getDataByTag('dictTable'),
                    dictDatas = dictTable && dictTable.ca('datas'),
                    targetRows = dictDatas; //从哪个节点开始查找，主要是用来区分不同group下相同key，有重复的情况，默认是当前一级节点
                if (key == null) return dictDatas; //传入key为null时，返回完整dict根对象！
                if (dictDatas == undefined || dictDatas.length == 0) {
                    // console.error('dictTable not exist!', dictTable, dictDm);
                    return null;
                }
                if (group) {
                    let rtmp = dictDatas.find(object => object.rowData && object.rowData[0] === group);
                    targetRows = rtmp && rtmp.children;
                }
                if (targetRows == undefined) return undefined;
                let itemFound = targetRows.find(object =>
                    (object.rowData && object.rowData[0] === key) || //[{rowData:[],children:[]}]格式
                    (isArrayFn(object) && object[0] == key) //或者[[],[]]格式
                );
                if (itemFound == undefined) return undefined; //如果擦不到，那么久返回undefined
                let rowItem = itemFound;
                //对树表兼容[{}]和[[]]两种行对象的格式：
                if (!isArrayFn(itemFound) && isArrayFn(itemFound.rowData)) rowItem = itemFound.rowData;
                return retRowDataItem ? itemFound : rowItem && rowItem[1];
            },
            //删除某个key配置：i.removeDictKey('help','页面收藏')
            removeDictKey: function(key, group = null, callback = null) {
                let wholeDict = i.getConfigDict(),
                    childDict = i.getConfigDict(key, group, true);
                i.removeChildObject(wholeDict, childDict);
                i.upload(i.window()._i_systemDictDm, () => {
                    callback && callback();
                    i.showMessage('删除key成功：' + key, 'success');
                });
            },
            //230627，判断当前图元的某个暴露过来的属性keyURL对应的底层组件，是否是指定类型，比如'func'、'grid'等
            isOriginType: function(data, keyURL, typeName) {
                return i.typeMatched(i.bottomData(data, keyURL), typeName);
            },
            //231208，判断为类型无关的空
            isEmpty: function(target) {
                return (
                    i.isEqual(target, 0) ||
                    i.isEqual(target, null) ||
                    i.isEqual(target, undefined) ||
                    i.isEqual(target, []) ||
                    i.isEqual(target, {}) ||
                    i.isEqual(target, false) //240801，也要加上false吧貌似！
                );
            },
            /*230629，判断任意js对象的json内容是否相等，可以是json对象或者数组，比较内容值，注意并非比较引用！
            let a = {'key':124},
                b = {'key':124}
            isEqualObject(a,b)  //true
            let a = ['key',1243],
                b = [1243,'key'] 
            isEqualObject(a,b)  //false
            let a = {"key":1234},
                b = {'key':1234}
            i.isEqual(a,b)      //true
            */
            isEqual: function(target1, target2, commonEmpty = false) { //231208，传入typeIgnored为true时，0、null、{}、[]、undefined都相等！！
                if(commonEmpty){
                    if (i.isEmpty(target1) && i.isEmpty(target2)) {
                        return true;
                    }else{
                        if(typeof(target1) == 'string' && typeof(target2) == 'string'){ //240803，如果是字符串，那么忽略收尾所有空格，忽略大小写，来比较，最宽松模式！lowest
                            return target1.trim().toLowerCase() == target2.trim().toLowerCase();
                        }else if(target1 == target2){ //240801，默认认为传入commonEmpty时，时宽松比较，因此1和true，应该也是相等！！
                            return true;
                        }
                    }
                }

                if (target1 != target2 && i.hasLoopCycle(target2, true)) {
                    console.warn('target2', target2, 'has loop cycle,and will not be compared with target1', target1);
                    return false; //如果有循环引用，且两个对象原始并非相同引用对象，那么直接当false不相等处理！
                }
                return looseEqual(target1, target2);
            },
            /*230420，根据json js对象的子对象，获取其父对象。在删除子对象时非常有用，因为通过父对象指向值对象的情况进行delete，就自动删除了
            而直接对当前对象delete，是不会影响原对象结构的！距离如下：
            let a = {b:3,e:{f:4}}
            delete a
            console.log(a)，输出还是前面的结构不动！而将delete ，改成delete a.e.f，则正常删除了f:4，结果输出为：
            {b: 3, e: {}}。注意，如果不是直接delete a.e.f，而是用了中间遍历let x = a.e.f，再次进行delete x，则并不会影响原始对象！
            此外注意delete删除数组的元素，会让相应索引位置留下empty空位，长度不变！删除对象则不会。完整使用示例：
            输入：
            let a = {
                b:3,
                e:{
                    f:[
                        [3,4,5,6,7],
                        1234
                    ]
                }
            }
            x = a.e.f[0];   //[3, 4, 5, 6, 7]，delete x，起不到从对象a中移除这个子对象的目的！
            i.parentObject(a,x,true)    //只需要传入原始对象a，和内嵌对象应用x，a到x中间的任意复杂结构.xx.xx.xx都不用管！
            console.log(a)
            输出：
            {
                b:3,
                e:{
                    f:[     
                        1234    //成功移除了内部子对象！
                    ]
                }
            }
            */
            parentObject: function(rootObject, targetObj, removeTarget = false) {
                for (const key in rootObject) {
                    if (rootObject[key] === targetObj) {
                        if (removeTarget) {
                            delete rootObject[key];
                            i.arrEmptyRemoved(rootObject); //如果是数组，delete数组后，会留下empty
                        }
                        return rootObject;
                    } else if (typeof rootObject[key] === 'object') {
                        const parent = i.parentObject(rootObject[key], targetObj, removeTarget);
                        if (parent) {
                            return parent;
                        }
                    }
                }
                return null;
            },
            /*等同于i.parentObject()，不过从函数命名和返回，专门针对移除子对象来，避免通过函数名，难以断定i.parentObject有移除子对象的功能*/
            removeChildObject: function(parentObject, childObject) {
                return i.parentObject(parentObject, childObject, true) == null;
            },
            //230524，统一window._i_user和i.window()._i_user，因为有的时候后者为undefined，尤其是单页调试时
            user: function() {
                //240418，默认从admin改成develop，避免预览运行和分享运行不一致！分享运行时，本地缓存的username都为空的，默认用admin后，路径会被替换成admin线下的版本的页面！
                return i.window()._i_user ? i.window()._i_user : window._i_user ? window._i_user : (window.sessionStorage && i.getItemWithExpiration('_i_user')) ? i.getItemWithExpiration('_i_user') : 'develop';
            },
            /*230526，在当前dm中，监控指定图元对象的指定属性值的变化（一个或多个），通过日志打印出来，并且通过回调把最新值返回。主要是用来解决
            某个属性值在不知什么情况下被改变，且难以捕捉变化的时机的问题，这里通过打印，随后可以结合浏览器debug堆栈调试，进一步分析属性变化的原因*/
            watching: function(dm, tag, attrs, callback = null) {
                let nodetmp = d(dm, tag);
                let attrList = isArrayFn(attrs) ? attrs : [attrs];
                dm.md(e => {
                    if (e.data == nodetmp) {
                        attrList.forEach(attr => {
                            if (i.autoPrefixed(attr) == e.property) {
                                console.error(`WATCHING...\r\n tag: ${tag}\r\n property ${attr}\r\n oldValue:`, e.oldValue, `\r\n newValue:`, e.newValue, `\r\n time: ${i.ts2tm()}`);
                                // console.error('WATCHING:','oldValue:',e.oldValue,'newValue:',e.newValue); //有的值可能是对象，所以再单独打印一份，方便对象类型的在浏览器展开！
                                callback && callback(tag, attr, e.oldValue, e.newValue);
                            }
                        })
                    }
                })
            },
            //有图元对象时，简化传参，合并watching中的dm和tag参数为data
            watchData: function(data, attrs, callback = null) {
                i.watching(data.dm(), data.getTag(), attrs, callback);
            },
            /*240521，by gpt，监听element是否被追加到！*/
            watchDomAppended: function(callback, elementBeWatched = null) {
                // 回调函数，将在元素被添加到DOM后执行
                // 选择需要观察的根节点，通常是body或者其他你认为合适的父节点
                const targetNode = document.body;
                // 配置观察器选项
                const config = { childList: true, subtree: true };
                // 创建一个观察器实例
                const observer = new MutationObserver((mutationsList, observer) => {
                    for (const mutation of mutationsList) {
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === Node.ELEMENT_NODE && /*node.matches('.your-element-selector')*/ (!elementBeWatched || (node === elementBeWatched))) {
                                    console.log('Element has been added to the DOM');
                                    callback(node); // 执行回调，传入新添加的元素
                                    observer.disconnect(); // 停止观察，避免重复触发
                                }
                            });
                        }
                    }
                });
                // 开始观察目标节点
                observer.observe(targetNode, config);
            },
            //230602，图元的data.getDisplayName()统一换成i.getName()，这样默认是data.getName()，在config.js工具栏中有设置显示和名称区分开，便于组成url的tag和编辑器右下角组件类型直观名称区分。
            getName: function(data) {
                if (data.getClassName() == 'ht.Text') return 'Text';
                else return data.getName ? (data.getName() != undefined ? data.getName() : data.getDisplayName()) : undefined;
            },
            /*230602，为了兼容旧版对特定组件类型的识别，直接 == 这种不可取，直接.indexOf() != -1也不可取，组件类型都是简称，一旦某个类型名称的字符包含了另一个的字符，必然导致隐藏难以排查的BUG！！
            因此，判断组件是某种类型，封装提供专门的方法来做比对！同时要兼容之前旧的，有tag、有displayName，但是没有name，并且displayName里面通常包含了tag，非纯粹的类型字符串！*/
            typeMatched: function(data, controlType) { //传入指定的图元，以及要判断的类型简称字符串，比如(gvobj,'gv')
                let name = data.getName(), //名称
                    tag = data.getTag(), //标签
                    displayName = data.getDisplayName(), //显示
                    compatibleName = controlType + '（' + tag + '）'; //兼容显示
                //1）name存在且与type完全相等，这当然是匹配的
                if (name) {
                    if (name === controlType) return true; //新版情况，正宗的判断方式。            
                } else if (displayName === compatibleName) return true; //兼容旧版没有设置setName，有displayName显示名称和tag标签，并且displayName显示名称格式固定为：name（tag），注意，中文全角括号！
                return false;
            },
            //230618，判断字符串是否是颜色类型，包括rgba()/rgb/#xxx/blue等多种字符串形式。
            isColorStr: function(str) {
                let ret = NaN;
                try {
                    ret = colorAutoOpacity(str);
                } catch (e) {}
                return ret !== NaN && ret >= 0 && ret <= 1;
            },
            //230713，获取随即数字数组，默认数组长度为10
            randomNumArray: function(size = 10, min = 0, max = 100) {
                let arrtmp = [];
                for (let idx = 0; idx < size; idx++) {
                    arrtmp.push(randomNum(min, max));
                }
                return arrtmp;
            },
            //230728，判断颜色相等，各自任意的颜色格式
            isColorEqual: function(color1, color2) {
                //传入的任何一个有undefined或""，且两者不相等，那么返回false，避免后面传入color相关函数报错！
                if ((!color1 || !color2) && color1 !== color2) return false;
                let c1 = colorAutoToRGBA(color1),
                    c2 = colorAutoToRGBA(color2);
                for (let idx = 0; idx < 4; idx += 1) {
                    //rgba中任何一个参数不相等，就返回false
                    if (rgbaNum(c1, idx) != rgbaNum(c2, idx)) return false;
                }
                return true;
            },
            /*230801，存在情况一：若提供非null的输入值valueInput，则经过db.func函数过滤后赋值给data的attr属性，且return返回；
             情况二：若不提供输入值，那么表名是要将当前属性值经过db.func函数过滤计算，由return输出返回（不回写设置属性）
             注意，对于情况二，虽然函数attrValueFiltered内只做计算新值，不回写，但是如果通过i.formEventBubblingUpper()把计算
             的值对外连线操作时，此时'output': i.attrValueFiltered(data, 'output')结合参数selfInclude为true，就会形成重写！
            i.formEventBubblingUpper(data, gv, cache, 'onEvent', {
                'output': i.attrValueFiltered(data, 'output')
            }, true, true)*/
            attrValueFiltered: function(data, attr, valueInput = null) {
                let attrFull = i.autoPrefixed(attr, data),
                    attrType = attrFull.slice(0, 1),
                    attrName = attrFull.slice(2),
                    bindings = data.getDataBindings() && data.getDataBindings()[attrType],
                    hasFilterFunc = false,
                    valuetmp = null;
                if (bindings && bindings[attrName]) {
                    let db = bindings[attrName];
                    if (i.isFormVarBind(db.id)) {
                        if (db.func) { //函数字符串转成js函数：
                            hasFilterFunc = true;
                            let func = new Function('return ' + db.func)();
                            if (valueInput === null || valueInput === undefined) { //默认不传入inputValue时，相当于是属性值经过过滤计算后输出
                                valuetmp = func(i.getValue(data, attr), data); //230218，入参增加图元对象
                            } else { //给定inputValue为非null值时，相当于是连线操作设置属性值，经过过滤计算后新值给到属性
                                valuetmp = updateForce(data, attr, valueInput);
                            }
                        }
                    } else {
                        console.warn('iotos.form or iotos.formReset not choosed and parser function will not be invoked')
                    }
                }
                if (!hasFilterFunc) {
                    if (valueInput === null || valueInput === undefined) {
                        valuetmp = i.getValue(data, attr);
                    } else {
                        valuetmp = updateForce(data, attr, valueInput);
                    }
                }
                return valuetmp;
            },
            //230806，修改json对象的key
            modifyJsonKey: function(jsonObj, oldKey, newKey, index = null) {
                if (index !== null && index !== undefined) { //1）传入数组，以及数组索引index的对象，key为对象内的键
                    let valtmp = jsonObj[index][oldKey];
                    delete jsonObj[index][oldKey];
                    jsonObj[index][newKey] = valtmp;
                } else { //2）传入对象
                    let valtmp = jsonObj[oldKey];
                    delete jsonObj[oldKey];
                    jsonObj[newKey] = valtmp;
                }
                return jsonObj;
            },
            //230808，当前图元tag变化时，同步更新所有与之关联的连线操作的tag
            __updateRelativeBindTags: function(data, oldTag = '') {
                //主要是下面data.setTag()导致的重入，过滤掉！oldTag原先是e.oldValue
                if (oldTag == undefined || oldTag == '') return;
                //如果设置tag为空，就会自动生成tag
                let newTag = data.getTag();
                if (newTag == undefined || newTag == '') {
                    newTag = i.autoTag(data);
                    data.setTag(newTag);
                }
                //dm中所有图元的连线操作bindControlsTag，如果此前tag跟旧的相等，那么就自动将当前新的值替换过去
                data.dm().toDatas().each(node => {
                    let bindTags = node.ca('bindControlsTag');
                    bindTags && bindTags.forEach((tag, index) => {
                        if (tag && tag === oldTag) bindTags[index] = newTag;
                    });
                });
            },
            //231231，放到独立函数中，config.js中和i.md中都有用到！
            __tagChecking: function(data, oldTag, newTag) {
                if (oldTag == '__init__' || runningMode()) return; //231023，避免初始加载时耗时严重以及死循环！这里仅用于编辑时输入检查！

                //231005，存在重复的标签命名时提示，尤其是formValue自定义标签时容易发生，从而引起难以排查的BUG！！
                let tagsNode = []
                data.dm().eachByBreadthFirst(child => {
                    if (child.getTag() == newTag) tagsNode.push(data)
                })
                if (tagsNode.length >= 2) {
                    i.alert(`标签名${newTag}已存在（${tagsNode.length - 1}处冲突），设定失败！`, '错误', false, null, null, [300, 160]);
                    data.setTag(oldTag); //恢复此前的tag标签纸，避免忘了修改
                }

                i.__updateRelativeBindTags(data, oldTag);
                //在config.js中编辑时即刻同步更新tag到displayName中
                _i.autoTag(data);
            },
            /*230914，获取组件某个属性被连线操作的来源组件，比如func8组件的inputs、exec属性分别被哪些组件连线指向过来，最后一个参数为null时，
            那么就是所有连入当前的其他组件！
            231002，加上第三个参数nodeAttrCb用于回调传出，结构为[{node:xxx,attr:yyy,bVal:zzz},{node:mmm,attr:nnn,bVal:ppp}]，也就是连线操作当前组件指定属性的
            其他组件，以及关联属性，还有静态解析赋值！*/
            getAttrLineSouces: function(data, attr = null, nodeAttrCb = []) {
                let sources = [];
                data.dm() && data.dm().toDatas().each(node => {
                    if (node === data) return;
                    let bindTags = node.ca('bindControlsTag'),
                        bindAttrs = node.ca('bindControlsAttr');
                    bindTags && bindTags.forEach((tag, index) => {
                        if (tag && tag === data.getTag() && (attr ? (i.np(bindAttrs[index]) == i.np(attr)) : 1)) {
                            if (sources.indexOf(node) == -1) sources.push(node); //240113，加上条件if(sources.indexOf(node) == -1)，去掉重复，因为两个组件之间可以连多条线！

                            let pAttrTmp = node.ca('paramControlAttr') && node.ca('paramControlAttr')[index], //pAttr
                                eventTmp = node.ca('_bindEvents_' + index); //240113，加上连线触发事件
                            //比如反向关联事件函数：'onLastButtonClick'，相当于设置了bindEvent_x事件！貌似反向关联事件，优先级高于bindEvent_x的属性设置！
                            if (pAttrTmp && i.getBindedAttrValueType(node, pAttrTmp) == 'Function') {
                                eventTmp = pAttrTmp;
                            }

                            //240721，去掉pAttrTmp &&限制！因为存在连线操作属性，但是未关联属性作为来源的情况！！
                            /*pAttrTmp && */nodeAttrCb.push({ //tips 240113，这里是node图元对象可以重复的，但是整体对象结构不重复
                                node, //fromNode
                                bTag: tag,
                                bAttr: bindAttrs[index], //240113，bAttr
                                bVal: node.ca('bindControlsVal')[index],
                                pTag: node.getTag(),
                                pAttr: pAttrTmp,
                                event: eventTmp,
                                index: index //连线序号
                            });
                        }
                    });
                });
                return sources;
            },
            //231201，图元组件指定属性被连线指向操作的所有连线列表
            getAttrLines: function(data, attr = null) {
                let infos = [],
                    targetLines = [];
                i.getAttrLineSouces(data, attr, infos)
                infos.forEach(info => {
                    info.node.getChildren().forEach(line => {
                        if (i.isInteractiveLine(line) && line.ca('index') == info.index) {
                            targetLines.push(line);
                        }
                    })
                });
                return targetLines;
            },
            //240216，被外部连线操作进来属性的列表
            getAttrsLinedTo: function(data, isKeyURLOnly = false, includeAttrsLinedFrom = false /*, includeFromOthers = false*/ ) {
                let edgestmp = i.getAttrLines(data),
                    results = [];
                edgestmp.forEach(line => {
                    let idx = line.ca('index'),
                        attrtmp = line._source.ca('bindControlsAttr')[idx]; //tips 240219，如果这里是paramControlVal，那么才是取得操作来源图元组件的关联属性！这里显然只是自身的操作属性！
                    if (!attrtmp || results.indexOf(attrtmp) !== -1) return;
                    isKeyURLOnly ? i.isKeyURL(attrtmp) && results.push(attrtmp) : results.push(attrtmp);
                });
                //240218，加上参数includeAttrsLinedFrom，这样连出关联的属性也一起算上
                if (includeAttrsLinedFrom) {
                    //240216，连线对外的属性关联中用到内嵌的keyURL时
                    data.ca('paramControlAttr') && data.ca('paramControlAttr').forEach((attr, idx) => {
                        //240216，需要限定反向关联的属性来自自身的tag！！
                        let tagtmp = data.ca('paramControlTag')[idx],
                            isNodeSelf = !tagtmp || tagtmp == data.getTag();
                        if (!isNodeSelf) return;

                        //240220，可能存在赋值解析的情况！通常是跟着事件，解析是属性
                        let bindValTmp = data.ca("bindControlsVal")[idx];
                        if (bindValTmp && typeof(bindValTmp) === 'string' && _i.isKeyURL(bindValTmp)) {
                            //240220，存在解析规则比如："a:httpAlert>0>api1>a:response.1.result"
                            let attrPartialed = bindValTmp.split('.')[0], //a:httpAlert>0>api1>a:response
                                parserPartial = bindValTmp.split('.').slice(1).join('.'), //1.result
                                isValStringValid = !parserPartial || parserPartial.indexOf('>a:') == -1;
                            console.assert(isValStringValid); //240220，后面一段应该不会出现属性keyURL个存在！也就是说属性、tag、文件名称，不允许中间有.号存在！！
                            if (!isValStringValid) _i.alert(`解析赋值字符串格式异常！${bindValTmp}` + _i.commonTip(data), '警告');
                            //240221，专门做了一个函数，对于...解析和>>>解析都支持！上面的实现仅仅用来做异常格式校验了！
                            let keyUrlTmp = _i.getKeyUrlFromParser(bindValTmp, data);
                            if (keyUrlTmp && results.indexOf(keyUrlTmp) == -1) results.push(keyUrlTmp);
                        }

                        //tips 240220，避免重复，result中没有的就追加
                        if (attr && (!isKeyURLOnly || _i.isKeyURL(attr)) && results.indexOf(attr) == -1) results.push(attr);
                    });
                }
                return results;
            },
            //240219，所有继承过来的属性有被用到的情况，包括连线操作、反向关联、form和formValue绑定。注意其中连线有连入来源，此时包括的属性是内嵌的也被用到，但可能并不属于传入data图元组件的属性！
            getAttrsInheritUsed: function(data, includeUpperRelied = false) {
                let attrstmp = i.getAttrsLinedTo(data, true, true);
                i.attrsInheritFormed(data, attrstmp);

                //240220，参数includeUpperRelied传入true时，这里会再加上上层全局引用依赖的内嵌属性，省去单独再调用！
                return includeUpperRelied ? [...attrstmp, ...i.getInheritRecordFromInner(data)] : attrstmp;
            },
            //240220，获取继承的属性有修改或使用的form、formValue绑定的，不包括formReset
            attrsInheritFormed: function(data, resultBeMerged = []) {
                i.attrsFormBinded(data, [1, 3]).forEach(attr => {
                    attr = i.np(attr);
                    if (i.isKeyURL(attr) && resultBeMerged.indexOf(attr) == -1) resultBeMerged.push(attr);
                });
                return resultBeMerged;
            },
            /*240113，通过指定图元data和属性attr，获取
            通过i.getNodeLineSouceCircled(data, null)得到如下结构信息，下面两个实例中，以ttb1为例，
            1）前者是树表连线0和1分别以各自的事件对外触发；2）树表连线0和1的连线以同一个事件来触发：
            {
                func1: {...},  //全局所有跟传入data的连线操作相关的图元组件。
                func2: {...},
                ttb1: { //重点看这个
                    onDoubleClick: [0],
                    onLastButtonClick: [1]
                },
                ...
            }或者
            {
                func1: {...},
                func2: {...},
                ttb1: {
                    onLastButtonClick: [0,1]
                },
                ...
            }
            而通过i.getNodeLineSouceCircled(data, attr),可得到如下对象，：
            {
                ttb1: { //对照上面的结构
                    onLastButtonClick: [1]
                }
            }
            输出：
            {
                node: Node{}对象,     //顶级对象
                index: 1,             //该对象连线的直接索引，用于最终操作到目标属性
                indexs: [0,1]         //该对象与目标组件相关的所有索引，按顺序的列表
            }*/
            getAttrLinesFromLatestNode: function(data, attr) {
                let attrTopInfo = i.getNodeLineSouceCircled(data, attr),
                    circledInfo = i.getNodeLineSouceCircled(data, null);
                let topTag = i.keys(attrTopInfo)[0], //目前只考虑一个key的情况，多个连入暂不考虑
                    topLine = attrTopInfo[topTag], //提取{onLastButtonClick: [1]}
                    topEvent = topLine && i.keys(topLine)[0], //提取到onLastButtonClick: [1]中的[1],
                    topIndex = topLine && i.values(topLine)[0][0], //获取onLastButtonClick: [1]中的1,
                    topIndexs = topEvent && circledInfo[topTag][topEvent];
                let resulttmp = {};
                resulttmp.node = d(data.dm(), topTag);
                resulttmp.index = topIndex;
                resulttmp.indexs = topIndexs
                return resulttmp;
            },
            //231226，获取指定图元下的交互连线
            getChildLines: function(data) {
                let result = [];
                data.eachChild(child => {
                    if (i.isInteractiveLine(child)) result.push(child);
                });
                return result;
            },
            /*输出多有的（中间）源头图元对象，以及按顺序执行的初始相关连出的连线组，注意，操作触发事件要一致，朔源的连线要有强关联，比如工具函数exec的连入线与output输出连出线，或者
             勾选了输入赋值执行后的输入inputs连入线和output连出线！再或者对话框的连出线有多条，可以分别对应操作按钮点击事件、行勾选等不同事件！还要考虑内嵌封装的连线输入输出！
             此外，还有事件不一定都是bindEvent_x的配置，还有连线paramBindControlsArtr关联的事件函数来决定触发事件！！！
             1.参数node：指定图元对象，获取连线操作过来的其他组件和连线信息。注意，因为逐层溯源，复用本函数，因此存在初始图元和溯源过程中的上级图元，取决于第二个参数isBaseTarget来标记。
             2.参数isBaseTarget：默认true，表示目标的初始图元，将获取连入其所有连线的上级图元连线信息。内部递归时传入false，此时会判断上级连线是否会触发自己的输出，否则上级连线信息就该忽略。
                                比如func作为中间级，连入inputs且自己勾选了输入赋值执行的，这样类似连线可以追溯，其他并不会引起输出的连线操作，不会继续顺藤摸瓜去溯源。
             3.参数_relativeResults：作为返回结果，同时也是递归传参，最终可以通过return返回的来获得，因此名称是中间变量的方式以_开头，数据格式如下所示：
             {  
                //说明：key为页面所有其他跟当前最终操作到的组件相关的其他图元组件，value为对象，对象的key为操作过来相关的事件，值为相关连线的索引数组，其中*作为事件全部通过，作为字段的值包括其他事件的连线！
                func1:{ 
                    *:[0]
                },
                func2:{
                    *:[0,1]
                },
                ttb1:{
                    *:[0,1,2],
                    onLastButtonClicked: [1]
                }
             }
             4.参数_relativeNodeObjs：递归参数，用来累加所有跟baseTarget关联的其他图元对象，形成不重复的列表。
             5.参数_relativeNodeLines：递归参数，类似_relativeNodeObjs，不过，用来累加所有跟baseTarget关联的其他图元的连线信息（结构中的图元对象可能会重复，因为存在A=>B这样多条连线！）。*/
            getNodeLineSouceCircled: function(node, attr = null, isBaseTarget = true, _relativeResults = {}, _relativeNodeObjs = [], _relativeNodeLines = []) {
                //240113，尝试实现：
                let sourcesInfo = [];
                validSouceNodes = []; //如果是baseTarget，那么是所有的连线进入的组件对象；如果不是，那么为实际会触发自己向下输出的连入线的组件对象！
                i.getAttrLineSouces(node, attr, sourcesInfo);
                sourcesInfo.forEach(src => { //tips 240113，node为当前图元组件对象，soucesInof/src.node则是连入过来的关联图元组件！
                    if (!isBaseTarget) { //最初组件之上的，就要考虑哪条连线能触发向下的连线，而不是最初的baseTarget组件那样所有连入的连线都要计算在内！
                        if ( //对于工具函数，更上层连线需要满足以下条件：
                            i.isControlTyped(node, 'func') && !(
                                (
                                    node.ca('exeWhenInput') && ( //1）有勾选输入赋值时执行的，那么连接inputs输入相关的连线，都会触发输出！
                                        src.bAttr.slice(-6) == 'inputs' || //注意，之所以用.slice()，不用==，是要考虑keyURL的情况，即内嵌封装的连线输入输出！
                                        src.bAttr.slice(-9) == 'inputKeys' ||
                                        src.bAttr.slice(-11) == 'inputValues'
                                    )
                                ) || ( //2）不论是否有勾选输入赋值时执行，只要连线操作执行、遍历执行的，都会触发输出！
                                    src.bAttr.slice(-4) == 'exec' ||
                                    src.bAttr.slice(-7) == 'arrExec'
                                )
                            )
                        ) {
                            return; //工具函数上层其他连线就忽略掉！
                        }
                    }

                    //相关节点的相关连线计数累加
                    let tagtmp = src.node.getTag(),
                        eventtmp = src.event;
                    if (eventtmp === undefined) eventtmp = '*'; //兼容bindEvent为undefined的情况，被当做*来处理！无事件是""
                    if (eventtmp == '') return; //240113，关联事件如果是空字符串，这时就是不触发，过滤掉这条连线信息！！
                    if (_relativeResults[tagtmp] === undefined) _relativeResults[tagtmp] = {};
                    if (_relativeResults[tagtmp][eventtmp] === undefined) _relativeResults[tagtmp][eventtmp] = [];
                    _relativeResults[tagtmp][eventtmp].push(src.index);
                    if (
                        eventtmp.indexOf('*') == -1 &&
                        _relativeResults[tagtmp]['*'] !== undefined
                    ) {
                        _relativeResults[tagtmp]['*'].push(src.index);
                    }
                    //相当于全局过滤且追加sourcesInfo信息，这样根据任何一个图元，可以查到与目标baseTarget相关的连线信息！
                    _relativeNodeLines.push(src);
                    //去掉重复，得到上层连线过来的图元对象列表
                    if (_relativeNodeObjs.indexOf(src.node) == -1) {
                        validSouceNodes.push(src.node); //新的单独数组，用来下面遍历！
                        _relativeNodeObjs.push(src.node); //累计的追加用来传入，并且在下一次判断中用来判断新旧！
                    }
                });
                //递归处理
                validSouceNodes.forEach(srcNode => {
                    //240113，中间层往上溯源，就不能带上原先指定baseTarget的属性attr，以func工具函数为例，只要能触发向下执行即可，不需要关心指定上级哪个属性操作导致！因此这里传入attr为null
                    i.getNodeLineSouceCircled(srcNode, null, false, _relativeResults, _relativeNodeObjs, _relativeNodeLines);
                });
                //240113，如果有指定attr，那么返回最上级的信息，而不要链条！
                if (attr) {
                    let copyedResult = i.clone(_relativeResults);
                    for (let tag in _relativeResults) {
                        //240113，通过扁平化追加存放的_relativeNodeLines，来识别不是顶级的节点，并且在下面delete掉key
                        let notTopClass = false;
                        _relativeNodeLines.forEach(lineInfo => {
                            if (notTopClass) return;
                            if (lineInfo.bTag == tag) notTopClass = true;
                        })
                        if (notTopClass) delete copyedResult[tag];
                    }
                    return copyedResult
                } else {
                    return _relativeResults;
                }
            },
            //230808，任意类型转数字，对于特殊类型会统一转为0，主要用于适合相加计算
            toNumberMergedType: function(value, forceEmptyTo = 0) {
                if (isObject(value)) {
                    if (i.isObjEmpty(value) || (isArrayFn(value) && value.length == 0)) return forceEmptyTo; //1）空对象或者空数组，都转成0
                    else return 1; //2）非空对象或非空数组，都转成1
                } else if (typeof(value) == 'string' && i.isEqual(Number(value), NaN)) { //3）非数值内容的（非空）字符串，除了大小写不区分的'false'/'null'为0，其他为1。相当于常规非空字符串、非空对象，都按1来处理！
                    return value.toLowerCase() == 'false' || value.toLowerCase() == 'null' ? forceEmptyTo : 1;
                } else if (i.isEqual(value, NaN) || value === null || value === undefined) return forceEmptyTo; //4）NaN转为0或者null对象转为0，注意，前面自定义的公共函数isObject(null)发现是false！！！
                else return Number(value); //注意，Number(undefined)为NaN。空字符串''会走到这里来
            },
            //230808，任意类型转字符串，对于特殊类型会统一转为空字符串''，主要用于适合追加合并用途。
            toStringMergedType: function(value, forceEmptyTo = '') {
                if (isObject(value)) {
                    if (i.isObjEmpty(value) || (isArrayFn(value) && value.length == 0)) return forceEmptyTo; //1）空对象或者空数组，都转成空字符串''
                    else if (isArrayFn(value)) {
                        let itemTemp = [];
                        value.forEach(item => {
                            itemTemp.push(i.ify(item));
                        })
                        return itemTemp.length == 0 ? '' : itemTemp.join(','); //2）数组还是按照逗号隔开形式，只是如果里面有对象，则相关部分转成字符串
                    } else return i.ify(value); //3）对象都以对象字符串形式输出
                } else if (value === null || value === undefined || i.isEqual(value, NaN)) return forceEmptyTo; //4）特殊空内容，转成空字符串
                else return String(value); //注意，Number(undefined)为NaN
            },
            //230808，任意类型转布尔型，主要用于逻辑取并集操作。注意，跟默认的有些逻辑相反，比如Boolean({})、Boolean([])空对象空数组默认返回true，而这里返回false
            toBooleanMergedType: function(value, forceEmptyTo = false) {
                if (isObject(value)) {
                    if (i.isObjEmpty(value) || (isArrayFn(value) && value.length == 0)) return forceEmptyTo; //1）空对象或者空数组，都转成false，注意，与默认js判断相反！
                    else return true;
                } else if (value === null || value === undefined || i.isEqual(value, NaN)) return forceEmptyTo; //4）特殊空内容，转成空字符串
                else return Boolean(value); //注意，Number(undefined)为NaN
            },
            //230808，任意类型转对象类型，主要用于多对象字段合并，取对象的并集。
            toObjectMergedType: function(value, forceEmptyTo = {}) {
                if (isObject(value)) return convertToFlatJson(value); //空数组[]会被转换成空对象{}
                else if (value === null || value === undefined || i.isEqual(value, NaN)) return forceEmptyTo; //特殊空内容，转成空对象
                else return Object(value);
            },
            //230809，获取数组中最大数以及索引
            arrMaxValueIndex: function(arr) {
                return arr.indexOf(Math.max(...arr));
            },
            //230809，通过数组中出现的各个类型中数量最多的，来判断当前数组对应的数据时什么类型
            //比如：i.getArrayItemsType([null, null, 1, true, false, false, false,'', '', '', ]) 得到结果：'boolean'，因为出现数量最多
            getArrItemsMostType: function(arr) {
                if (arr == undefined || arr.length == 0) return undefined;
                if (!isArrayFn(arr)) return typeof(arr); //230809，不是数组时，那就是自身类型。 
                let valType2Count = {}; //存放输入（组）类型名称（列表），统计各类型出现的频次
                arr.forEach(item => {
                    let typeStr = typeof(item),
                        counttmp = 0;
                    if (Object.keys(valType2Count).indexOf(typeStr) != -1) counttmp = valType2Count[typeStr];
                    valType2Count[typeStr] = counttmp + 1;
                });
                let idx = i.arrMaxValueIndex(Object.values(valType2Count));
                return Object.keys(valType2Count)[idx];
            },
            //230809，判断字符串是否是html dom对象，检查符合dom的格式，包括标签是否正确，尖角符号是否闭合等
            isDOMFormat: function(str) {
                if (str == undefined) return undefined;
                //chatgpt生成
                let ret = false;
                var tagRegex = /<\/?[a-z]+[^>]*>|\b<br\b>/gi;
                var matches = str.match(tagRegex);
                if (matches === null) {
                    return false;
                }
                var stack = [];
                for (var i = 0; i < matches.length; i++) {
                    var tag = matches[i];
                    if (tag.charAt(1) === '/') {
                        // Closing tag
                        if (stack.length === 0) {
                            ret = false; // Found closing tag without corresponding opening tag
                            break;
                        }

                        var openingTag = stack.pop();
                        if (tag.slice(2, -1) !== openingTag.slice(1, -1)) {
                            ret = false; // Opening and closing tags do not match
                            break;
                        }
                    } else if (tag === "<br>") {
                        // Self-closing tag
                        // Do nothing, self-closing tags are valid.
                    } else {
                        // Opening tag
                        stack.push(tag);
                    }
                }
                ret = stack.length === 0;

                //人工调整
                if (str.trim().slice(0, 4) == '<div') ret = true;
                return ret;
            },
            /*230814，移除悬空的内嵌渲染元素组件*/
            innerPendingNodeAutoDel: function(data, cbOperate = null) {
                if (!data.dm()) { //240106，发现timer定时器存在时有这种情况，专门处理，避免报错！
                    cbOperate && cbOperate(data);
                    data = null;
                    return;
                }
                if (!i.ensureDataUsable(data)) return; //231224，通常存在两个或多个地板的情况，自动移除并删除废的那个。
                if (i.upperData(data)) {
                    let innerDataTmp = i.innerData(i.upperData(data), data._tagToUpper); //240301，将data.getTag()改成._tagToUpper，否则会出错！
                    if (innerDataTmp !== data) {
                        if (i.innerData(i.upperData(data), data._tagToUpper) == undefined) return false;
                        cbOperate && cbOperate(data);
                        data = null;
                        return true;
                    }
                }
                return false;
            },
            //231224，如果图元组件data是被移除了的，那么就清理掉！存在图元data非null，且有.dm()，但是dm中对应tag的图元不是它！
            ensureDataUsable: function(data) {
                if (d(data.dm(), data.getTag()) != data) {
                    data = null;
                    console.warn('WARN:more than one fill fullscreen found!!choose first!');
                    return false;
                } else {
                    return true;
                }
            },
            /*json转换成http get请求的参数
                    let obj = {
                    name: 'zhangsan',
                    age: 100
                };
            */
            toHttpGetTypedParams: function(jsonParams) {  
                try {    
                    //兼容同时传入json字符串或者json对象
                    if (typeof(jsonParams) == 'string') jsonParams = i.jsonParse(jsonParams);
                    let tempArr = [];    
                    for (let i in jsonParams) {      
                        let key = encodeURIComponent(i);      
                        let value = encodeURIComponent(jsonParams[i]);      
                        tempArr.push(key + '=' + value);    
                    }    
                    return tempArr.join('&');  
                } catch (err) {    
                    return '';  
                }
            },
            /*判断字符串是否是函数，示例用法*/
            isFuncString: function(str) {
                if (typeof(str) != 'string') return false;
                try {
                    // 尝试将字符串转换为函数
                    var func = (new Function('return ' + str))(); //注意，不能仅仅用：new Function(str)，这样不能识别匿名函数等！
                    // 如果转换成功，则返回 true
                    return typeof func === 'function';
                } catch (e) {
                    // 如果转换失败，则返回 false
                    return false;
                }
            },
            //230816，判断是工具函数图元组件
            isFuncTypeControl: function(data) {
                //对于判断inputs等属性，可能值为null；如果判断inputs属性key是否存在，可能需要异步，因此目前只判断name是否为func
                return data && data.getName() == 'func' || i.isControlTyped(data, 'func');
            },
            //230917，判断图元组件是什么类型。严格判断是根据data.getName()，为了向下兼容，页支持非严格模式（默认），此时displayName包含了传入的类型，也算！
            isControlTyped: function(data, type, strict = false) { //type为'api'/'dlg'/'btn'/'func'等等
                console.assert(!isArrayFn(data.getDisplayName())); //240518，发现block组合的displayName有数组[]的情况，传入报错！下面做了过滤，这里就做异常提示！

                //231006，将data.getDisplayName().indexOf(type) != -1改成了如下slice()，如果通过显示名称，那么需要名称开头保持跟类型字符串一致！
                return data &&
                    (
                        data.getName() && data.getName().trim().toLowerCase() == type.toLowerCase() ||
                        data.getClassName() && data.getClassName().toLowerCase().trim().indexOf(type.toLowerCase()) != -1 || //231010，data.getName()为空时，用className()来判断！
                        (strict ? 0 : data.getDisplayName() && data.getDisplayName().trim && data.getDisplayName().trim().toLowerCase().slice(0, type.length) == type.trim().toLowerCase())
                    );
            },
            //240614，编辑状态下，组件是对话框，而且是运行打开模式！（发现判断show属性是否为true不凑效！）
            isDialogEditorRunning: function(node) {
                return node && !runningMode() && i.isControlTyped(node, 'dlg') && node._cache.controlRunning === node._cache.current;
            },
            //240208，对话框非show属性被赋值时，如果是不可见且勾选了显示重加载的状态，那么要特别注意，这个赋值操作要被缓存！因为一旦显示，重加载，之前的值就会被清理掉！
            isDialogAttrUpdateNeedCache: function(node, attrTobeUpdateForce) {
                return i.isControlTyped(node, 'dlg') && (
                    (
                        node.ca('reloadWhenOpen') == false &&
                        i.np(attrTobeUpdateForce) != 'show' && //240313，show操作不能缓存！否则无法弹窗
                        !i.hasInnerSymbolInited(node) && //240313，说明是初始弹窗，此前没弹过窗
                        i.hasInnerInner(node) //240313，内嵌有更下级内嵌！
                    ) || (
                        node.ca('reloadWhenOpen') &&
                        node._cache &&
                        (
                            (
                                node.ca('embedded') && //240302，内嵌模式对话框
                                node._cache && //tips 240107，有渲染元素初始化过
                                !node._cache.control.isVisible() //240302，对话框（通常是运行时，因为内嵌模式+编辑状态下，cache.control始终可见）不可见
                            ) || ( //
                                !node.ca('embedded') && //tips 240107，非内嵌模式
                                node._cache && //tips 240107，有渲染元素初始化过
                                !node._cache.controlRunning.isVisible() //tips 240107，运行对话框不可见
                            )
                        ) && ( //240
                            !attrTobeUpdateForce ||
                            attrTobeUpdateForce.slice(-4) != 'show'
                        )
                    )
                ) && !( //240313，编辑状态下对话框图元显示状态下，一律不缓存操作，这样可以编辑时表单赋值能够即时看到数据变化跟常规容器那样，不用再弹一下才能看到！
                    runningMode() == false &&
                    node.s('2d.visible')
                );
            },
            //230817，翻译
            trans: function(str) {
                return runningMode() ? str : hteditor.getString(str);
            },
            //231016，获取当前页面最大的zIndex
            /*tips 231105，发现layer.load(1) + layer.closeAll()一对加载提示结束后，全局的zIndex就变了！此后的dialog弹窗show时调用i.getRootZIndex()后，内嵌的下拉框、日期下拉选择等都会被对话框遮盖掉！！
             */
            getMaxZIndex: function() {
                let arr = [...document.all].map(e => +window.getComputedStyle(e).zIndex || 0);
                return arr.length ? Math.max(...arr) + 1 : 0
            },
            //230818，获取最大zIndex层次
            getRootZIndex: function(data) {
                let zIndex = i.getMaxZIndex();
                if (i.rootData(data) && i.rootData(data)._uiView && i.rootData(data)._uiView.getZIndex) {
                    let tmp = i.rootData(data)._uiView.getZIndex();
                    if (tmp) zIndex = tmp;
                }
                return zIndex;
            },
            //230818，因为有布局提示叠加和移除的存在，都是以toolTipRaw来存放实际的提示，因此专门提供方法来代替原始的getToolTip
            getToolTip: function(data) {
                return data.ca('toolTipRaw') ? data.ca('toolTipRaw') : data.getToolTip()
            },
            /*230819，图元 组件是否有被布局。
            230916，默认hostIsBase为null，这样只判断图元自身的layout.h、layout.v和host存在即可，不判断host是谁！
            存在网格下面的元素，是没有layout.h/layout.v，但是后host是grid；除了网格，还有组合block也是类似情况！*/
            isLayered: function(data, hostIsBase = null, groupChildInclude = false) {
                if (!data.getHost) return false; //240110，发现dm中存在纯数据的那种data图元，只有_childMap、_children、_dataModel、_id、_styleMap字段属性，调用其他的比如.getHost()会报错！
                let ret = data.getHost() && !(!data.s('layout.h') && !data.s('layout.v')) && (hostIsBase ? !!i.baseNode(data.dm()) : 1);
                if (groupChildInclude) {
                    //网格Grid
                    ret = ret || (data.getHost() && (data.getHost().getName() == 'grid' || data.getHost().getClassName().indexOf('Grid') != -1));
                    //组合Block
                    if (data.getParent() && data.getParent().getClassName() == 'ht.Block') {
                        if (i.isLayered(data.getParent(), hostIsBase, groupChildInclude)) ret = true;
                    }
                }
                return ret;
            },
            //230820，清空吸附布局
            clearHostLayer: function(data) {
                if (data.getClassName() == 'ht.Edge') return; //231120，避免传入连线时报错！
                data.setHost(undefined);
                data.s("layout.h", undefined);
                data.s("layout.v", undefined);
                data.s('2d.movable', true); //非吸附布局下，允许独立移动
                if (data.ca('hostLayerLine')) i.remove(data.ca('hostLayerLine'));
                //230818，布局的提示，不覆盖此前的注释！
                let oldToolTips = data.ca('toolTipRaw') ? data.ca('toolTipRaw') : data.getToolTip(); //230819，布局、取消布局时的提示，不会影响正常划过时的文字。
                oldToolTips = oldToolTips ? _i.replaceAll(oldToolTips, constLayoutedHintString, '') : '';
                //兼容对旧的toolTip布局提示
                if (oldToolTips.indexOf(constLayoutedHintString_pureText) != -1) {
                    oldToolTips = oldToolTips ? _i.replaceAll(oldToolTips, constLayoutedHintString_pureText, '') : '';
                }
                if (oldToolTips.trim() == '') oldToolTips = undefined;
                data.ca('toolTipRaw', oldToolTips);
                data._i_notAffectToolTipRaw = true; //注意，这里也一定要加上，否则现在的清空显示，会造成dm().md()同步清空toolTipRaw
                data.setToolTip(undefined);
                ht.Default.hideToolTip(); //即时关闭提示
            },
            //230829，对于传入的值，是否能触发boolean属性。通常用于开关量类型的组件属性，对其赋值尤其是反向关联空时传入的对象，也要能触发执行！
            isValueCanTriggerBoolean: function(val) {
                return (
                    Number(val) ||
                    (val && isObject(val)) //230601，非NULL的对象类型（返回值）也要触发执行
                )
            },
            //230909，修改操作静态值时，更新连线的toolTip显示
            __bindControlsValUpdate: function(e) {
                let data = e.data;
                if (e.newValue == undefined || !isArrayFn(e.newValue)) { //非数组类型的值，不允许配置
                    i.alert('操作静态值（bindControlsVal）不允许设置为非数组类型，将被自动还原！', '错误', false);
                    i.update(data, e.property, e.oldValue);
                    return;
                }
                let lineEdgeArr = [];
                data.eachChild(child => {
                    if (i.isInteractiveLine(child)) { //230902，交互连线和其他连线（布局连线）区别在于有index属性！！
                        lineEdgeArr.push(child);
                    }
                });
                lineEdgeArr.forEach((item, index) => {
                    try {
                        //传入html div字符串给jquery，成为jquery对象
                        if (item.getToolTip() && item.getToolTip().indexOf('→') != -1) { //230603，向下兼容连线的提示，此前旧版的格式不是html！避免$操作报错！
                            console.error('old type format tooltip will not be updated!', item.getToolTip(), item);
                            return;
                        }
                        let toolTipJqueryObj = $(item.getToolTip()),
                            divInfoTmp = toolTipJqueryObj && toolTipJqueryObj.children() && toolTipJqueryObj.children()[6],
                            valInfoTmp = divInfoTmp && divInfoTmp.innerHTML,
                            splitedValTmp = valInfoTmp && valInfoTmp.split('：'),
                            constFieldTmp = splitedValTmp && splitedValTmp.length > 1 && splitedValTmp[0]; //获得原始的'&nbsp;&nbsp;静态值：'
                        if (constFieldTmp) { //虽然固定静态字段不变，但是这里通过蹭蹭进来获取到并且判断，其实就是初步判断进入的结构正确。
                            divInfoTmp.innerHTML = constFieldTmp + '：' + e.newValue[index];
                        } else {
                            toolTipJqueryObj.children().push($(`<li style='list-style-type:disc;font-weight:bold;'>静态赋值：${e.newValue[index]}</li>`));
                        }
                        item.setToolTip(toolTipJqueryObj.prop("outerHTML")); //回写新的提示信息。
                    } catch (error) {
                        console.error(error, item.getToolTip());
                    }
                });
            },
            /*230912，json对象中简单key-value结构的进行value-key颠倒转换后输出：
            输入：
            {
                '内嵌>0>field1>a:defaultIndex': "field1#xxxx",
                '内嵌>0>field1>a:selectedTextGet': "field1#AAA",
                '内嵌>0>field2>a:value': "field2#BBB",
                '内嵌>0>field3>a:value': "field3#CCC"
            }
            输出：
            {
                field1#AAA: "内嵌>0>field1>a:selectedTextGet"
                field1#xxxx: "内嵌>0>field1>a:defaultIndex"
                field2#BBB: "内嵌>0>field2>a:value"
                field3#CCC: "内嵌>0>field3>a:value"
            }
            */
            reverseJson: function(targetFlatJson) {
                let ret = {};
                i.values(targetFlatJson).forEach((item, idx) => {
                    if (isObject(item)) {
                        console.error('need pure base type,but given object', item);
                        return;
                    }
                    let oldValExist = ret[item],
                        newValCurrent = i.keys(targetFlatJson)[idx];
                    if (oldValExist !== undefined) {
                        if (isArrayFn(oldValExist)) {
                            newValCurrent = [...oldValExist, newValCurrent];
                        } else {
                            newValCurrent = [oldValExist, newValCurrent];
                        }
                    }
                    ret[item] = newValCurrent;
                })
                return ret;
            },
            //230912，ing 未完成！！如何实现动态利用容器属性form变量，实现网格Grid的表单内的组件读写
            loadInnerDatas: function(nodeDatas, callbackLoaded = null) {
                let gvtmp = new ht.graph.GraphView(),
                    dmtmp = gvtmp.dm(),
                    nodetmp = new ht.Node();
                dmtmp.add(nodetmp);
                nodetmp.setWidth(1);
                nodetmp.setHeight(1);
                nodetmp.setImage('symbols/develop/uiotos/base/graphView.json');
                nodetmp.ca('display', nodeDatas[0].dm().toJSON());
                nodetmp.ca('onDisplayLoaded', callbackLoaded);
                return nodetmp;
            },
            //230914，判断是否是交互连线
            isInteractiveLine: function(node) {
                return node.getClassName() == 'ht.Edge' && node.ca('index') !== undefined;
            },
            //230923，别名
            isEdgeLineActive: function(node) {
                return i.isInteractiveLine(node);
            },
            //240108，当前图元data对外连线，按照索引获得连线edge的图元对象
            getEdgeLineByIndex: function(data, index) {
                let ret = undefined;
                data._edgeLines && i.keys(data._edgeLines).forEach(lineTag => {
                    if (ret !== undefined) return;
                    let lineData = d(data.dm(), lineTag);
                    if (lineData.ca('index') === index) {
                        ret = lineData;
                        console.assert(data._edgeLines[lineTag] == data.ca('bindControlsTag')[index]);
                    }
                });
                return ret;
            },
            //230916，字符串数组中，每个元素的字符串来indexOf()匹配给定的字符串，而不是对数组直接indexOf严格匹配
            arrItemsIndexOf: function(arr, str) {
                let matchedIdxs = [];
                arr.forEach((element, idx) => {
                    if (element.indexOf(str) != -1) matchedIdxs.push(idx);
                });
                if (matchedIdxs.length == 0) return -1;
                else {
                    matchedIdxs.length > 1 && console.error('WARN: more than one item found:', matchedIdxs, arr, str);
                    return matchedIdxs[0];
                }
            },
            //230917，html内div p的文字设置颜色、字体，但是不会内容换行
            getHtmlInnerTextStyled: function(text, color = 'green', other = '') {
                return `<span style="color=${color};${other};!important">${text}</span>`;
            },
            //230921，获取底层组件属性定义的默认值
            getBottomDefaultValue: function(node, keyURL) {
                let attr = keyURL,
                    symbolObjectTmp = node.getImage && node.getImage(),
                    //240224，传入新增的图元对象参数，可以利用_i_symbolDatabindings避免重复循环遍历！//tips 240224，用data.innerDatabingdings，弃用_i_symbolDatabindings
                    bindingsTmp = i.getDataBindingItem(typeof(symbolObjectTmp) == 'string' ? i.getImage(symbolObjectTmp) : symbolObjectTmp, attr, node);
                return bindingsTmp && bindingsTmp.defaultValue;
            },
            //分析诊断
            getAnalysis: function(node, alert = false) {
                i.alertError('社区版不支持该功能，诊断无效！');
                return '';//`该功能社区版不支持！`;
            },
            //230914，函数别名
            analysis: function(node, alert) {
                return '';// i.getAnalysis(node, alert);
            },
            //231227，通常用于弹窗提示的通用组件信息
            nodeLogInfo: function(data, attr = null) {
                return `当前组件：${data.getDisplayName()}\n` + (attr ? `当前属性：${attr}\n` : '') + `页面地址：${data.dm()._url}`;
            },
            //230927，获取函数体字符串，注意，是大括号内的内容，通常用于html的onclick=""里面，注意，对于箭头函数不带{}的函数体识别不了！需要函数体用{}包住才行！
            getFuncBody: function(func) {
                let entire = func.toString()
                return entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}"))
            },
            //240624，tips，注意，链接字符串的参数，一定要在前面传入的文本字符串内包含有才行！！
            //230927，传入文字，输出html字符串，用于textArea里面，尤其是有点击链接的情况。两个style允许为null空，这样默认以font-size:12px为内容。
            //示例一：i.toHtmlText('未勾选操作属性，是否为表单操作？', null, '表单操作', 'http://www.baidu.com', 'font-weight:bold'));
            //示例二：i.toHtmlText('未勾选操作属性，是否为表单操作？', null, '表单操作', ()=>{alert(1234)}, 'font-weight:bold')); //注意，函数而非url时，函数需要括号{}包起来的形式才行！
            toHtmlText: function(text, style = 'font-size:12px', linkedText = null, linkURLorCallback = null, linkedStyle = 'font-size:12px') {
                if (!style) style = 'font-size:12px';
                if (!linkedStyle) linkedStyle = style;
                let targetHTML = `<span style="${style}">${text}</span>`;
                if (linkedText) {
                    let isFunCallback = typeof(linkURLorCallback) == 'function';
                    targetHTML = i.replaceAll(targetHTML, linkedText, `
            <a href="${isFunCallback ? '#' : linkURLorCallback}"
                onclick="${isFunCallback ? i.getFuncBody(linkURLorCallback) : ''}"
                style="text-decoration: none;${linkedStyle}"
                target="${isFunCallback ? '' : '_blank'}">${linkedText}
            </a>`).replace(/\n|\s\s+/g, ' '); //后面的.replace(/\n|\s\s+/g, ' ')是为了去掉``内换行导致的空格！！
                }
                return targetHTML;
            },
            /*230928，两个绝对路径，生成相对路径，比如
            var A = "a/b/c/d/e/hp.js";
            var B = "a/b/f/cx.js";
            生成"../../../f/cx.js"，也就是B目录相对于A目录的相对路径
            下面参数传入两个绝对路径，获取pathTobeRel相对于pathAabs的相对路径*/
            getRelativePath: function(pathAabs, pathTobeRel) {
                let relative = pathTobeRel,
                    absolute = pathAabs;
                var rela = relative.split('/');
                rela.shift();
                var abso = absolute.split('/');
                abso.shift();
                var num = 0;
                for (var i = 0; i < rela.length; i++) {
                    if (rela[i] === abso[i]) {
                        num++;
                    } else {
                        break;
                    }
                }
                rela.splice(0, num);
                abso.splice(0, num);
                var str = '';
                for (var j = 0; j < abso.length - 1; j++) {
                    str += '../';
                }
                if (!str) {
                    str += './';
                }
                str += rela.join('/');
                //230930，如果传入的路径pathTobeRel是目录，并非文件，那么不经过下面处理！
                let lastField = pathTobeRel.split('/').slice(-1)[0];
                if (str == './' && lastField.indexOf('.') != -1) str += lastField; //230929，发现如果路径相同，此前得到是./，没有文件名称了！！
                return str;
            },
            /* 231009，相对路径转换成绝对路径，注意，任一url段，不包括http浏览器的当前地址头！
            输入1：'xxx/yyy/../fightingDeviceMonitorFloor_dictText/xx/yy/zzz/mmm/value/../aa/bb/cc'
            输出1：'xxx/fightingDeviceMonitorFloor_dictText/xx/yy/zzz/mmm/aa/bb/cc'
            注意，返回的当前是不再带有./、../开头，即便url内部多个../../意义上都已经往上超过开头时，不再管。
            */
            getAbsURL: function(url) {
                //url如果有./xxx/yyy/zzz，那么移除掉前面的./，只保留xxx/yyy/zzz，方便字符串相加
                function __relRemoveDotBar(relURL) {
                    return relURL.slice(0, 2) == './' ? relURL.slice(2) : relURL;
                }
                var a = document.createElement('A');
                a.href = url; // 设置相对路径给Image, 此时会发送出请求
                url = a.href; // 此时相对路径已经变成绝对路径
                return decodeURIComponent(__relRemoveDotBar(i.getRelativePath(window.location.href.split('?')[0], url)));
            },
            /*230929，一个绝对路径，另一个相对路径，比如
            var pathAabs = "a/b/c/d/e/hp.js";
            var pathRel = "../../../f/cx.js";
            生成得到"a/b/f/cx.js"，也就是B目录相对于A目录的绝对路径，再比如：
            i.getAbsolutePath("a/b/c/d/e/hp.js",'./../../../f/./cx.js');
            输出：'a/b/f/cx.js' */
            getAbsolutePath: function(pathAabs, pathRel) {
                let relpath = pathRel,
                    absolute = pathAabs;
                var rela = relpath.split('/');
                var abso = absolute.split('/');
                abso.slice(-1)[0].indexOf('.') != -1 && abso.pop(); //绝对路径末尾是文件（以.为标记）时，移除掉，只保留目录结构
                var num = 0;
                for (let i = 0; i < rela.length; i++) {
                    rela[i] == '..' && num++;
                }
                abso = abso.splice(0, abso.length - num); //剩余的
                i.arrayItemsRemoved(rela, '..');
                i.arrayItemsRemoved(rela, '.'); //如果存在./，也移除掉
                return abso.join('/') + '/' + rela.join('/');
            },
            //230928，主要用于支持内嵌页面的相对路径，比如../../3.json，或者全局绝对路径displays/xxx/xxx/xxx/3.json都可以！
            toAbsDisplayURL: function(data, relPathURL) {
                let curDisplayURL = data.dm()._url;

                if (relPathURL.slice(0, 9) == 'displays/') return relPathURL;
                else if (data.dm()._url) return i.getAbsolutePath(data.dm()._url, relPathURL); //这里将存在相对路径的url，转换成绝对路径，方便用于路径比对，比如side侧边容器中配置页面display路径url
                else {
                    console.error('get absolute display url failed,because url of node dm', data, 'is null!', relPathURL);
                    return relPathURL; //240507，之前是悬空的，貌似不对吧，那就顺手做个好人好事，给加上了return，得观察是否引起问题！
                }
            },
            /*230928，与上面相反，绝对路径转换成相对路径*/
            toRelDisplayURL: function(data, absPathURL) {
                let curDisplayURL = data.dm()._url;
                //url如果有./xxx/yyy/zzz，那么移除掉前面的./，只保留xxx/yyy/zzz，方便字符串相加
                function __relRemoveDotBar(relURL) {
                    return relURL.slice(0, 2) == './' ? relURL.slice(2) : relURL;
                }
                if (absPathURL.slice(0, 9) != 'displays/') return urlPath(curDisplayURL) + '/' + __relRemoveDotBar(absPathURL); //不是绝对路径，那么当成是相对路径直接返回
                else if (curDisplayURL) {
                    return urlPath(curDisplayURL) + '/' + __relRemoveDotBar(i.getRelativePath(curDisplayURL, absPathURL));
                } else {
                    //231001，如果_url不在，算是正常，在新建页面的时候。如果._url存在，那么就要打印出错误了！
                    if (data.dm()._url) console.error('get relative display url failed,because url of node dm', data, 'is null!');
                    return absPathURL;
                }
            },
            //230928，对于容器组件的display属性的监听处理中，加入这句调用，并且返回作为实际使用的url，如果返回undefined就不处理，直接返回不让函数后的逻辑不执行！
            /*使用示例：
            a:display': e => { //230118 从上面initPorperties紧接着后面的调用剥离出来，避免config.js中连线弹出对话框等对titleText等一连串外观属性的设置，都会影响造成重新加载内嵌图纸！需要进一步观察是否会有BUG！！
                let targetURL = i.autoDisplayURL(e);
                if (targetURL === undefined) return;

                initInnerDisplay(cache.control.graphView, targetURL);
            }*/
            autoDisplayURL: function(e, displayField = 'display', forContainer = false) {
                try {
                    let data = e.data;
                    let urlParam = data.ca(displayField) === '__init__' && e.newValue !== '__init__' ? e.newValue : data.ca(displayField);
                    if (urlParam == '__init__') return undefined;
                    //230930，指定名称为'relativePath'的为相对路径，不自动加.json
                    if (urlParam && urlParam.slice(-5) != '.json' && displayField != 'relativePath') urlParam += '.json';
                    let relURL = urlParam ? i.toRelDisplayURL(data, urlParam) : '';
                    if (data._i_writeBack) {
                        data._i_writeBack = undefined;
                        return undefined;
                    }
                    data._i_writeBack = true;
                    let urlToAttr = urlParam ? i.replaceAll(relURL, urlPath(data.dm()._url), '.') : "";
                    prefix = urlToAttr.slice(0, 5);
                    //注意，对于上级目录，经过上面替换后不是../开头而是./../这样的，因此注意识别标记！对于直接下级的目录，就相当于自动加上了./开头！
                    if (prefix == './../') { //如果是上层目录，那么不转成相对路径，只有在当前目录或子目录才将绝对路径转成相对，这样才方便整体目录移动或重命名而不影响内部自成体系的路径引用。
                        relURL = urlParam;
                        data._i_writeBack = undefined; //没有i.update回写时，复位标记！
                    } else { //当前目录下的
                        if (urlToAttr == /*e.newValue*/ data.ca(displayField)) data._i_writeBack = undefined; //230929，如果要传递的值跟当前值相等，那么就不会触发进入，标记需要手动复位！！
                        let oldValTmp = data.ca(displayField); //240814，只有新旧值变化，才会触发md监听的重入啊！！
                        i.update(data, displayField, urlToAttr);
                    }
                    return relURL;
                } catch (error) { //存在新建页面时，
                    if (e.data.dm()._url) console.error(error);
                }
            },
            /*231011，url相对路径转换成绝对路径，比如：
                调用：i.fromFlaggedRelURL('gv2#../fightingDeviceMonitorFloor_dictText/../a/b/c/../../d')
                得到：'a#d' 
            增加recoverFlag参数，传入true时，对于处理后的'/'都转回此前的标签比如'#'*/
            fromFlaggedRelURL: function(relURL, flag = '#', recoverFlag = false) {
                console.assert(relURL);
                if (relURL && relURL.indexOf('/') != -1) {
                    let urltmp = i.replaceAll(relURL, flag, '/');
                    return recoverFlag ? i.replaceAll(i.getAbsURL(urltmp), '/', flag) : i.getAbsURL(urltmp);
                } else return relURL;
            },
            /*231011，key为有相对路径形式的key，转换成绝对路径的key，返回新的对象，示例数据如下：
                {
                    gv2#../fightingDeviceMonitorFloor_dictText: "11F"
                    gv2#../fightingDeviceMonitorPosition: "产品办公室"
                    gv4#actualValue: "XX"
                }
            示例返回：
                {
                    fightingDeviceMonitorFloor_dictText: "11F"
                    fightingDeviceMonitorPosition: "产品办公室"
                    gv4#actualValue: "XX"
                }
            */
            relativeKeysConverted: function(obj, flag = '#') {
                let result = [];
                i.keys(obj).forEach((key, idx) => {
                    result[i.fromFlaggedRelURL(key, flag)] = i.values(obj)[idx];
                });
                i.overWrite(obj, result); //引用方式回写obj
                return result;
            },
            /*231017，获取函数调用堆栈的上层逐层函数名称列表，百度chatgpt生成后的修改。比如A调用B，在B内调用本函数，获得从A开始的逐层往上的调用堆栈，
            注意，返回列表不包含B，也不包含本函数名称在内！*/
            getFuncNamesFromStack: function() {
                let stack = new Error().stack,
                    result = [];
                //1）兼容谷歌浏览器
                const functionNames = stack.split('\n').map(line => {
                    let matched = line.match(/at (.+)\(/g);
                    return matched ? matched[0] : undefined;
                });
                /*得到functionNames如下示例：
                0: undefined
                1: "at eval (eval at formValues ("
                2: "at Object.formValues ("
                3: "at Object.getFormValues ("
                4: "at Object.formEventBubblingUpper ("
                5: "at H.Button.<anonymous> ("
                6: "at H.Button.Q ("
                7: "at K.Notifier.fire ("
                8: "at H.Button.fireViewEvent ("
                9: "at H.ButtonInteractor.handle_touchend ("
                10: "at H.ButtonInteractor.handle_mouseup ("
                */
                functionNames.forEach(name => {
                    if (!name) return;
                    let funcNameTmp = name.split(' ')[1]; //得到eval、Object.formValues、H.ButtonInteractor.handle_touchend等
                    funcNameTmp = funcNameTmp.split('.').at(-1); //获得函数名称最后一段
                    //去掉eval这种调试状态下的当前函数，以及去掉当前函数getFuncNamesFromStack名称本身！
                    funcNameTmp != 'eval' && funcNameTmp != 'getFuncNamesFromStack' && result.push(funcNameTmp);
                });
                //其他浏览器可能获取不到，格式不一样，这里就打印提示出来!
                if (result.length == 0) {
                    stack.split('\n').forEach(funcName => {
                        funcName = funcName.split('@')[0]; //获取@的前段
                        funcName = funcName.split('/')[0]; //获取/之前的部分
                        !!funcName && funcName != 'getFuncNamesFromStack' && result.push(funcName);
                    });
                }
                if (result.length == 0) {
                    console.error('WARN: stack found outer func empty??', stack);
                }
                return result;
            },
            //231017，通过堆栈信息获取外层调用当前这句，貌似没卵用，因为函数A调用函数B，这句放到函数B内，获得的是B名称，无法获得A名称！
            getOuterCallerFuncName: function() {
                let callerName = null;
                let reg = /(\w+)@|at ([^(]+) \(/g;
                reg.exec(new Error().stack); //跑一次exec, 跑到第二个匹配
                let regResult = reg.exec(new Error().stack);
                callerName = regResult[1] || regResult[2];
                return i.replaceAll(callerName, 'Object.', ''); //返回貌似如：Object.formValues，去掉前缀！
            },
            //231106，为了让func的output在内嵌页的在上层连线对外操作，需要再loadDisplay中加载时的两个data.ca()中，对func的output属性做处理！
            __funcOutputLoadInit: function(data, attr, value) {
                let newValueTmp = value != undefined ? value : null,
                    attrKey = attr;
                //231106，为了让工具函数func的output能在上层被直接连线对外操作，而且不会因嵌套反弹在此处的初始加载，导致output触发对外连线操作
                if (
                    attrKey.slice(-8) == 'a:output' && //1）func工具函数的output
                    (
                        data.ca(attrKey) !== newValueTmp || //2）值变化，必然触发func渲染函数中的output监听（里面有i.formEventBubblingUpper触发连线操作！）
                        (data.ca(attrKey) === null && newValueTmp === null) || //注意，发现这种情况下data.ca()也会触发md监听，而且e.oldValue为undefined！！！
                        (
                            isObject(newValueTmp) &&
                            data.ca(attrKey) === newValueTmp
                        )
                    )
                ) {
                    /*此时做上标记，让i.formEventBubblingUpper不对外触发连线操作，而且复位标记！注意，不是data._i_funcOutputInit，因为下面的data.ca()会触发逐层向下同步
                    一直到底层工具函数组件，触发其对output的监听！所有标记为的设置和还原应该都是针对底层工具函数来的！*/
                    let bottomTmp = i.bottomData(data, attrKey);
                    if (i.isControlTyped(bottomTmp, 'func')) { //3）属于工具函数
                        bottomTmp._i_funcOutputInit = true;
                    }
                }
            },
            /*231116，给定字符串内容content，以及关键词keyWord，查询关键词是否存在，其中多个关键词空格隔开，是交集，需要空格隔开的多个关键词同时存在！
            如果多个关键词逗号隔开，则是任何一个关键词存在即可，相当于并集！返回true false，即是否存在。目前暂不支持返回查询匹配的数量，主要用于树表格
            关键词查找对应行是否显示、隐藏的过滤！示例：
            i.searchFilterd('helloss world','hello')              //返回true
            i.searchFilterd('helloss world','hello ')             //返回false，因为hello最后一个字符为空格，表名严格匹配'hello'字符串且后面不带其他字符串的
            i.searchFilterd('helloss world','hello uiotos')       //返回false，交集，两个没有同时存在
            i.searchFilterd('helloss worlduiotos','hello uiotos') //返回true，交集，两个关键词同时存在于内容中
            i.searchFilterd('helloss worlduiotos','hello,welcome')//返回true，并集，两个关键词其中一个存在于内容中即满足条件
            */
            searchFilterMatched: function(content, keyWord) {
                keyWord = keyWord.toLowerCase(); //筛选查找过滤输入的文字
                //230905，封装成函数，需要匹配
                function __found(key) {
                    if (content && content.toLowerCase().indexOf(key) >= 0) return !0;
                    return !!(content && content.toLowerCase().indexOf(key) >= 0) ||
                        _i.stringInclude(content, key);
                }
                //230905，支持关键词以空格隔开或者逗号隔开，其中，空格是取搜索的交集（多条件结合），逗号是多条件并集
                let keysArr = [],
                    corssType = true; //默认交集，空格。
                if (keyWord.slice(-1) === ' ' && keyWord.trim().indexOf(' ') == -1 && keyWord.trim().indexOf(',') == -1) { //主要是为了让form+空格能单独搜索，不包括formXXX
                    keysArr = [keyWord];
                } else {
                    if (keyWord.indexOf(',') != -1) {
                        corssType = false;
                        keysArr = keyWord.split(',');
                    } else {
                        keysArr = keyWord.split(' ');
                    }
                }
                let foundExist = corssType ? true : false; //交集、并集对应的初始值得不同！
                keysArr.forEach(key => {
                    if (corssType) foundExist = foundExist && __found(key); //空格为交集
                    else foundExist = foundExist || __found(key); //逗号为并集
                })
                return foundExist;
            },
            /*231121，支持传入缓存，通常是图元对象，默认是window全局对象！
            调用：i.requestFileList('/')
            返回：[".git",".gitignore",".idea","assets","components","displays","models","previews","scenes","symbols","temp"]*/
            requestFileList: function(path, filter = '', useCache = true, cacheObj = window.top) {
                let paramStringed = path + filter,
                    cache = useCache ? cacheObj : null;
                if (cache && !cache._i_fileList) cache._i_fileList = {};
                if (cache && cache._i_fileList[paramStringed] !== undefined) return cache._i_fileList[paramStringed];
                let result;
                layer.load(1);
                $.ajax({
                    url: '/files/list', // 替换为你的URL  
                    data: {
                        path,
                        filter
                    },
                    type: 'GET',
                    async: false, // 设置为false以使请求同步  
                    success: function(data) {
                        result = data;
                    },
                    error: function(xhr, status, error) {
                        console.log('Error: ' + error.message);
                    }
                });
                layer.closeAll();
                let parsed = i.jsonParse(result);
                if (cache) cache._i_fileList[paramStringed] = parsed;
                return parsed; //JSON数组字符串转JSON数组
            },
            /*231127，字符串转数字，包括数组， 能转数字的就转数字！加上i.toNumber()，是为了让传入的单个数字字符串，
            或者数组中有数字字符串的，都能支持，自动转成数字或者数字字符串！避免组件属性加载字符串参数不显示或报错！*/
            toNumber: function(value) {
                let arrtmp = [];
                if (isArrayFn(value)) {
                    value.forEach(item => {
                        //240305，存在3.14%、0.12%这种数值字符串，需要转换成数值！之前i.isStringNumber()对这种字符串的判断是false，注意！！
                        if (typeof(item) === 'string' && item.slice(-1) == '%') {
                            item = Number(item.replace(/%/g, '')) / 100.0;
                        }
                        arrtmp.push(i.isStringNumber(item) ? Number(item) : item);
                    })
                    value = arrtmp;
                } else {
                    //240305，存在3.14%、0.12%这种数值字符串，需要转换成数值！之前i.isStringNumber()对这种字符串的判断是false，注意！！
                    if (typeof(value) === 'string' && value.slice(-1) == '%') {
                        value = Number(value.replace(/%/g, '')) / 100.0;
                    }
                    if (i.isStringNumber(value)) {
                        value = Number(value);
                    }
                }
                return value;
            },
            //231128，刷新界面更新，主要是切换选中再切换回来，让编辑器即时刷新更新属性配置，通常data.iv()起不到效果的，用i.iv(data)
            iv: function(data, force = false) {
                if (!data.dm()) return; //240311，发现高频刷新时，data.dm()可能为null，导致使用时报错！
                //231115，发现动态修改渲染元素定义后，编辑状态下属性栏要更新，需要切换选中到其他图元组件，马上再切换回来，这样做一下当前选中变动，才能确保立即刷新更新！
                let dmtmp = null,
                    smtmp = null;
                //231231，支持兼容传入dm和sm
                if (data.getClassName() == 'ht.DataModel') {
                    dmtmp = data;
                    smtmp = dmtmp.sm();
                    data = smtmp.getLastData();
                } else if (data.getClassName() == 'ht.SelectionModel') {
                    smtmp = data;
                    dmtmp = smtmp.dm();
                    data = smtmp.getLastData();
                } else {
                    dmtmp = data.dm();
                    smtmp = dmtmp.sm();
                }
                if (smtmp.contains(data) || force) { //240111，加上条件，这样避免重新加载页面，也会有图元组件被默认选中！//240213，加上条件force，存在没选中的情况，比如ctrl+双击容器做内嵌属性继承选择！
                    let arrtmp = dmtmp.toDatas().toArray(),
                        tempData = null;
                    arrtmp.forEach(node => {
                        if (tempData) return;
                        if (node !== data && node.getParent() !== data) { //240216，测试发现，如果是子节点ht.Edge连线，那么切换去再切换回不起作用！因此选择临时图元时，所有子节点的排除掉！
                            tempData = node;
                        }
                    });
                    smtmp.ss(tempData);
                    smtmp.ss(data);
                }
            },
            //231201，设置连线为虚线
            setLineDashed: function(edge, enable = true) {
                if (!enable && !edge.s('edge.dash')) return; //原本非虚线的，复位就不管！
                let rawColor = enable ? edge.s('edge.color') : edge.s('edge.dash.color');
                edge.s('edge.dash.color', rgbaForced(rawColor, Number(enable)));
                edge.s('edge.color', rgbaForced(rawColor, Number(!enable)));
                edge.s('edge.dash', enable);
                edge.s('edge.dash.pattern', [8, 8]);
            },
            //231205，判断数组的每个元素是否都是数组
            isSubArraysAll: function(arr) {
                if (!isArrayFn(arr)) return false;
                let result = true;
                arr.forEach(item => {
                    if (!result) return;
                    if (!isArrayFn(item)) result = false;
                });
                return result;
            },
            //231205，判断数组的每个元素是否都是对象键值对，不包括数组
            isSubObjsAll: function(arr) {
                if (!isArrayFn(arr)) return false;
                let result = true;
                arr.forEach(item => {
                    if (!result) return;
                    if (!(isObject(item) && !isArrayFn(item))) result = false;
                });
                return result;
            },
            //240715，判断数组元素都是基本类型，没有对象和下级数组
            isArrSubBaseAll: function(arr){
                let isArrTmp = isArrayFn(arr);
                console.assert(isArrTmp);
                if(!isArrTmp) return false;
                let allBaseType = true;
                arr.forEach(item=>{
                    if(isObject(item) && item !== null) allBaseType = false;
                });
                return allBaseType;
            },
            //240104，将对象key value转成url get形式参数拼接
            /*let obj = {  
                name: "John",  
                age: 30,  
                city: "New York"  
            };  
            let queryString = objectToQueryString(obj);  
            //输出：name=John&age=30&city=New+York */
            objToURLQueryStr: function(obj) {
                let params = new URLSearchParams();
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        params.append(key, obj[key]);
                    }
                }
                return params.toString();
            },
            //240114，尝试解决定时器的潜在内存泄漏！
            setTimeout: function(callback, ms = 0) {
                if (ms == 0) {
                    requestAnimationFrame(callback);
                } else {
                    let timerId = setTimeout(() => {
                        callback && callback();
                        clearTimeout(timerId);
                    }, ms);
                }
            },
            //240114，封装重入时自动释放事件监听，尝试解决内存泄漏
            addEventListener: function(domObj, eventString, callback, useCapture = false) {
                let consgFlat = '_i_' + eventString;
                if (domObj[consgFlat]) domObj.removeEventListener(eventString, domObj[consgFlat], useCapture);
                domObj[consgFlat] = callback;
                domObj.addEventListener(eventString, callback, useCapture);
            },
            //240114，封装充入自动释放的监听，尝试解决内存泄漏
            addViewListener: function(control, callback) {
                if (control._i_removeViewListener) control.removeViewListener(control._i_removeViewListener);
                control.addViewListener(callback);
                control._i_removeViewListener = callback;
            },
            /*240131，基础函数而且涉及数组（属性集）大量遍历时，用for代替forEach以提高性能，避免延时累加变得非常明显，比如执行1ms，1000次循环就是1s,太明显了！
            总结：
            1.大数据量循环，尽量用倒序排序，至于倒序为什么性能更好，有知道的可以留言
            2.for和foreach的性能相近，在数据量很大，比如一千万时，foreach因为内部封装，比for更耗时
            3.减少对象成员和数组项的查找，比如缓存数组长度，避免每次查找数组 length 属性*/
            forEach: function(arr, callback) {
                let lentmp = arr.length,
                    curIdx = 0;
                for (let idx = lentmp - 1; idx > -1; idx--) {
                    curIdx = lentmp - 1 - idx;
                    callback && callback(arr[curIdx], curIdx);
                }
            },
            //240208，by gpt：js对于超大数组，判断key是否包含指定的字符串，返回符合条件键字段列表
            findKeysContainingString: function(input, searchString) {
                const result = [];
                if (Array.isArray(input)) {
                    // 处理数组  
                    for (let i = 0; i < input.length; i++) {
                        const key = input[i];
                        if (typeof key === 'string' && key.includes(searchString)) {
                            result.push(key);
                        }
                    }
                } else if (typeof input === 'object' && input !== null) {
                    // 处理对象  
                    for (let key in input) {
                        if (input.hasOwnProperty(key) && key.includes(searchString)) {
                            result.push(key);
                        }
                    }
                }
                // 对结果数组按照字符串长度进行从短到长的排序  
                result.sort((a, b) => a.length - b.length);

                return result;
            },
            //240516，字符串中出现指定子字符串的次数
            countSubstring: function(str, substr) {
                let count = 0;
                let index = str.indexOf(substr);
                while (index !== -1) {
                    count++;
                    index = str.indexOf(substr, index + 1); // 从上一次找到的位置后开始查找
                }
                return count;
            },
            //240210，执行函数并获取函数执行花费的时间！注意返回为函数的正常返回，执行时间通过回调函数返回！支持传入函数的任意传参！
            /*使用示例：
            let attrs = i.exeWithTimeMeasured(i.attrsFormBinded, tm => {
                if (i.window().__xxx === undefined) i.window().__xxx = 0;
                if (i.window().yyy === undefined) i.window().yyy = 0;
                i.window().__xxx += tm;
                i.window().yyy += 1;
                console.error('formValues', tm, i.window().__xxx, i.window().yyy);
            }, data, formType);
            */
            exeWithTimeMeasured: function(target_func, callbackWithExeTime = None, ...args) {
                const startTime = performance.now();
                let rettmp = target_func(...args); //执行函数
                const endTime = performance.now();
                callbackWithExeTime && callbackWithExeTime(endTime - startTime);
                return rettmp;
            },
            //240213，属性编辑状态，通常用于md响应处理中判断，比如i.enableAttrEditByFirstItem()显然只会发生在属性编辑时，通过isEditing()判断，可以用上！
            isEditing: function(node) {
                if(runningMode()) return false;
                let data = typeof(editor) !== "undefined" && editor._i_dragEntering ? node : i.topData(node); //241004，千万注意！需要以最上层来判断，因为有表格a:columns这种作为内嵌页，在上层来设置放到索引1对象方式配置时，就需要以当前treeTable的顶层图元来判断！
                return !data._i_isContainerCoppied && data.dm() && data.dm().sm().co(data); //240214，编辑时
            },
            /*240213，先后提供两个数组，A相当于弹窗重新勾选的，B表示弹窗原有的，通过本函数对比，返回告知通过重新勾选，哪些是新增的，哪些是被移除的！
            // 示例使用  
                const arrayA = ["apple", "banana", "cherry"];  
                const arrayB = ["banana", "orange", "grape"];  
                const result = compareArrays(arrayA, arrayB);  
                console.log("要添加到数组a的元素:", result.addToA); // 输出: ["apple", "cherry"]  
                console.log("要从数组a删除的元素:", result.removeFromA); // 输出: ["orange", "grape"]*/
            compareArrays: function(arrayNewly, arrayOrigin) {
                const a = arrayNewly;
                const b = arrayOrigin;
                // 使用Set数据结构来快速检查数组元素是否存在  
                const setA = new Set(a);
                const setB = new Set(b);
                // 找出a中有而b中没有的元素  
                const add = a.filter(item => !setB.has(item));
                // 找出b中有而a中没有的元素  
                const remove = b.filter(item => !setA.has(item));
                // 返回结果  
                return {
                    add,
                    remove
                };
            },
            /*240221，属性keyURL结合解析赋值的表达式，提取属性keyURL本身
            1）输入：'进行中>0>dlg4>a:进行中-异常上报>0>gv4>a:headProtrait_v3>0>abnormalImage>a:output>1.title.name';
               输出：'进行中>0>dlg4>a:进行中-异常上报>0>gv4>a:headProtrait_v3>0>abnormalImage>a:output';
            2）输入： 'a:进行中>0>ttb1>a:currentClicked>button>text';
               输出： 'a:进行中>0>ttb1>a:currentClicked';  
            3）输入： 'a:进行中>0>ttb1>a:currentClicked.button.text';
               输出： 'a:进行中>0>ttb1>a:currentClicked';  
            */
            getKeyUrlFromParser: function(str, data) {
                //比如传入"a:圆形>0>Node2>s:shape.background"中的"shape.background"
                function attrTried(field) {
                    //兼容>和.的情况
                    let headField = str.split(field)[0],
                        fieldStr = i.replaceAll(field, '>', '.'),
                        fieldArr = fieldStr.split('.'),
                        resulttmp = [];
                    for (let idx = 0; idx < fieldArr.length; idx += 1) {
                        //比如从"shape.background.xxx"中依次去试探shape、shape.background、shape.background.xxx，分别去判断加上前缀后的是否是属性标识！
                        let fieldAdding = fieldArr.slice(0, idx + 1).join('.');
                        if (i.getValue(data, headField + fieldAdding) !== undefined) resulttmp.push(headField + fieldAdding);
                    }
                    //如果出现比如“a:圆形>0>Node2>a:ht.color.background”中，a:ht.color、a:ht.color.background这样有多个都是属性，那么断言异常！！这里只会返回最先匹配到的！
                    console.assert(resulttmp.length <= 1);
                    return resulttmp.length === 0 ? undefined : resulttmp[0];
                }

                if (str.indexOf('>s:') !== -1) {
                    let lastField = str.split('>s:').slice(-1).join('');
                    /*如果解析赋值串中存在>s:，说明后面肯定是属性字符串了，更后面的内容解析肯定最多是.，而不会有>a:、>p:这种格式！！！这相当于是还有 更下级内嵌，不合理！
                    因此，也要求业务数据，不要有这种片段的字符存在于数据字段中！*/
                    console.assert(lastField.indexOf('>a:') === -1 && lastField.indexOf('>p:') === -1);
                    return attrTried(lastField);
                } else if (str.indexOf('>p:') !== -1) {
                    let lastField = str.split('>p:').slice(-1).join('');
                    /*跟上面类似，对于>p:的也是一样的情况！*/
                    console.assert(lastField.indexOf('>a:') === -1 && lastField.indexOf('>s:') === -1);
                    return attrTried(lastField);
                } else {
                    //240815，解析赋值如果填入错误，提示一下，避免难以排查！！
                    //【正确】a:未命名>0>dlg1>a:textArea>0>textArea-ui1>a:value
                    //【错误】a:未命名>0>dlg1>a:textArea>0>textArea-ui1>值内容
                    if(str.split('>').length >= 2){
                        let lastAttrName = str.split('>').at(-1);
                        if(lastAttrName.slice(0,2) !== 'a:' && i.hasChinese(lastAttrName)){
                            i.alertError(`解析赋值应该填入属性标识，您是否填入了名称“${str}”？`,title = '错误', color = 'red', size = [400, 260],data);
                            return;
                        }
                    }
                    let field1 = str.split('>a:').slice(0, -1).join('>a:');
                    field2 = str.split('>a:').slice(-1).join('');
                    field2_1 = i.replaceAll(field2, '>', '.').split('.')[0];
                    return field1 + '>a:' + field2_1;
                }
            },
            /*240330，i.window()代替window或window.top，因为不是所有地方都适合用window.top，尤其是外层域和iframe中src的域不同*/
            window: function() {
                try {
                    if (window.top) return window.top;
                } catch (error) {}
                return window;
            },
            //240507，切换左上角tab
            __editorFolderChangeTo: function(tabIndex) {
                editor.leftTopTabView.getTabModel().getDatas().get(tabIndex).setVisible(true);
                editor.leftTopTabView.select(tabIndex);
            },
            /**
             * 调整数组中元素的顺序。
             * @param {Array} array 要操作的数组。
             * @param {number} fromIndex 元素当前的索引位置。
             * @param {number} toIndex 元素要移动到的新索引位置。
             */
            // 使用示例
            // var myArray = [1, 2, 3, 4, 5];
            // console.log('Before:', myArray);
            // adjustArrayElementOrder(myArray, 1, 3); // 将索引为1的元素移动到索引3的位置
            // console.log('After:', myArray);
            adjustArrayElementOrder: function(array, fromIndex, toIndex) {
                // 确保索引在数组边界内
                if (fromIndex >= 0 && fromIndex < array.length && toIndex >= 0 && toIndex < array.length) {
                    // 移除元素并记住它
                    var element = array.splice(fromIndex, 1)[0];
                    // 在目标位置插入元素
                    array.splice(toIndex, 0, element);
                } else {
                    console.warn('Index out of bounds. No changes made to the array.');
                }
            },
            //240523，异步获取目录文件列表
            // fetchDirFilesForPalette('displays/demo/3-示例')
            // .then(result => console.error(result))
            // .catch(error => console.error(error));
            fetchDirFilesForPalette: async function(dirPath, fileType = '.jpg', baseURL = null, apiPath = '/files/list?path=', _second = false) {
                if (!_second) layer.load(1); //加载提示
                if (!baseURL) baseURL = window.top.origin; //240523，不能固定用localhost:8999，如果部署到云端，那么就会有跨域问题了！
                // 假设有个API可以根据路径返回目录内容
                const apiUrl = baseURL + apiPath + dirPath;
                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(`Failed to fetch directory at ${dirPath}`);
                    const contents = await response.json(); // 假设返回的是一个包含文件和子目录的数组
                    // 过滤出子目录和.jpg文件
                    const dirs = contents.filter(item => item.indexOf('.' === -1));
                    const jpgFiles = contents.filter(item => item.endsWith(fileType)); //240523，只找二级目录下的.jpg文件！
                    let jpgStructed = [];
                    jpgFiles.forEach(file => {
                        let fileURL = baseURL + '/' + dirPath + '/' + file;
                        jpgStructed.push({
                            icon: fileURL,
                            toolTip: fileURL,
                            text: urlName(fileURL)
                        })
                    });
                    // 构建结果对象
                    let result = []
                    // 递归处理子目录
                    if (!_second) { //240523，第二次，就不再遍历子目录了！
                        for (const dir of dirs) {
                            if (dir.indexOf('.') != -1) continue; //240521，所有名称带有.的被当做是文件，不当作子目录递归遍历！因为可能是一级目录的.rar、.json等！
                            const childrenResult = await i.fetchDirFilesForPalette(dirPath + '/' + dir, fileType, baseURL, apiPath, true);
                            // 添加子目录下的.jpg文件到当前目录的children中
                            result.push({ title: dir, children: childrenResult })
                        }
                    }
                    if (_second) layer.closeAll();
                    return _second ? jpgStructed : result;
                } catch (error) {
                    layer.closeAll();
                    console.error(`Error fetching or processing directory at ${dirPath}:`, error);
                    return [];
                }
            },
            //240519，by gpt，调整对象的字段顺序
            /*// 使用示例
            var myObj = {
                "c": 3,
                "a": 1,
                "b": 2
            };
            var keysOrder = ["a", "b", "c"];
            var orderedObj = orderByKeys(myObj, keysOrder);
            输出为：
            {
                a: 1, 
                b: 2, 
                c: 3
            }*/
            orderByKeys: function(inputObj, keysOrder) {
                // 创建一个新的空对象用于存放排序后的键值对
                var orderedObj = {};
                // 遍历期望的键顺序
                keysOrder.forEach(function(key) {
                    // 如果输入对象中存在该键，则复制键值对到新对象
                    if (inputObj.hasOwnProperty(key)) {
                        orderedObj[key] = inputObj[key];
                    }
                });
                // 返回按顺序排列的新的对象
                return orderedObj;
            },
            /* 240525，by gpt，模拟用户登录缓存过期时间设置！使用：  
            setItemWithExpiration('myData', 'Hello, world!', 1); // 设置1天后过期*/
            /*240821，对expirationDays加上默认值1。否则有出现未传入参数的调用，导致getItemWithExpiration
            会刷新页面，而且是反复 ！！！*/
            setItemWithExpiration: function(key, value, expirationDays = 1) {
                let sessiontmp = i.window().sessionStorage;
                const now = new Date();
                const item = {
                    value: value,
                    expiration: now.getTime() + (expirationDays * 86400000) // 转换为毫秒  
                };
                sessiontmp.setItem(key, JSON.stringify(item));
            },
            /*240525，by gpt，缓存过期设置
            const data = getItemWithExpiration('myData');  
            if (data) {  
                console.log(data); // 如果数据未过期，则输出 "Hello, world!"  
            } else {  
                console.log('Data has expired or does not exist.');  
            }*/
            getItemWithExpiration: function(key, reloadWhenExpired = true) {
                let sessiontmp = i.window().sessionStorage;
                const itemStr = sessiontmp.getItem(key);
                if (!itemStr) {
                    return null;
                }
                const item = i.jsonParse(itemStr);
                const now = new Date();
                //240821，这句非常重要！！item.expiration !== null，否则会导致trying模式的页面，再次刷新，结果陷入死循环！！页面不停刷新但是进不去！！
                if (item.expiration !== null && now.getTime() > item.expiration) {
                    // 数据已过期，从 sessionStorage 中删除  
                    sessiontmp.removeItem(key);
                    i.showMessage('登录已过期，请重新登录！');
                    //240525，当过期时，是否刷新重加载当前页面？比如一直停留着不动，再来操作时，登录信息已经过期了，此时需要自动刷新到登录！
                    reloadWhenExpired && location.reload();
                    return null;
                }
                // 数据未过期，返回值  
                return item.value;
            },
            //240602，是否是html dom对象。兼容传入tag id，或者dom对象！注意，不是jquery对象！
            isDOMElement: function(obj) {
                if (typeof(obj) == 'string') {
                    return document.getElementById(obj);
                } else {
                    return obj instanceof HTMLElement;
                }
            },
            //240602，判断是否是发布后的html页面独立部署的情况
            isDisplayExport: function() {
                function __isHref(tail = 'index.html') {
                    let urlHref = window.location.href;
                    if (urlHref.slice(-1) == '?') urlHref = urlHref.slice(0, -1);
                    return urlHref.slice(-tail.length) == tail && urlHref === window.origin + '/' + tail;
                }
                if (
                    runningMode() &&
                    (
                        window.location.href.slice(-5) == '.html' ||
                        window.location.href.slice(-6) == '.html?'
                    ) &&
                    !__isHref('index.html') &&
                    !__isHref('display.html')
                ) {
                    console.warn(window.location.href)
                    return true;
                } else {
                    return false;
                }
            },
            //240602，为了对外用到命名空间，更规范
            initRuntime: function(callback) {
                initRuntime(callback);
            },
            //240602，为了对外用到命名空间，更规范
            loadDisplay: function(graphViewControl, url, cache = null, callback = null, extra = {
                renderData: null, //内嵌图纸的渲染元素图标data对象
                renderGv: null, //渲染元素图元对应的gv，也传进来，参数保持渲染元素内一致
                multiDistinctIndex: 0, //渲染元素内多个同样图纸的嵌套，传入用于区分不同的实例
            }) {
                return loadDisplay(graphViewControl, url, cache, callback, extra);
            },
            /*240607，从页面中做的数据绑定，去物联中台做ws订阅！一方面，加快页面初始打开速度（此前是账号下点表全量遍历订阅），另一方面，
            当某个页面做示例，绑定其他账号下数据时，避免数据无法推送过来显示！！*/
            getWebSocketSubList: function(dm) {
                let varListtmp = dm._i_wsSubList ? dm._i_wsSubList : [];
                //240608，编辑状态下就不走ws订阅了，避免加载耗时！
                runningMode() && dm.each(function(dataItem) {
                    let dataBindings = dataItem.getDataBindings();
                    if (dataBindings) {
                        function __queryBinded(type) {
                            for (let name in dataBindings[type]) {
                                let db = dataBindings[type][name];
                                if (i.isIotVarBind(db)) { //注意，db.id为@前半部分，db.idInfo为@后半部分！
                                    varListtmp.indexOf(db.idinfo) == -1 && varListtmp.push(db.idinfo);
                                }
                            }
                        }
                        __queryBinded('a');
                        __queryBinded('p');
                        __queryBinded('s');
                    }
                });
                dm._i_wsSubList = varListtmp;
                return varListtmp;
            },
            //240609，渲染元素symbol定义，和zh.js中的定义，对description等，渲染元素文件优先！如果未定义，而zh.js中有，就用zh.js中定义的！
            getNewTransNote: function(data, attr, fieldType = 'description') {
                if (!attr) return undefined;
                //240731，缓存，试图减少耗时，待验证效果！
                if(!data._i_newTransNoteCached) data._i_newTransNoteCached = {};
                let fieldtmp = attr + '' + fieldType;
                if(data._i_newTransNoteCached[fieldtmp]) {
                    let ret = data._i_newTransNoteCached[fieldtmp];
                    return ret === 'undefined' ? undefined : ret;
                }
                if (i.isKeyURL(attr)) { //240613，对于逐层继承的属性，注释用最底层的！
                    let bottomNode = i.bottomData(data, attr),
                        bottomAttr = i.bottomKeyURL(attr);
                    //240731，缓存！
                    let ret = i.getNewTransNote(bottomNode, bottomAttr, fieldType = 'description');
                    data._i_newTransNoteCached[fieldtmp] = ret;
                    return ret;
                }
                if (data._i_symbolAttrsDefault) { //仅编辑时用
                    let attrKey = i.np(attr),
                        symbolDef = data._i_symbolAttrsDefault[attrKey],
                        noteDef = symbolDef && symbolDef[fieldType],
                        symbolZh = !runningMode() && _i.arrFilter(hteditor.attrsDBCommonInfo, { attr: attrKey }),
                        noteZh = symbolZh && symbolZh[0] && symbolZh[0][fieldType];
                    //240731，缓存！
                    let ret = noteDef ? noteDef : noteZh;
                    data._i_newTransNoteCached[fieldtmp] = ret;
                    return ret;
                } else if (attr.slice(1, 2) == ':' && attr.slice(0, 1) != 'a') { //240613，对于内嵌的s:text等属性，继承到上层，也要能翻译！
                    //240731，缓存！
                    let ret = i.np(attr);
                    data._i_newTransNoteCached[fieldtmp] = ret;
                    return ret;
                } else {
                    //240731，缓存！
                    data._i_newTransNoteCached[fieldtmp] = 'undefined'
                    return undefined;
                }
            },
            /*240609，翻译相关*/
            getAttrNote: function(data, attr) {
                if (!attr) return undefined;
                if (i.isKeyURL(attr)) { //240613，对于逐层继承的属性，
                    let bottomNode = i.bottomData(data, attr),
                        bottomAttr = i.bottomKeyURL(attr),
                        bottomNote = i.getAttrNote(bottomNode, bottomAttr);
                    return attr.split('>').slice(0, -1).join('>') + '>' + bottomNote;
                }
                let aliasName = i.getNewTransNote(data, attr, 'name');
                return aliasName ? i.trans(aliasName) : i.np(attr);
            },
            /*240623，设置关联属性值。注意，要求关联属性没有设置过，本次的联动赋值才会生效。如果联动属性是数组，并且传入指定联动索引，那么需要确保索引位置
            是否有初始化，没有初始化的，联动赋值才会成功！好比普通按钮的边框和颜色的联动设置。是否有设置过，判断值是否为undefined、null或空数组[]即可！*/
            /*调用示例：
            'a:ht.borderColor': e => {
                i.setValueLinked(data, 'ht.textColor', e);
                i.setValueLinked(data, 'icon-background', e);
            },*/
            setValueLinked: function(data, attr, value, index = null) {
                if (i.isHtNodeData(value.data)) {
                    let e = value;
                    value = e.newValue;
                    index = i.arrArrayIndexChanged(e);
                }
                let isAttrArrType = i.getAttrType(data, attr).toLocaleLowerCase().indexOf('array') !== -1;
                if (index === null) {
                    if (isArrayFn(value) && !isAttrArrType) value = value[0]; //240623如果关联属性是非数组，而md监听的是数组，并且出事设置是oldValue为undefined，newValue为数组时，需要这么处理下！
                    if (!i.isAttrConfigured(data, attr)) i.update(data, attr, value);
                } else {
                    let wholeSize = value.length,
                        indexdValue = value[index]; //传递过来的可能是数组，那么数组和数组索引对应！比如textColor和borderColor数组！
                    let valtmp = data.ca(i.np(attr));
                    if (isAttrArrType) {
                        if (valtmp === undefined) i.update(data, attr, []);
                        else if (!isArrayFn(valtmp)) i.update(data, attr, [valtmp]);
                    }
                    console.assert(i.isStringNumber(wholeSize));
                    if (isAttrArrType) {
                        let attrValue = data.ca(i.np(attr));
                        for (let idx = 0; idx < wholeSize; idx += 1) { //240623，这样如果关联方的数组，有其他项清空叉掉了，那么在意设置当前数组的某一个索引值时，会把其他索引的数据也会同步设置过去！
                            if (!i.isAttrConfigured(data, attr, idx)) i.setArrayIndexValue(attrValue, idx, idx === index ? indexdValue : value[idx], null);
                        }
                    } else {
                        if (!i.isAttrConfigured(data, attr)) i.update(data, attr, value[0]);
                    }
                }
            },
            //240623，数组属性，编辑时哪一个元素发生变化！
            arrArrayIndexChanged: function(e) {
                if (!i.isEditing(e.data)) return;
                let otmp = e.oldValue,
                    ntmp = e.newValue;
                if (isArrayFn(otmp) && isArrayFn(ntmp)) {
                    let diffIndexs = [];
                    otmp.forEach((item, idx) => {
                        if (item !== ntmp[idx]) diffIndexs.push(idx);
                    });
                    if (diffIndexs.length == 1) return diffIndexs[0];
                    else return null;
                } else return null;
            },
            /*240709，轨迹拓扑关联*/
            setTrackPercentAsHost: function(data, percent = 0) {
                if (!data._i_startPosition) {
                    data._i_startPosition = ht.Default.clone(data.p());
                }
                let offsetX = 0;
                let offsetY = 0;
                data.getChildren().each(child => {
                    let shape = null;
                    if (child.getClassName() == 'ht.Edge' && child.ca('topoLine')) {
                        console.assert(child.getTarget());
                        shape = child.getTarget();
                    } else return;
                    if (shape instanceof ht.Shape) {
                        let points = shape.getPoints();
                        if (points && points.size() > 0) {
                            let p = data._i_gv.getPercentPosition(shape, percent);
                            offsetX += p.x - points.get(0).x;
                            offsetY += p.y - points.get(0).y;
                        }
                    }
                });
                data.p(data._i_startPosition.x + offsetX, data._i_startPosition.y + offsetY);
            },
            //240713，判断要请求的url（文件资源等）是否存在
            urlExistChecking: function(url,callback){
                fetch(url)  
                .then(response => {  
                    callback && callback(!!response.ok);
                })  
                .catch(error => {  
                    console.error('请求链接时出错:',url, error);  
                    callback && callback(false);
                });  
            },
            //240721，主要用于属性定义的描述desc字段内的链接文字和风格
            attrNoteLinkedStyle: function(url,str='详情',color = 'rgb(96,172,252)'){
                return `<a href='${url}' style="color:${color}" target='_blank'>${str}</a>`;
            },
            //240729，获取兼容路径，渲染元素组件路径兼容处理！以适应组件路径目录名称变化的情况
            __getPathCompatible: function(url,data = null){
                //240729，指定路径baseURL下，子目录名称oldName改成newName时的新旧兼容！
                function __folderChanged(oldName,newName,baseURL = 'symbols/develop/uiotos/arranged/controls/functions/'){
                    if(!baseURL) baseURL = '';
                    if(url.indexOf(baseURL + oldName) !== -1){
                        url = i.replaceAll(url,baseURL + oldName,baseURL + newName);
                        data && data.setImage(url);
                        data && data.ca('symbol',url)
                    }
                }
                __folderChanged('更多','01-常用');
                __folderChanged('数学逻辑计算','02-数学逻辑计算');
                
                __folderChanged('数组常规操作','03-数组和组件操作');
                __folderChanged('数组常规操作/组件转换为表单','03-数组和组件操作/获取组件表单数据');//2405802，修改了组件名称！！要兼容旧的
                __folderChanged('03-数组常规操作','03-数组和组件操作');//2405802，再次兼容

                __folderChanged('JSON格式转换','04-JSON格式转换');
                __folderChanged('接口数据格式转换','05-接口数据格式转换');

                __folderChanged('复杂数组格式转换','06-复杂数组格式转换');
                __folderChanged('复杂数组格式转换/数值列表转成数字数组','06-复杂数组格式转换/数字数组转成数值列表');//2405806，合并了组件。待测试！
                __folderChanged('复杂数组格式转换/数组列表到对象列表 对象字段提取','06-复杂数组格式转换/对象列表到数组列表 对象值组提取');//2405806，合并了组件。待测试！

                __folderChanged('超链接等操作相关','07-超链接等操作相关');
                __folderChanged('字符串相关操作','08-字符串相关操作');
                __folderChanged('GIS地图坐标转换','09-GIS地图操作');
                __folderChanged('编辑器操作','10-编辑器操作');

                __folderChanged('interfaces/api','interfaces/接口',null); //240807，接口组件名称从api修改为接口。
                __folderChanged('symbols/develop/uiotos/interface/interface','symbols/develop/uiotos/arranged/controls/interfaces/接口',null); //240807，接口组件名称从api修改为接口。
                return url;
            },
            //240801，产生UUID
            generateUUID: function () {
                var d = new Date().getTime(); //Timestamp
                var d2 = (performance && performance.now && (performance.now()*1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16; //random number between 0 and 16
                    if(d > 0) { //Use timestamp until depleted
                        r = (d + r)%16 | 0;
                        d = Math.floor(d/16);
                    } else { //Use microseconds since page-load if supported
                        r = (d2 + r)%16 | 0;
                        d2 = Math.floor(d2/16);
                    }
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            },
            //240804，判断字符串是否有中文！
            hasChinese:function (str) {
                const pattern = /[\u4e00-\u9fa5]/g; // 匹配中文字符的正则表达式
                return pattern.test(str);
            },
            //240804，判断数组类型属性编辑时，是否仅仅指定索引值发生变化？
            isArrIndexChangeOnly: function(e,index){
                let oldVal = e.oldValue,
                    newVal = e.newValue;
                if(isArrayFn(oldVal) && isArrayFn(newVal) && oldVal.length == newVal.length){
                    let yestmp = true;
                    newVal.forEach((item,idx)=>{
                        //240804，如果指定索引，新旧值相等，那么肯定为false
                        if(idx === index && item === oldVal[idx]) yestmp = false;
                        //240804，如果其他索引位置，新旧值存在不相等，那么也肯定为false，本函数目标是判断仅仅指定索引的值发生变化！
                        else if(idx !== index && item !== oldVal[idx]) yestmp = false;
                    });
                    return yestmp;
                }else return false;
            },
            //字段不是__upper这个无效字段！
            __isKeyParsingValid:function (key){
                return !key || !(key == '__upper' || (key.length > 8 && key.slice(-8) == '.__upper'));
            },
            //['flatWhole', 'structWhole','structKeysConst','structValToObj','structValToStr']
            /*参数说明：
            1）isObjInputing为true时，表示传入的是obj的值，keys和values需要跟其保持同步；
            2）isObjInputing为false时，则时keys或values输入，obj需要动态修改保持与其同步！
            3）isObjInputing为默认null时，通常按照obj、keys/value当前传入值，或者默认空值，自动判断是哪个传入状态！*/
            objectToKeyValues: function(obj = {},keys = [],values = [],isObjInputing = null,mode = 0){
                try{
                //240813，对于非常规对象的，尤其是图元对象（有些工具函数会给inputs传入），此时不做任何处理，直接退出！也不改变！
                if(i.isHtNodeData(obj)) return;
                console.assert(!isArrayFn(obj));

                if(isObjInputing === null){ //240809，自动判断！
                    if(
                        !i.isObjEmpty(obj) &&  //obj不为空
                        (keys.length == 0 || values.length == 0) //240809，键值组至少一个为空
                    ){
                        isObjInputing = true;
                    }else if(
                        i.isObjEmpty(obj) && obj !== null &&    //240809，确保就是初始的{}
                        (keys.length > 0 || values.length > 0) //240809，至少一个输入了键或值
                    ){
                        isObjInputing = false;
                    }else {
                        console.assert(0); //240809，其他情况，抛出异常先！
                        isObjInputing = false; //240809，同时还是默认给一个false值！
                    }
                }
                //字段不是__upper这个无效字段！
                let __isKeyValid = i.__isKeyParsingValid;

                switch(mode){
                    case 0: //flatWhole。不论是obj对象值还是keys/values，都不会确保不变，而是以实际的对象为准，并且按照这里配置，全部扁平化（注意：对象字符串值，当普通字符串！）再来各自对应！自动适配实际数据！
                        if(isObjInputing){  //1）如果是obj输入，但是要扁平化，所以在同步给keys、values时，立刻自身都被回写成扁平化的！注意，对象字段为keyURL，一层扁平结构，而不是多级对象结构！
                            let valueFlat = convertToFlatJson(obj,'.');
                            i.objClear(obj);
                            i.objOverwrite(obj,valueFlat);
                            i.arrClear(keys);
                            i.arrClear(values);
                            for(let key in valueFlat){
                                if(__isKeyValid(key)) {
                                    keys.push(key);
                                    values.push(valueFlat[key]);
                                }
                            }
                        }else{//2）如果是keys/values的输入，那么自身不变，同步扁平化的对象给到obj。注意，对象字段为keyURL，一层扁平结构，而不是多级对象结构！
                            i.objClear(obj);    //240809，注意，这里不能用随便定义的一个对象，比如let targetObj = {}来传入，因为此时引用就失效了！！
                            keys.forEach((key,idx)=>{
                                obj[key] = values[idx];
                            });
                            //240809，注意，这里需要用递归！！因为存在keys、values输入的可能不是完全展开的，而是存在值为结构的！那么也会对实际的对象扁平化，再回写到keys、values上自动展开！！
                            i.objectToKeyValues(obj,keys,values,true,mode); 
                        }
                        break;
                    case 1: //structWhole。不论是obj对象值还是keys/values，都不会确保不变，而是以实际的对象为准，并且按照这里配置，全部结构化（注意：对象字符串值，当普通字符串！）后再来各自对应！自动适配实际数据！
                        if(isObjInputing){  //1）如果是obj输入，但是要扁平化，所以在同步给keys、values时，立刻自身都被回写成扁平化的！注意，对象字段为keyURL，一层扁平结构，而不是多级对象结构！
                            let valueTree = convertToTreeJson(obj,'.');
                            i.objClear(obj);
                            i.objOverwrite(obj, valueTree);
                            i.arrClear(keys);
                            i.arrClear(values);
                            let valueFlat = convertToFlatJson(valueTree,'.');
                            for(let key in valueFlat){
                                if(__isKeyValid(key)) {   //240809，存在extra.__upper:()=>parent的情况，因此判断extra.__upper，取末尾的8个字符与._upper比较
                                    keys.push(key);
                                    values.push(valueFlat[key]);
                                }
                            }
                        }else{//2）如果是keys/values的输入，那么自身不变，同步扁平化的对象给到obj。注意，对象字段为keyURL，一层扁平结构，而不是多级对象结构！
                            i.objClear(obj);    //240809，注意，这里不能用随便定义的一个对象，比如let targetObj = {}来传入，因为此时引用就失效了！！
                            keys.forEach((key, idx)=>{
                                obj[key] = values[idx];
                            });
                            //240809，注意，这里需要用递归！！因为存在keys、values输入的可能不是完全展开的，而是存在值为结构的！那么也会对实际的对象扁平化，再回写到keys、values上自动展开！！
                            i.objectToKeyValues(obj,keys,values,true,mode); 
                        }
                        break;
                    case 2: //structKeysConst。这里保持keys字段的名称、数量、位置都不变，不再自动展开，严格按照此前设置的！对应到obj的对象，是结构化的（注意：对象字符串值，还是当普通字符串！）
                        if(isObjInputing){  //1）如果是obj输入，但是要扁平化，所以在同步给keys、values时，立刻自身都被回写成扁平化的！注意，对象字段为keyURL，一层扁平结构，而不是多级对象结构！
                            if(keys.length == 0){//240809，如果原本要设置固定字段的keys为空，那么久自动全扁平化填充！随后再以此来固定！！
                                let objCopyedTmp = convertToTreeJson(obj,'.');//240810，先结构化，因为之前可能obj时扁平化的keyURL。
                                i.objClear(obj);
                                i.arrClear(values); //240810，强制清理下
                                for(let key in objCopyedTmp){
                                    if(__isKeyValid(key)){
                                        keys.push(key);
                                        values.push(objCopyedTmp[key]);
                                        obj[key] = objCopyedTmp[key];
                                    }
                                }
                            }else{//240809，正常情况下，都是保持keys设定的不变，动态改变填充对应的values字段值！！
                                let valueTree = convertToTreeJson(obj,'.');
                                i.objClear(obj);
                                // i.arrClear(keys); //这里可要保持不变！！
                                i.arrClear(values);
                                let targetObj = {};
                                keys.forEach((key,idx)=>{
                                    if(__isKeyValid(key)){
                                        //240809，这里obj回写，此前objClear清理，这样多余的字段就去掉了，跟keys/values保持一致！
                                        targetObj[key] = values[idx] = i.stepValue(valueTree,key); //240809，极为重要！因为这里可能不只是全部扁平展开的字段！！值可能是有对象结构的，要按照这里来才行！
                                    }
                                });
                                i.objOverwrite(obj,convertToTreeJson(targetObj,'.'));
                            }
                        }else{//2）如果是keys/values的输入，那么自身不变，同步扁平化的对象给到obj。注意，对象字段为keyURL，一层扁平结构，而不是多级对象结构！
                            i.objClear(obj);    //240809，注意，这里不能用随便定义的一个对象，比如let targetObj = {}来传入，因为此时引用就失效了！！
                            keys.forEach((key, idx)=>{
                                obj[key] = values[idx];
                            });
                            //240809，注意，这里需要用递归！！
                            i.objectToKeyValues(obj,keys,values,true,mode); 
                        }
                        break;
                    case 3: //structValToObj。在模式2的基础上，保持keys完全不变，将values中字符串对象文本，转换成对象值，再同步给obj对象！
                    case 4: //structValToStr。跟模式3类似，都是对模式2中的values作调整，只是模式3是将字符串转成对象，这里是将对象转成字符串文本值！其他一样！
                        i.objectToKeyValues(obj,keys,values,isObjInputing,2); //首先按照模式2，即structKeysConst整个交过去调整下，随后再处理对应的值。因此传入时isObjInputing也原始值带过去！！
                        values.forEach((val,idx)=>{
                            let newIndexedVal = val;
                            try {
                                newIndexedVal = (mode == 3 ? i.jsonParse(val) : (isObject(val) ? JSON.stringify(val, null, 4) : val));  //240809，逐个强制转换成对象（常规的无所谓转一下还是原始值，但是对象字符串文本，就通过这里转换成对象了！）。
                            } catch (ex) {}
                            values[idx] = newIndexedVal;
                        });
                        i.objClear(obj);
                        i.objectToKeyValues(obj,keys,values,false,2); //通过模式2，再回写同步给obj
                        break;
                    default:
                        break;    
                }
                }catch(e){
                    console.error(e);
                }
            },
            //241102，对某个图元组件自动布局
            setDataAutoLayout: function(data, baseNode = null){
                let nodeLaying = data,
                    basetmp = baseNode ? baseNode : i.baseNode(nodeLaying,false);
                //吸附布局下，不再允许独立移动（好不容易调整尺寸位置再做了相对位置的自动布局，编辑时怎么又能轻易游离拖动呢？）
                nodeLaying.s('2d.movable', false);
                nodeLaying.setHost && nodeLaying.setHost(basetmp);
                //按矩形内部来考虑，计算离base底层图元的四个边距
                let w = basetmp.getWidth(),
                    h = basetmp.getHeight();
                let leftSpace = _i.getPos(nodeLaying).x - _i.getPos(basetmp).x,
                    rightSpace = _i.getPos(basetmp).x + w - _i.getPos(nodeLaying).x - nodeLaying.getWidth(),
                    topSpace = _i.getPos(nodeLaying).y - _i.getPos(basetmp).y,
                    bottomSpace = _i.getPos(basetmp).y + h - _i.getPos(nodeLaying).y - nodeLaying.getHeight(),
                    centerRatio = 1.5;//3。241102，优先居中而不是左右、上下

                /*230203，自动布局规则，需要进一步细化以及拖放交互动画过渡自动完成，需要结合这里进一步完善！*/
                if (rightSpace > w / 2 && bottomSpace > h / 2) { //1) 左上吸附
                    nodeLaying.s('layout.h', 'left');
                    nodeLaying.s('layout.v', 'top');
                } else if (rightSpace > w / 2 && topSpace > h / 2) { //2) 左下吸附
                    nodeLaying.s('layout.h', 'left');
                    nodeLaying.s('layout.v', 'bottom');
                } else if (leftSpace > w / 2 && bottomSpace > h / 2) { //3) 右上吸附
                    nodeLaying.s('layout.h', 'right');
                    nodeLaying.s('layout.v', 'top');
                } else if (leftSpace > w / 2 && topSpace > h / 2) { //4) 右下吸附
                    nodeLaying.s('layout.h', 'right');
                    nodeLaying.s('layout.v', 'bottom');
                } else if (leftSpace <= w / 2 && rightSpace <= w / 2 && bottomSpace > h / 2) { //5) 左&右，上
                    //230814，在上&下、左&右的地方，判断图元宽高
                    nodeLaying.s('layout.h', nodeLaying.getWidth() < w / centerRatio && Math.abs(nodeLaying.getPosition().x - basetmp.getPosition().x) <= 10 ? 'center' : 'leftright');
                    nodeLaying.s('layout.v', 'top');
                } else if (leftSpace <= w / 2 && rightSpace <= w / 2 && topSpace > h / 2) { //6) 左&右，下
                    nodeLaying.s('layout.h', nodeLaying.getWidth() < w / centerRatio && Math.abs(nodeLaying.getPosition().x - basetmp.getPosition().x) <= 10 ? 'center' : 'leftright');
                    nodeLaying.s('layout.v', 'bottom');
                } else if (rightSpace > w / 2 && topSpace <= h / 2 && bottomSpace <= h / 2) { //7) 左，上&下
                    nodeLaying.s('layout.h', 'left');
                    nodeLaying.s('layout.v', _i.hasFixedHeight(nodeLaying) ? 'top' : (nodeLaying.getHeight() < h / 2 && Math.abs(nodeLaying.getPosition().y - basetmp.getPosition().y) <= 10 ? 'center' : 'topbottom'));
                } else if (leftSpace > w / 2 && topSpace <= h / 2 && bottomSpace <= h / 2) { //8) 右，上&下
                    nodeLaying.s('layout.h', 'right');
                    nodeLaying.s('layout.v', (nodeLaying.getHeight() < h / centerRatio ? 'center' : 'topbottom'));
                } else if (leftSpace <= w / 2 && rightSpace <= w / 2 && topSpace <= h / 2 && bottomSpace <= h / 2) { //9) 左&右，上&下
                    nodeLaying.s('layout.h', nodeLaying.getWidth() < w / centerRatio && Math.abs(nodeLaying.getPosition().x - basetmp.getPosition().x) <= 10 ? 'center' : 'leftright');
                    nodeLaying.s('layout.v', _i.hasFixedHeight(nodeLaying) ? 'top' : (nodeLaying.getHeight() < h / centerRatio && Math.abs(nodeLaying.getPosition().y - basetmp.getPosition().y) <= 10 ? 'center' : 'topbottom'));
                }
            },
        }
        /*
        //231017，安装记忆的函数。暂未启用。
        i.memoryFuncList = {  
            iotos: [    
                'getAttrFormTypedValueUpperLatest',     
                'hasLoopCycle',
                'hasAttrObjectKey',
                'attrsFormBinded',
                'getFormDatas',
                'attr',
                'attrValueFiltered',
                'arrKeyMerged',
                'formValues',
                'isEqual',
                'values',
                'getValue',
                'convertNodeToTreeDatas',
                'arrFindIndex',
                'arrKeyValues',
                'arrKeysAll',
                'syncAttrsAll',
                'convertNodeToTreeDatas',
                'treeDatasVisible',
                'getDataJson',
                'attrObject',
                'isStringNumber',
                'getDatasByName',
                'innerNotifyUpper',
                'getNodeAsBase',
                'parentRoot',
                'toJsonFirstLayer',
                'isSimpleData',
                'isJsonWithOneLayer',
                'getChildren',
                'arrExpandByFirst',
                'getBindedAttrValueType',
                'parentObject',
                'innerDataModel',
                'upperData',
                'innerData',
                'isControlTyped',
                'isLayered',
                'getTreeItemsById',
                'hasInner',
                'bottomData'
            ],
            // 文件中定义的函数，如果在其他函数内去修改函数实现？？？暂未处理，手动枚举调用！不过这里也要罗列出来，方便堆栈调用时，能够查找
             others: [ 
                'convertToFlatJson',     
                'mergeJSON',     
                'convertArrListToJsonTree',     
                'convertToTreeJson',
                'looseEqual',
                'adjustNumKeyToArray'
            ]
        };

        //1）批量对i下定义的函数安装记忆
        i.memoryFuncList.iotos.forEach(funcName => {  
            i[funcName] = i.installMemory(i[funcName], funcName);
        });
        //2）文件中定义的函数手动枚举安装记忆
        convertToFlatJson = i.installMemory(convertToFlatJson, 'convertToFlatJson');
        mergeJSON = i.installMemory(mergeJSON, 'mergeJSON');
        convertToTreeJson = i.installMemory(convertToTreeJson, 'convertToTreeJson');
        convertArrListToJsonTree = i.installMemory(convertArrListToJsonTree, 'convertArrListToJsonTree');
        looseEqual = i.installMemory(looseEqual, 'looseEqual');
        adjustNumKeyToArray = i.installMemory(adjustNumKeyToArray, 'adjustNumKeyToArray');
        isInnerChild = i.installMemory(isInnerChild, 'isInnerChild');

        i.memoryFuncList = {  
            iotos: [    
                'getFormValues',
                'getFormDatas',
                'getAttrFormTypedValueUpperLatest',     
                'hasLoopCycle',
                'hasAttrObjectKey',
                'attrsFormBinded',
                'getFormDatas',
                'getTreeItemsById',
                'hasInner',
                'bottomData',
                'innerData'
            ],
            // 文件中定义的函数，如果在其他函数内去修改函数实现？？？暂未处理，手动枚举调用！不过这里也要罗列出来，方便堆栈调用时，能够查找
             others: [ 
                'convertToFlatJson',     
                'mergeJSON',     
                'convertArrListToJsonTree',     
                'convertToTreeJson',
                'looseEqual',
                'adjustNumKeyToArray'
            ]
        };

        //1）批量对i下定义的函数安装记忆
        i.memoryFuncList.iotos.forEach(funcName => {  
            i[funcName] = i.installMemory(i[funcName], funcName);
        });

        //2）文件中定义的函数手动枚举安装记忆
        convertToFlatJson = i.installMemory(convertToFlatJson, 'convertToFlatJson');
        mergeJSON = i.installMemory(mergeJSON, 'mergeJSON');
        convertToTreeJson = i.installMemory(convertToTreeJson, 'convertToTreeJson');
        convertArrListToJsonTree = i.installMemory(convertArrListToJsonTree, 'convertArrListToJsonTree');
        looseEqual = i.installMemory(looseEqual, 'looseEqual');
        adjustNumKeyToArray = i.installMemory(adjustNumKeyToArray, 'adjustNumKeyToArray');
        isInnerChild = i.installMemory(isInnerChild, 'isInnerChild');bottomtmp._i_initialLoading
                'syncAttrsAll',
                'convertNodeToTreeDatas',
                'treeDatasVisible',
                'getDataJson',
                'attrObject',
                'isStringNumber',
                'getDatasByName',
                'innerNotifyUpper',
                'getNodeAsBase',
                'parentRoot',
                'toJsonFirstLayer',
                'isSimpleData',
                'isJsonWithOneLayer',
                'getChildren',
                'arrExpandByFirst',
                'getBindedAttrValueType',
                'parentObject',
                'innerDataModel',
                'upperData',
                'innerData',
                'isControlTyped',
                'isLayered',
                'getTreeItemsById',
                'hasInner',
                'bottomData'
            ],
            // 文件中定义的函数，如果在其他函数内去修改函数实现？？？暂未处理，手动枚举调用！不过这里也要罗列出来，方便堆栈调用时，能够查找
             others: [ 
                'convertToFlatJson',     
                'mergeJSON',     
                'convertArrListToJsonTree',     
                'convertToTreeJson',
                'looseEqual',
                'adjustNumKeyToArray'
            ]
        };

        //1）批量对i下定义的函数安装记忆
        i.memoryFuncList.iotos.forEach(funcName => {  
            i[funcName] = i.installMemory(i[funcName], funcName);
        });
        //2）文件中定义的函数手动枚举安装记忆
        convertToFlatJson = i.installMemory(convertToFlatJson, 'convertToFlatJson');
        mergeJSON = i.installMemory(mergeJSON, 'mergeJSON');
        convertToTreeJson = i.installMemory(convertToTreeJson, 'convertToTreeJson');
        convertArrListToJsonTree = i.installMemory(convertArrListToJsonTree, 'convertArrListToJsonTree');
        looseEqual = i.installMemory(looseEqual, 'looseEqual');
        adjustNumKeyToArray = i.installMemory(adjustNumKeyToArray, 'adjustNumKeyToArray');
        isInnerChild = i.installMemory(isInnerChild, 'isInnerChild');

        i.memoryFuncList = {  
            iotos: [    
                // 'getFormValues',
                // 'getFormDatas',
                // 'getAttrFormTypedValueUpperLatest',     
                // 'hasLoopCycle',
                // 'hasAttrObjectKey',
                // 'attrsFormBinded',
                // 'getFormDatas',
                // 'getTreeItemsById',
                // 'hasInner',
                // 'bottomData',
                // 'innerData'
            ],
            // 文件中定义的函数，如果在其他函数内去修改函数实现？？？暂未处理，手动枚举调用！不过这里也要罗列出来，方便堆栈调用时，能够查找
             others: [ 
            // 'convertToFlatJson',     
            // 'mergeJSON',     
            // 'convertArrListToJsonTree',     
            // 'convertToTreeJson',
            // 'looseEqual',
            // 'adjustNumKeyToArray'
            ]
        };

        //1）批量对i下定义的函数安装记忆
        i.memoryFuncList.iotos.forEach(funcName => {  
            i[funcName] = i.installMemory(i[funcName], funcName);
        });

        //2）文件中定义的函数手动枚举安装记忆
        convertToFlatJson = i.installMemory(convertToFlatJson, 'convertToFlatJson');
        mergeJSON = i.installMemory(mergeJSON, 'mergeJSON');
        convertToTreeJson = i.installMemory(convertToTreeJson, 'convertToTreeJson');
        convertArrListToJsonTree = i.installMemory(convertArrListToJsonTree, 'convertArrListToJsonTree');
        looseEqual = i.installMemory(looseEqual, 'looseEqual');
        adjustNumKeyToArray = i.installMemory(adjustNumKeyToArray, 'adjustNumKeyToArray');
        isInnerChild = i.installMemory(isInnerChild, 'isInnerChild');bottomtmp._i_initialLoading
    */