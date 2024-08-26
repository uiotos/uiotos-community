

function resetDataCoord(gv, data) {

    if (data instanceof ht.Shape) {
        var points = data.a('map.points') || []
        data.setPoints(new ht.List(points.map(p => {
            var { x, y } = gv.map.project(p)
            return { x, y }
        })))
    } else if (data instanceof ht.Edge) {
        var points = data.a('map.points') || []
        data.s('edge.points', new ht.List(points.map(p => {
            var { x, y } = gv.map.project(p)
            return { x, y }
        })))

    } else if (data instanceof ht.Node) {
        var iflayout = data.a('iflayout')
        // 参与布局的话，所有缩放等功能都将失去作用
        if(!iflayout){
            var coord = data.a('coord') //获取节点的业务属性 coord
            if (coord) {
                // 是否参与移动
                var ifmove = data.a('ifmove')
                if(ifmove){
                    data.setPosition(gv.map.project(coord))
                }else {
                    //added by lrq 20211027 根据GIS定位坐标，还原Node节点图标在屏幕上的坐标和尺寸大小！
                    var coordTopLeft = data.a('coordTopLeft')
                    if (coordTopLeft && gv.dm().a('tzoom')) {
                        var topLeftPos = gv.map.project(coordTopLeft)
                        var centerPos = gv.map.project(coord)
                        data.setRect(topLeftPos.x, topLeftPos.y, 2 * (centerPos.x - topLeftPos.x), 2 * (centerPos.y - topLeftPos.y))
                    } else {
                        data.setPosition(gv.map.project(coord)) //重新给节点设置坐标
                    }
                }
            }
        }
    }
}

function resetGraphView(gv) {
    gv.__loading = true
    gv.tx(0) //grpahView 水平平移值
    gv.ty(0)

    gv.dm().each(function(data) {
        resetDataCoord(gv, data)
    })

    gv.validate() //刷新拓扑组件
    gv.__loading = false

}

