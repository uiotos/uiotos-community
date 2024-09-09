//230311，重写JSON.stringify()，清理循环引用
if (typeof jsonStringify == 'undefined') {
    //备份原生实现版本，注意，避免重复进入定义
    var jsonStringify = JSON.stringify;
    JSON.stringify = function(jsonObject, replacer = undefined, space = 2) {
        function __replacer(key, value) {
            if (key === '__upper' && typeof(value) == 'function') return undefined;
            else if (i.isWinOrNodeObj && i.isWinOrNodeObj(value) && i.hasLoopCycle(value, true)) return value.getTag ? i.autoTag(value) : undefined;
            else if (replacer) return replacer(key, value);
            else return value;
        }
        let result = jsonStringify(jsonObject, __replacer, space);
        return result;
    };
}

//240626，数组.at()是ECMAScript 2022才引入的新特性，不是所有浏览器都支持！！因为有用到，避免报错，这里做兼容！！
if (!Array.prototype.at) {
    Array.prototype.at = function(atIndex) {
        if (atIndex < 0) atIndex += this.length;
        if (atIndex < 0 || atIndex >= this.length) {
            throw new Error('out of range');
        }
        return this[atIndex];
    };
}

//240513，鼠标左键是否按下
if (typeof isLeftMouseDown == 'undefined') {
    var isLeftMouseDown = undefined;
    // 添加 mousedown 事件监听器，用于标记左键被按下
    window.top.document.addEventListener('mousedown', (event) => {
        if (event.button === 0) { // button === 0 表示左键
            isLeftMouseDown = true;
        }
    });
    // 添加 mouseup 事件监听器，用于标记左键被释放
    window.top.document.addEventListener('mouseup', (event) => {
        if (event.button === 0) {
            isLeftMouseDown = false;
        }
    });
}

/*230311，重写ht.Default.clone，过滤window全局对象的赋值*/
if (typeof htClone == 'undefined') {
    //备份原生实现版本，注意，避免重复进入定义，外层判断只有初始undefined时才行，且内容定义需要var，不能省去也不能用let
    var htClone = ht.Default.clone;
    ht.Default.clone = function(obj) {
        if (i.isWindow(obj) || i.isHtNodeData(obj)) {
            return obj;
        } else {
            return htClone(obj);
        }
    };
}

/*230311，重新定义layer.load()、layer.msg()、layer.closeAll()等方法*/
if (typeof mylayer == "undefined") {
    var mylayer = {
        msg: (content, layuiParam = null, type = 0, title = null, region = 'top', fixedWidth = null, duration = 1000) => {
            let param = {
                content,
                title,
                region,
                // background: '#c95e58',
                background: 'rgba(55,125,255,0.8)',
                titleColor: '#fff',
                contentColor: '#fff',
                closeIcon: null,
                duration
            };
            if (typeof content != 'string') content = i.ify(content); //230526，如果传入的不是字符串，而是数字、json对象，下面会报错，因此这里进行强制转换！
            (type == 0 || typeof type == 'string' && type.toLowerCase() == 'msg') && ht.Default.showMessage(param); //显示消息提醒
            (type == 1 || typeof type == 'string' && type.toLowerCase() == 'success') && ht.Default.successMessage(content, title, region, fixedWidth, duration); //显示成功消息
            (type == 2 || typeof type == 'string' && type.toLowerCase() == 'info') && ht.Default.infoMessage(content, title, region, fixedWidth, duration); //显示提示消息
            (type == 3 || typeof type == 'string' && type.toLowerCase() == 'warn') && ht.Default.warnMessage(content, title, region, fixedWidth, duration); //显示警告消息
            (type == 4 || typeof type == 'string' && type.toLowerCase() == 'error') && ht.Default.errorMessage(content, title, region, fixedWidth, duration); //显示错误消息
        },
    }
    layer.msg = mylayer.msg;
}

/**
 *对Date的扩展，将 Date 转化为指定格式的String
 *月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 *年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 *例子：
 *(new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 *(new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
 */
Date.prototype.Format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, // 月份
        "d+": this.getDate(), // 日
        "h+": this.getHours(), // 小时
        "m+": this.getMinutes(), // 分
        "s+": this.getSeconds(), // 秒
        "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
        "S": this.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//统计字符串中字符个数
String.prototype.charsCount = function(cnEnDiff = false) {
    var len = 0;
    for (var i = 0; i < this.length; i++) {
        if (cnEnDiff) {
            if (this.charCodeAt(i) > 127 || this.charCodeAt(i) == 94) {
                len += 2;
            } else {
                len++;
            }
        } else {
            len++
        }
    }
    return len;
}

//replaceAll 方法是在 ES2021 规范中引入的，而一些旧版本的浏览器可能不支持该方法。如果要在不支持 replaceAll 方法的旧浏览器中使用该方法！
//给string对象添加原型方法replaceAll()，默认内置的replace()只是替换匹配到的第一个！
String.prototype.replaceAll = function(search, replace) {
    return this.split(search).join(replace);
}

//对数组array []，增加remove方法,遍历整个数组，返回的是个新的数组，是原数组的引用；
function removeItem(arr, item) {
    var result = [],
        isType = Object.prototype.toString,
        isPass, val;
    for (var inx = 0, len = arr.length; inx < len; inx++) {
        isPass = true;
        val = arr[inx];
        if (isType.call(item) == '[object Array]') {
            for (var ii = 0, iimax = item.length; ii < iimax; ii++) {
                if (val === item[ii]) {
                    isPass = false;
                    break;
                }
            }
        } else if (val === item) {
            isPass = false;
        }
        if (isPass) {
            result.push(val);
        }
    }
    return result;
}

//临时先用起来，前面两个同名removeItem的bug还有待修复
function removeArrayItem(arr, item, result = []) { //返回移除的匹配的索引列表[]，新数组由数组通过引用传参返回！
    let indexsRemoved = [],
        isType = Object.prototype.toString,
        isPass, val;
    for (var inx = 0, len = arr.length; inx < len; inx++) {
        isPass = true;
        val = arr[inx];
        if (isType.call(item) == '[object Array]') {
            for (var ii = 0, iimax = item.length; ii < iimax; ii++) {
                if (val === item[ii]) {
                    isPass = false;
                    indexsRemoved.push(inx);
                    break;
                }
            }
        } else if (val === item) {
            isPass = false;
            indexsRemoved.push(inx);
        }
        if (isPass) {
            result.push(val);

        }
    }
    return indexsRemoved;
}

//移除字符串的收尾空格
function trim(str) {
    var result;
    if (str) {
        result = str.replace(/(^\s+)|(\s+$)/g, "");
        // result = str.replace(/\s/g,""); // 去除字符串全部空格
    }
    return result ? result : '';
}

function jsonObjLength(jsonObj) {
    var Length = 0;
    for (var item in jsonObj) {
        Length++;
    }
    return Length;
}

// Warn if overriding existing method
if (Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function(array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        } else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};

function isObject(obj) {
    return obj !== null && typeof obj === 'object'
}
//js 判断任意对象是否相等
function looseEqual(a, b) {
    if (a === b) {
        return true
    }
    var isObjectA = isObject(a);
    var isObjectB = isObject(b);
    if (isObjectA && isObjectB) {
        try {
            var isArrayA = Array.isArray(a);
            var isArrayB = Array.isArray(b);
            if (isArrayA && isArrayB) {
                return a.length === b.length && a.every(function(e, i) {
                    return looseEqual(e, b[i])
                })
            } else if (a instanceof Date && b instanceof Date) {
                return a.getTime() === b.getTime()
            } else if (!isArrayA && !isArrayB) {
                var keysA = i.keys(a); //tips 231028，i.keys()会移出掉__upper:()=>{}
                var keysB = i.keys(b);
                return keysA.length === keysB.length && keysA.every(function(key) {
                    return looseEqual(a[key], b[key])
                })
            } else {
                /* istanbul ignore next */
                return false
            }
        } catch (e) {
            /* istanbul ignore next */
            return false
        }
    } else if (!isObjectA && !isObjectB) {
        return String(a) === String(b)
    } else {
        return false
    }
}

// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {
    enumerable: false
});


//模板引擎注册等于操作
Handlebars.registerHelper('if_eq', function(v1, v2, opts) {
    if (v1 == v2)
        return opts.fn(this);
    else
        return opts.inverse(this);
});

function randomNum(minNum, maxNum) {
    switch (arguments.length) {
        case 1:
            return parseInt(Math.random() * minNum + 1, 10);
            break;
        case 2:
            return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
            break;
        default:
            return 0;
            break;
    }
}

function hasKey(object, key) {
    var AllKey = Object.keys(object);
    if (AllKey.indexOf(key) != -1) {
        return true;
    } else {
        return false;
    }
}

function alertDialog(callback, content = '确定操作？', title = '提示') {
    var dialog = new ht.widget.Dialog();
    var buttons = [];
    buttons.push({
        label: '取消',
        action: function action() {
            dialog.hide();
        }
    }, {
        label: '确定',
        action: function action() {
            callback()
            dialog.hide()
        }
    });
    dialog.setConfig({
        title: title,
        draggable: true,
        width: 240,
        height: 120,
        contentPadding: 10,
        content: content,
        contentColor: '#ffff',
        buttons: buttons,
        buttonsAlign: 'right',
        // color: 'white'
    });
    dialog.show();
}

function fanFlowAnim(dataModel) {
    //1、管道流动动画通用代码
    flowTask = {
        interval: 40,
        action: function(data) {
            var tag = data.getTag();
            if (tag) {
                // 左流动
                if (tag.startsWith && tag.startsWith('flowReduce')) { //管道左流动的tag为“flowReduce”
                    if (data.a('switch') == true) {
                        data.s('shape.dash.offset', data.s('shape.dash.offset') + 1);
                    }
                }
                // 右流动
                if (tag.startsWith && tag.startsWith('flowAdd')) { //管道左流动的tag为“flowAdd”
                    if (data.a('switch') == true) {
                        data.s('shape.dash.offset', data.s('shape.dash.offset') - 1);
                    }
                }
            }
        }
    };
    dataModel.addScheduleTask(flowTask); //管道流动调度
}
function updateDateTimeNode(dataModel, timeArr = [], dateArr = [], weekArr = []) {
    //240608，增加参数timeArr、dateArr、weekArr传入，这样可以共用其他地方的dm.each遍历！
    timeArr.length == 0 && dataModel.each(node => {
        let dataBindings = node.getDataBindings();
        if (dataBindings) {
            for (let name in dataBindings.a) {
                var db = dataBindings.a[name];
                if (db.id == 'iotos.date') {
                    dateArr.push({
                        node,
                        prop: name
                    })
                } else if (db.id == 'iotos.week') {
                    weekArr.push({
                        node,
                        prop: name
                    })
                } else if (db.id == 'iotos.time') {
                    timeArr.push({
                        node,
                        prop: name
                    })
                }
                //过滤函数
                // if (db.func) {
                //     value = db.func(value);
                // }
                // data.a(name, value)
            }
        }
    })
    setInterval(() => {
        // 时间更新
        var titleDate = dataModel.getDataByTag('date'); // 日期
        var titleTime = dataModel.getDataByTag('time'); // 时间
        var titleWeek = dataModel.getDataByTag('week'); // 星期
        var titleDateTime = dataModel.getDataByTag('date_time'); // 日期+时间
        var time = getTimeFormat()
        var currentTime = time.hour + ':' + time.minu + ':' + time.sec;
        var currentDate = time.year + '-' + time.month + '-' + time.date;
        var currentWeek = time.week;
        var currentDateTime = currentDate + '   ' + currentTime
        if (titleDate) titleDate.s('text', currentDate); // 设置当前日期
        if (titleTime) titleTime.s('text', currentTime); // 设置当前时间
        if (titleWeek) titleWeek.s('text', currentWeek); // 设置当前星期
        if (titleDateTime) titleDateTime.s('text', currentDateTime); // 设置当前日期+时间

        //绑定日期、星期、事件系统变量的，进行遍历更新
        dateArr.forEach(date => {
            date.node.a(date.prop, currentDate)
        })
        weekArr.forEach(week => {
            week.node.a(week.prop, currentWeek)
        })
        timeArr.forEach(time => {
            time.node.a(time.prop, currentTime)
        })
    }, 1000)
}
// 时间格式化
function getTimeFormat() {
    var now = new Date();
    var year = now.getFullYear(); // 得到年份
    var month = now.getMonth() + 1; // 得到月份
    var date = now.getDate(); // 得到日期
    var myday = now.getDay(); //获取存储当前日期，再得到星期
    var weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    var hour = now.getHours(); // 得到小时
    var minu = now.getMinutes(); // 得到分钟
    var sec = now.getSeconds();
    var week = weekday[myday] // 得到秒
        // 时分秒格式化
    if (month < 10) month = '0' + month;
    if (date < 10) date = '0' + date;
    if (hour < 10) hour = '0' + hour;
    if (minu < 10) minu = '0' + minu;
    if (sec < 10) sec = '0' + sec;
    return {
        year,
        month,
        date,
        week,
        hour,
        minu,
        sec,
    }
}

