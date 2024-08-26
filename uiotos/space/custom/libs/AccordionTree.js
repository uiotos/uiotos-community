ht.ui.AccordionTree = function (dataModel) {
    var self = this;
    ht.ui.AccordionTree.superClass.constructor.call(self, dataModel);

    // 自定义行高
    self.setRowHeightFunc(function (data) {
        var self = this,
            level = self.getLevel(data),
            headerRowHeight = self.getHeaderRowHeight(),
            childRowHeight = self.getChildRowHeight();
        if (level === 0) { // 一级节点
            return headerRowHeight;
        } else { // 二级节点
            var parent = data.getParent(),
                children = parent.getChildren(),
                firstData = children.get(0),
                lastData = children.get(children.size() - 1);
            if (data === firstData) { // 顶部有 8px 距离
                return childRowHeight + 8;
            } else if (data === lastData) { // 底部有 8px 距离
                return childRowHeight + 8;
            } else { // 上下各有 1px 距离
                return childRowHeight + 2;
            }
        }
    });
}

ht.Default.def('ht.ui.AccordionTree', ht.ui.TreeView, {
    ui_ac: ['drawable:headerSelectBackground', // 选中的 header 背景
        'drawable:headerExpandedBackground', // header 展开时的背景
        'drawable:headerHoverBackground', // 鼠标划过 header 时的背景
        'selectHeaderLabelColor', // header 选中时的文字颜色
        'headerRowHeight', // header 高度
        'childRowHeight', // 普通行高度
        'drawable:expandIcon',
        'drawable:expandSelectIcon',
        'drawable:collapseIcon',
        'drawable:collapseSelectIcon'
    ],

    __expandIconDrawable: new ht.ui.drawable.ImageDrawable('accordion_imgs/expand.png'),
    __expandSelectIconDrawable: new ht.ui.drawable.ImageDrawable('accordion_imgs/expand_select.png'),
    __collapseIconDrawable: new ht.ui.drawable.ImageDrawable('accordion_imgs/collapse.png'),
    __collapseSelectIconDrawable: new ht.ui.drawable.ImageDrawable('accordion_imgs/collapse_select.png'),

    __headerRowHeight: 38,
    __childRowHeight: 30,
    __rowLineColor: '#3d4957',
    __rowLineVisible: true,
    __background: '#364150',
    __labelColor: '#b4bcc8',
    __selectLabelColor: '#b4bcc8',
    __labelFont: '14px "Open Sans", sans-serif',
    __hoverRowBackground: '#3e4b5c',
    __selectRowBackground: '#3e4b5c',
    __headerExpandedBackground: '#2c3542',
    __headerHoverBackground: '#2c3542',
    __headerSelectBackground: '#36c6d3',
    __selectHeaderLabelColor: 'white',

    /**
     * @override
     * 检测 toggle 区域
     */
    toggleHitTest: function (e, data) {
        var self = this;
        if (!data)
            data = self.getDataAt(e);

        if (data.hasChildren()) {
            return true;
        }
    },
    /**
     * 检测是否点击中消息气泡
     */
    infoHitTest: function (e) {
        var self = this,
            data = self.getDataAt(e);
        if (data) {
            var infoRects = data._infoRects;
            if (infoRects) {
                var point = self.getContentPoint(e);
                for (var i = 0, length = infoRects.length; i < length; i++) {
                    var info = infoRects[i];
                    if (ht.Default.containsPoint(info.rect, point)) {
                        return info;
                    }
                }
            }
        }
    },
    /**
     * @override
     * 在右侧绘制 toggle 图标
     */
    drawToggleIcon: function (drawable, x, y, width, height, data) {
        if (drawable) {
            var self = this,
                contentWidth = self.getContentWidth(),
                oldHeight = height;
            width = height = 12;

            drawable.draw(contentWidth - width * 2.5, y + (oldHeight - height) / 2, width, height, data, self);
        }
    },

    /**
     * 遍历选中的节点，判断是否是参数 data 的子节点
     */
    hasSelectedChildren: function (data) {
        if (data.hasChildren()) {
            var self = this,
                childSelected = false,
                selection = self.sm().getSelection();

            for (var i = 0, size = selection.size(); i < size; i++) {
                var leafData = selection.get(i);
                if (leafData.getParent() === data) {
                    childSelected = true;
                    break;
                }
            }
            return childSelected;
        }
    },
    /**
     * @override
     * 返回自定义的行背景
     */
    getCurrentRowBackgroundDrawable: function (data, selected) {
        var self = this,
            level = self.getLevel(data);
        if (level === 0) {
            var childSelected = self.hasSelectedChildren(data);
            if (childSelected) {
                return self.getHeaderSelectBackgroundDrawable();
            } else if (data === self.getHoverData()) {
                return self.getHeaderHoverBackgroundDrawable();
            } else if (self.isExpanded(data)) {
                return self.getHeaderExpandedBackgroundDrawable();
            }
        } else {
            if (selected) {
                return self.getSelectRowBackgroundDrawable();
            } else if (data === self.getHoverData()) {
                return self.getHoverRowBackgroundDrawable();
            }
        }
    },

    /**
     * @override
     * 只有一级节点才有行线
     */
    drawRowLine: function (g, color, x, y, w, h, data) {
        if (!data.getParent()) {
            ht.ui.AccordionTree.superClass.drawRowLine.call(this, g, color, x, y, w, h, data);
        }
    },

    /**
     * @override
     * 返回自定义的 Toggle 图标
     */
    getToggleIconDrawable: function (data) {
        var self = this,
            level = self.getLevel(data);
        if (level === 0) {
            var expanded = self.isExpanded(data);
            if (expanded) {
                if (self.hasSelectedChildren(data)) return self.getExpandSelectIconDrawable();
                else return self.getExpandIconDrawable();
            } else {
                if (self.hasSelectedChildren(data)) return self.getCollapseSelectIconDrawable();
                else return self.getCollapseIconDrawable();
            }
        }
    },

    /**
     * @override
     * 返回自定义的图标
     */
    getIcon: function (data) {
        if (data.hasChildren()) {
            if (this.hasSelectedChildren(data))
                return data.a('selectIcon') || data.a('icon');
            else
                return data.a('icon');
        } else {
            if (this.isSelected(data))
                return data.a('selectIcon') || data.a('icon');
            else
                return data.a('icon');
        }
    },

    /**
     * @override
     * 返回自定义的文字颜色
     */
    getCurrentLabelColor: function (data) {
        var self = this;
        if (data) {
            if (data.hasChildren()) {
                if (self.hasSelectedChildren(data)) {
                    return self.getSelectHeaderLabelColor();
                }
            } else {
                if (self.isSelected(data)) {
                    return self.getSelectLabelColor();
                }
            }
        }
        return self.getPropertyValue('labelColor');
    },

    /**
     * @override
     * 判断是否点击中了节点
     */
    getDataAt: function (pointOrEvent) {
        var self = this;
        if (ht.Default.getTarget(pointOrEvent)) {
            pointOrEvent = self.getContentPoint(pointOrEvent);
        }

        var rows = self.getRowDatas(),
            size = rows.size(),
            rowHeightFunc = self.getRowHeightFunc(),
            index = -1;
        if (rowHeightFunc) {
            var startY = 0,
                endY = 0;
            for (var i = 0; i < size; i++) {
                var row = rows.get(i),
                    level = self.getLevel(row),
                    rowHeight = rowHeightFunc.call(self, row),
                    rawStartY = startY,
                    rawRowHeight = rowHeight,
                    rect = self.adjustRowRect(row, 0, startY, 0, rowHeight);
                startY = rect[1];
                rowHeight = rect[3];
                endY = startY + rowHeight;

                if (pointOrEvent.y > startY && pointOrEvent.y <= endY) {
                    index = i;
                    break;
                }
                startY = rawStartY + rawRowHeight;
            }
        }

        return (index < 0 || index >= size) ? null : rows.get(index);
    },
    adjustRowRect: function (data, x, y, width, height) {
        var level = this.getLevel(data);
        if (level === 1) {
            var parent = data.getParent(),
                children = parent.getChildren(),
                firstData = children.get(0),
                lastData = children.get(children.size() - 1);
            if (data === firstData) {
                y += 7;
                height -= 8;
            } else if (data === lastData) {
                y += 1;
                height -= 8;
            } else {
                y += 1;
                height -= 2;
            }
        }
        return [x, y, width, height];
    },
    /**
     * @override
     * 重绘行
     */
    drawRow: function (g, data, selected, x, y, width, height) {
        var rect = this.adjustRowRect(data, x, y, width, height);
        x = rect[0];
        y = rect[1];
        width = rect[2];
        height = rect[3];
        ht.ui.AccordionTree.superClass.drawRow.call(this, g, data, selected, x, y, width, height);
        var infos = data.a('infos'),
            radius = 9,
            rightGap = 12 * 1.5,
            gap = 4,
            textFont = '11px "Open Sans", sans-serif';

        delete data._infoRects;
        // 绘制消息气泡
        if (infos) {
            var infoX = this.getContentWidth() - rightGap;
            if (data.hasChildren()) infoX -= 16;
            infos.forEach(function (info) {
                var text = info.text,
                    background = info.background,
                    infoRect;

                g.beginPath();
                if ((text + '').length === 1) {
                    g.arc(infoX - radius, y + height / 2, radius, 0, 2 * Math.PI);
                    g.fillStyle = background;
                    g.fill();

                    g.beginPath();
                    infoX -= radius * 2;
                    ht.Default.drawText(g, text, textFont, '#fff', infoX, y, radius * 2, height, 'center', 'middle');

                    var infoHeight = radius * 2;
                    infoRect = {
                        x: infoX,
                        y: y + (height - infoHeight) / 2,
                        width: infoHeight,
                        height: infoHeight
                    };
                    infoX -= gap;
                } else {
                    var textSize = ht.Default.getTextSize(textFont, text);
                    var textWidth = textSize.width + 2,
                        textHeight = textSize.height;
                    g.beginPath();
                    infoX -= textWidth;
                    ht.Default.drawRoundRect(g, infoX, y + (height - textHeight) / 2, textWidth, textHeight, 3, 3, 3, 3);
                    g.fillStyle = background;
                    g.fill();

                    g.beginPath();
                    ht.Default.drawText(g, text, textFont, '#fff', infoX, y, textWidth, height, 'center', 'middle');
                    var infoHeight = textHeight;
                    infoRect = {
                        x: infoX,
                        y: y + (height - textHeight) / 2,
                        width: textWidth,
                        height: textHeight
                    };
                    infoX -= gap;
                }
                if (!data._infoRects) {
                    data._infoRects = [];
                }
                data._infoRects.push({
                    rect: infoRect,
                    info: info,
                    data: data
                });
            });
        }
    }
});