function initMapEditor(gv) {
    window.gv = gv
    if (gv.map) {
        return
    }
    gv.setScrollBarVisible(false) //设置滚动条是否可见
    gv.setAutoScrollZone(-1) //设置自动滚动区域大小，当鼠标距离拓扑边缘小于这个值时，拓扑自动滚动
    gv.handleScroll = function() {}
    gv.handleScroll = function() {};
    gv.setPannable(false)
    gv.setRectSelectable(false)
    gv.setZoom(1)
    gv.adjustZoom = function() { return 1 }


    var mapContainer = gv.mapContainer = document.createElement('div')
    gv.getView().parentElement.append(mapContainer)
    mapContainer.style = 'position:absolute; top:0; bottom:0; width:100%;'
    var layer = new AMap.TileLayer()
    var layers = [layer]
    if (gv.dm().a('satellite')) {
        var satellite_layer = new AMap.TileLayer.Satellite()
        layers.push(satellite_layer)
    }
    var centerinfo = gv.dm().a('centerinfo')
    if(centerinfo == undefined){
        centerinfo = [10, 114.289326, 30.686361]
    }
    var map = gv.map = new window.AMap.Map(mapContainer, {
        //3D模式开启、关闭
        // rotateEnable: true,
        // pitchEnable: true,
        // pitch: 80,
        // rotation: -15,
        // viewMode: '3D', //开启3D视图,默认为关闭
        buildingAnimation: true, //楼块出现是否带动画

        center: [centerinfo[1], centerinfo[2]],
        layers: layers,
        mapStyle: "amap://styles/whitesmoke",
        zoom: centerinfo[0],
        expandZoomRange: true,
        resizeEnable: true,
        zooms: [3, 20],
    })

    map.unproject = function(pos) {
        var pixel = new window.AMap.Pixel(pos.x, pos.y)
        var lnglat = map.containerToLngLat(pixel) //根据坐标的像素获取地图视图投影中的坐标
        return { lng: lnglat.getLng(), lat: lnglat.getLat() }
    }

    map.project = function(p) {
        var lnglat = new window.AMap.LngLat(p.lng, p.lat)
        var pixel = map.lngLatToContainer(lnglat)
        return { x: pixel.getX(), y: pixel.getY() }
    }

    map.getBoundsBBox = () => {
        var bounds = map.getBounds()
        if (bounds instanceof window.AMap.ArrayBounds) {
            return bounds.bounds.map(item => {
                return [item.lng, item.lat]
            })
        }
        var southWest = bounds.getSouthWest()
        var northEast = bounds.getNorthEast()
        return [
            [southWest.getLng(), southWest.getLat()],
            [southWest.getLng(), northEast.getLat()],
            [northEast.getLng(), northEast.getLat()],
            [northEast.getLng(), southWest.getLat()],
            [southWest.getLng(), southWest.getLat()],
        ]
    }
    map.on('zoomchange', () => {
        resetGraphView(gv)
    })
    map.on('zoomend', () => {
        resetGraphView(gv)
    })
    map.on('mapmove', () => {
        resetGraphView(gv)
    })
    map.on('moveend', () => {
        center_info = gv.map.getCenter();
        lng = center_info.lng
        lat = center_info.lat
        gv.dm().a('centerinfo', [gv.map.getZoom(), lng, lat])
        resetGraphView(gv)
    })
    map.on('resize', () => {
        resetGraphView(gv)
    })
    map.on('rotation', () => {
        resetGraphView(gv)
    })
    map.on('pitch', () => {
        resetGraphView(gv)
    })
    gv.addToDOM(mapContainer.querySelector('.amap-maps'))

    var view = gv.getView()
        // 拖拽node时不要移动地图
    var stopGraphPropagation = function(e) {
        var data = gv.getDataAt(e) //获取graphView事件下的节点
        var interaction = gv.getEditInteractor()
        if (data || e.metaKey || e.ctrlKey || interaction && interaction.disabled) {
            e.stopPropagation()
        }
    }
    view.addEventListener('pointerdown', stopGraphPropagation, false) //触摸a
    view.addEventListener('touchstart', stopGraphPropagation, false) //触摸开始（用户把手指放在屏幕上）
    view.addEventListener('mousedown', stopGraphPropagation, false) //鼠标点下事件
    gv.dm().mm(function(e) { // addDataModelChangeListener: 数据容器增删改查变化监听
        if (e.kind === 'add') { //添加事件&&事件对象不是 ht.Edge 类型
            var data = e.data

            if (data instanceof ht.Shape) {
                var points = data.getPoints()
                if (points instanceof ht.List) {
                    data.a('map.points', points.toArray().map(p => map.unproject(p)))
                }
            } else if (data instanceof ht.Edge) {
                var points = data.s('edge.points')
                if (points instanceof ht.List) {
                    data.a('map.points', points.toArray().map(p => map.unproject(p)))
                }
            } else if (data instanceof ht.Node) {
                var position = data.getPosition()
                var coordPosition = map.unproject(position)
                data.a('coord', coordPosition);

                var coordTopLeft = map.unproject(data.getRect())
                data.a('coordTopLeft', coordTopLeft)
            }
        }
    })
    gv.dm().md(e => { // addDataPropertyChangeListener: 监听属性变化
            if (gv.__loading) {
                return
            }
            var data = e.data
                // console.log(e)
            if (e.property === 's:edge.points' || e.property === 'points') {
                data.a('map.points', null)
                if (e.newValue) {
                    var points = e.newValue
                    if (points instanceof ht.List) {
                        data.a('map.points', points.toArray().map(p => map.unproject(p)))
                    }
                }
            } else if (e.property === 'position') {
                var position = data.getPosition()
                    // console.log('position :', map.unproject(position))
                var coordPosition = map.unproject(position)
                data.a('coord', coordPosition)

                //added by lrq 2021.10.26 新建图标Node时存放对应到GIS地图上左上顶点坐标
                var coordTopLeft = map.unproject(data.getRect())
                data.a('coordTopLeft', coordTopLeft)

            }
        })
        // 监听选中状态，哪有节点被节点时，禁用地图交互, 反之允许地图交互
    gv.dm().sm().ms(e => {
        if (gv.dm().sm().ld()) {
            map.setStatus({
                keyboardEnable: false,
                zoomEnable: false,
                dragEnable: false,
                doubleClickZoom: false,
                rotateEnable: false,
                pitchEnable: false,
            })
        } else {
            map.setStatus({
                keyboardEnable: true,
                zoomEnable: true,
                dragEnable: true,
                doubleClickZoom: true,
                rotateEnable: true,
                pitchEnable: true,
            })
        }
    })
}