//时间戳转换成年月日时分秒
function formatDate(timestamp) {　　
    var date = new Date(timestamp * 1000);
    var year = date.getFullYear().toString().padStart(4, "0");
    var month = (date.getMonth() + 1).toString().padStart(2, "0");
    var day = date.getDate().toString().padStart(2, "0");
    var hour = date.getHours().toString().padStart(2, "0");
    var minute = date.getMinutes().toString().padStart(2, "0");
    var second = date.getSeconds().toString().padStart(2, "0");
    return `${year}- ${month}-${day} ${hour}:${minute}:${second}`;
}
function getHistoryDadaInfoByBindingNode({
    historyNode = null,
    dataNode = {
        node,
        prop,
        type: 'a'
    }
}) {
    let dataInfoTmp = getBindingsInfo({
        node: dataNode.node,
        prop: dataNode.prop,
        type: dataNode.type
    })
    historyNode && historyNode.a('dataInfo', dataInfoTmp)
    return dataInfoTmp
}

//获取节点node对应的iot绑定数据点的全部配置信息
function getBindingsInfo({
    node,
    prop,
    type = 'a'
}) {
    let dataBindName = node.getDataBindings()[type][prop]['id']
    return pointInfo(dataBindName)
}

/**
 * 根据设备和数据点，获取当前接入点点表下对应指定数据点的配置信息
 * @param devDataName {String} 设备名称.数据点名称
 * @returns {*}
 */
function pointInfo(devDataName) {
    if (devDataName.split('.').length == 1) { //如果传入的只是数据点，没有传入当前设备（为了方便起见会有）
        let devices = i.jsonParse(window.sessionStorage.devices)
        let infotmp = undefined
        for (let i = 0; i < devices.length; i++) {
            infotmp = pointInfo(devices[i] + '.' + devDataName) 
            if (infotmp != undefined)
                break //相当于break
        }
        return infotmp
    } else {
        return i.jsonParse(window.sessionStorage.bindingNamesInfo)[devDataName]
    }
}

//从点表解析得出historyData需要的数据结构字典
function saveBindingsInfo(dataTable) {
    let bindingNamesInfo = {}
    let devices = []
    for (let key in dataTable) { //多个网关点表，key-value形式
        let item = dataTable[key]; //1、网关UUID
        for (let ikey in item.properties) { //2、网关下的设备
            devices.push(item.properties[ikey].name)
                //遍历数据节点的设备点和数据点
            let dataArrayTmp = item.properties[ikey].data
            for (let dkey in dataArrayTmp) { //3、设备下的数据点
                let devname = item.properties[ikey].name,
                    dataname = dataArrayTmp[dkey].name
                bindingNamesInfo[devname + '.' + dataname] = {
                        "data_id": dkey, //常用的几个信息
                        "dev_info": devname + '——' + ikey,
                        "devId": ikey,
                        "name": dataname,
                        "val_type": dataArrayTmp[dkey].valuetype,
                        "config": dataArrayTmp[dkey].config
                    }
            }
        }
    }
    //240525，有可能某个账号下点表特别大，比如admin下，生态城客户项目，导致这里保存单条sessionStorage失败！
    try {
        window.sessionStorage.obj = JSON.stringify(dataTable)
        window.sessionStorage.devices = JSON.stringify(devices)
        window.sessionStorage.bindingNamesInfo = JSON.stringify(bindingNamesInfo);
    } catch (error) {
        console.error('is the number of corresponding backend data points is too large?', bindingNamesInfo);
        console.warn(error);
    }
}

//读取P属性，跟a()、s()不同的地方！
function getProperty(node, prop) {
    let proptmp = ht.Default.getter(prop);
    return proptmp && node[proptmp] ? node[proptmp]() : undefined;
}
//设置P属性，跟a()、s()不同的地方！
function setProperty(node, prop, value) {
    return node[ht.Default.setter(prop)](value);
}

//统一进行属性读写操作的API
function __convert(type) {
    if (type == 'a') {
        type = 'attr'
    } else if (type == 's') {
        type = 'style'
    } else if (type != null) {
        console.warn('参数错误,只接收a、s或null：' + type + ' 将强制变为null')
        type = null
    }
    return type
}

function getProp(node, key, type = null) {
    return ht.Default.getPropertyValue(node, __convert(type), key)
}

function setProp(node, key, value, type = null) {
    ht.Default.setPropertyValue(node, __convert(type), key, value);
}
//------------------------------------

function audioPaly(url, repeat = false) {
    let audio = new Audio(url);
    // 循环播放，播放结束继续播放
    $(audio).unbind("ended").bind("ended", function() {
        if (repeat)
            audio.play();
    })
    audio.play();
    return audio
}

// 颜色rgb表示法转化为十六进制表示法
function colorRGB2Hex(color) {
    var rgb = color.split(',');
    var r = parseInt(rgb[0].split('(')[1]);
    var g = parseInt(rgb[1]);
    var b = parseInt(rgb[2].split(')')[0]);
    var hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return hex;
}

//颜色十六进制转RGB
function colorHex2RGB(hex) {
    if (hex[0] != '#') return hex
    let r = parseInt(hex.slice(1, 3), 16)
    let g = parseInt(hex.slice(3, 5), 16)
    let b = parseInt(hex.slice(5, 7), 16)
    let hasOpacity = hex.length == 10;
    let a = hasOpacity ? parseInt(hex.slice(7, 9), 16) : undefined;
    let res = 'rgba(' + r + ',' + g + ',' + b + (hasOpacity ? ',' + a : '') + ')';
    return res
}

//230408，颜色名称转成十六进制，依赖于custom/libs/json/color.js中的对照表
function colorName2Hex(name) {
    return window.webColors[name.trim().toLowerCase()]
}
//230408，不论传入rgb/hex/name，最后都输出rgba
function colorAutoToRGBA(color) {
    if (color == null) return rgba(0, 0, 0, 0);
    if (color[0] == '#') { //1）十六进制，tips230408
        return rgba(colorHex2RGB(color), 1); //十六进制不能表示透明度默认不透明？？？暂未深究，按不透明处理
    } else if (color.indexOf('(') != -1 && color.toLowerCase().slice(0, 3) == 'rgb') { //2）RGB，tips230408；240204，加上条件&& color.toLowerCase().slice(0,3) == 'rgb'，避免字符串"()"也被当成是颜色rgb字符串！
        return rgba(color, rgbaNum(color, 3));
    } else { //3）颜色名称name
        return rgba(colorHex2RGB(colorName2Hex(color)), 1);
    }
}

//230410，任意颜色格式，获取透明度，0~1
function colorAutoOpacity(color) {
    return color ? rgbaNum(colorAutoToRGBA(color), 3) : 0;
}

//获取rgba颜色值，0/1/2/3，a为0~1
function rgbaNum(rgba, index) {
    try {
        //230407，支持传入rgb()或#开头的两种颜色格式！
        rgba = colorHex2RGB(rgba);
        let val = rgba.match(/(\d(\.\d+)?)+/g);
        //230407，专门对于rgb(33,44,55)这种缺乏第四个参数（索引为3）时，自动赋为1，即不透明！
        if (index == 3 && val.length == 3) val[3] = 1;
        return Number(val[index]);
    } catch (error) {
        return 1;
    }
}

function rgba(color, alpha) {
    return 'rgba(' + rgbaNum(color, 0) + ',' + rgbaNum(color, 1) + ',' + rgbaNum(color, 2) + ',' + alpha + ')'
}

//不论传入颜色是RGB还是十六进制，统一加上透明度再返回
function rgbaForced(color, alpha = 0.75) { //color可能是rgb、rgba、#等，暂不支持名称，比如white、pink等，需要结合colorNames-ing.js完善以支持！
    if (color == undefined) return undefined;
    if (color[0] == '#') { //1）十六进制，tips230408
        return rgba(colorHex2RGB(color), alpha)
    } else if (color.indexOf('(') != -1) { //2）RGB，tips230408
        return rgba(color, alpha)
    } else { //3）颜色名称name
        return rgba(colorName2Hex(color), alpha);
    }
}

//获取随机颜色，用于调试测试
function randomColor() {
    var arrHex = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
    var strHex = "#";
    var index;
    for (var i = 0; i < 6; i++) {
        index = Math.round(Math.random() * 15);
        strHex += arrHex[index];
    }
    return strHex;
}

//使用递归实现深拷贝
//实现深度克隆---对象/数组
function clone(target) {
    //定义检测数据类型的功能函数
    function checkedType(target) {
        return Object.prototype.toString.call(target).slice(8, -1)
    }
    //判断拷贝的数据类型
    //初始化变量result 成为最终克隆的数据
    let result, targetType = checkedType(target)
    if (targetType === 'object') {
        result = {}
    } else if (targetType === 'Array') {
        result = []
    } else {
        return target
    }
    //遍历目标数据
    for (let i in target) {
        //获取遍历数据结构的每一项值。
        let value = target[i]
            //判断目标结构里的每一值是否存在对象/数组
        if (checkedType(value) === 'Object' ||
            checkedType(value) === 'Array') { //对象/数组里嵌套了对象/数组
            //继续遍历获取到value值
            result[i] = clone(value)
        } else { //获取到value值是基本的数据类型或者是函数。
            result[i] = value;
        }
    }
    return result
}

function isArrayFn(value) {
    if (typeof Array.isArray === "function") {
        return Array.isArray(value);
    } else {
        return Object.prototype.toString.call(value) === "[object Array]";
    }
}

//根据索引移除数组中指定元素，返回移除元素后的数组
//【待排查】，这里跟第44行有重复的的同名函数，而且把此处屏蔽掉，会导致桌面应用图标重入点击打不开，一直转圈加载！
function removeItem(array, index) {
    if (index <= (array.length - 1)) {
        for (var i = index; i < array.length; i++) {
            array[i] = array[i + 1];
        }
    } else {
        throw new Error('超出最大索引！');
    }
    array.length = array.length - 1;
    return array;
}

//根据指定的索引列表，移除数组中相应位置的元素返回新数组
function arrayIndexItemsRemoved(array, indexs) { //indexs为数组形式：[1]、[1,3]等
    let arrNew = [];
    if (!isArrayFn(indexs)) indexs = [indexs];
    array.forEach((item, index) => {
        if (indexs.indexOf(index) == -1) {
            arrNew.push(item)
        }
    })
    return arrNew;
}

function d(dm, tag) {
    return dm.getDataByTag(tag)
}

function get(dm, tag) {
    return d(dm, tag);
}

//尺寸周期反复大小
function sizeAnimRepeat(node, scale = 0.8, duration = 300) {
    let cfgtmp = {
        smaller: {
            from: 1,
            to: scale,
            duration,
            onUpdate(v) {
                node.setScale(v, v);
            },
            next: 'lagger'
        },
        lagger: {
            from: scale,
            to: 1,
            duration,
            onUpdate(v) {
                node.setScale(v, v);
            },
            next: 'smaller'
        },
        start: ['smaller']
    }
    node.setAnimation(cfgtmp)
}

