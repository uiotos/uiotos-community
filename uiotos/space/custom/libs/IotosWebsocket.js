//IOTOS-WEBSOCKET VUE封装！
// var wsgroup = []
// const subIotos = (dev_ids, data_ids) => {
//   let wstmp = subIotosWs((event, data) => {
//     if (window.vue)
//       window.vue.$store.dispatch('on_websocket', {
//         event: event,
//         data: data
//       })

//   }, dev_ids.split(','), data_ids.split(','))
//   wsgroup.push(wstmp)
//   return wstmp
// }

// export default subIotos

const closeSubs = () => {
    //关闭上一次的websocket连接
    wsgroup.forEach(wstmp => {
        wstmp.heartCheck.stop() //要再close前面，这样可以保证heartCheck.stopSocket标记置位为true，这样onclose响应处理里面就不会触发自动重连！！
        wstmp.ws.close()
        console.error('关闭WEBSOCKET通道')
    });
    wsgroup = []
}

//----------------------------------------------------------------------
//IOTOS-WEBSOCKET 原生JS封装！
//①枚举类型
const SOCKET_ONOPEN = '✅ Socket connected!'
const SOCKET_ONCLOSE = '❌ Socket disconnected!'
const SOCKET_ONERROR = '❌ Socket Error!!!'
const SOCKET_ONMESSAGE = 'Websocket message received'
const SOCKET_WARNING = 'Websocket warning received'
const SOCKET_CONNECTING = 'Websocket connecting...'
const SOCKET_DEBUGINFO = 'Websocket debug info'
const SOCKET_RECONNECT = 'Websocket reconnected'
const SOCKET_RECONNECT_ERROR = 'Websocket is having issues reconnecting..'
const SOCKET_DEVSTATUS = 'device link status changed!'
const status = {
    SOCKET_ONOPEN,
    SOCKET_ONCLOSE,
    SOCKET_ONERROR,
    SOCKET_ONMESSAGE,
    SOCKET_WARNING,
    SOCKET_CONNECTING,
    SOCKET_DEBUGINFO,
    SOCKET_RECONNECT,
    SOCKET_RECONNECT_ERROR,
    SOCKET_DEVSTATUS
}

