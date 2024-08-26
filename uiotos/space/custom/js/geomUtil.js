GeomUtil = {};
// Ramer Douglas Peucker算法
GeomUtil.RDPsd = function(points, epsilon, ignoreList) {
    // 不需要简化
    if (points.length < 3) {
        return points;
    }

    var firstPoint = points[0];
    var lastPoint = points[points.length-1];
    var index = -1;
    var dist = 0;
    var i, len = points.length;

    // 找到中间差值最大的点
    for (i = 1; i < len - 1; i++) {
        var cDist = this._distanceFromPointToLine(points[i], firstPoint, lastPoint);
        if (cDist > dist) {
            dist = cDist;
            index = i;
        }
    }

    // 这个差值已经超过阈值，则分段继续迭代
    if (dist > epsilon) {
        // 前半段
        var l1 = points.slice(0, index + 1);
        // 后半段
        var l2 = points.slice(index);
        // 迭代前半段
        var r1 = this.RDPsd(l1, epsilon);
        // 迭代后半段
        var r2 = this.RDPsd(l2, epsilon);

        // 将 r1, r2 的结果合并，注意 r1 的最后一个元素跟 r2 第一个元素重叠，故略去
        var rs = r1.slice(0, r1.length - 1).concat(r2);
        return rs;
    }
    
    // 所有的差值足够小，则直接返回头尾两个点
    return [firstPoint, lastPoint];
};

GeomUtil._isContain = function(list, p) {
    var r;
    for (var i = 0, len = list.length; i < len; i++) {
        r = list[i];
        if (this._equal(r.x, p.x) && 
            this._equal(r.y, p.y))
            return true;
    }
    return false;
};

GeomUtil._equal = function(a, b) {
    return Math.abs(a - b) < 1e-4;
};

// 计算一个点到一条直线的距离
GeomUtil._distanceFromPointToLine = function(p, a, b){
    // 转换下格式便于后续代码阅读
    p = { x : p.x, y : p.y };
    a = { x : a.x, y : a.y };
    b = { x : b.x, y : b.y };

    // 线段的长度
    var lineLength = this._pointDistance(a, b);
	if (lineLength === 0) {
        // 线段是一个点，距离就是 p 跟这个点的距离
		return this._pointDistance(p,a);
	}

    // 比较 p 跟 a/b 点的距离关系
	var t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / lineLength;
	if (t < 0) {
        // 点在 a 点的后面，更靠近 a
		return this._pointDistance(p, a);
	}
	if (t > 1) {
        // 点更靠近 b
		return this._pointDistance(p, b);
	}

    // 在 ab 线段之间
	return this._pointDistance(p, {
        x : a.x + t * (b.x - a.x),
        y : a.y + t * (b.y - a.y)
    });
};

// 计算两个点之间的距离
GeomUtil._pointDistance = function(i, j) {
    var l1 = i.x - j.x;
    var l2 = i.y - j.y;

    return l1 * l1 + l2 * l2;
};