function sizeAnim({
    node,
    param = {
        max: 1.2,
        min: 1,
        flag: false,
        time: 500,
        easing: Easing.easing
    },
    is3d = false
}) {
    ht.Default.startAnim({
        duration: param.time,
        easing: param.easing,
        finishFunc: () => {
            param.flag = !param.flag
            sizeAnim({
                node,
                param,
                is3d
            })
        },
        action: (v) => {
            let max = param.max,
                min = param.min,
                flag = param.flag
            let valtmp = flag ? max - (max - min) * v : min + (max - min) * v
            if (is3d) {
                node.setScale3d({
                    x: valtmp,
                    y: valtmp,
                    z: valtmp
                })
            } else {
                node.setScale({
                    x: valtmp,
                    y: valtmp
                })
            }
        }
    })
}

//node节点背景颜色白底、黑底动画切换
function switchTransparent(node, backgroundColorAttr, fontColorAttr, toTransparent = true) {
    let min = 0;
    let max = 1;
    let that = this
        //目前已经状态是要切换的状态，就不往下执行，避免出现闪动！
    let istransparent = 1 - rgbaNum(node.a(backgroundColorAttr), 3);
    if ((istransparent && toTransparent) || (!istransparent && !toTransparent)) return;

    //背景默认颜色
    let nodeBackgroundDefaultTmp = node.getAttrObject().backgroundDefault;
    if (nodeBackgroundDefaultTmp == undefined) {
        nodeBackgroundDefaultTmp = node.getAttrObject().backgroundDefault = node.a(backgroundColorAttr);
    }

    //文字默认颜色
    let nodeDefaultColorTmp = node.getAttrObject().colorDefault;
    if (nodeDefaultColorTmp == undefined) {
        nodeDefaultColorTmp = node.getAttrObject().colorDefault = node.a(fontColorAttr);
    }

    //名称为"titleBarInvolved"的，也随着颜色变化！但是不走过渡动画
    node.dm().each((data) => {
        if (data.getDisplayName() == 'titleBarInvolved') {
            // data.a(backgroundColorAttr, toTransparent ? 'rgba(255,255,255,0)' : nodeBackgroundDefaultTmp);
            if (data.colorDefault == undefined) data.colorDefault = data.a(fontColorAttr);
            data.a(fontColorAttr, toTransparent ? 'rgba(255,255,255,1)' : /*rgbaForced(data.colorDefault, 0.5)*/ 'gray');
        }
    })

    let r1 = rgbaNum(nodeBackgroundDefaultTmp, 0),
        g1 = rgbaNum(nodeBackgroundDefaultTmp, 1),
        b1 = rgbaNum(nodeBackgroundDefaultTmp, 2);

    let r2 = rgbaNum(nodeDefaultColorTmp, 0),
        g2 = rgbaNum(nodeDefaultColorTmp, 1),
        b2 = rgbaNum(nodeDefaultColorTmp, 2);

    // 动画方式一：
    let animtmp = ht.Default.startAnim({
        // frames: 16,
        // interval: 2, // 动画帧间隔毫秒数
        duration: 200,
        easing: Easing.easeNone,
        // easing: ht.Default.animEasing,
        finishFunc: () => {
            animtmp.stop()
        },
        action: function(v) {
            let valtmp = toTransparent ? min + (max - min) * v : max - (max - min) * v
            node.a(backgroundColorAttr, 'rgba(' + r1 + ',' + g1 + ',' + b1 + ',' + String(1 - valtmp) + ')')
            node.a(fontColorAttr, 'rgb(' + ((255 - r2) * valtmp + r2) + ',' + ((255 - g2) * valtmp + g2) + ',' + ((255 - b2) * valtmp + b2) + ')')
        }
    })
}

function animMove({
    gv,
    tag = '', //不传入tag，那么动画是eye观察视角移动；否则是节点图元移动
    duration = 500,
    frames = 0, //参数为0，那么就是只用时长，不限定帧
    start = null, //对于视角eye移动，只需要传入endpos，起始默认是当前视角位置而不用指定！
    end, //3d坐标是[x,y,z]，2d坐标是[x,y]
    is2d = false, //默认是3d,
    callback = null,
    easing = Easing.easing
}) {
    let nodetmp = gv.dm().getDataByTag(tag)
    let optionstmp = {
        easing: easing,
        finishFunc: callback,
        action: (v) => {
            if (is2d) { //2d
                setProperty(nodetmp, 'position', {
                    x: start[0] + v * (end[0] - start[0]),
                    y: start[1] + v * (end[1] - start[1])
                })
            } else { //3d
                if (nodetmp) {
                    node.p3(new ht.Math.Vector3().lerpVectors(
                        new ht.Math.Vector3(start),
                        new ht.Math.Vector3(end),
                        v).toArray())
                } else {
                    if (start == null) {
                        start = gv.getEye()
                    }
                    gv.setEye(new ht.Math.Vector3().lerpVectors(new ht.Math.Vector3(start), new ht.Math.Vector3(end), v).toArray())
                }
            }
        }
    }
    if (frames <= 0) {
        optionstmp.duration = duration
    } else {
        optionstmp.frames = frames
        optionstmp.interval = duration / frames * 1.0
    }
    return ht.Default.startAnim(optionstmp)
}

/*rect比如[47.5,5,25,25]，是数组格式（图标中对x、y、w、h），统一放到rect中（需要转化    ）对外数据绑定！
对于需要如node.ca('dot.rect',[47.5,5,25,25])这样非API方式来设置图标内位置的，可以通用此函数，实现动画过渡*/
function rectAnim(node, attr, toRectArr, fromRectArr = null, callback = null, duration = 200, easing = 'Cubic.easeOut') {
    fromRectArr = fromRectArr ? fromRectArr : node.ca(attr);
    let animcfg = { //随便以一个node节点data来设置动画！
        trans: {
            from: 0,
            to: 1,
            duration,
            easing, //'Cubic.easeOut'、'Linear'
            onComplete: function() {
                animcfg.trans.onUpdate(1); //避免末尾随即
                callback && callback();
            },
            onUpdate(v) {
                let recttmp = [];
                fromRectArr.forEach((item, index) => {
                    recttmp.push(fromRectArr[index] + (toRectArr[index] - fromRectArr[index]) * v);
                });
                node.ca(attr, recttmp);
            },
        },
        start: ['trans']
    };
    node.dm() && node.dm().enableAnimation(); //注意，该动画函数首先需要dataModel开启动画！
    node.setAnimation(animcfg)
}

function formatDate(date, formatStr) {
    var str = formatStr
    var Week = ['日', '一', '二', '三', '四', '五', '六']

    str = str.replace(/yyyy|YYYY/, date.getFullYear())
    str = str.replace(/yy|YY/, (date.getYear() % 100) > 9 ? (date.getYear() % 100).toString() : '0' + (date.getYear() % 100))
    var month = date.getMonth() + 1
    str = str.replace(/MM/, month > 9 ? month.toString() : '0' + month)
    str = str.replace(/M/g, month)

    str = str.replace(/w|W/g, Week[date.getDay()])

    str = str.replace(/dd|DD/, date.getDate() > 9 ? date.getDate().toString() : '0' + date.getDate())
    str = str.replace(/d|D/g, date.getDate())

    var hour = date.getHours()
    str = str.replace(/HH/, hour > 9 ? hour.toString() : '0' + hour)
    str = str.replace(/H/g, hour)

    str = str.replace(/A/g, hour >= 12 ? 'PM' : 'AM')
    str = str.replace(/Aa/g, hour >= 12 ? 'pm' : 'am')

    hour = hour > 12 ? hour % 12 : hour
    str = str.replace(/hh/, hour > 9 ? hour.toString() : '0' + hour)
    str = str.replace(/h/g, hour)

    str = str.replace(/mm/, date.getMinutes() > 9 ? date.getMinutes().toString() : '0' + date.getMinutes())
    str = str.replace(/m/g, date.getMinutes())
    str = str.replace(/ss|SS/, date.getSeconds() > 9 ? date.getSeconds().toString() : '0' + date.getSeconds())
    str = str.replace(/s|S/g, date.getSeconds())

    return str
}

//
function updateTime(dm2d) {
    const upDate = () => {
        const date = new Date(),
            dateNode = dm2d.getDataByTag('date'),
            timeNode = dm2d.getDataByTag('time'),
            weekNode = dm2d.getDataByTag('week'),
            dateTime = dm2d.getDataByTag('date_time'); //240608
        let curTime = formatDate(date, 'HH:mm:SS'),
            curDate = formatDate(date, 'YYYY-MM-DD');
        dateNode && dateNode.s('text', curDate);
        timeNode && timeNode.s('text', curTime);
        weekNode && weekNode.s('text', '星期' + formatDate(date, 'W'));
        dateTime && dateTime.s('text', curDate + ' ' + curTime);
    };
    setInterval(upDate, 1000);
    upDate();
}

var importCssJs = {
    hasLoaded: function(typeTxt, src) { //typeTxt为'link'、'script'等
        let typeArrs = document.getElementsByTagName(typeTxt)
        let srcArrs = []
        for (let i = 0; i < typeArrs.length; i++) {
            let item = typeArrs[i]
            if (typeTxt === 'link') {
                srcArrs.push(item.href)
            } else if (typeTxt === 'script') {
                srcArrs.push(item.src)
            } else {
                console.error('不支持的类型：' + typeTxt)
            }
        }
        let status = false
        srcArrs.forEach(item => {
            if (item.indexOf(src) != -1) {
                status = true
                return
            }
        })
        return status
    },
    css: function(path) {
        if (i.isDisplayExport() && path.slice(0, 4) != 'http') path = '../' + path;

        if (!path || path.length === 0) {
            throw new Error('参数"path"错误');
        }
        if (importCssJs.hasLoaded('link', path)) {
            console.warn('css已加载：' + path)
            return
        }
        var head = document.getElementsByTagName('head')[0];
        var link = document.createElement('link');
        link.href = path;
        link.rel = 'stylesheet';
        link.media = 'screen';
        head.appendChild(link);
    },
    js: function(path, reload = false, onLoadComplete = null) {
        if (!path || path.length === 0) {
            throw new Error('参数"path"错误');
        } else {
            if (i.isDisplayExport() && path.slice(0, 4) != 'http') path = '../' + path;
        }

        var jsId = urlName(path) + 'Id'
            //判断是否已加载过
        var oldjs = document.getElementById(jsId)
        if (oldjs) {
            console.warn('js已加载过：' + path)
            if (reload) {
                oldjs.parentNode.removeChild(oldjs);
            } else {
                onLoadComplete && onLoadComplete(); //已有加载的情况下，避免不触发加载完成事件，这里在return前也要调用回调！
                return
            }
        }

        //新建script标签
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.src = path;
        script.id = jsId; //链接地址也作为id
        script.type = 'text/javascript';

        //added by lrq 220506 为了确保属性中加载的js能依次有先后依赖关系！需要同步加载！createElement script默认是异步！
        script.async = false

        head.appendChild(script);

        script.onload = script.onreadystatechange = function() {
            if (!this.readyState || 'loaded' === this.readyState || 'complete' === this.readyState) {
                onLoadComplete && onLoadComplete();
            }
        };
    },
    loadArr: function(tpyeTxt, arr, reload = false, onLoadComplete = null) {
        if (arr != undefined) {
            arr.forEach((itemtmp, index) => {
                if (itemtmp != '') {
                    if (tpyeTxt === 'js') {
                        importCssJs.js(itemtmp, reload, onLoadComplete && (index == arr.length - 1) ? onLoadComplete : null);
                    } else if (tpyeTxt === 'css') {
                        console.warn(itemtmp)
                        importCssJs.css(itemtmp);
                    } else {
                        console.error('only support js or css!')
                    }
                }
            })
        }
    },
    __loadArr: function(typeTxt, data) {
        importCssJs.loadArr(typeTxt, data.a(typeTxt))
    }
}