//②核心函数，返回值为ws实例，通过ws.send()就可以发送信息！！
const subIotosWs = (callback, device_ids, data_ids, url = ws_host, devId_filter = []) => {
    var ws = null;
    var timerId = null;
    var n = 1;
    var sec = 10;

    // todo duankeke重写ws链接协议 20210713
    if (window.WebSocket) {
        ws_connect(n)
    }else{
        alert('Sorry, your browser does not support WebSocket!')
    }
    function ws_connect(n) {

        function clearTimer() {
            if (timerId) {
                window.clearTimeout(timerId)
                timerId = null
            }
        }

        function setTimer() {
            if (n <= 60) {
                clearTimer()
                callback(status.SOCKET_RECONNECT, 'websocket链接断开，' + sec.toString() + 's后将尝试重链... 第' + n + '次')
                n = n + 1
                timerId = setTimeout(ws_connect, sec * 1000);

            } else {
                console.log('websocket链接断开，重试关闭')
            }
        }

        if (ws) {
            ws.close();
        }
        // ws = new WebSocket(url + '/ws/data/push/' + device_ids.join(',') + '/?doids=' + data_ids.join(','));
        ws = new WebSocket(url + '/ws/data_push/?doids=' + data_ids.join(',')+'&device_ids='+device_ids.join(','));
        ws.onopen = function () {
            console.log('websocket conneted!')
            callback(status.SOCKET_ONOPEN, '数据管道已连接！')

        };

        ws.onclose = function () {
            callback(status.SOCKET_ONCLOSE, '数据管道已断开！')
            setTimer()
        };

        ws.onmessage = function (event) {

            var data = JSON.parse(event.data);
            var devId_IN = ''
            var notDataReport = false
            try {
                if ('dev_info' in data) {
                    devId_IN = data.dev_info.split('——')[1]
                } else {
                    notDataReport = true
                }
            } catch (err) {
                callback(status.SOCKET_ONERROR, err + ':' + event.data)
                return
            }

            if (devId_filter.length != 0 && devId_filter.indexOf(devId_IN) == -1) {
                callback(status.SOCKET_WARNING, '忽略此设备数据：' + data.dev_info)
            } else if (notDataReport == true) {
                callback(status.SOCKET_WARNING, data)
                if (data.event == 'offline') {
                    //设备下线
                    callback(status.SOCKET_DEVSTATUS, data)
                } else if (data.event == 'online') {
                    //设备上线
                    callback(status.SOCKET_DEVSTATUS, data)
                } else {
                    //未知数据上报
                    callback(status.SOCKET_WARNING, data)
                }
            } else {
                //正常数据返回
                callback(status.SOCKET_ONMESSAGE, data)
            }
        };

        //保持连接
        if (ws.readState === WebSocket.OPEN) {
            ws.onopen()
        }
    }
    // //心跳检测
    // var heartCheck = {
    //     timeout: 5000, //60秒
    //     timeoutObj: null,
    //     serverTimeoutObj: null,
    //     closeSocket: false,
    //     stop: function () {
    //         clearTimeout(this.timeoutObj);
    //         clearTimeout(this.serverTimeoutObj);
    //         // this.closeSocket = true
    //     },
    //     reset: function () {
    //         this.stop()
    //         return this;
    //     },
    //     start: function () {
    //         var self = this;
    //         this.timeoutObj = setTimeout(function () {
    //             //这里发送一个心跳，后端收到后，返回一个心跳消息，
    //             //onmessage拿到返回的心跳就说明连接正常
    //             ws.send('ping')
    //             self.serverTimeoutObj = setTimeout(function () { //如果超过一定时间还没重置，说明后端主动断开了
    //                 callback(status.SOCKET_RECONNECT, 'heartbeat error,local network lost?')
    //                 ws.close(); //如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
    //             }, self.timeout)
    //         }, this.timeout)
    //     }
    // }
    //
    // function clearTimer() {
    //     if (timerId) {
    //         clearTimeout(timerId)
    //         timerId = null
    //     }
    // }
    //
    // function setTimer(sec, msg) {
    //     clearTimer()
    //     callback(status.SOCKET_RECONNECT, 'WEBSOCKET' + msg + '，' + sec.toString() + 's后将重试...')
    //     timerId = setTimeout(function () {
    //         subIotosWs(callback, device_ids, data_ids, url, devId_filter)
    //     }, sec * 1000);
    // }
    //
    // if (window.WebSocket) {
    //     if (ws != null) {
    //         try {
    //             ws.close();
    //         } catch (err) {
    //             callback(status.SOCKET_ONERROR, 'WEBSOCKET' + msg + '，' + sec.toString() + 's后将重试...')
    //         }
    //         ws = null;
    //     }
    //     if (ws == null) {
    //         callback(status.SOCKET_CONNECTING, '连接中，请稍候...')
    //         var socketUrl = url + "/data/push?device_ids=" + device_ids.join(',') + "&data_ids=" + data_ids.join(',');
    //         callback(status.SOCKET_DEBUGINFO, socketUrl)
    //         ws = new WebSocket(socketUrl);
    //
    //         //①接受消息
    //         ws.onmessage = function (event) {
    //             heartCheck.reset().start();
    //
    //             var data = JSON.parse(event.data);
    //             var devId_IN = ''
    //             var notDataReport = false
    //             try {
    //                 if ('dev_info' in data) {
    //                     devId_IN = data.dev_info.split("——")[1]
    //                 } else {
    //                     notDataReport = true
    //                 }
    //             } catch (err) {
    //                 callback(status.SOCKET_ONERROR, err + ':' + event.data)
    //                 return
    //             }
    //
    //             if (devId_filter.length != 0 && devId_filter.indexOf(devId_IN) == -1) {
    //                 callback(status.SOCKET_WARNING, '忽略此设备数据：' + data.dev_info)
    //             } else if (notDataReport == true) {
    //                 callback(status.SOCKET_WARNING, data)
    //                 if (data.event == 'offline') {
    //                     //设备下线
    //                     callback(status.SOCKET_DEVSTATUS, data)
    //                 } else if (data.event == 'online') {
    //                     //设备上线
    //                     callback(status.SOCKET_DEVSTATUS, data)
    //                 } else {
    //                     //未知数据上报
    //                     callback(status.SOCKET_WARNING, data)
    //                 }
    //             } else {
    //                 //正常数据返回
    //                 callback(status.SOCKET_ONMESSAGE, data)
    //             }
    //         };
    //
    //         ws.onerror = function (event) {
    //             callback(status.SOCKET_ONERROR, '通道错误！' + event.data)
    //             setTimer(10, '通道错误' + event.data)
    //         };
    //
    //         ws.onopen = function () {
    //             callback(status.SOCKET_ONOPEN, '数据管道已连接！')
    //             clearTimer()
    //             //心跳检测重置
    //             heartCheck.reset().start();
    //         };
    //
    //         ws.onclose = function () {
    //             let infotmp = '数据管道已断开！'
    //             callback(status.SOCKET_ONCLOSE, infotmp)
    //             if (heartCheck.closeSocket == true) {
    //                 clearTimer()
    //             } else
    //                 setTimer(3, infotmp)
    //             ws = null;
    //         };
    //         return {
    //             ws,
    //             heartCheck
    //         }
    //     }
    // } else {
    //     alert("Sorry, your browser does not support WebSocket!");
    // }
}
//----------------------------------------------------------------------

const ajax = (options) => {
    options = options || {};
    options.type = (options.type || "GET").toUpperCase();
    options.dataType = options.dataType || "json";
    var params = formatParams(options.data);
    //创建xhr对象 - 非IE6
    if (window.XMLHttpRequest) {
        var xhr = new XMLHttpRequest();
    } else { //IE6及其以下版本浏览器
        var xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }
    //GET POST 两种请求方式
    if (options.type == "GET") {
        xhr.open("GET", options.url + "?" + params, true);
        xhr.send(null);
    } else if (options.type == "POST") {
        xhr.open("POST", options.url, true);
        //设置表单提交时的内容类型
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.send(params);
    }
    //接收
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            var status = xhr.status;
            if (status >= 200 && status < 300) {
                options.success && options.success(xhr.responseText);
            } else {
                options.fail && options.fail(status);
            }
        }
    }
}

//格式化参数
const formatParams = (data) => {
    var arr = [];
    for (var name in data) {
        arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
    }
    arr.push(("v=" + Math.random()).replace(".", ""));
    return arr.join("&");
}