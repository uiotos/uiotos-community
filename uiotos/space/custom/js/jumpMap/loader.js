        window.jumpmapNotifier = new ht.Notifier();
        jumpmapNotifier.add((e) => {
            const {
                kind,
                para
            } = e
            const {
                data,
            } = para
            if (kind === 'jumpmap') {
                console.error(data)
            }
        })
        var mapDir = ['China'],
            labelList = [],
            dataModel = new ht.DataModel(),
            g2d = new ht.graph.GraphView(dataModel);

        var jumpMapInit = function() {
            var mapName = mapDir[mapDir.length - 1];
            initHT(g2d);
            mapParser.parseMap(nameMap[mapName], createMap, 3000);
        };

        function updateLabel() {
            var labelSize = {
                w: 200,
                h: 50
            };
            var z = g2d.getZoom();
            labelList.forEach(function(d) {
                d.setSize(labelSize.w / z, labelSize.h / z);
            });
        };

        function createMap(obj) {
            dataModel.clear();

            var minPos = obj.minPos,
                list = obj.list,
                s, text, p,
                points = null,
                segments = null;
            list.forEach(function(r, index) {
                s = new ht.Shape();
                s.s({
                    'shape.background': '#323c48',
                    // 'opacity' : 0.2,
                    'shape.border.width': 1,
                    'shape.border.color': '#404a59'
                });
                s.setLayer('shape');
                points = [];
                segments = [];
                if (r.type === 'MultiPolygon') {
                    r.coordinates.forEach(function(d) {
                        points.push.apply(points, d.points);
                        segments.push.apply(segments, d.segments);
                    });
                } else {
                    points.push.apply(points, r.points);
                    segments.push.apply(segments, r.segments);
                }
                points.forEach(function(d) {
                    d.x -= minPos.x;
                    d.y -= minPos.y;
                });
                s.a('data', r);
                s.setPoints(points);
                s.setSegments(segments);
                dataModel.add(s);

                text = new ht.Node();
                text.setImage('mapText');
                text.a('isText', true);
                p = s.p();
                text.p(p.x, p.y);
                text.setLayer('text');
                var isChina = r.name === 'china';
                text.a('isChina', isChina);
                text.s({
                    '2d.visible': mapDir[mapDir.length - 1] !== 'world' || isChina,
                    'text': r.name,
                    'text.color': text.a('isChina') ? 'red' : 'white',
                    'text.align': 'center',
                    'text.vAlign': 'middle'
                });
                if (isChina)
                    text.s('text.font', '24px arial, sans-serif');
                dataModel.add(text);

                text.setHost(s);
                s.setHost(text);

                labelList.push(text);
            });
            g2d.fitContent(true);
            updateLabel();
        };



        function initHT(g2d) {
            g2d.setLayers(['shape', 'text']);
            g2d.isLabelVisible = function() {
                return true;
            };
            g2d.adjustZoom = function(v) {
                return v;
            };
            g2d.setInteractors([
                new ht.graph.DefaultInteractor(g2d)
            ]);
            g2d.addToDOM();

            g2d.mp(function(e) {
                if (e.property !== 'zoom') return;
                updateLabel();
            });
            g2d.mi(function(e) {
                var kind = e.kind;
                if (kind === 'doubleClickBackground') {
                    if (mapDir.length === 1) return;
                    mapDir.pop();
                    mapParser.parseMap(mapDir[mapDir.length - 1], createMap);
                } else if (kind === 'doubleClickData') {
                    var data = e.data;
                    if (!data.a('isText')) data = data.getHost();
                    var mapName = nameMap[data.s('text')];

                    jumpmapNotifier.fire({
                        kind: 'jumpmap',
                        para: {
                            data: data.s('text')
                        }
                    })

                    if (!mapName) return;
                    mapDir.push(mapName);
                    mapParser.parseMap(mapName, createMap);
                }
            });

            var view = g2d.getView(),
                data, isDown = false,
                lastPoint, currPoint, translate;
            view.style.background = '#404a59';
            view.addEventListener('mousedown', function(e) {
                isDown = true;
                lastPoint = ht.Default.getClientPoint(e);
                translate = {
                    x: g2d.tx(),
                    y: g2d.ty()
                };
            });
            view.addEventListener('mouseup', function(e) {
                isDown = false;
                lastPoint = null;
                translate = null;
                currPoint = null;
            });
            view.addEventListener('mousemove', function(e) {
                if (isDown) {
                    currPoint = ht.Default.getClientPoint(e);
                    g2d.tx(translate.x + currPoint.x - lastPoint.x);
                    g2d.ty(translate.y + currPoint.y - lastPoint.y);
                }

                if (data) {
                    data.s('shape.background', '#323c48');
                    data.getHost().s('text.color', data.getHost().a('isChina') ? 'red' : 'white');
                }
                data = g2d.getDataAt(e);
                if (!data) return;
                if (data.a('isText')) data = data.getHost();
                data.s('shape.background', '#2A333C');
                data.getHost().s('text.color', 'orange');
            });
        };