function GetRequest(url = null) {
    if (!url) url = location.search; //获取当前页面url
    let theRequest = {}; //new Object();    
    if (url.indexOf("?") != -1) {
        let str = url.substr(1);
        strs = str.split("&");
        for (let i = 0; i < strs.length; i++) {
            //230312，去掉了原先的unescape()处理，确保中文编码不会出错！原先是unescape(strs[i].split("=")[1]);
            let tagValtmp = strs[i].split("=")[1];
            theRequest[strs[i].split("=")[0]] = tagValtmp;
        }
    }
    return theRequest;
}

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function uuid() {
    return guid()
}

function getBrowserInfo() {
    var ua = navigator.userAgent.toLocaleLowerCase();
    var browserType = null;
    if (ua.match(/msie/) != null || ua.match(/trident/) != null) {
        browserType = "IE";
        browserVersion = ua.match(/msie ([\d.]+)/) != null ? ua.match(/msie ([\d.]+)/)[1] : ua.match(/rv:([\d.]+)/)[1];
    } else if (ua.match(/firefox/) != null) {
        browserType = "火狐";
    } else if (ua.match(/ubrowser/) != null) {
        browserType = "UC";
    } else if (ua.match(/opera/) != null) {
        browserType = "欧朋";
    } else if (ua.match(/bidubrowser/) != null) {
        browserType = "百度";
    } else if (ua.match(/metasr/) != null) {
        browserType = "搜狗";
    } else if (ua.match(/tencenttraveler/) != null || ua.match(/qqbrowse/) != null) {
        browserType = "QQ";
    } else if (ua.match(/maxthon/) != null) {
        browserType = "遨游";
    } else if (ua.match(/chrome/) != null) {
        var is360 = _mime("type", "application/vnd.chromium.remoting-viewer");

        function _mime(option, value) {
            var mimeTypes = navigator.mimeTypes;
            for (var mt in mimeTypes) {
                if (mimeTypes[mt][option] == value) {
                    return true;
                }
            }
            return false;
        }
        if (is360) {
            browserType = '360';
        } else {
            browserType = 'Chrome'
        }
    } else if (ua.match(/safari/) != null) {
        browserType = "Safari";
    }
    return browserType
}

//双下横杠开头的是给框架用的！
function __render(data, gv, cache, kind, cb = null) {
    if (!cache.htmlView) {
        var div = cache.htmlView = document.createElement('div');
        div.style.position = 'absolute';
        div.style.overflow = 'hidden';
        div.style.setProperty("box-sizing", "border-box", null);
        div.style.setProperty("-moz-box-sizing", "border-box", null);
        data.div = div;
        _i.addEventListener(div, 'mousedown', function(e) {
            e.preventDefault();
            // e.stopPropagation();
        }, false);
        div.layoutHTML = function() {
            gv.layoutHTML(data, div);
            if (data.a('div.debug')) console.info('Div is layout');
        };
        div.onHTMLAdded = function() {
            if (data.a('div.debug')) console.info('Div is added');
        };
        div.onHTMLRemoved = function() {
            if (data.a('div.debug')) console.info('Div is removed');
        };

        //界面模板引擎
        let htmlTemp = data.a('div.template')
        if (htmlTemp) {
            let template = Handlebars.compile(htmlTemp)
            let classCommonHTML = template(data.a('div.data')) //同一类渲染元素都一样的，下面要加上一个外层id封装，唯一当前的！
            data.a('div.content', '<div class="' + data.getTag() + '">' + classCommonHTML + '</div>');
        }

        //放置dom，并且监听事件
        cache.htmlView.innerHTML = data.a('div.content');
        importCssJs.__loadArr('js', data)
        importCssJs.__loadArr('css', data)

        function addEvent(eleCssPath, title) {
            let elementObj = $('.' + data.getTag() + ' ' + eleCssPath)
            elementObj = $('.' + data.getTag() + ' ' + eleCssPath)
            elementObj.each((index, element) => {
                //1、遍历每个元素，分别都绑定上真实click点击事件，并且事件转成appNotifier.fire，同时回调图元的onClick
                let functmp = () => {
                    let info = { //用来存放menu的基本信息，比如菜单总数等
                        //-----------------完整的e.para.info信息------------------------
                        tag: data.getTag(), //这里用来区别不同的渲染元素实例！
                        title,
                        text: $(element).html(),
                        index, //目前index和count都是同一类型全局，暂时不支持每个上级title下排序和统计！20200325
                        count: elementObj.length,
                        //-------------------------------------------------------------
                    }
                    window.appNotifier && window.appNotifier.fire({
                        kind,
                        para: {
                            type: 'mouse_click', //真实鼠标点击
                            data: index,
                            info
                        }
                    });
                    let onClick = new Function('return ' + data.a('onClick'))()
                    onClick && onClick(data, index, info);
                }
                _i.addEventListener(element, "click", functmp);
                window.appNotifier && window.appNotifier.add((e) => {
                    if (e.kind === kind) { //1、匹配组件类型，比如menu4、menu5等【e.Kind】
                        if (e.para.type == 'mock_click' && e.para.data == index) { //4、匹配事件类型为mock_click，以及列表子类型下的索引【e.para.data】
                            if (e.para.info.tag == data.getTag() && //2、匹配组件实例对象标签【e.para.info.tag】
                                e.para.info.title == title) { //3、匹配组件内分类列表子类型【e.para.info.title】
                                let onClick = new Function('return ' + data.a('onClick'))()
                                e.para.info['count'] = elementObj.length
                                onClick && onClick(data, e.para.data, e.para.info);
                            }
                        }
                    }
                });
            });
            return elementObj
        }

        _i.setTimeout(function() {
            let callback = new Function('return ' + data.a('div.callback'))()
            callback && callback(data, div);
            cb && cb(addEvent)
        }, 0)
    }
    cache.htmlView.style.color = data.a('div.color');
    cache.htmlView.style.padding = data.a('div.padding') + 'px';
    cache.htmlView.style.background = data.a('div.background');
    cache.htmlView.style.opacity = data.a('div.opacity');
    return cache.htmlView;
}

//通用事件处理转接函数
function __eventProcess(event, data, view, point, width, height) {
    let cb = new Function('return ' + data.a('event'))()
    return cb && cb(event, data, view, point, width, height)
}

var __enable_carousel_reload = false,
    __is_prevNext_click = false,
    __pageIndex_appOpened2iconSouce = {},
    __cache = null,
    __gv = null, //230418，增加gv，便于其他函数里面调用其跳出子网
    __data = null;

//隐藏左右切换页面箭头
function __disableArrow(cache, data, disable = true) {
    cache.carousel.setControllerVisible(!disable);
    data.a('arrowDisabled', disable);
    data.iv()
    cache.carousel.iv()
}

function __currentApp(dm = null) {
    let titleBarObj = (dm ? dm : __data.dm()).getDataByTag('titleBar');
    return titleBarObj ? titleBarObj.a('title') : null; //230312，加上了null情况的判断
}

//230407，标题背景颜色随着轮播也能切换透明或不透明
function __updateTitlebar(url) {
    let cache = __cache,
        data = __data;
    let gvtmp = cache.url2g2d[url], //获取要切换的轮播页的graphView
        baseNode = i.baseNode(gvtmp.dm());
    let baseBackground = i.baseNode(gvtmp.dm()).s('shape.background'),
        //1）有背景色且不透明
        notOpacity = baseBackground && rgbaNum(colorAutoToRGBA(baseBackground), 3) == 1,
        //2）无背景色且有图片image。注意，s:shape属性为rect等字符串值时才有background属性，需要设置图片image时，shape属性要设置undefined
        hasImage = baseNode && baseNode.s('shape') == undefined && baseNode.getImage();
    //有背景色且背景色为不透明或者有图片时，标题背景为白底，其他情况下标题透明！         
    let titleBar = d(data.dm(), 'titleBar'),
        //230419，找不到就是-1，比如，比如menu_0传入是全路径，而displays里是名称，这里得到也是-1，因此后面使用不能限定indextmp >= 0，而是小于initCounts即可！
        indextmp = data.a('displays').indexOf(url);
    //240421，因为iconMenu中的displays属性支持菜单页面文件名称，而不是完整url路径了，因此这里也要加上这样一个处理，否则导致应用平台桌面菜单左右切换时，在非当前0的菜单页，也是禁用返回状态！
    if (indextmp == -1) indextmp = data.a('displays').indexOf(urlName(url));
    switchTransparent(titleBar, 'bg.background', 'color', !(notOpacity || hasImage));
    titleBar.a('title', data.ca('initCounts') == 0 ? '应用平台' : (indextmp < data.ca('initCounts') ? window.adnav_origin_title : urlName(url)));
}

function __desktopPreNextClicked(preNext, mockClick = false, index = null) {
    if (__cache == undefined) return; //230313 added
    let cache = __cache,
        carousel = __cache.carousel,
        data = __data;

    //账号应用禁止切换
    if (__currentApp() == '账户') {
        return
    }

    let indextmp = carousel.getCurrentIndex(),
        indexbak = indextmp;
    let lentmp = data.a('displays').length;
    switch (preNext) {
        case 'prev':
            indextmp = indextmp == 0 ? lentmp - 1 : indextmp - 1
            break;
        case 'next':
            indextmp = indextmp == lentmp - 1 ? 0 : indextmp + 1
            break;
        case 'first':
            indextmp = 0
            break;
        case 'last':
            indextmp = lentmp - 1
            break;
        case 'set':
            indextmp = index
            break;
    }
    if (
        mockClick == 2 && //仅限于快捷键切换应用时
        data.a('displays').length > data.a('initCounts') + 1 && //不论是否有打开运行面板，页面总数要比菜单页多2页才行！这样当没有运行面板时，单个应用打开能与桌面切换，而有运行面板后，单个打开的应用则不能切换，区别在这。
        (indextmp <= data.a('initCounts') - 1 || data.a('displays')[indextmp].indexOf('运行面板') != -1) //将要进入桌面菜单页或运行面板页时
    ) {
        carousel.setCurrentIndex(indextmp);
        __desktopPreNextClicked('next', mockClick);
        return indextmp;
    }

    //如果是点击切换，这里得避免左右切换不能定住当前页，切换后点击轮播图区域，被自动切换到之前点击过的轮播图
    data.a('index', mockClick ? indextmp : indexbak);
    if (preNext == 'prev' || preNext == 'next' || preNext == 'first' || preNext == 'last' || preNext == 'set') {
        //只要不是索引index为0，那么就开放返回按钮可以点击，点击后直接返回索引0！
        data.dm().getDataByTag('titleBar').a('返回.ht.disabled', indextmp == 0)
        if (!mockClick) {
            __is_prevNext_click = true
            cache.indexTobe = indextmp; //这个值随__is_prevNext_click为true的时候
        }
        //切换轮播图时，重新加载3d场景
        _i.setTimeout(() => {
            let menuMaxIndextmp = data.a('initCounts') - 1
            if (indextmp > menuMaxIndextmp) {
                let urltmp = data.a('displays')[indextmp]
                window.appNotifier.fire({
                    kind: 'app',
                    para: {
                        type: 'reload3d',
                        data: {
                            url: urltmp
                        }
                    }
                });
                //切换到应用时，导航菜单名称切换成对应的
                data.dm().getDataByTag('titleBar').a('visible', false)
                data.dm().getDataByTag('titleBar').a('title', urlName(urltmp))

                //点击或快捷键切换到应用页面时，隐藏左右箭头！
                __disableArrow(cache, data, true)
            } else if (lentmp > menuMaxIndextmp + 1) { //右切换到最开始的菜单页，或者左切换到最后一个菜单页，就进行加载桌面的3d场景；当仅仅只有菜单页面时，切换不进行下面操作
                if ((indextmp == 0 && (preNext == 'next' || preNext == 'first' || preNext == 'set')) || (indextmp == menuMaxIndextmp && (preNext == 'prev' || preNext == 'last' || preNext == 'set'))) {
                    //无过渡动画重新载入初始化当前页
                    window.appNotifier.fire({
                        kind: 'sceneLoading',
                        para: {
                            info: {
                                action: 'no_anim_enter'
                            }
                        }
                    });
                    //切换到桌面菜单时，导航菜单名称切换成默认的AIOTOS Desktop
                    let navtmp = data.dm().getDataByTag('titleBar')
                    window.adnav_origin_title ? navtmp.a('title', window.adnav_origin_title) : navtmp.a('visible', true);
                    //点击或快捷键切换到桌面菜单页面时，显示左右箭头！
                    __disableArrow(cache, data, false)
                }
            }

            //230407，标题背景颜色随着轮播也能切换透明或不透明。
            let appName = (data.a('displays')[indextmp]);
            __updateTitlebar(__iconMenuNameToURL(appName)); //231121，nameUrl改成__iconMenuNameToURL，因为调整了aiotos.json到跟aiotos目录平级，识别同名目录下desktop子目录文件了！
            //切换应用时，更新面包屑
            let breadCrumbTmp = __data.dm().getDataByTag('breadcrumb-ui');
            if (breadCrumbTmp) {
                window.appNotifier.fire({
                    kind: 'toDesk',
                    para: {
                        type: 'breadCrumb',
                        data: {
                            name: appName, //应用名称。注意，当前未考虑应用名称可重复的情况！！
                            action: 'update' //应用的g2d
                        }
                    }
                })
            }
        }, 0);
    } else {
        __is_prevNext_click = false //切换页面的第3处交互，还有哪里涉及点击主动要切换轮播页的，并对cache.preNext赋值！
    }
    return data.ca('index');
}

