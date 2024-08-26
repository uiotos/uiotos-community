/**
 * 画布js，用于在地图中画多边形，点击以绘画，右键回退，绘制完成后右键取消，可以通过覆盖DrawTool.onDoubleClick函数来实现双击操作,
 * 通过DrawTool.iconUrl='path'来设置绘制图像的点图标
 */
var DrawTool = {};
DrawTool.points = [];// 绘制图形的点纬度和经度集合 【【】，【】】 
DrawTool.markers=[];// 标记图标
DrawTool.lines  = new L.polyline(DrawTool.points);
DrawTool.tempLines  = new L.polyline([],{dashArray: 12});
DrawTool.polygons = new L.polygon(DrawTool.points);
DrawTool.tempPolygons = new L.polygon([],{color: 'none',fillColor: 'red'});

// 双击执行的函数
DrawTool.onDoubleClick = function (e){
	alert("选定完成: \n "+ JSON.stringify(DrawTool.points));
	return false;
}

DrawTool.init = function (map,iconUrl){
	// var circldRadius = 50;
	map.off('click');
	map.on('click', onClick);    //点击地图
	map.off('contextmenu');
	map.on('contextmenu', contextmeanClick); // 右键地图

	function onClick(e) {
		var marker;
		if(iconUrl){
			marker = L.marker(e.latlng,{icon: L.icon({iconUrl: 'img/move.png', iconSize: [25,25]})});
		}else{
			marker = L.marker(e.latlng);
		}
		if(DrawTool.points.length <= 0){
			marker.on('click',clickMarker);
		}
		marker.addTo(map);
		DrawTool.points.push([e.latlng.lat, e.latlng.lng]);
		DrawTool.lines .addLatLng(e.latlng);
		map.addLayer(DrawTool.lines );
		// map.addLayer(marker);
		DrawTool.markers.push(marker);
		map.on('mousemove', onMove);//鼠标移动
	}

	function onMove(e) {
		if (DrawTool.points.length > 0) {
			ls = [DrawTool.points[DrawTool.points.length - 1], [e.latlng.lat, e.latlng.lng]];
			DrawTool.tempLines.setLatLngs(ls);
			map.addLayer(DrawTool.tempLines);
			DrawTool.tempPolygons.setLatLngs(DrawTool.points);
			DrawTool.tempPolygons.addTo(map);
		}
	}

	// 右键回退一步
	function contextmeanClick(e){
		DrawTool.points.splice(DrawTool.points.length - 1,1);
		if (DrawTool.points.length > 0) {
			ls = [DrawTool.points[DrawTool.points.length - 1], [e.latlng.lat, e.latlng.lng]];
			DrawTool.tempLines.setLatLngs(ls);
			map.addLayer(DrawTool.tempLines);
			DrawTool.tempPolygons.setLatLngs(DrawTool.points);
			DrawTool.tempPolygons.addTo(map);
			DrawTool.lines .remove();
			DrawTool.lines  = new L.polyline(DrawTool.points);
			DrawTool.lines .addTo(map);
			DrawTool.markers[DrawTool.markers.length - 1].remove();
			DrawTool.markers.splice(DrawTool.markers.length - 1,1);
		}else{
			DrawTool.tempLines.remove();
			DrawTool.lines .remove();
			if(DrawTool.markers.length > 0){
				DrawTool.markers[DrawTool.markers.length - 1].remove();
				DrawTool.markers.splice(DrawTool.markers.length - 1,1);
			}
			DrawTool.points =[];
			DrawTool.markers = [];
			DrawTool.lines  = new L.polyline(DrawTool.points);
		}
	}

	// 点击第一个节点停止绘画
	function clickMarker(e){
		// 关闭画图事件
		map.off('dblclick');
		map.off('mousemove');
		map.off('click');
		// 停止右键事件并且绑定新的
		map.off('contextmenu'); // 右键地图
		map.on('contextmenu', cancle); // 右键地图
		// 移除临时线和面
		DrawTool.tempLines.remove();
		DrawTool.tempPolygons.remove();
		DrawTool.polygons = L.polygon(DrawTool.points);
		DrawTool.polygons.addTo(map);
		DrawTool.polygons.on('dblclick', DrawTool.onDoubleClick);
		// 移动标记（微调）
		for(var marker of DrawTool.markers){
			marker.dragging.enable();
			marker.on('dragend',function(event){
				resetRegion();
			});
		}
	}

	// 调整了坐标点
	function resetRegion(){
		DrawTool.points = [];
		for(var marker of DrawTool.markers){
			DrawTool.points.push([marker.getLatLng().lat,marker.getLatLng().lng]);
		};
		DrawTool.polygons.remove();
		DrawTool.lines .remove();
		DrawTool.polygons = L.polygon(DrawTool.points);
		DrawTool.polygons.on('dblclick', DrawTool.onDoubleClick);
		DrawTool.polygons.addTo(map);
	}

	// 右键取消
	function cancle(e){
		map.on('click',onClick);
		map.off('contextmenu');
		map.on('contextmenu', contextmeanClick); // 右键地图
		for(var marker of DrawTool.markers){
			marker.remove();
		}
		DrawTool.points = [];
		DrawTool.markers=[];
		DrawTool.lines .remove();
		DrawTool.tempLines.remove();
		DrawTool.tempPolygons.remove();
		DrawTool.polygons.remove();
		DrawTool.polygons = new L.polygon(DrawTool.points);
		DrawTool.lines  = new L.polyline(DrawTool.points);
		DrawTool.tempLines = new L.polyline([],{dashArray: 12});
		DrawTool.tempPolygons = new L.polygon([],{color: 'none',fillColor: 'red'});
	}
}
