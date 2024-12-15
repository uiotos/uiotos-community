;
(function (window) {
    var dom = document.createElement('div'),
        chart = echarts.init(dom);
    var mapParser = window.mapParser = {
        mapList: {},
        maxWidth: 10000,
        parseMap: function (mapName, callback, maxWidth) {
            mapName = mapName.toLowerCase()
            if (maxWidth) this.maxWidth = maxWidth;

            var map = mapParser.mapList[mapName];
            if (map) {
                callback(map);
                return;
            }

            Ajax.get('./custom/libs/amap/position/' + mapName + '.json', function (data) {
                echarts.registerMap(mapName, data);
                chart.setOption({
                    series: [{
                        type: 'map',
                        map: mapName
                    }]
                });
                map = echarts.getMap(mapName);
                map = mapParser.mapList[mapName] =
                    formatFeatures(map.geoJson.features);
                callback(map);
            });
        }
    };

    var formatFeatures = function (features) {
        var result = [],
            map = {},
            res = null,
            name,
            minPos = {
                x: Infinity,
                y: Infinity
            },
            maxPos = {
                x: -Infinity,
                y: -Infinity
            };
        features.forEach(function (obj, index) {
            name = obj.properties.name;
            res = map[name];
            if (!res)
                res = {
                    type: obj.geometry.type,
                    name: name
                };
            if (res.type !== obj.geometry.type) {
                var tempRes = {};
                if (res.type === 'MultiPolygon') {
                    formatcoordinates(tempRes, obj.geometry.coordinates, minPos, maxPos);
                    res.coordinates.push(tempRes);
                } else {
                    tempRes.points = res.points;
                    tempRes.segments = res.segments;

                    delete res.points;
                    delete res.segments;

                    res.type = 'MultiPolygon';
                    if (!res.coordinates) res.coordinates = [];
                    res.coordinates.push(tempRes);
                    obj.geometry.coordinates.forEach(function (l) {
                        l.forEach(function (ps) {
                            res.coordinates.push(formatPoints(ps, minPos, maxPos));
                        });
                    });
                }
            } else if (obj.geometry.type === 'MultiPolygon') {
                if (!res.coordinates) res.coordinates = [];
                obj.geometry.coordinates.forEach(function (l) {
                    l.forEach(function (ps) {
                        res.coordinates.push(formatPoints(ps, minPos, maxPos));
                    });
                });
            } else {
                formatcoordinates(res, obj.geometry.coordinates, minPos, maxPos);
            }
            if (!map[name]) result.push(res);
            map[name] = res;
        });

        var t = mapParser.maxWidth / (maxPos.x - minPos.x);
        result.forEach(function (r) {
            if (r.type === 'MultiPolygon') {
                r.coordinates.forEach(function (c) {
                    c.points.forEach(function (p) {
                        p.x *= t;
                        p.y *= t;
                    });
                });
            } else
                r.points.forEach(function (p) {
                    p.x *= t;
                    p.y *= t;
                });
        });
        return {
            list: result,
            minPos: minPos,
            maxPos: maxPos
        };
    };

    var formatcoordinates = function (res, coordinates, minPos, maxPos) {
        var points = [],
            segments = [],
            obj = null;
        coordinates.forEach(function (list, index) {
            obj = formatPoints(list, minPos, maxPos);
            points.push.apply(points, obj.points);
            segments.push.apply(segments, obj.segments);
        });
        if (!res.points) res.points = [];
        Array.prototype.push.apply(res.points, points);
        if (!res.segments) res.segments = [];
        Array.prototype.push.apply(res.segments, segments);
    };

    var formatPoints = function (points, minPos, maxPos) {
        var ps = [],
            segments = [];
        points.forEach(function (p, i) {
            segments.push(i === 0 ? 1 : 2);

            var x = p[0],
                y = -p[1];
            minPos.x = Math.min(minPos.x, x);
            minPos.y = Math.min(minPos.y, y);
            maxPos.x = Math.max(maxPos.x, x);
            maxPos.y = Math.max(maxPos.y, y);
            ps.push({
                x: x,
                y: y
            });
        });
        return {
            points: ps,
            segments: segments
        };
    };
}(window));