//231121，公共函数，内部代替nameUrl，兼容识别aiotos/desktop下面的桌面菜单页
var __iconMenuNameToURL = null;
//tips 231121，轮播页组件
function __iconAppCarousel(data, gv, cache) {
    __cache = cache;
    __data = data;
    __gv = gv;

    var displayArrTmp = []
    let targetMenuList = data.ca('displays'),
        curURL = data.dm()._url,
        desktopFolder = urlPath(curURL) + '/' + urlName(curURL) + '/' + 'desktop/'; //找当前文件名称相同的同级目录下的desktop目录
    __iconMenuNameToURL = function(name) {
        let absURL = name;
        if (name && name.indexOf('.json') == -1) {
            let targetFile = name + '.json';
            if (i.requestFileList(urlPath(curURL), '.json').indexOf(targetFile) == -1) {
                absURL = desktopFolder + targetFile;
                if (data._i_needRefreshDesktopList) data._i_needRefreshDesktopList = undefined; //编辑时动态清空，那么刷新进来获取非缓存值，然后复位！
            } else {
                absURL = urlPath(curURL) + '/' + targetFile;
            }
        }
        return absURL;
    }
    if (!runningMode() && (!targetMenuList || targetMenuList.length == 0)) {
        let menuFileList = i.requestFileList(desktopFolder, '.json', !data._i_needRefreshDesktopList); //初始空时，遍历找同名目录下desktop子目录下的所有.json文件
        menuFileList.forEach(url => {
            if (i.replaceAll(url, desktopFolder, '').indexOf('/') != -1) return; //desktop/目录下的直接文件可用，内部更下级目录下的问题不予采用！
            let fileURL = i.replaceAll(url, '.png', '.json');
            targetMenuList.indexOf(fileURL) == -1 && targetMenuList.push(urlName(fileURL)); //存放名称，方便好看
        });
    }
    targetMenuList.forEach((name, index) => {
        let absURL = __iconMenuNameToURL(name);
        displayArrTmp.push(absURL);
    });

    !runningMode() && data.a('initCounts', displayArrTmp.length); 
    let oldIndexTmp = cache.carousel && cache.carousel.getCurrentIndex(),
        oldNameTmp = oldIndexTmp && urlName(data.a('displays')[oldIndexTmp]);

    if (!cache.carousel || __enable_carousel_reload) {
        if (!cache.carousel) { //这里面只会执行一次！
            cache.carousel = new ht.ui.Carousel();
            cache.url2view = {};
            cache.url2g2d = {}; //220812 应用的graphView
            cache.g2dViewsArr = []; //231123，移动到这里，避免每次刷新__enable_carousel_reload重入都会被清空！
            data._i_indexInitial = data.ca('index'); //231122，存放最开始页面配置的当前索引index，用于登录窗口关闭后默认打开的菜单页，而不是默认第一或者最后一页菜单！ 
            data.dm().md(e => {
                if (e.data == data) { //编辑时动态设置时，刷新处理
                    switch (e.property) {
                        case 'a:displays':
                            if (!e.newValue || e.newValue.length == 0) {
                                data._i_needRefreshDesktopList = true; //设置标记，让i.requestFileList()不传入缓存，请求接口获取最新值
                            }
                            //需要再外层，这样才能编辑时立刻更新加载
                            cache.g2dViewsArr = [];
                            __enable_carousel_reload = true;
                            e.newValue.length !== 0 && data.ca('initCounts', e.newValue === undefined ? 0 : e.newValue.length);
                            data.iv(); //刷新重新进入
                            break;
                        case 'a:index':
                            break;
                    }
                }
            });
            i.addAttrRunningInit(data, 's:pixelPerfect', true, false);

            //轮播图设定
            let carousel = cache.carousel;
            carousel.layoutHTML = function() {
                gv.layoutHTML(data, carousel, true);
                var rect = data.getRect();
                if (cache.lastWidth !== carousel.getWidth() ||
                    cache.lastHeight !== carousel.getHeight() ||
                    cache.lastZoom !== carousel.getZoom()) {
                    cache.lastWidth = carousel.getWidth();
                    cache.lastHeight = carousel.getHeight();
                    cache.lastZoom = carousel.getZoom();
                }
            };
            //轮播图左右按钮控制
            carousel.__controllerWidth = 30;
            carousel.__controllerHeight = 60;
            //设置左右切换的图标
            cache.carousel.setController('symbols/demo/extra/carousel/进入轮播图.json');
            cache.carousel.setHoverController('symbols/demo/extra/carousel/悬浮轮播图.json');
            cache.carousel.setActiveController('symbols/demo/extra/carousel/点击轮播图.json');
            //轮播图事件监听
            carousel.on('clickIndicator', function(e) {
                //点击小圆圈，将不允许切换2D界面，因为对应js应用包初始化，以及3D和登录页时权限也需要考虑
                if (e.index >= 0) {
                    __desktopPreNextClicked('set', true, e.index)
                }
            });

            //这里事件由此前的mousedown改为mouseup，是为了让事件触发在icon app图标点击相应之后，这样避免那里设置当前索引后，被这里设置回旧的了，会导致图标点击没法自动到对应打开的app应用的轮播图索引页面！
            carousel.on('d:mouseup', (e) => { //注意不论是轮播图carousel左右按钮还是点击任何区域，都会进来到这里！
                let preNext = carousel.controllerHitTest(e);
                preNext != undefined && __desktopPreNextClicked(preNext)
            })

            //桌面菜单情况下，显示和隐藏两侧箭头按钮
            carousel.on('d:mouseenter', (e) => {
                var isDesktop = data.a('index') <= data.a('initCounts') - 1;
                __disableArrow(cache, data, !isDesktop)
            })
            carousel.on('d:mouseleave', (e) => {
                __disableArrow(cache, data, true)
            })
            carousel.on('d:mousemove', (e) => {
                let indicatorIndexTmp = carousel.indicatorHitTest(e);
                if (carousel.a('indicatorIndex') != indicatorIndexTmp) {
                    if (indicatorIndexTmp != undefined) {
                        //TODO，0、1、2、3、4、...
                        document.querySelector('body').style.cursor = 'pointer'
                    } else {
                        //TODO，undefined
                        document.querySelector('body').style.cursor = 'default'
                    }
                    carousel.a('indicatorIndex', indicatorIndexTmp)
                }
            });
        } else {
            let contentsArr = cache.carousel.getChildren().toArray(),
                indexRemoved = undefined; //230408，精准查找被关闭的应用，默认只支持一次性只关闭一个应用，而不是批量关闭！
            contentsArr.forEach((item, index) => {
                if (!runningMode()) {
                    cache.carousel.removeView(item);
                } else {
                    let appPathTmp = item._content && item._content.dm && item._content.dm() && item._content.dm()._url;
                    if (appPathTmp && displayArrTmp.indexOf(appPathTmp) == -1) indexRemoved = index; //找到被关闭的应用在轮播中的索引index 
                }
            });
            //230408，.removeViewAt()代替此前的.removeView()，精准移除轮播组件中打开页面中当前操作关闭的那页。
            indexRemoved !== undefined && cache.carousel.removeViewAt(indexRemoved);
        }
        var carousel = cache.carousel;
        let symbolstmp = cache.symbols = data.a('symbols')
        for (let urltmp in cache.url2view) {
            if (displayArrTmp.indexOf(urltmp) == -1) {
                console.warn('Removed! ' + urltmp);
                delete cache.url2view[urltmp];
            }
        }

        displayArrTmp.forEach((path, index) => {
            if (!path) return false;
            if (cache.url2view && hasKey(cache.url2view, path)) {
                carousel.add(cache.url2view[path]);
                //点击菜单，已经有打开2d场景的，但是这时候要重新加载3d场景
                if (index == data.a('index')) { //这里可能有多个已经打开的，但是3d场景只能加载当前2d轮播页面对应的3d场景（app可以从2d图纸url中得到3d场景链接）
                    window.appNotifier.fire({
                        kind: 'app',
                        para: {
                            type: 'reload3d',
                            data: {
                                url: path
                            }
                        }
                    })
                }
            } else {
                var graphView = new ht.graph.GraphView();
                cache.g2dViewsArr.push(graphView.getView());
                graphView.dm()._url = path; //231121，路径地址统一存放到dm中，否则相对路径、绝对路径等会出问题
                if (index <= data.a('initCounts') - 1) { //这里只反序列化桌面菜单页的图纸
                    let menuNameTmp = data.a('displays')[index]
                    graphView.deserialize(path, (json, dm, gv_app, datas) => {
                        const g2dView = gv_app.getView();
                        const g2d = gv_app
                        g2dView.style.left = '0';
                        g2dView.style.right = '0';
                        g2dView.style.top = '0';
                        g2dView.style.bottom = '0';
                        // 选中边框为0
                        g2d.getSelectWidth = () => 0;
                        // 禁止鼠标缩放
                        g2d.handleScroll = () => {};
                        // 禁止 touch 下双指缩放
                        g2d.handlePinch = () => {};
                        // 禁止平移
                        g2d.setPannable(false);
                        // 禁止框选
                        g2d.setRectSelectable(false);
                        // 隐藏滚动条
                        g2d.setScrollBarVisible(false);
                        // 禁止图元移动
                        g2d.setMovableFunc(() => false);

                        window.appNotifier && window.appNotifier.add((e) => {
                            const {
                                kind,
                                para
                            } = e
                            if (kind === 'appInvoke') {
                                var iconNodeTmp = null
                                dm.each((node) => {
                                    if (node.a('text.text') == para.data) {
                                        iconNodeTmp = node
                                    }
                                })
                                if (!iconNodeTmp) {
                                    console.warn('name not mached in ' + menuNameTmp)
                                } else {
                                    console.info('app mached in ' + menuNameTmp)
                                }
                                if (para.type == 'menuIndex') { //根据索引ID切换应用
                                    if (para.data == index) { //当前页的才会处理，否则多个menu页面都会监听执行
                                        //关闭应用管理前，设置要回退到哪个菜单页
                                        __pageIndex_appOpened2iconSouce[data.a('index')] = index;
                                        data.ca('index', index);
                                    }
                                } else { //根据应用名称切换应用
                                    if (iconNodeTmp && iconNodeTmp.hasChildren()) { //230411，对于子网（应用组）类型的桌面菜单图标，通过事件打开该应用，实则是关闭，才能到啄桌面中子网菜单！
                                        console.assert(iconNodeTmp.getClassName() == 'ht.SubGraph');
                                        window.appNotifier.fire({
                                            kind: 'appBackClose', //模拟点击回退按钮，关闭应用回到桌面
                                            para: {
                                                type: null,
                                                data: para.data
                                            }
                                        });
                                    } else { //常规应用打开
                                        gv_app.fireInteractorEvent({
                                            kind: para.type,
                                            type: 'data', //230406，新增type为data，结合kind由clickData改成onClick，让鼠标按下触发改成弹起触发！
                                            data: iconNodeTmp
                                        })
                                    }
                                }
                            }
                        })
                    });
                    //监听图纸上对图元的事件
                    let eventListen = e => {
                        try {
                            if (e.kind == 'onClick' && e.type == 'data' && e.data.getDisplayName() && e.data.getDisplayName().indexOf('appIcon') != -1) { //e.kind= 'onUp'或'onClick'时，这里会进来多次，而'clickData'，就是一次！
                                let cb = new Function('return ' + data.a('onClick'))()
                                if (cb && !e.data.a('locked')) {
                                    layer.load(1);
                                    let texttmp = e.data.a('text.text');
                                    let infotmp = cb(data.dm(), texttmp),
                                        indextmp = infotmp.index, //tips by230406，轮播的索引，也就是后台已经打开的应用页面所在的轮播位置
                                        existtmp = infotmp.exist;
                                    if (!existtmp) {
                                        data.dm().getDataByTag('titleBar').a('title', texttmp)
                                        __enable_carousel_reload = true;
                                        data.dm().getDataByTag('titleBar').a('返回.ht.disabled', indextmp == 0)
                                        __is_prevNext_click = false //切换页面的第1处交互
                                        __pageIndex_appOpened2iconSouce[indextmp] = index //存放应用APP页面对应的原始从哪个iconMenu页面过来的，记录索引对应关系，用以“返回”关闭应用页时返回到原始打开它的菜单页面，而不是统一回到索引0的！

                                        //所有应用页，要隐藏切换按钮
                                        __disableArrow(cache, data, true)
                                    } else {
                                        invokeAppByIndex(indextmp);
                                    }
                                    layer.closeAll();
                                }
                                data.iv()
                            } else if (e.kind == 'doubleClickData') {
                                if ( /*e.data && e.data.getClassName() == 'ht.SubGraph' || */ (e.data.getClassName() != 'ht.Grid' || e.data.getClassName() != 'ht.UGrid')) {
                                    /*主桌面的Grid可选中，子桌面（subGraph）Grid设置了不可选中*/
                                    e.event.stopPropagation();
                                }
                            } else if (e.kind == 'doubleClickBackground') {
                                e.event.stopPropagation();
                            } else {

                            }
                        } catch (e) {

                        }
                    };
                    if (graphView._i_oldMi) graphView.umi(graphView._i_oldMi); //230406，避免重复触发
                    graphView.enableToolTip();
                    graphView.mi(eventListen);
                    graphView._i_oldMi = eventListen; //230406，避免重复触发
                    graphView.onCurrentSubGraphChanged = (e) => { //e.oldValue为切换前的子网图元节点，e.newValue为当下的子网，如果当前或此前不是子网，那么值就是null！
                        p(graphView.dm(), 'background', e.newValue ? 'rgba(55,125,255,0.075)' : 'rgb(0,0,0,0)');
                        let tipstmp = d(data.dm(), 'deskTips'); //data为当前iconMenu轮播图图标，跟titlebar/deskTips同一级别！
                        tipstmp.s('2d.visible', true);
                        tipstmp.a('title', e.newValue ? '双击空白区域返回上层桌面菜单' : '点击左右箭头可切换桌面菜单');
                        tipstmp.a('title2', e.newValue ? ' ' : '或快捷键：Ctrl + ← / Ctrl + →');
                        //当从子网跳转到桌面，或者从子网的下一级子网跳转到上一级子网时，面包屑才回退！
                        if (e.oldValue && (e.newValue == null || isInnerChild(e.newValue, e.oldValue))) {
                            if (e.oldValue) {
                                let appName = e.oldValue.a('text.text'), //应用名称
                                    breadCrumbTmp = __data.dm().getDataByTag('breadcrumb-ui');
                                if (breadCrumbTmp && breadCrumbTmp._cache) {
                                    let itemstmp = breadCrumbTmp._cache.control.getItems(),
                                        lastItem = itemstmp && itemstmp.at(-1);
                                    if (lastItem && lastItem.text && lastItem.text !== appName) {
                                        return; //跳出，不进行后续处理，主要是导航面包屑按钮的移除
                                    }
                                }

                                //跳出子网组后，面包屑删除子网本身
                                window.appNotifier.fire({
                                    kind: 'toDesk',
                                    para: {
                                        type: 'breadCrumb',
                                        data: {
                                            name: appName,
                                            action: 'remove' //应用的g2d
                                        }
                                    }
                                })
                            }
                        }
                    }
                } else { //app应用的图纸反序列化交给指定独立模块
                    window.appNotifier.fire({
                        kind: 'app',
                        para: {
                            type: 'opening',
                            data: {
                                url: path,
                                dm_desk: gv.dm(),
                                gv_app: graphView
                            }
                        }
                    });
                }
                let obmtmp = new ht.ui.HTView(graphView)

                cache.url2g2d[path] = graphView; 
                window.appNotifier && window.appNotifier.fire({
                    kind: 'toDesk',
                    para: {
                        type: 'pageCreating',
                        data: {
                            name: urlName(path),
                            g2d: graphView
                        }
                    }
                })
                cache.url2view[path] = obmtmp;
                carousel.add(obmtmp);
            }
        })
        symbolstmp.forEach(path => {
            carousel.add(path);
        })
    }
    let initCountsTmp = data.ca('initCounts'),
        curDisplaysCount = data.ca('displays').length,
        curViewArrCount = cache.g2dViewsArr.length;
    if (curDisplaysCount > initCountsTmp) {
        if (curDisplaysCount == curViewArrCount) {
            cache.g2dViewsArr.forEach(view => {
                view.style.opacity = data.a('div.opacity');
            });
        } else {
            cache.g2dViewsArr = [];
        }
    }
    if (data.a('play')) {
        cache.carousel.setInterval(data.a('interval')) //页面动画切换时间间隔
        cache.carousel.setAutoplay(500) // 播放动画的时长
    } else {
        cache.carousel.setAutoplay(0) //停止切换
    }
    if (__is_prevNext_click) {
        data.a('index', cache.indexTobe) //前面对__is_prevNext_click为true的时候备份的当时要到达的索引index，这时候不进行设置索引，而只用来更新index变量值！
    } else {
        let indextmp = data.a('index');
        if (oldIndexTmp != indextmp) {
            if (oldIndexTmp != undefined && oldNameTmp != undefined) {
                let newNameTmp = urlName(data.a('displays')[indextmp])
                let onChange = new Function('return ' + data.a('onChange'))()
                onChange && onChange(data, cache, oldNameTmp, newNameTmp);
                data.getAttrObject().preDisplay = {
                    index: oldIndexTmp,
                    name: oldNameTmp
                };
            }
            cache.carousel.setCurrentIndex(indextmp);
        }
        if (__currentApp() == '账户') {
            data.a('play', false) //禁止自动轮播
            data.dm().getDataByTag('titleBar').a('返回.ht.disabled', true); //禁止点击返回
            window._i_user = undefined;
        }
    }
    data.ca('display', displayArrTmp[data.ca('index')]);
    __enable_carousel_reload = false;
    return cache.carousel;
}