function initMapViewer(gv) {

    if (gv.map) {
        return
    }
    gv.setScrollBarVisible(false) //设置滚动条是否可见
    gv.setAutoScrollZone(-1) //设置自动滚动区域大小，当鼠标距离拓扑边缘小于这个值时，拓扑自动滚动
    gv.handleScroll = function() {}
    gv.handlePinch = function() {}
    gv.setPannable(false)
    gv.setRectSelectable(false)
    gv.setZoom(1)
    gv.adjustZoom = function() { return 1 }

    var mapContainer = gv.mapContainer = document.createElement('div')
    document.body.appendChild(mapContainer)
    mapContainer.style = 'position:absolute; top:0; bottom:0; width:100%;'
    var map = gv.map = new window.AMap.Map(mapContainer, {

        //3D模式开启、关闭
        rotateEnable: true,
        pitchEnable: true,
        pitch: 80,
        rotation: -15,
        // viewMode: '3D', //开启3D视图,默认为关闭
        buildingAnimation: true, //楼块出现是否带动画

        zoom: 10,
        expandZoomRange: true,
        resizeEnable: true,
        zooms: [3, 20],
    })

    map.unproject = function(pos) {
        var pixel = new window.AMap.Pixel(pos.x, pos.y)
        var lnglat = map.containerToLngLat(pixel) //根据坐标的像素获取地图视图投影中的坐标
        return { lng: lnglat.getLng(), lat: lnglat.getLat() }
    }

    map.project = function(p) {
        var lnglat = new window.AMap.LngLat(p.lng, p.lat)
        var pixel = map.lngLatToContainer(lnglat)
        return { x: pixel.getX(), y: pixel.getY() }
    }

    map.getBoundsBBox = () => {
        var bounds = map.getBounds()
        if (bounds instanceof window.AMap.ArrayBounds) {
            return bounds.bounds.map(item => {
                return [item.lng, item.lat]
            })
        }
        var southWest = bounds.getSouthWest()
        var northEast = bounds.getNorthEast()
        return [
            [southWest.getLng(), southWest.getLat()],
            [southWest.getLng(), northEast.getLat()],
            [northEast.getLng(), northEast.getLat()],
            [northEast.getLng(), southWest.getLat()],
            [southWest.getLng(), southWest.getLat()],
        ]
    }
    map.on('zoomchange', () => {
        resetGraphView(gv)
    })
    map.on('zoomend', () => {
        resetGraphView(gv)
    })
    map.on('mapmove', () => {
        resetGraphView(gv)
    })
    map.on('moveend', () => {
        resetGraphView(gv)
    })
    map.on('resize', () => {
        resetGraphView(gv)
    })
    map.on('rotation', () => {
        resetGraphView(gv)
    })
    map.on('pitch', () => {
        resetGraphView(gv)
    })
    gv.addToDOM(mapContainer.querySelector('.amap-maps'))

    var view = gv.getView()
        // 拖拽node时不要移动地图
    var stopGraphPropagation = function(e) {
        var data = gv.getDataAt(e) //获取graphView事件下的节点
        var interaction = gv.getEditInteractor()
        if (data || e.metaKey || e.ctrlKey || interaction && interaction.disabled) {
            e.stopPropagation()
        }
    }
    view.addEventListener('pointerdown', stopGraphPropagation, false) //触摸
    view.addEventListener('touchstart', stopGraphPropagation, false) //触摸开始（用户把手指放在屏幕上）
    view.addEventListener('mousedown', stopGraphPropagation, false) //鼠标点下事件
    gv.dm().mm(function(e) { // addDataModelChangeListener: 数据容器增删改查变化监听
            if (e.kind === 'add') { //添加事件&&事件对象不是 ht.Edge 类型
                var data = e.data

                if (data instanceof ht.Shape) {
                    var points = data.getPoints()
                    if (points instanceof ht.List) {
                        data.a('map.points', points.toArray().map(p => map.unproject(p)))
                    }
                } else if (data instanceof ht.Edge) {
                    var points = data.s('edge.points')
                    if (points instanceof ht.List) {
                        data.a('map.points', points.toArray().map(p => map.unproject(p)))
                    }
                } else if (data instanceof ht.Node) {
                    var position = data.getPosition()
                    var coordPosition = map.unproject(position)
                    data.a('coord', coordPosition)
                }
            }
        })
        // 监听选中状态，哪有节点被节点时，禁用地图交互, 反之允许地图交互
        // gv.dm().sm().ms(e => {
        //     if (gv.dm().sm().ld()) {
        //         map.setStatus({
        //             keyboardEnable: false,
        //             zoomEnable: false,
        //             dragEnable: false,
        //             doubleClickZoom: false,
        //             rotateEnable: false,
        //             pitchEnable: false,
        //         })
        //     } else {
        //         map.setStatus({
        //             keyboardEnable: true,
        //             zoomEnable: true,
        //             dragEnable: true,
        //             doubleClickZoom: true,
        //             rotateEnable: true,
        //             pitchEnable: true,
        //         })
        //     }
        // })
}