//根据iconMenu中的carousel已打开的应用页面（包括菜单）索引index，切换显示页！
function invokeAppByIndex(index) {
    return __desktopPreNextClicked('set', true, index);
}

//根据iconMenu中的carousel已打开的应用页面（包括菜单）索引index，切换显示页！
function invokeOpenedApp(name) {
    let data = __data,
        index = 0;
    data.ca('displays').forEach((display, idx) => {
        if (display.indexOf(name) != -1) index = idx;
    });
    data.ca('index', index);
    __updateTitlebar(__iconMenuNameToURL(data.ca('displays')[index])); //231122，将nameUrl改成了现在这个!
    data.iv();
    _i.setTimeout(() => { //放到消息异步里，主要是为了适应切换面包屑
        if (name == '桌面') __cache.url2g2d[data.ca('display')].upSubGraph(); //获取到当前轮播应用页的graphView，并调用跳出子网
    }, 0);
}

//根据应用名称切换iconMenu中的carousel已打开的应用页面（包括菜单）的索引，如果索引不存在需要新打开，就切换成invoke模式！
function invokeAppByName(name) {
    let cache = __cache,
        carousel = __cache.carousel,
        data = __data;
    let indextmp = null;
    data.a('displays').forEach((item, index) => {
        if (name == urlName(item)) {
            indextmp = index;
        }
    })
    if (indextmp) {
        __desktopPreNextClicked('set', true, indextmp);
    } else {
        window.appNotifier.fire({
            kind: 'appInvoke', //APP应用唤起事件
            para: {
                type: 'onClick', //模拟事件，230406，由clickData改成了onClick，好让弹起触发而不是按下触发！
                data: name //应用名称
            }
        });
    }
}

function closeAppByName(name) {
    //通知相应APP，当前已经关闭，让其做相应释放并初始化
    window.appNotifier.fire({
        kind: 'appBackClose',
        para: {
            type: null,
            data: name
        }
    });
}

function clearApps() {
    console.info('to be implement!');
    return;
    //以下代码发现还是每次只能销毁一个！
    let cache = __cache,
        carousel = __cache.carousel,
        data = __data;
    data.a('displays').forEach((item, index) => {
        let nametmp = urlName(item);
        nametmp != '账户' && closeAppByName(nametmp);
    })
}

function urlParam(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    let r = window.location.search.substr(1).match(reg);
    if (r != null)
        return decodeURIComponent(r[2]);
    return null;
}

function urlUser(url = null) { //url为null时，就是默认当前链接
    try {
        var arrtmp = url.split('/'),
            usertmp = null
        for (var i = 0; i < arrtmp.length; i++) {
            if (arrtmp[i].indexOf('displays') != -1) {
                usertmp = arrtmp[i + 1]
            }
        }
        return usertmp
    } catch (e) {
        console.error(e)
        return null
    }
}

function urlPath(url) {
    return url ? url.split('/').slice(0, -1).join('/') : null;
}

function urlName(url) {
    if (url == undefined) return null;
    let arrtmp = url.split('/');
    let nametmp = arrtmp[arrtmp.length - 1];
    if (arrtmp.length > 2 && nametmp.split('.').length == 1) return undefined;
    return nametmp.split('.')[0]
}

function nameUrl(name, subFolder = '') {
    if (name == undefined) return undefined;
    if (name.split('/').length >= 2) { //如果是路径就直接返回
        return name
    } else { //如果是名称，那么带上main同级目录路径以及文件后缀！
        return window.aiotos == undefined ? name : (subFolder == '' ? window.aiotos.rootPath + name + ".json" : window.aiotos.rootPath + subFolder + '/' + name + ".json");
    }
}

function urlNameChange(url, name) {
    let arrtmp = url.split('/')
    let nametmp = arrtmp[arrtmp.length - 1]
    let suffix = nametmp.split('.')[1]
    if (name.split('.').length < 2) { //如果有后缀，就保留，没有就用url原先带的后缀
        name = name + '.' + suffix
    }
    return url.replace(nametmp, name)
}

function isAiotosMainPage(url) {
    if (urlName(url) == 'aiotos') {
        var urlArrTmp = url.split('/')
        window.aiotos = {
            'userName': urlArrTmp[1], //当前应用平台启动的用户名
            'rootPath': url.replace('aiotos.json', '') //main所在的目录
        }
        return true
    } else {
        return false
    }
}

function inputErrorHint({
    node,
    propVal = 'ht.value',
    propStyle = 'ht.borderColor',
    errColor = 'red',
    timeout = 150,
    checkfunCallback = null //传入参数为node节点对象
}) {
    return
    let nodearrtmp = Array.isArray(node) ? node : [node]
    nodearrtmp.forEach(item => {
        let errortmp = checkfunCallback == null ? !item.a('ht.value') : !checkfunCallback(item)
        if (errortmp) {
            let bakCorlor = item.a(propStyle)
            item.a(propStyle, errColor)
            item.iv()
            _i.setTimeout(() => {
                item.a(propStyle, bakCorlor)
                item.iv()
            }, timeout)
        }
    })
}

/**
 * 加载帐户下全部点表，标准结构
 * @return {{}}
 */
function load_table() {
    const table_json = window.sessionStorage.obj

    console.warn(table_json)

    const table_obj = i.jsonParse(table_json)
    return table_obj;
}

function load_device_data_all() {
    /**
     * 数据点结构定义
     */
    class IotData {
        /**
         * 数据点名称
         */
        name;
        value;
        rw;
        ts;
        tm;
        data_id;
        data_pk;
        val_type;
    }
    /**
     * 加载全部设备的数据点数据
     * @return {{'设备名称.数据点名称':IotData}}  “devviceName.dataName”:IotData
     */
    const table_obj = load_table()
    let data_all = {}
    for (let ionode_id in table_obj) {
        let ionode = table_obj[ionode_id]
        let devices = ionode.properties
        for (let device_oid in devices) {
            let device = devices[device_oid]
            let datas = device.data
            for (let data_oid in datas) {
                let data = datas[data_oid]
                let iotData = Object.assign(new IotData(), data);
                let key = `${device.name}.${iotData.name}`
                data_all[key] = iotData
            }
        }
    }
    return data_all
}

/**
 *
 * @param ht_app {hg.GraphView}
 * @return {*}
 */
function get_dataModel(ht_app) {
    if (!ht_app.hasOwnProperty('g2d')) {
        console.error('ht_app param', ht_app)
        throw new Error(`get_dataModel传入参数类型错误`)
    }
    if (ht_app.g2d !== undefined && ht_app.g2d !== null) {
        // console.warn('this.app.g2d', ht_app.g2d)
        // console.warn('this.app.g2d.dataModel', ht_app.g2d.getDataModel())
        return ht_app.g2d.getDataModel()
    }
    if (ht_app.g2d_desk !== undefined && ht_app.g2d_desk !== null) {
        // console.warn('this.app.g2d_desk', ht_app.g2d_desk)
        // console.warn('this.app.g2d_desk.dataModel', ht_app.g2d_desk.getDataModel())
        return ht_app.g2d_desk.getDataModel()
    }
    throw new Error('获取应用DataModel失败')
}


function get_bind_info(dataModel) {
    let data = this.dataModel.getDataBindings()
    if (data === null || data === undefined) {
        console.warn('data', this.dataModel)
        throw new Error('数据点绑定为空')
    }
    data = data.s
    if (data === null || data === undefined) {
        console.warn('data.s', this.dataModel)
        throw new Error('数据点绑定为空')
    }
    for (let key in data) {
        let node = data[key]
        if (node.hasOwnProperty('id') && node.hasOwnProperty('func')) {
            return node
        }
    }
    console.warn('data.s', data)
    throw new Error('数据点绑定为空')
}

var pathAbs = function(folder = null, type = 'displays', isCommonDemo = false) {
    return ((() => 'url:' + type + '/' + (isCommonDemo ? 'demo' : i.user()) + (folder ? '/' + folder : ''))());
};

function registerHtCommonImage() {
    ht.Default.clickDelay = 10; 
    //230419，初始自动加载注册系统字典图纸，用于系统配置文件用途！首先在图纸收藏中用到！初始为用户未登录时，加载develop账号的！
    i.initConfigure('develop');

    //240907，运行状态貌似没必要注册。尤其是导出部署的情况！会导致下面大量资源加载失败。有待进一步观察。
    if(!runningMode()){
        i.setImage('icon.none', 'symbols/develop/uiotos/desk/none.json');
        // i.setImage('icon.iotos', 'symbols/develop/uiotos/icons/IOTOS.json');
        i.setImage('icon.menu', 'symbols/develop/uiotos/icons/editroToolBar/Table-1.json');
        i.setImage('icon.button', 'symbols/develop/uiotos/icons/editroToolBar/anniu.json');
        i.setImage('icon.switch', 'symbols/develop/uiotos/icons/editroToolBar/switchButton.json');
        //1.1、若要把2中的功能图标放到工具栏，还需要额外对应的快捷图标！
        i.setImage('icon.base.grid', 'symbols/develop/uiotos/icons/editroToolBar/border-middle-horizontal.json');
        i.setImage('icon.base.graphView', 'symbols/develop/uiotos/icons/editroToolBar/layoutForm.json');
        i.setImage('icon.base.tabView', 'symbols/develop/uiotos/icons/editroToolBar/danchuang.json');
        i.setImage('icon.base.iconClick', 'symbols/develop/uiotos/icons/editroToolBar/tupian.json');
        i.setImage('icon.desk.icon', 'symbols/develop/uiotos/icons/editroToolBar/zuhe.json');
        i.setImage('icon.base.dialog-ui', 'symbols/develop/uiotos/icons/editroToolBar/dialog.json');
        i.setImage('icon.base.tabs', 'symbols/develop/uiotos/icons/editroToolBar/Tabs.json');
        // i.setImage('icon.base.edit', 'symbols/develop/uiotos/icons/editroToolBar/edit.json');
        i.setImage('icon.base.checkbox', 'symbols/develop/uiotos/icons/editroToolBar/tick-square.json');
        i.setImage('icon.base.combobox', 'symbols/develop/uiotos/icons/editroToolBar/xialaliebiao.json');
        i.setImage('icon.base.ichart', 'symbols/develop/uiotos/icons/editroToolBar/chart-bar.json');
        i.setImage('icon.base.checkbox2', 'symbols/develop/uiotos/icons/editroToolBar/check-square.json');
        i.setImage('icon.base.scroll', 'symbols/develop/uiotos/icons/editroToolBar/scroll.json');
        i.setImage('icon.base.phone', 'symbols/develop/uiotos/base/__eventbus.json');
        i.setImage('icon.base.sharp', "symbols/develop/uiotos/icons/editroToolBar/hashtag.json");
        i.setImage('icon.base.function', "symbols/develop/uiotos/icons/editroToolBar/function.json");
        i.setImage('icon.base.textarea', 'symbols/develop/uiotos/icons/editroToolBar/textEdit.json');
        i.setImage('icon.base.date', 'symbols/develop/uiotos/icons/editroToolBar/timeSelector.json');
        i.setImage('icon.base.time', 'symbols/develop/uiotos/icons/editroToolBar/TimePicker.json');
        i.setImage('icon.base.page', 'symbols/develop/uiotos/icons/editroToolBar/file-alt.json');
        i.setImage('icon.base.bracket', 'symbols/develop/uiotos/icons/editroToolBar/brackets.json');
        i.setImage('icon.base.radiobox', 'symbols/develop/uiotos/icons/editroToolBar/radioBox.json');
        i.setImage('icon.base.camera', 'symbols/develop/uiotos/desk/icons/editroToolBar/camera-home.json');
        i.setImage('icon.base.video', 'symbols/develop/uiotos/desk/icons/editroToolBar/video.json');
        i.setImage('icon.base.gismap', 'symbols/develop/uiotos/icons/editroToolBar/gis.json');
        i.setImage('icon.base.document', 'symbols/develop/uiotos/icons/editroToolBar/file-fill-72.json');
        i.setImage('icon.base.linkage', 'symbols/develop/uiotos/icons/editroToolBar/breadCrumb.json');
        i.setImage('icon.base.gauge', 'symbols/demo/uiotos/工具栏图标/仪表-37.json');
        i.setImage('icon.base.sideMenu', 'symbols/develop/uiotos/icons/editroToolBar/隐藏菜单-15.json');
        i.setImage('icon.base.pie', 'symbols/demo/uiotos/工具栏图标/chart-pie-alt-15.json');
        i.setImage('icon.base.bar', 'symbols/demo/uiotos/工具栏图标/chart-bar-20.json');
        i.setImage('icon.base.inputGroup', 'symbols/develop/uiotos/icons/editroToolBar/inputGroup.json');
        i.setImage('icon.base.timer', 'symbols/demo/uiotos/工具栏图标/倒计时-0.json');
        i.setImage('icon.base.popover', 'symbols/develop/uiotos/icons/editroToolBar/popover.json');
    }

    let preLoadList = ['graphView', 'tabView', 'scrollAreaView-ui', 'dialog-ui', '__convertor', 'input-ui', 'button'];
    preLoadList.forEach(item => {
        function __symbolURL(user) {
            return user ? 'symbols/' + user + '/uiotos/base/' + item + '.json' : null;
        }
        let urlstmp = [__symbolURL('develop'), __symbolURL(i.user())];
        urlstmp.forEach(url => {
            url && i.setImage(url, url);
        })
    });
}

//自定义派生类
if (ht.ui.MapDropDown == undefined) {
    ht.ui.MapDropDown = function() {}
    ht.Default.def('ht.ui.MapDropDown', ht.ui.DropDownTemplate, {
        initDropDownView: function(master, datas, value) {
            var self = this,
                htmlView = new ht.ui.HtmlView(),
                mapDiv = self._mapDiv = document.createElement("div"),
                map = self._map = L.map(mapDiv, {
                    zoomAnimation: false,
                    trackResize: false
                }).setView([39.9123, 116.3913], 15);
            mapDiv.style.width = '100%';
            mapDiv.style.height = '100%';
            // mapDiv.style.boxShadow = master.getBoxShadow();
            L.tileLayer('http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'www.aiotos.net',
                maxZoom: 18,
                minZoom: 3
            }).addTo(map);
            map.on('click', function(e) {
                var latlng = e.latlng;
                self._latlng = latlng.lat + "," + latlng.lng;
                self.stop();
            });
            htmlView.setContent(mapDiv);
            htmlView.setPreferredSize(400, 200);
            return htmlView;
        },
        getDropDownValue: function() {
            return this._latlng;
        },
        afterOpen: function(v) {
            var self = this,
                map = self._map;
            self.getDropDownView().validate();
            self._map.invalidateSize();
            if (v) {
                self._latlng = v;
                var latlng = v.split(",");
                map.setView([latlng[0], latlng[1]], 15);
                self._marker = new L.marker([latlng[0], latlng[1]]);
                self._marker.addTo(map).bindPopup('Here!').openPopup();
            }
        }
    });
}

//230608，自定义派生类，注意，类的字符串命名不是随便取的！比如用ht.uiotos.xxx就报错了！！
if (ht.UGrid == undefined) {
    ht.UGrid = function() {
        ht.UGrid.superClass.constructor.call(this);
        this.colRect = []; //里面内容按照索引缓存列的右侧位置坐标x，加上了自身宽度的
        this.rowRect = []; //里面内容按照索引存放行的下册位置坐标y，加上了自身高度的
        this.columnsWidth = []; //存放当前各行实际高度
        this.rowsHeight = []; //存放当前各列实际转换后的宽度
        this.gap = 0;
        this.marginH = 0;
        this.marginV = 0;
        this.columnCount = 0;
        this.rowCount = 0;
        this.spaceH = 0;
        this.spaceV = 0;
        this.width = 0;
        this.height = 0;
        this.x = 0;
        this.y = 0;
    }
    ht.Default.def('ht.UGrid', ht.Grid, {
        __border: function(index) { //0:上；1:右；2:下；3:左
            let arr = this.a('grid.border');
            if (arr == undefined) return 0;
            else if (arr[index]) return Number(arr[index]);
            else return 0;
        },
        onPropertyChanged: function(e) {
            let self = this,
                curType = 'v';
            if (e.property == 'height') {
                this.height = e.newValue;
                curType = 'v';
                this.rowsHeight = []; //尺寸变化重新计算时此前的需要清空！
            } else if (e.property == 'width') {
                this.width = e.newValue;
                curType = 'h';
                this.columnsWidth = []; //尺寸变化重新计算时此前的需要清空！
            } else if (e.property == 'position') {
                this.x = e.newValue.x;
                this.y = e.newValue.y;
                curType = 'p';
            }
            let columnsPercent = this.a('grid.column.percents'), //获取原本属性自带的，各行高度比例设置，之前是支持支比例，不支持固定高度
                rowsPercent = this.a('grid.row.percents'), //获取原本属性自带的，各行宽度比例设置，之前是支持支比例，不支持固定宽度
                sumFixedColsWidth = 0, //固定宽度列总和
                sumFixedRowsHeight = 0; //固定高度行总和
            this.gap = this.a('grid.gap') != undefined ? this.a('grid.gap') : 0;
            this.marginH = this.a('node.margin.h') != undefined ? this.a('node.margin.h') : 0;
            this.marginV = this.a('node.margin.v') != undefined ? this.a('node.margin.v') : 0;
            this.columnCount = this.a('grid.column.count') != undefined ? this.a('grid.column.count') : 0;
            this.rowCount = this.a('grid.row.count') != undefined ? this.a('grid.row.count') : 0;
            this.spaceH = this.__border(1) + this.__border(3) + (this.columnCount - 1) * this.gap + this.columnCount * this.marginH * 2;
            this.spaceV = this.__border(0) + this.__border(2) + (this.rowCount - 1) * this.gap + this.rowCount * this.marginV * 2;

            //统计固定列宽的总值，并且把对应列的固定宽度当成实际展示的值放入到实际转换后显示的结构中
            console.assert(!columnsPercent || columnsPercent.forEach); //240522，异常提示下！
            this.width && columnsPercent /*&& columnsPercent.forEach*/ && columnsPercent.forEach((colPercent, index) => {
                //不包含区间[0,1]的处理
                if (colPercent < 0) { //小于0的都按照0处理，等于0的按照剩余区域平分处理
                    i.setArrayIndexValue(self.columnsWidth, index, -1);
                    self.spaceH = self.spaceH - 2 * self.marginH - self.gap;
                    return;
                } else if (colPercent > 1) {
                    i.setArrayIndexValue(self.columnsWidth, index, colPercent);
                    sumFixedColsWidth += colPercent;
                }
            });
            //对于行类似的操作
            this.height && rowsPercent && rowsPercent.forEach((rowPercent, index) => {
                //不包含区间[0,1]的处理
                if (rowPercent < 0) { //小于0的都按照0处理，等于0的按照剩余区域平分处理
                    i.setArrayIndexValue(self.rowsHeight, index, -1);
                    self.spaceV = self.spaceV - 2 * self.marginV - self.gap;
                    return;
                } else if (rowPercent > 1) {
                    i.setArrayIndexValue(self.rowsHeight, index, rowPercent);
                    sumFixedRowsHeight += rowPercent;
                }
            });
            //统计比例宽度的各列，在剩余宽度中，按照各自所填写的比例，生成实际的宽度值放入到实际转换后的显示结构中
            console.assert(!columnsPercent || columnsPercent.forEach); //240522，异常提示下！
            this.width && columnsPercent /*&& columnsPercent.forEach*/ && columnsPercent.forEach((colPercent, index) => { //现在要支持0.x的为剩余部分的比例，xxx的大于1的数则是像素绝对值而不是比例。负数会转换成正数来处理。
                //只处理区间(0,1]，不包括0
                if (colPercent <= 0) return; //小于0的都按照0处理，等于0的按照剩余区域平分处理
                else if (colPercent <= 1) { //三个重要配置数字，这里就是1，配置为1时，不是获得像素1，而是100%；配置为0，不是像素宽高为0，而是剩余区域均分；-1（负数）则是像素宽高为0
                    i.setArrayIndexValue(self.columnsWidth, index, colPercent == 1 ? (self.width - sumFixedRowsHeight - self.marginH * 2) : (self.width - sumFixedColsWidth - self.spaceH) * colPercent);
                }
            });
            //对于行，类似的操作
            this.height && rowsPercent && rowsPercent.forEach((rowPercent, index) => { //现在要支持0.x的为剩余部分的比例，xxx的大于1的数则是像素绝对值而不是比例。负数会转换成正数来处理。
                //只处理区间(0,1]，不包括0
                if (rowPercent <= 0) return; //小于0的都按照0处理，等于0的按照剩余区域平分处理
                else if (rowPercent <= 1) {
                    i.setArrayIndexValue(self.rowsHeight, index, rowPercent == 1 ? (self.height - sumFixedRowsHeight - self.marginV * 2) : (self.height - sumFixedRowsHeight - self.spaceV) * rowPercent);
                }
            });
            //统计已经赋值过宽度的列，剩余的空的，说明是没有配置的，那么在剩余的宽度中平均分配
            let sumRestTmp = 0,
                emptyIndexs = [];
            self.columnCount = self.a('grid.column.count');
            if (self.width) {
                for (let idx = 0; idx < self.columnCount; idx++) {
                    let colWidth = self.columnsWidth[idx];
                    if (colWidth != undefined) sumRestTmp += (colWidth == -1 ? 0 : colWidth);
                    else emptyIndexs.push(idx); //哪些列配置是空的，此时要把剩余空的区域平均分配给他们
                };
                emptyIndexs.forEach(idx => {
                    i.setArrayIndexValue(self.columnsWidth, idx, (self.width - sumRestTmp - self.spaceH) / emptyIndexs.length);
                });
            }

            //对于行，类似的操作
            sumRestTmp = 0;
            emptyIndexs = [];
            self.rowCount = self.a('grid.row.count');
            if (self.height) {
                for (let idx = 0; idx < self.rowCount; idx++) {
                    let rowHeight = self.rowsHeight[idx];
                    if (rowHeight != undefined) sumRestTmp += (rowHeight == -1 ? 0 : rowHeight);
                    else emptyIndexs.push(idx); //哪些列配置是空的，此时要把剩余空的区域平均分配给他们
                };
                emptyIndexs.forEach(idx => {
                    i.setArrayIndexValue(self.rowsHeight, idx, (self.height - sumRestTmp - self.spaceV) / emptyIndexs.length);
                });
            }
            if (e.property != 'width' && e.property != 'height') {
                this.fp('width', null, this.width);
                this.fp('height', null, this.height);
            }
            try { //230826，发现对于有ht.Block组合类型的参与网格布局的元素时，执行到这句里面会报错！
                ht.UGrid.superClass.onPropertyChanged.call(this, e);
            } catch (error) {}
        },
        getCellRect: function(rowIndex, columnIndex) { //注意，不能用()=>{}箭头符号，否则里面无法用this
            let self = this;
            //相对于最左边距离和自身宽度，生成位置坐标
            function __x(xRelPos) {
                return self.x - self.width / 2 + xRelPos;
            };
            //对于行，类似的操作
            function __y(yRelPos) {
                return self.y - self.height / 2 + yRelPos;
            };
            let widthtmp = self.columnsWidth[columnIndex],
                heighttmp = self.rowsHeight[rowIndex]; //如果值为-1（负数），那么就是尺寸为0，同时，对于之相关的间隙、空隙也要被自动布局挤掉！值为1，就是100%填充，0就是被剩余的均分！注意三个特殊值！

            //前一个位置的
            let colPos = columnIndex == 0 ? __x(this.__border(3)) : __x(this.colRect[columnIndex - 1] + self.gap + self.marginH * 2 - (self.x - self.width / 2)),
                rowPos = rowIndex == 0 ? __y(this.__border(0)) : __y(this.rowRect[rowIndex - 1] + self.gap + self.marginV * 2 - (self.y - self.height / 2));
            i.setArrayIndexValue(this.colRect, columnIndex, widthtmp == -1 ? (columnIndex == 0 ? (__x(this.__border(3)) - this.gap - 2 * self.marginH) : this.colRect[columnIndex - 1]) : (colPos + self.columnsWidth[columnIndex])); //存放时，加上自身的宽度，后一个使用时，只需要加间隙就好！
            i.setArrayIndexValue(this.rowRect, rowIndex, heighttmp == -1 ? (rowIndex == 0 ? (__y(this.__border(0)) - this.gap - 2 * self.marginV) : this.rowRect[rowIndex - 1]) : (rowPos + self.rowsHeight[rowIndex])); //存放时，加上自身的宽度，后一个使用时，只需要加间隙就好！
            let currentRect = { //注意，这里x、y不是中心点，而是左上顶点！
                x: colPos,
                y: rowPos, //this.getPosition().y - this.getHeight() / 2,
                width: self.marginH * 2 + (widthtmp == -1 ? 0 : widthtmp), //注意，node.margin.h/v等边距属性，当前实测发现，会作为控件的width/height，也就是实际显示会在这里参数值减去边距！因此加上边距先！
                height: self.marginV * 2 + (heighttmp == -1 ? 0 : heighttmp) //this.getHeight() //result.height
            };
            return currentRect;
        }
    });
}

/*240116，继承ht.Node图元节点，重写渲染元素图元的.a和.ca方法*/
if (ht.UNode == undefined) {
    ht.UNode = function() {
        ht.UNode.superClass.constructor.call(this);
    }
    //240207，为了性能优化，尝试屏蔽掉.a、.ca方法的重写！现在改用新机制通过i.md来做初始化赋值向下同步缓存队列。去掉重写代码。
    ht.Default.def('ht.UNode', ht.Node, {
    });
}

function p(data, propertyName, value = null) {
    if (value == null) {
        let gtmp = ht.Default.getter(propertyName);
        return gtmp != undefined ? data[gtmp] : null
    } else {
        let stmp = ht.Default.setter(propertyName);
        return stmp != null && data[stmp] != null ? data[stmp](value) : null
    }
}

function runningMode(gv = null) {
    return gv && gv.dm().a('zoomable') ? false : !(typeof hteditor !== "undefined" && hteditor.attrsDBCommonInfo !== undefined)
}

function initShadow(view, borderArr, shadowColor, shadowEnabled = false) {
    if (view) {
        let styletmp = '';
        if (borderArr && borderArr.length) {
            borderArr.forEach((item, index) => {
                styletmp = styletmp + ' ' + item + 'px'
            })
            view.getView().style.boxShadow = borderArr.length > 0 && shadowEnabled ? styletmp + ' ' + shadowColor : null;
        }
    }
}

function autoCompleteIconPath(node, pathBinded = 'path', typeBinded = 'iconType') {
    var typeArr = ['light', 'light', 'regular', 'solid'] //枚举下拉选择
    var typetmp = typeArr[node.ca(typeBinded)] //类型选择
    if (typetmp === undefined) typetmp = 'light'; //240701，默认light
    var path = node.ca(pathBinded) //图标路径
    if (path != undefined) {
        if (path.indexOf('.') == -1) { //传入图标文件名称时
            path = 'symbols/demo/uiotos/icons/' + typetmp + '/' + path + '.json'
        } else if (path.indexOf(typetmp) == -1) { //图标类型发生变化时
            typeArr.forEach((curType, index) => {
                if (curType != typetmp) { //路径中先前的类型名称换成新的
                    path = path.replace(curType, typetmp)
                }
            })
        }
    }
    node.ca(pathBinded, path) //回写过去
    return path;
}

function contain(src, arr) {
    let ret = false;
    if (typeof src == 'string') {
        arr.forEach((item, index) => {
            if (src.indexOf(item) != -1) {
                ret = true
                return //并不会跳出函数，只是跳出循环？
            }
        })
    }
    return ret
}

function sleep(time) {
    return new Promise((resolve) => _i.setTimeout(resolve, time));
}