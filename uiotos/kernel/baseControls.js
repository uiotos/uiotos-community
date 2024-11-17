function __cascadeComboBox_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache);
    if (cache === undefined) return; 

    function update(controlInstance = null) {
        let layoutVertical = data.ca('layoutVertical');
        if (layoutVertical == undefined) layoutVertical = false;
        if (cache.control == undefined) {
            cache.layoutV = new ht.ui.VBoxLayout();
            cache.layoutH = new ht.ui.HBoxLayout();
            cache.layoutH.setScrollBarMode('off')
            cache.layoutV.setScrollBarMode('off')
            let label = cache.label = new ht.ui.Label();
            control = cache.control = controlInstance;
            importCssJs.loadArr('js', ['custom/libs/cities.js']);
            //TODO 特定事件
            //----------------------------------------------------

            control.on('p:value', v => {
                if (i.isInitOrNull(v.oldValue) || v.newValue != v.oldValue) { //值变化才触发调用
                    //用于关联嵌套时的数据
                    data.notifyUpper && data.notifyUpper(e.newValue);

                    let cb = new Function('return ' + data.a('onChange'))()
                    return cb && cb(data, v.newValue)
                }
            })

            //----------------------------------------------------
        }

        //通用属性
        cache.label.setTextColor(data.ca('labelColor'));
        cache.label.setText(data.ca('labelText'));
        cache.label.setTextFont(data.ca('font'));

        if (cache.control) {
            cache.control.setBorder(new ht.ui.border.FocusLineBorder(data.ca('borderWidth'), data.ca('borderColor'), data.ca('activeBorderColor')));
            cache.control.setColor(data.ca('color'));
            cache.control.setReadOnly(data.ca('readOnly'));
            cache.control.setBackground(data.ca('background'));
            cache.control.setBorderRadius(data.ca('borderRadius'));
            cache.control.setHoverIcon(data.ca('hoverIcon'));
            cache.control.setFont(data.ca('font'));
            cache.control.setPlaceholder(data.ca('placeholder'));
        }

        //TODO 特定属性
        //----------------------------------------------------
        cache.control.setDatas(data.ca('dataListSource'));
        data.ca('isCities') && cache.control.setDatas(cities);
        // data.ca('value') && obj.setValue({
        //     label: data.ca('value')
        // })
        cache.control.setDropDownConfig({
            width: data.ca('dropdownWidth'),
            height: data.ca('dropdownHeight')
        });
        //----------------------------------------------------

        let layout = layoutVertical ? cache.layoutV : cache.layoutH;
        if (cache.layoutV && cache.layoutH && cache.control && cache.label) {
            if (layout != cache.layoutModeCache) {
                let height = layoutVertical ? cache.control.getHeight() + cache.label.getHeight() + data.ca('gap') : cache.control.getHeight()
                height && p(data, 'height', height)
                i.layoutHTML(layout, data, gv, cache);
            }
            layout.addView(cache.label, {
                height: "wrap_content",
                width: 'wrap_content',
            });
            layout.addView(cache.control, {
                height: 'match_parent',
                width: 'match_parent',
                marginTop: layoutVertical ? data.ca('gap') : 0,
                marginLeft: !layoutVertical ? data.ca('gap') : 0
            });
            layout.setAlign(layoutVertical ? 'left' : 'center');
            layout.setVAlign('middle');
        }

        cache.layoutModeCache = layout;
        return layout;
    }

    return update(!cache.control && new ht.ui.CascadeComboBox())
}

function __checkBox_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'check', '勾选框');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    let layoutType = data.ca('layoutType')
    if (layoutType == undefined) layoutVertical = 0;
    if (cache.layoutV == undefined) {
        cache.layoutV = new ht.ui.VBoxLayout();
        cache.layoutH = new ht.ui.HBoxLayout();
        cache.layoutH.setScrollBarMode('auto')
        cache.layoutV.setScrollBarMode('auto')
        let label = cache.label = new ht.ui.Label();
        cache.controls = []; //230918，勾选框组，方便用于传参给i.md()，来统一处理'disabled'
        i.setAttrsFormBinded(data, ['datas', 'textValues', 'indexValues', 'idValues', 'selected', 'disabled', 'onChange']);

        //监听输入属性变化
        _i.md(data, gv, cache, {
            'a:labelColor': e => { //240711
                i.update(data, 's:label.color', e.newValue);
            },
            'a:indexValues': e => {
                let indexs = e.newValue;
                if (isArrayFn(indexs)) {
                    let texts = [],
                        ids = [];
                    cache.controls && isArrayFn(cache.controls) && cache.controls.forEach((button, index) => {
                        if (indexs.indexOf(index) != -1) {
                            if (!button.isSelected()) button.setSelected(true);
                            texts.push(button.getText());
                            //230530，新追加idValues后，需要这里增加支持联动
                            ids.push(button.getValue());
                        } else {
                            if (button.isSelected()) button.setSelected(false);
                        }
                    });
                    //这里调用i.update代替data.ca()对下面textValue属性赋值，回写方式1依赖于这里的调用！
                    !texts.equals(data.ca('textValues')) && i.update(data, 'textValues', texts);
                    //230530，新追加idValues后，需要这里配套支持的
                    i.backWriteOnly(data, 'a:idValues', ids);
                }
            },
            'a:textValues': e => {
                let indexs = [],
                    ids = [];
                isArrayFn(e.newValue) && cache.controls && cache.controls.forEach((button, index) => {
                    if (e.newValue.indexOf(button.getText()) != -1) {
                        if (!button.isSelected()) button.setSelected(true);
                        indexs.push(index);
                        //230530，新追加idValues后，需要这里增加支持联动
                        ids.push(button.getValue());
                    } else {
                        if (button.isSelected()) button.setSelected(false);
                    }
                });
                //回写方式1：依赖于前面用了i.update来做的对textValue赋值
                // i.backWriteAttrs(data, { 'a:indexValues': indexs });
                //回写方式2：不依赖于任何其他地方的调用，直接回写赋值即可！
                i.backWriteOnly(data, 'a:indexValues', indexs);
                //230530，新追加idValues后，需要这里配套支持的
                i.backWriteOnly(data, 'a:idValues', ids);
                // 回写方式3：引用
                // i.arrOverwrite(data.ca('indexValues'), indexs);
            },
            //230530，增加idsValue，对应数据库的记录id，便于修改提交用。
            'a:idValues': e => {
                let indexs = [],
                    texts = [],
                    idstmp = [];
                isArrayFn(e.newValue) && e.newValue.forEach(item => { //编辑状态下手动输入的idValues，输入数字也会被当做字符串，那么自动转换成数字也放到数组中来判断
                    idstmp.push(item);
                    if (i.isStringNumber(item)) idstmp.push(Number(item));
                });
                cache.controls && cache.controls.forEach((button, index) => {
                    if (idstmp.indexOf(button.getValue()) != -1) {
                        if (!button.isSelected()) button.setSelected(true);
                        indexs.push(index);
                        texts.push(button.getText());
                    } else {
                        if (button.isSelected()) button.setSelected(false);
                    }
                });
                //回写方式1：依赖于前面用了i.update来做的对textValue赋值
                i.backWriteAttrs(data, { 'a:indexValues': indexs });

                //回写方式2：不依赖于任何其他地方的调用，直接回写赋值即可！
                // i.backWriteOnly(data, 'a:indexValues', indexs);
                // i.backWriteOnly(data, 'a:textValues', texts);
                // 回写方式3：引用
                // i.arrOverwrite(data.ca('indexValues'), indexs);
            },
            'a:selected': e => {
                let indexs = data.ca('indexValues')
                if (e.newValue) {
                    indexs ? indexs.push(0) : indexs = [0];
                    data.fp('a:indexValues', null, indexs); //触发md响应，因为可能是空，所以
                } else {
                    if (indexs) {
                        let indextmp = indexs.indexOf(0);
                        i.arrayIndexRemoved(indexs, indextmp); //引用赋值
                    }
                    data.fp('a:indexValues', null, indexs); //触发md响应，因为可能是空，所以
                }
            },
            'a:datas': e => { //230830，让数组用第一个元素编辑
                i.enableAttrEditByFirstItem(data, e);
            }
        }, ['a:labelColor'], null, cache.controls, e => {
            //label与组件水平、垂直对齐布局
            i._labelLayout(data, gv, cache, e);
        });
    }

    let layout = layoutType == 0 ? cache.layoutH : cache.layoutV; //全水平布局：0、全垂直布局：1、水平Ratio加垂直Label：2
    if (cache.layoutV && cache.layoutH && cache.label) {
        i.allowEmpty(data, "labelText", value => cache.label.setText(value));
        cache.label.setTextColor(data.ca('labelColor'));
        cache.label.setTextFont(data.ca('labelFont'));
        if (
            cache.datas != data.ca('datas') ||
            cache.gapLabel != data.ca('gapLabel') ||
            cache.gapItem != data.ca('gapItem') ||
            cache.checkboxFont != data.ca('checkboxFont') ||
            cache.checkboxColor != data.ca('checkboxColor') ||
            cache.layoutType != layoutType
        ) {
            if (layout != cache.layoutModeCache || cache.layoutType != layoutType) {
                let checkboxHeight = 35;
                let height = undefined;
                switch (layoutType) {
                    case 0:
                        height = checkboxHeight;
                        break;
                    case 1:
                        height = checkboxHeight * data.ca('datas').length + data.ca('gapItem') * (data.ca('datas').length - 1);
                        break;
                    case 2:
                        height = checkboxHeight * 1.5 + data.ca('gapLabel');
                        break;
                }
                height != undefined && p(data, 'height', height);
                i.layoutHTML(layout, data, gv, cache);
            }
            cache.datas = data.ca('datas');
            cache.gapLabel = data.ca('gapLabel')
            cache.gapItem = data.ca('gapItem')
            cache.checkboxFont = data.ca('checkboxFont')
            cache.checkboxColor = data.ca('checkboxColor')
            cache.layoutType = layoutType

            layout.clear()
            layout.addView(cache.label, {
                height: 'wrap_content',
                width: 'wrap_content',
                marginRight: layoutType == 0 ? cache.gapLabel : 0,
                marginBottom: layoutType == 0 ? 0 : cache.gapLabel
            });

            let layoutH2 = layoutType == 2 ? new ht.ui.HBoxLayout() : null;
            layoutH2 && layoutH2.setScrollBarMode('auto')
            if (cache.controls) i.arrClear(cache.controls);
            else cache.controls = [];
            cache.datas.forEach(function(ele, index) {
                let checkboxButton = new ht.ui.CheckBox();
                cache.controls.push(checkboxButton);
                //交互事件form逐层关联
                checkboxButton.on('p:selected', e => {
                    let txts = [],
                        idxs = [],
                        ids = []; //230531，增加idValues
                    cache.controls.forEach((itm, idx) => {
                        if (itm.isSelected()) {
                            if (idx == 0) i.update(data, 'selected', true); //230603，对于只有一个勾选框时候，获取和设置勾选，该属性更简便！
                            txts.push(itm.getText());
                            idxs.push(idx);
                            ids.push(itm.getValue()); //230531，增加idValues
                        } else if (idx == 0) i.update(data, 'selected', false); //230603，对于只有一个勾选框时候，获取和设置勾选，该属性更简便！
                    })
                    _i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                        'a:textValues': txts,
                        'a:indexValues': idxs,
                        'a:idValues': ids, //230531，增加idValues
                        'a:selected': data.ca('selected') //230603，第一个勾选时
                    }, true, true);
                });
                // 230530，兼容列表元素为json对象的形式，其中key-valuekey是text-id，也可以是name-value（combobox组合框的数据就能只就用！）
                let txttmp = valtmp = ele;
                if (ele && typeof ele == 'object') {
                    if (hasKey(ele, 'name') && hasKey(ele, 'value')) {
                        txttmp = ele.name;
                        valtmp = ele.value;
                    } else if (hasKey(ele, 'text') && hasKey(ele, 'id')) {
                        txttmp = ele.text;
                        valtmp = ele.id;
                    }
                }
                checkboxButton.setText(txttmp);
                checkboxButton.setTextColor(cache.checkboxColor);
                checkboxButton.setTextFont(cache.checkboxFont);
                checkboxButton.setValue(valtmp);
                checkboxButton.setFormDataName('checkbox');
                switch (layoutType) {
                    case 0:
                        layout.addView(checkboxButton, {
                            marginRight: Number(cache.gapItem)
                        });
                        break;
                    case 1:
                        layout.addView(checkboxButton, {
                            marginBottom: Number(cache.gapItem)
                        });
                        break;
                    case 2:
                        layoutH2.addView(checkboxButton, {
                            marginRight: Number(cache.gapItem)
                        });
                        layout.addView(layoutH2)
                        break;
                }
            });
            data.fp('a:indexValues', null, data.ca('indexValues')); //初始化
            layout.setAlign('left');
            layout.setVAlign(layoutType == 0 ? 'middle' : 'top');
        }
        cache.layoutModeCache = layout;
    }
    return layout;
}

function __combobox_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'cbox', '下拉框');  
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    let layoutVertical = data.ca('layoutVertical'),
        nodeData = data; //230512，备份，为了避免data命名冲突覆盖
    if (layoutVertical == undefined) layoutVertical = false;

    if (cache.layoutV == undefined) {
        i.setAttrsFormBinded(data, ['datas', 'value', 'onChange', 'onOpened', 'defaultIndex', 'selectedID', 'selectedText', 'readOnly', 'disabled']);
        //230806，全部事件注册到bindEvents属性中，新连线操作下拉，会成为统一下拉列表的选项
        data.ca('bindEvents', ['*', 'onClick', 'onChange', 'onOpened', 'onEmpty']);

        //240711，兼容背景颜色属性合并（成数组）配置。
        if (!data.ca('background') || !isArrayFn(data.ca('background'))) {
            data.ca('background', [
                data.ca('background'), //null或者初始配置的单个值
                'rgb(247,247,247)',
                'rgb(247,247,247)',
            ])
        }

        //240721，文字颜色改成数组，索引0是原先用途，索引1用来作为标签/标题颜色
        if (!data.ca('color') || !isArrayFn(data.ca('color'))) {
            data.ca('color', [
                data.ca('color'), 
                'rgb(61,61,61)'
            ])
        }

        //240711，合并边框色，并且兼容此前分开的配置。
        if (!data.ca('borderColor') || !isArrayFn(data.ca('borderColor'))) {
            data.ca('borderColor', [
                data.ca('borderColor'), //null，或初始配置的单个值
                "rgb(51,153,255)",
            ]);
        }

        //240711，下拉树文字颜色，并且兼容此前分开的配置。
        if (!data.ca('treeLabelColor') || !isArrayFn(data.ca('treeLabelColor'))) {
            data.ca('treeLabelColor', [
                data.ca('treeLabelColor'), //null，或初始配置的单个值
                "rgb(51,153,255)",
                "rgb(51,153,255)"
            ]);
        }

        //240711，下拉树背景颜色，并且兼容此前分开的配置。
        if (!data.ca('treeBackground') || !isArrayFn(data.ca('treeBackground'))) {
            data.ca('treeBackground', [
                data.ca('treeBackground'), //null，或初始配置的单个值
                null,
                "rgb(247,247,247)",
                "rgb(255,255,255)",
                "rgb(247,247,247)",
                "rgb(247,247,247)",
                "rgb(247,247,247)"
            ]);
        }

        //240605，现在要兼容简化属性删除掉，就需要这里不要导致下面报错！
        if (data.ca('noneInfo') === undefined) data.ca('noneInfo', ["无", -1, ""]);

        cache.layoutV = new ht.ui.VBoxLayout();
        cache.layoutH = new ht.ui.HBoxLayout();
        cache.layoutH.setScrollBarMode('off')
        cache.layoutV.setScrollBarMode('off')
        let label = cache.label = new ht.ui.Label(),
            combobox = cache.combobox = new ht.ui.ComboBox();
        combobox.treeView = new ht.ui.TreeView(); //提前实例化下拉tree对象
        combobox.treeView.setScrollBarMode('auto'); //230817，下拉框下拉内容超出区域，要能自动滚动，但是目前并不起作用！！！有待进一步分析处理！目前下拉列表或树都是不能横向滚动
        combobox.treeView.setLabelFont(data.ca('font'));
        combobox.treeView.fillDataModel = function(view, datas, parent, displayField, valueField) {
            if (!isArrayFn(datas)) return;
            let dm = view.dm(),
                nodetmp = nodeData;
            for (var i = 0; i < datas.length; i++) {
                var data = datas[i];
                //自动生成id，按照如上示例x.x.x层次命名
                // htData.setId((parent ? parent.getId() + '.' : '') + '' + (i + 1));
                //value配置作为ht.Data的id，这样通过dm.getDataById就可以找到data，从而还原选中
                let idtmp = data[valueField] != undefined ? data[valueField] : data[displayField];
                if (idtmp == null) continue;
                if (dm.getDataById(idtmp)) { //230920，存在树形下拉框且显示名称相同的情况，为了避免将显示名称作为id导致冲突，这里把图元id也用上，对于重复的会自动加上！
                    // idtmp = idtmp + i;//231011，如果value字段对应的id相同（已存在），那么久过滤掉，这样多个重复的记录，在下拉中就不会重复出现，相当于能自动去重
                    console.error('error，exist the same id', idtmp, 'and will be ignored', idtmp);
                    continue; //231011，如果value字段对应的id相同（已存在），那么久过滤掉，这样多个重复的记录，在下拉中就不会重复出现，相当于能自动去重
                }
                var htData = new ht.Data();
                htData.setId(idtmp) //如果数据中没有valueField字段，那么值就用displayField的内容

                htData.setName(data[displayField]); //将数据用于显示
                htData.setIcon(data.icon);
                // htData.a('data', data); //备份存放数据到属性
                parent && htData.setParent(parent);

                //是否展开树节点
                // parent && view.expand(parent);

                dm.add(htData);

                //递归子节点children
                data.children && combobox.treeView.fillDataModel(view, data.children, htData, displayField, valueField);
            }
        };
        i.addEvent((node, key, value, type) => {
            if (key == 'onScrollEnded' && i.rootData(data, node)) {
                combobox.isOpened() && combobox.close();
            }
        }, data);

        function __clickData(e) {
            let valueObject = {};
            valueObject[combobox.getDisplayField()] = e.data.getName();
            valueObject[combobox.getValueField()] = e.data.getId();

            let chooseAllowed = true;
            let cb = new Function('return ' + data.a('allowChoosing'))(),
                valtmp = data.ca('value');
            if (cb) {
                let rettmp = cb(data, gv, cache, {
                    datas: data.ca('datas'),
                    value: typeof(valtmp) == 'object' ? valtmp.value : valtmp
                }, valueObject);
                if (rettmp == false) chooseAllowed = false; //明确返回false时，表明不允许选择，否则不返回或返回为true，都视为通过
            }

            if (chooseAllowed) {
                combobox.setValueEx(valueObject);
                combobox.close();
            }
        }

        //非父节点，直接单击选中
        combobox.treeView.on('clickData', function(e) {
            let choosed = false;
            if (!e.data.hasChildren()) { //父节点不可选中，末端子节点方可选中
                choosed = true;
            } else {
                combobox.treeView.toggle(e.data);
            }
            choosed && __clickData(e);
        });

        //父节点，单击展开，双击时如果设置有允许节点选中，那么选中节点
        combobox.treeView.on('doubleClickData', function(e) {
            let choosed = false;
            if (!e.data.hasChildren()) { //父节点不可选中，末端子节点方可选中
                choosed = true;
            } else if (data.ca('nodeUsable')) {
                choosed = true;
            }
            choosed && __clickData(e);
        });

        /*不论是传入值对象还是传入值对象中值字段的内容，均转换成值对象，以确保显示正常（按照值对象中显示字段的内容来）
        同时，还要兼容这里val可以直接就是显示字段的内容，兼容数据中不带有值字段的情况！*/
        combobox.setValueEx = function(val) {
            if (isObject(val)) {
                combobox.setValue(val);
                //230218，已经不需要这里回写了，on:value已支持回写
                // data.ca('value', val); //回写到属性中，避免焦点失去后，下拉选择的又被还原了
            } else { //将combobox.setValue()传入的值内容，改成传入对象，好让显示内容正常
                /*230128，加上默认索引，默认打开的下标序号，数据未知时做初值使用！如果是tree树，那么下标index是tree树的第一级
                也就是按照根节点来找，子节点不算！
                231005，加上val == ''，因为存在默认未选择时，下拉框显示为空，而不是null*/
                if ((val === undefined || val === null || val === '') && data._i_defaultIniting) {
                    let defaultIdx = data.ca('defaultIndex');
                    //231005，采用[].at()，这样defaultIndex可以是-1这样代表倒数第一个也即是最后一个元素。移除了此前的combobox.selectAt实现！
                    let datastmp = cache.combobox.getDatas(); //231006，去掉原先的data.ca('datas')，因为存在noneItem，追加到组件里面而不是追加到图元的datas属性中！
                    //1）defaultIndex默认为数字，对应datas数组第一级的索引
                    if (datastmp && datastmp.length - 1 >= defaultIdx) {
                        let targetVal = tempVal = datastmp.at(defaultIdx);

                        //240704，从data.ca()赋值改成i.update()这样能逐层向上传递！
                        _i.update(data, 'value', targetVal);
                    }
                    //231006，放弃此前的设置
                    // combobox.selectAt(data.ca('datas').at(defaultIdx));  
                    return;
                } else if (val === '') {
                    /*231007，对value属性赋值空字符串''和赋值undefined、null是有区别的，空字符串就直接显示空，或者关联的空值对应的显示（通常是noneItem）。而后两者会被当成初始化
                    被当成恢复初始显示，会用到defaultIndex指向的默认显示项！*/
                    let datastmp = cache.combobox.getDatas(),
                        tobeShow = val;
                    datastmp && datastmp.forEach(item => {
                        if (item.value == '') tobeShow = item;
                    })
                    if (tobeShow == val && tobeShow !== data.ca('noneInfo')[2]) {
                        console.error(`WARN: node ${data.getDisplayName()} force to empty failed,as noneInfo configured value is ${data.ca('noneInfo')[1]},not ''`);
                    }
                    data.ca('value', tobeShow);
                    return;
                }

                if (combobox.getDropDownTemplate() == 'ht.ui.TreeDropDown') {
                    /*fillDataModel中，如果当前元素对象没有值字段，那么data.setId()就用显示字段内容；如果有值字段就用值内容
                    这里根据传入值获取数据图元对象，并且在未展开下拉时，需要初始化赋值能够成功*/
                    combobox.treeView.dm().clear();
                    combobox.treeView.fillDataModel(combobox.treeView, combobox.getDatas(), null, combobox.getDisplayField(), combobox.getValueField());
                    let itemData = combobox.treeView.dm().getDataById(val);

                    //230920，支持对于tree树结构数据传入value为显示名称（非id和对象），树形节点结构如果存在多个名称相同的，那么选择第一个匹配到的！
                    if (itemData === undefined) {
                        let datasFound = [];
                        combobox.treeView.dm().each(item => {
                            if (item.getName() == val) datasFound.push(item);
                        })
                        if (datasFound.length == 1) itemData = datasFound[0];
                        else if (datasFound.length >= 1) {
                            console.error('multi items found, choose first and ignore others!', datasFound, data);
                            itemData = datasFound[0];
                        }
                    }

                    //将单个值的传入，转换成对象的传入
                    let valtmp = {};
                    if (itemData) {
                        valtmp[combobox.getDisplayField()] = itemData.getName();
                        valtmp[combobox.getValueField()] = val;
                        combobox.setValue(valtmp);
                        //230220-18:31，已经不需要这里回写了，on:value已支持回写
                        // data.ca('value', valtmp); //回写到属性中，避免焦点失去后，下拉选择的又被还原了
                    } else {
                        console.warn('当前值在下拉树表中并无对应项：' + val);
                        // combobox.setValue(val)   //去掉，避免无法清空作为null提交
                    }
                } else if (combobox.getDropDownTemplate() == 'ht.ui.ListDropDown') {
                    /*直接赋值，不论赋的是值内容还是显示内容，都能支持，因为已动态根据datas内容判断第一层key是否包含
                    值字段，如果没有，那么自动重新设置为显示字段，从而当setValue()传入显示内容，也能兼容！*/

                    //230610，加上了这句调用，此前是直接val赋值，对于带name、value的列表，初始值如果有name，就不要显示value！！
                    let valObjTmp = i.getTreeItemsById(data.ca('datas'), val, 'value')[0];
                    combobox.setValue(valObjTmp ? valObjTmp : val);

                    //230220-18:31，已经不需要这里回写了，on:value已支持回写
                    // data.ca('value', val); //回写到属性中，避免焦点失去后，下拉选择的又被还原了
                } else {
                    console.error('不支持的类型：' + combobox.getDropDownTemplate());
                }
            }
        }

        //下拉选中事件响应
        combobox.on('p:value', v => {
            !data && console.error('data object is null???', data);
            let asValueTmp = i.getTreeItemsById(data.ca('datas'), v.newValue, 'value')[0],
                asNameTmp = i.getTreeItemsById(data.ca('datas'), v.newValue, 'name')[0],
                valtmp = combobox._i_isTreeMode ? (asValueTmp == undefined ? asNameTmp : asValueTmp) : v.newValue ? (v.newValue).toString() : v.newValue;

            //230303，只读属性，用来选中后的id信息输出，而不是像value那样用于输入和输出的，会自动将id转换成对象，这里只读id通常用于数据库等传参用途
            let nameTextTyped = valueIdTyped = valtmp; //用来存放下拉列表的index索引，或者tree结构的value字段（数字）而非name字符串或者object对象
            if (typeof valtmp == 'number') {
                //  valueIdTyped = valtmp; //重复赋值，前面初始值就是的。
            } else if (typeof valtmp == 'string') {
                console.assert(isArrayFn(data.ca('datas')));
                valueIdTyped = data.ca('datas').indexOf(valtmp);
                nameTextTyped = valtmp; //230920，从之前的nameTextTyped = valueIdTyped改成现在的，这样当下拉是[a,b,c,d]这种列表时，value输入内容，selectedText能显示内容，而不是id序号！
            } else if (isObject(valtmp)) {
                valueIdTyped = valtmp[combobox.getValueField()];
                nameTextTyped = valtmp[combobox.getDisplayField()];
            }
            if (data.ca('hasNoneItem') && //判断依据1：有设置空值
                data.ca('noneInfo') && //判断依据2：noneInfo有配置非空
                //240620，加上条件v.data._value &&，因为发现有这里的.name调用报错，提示udefined！！
                (v.data._value && v.data._value.name == data.ca('noneInfo')[0]) //&& //230818，*判断依据3：name相等
                //230901，去掉这个条件，因为发现如果tree格式的data只有name没有value时，v.newValue显示的是data.ca('noneInfo')[0]对应的名称，导致条件进不来！
                // data.ca('noneInfo')[1] === v.newValue //230818，*判断依据1：value相等    
            ) {
                valtmp = data.ca('noneInfo')[2]; //230818，value字段值默认给undefined过去，如果noneInfo的索引2有配置，那么就把配置的值给过去。
                valueIdTyped = data.ca('noneInfo')[1]; //230818，选中ID就把设置的ID给过去。
                nameTextTyped = ''; //230818，选择文字固定给空字符串''过去。
                i.formEventBubblingUpper(data, gv, cache, 'onEmpty', { //240226，还是暂时不做这个支持：['onEmpty', 'onChange']
                    'a:value': valtmp,
                    'a:selectedID': valueIdTyped,
                    'a:selectedText': nameTextTyped
                }, true, true, null, false);
            }
            i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                //230220-18:11，增加对list模式下拉的支持，跟tree的处理不一样！且纯列表模式下，如果内容为数字，会被自动转换成字符串！
                'a:value': valtmp,
                'a:selectedID': valueIdTyped,
                'a:selectedText': nameTextTyped
            }, true, true); //使用了i.backWriteOnly、i.md()机制，可以将selfInclude参数设置为true，且不用担心可能出现的死循环了
        });

        //点击展开下拉事件响应
        combobox.addViewListener(v => {
            if (v.kind == 'open') { //每次下拉之前，先要恢复列表节点的可见属性，否则会因为此前如果有输入触发筛选，那么塞选的可见过滤结果也会影响这里                
                if (data.ca('disabled')) { //230918，禁止下拉展开
                    i.update(data, 'open', false);
                    combobox.close();
                    return;
                }

                combobox.treeView.setVisibleFunc(item => {
                    return true;
                });
                i.formEventBubblingUpper(data, gv, cache, 'onOpened', null, true, true, null, false);

                /*230817，下面是让下拉宽度每次都跟组件宽度保持一致，但是注意问题：下拉框下拉内容超出区域，要能自动滚动，但是目前并不起作用！！！有待
                进一步分析处理！目前下拉列表或树都是不能横向滚动，加上了combobox.treeView.setScrollBarMode('auto')了都不行！*/
                cache.combobox.treeView && cache.combobox.treeView.setWidth(data.getWidth());
            }
        });

        //输入编辑中事件响应
        combobox.getInput().oninput = function() {
            combobox.open()

            let texttmp = combobox.getInput().value

            //获取子组件tree对象，并且设置搜索过滤
            let tree = combobox.treeView

            //1、tree.setVisibleFunc过滤函数递归，只对当前展开的有效，没展开显示的不会参与递归遍历！
            tree.expandAll();
            //2、初始化数据模型所有节点标记位复位为初始的false
            tree.dm().each(item => {
                item.setAttrObject({
                    _show: false
                })
            });
            //3、遍历数的dataModel数据模型，对所有需要显示的做好标记
            tree.dm().each(item => {
                if (texttmp) {
                    //Data.isEmpty()判断图元节点中是否有孩子，等同于hasChildren()；加上对nodeUsable的判断，用来支持当节点可双击选中时，也可以被输入匹配检索
                    if (item.isEmpty() || data.ca('nodeUsable')) {
                        let showtmp = item.getName().toLowerCase().indexOf(texttmp.toLowerCase()) >= 0;
                        //2、递归让显示的末端节点的一级一级所有父节点都标记可显示
                        function showParentFlag(dataItem) {
                            dataItem.setAttrObject({
                                _show: true
                            })
                            let ptmp = dataItem.getParent()
                            ptmp && !ptmp.getAttrObject()._show && showParentFlag(ptmp)
                        }
                        if (showtmp) {
                            showParentFlag(item)
                            item.setAttrObject({
                                _show: true
                            })
                        }
                    }
                } else {
                    item.setAttrObject({
                        _show: true
                    })
                }
            });
            //4、对tree树设置过滤函数，用前面的显示隐藏标记来控制显示返回
            tree.setVisibleFunc(item => {
                return item.getAttrObject() && item.getAttrObject()._show;
            });
        }

        i.md(data, gv, cache, {
            '*|imageLoaded': e => !runningMode() && combobox.close(),
            "a:treeBackground|\
            a:treeColor|\
            a:treeLabelColor|\
            a:treeLabelFont|\
            a:treeRowHeight|\
            a:treeBoxShadow|\
            a:treeBorderWidth|\
            a:treeBorderRadius|\
            a:treePadding|\
            a:labelText|\
            a:labelEmbeded|\
            a:open|\
            a:defaultIndex|\
            a:value": (e) => {
                //3）统一操作
                //240727，之前为什么限制仅编辑状态？这会导致连线操作下拉，运行状态下不凑效！！
                /*!runningMode() && */_i.setTimeout(() => {
                    if (e.property == 'a:open') {
                        if (data._i_opening && e.newValue == false) {
                            data._i_opening = undefined;
                            return;
                        }
                        data.ca('open') ? combobox.open() : combobox.close();
                        data._i_opening = true;
                        i.update(data, 'open', false);
                    }
                }, 0);

                //4）各自特定操作：
                let valtmp = e.property == 'a:value' ? e.newValue : data.ca('value'); //231011，此前直接data.ca()，会发现对于传入undefined空，得到data.ca()为''
                dropDownPropsInit(valtmp === undefined || valtmp === null); //230816，加上data.ca('value') == undefined，为了支持对value清空时，恢复默认的NoneItem选项（如果有）
                //label与组件水平、垂直对齐布局
                i._labelLayout(data, gv, cache, e);
            },
            "a:datas|a:hasNoneItem|a:noneInfo": (e) => {
                dropDownPropsInit(true);
            },
            'a:disabled': e => { //230918，禁用，此时无法下拉、无法输入（自动勾选readOnly）
                // combobox.setDisabled(e.newValue);    //230926，禁用的样式颜色太浅，还是区分只读和禁用吧
                if (e.newValue) i.update(data, 'readOnly', true); //禁用时，一定只读；反之不然。
                //230927，只有禁用的时不允许下拉时，默认背景颜色才变化。
                //240711，合并背景属性到数组，兼容此前单独的配置方式
                let hoverReadOnlyColor = data.ca('hoverReadOnlyBackground') ? data.ca('hoverReadOnlyBackground') : data.ca('background')[1];
                combobox.setBackground(e.newValue ? hoverReadOnlyColor : data.ca('background')[0]); //230926，只读模式下，默认颜色跟滑过一样
            },
            //230626，增加只读
            'a:readOnly': e => {
                combobox.setReadOnly(e.newValue);
                //240711，背景颜色合并属性配置！
                combobox.setActiveReadOnlyBackground(data.ca('activeReadOnlyBackground') ? data.ca('activeReadOnlyBackground') : data.ca('background')[2]);
                combobox.setHoverReadOnlyBackground(data.ca('hoverReadOnlyBackground') ? data.ca('hoverReadOnlyBackground') : data.ca('background')[1]);
            },
            //230626，将背景颜色放到这里
            'a:background': e => {
                //240905，需要考虑只读模式，在多层嵌套后，上层对readOnly设置只读，那么颜色需要同步显示只读的！
                combobox.setBackground(i.valArrCompatiable(e.newValue, Number(data.ca('disabled'))));
            },
            'a:selectedID': e => { //2300920，将selectedIDGet改成selectedID，为了让表单能提交同时能读取初始化加载显示！
                data.ca('value', e.newValue); //相当于value中写入，毕竟编辑时就支持value中传入，那么让其兼容该功能即可！
            },
            'a:selectedText': e => { //230920，将selectedTextGet改成selectedText，为了让表单能提交同时能读取初始化加载显示！
                data.ca('value', e.newValue); //相当于value中写入，毕竟编辑时就支持value中传入，那么让其兼容该功能即可！
            },
            's:label.color': e=>{
                //240729，因为下面有data.s('label.color',data.ca('color')[1])，这里不处理下，会导致始终无法在标题中修改文字颜色！
                if(!data.ca('color')) data.ca('color',[]);
                data.ca('color')[1] = e.newValue;
                i.update(data,'colors',data.ca('color'));
            }
        }, ['a:background', 'a:readOnly', 'a:disabled', 'a:defaultIndex', 'a:hasNoneItem'], null, combobox, e => { //240701，最后一个cb，改到导数第二个cb，因为最后一个是children的！
            //label与组件水平、垂直对齐布局
            i._labelLayout(data, gv, cache, e);
        });
    }

    function dropDownPropsInit(reloadDatas = false) {
        /*230219，data._i_defaultIniting放到了dropDownPropsInit函数内的开始和结束，只要是传入reloadDatas的那么处理期间都是置位状态！
        此前是在上面dropDownPropsInit(true)的调用前和调用后，但是这个调用分为初始化和datas赋值变化两个地方都有！*/
        if (reloadDatas) data._i_defaultIniting = true;

        let hasNoneItem = data.ca('hasNoneItem'); //是否包含无的选项
        let datastmp = data.ca('datas');
        if (datastmp == undefined) datastmp = [];
        else if (!isArrayFn(datastmp)) {
            console.error('datas数据错误，需要数组格式！', datastmp);

            //230219，data._i_defaultIniting放到了dropDownPropsInit函数内的开始和结束，只要是传入reloadDatas的那么返回时复位。
            if (reloadDatas) data._i_defaultIniting = undefined;
            return;
        }
        if (hasNoneItem == true && data.ca('noneInfo') && data.ca('noneInfo').length >= 2) {
            datastmp = [
                ...[{
                    name: data.ca('noneInfo')[0],
                    value: data.ca('noneInfo')[1], //230818，这里原先通过Number()转换，改成原始值！否则对于字符串就被转成NaN了，而且还希望选择空时按照设定的值传出去呢！
                }],
                ...datastmp
            ]
        }

        //230220，列表list而非tree格式的数据时，如果数据时纯数字，那么需要数字转换成字符串，才能下拉选中响应on:p:value，数字列表可以展示但是测试发现下拉选中不触发响应！
        let findChildrenTmp = JSON.stringify(datastmp).toUpperCase().indexOf('CHILDREN');
        //231218，增加||后面的，对于只要元素内容都是对象{}的，都以tree作为下拉模板！否则对于只有name/value字段的对象列表，发现id、text无法正常显示提取！
        cache.combobox._i_isTreeMode = findChildrenTmp != -1 || _i.isSubObjsAll(datastmp);
        if (!cache.combobox._i_isTreeMode) {
            let tmp = [];
            datastmp.forEach(item => {
                tmp.push(typeof item == 'number' ? (item).toString() : item);
            });
            datastmp = tmp;
        }

        //230218，特地加上reloadDatas区分
        try {
            reloadDatas && cache.combobox.setDatas(datastmp); //230218，注意，实测发现这里tree下拉根节点正常，但是非根节点的选中触发iv，到这里setDatas加载时，会自动setValue，并且值为undefined
            cache.combobox.treeView.setBoxShadow(data.ca('treeBoxShadow'));
            //240711，下拉树文字颜色，并且兼容此前分开的配置。
            cache.combobox.treeView.setBackground(data.ca('treeBackground')[0]);

            //240711，下拉树文字颜色，并且兼容此前分开的配置。
            cache.combobox.treeView.setLabelColor(data.ca('treeLabelColor')[0]);
            cache.combobox.treeView.setHoverLabelColor(data.ca('treeHoverLabelColor') ? data.ca('treeHoverLabelColor') : data.ca('treeLabelColor')[1]);
            cache.combobox.treeView.setSelectLabelColor(data.ca('treeSelectLabelColor') ? data.ca('treeSelectLabelColor') : data.ca('treeLabelColor')[2]);

            cache.combobox.treeView.setLabelFont(data.ca('treeLabelFont'));
            cache.combobox.treeView.setRowHeight(data.ca('treeRowHeight'));

            //240711，下拉树文字颜色，并且兼容此前分开的配置。
            let trRowLineColor = data.ca('treeRowLineColor') ? data.ca('treeRowLineColor') : data.ca('treeBackground')[2];
            cache.combobox.treeView.setRowLineColor(trRowLineColor);
            let trRowBkgColor = data.ca('treeRowBackground') ? data.ca('treeRowBackground') : data.ca('treeBackground')[3];
            cache.combobox.treeView.setRowBackground(trRowBkgColor);
            cache.combobox.treeView.setHoverRowBackground(data.ca('treeBackground')[4]);
            let trRowSelColor = data.ca('treeSelectRowBackground') ? data.ca('treeSelectRowBackground') : data.ca('treeBackground')[5];
            cache.combobox.treeView.setSelectRowBackground(trRowSelColor);
            let trRowFocColor = data.ca('treeFocusRowBackground') ? data.ca('treeFocusRowBackground') : data.ca('treeBackground')[6];
            cache.combobox.treeView.setFocusRowBackground(trRowFocColor);
            let trBorderColor = data.ca('treeBorderColor') ? data.ca('treeBorderColor') : data.ca('treeBackground')[1]
            cache.combobox.treeView.setBorder(new ht.ui.border.FocusLineBorder(data.ca('treeBorderWidth'), trBorderColor));

            cache.combobox.treeView.setBorderRadius(data.ca('treeBorderRadius'));
            cache.combobox.treeView.setPadding(data.ca('treePadding'));

            //datas数据内容包含children，就用ht.ui.TreeView，否则就用默认的ht.ui.ListDropDown
            cache.combobox.setDropDownTemplate(cache.combobox._i_isTreeMode ? 'ht.ui.TreeDropDown' : 'ht.ui.ListDropDown');
        } catch (error) {
            console.error(error)
        }

        //兼容列表和树表，显示字段统一初始化设置为name（默认的列表支持的默认字段是label），目前写死为name，没必要开放用户配置
        cache.combobox.setDisplayField('name');
        //datas数据内容如果没有getValueField()设定的字段，就默认设置为跟displayField字段一致，这样省去值字段的配置
        let valueFieldtmp = 'value'; //设置为固定的，目前没必要开放用户配置
        //判断数据的第一层结构中字段key是否包含设定的值字段名，注意，不会判断每一层结构以及每个元素是否都有。只要有一个包含值类型字段，那么全局就采用；否则全局共用显示字段！
        let hasValueField = false,
            isSimpleList = true,
            valuetmp = data.ca('value');
        //240727，判断下拉框的列表是否是简单数组列表，改用下面这种，而不是简单按照末尾项是否是对象来判断！！因为通过数组索引赋值解析操作数组索引后，中间某个是对象！
        let indexStart = data.ca('hasNoneItem') ? 1 : 0;
        for(let idx = indexStart; idx < datastmp.length; idx += 1){
            if(isObject(datastmp[idx])) {
                isSimpleList = false;
                break;
            }
        }
        //231129，对于原先datastmp，加上data.ca('hasNoneItem') ? datastmp.slice(1) : ，判断是否有value值字段，如果有勾选hasNoneItem，那么就要排除第一项再来遍历判断！
        !isSimpleList && i.keys(convertToFlatJson(data.ca('hasNoneItem') ? datastmp.slice(1) : datastmp)).forEach((item, index) => {
            //非最简列表模式下，字符串查找，判断是否有配置的值字段
            if (item.split('>').length >= 2 && item.split('>')[1].toUpperCase() == valueFieldtmp.toUpperCase()) hasValueField = true
        });

        //230220，注意，这里沿用了前面的判断用扁平化后的key是否有标记'>'。而前面cache.combobox._i_isTreeMode是判断是否包含children字段，判断是否是tree格式！
        if (isSimpleList) {
            //内置列表下，用最简格式，setValue支持直接传入值，但是不支持传入索引，这里同步支持索引设定
            //230220-19:52 完善对list列表的配置逻辑
            function __getValueAsIndex() {
                if (valuetmp == undefined) return undefined;
                let vtmp = datastmp[Number(valuetmp)];
                if (vtmp == undefined) vtmp = datastmp.indexOf((valuetmp).toString()) != -1 ? valuetmp : undefined;
                return vtmp ? (vtmp).toString() : undefined;
            }
            if (typeof valuetmp == 'number') { //如果是数字，那就当成索引index序号
                valuetmp = __getValueAsIndex();
            } else if (
                valuetmp != undefined &&
                valuetmp != '' //231006，判断value空字符串为初始默认值，此时交由defaultIndex去指定默认显示哪项数据，而不自动匹配
            ) { //如果是数字的字符串，那就先当字符串去匹配，如果匹配不到就再当数字索引index
                if (typeof valuetmp != 'string' && typeof(valuetmp) != 'object') { //231011，加上条件&& typeof(valuetmp) != 'object'，存在简单列表插入开头“全部”对象的情况！
                    console.error(valuetmp);
                    i.alert(`下拉框组件${data.getDisplayName()}的列表数据源（datas）需要是字符串数组或者对象数组，数字数组通常与索引识别容易发生混乱导致错误，建议修改成数字的字符串形式！`, '警告', false, null, null, [300, 200]);
                }
                if (data.ca('hasNoneItem') && isObject(valuetmp)) { //231129，有勾选“无”数据首选项时，且其他数据都是最简列表的情况，需要这里特别处理下！
                    valuetmp = valuetmp['name']; //直接给name名称过去value显示，而下面datastmp.indexOf(valuetmp)对象直接匹配肯定是-1，因为不是引用，即便对象内容相等。
                } else {
                    if (datastmp.indexOf(valuetmp) == -1) {
                        valuetmp = __getValueAsIndex();
                    } else valuetmp = (valuetmp).toString();
                }
            }
        }

        try {
            cache.combobox.setValueField(hasValueField ? valueFieldtmp : cache.combobox.getDisplayField());
        } catch (error) {
            console.error(error);
        }

        //设定当前值，注意，这里数值内容统一当字符串类型处理，在datas配置中，同样也要是字符串，即使配置索引也要是字符串作为值，否则无法匹配！
        cache.combobox.setValueEx(valuetmp);

        //230225，输入空数据的时候，value也保持更新为空
        //230921，当属性noDatasKeepVal勾选时，对于空下拉框内容，填充的value数据
        if (datastmp.length == 0 && !data.ca('noDatasKeepVal')) {
            i.update(data, 'a:value', undefined);
            //240804，其他两个属性也要默认清空才对吧！
            i.update(data, 'a:selectedID', undefined);
            i.update(data, 'a:selectedText', undefined);
        }

        //230219，data._i_defaultIniting放到了dropDownPropsInit函数内的开始和结束，只要是传入reloadDatas的那么返回时复位。
        if (reloadDatas) data._i_defaultIniting = undefined;
    }

    let combobox = cache.combobox;
    if (combobox) {
        //240711，合并边框色，并且兼容此前分开的配置。
        let activeBorderColor = data.ca('activeBorderColor') ? data.ca('activeBorderColor') : data.ca('borderColor')[1];
        combobox.setBorder(new ht.ui.border.FocusLineBorder(data.ca('borderWidth'), data.ca('borderColor')[0], activeBorderColor));
        
        //240721，索引1用来设置标签颜色。
        combobox.setColor(data.ca('color')[0]);
        data.s('label.color',data.ca('color')[1]);

        combobox.setBorderRadius(data.ca('borderRadius'));
        combobox.setHoverIcon(data.ca('hoverIcon'));
        combobox.setFont(data.ca('font'));
        combobox.setPlaceholder(data.ca('placeholder'));
    }

    let layout = layoutVertical ? cache.layoutV : cache.layoutH;
    if (cache.layoutV && cache.layoutH && cache.combobox && cache.label) {
        if (layout != cache.layoutModeCache) {
            let height = layoutVertical ? cache.combobox.getHeight() + cache.label.getHeight() + data.ca('gap') : cache.combobox.getHeight()
            height && p(data, 'height', height);
            i.layoutHTML(layout, data, gv, cache);
        }
        layout.addView(cache.label, {
            height: "wrap_content",
            width: 'wrap_content',
        });
        layout.addView(cache.combobox, {
            height: 'match_parent',
            width: 'match_parent',
            marginTop: layoutVertical ? data.ca('gap') : 0,
            marginLeft: !layoutVertical ? data.ca('gap') : 0
        });
        layout.setAlign(layoutVertical ? 'left' : 'center');
        layout.setVAlign('middle');

        cache.layoutModeCache = layout;
    }

    if (cache.label) {
        cache.label.setTextColor(data.s('label.color'));
        i.allowEmpty(data, "labelText", value => cache.label.setText(value));
        cache.label.setTextFont(data.ca('font'));
    }

    /*230215，对话框dialog_ui的zIndex为400，那么内嵌图纸的combobox的自定义tree下来zIndex也必须大于等于这个数（400）才能展示
    不过内置的list就没问题，不用做任何设置（好像也不好获取到其对象实例）*/
    let zIndexTmp = null;
    if (i.rootData(data) && i.rootData(data)._uiView && i.rootData(data)._uiView.getZIndex) {
        zIndexTmp = i.rootData(data)._uiView.getZIndex();
    } else {
        //231214，日志太多了屏蔽掉！！
        // console.warn('warining! combobox has customized treeDropDow，and need zIndex of top data with uiView,but get none', i.rootData(data));
    }
    if (zIndexTmp == null) {
        //日志屏蔽，有时会太多
        // console.error('zIndex error!!', data, i.rootData(data));
        zIndexTmp = 500;
    }
    cache.combobox.treeView.setZIndex(zIndexTmp);
    return layout;
}


//地图GIS组件
function __coordgis_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'gis', '地图');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.obj) {
        function init() {
            function updateMarker(coordString) {
                if (coordString && coordString.split(',') && coordString.split(',').length >= 2) {
                    if (cache.marker) cache.map.removeLayer(cache.marker);
                    cache.marker = L.marker(coordString.split(','));
                    cache.marker.addTo(cache.map);
                }
            }

            /*230315，结合latLonAlign属性，来做对coord属性的读写（数组类型）。其中默认不勾选latLonAlign时coord意义为"经度,维度"字符串组合，
            勾选后，则意义变为"维度,经度"，虽然体现在属性配置上数值不变！*/
            function __getCoord() { //返回始终是[经度,维度]顺序的数组
                let coordRaw = data.ca('coord');
                if (!coordRaw || coordRaw == '' || coordRaw.split && coordRaw.split(',').length != 2) {
                    console.error('coord empty or format error!', coordRaw);
                    return undefined;
                }
                return data.ca('latLonAlign') ? coordRaw.split(',').reverse() : coordRaw.split(',');
            }

            function __setCoord(coord, returnOnly = false) { //接受[经度,维度]顺序的数组
                if (!coord || !isArrayFn(coord) || coord.length != 2) {
                    console.error('coord empty or format error!', coord);
                    return;
                }
                let coordtmp = data.ca('latLonAlign') ? coord.reverse().join(',') : coord.join(',');
                if (!returnOnly) data.ca('coord', coordtmp);
                return coordtmp;
            }

            /*这句极为重要，编辑状态下define在vs/loader.js中有定义造成在leaflet.js中命名冲突，但是运行状态下不存在，所以需要渲染元素中设置define为null即可！*/
            if (!runningMode()) define = null;

            /*【注意】220212，内置高德js sdk，开启内置的周边搜索功能，不需要额外的连线触发通信组件（天地图），天地图次数更多，API灵活配置不需要
            传参即可，不需要动组件本身；但是内置了高德的搜索，那么如果需要更多的查询条件或接口服务，需要修改组件本身，而不是配置属性能做到的！*/
            //需要用高德地图的数据服务做周边搜索时，需要引入高德的js sdk，如果不用高德来搜索（并非地图展示），可以屏蔽掉不引用！
            //运行时动态加载依赖的（高德）地图js，使用其api
            //步骤1：先设置高德地图安全密钥
            window._AMapSecurityConfig = {
                securityJsCode: 'df5a2d1a79fbfe67e6e088c0193011c8'
            };
            //步骤2：后引入js并传入key
            importCssJs.loadArr('js', ['https://webapi.amap.com/maps?v=1.4.8&key=ecd11024b15876d4281d969a42e10dae'], true, () => {});

            //初始化地图对象和瓦片
            function __initMapTile() {
                if (!cache.map) {
                    //key属性可以配置单个字符串或者数组，实现多个地图可以有索引对应，可以没有，可以共用同一个，也可以各自独立的key
                    function __key(index) {
                        let keytmp = data.ca('key');
                        if (isArrayFn(keytmp)) {
                            if (keytmp.length > 1) { //数组长度大于1，如果对应自己索引没有，那么就当没有返回
                                if (keytmp[index] == undefined) return undefined;
                                else return keytmp[index];
                            } else return keytmp[0]; //如果数据就配置了1个，那么后面如果对应索引没有，就都用配置的第一个
                        } else return keytmp; //如果是字符串而不是数组，那么所有的共同采用这个字符串配置的
                    }

                    /**
                     * 天地图内容
                     */
                    let normalm = L.tileLayer.chinaProvider('TianDiTu.Normal.Map', {
                            maxZoom: 18,
                            minZoom: 5,
                            key: __key(0), //【注意】天地图需要在这里加上key
                        }),
                        normala = L.tileLayer.chinaProvider('TianDiTu.Normal.Annotion', {
                            maxZoom: 18,
                            minZoom: 5,
                            key: __key(0)
                        }),
                        imgm = L.tileLayer.chinaProvider('TianDiTu.Satellite.Map', {
                            maxZoom: 18,
                            minZoom: 5,
                            key: __key(0)
                        }),
                        imga = L.tileLayer.chinaProvider('TianDiTu.Satellite.Annotion', {
                            maxZoom: 18,
                            minZoom: 5,
                            key: __key(0)
                        });
                    //两个对象用来给到下面的baseLayers
                    let normal = L.layerGroup([normalm, normala]),
                        image = L.layerGroup([imgm, imga]);


                    /**
                     * 智图地图内容
                     */
                    let normalm1 = L.tileLayer.chinaProvider('Geoq.Normal.Map', {
                            maxZoom: 18,
                            minZoom: 5
                        }),
                        normalm2 = L.tileLayer.chinaProvider('Geoq.Normal.Color', {
                            maxZoom: 18,
                            minZoom: 5
                        }),
                        normalm3 = L.tileLayer.chinaProvider('Geoq.Normal.PurplishBlue', {
                            maxZoom: 18,
                            minZoom: 5
                        }),
                        normalm4 = L.tileLayer.chinaProvider('Geoq.Normal.Gray', {
                            maxZoom: 18,
                            minZoom: 5
                        }),
                        normalm5 = L.tileLayer.chinaProvider('Geoq.Normal.Warm', {
                            maxZoom: 18,
                            minZoom: 5
                        }),
                        normalm6 = L.tileLayer.chinaProvider('Geoq.Normal.Cold', {
                            maxZoom: 18,
                            minZoom: 5
                        });

                    /**
                     * 高德地图
                     */
                    let Gaode = L.tileLayer.chinaProvider('GaoDe.Normal.Map', {
                            maxZoom: 18,
                            minZoom: 5
                        }),
                        Gaodimgem = L.tileLayer.chinaProvider('GaoDe.Satellite.Map', {
                            maxZoom: 18,
                            minZoom: 5
                        }),
                        Gaodimga = L.tileLayer.chinaProvider('GaoDe.Satellite.Annotion', {
                            maxZoom: 18,
                            minZoom: 5
                        });
                    //对象用来给到下面的baseLayers
                    var Gaodimage = L.layerGroup([Gaodimgem, Gaodimga]);

                    //注意，名称key可以修改，但是顺序不能随便调整，新增减少都只能从末尾开始，因为配置中做了类型关联！
                    var baseLayers = cache.layers = {
                        "天地图": normal,
                        "天地图影像": image,
                        "智图地图": normalm1,
                        // "智图多彩": normalm2, //该模式会报错！
                        "智图午夜蓝": normalm3,
                        "智图灰色": normalm4,
                        "智图暖色": normalm5,
                        // "智图冷色": normalm6,//该模式会报错！
                        "高德地图": Gaode, //单图层情况，未经过L.layerGroup组合成多个图层
                        "高德影像": Gaodimage, //组合层情况，经过L.layerGroup组合多个图层
                    };

                    // //231105，设置所有的地图zIndex，避免遮盖掉其他的组件！貌似没卵用，放弃！
                    // let allTileLayers = [normalm, normala, imgm, imga, normalm1, normalm2, normalm3, normalm4, normalm5, normalm6, Gaode, Gaodimgem, Gaodimga];
                    // allTileLayers.forEach(layer => {
                    //     layer.setZIndex(1);
                    // });

                    ////////////////////////////////////////////////////////////////////

                    //leaflet实例化
                    let map = cache.map = L.map(obj, {
                        center: __getCoord() && __getCoord().reverse(), //230315，增加lanLatAlign属性，让coord属性默认保持是经度lon在前的识别格式，而这里gis组件是维度在前
                        renderer: L.svg(),
                        zoom: data.ca('zoom'),
                        zoomControl: false, // + -号放大缩小
                        attributionControl: false, // 右下角leaflet.js图标
                        layers: i.values(cache.layers)[data.ca('default')]
                    });

                    //添加按钮到地图中，方便点击展开选择不同的地图瓦片！
                    L.control.layers(baseLayers, null).addTo(map);

                    `
                    //地图瓦片地图图层地址
                    //关联地图并且背景染色样式（L.tileLayer.colorizr是重写后的）
                    let titleLayer = cache.titleLayer = L.tileLayer.colorizr(data.ca('server'), {
                        maxZoom: 20,
                        minZoom: 3,
                        //这个方法用来调整所有的图片上的rgb值，pixel是图片原有的rgb值
                        colorize: function(pixel) {
                            pixel.r += 13;
                            pixel.g += 17;
                            pixel.b += 25;
                            return pixel;
                        }
                    });
                    titleLayer.addTo(map);
                    `

                    //初始化设定标定点
                    __getCoord() && updateMarker(__getCoord().join(',')); //230315，增加lanLatAlign属性，让coord属性默认保持是经度lon在前的识别格式，而这里gis组件是维度在前

                    //标定点鼠标事件点击弹出显示内容
                    function onMapClick(e) {
                        //兼具回调cb、属性逐层往上更新、表单提交处理
                        i.formEventBubblingUpper(data, gv, cache, 'onClick', {
                            'a:coord': __setCoord([e.latlng.lng, e.latlng.lat], true) //结合lanLatAlign设置，将合适的顺序传递给coord属性
                        }, true);
                    }
                    map.on('click', onMapClick);

                    //初始化markerSet
                    data.fp('a:markerSet', null, true);
                }
            }

            //加载地图操作工具js，leaflet
            let obj = cache.obj = document.createElement('div');
            importCssJs.css('custom/libs/leaflet/leaflet/leaflet.css');
            importCssJs.loadArr('js', [ //importCssJs对于逐个.js()加载，以及.loadArr()传入数组加载，对于script之间保持同步一个个顺次加载而不是并行加载！此外.loadArr()的回调函数参数，就是让列表中最后一个js加载完毕来回调！
                'custom/libs/leaflet/leaflet/leaflet.js',
                'custom/libs/leaflet/leaflet-plugins/leaflet-tilelayer-colorizr.js',
                'custom/libs/leaflet/leaflet-plugins/leaflet.ChineseTmsProviders.js'
            ], true, () => {
                /*第二个参数这里一定要为true或者false，效果有区别：传入true时在渲染元素重入（尤其是编辑状态重新加载图纸）时，新创建的div dom元素，能经过对应新加载对应的js去操作处理，
                每次重新加载图纸都会提示报错Can only have one anonymous define call per script file，但是运行正常；传入false时，不会重新加载js，利用此前浏览器缓存的对象，在回调函数中同样会调用
                到L.map传入div dom元素的对象，虽然不报错，但是效果显示不正常，地图尺寸区域不会铺满div!*/
                __initMapTile();
            });

            data.dm().md(e => {
                if (e.data == data) {
                    // //event格式：
                    // {
                    //     property: 'name',//发生变化的属性
                    //     oldValue: 'oldValue',//旧值
                    //     newValue: 'newValue',''新值
                    //     data: data//发生变化的data
                    // }
                    switch (e.property) {
                        case 'a:bindControlsVal': //230909，静态值修改后，配置值能体现在连线的toolTip上。对于i.md()可以省去这里的case，对于dm().md()的需要手动加上！
                            _i.__bindControlsValUpdate(e);
                            break;
                        case 'a:zoom':
                            cache.map && cache.map.setZoom(data.ca('zoom'));
                            break;
                        case 'a:default': //暂不支持编辑时即使切换选择，需要选择后保存，再加载才行，主要是leaflet的map对象操作和反初始化api没找到！还不熟
                            break;
                        case 'a:coord':
                            let arrtmp = __getCoord();
                            if (!arrtmp) return;
                            arrtmp.reverse();
                            cache.map && cache.map.flyTo(arrtmp); //230315，gis组件支持的是lat维度在前
                            cache.map && updateMarker(arrtmp.join(','));
                            break;
                        case 'a:latLonAlign':
                            //2303115，此前地图组件mark标定经纬度的数组数序，跟天地图的经纬度顺序是反着的，属性默认是"维度,经度"，现在加上读写属性，用来动态确定coord属性值的意义，是经度在前还是维度在前！
                            i.fpAttrs(data, ['coord', 'markerSet']);
                            break;
                        case 'a:server':
                            cache.titleLayer.setUrl(data.ca('server'));
                            break;
                        case 'a:markerSet':
                            if (e.newValue) {
                                /*支持数组或元素以高德地图查询返回格式的字段，示例如下：
                                {
                                    "id": "B0FFGI68Q7",
                                    "name": "面包鲜语(深圳北站)",
                                    "type": "餐饮服务;糕饼店;糕饼店",
                                    "location": {
                                        "Q": 22.609103,
                                        "R": 114.02905099999998,
                                        "lng": 114.029051,
                                        "lat": 22.609103
                                    },
                                    "address": "民治街道致远中路28号深圳北站F1层",
                                    "tel": "",
                                    "distance": 6,
                                    "shopinfo": "0"
                                }
                                results字段存放的坐标信息对应的marker对象*/
                                try {
                                    isArrayFn(cache._mkResults) && cache._mkResults.forEach(item => cache.map.removeLayer(item));
                                    cache._mkResults = [];
                                    if (!e.newValue) return; //单纯取消标记时
                                    data.ca('results') && isArrayFn(data.ca('results')) && data.ca('results').forEach(item => {
                                        if (!item.location || !item.location.lat || !item.location.lng) return;
                                        let lat = String(item.location.lat),
                                            lng = String(item.location.lng);
                                        if (lat == undefined || lng == undefined) return;

                                        //与高德地图API不同，这里需要纬度，经度顺序，且是数字的字符串
                                        let marker = L.marker([lat, lng]);
                                        if (marker == undefined) {
                                            console.error('create marker error!', lat, lng)
                                            return;
                                        }
                                        marker.addTo(cache.map);
                                        cache._mkResults.push(marker);
                                    });

                                    //230220，即时复位，避免再次进入不来！此外，尽可能用i.update代替data.ca()赋值，因为后者会导致图元组件被嵌套时，数据无法向上同步！
                                    i.update(data, e.property, false);
                                } catch (error) {
                                    console.error(error);
                                    i.update(data, e.property, false);
                                }

                            }
                            break;
                        case 'a:trigger':
                        case 'a:search':
                            // 高德地图查询周边
                            data.ca('results', []); //存放结果的属性先清空
                            data.ca('error', undefined);

                            /*【注意】220212，内置高德js sdk，开启内置的周边搜索功能，不需要额外的连线触发通信组件（天地图），两种方式互补！*/
                            //高德地图的周边查询。暂时不用，改成通过http组件查询天地图的周边查询接口，连线方式触发查询
                            function __aMapSearchNearBy(centerPoint, radius, keyWords, city = null) {
                                AMap.service(["AMap.PlaceSearch"], function() {
                                    var placeSearch = new AMap.PlaceSearch({
                                        pageSize: 20, // 每页10条
                                        pageIndex: 1, // 获取第一页
                                        // city: city // 指定城市名(如果你获取不到城市名称，这个参数也可以不传，注释掉)
                                    });

                                    // 第一个参数是关键字，这里传入的空表示不需要根据关键字过滤
                                    // 第二个参数是经纬度，数组类型：[lng,lat]
                                    // 第三个参数是半径，周边的范围
                                    // 第四个参数为回调函数
                                    //【注意】：字符串转成数字，且前面是纬度,经度（[lat,lng]），这里传参需要是经度，纬度，即[lng,lat]
                                    let lnglat = [Number(centerPoint[1]), Number(centerPoint[0])];
                                    placeSearch.searchNearBy(keyWords, lnglat, radius, function(status, result) {
                                        if (result.info === 'OK') {
                                            let locationList = result.poiList.pois; // 周边地标建筑列表
                                            //兼具回调cb、属性逐层往上更新、表单提交处理
                                            i.formEventBubblingUpper(data, gv, cache, null, {
                                                'a:results': locationList
                                            }, true, true, 'onSearchResult');
                                            data.fp('a:markerSet', null, true);
                                        } else {
                                            console.error('查找失败!', result, status);
                                            data.ca('error', status + '! ' + result);
                                        }
                                    });
                                });
                            }
                            //230315，data.ca('coord)改成__getCoord().reverse()，只是为了兼容代码，实际上高德地图接受的就是经度在前，下面函数内还是会做调换的！
                            __getCoord() && __aMapSearchNearBy(__getCoord().reverse().join(','), data.ca('radius'), data.ca('search')); //第二个参数城市，可以不传，经纬度已经精准知道位置了
                            break;
                    }
                }
            });
            return obj;
        }

        var obj = cache.obj = init()
        obj.style['z-index'] = 0;  
        i.layoutHTML(obj, data, gv, cache);
    }

    return cache.obj;
}

function __dateRangePicker_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'range', '日期跨度选择器');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    let layoutVertical = data.ca('layoutVertical');
    if (layoutVertical == undefined) layoutVertical = false;
    //231006，更新标签文字，放到函数中
    function __updateLabelText() {
        cache.label.setTextColor(data.ca('labelColor'));
        cache.label.setTextFont(data.ca('font'));
        // cache.label.setText(data.ca('labelText'));
        i.allowEmpty(data, "labelText", value => cache.label.setText(value));
    }

    //240711，合并边框色，并且兼容此前分开的配置。
    if (!data.ca('background') || !isArrayFn(data.ca('background'))) {
        data.ca('background', [
            data.ca('background'), //null，或初始配置的单个值
            "rgb(247,247,247)",
            "rgb(247,247,247)"
        ]);
    }

    //240721，文字颜色改成数组，索引0是原先用途，索引1用来作为标签/标题颜色
    if (!data.ca('color') || !isArrayFn(data.ca('color'))) {
        data.ca('color', [
            data.ca('color'), 
            'rgb(61,61,61)'
        ])
    }

    //240711，合并边框色，并且兼容此前分开的配置。
    if (!data.ca('borderColor') || !isArrayFn(data.ca('borderColor'))) {
        data.ca('borderColor', [
            data.ca('borderColor'), //null，或初始配置的单个值
            "rgb(51,153,255)"
        ]);
    }

    if (cache.control == undefined) {
        //组件默认form绑定的属性
        i.setAttrsFormBinded(data, ['value', 'timeFrom', 'timeTo', 'readOnly', 'disabled', 'onChange']);
        cache.layoutV = new ht.ui.VBoxLayout();
        cache.layoutH = new ht.ui.HBoxLayout();
        cache.layoutH.setScrollBarMode('off')
        cache.layoutV.setScrollBarMode('off')
        let label = cache.label = new ht.ui.Label(),
            rangeObj = new ht.ui.DateRangePicker(), //240112，为了让更新mode时即时更新组件！
            singleObj = new ht.ui.DateTimePicker(),
            control = cache.control = (data.ca('mode') == 'range' ? rangeObj : singleObj); //new ht.ui.DateRangePicker();
        // control.setDropDownConfig({
        //     'dateRangePane.type': 'datetime' // dateRangePane.xxx 配置日期时间面板属性，year|month|date|datetime|time
        // });
        //TODO 特定事件
        //----------------------------------------------------

        control.on('p:value', v => {
            if (data._i_backWriteControlVal) {
                data._i_backWriteControlVal = undefined;
                return;
            }

            let values = [],
                valuetmp = v.newValue;

            //240208，之前是valueTmp = ' '，为什么？？这样会导致初始placeHoder看不到！现在强行改成''，会不会出什么问题？？？有待观察分析测试！！
            if (!v.newValue || v.newValue == '') {
                valuetmp = '';

                //240308，加上这里，这样比如清空重置时，对外也会将空的值传递到API接口参数中去。
                i.formEventBubblingUpper(data, gv, cache, null, {
                    'a:value': '',
                    'a:timeFrom': '',
                    'a:timeTo': ''
                }, true);
            }

            if (valuetmp && typeof(valuetmp) == 'string') {
                values = valuetmp.split('~');
                values.forEach((val, idx) => {
                    val = val.trim();
                    if (data.ca('valType') == 'date') {
                        values[idx] = val.split(' ')[0]
                    } else if (data.ca('valType') == 'time') {
                        values[idx] = val.split(' ')[1]
                    }
                });
                valuetmp = values.join(' ~ ');
                let currentValueShow = data.ca('mode') == 'single' ? values[0].trim() : valuetmp
                i.formEventBubblingUpper(data, gv, cache, null, {
                    'a:value': currentValueShow,
                    'a:timeFrom': data.ca('mode') == 'single' ? currentValueShow : values && values[0] && values[0].trim(),
                    'a:timeTo': data.ca('mode') == 'single' ? currentValueShow : values && values[1] && values[1].trim()
                }, true);

                //2312009，支持只获取日期或时间
                if (data.ca('mode') != 'single') data._i_backWriteControlVal = true;
                control.setValue(currentValueShow);
            }
        })

        //点击展开下拉事件响应
        _i.addViewListener(control, v => {
            if (v.kind == 'open') { //每次下拉之前，先要恢复列表节点的可见属性，否则会因为此前如果有输入触发筛选，那么塞选的可见过滤结果也会影响这里                
                if (data.ca('disabled')) { //230918，禁止下拉展开
                    control.close();
                    return;
                }
            }
        });

        //----------------------------------------------------

        //监听输入属性变化
        i.md(data, gv, cache, {
            'a:labelColor|a:labelText|a:font': e => {
                __updateLabelText();
            },
            'a:value': e => {
                cache.control.setValue(e.newValue);
                /*240112，发现range模式下，初始加载通过这里control.setValue触发on:value，在里面再调用setValue()时，并不会再次触发on:value造成死循环，
                也正常，因为都是a:value传入的原始值！因此此时需要复位_i_backWriteControlVal，否则导致每次初始加载后的下拉跨度选择，都无法触发连线操作！*/
                if (e.oldValue == '__init__') data._i_backWriteControlVal = undefined;
            },
            'a:timeFrom|a:timeTo': e => {
                i.update(data, 'value', data.ca('mode') == 'range' ? (data.ca('timeFrom') + ' ~ ' + data.ca('timeTo')) : data.ca('timeFrom'));
            },
            'a:readOnly': e => {
                //231003，类似combobox下拉框的处理
                cache.control.setReadOnly(e.newValue);

                //240711，合并边框色，并且兼容此前分开的配置。
                let hoverReadOnlyBackgroundTmp = data.ca('hoverReadOnlyBackground') ? data.ca('hoverReadOnlyBackground') : data.ca('background')[1];
                let activeReadOnlyBackgroundTmp = data.ca('activeReadOnlyBackground') ? data.ca('activeReadOnlyBackground') : data.ca('background')[2];
                cache.control.setActiveReadOnlyBackground(activeReadOnlyBackgroundTmp);
                cache.control.setHoverReadOnlyBackground(hoverReadOnlyBackgroundTmp);
            },
            'a:disabled': e => {
                //231003，类似combobox下拉框的处理
                e.newValue && i.update(data, 'readOnly', true);

                //240711，合并边框色，并且兼容此前分开的配置。
                //230927，只有禁用的时不允许下拉时，默认背景颜色才变化。
                let hoverReadOnlyBackgroundTmp = data.ca('hoverReadOnlyBackground') ? data.ca('hoverReadOnlyBackground') : data.ca('background')[1];
                cache.control.setBackground(e.newValue ? hoverReadOnlyBackgroundTmp : data.ca('background')[0]); //230926，只读模式下，默认颜色跟滑过一样
            },
            //231003，将背景颜色放到这里
            'a:background': e => {
                //240711，合并边框色，并且兼容此前分开的配置。
                // cache.control.setBackground(isArrayFn(e.newValue) ? e.newValue[0] : e.newValue);
                //240905，需要考虑只读模式，在多层嵌套后，上层对readOnly设置只读，那么颜色需要同步显示只读的！
                cache.control.setBackground(i.valArrCompatiable(e.newValue, Number(data.ca('disabled'))));
            },
            'a:mode': e => {
                /*240225，如果e.oldValue是__init__初始化加载，那么就不清理数据绑定data.getDatabindings的设置值attrObject，因为可能下面紧接着初始动态增加insertTempAttr，否则会出现
                比如内嵌api组件继承到上层form绑定的值，设置无法锁定等怪异现象。*/
                i.clearTempAttrs(data, null, e);
                if (e.newValue == 'range') {
                    i.insertTempAttrs(data, [{
                        "attr": "timeFrom",
                        "valueType": "Object",
                        "defaultValue": "",
                        "description": "起始时间字符串。"
                    }, {
                        "attr": "timeTo",
                        "valueType": "Object",
                        "defaultValue": "",
                        "description": "结束时间字符串。"
                    }], 'value');
                } else if (e.newValue == 'single') {

                } else console.assert(0);

                //240305，data改成i.topData(data)，这样就兼容了上层嵌套时修改动态更新！
                _i.iv(i.topData(data));
            },
            'a:open': e => { //240112，新增属性
                if (!!e.newValue) {
                    _i.setTimeout(() => {
                        cache.control.open();
                        data.ca('open', false); //复位
                    }, 0);
                }
            },
            's:label.color': e=>{
                //240729，因为下面有data.s('label.color',data.ca('color')[1])，这里不处理下，会导致始终无法在标题中修改文字颜色！
                if(!data.ca('color')) data.ca('color',[]);
                data.ca('color')[1] = e.newValue;
                i.update(data,'colors',data.ca('color'));
            }
        }, [{
                /*240225，将涉及到调用i.insertTempAttrs动态插入属性的，加入到attrsInit中并且对象key-value形式，值为"__init__，"，因为key-value对象且值为__init__，表示渲染元素初始化时立即同步执行，而且异步
                等到顶层加载完毕后再初始化执行一次！*/
                'a:mode': '__init__'
            },
            'a:value', 'a:labelText', 'a:background', 'a:readOnly', 'a:disabled'
        ], null, cache.control, e => {
            //label与组件水平、垂直对齐布局
            i._labelLayout(data, gv, cache, e);
        });
    }

    //231006，发现得放到这里，否则切换时，内嵌标签会不显示。
    if (cache.label) __updateLabelText();

    let layout = layoutVertical ? cache.layoutV : cache.layoutH;
    if (cache.layoutV && cache.layoutH && cache.control && cache.label) {
        if (layout != cache.layoutModeCache) {
            let height = layoutVertical ? cache.control.getHeight() + cache.label.getHeight() + data.ca('gap') : cache.control.getHeight()
            height && p(data, 'height', height)
            i.layoutHTML(layout, data, gv, cache);
        }
        layout.addView(cache.label, {
            height: "wrap_content",
            width: 'wrap_content',
        });
        layout.addView(cache.control, {
            height: 'match_parent',
            width: 'match_parent',
            marginTop: layoutVertical ? data.ca('gap') : 0,
            marginLeft: !layoutVertical ? data.ca('gap') : 0
        });
        layout.setAlign(layoutVertical ? 'left' : 'center');
        layout.setVAlign('middle');
    }

    cache.layoutModeCache = layout;

    if (cache.control) {
        //240711，合并边框色，并且兼容此前分开的配置。
        let activeColorTmp = data.ca('activeBorderColor') ? data.ca('activeBorderColor') : data.ca('borderColor')[1];
        cache.control.setBorder(new ht.ui.border.FocusLineBorder(data.ca('borderWidth'), data.ca('borderColor')[0], activeColorTmp));

        //240722，索引1为标签颜色
        cache.control.setColor(data.ca('color')[0]);
        data.s('label.color',data.ca('color')[1]);
        cache.label.setTextColor(data.ca('color')[1]);

        cache.control.setBorderRadius(data.ca('borderRadius'));
        cache.control.setHoverIcon(data.ca('hoverIcon'));
        cache.control.setFont(data.ca('font'));
        cache.control.setPlaceholder(data.ca('placeholder'));
    }

    return cache.layoutModeCache;
}

function __dialog_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'dlg', '对话框');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    //按钮确认/ok执行逻辑
    function __commitProcess() {
        /*上面改成这里调用，一个函数调用来对属性逐层向上更新、事件逐层向上传递、表单提交触发全部执行到，否则当前对话框组件被嵌套
        弹出对话框后点击关闭，show/hide没法复位，导致再次打开就打不开了！*/
        if (data != undefined) {
            i.formEventBubblingUpper(data, gv, cache, 'onOk', {
                'a:show': false,
                'a:hide': false,
                //230301，固定识别formType字段
                "formType": data.ca('pureFormValues') ? 3 : -1 //230301，新增的formType参数放到这里，就不再从函数入参新增了，太多了。本参决定默认表单属性大类

            }, 2,true,null,false,false,null,()=>__commitProcess()); //230320-22:03，原先传入true，改成2，因为1/true是回写但不触发md监听的函数执行，而2回写当前并触发执行，相当于直接调用data.ca()
        } else {
            console.error('dialog node has been removed??', data);
        }
        //如果有设置表单与UI页的绑定
        let pageBindedTmp = data.ca('onPageBinded'); //数组[tag,multiDistinctIndex]示例：数组[tabView1,1]
        if (pageBindedTmp && isArrayFn(pageBindedTmp) && pageBindedTmp.length == 2) {
            let uiData = data.dm() && d(data.dm(), pageBindedTmp[0]);
            uiData && i.keys(data.innerDataBindings).forEach(function(formAttr) {
                //表单form页的index都是固定0，与ui页是一对多的关系！用传入的multiDistinctIndex
                //let formIndexTmp = formAttr.split('>')[1];    
                let formTagTmp = formAttr.split('>')[2], //tips 230414，相当于从'炉窑基本信息-表单>0>v1>a:value'中取得'v1'
                    attrAlias = undefined;
                i.keys(uiData.innerDataBindings).forEach(function(uiAttr) {
                    try {
                        let uiIndextmp = uiAttr.split('>')[1], //tips 230414，第几页，对应onPageBinded的动态绑定页index（第二个参数）
                            uiTagtmp = uiAttr.split('>')[2]; //tips 230414，相当于从'窑炉基本信息-界面>1>v1>s:text'中取得'v1'
                        //23014，获得上层图元某个属性对应内嵌图元当前属性的别名
                        attrAlias = i.getDisplayBindingItem(i.innerData(uiData, uiAttr), i.innerKeyURL(uiAttr))['alias'];
                        if (attrAlias == undefined) attrAlias = 'value'; //别名没有设置时，默认当成"value"，因为表单输入组件绝大部分值属性名称都是a:value
                        if (
                            uiIndextmp == pageBindedTmp[1] &&
                            uiTagtmp == formTagTmp &&
                            /*230414，加上了条件，用来限定属性名称与ui组件的属性对应的内嵌图元属性中的别名一致时才赋值，否则比如输入框默认多个form绑定暴露出来，
                            那么同一个tag下对应多个属性值，因为不唯一对应而造成错误！*/
                            formAttr.split('>').at(-1).split(':')[1] == attrAlias
                        ) {
                            uiData.ca(uiAttr, data.ca(formAttr));
                        }
                    } catch (error) {
                        console.error(formAttr, uiAttr, attrAlias, error);
                    }
                })
            });
        }

        //保存内容到图纸
        if (data.ca('displaySaving')) {
            i.upload(data.dm(), function(result) {
                if (result == 0) console.error('save inner display error,may be cause some prop setting error for tag problem!');
                else { //运行状态下弹窗ok就是做下图纸保存操作！
                    //快捷键回车默认就是对话框ok，回车自动调用onClick，避免鼠标手动点击，回车调用时是手动传参进来，button.getParent()就识别不了
                    // button.getParent().hide();
                    cache.current.hide();
                }
            }, data.ca('enableLoading'));
        } else cache.current.hide();
    }

    cache.buttonSettings = [{
        textFont: data.ca('titleFont') ? data.ca('titleFont').replace('bold', '') : undefined, //230401，如果标题有加粗，那么底部按钮不加粗，其他一样！
        text: data.ca('footerButtonsText') && data.ca('footerButtonsText')[0] ? data.ca('footerButtonsText')[0] : '确定',
        ...iotos.multiState(
            //240722，合并到一个属性
            data.ca('bt1-backgrounds') ? data.ca('bt1-backgrounds') : data.ca('btn1Background').slice(0,2),
            data.ca('bt1-selectBackgrounds') ? data.ca('bt1-selectBackgrounds') : data.ca('btn1Background').slice(2,3)[0],
            data.ca('bt1-activeBackgrounds') ? data.ca('bt1-activeBackgrounds') : data.ca('btn1Background').slice(3)[0],

            data.ca('bt1-textColors') ? data.ca('bt1-textColors') : data.ca('bt1TextColors').slice(0,2), 
            data.ca('bt1-selectTextColors') ? data.ca('bt1-selectTextColors') : data.ca('bt1TextColors').slice(2,3)[0], 
            data.ca('bt1-activeTextColors') ? data.ca('bt1-activeTextColors') : data.ca('bt1TextColors').slice(3)[0], 

            data.ca('bt１-borderWidths') ? data.ca('bt１-borderWidths') : data.ca('btnBorderWidths'),

             //240722，好像下面意义不大，只是换了个属性名，并没有合并！
            data.ca('bt1-borderColors') ?  data.ca('bt1-borderColors') : data.ca('btn1BorderColors'),

            data.ca('bt１-borderRadius') ?  data.ca('bt１-borderRadius') :　data.ca('btn1BorderRadius')
        ),
        onClick: function(button, e) {
            /*230918，有的时候希望onCancel也能对外触发连线操作，比如onOk/onCancel，只要对话框关闭，都要触发自身表单还原复位。这时，
            为了只让有反向关联onCancel的才能触发，就临时对非关联的了静态赋值为'~'，让updateBindControl不会往下走！不过操作完毕后
            还要将原始配置的静态赋值/解析赋值还原，避免保存到图纸页面json中了。*/
            let pAttrs = data.ca('paramControlAttr'),
                bValsClone = a = i.clone(data.ca('bindControlsVal'));
            pAttrs && pAttrs.forEach((pAttr, idx) => {
                if (pAttr && typeof(pAttr) != 'string') i.alert(`${data.getDisplayName()}索引为${idx}的关联属性字符串异常：${pAttr}`, '错误');
                if (!(pAttr && pAttr.trim().toLowerCase().length >= 8 && pAttr.trim().toLowerCase().slice(-8) == 'oncancel')) {
                    i.setIndexValue(data.ca('bindControlsVal'), idx, '~', null);
                }
            });
            i.formEventBubblingUpper(data, gv, cache, 'onCancel', {
                'a:show': false,
                'a:hide': false

            }, 2, true,null,false,false,null,()=>this.onClick(button,e)); /*最后一个参数false，不触发bindControls表单提交；*/

            //230918，还原原先的解析赋值配置！
            _i.setTimeout(() => {
                data.ca('bindControlsVal', bValsClone);
            }, 0);

            // button.getParent().hide();
            cache.current.hide();
        }
    }, {
        textFont: data.ca('titleFont') ? data.ca('titleFont').replace('bold', '') : undefined, //230401，如果标题有加粗，那么底部按钮不加粗，其他一样！
        text: data.ca('footerButtonsText') && data.ca('footerButtonsText')[1] ? data.ca('footerButtonsText')[1] : '取消',
        ...iotos.multiState(
            //240722，合并到一个属性，兼容之前旧的属性配置
            data.ca('bt0-backgrounds') ? data.ca('bt0-backgrounds') : data.ca('btn0Background').slice(0,2),
            data.ca('bt0-selectBackgrounds') ? data.ca('bt0-selectBackgrounds') : data.ca('btn0Background').slice(2,3)[0],
            data.ca('bt0-activeBackgrounds') ? data.ca('bt0-activeBackgrounds') : data.ca('btn0Background').slice(3)[0],

            data.ca('bt0-textColors') ? data.ca('bt0-textColors') : data.ca('bt0TextColors').slice(0,2), 
            data.ca('bt0-selectTextColors') ? data.ca('bt0-selectTextColors') : data.ca('bt0TextColors').slice(2,3)[0], 
            data.ca('bt0-activeTextColors') ? data.ca('bt0-activeTextColors') : data.ca('bt0TextColors').slice(3)[0], 

            data.ca('bt0-borderWidths') ? data.ca('bt0-borderWidths') : data.ca('btnBorderWidths'),

             //240722，好像下面意义不大，只是换了个属性名，并没有合并！
            data.ca('bt0-borderColors') ?  data.ca('bt0-borderColors') : data.ca('btn0BorderColors'),

            data.ca('bt0-borderRadius') ?  data.ca('bt0-borderRadius') :　data.ca('btn0BorderRadius'),
        ),
        onClick: function(button, e) {
            __commitProcess();
        }
    }]

    if (!cache.control) {
        //240710，为了兼容旧的对话框组件没有配置background属性的情况！
        if (data.ca('background') === undefined) {
            i.update(data, 'background', [
                "rgba(255,255,255,1)",
                "rgba(255,255,255,1)",
                "rgba(255,255,255,1)",
                "rgba(0,0,0,0.2)"
            ]);
        }

        defineClass_DatabindingsImageDrawable();
        //组件默认form绑定的属性
        i.setAttrsFormBinded(data, ['show', 'titleText', 'display', 'innerLayoutMode', 'onPageBinded', 'onOk', 'onCancel', 'onFinally', 'debugOccupied', 'footerButtonsText']);

        function newDialog(view = null) { //ht.ui.HTView类型的对象传入
            let dialog = new ht.ui.Dialog();
            dialog.setScrollBarMode('auto');

            /*编辑、运行时对话框dialog实例对象，共用同一个ht.ui.HTView对象（同一个gv、dm），因此内容的设置上，一时刻只显示一个，
            不同时显示编辑对话框和运行时对话框（运行时，编辑对话框隐藏且内容对象给到运行对话框对象），以解决内嵌gv等容器时出现的BUG*/
            if (view) {
                dialog.graphView = view.getContent();
                dialog.setContentView(view);
            }

            let toolstmp = dialog.getTools();
            if (cache.dialogToolsBackup == undefined) {
                cache.dialogToolsBackup = toolstmp;
            }
            //240419，发现存在点击关闭弹窗时这里报错的情况（embeded模式的对话框），查看换吗发现原先onClick里面只是调用了this.hide()，那么就屏蔽下面，到hide的响应里去复位show属性即可！
            let functmp = toolstmp[2].onClick;
            toolstmp[2].onClick = function() {
                //240419，发现会报错，onClick里面调用的是this.hide()，而embeded模式内嵌页的对话框弹窗后点击叉叉关闭，发现报错this为undefined，这里直接改成调用this.hide()后发现就正常了！
                // functmp();
                this.hide();

                data.ca('show', false);
            }

            //不显示收起和最大最小化按钮（- □），只保留关闭按钮（×）
            //实测发现setTools([])和removeToolAt()对于目标无效果！
            dialog.setCollapsable(!data.ca('closeButtonOnly'))
            dialog.setMaximizable(!data.ca('closeButtonOnly'))

            initProperties(dialog);
            // let objtmp = new ht.ui. HtmlView();
            // objtmp.setContentDiv(dialog.getContentDiv());
            return dialog;
        }
        data.s('2d.visible', !runningMode()); //运行状态下初始对话框图元不可见，否则会有残影！

        let dataModelTmp = new ht.DataModel(),
            contentGV = new ht.graph.GraphView(dataModelTmp); //230401，传入从dm改成gv
        cache.content = new ht.ui.HTView(contentGV);

        //共享了同一个graphView和HTView对象，显示的时候切换内容赋值，不再运行时态同时显示编辑时态的对话框
        function __changeContentTo(to = 'edit') { //两个选项：'edit'、'run'
            if (to == 'edit') {
                if (data.ca('embedded') && runningMode()) {
                    data.s('2d.visible', false);
                } else {
                    cache.control.setContentView(cache.content);
                    cache.control.setVisible(!runningMode()); //关闭独立对话框，编辑状态下，恢复显示编辑对话框，运行模式下则不显示否则会有残影！
                    data.s('2d.visible', !runningMode());

                    //230414，用i.addAttrRunningInit代替直接data._saveIgnored赋值，避免多个属性操作被覆盖！而应该追加！并且最后一个参数则是指定oldValue用于编辑加载初始状态
                    i.addAttrRunningInit(data, 's:2d.visible', false, true);

                    initProperties(cache.control); //对话框主动或被动dialog.setContentView(null)后，除了中间区域的内容，底部按钮也会被清空，因此需要再次初始化下
                    runningMode() && cache.control.hide();
                }
            } else if (to == 'run') {
                cache.current.setContentView(cache.content);
                if (!data.ca('embedded')) {
                    /*独立对话框非内嵌模式下，弹出对话框为cache.controlRunning对象，对编辑模式下的对话框实例以及图元可以隐藏掉。因为内容赋值写给运行对话框了，
                    显示编辑状态清空了内容的对话框意义不大！且编辑状态下对话的图元框隐藏，其连线也会消失，弹出运行对话框，关闭后再回复编辑状态显示和连线，更有动感！*/
                    cache.control.setVisible(false);
                    data.s('2d.visible', false);
                } else { //内嵌模式下用setVisible(true)打开对话框显示，需要图元的2d.visible为true可见，否则对话框也看不到了！
                    data.s('2d.visible', true);
                }
                initProperties(cache.current); //虽然支持传入数组[cache.control,cache.controlRunning]放到函数末尾统一初始化，但实测发现这里的操作跟顺序有关，数组内最后的会起作用，而前面的初始化会不起效果
            } else console.assert('param to error,', to, 'not support!');
            data.fp('a:oneButton', null, data.ca('oneButton'));
        };
        i.addChildDataModel(data, contentGV, 'ui0'); //230401，传入从dm改成gv
        cache.control = newDialog(cache.content);

        /*注意，编辑状态下给渲染元素，一定要visible为true，否则不会显示对话框窗口，等同于show()
        而运行对话框实例则不能设置，本身有调用show()如果此前也设置了visible为true，内容区域初始会异常（黑块）*/
        cache.control.setVisible(true);

        runningMode() && cache.control.hide(); //运行状态下初始要关闭对话框，否则也会有闪动！

        cache.controlRunning = newDialog();
        cache.controlRunning.setVisible(false); //显式设置下运行对话框实例对象visible默认为false，只有编辑状态才有对话框默认显示
        // cache.controlRunning.

        //监听对话框按键弹起事件
        function __onKeyEnter(e) {
            if (e.key == 'Enter') { //手动调用对话框ok按钮处理函数
                //如果内嵌的是textArea文本编辑输入控件，回车输入自动处理内部换行，不会响应对话框的对话框关闭操作！
                if (e.srcElement.tagName.toLowerCase() == 'textarea') return;
                //模拟点击默认按钮关闭对话框
                if (data.ca('footerVisible') == true) {
                    //240517，只有一个按钮时，固定索引为0
                    let buttontmp = cache.controlRunning.getButtons()[data.ca('oneButton') ? 0 : 1 - Number(data.ca('cancelDefault'))]; //回车键默认按钮响应
                    buttontmp.onClick(buttontmp, null);
                } else data.ca('cancelDefault') ? __closeDialog() : __commitProcess();
            }
        }
        cache.controlRunning.on('d:keyup', __onKeyEnter);
        cache.control.on('d:keyup', __onKeyEnter); //230127，增加编辑状态下对话框的键盘监听，以支持embeded模式！

        function clickMask(e) {
            /*<div tabindex="-1" style="border: 0px; outline: 0px; padding: 0px; position: fixed; margin: 0px; box-sizing: 
            border-box; width: 100%; height: 100%; left: 0px; top: 0px; cursor: default; background: rgba(0, 0, 0, 0.3);"></div>*/
            if (e.target._ht == undefined &&
                e.target.tagName == 'DIV' &&
                e.target.style &&
                data.ca('modal') &&
                //240609，maskBackground合并到了backgroud属性组中去了！
                i.isColorEqual( /*data.ca('maskBackground')*/ __getBackgroundColor('maskBackground'), e.target.style.background)
            ) {
                __closeDialog(); //取消方式来关闭对话框的正确方式！
            }
        }
        //230728，点击模态对话框的阴影区域关闭对话框，embeded勾选时，仅用cache.control才能监听到
        _i.addEventListener(cache.control.getView(), 'click', clickMask);
        //230812，点击模态对话框的阴影区域关闭对话框，embeded没勾选时，仅用cache.controlRunning才能监听到！
        _i.addEventListener(cache.controlRunning.getView(), 'click', clickMask);

        //对话框右上角关闭按钮叉,2022-12-29，自动创建的对话框node，需要再cancel、ok后都要移除掉，那么叉叉按钮也需要执行到cancel的逻辑！
        function __closeDialog() {
            cache.buttonSettings[0].onClick(null, null);
        }
        let toolLength = cache.controlRunning.getTools().length;
        cache.controlRunning.getTools()[toolLength - 1].onClick = e => __closeDialog();

        function initInnerDisplay(graphView, url) {
            let nodeData = data;
            let nodeGv = gv;
            //运行模式下，弹窗打开加载页面，【注意】现在编辑状态下有弹窗，协助编辑提高效率，暂时就先把运行模式去掉！
            url && i.withLoading(closeLoading => {
                /*加载内嵌图纸。同时用来区分渲染元素内动态加载多个同样或类似的内嵌图纸，通过外部统一管理的变量multiDistinct传入，
                实现属性变量暴露或分组Group名称来做区分*/
                loadDisplay(graphView, url, cache, function(json, dm, gv, datas) {
                    //运行模式下，弹窗打开加载页面
                    closeLoading();
                    //231225，监听指定你gv内的按钮点击
                    function __buttonOkCancelSupport(gv) {
                        //对话框dialog监听内嵌图纸的图元，其中tag为如下特殊的情况下，对应当前对话框的操作，用以完全自定义对话框外观，去掉默认的header和footer！
                        function miInnerButtons(e) {
                            const {
                                kind,
                                type,
                                event,
                                data
                            } = e;
                            //if (kind == 'onClick') { //方式一：点击鼠标松开后会有一定（100ms左右）的延时才会触发
                            if (kind == 'onUp' && type == 'data') { //方式二：鼠标松开瞬即触发
                                switch (i.lower(data.getTag())) {
                                    case 'maximize':
                                        cache.current.setMaximized(getBrowerSize().width <= data.getWidth() || getBrowerSize().height <= data.getHeight());
                                        break;
                                    case 'minimize':
                                        break;
                                    case 'cancel':
                                    case 'close':
                                        __closeDialog();
                                        break;
                                    case 'ok':
                                        __commitProcess();
                                        break;
                                }
                            }
                        };
                        gv._i_oldMiFunc && gv.umi(gv._i_oldMiFunc);
                        gv.mi(miInnerButtons);
                        gv._i_oldMiFunc = miInnerButtons;
                    }
                    //231225，监听直接内嵌页的按钮点击
                    __buttonOkCancelSupport(gv);

                    dm.each(function(child) {
                        if (child.s('fullscreen') == 'fill') {
                            //注意，这里回调函数无法直接访问外层变量！！传入cache，就是让loadDisplay函数体内能用其操作渲染元素中的缓存变量！
                            if (nodeData.a('useOriginSize')) {
                                _i.setTimeout(() => { //240206，因为openDialog中有初始因此footerVisible，在加载完成后才显示，但是在此之前已经执行到这里了，因此这里就统一放到下一个时序去！否则连线表单等弹窗高度会异常，少了一个底部高度！
                                    nodeData.__originSize = [nodeData.getWidth(), nodeData.getHeight()];
                                    let heighttmp = (child._i_originHeight !== undefined ? child._i_originHeight : child.getHeight()) + ((nodeData.ca('footerVisible') || nodeData._i_footerVisible) ? nodeData.a('footerHeight') : 0) + (nodeData.ca('headerVisible') ? nodeData.a('headerHeight') : 0);
                                    nodeData.setWidth(child._i_originWidth !== undefined ? child._i_originWidth : child.getWidth());
                                    !isNaN(heighttmp) && nodeData.setHeight(heighttmp);
                                    nodeData.iv();
                                }, 0);
                            } else {
                                // let originSizeTmp = cache.data.ca('originSize');
                                let originSizeTmp = nodeData.__originSize;

                                if (originSizeTmp) {
                                    nodeData.setWidth(originSizeTmp[0]);
                                    nodeData.setHeight(originSizeTmp[1]);
                                    nodeData.iv();
                                }
                            }

                            //如果因此了对话框的顶部和底部，表明是要用到全自定义的对话框外观，此时圆角需要跟随内嵌图纸的圆角，否则会多一个配置，为避免繁琐，自动执行！
                            cache.childDisplayBackgroundNode = child;
                            if (nodeData.ca('headerVisible') == false && nodeData.ca('footerVisible') == false) {
                                nodeData.ca('backgroundColor', 'rgba(255,255,255,0)'); //全自定义对话框外观时，自动让对话框的背景颜色为全透明，避免圆角跟内嵌图纸圆角不一致导致白边！
                            }
                        }

                        //231225，内嵌的滚动页，内部的按钮也支持ok、cancel等tag，不仅仅是对接好直接内嵌页的按钮。
                        if (i.isControlTyped(child, 'scroll')) {
                            child.__buttonOkCancelSupport = __buttonOkCancelSupport;
                            child.ca('initCallback', `(node, innerGv) => {
                                //内嵌滚动页初始反序列化后，监听内嵌按钮的点击，方便用来代替上层的上层对话框的ok/cancel
                                node.__buttonOkCancelSupport && node.__buttonOkCancelSupport(innerGv);
                            }`);
                        }
                    });
                }, {
                    renderData: nodeData,
                    renderGv: nodeGv,
                    multiDistinctIndex: 0
                });
            }, data.ca('enableLoading'));
        }

        //240608，背景色属性合并到一个数组！为了简化！
        function __getBackgroundColor(type) {
            let backgrounds = data.ca('background'),
                typeIndexed = ['headerBackground', 'footerBackground', 'backgroundColor', 'maskBackground'],
                indextmp = typeIndexed.indexOf(type);
            //240619，这句用来兼容之前旧的，背景色为颜色而非数组的配置！避免旧的页面对话框背景变成透明了！
            if (typeof(backgrounds) == 'string') backgrounds = [backgrounds];
            return (!backgrounds || indextmp == -1) ? null : _i.indexedValue(backgrounds, indextmp);
        }

        //240609，设置对话框头header、脚footer的背景色等
        function __setHeaderFooterStyles(dlg) {
            //240609，如果不用自绘，一旦设置头脚背景色，就会是尖角，盖在对话框圆角上，从而圆角设置视觉上就失效了！
            let borderRadius = data.ca('borderRadius');
            dlg.setHeaderBackgroundDrawable(new DatabindingsImageDrawable(data.ca('backgroundImage'), {
                'radius': [borderRadius, 0, 0, borderRadius],
                'background': __getBackgroundColor('headerBackground')
            }));
            dlg.setHeaderVisible(data.ca('headerVisible'));
            dlg.setFooterBackgroundDrawable(new DatabindingsImageDrawable(data.ca('backgroundImage'), {
                'radius': [0, borderRadius, borderRadius, 0],
                'background': __getBackgroundColor('footerBackground')
            }));
        }

        //2个对话框的view层面的属性，则是公共函数来统一处理，两个对象分别要设置了！
        function initProperties(dialogs, property = null) {
            let p = property;
            data.s('2d.editable', !data.ca('useOriginSize'))
            let dialogArr = [];
            if (isArrayFn(dialogs)) {
                dialogArr = dialogs;
            } else {
                dialogArr = [dialogs];
            }
            dialogArr.forEach((dialog, index) => {
                dialog.setTitle(data.ca('titleText'));
                dialog.setTitleColor(data.ca('titleColor'));
                dialog.setTitleFont(data.ca('titleFont'));

                /*dialog.setBorderRadius(data.ca('borderRadius')); //背景矩形会从圆角radius边框线穿过，圆角线画在矩形背景上有尖角！！
                所以用setBackgroundDrawable，来自定义重绘背景，传入矢量矩形和数据绑定！并把内置的边框线去掉！*/
                dialog.setBorder(null);
                dialog.setFooterHeight(data.ca('footerHeight'));
                dialog.setHeaderHeight(data.ca('headerHeight'));
                __setHeaderFooterStyles(dialog);

                dialog.setBoxShadow(data.ca('boxShadow'));
                dialog.setButtonGap(data.ca('footerButtonGap'));

                //230127，偶尔发现初始加载这里报错（http组件中的__changeContentTo执行时）
                if (data.ca('footerButtonSize') && data.ca('footerButtonSize').length >= 2) {
                    dialog.setButtonPrefWidth(data.ca('footerButtonSize')[0]);
                    dialog.setButtonPrefHeight(data.ca('footerButtonSize')[1]);
                }

                !data.ca('footerVisible') && dialog.setButtons([]);
                data.ca('footerVisible') && dialog.setButtons(cache.buttonSettings);

                dialog.setPadding(data.ca('padding'));
                dialog.setModal(data.ca('modal'));
                dialog.setMaskBackground(__getBackgroundColor('maskBackground'));
            })
        }

        //230219，切换到i.md
        i.md(data, gv, cache, {
            'a:backgroundImage|\
            a:borderRadius|\
            a:headerVisible|\
            a:background': e => {
                function updateDialog1(dlg) {
                    let headerHeightVisible = data.ca('headerHeight'),
                        footerHeightVisible = data.ca('footerHeight');
                    //240609.2，发现有data.getHeight()/getWidth()为0的情况！
                    // radiusMax = Math.min(data.getWidth(), data.getHeight()); //最大能设置的圆角，为对话框宽高中较小的那个！（圆角跟边长相等时，就成了圆形）
                    if (!data.ca('headerVisible')) {
                        //240609.2，这里就给一个极大值，表明头高度这里对圆角参数不限了，因为头就是不可见状态！
                        headerHeightVisible = 9999; //radiusMax; //如果头不可见，那么圆角的设置，不要以头的高度来限定，取值为上面能设置的最大值。
                    }
                    if (!data.ca('footerVisible')) {
                        //240609.2，这里就给一个极大值，表明脚高度这里对圆角参数不限了，因为脚就是不可见状态！
                        footerHeightVisible = 99999; //radiusMax; //如果脚不可见，那么圆角的设置，不要以脚的高度来限定，取值为上面能设置的最大值。
                    }
                    radiusMax = Math.min(headerHeightVisible, footerHeightVisible); //能设置的最大圆角：头和脚存在时，圆角最大值应该是最小的那个！
                    if (data.ca('borderRadius') > radiusMax) {
                        i.update(data, 'a:borderRadius', radiusMax);
                        _i.alert('圆角最大值受头脚高度等限制，当前最大为' + radiusMax);
                        return;
                    }

                    //240609，头角背景颜色设置，以及圆角设置，借用公共的属性data.ca('borderRadius')
                    __setHeaderFooterStyles(dlg);

                    //tips 240609，背景自绘，且圆角保持一致！
                    dlg.setBackgroundDrawable(new DatabindingsImageDrawable(data.ca('backgroundImage'), {
                        'radius': data.ca('borderRadius'),
                        'background': __getBackgroundColor('backgroundColor') ? __getBackgroundColor('backgroundColor') : 'rgba(255,255,255,0)' //230813，清掉背景色就成透明！而不是默认白色！
                    }));

                    //240609，遮盖层没有drawable自绘方法！
                    dlg.setMaskBackground(__getBackgroundColor('maskBackground'));
                }
                updateDialog1(cache.control);
                updateDialog1(cache.controlRunning);
            },
            'a:boxShadow': e => {
                cache.control.setBoxShadow(data.ca('boxShadow'));
                cache.controlRunning.setBoxShadow(data.ca('boxShadow'));
            },
            'a:btn0Background|\
            a:btn1Background|\
            a:bt0TextColors|\
            a:bt1TextColors|\
            a:btn0BorderRadius|\
            a:btn1BorderRadius|\
            a:btnBorderWidths|\
            a:btn0BorderColors|\
            a:btn1BorderColors|\
            a:borderWidths|\
            a:bt0-backgrounds|\
            a:bt0-selectBackgrounds|\
            a:bt0-activeBackgrounds|\
            a:bt0-textColors|\
            a:bt0-selectTextColors|\
            a:bt0-activeTextColors|\
            a:bt0-borderWidths|\
            a:bt0-borderColors|\
            a:bt0-borderRadius|\
            a:bt1-backgrounds|\
            a:bt1-selectBackgrounds|\
            a:bt1-activeBackgrounds|\
            a:bt1-textColors|\
            a:bt1-selectTextColors|\
            a:bt1-activeTextColors|\
            a:bt1-borderWidths|\
            a:bt1-borderColors|\
            a:bt1-borderRadius|\
            a:footerButtonsText|\
            a:footerVisible|\
            a:cancelDefault|\
            a:oneButton': e => { //默认通常是确认、取消两个按钮，只有一个按钮时等同于取消，不会触发bindControls；因为如果一旦有触发下一步动作的，那么一定再配备一个取消按钮
                function updateDialog2(dlg) {
                    if (data.ca('footerVisible')) {
                        let buttontmp = [];
                        cache.buttonSettings.forEach((item, index) => {
                            //提示对话框，只有一个按钮的时候，相当于就是取消按钮（当然，按钮名称文字可以随便设置）,index 0取消/1确定
                            let canceltmp = data.ca('cancelDefault') == true; //默认哪个按钮，那么在单按钮模式下，另一个按钮就不显示了！
                            if (data.ca('oneButton') && index == canceltmp) return;

                            item.height = data.ca('footerButtonSize') && data.ca('footerButtonSize')[1] ? data.ca('footerButtonSize')[1] : 75
                            item.width = data.ca('footerButtonSize') && data.ca('footerButtonSize')[0] ? data.ca('footerButtonSize')[0] : 35
                            item.text = data.ca('footerButtonsText') && data.ca('footerButtonsText')[index] ? data.ca('footerButtonsText')[index] : '确定';
                            //注意，需要这么手动操作一下，否则直接获取的是前一次multiState函数执行的结果，每次得下一次才能获取到前一次设定的值！！
                            if (index == 0) {
                                item = {
                                    ...item,
                                    ...iotos.multiState(
                                         //240722，合并到一个属性，兼容之前旧的属性配置
                                        data.ca('bt1-backgrounds') ? data.ca('bt1-backgrounds') : data.ca('btn1Background').slice(0,2),
                                        data.ca('bt1-selectBackgrounds') ? data.ca('bt1-selectBackgrounds') : data.ca('btn1Background').slice(2,3)[0],
                                        data.ca('bt1-activeBackgrounds') ? data.ca('bt1-activeBackgrounds') : data.ca('btn1Background').slice(3)[0],
                                       
                                        data.ca('bt1-textColors') ? data.ca('bt1-textColors') : data.ca('bt1TextColors').slice(0,2), 
                                        data.ca('bt1-selectTextColors') ? data.ca('bt1-selectTextColors') : data.ca('bt1TextColors').slice(2,3)[0], 
                                        data.ca('bt1-activeTextColors') ? data.ca('bt1-activeTextColors') : data.ca('bt1TextColors').slice(3)[0], 

                                        data.ca('bt1-borderWidths') ? data.ca('bt1-borderWidths') : data.ca('btnBorderWidths'),

                                         //240722，好像下面意义不大，只是换了个属性名，并没有合并！
                                        data.ca('bt1-borderColors') ?  data.ca('bt1-borderColors') : data.ca('btn1BorderColors'),

                                        data.ca('bt１-borderRadius') ?  data.ca('bt１-borderRadius') :　data.ca('btn1BorderRadius'),
                                    )
                                }
                            } else if (index == 1) {
                                item = {
                                    ...item,
                                    ...iotos.multiState(
                                         //240722，合并到一个属性，兼容之前旧的属性配置
                                        data.ca('bt0-backgrounds') ? data.ca('bt0-backgrounds') : data.ca('btn0Background').slice(0,2),
                                        data.ca('bt0-selectBackgrounds') ? data.ca('bt0-selectBackgrounds') : data.ca('btn0Background').slice(2,3)[0],
                                        data.ca('bt0-activeBackgrounds') ? data.ca('bt0-activeBackgrounds') : data.ca('btn0Background').slice(3)[0],

                                        data.ca('bt0-textColors') ? data.ca('bt0-textColors') : data.ca('bt0TextColors').slice(0,2), 
                                        data.ca('bt0-selectTextColors') ? data.ca('bt0-selectTextColors') : data.ca('bt0TextColors').slice(2,3)[0], 
                                        data.ca('bt0-activeTextColors') ? data.ca('bt0-activeTextColors') : data.ca('bt0TextColors').slice(3)[0], 

                                        data.ca('bt0-borderWidths') ? data.ca('bt0-borderWidths') : data.ca('btnBorderWidths'),

                                         //240722，好像下面意义不大，只是换了个属性名，并没有合并！
                                        data.ca('bt0-borderColors') ?  data.ca('bt0-borderColors') : data.ca('btn0BorderColors'),

                                        data.ca('bt0-borderRadius') ?  data.ca('bt0-borderRadius') :　data.ca('btn0BorderRadius'),
                                    ),
                                }
                            }
                            buttontmp.push(item);
                        });

                        /*将下面cache.buttonSettings中间过渡更新去掉，避免连续两个对话框通过updateDialog2处理，对于单按钮模式下
                        循环中间有return，相当于移除，这样先后两个的执行如果有公共变量参与结果，那么前一个的函数操作就会影响后一个了*/
                        dlg.setButtons(buttontmp);
                    } else {
                        dlg.setButtons([]);
                    }
                }
                updateDialog2(cache.control);
                updateDialog2(cache.controlRunning);
            },
            'a:useOriginSize|\
            a:titleText|\
            a:modal|\
            a:padding|\
            a:headerHeight|\
            a:footerHeight|\
            a:footerButtonGap|\
            a:buttonIconSize|\
            a:footerButtonSize|\
            a:footerButtonsColor|\
            a:titleFont|\
            a:titleColor': e => {
                //case 'a:symbol': //无需通过重新设置刷新symbol的url，以更新image中的[object]，a:display属性跟新来刷新即可！
                initProperties([cache.control, cache.controlRunning], e.property);
            },
            'a:display': e => { //230118 从上面initPorperties紧接着后面的调用剥离出来，避免config.js中连线弹出对话框等对titleText等一连串外观属性的设置，都会影响造成重新加载内嵌图纸！需要进一步观察是否会有BUG！！
                //240814，避免编辑时清空，偶尔出现高频闪动的BUG！这里就暂不支持对话框内容清空了，否则无意义。需要指定页面来替换才行，而不是清空嵌套！
                if(e.newValue === undefined) return;

                if(runningMode() && e.oldValue == '__init__' && e.newValue && e.newValue.indexOf('__操作演示.json') !== -1) return;
                let targetURL = i.autoDisplayURL(e,'display',true);
                if (targetURL === undefined) return;
                initInnerDisplay(cache.control.graphView, targetURL);
            },
            'a:show': e => {
                if (!!e.newValue //230907，直接这么判断，否则此前对于字符串赋值，也不弹窗了
                ) { //注意，show不是点击赋值后立刻自动复位为0，而是对话框关闭后才被设置复位为0，跟hide、以及http.requesting不一样！
                    if (cache.current && cache.current.isVisible() == true) {
                        /*230127，编辑状态下，如果是内嵌模式，那么不允许点击弹出对话框，show设置1后自动复位为false！所以编辑状态下，一定得是非内嵌模式，因为即使设置show为true，
                        调用了dialog.show()，实际现象是编辑状态下是可选中的图元模式，但是运行状态下是正常的对话框弹窗！*/
                        if (!runningMode() && data.ca('embedded')) data.ca('show', false); //复位
                        return;
                    }
                    __updateAppearance(); //这句话里面有设置宽高，因此要放到getCenterPosition()前面，否则中心点计算是按照尺寸变化之前的，导致居中出现问题！
                    if (!cache.current) { //240520
                        console.error('WARN: cache.current is null', data);
                        return;
                    }
                    let  center  = cache.current.getCenterPosition();
                    //内嵌对话框模式，用setVisible(true)，而不要用show()，这样才能保证弹出显示紧密按照图元布局最终的位置显示，否则用show()显示就是居中了！！
                    //230310，属性debugOccupied勾选后，无论如何也不弹窗，只会占位，只有去掉勾选后，才会当正常对话框触发弹窗显示！
                    cache.current == cache.control ? cache.current.setVisible(true) : !data.ca('debugOccupied') && cache.current.show(center.x, center.y);
                    !data.ca('debugOccupied') && __changeContentTo('run');
                    if (data.ca('debugOccupied')) {
                        console.error('WARN: debugOccupied attr has been checked, if you want to open dialog,please uncheck this attr!');
                        _i.setTimeout(() => {
                            i.update(data, 'show', false);
                        }, 100);
                    }

                    if (data.dm()._url && data.dm()._url.indexOf('河道监测') != -1) { //240521，专门针对河道项目，避免效果演示很怪，就针对性开放这句！
                        cache.current.setZIndex(i.getRootZIndex(data));
                    }

                    if (data.ca('reloadWhenOpen')) {
                        data.fp('a:display', null, data.ca('display'));
                    }
                } else {
                    data.ca('show', false); //复位
                    cache.current.hide();
                    __changeContentTo('edit');
                    if (data.ca('reloadWhenOpen') && e.oldValue !== '__init__') {
                        _i.setTimeout(() => {
                            runningMode() && _i.clearDeep(data, true);
                        }, 0);
                    }
                }
            },
            'a:hide': e => { //代码来做对话框主动关闭（非手动关闭时），比如处理中/加载中的过渡对话框，成功完成后，自动关闭当前、触发新的弹窗
                if (Number(e.newValue) == true) {
                    /*自动关闭对话框，处理逻辑等同于回车不应该是默认按钮的执行逻辑，因为默认肯定是取消（比如检测中取消、查询取消），但是操作
                    完毕后的自动执行，则应该自动执行OK/确定按钮的逻辑！*/
                    __commitProcess();
                }
            },
            'a:closeButtonOnly': e => {
                function updateDialog(dialog) {
                    if (dialog == undefined) return;
                    dialog.setCollapsable(!data.ca('closeButtonOnly'));
                    dialog.setMaximizable(!data.ca('closeButtonOnly'));
                }
                updateDialog(cache.control);
                updateDialog(cache.controlRunning);
            },
            'a:onPageBinded': e => { //数组[tag,multiDistinctIndex]示例：数组[tabView1,1]
                if (!e.newValue) return;
                let uiData = d(data.dm(), e.newValue[0]);
                i.keys(uiData.innerDataBindings).forEach(function(uiAttr) {
                    let uiIndextmp = uiAttr.split('>')[1],
                        uiTagtmp = uiAttr.split('>')[2];
                    i.keys(data.innerDataBindings).forEach(function(formAttr) {
                        //表单form页的index都是固定0，与ui页是一对多的关系！用传入的multiDistinctIndex
                        //let formIndexTmp = formAttr.split('>')[1];    
                        let formTagTmp = formAttr.split('>')[2];
                        if (uiIndextmp == e.newValue[1] && uiTagtmp == formTagTmp) {
                            data.ca(formAttr, uiData.ca(uiAttr));
                        }
                    })
                });
            },
            'a:embedded': e => { //默认false:全局对话框，独立于编辑状态下的对话框示例对象cache.controlRunning；true:复用内嵌编辑状态的对话框对象cache.control
                cache.current = e.newValue ? cache.control : cache.controlRunning;
            },
        }, [{
                'a:embedded': '__init__' //240309，放到这里，避免弹窗show的时候，cache.current对象还没出初始化赋值！
            },
            //注意，data.fp来初始化case中交互事件的逻辑，让反序列化保存还原后也默认执行，此时调用要放到dm().md()之后才行！
            // 'a:embedded',
            'a:display',
            'a:background',
            'a:oneButton',
            {
                /*230128，对话框加上初始默认对show/hide置0，忽略原始在图纸json中保存的值，如果异常情况导致保存的为1，导致没法点击触发弹窗！注意，是否有效
                还有待进一步观察测试，因为这里进行赋值，跟图纸json加载后还原的顺序哪个先哪个后？如果这个是先，那么还是会被图纸序列化保存的值加载后覆盖掉！*/
                'a:show': false,
                'a:hide': false
            }
        ], null, cache.current, e => {});

        //如果是内嵌对话框模式，且由吸附节点并且是吸附到底层base，那么在运行模式下调整位置根据布局贴边！对话框embeded内嵌模式下运行状态下布局设置！
        let basetmp = i.baseNode(gv);
        if (
            data.ca('embedded') && runningMode() && data.getHost() && data.getHost() == basetmp &&
            //230317，只有背景矩形不包含编辑时放置的对话框图元，即对话框图元没有放到背景矩形内部、在区域外时才做运行时自动挪入处理！
            !ht.Default.containsRect(basetmp.getRect(), data.getRect())
        ) {
            /*231123，对话框dialog编辑状态下embeded内嵌，并且在底板外侧布局，希望运行时自动移到内部贴边弹出，有一个问题就是编辑状态下吸附相对做好了，但是
            编辑状态下尺寸和运行时尺寸不一样！编辑状态下可能是完全独立底板区域外，但是底板平铺fill窗口且对话框按照吸附布局也调整尺寸后，那么就可能是交集并
            非完全在区域外了！因此，对于内嵌模式且判断发现不完全在底板内的对话框，就获取原始编辑时配置的再来判断！要知道，如果是在内部吸附布局，尺寸再怎么变
            都一定是在内部，不可能超出边距！*/
            i.rawValue(data, null, ret => {
                let rawDm = ret, //原始图纸json编辑时的配置，对应当前图元对话框和底板，已经并非现在加载并且适应窗口后的尺寸。
                    rawNode = d(rawDm, data.getTag()), //当前对话框data的编辑时对象！
                    rawBase = d(rawDm, basetmp.getTag()); //当前底板basetmp的编辑时对象！

                //230317，判断对话框编辑时位置在底板四周的具体方位
                let leftSide = i.getPos(rawNode).x + rawNode.getWidth() <= i.getPos(rawBase).x,
                    rightSide = i.getPos(rawNode).x >= i.getPos(rawBase).x + rawBase.getWidth(),
                    topSide = i.getPos(rawNode).y + rawNode.getHeight() <= i.getPos(rawBase).y,
                    downSide = i.getPos(rawNode).y >= i.getPos(rawBase).y + rawBase.getHeight();

                //tips 231123，下面逻辑都不动，主要是上面的判断，data改成rawNode，basetmp改成rawBase！ ↑↑↑↑↑↑↑↑↑
                let basettmp = i.baseNode(gv);
                if (data.s('layout.v') == 'top') //“上”布局：保持水平位置不变，移动垂直位置跟base矩形顶部对齐
                    data.setPosition(data.getPosition().x, basettmp.getPosition().y - basettmp.getHeight() / 2 + data.getHeight() / 2);
                else if (data.s('layout.v') == 'bottom') //“下”布局：保持水平位置不变，移动垂直位置跟base矩形底部对齐
                    data.setPosition(data.getPosition().x, basettmp.getPosition().y + basettmp.getHeight() / 2 - data.getHeight() / 2);
                else { //当是“上&下”，“缩放”等手动微调布局的情况时
                    //230317，此前纵向固定是居中，现在去掉，而是要根据原先是上方还是下方，绝对靠那边贴边
                    let verPosType = null;
                    if (downSide) verPosType = 1; //下方（包括正下方、左下方、右下方）的上&下等布局，底边贴齐
                    else if (topSide) verPosType = -1; //正上方（略）的上&下等布局，顶边贴齐
                    //当垂直方向在中间位置时，要么在左边要么右边，此时横向位置不动的同时，纵向位置也不调整了，保持不变！
                    verPosType != null && data.setPosition(data.getPosition().x, basettmp.getPosition().y + verPosType * (basettmp.getHeight() / 2 - data.getHeight() / 2));
                }

                if (data.s('layout.h') == 'left')
                    data.setPosition(basettmp.getPosition().x - basettmp.getWidth() / 2 + data.getWidth() / 2, data.getPosition().y);
                else if (data.s('layout.h') == 'right')
                    data.setPosition(basettmp.getPosition().x + basettmp.getWidth() / 2 - data.getWidth() / 2, data.getPosition().y);
                else { //230317，同上，此前纵向固定是居中，现在去掉，而是要根据原先是左边还是右边，绝对靠那边贴边
                    //data.setPosition(basettmp.getPosition().x, data.getPosition().y);
                    //改成如下，因为进到这里，对话框一定是在底板区域之外的，所以比较各自的y坐标即可判断对话框在底板外面的上方还是下方，决定移到靠那边贴边对齐！
                    // let leftward = basetmp.getPosition().x > data.getPosition().x;
                    let horPosType = null;
                    if (leftSide) horPosType = -1; //左方（包括正左方、左下方、左上方）的左&右等布局，左边贴齐
                    else if (rightSide) horPosType = 1; //右方（略）的左&右等布局，右边贴齐
                    //当垂直方向在中间位置时，要么在左边要么右边，此时横向位置不动的同时，纵向位置也不调整了，保持不变！
                    horPosType != null && data.setPosition(basettmp.getPosition().x + horPosType * (basettmp.getWidth() / 2 - data.getWidth() / 2), data.getPosition().y);
                }
            }, true);
        }

        function __updateAppearance() {
            cache.controlRunning.setWidth(data.getWidth());
            cache.controlRunning.setHeight(data.getHeight());
            //运行模式的对话框实例，如果发现原先设定的宽度或者高度任何一方超过浏览器窗口的区域，那么就设置为最大化全屏模式！
            cache.controlRunning.setMaximized(getBrowerSize().width <= data.getWidth() || getBrowerSize().height <= data.getHeight());
        }

        /*230215，换成公共函数处理，主要是为了让图元data与对应的ht.ui控件对象关联起来，实现除了dm/dataModel、图元data的链表，ht.ui渲染元素也能形成链表！
        实现比如内嵌的渲染元素ui组件的弹出，在zIndex上要大于等于其最上层图元所属的ui控件对象（如果有）的zIndex，否则弹出会有问题！*/
        i.layoutHTML(cache.control, data, gv, cache, () => {
            __updateAppearance();
        });
        data._uiView = cache.current;
        data._i_onEventByEventTypeInit = true;
        try {__closeDialog();}catch(e){};   //241002，注意，分开try-catch，避免前一个因为cache.current等未初始化而异常，结果第二个函数执行不到，无法初始化到！
        try {__commitProcess();}catch(e){}
        data._i_onEventByEventTypeInit = undefined;
    }
    return cache.control;
}

function __graphView(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'gv', '嵌套容器');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.obj) {
        //默认表单属性
        i.setAttrsFormBinded(data, ['display', 'innerLayoutMode']);
        function init() {
            let graphView = new ht.graph.GraphView();
            i.addChildDataModel(data, graphView, 'ui0'); //230401，传入从dm改成gv；
            i.layoutHTML(graphView, data, gv, cache);

            return graphView;
        }
        let obj = cache.obj = init(),
            nodeGv = gv;
        i.md(data, gv, cache, {
            'a:display': e => {
                //230402，加上条件，不满足的url，直接返回，不进行loadDisplay
                if (e.newValue == undefined || isObject(e.newValue) || (typeof(e.newValue) == 'string') && e.newValue.trim() == '') return;
                initDisplay(e);
            },
            'a:displayJson': e => {
                obj.dm().clear()
                obj.reset()
                obj.deserialize(
                    i.jsonParse(e.newValue),
                    function(json, dm, gv, datas) {
                        //嵌套图纸的默认初始化
                        initGVLoadedRunning(gv, false, false, data.ca('display'));
                        gv.zoomReset();
                        let cb = new Function('return ' + data.ca('onPostDeserialize'))()
                        cb && cb(json, dm, gv, datas);
                    }
                );
            }
        }, ['a:display'], null, obj, e => {
            //通用阴影样式
            data && initShadow(cache.obj, data.ca('shadowBorder'), data.ca('shadowColor'), data.ca('shadowEnabled'));
        });

        function initDisplay(e) {
            console.warn('initDisplay：' + data.ca('display'));

            //230928，为了支持URL相对路径
            let targetURL = i.autoDisplayURL(e,'display',true);
            if (targetURL === undefined) return;

            //支持内嵌图纸的属性自动暴露和数据双向绑定
            loadDisplay(cache.obj, targetURL, cache, function(json, dm, gv, datas) {
            }, {
                renderData: data,
                renderGv: nodeGv,
                multiDistinctIndex: 0
            });
        }

        cache.obj.onHTMLRemoved = function() {
            data = null;
            cache.obj = null;
        }
    }
    return cache.obj;
}

function __input_ui(data, gv, cache) {
    let layoutVertical = data.ca('layoutVertical');
    if (layoutVertical == undefined) layoutVertical = false;

    cache = _i.innerRecoveredDataCache(data, cache, false, 'input', '输入框');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (cache.layoutV == undefined) {
        //240711，兼容背景颜色属性合并（成数组）配置。
        if (!data.ca('background') || !isArrayFn(data.ca('background'))) {
            data.ca('background', [
                data.ca('background'), //null或者初始配置的单个值
                'rgb(247,247,247)'
            ])
        }

        //240721，文字颜色改成数组，索引0是原先用途，索引1用来作为标签/标题颜色
        if (!data.ca('color') || !isArrayFn(data.ca('color'))) {
            data.ca('color', [
                data.ca('color'), 
                'rgb(61,61,61)'
            ])
        }

        cache.layoutV = data.layoutV = new ht.ui.VBoxLayout();
        cache.layoutH = new ht.ui.HBoxLayout();
        cache.layoutH.setScrollBarMode('off')
        cache.layoutV.setScrollBarMode('off')
        let label = cache.label = new ht.ui.Label(),
            textField = cache.textField = new ht.ui.TextField();

        //231126，初始配置的属性值，备份下。主要是类型需要用上，因为运行时可能需要字符串或者数字，默认情况下都是收到字符串！因此按照原始属性值来决定是否对数字的字符串进行转换！
        data._i_originValue = data.ca('value');

        //默认表单属性
        //230918，增加readOnly属性暴露，因为表单的还原，有查看和编辑两种模式，查看时肯定不能输入修改的！通过数据formValue表单的返回结果中追加keyURL-value即可！
        i.setAttrsFormBinded(data, ['value', 'instantTrigger', 'initialTrigger', 'onChange', 'onClear', 'onEnter', 'readOnly']);
        //230806，全部事件注册到bindEvents属性中，新连线操作下拉，会成为统一下拉列表的选项
        data.ca('bindEvents', ['*', 'onChange', 'onClear', 'onEnter']);
        textField.on('p:value', v => {
            //241110，如果下拉选择类型为数字，运行时输入只能是数字，当然值也要转换成数字。实测发现此时进来还是字符串，因此，强制转换！
            if(data.ca('type') == 'number') v.newValue = Number(v.newValue);

            //231126，如果初始值时数字，而输入值是数字的字符串，那么会自动将数字的字符串自动转换成数字，否则不转换！
            let forbidEventOpt = false;
            if (typeof(data._i_originValue) == 'number') {
                if (i.isStringNumber(v.newValue)) {
                    v.newValue = Number(v.newValue);
                } else if (v.newValue === undefined || v.newValue == '') { //231126，如果输入框清空，那么自动按照初始值
                    if (!data.ca('emptyTrigger')) forbidEventOpt = true;
                }
            }
            data.ca('value', v.newValue);

            //230830，加上了onClear，避免表单输入时清空，导致传给接口表单！
            if (!forbidEventOpt) {
                if (v.newValue == undefined) {
                    //230926，增加公共属性initialTrigger决定初始时是否可以触发对外连线操作，通过data._i_initial来判断是否是初始赋值。
                    (!data._i_initial || data.ca('initialTrigger')) && _i.formEventBubblingUpper(data, gv, cache, 'onClear', {
                        'a:value': v.newValue
                    }, false, true);

                    //230926，复位
                    if (data._i_initial) data._i_initial = false;
                } else {
                    //改成统一方式来调用
                    //230926，增加公共属性initialTrigger决定初始时是否可以触发对外连线操作，通过data._i_initial来判断是否是初始赋值。
                    (!data._i_initial || data.ca('initialTrigger')) && _i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                        'a:value': v.newValue
                    }, false, true);

                    //230926，复位
                    if (data._i_initial) data._i_initial = false;
                }
            }
        });
        textField.on('d:keyup', e => {
            if (e.key == 'Enter') {
                //230903，回车时触发事件
                // textField.fp('value', null, textField.getValue());
                _i.formEventBubblingUpper(data, gv, cache, 'onEnter', {
                    'a:value': textField.getValue()
                }, true, true);
            }
        });

        //监听输入属性变化
        if (data.dm()) {
            //监听输入属性变化
            i.md(data, gv, cache, {
                'a:value': e => {
                    //240731，说明此时正在切换成数字再次传入，前面的字符串传入就忽略，不处理！
                    if(data._i_stringAutoNumberChanging) return;

                    //230926，初始化时，组件不对外触发连线操作，避免出现比如文本框连线对弹窗，结果初始加载就弹窗的情况！
                    if (e.oldValue == '__init__') data._i_initial = true;
                    textField.setValue(e.newValue);
                    if (e.newValue == '' || e.newValue == undefined) {
                        textField.setPlaceholder(data.ca('placeholder'));
                    }
                },
                'a:readOnly': e => {
                    textField.setReadOnly(e.newValue ? 'entire' : false);
                    //230926，虽然input-ui有setDisabled方法，但是默认样式有点过了，还是只用其readOnly和背景颜色自定义来做！
                    // textField.setDisabled(e.newValue);
                    textField.setCursor(e.newValue ? 'not-allowed' : 'auto');

                    //240701，兼容之前的readOnlyBackground属性配置，新版是放到background的索引2的位置了！
                    let readOnlyBkgColor = null;
                    if (i.hasAttrObjectKey(data, 'readOnlyBackground')) {
                        readOnlyBkgColor = data.ca('readOnlyBackground');
                    } else {
                        readOnlyBkgColor = data.ca('background') && data.ca('background')[1];
                    }

                    //既然都没用到setDisabled()，那这里就不用setDisabledBackgound()方法了！
                    textField.setBackground(e.newValue ? readOnlyBkgColor : i.valArrCompatiable(data.ca('background')));
                },
                'a:background': e => {
                    textField.setBackground(i.valArrCompatiable(e.newValue, Number(data.ca('readOnly'))));
                },
                'a:placeholder': e => {
                    textField.setPlaceholder(e.newValue);
                },
                's:label.color': e=>{
                    //240729，因为下面有data.s('label.color',data.ca('color')[1])，这里不处理下，会导致始终无法在标题中修改文字颜色！
                    if(!data.ca('color')) data.ca('color',[]);
                    data.ca('color')[1] = e.newValue;
                    i.update(data,'colors',data.ca('color'));
                }
            }, ['a:value', 'a:background', 'a:readOnly'], null, textField, e => {
                //label与组件水平、垂直对齐布局
                i._labelLayout(data, gv, cache, e);
            });


        } else {
            console.error('WARNING data has been removed??', data);
        }
    }

    let textField = cache.textField;
    if (textField) {

        //240701，兼容之前的readOnlyBackground属性配置，新版是放到background的索引2的位置了！
        let activeBorderColor = null;
        if (i.hasAttrObjectKey(data, 'activeBorderColor')) {
            activeBorderColor = data.ca('activeBorderColor');
        } else {
            activeBorderColor = data.ca('borderColor')[1];
        }

        textField.setBorder(new ht.ui.border.FocusLineBorder(data.ca('borderWidth'), i.valArrCompatiable(data.ca('borderColor')), data.ca('readOnly') ? i.valArrCompatiable(data.ca('borderColor')) : activeBorderColor));
        textField.setColor(data.ca('color')[0]);
        data.s('label.color',data.ca('color')[1]);  //240721，索引1用来配置标签颜色
        textField.setType(data.ca('type'));
        textField.setBorderRadius(data.ca('borderRadius'));
        //true:编辑输入中就触发，false:失去焦点才触发，注意，编辑状态下即时触发是在运行模式，而不是编辑模式下编辑器的属性输入中触发！不同组件！
        textField.setInstant(data.ca('instantTrigger'));
        let iconPath = autoCompleteIconPath(data, 'iconPath'),
            iconColor = data.ca('iconColor');

        let nodeData = data;
        //tips 240505，自定义图标
        function MyDrawable(url) { //构造函数调用基类需传入this，同时注意实例化时是否有构造参数的传入！
            MyDrawable.superClass.constructor.call(this, url);
        }
        ht.Default.def(MyDrawable, ht.ui.drawable.ImageDrawable, {
            draw: function(x, y, width, height, data, view, dom) {
                let self = this, //成员函数调用基类方法，也需传入this
                    mydata = null;

                //240505，之前这里是let mydata = new ht.Node()，这必然导致内存持续增加啊！！一直在new对象！！！
                if (nodeData._i_drawableNode) mydata = nodeData._i_drawableNode;
                else mydata = nodeData._i_drawableNode = new ht.Node();

                mydata.setImage(this.getImage())
                mydata.a('icon-background', iconColor)
                MyDrawable.superClass.draw.call(this, x, y, width, height, mydata, view, dom);
            }
        });
        //注意这里实例化构造传入了参数，ImageDrawable(image, stretch, colorTint, rect)原本有4个可以传参！
        textField.setIconDrawable(new MyDrawable(iconPath));

        if (data.ca('iconSize')) {
            textField.setIconWidth(data.ca('iconSize')[0]);
            textField.setIconHeight(data.ca('iconSize')[1]);
        }
        textField.setIconTextGap(data.ca('iconTextGap'));
        // textField.setHoverIcon(data.ca('hoverIcon'));
        textField.setFont(data.ca('font'));
    }

    if (cache.label) {
        cache.label.setTextColor(data.s('label.color'));
        cache.label.setTextFont(data.ca('font'));
        // cache.label.setText(data.ca('labelText'));
        i.allowEmpty(data, "labelText", value => cache.label.setText(value));
    }

    let layout = layoutVertical ? cache.layoutV : cache.layoutH;
    if (cache.layoutV && cache.layoutH && cache.textField && cache.label) {
        if (layout != cache.layoutModeCache) {
            let height = layoutVertical ? cache.textField.getHeight() + cache.label.getHeight() + data.ca('gap') : cache.textField.getHeight()
            height && p(data, 'height', height);
            i.layoutHTML(layout, data, gv, cache);
        }
        layout.addView(cache.label, {
            height: "wrap_content",
            width: 'wrap_content',
        });
        layout.addView(cache.textField, {
            height: 'match_parent',
            width: 'match_parent',
            marginTop: layoutVertical ? data.ca('gap') : 0,
            marginLeft: !layoutVertical ? data.ca('gap') : 0
        });
        layout.setAlign(layoutVertical ? 'left' : 'center');
        layout.setVAlign('middle');

        cache.layoutModeCache = layout;
    }
    return layout;
}

function __linkButton_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache);
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined
    if (!cache.control) {
        function init() {
            var control = new ht.ui.LinkButton();
            control.on('click', function(e) {
                let cb = new Function('return ' + data.ca('clicked'))();
                cb && cb(gv, data, cache);
            });
            return control;
        }

        function initProperties() {
            control.setText(data.ca('text'));
            control.setTextFont(data.ca('font'));
        }

        data.dm().md(e => {
            if (e.data == data) {
                // //event格式：
                // {
                //     property: 'name',//发生变化的属性
                //     oldValue: 'oldValue',//旧值
                //     newValue: 'newValue',''新值
                //     data: data//发生变化的data
                // }
                switch (e.property) {
                    case 'a:bindControlsVal': //230909，静态值修改后，配置值能体现在连线的toolTip上。对于i.md()可以省去这里的case，对于dm().md()的需要手动加上！
                        _i.__bindControlsValUpdate(e);
                        break;
                    case 'a:text':
                    case 'a:font':
                        initProperties();
                        break;
                }
            }
        })

        var control = cache.control = init()
        initProperties();
        i.layoutHTML(control, data, gv, cache);
    }
    return cache.control;
}

//菜单容器
function __menuSidebar_center_ui(data, gv, cache) {
    cache = _i.innerRecoveredDataCache(data, cache, false, 'mgv', '菜单容器');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    //240616，为了向下兼容！
    //240725，区分两个索引
    function __color(attr,index, attrNew, newIndex, defaultColor) {
        return data.ca(attr) ? (isArrayFn(data.ca(attr)) ? i.indexedValue(data.ca(attr), index, defaultColor) : data.ca(attr)) : i.indexedValue(data.ca(attrNew), newIndex, '#f2f6f9');
    }

    if (!cache.obj) {
        //240725，索引0：背景色 —— 确保background为颜色数组。而且现在要合并背景色、头背景色、行背景色三类颜色一起！即所有的侧边菜单栏背景色。
        if(!data.ca('background') || data.ca('background').length == 0) data.ca('background',[]);
        //240725，索引1：头背景色 —— 如果background的索引1为空，但是headerBackground的索引0配置不为空，那直接兼容过来。
        if(data.ca('headerBackground')){
            if(data.ca('headerBackground')[0]) data.ca('background')[1] = data.ca('headerBackground')[0];
            //240725，索引2：头悬停色 —— 前者索引2为空，但后者索引1不为空，则兼容过来。
            if(data.ca('headerBackground')[1]) data.ca('background')[2] = data.ca('headerBackground')[1];
            //240725，索引3：头展开色 —— 前者索引3为空，但后者索引3不为空，则兼容过来。
            if(data.ca('headerBackground')[3]) data.ca('background')[3] = data.ca('headerBackground')[3];
            //240725，索引4：头选中色 —— 前者索引4为空，但后者索引2不为空，则兼容过来。
            if(data.ca('headerBackground')[2]) data.ca('background')[4] = data.ca('headerBackground')[2];
        }
        if(data.ca('rowBackgroundHSE')){
            //240725，索引5：行默认色 —— 前者索引5为空，但后者rowBackgroundHSE索引0不为空，则兼容过来。
            if(data.ca('rowBackgroundHSE')[0]) data.ca('background')[5] = data.ca('rowBackgroundHSE')[0];
            //240725，索引6：行悬停色 —— 前者索引6为空，但后者rowBackgroundHSE索引1不为空，则兼容过来。
            if(data.ca('rowBackgroundHSE')[1]) data.ca('background')[6] = data.ca('rowBackgroundHSE')[1];
            //240725，索引7：行悬停色 —— 前者索引7为空，但后者rowBackgroundHSE索引3不为空，则兼容过来。
            if(data.ca('rowBackgroundHSE')[3]) data.ca('background')[7] = data.ca('rowBackgroundHSE')[3];
            //240725，索引：行悬停色 —— 前者索引8为空，但后者rowBackgroundHSE索引2不为空，则兼容过来。
            if(data.ca('rowBackgroundHSE')[2]) data.ca('background')[8] = data.ca('rowBackgroundHSE')[2];
        }

        //240725，索引0：头下划线颜色 —— 确保colors为颜色数组。而且现在要新增头下划线色，合并头文字色、行文字色三类颜色一起！即所有的侧边菜单栏字体等色。
        if(!data.ca('colors') || data.ca('colors').length == 0) data.ca('colors',[]);
        if(data.ca('headerLabelColor')){
            //240725，索引1：头默认字体色 —— 如果colors的索引1为空，但是headerBackground的索引0配置不为空，那直接兼容过来。
            if(data.ca('headerLabelColor')[0]) data.ca('colors')[1] = data.ca('headerLabelColor')[0];
            //240725，索引2：头悬停文字色 —— 前者索引2为空，但后者索引1不为空，则兼容过来。
            if(data.ca('headerLabelColor')[1]) data.ca('colors')[2] = data.ca('headerLabelColor')[1];
            //240725，索引3：头展开文字色 —— 前者索引3为空，但后者索引3不为空，则兼容过来。
            if(data.ca('headerLabelColor')[3]) data.ca('colors')[3] = data.ca('headerLabelColor')[3];
            //240725，索引4：头选中文字色 —— 前者索引4为空，但后者索引2不为空，则兼容过来。
            if(data.ca('headerLabelColor')[2]) data.ca('colors')[4] = data.ca('headerLabelColor')[2];
        }
        if(data.ca('rowLabelColor')){
            //240725，索引5：行默认文字色 —— 前者索引5为空，但后者colors索引0不为空，则兼容过来。
            if(data.ca('rowLabelColor')[0]) data.ca('colors')[5] = data.ca('rowLabelColor')[0];
            //240725，索引6：行悬停色 —— 前者索引6为空，但后者索引1不为空，则兼容过来。
            if(data.ca('rowLabelColor')[1]) data.ca('colors')[6] = data.ca('rowLabelColor')[1];
            //240725，索引7：行悬停色 —— 前者索引7为空，但后者索引3不为空，则兼容过来。
            if(data.ca('rowLabelColor')[3]) data.ca('colors')[7] = data.ca('rowLabelColor')[3];
            //240725，索引：行悬停色 —— 前者索引8为空，但后者索引2不为空，则兼容过来。
            if(data.ca('rowLabelColor')[2]) data.ca('colors')[8] = data.ca('rowLabelColor')[2];
        }

        if(!data.ca('iconsColor')) data.ca('iconsColor',[]);
        //240726，索引0：展开收起分割线上的滑块图标颜色。
        //240726，索引1：滑块背景颜色。兼容toggleBackground的索引0
        if(data.ca('toggleBackground') && data.ca('toggleBackground')[0]) data.ca('iconsColor')[1] = data.ca('toggleBackground')[0];
        //240726，索引2：分割线颜色。兼容toggleBackground的索引1
        if(data.ca('toggleBackground') && data.ca('toggleBackground')[1]) data.ca('iconsColor')[2] = data.ca('toggleBackground')[1];
        //240726，索引3：分割线颜色。兼容toggleBackground的索引1
        if(data.ca('borderColor')) data.ca('iconsColor')[3] = data.ca('borderColor');
        //240726，索引4：分割线颜色。兼容iconColor
        if(data.ca('iconColor')) data.ca('iconsColor')[4] = data.ca('iconColor');
        //240726，索引5：分割线颜色。索引6：数字角标提示。索引5：数字角标警告。索引5：数字角标错误。
        //略

        cache.dark = {};
        cache.dark.background = i.copy(data.ca('background')),
        cache.dark.colors = i.copy(data.ca('colors')),
        cache.dark.iconsColor = i.copy(data.ca('iconsColor'));
        cache.dark.boxShadowColor = i.copy(data.ca('boxShadowColor'));
        cache.light = {};
        cache.light.background = [
            'white',    //background
            'null',  //headerBackground
            '#f2f6f9', //hoverHeaderBackground
            '#f2f6f9', //expandedHeaderBackground
            '#f2f6f9', //selectHeaderBackground
            'white', //rowBackground
            '#f2f6f9', //hoverRowBackground
            '#f2f6f9', //expandedRowBackground
            '#f2f6f9', //selectRowBackground
        ];
        cache.light.colors = [
            null, //headerSeparatorColor
           '#333333', //headerLabelColor
           '#444444', //hoverHeaderLabelColor
           '#555555', //expandedHeaderLabelColor
           'rgba(55,125,255)', //selectHeaderLabelColor
           '#666666', //rowLabelColor
           '#777777', //hoverRowLabelColor
           '#888888', //expandedRowLabelColor
           'rgba(55,125,255)', //selectRowLabelColor
       ];
        cache.light.iconsColor = [
            "rgb(189,189,189)",     //滑块图标色
            "rgb(255,255,255,0)",   //滑块背景色
            "rgb(233,233,233,0)",   //分割线颜色
            "rgb(255,255,255)",     //边框线颜色
            "#7c919b",              //图标默认颜色
            "rgb(55,125,255)",    //图标选中颜色
            "#36c6d3",              //提示数字角标
            "#feb64d",              //警告数字角标
            "#ed6b75"               //错误数字角标
        ];
        cache.light.boxShadowColor = 'rgba(0,0,0,0.1)'

        function init() {
            let dataModel = cache.dm = new ht.DataModel(),
                nodeGv = gv,
                sidebar = cache.sidebar = new ht.ui.Sidebar(dataModel),
                borderLayout = new ht.ui.BorderLayout();

            //240725，放到这里
            //菜单靠后
            var oldIsRightResizable = borderLayout.isRightResizable;
            borderLayout.isRightResizable = function() {
                if (sidebar.isCollapsedMode()) return false;
                return oldIsRightResizable.call(borderLayout);
            };
            let oldSetRightExpanded = borderLayout.setRightExpanded;
            borderLayout.setRightExpanded = function(w) {
                data.ca('collapsed', !sidebar.isCollapsedMode());
                data.iv();
            }

            //240725，位置移动到了这里，因为是重写函数实现，只需要一次就行！
            //菜单靠左
            var oldIsLeftResizable = borderLayout.isLeftResizable;
            borderLayout.isLeftResizable = function() {
                if (sidebar.isCollapsedMode()) return false;
                return oldIsLeftResizable.call(borderLayout);
            };
            borderLayout.setLeftExpanded = function() {
                data.ca('collapsed', !sidebar.isCollapsedMode());
                data.iv()
            }
            i.addChildDataModel(data, dataModel, "tr"); //侧边菜单的dm不用于内嵌页面，因此ui-数字中数字索引为1,索引为0的给内容区的dm

            //240302，默认form绑定的基础属性，之前发现没有做这个操作！
            i.setAttrsFormBinded(data, ['rightSide', 'hidedWidth', 'expandAll', 'display', 'datas']);

            sidebar.on('clickData', function(e) {
                if (sidebar.isCollapsedMode() && !e.data.hasChildren()) {
                    sidebar.hidePopup();
                }
                if (e.message) {
                    // 气泡点击事件
                }
                e.data && e.data.display && data.ca('display', e.data.display);
            });

            /*不显示，否则虽然横向width宽度，虽然全等于split按钮的宽度加上siderbar的宽度
            但是还是会看到满格的横向滚动条，不太友好！*/
            borderLayout.setScrollBarMode('off');

            //中间内容区域
            var dataModelCenter = new ht.DataModel();
            var graphViewCenter = new ht.graph.GraphView(dataModelCenter);
            iotos.addChildDataModel(data, graphViewCenter, "ui0"); //230401，传入从dm改成gv
            var graphViewCenter_ui = new ht.ui.HTView(graphViewCenter);

            //子网切换时，自适应全显示可见
            graphViewCenter.onCurrentSubGraphChanged = (e) => {
                graphViewCenter.fitContent(false, 1, 1); //第一个参数为false，无过渡动画；第一个参数为true且位置有变化时，会显示过渡动画
                // graphViewCenter.reset();     //加上之后每次都会有适应的过程动画，即使位置没有变化
            }
            function initSideDirection(rightSide) {
                borderLayout.clear();
                sidebar.setPopupDirection(rightSide ? 'left' : 'right');
                borderLayout.addView(sidebar, {
                    region: rightSide ? 'right' : 'left',
                    width: 'match_parent', //这里不能用data.ca()获取动态变量，因为这里布局参数给过去后，就是固定了，给过去的值也是当下传入的值，布局变化不会动态变化调整！除非代码有执行到这里再重新赋值进去！
                    height: 'match_parent',
                    // marginLeft: rightSide ? data.ca('widthPadding') : 0,  //之前尝试没有这里间距，会出现水平滚动条，发现留出空间！就是跟spliter按钮之间的间隙！实际为了解决宽度匹配，不需要这里间隔了，只要宽度加起来一致就好！
                    // marginRight: rightSide ? 0 : data.ca('widthPadding') ,
                    "marginTop": 0, //注意，最高都带上设置，否则有些组件缺省不是0，导致在屏幕某些分辨率下会显示出间隙！
                    "marginBottom": 0,
                    "marginLeft": 0,
                    "marginRight": 0
                });

                borderLayout.addView(graphViewCenter_ui, {
                    region: 'center',
                    width: 'match_parent', //这里不能用data.ca()获取动态变量，因为这里布局参数给过去后，就是固定了，给过去的值也是当下传入的值，布局变化不会动态变化调整！除非代码有执行到这里再重新赋值进去！
                    height: 'match_parent',
                    // marginLeft: rightSide ? data.ca('widthPadding') : 0,  //之前尝试没有这里间距，会出现水平滚动条，发现留出空间！就是跟spliter按钮之间的间隙！实际为了解决宽度匹配，不需要这里间隔了，只要宽度加起来一致就好！
                    // marginRight: rightSide ? 0 : data.ca('widthPadding') 
                    "marginTop": 0, //注意，最高都带上设置，否则有些组件缺省不是0，导致在屏幕某些分辨率下会显示出间隙！
                    "marginBottom": 0,
                    "marginLeft": 0,
                    "marginRight": 0
                });

                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/
                borderLayout.drawToggle = function(drawable, x, y, width, height, region) {
                    if (drawable) {
                        var self = borderLayout,
                            canvas = self.getSplitterCanvas(region),
                            g = self.getRootContext(canvas),
                            halfWidth = width / 2,
                            halfHeight = height / 2,
                            tx = x + halfWidth,
                            ty = y + halfHeight;
                        g.save();

                        //2407226，背景颜色，得用canvas画笔来，因为都是自绘制了，不能用setToggle()来设置背景颜色，那样会覆盖掉！！
                        g.fillStyle = data.ca('iconsColor')[1];
                        g.fillRect(x,y,width,height);

                        g.translate(tx, ty);

                        //240725，菜单面板在左侧还是右侧，当前是展开还是收起，统一这里来判断处理
                        let directionTmnp = rightSide ? -1 : 1;// 'right' : 'left'
                        g.rotate((sidebar.isCollapsedMode() ? directionTmnp : -directionTmnp) * Math.PI / 2);

                        drawable.draw(-halfHeight, -halfWidth, height, width, null, self, canvas);
                        g.restore();
                    }
                }
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            }

            //递归加载菜单树
           let initData =  cache.initData = function(dataArr, dm, node = null) {
                for (var i = 0; i < dataArr.length; i++) {
                    var nodetmp = new ht.Node();
                    dm.add(nodetmp);
                    if (node) {
                        nodetmp.setParent(node);
                    }
                    dataArr[i].name && nodetmp.setName(dataArr[i].name);

                    //240726，messages.text数值和badgeLevel设置的两个数字分成三段比较，如果messages.background颜色没配置，就按照范围自动选择颜色！
                    if(dataArr[i].messages){
                        dataArr[i].messages.forEach(item=>{
                            if(
                                // !item.background &&  //240726，以属性配置为准，会覆盖数据上的配置（如果有）
                                _i.isStringNumber(item.text)
                            ){
                                let numtmp = Number(item.text);
                                if(data.ca('badgeLevel') && numtmp < data.ca('badgeLevel')[0]) {
                                    item.background = data.ca('iconsColor')[6];
                                }else if(data.ca('badgeLevel') && numtmp < data.ca('badgeLevel')[1] && numtmp >= data.ca('badgeLevel')[0]) {
                                    item.background = data.ca('iconsColor')[7];
                                }else{
                                    item.background = data.ca('iconsColor')[8];
                                }
                            }
                        });
                    }

                    //240726，任何层级菜单的图标，颜色默认和选中下两种可配置！
                    let iconURL = dataArr[i].icon;
                    if(iconURL){
                        /*240726，首先加载成对象，注意，需要传入两个onImageLoaded()，并且该方法，加上了末尾参数，允许传入node，
                        这样回调函数可以在循环内用正确的图元对象，否则遍历循环，每次操作的都是便利的最后那个图元！！*/
                        _i.setImage(iconURL,iconURL);
                        _i.onImageLoaded(iconURL,(img,node)=>{
                            /*240726，这里全局替换字符串，将icon-background改成不一样的，这样可以利用node.ca()对这个变量赋值了。
                            多个颜色，用多个这样的变量赋值即可！！*/
                            let imgStr = _i.replaceAll(JSON.stringify(img),'icon-background','defaultIconBackground')
                            node.ca('defaultIconBackground', data.ca('iconsColor')[4]);
                            node.s('icon', JSON.parse(imgStr));
                            let imgObj = node.s('icon');
                            imgObj.comps.forEach(segment=>{
                                segment.background = data.ca('iconsColor')[4];
                            });
                        },false,nodetmp);
                        //240726，第二个图标操作！！
                        _i.onImageLoaded(iconURL,(img,node)=>{
                            let imgStr = _i.replaceAll(JSON.stringify(img),'icon-background','selectIconBackground')
                            node.ca('selectIconBackground',data.ca('iconsColor')[5]);
                            node.s('selectIcon', JSON.parse(imgStr));
                            let imgObj = node.s('selectIcon');
                            imgObj.comps.forEach(segment=>{
                                segment.background = data.ca('iconsColor')[5];
                            });
                        },false,nodetmp);
                    }

                    //其他自定义属性
                    nodetmp.display = dataArr[i].display;
                    //240728，此前配置的display，对应在哪个node，就将node存放到cache.firstNode中去！
                    //240728，注意，这里==判断会不会有问题？？对于相对路径配置的情况！a:display里有对相对路径绝对路径处理！！此处有待观察分析！
                    if(!cache.firstNode && nodetmp.display && nodetmp.display == data.ca('display')) { 
                        dataModel.sm().as(nodetmp);
                        cache.firstNode = nodetmp;
                    }

                    //230724，默认选择、选中第一个
                    if (dataModel.sm().size() == 0 && nodetmp.display) {
                        if (!data.ca('display')) {
                            cache.firstNode = nodetmp;
                            dataModel.sm().as(nodetmp);
                            _i.update(data, 'display', nodetmp.display);
                        }
                    }

                    dataArr[i].messages && nodetmp.s('messages', dataArr[i].messages);
                    dataArr[i].children && initData(dataArr[i].children, dm, nodetmp);
                };
            }

            //中间内容区域初始化
            function initCenter(url) {
                loadDisplay(graphViewCenter, url, cache, (json, dm, gv, datas) => {}, {
                    renderData: data,
                    renderGv: nodeGv,
                    multiDistinctIndex: 0
                })
            }

            function initTreeExpandState(expand) {
                if (expand) {
                    cache.sidebar.getAccordionTree().expandAll();
                } else {
                    cache.sidebar.getAccordionTree().collapseAll();
                }
            }

            cache.sidebar.fireViewEvent({
                kind: "clickData",
                data: cache.firstNode,
            })

            i.md(data, gv, cache, {        
                'a:dataKeys|a:dataValues': e => {      
                    /*临时方案，获取返回json对象的第一个元素的数组结构！因为暂时扁平化与结构化支持a.0/1/2，但是能识别0/1/2.a*/
                    let rettmp = convertToTreeJsonEx(i.arrExpandByFirst(data.ca('dataKeys')), i.arrExpandByFirst(data.ca('dataValues')));           
                    data.ca('datas', rettmp);        
                },
                'a:expandAll': e => {
                    initTreeExpandState(data.ca('expandAll'));  
                },
                'a:iconsColor|a:datas': e => {     
                    if(data._i_isIniting && e.property == 'a:iconsColor') return; //240728，初始化带来的iconsColor，
                    if (e.property == 'a:datas' && e.newValue && isObject(e.newValue)) {
                        let flatValue = convertToFlatJson(e.newValue, '.');
                        //属性回写赋值
                        i.backWriteOnly(data, 'a:dataKeys', i.keys(flatValue));
                        i.backWriteOnly(data, 'a:dataValues', i.values(flatValue));
                    }     
                    dataModel.clear();          

                    /*240728，原先是否有配置display。要知道如果没有配置，那么在下面initData里会自动根据遍历到的页面，自动给display赋值并触发加载！下面else if(e.property == 'a:datas' && hasDisplaySetted)
                    来触发display加载，是针对初始display有配置的情况！否则这里会重复了，因为之前没配置，initData里触发了加载，但是后面判断时如果继续用data.ca('display')判断，必然会通过，又一次加载！*/
                    let hasDisplaySetted = data.ca('display') && data.ca('display').trim() !== ''; 

                    initData(data.ca('datas'), dataModel);          
                    initTreeExpandState(data.ca('expandAll'));  
                    //230724，初始化后，根据display的配置，同步初始选中
                    //240626，加上条件&& e.property == 'a:datas'，否则这会导致异常清空display
                    if ((!e.newValue || e.newValue.length == 0) && e.property == 'a:datas') data.ca('display', '');
                    else if(e.property == 'a:datas' && hasDisplaySetted) data.fp('a:display', null, data.ca('display'));   //240726，加上条件if(e.property == 'a:datas')，避免初始重复触发内嵌页加载！
                },
                'a:loadStyle': e => {           // initStyle(data.ca('loadStyle'));
                },
                'a:rightSide': e => {          
                    let treeShaddowBorderTmp = data.ca('boxShadowBorder'); //树展开的阴影左右切换时也要有调整
                    treeShaddowBorderTmp[0] = -treeShaddowBorderTmp[0];
                    data.ca('boxShadowBorder', treeShaddowBorderTmp);
                },
                'a:widthPadding|a:hidedWidth|a:rightSide': e => {          
                    initSideDirection(data.ca('rightSide'));        
                },
                'a:display': e => {          
                    //230928，为了支持URL相对路径
                    let targetURL = i.autoDisplayURL(e, 'display', true);
                    if (targetURL === undefined) {
                        console.error('WARN: menu side container has no valid display url:', e.newValue); //240228
                        return;
                    }
                    initCenter(targetURL);     
                    //230724，设置url来选中菜单
                    dataModel.eachByBreadthFirst(item => {
                        if (item.display && ((item.display === targetURL) || i.toAbsDisplayURL(data, item.display) === targetURL || ('./' + item.display === targetURL) || (item.display === i.toAbsDisplayURL(data, targetURL))) && targetURL) {
                            dataModel.sm().cs(); //切换选中，只选中一条当前选中
                            dataModel.sm().as(item);
                        }
                    });
                    if (!targetURL) dataModel.sm().cs();
                },
                'a:lightMode': e=>{
                    //240728，加上标记，这样内部触发属性初始化时，在各自的md监听处理中可以知道当前是加载初始化进来的！
                    if(e.oldValue == '__init__') data._i_isIniting = true;
                    if(e.newValue === undefined) return; //240819，兼容旧项目发现会传入这个。

                    //240726，深浅风格主题一键切换
                    let modeType = ['dark','light'];
                    i.update(data,'background',cache[modeType[Number(e.newValue)]].background);
                    i.update(data,'colors',cache[modeType[Number(e.newValue)]].colors);
                    i.update(data,'iconsColor',cache[modeType[Number(e.newValue)]].iconsColor);
                    i.update(data,'boxShadowColor',cache[modeType[Number(e.newValue)]].boxShadowColor);
                    ht.Default.getImageMap()['sidebar_collapse'].comps.forEach(segment=>{
                        segment.borderColor = data.ca('iconsColor')[0];
                    });
                    ht.Default.getImageMap()['sidebar_expand'].comps.forEach(segment=>{
                        segment.borderColor = data.ca('iconsColor')[0];
                    });

                    data._i_isIniting = undefined;
                }
            }, [{
                'a:hidedWidth': '__init__',
                'a:lightMode': '__init__',
                'a:datas': '__init__' //240626，将expandAll改成datas，并且将上面的i.md中的两个属性监听之前在一起，现在分开监听！

            }], null, borderLayout, e => {});
            
            borderLayout.setStyle('main_split');
            let bordertmp = data.ca("boxShadowBorder"),
                shadowColorTmp = data.ca("boxShadowColor"),
                styletmp = '';

            //240606，为了兼容简化属性
            if (bordertmp == undefined) bordertmp = [0, 0, 8];
            if (shadowColorTmp == undefined) shadowColorTmp = 'rgba(102,102,102,0.2)';

            bordertmp.forEach((item, index) => {
                styletmp = styletmp + ' ' + item + 'px'
            })
            sidebar.getPopupTree().setBoxShadow(styletmp + ' ' + shadowColorTmp);

            return borderLayout
        }

        var obj = cache.obj = init()
        i.layoutHTML(obj, data, gv, cache);
    }

    /*编辑状态下，菜单的展开和关闭，整体尺寸动态变化*/
    let collapsed = data.ca('collapsed'),
        widthCollapsedTmp = data.ca('widthCollapsed'),
        widthSpreadedTmp = data.ca('widthSpreaded');
    //240728，选中时，上级是否同步上级节点状态。
    cache.sidebar.setUseChildSelectStateForParent(data.ca('useChildSelectState'));

    cache.sidebar.setCollapsedMode(collapsed);
    if (collapsed) {
        //内部宽度设置
        data.ca('rightSide') ? cache.obj.setRightWidth(widthCollapsedTmp) : cache.obj.setLeftWidth(widthCollapsedTmp);
    } else {
        data.ca('rightSide') ? cache.obj.setRightWidth(widthSpreadedTmp) : cache.obj.setLeftWidth(widthSpreadedTmp);     
    }

    // borderLayout.setToggle('symbols/develop/uiotos/arranged/icons/方向/angle-double-up-202.json');
    cache.obj.setToggleDrawable(i.getSymbolImage(data.ca('toggleIcon'),{'icon-background':data.ca('iconsColor')[0]}));

    /*ht-style中配置项为xxxx的，那么对应API方式方法就是setXxxx()*/
    //tips 240606，//根节点标题收起时背景色
    cache.sidebar.setBackground(__color('sideBackground',0, 'background', 0, 'white'));
    cache.sidebar.setHeaderBackground(data.ca('background')[1]);
    //根节点收起时，标题悬停背景色
    cache.sidebar.setHoverHeaderBackground(__color('hoverHeaderBackground',1, 'background', 2, '#f2f6f9')); //240725，兼容最早的hoverHeaderBackground属性字段
    //子节点选中后根节点标题背景色。
    cache.sidebar.setSelectHeaderBackground(__color('selectHeaderBackground',2, 'background', 4, '#f2f6f9'));   //240725，兼容最早的hoverHeaderBackground属性字段
    //根节点标题展开时背景色
    cache.sidebar.setExpandedHeaderBackground(__color('expandedHeaderBackground',3, 'background', 3, '#f2f6f9'));   //240725，兼容最早的hoverHeaderBackground属性字段

    //240726，去掉headerLineVisible属性配置，改用颜色是否为空来判断！
    cache.sidebar.setHeaderSeparatorVisible(Boolean(data.ca('colors')[0]));
    cache.sidebar.setHeaderSeparatorColor(data.ca('colors')[0]);//240820，一级菜单下划线颜色！！！

    //240726，滑块位置
    cache.obj.setTogglePosition(data.ca('togglePosition'));

    cache.sidebar.setHeaderLabelColor(__color('headerLabelColor',0, 'colors', 1, '#678098'));
    cache.sidebar.setHoverHeaderLabelColor(__color('hoverHeaderLabelColor',1, 'colors', 2, '#5b9bd1'));
    cache.sidebar.setSelectHeaderLabelColor(__color('selectHeaderLabelColor',2, 'colors', 4, '#5b9bd1'));
    cache.sidebar.setExpandedHeaderLabelColor(__color('expandedHeaderLabelColor',3, 'colors', 3, '#5b9bd1'));

    cache.sidebar.setRowLabelColor(__color('rowLabelColor',0, 'colors', 5, '#678098'));
    cache.sidebar.setHoverRowLabelColor(__color('hoverRowLabelColor',1, 'colors', 6, '#5b9bd1'));
    cache.sidebar.setSelectRowLabelColor(__color('selectRowLabelColor',2, 'colors', 8, '#5b9bd1'));
    cache.sidebar.setExpandedRowLabelColor(__color('expandedRowLabelColor',3, 'colors', 7, '#5b9bd1'));

    cache.sidebar.setRowBackground(__color('rowBackground', 0, 'background', 5, '#f2f6f9'));  //240725，兼容最早的rowBackground属性字段
    cache.sidebar.setHoverRowBackground(__color('hoverRowBackground', 0, 'background', 6, '#f2f6f9'));  //240725，兼容最早的hoverRowBackground属性字段
    cache.sidebar.setSelectRowBackground(__color('selectRowBackground',1, 'background', 8, '#f2f6f9'));   //240725，兼容最早的hoverRowBackground属性字段
    cache.sidebar.setExpandedRowBackground(__color('expandedRowBackground',2, 'background', 7, '#f2f6f9'));  //240725，兼容最早的hoverRowBackground属性字段


    //240728，展开收起图标和尺寸
    cache.sidebar.setHeaderCollapseIcon(data.ca('selectHeaderCollapseIcon'));
    cache.sidebar.setHeaderExpandIcon(data.ca('selectHeaderExpandIcon'));
    cache.sidebar.setRowCollapseIcon(data.ca('selectRowCollapseIcon'));
    cache.sidebar.setRowExpandIcon(data.ca('selectRowExpandIcon'));

    cache.sidebar.setHoverHeaderCollapseIcon(data.ca('selectHeaderCollapseIcon'));
    cache.sidebar.setHoverRowCollapseIcon(data.ca('selectRowCollapseIcon'));

    cache.sidebar.setSelectHeaderCollapseIcon(data.ca('selectHeaderCollapseIcon'));
    cache.sidebar.setSelectHeaderExpandIcon(data.ca('selectHeaderExpandIcon'));
    cache.sidebar.setSelectRowCollapseIcon(data.ca('selectRowCollapseIcon'));
    cache.sidebar.setSelectRowExpandIcon(data.ca('selectRowExpandIcon'));

    if(data.ca('expandIconSize')){
        cache.sidebar.setHeaderIconHeight(data.ca('expandIconSize')[1]);
        cache.sidebar.setHeaderIconWidth(data.ca('expandIconSize')[0]);
        cache.sidebar.setRowIconHeight(data.ca('expandIconSize')[1]);
        cache.sidebar.setRowIconWidth(data.ca('expandIconSize')[0]);
    }

    cache.sidebar.setBorder(new ht.ui.border.FocusLineBorder(data.ca('borderWidth'), data.ca('iconsColor')[3], data.ca('iconsColor')[3]));
    cache.sidebar.setBorderRadius(data.ca('borderRadius'));
    cache.sidebar.setRowLabelFont(data.ca('font'));
    cache.sidebar.setHeaderLabelFont(data.ca('fontHeader') ? data.ca('fontHeader') : data.ca('font'));

    // 注意，需要调用这句来刷新，否则得窗口改变等才能刷新无法所见即所得：
    ht.Default.invalidateUIStyles();

    cache.obj.setBorderRadius(data.ca('borderRadius'));

    //240726，分隔线颜色，兼容此前的两个配置属性字段！
    let splitColor = data.ca('splitterBackground');
    if(!splitColor && data.ca('toggleBackground') && data.ca('toggleBackground')[1]) splitColor = data.ca('toggleBackground')[1];
    if(!splitColor) splitColor = data.ca('iconsColor')[2];
    cache.obj.setSplitter(splitColor);

    cache.obj.setSplitterHitSize(data.ca('widthPadding') * 2)
    cache.obj.setSplitterSize(data.ca('widthPadding'));

    //shadowBorder：[0,0,8]；shadowColor：rgba(102,102,102,0.5)
    initShadow(cache.obj, data.ca('shadowBorder'), data.ca('shadowColor'), data.ca('shadowEnabled'));

    return cache.obj;
}

function __multiSelect_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache);
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    function update(controlInstance = null) {
        let layoutVertical = data.ca('layoutVertical');
        if (layoutVertical == undefined) layoutVertical = false;
        if (cache.control == undefined) {
            cache.layoutV = new ht.ui.VBoxLayout();
            cache.layoutH = new ht.ui.HBoxLayout();
            cache.layoutH.setScrollBarMode('off')
            cache.layoutV.setScrollBarMode('off')
            let label = cache.label = new ht.ui.Label();
            control = cache.control = controlInstance;
        }

        //通用属性
        cache.label.setTextColor(data.ca('labelColor'));
        cache.label.setText(data.ca('labelText'));
        cache.label.setTextFont(data.ca('font'));

        if (cache.control) {
            cache.control.setBorder(new ht.ui.border.FocusLineBorder(data.ca('borderWidth'), data.ca('borderColor'), data.ca('activeBorderColor')));
            cache.control.setBackground(data.ca('background'));
            cache.control.setBorderRadius(data.ca('borderRadius'));
            cache.control.setHoverIcon(data.ca('hoverIcon'));
        }

        //TODO 特定属性
        //----------------------------------------------------
        cache.control.setDatas(data.ca('dataListSource'));
        // data.ca('isCities') && cache.control.setDatas(cities);
        // data.ca('value') && obj.setValue({
        //     label: data.ca('value')
        // })
        cache.control.setDropDownConfig({
                width: data.ca('dropdownWidth'),
                height: data.ca('dropdownHeight')
            })
            //----------------------------------------------------

        let layout = layoutVertical ? cache.layoutV : cache.layoutH;
        if (cache.layoutV && cache.layoutH && cache.control && cache.label) {
            if (layout != cache.layoutModeCache) {
                // let height = layoutVertical ? cache.control.getHeight() + cache.label.getHeight() + data.ca('gap') : cache.control.getHeight()
                // height && p(data,'height',height)
                i.layoutHTML(layout, data, gv, cache);
            }
            layout.addView(cache.label, {
                height: "wrap_content",
                width: 'wrap_content',
                VAlign: layoutVertical ? "top" : 'middle'
            });
            layout.addView(cache.control, {
                height: 'wrap_content',
                width: 'match_parent',
                marginTop: layoutVertical ? data.ca('gap') : 0,
                marginLeft: !layoutVertical ? data.ca('gap') : 0
            });
            layout.setAlign('left');
            // layout.setVAlign('top');
        }

        cache.layoutModeCache = layout;
        return layout;
    }

    return update(!cache.control && new ht.ui.MultiSelect())
}

function __panel(data, gv, cache) {
    cache = _i.innerRecoveredDataCache(data, cache);
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.obj) {

        function createTable(dataModel) {
            var tablePane = new ht.widget.TablePane(dataModel),
                columnModel = tablePane.getColumnModel(),
                table = tablePane.getTableView(),
                column = new ht.Column();
            tablePane.getTableHeader().getView().className = "tableHeader";

            table.drawRowBackground = function(g, data, selected, x, y, width, height) {
                var self = this,
                    checkMode = self.isCheckMode(),
                    index = table.getRowIndex(data),
                    color = "white";
                if (index % 2 === 0) { //even background
                    color = "rgb(244, 251, 251)";
                }
                if (data === this._hoverData) { //hover background
                    color = "rgb(252, 248, 227)";
                }
                if ((data === self._focusData && checkMode) || selected && !checkMode) { //select background
                    color = this.getSelectBackground(data);
                }
                g.fillStyle = color;
                g.beginPath();
                g.rect(x, y, width, height);
                g.fill();
            };

            column.setName("id");
            columnModel.add(column);

            column = new ht.Column();
            column.setName("name");
            columnModel.add(column);
            return tablePane;
        }

        function init() {
            table = createTable(data.dm()),
                panelGroup = new ht.widget.PanelGroup({
                    hGap: 10,
                    vGap: 10
                })

            var tablePanel = new ht.widget.Panel({
                title: "Table",
                titleIcon: "res/table.png",
                restoreToolTip: "This is a table",
                width: 300,
                narrowWhenCollapse: true,
                contentHeight: 200,
                content: table
            });
            return tablePanel;
        }
        var obj = cache.obj = init()
        i.layoutHTML(obj, data, gv, cache);
    }

    return cache.obj;
}

function __radioBox_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'radio', '单选框');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined
    let layoutType = data.ca('layoutType')
    if (layoutType == undefined) layoutVertical = 0;

    if (cache.layoutV == undefined) {
        //默认表单属性
        i.setAttrsFormBinded(data, ['indexValue', 'textValue', 'datas', 'onChange', 'disabled']);
        cache.layoutV = new ht.ui.VBoxLayout();
        cache.layoutH = new ht.ui.HBoxLayout();
        cache.layoutH.setScrollBarMode('off');
        cache.layoutV.setScrollBarMode('off');
        let radios = cache.radios = new ht.ui.Radios(),
            label = cache.label = new ht.ui.Label();

        radios.setEmptiable(false);
        radios.on('p:selectedButton', function(e) {
            let index = radios.getButtons().indexOf(radios.getSelectedButton()),
                text = radios.getSelectedButton().getText();
            _i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                'a:textValue': text,
                'a:indexValue': index
            }, true, true);
        });

        //监听输入属性变化
        _i.md(data, gv, cache, {
            'a:indexValue': e => {
                let buttons = radios.getButtons();
                if (e.newValue === undefined || e.newValue >= buttons.length) return;
                let button = radios.getButtons()[e.newValue];
                button.setSelected(true);
                //这里调用i.update代替data.ca()对下面textValue属性赋值，回写方式1依赖于这里的调用！
                i.update(data, 'textValue', button.getText());

                //单独配合禁用的设置，初始化
                data.fp('a:disabled', null, data.ca('disabled'));
            },
            'a:textValue': e => {
                radios.getButtons().forEach((button, index) => {
                    if (button.getText() == e.newValue) {
                        button.setSelected(true);
                        i.backWriteAttrs(data, { 'a:indexValue': index });
                        return;
                    }
                })
            },
            'a:disabled': e => {
                radios.getButtons().forEach(button => {
                    button.setDisabled(e.newValue);
                });
            }
        }, ['a:indexValue'], null, radios, e => {
            //label与组件水平、垂直对齐布局
            i._labelLayout(data, gv, cache, e);
        });

        // }, 0);
    }

    cache.label.setIcon(data.ca('labelIcon'));
    let layout = layoutType == 0 ? cache.layoutH : cache.layoutV; //全水平布局：0、全垂直布局：1、水平Ratio加垂直Label：2
    if (cache.layoutV && cache.layoutH && cache.radios && cache.label) {
        cache.label.setText(data.ca('labelText'))
        cache.label.setTextColor(data.ca('labelColor'))
        cache.label.setTextFont(data.ca('labelFont'))
        if (
            cache.datas != data.ca('datas') ||
            cache.gapLabel != data.ca('gapLabel') ||
            cache.gapItem != data.ca('gapItem') ||
            cache.radioFont != data.ca('radioFont') ||
            cache.radioColor != data.ca('radioColor') ||
            cache.layoutType != layoutType
        ) {
            if (layout != cache.layoutModeCache || cache.layoutType != layoutType) {
                let radioHeight = 35;
                let height = undefined;
                switch (layoutType) {
                    case 0:
                        height = radioHeight;
                        break;
                    case 1:
                        height = radioHeight * data.ca('datas').length + data.ca('gapItem') * (data.ca('datas').length - 1);
                        break;
                    case 2:
                        height = radioHeight * 1.5 + data.ca('gapLabel');
                        break;
                }
                height != undefined && p(data, 'height', height);
                i.layoutHTML(layout, data, gv, cache);
            }

            cache.datas = data.ca('datas');
            cache.gapLabel = data.ca('gapLabel')
            cache.gapItem = data.ca('gapItem')
            cache.radioFont = data.ca('radioFont')
            cache.radioColor = data.ca('radioColor')
            cache.layoutType = layoutType

            layout.clear()
            cache.radios.clear()
            layout.addView(cache.label, {
                height: 'wrap_content',
                width: 'wrap_content',
                marginRight: layoutType == 0 ? cache.gapLabel : 0,
                marginBottom: layoutType == 0 ? 0 : cache.gapLabel
            });

            let layoutH2 = layoutType == 2 ? new ht.ui.HBoxLayout() : null;
            layoutH2 && layoutH2.setScrollBarMode('off')
            cache.datas.forEach(function(ele) {
                let radioButton = cache.control = new ht.ui.RadioButton();
                radioButton.setRadios(cache.radios);
                radioButton.setText(ele);
                radioButton.setTextColor(cache.radioColor);
                radioButton.setTextFont(cache.radioFont);
                radioButton.setValue(ele);
                radioButton.setFormDataName('radio');
                // radioButton.setHeight(data.ca('height'))
                switch (layoutType) {
                    case 0:
                        layout.addView(radioButton, {
                            marginRight: Number(cache.gapItem)
                        });
                        break;
                    case 1:
                        layout.addView(radioButton, {
                            marginBottom: Number(cache.gapItem)
                        });
                        break;
                    case 2:
                        layoutH2.addView(radioButton, {
                            marginRight: Number(cache.gapItem)
                        });
                        layout.addView(layoutH2)
                        break;
                }
            });
            // data.fp('a:indexValue', null, data.ca('indexValue')); //初始化
            layout.setAlign('left');
            layout.setVAlign(layoutType == 0 ? 'middle' : 'top');
        }
        cache.layoutModeCache = layout;
    }

    return layout;
}

function __switch_lite(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'sw', '开关');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.init) {
        cache.init = 'done'
        i.setAttrsFormBinded(data, ['open', 'onChange', 'textClose', 'textOpen']);

        //240606，避免简化属性造成报错！
        if (!data.ca('gapsAdjust')) {
            data.ca('gapsAdjust', [0, 0]);
        }

        i.md(data, gv, cache, {
            'a:textClose|\
             a:textOpen|\
             a:textVisible|\
             a:closedColor|\
             a:gapsAdjust|\
             a:background|\
             a:open': e => {
                data.ca('visible', data.ca('textVisible'));
                //这里的逻辑迁移到外层，便于图纸加载后的初始化赋值触发！否则难以执行到这里来！
                //需要同步这里加上一些属性配置，否则在外部的操作，取决于open状态，而无法动态编辑所见即所得其他属性
                if (data.ca('open')) {
                    data.ca('back.background', data.ca('background'));
                    data.ca('dot.background', 'white');
                    data.ca('text', data.ca('textOpen'));
                    data.ca('textColor', 'white');
                    data.ca('textRect', [15 - data.ca('gapsAdjust')[0], 8.5, 30, 18]);
                    data.ca('back.borderColor', data.ca('background'));
                } else {
                    data.ca('back.background', data.ca('closedColor') ? data.ca('closedColor') : 'white');
                    data.ca('dot.background', data.ca('closedColor') ? 'white' : data.ca('background'));
                    data.ca('text', data.ca('textClose'));
                    data.ca('textColor', data.ca('closedColor') ? 'white' : data.ca('background'));
                    data.ca('textRect', [35 + data.ca('gapsAdjust')[0], 8.5, 30, 18]);
                    data.ca('back.borderColor', data.ca('closedColor') ? data.ca('closedColor') : data.ca('background'));
                }
            }
        });
    }

    // case 'a:open':
    if (cache.openStatus != data.ca('open')) {
        cache.openStatus = data.ca('open')
        cache.isProcessing = true;
        let dotRightRectArr = [47.5 + data.ca('gapsAdjust')[1], 5, 25, 25],
            dotLeftRectArr = [7.5 - data.ca('gapsAdjust')[1], 5, 25, 25];
        if (data.ca('open')) {
            rectAnim(data, 'dot.rect', dotRightRectArr, dotLeftRectArr, () => {});
            i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                'a:open': true
            });
            //240522，需要单独的打开和关闭事件！因为初始发现onChange都会触发！
            i.formEventBubblingUpper(data, gv, cache, 'onOpen');
            data.ca('back.background', data.ca('background'));
            data.ca('dot.background', 'white');
            data.ca('text', data.ca('textOpen'));
            data.ca('textColor', 'white');
            data.ca('textRect', [15 - data.ca('gapsAdjust')[0], 8.5, 30, 18]);
            data.ca('back.borderColor', data.ca('background'));
        } else {
            rectAnim(data, 'dot.rect', dotLeftRectArr, dotRightRectArr, () => {});
            i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                'a:open': false
            });
            //240522，需要单独的打开和关闭事件！因为初始发现onChange都会触发！
            i.formEventBubblingUpper(data, gv, cache, 'onClose');
            data.ca('back.background', data.ca('closedColor') ? data.ca('closedColor') : 'white');
            data.ca('dot.background', data.ca('closedColor') ? 'white' : data.ca('background'));
            data.ca('text', data.ca('textClose'));
            data.ca('textColor', data.ca('closedColor') ? 'white' : data.ca('background'));
            data.ca('textRect', [35 + data.ca('gapsAdjust')[0], 8.5, 30, 18]);
            data.ca('back.borderColor', data.ca('closedColor') ? data.ca('closedColor') : data.ca('background'));
        }
    }
}

function __tabView(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'tab', 'TAB页签', () => {
        data.s('pixelPerfect', false);
    });
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.obj) {
        function init() {
            let tabView = new ht.widget.TabView(),
                nodeData = data,
                nodeGv = gv;

            //240124，将data.ca()改成i.getValueUpperFormed(data,)，获取上层form绑定了的index。因为现在attrsInit属性初始化都放到了加载完成后的异步中，在data.fp向下form执行后。
            let tabIndexsLoaded = [i.getValueUpperFormed(data, 'index')]; //231024，哪些tab页的索引是已经切换到位过的！因为只有切换到当前时才会反弹，一直没切换到的，内嵌页是不反弹的！

            i.setAttrsFormBinded(data, ['index', 'displays', 'display', 'relativePath', 'innerLayoutMode']); //230812，默认对外暴露的属性

            //231126，更新尺寸
            function __updateRect() {
                let curIndex = data.ca('index');
                if (data.ca('useOriginSize') && data._i_pageSizes && data._i_pageSizes[curIndex]) {
                    data.setWidth(data._i_pageSizes[curIndex][0]);
                    data.setHeight(data._i_pageSizes[curIndex][1]);
                }
            }
            i.md(data, gv, cache, {
                'a:relativePath|a:displays': e => {
                    //240217，为了支持displays能够在第一项合并展开！
                    if (i.isEditing(data) && e.property == 'a:displays') {
                        i.enableAttrEditByFirstItem(data, e);
                    }
                    if (e.property == 'a:displays' && i.isEqual(e.newValue, e.oldValue)) return;

                    let displaystmp = data.ca('displays'),
                        relativePath = data.ca('relativePath'),
                        targetURL = null;

                    //240217，专门加上一个识别处理，避免i.enableAttrEditByFirstItem转换期间的重入到下面处理报错！
                    if (displaystmp && isArrayFn(displaystmp) && displaystmp.length == 1 && isArrayFn(displaystmp[0])) return;

                    //231108，特别标记'/'此时就是绝对路径，displays中是什么就是什么，避免都被转成当前页面的相对路径，搞得很难引用其他地方公共页面！
                    if (relativePath != '/') {
                        //230124 清空relativePath，保持空值；设置空字符串回车则回写当前图纸所在路径作为相对路径！
                        if ((!relativePath || relativePath.trim() == '') && editor) {
                            relativePath = urlPath(editor.mainTabView.getCurrentTab().getTag());
                        }
                        i.backWriteOnly(data, 'relativePath', relativePath + (relativePath.slice(-1) != '/' ? '/' : ''));

                        //230928，tabView来处理相对路径的问题！
                        //230928，为了支持URL相对路径
                        targetURL = i.autoDisplayURL(e, 'relativePath',true);
                        if (targetURL === undefined) return;
                    } else {
                        targetURL = ''; //231108，相对路径为'/'时，就是不用公共的相对路径了！
                    }

                    if (targetURL != null) {
                        if (targetURL.slice(-1) != '/') targetURL += '/';
                    }

                    if (displaystmp != undefined) {
                        /*注意，不能放到extra.multiRequestingLeft中去传, 因为要作为全局的循环中共用的变量，否则循环内函数传入
                        属于各自的局部变量！另外，是否是循环的最后一条true、false没意义，因为里面是异步执行，给出当前过来的最大数即可*/
                        data._multiRequestingLeft = 0;
                        tabView.getTabModel().clear(); //230812，清空tab先
                        data._i_pageSizes = [];
                        data._i_pageAbsUrls = []; //240131，displays属性对应的url全局路径。通常用于内嵌页面中根据自己地址，判断自己所属上层
                        data.ca('pageAbsUrls', []); //240603，专门存放一个编辑不可见的页面组件属性，方便导出部署时，能够识别到是路径，并且递归下去，包含到导出的压缩包内！

                        //240917，复位清理_i_innerGV，否则比如对话框reloadWhenOpen，每次打开，会重复追加！！
                        if(!data._gv) data._gv = gv;  
                        data._gv._i_innerGV = []; 

                        displaystmp.forEach((url, index) => {
                            //240507，之前是对于空的索引url，直接忽略掉，现在是用默认404页填充，否则会造成tab页签整体索引错位！！
                            if (!(url && url.trim() != '' && url != undefined)) url = 'displays/develop/uiotos/editor/syspages/404_lite.json';
                            data._multiRequestingLeft += 1;
                            if (url.indexOf('.json') == -1) {
                                url = url + '.json';
                            }
                            url = (url.slice(0, 9) == 'displays/' ? '' : targetURL) + url

                            /*240603，隐藏属性，仅仅用来给导出时server.js后台递归遍历到有.json的文件，这样能导出到压缩包里！实测发现，并不需要一个属性对应一个.json配置，只需要
                            值里面有.json貌似都能识别文件，并参与递归遍历！比如此前的侧边菜单栏容器组件side的datas属性！！*/
                            data.ca('pageAbsUrls').push(url);

                            let graphView = new ht.graph.GraphView();
                            tabView.add('tab' + index, graphView);
                            tabView.setTabHeight(0);
                            i.addChildDataModel(data, graphView, 'ui' + index); //230401，传入从dm改成gv

                            //240917，复位清理_i_innerGV，否则比如对话框reloadWhenOpen，每次打开，会重复追加！！
 			                      if(data._gv && data._gv._i_innerGV) data._gv._i_innerGV = []
                            loadDisplay(graphView, url, cache, function(json, dm, gv, datas) {
                                //231126，存放各个tab页签内嵌页底板的原始尺寸，用来支持切换页签，组件尺寸各自按照内嵌页变化！
                                let basetmp = i.baseNode(dm);
                                data._i_pageSizes.push(basetmp ? [basetmp._i_originWidth, basetmp._i_originHeight] : null);

                                //231128，为了触发useOriginSize属性勾选时，初始加载tab页签按照默认内嵌页更新
                                __updateRect();
                            }, {
                                renderData: nodeData,
                                renderGv: nodeGv,
                                multiDistinctIndex: index, //index最大值大于等于multiRequestingLeft，因为有过滤掉的！
                            });
                            // }
                        });
                    }
                },
                'a:index': e => {
                    //240810，竟然发现有e.newValue为{}的情况！！！
                    console.assert(typeof(e.newValue) === 'number');
                    e.newValue = Number(e.newValue);

                    //240323，避免下面i.updata('a:display',xxx)赋值时，因为display的md监听也有i.update('index',xxx)，导致这里重入！因此下面的i.update加上了操作前后标记！
                    if (data._i_avoidDisplayUpdateReEnterToIndex) return;
                    if (tabIndexsLoaded.indexOf(e.newValue) == -1) {
                        tabIndexsLoaded.push(e.newValue);

                        //240522，切换tab页签时，比如新版UIOTOS登录欢迎页，如果有页签时缩放fitContent模式，需要缩放自适应下，否则初始内容不在tab页签组件窗口区域！
                        let innerDm = i.innerDataModel(data, e.newValue);
                        if (innerDm && innerDm.a('fitContent')) {
                            /*240521，如果tab这种有内嵌缩放布局的，如果不处理，发现加载初始显示没法自适应tabView组件的尺寸区域！而且这里实测即便是延时0也不行，加上1反而可以！
                            但是也不稳定！暂时延时10ms，具体什么原因，有待后续进一步完善！目前是用到新版的UIOTOS的首页登录页欢迎介绍中*/
                            _i.setTimeout(() => {
                                i.innerGV(data, e.newValue).fitContent();
                            }, 10);
                        }

                        //240208，参考updateUppersWhileDynamicLoading中更新的。
                        let stopUpperSyncing = false;

                        //231024，逐层往上增加一个计数！否则初始化切换其他页签时，会导致多次反弹！
                        function __addMultiRequestingLeftUpper(node) {

                            //240208，参考updateUppersWhileDynamicLoading中更新的。
                            let stopUpperSyncing = false;

                            if (!node) return;
                            node._multiRequestingLeft += 1;

                            //240208，参考updateUppersWhileDynamicLoading中更新的。
                            node._i_isDynamicLoadingLayersUp = true;

                            //240105，参考i.updateUppersWhileDynamicLoading()
                            node.ca('isLoadingGet', true);
                            if (node.ca('isLoadingGet') === false && node._i_isCompleteLoaded <= 0 /*node._i_isCompleteLoaded === false || node._i_isCompleteLoaded === -1*/ ) {
                                console.error('WARN: update uppers while dynamic loading now，and will change _i_isCompleteLoaded state later', _i.commonTip(data));
                                node._i_isCompleteLoaded -= 1;

                            } else node._i_isCompleteLoaded = false;

                            //240208，参考updateUppersWhileDynamicLoading中更新的。
                            if (node._multiRequestingLeft >= 2) stopUpperSyncing = true;

                            __addMultiRequestingLeftUpper(i.upperData(node));
                        }
                        if (i.hasInnerDisplay(i.innerDataModel(data, e.newValue), false, false, false, true)) {
                            __addMultiRequestingLeftUpper(data);
                        }
                    }

                    tabView.select(e.newValue);
                    let tabtmp = tabView.get(e.newValue);
                    if (tabtmp == undefined) return;
                    //对属性display回写赋值
                    let indexedURL = data.ca('displays')[e.newValue];
                    if (!indexedURL || indexedURL.trim() == '') indexedURL = 'displays/develop/uiotos/editor/syspages/404_lite.json';

                    //231126，专门提取出来判断，因为tab页签的displays中可能存放的是绝对路径
                    let tabIndexedURL = indexedURL.slice(-5) == '.json' ? indexedURL : (indexedURL + '.json');
                    if (indexedURL !== undefined) {
                        //240323，避免下面i.updata('a:display',xxx)赋值时，因为display的md监听也有i.update('index',xxx)，导致这里重入！因此下面的i.update加上了操作前后标记！
                        data._i_avoidDisplayUpdateReEnterToIndex = true;

                        i.update(data, 'a:display',
                            //231126，如果tab页签的displays中放的是displays/绝对路径，那么相对路径地址就不参与运算！
                            i.toAbsDisplayURL(data, tabIndexedURL.slice(0, 9) == 'displays/' ? tabIndexedURL : (data.ca('relativePath') + tabIndexedURL))
                        );
                        data._i_avoidDisplayUpdateReEnterToIndex = undefined;
                    }

                    //231126，增加事件
                    //240923，加上|| e.oldValue != '__init__'，否则发现正常切换索引，都不触发事件了！
                    (data.ca('initialTrigger') || e.oldValue != '__init__') && i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                        'index': e.newValue
                    }); //最后一个参数true（默认即可）

                    //231128，为了触发useOriginSize属性勾选时，初始加载tab页签按照默认内嵌页更新
                    __updateRect();
                },
                'a:display': e => {
                    if (data.ca('displays') == undefined) data.ca('displays', []);
                    if (e.newValue) {
                        let urltmp = e.newValue,
                            relativePathTmp = i.toAbsDisplayURL(data, data.ca('relativePath')); //230930，加上i.toAbsDisplayURL()
                        //转换成对应的index进行设置
                        //230815，判断相对路径如果末尾后/，就不变，否则加上/，再来做全局替换
                        let urlseg = urltmp.replace(relativePathTmp.slice(-1) == '/' ? relativePathTmp : (relativePathTmp + '/'), '').replace('.json', '');
                        let idxtmp = data.ca('displays').indexOf(urlseg);
                        if (idxtmp == -1) {
                            data.ca('displays').push(urlseg);
                            idxtmp = data.ca('displays').length - 1;
                        } else if (i.arrMatchCount(data.ca('displays'), urlseg) > 1) {
                            //240508，存在tabView的display中放入的页签是相同的模板容器页面，通过继承过来的display再实际配置内嵌页！此时通过页面文件去找到当前锁在display的索引，是徒劳的！从而导致下面i.update()
                            return;
                        }
                        i.update(data, 'a:index', idxtmp);
                    }
                }
            }, ['a:relativePath', 'a:index'], null, tabView, null);
            return tabView;
        }
        let obj = cache.obj = init();
        i.layoutHTML(obj, data, gv, cache);
    }

    //通用阴影样式
    initShadow(cache.obj, data.ca('shadowBorder'), data.ca('shadowColor'), data.ca('shadowEnabled'));

    return cache.obj;
}

function __textArea_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'txt', '文本框');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    let layoutVertical = data.ca('layoutVertical');
    if (layoutVertical == undefined) layoutVertical = false;

    if (cache.layoutV == undefined) {
        i.setAttrsFormBinded(data, ['value', 'instantTrigger', 'htmlContent', 'readOnly', 'onChange']);

        //240721，文字颜色改成数组，索引0是原先用途，索引1用来作为标签/标题颜色
        if (!data.ca('color') || !isArrayFn(data.ca('color'))) {
            data.ca('color', [
                data.ca('color'), 
                'rgb(61,61,61)'
            ])
        }
        if(!isArrayFn(data.ca('borderColor'))){
            i.update(data,'borderColor',[data.ca('borderColor')]);
        }
        if(!isArrayFn(data.ca('background'))){
            i.update(data,'background',[data.ca('background')]);
        }

        cache.layoutV = new ht.ui.VBoxLayout();
        cache.layoutH = new ht.ui.HBoxLayout();
        cache.layoutH.setScrollBarMode('off')
        cache.layoutV.setScrollBarMode('off')
        let label = cache.label = new ht.ui.Label(),
            textArea = new ht.ui.TextArea(),
            htmlView = new ht.ui.HtmlView(); //230323，通过htmlView组件来支持，而不是通过dom innerHTML
        cache.control = data.ca('htmlContent') ? htmlView : textArea;
        textArea.on('p:value', v => {
            //240211，加上条件&& !data._i_ignoreNotifyUpper，就是为了让文本对话框组件的上层赋值保持对象类型的值，且显示还是字符串，值得使用和显示区分开，连线对外时也不用对值再转换回对象！！
            (!data._i_initial || data.ca('initialTrigger')) && !data._i_ignoreNotifyUpper && i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                /*当前渲染元素组件的属性a:value，对应实际控件ht.ui.TextArea的p:value属性，需要显式写入！
                （因为可能命名为a:content等，不一定非得用a:value去对应p:value）*/
                'value': v.newValue
            }); //最后一个参数true（默认即可）

            //230926，复位
            if (data._i_initial) data._i_initial = false;
            //240211，复位标记
            if (data._i_ignoreNotifyUpper) data._i_ignoreNotifyUpper = undefined;

            //注意，发现被操纵的底层图纸的a:value属性或上层xxx>a:value，在事件绑定过滤函数中打印，并没有输出？？
        });
        htmlView.on('p:content', v => {
            //230926，增加公共属性initialTrigger决定初始时是否可以触发对外连线操作，通过data._i_initial来判断是否是初始赋值。
            (!data._i_initial || data.ca('initialTrigger')) && i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                'value': v.newValue
            });

            //230926，复位
            if (data._i_initial) data._i_initial = false;
        });

        function __borderInfo(){
            let activeBorderColor = null;
            if (i.hasAttrObjectKey(data, 'activeBorderColor')) {
                activeBorderColor = data.ca('activeBorderColor');
            } else {
                activeBorderColor = data.ca('borderColor')[1];
            }
            let borderColorTmp = isArrayFn(data.ca('borderColor')) ? data.ca('borderColor')[0] : data.ca('borderColor'),
                bdWidth = data.ca('borderWidth');
            return [bdWidth,borderColorTmp,activeBorderColor];
        }
        //监听输入属性变化
        i.md(data, gv, cache, {
            'a:value|a:htmlContent': e => {
                //240731，说明此时正在切换成数字再次传入，前面的字符串传入就忽略，不处理！
                if(e.property == 'a:value' && data._i_stringAutoNumberChanging) return;

                if (e.property == 'a:htmlContent') {
                    if (e.newValue) {
                        textArea.setVisible(false);
                        htmlView.setVisible(true);
                        cache.control = htmlView;
                        cache.control.setPadding(data.ca('padding'));
                        data.fp('a:padding',undefined,data.ca('padding'));
                    } else {
                        textArea.setVisible(true);
                        htmlView.setVisible(false);
                        cache.control = textArea;
                        data.fp('a:padding',undefined,data.ca('padding'));
                    }
                } else {
                    let upperDlg = i.upperData(data);
                    if (upperDlg && _i.isControlTyped(upperDlg, 'dlg') && upperDlg.ca('titleText') && upperDlg.ca('titleText').indexOf('已将JSON对象自动转换成文本') != -1) {
                        console.error('WARN: common debug info dialog will keep object typed value upper and string typed bottom!', upperDlg);
                        data._i_ignoreNotifyUpper = true;
                    }
                }
                let contenttmp = data.ca('value');

                //230926，初始化时，组件不对外触发连线操作，避免出现比如文本框连线对弹窗，结果初始加载就弹窗的情况！
                if (e.oldValue == '__init__') data._i_initial = true;
                data.ca('htmlContent') ? htmlView.setContent(contenttmp) : textArea.setValue(contenttmp);
            },
            'a:background': e => {
                cache.control.setBackground(i.valArrCompatiable(e.newValue, Number(data.ca('readOnly'))));
            },
            'a:readOnly': e => {
                textArea.setReadOnly && textArea.setReadOnly(e.newValue);
                textArea.setCursor(e.newValue ? 'not-allowed' : 'auto');

                //240630，禁用背景色。
                let readOnlyBkgColor = null;
                if (i.hasAttrObjectKey(data, 'readOnlyBackground')) {
                    readOnlyBkgColor = data.ca('readOnlyBackground');
                } else {
                    readOnlyBkgColor = data.ca('background') && data.ca('background')[1];
                }
                textArea.setBackground(e.newValue ? readOnlyBkgColor : isArrayFn(data.ca('background')) ? data.ca('background')[0] : data.ca('background'));
            },
            's:label.color': e=>{
                //240729，因为下面有data.s('label.color',data.ca('color')[1])，这里不处理下，会导致始终无法在标题中修改文字颜色！
                if(!data.ca('color')) data.ca('color',[]);
                data.ca('color')[1] = e.newValue;
                i.update(data,'colors',data.ca('color'));
            },
            'a:padding': e=>{//240823，四周边距。
                cache.control.setPadding(data.ca('padding'));
            },
            'a:borderColor|a:borderWidth': e=>{
                let bdInfoTmp = __borderInfo();
                cache.control.setBorder && cache.control.setBorder(new ht.ui.border.CSSBorder(bdInfoTmp[0], bdInfoTmp[1]));
            }
        }, ['a:value', 'a:background', 'a:readOnly'], null, cache.control, e => {
            //label与组件水平、垂直对齐布局
            i._labelLayout(data, gv, cache, e);
        });
        _i.addEventListener(cache.control.getView(), 'wheel', e => e.stopPropagation());

        //240701，html模式下，不能输入，只能显示html内容的！
        if (cache.control.getInput) {
            let bdInfoTmp = __borderInfo();
            cache.control.setBorder(new ht.ui.border.CSSBorder(bdInfoTmp[0], bdInfoTmp[1]));

            _i.addEventListener(cache.control.getInput(), 'focus', function() {
                let bdInfoTmp = __borderInfo();
                !data.ca("readOnly") && control.setBorder && control.setBorder(new ht.ui.border.CSSBorder(bdInfoTmp[0], bdInfoTmp[2]));
            });
            _i.addEventListener(cache.control.getInput(), 'blur', function() {
                let bdInfoTmp = __borderInfo();
                control.setBorder && control.setBorder(new ht.ui.border.CSSBorder(bdInfoTmp[0], bdInfoTmp[1]));
            });
        }
    }

    let control = cache.control;
    if (control) {
        control.setInstant && control.setInstant(data.ca('instantTrigger'));

        //240701，调整成cssBorder，避免失真！
        control.setBorder && control.setBorder(new ht.ui.border.CSSBorder(data.ca('borderWidth'), isArrayFn(data.ca('borderColor')) ? data.ca('borderColor')[0] : data.ca('borderColor')));

        control.setColor && control.setColor(isArrayFn(data.ca('color')) ? data.ca('color')[0] : data.ca('color'));
        data.s('label.color',data.ca('color')[1]);  //240721，索引1用来设置标签颜色。

        control.setBorderRadius && control.setBorderRadius(data.ca('borderRadius'));
        control.setFont && control.setFont(data.ca('font'));
        control.setPlaceholder && control.setPlaceholder(data.ca('placeholder'));
    }

    if (cache.label) {
        cache.label.setTextColor( /*data.ca('labelColor')*/ data.s('label.color')); //240630，去掉了labelColor属性！合用label.color，为了简化！

        // cache.label.setText(data.ca('labelText'));
        i.allowEmpty(data, "labelText", value => cache.label.setText(value));
        cache.label.setTextFont(data.ca('font'));
    }

    let layout = layoutVertical ? cache.layoutV : cache.layoutH;
    if (cache.layoutV && cache.layoutH && cache.control && cache.label) {
        if (layout != cache.layoutModeCache) {
            let height = layoutVertical ? cache.control.getHeight() + cache.label.getHeight() + data.ca('gap') : cache.control.getHeight()
            height && p(data, 'height', height);
            //230216，最后一个参数，延续此前配置和注释，暂未深究为何不直接用runningMode()：组态编辑状态缩放、运行状态不缩放避免影响事件点击！runningMode(gv)
            i.layoutHTML(layout, data, gv, cache, () => {}, false);
        }
        layout.addView(cache.label, {
            height: "wrap_content",
            width: 'wrap_content',
        });
        layout.addView(cache.control, {
            height: 'match_parent',
            width: 'match_parent',
            marginTop: layoutVertical ? data.ca('gap') : 0,
            marginLeft: !layoutVertical ? data.ca('gap') : 0
        });
        layout.setAlign(layoutVertical ? 'left' : 'center');
        layout.setVAlign('top');

        cache.layoutModeCache = layout;
    }
    return layout;
}

//230408，markDown编辑器做成内置组件，便于编辑状态下拖放到编辑器给到弹窗，直接作为运行模式被编辑，textArea相对而言太过于原始了！
function __doc(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'doc', '文档编辑器');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.obj) {
        i.setAttrsFormBinded(data, ['content', 'readOnly', 'onChange', 'preview']);
        //初始化
        function init() {
            let div = document.createElement('div'),
                textarea = document.createElement('textarea'),
                myEditormd = null;
            div.id = 'editormd-' + data.getId();
            textarea.style = "display:none";
            div.appendChild(textarea);
            //避免被其他截获处理不冒泡，干脆自己截获不冒泡，避免滚轮无法滚动文档页面
            _i.addEventListener(div, 'wheel', e => e.stopPropagation());

            //240521，缓存初始化操作，元素为{attr:xxx,value:yyy}
            let cachedInitsForEditormdInit = [];
            //240521，是否缓存
            function isCacheNeeded(e) {
                if (!myEditormd) {
                    console.assert(e.oldValue == '__init__'); //240251，通常发生在初始化加载时！
                    cachedInitsForEditormdInit.push({
                        attr: e.property,
                        value: e.newValue
                    })
                    return true;
                } else return false;
            }

            i.md(data, gv, cache, {
                'a:darkMode|a:darkTheme': e => {
                    // if (cache.editormd) cache.editormd.theme(e.newValue ? 'dark' : undefined);
                    if (e.newValue && runningMode()) importCssJs.css('/custom/css/editormdTheme_1.css');
                },
                'a:content': e => { //将编辑器的内容设置为指定的字符串，支持 Markdown 和 HTML 两种格式，自动识别！！
                    if (isCacheNeeded(e)) return; //240521，避免myEditormd未初始化定义导致出事赋值失败！

                    e.newValue !== undefined && myEditormd.setValue(e.newValue);
                },
                'a:hideToolbar': e => {
                    if (isCacheNeeded(e)) return; //240521，避免myEditormd未初始化定义导致出事赋值失败！

                    /*一旦readOnly属性不论初始设定还是动态赋值为true，那么隐藏、显示工具栏API调用，都不会显示工具栏！相当于无效操作。*/
                    if (e.newValue) myEditormd.hideToolbar();
                    else myEditormd.showToolbar();
                },
                'a:readOnly': e => {
                    if (isCacheNeeded(e)) return; //240521，避免myEditormd未初始化定义导致出事赋值失败！
                    myEditormd.settings.readOnly = e.newValue;
                    e.newValue ? myEditormd.hideToolbar() : myEditormd.showToolbar();
                },
                'a:watch': e => {
                    if (isCacheNeeded(e)) return; //240521，避免myEditormd未初始化定义导致出事赋值失败！

                    if (e.newValue) myEditormd.watch();
                    else myEditormd.unwatch();
                },
                'a:preview': e => { //预览/取消预览切换，实测发现没有.preview()/.unpreveiw()方法
                    if (isCacheNeeded(e)) return; //240521，避免myEditormd未初始化定义导致出事赋值失败！

                    //关于多个实例下事件相互影响：https://iotosystem.feishu.cn/docx/P9pHdHPdEo0DRAxhrLucQwbmnnl#WoqYdeKqYoo2eqxcfskcyx12npg
                    if (e.newValue) myEditormd.previewing();
                    else myEditormd.previewed();
                }
            }, ['a:readOnly', 'a:watch', 'a:preview', 'a:content'], null, div, null);

            // 设置监听并定义回调
            _i.watchDomAppended((addedElement) => {
                //初始化md编辑器
                //注意，要访问这里的属性，用cache.editormd.settings.xxx，注意是通过.settings.来访问而不是直接.xxx访问的！
                function __initEditorMd(callback) {
                    //240521，运行时深色模式
                    data.ca('darkMode') && runningMode() && importCssJs.css('/custom/css/editormdTheme_1.css');

                    /*tips 240718，注意，因为index.html/display.html中有script引入editormd.js，而uiotos初始打开时运行时通过iframe嵌套home页面，
                    所以先后会两次实例化editormd对象，此处是第二次iframe内嵌页进行的实例化，因此当下打印window.top.editormd === window.editormd为false
                    此外，还有一个welcomed.json导致的第三次editormd实例化！*/
                    return editormd(div.id, {
                        width: "100%",
                        height: "100%",
                        path: '/custom/libs/markdown/',
                        // theme: "dark",

                        //240520，有效！分别是运行时显示主题，编辑时的主题。不过运行时这种暗黑是否真正想要的，需自己评估，目前没发现有其他暗黑主题怎么用。
                        // previewTheme: "dark", //
                        editorTheme: "pastel-on-dark", //"monokai", // 更改 CodeMirror 的主题

                        markdown: data.ca('content'),
                        /*注意，只读为true时，toolbar工具栏会被自动隐藏，即便这里同步也对其设置了true，也是优先取决于只读属性，
                        此外，如果初始没有显示toolbar那就相当于没有实例化对象，接下来想用api来动态显示toolbar都会报错，实测发现*/
                        readOnly: false,
                        markdownSourceCode: true,
                        codeFold: true,
                        //syncScrolling : false,
                        saveHTMLToTextarea: true, // 保存 HTML 到 Textarea
                        searchReplace: true,
                        //watch : false,                // 关闭实时预览
                        htmlDecode: "style,script,iframe|on*", // 开启 HTML 标签解析，为了安全性，默认不开启    
                        toolbar: true, //显示工具栏
                        //previewCodeHighlight : false, // 关闭预览 HTML 的代码块高亮，默认开启
                        emoji: true,
                        taskList: false,
                        tocm: true, // Using [TOCM]
                        tex: true, // 开启科学公式TeX语言支持，默认关闭
                        flowChart: true, // 开启流程图支持，默认关闭
                        sequenceDiagram: true, // 开启时序/序列图支持，默认关闭,
                        imageUpload: true,
                        imageFormats: ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
                        imageUploadURL: "/upload",
                        onload: function() {
                            //加载完毕的回调，注意，这里this就是editormd()返回实例化的编辑器对象，且this.id就能获取到传入的div.id
                            callback && callback(this); //加载完成后的回调
                        },
                        onchange: function() {
                            if (data == undefined || data.dm() == undefined) return;
                            //注意，存在此处返回的编辑器实例对象，
                            let node = data.dm().getDataById(this.id.split('-')[1]);
                            if (node == undefined) return;
                            i.formEventBubblingUpper(node, gv, cache, 'onChange', {
                                // 'a:content': data.ca('htmlType') ? this.getHTML() : this.getMarkdown()
                                // 获取编辑器当前的内容，返回的字符串格式与setValue()方法接收的格式相同，兼容html和md两种格式，代替.getHTML()和getMarkdown()
                                'a:content': this.getValue()
                            });
                        }
                    });
                }

                //2405211，加上条件避免重入，因为发现i.watchDomAppended目前会在几次重复进入的情况！！这会导致preview重复执行就形成预览、编辑模式两者切换了！！
                if (!cache.editormd) {
                    cache.editormd = __initEditorMd(editormdInst => {
                        myEditormd = editormdInst;
                        if (data == undefined || data.dm() == undefined) return;
                        let node = data.dm().getDataById(myEditormd.id.split('-')[1]);
                        //i.md也放到i.onDataLoaded的回调里，这样data.fp初始化，触发的逻辑执行也是能正常读写属性的！
                        if (node == undefined || node.dm() == undefined) return;

                        //240521，执行缓存的初始化操作！
                        cachedInitsForEditormdInit.forEach(cachedInit => {
                            node.fp(cachedInit.attr, undefined, cachedInit.value);
                        });
                    });
                    console.log('Callback triggered, element has been appended:', addedElement);
                }
            }, div); //240521，实测发现这里传入textarea没用，传入div有用！！
            //资源加载完毕后
            i.onDataLoaded(data, imgobj => { //注意，这里的data是以外层图元data为传参传入，但是回调函数里面用data就要注意了，
                i.setTimeout(() => {

                }, 10);
            });
            return div;
        }
        var obj = cache.obj = init();
        i.layoutHTML(obj, data, gv, cache, () => {
            //这里得动态适应内容，否则编辑和预览两个矩形区域不会随着图元尺寸变化而该变，即便外层区域等自适应！
            cache.editormd && cache.editormd.codeMirror && cache.editormd.resize(data.getWidth(), data.getHeight());
        });
    }
    return cache.obj;
}

//230323，ui版的button按钮组件，便于叠加到其他ui组件之上，比如最常见的是定制对话框直接内嵌的滚动页图纸上用按钮做关闭、确定
function __button_ui(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'bt', '普通按钮 v2', () => {
        data.a('icon-background', 'rgb(255,255,255)');
    });
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.obj) {
        function init() {
            i.setAttrsFormBinded(data, ['text', 'onFormClick']);
            //240709，全部事件注册到bindEvents属性中，新连线操作下拉，会成为统一下拉列表的选项
            data.ca('bindEvents', ['*', 'onFormClick']);

            let control = new ht.ui.Button();

            /*注意，buttonGroup是on('p:selectedButton')，这里是on('p:click')'*/
            control.on('click', function(v) {
                //V的值为对象：{kind: 'click', nativeEvent: MouseEvent, source: t.Button, target: t.Button}

                //主要是给对话框容器组件gv.mi的监听使用：
                gv.fireInteractorEvent({
                    kind: 'onUp',
                    data: data,
                    type: 'data',
                    event: v.nativeEvent
                })

                //触发事件连线操作
                i.formEventBubblingUpper(
                    data,
                    gv,
                    cache,
                    'onFormClick',
                    null,
                    false
                );
            });

            function initButton(text) { //230503，注意，目前只是切换，并没有严格对照darkStyle的true/false意义！
                let darkStyle = data.ca('darkStyle'),
                    button = control;
                //background
                /*data.ca('background')[0] &&*/ button.setBackground(data.ca('background')[0]);
                data.ca('background')[1] ? button.setHoverBackground(data.ca('background')[1]) : button.setHoverBackground('rgba(0,0,0,0)');
                //240623，兼容之前的data.ca('activeBackground')，现在去掉了，active放到了background的索引2
                let activeIndex0 = data.ca('activeBackground') && data.ca('activeBackground')[0],
                    colorIndex2 = data.ca('background')[2],
                    activeColor = activeIndex0 || colorIndex2 || 'rgba(0,0,0,0)';
                button.setActiveBackground(activeColor);

                //textColor
                data.ca('textColor')[0] && button.setTextColor(data.ca('textColor')[0]);
                data.ca('textColor')[1] && button.setHoverTextColor(data.ca('textColor')[1]);
                //240623，兼容之前的data.ca('activeTextColor')，现在去掉了，active放到了textColor的索引2
                activeIndex0 = data.ca('activeTextColor') && data.ca('activeTextColor')[0];
                colorIndex2 = data.ca('textColor')[2];
                activeColor = activeIndex0 || colorIndex2 || 'rgba(0,0,0,0)';
                button.setActiveTextColor(activeColor);

                //240516，用cssBorder，貌似边框不会出现一边窄看不到的情况！
                // button.setBorder(new ht.ui.border.LineBorder(data.ca('borderWidth'), data.ca('textColor')[1]));
                let wtmp = data.ca('borderWidth'),
                    borderColor0 = data.ca('borderColor') && data.ca('borderColor')[0],
                    borderColor1 = data.ca('borderColor') && data.ca('borderColor')[1],
                    borderColor2 = data.ca('borderColor') && data.ca('borderColor')[2],
                    borderColor3 = data.ca('borderColor') && data.ca('borderColor')[3];
                borderColor0 = borderColor0 ? borderColor0 : data.ca('textColor')[0];
                borderColor1 = borderColor1 ? borderColor1 : (data.ca('textColor')[1] ? data.ca('textColor')[1] : data.ca('textColor')[0]);
                borderColor2 = borderColor2 ? borderColor2 : (data.ca('textColor')[2] ? data.ca('textColor')[2] : borderColor1);
                borderColor3 = borderColor3 ? borderColor3 : 'rgba(127,127,127)';
                button.setBorder(new ht.ui.border.CSSBorder([wtmp, wtmp, wtmp, wtmp], borderColor0));
                button.setHoverBorder(new ht.ui.border.CSSBorder([wtmp, wtmp, wtmp, wtmp], borderColor1));
                button.setActiveBorder(new ht.ui.border.CSSBorder([wtmp, wtmp, wtmp, wtmp], borderColor2));
                button.setDisabledBorder(new ht.ui.border.CSSBorder([wtmp, wtmp, wtmp, wtmp], borderColor3));

                //240727，兼容性处理需要这么做，否则旧版组件升级组件源后，也同样无法配置！！
                let radiustmp = data.ca('radius');
                button.setBorderRadius(radiustmp !== undefined ? radiustmp : data.ca('borderRadius')); //圆角数组传参通常默认：左上、右上、左下、右下
                if(radiustmp && !i.hasAttrObjectKey(data,'radius',null, true)) {//末尾参数传入true，确保必须要有定义才返回true，仅有配置属性值不算！
                    data.ca('radius',undefined); //清理掉！
                    data.ca('borderRadius',isArrayFn(radiustmp) ? radiustmp : [radiustmp,radiustmp,radiustmp,radiustmp]);
                }

                button.setText(text);
                button.setTextFont(data.ca('textFont'));
                button.setPadding(0); //不仅对于simple模式，对于常规按钮组方格模式，也都去掉默认的内边距，好让尺寸变小时也能文字居中！
            }

            /*240126，加上这里，因为现在i.md执行的attrsInit、loadedInit都是等待整体页面加载完成后才初始化，如果没有默认初始样式，那么
            会出现过渡白底等样式，这里给上初始样式避免加载过程中样式难看。*/
            initButton(data.ca('text'));

            //监听输入属性变化
            i.md(data, gv, cache, {
                'a:borderWidth|\
                a:textColor|\
                a:borderColor|\
                a:background|\
                a:text|\
                a:iconPath|\
                a:textFont|\
                a:borderRadius|\
                a:radius': e => {
                    //240804，为了支持按钮快速设置透明背景色
                    if(i.isEditing(data) && e.property == 'a:background'){
                        if(i.isArrIndexChangeOnly(e,0)){
                            //240804，如果设置背景色透明度为0，全透明，那么整个背景头都自动全透明！
                            if(e.newValue[0] == null || colorAutoOpacity(e.newValue[0]) == 0){
                                e.newValue.forEach((item,idx)=>{
                                    e.newValue[idx] = null;
                                });
                            }
                        }
                    }
                    initButton(data.ca('text'));
                },
                'a:darkStyle': e => { //230503，深浅模式UI。注意，目前只是切换，并没有严格对照darkStyle的true/false意义！
                    let colortmp = i.clone(data.ca('textColor')),
                        bkgs = i.clone(data.ca('background'));
                    if (!bkgs) {
                        bkgs = [];
                        data.ca('background', []);
                    }
                    let bkg = !isArrayFn(bkgs) ? bkgs : bkgs[0];
                    let newColorTmp = [];
                    bkgs.forEach((c, idx) => {
                        let color = isArrayFn(colortmp) ? colortmp[idx] : colortmp;

                        //240815，千万注意，发现这里直接索引复制，会导致引用修改！！发生组件复制后，新组件切换darkStyle，结果引起被复制的组件属性同步变化！！！非常难以排查！
                        // data.ca('background')[idx] = color;
                        newColorTmp.push(color);
                    });
                    
                    i.update(data,'background',/*data.ca('background')*/newColorTmp);  //240804，需要这样回写下，因为上面循环内只是引用赋值，不会触发attrObject以及md监听的oldValue影响！

                    newColorTmp = [];
                    colortmp.forEach((c, idx) => {
                        if (bkgs.length == 0 && bkgs) bkgs = bkg; //240623，向下兼容！
                        let ctmp = isArrayFn(bkgs) ? bkgs[idx] : bkgs;

                        //240815，千万注意，发现这里直接索引复制，会导致引用修改！！发生组件复制后，新组件切换darkStyle，结果引起被复制的组件属性同步变化！！！非常难以排查！
                        newColorTmp.push(ctmp);
                    });
                    //240815，千万注意，发现这里直接索引复制，会导致引用修改！！发生组件复制后，新组件切换darkStyle，结果引起被复制的组件属性同步变化！这里将前面引用复制改成非引用赋值，避免造成相互干扰！！
                    data.ca('borderColor',newColorTmp);
                    data.ca('textColor',newColorTmp);

                    data.ca('icon-background', bkg);
                    initButton(data.ca('text'));

                    //240727，如果是编辑时深色模式修改成浅色模式，并且此前边框宽度为0，那么现在自动设置为1，否则会看不到！
                    if(i.isEditing(data)){
                        if((e.oldValue == true || e.oldValue == undefined) && !e.newValue && !data.ca('borderWidth')){
                            i.update(data,'borderWidth',1);
                        }else if(e.oldValue === false && e.newValue && data.ca('borderWidth')){
                            i.update(data,'borderWidth',0);
                        }
                    }
                },
                'a:iconPath|\
                a:iconSize|\
                a:icon-background|\
                a:iconPosition': e => {
                    let icontmp = new DatabindingsImageDrawable(data.ca('iconPath'), {
                        'icon-background': data.ca('icon-background')
                    });
                    let button = control;
                    button.setIcon(icontmp); //240623
                    let backDisabledColor = data.ca('background') && data.ca('background')[3];
                    button.setDisabledIconDrawable(new DatabindingsImageDrawable(data.ca('iconPath'), {
                        'icon-background': backDisabledColor ? backDisabledColor : 'rgba(127,127,127)'
                    }));
                    if (!data.ca('iconSize')) data.ca('iconSize', [20, 20]);
                    button.setIconWidth(data.ca('iconPath') ? data.ca('iconSize')[0] : 0);
                    button.setIconHeight(data.ca('iconPath') ? data.ca('iconSize')[1] : 0);
                    button.setIconTextGap(data.ca('iconPath') ? data.ca('iconGap') : 0);
                    if (data.ca('iconPosition') == 'left') {
                        button.setHTextPosition('right')
                        button.setVTextPosition('middle')
                    } else if (data.ca('iconPosition') == 'top') {
                        button.setHTextPosition('center')
                        button.setVTextPosition('bottom')
                    } else if (data.ca('iconPosition') == 'right') {
                        button.setHTextPosition('left')
                        button.setVTextPosition('middle')
                    } else if (data.ca('iconPosition') == 'bottom') {
                        button.setHTextPosition('center')
                        button.setVTextPosition('top')
                    }
                },
                'a:textColor': e => { //240623，参考__button中的属性联动配置的实现
                    i.setValueLinked(data, 'borderColor', e);
                    i.setValueLinked(data, 'icon-background', e);
                },
                'a:borderColor': e => { //240623，参考__button中的属性联动配置的实现
                    i.setValueLinked(data, 'textColor', e);
                    i.setValueLinked(data, 'icon-background', e);
                },
                'a:onFormClick': e => {
                    //特定：主要是给对话框容器组件gv.mi的监听使用：
                    gv.fireInteractorEvent({
                        kind: 'onUp',
                        data: data,
                        type: 'data',
                        // event: v.nativeEvent
                    })
                }
            }, ['a:text', 'a:iconPath', 'a:disabled'], null, control, e => {
                //label与组件水平、垂直对齐布局
                i._labelLayout(data, gv, cache, e);
            });

            return control;
        }

        var obj = cache.obj = init()
        i.layoutHTML(obj, data, gv, cache);
    }

    //shadowBorder：[0,0,8]；shadowColor：rgba(102,102,102,0.2)
    initShadow(cache.obj, data.ca('shadowBorder'), data.ca('shadowColor'), data.ca('shadowEnabled'));

    return cache.obj;
}

//树表格
function __treeTable_ui(data, gv, cache) {
    cache = _i.innerRecoveredDataCache(data, cache, false, 'ttb', '树表');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    //240715，名称意义，用于代码，就不用索引了。注意，更新需要跟config.js中对checkMode枚举变量一起定义修改！
    let checkModeListTmp = [null, 'default', 'children', 'descendant', 'all','single','singleWithoutParent'];
        
    let nodeData = data;
    if (!cache.obj) {
        //24616，简化时如果删掉这个属性定义，为了不报错！
        if (data.ca('dataFilterFunc') === undefined) {
            i.update(data, 'a:dataFilterFunc', `function(node,rObj,cObj,cIndex,value){
                return value;
            }`);
        }

        //240718，兼容背景颜色属性合并（成数组）配置。表格头背景色，变成表格背景色索引1中配置。
        if (!data.ca('background') || !isArrayFn(data.ca('background'))) {
            data.ca('background', [
                data.ca('background'), //null或者初始配置的单个值
                data.ca('headerBackground') ? data.ca('headerBackground') : 'rgba(255,255,255)'
            ])
        }

        //240719，边框颜色兼容为数组形式，所以1为常规边框，索引1为表格头与表格内容的横向间隔线。
        if (!data.ca('borderColor') || !isArrayFn(data.ca('borderColor'))) {
            data.ca('borderColor', [
                data.ca('borderColor'), //null或者初始配置的单个值
                 //索引1为表头和内容区横向间隔线。表格头可见时，默认跟行列线颜色一样。表格头不可见时，默认跟边框颜色一样！
                data.ca('headerVisible') ? data.ca('linesColor') : data.ca('borderColor'),
                //240718，行列线颜色属性配置，合并到边框线上来！
                data.ca('linesColor') ? data.ca('linesColor') : 'rgba(255,255,255)'
            ])
        }

        //组件默认form绑定的属性
        i.setAttrsFormBinded(data, [
            'datas',
            'dataAdd',
            'visibleFilterInput',
            'dataComboType',
            'columnFields', //231007，列的数据字段。注意，通常由“查询返回转换成树表”组件连线操作datas时，同时也将自身的fields操作给到这里！这样让columns里由了name字段，但实际上不需要由name配置，自动按顺序对应到表格各列的！
            'currentClicked', //230901新增，任何单击，都会传入单击事件类型和行数据的信息
            'checkSelected',
            'checkIndexsGet',
            'checkMode',
            'rowsExtraUserInfo',
            'onDatasLoaded',
            'onClick', //行单击，230327，但是此前是用到操作按钮的单击了！现在单独为操作按钮提供了onLastButtonClick
            'onDoubleClick', //行双击
            'onCheck', //行勾选
            'onLastButtonClick', //操作按钮单击
            'onLastButtonSelected',
            'borderWidth'
        ]);
        //230806，全部事件注册到bindEvents属性中，新连线操作下拉，会成为统一下拉列表的选项
        data.ca('bindEvents', ['*', 'onDatasLoaded', 'onClick', 'onDoubleClick', 'onCheck', 'onLastButtonClick', 'onLastButtonSelected']);
        //240717，旧版有这个idColumnVisible属性，专门要识别做兼容处理，因为旧版-1是完整宽度，0是列不可见，现在新的逻辑是-1不可见，0为均分宽度！
        data._i_isOldVersion = i.hasAttrInLocalObj(data,'idColumnVisible');
        if(data._i_isOldVersion) console.error('WARN: current treeTable is old version according to idColumnVisible attr, and will use old rule in column width setting');

        function init() {
            let splitLayout = cache.headerSplit = new ht.ui.SplitLayout();
            splitLayout.setPositionType('absoluteFirst');
            splitLayout.setOrientation('v');
            splitLayout.setPosition(35);
            splitLayout.setSplitterVisible(false);
            splitLayout.setBorder(new ht.ui.border.CSSBorder(0, ht.ui.uiTheme.borderColor));

            let dataModel = new ht.DataModel(),
                treeTablePane = cache.treeTablePane = new ht.ui.TreeTablePane(dataModel),
                table = cache.table = treeTablePane.getTableView(),
                tableHeader = cache.header = treeTablePane.getTableHeader(), //new ht.ui.TableHeader(table) //treeTablePane.getTableHeader();
                columnModel = table.getColumnModel(),
                __clicked = null; //全选时，也能触发bindControls
            i.addChildDataModel(nodeData, dataModel, 'tb');

            //监听树表treeTable勾选事件并获取勾选的列表清单
            _i.addViewListener(table, (e) => {
                //230327，如果勾选了该属性，那么点击树表的父节点，将不会有任何动作，仅仅展开或合并（如果有子节点）
                let filterKinds = ['expand', 'expanded', 'collapse', 'collapsed'];
                if (e.data && e.kind == 'clickData' && e.data.hasChildren() && filterKinds.indexOf(e.kind) == -1) { //注意，这里不能进来点击行操作的节点展开关闭对应的事件，否则容易造成死循环！
                    if (data._btnGroupMouseup == true) {
                        data._btnGroupMouseup = null;
                        return;
                    }

                    //230902，在触发勾选区域时，不进行展开或合并！
                    if (table.checkHitTest(e.nativeEvent)) return;

                    switch (data.ca('nodeExpandMode')) {
                        case 'noExpand':
                            break;
                        case 'expandFirstLayer':
                            table.isExpanded(e.data) ? table.collapse(e.data) : table.expand(e.data);
                            return;
                        case 'expandAll':
                            table.isExpanded(e.data) ? table.collapse(e.data) : table.expandAll(e.data);
                            return;
                    };
                    //23009
                    __clicked(e);
                };

                //注意，文档提到checkData、uncheckData事件及名称，实测发现不论是勾选还是点击（没勾选到），都是clickData事件过来！
                __clicked = function(event) {
                    //获取所有的勾选列表
                    let selectedTmp = table.getSelectionModel().toSelection(); //注意，selection是有按照选择顺序的来的，很好！！
                    //表单属性最好不传对象，而应该传可以反序列化的值
                    let ids = [],
                        indexs = []; //230308，运行点击交互时，同时更新选中的id和索引
                    selectedTmp.forEach(item => {
                        //240214，有子节点的即父节点本身，不加到勾选列表中！因为实际使用也是最底端行对象内容！否则还要通过checkSelected和queryMatched反复相互同步几次才稳定，浪费性能！
                        if (
                            !item.isEmpty() && 
                            //240715，增加singleWithoutParent选项，此时才是单选时，节点的选项是清空，否则 节点也能单选选择！（子节点自动取消选择），在有multiSelect选项时且为false时，默认是这种模式，兼容连线关联弹窗的单选！
                            nodeData.ca('checkMode') === checkModeListTmp.indexOf('singleWithoutParent') 
                        ) return;
                        indexs.push(item._id); //230308，运行点击交互时，同时更新选中的id和索引
                        ids.push(item.did);
                    });
                    /*230308，注意，这里在checkSelected响应同步后，还需要在这里交互__clicked()里也做更新，否则交互事件的触发提供的值是初始空或旧的！
                    且不能加到下面的i.formEventBubblingUpper里带一起，因为下面参数selfInclude为false。*/
                    i.update(data, 'checkIndexsGet', indexs);
                    data._eventCheckSelected = true;
                    //tips 240715，注意，checkMode是枚举类型，不是字符串，首项是0不是null。
                    data.ca('checkMode') !== 0 && i.update(data, 'checkSelected', ids);
                    _i.formEventBubblingUpper(data, gv, cache, 'onCheck', {
                        'a:checkSelected': ids
                    }, false, true);
                    data._eventCheckSelected = true; //避免再回写a:checkSelected属性值的时候，触发a:queryMatched中的table.checkData()
                    data.ca('checkMode') !== 0 && i.fa(data, 'checkSelected', ids, gv, cache, true, false); 
                    data._eventCheckSelected = undefined;
                }

                //双击行 = 单击选中行/勾选 + 对话框点击OK
                if (e.kind == 'doubleClickData' || e.kind == 'checkData' || e.kind == 'uncheckData') { //table的table.getSelectionModel().toSelection()，随时调用都是最新的当前选中列表！

                    //230901，当前行点击时，更新行信息，带上类型信息
                    i.update(data, 'currentClicked', {
                        kind: e.kind,
                        rowData: e.data.rowData,
                        rowObj: __rowDataArr2Object(e.data.rowData), //231007，增加rowObj，与rowData数组补充
                        rowId: e.data.did
                    });

                    /*tips 230913，测试发现连线对外同时关联onCheck、onDoubleClick时，不论先后顺序，双击事件都不会响应，但是勾选事件能响应！好像双击被勾选覆盖了！一旦
                    去掉勾选的对外连线，双击事件就又能正常响应到这里！！暂未深究也未解决！*/
                    if (e.kind == 'doubleClickData') { //230327，区分单击click和双击doubleClickData
                        /*230327，双击行的事件*/
                        i.formEventBubblingUpper(nodeData, gv, cache, ['onDoubleClick'], {
                            'a:rowsExtraUserInfo': (() => {
                                let infotmp = nodeData.ca('rowsExtraUserInfo');
                                //230924，data.xxx改成e.data.xxx，因为前者是树表图元，而非树表行数据图元！！！树表图元的id会非常大！导致数组非常大，从而数据异常大，json扁平化就延迟很明显！
                                i.setArrayIndexValue(infotmp, e.data.getId() - 1, e.newValue, false);
                                return infotmp;
                            })()
                        }, true, true, 'onDoubleClick', false, {
                            rowData: e.data.rowData, //230924，data.xxx改成e.data.xxx，因为前者是树表图元，而非树表行数据图元！！！
                            rowId: e.data.did //230924，data.xxx改成e.data.xxx，因为前者是树表图元，而非树表行数据图元！！！
                        });
                    } else __clicked(e); //230327，注意，对于细分事件区分，需要进一步完善，目前只区分单击、双击行
                } else if (e.kind == 'clickData') {
                    //230901，当前行点击时，更新行信息，带上类型信息
                    i.update(data, 'currentClicked', {
                        kind: e.kind,
                        rowData: e.data.rowData,
                        rowObj: __rowDataArr2Object(e.data.rowData), //231007，增加rowObj，与rowData数组补充
                        rowId: e.data.did,
                        //240622，根据前面的标记，这里添加上前面onLastButtonClick点击带入的currentClicked中的button数据，避免被覆盖掉！
                        button: nodeData._i_lastButtonClicking && data.ca('currentClicked') && data.ca('currentClicked')['kind'] == "onLastButtonClick" ? data.ca('currentClicked')['button'] : undefined
                    });

                    //240622，复位标记！
                    if (nodeData._i_lastButtonClicking) nodeData._i_lastButtonClicking = undefined;

                    //240219，发现树表格竟然一直没有单独的onClick事件，导致连线关联树表格的行单击点击，竟然不响应事件，这里加上去！有待进一步观察测试，尤其是传入的表单值！
                    _i.formEventBubblingUpper(data, gv, cache, 'onClick', {
                        'a:currentClicked': data.ca('currentClicked')
                    }, false, true);

                    //最末列的按钮组按钮点击操作，是要弹出对话框，而不能对当前行的选中/勾选、去选中/去勾选造成影响！
                    if (data._btnGroupMouseup == true) {
                        data._btnGroupMouseup = null;
                        return;
                    }
                    try {
                        if (!table.checkHitTest(e.nativeEvent)) table.checkData(e.data);
                        else { //240214，加上else，因为现在checkData会导致onSelectAll响应，里面也有传入event，并且调用__clicked(event)，避免重复调用性能浪费！！
                            __clicked(e);
                        }
                    } catch (error) {

                    }
                } else if (e.kind == 'selectData') { //确定追加勾选项
                    //230901，当前行点击时，更新行信息，带上类型信息
                    i.update(data, 'currentClicked', {
                        kind: e.kind,
                        rowData: e.data.rowData,
                        rowObj: __rowDataArr2Object(e.data.rowData), //231007，增加rowObj，与rowData数组补充
                        rowId: e.data.did
                    });

                    table.sm().as(e.data); //注意，这里不能是sm().ss()，否则就是只勾选当前这个e.data了！！
                    __clicked(e);
                }
            });

            function __resetColumns() {
                columnModel.clear();
                //【注意】这里调换了顺序，默认name列为第一列（index为0），新追加的id为第二列，这里要id变到前面去！
                columnModel.add(cache.idColumnBackup);
                columnModel.add(cache.nameColumnBackup);
            }
            let columnId = cache.idColumnBackup = new ht.ui.Column(); //创建列对象
            columnId.setName('id'); //用作id
            columnModel.add(columnId, 0);
            cache.nameColumnBackup = columnModel.getDatas().get(0);
            //需要这里就做一次reset，交换id和name列顺序，确保在初始隐藏id列时，索引0就是对id列的，以支持兼容datas初始传入[]，无行数据的情况！
            __resetColumns();

            table.setScrollBarMode('auto');
            cache.drawRowBackground = table.drawRowBackground;

            splitLayout.addView(tableHeader, {
                region: 'first'
            });
            splitLayout.addView(table, {
                region: 'second'
            });

            //------------------------增加表格的分页组件------------------------------------------
            var splitLayWhole = new ht.ui.SplitLayout();
            splitLayWhole.setResizable(false);
            splitLayWhole.setOrientation('v');
            splitLayWhole.setPosition(46);
            splitLayWhole.setPositionType('absoluteSecond');
            splitLayWhole.setToggleVisible(false);
            splitLayWhole.setSplitterSize(0);

            var paginationTableDatas = [
            ];
            let pagination = cache.pagination = new ht.ui.Pagination();
            pagination.setRowCount(paginationTableDatas.length);
            var pageButtonGroup = cache.pageButtonGroup = pagination.getPageButtonGroup();
            // pageButtonGroup.setButtonCount(4);
            pagination.setRowsPerPage(10);
            pagination.fit(table);
            pagination.on('execRequest', function(e) {
            });
            splitLayWhole.addView(splitLayout, {
                region: 'first'
            });
            splitLayWhole.addView(pagination, {
                region: 'second'
            });
            //----------------------------------------------------------------------------------
            //230225，判断用切换开关按钮的条件，当前是全局判断，暂不支持混合模式（多个按钮，其中某个按钮可以切换开关，其他是正常点击）
            function __isLastSingleToggleMode() {
                let lasttmp = nodeData.ca('lastSingleIgnored');
                return !nodeData.ca('singleRootOrChild') && //默认用lastSingle，而非lastRoot
                    isArrayFn(nodeData.ca('lastItems')) &&
                    nodeData.ca('lastItems').length == 2 && //230304，由此前文字至少有两个好用来设置，限定为只有两个，否则测试发现树表会误判进来！
                    (!nodeData.ca('lastRootIgnored') || nodeData.ca('lastRootIgnored').length == 0) && //230304，新增这个条件，还是为了避免常规树表也误判进来。需要在再观察测试
                    isArrayFn(lasttmp) && //lastSingleIgnored的设置只能是1个用来忽略索引0或者1
                    lasttmp.length == 1 && //当前设置中索引0和1里未被设置成忽略的索引对应的文字为默认显示的！
                    lasttmp[0] <= 1;
            }
            function __rowDataArr2Object(rowData) {
                let target = {};
                nodeData.ca('columnFields') && nodeData.ca('columnFields').forEach((field, idx) => {
                    if (idx == 0) return; //columns相关的列中，第一列对应默认的id列，并无数据对应，数据数组对应各列是从索引1开始的！
                    if (field) target[field] = rowData[idx - 1];
                });
                return target;
            }

            function initColumns() {
                /*多行数据都会进列初始化，避免列随着行数据也横向被追加，这里需要先清除，同时再开始初始化的两个列对象：id、name对象放进来还原！*/
                __resetColumns();

                //定义各列
                nodeData.ca('columns').forEach((item, index) => {
                    if (item != undefined) {
                        let column = columnModel.getDataById(index + 1) //treeTable的columnDataModel有默认索引为0名称为"name"的列图元对象，用于树节点收起展开
                        if (column == undefined) {
                            if (index < 2) { //前两列是初始化已经创建好的（name列是对象实例化时就带了，id列是随后手动创建了）
                                column = columnModel.getDatas().get(index);
                            } else {
                                column = new ht.ui.Column(); //创建列对象
                                columnModel.add(column);
                                column.setId(index + 1);
                            }
                        }

                        //240614，第三行作为当前树表格的toolTip显示！！针对properties.json连线表格用！
                        table.setToolTipEnabled(!nodeData.ca('disableTooltip'));
                        column.getToolTip = (data, tableView) => {
                            let toolTipColumnIndex = nodeData.ca('columnForTooltip'); //240614，新增属性，让哪个字段用来作为toolTip（通常不在表格显示字段中，只存在数据项中！），默认显示当前单元格内容！
                            let desctmp = data.rowData[toolTipColumnIndex >= 0 ? toolTipColumnIndex : index - 1];

                            //240614，提供提示回调，自定义处理！
                            let toolTipCallback = new Function('return ' + nodeData.ca('toolTipCallback'))();
                            let customedToolTip = toolTipCallback && toolTipCallback(nodeData, gv, cache, data.rowData, index, toolTipColumnIndex, data);
                            if (customedToolTip !== undefined) desctmp = customedToolTip; //得支持undefined、false、''，因为值字段可能就是这个值啊！

                            return desctmp !== undefined ? `<div id="config_tooltip" style="font-size:12px;line-height:1.75em;letter-spacing:1px">
                                ${desctmp}
                            <div/>` : undefined;
                        }

                        switch (index) {
                            case 0: //序号首列，不需要设置setAccessType，要求setName固定名称为'id'
                                column.setDisplayName(item.displayName); //id列的具体显示文字，用配置的来
                                break;
                            case nodeData.ca('columns').length - 1:
                                if (nodeData.ca('lastItems').length) {
                                    column.drawCell = function(g, data, selected, col, x, y, w, h, view) {
                                        if (data.rowData) { //前面解析遍历datas对应的json数据时，行数据存放到行对象data的rowData属性中了，这里取出来用
                                            let control = data.lastControl; //避免重复刷新
                                            if (!control) {
                                                control = data.lastControl = new ht.ui.HBoxLayout();
                                                control.setHeight(h); //宽高一定要设置，否则不显示了！
                                                control.setWidth(w);
                                                control.setScrollBarMode('auto');

                                                //按钮组指定索引的按钮逐行文字差异化显示支持
                                                let lastItemRowsTextTmp = nodeData.ca('lastItemRowsText'),
                                                    currentRowButtonText = null,
                                                    buttonIndex = null;
                                                if (lastItemRowsTextTmp != undefined) {
                                                    let curRowTextTmp = lastItemRowsTextTmp[data.getId()],
                                                        firstItemVal = lastItemRowsTextTmp[0];
                                                    if (curRowTextTmp != null && i.isStringNumber(firstItemVal)) {
                                                        buttonIndex = Number(firstItemVal);
                                                        if (buttonIndex >= 0 && buttonIndex <= nodeData.ca('lastItems').length - 1) {
                                                            currentRowButtonText = curRowTextTmp;
                                                        } else {
                                                            buttonIndex = null;
                                                            console.error('lastItemRowsText first item value error! current is', firstItemVal, 'but need >=0 and < length of lastItems');
                                                        }
                                                    }
                                                }

                                                data._i_lastButtons = []; //230226，最后一列按钮组的各个按钮的对象列表
                                                for (let itemIndex = 0; itemIndex < nodeData.ca('lastItems').length; itemIndex += 1) {
                                                    let item = nodeData.ca('lastItems')[itemIndex],
                                                        index = itemIndex;
                                                    let haschildren = data.hasChildren(),
                                                        hasparent = data.getParent() != undefined;
                                                    if (!hasparent && !haschildren) { //1）无父节点，也无下级节点，可当成子节点或根节点或之外的处理！
                                                        if (nodeData.ca("lastSingleIgnored") && nodeData.ca("lastSingleIgnored").indexOf(index) != -1) {
                                                            continue;
                                                        }
                                                    } else if (hasparent && haschildren) { //2）有父节点，也有下级节点，当成节点来处理
                                                        if (nodeData.ca("lastNodeIgnored").indexOf(index) != -1) {
                                                            continue;
                                                        }
                                                    } else if (!hasparent && haschildren) { //3）无父节点，有下级节点，当成根节点来处理
                                                        if (nodeData.ca("lastRootIgnored").indexOf(index) != -1) {
                                                            continue;
                                                        }
                                                    } else if (hasparent && !haschildren) { //4）有父节点，无下级节点，当成子节点来处理
                                                        if (nodeData.ca("lastChildIgnored").indexOf(index) != -1) {
                                                            continue;
                                                        }
                                                    }

                                                    //230225，最后一列的操作列按钮组支持开关按钮模式，实现文字的自切换
                                                    let button = null,
                                                        lasttmp = nodeData.ca('lastSingleIgnored');
                                                    if (__isLastSingleToggleMode()) {
                                                        button = new ht.ui.ToggleButton();
                                                        button.setBackground(null);
                                                        button.setSelectBackground(null);
                                                        // button.setActiveBackground(null); //下面有调用到
                                                        button.setSelectHoverBackground(null);
                                                        button.setSelectActiveBackground(null);
                                                        button.on('p:selected', function(e) {
                                                            if (e.newValue) button.setText(nodeData.ca('lastItems')[lasttmp[0]]);
                                                            else button.setText(nodeData.ca('lastItems')[1 - lasttmp[0]]);
                                                            i.formEventBubblingUpper(nodeData, gv, cache, ['onClick', 'onLastButtonSelected'], {
                                                                'a:rowsExtraUserInfo': (() => {
                                                                    let infotmp = nodeData.ca('rowsExtraUserInfo');
                                                                    i.setArrayIndexValue(infotmp, data.getId() - 1, e.newValue, false); //tips 230629，注意，这里对于空的位置，默认填入false了，而不是保持空null
                                                                    return infotmp;
                                                                })(),
                                                            }, true, true, 'onLastButtonSelected', false, {
                                                                rowData: data.rowData,
                                                                rowId: data.did,
                                                                button: {
                                                                    text: item,
                                                                    index: index
                                                                }
                                                            });
                                                        });
                                                    } else { //兼容旧版
                                                        button = new ht.ui.Button();
                                                    }

                                                    //230226，最后一行的按钮对象存放到当前行row的对象data中，便于在响应属性时能被调用
                                                    data._i_lastButtons.push(button);

                                                    //230907，将按钮组传给回调函数，用于结合当前行数据，任意自定义按钮的显示、隐藏等任意定制化操作
                                                    let cbbtns = new Function('return ' + nodeData.ca('btnsFilterFunc'))();
                                                    cbbtns && cbbtns(nodeData, data, button, itemIndex);

                                                    button.setTextColor(nodeData.ca('lastColorsDefault')[index]);
                                                    button.setHoverTextColor(nodeData.ca('lastColorsHover')[index]);
                                                    button.setActiveTextColor(nodeData.ca('lastColorsActive')[index]);
                                                    button.setHoverBackground(null);
                                                    button.setActiveBackground(null);
                                                    button.setText(currentRowButtonText != null && Number(currentRowButtonText) != 0 && buttonIndex == itemIndex ? currentRowButtonText : item); //指定列按配置的行显示差异化内容
                                                    button.setTextFont(nodeData.ca('font'));
                                                    button.setBorder(null);
                                                    button.setPadding(0);
                                                    button.on('d:mouseup', (e) => { //这里不能是onOnce，否则事件只会触发第一次
                                                        //改成逐层回调支持，有待进一步测试验证是否会产生BUG：
                                                        i.innerCallback(nodeData, gv, cache, 'onClick', data.rowData, { 'text': item, 'index': index });

                                                        //240622，加上一个标记，因为马上会进入到onClick响应，避免那里面的currentClicked覆盖掉这里的，而这里的是带有button数据的！！
                                                        nodeData._i_lastButtonClicking = true;

                                                        let rowtmp = {
                                                            rowData: data.rowData,
                                                            rowId: data.did,
                                                            button: {
                                                                text: item,
                                                                index: index
                                                            }
                                                        };
                                                        //230906，当前行数据信息
                                                        i.update(nodeData, 'currentClicked', {
                                                            kind: 'onLastButtonClick',
                                                            rowData: rowtmp.rowData,
                                                            rowObj: __rowDataArr2Object(rowtmp.rowData), //231007，增加rowObj，与rowData数组补充
                                                            rowId: rowtmp.rowId,
                                                            button: rowtmp.button
                                                        });

                                                        //追加form数据
                                                        let formtmp = i.getFormDatas(nodeData);
                                                        formtmp._row = rowtmp;
                                                        i.ubc(nodeData, formtmp, 'onLastButtonClick');
                                                        nodeData._btnGroupMouseup = true;
                                                    })
                                                    button.on('d:mouseenter', (e) => {
                                                        button.getView().style.cursor = 'pointer';
                                                    })
                                                    button.on('d:mouseleave', (e) => {
                                                        button.getView().style.cursor = 'default';
                                                    })
                                                    control.addView(button, {
                                                        height: 'match_parent',
                                                        width: 'wrap_content', //设置wrap_conttent后，hbox布局的setGap就没用了！
                                                        marginRight: nodeData.ca('lastGap'), //230129，通过这里来设置间距，包括最后一个按钮与边框的间距！
                                                        marginLeft: 0
                                                    });
                                                    control.setAlign(nodeData.ca('centerAlign') ? 'center' : 'right') //最后一列的操作栏，在按钮数量不一时，要么居中排列要么靠右对齐，不能靠左
                                                }
                                                //230226，初始化切换按钮数据设置，如果有，会放到该属性下。
                                                nodeData.fp('a:rowsExtraUserInfo', null, nodeData.ca('rowsExtraUserInfo'));
                                            }
                                            return control.getView()
                                        }
                                    };
                                    break; //最后一列加上操作按钮列表，如果配置有。如果配置没有，那么各列默认都是内容区域的，到default中去执行！
                                }
                            default:
                                if (index == 1) {
                                    //树表列对象的_name属性值为"name"的列，行数据data.setName()赋值，便会显示到当前行的一个或多个满足条件的列上（至少有对象实例化时自带的一个），名称可以重复！
                                    column.setDisplayName(item.name ? item.name : item.displayName); //列字段的显示名字
                                } else {
                                    column.setName(item.name ? item.name : item.displayName); //固定属性名为name或displayName的内容，免配置，（旧版是'prop' + i，但是这样需严格对应列排序，升级更新插入列会导致兼容问题！）
                                }
                                column.setAccessType('attr'); //固定属性方法为a，免配置
                                item.editable && column.setEditable(item.editable);
                                item.editorClass && column.setEditorClass(item.editorClass);
                                item.valueType && column.setValueType(item.valueType);

                                //列有"drawCell"字段，或者有"enableCopy"且true时，该列就转为重绘！
                                if (item.drawCell || item.enableCopy) {
                                    let columnDrawCellData = item.drawCell ? item.drawCell : {};
                                    column.drawCell = function(g, data, selected, col, x, y, w, h, view) {
                                        let control = data['control' + index];
                                        if (data.rowData) {
                                            if (!control) {
                                                let dataCell = data.rowData[index - 1]
                                                if (dataCell && typeof dataCell == 'object' || item.enableCopy) {

                                                    //表明单元格是字符串，但是列配有item.enableCopy=true，兼容自动处理成对象类型
                                                    if (typeof dataCell != 'object') {
                                                        dataCell = {
                                                            "type": "linkButton",
                                                            "text": dataCell
                                                        }
                                                    }

                                                    control = data['control' + index] = new ht.ui.HBoxLayout();
                                                    let celldataArr = []
                                                    if (isArrayFn(dataCell)) {
                                                        celldataArr = dataCell
                                                        control.setScrollBarMode('auto');
                                                    } else {
                                                        celldataArr = [dataCell]
                                                        control.setScrollBarMode('off');
                                                    }
                                                    control.setGap(0);
                                                    control.setHeight(h); //宽高一定要设置，否则不显示了！
                                                    control.setWidth(w);
                                                    celldataArr.forEach((cellItem, cellIndex) => {
                                                        if (cellItem == null) return;
                                                        let objtmp = null;
                                                        switch (cellItem.type) { //暂时未明确划分类型，都按照按钮类型来处理，因为对文字、图片以及经过扩展后对图标数据绑定动态变量加载都适用！
                                                            case 'image':
                                                                objtmp = new ht.ui.Button();
                                                                break;
                                                            case 'text':
                                                                objtmp = new ht.ui.Button();
                                                                break;
                                                            case 'button':
                                                                objtmp = new ht.ui.Button();
                                                                break;
                                                            case 'toolButton':
                                                                objtmp = new ht.ui.ToggleButton();
                                                                break;
                                                            case 'linkButton':
                                                                objtmp = new ht.ui.LinkButton();
                                                                break;
                                                            case 'graphView':
                                                                objtmp = new ht.graph.GraphView();
                                                                break;
                                                            default:
                                                                objtmp = new ht.ui.Button();
                                                        }

                                                        function MyDrawable(url) { //构造函数调用基类需传入this，同时注意实例化时是否有构造参数的传入！
                                                            MyDrawable.superClass.constructor.call(this, url);
                                                        }
                                                        ht.Default.def(MyDrawable, ht.ui.drawable.ImageDrawable, {
                                                            draw: function(x, y, width, height, data, view, dom) {
                                                                let self = this, //成员函数调用基类方法，也需传入this
                                                                    mydata = null;

                                                                //240505，之前这里是let mydata = new ht.Node()，这必然导致内存持续增加啊！！一直在new对象！！！
                                                                if (nodeData._i_drawableNode) mydata = nodeData._i_drawableNode;
                                                                else mydata = nodeData._i_drawableNode = new ht.Node();

                                                                mydata.setImage(self.getImage())
                                                                mydata.a('icon-background', 'blue')
                                                                let wtmp = columnDrawCellData.width ? columnDrawCellData.width : objtmp.getWidth(),
                                                                    htmp = columnDrawCellData.height ? columnDrawCellData.height : objtmp.getHeight();
                                                                try {
                                                                    MyDrawable.superClass.draw.call(self,
                                                                        (objtmp.getWidth() - wtmp) / 2,
                                                                        (objtmp.getHeight() - htmp) / 2,
                                                                        wtmp,
                                                                        htmp,
                                                                        mydata, view, dom);
                                                                    // MyDrawable.superClass.draw.call(self,2 ,2, objtmp.getWidth() - 4, objtmp.getHeight() - 4, mydata, view, dom);
                                                                } catch (error) {
                                                                    console.warn(error)
                                                                }
                                                            }
                                                        });
                                                        //注意这里实例化构造传入了参数，ImageDrawable(image, stretch, colorTint, rect)原本有4个可以传参！
                                                        switch (objtmp.getClassName()) {
                                                            case 'ht.ui.Button':
                                                                objtmp.setIconDrawable(new MyDrawable(cellItem.icon));
                                                                objtmp.setIconStretch('fill');
                                                                // objtmp.setIcon(cellItem.icon)//setIconDrawable
                                                                objtmp.setText('');
                                                                objtmp.setBorder(null);
                                                                break;
                                                            case 'ht.ui.ToggleButton':
                                                                break;
                                                            case 'ht.ui.LinkButton':
                                                                if (item.enableCopy) { //列定义中"enableCopy":true一定会进入到这里，而"drawCell"也可能会到这里，取决于行数据的type
                                                                    objtmp.setIcon('rgba(0,0,0,0)');
                                                                    defineClass_DatabindingsImageDrawable();
                                                                    objtmp.setHoverIconDrawable(new DatabindingsImageDrawable(nodeData.ca('hoverTextIcon'), {
                                                                        'icon-background': nodeData.ca('hoverTextIconColor'),
                                                                        'text': nodeData.ca('hoverTextIconText')
                                                                    }));
                                                                    objtmp.setHTextPosition('left');
                                                                    objtmp.setTextColor(nodeData.ca('copyTypeTextColor'));

                                                                    // objtmp.setAlign('left');
                                                                    objtmp.setAlign(nodeData.ca('centerAlign') ? 'center' : 'left');

                                                                    objtmp.setPadding(0);
                                                                    objtmp.setIconWidth(nodeData.ca('hoverTextIconSize')[0])
                                                                    objtmp.setIconHeight(nodeData.ca('hoverTextIconSize')[1])

                                                                    //230830，点击复制后，可以粘贴
                                                                    objtmp.on('d:mouseup', (e) => { //这里不能是onOnce，否则事件只会触发第一次
                                                                        i.copyToPaste(cellItem.text, true, '复制成功！');
                                                                    })
                                                                }
                                                                objtmp.setText(cellItem.text);

                                                                //参照table_ui（待验证测试！），设定表格table的行row data的tag为名称 + id，好体现在寻址url中
                                                                col.getId() == 1 && data.setTag(data.getId() + '.' + cellItem.text);


                                                                break;
                                                            case 'ht.graph.GraphView':
                                                                if (nodeData._multiRequestingLeft == undefined) nodeData._multiRequestingLeft = 0;
                                                                iotos.addChildDataModel(nodeData /* data*/ , objtmp, 'ui' + nodeData._multiRequestingLeft); //230401，传入从dm改成gv
                                                                nodeData._multiRequestingLeft += 1; //计数

                                                                //240521，为了支持树表单元格内嵌页面且是相对路径的情况！
                                                                cellItem.display = i.toAbsDisplayURL(nodeData, cellItem.display);
                                                                nodeData.ca('innerDisplays').push({
                                                                    cellPos: {
                                                                        rowId: data.getId(), //行索引
                                                                        colId: index //列索引
                                                                    },
                                                                    display: cellItem.display
                                                                })

                                                                loadDisplay(objtmp, cellItem.display, cache, function(json, dm, gv, datas) {}, {
                                                                    renderData: nodeData,
                                                                    renderGv: gv,
                                                                    multiDistinctIndex: nodeData._multiRequestingLeft - 1 //230612，此前是col.getId()，显然如果同一列多个不同行都有内嵌，势必造成keyURL重复！
                                                                });
                                                                objtmp = new ht.ui.HTView(objtmp);
                                                                break;
                                                        }
                                                        control.addView(objtmp, {
                                                            height: columnDrawCellData.height ? columnDrawCellData.height : '100% - 10', //'wrap_content','match_parent'
                                                            width: columnDrawCellData.width ? columnDrawCellData.width : 'match_parent', // 'wrap_content','match_parent'
                                                            // marginRight: 0, //nodeData.ca('lastGap'),
                                                            // marginLeft: 0    //注意，如果这里设置了marginLeft、marginRight为固定值，那么后面设置setGap就无效了！
                                                        });
                                                        control.setAlign(nodeData.ca('centerAlign') ? 'center' : 'left');
                                                        control.setVAlign('middle');
                                                        control.setGap(nodeData.ca('itemsGap')); //为了让这里的设置有效，需要将前面的marginRight、marginLeft去掉设置
                                                    })
                                                    control.setMargin([0, nodeData.ca('lastGap'), 0, nodeData.ca('lastGap')])
                                                } else { //同一列有些行的数据不是对象结构的数据，而直接是字符串，那么就用字符串显示！
                                                    //240718，旧版，文字数组的索引1为内容颜色，索引0为标题颜色，新版反过来！
                                                    let colortmp = nodeData.ca('tableTextColor')[nodeData._i_isOldVersion ? 1 : 0];
                                                    ht.Default.drawText(g, dataCell, nodeData.ca('font'), colortmp, x, y, w, h, 'center', 'left');
                                                    return;
                                                }
                                            }
                                            return control.getView()
                                        }
                                    };
                                } else if (1) {
                                }
                        }
                    }
                });

                let toberemoved = [],
                    ratiosSum = 0,    //240716，(-1,0)、(0,1)之间都累加起来，
                    autoRatioColumns = []; //240716，所有设置了0的列图元对象，用来在剩下的宽度和比例中，去均分！-1用来隐藏，0用来均分，为了跟grid的配置保持一致！
                columnModel.getDatas().forEach((child, index) => {
                    //240712，去掉reload不为true的限制！也就是说勾选触发reload重加载时，也要执行这里。之前专门不让，不知何故，反正发现会导致加载后列宽反而不正常了，无法铺满！
                    if ( /*data.ca('reload') != true && */ index < data.ca('columnWidths').length) { //重新加载时，不要初始化改变宽度，宽度以用户界面对表格头拖放的为准
                        let wtmp = Number(data.ca('columnWidths')[index]);
                        if(nodeData._i_isOldVersion){
                            //240717，兼容旧的逻辑
                            child.setWidth(Number(data.ca('columnWidths')[index])); 
                            child.setVisible(wtmp !== 0); 
                        }else{
                            if(wtmp > 0 && wtmp < 1) wtmp = -wtmp;  //240716，原始组件支持负数来设置剩余比例，现在兼容负数和正数的0.x都能设置比例！
                            if(wtmp > -1 && wtmp < 0) ratiosSum += wtmp;    //240716，累加比例的列的比例值。
                            if(wtmp == 0) autoRatioColumns.push(child);   //240716，所有设置0的列，都要在剩余宽度或者剩余比例去平分了！
                            else if(wtmp === 1) child.setWidth(-1); //240719，值为1时，就是-1，铺满！
                            else child.setWidth(wtmp); //231005，为了支持合并到第一项批量配置，数字数组改成了字符串数组，那么对于值需要转换回数字才行！
                            child.setVisible(wtmp !== -1);  //240716，之前是 !== 0 ,即0用来隐藏，现在-1才隐藏。0用来均分剩余。
                        }
                    }
                    if (index < nodeData.ca('columns').length) {
                        let columnData = nodeData.ca('columns')[index]
                        columnData && columnData.displayName && child.setDisplayName(nodeData.ca('showColumnIndex') ? index + ':' + columnData.displayName : columnData && columnData.displayName)
                        if (index == nodeData.ca('columns').length - 1) {
                            child.setAlign('center');
                        } else {
                            child.setAlign(data.ca('centerAlign') ? 'center' : 'left');
                        }
                        //单元格字体及颜色
                        //240718，旧版，文字数组的索引1为内容颜色，索引0为标题颜色，新版反过来！
                        let defaultColor = nodeData.ca('tableTextColor') && nodeData.ca('tableTextColor')[nodeData._i_isOldVersion ? 1: 0];
                        child.getLabelColor = (value, data, state) => {
                            if (value) { //data.getId() == 2 && index == 1，指定某行某列的字体颜色！
                                let cb = new Function('return ' + nodeData.ca('colorFilterFunc'))()
                                let ret = cb && cb(nodeData, data, child, index, value)
                                let colortmp = ret ? ret : defaultColor;
                                return colortmp;
                            } else {
                                return defaultColor;
                            }
                        }
                    } else {
                        toberemoved.push(child); //记录需要被移除的图元，注意不能直接在这里移除，会影响未完成的循环！
                    }
                });

                //根据标记移除图元
                toberemoved.forEach((child, index) => {
                    columnModel.remove(child);
                });

                //240717，旧的逻辑不走这里！
                if(!nodeData._i_isOldVersion){
                    //240716，设置宽度为0的列，在剩余宽度自动平分。这样就跟grid的设置规则完全统一了，而且非常便利！
                    let ratiotmp = -((ratiosSum - (-1)) / autoRatioColumns.length);
                    autoRatioColumns.forEach(column=>{
                        column.setVisible(ratiotmp != 0);   //240716，需要加上这样，因为如果其他列的0~1配置，已经加起来等于1了，这里设置为0，也没提空间！但是setWidth(0)不会隐藏列显示，要setVisible(false)才行！
                        column.setWidth(ratiotmp);
                    });
                }
            }

            //240224，加上入参，当前i.md传入的e
            function initRows(e = null) {
                //230303，更新背景显示，空图标还是背景色
                data.fp('a:background', null, data.ca('background')[0]);    //240718，背景颜色升级成了数组，索引0为内容背景色，索引1为表格头背景色。

                /*240219，容器组件动态切换内嵌页时，需要清理此前缓存的内嵌图元，否则会出现比如属性继承面板中，还残留上一次内嵌的属性配置！注意，当前对于tab页签的页签内嵌页动态变化暂未针对性处理！
                因为目前treeTable还没有i.md，所以这里单独copy过来处理！*/
                data._i_innerDatas = {};

                /*240224，传入当前触发的属性名称，主要是当'a:lastItemRowsText'过来时，反向关联选择适，比如传入值 [0, 0, 0, 'shadowBorder', 0, 0, 'background', __upper: ƒ]，
                避免在里面调用dataModel.clear()将原先的勾选给去掉了！！*/
                if (e.property == 'a:lastItemRowsText' && e.oldValue != '__init__') dataModel._i_relativeAttrChoosing = true; //240224，标记置位
                dataModel.clear(); //tips 240224，这里会导致反向关联后回到连线操作属性面板此前的勾选被去掉！
                dataModel._i_relativeAttrChoosing = undefined; //240224，复位

                let indextmp = 0,
                    treeLinedAttr2IdTmp = {}; //240216，行keyURL与行数据id的键值对对象

                /*对于非[[],[]]，也非[{rowData:[],children:[]},{}]格式，而是常规数据库返回结构[{},{}]时，通过traverseTreeTable转换成treeTable支持的
                [[],[]]格式，存放到data._i_treeTableTypedArr中，用于给到formatComboboxTree使用！*/
                data._i_treeTableTypedArr = [];
                dataModel._i_rowNodeId2Data = {}; //240214，初始化

                data._comboboxDatas = []; //treeTable的树形格式到下拉框combobox版本的数据格式
                //230905，默认ID字段为"id"，现加上配置由idField来填入，默认值为'id'
                function traverseTreeTable(dataArray, parentNode = null, idField = data.ca('idField') ? data.ca('idField') : 'id') {
                    if ((dataArray == undefined || !isArrayFn(dataArray))) {
                        //230324，打印错误前加上条件parentNode == null &&，因为递归遍历到底时出现很正常，但是初始就出现就有问题了！
                        parentNode == null && console.warn(parentNode, 'datas error：\r\n' + JSON.stringify(data.ca('datas'), undefined, 2));
                        return
                    }

                    dataArray.forEach((item, index) => {
                        if (item == undefined) {
                            console.warn('item ' + index + ' null???', dataArray);
                            return;
                        }
                        indextmp += 1; //用于显示全局自增ID，从1开始！同一个数据模型dataModel中，setId()肯定得全局唯一
                        let datatmp = dataModel.getDataByTag(indextmp)
                        if (datatmp == undefined) {
                            datatmp = new ht.Data(); //创建行数据对象
                            parentNode && datatmp.setParent(parentNode);
                            datatmp.setId(indextmp); //column.setName('id')设置后，对应列就自动显示每行data图元的id，通过这里setId()可以设定循环中的初始值！
                            if (item[idField] == undefined || data.ca('rowsIdReset')) item[idField] = indextmp; //回写到数据中，注意可能隐藏的BUG：如果id部分传入，那么没传入的部分会自动被行编号id填充，可能造成重复！
                            datatmp.did = item[idField];

                            //240213，这里加上映射，避免后面循环遍历，极大影响性能！
                            if (!dataModel._i_rowNodeId2Data) dataModel._i_rowNodeId2Data = {};
                            dataModel._i_rowNodeId2Data[datatmp.did] = datatmp;

                            dataModel.add(datatmp);
                        }

                        /*230122 将传入的对象数组，其中对象对应的当前行数据，column列的name字段按照对象的字段key进行匹配获取其值，作为当前行指定列的值，注意，适用于文本key-value格式，常见于数据库
                        查询返回最常见的对象包数组的格式！*/
                        function __toRowArrayByField(rowObject) {
                            let fields = i.keys(rowObject),
                                rowArr = [];

                            /*231220，之前是用nodeData.ca('columns').forEach来遍历，这样会导致如果树表格datas赋值的是key-value的对象列表，那么被转换成数组列表后，
                            数据的长度会按照列定义的来，而不是完整数据字段的数量来了！毕竟显示的有限，详情的所有字段肯定多余显示的表格字段！*/
                            let columnstmp = nodeData.ca('columns'),
                                columnFieldsTmp = nodeData.ca('columnFields');
                            columnFieldsTmp.forEach((field, idx) => {
                                //230904，去掉条件|| idx == xxx，因为最后一列可以不是操作列，如果不去掉条件，会导致匹配到字段的内容就无法显示了！
                                if (idx == 0 /*|| idx == nodeData.ca('columns').length - 1*/ ) return;

                                let column = columnstmp[idx];
                                rowArr[idx - 1] = ''; //首先赋空值
                                if (column && column.name) {
                                    console.assert(column.name == field); //231220，列定义的name字段名与columnFields对应索引的字符串名称是一对一对等的！
                                    let fieldIndex = fields.indexOf(column.name);
                                    if (fieldIndex != -1) {
                                        //230904，最后一列如果是操作列，且配置的name字段有匹配到时，虽然还是无法显示内容，但是日志提示出来！
                                        if (nodeData.ca('lastItems') && nodeData.ca('lastItems').length > 0 && idx == nodeData.ca('columns').length - 1) {
                                            console.error('WARN: field', column.name, 'matched at the last column which has been used as operator', nodeData.ca('lastItems'));
                                        }

                                        rowArr[idx - 1] = i.values(rowObject)[fieldIndex]
                                    }
                                } else { //231220，数据字段长于列表的显示字段时
                                    let fieldIndex = fields.indexOf(field); //231220，此时columns列定义已经没有了，就用columnsField中的字段！
                                    rowArr[idx - 1] = i.values(rowObject)[fieldIndex]
                                }
                            });
                            return rowArr;
                        }
                        let rowArrayByField = [];
                        if (!isArrayFn(item) && item.rowData == undefined) { //tips added 230304，格式为[{key:val},{key:val}]的诸如常见的数据库查询二维表格式
                            rowArrayByField = __toRowArrayByField(item);
                            let itemtmp = {};
                            itemtmp.rowData = rowArrayByField;
                            itemtmp.children = [];
                            itemtmp.id = datatmp.did;
                            nodeData._i_treeTableTypedArr.push(itemtmp);
                        }
                        datatmp.rowData = isArrayFn(item) ? item : item.rowData ? item.rowData : rowArrayByField;

                        __adjustDataString(datatmp.rowData);
                        function __adjustDataString(rowData) {
                            function __removeCRLF(str) {
                                return str.replaceAll('\n', '\r');
                            }
                            rowData.forEach(item => { // {rowData:[item,[sub]]}
                                if (isArrayFn(item)) {
                                    item.forEach((sub, index) => {
                                        if (typeof(sub) == 'string' && sub.indexOf('\n') >= 0) item[index] = __removeCRLF(sub), console.warn('替换字符串中的\\n为\\r：', '"' + sub + '"', rowData);
                                    });
                                }
                            });
                        }

                        //1、行数据中正常元素数据（并非对象类型让列去drawCell），且该列的定义没有“drawCell”字段时，那么直接在此循环中给当前行赋值：
                        let hasChildTreeRow = false;
                        nodeData.ca('columns').forEach((c, i) => { //遍历每一列，当前行数据对应到各个列
                            datatmp['control' + i] = null; //清空列的缓存信息，让其执行一次刷新
                            datatmp.lastControl = null; //清空列的缓存信息，让最后一列的“操作”也能按配置刷新一遍
                            if (c && item && i != 0) {
                                let attrtmp = c.name ? c.name : c.displayName,
                                    itemObjBak = item; //231015，对于[{field:value},{}]格式的数据，因为下面将item转换成[value1,value2]格式了，这里先备份，为了让dataFilterFunc起作用！
                                if (
                                    isArrayFn(item) ||
                                    item.rowData == undefined //230122 对应上面，如果此时item元素并非数组，而且也没有rowData字段，那么就当作是对象数组格式！
                                ) { //是数组类型，则错开1列获取的行数据存在（非空数组）且不是对象类型[]或{}时，当字符串直接显示
                                    if (item.rowData == undefined) item = datatmp.rowData; //230122 对象数组格式，就用前面赋值来代替这里参与运算的item，保持后续逻辑不动！
                                    //240109，将item[i - 1] && 修改为item[i - 1] !== undefined &&，否则值为数值0时显示不出来！！需要加上引号什么的才行！
                                    if (item[i - 1] !== undefined && typeof item[i - 1] != 'object') {
                                        /*230817，此前这里是给item[0]，暂未回顾深究是什么原因，继续保持，但是因为存在{type:'graphicView',display:'xxx'}这样的行数据存在且作为
                                        id列紧随的第二列，因此直接获取item[0]或者item.rowData[0]，就会通过data.setName()设置成了对象！从而autoTag()就会报错！！*/
                                        let nmtmp = item[0];
                                        /*230818，存在item[0]为['表单属性']这种情况，不一定都是{'type':xxx,'display':'xxxx'}，而前者直接赋值能被识别和提取，比如在连线弹窗的节点
                                        文字显示，因此需要兼容，否则连线弹窗节点显示异常！*/
                                        if (isObject(nmtmp) && !isArrayFn(nmtmp)) {
                                            nmtmp = nmtmp['type'] ? nmtmp['type'] : '[object]';
                                            console.warn('WARN: object typed row data name!!', nmtmp, item, nodeData);
                                        }

                                        //240110，nmtmp改成isArrayFn(nmtmp) ? nmtmp[0] : nmtmp，因为在连线操作弹窗中属性勾选时，发现有name为数组的情况，比如['xxx']
                                        if (i == 1) {
                                            /*240616，还是从.setDisplayName()改回成.setName()，否则会出现比如单表格的单选列表，没法选中的情况！比如双击tab页签容器组件（displays/demo/3-示例/01-界面应用/01-园区招商租赁/空间管理/房源图.json）
                                            弹出的内嵌页单选树表时，点击没法单选选中，即便后面某处看似对应的.getName()同步改成.getDisplayName()也不行！！！！至于改回.setName()后，是否引起bug，否则之前就不会改用.setDisplayName，有待进一步观察分析！！*/
                                            datatmp.setName(isArrayFn(nmtmp) ? nmtmp[0] : nmtmp); //230304，此前是i==1时进行setName设置，其他的才进行后面a赋值，现在对于i为1也进行a赋值，便于统一根据a好查找（select选中相关）
                                        }

                                        //230830，将下面datatmp.a()单元格赋的值，由原始内容，经过过滤函数处理一下再返回，默认返回的还是原内容。主要用来将1、0等数据转换成启用、禁止等显示！
                                        let cb = new Function('return ' + nodeData.ca('dataFilterFunc'))();
                                        //240616，之前这里掉了参数c，加上了！！
                                        let filteredValue = cb ? cb(nodeData, datatmp, c, i, item[i - 1]) : item[i - 1];

                                        datatmp.a(attrtmp, filteredValue /*item[i - 1]*/ ); //默认第1列为序号（索引为0）、第2列为树节点。//230830，原数据经过过滤函数处理。
                                        if (i >= 1) {
                                            if (item.rowData) item.rowData[i - 1] = filteredValue; //231012，这样才生效貌似，tips 231015，对于[{rowData:[],children:[]},{}]格式的数据，为支持过滤函数。
                                            else if (isArrayFn(item)) {
                                                item[i - 1] = filteredValue; //231015，对于[[],[],[]]格式的数据，为支持过滤函数。
                                                //231015，注意，对于下面还有一处没有做这样的处理，是否会有问题，暂未深究！！
                                                if (isObject(itemObjBak) && !isArrayFn(itemObjBak)) { //231015，对于[{field:value},{}]格式，需要到原始的对象{}数据进行修改。
                                                    itemObjBak[attrtmp] = filteredValue;
                                                }
                                            }
                                        }
                                    }
                                } else if (item.rowData && item.rowData[i - 1] != null) { //是对象，且有rowData字段并且字段对应内容是非空数组，此时就可以带子行！
                                    /*230817，此前这里是给item[0]，暂未回顾深究是什么原因，继续保持，但是因为存在{type:'graphicView',display:'xxx'}这样的行数据存在且作为
                                    id列紧随的第二列，因此直接获取item[0]或者item.rowData[0]，就会通过data.setName()设置成了对象！从而autoTag()就会报错！！*/
                                    let nmtmp = item.rowData[0];
                                    /*230818，存在item[0]为['表单属性']这种情况，不一定都是{'type':xxx,'display':'xxxx'}，而前者直接赋值能被识别和提取，比如在连线弹窗的节点
                                    文字显示，因此需要兼容，否则连线弹窗节点显示异常！*/
                                    if (isObject(nmtmp) && !isArrayFn(nmtmp)) {
                                        nmtmp = nmtmp['type'] ? nmtmp['type'] : '[object]';
                                        console.warn('WARN: object typed row data name!!', nmtmp, item, nodeData);
                                    }

                                    //240110，nmtmp改成isArrayFn(nmtmp) ? nmtmp[0] : nmtmp，因为在连线操作弹窗中属性勾选时，发现有name为数组的情况，比如['xxx']
                                    if (i == 1) datatmp.setName(isArrayFn(nmtmp) ? nmtmp[0] : nmtmp); //230304，此前是i==1时进行setName设置，其他的才进行后面a赋值，现在对于i为1也进行a赋值，便于统一根据a好查找（select选中相关）

                                    //230830，将下面datatmp.a()单元格赋的值，由原始内容，经过过滤函数处理一下再返回，默认返回的还是原内容。主要用来将1、0等数据转换成启用、禁止等显示！
                                    let cb = new Function('return ' + nodeData.ca('dataFilterFunc'))()
                                    let filteredValue = cb ? cb(nodeData, datatmp, c, i, item.rowData[i - 1]) : item.rowData[i - 1];

                                    datatmp.a(attrtmp, filteredValue /*item.rowData[i - 1]*/ ); //230830，原数据经过过滤函数处理。
                                    if (i >= 1) {
                                        if (item.rowData) item.rowData[i - 1] = filteredValue; //231012，这样才生效貌似。，tips 231015，对于[{rowData:[],children:[]},{}]格式的数据，为支持过滤函数。
                                        else if (isArrayFn(item)) item[i - 1] = filteredValue; //231015，对于[[],[],[]]格式的数据，为支持过滤函数。
                                    }
                                    hasChildTreeRow = true;
                                }
                            }
                        });
                        let nodeTextTmp = datatmp.getName();
                        if (
                            nodeTextTmp && nodeTextTmp.indexOf && nodeTextTmp.indexOf('（') !== -1 && //240213，有中文括号
                            _i.isStringNumber(nodeTextTmp.split('（')[0]) //240213，中文括号左边，就是数字
                        ) {
                            nodeTextTmp = nodeTextTmp.split('（')[0]; //240213，提取左侧的数字
                        }
                        datatmp._i_keyUrlTreeLined = (parentNode ? parentNode._i_keyUrlTreeLined + '>' : '') + nodeTextTmp;
                        treeLinedAttr2IdTmp[datatmp._i_keyUrlTreeLined] = datatmp.did;

                        //3、子行
                        hasChildTreeRow && traverseTreeTable(item.children, datatmp, idField);
                    });
                }
                initColumns();

                //240216，行keyURL与行数据id的键值对对象
                i.update(nodeData, 'a:treeLinedAttr2Id', treeLinedAttr2IdTmp);

                let datastmp = nodeData.ca('datas');
                traverseTreeTable(datastmp);

                //230303清空表格、空树表时，表格的标题头的不能被清空，该有配置的字段要正常显示！
                if (datastmp == undefined || datastmp.length == 0) initColumns();
                let fieldIndexTmp = nodeData.ca('fieldForCombo');
                if (i.isStringNumber(fieldIndexTmp)) {
                    fieldIndexTmp = Number(fieldIndexTmp);
                    if (fieldIndexTmp >= nodeData.ca('columns').length) {
                        console.error('no column index matched with fieldForCombo', fieldIndexTmp, 'and will be replaced by default');
                        fieldIndexTmp = 1;
                    }
                } else {
                    let indextmp = -1;
                    nodeData.ca('columns').forEach((cItem, index) => {
                        if (cItem.name == fieldIndexTmp || cItem.displayName == fieldIndexTmp) indextmp = index;
                    })
                    if (indextmp == -1) {
                        console.error('no column field matched with fieldForCombo', fieldIndexTmp, 'and will be replaced by default');
                        indextmp = 1;
                    }
                    fieldIndexTmp = indextmp;
                }
                if (fieldIndexTmp > 0) fieldIndexTmp -= 1; //fieldForCombo是有默认的序号id列为索引0算起，而i.formatComboboxTree参数rowDataNameIndex是以掐头去尾的内容第一列为索引0算起，因此相差1.
                i.formEventBubblingUpper(data, gv, cache, 'onDatasLoaded', {
                    //非[[],[]]，也非[{rowData:[],children:[]},{}]格式时，通常就是[{},{}]数据库返回结构。并且有转换后结构，那么就用转换后的值，否则用原始值！
                    'dataComboType': nodeData._i_treeTableTypedArr.length > 0 ? i.formatComboboxTree(nodeData._i_treeTableTypedArr, null, 'id', fieldIndexTmp) : i.formatComboboxTree(datastmp, null, 'id', fieldIndexTmp)
                }, true, true); //230324，这里传参的末尾false改成true，提供了onDatasLoaded函数了！

                //更新勾选，避免刷新树表数据后，勾选丢失！如果初始没有内容，undefined或者空数组[]，则不进入到初始化处理逻辑，因为是多余的！
                let matched = data.ca('queryMatched');
                matched && isArrayFn(matched) && matched.length > 0 && data.fp('a:queryMatched', null, matched);
                //230304，更新全部id，注意，这里的id都是数据接口对应id字段的id，并非是索引序号row node data的getId()!!
                let idstmp = []
                cache.table.dm().eachByBreadthFirst(rowNodeData => {
                    idstmp.push(rowNodeData.did);
                });
                i.update(data, 'allRowsIdGet', idstmp); //行数据id
            }

            //230304，要对哪个字段进行查询过滤，可以输入数字字符串或文字字符串
            function __fieldNameQueryRely() {
                let ctmp = data.ca('columns');
                if (ctmp == undefined || ctmp.length < 2) {
                    console.error('column attr config invalid', ctmp);
                    return null;
                }
                let fieldTmp = data.ca('fieldQueryRely');
                if (fieldTmp === undefined || fieldTmp.trim() == '') fieldTmp = "1"; //让进入i.isStringNumber(fieldTmp)逻辑
                if (!i.isStringNumber(fieldTmp)) {
                    let found = false;
                    ctmp.forEach(item => {
                        //240716，加上displayName，因为存在没有定义列name字段的情况，此时也需要能支持通过fieldQueryRely属性指定列。
                        if (item.name == fieldTmp || item.displayName == fieldtmp) found = true;
                    });
                    if (found == false) {
                        console.error('fieldQueryRely param error,', fieldTmp, 'not found in', data.ca('columns'), 'and will use first column instead!');
                        fieldTmp = "1"; //让进入i.isStringNumber(fieldTmp)逻辑
                    }
                }
                if (i.isStringNumber(fieldTmp)) {
                    let num = Number(fieldTmp);
                    if (num == 0 && ctmp[0] && ctmp[0].name == undefined) {
                        num = 1;
                        console.error('index 0 is used by id column,but has not config "name" in it,and will be auto changed to index 1');
                    };
                    let columnConf = ctmp[num];
                    if (columnConf == undefined) {
                        console.error('fieldQueryRely param error,number type should ensure value less than', data.ca('columns').length - 1, 'but given', fieldTmp, 'and will use first column instead!');
                        //240716，加上displayName，因为存在没有定义列name字段的情况，此时也需要能支持通过fieldQueryRely属性指定列。
                        fieldTmp = ctmp[1].name ? ctmp[1].name : ctmp[1].displayName;
                    } else {
                        //240716，加上displayName，因为存在没有定义列name字段的情况，此时也需要能支持通过fieldQueryRely属性指定列。
                        fieldTmp = columnConf.name ? columnConf.name : columnConf.displayName;
                    }
                }
                //注意，这里并未区分null和undefined值，所以在当前方法对应的外部调用时，尽可能不要用===，而用==
                if (fieldTmp == null) console.warn('__fieldNameQueryRely return null!', fieldTmp, ctmp);
                return fieldTmp;
            }
            //字段文字对应的列column索引，注意，是整体减1后的，方便对应rowData里面数组的索引序号！
            function __fieldIndexQueryRelay() {
                let nametmp = __fieldNameQueryRely(),
                    indextmp = 0;
                if (!nametmp) return null;
                data.ca('columns').forEach((item, index) => {
                    //240716，加上displayName，因为存在没有定义列name字段的情况，此时也需要能支持通过fieldQueryRely属性指定列。
                    if (item.name == nametmp || item.displayName == nametmp) indextmp = index - 1;
                });
                return indextmp;
            }

            //240307，data.dm().md正式改成i.md
            _i.md(data, gv, cache, {
                'a:reload': e => {
                    data.ca('reload') && initRows(e);
                    data.ca('reload', false);
                },
                'a:rowsIdReset': e => { //强制刷新按照展示的序号id生成每行记录的id，注意，此id并非是重设树表的序号id，不过有关联
                    e.newValue && initRows(e);
                    data.ca('rowsIdReset', false)
                },
                'a:lastColorsDefault|\
                a:lastColorsHover|\
                a:lastColorsActive|\
                a:lastGap|\
                a:lastItems|\
                a:lastItemRowsText|\
                a:lastRootIgnored|\
                a:lastNodeIgnored|\
                a:lastSingleIgnored|\
                a:font|\
                a:rowHeight|\
                a:lastChildIgnored|\
                a:itemsGap|\
                a:centerAlign|\
                a:columnWidths|\
                a:showColumnIndex|\
                a:tableTextColor|\
                a:copyTypeTextColor|\
                a:lastIngoredRoot|\
                a:lastIngoredNode|\
                a:lastIngoredChild|\
                a:columns|\
                a:columnFields|\
                a:datas': e => {
                    if (e.property !== 'a:datas') {
                        let columnsArrived = e.property == 'a:columns',
                            columnFieldsArrived = e.property == 'a:columnFields';
                        if (columnsArrived || columnFieldsArrived || e.property == 'a:columnWidths') {
                            //240212，只有编辑属性时才启动这里！
                            i.isEditing(nodeData) && _i.enableAttrEditByFirstItem(nodeData, e);
                            if (columnsArrived) {
                                let columnFieldsTmp = nodeData.ca('columnFields');
                                if (!columnFieldsTmp) columnFieldsTmp = [];
                                isArrayFn(e.newValue) && e.newValue.forEach((item, idx) => {
                                    if (item && item.name) {
                                        //240214，现在让插入不会覆盖，如果仅仅是插入赋值覆盖或超出索引自动填充，那么就用i.setArrayIndexValue
                                        // i.arrInsert(columnFieldsTmp, idx, item.name);
                                        i.setArrayIndexValue(columnFieldsTmp, idx, item.name);
                                    }
                                });
                                // i.update(nodeData, 'columnFields', columnFieldsTmp, 'a:columns');    //发现会死循环，于是改成如下：
                                nodeData.ca('columnFields', columnFieldsTmp);
                                i.innerNotifyUpper(nodeData, 'a:columnFields', columnFieldsTmp);
                            } else if (columnFieldsArrived) {
                                let columnstmp = nodeData.ca('columns'),
                                    hasLastButton = nodeData.ca('lastItems') && nodeData.ca('lastItems').length > 0;
                                if (!columnstmp) columnstmp = [];
                                isArrayFn(e.newValue) && e.newValue.forEach((field, idx) => {
                                    //如果有最后的操作按钮列时，columnFields与columns的同步就只到columnWidths数量减1，否则就同步到与columnWidths等数量
                                    if (field && idx <= nodeData.ca('columnWidths').length - (hasLastButton ? 2 : 1)) {
                                        let colObj = columnstmp[idx];
                                        if (colObj) colObj.name = field;
                                        else {
                                            i.setArrayIndexValue(columnstmp, idx, {
                                                name: field
                                            });
                                        }
                                    }
                                });
                                nodeData.ca('columns', columnstmp);
                                i.innerNotifyUpper(nodeData, 'a:columns', columnstmp);
                            }
                        }
                    }

                    //240307，以前是switch case的a:datas下面的，注意前面一串没有break，因此也会执行到这里，但是不包括datas，因此上面部分加上条件，过滤a:datas执行！这里代码追加合并！
                    if (e.newValue)
                    //240121，清空复位内嵌页数据，加载刷新数据时时再填充
                        data.ca('innerDisplays', []);

                    if (e.property == 'a:datas') table.setVisibleFunc(data => { return true }); //设置数据时初始复位显示过滤，否则会导致此前的数据查询导致数据不显示
                    initRows(e);

                    //231016，需要通过定时器在下一个循环操作，否则现在恢复展开，但是增加或插入数据后随后又是合起！不过目前这样在动态添加或删除行数据时就有了闪动的现象，暂不处理！
                    _i.setTimeout(() => {
                        //230913，数据动态修改后，根据配置调整展开状态
                        data.fp('a:expandAll', null, data.ca('expandAll'));
                    }, 0);
                },
                'a:dataAdd': e => { //【只写】230225，追加一条记录，而datas为整体覆盖，这里是追加
                    if (e.newValue == null) return; //230319，初始为null的过滤出去，否则当成对象数据追加了！
                    let oldDatas = data.ca('datas'),
                        dataIn = isArrayFn(e.newValue) ? e.newValue : [e.newValue];
                    //231209，加上条件&& !_i.isSubObjsAll(dataIn)，对于对象key-value的格式，为[{},{},{}]，而不是[[],[],[]]
                    if (!_i.isSubArraysAll(dataIn) && !_i.isSubObjsAll(dataIn)) dataIn = [dataIn]; //231205，兼容传入单个行数据的数组，也能传入多行数据的数组（数组的数组）
                    console.assert(isObject(dataIn));
                    i.update(data, 'datas', oldDatas ? [...oldDatas, ...dataIn] : dataIn);
                    //230225，偶尔还会报错，放到上面a:datas的initRows后面还是一样！

                    let idxtmp = data.ca('datas').length,
                        datatmp = table.dm().getDataById(idxtmp);
                    table.scrollToIndex(table.getEndRowIndex()); //230225，滚动到新最后一行 ，目前发现有触发滚动但是不到底部！！
                },
                'a:singleRootOrChild': e => { //注意，该属性就是要编辑状态下手动操作起作用，自动加载不要自动触发！
                    data.ca('lastSingleIgnored', data.ca(e.newValue ? 'lastRootIgnored' : 'lastChildIgnored'));
                    initRows(e);
                },
                'a:fieldQueryRely|\
                a:checkSelected': e => { //选中的行id列表rowId，注意，并非data.getId()/._id；数字去找对应的字符串
                    if (e.property == 'a:checkSelected') {
                        _i.isEditing(data) && _i.enableAttrEditByFirstItem(data, e); //240214，也加上条件_i.isEditing(data) &&，减少不必要的性能损耗！
                        //240212，旧的长度大于1，新的长度等于1，这个时候就不进行后续处理。因为这种情况会交给enableAttrEditByFirstItem再次进来的，并且newValue长度为1，oldValue长度也为1而不是大于1。
                        if (e.oldValue && e.oldValue.length > 1 && e.newValue.length == 1) return; //240307，换成i.md后，这里break改成return
                        if (e.newValue && e.newValue.length !== 0 && (
                                e.newValue[e.newValue.length - 1] === undefined ||
                                (e.oldValue && e.oldValue.length === 1 && e.newValue.length == 1 && typeof(e.newValue[0]) == 'object')
                            )) return;
                    }
                    i.update(data, 'checkIndexsGet', i.getIndexByRowId(table, e.newValue));
                    if (data._initAttrOnly == true) {
                        data._initAttrOnly = undefined;
                        return
                    }

                    let matched = [],
                        indextmp = __fieldIndexQueryRelay();
                    if (indextmp === null) indextmp = 0;
                    let checks = data.ca('checkSelected');
                    data._i_rowNodeDatasChecked = []; //240214
                    checks && checks.forEach && checks.forEach(id => {
                        let row = table.dm()._i_rowNodeId2Data[id];

                        //230128，行数据对应rowData下面的数组（通常有children），或直接简化成数组（无下级children的情况）
                        let textMatching = row.rowData ? row.rowData[indextmp] : row[indextmp];
                        //240213，加上data.ca("useTreeLined") ? table.dm()._i_rowNodeId2Data[id]._i_keyUrlTreeLined，根据行数据id（非索引），获取行图元对象，然后获取keyURL属性！省去遍历影响性能！
                        if (row && matched.indexOf(textMatching) == -1) {
                            if (data.ca("useTreeLined")) {
                                let rowNodeDataTmp = table.dm()._i_rowNodeId2Data[id];
                                if (rowNodeDataTmp.isEmpty()) {
                                    matched.push(rowNodeDataTmp._i_keyUrlTreeLined); //240213，加上rowNodeDataTmp.isEmpty()，去掉节点，保留底层节点
                                    data._i_rowNodeDatasChecked.push(rowNodeDataTmp); //240214，这种情况下，直接定位了勾选项的图元对象，不需要queryMatched中遍历极其浪费性能的方式再去查找！
                                }
                            } else {
                                matched.push(textMatching); //240212，加上&& matched.indexOf(textMatching) == -1，避免重复！
                            }
                        }
                    });
                    let _eventCheckSelectedTmp = data._eventCheckSelected;
                    i.fa(data, 'queryMatched', matched, gv, cache, true, false);
                    data._eventCheckSelected = _eventCheckSelectedTmp;
                    i.update(data, 'queryMatched', matched);
                },
                'a:queryMatched': e => { //由字符串来完整匹配
                    if (!runningMode() && e.newValue && e.newValue.length === 0) {
                        let nodeForInheritCfg = i.topData(data)._i_currentNode;
                        if (nodeForInheritCfg && i.topData(nodeForInheritCfg) === nodeForInheritCfg) {
                            let attrsFormed = i.attrsInheritFormed(nodeForInheritCfg),
                                attrsAllNeed = [],
                                othersTmp = [];
                            if (attrsFormed.length > 0) {
                                attrsAllNeed = [...attrsFormed, ...i.getAttrsLinedTo(nodeForInheritCfg, true, true), ...i.getInheritRecordFromInner(nodeForInheritCfg)];
                                attrsAllNeed = [...new Set(attrsAllNeed)]; //去重
                                attrsAllNeed.forEach((attr, idx) => {
                                    attrsAllNeed[idx] = i.autoPrefixed(attr);
                                    if (attrsFormed.indexOf(attr) == -1) othersTmp.push(attr);
                                });
                                _i.openDialog('displays/develop/uiotos/editor/widgets/dialog/ensure.json', editor.gv, {
                                    onInit: function(data, gv, cache, formAttrs) {
                                        data.ca(_i.np(_i.attr(formAttrs, 'a:footerButtonsText')), ['不继承', '继承']);
                                        let othersList = othersTmp.length ? `\n（以下是其他依赖项，包括连线操作或上层等使用到）\n\n${othersTmp.join('\n')}` : '';
                                        data.ca(_i.np(_i.attr(formAttrs, 'a:value')), `以下属性已继承且设置了form/formValue绑定：\n\n${attrsFormed.join('\n')}\n\n清空勾选后，以上属性将丢失绑定信息无法再自动继承！是否保留自动继承项？` + othersList);
                                    },
                                    onOk: function(data, gv, cache, form) {
                                        nodeData._eventCheckSelected = undefined; //240220，发现这里要复位，否则下面勾选进不去！
                                        i.update(nodeData, 'a:queryMatched', attrsAllNeed); //240220，注意，这里一定要用i.update逐层向上同步赋值，而不是data.ca('queryMatched',xxx)，因为上层比如属性继承面板对话框需要用到这里的表单值去判断当前勾选的变化！
                                    },
                                    onCancel: function(data, gv, cache, form) {},
                                    onFinally: function(data, gv, cache, form, isOk) {}
                                }, '保持自动继承项？', [600, 360], 0.5);

                                return;
                            }
                        }
                    }
                    //240212，只有编辑属性时才启动这里！
                    i.isEditing(data) && _i.enableAttrEditByFirstItem(data, e);

                    let attrs = e.newValue,
                        rawCheckedIds = data.ca('checkSelected'), //240212，前面已经设定的勾选的行ID列表
                        checked = [],
                        ids = [],
                        fieldNameRely = __fieldNameQueryRely();
                    if (attrs == undefined || !isArrayFn(attrs)) attrs = [];
                    if (data.ca("useTreeLined")) {
                        //240214，存在初始加载initRows时，先进入的是queryMatched，而不是checkSelected，并且初始赋值也是对queryMatched，因此data._i_rowNodeDatasChecked初始可能为空!
                        if ((!data._i_rowNodeDatasChecked || data._i_rowNodeDatasChecked.length == 0) && table.dm()._i_rowNodeId2Data) {
                            data._i_rowNodeDatasChecked = [];
                            for (let rowNodeId in table.dm()._i_rowNodeId2Data) {
                                let rowNodeData = table.dm()._i_rowNodeId2Data[rowNodeId];
                                if (e.newValue.indexOf(rowNodeData._i_keyUrlTreeLined) !== -1) {
                                    data._i_rowNodeDatasChecked.push(rowNodeData);
                                    ids.push(rowNodeId);
                                }
                            }
                        } else {
                            ids = data.ca('checkSelected');
                            console.assert(ids.length !== 0);
                        }
                        checked = data._i_rowNodeDatasChecked;
                    } else {
                        data._i_rowNodeDatasChecked = []; //240212，存放图元对象，对于树节点的树表数据，适合用来还原成keyURL
                        attrs.forEach(attr => {
                            if (!attr) return;
                            let curAttrIds = [], //240212，属性名称匹配，可能对应多条时，当下的匹配对应的一个或多个ID列表
                                cktmp = [],
                                idtmp = [],
                                dataRows = i.treeDatasVisible(cache.table, attr, rowNodeData => {
                                    return fieldNameRely == null ? //===改成==，因为返回undefined时要一样处理！
                                        (nodeData.ca('useTreeLined') ? rowNodeData._i_keyUrlTreeLined : /*rowNodeData.getDisplayName()) : */ rowNodeData.getName()) :
                                        rowNodeData.ca(fieldNameRely);
                                },rowNodeData => {
                                    return fieldNameRely == null ?
                                        (nodeData.ca('useTreeLined') ? rowNodeData._i_keyUrlTreeLined : /*rowNodeData.getDisplayName()) : */ rowNodeData.getName()) :
                                        rowNodeData.ca(fieldNameRely);
                                });
                            data._i_rowNodeDatasChecked = [...data._i_rowNodeDatasChecked, ...dataRows]; //240212，前面已经设定的勾选的行ID列表
                            dataRows.forEach(dataRow => {
                                cktmp.push(dataRow);
                                idtmp.push(dataRow.did);

                                //240212，属性名称匹配，可能对应多条时，当下的匹配对应的一个或多个ID列表
                                curAttrIds.push(dataRow.did);
                            });
                            let multiFound = false;
                            if (curAttrIds.length > 1) {
                                rawCheckedIds.forEach(rowId => {
                                    if (rowId !== undefined && curAttrIds.indexOf(rowId) !== -1) {
                                        multiFound = true;
                                        //前面有多个，现在只保留1个，确保跟checkSelected中的一致！
                                        let idxtmp = idtmp.indexOf(rowId); //唯一这个的索引
                                        // cktmp = [cktmp[idxtmp]];
                                        // idtmp = [rowId];
                                        checked.push(cktmp[idxtmp]);
                                        ids.push(rowId);
                                    }
                                });
                            }

                            //240212，其他情况，直接合并追加，比如设置queryMatch，而checkSelected为空等的情况
                            if (curAttrIds.length === 1 || !multiFound) {
                                checked = [...checked, ...cktmp];
                                ids = [...ids, ...idtmp];
                            }
                        });
                    }

                    //230304，如果清空，那么选中也清空
                    if (attrs && attrs.length == 0) cache.table.dm().sm().cs();
                    if (!data.ca("useTreeLined")) {
                        i.innerNotifyUpper(data, 'checkSelected', ids); //如果没有对attr传入指定value，就用自动获取的formDatas
                    }

                    if (data._initAttrOnly == undefined) {
                        data._initAttrOnly = true;
                        //240212，逐层往上同步
                        // data.ca('checkSelected', ids);
                        i.update(data, 'a:checkSelected', ids);
                    }
                    //恢复默认全显示，注意，要放到checkDatas之前！
                    cache.table.setVisibleFunc(data => { return true });
                    //批量勾选
                    if (!data._eventCheckSelected) {
                        _i.setTimeout(() => {
                            cache.table.dm()._i_isTableCheckingData = true;
                            //240614，不是所有点击都闪一下加载转圈提示，显得很怪！因此加上条件，仅仅页面顶层嵌套容器加载时，才会有转圈提示，否则不会！比如打开连线属性面板，单选、勾选不会转圈提示！
                            !i.loadedState(i.topData(data)) && layer.load(1); //加上加载提示，对于继承面板初始加载，可能会有耗时！

                            //240315，重新checkDatas之前，需要先取消所有勾选选中，否则对于同样属性值设定，都会发生状态反复切换的现象！
                            cache.table.sm().clearSelection();

                            cache.table.checkDatas(checked);
                            layer.closeAll();
                            cache.table.dm()._i_isTableCheckingData = undefined;
                        }, 0);
                        if (checked.length == 0) cache.table.sm().clearSelection();

                    } else {
                        data._eventCheckSelected = false;
                    }

                    //240220，发现得到下一个时序才行，对于开头的不继承-继承弹窗的确定后的自动勾选而言！
                    _i.setTimeout(() => {
                        //240218，勾选/去勾选，实时更新检索结果，并且保持检索状态！
                        data.fp('a:visibleFilterInput', '__checking__', data.ca('visibleFilterInput'));
                    }, 0);

                    // cache.table.checkDatas(checked);
                },
                'a:visibleFilterInput': e => {
                    i.treeDatasVisible(cache.table, e.newValue, dataRow => {
                        //treeTable的树节点列的显示文字就是data.getName()，如果要其他字段列也参与，在这里修改！
                        /*230325，临时加上了支持，默认过滤筛选匹配的字段，是行里面在表格中已配置的列里所有字符串加在一起，再来查是否有字符关键词包含！
                        注意，更好的搜索方式是要支持空格，多个关键词并集！！暂不支持*/
                        let rowTexts = (nodeData.ca('useTreeLined') ? dataRow._i_keyUrlTreeLined : dataRow.getName());
                        // let rowTexts = dataRow.getName();

                        data.ca('columns').forEach(item => {
                            rowTexts = rowTexts + ' ' + dataRow.ca(item.name ? item.name : item.displayName);
                        })
                        return rowTexts; //dataRow.getName();
                    });

                    //240216，获得筛选找到的数据条数，和其中已经勾选了的条数！可以给到上层对话框组件，如果titleText中有|间隔的字符，那么查找结果统计放上去提示！
                    let rowsCountTmp = i.getRowsCheckCount(cache.table.dm());
                    //240216，同步勾选的以及基础行数量。注意，勾选的不能简单就用queryMatched、checkSelected的数组长度，因为可能数组大于实际匹配到能勾选的！
                    i.update(data, 'a:checkCountGet', rowsCountTmp.checkCount);
                    i.update(data, 'a:allRowCountGet', rowsCountTmp.visibleCount);
                    //240216，在属性继承面板中，上层对话框的提示titleText标题中，有|作为间隔，这里将查询匹配的提示加到后面替换显示！
                    let topDataTmp = i.topData(nodeData);
                    if (topDataTmp !== nodeData) {
                        let titletmp = topDataTmp.ca('titleText');
                        if (titletmp && titletmp.indexOf('|') !== -1) {
                            // let newTitle = titletmp.split('|')[0] + '| ' + `找到${visibleCount}条数据，且已勾选${checkCount}项：`;
                            let newTitle = titletmp.split('|')[0] + '| ' + (e.oldValue === '__init__' ? '当前继承统计' : '检索结果') + `：${rowsCountTmp.checkCount}/${rowsCountTmp.visibleCount}（已勾选/总条数）`;
                            topDataTmp.ca('titleText', newTitle);
                        }
                    }

                    //240218，加上条件if(e.oldValue != '__checking__')，避免动态点击时尤其是节点，收起时点击结果点击就展开，体验不好！
                    e.oldValue != '__checking__' && cache.table.expandAll(); //240212，存在初始默认合起的树表，因此一旦搜索，就触发全部展开！
                },
                'a:currentIdSelect': e => { //231005，发现很久之前这里竟然就已经是'a:    '，不小心被删除了？？
                    if (e.newValue == undefined) return;
                    let currentData = cache.table.dm().getDataById(e.newValue),
                        notNumberType = !i.isStringNumber(e.newValue);
                    if (notNumberType) {
                        if (!data.ca('checkSelected') || data.ca('checkSelected').length == 0) {
                            currentData = null; //240611，存在表单操作，没有不做连线勾选，直接点击确定的情况！
                        } else console.assert(0);
                    }
                    _i.setTimeout(() => {
                        //此前未选中时，自动默认选中
                        if (currentData && data.ca('checkSelected').indexOf(Number(e.newValue)) == -1) {
                            cache.table.fireViewEvent({
                                'kind': 'selectData', //事件中clickData对应table.checkData的调用，自定义selectData事件用于确定是选中（非切换）
                                'data': currentData
                            });
                        }
                    }, 0);
                },
                'a:rowsExtraUserInfo': e => {
                    /*tips added 230304，跟allRowsIdGet属性一样都是正常从0开始算，而不是跟行号data.setId()/getId()和lastItemRowsText
                    从1开始，且lastItemRowsText的索引0用途是指定lastButtons的哪个button列操作，恰好用上*/
                    let valtmp = e.newValue;
                    if (valtmp && isArrayFn(valtmp) && __isLastSingleToggleMode()) {
                        valtmp.forEach((item, index) => {
                            let rowNodeData = cache.table.dm().getDataById(index + 1);
                            if (!rowNodeData || !rowNodeData._i_lastButtons) {
                                console.error('treeTable row nodeData with index', index + 1, 'not exist, or operation buttons not found!', cache.table.dm());
                                return;
                            }
                            toggleButton = rowNodeData._i_lastButtons[0];
                            console.assert(toggleButton.getClassName() == 'ht.ui.ToggleButton')
                            if (item == null) { //230306，如果传递过来的有索引是undefined或null，那么表明不覆盖！

                            } else if (item == true) {
                                toggleButton.setSelected(true);
                            } else if (item == false) {
                                toggleButton.setSelected(false);
                            }
                        });
                    }
                },
                'a:background|\
                a:emptyDefaultIcon|\
                a:emptyIconSizeScale|\
                a:emptyIconOpacity': e => {
                    let colortmp = data.ca('background'),
                        visibletmp = !data.ca('datas') || data.ca('datas').length == 0;
                    if(isArrayFn(colortmp)) colortmp = colortmp[0]; //240718，属性a:background升级成了背景色+头背景色数组！
                    let imagetmp = data.ca('emptyDefaultIcon') ? i.getSymbolImage(data.ca('emptyDefaultIcon'), {
                            'background': colortmp,
                            'opacity': data.ca('emptyIconOpacity'),
                            'scale': data.ca('emptyIconSizeScale')
                        }, data) : null;
                    cache.table.setBackground(imagetmp && visibletmp ? imagetmp : colortmp);
                },
                'a:selectAllSet': e => {
                    if (e.newValue) {
                        let ids = [];
                        cache.table.dm().eachByBreadthFirst(rowNodeData => {
                            ids.push(rowNodeData.did);
                        });
                        i.update(data, 'checkSelected', ids, e.property);
                    } else {
                        i.update(data, 'checkSelected', [], e.property);
                    }
                },
                'a:userDataSelfInit': e => { //230329，配合userData初始化data赋值的开关
                    if (!e.newValue) { //如果动态设置为0，那么会将userData的保存的任何值进行清空！
                        data.ca('userData', []);
                    }
                },
                'a:userData': e => {
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
                },
                'a:expandAll': e => { //230913，全局移动到这里，避免勾选闪动！
                    e.newValue ? cache.table.expandAll() : cache.table.collapseAll();
                }
            }, [
                //240315，当将data.dm().md换成i.md统一处理后，这里datas也要初始化用__init__同步初始化，否则会出现打开连线操作属性面板，加载还原初始勾选的属性连线时，发现闪一下就全部都没勾选了！
                {
                    'a:datas': '__init__',
                }, 'a:userData', 'a:expandAll'
            ], e => {
                //240215，主要是用来触发i.getRowsCheckCount(cache.table.dm())，更新上层checkCountGet、allRowCountGet。注意，实测发现需要放到一个异步队列中，否则checkCountGet统计不到，为默认0
                _i.setTimeout(() => {
                    data.fp('a:visibleFilterInput', '__init__', data.ca('visibleFilterInput'));
                }, 0);
            }, cache.table, e => {});
            // 全选时，也能触发bindControls
            i.onSelectAll(table.dm(), (sm, kind, datas, event) => { //230308，直接开放clear事件过来，会导致bindControl连线多选出现问题
                //240213，对于树表去勾选节点，那么要自动移除勾选属性中对应的图元集合！
                if (kind == 'remove') {
                    let checked = nodeData.ca('checkSelected');
                    datas.forEach(rowNodeData => {
                        i.arrayItemRemoved(checked, rowNodeData.did);
                    });
                    //240214，用引用overwrite赋值代替nodeData.ca()，避免触发响应重复执行（下面有__clicked()触发执行），极大影响性能！有待测试！
                    i.arrOverwrite(nodeData.ca('checkSelected'), checked);
                    // nodeData.ca('checkSelected', checked);
                }
                __clicked(event); //240214，也加上event，这样避免在if (e.kind == 'clickData')中重复调用到！

                //240221，清空操作时，也要更新上层对话框（属性继承面板）的显示数字！
                if (kind == 'clear') {
                    data.fp('a:visibleFilterInput', '__checking__', data.ca('visibleFilterInput'));
                }
            }, false);

            return splitLayWhole
        }
        let obj = cache.obj = init();
        i.layoutHTML(obj, data, gv, cache, () => { //231108，表格内嵌容器在表格尺寸变化时能够即时自适应宽度！
        });
    }
    let bordercolortmp = data.ca('borderColor')[0] ? data.ca('borderColor')[0] : 'rgba(0,0,0,0)';
    cache.obj.setBorder(new ht.ui.border.CSSBorder(data.ca('borderWidth'), bordercolortmp));

    cache.obj.setBorderRadius(data.ca('borderRadius'));
    cache.table.setBorder(new ht.ui.border.IndividualLineBorder(1, 0, 0, 0, data.ca('borderColor')[1] ? data.ca('borderColor')[1] : 'rgba(0,0,0,0)')); //上、右、下、左
    cache.table.setRowLineVisible(data.ca('rowLineVisible'))
    cache.table.setColumnLineVisible(data.ca('columnLineVisible'))
    let lineColortmp = data.ca('borderColor')[2] ? data.ca('borderColor')[2] : 'rgba(0,0,0,0)';
    cache.table.setColumnLineColor(lineColortmp); //行列边框线背景色
    cache.table.setRowLineColor(lineColortmp);
    cache.header.setColumnLineColor(data.ca('borderColor')[3] ? data.ca('borderColor')[3] : lineColortmp);//240801，表格头的列分隔线颜色。索引3如果有配置，就是索引3，否则跟行列颜色一样！

    //240715，treeView支持的mode，没有末尾的"single"这项，为了省去multiSelect这个配置项！
    let checkIdxTmp = data.ca('checkMode');
    //240715，下面仅为了兼容multiSelect
    if(data.ca('multiSelect') !== undefined) {
        if(data.ca('multiSelect') === false) {
            checkIdxTmp = checkModeListTmp.indexOf('singleWithoutParent');   //240715，为了兼容之前的配置，设置了单选的，默认checkIdxTmp就是5，相当于单选
            i.update(data,'checkMode',checkIdxTmp); 
        }else{
            checkIdxTmp = 0;    //240715，强制设为0，仅仅是为了下面setSelectionMode传入'multiple'。兼容此前有multiSelect属性且有配置的情况！
            //240715，纯粹为了兼容，如果此前是配置并保存了单选，但是多选属性multiSelect做了勾选，那么就按照勾选来，并自动选择all作为勾选参数！
            if(checkModeListTmp[checkIdxTmp] == 'single') i.update(data,'checkMode',checkModeListTmp.indexOf('all'));    
        }
    }

    cache.table.setCheckMode(checkIdxTmp > 4 ? 'default' : checkModeListTmp[data.ca('checkMode')]);
    //注意，single是扩展增加的，tableView默认不支持，这里是通过对sm的操作来实现单选，且设置合并在一个属性上
    cache.table.sm().setSelectionMode(checkIdxTmp > 4 ? 'single' : 'multiple');

    cache.table.setDragEnabled(data.ca('dragDropEnable'));
    cache.table.setDropEnabled(data.ca('dragDropEnable'));
    cache.table.setDropLineColor(data.ca('dropLineColor'));

    cache.table.setRowBackground(data.ca('rowBackground')[0]);
    cache.table.setHoverRowBackground(data.ca('rowBackground')[1]);
    /*230119，若不去掉这里，那么a:currentIdSelect代码设置选中时，没有深色背景！！但是一旦屏蔽，那么运行状态下交互，特别是有深色背景的情况下的交互，
    选中背景色就不可控且不协调了。注意，实测发现一旦选择了checkMode有勾选，选中的背景颜色就固定白色的这里改变不了貌似*/
    cache.table.setSelectRowBackground(data.ca('rowBackground')[2]);
    cache.table.setFocusRowBackground(data.ca('rowBackground')[2]); //按下的时候背景颜色，否则每次选中后移开焦点后才是前面setSelectRowBackground选中背景色！

    cache.table.setRowHeight(data.ca('rowHeight'));
    cache.header.setHeight(data.ca('headerHeight')) //为啥不起作用？跟布局有关？？
    cache.headerSplit.setPosition(data.ca('headerHeight'));//240719，这样设置表格头高度才有用！！

    //240718，旧版，文字数组的索引1为内容颜色，索引0为标题颜色，新版反过来！
    cache.header.setLabelColor(data.ca('tableTextColor')[nodeData._i_isOldVersion ? 0 : 1]);

    cache.header.setLabelFont(data.ca('font')); //表格头的字体
    cache.header.setVisible(data.ca('headerVisible'));

    //240718，表格头背景色合并到表格背景色属性上，位置为索引1。这里为了兼容此前旧的配置。
    cache.header.setBackground(data.ca('headerBackground') ? data.ca('headerBackground') : data.ca('background')[1]); //230815，表格标题头背景颜色
    
    cache.pagination.setVisible(data.ca('pagesBottomVisible'));
    //240718，旧版，文字数组的索引1为内容颜色，索引0为标题颜色，新版反过来！
    cache.table.setLabelColor(data.ca('tableTextColor')[nodeData._i_isOldVersion ? 1 : 0]);
    cache.table.setLabelFont(data.ca('font'));
    
    //240716，如果是旧的组件，可见与否取决于idColumnVisible属性的配置。
    data._i_isOldVersion && cache.table.getColumnModel().getDatas().get(0).setVisible(data.ca('idColumnVisible'));

    cache.pageButtonGroup.setButtonCount(data.ca('pageButtonCount'));
    cache.obj.setCollapseRegion(data.ca('pageButtonCount') == 0 ? 'second' : null);
    //230815，条纹颜色删除时，用背景色！
    if (data.ca('rowStriped')) {
        /*240718，调整了下，在底层到上层顺序中，背景颜色background → 行背景rowBackground → 行条纹stripeColors，
        如果条纹颜色清楚其中一个，那就用下面的行背景，如果行背景也没有，就用背景色！*/
        cache.table.setRowBackgroundDrawable(new ht.ui.drawable.StripedRowBackgroundDrawable([
            nodeData.ca('stripeColors')[1] ? nodeData.ca('stripeColors')[1] : 
                (nodeData.ca('rowBackground')[1] ? nodeData.ca('rowBackground')[1] : nodeData.ca('background')[0]),
            nodeData.ca('stripeColors')[0] ? nodeData.ca('stripeColors')[0] :
                (nodeData.ca('rowBackground')[0] ? nodeData.ca('rowBackground')[0] : nodeData.ca('background')[0])
        ]));
    } else {
        cache.table.drawRowBackground = cache.drawRowBackground;
    }
    initShadow(cache.obj, data.ca('shadowBorder'), data.ca('shadowColor'), data.ca('shadowEnabled'));
    return cache.obj;
}


//接口组件
function __interface(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'api', 'API接口', () => {
        data.s('label.font', 'bold 26px sans-serif, Arial');
        data.s('label.color', 'rgb(96,172,252)');
    });
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    let nodeData = data;
    //组件默认form绑定的属性
    i.setAttrsFormBinded(data, ['paramKeys', 'paramValues', 'requesting', 'jsonFormat', 'onReceived', 'url', 'enableLoading', 'defaultOpen', 'comment']);
    if (!cache.obj) {
        //241022，初始化默认边框样式。
        data.ca('shadowBorder',[0,0,8]);
        data.ca('shadowColor','rgba(55,125,255,0.50)');

        let urltmp = data.ca('url');
        if (urltmp == undefined || urltmp == []) {
            data.ca('url', ['http://','sys.aiotos.net','api/v1/token']);
        }
        initAppreance();

        //240807，兼容旧的post属性，现在改成httpType
        if(data.ca('post') !== undefined) {
            i.update(data,'httpType',Number(data.ca('post')));
            data.ca('post',undefined);
        }

        //240904，只有在jsonStruct没有配置时，才考虑此前旧属性convertFlatToTree的兼容！
        if(data.ca('jsonStruct') === undefined){
            //240811，参考下面工具函数的兼容操作！
            let curJsonStructType = data.ca('convertFlatToTree');
            if(data.ca('convertFlatToTree') === undefined) curJsonStructType = 0; //此前convertFlatToTree定义时默认值为false。因此如果此前未配置，也是相当于配置了1。
            curJsonStructType = Number(curJsonStructType);
            if(curJsonStructType == 0) curJsonStructType = 1;//240810，必须默认模式为1，否则对参数对象的任意输入，结果字段受限制了！！
            i.update(data,'jsonStruct', curJsonStructType);
            data.ca('convertFlatToTree',undefined); 
        }

        let obj = cache.obj = new ht.ui.HtmlView(); //new ht.ui.TextArea()，230323，日志输出有多行文本切换成html，方便样式设置！
        obj.setBackground('white');
        data._cache = cache;
        if (!data.ca('timeTo') || data.ca('toCurrent') == true) data.ca('timeTo', i.ts2tm((new Date()).getTime()));

        function __clear() {
            if (data._echo) data._echo = null;
        }

        function showContent(text, flat = false, hintType = 0) { //0:edit、1:send、2:recv
            if (isObject(text)) {
                if (flat) {
                    text = convertToFlatJson(text, '.');
                }
                text = JSON.stringify(text, null, 4)
            }
            let types = ['[EDIT]!', '[SEND]>>>', '[RECV]<<<'];
            if (hintType < 0) hintType = 0;
            else if (hintType > types.length - 1) hintType = types.length - 1;
            text = `<div><p style="color:${(()=>{
                switch(hintType){
                    default:
                        return 'black';
                }
            })()}">${i.ts2tm()}<p><p style="color:${(()=>{
                switch(hintType){
                    case 1:
                        return 'rgba(55,125,255)';
                    case 2:
                        return 'rgb(106,151,85)';
                    default:
                        return 'black';
                }
            })()}"><b>${ types[hintType] }</b></p></div>` + `<div style="color:${(()=>{
                switch(hintType){
                    case 1:
                        return 'rgba(55,125,255,0.8)';
                    case 2:
                        return 'rgba(106,151,85,0.8)';
                    default:
                        return 'black';
                }
            })()}">${text}</div>`;
            if (data.ca('echoAppend') == true) {
                if (data._echo == undefined) data._echo = text;
                else {
                    data._echo = data._echo + '<br>' + text
                }
            } else data._echo = text;
            if (cache.htmlObj == undefined) cache.htmlObj = document.createElement('div');
            cache.htmlObj.style = `overflow-y: auto;overflow-x: hidden; height: ${data.getHeight()}px;background:white;padding-left:15px`;
            cache.htmlObj.innerHTML = data._echo + '<div style="height:15px"></div>';
            obj.setContent(cache.htmlObj); //注意，可以传入div element对象，也可以传入outerHTML，但是传入对象才能引用修改，否则后面尺寸变化布局对其修改就不起作用了！
            cache.htmlObj.scrollTop = cache.htmlObj.scrollHeight - cache.htmlObj.clientHeight;
        }

        function initAppreance() {
            data.s('2d.visible', !runningMode()); //编辑状态可见、运行状态不可见
            data.s('label.position', 2); //显示文字在左上，用来编辑状态时显示，运行时不显示。
            data.s('label', data.ca("comment"));
        }

        //修改参数重新请求时，必须先调用这里
        function initParams(changedAttr = null, e = null) { //是哪个属性变化触发进来的
            let urltmp = null,
                urlIsArr = false;
            if (data.ca('url') && isArrayFn(data.ca('url'))) {
                urlIsArr = true,
                data.ca('url').forEach((item, index) => {
                    if(item !== 0 && !item) return; //240828，存在url数组有空的情况！
                    item = String(item);
                    //240301，前后两段中，前者末尾或者后者开头都没有/，那么就自动加，否则就不加斜杠！
                    if(urltmp && urltmp.slice(-1) == '/') urltmp = urltmp.slice(0,-1);
                    if(item && item.slice(0,1) == '/') item = item.slice(1);
                    urltmp = urltmp ? (urltmp + '/' + item) : item;
                });
            } else urltmp = data.ca('url');

            //240510，对于组态自身的后端api接口比如http://localhost:8999/files/list，那么可以省去自身的http://localhost:8999配置，因为配置上了反而会有问题！本地或线上部署会变！
            let firsttmp = urltmp && urltmp.split('/')[0], //举例 files/list?xxx中的files，或者http://xxxx中的https:/
                secondtmp = urltmp && urltmp.split('/')[2]; //对于https://files/list中，判断files，注意对于有http://时，索引1的为空字符串！
            firsttmp = firsttmp && firsttmp.trim().toLowerCase();
            secondtmp = secondtmp && secondtmp && secondtmp.trim().toLowerCase();
            let hostURL = data.dm()._url == 'displays/develop/uiotos/editor/home.json' && urltmp.slice(-9) == 'api/login' ? iotos_host : (api_host ? api_host : window.top.origin);
            if( 
                urltmp &&(                                   
                urltmp.trim().toLowerCase().slice(0,7) == 'http://' || 
                urltmp.trim().toLowerCase().slice(0,8) == 'https://' || 
                urltmp.trim().toLowerCase().slice(0,5) == 'ws://' || 
                urltmp.trim().toLowerCase().slice(0,6) == 'wss://')
            ){
                //传入了"http://files/list?path=xxx"这种情况！（中间缺少主域名比如“sys.aiotos.net/”或者“localhost:8999/”）
                if (secondtmp && (secondtmp.indexOf('.') == -1 && secondtmp.slice(0,9) !== "localhost")) { 
                    let splited = urltmp.split('/');
                    splited[2] = (hostURL.slice(0,4).toLowerCase() == 'http' ? hostURL.split('/')[2] : hostURL) + '/' + splited[2];
                    urltmp = splited.join('/');   //splited.slice(2).join('/'); //因为window.origin带有了http://或https://，那么要去掉原先配置或自动加上的http头！
                }
            }else if(urltmp){
                if(urltmp.slice(0,1) == '/'){
                    urltmp = hostURL + urltmp;
                }else{
                    if(firsttmp.indexOf('.') != -1){
                        urltmp = (data.ca('type') == 'http' ?  'http://' : 'ws://') + urltmp;
                    }else{
                        urltmp = hostURL + '/' + urltmp;
                    }
                }
            }

            //240811，对于主域名后面":8899"这样的，自动作为端口，而不会前后再带上/
            let urlNew = null,
                hasPortSegment = false; //240811，只允许出现一个段有":8999"这样的字符串，第一个遇到的将其作为端口！
                mianHost = urltmp && urltmp.split('/')[2],//240811，相当于http://localhost:8999/index.html中的localhost:8999
                countIdx = 0;
            urltmp && urltmp.split('/').forEach((item,idx)=>{
                //到这里，肯定是完整URL了，再用/分隔，就类似这样了，http:/、''、sys.aiotos.net、':8899'，因此是索引为3的位置！
                if(!hasPortSegment && idx == 3 && item.slice(0,1) == ':' && i.isStringNumber(item.slice(1))){
                    if(mianHost && mianHost.indexOf(':') == -1){    //前面没有:xxx端口！
                        urlNew = urlNew + ':' + item.slice(1); 
                        hasPortSegment = true;
                    }
                }else{
                    urlNew = urlNew ? (urlNew + '/' + item) : item;
                }
            });
            urltmp = data._i_url = urlNew;
            if(!data._i_updateObjectToKeyValues && ['a:jsonStruct','a:paramKeys','a:paramValues'].indexOf(changedAttr) !== -1 && e){
                let isObjInputing = false;
                if(e.property == 'a:jsonStruct' && (e.oldValue === 0 || e.oldValue === 1) && e.newValue >= 2){
                    i.arrClear(data.ca('paramKeys'),[]);
                    i.arrClear(data.ca('paramValues'),[]);
                    isObjInputing = true;
                } //240811，借鉴工具函数的对象、键组、值组，来改造api接口组件这里！！
                i.objectToKeyValues(data.ca('jsonFormat'), data.ca('paramKeys'), data.ca('paramValues'), isObjInputing , data.ca('jsonStruct'));
                data._i_updateObjectToKeyValues = true;
                i.backWriteAttrs(data, {
                    'a:jsonFormat': data.ca('jsonFormat'),
                    'a:paramKeys': data.ca('paramKeys'),
                    'a:paramValues': data.ca('paramValues')
                });
                data._i_updateObjectToKeyValues = undefined;
            }
            cache.requestParam = {
                url: urltmp,
                params: data.ca('dataIsJsonString') ? JSON.stringify(data.ca('jsonFormat'), null, 4) : data.ca('jsonFormat')
            };
            showContent(cache.requestParam, false, 0);
        }

        //请求数据回调函数
        let reponseFunc = function(res, status, isError = false, asyncIndexForResponse = null) {
            if (data.ca('enableLoading')) layer.closeAll();
            let resString = '';
            if (isObject(res)) {
                resString = JSON.stringify(res, null, 4);
            }
            //230913，从data.ca改成i.update，否则嵌套上去的获取不到！
            /*230917，如果返回的是JSON格式，那么就显示json，如果是非json字符串就用字符串！将resString改成了res，还需要进一步观察测试*/
            i.update(data, 'response', ['' + status, res]);
            showContent(isError ? i.ify({
                response: res,
                status
            }, false) : resString, true, 2);
            let animDuration = data.ca("enableRepeat") ? [0] : [data.ca('animDuration')];

            //callback去做返回数据的解析工作
            let cb = new Function('return ' + data.ca('callback'))(),
                rettmp = null,
                paramForResParse = { //参数（一般是给到回调cb）用于response解析并引用设置cache._spanResponse填充value字段！
                    response: cache._spanResponse, //完整时间跨度数组
                    index: asyncIndexForResponse //当前（最后一次）时间片段起始时间点对应的时间跨度数组的索引
                };
            if (cb) {
                rettmp = cb(data, gv, cache, cache.requestParam && cache.requestParam.params, res, asyncIndexForResponse != null ? paramForResParse : null);
            }
            //callback返回非null时，返回值直接给res作为新的response来处理！
            if ((rettmp == null || rettmp == false) && cb && asyncIndexForResponse != null) { //确保是经过了回调处理，并且回调返回为null或false且已传入asyncIndexForResponse的情形
                /*230109，如果callback中没有做解析逻辑，没有任何非nullreturn（或者没有return），且asyncIndexForResponse有传入，则用内
                置逻辑默认支持IOTOS物联中台的数据返回格式进行解析！如果callback中有做解析并返回则用callback中的解析结果，不用内置的！*/
                if (res.data && res.data.length > 0) {
                    cache._spanResponse[asyncIndexForResponse]['value'] = res.data[0].value;
                    rettmp = [cache._spanResponse];
                } else {
                    console.warn('default iotosystem histroy data format check error!!', res);
                    rettmp = [];
                }
            }
            if (rettmp) res = rettmp;

            // 230913， 为了增加事件， 方便嵌套连线指定触发。 为了兼容此前的逻辑， 暂时不动上面的i.updateBindControls()
            i.formEventBubblingUpper(data, gv, cache, 'onReceived', null, true, true, null, false, null,res);
            i.update(data, 'requesting', false);
        }

        async function requesting(enable, asyncIndexForResponse = null) { //asyncIndexForResponse是当异步请求时，做请求和返回的关联
            if (enable) {
                //240204，模拟数据，填写固定数据结构，模拟数据返回！
                if (data.ca('fakeRecvEnabled')) {
                    if (data.ca('enableLoading')) layer.load(1);
                    _i.setTimeout(() => {
                        if (data.ca('enableLoading')) layer.closeAll();
                        reponseFunc(data.ca('fakeApiReceived'), true, false, asyncIndexForResponse);
                    }, data.ca('fakeReturnDelay'));
                    return;
                };

                if (cache.requestParam) {
                    let typetmp = ['GET...','POST...','PUT...','DELETE...'][data.ca('httpType')];

                    //240313，弹窗异常提示下！对于data数据时简单key-value且value为基础类型时，可以转成get的拼接没事，但是如果值有对象或数组，那么当前就判断不能作为get来拼装了！
                    let datatmp = data.ca('dataIsJsonString') ? i.jsonParse(cache.requestParam.params) : cache.requestParam.params;
                    if (typetmp == 'GETTING' && i.isObjNotEmpty(datatmp)) {
                        let hasObjectValue = false;
                        for (let key in datatmp) {
                            let val = datatmp[key];
                            if (
                                i.isObjNotEmpty(val) && key.slice(0, 3) !== '_i_' &&
                                !(isArrayFn(val) && i.isArrSubBaseAll(val)) //240715，允许值有纯简单数组（数组元素没有对象或数组，只有基本类型），这种数组值，可以作为get请求的参数！不提示异常！
                            ) hasObjectValue = true;
                        };
                        hasObjectValue && _i.alert(`当前API接口为Get请求且参数值存在对象，请确保是否正确，或者是否应该为Post请求。\n${cache.requestParam.params}` + _i.commonTip(data), '错误', false, null, null, [400, 280]);
                    }

                    //230913，从data.ca改成i.update，否则嵌套上去的获取不到！
                    i.update(data, 'response', ['', '']);
                    showContent(typetmp + " " + cache.requestParam.url, 1);
                    asyncIndexForResponse == null && data.ca('waitingHint') != undefined && i.updateBindControls(data, data.ca('waitingHint'), data.ca('noAnim') ? [] : data.ca("waitingAnim"), !data.ca("enableRepeat") && !data.ca('noAnim'));
                    $.ajaxSetup({
                        xhrFields: {
                            withCredentials: data.ca('withCredential')
                        }
                    });

                    try {
                        if (nodeData.ca('enableLoading')) {
                            //231227，加载中因为是同步阻塞交互，页面初始加载过程中最好还是不显示！
                            let topNodeTmp = _i.topData(nodeData);
                            if (topNodeTmp == nodeData || !topNodeTmp || topNodeTmp._i_isCompleteLoaded) layer.load(1);
                        }
                        /*jquery ajax请求*/
                        let ajaxParam = {
                            type: ['get','post','put','delete'][nodeData.ca("httpType")], //240809，修改！nodeData.ca('post') ? 'post' : 'get',
                            url: cache.requestParam.url,
                            contentType: nodeData.ca('contentType'), //application/x-www-form-urlencoded、application/json、text/xml、text/plain
                            //230803，条件需要加上|| cache.requestParam.params == '{}'，否则get请求对于空data参数结果带入了data:"{}"，将?{}加入到http get的url，会报错跨域cors诡异问题！！
                            data: cache.requestParam.params == {} || cache.requestParam.params == '{}' || cache.requestParam.params == null ? undefined : (() => {
                                //230816，对于http get请求，这里key-value
                                return data.ca('httpType') >= 1 ? cache.requestParam.params : _i.toHttpGetTypedParams(cache.requestParam.params);
                            })(), //data.ca('dataJsonString') ? JSON.stringify(cache.requestParam.params) : cache.requestParam.params,
                            dataType: nodeData.ca('dataType'),
                            jsonpCallback: data.ca('dataType') == 'JSONP' ? 'jsonpCb' : undefined,
                            success: function(data, status) {
                                //230211，兼容jsonp http ajax get通过apijson后台通用接口返回的格式
                                if (nodeData.ca('dataType') == 'JSONP') { //以下为了兼容字段，避免修改本地此前的字段结构
                                    data = i.jsonParse(data);
                                    status = data.status;
                                    data.code = data.status;
                                }

                                //240201，指定识别登录token，当post请求返回有指定token识别字段层级结构下，有数据时，被当做登录接口缓存token
                                let tokenFields = nodeData.ca('tokenFieldParsed');
                                if (tokenFields && !!tokenFields.trim() && nodeData.ca('httpType')) {
                                    let tokenValueMatching = '__none__',
                                        fieldCount = tokenFields.split('.').length;
                                    tokenFields.split('.').forEach((field, idx) => {
                                        if (tokenValueMatching == '__none__') {
                                            tokenValueMatching = data[field];
                                        } else if (isObject(tokenValueMatching)) {
                                            tokenValueMatching = tokenValueMatching[field];
                                        } else {
                                            if (idx !== fieldCount - 1) {
                                                tokenValueMatching = '__none__';
                                            }
                                        }
                                    });
                                    if (tokenValueMatching != '__none__') {
                                        //240203，不用_i.window().uiotosToken，因为刷新页面就会清空，但是用window.sessionStoage，刷新页面也不会丢失！
                                        _i.window().localStorage.setItem('uiotosToken', tokenValueMatching);
                                    }
                                }

                                //对于异步请求特别是for循环连续多个请求时，结果为了能跟请求对应上，这里结果带上请求参数！尤其在组态连线bindControls的情况，都是异步触发。
                                if(data){
                                  data._requestParams = i.clone(ajaxParam); //230925，去掉函数的，只保留请求参数放到返回结构中。
                                  delete data._requestParams.success;
                                  delete data._requestParams.error;
                                }

                                reponseFunc(data, status, false, asyncIndexForResponse);
                                nodeData.ca('responseLog') && console.log('[recv]', data, status);
                                //230310，加上data.router_config属性判断，对于物联中台的返回，code 0为成功！这跟apijson的返回的http状态码不一样，只是字段名冲突！
                                if (
                                    data &&
                                    data.code != undefined &&
                                    (
                                        data.code != 200 &&
                                        status != 'success' //231105，加上这个，避免正常返回结果报错！
                                    ) &&
                                    data.router_config == undefined
                                ) {
                                    console.error('[response error!!!]', data.code, data, status);
                                    nodeData.ca('enableErrDlg') && i.alert('错误码：' + data.code + '，' + JSON.stringify(data[nodeData.ca('resMsgField')], undefined, 2), '错误');
                                }
                            },
                            error: function(data, status) {
                                i.error(ajaxParam);
                                reponseFunc(data, status, true);

                                function __t(txt) {
                                    return txt ? txt + ',' : '';
                                }
                                nodeData.ca('enableErrDlg') && i.alert('调用错误：' + (data.responseJSON ? (__t(data.responseJSON.detail) + __t(data.responseJSON.status) + __t(data.responseJSON.error) + '\r\n' + __t(data.responseJSON.path)) : data.status) + '\r\n', '错误', false, null, null, [300, 180]);
                            }
                        };

                        //240201，JWT Token之外，还要支持其他token模式：
                        // headers: nodeData.ca('authToken') ? { 'Authorization': 'JWT ' + data.ca('authToken') } : {},
                        function __updateAuthToken(token) {
                            let tkType = nodeData.ca('tokenType');
                            if (tkType == 'JWT') {
                                ajaxParam.headers = {
                                    'Authorization': 'JWT ' + token
                                }
                            } else if (tkType == 'custom') {
                                ajaxParam.headers = {
                                    'Authorization': token
                                }
                            } else if (tkType == undefined || tkType == 'X-Access-Token') { //兼容没有该属性的旧版API组件，无属性值时，当成X-Access-Token一样处理！
                                if (ajaxParam.url.indexOf('login') == -1) {
                                    ajaxParam.headers = {
                                        'X-Access-Token': token
                                    }
                                }
                            } else {
                                console.assert(0);
                            }
                        }
                        let uiotosTokenTmp = _i.window().localStorage.getItem('uiotosToken');
                        if (!!nodeData.ca('authToken')) {
                            __updateAuthToken(nodeData.ca('authToken'));
                        } else if (uiotosTokenTmp) { //240201，接口的调用，如果发现没有配置authToken，但是全局_i.window().uiotosToken有，那么就自动将其用作
                            __updateAuthToken(uiotosTokenTmp);
                        }

                        $.ajax(ajaxParam);
                        console.warn(ajaxParam);
                    } catch (error) {
                        console.error(error);
                        layer.closeAll();
                    }
                }
            } else {
                data.ca('requesting', false); //复位请求标记
            }
        }

        function initRepeatTimeRequest() {
            if (cache.timer) {
                clearInterval(cache.timer);
            }
            if (!data.ca('enableRepeat')) {
                return;
            }
            let timeout = data.ca('repeatInterval')
            if (timeout > 0) {
                cache.timer = setInterval(function() {
                    data.ca('enableRepeat') == false && clearInterval(cache.timer)
                    data.ca('type') == 'http' && requesting(true);
                    data.ca('type') == 'mqtt' && data.fp('a:_sendSet', null, true); //230320，暂未测
                }, timeout);
            }
        }

        //对应"a:start"属性，不同于"a:requesting"
        function onStart(value) {
            if (value) {
                let sizetmp = Math.floor(data.ca('timeSpan') / data.ca('timeFreq'));
                cache._spanResponse = []; //初始化清空；
                i.createTimePeroid(
                    data.ca('timeFreq'),
                    data.ca('timeSpan'),
                    (timePeriod, index) => { //回调传入参数，例如：['2022-12-17 14:43:05.946', '2022-12-17 14:43:08.946'],-2，其中第二个参数为：-23、-22、-21、……、0这样负索引！
                        let cb = new Function('return ' + data.ca('beforeRequest'))();
                        if (timePeriod && timePeriod.length == 2) { //初步判断createTimePeroid生成的时间片段事件回调传参正常
                            /*存放时间跨度的的请求结构，返回数据对应填充上值，就成了完整时间段的返回结果，因为回调cbPeriodRequest每次传入的都是一个时间片段，
                            这里cache._spanResponse就是要把时间片段按照传参的设置，组装成动态滚动的数组，其中数组的元素item就只包含一个时间点而不再是原回调
                            传入的包含起、止的两个时间点！*/
                            if (!cache._spanResponse) cache._spanResponse = [];
                            let saveIndex = (sizetmp - 1 + index); //负索引（-3,-2等，直到最终索引0）转成正索引（从0开始，1,2,3直到最大索引）
                            if (cache._spanResponse[saveIndex] == undefined) cache._spanResponse[saveIndex] = {
                                'time': i.tm2ts(timePeriod[0]) //cache._spanResponse将cbPeriodRequest传入的时间片段，组装成动态滚动的定长数组，且每个元素只包含一个时间点！
                            }
                            else {
                                if (index != 0) {
                                    console.error('abnormal!!!', index, timePeriod);
                                }
                                cache._spanResponse.shift(); //这里实现时间数组cache._spanResponse元素动态滚动，整个跨度保持参数设置的要求。
                                cache._spanResponse.push({
                                    'time': i.tm2ts(timePeriod[0])
                                });
                            }
                            cb && cb(data, gv, cache, timePeriod, index); //beforeRequest()回调函数调用！
                            initParams(); //修改参数重新请求时，必须先调用initParams()
                            if (data.ca('fakeEnable') != true) requesting(value, saveIndex); //待到以当前时间循环周期触发时，参数saveIndex就始终固定为索引最大的值不变了！
                            else { //模拟数据时，不走http请求response
                                if (cache._cycleIndex == null) cache._cycleIndex = 0;
                                else {
                                    cache._cycleIndex += 1;
                                    if (cache._cycleIndex == sizetmp) cache._cycleIndex = 0;
                                };
                                let fakeValue = data.ca('fakeDatas') ? data.ca('fakeDatas')[cache._cycleIndex] ? data.ca('fakeDatas')[cache._cycleIndex] : 0 : 0;
                                reponseFunc({
                                    data: [{
                                        value: fakeValue
                                    }]
                                }, 'local faked!!', false, saveIndex); //注意，最后一个参数一定要传入saveIndex而不是cache._cycleIndex，因为循环值始终是给最后一个滚动追加进来的点！
                            }
                            //回显
                            data.ca('timeTo', timePeriod[1]);
                        } else {
                            console.error('time period error:', timePeriod)
                        }
                    },
                    data.ca('timeType'),
                    data.ca('toCurrent') == true ? null : data.ca('timeTo'),
                    data.ca('msCicleDelay')
                );
            };
            data.ca('start', false);
        }

        //230322，对接口类型的组件统一到一个图标类型中，下来切换来区分，复用大部分属性和功能
        let funcAttrs = {
            'http': e => {
                (data.ca('url') == undefined || data.ca('url').length == 0) && data.ca('url', ['http://', 'sys.aiotos.net', ':9088', '/get']);
                //tips 230803:11-30，【待处理】，配置了api后，比如post的去掉勾选，但是一刷新页面就还原了，除了不方便，会不会导致其他BUG？？暂未深究和处理！！
                i.insertTempAttrs(data, [{
                    attr: "httpType",
                    valueType: "HttpType",
                    defaultValue: 1,
                    description: `选择GET、POST、PUT或DELETE。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#crgbh' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                },  {
                    attr: 'jsonFormat',
                    valueType: 'Object',
                    defaultValue: {},
                    description: `接口的参数对象。与键组、值组对应。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#lcwQZ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: 'dataIsJsonString',
                    valueType: 'Boolean',
                    name: '用作文本',
                    defaultValue: true, //240811，很重要，默认值不能是false，否则发现UIOTOS登录都进不去！！
                    extraInfo: '*',
                    description: `勾选时，参数对象将为文本传参。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#N8jdC' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                },{
                    attr: 'withCredential',
                    valueType: 'Boolean',
                    name: '包含凭证',
                    defaultValue: true, //240811，很重要，默认值不能是false，否则发现UIOTOS登录都进不去！！241021，但是注意，某些时候跨域接口，需要这里值为false，js ajax才能调用成功！
                    extraInfo: '★',
                    description: `启用跨域请求发送凭据。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#NqCOs' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                },{
                    attr: 'jsonStruct',
                    valueType: 'JsonStruct',
                    defaultValue: 1,
                    extraInfo: '*',
                    description: `参数对象与键值组的对应选项。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#QwHXR' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: 'paramKeys',
                    valueType: 'StringArray',
                    defaultValue: [],
                    description: `与参数对象对应的字段键组。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#u6buE' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    extraInfo: '★',
                    bindIgnored: true
                }, {
                    attr: 'paramValues',
                    valueType: 'ObjectArray',
                    defaultValue: [],
                    description: `与参数对象对应的字段值组。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#PAnHH' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    extraInfo: '★',
                    bindIgnored: true
                },{
                    attr: 'tokenType',
                    valueType: 'String',
                    extraInfo: {
                        "enum": {
                            "values": [
                                'JWT',
                                "X-Access-Token",
                                "custom"
                            ]
                        },
                        "classify":"*"
                    },
                    defaultValue: 'X-Access-Token',
                    description: `接口请求时的Token鉴权方式。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#FNsDK' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: 'authToken',
                    valueType: 'String',
                    defaultValue: '',
                    description: `鉴权token，用于需要接口调用传入。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#jG3jj' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    extraInfo: '*',
                    bindIgnored: true
                }, {
                    attr: 'tokenFieldParsed',
                    valueType: 'String',
                    defaultValue: '',
                    description: `提取返回数据中token的解析字符串。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#dn0ZD' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    extraInfo: '★',
                    bindIgnored: true
                }, {
                    attr: 'contentType',
                    valueType: 'ContentType',
                    defaultValue: 'application/json',
                    description: `HTTP发送的ContentType类型。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#snC59' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    extraInfo: '*',
                    bindIgnored: true

                }, {
                    attr: 'dataType',
                    valueType: 'DateType',
                    defaultValue: 'JSON',
                    description: `HTTP返回的DateType类型。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#PTGeY' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    extraInfo: '*',
                    bindIgnored: true
                },{
                    attr: "requesting",
                    valueType: "Boolean",
                    defaultValue: false,
                    description: `执行接口调用。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#XHdkQ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                }, {
                    attr: "download",
                    valueType: "Boolean",
                    defaultValue: false,
                    description: `下载链接文件（或打开页面）。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#KmDge' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    extraInfo: '*',
                    bindIgnored: true
                },{
                    "attr": "defaultOpen",
                    "valueType": "Boolean",
                    "defaultValue": false,
                    description: `页面初始加载时，自动执行接口请求。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#NHHLf' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    extraInfo: '★',
                    bindIgnored: true
                  }, {
                    "attr": "enableLoading",
                    "valueType": "Boolean",
                    "defaultValue": false,
                    description: `执行请求过程中，开启过度旋转动画。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#Y3X9o' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    extraInfo: '★',
                    bindIgnored: true
                  },{
                    attr: "response",
                    valueType: "ObjectArray",
                    name:'返回',
                    defaultValue: ['', ''],
                    description: `接口请求返回状态和数据。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#Lh7Qu' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                },{
                    "attr": "fakeRecvEnabled",
                    "valueType": "Boolean",
                    "defaultValue": false,
                    description: `是否启用接口数据模拟。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#QR7qt' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                  },
                  {
                    "attr": "fakeApiReceived",
                    "valueType": "Object",
                    "defaultValue": {},
                    description: `开启模拟后，用于对外输出的模拟数据。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#IbRhv' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                  },
                  {
                    "attr": "fakeReturnDelay",
                    "valueType": "PositiveNumber",
                    "defaultValue": 400,
                    extraInfo: '★',
                    description: `模拟接口请求过程的延时。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#V0c1Y' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                  }], 'url');
            },
            
            'mqtt': e => { //暂不支持遗嘱信息这些
                (data.ca('url') == undefined || data.ca('url').length == 0) && data.ca('url', ['ws://', 'sys.aiotos.net', ':', '8084', '/', 'mqtt']);
                i.insertTempAttrs(data, [{
                    attr: '_username',
                    valueType: 'String',
                    defaultValue: '',
                    name:'用户名',
                    extraInfo: '★',
                    description: `MQTT接口服务所需的用户名。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#PWp6r' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: '_password',
                    valueType: 'String',
                    defaultValue: '',
                    name:'密码',
                    extraInfo: '★',
                    description: `MQTT接口用户名对应的密码。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#TmxtZ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: '_clientId',
                    valueType: 'String',
                    name:'客户端ID',
                    extraInfo: '*',
                    description: `当前客户端在MQTT服务的唯一ID。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#uSN3Q' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: '_connectTimeout',
                    valueType: 'PositiveNumber',
                    defaultValue: 4000,
                    name:'连接超时',
                    extraInfo: '*',
                    description: `指定连接超时时间，超过时将返回报错。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#H1BUZ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: '_keepAlive',
                    valueType: 'PositiveNumber',
                    defaultValue: 60,
                    name:'心跳周期',
                    extraInfo: '*',
                    description: `用于保持连接在线的心跳周期。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#VJMaS' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: '_topics', //支持topic数组，即多个topic列表，列表中的主题topic都会被订阅
                    valueType: 'ObjectArray',
                    defaultValue: [],
                    name:'主题列表',
                    // extraInfo: '★',
                    description: `订阅或发送的主题列表，可指定某个。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#FMMoh' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: '_topicIndexSend', //发送时对应topic的索引
                    valueType: 'Number',
                    defaultValue: -1,
                    name:'指定发送',
                    // extraInfo: '★',
                    description: `设置主题列表索引，指定主题发送。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#z6CW8' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: '_payloadSend', //发送的内容
                    valueType: 'Object',
                    name:'发送内容',
                    // extraInfo: '★',
                    description: `发送时，与发送主题对应的内容。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#mQSKY' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                },{
                    attr: "_qos",
                    valueType: "QoS",
                    defaultValue: 0,
                    name:'质量等级',
                    extraInfo: '*',
                    description: `对应MQTT协议中的QOS参数。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#DcON7' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: "_retain",
                    valueType: "Boolean",
                    defaultValue: false,
                    name:'保留标志',
                    extraInfo: '*',
                    description: `对应MQTT协议中的retain参数。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#Ye3EZ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: "_sendSet",
                    valueType: "Boolean",
                    defaultValue: false,
                    name:'发送',
                    // extraInfo: '★',
                    description: `执行发送主题和内容。。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#cMzmE' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: "_subscribe",
                    valueType: "Boolean",
                    defaultValue: false,
                    name:'订阅',
                    // extraInfo: '★',
                    description: `连接MQTT服务器，并订阅数据。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#WKdDr' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: '_topicRecvGet', //接收到的topic，不用索引对应了，直接是topic内容。因为不是用户填写，是只读的。不存在 简化配置的问题。
                    valueType: 'String',
                    defaultValue: '',
                    name:'收到主题',
                    // extraInfo: '★',
                    description: `收到数据对应的主题Topic。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#eS4H0' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }, {
                    attr: '_payloadRecvGet', //接收到的内容
                    valueType: 'Object',
                    name:'收到内容',
                    // extraInfo: '★',
                    description: `收到的数据内容。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/hf6hq3949mqpg32u#TmiC6' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    bindIgnored: true
                }], 'url');
            },
            'ws': e => {
                i.showMessage('暂不支持', 'error');
            }
        };

        //230322，MQTT初始化相关
        function initMQTT() {
            if (cache.mqttClient) cache.mqttClient.end();
            let url = data.ca('url').join('');
            const options = {
                clean: true,
                connectTimeout: data.ca('_connectTimeout'),
                clientId: data.ca('_clientId') + (runningMode() ? '@' + data.getId() : ''), //240426，运行预览时，客户端id自动加上后缀-run，避免预览的和编辑的id冲突，导致预览是反复自动备份踢下线、重连！
                username: data.ca('_username'),
                password: data.ca('_password'),
            }
            showContent('url: ' + data.ca('url').join('') + '\r\n' + 'connecting...', false, 1);
            cache.mqttClient = mqtt.connect(url, options); // you add a ws:// url here
            //当客户端接收到发布消息时触发回调
            /**
             * topic:收到的数据包的topic
             * message:收到的数据包的负载playload
             * packet:收到的数据包
             */
            cache.mqttClient.on("message", function mqttRcv(topic, message, packet) {
                console.log('mqtt message recv package', packet);
                let msgtmp = message;
                try {
                    let valtmp = JSON.parse(message); //240621，不能用i.jsonParse(message)，因为这里就是靠try-catch捕捉解析异常，去用TextDecoder切换解析方式的！
                    if (valtmp.from === undefined) { //240425，发现存在没有from字段，此时值直接在valtmp中，并没有更下级.value字段！
                        msgtmp = valtmp;
                    } else if (valtmp.from == data.ca('_clientId')) {
                        console.log('recv from self send!', valtmp);
                        return;
                    } else msgtmp = valtmp.value;
                } catch (error) {
                    //240425，存在这种情况的解析（js解析二进制）
                    // console.error(error)
                    msgtmp = new TextDecoder('utf-8').decode(message);
                }
                showContent('TOPIC:<br>' + topic + '<br><br>' + 'PAYLOAD: <br>' + msgtmp, false, 2);

                //240425，MQTT数据收到时，触发连线动作！
                i.formEventBubblingUpper(data, gv, cache, 'onReceived', {
                    'a:_payloadRecvGet': msgtmp,
                    'a:_topicRecvGet': topic
                }, true, true, null, false, null, msgtmp);
            });

            //当重新连接启动触发回调
            cache.mqttClient.on('reconnect', () => {
                data.i_statusReporting = true;
                // i.update(data,'_subscribe',false);
                data.i_statusReporting = false;
                showContent('reconnecting...', false, 1);
                //241022，连接状态，体现在接口组件的外观边框颜色上！
                data.ca('shadowBorder',[0,0,12]);
                data.ca('shadowColor','rgba(226,250,87)');
            });

            //连接断开后触发的回调
            cache.mqttClient.on("close", function(info) {
                data.i_statusReporting = true;
                // i.update(data,'_subscribe',false);   //240921，发现不能加上这个，否则每次勾选订阅，很大概率在connect事件后，也会有这里close响应！！暂未深究，先屏蔽掉！毕竟还有disconnected、offline。
                data.i_statusReporting = false;

                showContent('connection closed!', false, 2);
                //241022，连接状态，体现在接口组件的外观边框颜色上！
                data.ca('shadowBorder',[0,0,12]);
                data.ca('shadowColor','rgba(255,125,125)');
            });

            //从broker接收到断开连接的数据包后发出。MQTT 5.0特性
            cache.mqttClient.on("disconnect", function(packet) {
                data.i_statusReporting = true;
                // i.update(data,'_subscribe',false);
                data.i_statusReporting = false;

                showContent('disconnected! pachage: ' + i.ify(packet), false, 2);
                //241022，连接状态，体现在接口组件的外观边框颜色上！
                data.ca('shadowBorder',[0,0,12]);
                data.ca('shadowColor','rgba(255,125,125)');
            });

            //客户端脱机下线触发回调
            cache.mqttClient.on("offline", function() {
                data.i_statusReporting = true;
                // i.update(data,'_subscribe',false);
                data.i_statusReporting = false;

                showContent('client offline!', false, 2);
                //241022，连接状态，体现在接口组件的外观边框颜色上！
                data.ca('shadowBorder',[0,0,12]);
                data.ca('shadowColor','rgba(255,125,125)');
            });

            //当客户端无法连接或出现错误时触发回调
            cache.mqttClient.on("error", (error) => {
                data.i_statusReporting = true;
                // i.update(data,'_subscribe',false);
                data.i_statusReporting = false;

                showContent('client error!' + error, false, 1);
                //241022，连接状态，体现在接口组件的外观边框颜色上！
                data.ca('shadowBorder',[0,0,12]);
                data.ca('shadowColor','rgba(255,125,125)');
            });

            //当客户端发送任何数据包时发出。这包括published()包以及MQTT用于管理订阅和连接的包
            cache.mqttClient.on("packetsend", (packet) => {
                console.log('mqtt send:', packet);
                // showContent('send:\r\n' + i.ify(packet), false, 1);
            });

            //当客户端接收到任何数据包时发出。这包括来自订阅主题的信息包以及MQTT用于管理订阅和连接的信息包
            cache.mqttClient.on("packetreceive", (packet) => {
                console.log('mqtt recv:', packet);
                // showContent('received:\r\n' + i.ify(packet), false, 2);
            });

            //成功连接后触发的回调
            cache.mqttClient.on("connect", function(connack) {
                data.i_statusReporting = true;
                // i.update(data,'_subscribe',true);
                data.i_statusReporting = false;

                showContent('connected!', false, 2);
                //241022，连接状态，体现在接口组件的外观边框颜色上！
                data.ca('shadowBorder',[0,0,8]);
                data.ca('shadowColor','rgb(0,199,7)');
            });
        }

        function __setType(type, e) {
            /*240225，加入第三个参数e，如果e.oldValue是__init__初始化加载，那么就不清理数据绑定data.getDatabindings的设置值attrObject，因为可能下面紧接着初始动态增加insertTempAttr，否则会出现
            比如内嵌api组件继承到上层form绑定的值，设置无法锁定等怪异现象。*/
            i.clearTempAttrs(data, null, e);
            //不同的函数，动态切换新增配置属性
            i.addKeysAction(type, funcAttrs, e);
            if (data.s('label') == undefined) data.s('label', i.getValueTypeName('InterfaceType', data.ca('type')));
        }
        if(data.ca('_sendSet')) i.update(data,'a:_sendSet', false);

        //230219，更新为i.md
        i.md(data, gv, cache, {
            "a:type": e => {
                data._i_isTyping = true;
                //230807，如果发现此时有post属性，那表明并非从mqtt等切换到http，而是此前就是http，就不进行下面覆盖，避免此前的设置在页面重新加载时覆盖掉此前属性的配置！
                let type = e.newValue;
                if (type == 'http' && i.hasAttrObjectKey(data, 'httpType', exist => { //注意，需要用异步回调中获取，因为属性未初始化赋值时，只有异步回调才能确定是否存在属性！
                        /*230905，去掉这里的!exist，否则收藏里的实例化粘贴、对图元JSON修改，都进不来这里导致无法根据type的http、mqtt等类型动态创建object类型的imnage属性！
                        表现为requesting等属性丢失等问题！*/
                        /*!exist && */
                        __setType(e.newValue, e);

                        //240812，切换时url切换。
                        e.oldValue !== '__init__' && i.update(data,'url', ['http://sys.aiotos.net/api/token']);   
                    }));
                //mqtt也是一样处理。后续如果有ws等也一样！
                else if (type == 'mqtt' && i.hasAttrObjectKey(data, '_topics', exist => {
                        if(!data.ca('_clientId')) i.update(data,'_clientId', i.getItemWithExpiration('_i_user') + '_' + i.autoTag(data) + '_' + data.getId());

                        /*230905，去掉这里的!exist，否则收藏里的实例化粘贴、对图元JSON修改，都进不来这里导致无法根据type的http、mqtt等类型动态创建object类型的imnage属性！
                        表现为属性丢失等问题！*/
                        /*!exist && */
                        __setType(e.newValue, e);

                        //240812，切换时url切换。
                        e.oldValue !== '__init__' && i.update(data,'url', ['ws://sys.aiotos.net:8084/mqtt']);
                    })
                );
                data._i_isTyping = undefined;
            },
            "a:repeatInterval|\
            a:enableRepeat": e => {
                initRepeatTimeRequest();
            },
            "a:comment": e => {
                initAppreance();
            },
            "a:paramValues|\
            a:paramKeys|\
            a:jsonStruct|\
            a:objectStyle|\
            a:dataIsJsonString|\
            a:contentType": e => {
                __clear();
                initParams(e.property,e);
            },
            "a:post|\
            a:url|": e => {
                //230830，让api的参数输入页能支持数组用第一个元素编辑
                if(!data._i_isTyping){
                    i.enableAttrEditByFirstItem(data, e);
                    if (e.property == 'a:url') { //231002，数组长度改成1，数组形式方便编辑时，不触发后面执行
                        if (data.ca('url').length == 1 && isArrayFn(data.ca('url')[0])) return;
                    }
                }

                initParams(e.property); //传入哪个属性值的变化过来的，用于给到i.backWriteAttrs()
            },
            "a:requesting": e => {
                //230829，将Number(val)换成了isValueCanTriggerBoolean(val)，
                requesting(!!e.newValue /*i.isValueCanTriggerBoolean(e.newValue)*/ ); //230925，用!!xxx代替之前的，发现之前的用字符串'xxx'过来赋值，结果被转成了false
                initRepeatTimeRequest();
            },
            "a:start": e => {
                onStart(e.newValue);
            },
            "a:echoClear": e => {
                //注意，对htmlView组件的html内容清空，需要填入"<div></div>"，而不是""或者null
                e.newValue == true && (cache.obj.setValue && cache.obj.setValue('') || cache.obj.setContent && cache.obj.setContent('<div></div>'));
                data.ca('echoClear', false);
            },
            "a:jsonFormat": e => {
                if (e.newValue && isObject(e.newValue)) {
                    if(!data._i_updateObjectToKeyValues){
                        //240810，既然之前是i.backWriteAttrs()，那么这里貌似啥都不用动，因为本身就已经是引用赋值了！！   
                        i.objectToKeyValues(data.ca('jsonFormat'), data.ca('paramKeys'), data.ca('paramValues'), true, data.ca('jsonStruct'));
                        data._i_updateObjectToKeyValues = true;
                        i.backWriteAttrs(data, {
                            'a:jsonFormat': data.ca('jsonFormat'),
                            'a:paramKeys': data.ca('paramKeys'),
                            'a:paramValues': data.ca('paramValues')
                        });
                        data._i_updateObjectToKeyValues = undefined;
                    }
                }
            },
            "a:download": e => {
                if (e.newValue == true) {
                    data.ca('httpType', 0);
                    window.open(data._i_url); //浏览器http get下载静态文件
                    data.ca('download', false);
                }
            },
            "a:fakeDatas": e => { //允许编辑器第一个元素存放数组，这一自动展开到数组格式，避免一个个手动配置
                _i.enableAttrEditByFirstItem(data, e); //230830，代替i.arrExpandByFirst(e.newValue);
            },
            'a:forceToStringSet': e => {
                if (e.newValue) {
                    data.ca(e.property.slice(2), false);
                    let datastmp = data.ca('fakeDatas');
                    datastmp.forEach((item, index) => {
                        if (typeof item == 'number') datastmp[index] = item.toString();
                    })
                }
            },
            //230322，对mqtt新增的属性
            'a:_topics': e => {
                //修改后，先取消订阅
                if (!i.isInitOrNull(e.oldValue) && e.oldValue.length > 0) {
                    // 取消订阅名为 testtopic 的 Topic
                    cache.mqttClient && cache.mqttClient.unsubscribe(e.oldValue, function(error) {
                        if (error) {
                            showContent(error, false, 1);
                        } else {
                            console.log('Unsubscribed')
                        }
                    })
                }
                //再订阅
                if (e.newValue != undefined && e.newValue.length > 0) {
                    initMQTT();
                    cache.mqttClient && cache.mqttClient.subscribe(e.newValue, {
                        qos: data.ca('_qos'),
                        retain: data.ca('_retain')
                    }, function(error, granted) {
                        if (error) {
                            showContent(error, false, 1);
                        } else {
                            showContent(i.ify(`${granted[0].topic} was subscribed`), false, 2);
                        }
                    });
                }
            },
            'a:_topicIndexSend': e => {
                let maxlength = data.ca('_topics').length;
                if (e.newValue >= maxlength) i.backWriteOnly(data, e.property, maxlength - 1)
            },
            'a:_subscribe': e=>{  //240812，新增
                if(data.i_statusReporting) return;
                let currentTopics = data.ca('_topics');
                if(e.newValue){
                    if(!currentTopics || currentTopics.length == 0) {
                        _i.alert('主题列表为空，订阅前请先设置！');
                        i.update(data,'_subscribe',false);
                        return;
                    }
                    let oldTopics = i.copy(currentTopics);
                    i.update(data,'_topics',oldTopics,currentTopics);
                }else{
                    // 取消订阅名为 testtopic 的 Topic
                    currentTopics && cache.mqttClient && cache.mqttClient.unsubscribe(currentTopics, function(error) {
                        if (error) {
                            showContent(error, false, 1);
                        } else {
                            console.log('Unsubscribed')
                        }
                    });
                    cache.mqttClient && cache.mqttClient._handleDisconnect()
                }
            },
            'a:_sendSet': e => {
                if (e.newValue) {
                    try {
                    if (!cache.mqttClient) initMQTT();
                    let currentTopicTmp = data.ca('_topics'); //240425，兼容topics为单个字符串而不是数组的情况！
                    let topictmp = isArrayFn(currentTopicTmp) ? (data.ca('_topicIndexSend') < 0 ? currentTopicTmp : currentTopicTmp.at(data.ca('_topicIndexSend'))) : currentTopicTmp, //$IOTOS/event/data/changed/2/2/2
                        payloadtmp = data.ca('_payloadSend');
                        if(payloadtmp !== undefined){
                        if(!isArrayFn(topictmp)) topictmp = [topictmp];
                            contenttmp = typeof(payloadtmp) == 'object' ? JSON.stringify(payloadtmp) : payloadtmp.toString();
                            // let contenttmp = JSON.stringify({
                            //     from: data.ca('_clientId'), //在payload中固定加一层结构，from为客户端id，value才是payload的值！
                            //     value: payloadtmp.toString()
    
                        topictmp.forEach(topic=>{
                            cache.mqttClient.publish(topic, contenttmp, {
                                qos: data.ca('_qos'),
                                retain: data.ca('_retain')
                            });
                        });
                    }
                    showContent('TOPIC:<br>' + topictmp + '<br><br>' + 'PAYLOAD:<br>' + payloadtmp, false, 1);
                    } catch (error) {}
                    data.ca('_sendSet', false);
                }
            },
            'a:defaultOpen': e => { //231103，为了支持api组件嵌套封装
                !!e.newValue && _i.setTimeout(() => {
                    requesting(true);
                }, 0);
            },
            'a:defaultStart': e => { //231104，同上！
                _i.setTimeout(() => {
                    onStart(true);
                }, 0);
            }
        }, [{
            'a:type': '__init__', //240225，如果是属性的key-value对象，且值为__init__，那么表示渲染元素初始化时立即同步执行，而且异步等到顶层加载完毕后再初始化执行一次！
        }, 'a:_topics', 'a:jsonFormat', 'a:defaultOpen','a:_subscribe'], () => { //240229，新增a:defaultOpen属性初始化，为了保证上层继承该属性重写设置并form绑定后，不会造成重复触发requesting!
            initParams();
            initRepeatTimeRequest();
            data.ca('requesting', false); //避免某些组件bindControls关联设置后，初始化加载给http组件赋值，但是此时http组件还没加载完导致被置位为1，后续触发因为值不变导致不触发！
            data.ca('defaultStart') && onStart(true);
        }, null, e => {});
        i.layoutHTML(obj, data, gv, cache, () => {
            data.s('2d.visible', !runningMode()); //编辑状态下可见，运行状态下不可见
            cache.obj.setVisible(!runningMode()); //230310，避免运行状态下初始隐藏不彻底！！

            //230323，拖放图元时，让html信息区域内容高度自适应
            if (cache.htmlObj && cache.htmlObj.style) {
                cache.htmlObj.style.height = data.getHeight().toString() + 'px'; //注意，需要高度数字转换成字符串，末尾代px
                //尺寸高度变化时，始终保持滚动到底部的状态
                cache.htmlObj.scrollTop = cache.htmlObj.scrollHeight - cache.htmlObj.clientHeight;
            }
        });
        //重新加载图纸刷新时要关闭，否则会导致重复连接、断开、重连
        cache.obj.onHTMLRemoved = () => {
            console.log("disconnected mqtt!");
            cache.mqttClient && cache.mqttClient.end(); //关闭客户端连接，注意，不是disconnect，也没有该方法（但有该事件标识可监听）
        }
    }

    //通用阴影样式
    initShadow(cache.obj, data.ca('shadowBorder'), data.ca('shadowColor'), data.ca('shadowEnabled'));

    return cache.obj;
}
//为了兼容此前独立的__http
function __http(data, gv, cache) {
    return __interface(data, gv, cache);
}

/*定时器。230801，方便用于做模拟数据周期演示示例*/
function __timerInterval(data, gv, cache) {
    cache = _i.innerRecoveredDataCache(data, cache, false, 'timer', '定时器', () => {
        data.s('2d.editable', false); //尺寸不可编辑
    });
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined
    //230815，对于悬空渲染元素图元，清理掉！
    if (_i.innerPendingNodeAutoDel(data, node => {
            node._i_intervalId !== null && clearInterval(node._i_intervalId);
    })) return;

    if (!cache.init) {
        cache.init = 'done';

        data._i_intervalId = null;
        //组件默认form绑定的属性
        i.setAttrsFormBinded(data, ['start', 'interval', 'output', 'onEvent']);
        //属性监听
        i.md(data, gv, cache, {
            'a:interval': e => {
                data.fp('a:start', null, data.ca('start'));
            },
            'a:start': e => {
                data._i_intervalId !== null && clearInterval(data._i_intervalId);
                data._i_intervalId = null;
                if (e.newValue) {
                    data._i_intervalId = setInterval(() => {

                        if (_i.innerPendingNodeAutoDel(data, node => {
                                node._i_intervalId !== null && clearInterval(node._i_intervalId);
                            })) return;

                        i.formEventBubblingUpper(data, gv, cache, 'onEvent', {
                            'output': i.attrValueFiltered(data, 'output')
                        }, true, true)
                    }, data.ca('interval'));
                }
            }
        }, ['a:start'], null, null, () => {});
    }
}

//周期曲线
function __chartInterval(data, gv, cache, name = null, displayName = null) {

    cache = _i.innerRecoveredDataCache(data, cache, false, name, displayName);
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.init) {
        cache.init = 'done';
        i.setAttrsFormBinded(data, ['names', 'widths', 'xAxis.data', 'colors', 'colorStops', 'lineDots', 'itemSize', 'colorItems', 'markValues', 'markColors']);
        //230808，曲线滚动时，跨度点数设置。
        function __shiftIfNeed(arr) {
            let rollingSizeTmp = data.ca('rollingSize'),
                difftmp = arr.length - rollingSizeTmp;
            if (difftmp > 0 && rollingSizeTmp > 0) { //rollingSize小于等于0时，不滚动。
                for (let idx = 0; idx < difftmp; idx += 1) {
                    arr.shift();
                }
            }
            return arr;
        }

        function __refreshCharts() {
            //240305，下面有i.update()，为了避免死循环进入，这里加上标记了！
            if (data._i_isUpdating) return;

            //生成曲线的数据初始格式series
            let seriestmp = [],
                chartCountTmp = data.ca('sizeSet');
            if (chartCountTmp == 0) {
                i.overWriteUpper(data, 'itemSize', []);
                i.overWriteUpper(data, 'widths', []);
                i.overWriteUpper(data, 'colors', []);
                i.overWriteUpper(data, 'colorStops', []);
            }
            for (let idx = 0; idx < chartCountTmp; idx++) {
                let nametmp = data.ca('names') ? (data.ca('names')[idx] != undefined ? data.ca('names')[idx] : "曲线" + idx) : "曲线" + idx,
                    widthtmp = data.ca('widths') ? (data.ca('widths')[idx] != undefined ? data.ca('widths')[idx] : 0.4) : 0.4,
                    dotstmp = data.ca('lineDots') ? (data.ca('lineDots')[idx] != undefined ? data.ca('lineDots')[idx] : 3) : 3, //非0则为虚线
                    sizetmp = data.ca('itemSize') ? (data.ca('itemSize')[idx] != undefined ? data.ca('itemSize')[idx] : 3) : 3,
                    colortmp = data.ca('colors') ? (data.ca('colors')[idx] != undefined ? data.ca('colors')[idx] : randomColor()) : randomColor(),
                    //231115，加上条件data.ca('colorStops')[idx] === null，这样让初始默认时能够填充渐变色，但是允许编辑状态下颜色面板点击×清理渐变色避免清理不掉非得手动设置透明度0
                    colorStoptmp = data.ca('colorStops') ? (data.ca('colorStops')[idx] != undefined ? data.ca('colorStops')[idx] : rgbaForced(colortmp, data.ca('colorStops')[idx] === null ? 0 : 0.05)) : rgbaForced(colortmp, 0.05),
                    colorItemsTmp = data.ca('colorItems') ? (data.ca('colorItems')[idx] != undefined ? data.ca('colorItems')[idx] : colortmp) : colortmp;
                datatmp = data.ca('_yAxis_data_' + idx);

                //240305，存在字符串尤其是比如'0.12%'、'3.14%'这样的字符串，转成0.012、0.0314这样的小数数值！
                datatmp && datatmp.forEach && datatmp.forEach((val, idx) => {
                    datatmp[idx] = i.toNumber(val);
                });

                let serietmp = {
                    "type": data.ca('_chart_' + idx),
                    "name": nametmp,
                    "data": __shiftIfNeed(datatmp ? datatmp : i.randomNumArray(data.ca('xAxis.data').length, 0, (idx + 1) * 10))
                }
                if (serietmp.type == 'bar') {
                    //曲线切换成柱状图时，宽度是像素的，自动切换成比例。其中宽度大于10的，默认就当成像素宽度了。
                    if (widthtmp >= 1 && widthtmp <= 10) widthtmp = 0.9;//240816，之前是0.4，发现太窄了！如果设置固定值比如20，那么多个柱状图时，显示不太友好！
                    serietmp.barWidth = widthtmp;
                    serietmp.barCategoryGap = data.ca('barCategoryGap');
                } else if (serietmp.type == 'line') {
                    //前面默认统一为0.4，是针对bar柱状图类型的百分比为主，对于曲线，宽度为像素为主
                    if (widthtmp < 1) widthtmp = 1;
                    serietmp.lineStyle = {
                        width: widthtmp, //曲线的宽度
                        pattern: [ //实线、虚线形式
                            dotstmp,
                            dotstmp
                        ]
                    };
                    serietmp.smooth = true;
                    serietmp.itemStyle = {
                        "size": sizetmp,
                        "background": colorItemsTmp
                    }
                    serietmp.areaStyle = (colorStoptmp == undefined || colorAutoOpacity(colorStoptmp) == 0) ? undefined : {
                        color: {
                            type: "linear",
                            colorStops: [{
                                offset: 0,
                                color: colortmp
                            }, {
                                offset: 1,
                                color: colorStoptmp
                            }]
                        }
                    }
                }
                //对于新增的，追加长度，对于减少的，缩减长度
                function __updateArrayAttrs(attr, curVal) {
                    if (data.ca(attr) == undefined) i.overWriteUpper(data, attr, []);
                    if (!isArrayFn(data.ca(attr))) return; //230809，避免报错，如果初始操作连线过来是数值，还没来得及加上索引操作
                    i.overWriteUpper(data, attr, i.setArrayIndexValue(data.ca(attr), idx, curVal).slice(0, chartCountTmp));
                }
                __updateArrayAttrs('names', nametmp);
                __updateArrayAttrs('itemSize', sizetmp);
                __updateArrayAttrs('widths', widthtmp);
                __updateArrayAttrs('lineDots', dotstmp);
                __updateArrayAttrs('colors', colortmp);
                __updateArrayAttrs('colorStops', colorStoptmp);
                __updateArrayAttrs('colorItems', colorItemsTmp);
                // data.ca('_yAxis_data_' + idx, __shiftIfNeed(serietmp.data)); //回写，特别是对于随即自动生成的。

                //240305，加上这个就不会死循环了！在当前函数入口有加上if(!data._i_isUpdating) return;
                data._i_isUpdating = true;
                i.update(data, '_yAxis_data_' + idx, __shiftIfNeed(serietmp.data)); //tips 240305，页面会卡死
                data._i_isUpdating = undefined;

                seriestmp.push(serietmp);
            }

            //tips 240305，用i.update代替data.ca避免卡死
            data._i_isUpdating = true;
            // data.ca('series', seriestmp);
            i.update(data, 'series', seriestmp);
            data._i_isUpdating = undefined;
        }
        i.md(data, gv, cache, {
            'a:sizeSet': e => {
                i.clearTempAttrs(data, null, e, true);

                data._i_dynamicAttrs = ['widths', 'itemSize', 'lineDots', 'colorStops', 'colorItems', 'barCategoryGap']
                for (let idx = Number(e.newValue) - 1; idx >= 0; idx--) {
                    //动态曲线数量的类型分别设置
                    let attrstmp = i.insertTempAttrs(data, [{
                        attr: '_chart_' + idx,
                        name: '曲线类型_' + idx + ' ★',
                        valueType: 'ChartType',
                        extraInfo:'★',
                        defaultValue: data.ca('_chart_' + idx) ? data.ca('_chart_' + idx) : 'line',
                        description: `当前是以平滑曲线还是柱状图展示。<a href="https://www.yuque.com/liuhuo-nc809/uiotos/nxkc9fku1gdkfz5t#fJIDS" style="color:rgb(96,172,252)" target="_blank">详情</a>`
                    }], 'sizeSet');
                    //动态曲线数量的Y轴数值设置
                    let attrstmp2 = i.insertTempAttrs(data, [{
                        attr: '_yAxis_data_' + idx,
                        name: 'Y 轴数据_' + idx,
                        // valueType: 'NumberArray',
                        valueType: 'Object',    //240815，这样比数字数组更好看，而且好配置！！
                        defaultValue: 0,
                        description: '当前曲线与X轴对应的Y轴数据列表。<a href="https://www.yuque.com/liuhuo-nc809/uiotos/nxkc9fku1gdkfz5t#BPix3" style="color:rgb(96,172,252)" target="_blank">详情</a>'
                    }], 'xAxis.data');
                    data._i_dynamicAttrs = [...data._i_dynamicAttrs, ...attrstmp, ...attrstmp2];
                }
                __refreshCharts();
                if ( /*i.isEditing(i.topData(data)) && */ i.loadedState(i.topData(data)) === 1) {
                    //230723，【临时/待完善】尝试这里参照gird动态增加组件对嵌套层的属性暴露保持同步，但是用了下面发现，动态新创建的属性，在做了form绑定后，刷新加载无法保持！
                    // _i.setTimeout(() => {
                    let upperTmp = _i.upperData(data);
                    if (upperTmp && !upperTmp._multiRequestingLeft) {
                        //240121，将下面原始的_multiRequestingLeft = 1改成函数调用！否则出现加载触底反弹末尾处理时_multiRequestingLeft > 0报错！
                        _i.updateUppersWhileDynamicLoading(upperTmp, true);
                        // upperTmp._multiRequestingLeft = 1;
                    }
                    data.dm() && data.dm().handleCurrentSymbol && data.dm().handleCurrentSymbol(true, false, data);
                    //240305，在嵌套的上层要更新，就必须i.iv对topData才行！
                    i.iv(i.topData(data));
                    // }, 0);
                }
            },
            'a:tooltipFormat': e => {
                //230716，为了简化下面这种结构来调整tooltip的head公共投label，以及各曲线不同的datas，专门做了转换，让回调配置更简单
                /*info[0].label = '时间：' + info[0].label;
                info[0].datas[0][1] += ' %';
                info[0].datas[1][1] += ' mmp';
                info[0].datas[2][1] += ' mmp';*/
                function __formatter(info, data, view) {
                    let counttmp = data.ca('sizeSet'), //曲线条数
                        valuestmp = [],
                        tooltipFormat = data.ca('tooltipFormat');
                    for (let idx = 0; idx < counttmp; idx++) {
                        valuestmp.push(info[0].datas[idx][1]);
                    }
                    let formatInfoTmp = tooltipFormat && tooltipFormat(info[0].label, valuestmp, info, data, view); //标题文字（x的值），当前曲线值（y的值列表），曲线索引
                    if (formatInfoTmp && formatInfoTmp[0] != undefined) info[0].label = formatInfoTmp[0];
                    for (let idx = 0; idx < counttmp; idx++) {
                        if (formatInfoTmp && formatInfoTmp[idx + 1] != undefined) info[0].datas[idx][1] = formatInfoTmp[idx + 1];
                    }
                }
                data.ca('tooltipFormatter', __formatter);
            },
            'a:xAxis.data': e => {
                //231115，动态增加横轴点时，自动填充0，避免undefined/null导致曲线整个都不显示了！
                if (e.newValue && isArrayFn(e.newValue)) {
                    e.newValue.forEach((item, idx) => {
                        if (item === null || item === undefined) {
                            e.newValue[idx] = 0;
                        }
                    })
                }
                //240815，试图尝试x轴数据增加时，也滚动，但是想想，是否需要同步让y轴的也滚动？？此外注意，xAxis.data等属性，是绑定的示例组件属性！功能并非在渲染元素代码里。
                // __shiftIfNeed(e.newValue);
            },
            'a:chartSeries|a:chartXaxis': e => {
                if (data.getTag() == 'ichart2') console.error(e.property);
            },
            'a:dataSources': e => {
                if (e.newValue == undefined || e.newValue.length == 0) {
                    let xaxistmp = data.ca('chartXaxis'),
                        seriestmp = data.ca('chartSeries');
                    xaxistmp && xaxistmp.forEach(item => {
                        item.data = [];
                    })
                    seriestmp && seriestmp.forEach(item => {
                        item.data = [];
                    })
                }
            },
            'a:datasRecved': e => {
                try {
                    if (!isArrayFn(e.newValue)) return;
                    let dataArrTmp = i.arrKeyMerged(e.newValue),
                        timeType = data.ca('timeType');
                    let xaxistmp = i.clone(data.ca('chartXaxis'));

                    //与上面相同情况！
                    // let seriestmp = data.ca('chartSeries'); //由引用改成新对象
                    let seriestmp = i.clone(data.ca('chartSeries')); //由引用改成新对象

                    let keystmp = i.arrKeysAll(e.newValue, 'time', true); //取并集更新公共的横轴
                    let invalidTmp = false;
                    keystmp.forEach((tm, index) => {
                        if (1) { //index != 0) { //第一个显示全
                            let date = new Date(tm),
                                y = date.getFullYear(), // 年份
                                M = date.getMonth(), // 月份
                                d = date.getDate(), // 日
                                h = date.getHours(), // 小时
                                m = date.getMinutes(), // 分
                                s = date.getSeconds(); // 秒
                            function __c(v) {
                                return Number(v) < 10 ? '0' + v : v;
                            }
                            switch (timeType) {
                                case 'ms': //注意，毫秒固定用'ms'
                                    break;
                                case 's':
                                    keystmp[index] = __c(m) + '分' + __c(s) + '秒';
                                    break;
                                case 'm':
                                    keystmp[index] = __c(h) + '时' + __c(m) + '分';
                                    break;
                                case 'h':
                                    keystmp[index] = /*__c(d) + '号' + */ __c(h) + '点';
                                    break;
                                case 'd':
                                    keystmp[index] = __c(M) + '月' + __c(d) + '日';
                                    break;
                                case 'M': //注意，月份只能有大写M，小写的为分钟
                                    keystmp[index] = y + '年' + __c(M) + '月';
                                    break;
                                case 'y':
                                    keystmp[index] = y + '年';
                                    break;
                                default:
                                    console.warn('timeType error! only support ms/s/m/h/d/M/y', timeType);
                                    invalidTmp = true;
                                    break;
                            }
                        }
                    });

                    if (invalidTmp) return;

                    if (xaxistmp && xaxistmp.length >= 1) {
                        xaxistmp[0].data = keystmp;
                        data.ca('chartXaxis', xaxistmp);
                    }
 
                    let seriesNum = seriestmp.length;
                    dataArrTmp && dataArrTmp.forEach((item, index) => {
                        if (index > seriesNum - 1) return;
                        let dataArr = []
                        item.forEach(dtmp => {
                            dataArr.push(dtmp.value);
                        });
                        if (seriestmp[index]) {
                            seriestmp[index].data = dataArr;
                            data.ca('chartSeries', seriestmp);
                        }
                    });
                } catch (error) {
                    console.warn(error);
                }
            }
        }, [{
            'a:sizeSet': '__init__' //240304，尝试放到同步，初始默认的新增或减少，第一次加载反弹时给上去！不过貌似更多是在继承后上层设置这个属性啊，需要观察测试！！
        }, 'a:dataSources'], () => {}, null, e => {
            if (data._i_dynamicAttrs && data._i_dynamicAttrs.indexOf(e.property.split(':')[1]) != -1) {
                __refreshCharts();
            }
        });
    }
}

//230718，饼状图
function __pie(data, gv, cache) {
    cache = _i.innerRecoveredDataCache(data, cache, false, 'pie', '饼图');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.init) {
        cache.init = 'done';
        i.setAttrsFormBinded(data, ['sizeSet', 'names', 'colors', 'borderColors', 'values', 'radius', 'roseType']);

        //240304，调整data.dm().md为i.md：
        function __refreshCharts() {
            //生成曲线的数据初始格式series
            let dataSourceTmp = [],
                chartCountTmp = data.ca('sizeSet');
            if (chartCountTmp == 0) {
                i.overWriteUpper(data, 'names', []);
                i.overWriteUpper(data, 'values', []);
                i.overWriteUpper(data, 'widths', []);
                i.overWriteUpper(data, 'colors', []);
                i.overWriteUpper(data, 'borderColors', []);
            }
            for (let idx = 0; idx < chartCountTmp; idx++) {
                let nametmp = data.ca('names') ? (data.ca('names')[idx] != undefined ? data.ca('names')[idx] : "数据" + idx) : "数据" + idx,
                    //231127，加上i.toNumber()，是为了让传入的单个数字字符串，或者数组中有数字字符串的，都能支持，自动转成数字或者数字字符串！避免组件属性加载字符串参数不显示或报错！
                    valuetmp = i.toNumber(data.ca('values') ? (data.ca('values')[idx] != undefined ? data.ca('values')[idx] : randomNum(5, 100)) : randomNum(5, 100)),
                    widthtmp = data.ca('widths') ? (data.ca('widths')[idx] != undefined ? data.ca('widths')[idx] : 1) : 1,
                    colortmp = data.ca('colors') ? (data.ca('colors')[idx] != undefined ? data.ca('colors')[idx] : randomColor()) : randomColor(),
                    borderColorTmp = data.ca('borderColors') ? (data.ca('borderColors')[idx] != undefined ? data.ca('borderColors')[idx] : colortmp) : colortmp;
                let sourcetmp = {
                    "name": nametmp,
                    "value": valuetmp
                };
                sourcetmp.itemStyle = {
                    borderWidth: widthtmp, //饼图边框宽度
                    borderColor: borderColorTmp
                };
                //dashed是支持的，默认是实线，但是'real'是自行设置的相对dashed的叫法，实际使用时，只判断dashed并且来决定是否添加即可！
                if (data.ca('_pie_border_' + idx) === 'dashed') sourcetmp.itemStyle.borderType = 'dashed';
                else if (sourcetmp.itemStyle.borderType) delete sourcetmp.itemStyle.borderType;

                //对于新增的，追加长度，对于减少的，缩减长度
                function __updateArrayAttrs(attr, curVal) {
                    if (data.ca(attr) == undefined) i.overWriteUpper(data, attr, []);
                    if (!isArrayFn(data.ca(attr))) return; //230809，避免报错，如果初始操作连线过来是数值，还没来得及加上索引操作
                    i.overWriteUpper(data, attr, i.setArrayIndexValue(data.ca(attr), idx, curVal).slice(0, chartCountTmp));
                }
                __updateArrayAttrs('names', nametmp);
                __updateArrayAttrs('values', valuetmp);
                __updateArrayAttrs('widths', widthtmp);
                __updateArrayAttrs('colors', colortmp);
                __updateArrayAttrs('borderColors', borderColorTmp);
                dataSourceTmp.push(sourcetmp);
            }
            data.ca('dataSource', dataSourceTmp);
        }

        i.md(data, gv, cache, {
            'a:sizeSet': e => {
                i.clearTempAttrs(data, null, e, true);
                data._i_dynamicAttrs = ['names', 'values', 'widths', 'colors', 'borderColors']
                for (let idx = 0; idx < Number(e.newValue); idx++) {
                    //饼状图边框线的类型分别设置
                    let attrstmp = i.insertTempAttrs(data, [{
                        attr: '_pie_border_' + idx,
                        valueType: 'LineType',
                        defaultValue: 'real',
                        description: '饼状图的边框线类型，实线（默认）或虚线。'
                    }], 'sizeSet');
                    data._i_dynamicAttrs = [...data._i_dynamicAttrs, ...attrstmp];
                }
                __refreshCharts();
            },
            'a:tooltipFormat': e => {
                //230716，为了简化下面这种结构来调整tooltip的head公共投label，以及各曲线不同的datas，专门做了转换，让回调配置更简单
                /*info[0].label = '时间：' + info[0].label;
                info[0].datas[0][1] += ' %';
                info[0].datas[1][1] += ' mmp';
                info[0].datas[2][1] += ' mmp';*/
                function __formatter(info, data, view) {
                    let counttmp = data.ca('sizeSet'), //曲线条数
                        valuestmp = [],
                        tooltipFormat = data.ca('tooltipFormat');
                    for (let idx = 0; idx < counttmp; idx++) {
                        valuestmp.push(info[0].datas[idx][1]);
                    }
                    let formatInfoTmp = tooltipFormat && tooltipFormat(info[0].label, valuestmp, info, data, view); //标题文字（x的值），当前曲线值（y的值列表），曲线索引
                    if (formatInfoTmp && formatInfoTmp[0] != undefined) info[0].label = formatInfoTmp[0];
                    for (let idx = 0; idx < counttmp; idx++) {
                        if (formatInfoTmp && formatInfoTmp[idx + 1] != undefined) info[0].datas[idx][1] = formatInfoTmp[idx + 1];
                    }
                }
                data.ca('tooltipFormatter', __formatter);
            },
        }, [{
            'a:sizeSet': '__init__' //240304，尝试放到同步，初始默认的新增或减少，第一次加载反弹时给上去！不过貌似更多是在继承后上层设置这个属性啊，需要观察测试！！
        }], null, null, e => {
            if (data._i_dynamicAttrs && data._i_dynamicAttrs.indexOf(e.property.split(':')[1]) != -1) {
                __refreshCharts();
            }
        });
    }
}

//230720，条形堆叠图
function __bar_stack(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'bar', '堆叠条');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.htmlView) {
        i.setAttrsFormBinded(data, [
            'yAxis.datas', 'xAxis.names', 'colors', 'margins', 'legendBase', 'chart.text', 'chart.subtext',
            'chart.backgroundColor', 'axisLabel.color', 'axisTick.show', 'axisLine.color', 'splitLine.show', 'splitLine.color'
        ]);
        data._i_colorOpacityBak = colorAutoOpacity(data.ca('splitLine.color'));
        let option = {
            title: {},
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
                }
            },
            legend: {
                orient: 'horizontal', // 布局方式，默认为水平布局，可选为：
                x: 'center', // 水平安放位置，默认为全图居中，可选为：
                y: 'top', // 垂直安放位置，默认为全图顶端，可选为：
                backgroundColor: 'rgba(0,0,0,0)',
                borderColor: '#ccc', // 图例边框颜色
                borderWidth: 0, // 图例边框线宽，单位px，默认为0（无边框）
                padding: 5, // 图例内边距，单位px，默认各方向内边距为5，
                // 接受数组分别设定上右下左边距，同css
                itemGap: 10, // 各个item之间的间隔，单位px，默认为10，
                // 横向布局时为水平间隔，纵向布局时为纵向间隔
                itemWidth: 20, // 图例图形宽度
                itemHeight: 14, // 图例图形高度
                textStyle: {
                    color: '#333' // 图例文字颜色
                }

            },
            grid: {
                top: '10%',
                right: '4%',
                bottom: '3%',
                left: '4%',
                // containLabel: true   //去掉，发现偶尔会让某些个y轴标签不显示。防止标签溢出，https://blog.csdn.net/qq_41694696/article/details/80076024
            },
            xAxis: {
                type: 'value',
                //x轴颜色
                axisLine: {
                    lineStyle: {
                        color: 'rgba(127,127,127)'
                    }
                },
                //x轴文字的配置
                axisLabel: {
                    show: true,
                    // rotate: 30, //调整数值改变倾斜的幅度（范围-90到90）
                    textStyle: {
                        color: "rgba(138, 144, 163, 1)"
                    },
                },
                //坐标轴内线的样式
                splitLine: {
                    lineStyle: {
                        color: '#666'
                            //type:'dashed'虚线
                    }
                },
                axisTick: {
                    show: false //不显示坐标轴刻度线 
                }
            },
            yAxis: {
                type: 'category',
                data: [],
                //y轴文字的配置
                axisLabel: {
                    show: true,
                    // rotate: 30, //调整数值改变倾斜的幅度（范围-90到90）
                    textStyle: {
                        color: "rgba(138, 144, 163, 1)" //Y轴内容文字颜色
                    },
                },
                //y轴颜色
                axisLine: {
                    lineStyle: {
                        color: 'rgba(127,127,127)'
                    }
                },
                axisTick: {
                    show: false //不显示坐标轴刻度线 
                }
                // //y轴设置为百分比
                // axisLabel: {
                //     formatter: '{value}%',
                // },
            },
            series: []
        };

        cache.htmlView = document.createElement('div');
        cache.htmlView.style.position = 'absolute';
        let control = cache.htmlChart = echarts.init(cache.htmlView);
        control.setOption(option);

        //对于新增的，追加长度，对于减少的，缩减长度
        function __updateArrayAttrs(name, curVal, idx, size) {
            if (data.ca(name) == undefined) i.overWriteUpper(data, name, []);
            if (!isArrayFn(data.ca(name))) return; //230809，避免报错，如果初始操作连线过来是数值，还没来得及加上索引操作
            i.overWriteUpper(data, name, i.setArrayIndexValue(data.ca(name), idx, curVal).slice(0, size));
            data.ca(name,data.ca(name));   
        }

        function __refreshCharts() {
            let xAxisSize = data.ca('xAxis.names') == undefined ? 0 : data.ca('xAxis.names').length;
            //生成曲线的数据初始格式series
            let dataSourceTmp = [],
                yAxisDataSizeTmp = data.ca('yAxis.datas') == undefined ? 0 : data.ca('yAxis.datas').length, //条形堆叠图纵轴上条数
                xAxisNameSizeTmp = xAxisSize; //每条的数据段数
            if (xAxisNameSizeTmp == 0) {
                i.overWriteUpper(data, 'colors', []);
            }

            //哪些数组类型的属性长度需要随着xAxis.names长度变化而变化
            let attrArraysTmp = [];
            for (let idx = 0; idx < yAxisDataSizeTmp; idx++) {
                //240305，去掉末尾的文字，长了不说，容易因为上下层不及时同步导致赋值有问题！此外，其他的比如曲线，也是按照通用字段+序号方式来自动命名属性，带上业务字段名称貌似没有意义！
                // let attrtmp = '_xDatas' + idx + '.' + data.ca('yAxis.datas')[idx];
                let attrtmp = '_xDatas_' + idx;

                attrArraysTmp.push(attrtmp);
            }
            for (let idx = 0; idx < xAxisNameSizeTmp; idx++) {
                [...attrArraysTmp, 'colors', 'xAxis.names'].forEach((attr, index) => {
                    let defaultValtmp = '',
                        isDataType = false; //240305，是_xDatas_i相关的数据属性过来时
                    switch (attr) {
                        case 'colors':
                            defaultValtmp = randomColor();
                            break;
                        case 'xAxis.names':
                            defaultValtmp = '数据' + idx;
                            break;
                        default:
                            isDataType = true;
                            defaultValtmp = randomNum(5, 100);
                            break;
                    }
                    let curValTmp = null;
                    if (isDataType) {
                        //240305，数据过来时，需要将数值字符串形式的，自动转换成数字形式！
                        curValTmp = data.ca(attr) && data.ca(attr)[idx] !== undefined ? i.toNumber(data.ca(attr)[idx]) : defaultValtmp;
                    } else {
                        curValTmp = data.ca(attr) ? (data.ca(attr)[idx] !== undefined ? data.ca(attr)[idx] : defaultValtmp) : defaultValtmp;
                    }
                    __updateArrayAttrs(attr, curValTmp, idx, xAxisNameSizeTmp);
                });
            }
            /*默认情况下，option.series.data数组，每组数据对应为各y轴分类在x轴上的数据集合，而这里调整成每组数据为指定y轴分类的x轴上各个数据的集合，这样
            在属性数组配置上，就保持了跟条状图的显示模式一致，便于理解配置。*/
            for (let idx = 0; idx < xAxisNameSizeTmp; idx++) {
                let datastmp = []
                attrArraysTmp.forEach((attr, index) => {
                    datastmp.push(data.ca(attr)[idx]);
                })
                let sourcetmp = {
                    //240804，添加条件，当图例宽高任何一个为0不可见时，文字也不可见！！
                    name: (!data.ca('legendBase') || (!data.ca('legendBase')[2] || !data.ca('legendBase')[3])) ? undefined : data.ca('xAxis.names')[idx],
                    type: 'bar',
                    stack: 'total',
                    label: {
                        show: true
                    },
                    emphasis: {
                        focus: 'series'
                    },
                    data: datastmp
                };
                dataSourceTmp.push(sourcetmp);
            }
            option.series = dataSourceTmp;
            option.color = data.ca('colors');
            option.title.text = data.a('chart.text');
            option.title.subtext = data.a('chart.subtext');
            if (data.ca('legendBase')) {
                if (data.ca('legendBase')[0] != undefined) option.legend.padding = data.ca('legendBase')[0];
                if (data.ca('legendBase')[1] != undefined) option.legend.itemGap = data.ca('legendBase')[1];
                if (data.ca('legendBase')[2] != undefined) option.legend.itemWidth = data.ca('legendBase')[2];
                if (data.ca('legendBase')[3] != undefined) option.legend.itemHeight = data.ca('legendBase')[3];
            }
            option.xAxis.axisLine.lineStyle.color = data.ca('axisLine.color');
            option.yAxis.axisLine.lineStyle.color = data.ca('axisLine.color');
            option.xAxis.axisLabel.textStyle.color = data.ca('axisLabel.color');
            option.yAxis.axisLabel.textStyle.color = data.ca('axisLabel.color');
            //240713，图例的文字颜色
            option.legend.textStyle.color = data.ca('axisLabel.color');
            option.xAxis.axisTick.show = data.ca('axisTick.show');
            option.yAxis.axisTick.show = data.ca('axisTick.show');
            let showtmp = data.ca('splitLine.show') == undefined ? 0 : Number(data.ca('splitLine.show')),
                splitLineColorTmp = rgbaForced(data.ca('splitLine.color'), showtmp == 1 && data._i_colorOpacityBak > 0 ? data._i_colorOpacityBak : showtmp);
            data.ca('splitLine.color', splitLineColorTmp);
            option.xAxis.splitLine.lineStyle.color = splitLineColorTmp;
            if (data.a('chart.backgroundColor')) option.backgroundColor = data.a('chart.backgroundColor');
            else delete option.backgroundColor;
            control.setOption(option, true); //第二个参数要为true，这样才能确保多次setOption()合并。
        }

        i.md(data, gv, cache, {
            'a:yAxis.datas': e => { //230713，曲线类型和Y轴数据设置
                i.isEditing(data) && i.enableAttrEditByFirstItem(data, e);

                let sizeTmp = e.newValue == undefined ? 0 : e.newValue.length;
                i.clearTempAttrs(data, null, e, true);

                data._i_dynamicAttrs = ['xAxis.names', 'names', 'colors']
                for (let idx = 0; idx < Number(sizeTmp); idx++) {
                    //纵轴上类别，也能自动默认赋值
                    let attrtmp = e.property.split(':')[1],
                        curValTmp = data.ca(attrtmp) ? (data.ca(attrtmp)[idx] != undefined ? data.ca(attrtmp)[idx] : '类别' + idx) : '类别' + idx;
                    __updateArrayAttrs(attrtmp, curValTmp, idx, Number(sizeTmp));

                    //饼状图边框线的类型分别设置
                    let attrstmp = i.insertTempAttrs(data, [{
                        //240305，去掉末尾的文字，长了不说，容易因为上下层不及时同步导致赋值有问题！此外，其他的比如曲线，也是按照通用字段+序号方式来自动命名属性，带上业务字段名称貌似没有意义！
                        // attr: '_xDatas' + idx + '.' + curValTmp,
                        attr: '_xDatas_' + idx,

                        valueType: 'Object',//'NumberArray',
                        defaultValue: i.randomNumArray(data.ca('names'), 5, 100),
                        description: '条形图（索引' + idx + '）在横轴x方向，各个段的数值。'
                    }], 'yAxis.datas');
                    data._i_dynamicAttrs = [...data._i_dynamicAttrs, ...attrstmp];
                }
                option.yAxis.data = e.newValue;
                __refreshCharts();
                if ( /*i.isEditing(i.topData(data)) && */ i.loadedState(i.topData(data)) === 1) {
                    //230723，【临时/待完善】尝试这里参照gird动态增加组件对嵌套层的属性暴露保持同步，但是用了下面发现，动态新创建的属性，在做了form绑定后，刷新加载无法保持！
                    // _i.setTimeout(() => {
                    let upperTmp = _i.upperData(data);
                    if (upperTmp && !upperTmp._multiRequestingLeft) {
                        //240121，将下面原始的_multiRequestingLeft = 1改成函数调用！否则出现加载触底反弹末尾处理时_multiRequestingLeft > 0报错！
                        _i.updateUppersWhileDynamicLoading(upperTmp, true);
                        // upperTmp._multiRequestingLeft = 1;
                    }
                    data.dm() && data.dm().handleCurrentSymbol && data.dm().handleCurrentSymbol(true, false, data);
                    //240305，在嵌套的上层要更新，就必须i.iv对topData才行！
                    i.iv(i.topData(data));
                    // }, 0);
                }
            },
            'a:xAxis.names|\
            a:colors|\
            a:chart.backgroundColor|\
            a:chart.subtext|\
            a:chart.text|\
            a:legendBase|\
            a:axisLine.color|\
            a:splitLine.color|\
            a:splitLine.show|\
            a:axisLabel.color|\
            a:axisTick.show': e => {
                if (e.property == 'a:colors') __refreshCharts(data.ca('colors') == undefined ? 0 : data.ca('colors').length);
                else __refreshCharts();
            },
            'a:margins': e => {
                option.grid.top = e.newValue ? (e.newValue[0] ? e.newValue[0] : '10%') : '10%';
                option.grid.right = e.newValue ? (e.newValue[1] ? e.newValue[1] : '4%') : '4%';
                option.grid.bottom = e.newValue ? (e.newValue[2] ? e.newValue[2] : '3%') : '3%';
                option.grid.left = e.newValue ? (e.newValue[3] ? e.newValue[3] : '3%') : '3%';
                __refreshCharts();
            }
        }, ['a:yAxis.datas', 'a:colors', 'a:margins'], null, control, e => {
            __refreshCharts(e);
        });
        i.layoutHTML(cache.htmlView, data, gv, cache, () => {
            control.resize();
        });
    }

    // html for showing
    return cache.htmlView;
}

//内嵌html页面
function __iframe(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'ifm', '网页内嵌');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    let src = data.a('src');
    //240401，补全src
    function __fullSrc(url) {
        let firstField = url.split('?')[0],
        firstArea = url.split('/')[0];

        //240817，增加前面这段识别，比如trying?url=dispaly/xxx/xxx.json这种，需要加上http://localhost:8999前缀啊！！
        if (url && url.slice(0, 9) == 'displays/') return location.protocol + '//' + location.host + '/display.html?tag=' + url;
        else if(url && url.slice(0, 3) == 'www') return location.protocol + '//' + url;
        else if(url && url.slice(0,4) == 'http') return url;
        else if((
            (firstField.indexOf('.') == -1 || firstArea.indexOf('.') == -1)) && 
            firstField.toLowerCase().indexOf('localhost') == -1 && 
            firstArea.toLowerCase().indexOf('localhost') == -1
        ){
            return location.protocol + '//' + location.host + (url.slice(0,1) == '/' ? url.slice(1) : ('/' + url));
        }else {
            return location.protocol + '//' + (url.split('.').length >= 2 ? '' : 'www.')  + url;
        }
    }
    src = __fullSrc(src);

    var borderWidth = data.a('borderWidth1');
    var borderColor = data.a('borderColor1');
    var backgroundColor = data.a('backgroundColor');
    var marginTop = data.a('marginTop');
    var marginRight = data.a('marginRight');
    var millisecond = data.a('millisecond');
    var minTickInterval = data.a('minTickInterval');
    var turboThreshold = data.a('turboThreshold');
    var opacity = data.a('opacity');

    if (!cache.htmlView) {
        if (getProperty(data, 'height') > 0) { //初始高度为0不显示，后面显示需要动画来调整高度来显示！
            var iframe = cache.htmlView = document.createElement('iframe');
            iframe.setAttribute("scrolling", "auto");
            iframe.setAttribute("frameborder", 0);
            iframe.setAttribute("width", '100%');
            iframe.setAttribute("height", '100%');
            iframe.setAttribute("allowtransparency", false); //这样可以全透明
            //230316，非常重要的一句，否则html页面dom变化（比如弹窗新增其他div），会导致页面内的iframe都被自动刷新重新加载内容！
            iframe.autoAdjustIndex = false;

            //230422，加上i.md，为了让src走多用户逻辑，当路径为displays/[user]/这种，user跟当前用户不匹配时，自动转换成当前用户的
            i.md(data, gv, cache, {
                'a:src': e => {
                    //240401，最终实际链接存放一下到data._i_src，目前用于编辑时双击能够直接跳出新页签打开页面！
                    let src = __fullSrc(e.newValue);
                    data._i_src = src;
                    iframe.src = src;
                },
            }, ['a:src'], null, iframe, null);

            i.layoutHTML(iframe, data, gv, cache);
        }
    }

    if (cache.htmlView) {
        if (getProperty(data, 'height') == 0) {
            cache.htmlView = null;
            cache.src = null;
            return null;
        }
        cache.htmlView.setAttribute("style", 'background:' + backgroundColor); //当前面设置allowtransparency为true后，就是全透明了，这里半透明设置就没效果了！
        if (cache.src !== src) {
            cache.htmlView.src = src;
            cache.src = src;
        }
    }
    return cache.htmlView;
}

//240727，html图片组件，主要是为了兼容显示gif
function __image(data,gv,cache){
    cache = _i.innerRecoveredDataCache(data, cache, false, 'img', '图片');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined
    
    let src = data.a('src');
    //240401，补全src
    function __fullSrc(url) {
        if (url && url.slice(0, 9) == 'displays/') return location.protocol + '//' + location.host + '/display.html?tag=' + url;
        else return url;
    }
    src = __fullSrc(src);

    if (!cache.img) {
        var imgObj = cache.img = document.createElement('img');
        i.layoutHTML(imgObj, data, gv, cache);

        //230422，加上i.md，为了让src走多用户逻辑，当路径为displays/[user]/这种，user跟当前用户不匹配时，自动转换成当前用户的
        i.md(data, gv, cache, {
            'a:src': e => {
                if(e.newValue && e.newValue == 'data:image[...]') return;
                //240401，最终实际链接存放一下到data._i_src，目前用于编辑时双击能够直接跳出新页签打开页面！
                let src = __fullSrc(e.newValue);
                data._i_src = src;
                imgObj.src = src;
                //240824，by gpt，让拖过来的图片尺寸，作为实际的img组件的尺寸，即动态适应实际图片/GIF的大小！
                function getBase64ImageDimensions(base64) { 
                    return new Promise((resolve, reject) => { 
                        const img = new Image(); 
                        img.src  = base64; 
                        img.onload  = () => { 
                            resolve({ width: img.width,  height: img.height  }); 
                        }; 
                        img.onerror  = () => { 
                            reject(new Error('Failed to load image')); 
                        }; 
                    }); 
                } 
                getBase64ImageDimensions(src) 
                .then(dimensions => { 
                    if(data._i_gifDragIn){
                        data.setWidth(dimensions.width);
                        data.setHeight(dimensions.height);
                        data._i_gifDragIn = undefined;
                    }
                }) 
                .catch(error => { 
                    console.error('Error:',  error); 
                }); 
            },
        }, ['a:src'], null, imgObj, null);
    }
    i.allowEmpty(data, 'videoURL');
    return cache.img;
}

//230402，视频播放
function __video(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'vd', '视频');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.htmlView) {
        //组件默认form绑定的属性
        i.setAttrsFormBinded(data, ['videoURL', 'autoplay']);
        var video = cache.htmlView = document.createElement('video');
        video.setAttribute("controls", "controls");
        video.setAttribute("loop", "loop");
        i.layoutHTML(video, data, gv, cache);

        //240702，支持停止播放
        _i.md(data, gv, cache, {
            'a:autoplay': e => {
                if (cache.src && cache.src.trim() !== '') {
                    e.newValue ? cache.htmlView.play() : cache.htmlView.pause();
                }
            }
        }, [], null, video, null);
    }
    if (cache.src !== data.a('videoURL')) {
        cache.htmlView.src = data.a('videoURL');
        cache.src = data.a('videoURL');
        var isAutoplay = data.a("autoplay");
        if (isAutoplay) {
            cache.htmlView.setAttribute("autoplay", "autoplay");
        } else {
            cache.htmlView.setAttribute("autoplay", undefined);
            if (cache.src && cache.src.trim() !== '') cache.htmlView.pause(); //240702，避免出事加载就开始播放！即便autoplay属性时undefined
        }
    }
    i.allowEmpty(data, 'videoURL');
    return cache.htmlView;
}

//网格组件
function __grid(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'grid', '网格组合');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    /*不同窗口尺寸比例，不一样的网格M×N比例*/
    let rowCount = data.ca('grid.row.count'),
        columnCount = data.ca('grid.column.count'),
        gridGap = data.ca('grid.gap'),
        enbleAutoCount = data.ca('enbleAutoCount'),
        tagtmp = data.getTag(),
        sizetmp = null;

    //231013，
    //支持行、列填0时的自动计算，注意，这里跟旧的enbleAutoCount没任何关系
    function __autoCalculate() {
        let rc = data.ca('grid.row.count'),
            cc = data.ca('grid.column.count'),
            sz = sizetmp = _i.getChildren(data).size();
        if (rc == 0 && cc) { //行数配置为0，那么就按照固定列数，按照数据的多少，自动增加行！
            rc = Math.ceil(sz / cc); //230223，注意，getChildren()目前判断当作是一级子节点来算，如果包括多层内嵌，那就会出BUG!!!
        } else if (rc && cc == 0) { //列数配置为0，那么就按照固定行数，按照数据的多少，自动增加列！
            cc = Math.ceil(sz / rc); //230223，注意，getChildren()目前判断当作是一级子节点来算，如果包括多层内嵌，那就会出BUG!!!
        } else if (rc == 0 && cc == 0) { //行列如果都为0，那么按照等行、等列自动扩充
            let sqrttmp = Math.floor(Math.sqrt(sz));
            if (sqrttmp * (sqrttmp + 1) >= sz) {
                rc = sqrttmp;
                cc = sqrttmp + 1;
            } else cc = rc = sqrttmp + 1;
        }
        return {
            rowCount: rc,
            columnCount: cc
        }
    }
    rowCount = __autoCalculate().rowCount;
    columnCount = __autoCalculate().columnCount;

    /* 能做到阶梯尺寸调整布局，但是不够平滑，考虑结合icon图标着手留有边距，去掉grid.gap间距设置*/
    //230610，去掉自动网格计算，此前实现的版本不够友好，需要再进一步改进实现再开启！
    if (enbleAutoCount && 0) {
        let w = data.getWidth(),
            h = data.getHeight(),
            ratio = w / h,
            ratioCollumRow = 1;
        if (ratio <= 1) { //窄屏
            rowCount = columnCount; //交换给行，固定
            if (ratio > 0.9 && ratio <= 1) {
                ratioCollumRow = 1.3 //8:6
                gridGap *= 0.8;
            } else if (ratio > 0.8 && ratio <= 0.9) {
                ratioCollumRow = 1.5 //8:5
                gridGap *= 0.6;
            } else if (ratio > 0.7 && ratio <= 0.8) {
                ratioCollumRow = 2 //8:4
                gridGap *= 0.4;
            } else if (ratio > 0.6 && ratio <= 0.7) {
                ratioCollumRow = 2.5 //8:3
                gridGap *= 0.2;
            } else if (ratio <= 0.6) {
                ratioCollumRow = 3.5 //8:2
                gridGap *= 0.1;
            }
            columnCount = parseInt(rowCount / ratioCollumRow)
            data.setStyle('grid.gap', data.ca('grid.gap') * 0.2);
        } else { //宽屏
            if (ratio > 1 && ratio <= 1.5) {
                ratioCollumRow = 1.3 //6:8
            } else if (ratio > 1.5 && ratio <= 2) {
                ratioCollumRow = 1.5 //5:8
            } else if (ratio > 2 && ratio <= 2.5) {
                ratioCollumRow = 2 //4:8
            } else if (ratio > 2.5 && ratio <= 3.5) {
                ratioCollumRow = 2.5 //3:8
            } else if (ratio >= 3.5) {
                ratioCollumRow = 3.5 //2:8
            }
            rowCount = parseInt(columnCount / ratioCollumRow);
        }
        //回写自动格子计算的值
        data.ca('grid.row.count', rowCount);
        data.ca('grid.column.count', columnCount);
    }

    /*Grid布局参数设置*/
    data.setStyle('grid.gap', gridGap);
    data.setStyle('grid.borderRadius', 10);

    //行列分别占空比，可用于网格布局嵌套
    let columnPercentsTmp = data.ca('grid.column.percents');
    columnPercentsTmp && data.setStyle('grid.column.percents', columnPercentsTmp);
    let rowPercentsTmp = data.ca('grid.row.percents');
    rowPercentsTmp && data.setStyle('grid.row.percents', rowPercentsTmp);
    let i = 0,
        gapMode = data.ca('attach.margin.gapMode') != undefined ? data.ca('attach.margin.gapMode') : true;
    data.eachChild((node) => {
        /*如果没有设置图标名称（一般固定为"appIcon"），那么就保留组态初始设置的宽度不受布局影响，
        用以做多个图标按照横纵网格/格栅布局时，用于作为分隔符的纯显示符！*/
        if (node.getDisplayName() != undefined && trim(node.getDisplayName()) != '') {
            data.ca('node.select.width') != undefined && node.setStyle('select.width', data.ca('node.select.width'));
        } else if (node.getAttrObject()) {
            //其他时候都还原设置初始宽度
            node.setWidth(node.getAttrObject().origin_width)
            node.setHeight(node.getAttrObject().origin_height)
        }
        node.setStyle('attach.row.index', Math.floor(i / columnCount));
        node.setStyle('attach.column.index', i % columnCount);
        var paddingH = data.ca('node.margin.h'),
            paddingV = data.ca('node.margin.v');
        node.setStyle('attach.padding.top', -1 * paddingV);
        node.setStyle('attach.padding.bottom', -1 * paddingV);
        node.setStyle('attach.padding.left', gapMode && paddingH * -1); //230610，这句很重要gapMode，且默认值要为1，否则水平方向间隙会为0
        node.setStyle('attach.padding.right', gapMode && paddingH * -1);
        i += 1;
    })

    /*界面节点构建或脱离父子关系绑定时，代码也相应设置或解除布局host关系*/
    if (cache.initOnce == undefined) {
        cache.initOnce = true;
        _i.setAttrsFormBinded(data, ['datas', 'grid.row.count', 'grid.column.count', 'rowIndex', 'columnIndex', 'removeOthers', 'grid.row.percents', 'grid.auto.fill', 'grid.column.percents', 'grid.gap', 'valueGet', 'itemsGet']);

        if(runningMode() && data.ca('borderWidth') == 3) data.ca('borderWidth',0);
        _i.onChildRemoved(data, (child, index) => {
            child.setHost(null);
            child.s('2d.movable', true);
            child.setToolTip(undefined);
        });

        //tips 230401，实测发现初始加载运行不会进来，动态操作子节点才会进来
        _i.onChildAdded(data, (child, index) => {
            let attrstmp = child.getAttrObject();
            if (attrstmp == undefined) attrstmp = {}
            attrstmp['origin_width'] = child.getWidth()
            attrstmp['origin_height'] = child.getHeight()
            child.setAttrObject(attrstmp);
            child.setHost(data);
            child.s('2d.movable', false);
            child.setToolTip('网格内布局的图元不允许拖动');
            child.s('2d.selectable', false);
        });

        //点击/选中事件
        let miEvent = e => {
            if (e.kind === 'clickData' && e.event && !runningMode()) { //230401，编辑状态下才如此，加上了&& !runningMode()
                //选中grid后，随后子节点才可以选中，移到位置再次点击就行
                if (e.data == data && e.data.dm()) { //230610，将条件e.data == data移到内部来判断，因为可能是先喜欢中的就是内部子节点 
                    data.eachChild(child => {
                        child.s('2d.selectable', true);
                    });
                    //230917，子节点允许选中后，需要将自身的可选中去掉变成不可选中。
                    data.s('2d.selectable', false);
                }
                if (e.data && e.data.getParent() == data && e.data.dm()) {
                    //230917，一旦这里发现自己是不可选中状态，实测发现表明了还有下级子节点需要继续穿透，那么直接return不做下面的操作。为什么不用判断getChildren().size()，暂未深究，实测已经凑效了！
                    if (e.data.s('2d.selectable') == false) return;
                    data.s('2d.selectable', false);
                    let parNode = _i.parentNode(data); //递归父节点，如果不存在那么就是自身
                    parNode.s('2d.selectable', true);
                    _i.getChildren(parNode, ['ht.Edge'], true, true).forEach(itemNode => {
                        //230917，对于当前不可选中下级子节点的就不影响选中状态，其他的多级子节点，就用false，不允许选中。实测生效，暂未进一步分析。
                        if (!(!e.data.s('2d.selectable') && itemNode.getParent() == e.data)) {
                            itemNode.s('2d.selectable', itemNode == e.data);
                        }
                    });

                }
            } else if (e.kind === 'clickBackground' && e.event && !runningMode()) {
                data.s('2d.selectable', true);
            }
        };

        //231120，运行状态下，网格除了自身，下面所有都允许可选中，不像编辑状态那样需要点击逐层进入往复选中！
        if (runningMode()) {
            data.s('2d.selectable', false);
            data.eachChild(child => {
                child.s('2d.selectable', true);
            });
        } else { //tips 编辑状态下才要监听点击事件，动态设置各层内图元组件的可选中属性！
            if (gv._i_gridOldMiEvent == undefined) gv._i_gridOldMiEvent = {};
            if (gv._i_gridOldMiEvent[tagtmp] != undefined) {
                gv.umi(gv._i_gridOldMiEvent[tagtmp]);
                gv._i_gridOldMiEvent[tagtmp] = undefined;
            }
            gv.mi(miEvent);
            gv._i_gridOldMiEvent[tagtmp] = miEvent;
        }

        //经过取消后，判断当前grid内还是有选中的，那就不管，如果都没有选中的了，那就恢复默认grid可选中而内部子节点不可选中
        let hasSelected = false;
        gv.onSelectionChanged = e => {
            //230401，运行模式下，内容图元都得是可选中状态
            if (runningMode()) return;

            if (e.kind == 'clear') {
                /*tips 230912，发现到这里，selectionModel已经是清空了，不再包含e.datas里前一次选中的组件在选中模型内！因此下面貌似起不到作用hasSelected
                还是false，为了避免还有其他用途，暂时不移除。*/
                data.eachChild(child => {
                    if (gv.dm().getSelectionModel().co(child)) hasSelected = true;
                })

                if (!hasSelected) {
                    //230901，加上限制条件data.s('2d.selectable') && ，只要是当前父节点是取消选中，那么不会进入到这里让子节点为不可选中的设置
                    data.s('2d.selectable') && data.eachChild(child => {
                        /*230912，由false改成了e.datas.indexOf(child) == -1 ? false : true，这样可以实现点击网格内的组件后，到外部右键连线，
                        回过头来此前选中的这个组件就可以被选中，从而能对其连线，避免难以对网格内组件连线需要先移出来再移进去，太麻烦！*/
                        child.s('2d.selectable', e.datas.indexOf(child) == -1 ? false : true);
                    });
                }
            } else if (e.kind == 'set' && !gv.dm().getSelectionModel().co(data)) {
                //230901，加上限制条件data.s('2d.selectable') && ，只要是当前父节点是取消选中，那么不会进入到这里让子节点为不可选中的设置
                data.s('2d.selectable') && data.eachChild(child => child.s('2d.selectable', false));
            }
        };

        //新增填充
        function __newDefault(index, initialGroup = false) { //index用于做索引tag
            let defaultData = null,
                childrenTmp = data.getChildren(),
                sizetmp = childrenTmp.size();
            if (sizetmp == 0 || initialGroup) {
                defaultData = new ht.Node();
                defaultData.setTag('_field_' + index + '@' + _i.autoTag(data));
                defaultData.setName('cbox');
                _i.autoTag(defaultData);
                defaultData.s('label.opacity', 0);
                defaultData.ca('labelEmbeded', true);
                gv.dm().add(defaultData);
                data.addChild(defaultData);
                defaultData.setImage('symbols/develop/uiotos/base/combobox-ui.json');
            } else {
                defaultData = _i.copyNode(childrenTmp.get(sizetmp - 1)); //_i.setDataJson(defaultData, _i.getDataJson(childrenTmp.get(sizetmp - 1)), null, [], null, false);
                data = defaultData.getParent(); //对于调整行列，需要连续新建多个时，每次创建完上一个，注意把当前最新的网格对象给更新给变量！因为复制copyNode里面有做了序列化加载，对象变了！
                _i.typeMatched(defaultData, 'cbox') && defaultData.setTag('_field_' + index + '@' + _i.autoTag(data));
                _i.autoTag(defaultData); //刷新一下，确保tag和displayName同步。_i.copyNode里面有自动创建tag，但是未必都是name、displayName同步的！
            }
            return defaultData;
        }

        //通常用于循环中，传入cbox对象和所在的索引index（虽然根据其中一个能算出另一个，但是在循环中，两个参数都可传入，没必要再算）
        function __setIndexedCboxData(cboxNode, index, rawData) {
            let fieldName = data.ca('_field_' + index);
            let cboxData = _i.formatComboboxTree(_i.formatTreeTable(_i.convertArrayToTree(rawData,null,true), [fieldName],'id',true));
            cboxNode.ca('datas', _i.arrKeyTypes(cboxData)); //去重
        }

        //查询条件直到哪个索引的下拉框时，传入值形成的约束条件结合，获得查询后满足条件的对象数组
        function __dataFiltered(toIndex) {
            let foundArr = _i.arrFilter(data.ca('datas'), (() => {
                let condition = {};
                /*3）查询条件为从0开始到索引为当前下拉选中值得结束，所以当前值一起组合，成为条件，并且
                继续往后更新，直到更新完所有剩下组件的可选参数*/
                for (let inx = 0; inx < toIndex; inx += 1) {
                    condition[data.ca('_field_' + inx)] = _i.getChildren(data).get(inx).a('value');
                }
                return condition;
            })());
            return foundArr;
        }

        //任何一级选中，都可以触发bindControls
        function __formEventBubblingUpper(value = null) {
            let lentmp = _i.getChildren(data).size();

            //231009，之前妨到a:valueGet中用(()=>{})()，现在改成独立计算：
            let valGetTmp = value;
            if (!value) {
                let result = {};
                for (let idx = 0; idx < lentmp; idx++) {
                    //231009，原先key是图元对象了：data.ca('_field_' + idx)，现在直接改成用属性名称！
                    result['_field_' + idx] = _i.getChildren(data).get(idx).a('value');
                }
                value = result;
            }

            //任何一级选中，都可以触发bindControls
            _i.formEventBubblingUpper(data, gv, cache, 'onChange', {
                'a:valueGet': valGetTmp,
                'a:itemsGet': value ? value : __dataFiltered(lentmp)
            }, true, true);
        }

        //初始化完毕后的回调，只有初始化后，设置addChild才能响应这里内置的onChildAdded逻辑，外部设置回调函数_i_onInited给对象！
        data._i_onInited && data._i_onInited(data, gv, cache);

        //监听编辑状态交互
        _i.md(data, gv, cache, {
            's:2d.visible': e=>{//240927，网格显示隐藏，对应内部组件也显示隐藏
                data.getChildren().forEach(child=>{
                    child.getClassName() != 'ht.Edge' && child.s('2d.visible',e.newValue);
                });
            },
            'a:grid.row.count|a:grid.column.count': e => {
                let autoFillTmp = data.ca('grid.auto.fill'), //230613
                    isInitial = e.oldValue === '__init__', //是否是初始化加载
                    oldChildrenSize = _i.getChildren(data).size(),
                    rowCountTmp = __autoCalculate().rowCount,
                    columnCountTmp = __autoCalculate().columnCount,
                    diffSize = rowCountTmp * columnCountTmp - oldChildrenSize; //动态改变的子组件数量（实际子组件，与行列配置的差别）
                if (_i.isInitOrNull(e.oldValue)) {
                    // let idOldUndefined = e.oldValue === undefined;
                    if (e.property == 'a:grid.row.count') e.oldValue = rowCount;
                    else e.oldValue = columnCount;

                    //230613，发现做了对动态最佳最后一个组件修改了__newDefault后，对于初始的4个cbox，再次手动修改属性时，发现得到e.oldValue为undefined！！从而导致没实例化，因此加上判断这里不return掉
                    if (oldChildrenSize == 0) e.oldValue = 0; //初始化时，直接新增
                }
                //230613，增加了自动填充开关属性，默认新增行列会填充，去掉勾选后，则不填充，只保留占空。
                if (!autoFillTmp) return;

                //按照diffSize自动追加
                function __autoCreate() {
                    //230613，这里对索引i加上了此前的数量，主要是对于默认的下拉组合框，动态增加时，tag命名的序号能够按照长度自增而不至于重复，级联功能需要识别这里的tag里面的index
                    for (let i = 0 + oldChildrenSize; i < diffSize + oldChildrenSize; i++) {
                        /*230612，加上第二个参数，用来让初始页面加载时，连续创建初始cbox组。原始为空，可能为undefined还是0、null。0==null，是false，不能用e.oldValue == null这种！
                        避免循环的第二次就到了复制粘贴了，这就耗时了！！*/
                        __newDefault(i, !e.oldValue);
                    }
                }
                //按照diffSize自动移除
                function __autoRemove() {
                    if (diffSize == 0) return; //230613，差值如果为0，那么不增不减！如果通过else走到减/移除这里，slice(0)和slice(-0)一样，都是全部选选择，导致全部移除！
                    //tips 2300617，diffSize严格是新值减去旧值，因此，减少时，diffSize为负数！这里slice参数为负数，就是从末尾倒数开始！
                    let tobeRemoved = _i.getChildren(data).slice(diffSize);
                    tobeRemoved.forEach(child => {
                        child.ca('dynamicDelete', true); //标记了动态移除的，在遍历时移除的同时，还要对上层属性的dynamicCreate标记（如果有）去除掉
                        data.removeChild(child);
                        /*230617，但是会存在问题，底层grid动态删除就会加上dynamicDelete属性，并且无法通过内嵌loadDisplay用到时删除，因此，通过判断当前页面是否是顶层也就是在
                        grid所在页面编辑动态减少行列时，真实删除掉减少的组件！被嵌套时，删除不能在这里进行，会导致无法通过属性暴露逐层向上同步数据绑定的删除标记。*/
                        if (_i.rdm(data.dm()) == data.dm()) {
                            data.dm().remove(child);
                            child = null;
                        }
                    })
                }

                /*230613，如果是初始化加载，那就不管当前传入的oldValue和newValue判断行增加还是列增加从而自动增加一行或一列的数据了初始化加载，只要由空的（行列和大于当前已有子组件数量），
                且autoFillTmp为true，那么这些空的都会被自动填充！也就不关心当前是行改变/初始化还是列改变/初始化进来到这里的，只要有一个加入到初始触发即可！*/
                if (isInitial) {
                    if (diffSize > 0) __autoCreate();
                    else __autoRemove();
                } else {
                    //tips 2300617，diffSize严格是新值减去旧值，因此，减少时，diffSize为负数！
                    let batchCount = e.property == 'a:grid.row.count' ? columnCountTmp : rowCountTmp;
                    if (e.oldValue <= e.newValue) { //增加，自动填充
                        diffSize = (e.newValue - e.oldValue) * batchCount;
                        //230402，去掉新增钱的清除，非常不友好！假如前面的好不容易都配置好了的情况下！
                        //新增前，先都清掉
                        // _i.removeChildren(data);

                        __autoCreate();
                    } else { //减少，自动移除
                        console.assert(e.newValue < e.oldValue); //相等一般不会触发进来！
                        diffSize = (e.newValue - e.oldValue) * batchCount;
                        __autoRemove();
                    }
                }
                diffSize != 0 && _i.setTimeout(() => {
                    let upperTmp = _i.upperData(data);
                    if (upperTmp && !upperTmp._multiRequestingLeft) upperTmp._multiRequestingLeft = 1;
                    data.dm() && data.dm().handleCurrentSymbol && data.dm().handleCurrentSymbol(true, false, data);
                }, 0);
            },
            //230826，选中行列指定的项用来显示，其他的都被移除掉。因此通常是用于内嵌页面在上层来配置该属性，这样当前层的配置就不会无法重新选择配置。
            'a:rowIndex|a:columnIndex': e => {
                if (e.oldValue === '__init__' && e.newValue < 0) return; //240617，初始化时，对于没有配置的返回掉！
                let rowIdx = data.ca('rowIndex'),
                    columnIdx = data.ca('columnIndex');
                if (rowIdx !== undefined && columnIdx !== undefined && rowIdx >= 0 && columnIdx >= 0) {
                    //直接移除，但是这样会导致无法重复设置，需要通过嵌套或者重新拖入新的组件再配置！
                    if (data.ca('removeOthers')) {
                        let targettmp = data.getChildren().get(rowIdx * data.ca('grid.column.count') + columnIdx);
                        targettmp && data.dm().moveToTop(targettmp);
                        _i.setTimeout(() => {
                            _i.update(data, 'a:grid.column.count', 1);
                            _i.update(data, 'a:grid.row.count', 1);
                        }, 0);
                    } else {
                        if (data.ca('grid.row.percents') == undefined) data.ca('grid.row.percents', []);
                        if (data.ca('grid.column.percents') == undefined) data.ca('grid.column.percents', []);
                        for (let idx = 0; idx < data.ca('grid.row.count'); idx++) {
                            _i.setArrayIndexValue(data.ca('grid.row.percents'), idx, idx === rowIdx ? 0 : -1);
                        }
                        for (let idx = 0; idx < data.ca('grid.column.count'); idx++) {
                            _i.setArrayIndexValue(data.ca('grid.column.percents'), idx, idx === columnIdx ? 0 : -1);
                        }
                    }
                } else {
                    if (rowIdx < 0) {
                        _i.update(data, 'a:grid.row.percents', []);
                    }
                    if (columnIdx < 0) {
                        _i.update(data, 'a:grid.column.percents', []);
                    }
                }
                data.fp('a:grid.row.percents', undefined, data.ca('grid.row.percents'));
            },
            'a:grid.gap|a:node.margin.v|a:node.margin.h|a:grid.border': e => {
                if (!isArrayFn(data.ca('grid.border'))) {
                    data.setStyle('grid.border', data.ca('grid.border') - data.ca('grid.gap'));
                } else {
                    data.setStyle('grid.border.top', data.ca('grid.border')[0] - data.ca('grid.gap') - data.ca('node.margin.v'));
                    data.setStyle('grid.border.right', data.ca('grid.border')[1] - data.ca('grid.gap') - data.ca('node.margin.h'));
                    data.setStyle('grid.border.bottom', data.ca('grid.border')[2] - data.ca('grid.gap') - data.ca('node.margin.v'));
                    data.setStyle('grid.border.left', data.ca('grid.border')[3] - data.ca('grid.gap') - data.ca('node.margin.h'));
                }
            },
            'a:enable': e => {
                data.ca('a:sizeSet') && data.fp('a:sizeSet', null, data.ca('a:sizeSet'));
            },
            'a:sizeSet': e => {
                let childrentmp = _i.getChildren(data);
                if (e.oldValue == '__init__' && childrentmp.size() > 0) {
                    let idxtmp = 0,
                        hasAttrLost = false;
                    childrentmp.each(child => {
                        if (_i.isControlTyped(child, 'cbox')) {
                            //240607，注意，不用hasAttrObjectKey，而用下面这个hasAttrInLocalObj，因为这才是当前实际看到属性列表中的！
                            if (!_i.hasAttrInLocalObj(data, '_field_' + idxtmp)) hasAttrLost = true;
                            idxtmp += 1;
                        }
                    });
                    if (!hasAttrLost) return;
                    console.error('sizeSet is not empty,but dynamic attrs with name _field_ ahead has been lost,and will be auto recreated');
                }

                if (!data.ca('enable')) {
                    e.newValue > 0 && _i.isEditing(data) && _i.alert('属性enable未开启，设置将不起作用！');
                    return;
                }
                let ccount = e.newValue,
                    rcount = 1;
                //【待完善】220224，水平一行最多5个字段，超过的话，自动按照列来！注意，目前不具备grid高度自动伸缩，以及内部自动滚动布局，需要注意行动态追加的情况需进一步完善！
                if (e.newValue > 5) {
                    _i.alert('最多支持5个级联下拉框！');
                    _i.update(data, 'sizeSet', 5);
                    return;
                }
                // /*240225，加入第三个参数e，如果e.oldValue是__init__初始化加载，那么就不清理数据绑定data.getDatabindings的设置值attrObject，因为可能下面紧接着初始动态增加insertTempAttr，否则会出现
                // 比如内嵌api组件继承到上层form绑定的值，设置无法锁定等怪异现象。*/
                _i.clearTempAttrs(data, null, e);

                //tips 240608，这里会自动创建触发行列数量！
                _i.update(data, 'a:grid.column.count', ccount);
                _i.update(data, 'a:grid.row.count', rcount);

                let lentmp = e.newValue;
                if (e.newValue == 0 && isArrayFn(data.ca('datas'))) {
                    lentmp = data.ca('datas').length;
                }
                if (lentmp) {
                    let fields = [];
                    for (let i = 0; i < lentmp; i++) {
                        let fieldtmp = '_field_' + i;
                        fields.push(fieldtmp);
                        _i.insertTempAttrs(data, [{
                            attr: fieldtmp,
                            name: '字段_' + i,
                            valueType: 'String',
                            defaultValue: '',
                            description: `索引${i}的下拉框对应的数据字段。<a href="https://www.yuque.com/liuhuo-nc809/uiotos/mttyppid7d9y7sqk#drlSR" style="color:rgb(96,172,252)" target="_blank">详情</a>`
                        }], 'sizeSet');
                    }
                    _i.setAttrsFormBinded(data, fields);
                }
            },
            'a:datas': e => {
                _i.enableAttrEditByFirstItem(data,e);

                let datastmp = e.newValue;
                _i.getChildren(data).toArray().forEach((child, index) => {
                    __setIndexedCboxData(child, index, datastmp);
                });

                //初始赋值
                __formEventBubblingUpper();
            } 
        }, ['a:sizeSet', 'a:grid.border', 'a:grid.row.count', 'a:grid.column.count', 'a:rowIndex', 'a:columnIndex', {
            's:2d.visible':'__init__' //240928，如果网格初始为隐藏状态，那么需要加上这里，确保初次显示网格时，能触发md的响应，让内部组件也能显示！
        }], null, data, e => {}, e => {
            //tips 230613，最后一个回调为children的事件，因此下面a:value是处理子节点的事件，默认为cbox下拉框的value事件，并非grid网格本身的属性
            //231006，增加条件data.ca('enable') &&，否则常规用gird布局的查询表单，结果默认让后一个的数据受到前面一个下拉框数据选的影响了！！
            if (data.ca('enable') && _i.typeMatched(e.data, 'cbox') && e.property == 'a:value' && e.newValue != undefined) { //230613，加上了条件，限定grid网格子节点是下拉组合框且值不为undefined时
                let tagtmp = e.data.getTag().split('@');
                if (tagtmp.length == 2 && tagtmp[1] == data.getTag()) {
                    let fieldTmp = tagtmp[0], //1）_field_3
                        arrIndex = Number(fieldTmp.split('_').slice(-1)[0]), //2）比如从_field_12里面获取12
                        maxIndex = _i.getChildren(data).size() - 1, //最大索引序号
                        curValue = e.data.a('value'), //3）'人脸机设备004'
                        datastmp = data.ca('datas'); //4）[{…}, {…}, {…}, {…}, {…}]
                    if (arrIndex != maxIndex) {
                        //1）从当前下拉选择值的地方的下一个控件开始一直到末尾
                        for (let idx = arrIndex + 1; idx <= maxIndex; idx++) {
                            //2）逐个更新可下拉选择的数据内容
                            __setIndexedCboxData(_i.getChildren(data).get(idx), idx, __dataFiltered(idx));
                        }
                    }
                    //以当前值对外触发
                    __formEventBubblingUpper();
                } else {
                    console.error('WARNING: tag error!!', tagtmp, e.data, data);
                }
            }
        });
    }
}

//函数通过渲染元素封装成可视化图元组件的典型示例：
function __convertor(data, gv, cache) {

    cache = _i.innerRecoveredDataCache(data, cache, false, 'func', '工具函数');
    if (cache === undefined) return; //231214，在里面做了判断处理，如果data.dm()为null，那么清理data，并返回undefined

    if (!cache.init) {        
        let attrsCommonTmp = []; //240804，动态创建的属性名称列表！
        //240803，为了方便看组件文档。在已有的description后面追加字符串。
        function __docLink(url, info = '组件文档', nextRow = true){
            return (nextRow ? '\n' : '') + `点击查阅<a href=${url} style="color:rgb(96,172,252)" target='_blank'>${info}</a>`
        }
        //240803，独立调用，直接重写指定属性的description。并且选择性是否覆盖原先的注释。默认对所有的公共属性会重写追加，此外支持传入个别attr和tips，主要是inputs属性单独给注释！
        function __addLinkAppend(url,attr = null, tips = null, info = '组件文档', nextRow = true, _fromInner = false){
            if(!_fromInner){
                attrsCommonTmp.forEach(attrTmp=>{
                    if(attr && attr == attrTmp) return; //240804，避免先递归设置默认描述，结果实际上要覆盖的反而认为已设置而忽略！先对于有传入attr的，不做默认的！
                    //240804，初始传入attr、tips，是为了给知道给指定attr补充注释，比如inputs，这里需要避免递归公共属性时，参数都给用上了！！
                    __addLinkAppend(url,attrTmp, _fromInner && tips ? tips : null, info, nextRow, true);
                });
            }

            let itemtmp = attr && i.getAttrItem(data, attr),
                desc = itemtmp && itemtmp.description;
            if(desc &&　((!tips || desc.indexOf(tips) == -1) && desc.indexOf(info) == -1) && itemtmp){
                itemtmp.description = desc + (nextRow ? '\n' : '') + (tips ? tips : '') + `点击查阅<a href=${url} style="color:rgb(96,172,252)" target='_blank'>${info}</a>`;
            }
        }

        //240904，只有在jsonStruct没有配置时，才考虑此前旧属性convertFlatToTree的兼容！
        if(i.hasAttrObjectKey(data,'convertFlatToTree')){
            console.error('WARN: func has convertFlatToTree and will force jsonStruct be auto converted',i.commonTip(data)); //241004，提示一下！
            data.ca('jsonStruct', data.ca('convertFlatToTree') ? 1 : 2);
            data._i_hasConvertFlatToTree = true;
        }else if(data.ca('jsonStruct') === undefined){
            data._i_hasConvertFlatToTree = undefined;
            //240809，兼容此前的convertFlatToTree属性配置，现在用新的枚举类型jsonStruct代替！之前默认不勾选convertFlatToTree时，貌似输入inputs，也会是保持对象结构 ，而不是新规则这种，只要是模式0，就会扁平化！
            let curJsonStructType = data.ca('convertFlatToTree');
            if(data.ca('convertFlatToTree') === undefined) curJsonStructType = 0; //此前convertFlatToTree定义时默认值为false。因此如果此前未配置，也是相当于配置了1。
            curJsonStructType = Number(curJsonStructType);
            if(curJsonStructType == 0) curJsonStructType = 1;//240810，必须默认模式为1，否则对参数对象的任意输入，结果字段受限制了！！
            i.update(data,'jsonStruct', curJsonStructType);
            data.ca('convertFlatToTree',undefined); 
        }
        if(i.hasAttrObjectKey(data,'convertFlatToTree') && data.ca('outputByEvent') === undefined){
            i.update(data,'outputByEvent', false);
        }

        //240730，多个属性在分散的函数中，公共的配置，避免每个渲染元素json都要来一次！
        attrsCommonTmp = i.insertTempAttrs(data, [{
                attr: 'noteTips',
                valueType: 'Multiline',
                name:"别名注释",
                bindIgnored: true,
                description: `默认为函数名称，可备注修改。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#Hw6Bw' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
            },{
                attr: 'color',
                valueType: 'Color',
                name:"显示颜色",
                defaultValue: 'rgb(51,153,255)',
                description: `图标和文字颜色。`,
                bindIgnored: true,
                extraInfo: '*'
            },{
                "attr": "exeWhenInput",
                "valueType": "Boolean",
                "defaultValue": false,
                "name": "输入赋值时执行",
                bindIgnored: true,
                description: `值输入且变化时，自动触发函数执行。` 
            },
            {
                "attr": "resetAfterInput",
                "valueType": "Boolean",
                "name": "输入赋值后清空",
                "description": `值输入并执行后，会自动复位成空
                对象{}，确保下次任何输入会触发变化。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#Qo3GX' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                "defaultValue": false,
                bindIgnored: true,
                extraInfo: '★'
            },
            {
                "attr": "inputsArrToObj",
                "valueType": "Boolean",
                "name": "输入数组转对象",
                "description": `是否切换成对象格式显示和输入。
                注意：切换方式不会改变值本身。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#Jij1U' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                "defaultValue": true,
                bindIgnored: true,
                extraInfo: '★'
            },
            {
                "attr": "stripSingleInput",
                "valueType": "Boolean",
                "defaultValue": true,
                "name": "输入组单个取出",
                "description": `输入组为数组且只有1个元素时，取出
                <br>这个元素作为实际输入值，代替原先的输入。默
                <br>认inputs为数组格式，手动输入时通常会在数组
                <br>的首元素输入，本属性保持默认勾选时，实际计
                <br>算会以首元素作为实际输入值。
                <br>也可以勾选“输入数组转对象”，此时输入组的属
                <br>性栏由数组切换为对象输入，就可以任意输入非
                <br>数组类型的值了。`,
                extraInfo: '~',  //240730，因为有“输入数组转对象”属性了，当前属性不再对外显示了！
                bindIgnored: true,
            },
            {
                "attr": "exeWhenLoad",
                "valueType": "Boolean",
                "defaultValue": false,
                "name": "组件加载时执行",
                "description": `所在的页面加载时，组件自动触发执行。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#OAge1' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                extraInfo: '*',
                bindIgnored: true,
            },
            {
                "attr": "oldValueMerge",
                "valueType": "Boolean",
                "defaultValue": false,
                "name": "输出合并非覆盖",
                "description": `输出与目标属性值合并，非默认覆盖。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#ACnaO' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                bindIgnored: true,
                extraInfo: '★'
            },
            {
                "attr": "outputByEvent",
                "valueType": "Boolean",
                "defaultValue": true,
                "name": "输出经事件返回",
                "description": `直接输出属性值，而非默认表单数据。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#mcfhK' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                bindIgnored: true,
                extraInfo: '★'
            },
            {
                "attr": "parseFailedNull",
                "valueType": "Boolean",
                "defaultValue": true,
                "name": "输出解析默认空",
                "description": `解析失败未提取到字段值时，返回空。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#awhIA' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                bindIgnored: true,
                extraInfo: '*'
            },
            {
                "attr": "inputs",
                "valueType": "Object",
                "name": "输入（组）",
                "defaultValue": [],
                "description": `工具函数的输入。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#aTR5v' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
            },
            {
                "attr": "delay",
                "valueType": "PositiveNumber",
                "defaultValue": 0,
                "name": "延时执行毫秒",
                "description": `异步延迟执行时间（ms）。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#K5Me7' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                bindIgnored: true,
                extraInfo: '*'
            },
            {
                "attr": "exec",
                "valueType": "Boolean",
                "defaultValue": false,
                "name": "执行",
                description:`触发工具函数执行。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#yMMTA' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
            },
            {
                "attr": "arrExec",
                "valueType": "Boolean",
                "defaultValue": false,
                "name": "遍历执行",
                "description": `数组遍历执行。当输入为数组时，
                将拆成逐项单独单独顺次执行。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#ovTxm' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                extraInfo: '*',
                bindIgnored: true,
            },
            {
                "attr": "whenOutputing",
                "valueType": "MultiComboBox",
                "name": "whenOutputing",
                extraInfo: '~',
                bindIgnored: true,
            },
            {
                "attr": "changeOutputTo",
                "valueType": "MultiComboBox",
                "extraInfo": {
                        "enum": {
                        "values": [
                            "不转换",
                            "空对象（null）",
                            "未定义（undefined）",
                            "空字符串（\"\"）",
                            "否（false）",
                            "等于零（0）"
                        ]
                    }
                },
                "defaultValue": "不转换",
                "name": "changeOutputTo",
                extraInfo: '~',
                bindIgnored: true,
            },
            {
                "attr": "output",
                "valueType": "Object",
                "name": "输出",
                "description": `函数执行后的结果输出。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#YPMiQ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
            },
            {
                "attr": "userData",
                "valueType": "Object",
                "defaultValue": [],
                "description": "用户数据。",
                bindIgnored: true,
            },
            {
                "attr": "onOutput",
                "valueType": "Function",
                "description": "输出事件。",
                "extraInfo": {
                    "arguments": [
                    "data",
                    "gv",
                    "cache",
                    "value"
                    ]
                },
                description:`函数执行完毕输出结果时触发。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#d7xnO' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
            }
        ],'function');

        data.s('pixelPerfect', true);
        cache.init = 'done';
        //不允许编辑尺寸
        data.s('2d.editable', false);
        data.s('select.width', 0.5);
        data.s("select.type", "roundRect")
        data.s('select.color', 'rgb(124,145,155)');
        let funcName = data.ca('function');
        data.s('label', funcName);
        if (!runningMode()) {
            let configTypes = window.valueTypes,
                funcIndex = configTypes.ToolFunction.values.indexOf(funcName);
            //230926，信息提示，可以手动修改作为注释！！
            let toolTipTmp = data.getToolTip(),
                infotmp = configTypes.ToolFunction.i18nLabels[funcIndex] + '<br>' + funcName;
            !toolTipTmp && data.setToolTip(infotmp);
            //230926，提示文字，便于注释，其实也可以直接在‘文字’属性组中设置，只是麻烦些。
            if (!data.ca('noteTips')) data.ca('noteTips', i.getValueTypeName('ToolFunction', data.ca('function')));
        }
        //230525，加上这里避免无法修改func的文字位置，每次重新加载就被还原了！
        let postmp = data.s('label.position'),
            yoffset = data.s('label.offset.y'),
            xoffset = data.s('label.offset.x'),
            fonttmp = data.s('label.font'),
            colortmp = data.s('label.color');
        //默认没有做任何属性时候的样式，此时给一个自定义的默认值。此后的修改，都会保持用户的设置
        function __isLabelDefault() {
            //240516，新的工具函数，位置默认是20，这里枚举列出，避免修改为之后无法保存！但是其他几个枚举的，屏蔽后，对之前的是否会有影响？？
            return ( /*postmp == 2 || postmp == 31 ||*/postmp == undefined || (postmp == 14 && (fonttmp == '12px arial, sans-serif' || fonttmp == undefined)) || postmp == 20) && (colortmp == '#ddd' || colortmp == "rgb(189,199,219)" || colortmp == 'rgb(51,153,255)' || colortmp == "rgb(61,61,61)");
        }
        if (__isLabelDefault()) {
            data.s('label.position', 20);
            data.s('label.offset.y', 5);
            data.s('label.offset.x', 0);
            data.s('label.font', '26px Microsoft YaHei');
            data.s('label.color', 'rgb(51,153,255)');
            data.s('label.align', 'left'); //230926，默认靠左对齐
        }
        //全局是否可见函数文字
        data.s('label.opacity', data.dm().a('funcNameVisible'));

        //默认表单属性
        i.setAttrsFormBinded(data, ['output', 'outputByEvent', 'inputs', 'exec', 'arrExec', 'onOutput']);

        //231106，输出事件，用于内嵌时不需要一定要勾选容器的事件通过
        data.ca('bindEvents', ['*', 'onOutput']);

        //230817，初始化赋值对MultiCombobox类型多选下拉框，并且翻译属性
        data.ca(i.trans('whenOutputing'), i.trans('全部（*）'));
        data.ca(i.trans('whenOutputing') + '-list', [
            '全部（*）',
            "空对象（null）",
            "未定义（undefined）",
            '空字符串（""）',
            '否（false）',
            "等于零（0）",
            "小于零（<0）",
            "NaN"
        ]);

        //转换完毕后触发数据
        function __return(value) {
            //230906，将对外执行由直接对外输出data.fp('a:output', null, value);改成了如果有勾选遍历执行且是输出准输出，那么就遍历逐个输出！
            let outputValue = [];
            if (isArrayFn(value) && data.ca('arrExec')) outputValue = value;
            else outputValue = [value];
            outputValue.forEach((itemValue, idx) => {
                data.fp('a:output', '__exe__', itemValue); //231106，oldValue由之前的null，改成了__exe__，让output监听中识别，并判断是否做触发连线操作！
            });
            //常规执行结束、复位时，也对遍历执行复位！
            i.update(data, 'arrExec', false);
        }

        //不同函数，增加不同的配置属性
        let funcAttrs = {
            'transfer': e=>{
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#TWkHe');
            },
            'fileUpLoad': e => {
                // i.update(data, 'stripSingleInput', false); //231130，切换过来需要默认不勾选时，加上这句。
                //240104，增加URL参数，指定自定义的服务器上传接口
                i.insertTempAttrs(data, [{
                    attr: '_paramType',
                    valueType: 'StyleTypedParam',
                    defaultValue: 'postTypedParam',
                    name: '传参模式 ☆',
                    bindIgnored: true,
                    description: `支持表单键值对，或URL拼接传参。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#cW5uK' style="color:rgb(96,172,252)" target='_blank'>详情</a>`    
                }, {
                    attr: '_specifyiedURL',
                    valueType: 'Object',
                    name: '接口地址 ☆',
                    bindIgnored: true,
                    description: `服务器文件上传接口地址。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#oMmX8' style="color:rgb(96,172,252)" target='_blank'>详情</a>`    
                }, {
                    attr: '_fileTypesFilter',
                    valueType: 'String',
                    defaultValue: 'image/*',
                    name: '文件过滤 ☆',
                    bindIgnored: true,
                    description: `文件过滤格式，弹窗选择时用。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#ZfLrw' style="color:rgb(96,172,252)" target='_blank'>详情</a>`    
                },{
                    attr: '_autoAlert',
                    valueType: 'Boolean',
                    defaultValue: false,
                    name: '状态提示 ☆',
                    bindIgnored: true,
                    description: `操作完成后自动弹窗提示。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#CGuHE' style="color:rgb(96,172,252)" target='_blank'>详情</a>`    
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#d5h0j','inputs','用于输入接口参数对象。');
            },
            'fileBase64Choosed': e => {
                data.ca('inputs', ['image/*']);
            },
            'isEqual': e => {
                i.insertTempAttrs(data, [{
                    attr: '_equalTo',
                    valueType: 'IsEqual',
                    defaultValue: true,
                    name: '选择判断 ☆',
                    bindIgnored: true,
                    description: `选择判断输入与目标值相等与否。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#nlnxl' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_strict',
                    valueType: 'StrictLevel',
                    defaultValue: 'lowest',
                    name: '严格程度 ☆',
                    bindIgnored: true,
                    description: `比较数值和类型，以及严格程度。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#QA1U6' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_target',
                    valueType: 'Object',
                    defaultValue: undefined,
                    name: '目标值 ☆',
                    bindIgnored: true,
                    description: `用于与输入值判断。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#apXm1' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_falseReturn',
                    valueType: 'Object',
                    defaultValue: false,
                    name: '错误时输出 ☆',
                    bindIgnored: true,
                    description: `结果错误时输出的值，默认为false。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#RoRCz' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_trueReturn',
                    valueType: 'Object',
                    defaultValue: true,
                    name: '正确时输出 ☆',
                    bindIgnored: true,
                    description: `结果正确时输出的值，默认为true。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#H9y8Y' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#Pq3D2','inputs','用于与目标值比对。');
            },
            'condition': e => {
                i.update(data, 'stripSingleInput', false); //231130，切换过来需要默认不勾选时，加上这句。
                data.ca('_emptyJudge-list',['所有空值','空字符 ""','无对象 null','空对象 {}','空数组 []']);
                //一定要初始是数组对象，即便为空数组，因为这样，就能支持多个连线指向这个属性，静态值设置索引从而操作赋值到具体某个索引的值！
                if (data.ca('inputs') == undefined) data.ca('inputs', []);
                i.insertTempAttrs(data, [{
                    attr: '_logical',
                    valueType: 'Logical',
                    defaultValue: 'allSatisfy',
                    name: '判断逻辑 ☆',
                    bindIgnored: true,
                    description: `输入（组）数组各项参会当前逻辑判断。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#gOS2V' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_emptyJudge',
                    valueType: 'MultiComboBox',
                    defaultValue: '所有空值',
                    name: '空值为否 ☆',
                    bindIgnored: true,
                    description: `列出所有空类型的数据，勾选的判断
                    为false，没勾选的判断为true。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#HMRME' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_content', //值用来被固定或动态写入，当上述条件满足的情况下，该值会被作为output输出！
                    valueType: 'Object',
                    defaultValue: true,
                    name: '自定义输出 ☆',
                    bindIgnored: true,
                    description: `任意用户数据，当条件满足，
                    且有勾选启用自定义时输出。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#r3XEl' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    /*有勾选时，条件满足后的触发将_content属性的值给出去操作交互，而条件不满足时不触发！如果默认不勾选，不论条件通过与否都触发
                    output并且值对应为0或1，不会主动将_content属性的值对外传递！*/
                    attr: '_returnContent',
                    valueType: 'Boolean',
                    defaultValue: false,
                    name: '启用自定义 ☆',
                    bindIgnored: true,
                    description: `勾选后，条件满足，将输出自定义输出
                    属性内容，而不是默认的true。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#HBmrg' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#FVqNn','inputs','用于输入布尔数组，整体参与判断。\n');
            },
            'dbQueryToTreeTable': e => {
                i.update(data, 'stripSingleInput', false); //231130，切换过来需要默认不勾选时，加上这句。
                i.insertTempAttrs(data, [{
                    attr: 'fields',
                    valueType: 'ObjectArray',
                    defaultValue: ['name'],
                    name: '数据字段 ☆',
                    bindIgnored: true,
                    description: `对象数组中指定字段，与树表格各列对应。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#YjfGl' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: 'keyId', //230901，修改id为keyId了
                    valueType: 'String',
                    defaultValue: 'id',
                    name: '主键字段 ☆',
                    bindIgnored: true,
                    description: `数据集中的主键字段。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#l8mgQ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: 'keyParent', //230901，新增keyParent字段配置
                    valueType: 'String',
                    defaultValue: 'parent',
                    name: '父级字段 ☆',
                    bindIgnored: true,
                    description: `指向数据父级节点的字段名称。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#X8LHC' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: 'keyChildren', //230901，新增keyChildren字段配置
                    valueType: 'String',
                    defaultValue: 'children',
                    name: '子级字段 ☆',
                    bindIgnored: true,
                    description: `指向数据子级节点的字段名称。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#VDsp4' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: 'appendTo', //230901，新增appendTo字段配置，用于插入到指定节点下。
                    valueType: 'Object',    //240804，对于树表格，默认ID为数字类型而不是字符串！！
                    // defaultValue: '',
                    name: '追加到 ☆',
                    bindIgnored: true,
                    description: `指定树表格行ID，将数据追加到节点下。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#WzolJ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#GAkdk','inputs','输入待转换的对象。');
            },
            'arrExpandToList': e => {
                i.update(data, 'stripSingleInput', false); //231130，切换过来需要默认不勾选时，加上这句。
                i.insertTempAttrs(data, [{
                    attr: '_value',
                    valueType: 'Number',
                    defaultValue: 1,
                    name: '显示数值 ☆',
                    bindIgnored: true,
                    description: `数字项作为索引值时，实际对应的值。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#bDtEi' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_emptyFilled', //空默认填充值设置，可以为undefined，这样可用于被识别选择是否不覆盖原本已有的值
                    valueType: 'Object',
                    defaultValue: null, //注意，undefined和null是由区别的！比如对于函数传参，参数有默认值时，传入undefined，就会采用默认值；传入null那么会作为object类型而采用null
                    name: '默认填充 ☆',
                    bindIgnored: true,
                    description: `没有对应索引时，默认填充值的空值。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#VNtZK' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_indexOffset',
                    valueType: 'Int',
                    defaultValue: -1,
                    name: '索引偏移 ☆',
                    bindIgnored: true,
                    description: `整体向左或向右平移位数。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#RzwtQ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                },{
                    attr: '_reverse',
                    valueType: 'Boolean',
                    defaultValue: false,
                    name: '反向转换 ☆',
                    bindIgnored: true,
                    description: `反向转换，输入和输出互换。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#lQ8Ym' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                },    
            ], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#sHSMv','inputs','用于输入数字数组。');
            },
            'listExpandToArr': e => {
                //240806，兼容到arrExpandToList里去，在哪里增加reverse选项！
                data._i_changingFuncs = true;
                data.ca('function','arrExpandToList');
                data._i_changingFuncs = undefined;
                data.ca('_reverse',true);
            },
            'calculation': e => {
                i.insertTempAttrs(data, [{
                    attr: '_method',
                    valueType: 'MathMethod',
                    defaultValue: 'SUM',
                    name: '选择公式 ☆',
                    bindIgnored: true,
                    description: `公式列表选择。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#zCvi1' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_value',
                    valueType: 'Number',
                    defaultValue: 1,
                    name: '操作数 ☆',
                    bindIgnored: true,
                    description: `与输入（组）作为被操作数对应的操作数。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#eHKAF' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_reverse',
                    valueType: 'Boolean',
                    defaultValue: false,
                    name: '反操作 ☆',
                    bindIgnored: true,
                    description: `操作反转，参与运算的两个数输入（组）
                    和另一个数方向互换，或者一个参数的，用反函数。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#WIR42' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#tSpxT','inputs','用于输入被操作数。');
                data.fp('a:_method', null, data.ca('_method'));
            },
            'arrKeyTypes': e => {
                i.insertTempAttrs(data, [{
                    attr: '_field',
                    valueType: 'String',
                    defaultValue: 'name',
                    name: '字段名称 ☆',
                    bindIgnored: true,
                    description: `指定对象数组中要提取值的字段。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#ZH44T' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#tUk3H','inputs','用于输入原始对象数组。');
            },
            'objsToArrs': e => {
                i.update(data, 'stripSingleInput', false); //231130，切换过来需要默认不勾选时，加上这句。
                i.insertTempAttrs(data, [{
                    attr: '_keys',
                    valueType: 'StringArray',
                    defaultValue: [],
                    name: '字段列表 ☆',
                    bindIgnored: true,
                    description: `指定多个字段，将按顺序对应值数组。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#aeGQh' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_defaultValue',
                    valueType: 'Object',
                    defaultValue: null,
                    name: '默认填充 ☆',
                    bindIgnored: true,
                    description: `字段不存在时填充的默认值。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#c0W1J' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_autoReverse',
                    valueType: 'Boolean',
                    defaultValue: false,
                    name: '反向转换 ☆',
                    bindIgnored: true,
                    description: `前后颠倒，换成从数组列表转对象列表。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#tjm0z' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#taWbc','inputs','输入待转换数据，对象列表或数组列表。');
            },
            'arrsToObjs': e => {
                data._i_changingFuncs = true;
                data.ca('function','objsToArrs');
                data._i_changingFuncs = undefined;
                data.ca('_autoReverse',true);
            },
            'mergeArrValByIndex': e => {
                i.insertTempAttrs(data, [{
                    attr: '_childObjKeys',
                    valueType: 'ObjectArray',
                    defaultValue: [],
                    name: '指定位置 ☆',
                    bindIgnored: true,
                    description: `指定对象内一个或多个位置精准处理。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#dayxd' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_emptyAutoFill',
                    valueType: 'Object',
                    defaultValue: null,
                    name: '默认填充 ☆',
                    bindIgnored: true,
                    description: `转换无对应值时默认填充值。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#TNrg5' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#AV3Is','inputs','输入待转换数据，对象或数组列表。');
            },
            "mergeObjValByIndexFromArr": e => {
                i.update(data, 'stripSingleInput', false); //231130，切换过来需要默认不勾选时，加上这句。
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#rf5Hy','inputs','输入待转换的数据。');
            },
            "mergeToObjByIndex": e => {
                i.insertTempAttrs(data, [{
                    attr: '_keysFieldFlag',
                    valueType: 'String',
                    defaultValue: '_',
                    name: '字段间隔符 ☆',
                    bindIgnored: true,
                    description: `转换无对应值时默认填充值。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#XK0t4' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_keysIndexFlag',
                    valueType: 'String',
                    defaultValue: '.',
                    name: '索引间隔符 ☆',
                    bindIgnored: true,
                    description: `字段合并时名称与索引间隔符。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#p0JzH' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                },{
                    attr: '_emptyAutoFill',
                    valueType: 'Object',
                    defaultValue: null,
                    name: '默认填充 ☆',
                    bindIgnored: true,
                    description: `转换无对应值时默认填充值。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#cpvcA' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#IhLYA','inputs','输入待转换数据。');
            },
            'toFlatJson': e => { //231127，JSON对象扁平化、结构化转换
                i.update(data, "stripSingleInput", false); //231130，切换过来需要默认不勾选时，加上这句。
                i.insertTempAttrs(data, [{
                    attr: '_jsonType',
                    valueType: 'JsonType',
                    defaultValue: 'flat',
                    name:'转换格式 ☆',
                    bindIgnored: true,
                    description: `选择扁平化还是结构化。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#yPSxA' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_dotFlag',
                    valueType: 'String',
                    defaultValue: '>',
                    name: '间隔符号 ☆',
                    bindIgnored: true,
                    description: `多级对象字段扁平化时的分隔符。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#c3KpA' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#HM7UI','inputs','用于输入被转换的对象。');
            },
            'messageAlert': e => {
                if (data.ca('inputs') == undefined || data.ca('inputs').length == 0) data.ca('inputs', '请注意操作');
                i.insertTempAttrs(data, [{
                    attr: '_type',
                    name: '提示类型 ☆',
                    bindIgnored: true,
                    description: `选择提示的类型，包括错误、警告等。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#xjFTO' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    valueType: 'MessageType',
                    defaultValue: 'warn'
                }, {
                    attr: '_title',
                    valueType: 'String',
                    name: '标题文字 ☆',
                    defaultValue: (() => {
                        return i.getValueTypeName('MessageType', data.ca('_type'));
                    })(),
                    bindIgnored: true,
                    description: `显示标题。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#RZSQ9' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_region',
                    valueType: 'Region',
                    name: '显示位置 ☆',
                    defaultValue: 'top',
                    bindIgnored: true,
                    description: `信息显示在屏幕的相对位置。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#jtgSW' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_duration',
                    valueType: 'PositiveNumber',
                    defaultValue: 1000,
                    name: '持续时间 ☆',
                    bindIgnored: true,
                    description: `信息停留的时长，0为不自动消失。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#BdQHk' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_fixedWidth',
                    valueType: 'PositiveNumber',
                    defaultValue: 300,
                    name: '固定宽度 ☆',
                    bindIgnored: true,
                    description: `提示区域宽度（提示条或对话框）。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#lVQFA' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }, {
                    attr: '_fixedHeight',
                    valueType: 'PositiveNumber',
                    defaultValue: 160,
                    name: '固定高度 ☆',
                    bindIgnored: true,
                    description: `固定高度（仅对弹窗确认选项有效）。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#ZJQFE' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#iehe9','inputs','用于设置信息内容。');
            },
            'pageReload': e => {
                i.insertTempAttrs(data, [{
                    attr: '_clearCache',
                    valueType: 'Boolean',
                    defaultValue: false
                }, {
                    attr: '_url',
                    valueType: 'String',
                }], 'inputs')
            },
            'codeBlock': e => {
                i.insertTempAttrs(data, [{
                    attr: '_function', //提取函数
                    valueType: 'Function',
                    name:"自定义代码 ☆",
                    extraInfo: {
                        "arguments": [
                            "data",
                            "gv",
                            "cache",
                            "inputs"
                        ]
                    },
                    bindIgnored: true,
                    description:`自定义工具函数功能代码。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#mbNJh' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                    defaultValue: "__ht__function(data, gv, cache, inputs) {return inputs;}" //230605，默认代码为返回windows对象，改成返回inputs，透传！
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#CE3nV','inputs','自定义函数的传入参数。');
            },
            'attrUpdateForce': e => {
            },
            'formValues': e => { //230501，主动获取图元的表单数据
                i.update(data, "stripSingleInput", false); //231130，切换过来需要默认不勾选时，加上这句。
                i.insertTempAttrs(data, [{
                    attr: '_pureFormValues', // 对应getFormDatas()，否则为getFormValues()
                    valueType: 'Boolean',
                    name:"纯表单 ☆",
                    defaultValue: true,
                    description: `是否仅采用纯表单数据。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#QmIFV' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                },{
                    attr: '_rawForm', // 对应getFormDatas()，否则为getFormValues()
                    valueType: 'Boolean',
                    defaultValue: false,
                    description: `原始属性表单。
                    包含所有做了form、 formReset、 formValue绑定的属性。`,
                    extraInfo:"~"   //240802，这个属性不可见，改成纯表单属性对外，相当于目前属性的反向属性。为了向下兼容，不直接删除。
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#wtjRK','inputs','用于被连线操作。');
                data.iv();
            },
            'random': e => { //230717，随机数。还需要加上最小值、最大值、小数位数/字符串长度等条件设置项目【待完善】
                i.update(data, "stripSingleInput", false); //231130，切换过来需要默认不勾选时，加上这句。
                i.insertTempAttrs(data, [{
                    attr: '_valueType',
                    valueType: 'DataValueType',
                    name: '随机类型 ☆',
                    defaultValue: 'number',
                    bindIgnored: true,
                    description: `选择数字、颜色等生成的随机数类型。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#rSVsL' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#rSVsL','inputs','用于设置值范围或选项。');
                data.fp('a:_valueType', null, data.ca('_valueType'));
            },
            'openURL': e => { //240408
                i.insertTempAttrs(data, [{
                    attr: '_editorOpen',
                    valueType: 'Boolean',
                    defaultValue: 'false',
                    name: '打开编辑 ☆',
                    bindIgnored: true,
                    description: `是否编辑器中打开页面。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#RflSJ' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                }], 'inputs');
                __addLinkAppend('https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#xG65H','inputs','用于输入链接地址路径。');
            },
        };

        //交互事件
        let inputs = '__FUCKING_NONE__', //231112，从exec的监听处理中定义放到这里全局，主要是有演示执行setTimeout时再进入exec时，获取到的inputs为复位后的了！
            inputsBak = []; //231121，主要是给输入赋值后清空，并且延时输出时，避免 给到清空后的{}或[]，之前用inputs，发现不对其复位时会弹窗报错提示，那就专门搞一个变量缓存输入！
        i.md(data, gv, cache, {
            'a:output': e => { //触发bindControls
                e.oldValue == '__exe__' && i.formEventBubblingUpper(data, gv, cache, 'onOutput', { //231106，添加了onOutput事件！
                    'output': e.newValue
                }, true, true);
            },
            'a:_pureFormValues': e=>{
                //240802，新增动态属性用于设置，取反同步给现在已经隐藏的_rawForm属性
                if(data.ca('function') == 'formValues'){
                    i.update(data,'_rawForm',!e.newValue);
                }
            },
            'a:_childObjKeys': e=>{
                //240805，为了方便编辑设置，默认支持属性填入.，内部自动按照>来识别！也支持直接设置以>为间隔！
                if(e.newValue) {
                    let arrtmp = [];
                    e.newValue.forEach(item=>{
                        arrtmp.push(item ? item.split('.').join('>') : item);
                    }); 
                    data.ca('_childObjKeys_inner',arrtmp);  
                }else data.ca('_childObjKeys_inner',e.newValue);  
            },
            'a:inputsArrToObj': e => { //230906，输入inputs的数组和对象格式切换

                //240306，避免输入数组对象如果只有一个元素时，默认的勾选生效，结果导致数组被转成对象，比如表格超过1个可以，只勾选1行结果格式异常等BUG！
                if (e.oldValue !== '__init__' && e.oldValue != '__undefined__' && i.isEditing(data) && e.newValue && data.ca('stripSingleInput')) {
                    i.showMessage('已联动自动去掉属性勾选“输入组单个取出”，本属性通常用于输入数组形式时，有且仅有的一个元素将作为实际输入值。', 'warn', '警告', 'top', null, 0);
                    i.update(data, 'stripSingleInput', false);
                }

                let itemtmp = _i.getAttrItem(data, 'inputs');
                if (e.newValue) {
                    data.getImage(); //231115，这一句貌似能够避免影响到全局其他func的inputs属性在编辑状态下的配置类型（数组格子输入形式，还是对象的数组输入形式）
                    itemtmp.valueType = 'Object';
                    itemtmp.defaultValue = undefined;

                    //231205，动态插入输入键值组
                    _i.insertTempAttrs(data, [{
                        attr: 'jsonStruct',
                        valueType: 'JsonStruct',
                        name: "转换方式",
                        defaultValue: 1,    //240810，必须默认模式为1，否则对参数对象的任意输入，结果字段受限制了！！
                        description: `输入与参数键值组的对应关系选项。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#pK7XI' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                        extraInfo: '*',
                        bindIgnored: true
                    }, {
                        "attr": "inputKeys",
                        "valueType": "ObjectArray",
                        "defaultValue": [],
                        "name": "输入键组",
                        "description": `输入组扁平化后的值列表，双向同步。
                        与输入值组配合使用。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#CSjM8' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                        extraInfo: '*'
                    }, {
                        "attr": "inputValues",
                        "valueType": "ObjectArray",
                        "defaultValue": [],
                        "name": "输入值组",
                        "description": `输入组扁平化后的值列表，双向同步。
                        与输入键组配合使用。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/fgi6dd7gado51acm#oXg9Q' style="color:rgb(96,172,252)" target='_blank'>详情</a>`,
                        extraInfo: '*',
                    }], 'inputs');
                } else {
                    itemtmp.valueType = 'ObjectArray';
                    itemtmp.defaultValue = [];
                    //231205，动态隐藏输入键值组
                    /*240225，加入第三个参数e，如果e.oldValue是__init__初始化加载，那么就不清理数据绑定data.getDatabindings的设置值attrObject，因为可能下面紧接着初始动态增加insertTempAttr，否则会出现
                    比如内嵌api组件继承到上层form绑定的值，设置无法锁定等怪异现象。*/
                    _i.clearTempAttrs(data, 'inputValues', e);
                    _i.clearTempAttrs(data, 'inputKeys', e);
                    _i.clearTempAttrs(data, 'jsonStruct', e);
                }
                i.iv(i.topData(data)); //240305，data改成i.topData(data)，这样就兼容了上层嵌套时修改动态更新！
            },
            'a:inputs': e => { //对于透传模式，可以省去exec的触发调用！直接连一根线就好
                if(data._i_updateObjectToKeyValues) return;

                //241017，配置时的初始空值，用于输入赋值后清空的空值！不能取决于最近一次类型是数组还是对象来给空数组或空对象，因为可能是关联组件，通过数组提取解析赋值过来的！
                if(i.isEditing(data) && (i.isObjEmpty(e.newValue) || (e.newValue.length && e.newValue.length == 0))){
                    data.ca('emptyValue',e.newValue);
                }
                
                //241003，默认“键组固定且保持结构”时，如果当前已有key-value，即输入组为非空对象，那么往输入组再赋值为对象，且对象的字段key跟当前已存在的不一致时，就报错并自动转成模式“全部结构化”
                if(
                    i.isObjNotEmpty(e.newValue) && 
                    i.isObjNotEmpty(e.oldValue) && 
                    !data.ca('resetAfterInput') &&
                    data.ca('jsonStruct') == 2 &&
                    !data._i_hasConvertFlatToTree &&
                    !i.isEqual(i.keys(e.oldValue),i.keys(e.newValue))
                ){
                    let errorInfo = '输入组存在对象值，且未勾选赋值后清空，此时转换模式不能为默认，将自动转为“全部结构化”，避免传入的对象字段被截断！';
                    i.alertError(errorInfo,'错误',null,[400,260],data);
                    data.ca('jsonStruct',1);
                }

                /*231112，从exec的监听处理中定义放到这里全局，主要是有演示执行setTimeout时再进入exec时，获取到的inputs为复位后的了！这里用于备份设置的值，
                注意，要确保复位的值通过i.backWriteOnly()不会重新写到这里，否则起不到备份的作用了！*/
                inputs = inputsBak = e.newValue;
                //231214，这里备份下，因为下面马上要复位了！而且真正exec执行时，获取的是data.ca('inputs')而不是inputs，避免获取到复位的值了！
                data._i_hasInputing = true; //注意不能备份e.newValue，因为传入的可能就是undefined 

                //没有新增的属性时，一旦给inputs赋值，就开始触发函数调用，不需要再次连线到exec，除非有新增的除了inputs之外的入参需要手动调用exec
                //230221-20:48，存在有的新增参数是固定配置传参，因此触发还是决定于inputs，因此只要勾选了，就不管自动触发调用exec
                if ( /*!hasAdded &&*/ data.ca('exeWhenInput')) {
                    data.fp('a:exec', null, true);
                    if (data.ca('resetAfterInput')) {
                        inputs = data.ca('emptyValue')  !== undefined ? data.ca('emptyValue') : (isArrayFn(data.ca('inputs')) ? [] : {}); //data.ca('inputsArrToObj') ? {} : [];
                        i.backWriteOnly(data, 'a:inputs', inputs); //data.ca('inputs',undefined); //230525，对于输入时触发的情况，需要随后复位，避免第二次继续同样的值触发不了！
                    } else {
                        inputs = data.ca('inputs'); //240618，如果没有勾选输入后清空，那么每次进来这里要更新inputs输入值！！否则可能存在BUG！！
                    }
                }

                //231205，同步给输入键值组
                //240814，之前是isObject(inputs)，现在加上条件&& !isArrayFn()。因为i.objectToKeyValues指定只对对象类型输入做键值对拆解处理！！
                if (isObject(inputs) && !isArrayFn(inputs) && !_i.isWinOrNodeObj(inputs) && _i.isSimpleJson(inputs)) {
                    //240810，既然之前是i.backWriteAttrs()，那么这里貌似啥都不用动，因为本身就已经是引用赋值了！！   
                    i.objectToKeyValues(data.ca('inputs'), data.ca('inputKeys'), data.ca('inputValues'), true, data.ca('jsonStruct'));
                    data._i_updateObjectToKeyValues = true;
                    i.backWriteAttrs(data, {
                        'a:inputs': data.ca('inputs'),
                        'a:inputKeys': data.ca('inputKeys'),
                        'a:inputValues': data.ca('inputValues')
                    });
                    data._i_updateObjectToKeyValues = undefined;
                } else {
                    i.backWriteAttrs(data, {
                        'a:inputKeys': [],
                        'a:inputValues': []
                    });
                }
            },
            'a:exeWhenInput': e=>{
                //240731，编辑时，自动联动输入赋值后清空。
                if(i.isEditing(data)){
                    i.update(data,'resetAfterInput',e.newValue); 
                }
            },
            //231205，新增工具函数inputs输入组对应的扁平化输入键、值组，类似api组件的jsonFormat和paramKeys/paramValues，双向编辑同步，方便操作对象的值！可以根据这个特性实现数组转换成对象，并且指定key对应！
            'a:inputKeys|a:inputValues|a:jsonStruct': e => {
                let firstInitKeyValues = e.property == 'a:inputValues' && (e.oldValue === undefined || e.oldValue.length == 0) && data.ca('inputs') === undefined;
                if(firstInitKeyValues) {
                    data._i_inputInitial = true;
                    let objtmp = {},
                        keystmp = data.ca('inputKeys');
                    isArrayFn(keystmp) && keystmp.forEach(key=>{
                        objtmp[key] = null;
                    });
                    i.update(data,'a:inputs', objtmp);
                    data._i_inputInitial = undefined;
                }
                if(data._i_inputInitial) return;

                if(firstInitKeyValues || (!data._i_updateObjectToKeyValues && !i.isHtNodeData(data.ca('inputs')) && isObject(data.ca('inputs')) && !isArrayFn(data.ca('inputs')))){
                    let isObjInputing = false;
                    if(e.property == 'a:jsonStruct' && (e.oldValue === 0 || e.oldValue === 1) && e.newValue >= 2){
                        i.arrClear(data.ca('inputKeys'),[]);
                        i.arrClear(data.ca('inputValues'),[]);
                        isObjInputing = true;
                    }
                    i.objectToKeyValues(data.ca('inputs'), data.ca('inputKeys'), data.ca('inputValues'), isObjInputing , data.ca('jsonStruct'));
                    data._i_updateObjectToKeyValues = true;
                    i.backWriteAttrs(data, {
                        'a:inputs': data.ca('inputs'),
                        'a:inputKeys': data.ca('inputKeys'),
                        'a:inputValues': data.ca('inputValues')
                    });
                    data._i_updateObjectToKeyValues = undefined;
                }
            },
            'a:function': e => { //下拉选择不同函数，联动默认传入参数
                //240805，在组件冗余合并兼容时，还不能用data.fp，得用data.ca()，因为这样不仅能触发md响应，主要还是等对属性attrObject赋值，逻辑中用到属性值！！因此改成前后标记的方式来做！
                if(data._i_changingFuncs) e.oldValue = '__init__'; 

                e.oldValue != '__init__' && data.ca('inputs', []); //230312，屏蔽去掉这句，否则设置固定值时会被复位清理掉！

                //230930，显示提示
                // data.s('label', i.getValueTypeName('ToolFunction', e.newValue));
                let toBeNote = i.getValueTypeName('ToolFunction', e.newValue);
                if (data.ca('noteTips') != toBeNote && e.oldValue != '__init__') data.ca('noteTips', toBeNote);

                // 230219， 切换函数时， 先恢复默认属性设置项， 删除临时动态新插入的属性
                let imgtmp = data.getImage();
                i.clearTempAttrs(data, null, e);


                //230817，复位属性的描述信息。避免有些函数没设置动态描述时，描述信息显示的是上次选择的函数的。
                i.getAttrItem(data, 'function').description = '无'

                //不同的函数，动态切换新增配置属性
                i.addKeysAction(e.newValue, funcAttrs, e);

                //231127，下拉选择切换工具函数时，动态更新当前的函数功能toolTip描述
                let curFuncDesc = i.getValueTypeName('ToolFunction', data.ca('function'), 'description'),
                    symbolURL = data.getImage(),
                    funcImgObj = symbolURL;
                if (typeof(symbolURL) == 'string') {
                    i.update(data, 'symbol', symbolURL);
                    funcImgObj = i.clone(i.getImage(symbolURL)); //231201，注意需要加上i.clone()不能直接用公共的image资源对象，否则多个工具函数不同的选项，下拉时动态参数都会收到影响！
                    data.setImage(funcImgObj);
                }
                //240224，传入新增的图元对象参数，可以利用_i_symbolDatabindings避免重复循环遍历！
                i.getDataBindingItem(funcImgObj, 'function', data).description = curFuncDesc;
                data.ca('icon', i.getValueTypeName('ToolFunction', data.ca('function'), 'icon'));

                //231201，切换到获取组件属性值函数时，连线连入变成虚线
                i.getAttrLines(data, 'inputs').forEach(line => {
                    i.setLineDashed(line, e.newValue == 'formValues');
                });

                //240224，为了切换函数选项后，触发让输入组inputs对应的输入键组、输入值组能够字段立即显示，而不是需要手动刷新才显示！
                if (e.oldValue === undefined) e.oldValue = '__undefined__'; //240328，初始拖入func，并且初始修改默认的透明传递到指定函数时，发现oldValue为undefined，因此标记下，避免每次此时都会触发提示！
                else if (e.oldValue !== '__init__') e.oldValue = null; //240328，为了方面下面将传入__init__或null，改成传入e.oldValue。

                data.fp('a:inputsArrToObj', /*e.oldValue === '__init__' ? '__init__' : null*/ e.oldValue, data.ca('inputsArrToObj'));

                i.iv(i.topData(data)); //240305，data改成i.topData(data)，这样就兼容了上层嵌套时修改动态更新！
            },
            //////////////////////////////////////////////////// 不同函数选项的属性设置二次动态自动创建属性 ///////////////////////////////
            'a:_type': e => {
                //不同的函数，动态切换新增配置属性
                let defaultTexts = ['请注意操作','出现错误！','操作成功！','已操作','操作中','已操作完毕'];
                if(i.isEditing(data) && data.ca('function') == "messageAlert" && (defaultTexts.indexOf(data.ca('inputs')) !== -1 || i.isObjEmpty(data.ca('inputs')) || !data.ca('inputs'))){
                    switch(e.newValue){
                        case 'warn':
                            i.update(data,'inputs',defaultTexts[0]);
                            break;
                        case 'error':
                            i.update(data,'inputs',defaultTexts[1]);
                            break;
                        case 'success':
                            i.update(data,'inputs',defaultTexts[2]);
                            break;
                        case 'info':
                            i.update(data,'inputs',defaultTexts[3]);
                            break;
                        case 'msg':
                            i.update(data,'inputs',defaultTexts[4]);
                            break;
                        case 'alert':
                            data.ca('_title','请确认');
                            i.update(data,'inputs',defaultTexts[5]);
                            break;
                    }
                }
            },
            'a:_valueType': e => {
                if (data.ca('function') == 'random' && i.isEditing(data)) { //随机数属性下拉选择类型
                    switch (e.newValue) {
                        case 'positive':
                            i.update(data,'inputs', 100);
                            break;
                        case 'number':
                            i.update(data,'inputs', [-100,100]);
                            break;
                        default:
                            i.update(data,'inputs', []);
                    }
                }
            },
            'a:_method': e => {
                let needValueFields = ['SUM', 'SUB', 'MUL', 'DIV', 'decimal', 'pow'];
                if (needValueFields.indexOf(e.newValue) == -1) {
                    /*240225，如果e.oldValue是__init__初始化加载，那么就不清理数据绑定data.getDatabindings的设置值attrObject，因为可能下面紧接着初始动态增加insertTempAttr，否则会出现
                    比如内嵌api组件继承到上层form绑定的值，设置无法锁定等怪异现象。*/
                    i.clearTempAttrs(data, '_value', e);
                } else {
                    !i.hasAttrObjectKey(data, '_value') && i.insertTempAttrs(data, [{
                        attr: '_value',
                        valueType: 'Number',
                        defaultValue: 1,
                        name: '操作数 ☆',
                        bindIgnored: true,
                        description: `与输入（组）作为被操作数对应的操作数。<a href='https://www.yuque.com/liuhuo-nc809/uiotos/bb6hr2sdhaz8gz8m#eHKAF' style="color:rgb(96,172,252)" target='_blank'>详情</a>`
                    }], '_method');
                }
                //240305，data改成i.topData(data)，这样就兼容了上层嵌套时修改动态更新！
                _i.iv(i.topData(data)); //240225，即时更新显示，否则会发现_method切换到不需要_value的属性后，再切换回上面列表需要的方法时，不立即显示_value字段！
            },
            'a:arrExec': e => {
                if (e.newValue) {
                    data.fp('a:exec', null, true); //触发常规执行
                    //复位交给output里去处理
                }
            },
            //230926，快捷注释
            'a:noteTips': e => {
                if (e.newValue) { //显示注释
                    i.update(data, 's:label', e.newValue);
                } else { //复位默认注释
                    let infottmp = i.getValueTypeName('ToolFunction', data.ca('function'));
                    i.update(data, 's:label', infottmp);
                    i.update(data, 'noteTips', infottmp);
                }
            },
            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            'a:exec': e => {
                if (e.newValue) { //230327，执行函数，将==true改成if()，以兼容字符串等非空值也能触发并且触发后被自动复位！！
                    async function __exec() {
                        if (data.ca('resetAfterInput')) {
                            //231214，加上输入标记，有标记时从inputtmp变量取！避免这时data.ca('inputs')已经被复位
                            inputs = data._i_hasInputing ? inputsBak : data.ca('inputs'); //231114，输入属性这里获取下，因为inputs属性的监听去对inputs赋值，不一定能初始进入执行！
                        } else {
                            inputs = data.ca('inputs'); //240618，如果没有勾选输入后清空，那么每次进来这里要更新inputs输入值！！否则可能存在BUG！！
                        }
                        try {
                            switch (data.ca('function')) {
                                case 'transfer': //透明传递，仅仅用来间接连线赋值
                                    inputs = i.__realInputs(data, inputs)
                                    __return( /*i.__realInputs(data, inputs)*/ inputs);
                                    break;
                                case 'toFlatJson': //231127，json对象扁平化与结构化
                                    __return(data.ca('_jsonType') == 'flat' ? i.toFlatJson(i.__realInputs(data, inputs), data.ca('_dotFlag')) : i.toTreeJson(i.__realInputs(data, inputs), data.ca('_dotFlag')));
                                    break;
                                case 'formValues':
                                    let sources = [],
                                        exittmp = false;
                                    data.dm().eachByBreadthFirst(item => {
                                        if (item.getClassName() == 'ht.Edge') {
                                            if (item.getTarget() === data) sources.push({
                                                'data': item.getSource(), //tips230817，连线操作当前函数组件的图元组件
                                                'index': Number(item.getDisplayName().split('（')[0]) //tips230817，连线过来操作的连线在组件所有对外连线的编号是几
                                            });
                                        }
                                    });
                                    let retObj = {}, //231208，最终对象需要多个连入inputs获得的表单对象进行合并！
                                        isAllOldValIndexSetting = true,
                                        independentValuesWithoutIndex = [],
                                        validLinesCount = 0;
                                    sources.forEach((source,idx) => {
                                        //tips230817，要操作的是当前工具函数的inputs属性才行，其他的连线忽略掉。
                                        let attrtmp = i.indexAssure(source.data.ca('bindControlsAttr'), source.index);
                                        if (i.np(attrtmp) != 'inputs') {
                                            return; //需要操作当前的inputs属性的才行！
                                        }
                                        validLinesCount += 1; //240805，对inputs操作的连线计数，不能用sources.length
                                        let extraCached = {
                                                indexRefered: source.index  
                                            }, //240227，主要是为了获取当前连线操作，是否是将值整体给到输入组的某个索引位置！避免多个这样的操作形成的数组返回，结果被合并成大数组：[1],[null,2],[null,null,3] => [1,null,2,null,null,3]，实际上要获取到[1,2,3]而已！
                                            valuestmp = i.updateBindControls(source.data, data.ca('_rawForm') ? i.getFormDatas(source.data) : i.getFormValues(source.data), [], false, '~', null, null, true, extraCached),
                                            valtmp = valuestmp[source.index];
                                        if (extraCached.isOldValueArrIndexSetted) i.backWriteOnly(data, 'inputs', valtmp);
                                        else {
                                            isAllOldValIndexSetting = false; //240227，只要任何一条连线操作，不是对旧值指定索引位置填充值，那么标记就是false，只有所有都是对数组索引位置赋值，才是true！
                                            independentValuesWithoutIndex.push(valtmp);
                                        }
                                        retObj[source.data.getTag()] = valtmp;
                                    });
                                    if(independentValuesWithoutIndex.length !== validLinesCount){
                                        console.assert(independentValuesWithoutIndex.length < validLinesCount);//240804，如果不等于，那一定是小于的！说明部分连线索引操作，但不是全部。
                                        console.error(`WARN: exist ${independentValuesWithoutIndex.length} partial line(s) without bindControlsVal indexing purpose value!`,independentValuesWithoutIndex);
                                        data.ca('inputs').push(...independentValuesWithoutIndex);
                                        isAllOldValIndexSetting = true; //240804，强制修改标记，走else逻辑，就当作是已经数组全部操作过了！
                                    }

                                    if (!isAllOldValIndexSetting) {
                                        let valstmp = i.values(retObj),
                                            lentmp = valstmp.length;
                                        if (lentmp == 0) {
                                            console.error('WARN:' + `当前获取组件属性值的工具函数，输入属性（inputs）并无连入的连线，将以当前输入组属性inputs的值返回！` + i.commonTip(data));
                                            retObj = inputs;
                                        } else if (lentmp == 1) { //只有一个连线连入操作，那么结果直接输出，不需要经过任何转换和合并操作！
                                            retObj = valstmp[0];
                                        } else { //有多条连线连入的结果，区分不同类型的合并
                                            let isAllObj = true,
                                                isAllArr = true;
                                            valstmp.forEach(item => {
                                                if (!isArrayFn(item)) isAllArr = false; //有元素不是数组
                                                if (!isObject(item) || isArrayFn(item)) isAllObj = false; //也不是对象
                                            });
                                            if (isAllArr) { //1）如果都是数组，那么多个数组合并成1个大数组，通常用于分块编辑的整体表单提交，所以要默认合并
                                                retObj = [];
                                                valstmp.forEach(item => {
                                                    retObj.push(...item);
                                                });
                                            } else if (isAllObj && i.arrFieldsCommon(valstmp).length == 0) { //2）如果都是对象，那么多个对象合并成1个大对象，通常用于分块编辑的整体表单提交，所以要默认合并
                                                retObj = {};
                                                valstmp.forEach(item => {
                                                    retObj = {...retObj, ...item };
                                                });
                                            } else { //其他情况下不合并，以各自连线索引的字符串作为key，合并成一个对象
                                                //不处理，默认retObj就是这种格式！
                                            }
                                        }
                                        i.backWriteOnly(data, 'inputs', retObj);
                                    }
                                    __return(data.ca('inputs'));
                                    break;
                                case 'forceUpdate': //强制赋值
                                    let oldValue = null,
                                        newValue = null,
                                        valtmp = i.__realInputs(data, inputs);
                                    if (isArrayFn(valtmp)) {
                                        newValue = valtmp[0];
                                        oldValue = valtmp.length > 1 ? valtmp[1] : null;
                                    } else {
                                        newValue = valtmp;
                                        oldValue = null;
                                    }
                                    //231106，统一用__return()代替data.fp操作output
                                    __return(oldValue);
                                    __return(newValue);
                                    break;
                                case 'fileUpLoad':
                                    let paramstmp = i.__realInputs(data, inputs),
                                        filter = data.ca('_fileTypesFilter'),
                                        paramType = data.ca('_paramType');
                                    //240104，增加URL参数
                                    i.fileUpload(data.ca('_specifyiedURL'), paramstmp, paramType, url => {
                                            //231106，统一用__return()代替data.fp操作output
                                            // data.fp('a:output', null, url);
                                            __return(url);

                                        }, data.ca('_autoAlert'),
                                        filter ? filter : "*");
                                    break;
                                case 'fileBase64Choosed': //231001，图片文件等选择后的base64编码
                                    __return((await i.fileChoose(i.__realInputs(data, inputs))).base64);
                                    break;
                                case 'dbQueryToTreeTable':
                                    let idFieldTmp = data.ca('keyId') ? data.ca('keyId') : 'id'; //230913，id字段对于树表也需要！
                                    __return(i.formatTreeTable(i.convertArrayToTree(i.__realInputs(data, inputs), { //230901，加上字段配置，父子节点的数据格式字段可以任意指定，默认为id、parent、children
                                        id: idFieldTmp,
                                        parent: data.ca('keyParent') ? data.ca('keyParent') : 'parent',
                                        children: data.ca('keyChildren') ? data.ca('keyChildren') : 'children'
                                    },true), data.ca('fields'), idFieldTmp,false));
                                    break;
                                case 'isEqual':
                                    let val1 = i.__realInputs(data, inputs),
                                        val2 = data.ca('_target'),
                                        equaltmp = null;
                                    switch (data.ca('_strict')) {
                                        case 'lowest':
                                            equaltmp = _i.isEqual(val1, val2, true);
                                            break;
                                        case 'middle':
                                            equaltmp = _i.isEqual(val1, val2);
                                            break;
                                        case 'highest':
                                            equaltmp = val1 === val2;
                                            break;
                                        default:
                                            console.assert(0);
                                    }
                                    let ret = equaltmp ? data.ca('_trueReturn') : data.ca('_falseReturn');
                                    __return(data.ca('_equalTo') ? ret : !ret);
                                    break;
                                case 'arrExpandToList':
                                    if(data.ca('_reverse')){
                                        //230906，去掉i.__realInputs()包裹，直接用inputs，因为存在长度为1的数组就是当正常数组传入的！
                                        __return(i.listExpandToArr(i.__realInputs(data,inputs), data.ca('_value'), data.ca('_indexOffset'), false));
                                    }else{
                                        __return(i.arrExpandToList(i.__realInputs(data, inputs), data.ca('_value'), data.ca('_indexOffset'), false, i.getTypedValue(data.ca('_emptyFilled'))));
                                    }
                                    break;
                                case 'calculation':
                                    __return(i.calculation(data.ca('_method'), i.__realInputs(data, inputs), data.ca('_value'), data.ca('_reverse')));
                                    break;
                                case 'arrKeyTypes':
                                    __return(i.arrKeyTypes(i.__realInputs(data, inputs), data.ca('_field')));
                                    break;
                                case 'objsToArrs': //_keys、_defaultValue、_autoReverse
                                    let objsToArrsInputs = i.clone(i.__realInputs(data, inputs)); //240117，参考arrsToObjs，应该也要加上i.clone()，发现这里之前没有！待测试观察！
                                    console.assert(_i.isSimpleJson(objsToArrsInputs)); //对于图元或windows对象的报错提示！
                                    //兼容输入单数组的情况，此时转对象输出！
                                    let isObjOnly = isObject(objsToArrsInputs) && !isArrayFn(objsToArrsInputs);
                                    if (isObjOnly) objsToArrsInputs = [objsToArrsInputs];
                                    let isSimpleArrayInputs = i.isArrSubBaseAll(objsToArrsInputs); 
                                        targetObjectTmp = {};
                                    console.assert(objsToArrsInputs.forEach);
                                    if(!objsToArrsInputs.forEach)  return [];
                                    objsToArrsInputs.forEach((item, idx) => {
                                        let currentItem = [],
                                            defaultValTmp = data.ca('_defaultValue');
                                        if (isObject(item)) {
                                            if (/*isArrayFn(item) && */data.ca('_autoReverse')) currentItem = {}; //如果输入列表元素是数组且勾选了自动反转换，则默认接收输出的类型改成对象！
                                            data.ca('_keys').forEach((key, index) => {
                                                if (isArrayFn(item)) {
                                                    if (data.ca('_autoReverse')) { //数组元素转对象元素
                                                        currentItem[key] = item[index] === undefined ? defaultValTmp : item[index];
                                                    } else { //保持格式，动态增加字段
                                                        currentItem.push(item[index] === undefined ? defaultValTmp : item[index]);
                                                    }
                                                } else { //对象元素转数组元素
                                                    if(data.ca('_autoReverse')){
                                                        currentItem[key] = item[key] === undefined ? defaultValTmp : item[key]; 
                                                    }else{
                                                    currentItem.push(item[key] === undefined ? defaultValTmp : item[key]);
                                                    }
                                                }
                                            });
                                        }else if(isSimpleArrayInputs && data.ca('_autoReverse')){
                                            let keytmp = data.ca('_keys') && data.ca('_keys')[idx];
                                            if(keytmp !== undefined){
                                                targetObjectTmp[keytmp] = item;
                                            }
                                        } else {
                                            currentItem = item;
                                        }
                                        objsToArrsInputs[idx] = currentItem;
                                    });
                                    //240929，如果输入空数组，输出也为空数组，这种情况之前是输出空对象！当输出给到表格要求数组类型时，会导致如果传入空数组，结果变成对象类型，就会出问题！（表格的数据内容，只能是数组类型！）
                                    __return(isSimpleArrayInputs ? ((isArrayFn(objsToArrsInputs) && objsToArrsInputs.length == 0) ? [] : targetObjectTmp) : (isObjOnly ? objsToArrsInputs[0] : objsToArrsInputs));
                                    break;
                                case 'mergeArrValByIndex':
                                    //231128，加上i.toTreeJson()，这样便于将数组的对象格式转换成真正数组格式，以弥补i.xxxOverwrite()无法引用切换对象和数组类型的天然缺陷！
                                    //240805，加上i.clone(inputs)避免引用回写到输入了！注意，用i.copy都不行，那是浅拷贝，对里面更下集字段对象修改，还是会引用回写到输入
                                    data.fp('a:_childObjKeys',undefined,data.ca('_childObjKeys'));//240805，触发进入_childObjKeys，以更新_childObjKeys_inner
                                    __return(i.toTreeJson(i.mergeArrValByIndex(i.clone(inputs), data.ca('_emptyAutoFill'), data.ca('_childObjKeys_inner'))));
                                    break;
                                case 'mergeObjValByIndexFromArr':
                                    __return(i.mergeObjValByIndexFromArr(i.__realInputs(data, inputs), null));
                                    break;
                                case 'mergeToObjByIndex':
                                    __return(i.mergeToObjByIndex(i.__realInputs(data, inputs), data.ca('_emptyAutoFill'), data.ca('_keysIndexFlag'), data.ca('_keysFieldFlag')));
                                    break;
                                case 'initEditor':
                                    __return(initEditor(i.__realInputs(data, inputs), null, data.ca('_forceEnter'), data));
                                    break;
                                case 'editCurrentPage': //240423，工具函数将当前运行页面，转换成编辑状态的URL，再新页签打开。注意，inputs不需要任何输入！
                                    let runURL = GetRequest()['run'],
                                        tagURL = GetRequest()['tag'],
                                        editingURL = i.window().origin + '/trying?url=' + (runURL ? runURL : tagURL) + '&showTop=true';
                                    window.open(editingURL, '_blank');
                                    __return(editingURL);
                                    break;
                                case 'copyFavorite':
                                    let copytmp = i.__realInputs(data, inputs),
                                        copyUrl = i.isNewValueEmpty(copytmp) ? null : copytmp;
                                    i.copyFavorite(copyUrl, dataNode => {
                                        __return(dataNode);
                                    });
                                    break;
                                case 'copyPaste': //240414，复制粘贴
                                    break;
                                case 'messageAlert':
                                    //231123，提示时对于数组，可以合并成字符串输出！
                                    let msgtmp = i.__realInputs(data, inputs);
                                    if (isArrayFn(msgtmp)) msgtmp = msgtmp.join('');
                                    if (data.ca('_type') == 'alert') {
                                        i.alert(msgtmp, data.ca('_title'), false, (isOk, formAttrs) => {
                                            __return(isOk); //确认对话框，通过用户选择，由__return给外部output传入true/false，对应确定/取消。注意外层不返回，则output不触发对外输出！
                                        }, null, [data.ca('_fixedWidth'), data.ca('_fixedHeight')]);
                                    } else {
                                        layer.msg(msgtmp, null, data.ca('_type'), data.ca('_title'), data.ca('_region'), data.ca('_fixedWidth'), data.ca('_duration'));
                                        _i.setTimeout(() => {
                                            i.formEventBubblingUpper(data, gv, cache, null, null, false, true, 'messageHide');
                                        }, data.ca('_duration'));
                                    }
                                    break;
                                case 'pageReload':
                                    //240524，清理缓存，不能setItem(,null)，这样会当成'null'、'undefined'字符串！清理需要用.removeItem()方法！！
                                    // if (data.ca('_clearCache')) window.sessionStorage.setItem('_i_user', null); //暂未测
                                    if (data.ca('_clearCache')) window.sessionStorage.removeItem('_i_user');

                                    //新页签打开IP:端口 
                                    let urltmp = data.ca('_url');
                                    if (urltmp) {
                                        if (urltmp.indexOf('http') == -1 && urltmp.indexOf('=') != -1) {
                                            urltmp = location.protocol + '//' + _i.window().location.host + '/' + urltmp; //230423，如果输入的url不带有http且有=，那么就当成主要是get传参的url部分
                                        }
                                        window.open(urltmp ? urltmp : window.location.protocol); //暂未测
                                    } else {
                                        //当前页面刷新
                                        location.reload();
                                    }
                                    break;
                                case 'condition': //所有连线过来，都指向inputs，但是这里不会被覆盖，而是自动追加
                                    let result = null;
                                    //230731，对于传入空或者直接连线传入单个值非数组时，自动转成数组来处理
                                    inputs = i.__realInputs(data, inputs);
                                    // if (inputs == undefined) inputs = [];　//240801，所有非数组的，都当成长度为1的单项数组来处理！
                                    if (!isArrayFn(inputs)) inputs = [inputs];
                                    
                                    //240801，空值作为false的多选配置
                                    let emptyTypes = data.ca('_emptyJudge-list'); //['所有空值','空字符串','无对象null','空对象{}','空数组[]']
                                    let emptystmp = data.ca('_emptyJudge') ? data.ca('_emptyJudge') : '';

                                    inputs.forEach((input, idx) => {
                                        //注意，这里不强制类型相同，因此里面判断符号部署===，而是==，同时对于非布尔、数字类型会日志提示，被转换成布尔了
                                        let typetmp = typeof(input);
                                        if (typetmp != 'boolean' || typetmp != 'number') console.warn('type of inputs index in', data.getTag(), idx, 'is', typetmp, ',not boolean or number!!', inputs[idx], inputs);
                                        switch (data.ca('_logical')) {
                                            case 'allSatisfy': //全部满足
                                            case 'anyoneDissatisfy': //“任何一个不满足”属于“全部满足”的反逻辑，让这一对都先执行“全部满足”的逻辑

                                                //tips 240801，这里对判断的列表，一开始当作全部成立result为true。逐项遍历判断时，任何一项【不成立/不通过】，那么整体条件result就不通过！
                                                //240801，调整逻辑！对于各类空值能够手动设置当作true还是false！！
                                                if (idx == 0) result = true; //初始默认条件成立

                                                //这部分是全新逻辑 240801
                                                //0）对于小于等于0、undefined，都为false
                                                if(input === 0 || (typeof(input) === 'number' && input < 0) || input === undefined || input === false) result = false;
                                                //1）有勾“所有空值”，或勾“空字符串”
                                                if(input === '' && (emptystmp.indexOf(emptyTypes[0]) != -1 || emptystmp.indexOf(emptyTypes[1]) != -1)) result = false;
                                                //2）有勾“所有空值”，或勾“无对象null”
                                                if(input === null && (emptystmp.indexOf(emptyTypes[0]) != -1 || emptystmp.indexOf(emptyTypes[2]) != -1)) result = false; 
                                                //3）有勾“所有空值”，或勾“空对象{}”
                                                if(i.isObjEmpty(input,true) && (emptystmp.indexOf(emptyTypes[0]) != -1 || emptystmp.indexOf(emptyTypes[3]) != -1)) result = false;
                                                //4）有勾“所有空值”，或勾“空数组[]”
                                                if(isArrayFn(input) && input.length == 0 && (emptystmp.indexOf(emptyTypes[0]) != -1 || emptystmp.indexOf(emptyTypes[4]) != -1)) result = false;
                                                break;
                                            case 'allDissatisfy': //全部不满足
                                            case 'anyoneSatisfy': //“任何一个满足”属于“全部不满足”的反逻辑，让这一对也都先执行“全部不满足”的逻辑
                                                if (idx == 0) result = true; //初始默认条件成立

                                                //tips 240801，这里对判断的列表，一开始当作全部成立result为true。逐项遍历判断时，任何一项【成立/通过】，那么整体条件result就不通过！
                                                //0）这些典型非空值，表明条件通过，那么整体就要为false了
                                                if(
                                                    (typeof(input) === 'number' && input > 0) ||    //大于0的数字
                                                    i.isObjNotEmpty(input) ||                       //非空对象
                                                    (isArrayFn(input) && input.length) ||           //非空数组
                                                    (typeof(input) == 'string' && input != '') ||   //非空字符串
                                                    input === true                                  //布尔true
                                                ) result = false;
                                                //1）未勾“所有空值”，也未勾“空字符串”，此时空字符串通过，为true
                                                if(input === '' && emptystmp.indexOf(emptyTypes[0]) == -1 && emptystmp.indexOf(emptyTypes[1]) == -1) result = false;
                                                //2）未勾“所有空值”，也未勾“无对象null”
                                                if(input === null && emptystmp.indexOf(emptyTypes[0]) == -1 && emptystmp.indexOf(emptyTypes[2]) == -1) result = false; 
                                                //3）未勾“所有空值”，也未勾“空对象{}”
                                                if(i.isObjEmpty(input,true) && emptystmp.indexOf(emptyTypes[0]) == -1 && emptystmp.indexOf(emptyTypes[3]) != -1) result = false;
                                                //4）未勾“所有空值”，也未勾“空数组[]”
                                                if(isArrayFn(input) && input.length == 0 && emptystmp.indexOf(emptyTypes[0]) == -1 && emptystmp.indexOf(emptyTypes[4]) == -1) result = false;
                                                break;
                                        };
                                    });
                                    //对于两个“部分”逻辑，都是从上述结果中对应取反
                                    switch (data.ca('_logical')) {
                                        case 'anyoneSatisfy':
                                        case 'anyoneDissatisfy':
                                            result = !result;
                                            break;
                                    };
                                    console.assert(result !== null || inputs.length == 0); //断言此时结果肯定已经被赋值过，没有漏掉的情况！
                                    if (inputs && inputs.length > 0) {
                                        if (data.ca('_returnContent') && result) { //如果有勾选_returnContent，那么条件满足时才触发并且将_content属性值传出，不论是什么！
                                            __return(data.ca('_content'));
                                        } else __return(result); //默认没有勾选，此时判断完成将结果立刻且都会返回
                                    }
                                    break;
                                case 'codeBlock':
                                    /*230324，代码块默认为返回window全局对象，显然，提供给程序员使用，_function函数默认返回window对象，或者结合inputs传入的值或对象进行代码逻辑处理
                                    ，最后输出什么由返回决定！*/
                                    let func = new Function('return ' + data.a('_function'))();
                                    func && __return(func(data, gv, cache, i.__realInputs(data, inputs))); //230913，将i.__realInputs(data, inputs)还原改成inputs，因为可能动态传入的就是数组，而且数组长度为1的！
                                    break;
                                case 'attrUpdateForce': //230420，连线连出多少个，就对多少个操作方的属性进行强制刷新，不需要output触发，只需要exec触发执行，就会自动让连线的属性强制刷新，对于display属性刷新就是重新加载内嵌页面
                                    let tags = data.ca('bindControlsTag'),
                                        attrs = data.ca('bindControlsAttr');
                                    tags.forEach((tag, idx) => {
                                        let nodetmp = d(data.dm(), tag),
                                            attrtmp = attrs[idx];
                                        nodetmp.fp(i.autoPrefixed(attrtmp, nodetmp), undefined, i.getValue(nodetmp, attrtmp));
                                    });
                                    break;
                                case 'count': //230324，待处理，不完善，待处理！！有要剔除的，有数组需要合并成一行的等等！
                                    switch (data.ca('_countLayer')) {
                                        case 0:
                                            __return(i.keys(i.__realInputs(data, inputs),false,['__upper','charsCount']).length);
                                            break;
                                        case 1:
                                            __return(i.keys(convertToFlatJson(i.__realInputs(data, inputs)),false,['__upper','charsCount']).length);
                                            break;
                                    }
                                    break;
                                case 'random': //230717，有待完善随机数的范围，暂时写死
                                    let itmp = i.__realInputs(data, inputs);
                                    switch (data.ca('_valueType')) {
                                        case 'positive':
                                            __return(randomNum(0, Number(isArrayFn(itmp) ? itmp[0] : item))); //inputs数组的第一个元素为随机正数的最大值
                                            break;
                                        case 'number':
                                            __return(randomNum(itmp[0], itmp[1])); //inputs数组第一个元素为随机数字最小值，第二个元素为最大值！
                                            break;
                                        case 'string':
                                            //240801，有配置输入组数组时，随机选择输出，没有时，随机生成UUID对外。
                                            if(isArrayFn(itmp) && itmp.length > 0){
                                                __return(itmp[Math.floor(Math.random() * itmp.length)]);
                                            }else __return(i.generateUUID());   
                                            break;
                                        case 'color':
                                            //240801，有配置输入组数组时，随机选择输出，没有时，随机生成颜色对外。
                                            if(isArrayFn(itmp) && itmp.length > 0){
                                                //240819，如果任何一个配置，发现有非字符串，那么就给随机颜色，而不输出数字，否则可能出现错误！
                                                let isColorArrTmp = true;
                                                itmp.forEach(item=>{
                                                    if(typeof(item) !== 'string') isColorArrTmp = false;
                                                });
                                                if(isColorArrTmp){
                                                    __return(itmp[Math.floor(Math.random() * itmp.length)]);
                                                    break;
                                                }
                                            }
                                            __return(randomColor());
                                            break;
                                    }
                                    break;
                                case 'openURL': //231106，打开链接
                                    let urlTobeOpened = i.__realInputs(data, inputs);
                                    if (data.ca('_editorOpen') && i.isDisplayURL(urlTobeOpened)) { //240408，支持打开编辑页面
                                        if(runningMode()){ //240806，运行时编辑模式打开页面
                                            window.open('/trying?url=' + urlTobeOpened);
                                        }else{
                                            _i.editorOpen(urlTobeOpened);
                                        }
                                    } else {
                                        /*240713，对于资源文件的请求，如果发现本地没有，就采用线上资源目录的！比如分类主题示例的演示效果，没必要每个打包都放到目录下且放到git!!!
                                        这就要求线上的这个资源目录要放好，不要被git给删掉！！*/
                                        if(
                                            urlTobeOpened.slice(0,7) === 'assets/' ||
                                            urlTobeOpened.slice(0,13) === 'assets-part2/'
                                        ){
                                            _i.urlExistChecking(urlTobeOpened,status=>{
                                                if(!status){
                                                    console.error('WARN: asset not found in local, online version will be used!',urlTobeOpened);
                                                    window.open(/*'http://203.189.6.3:8999/'*/'http://ui.aiotos.net/' + urlTobeOpened);
                                                }else{
                                                    window.open(urlTobeOpened);
                                                }
                                            });
                                        }else if(i.isDisplayURL(urlTobeOpened)){ //240806，如果是页面，未勾选_editorOpen，则运行时打开！
                                            window.open('/trying?run=' + urlTobeOpened);
                                        }else{
                                            window.open(urlTobeOpened);
                                        }
                                    }
                                    __return(urlTobeOpened);
                                default:
                                    break;
                            }
                            i.update(data, 'exec', false); //230528，用i.update()代替data.ca('exec', false)赋值回写，避免逐层暴露上去的属性，无法同步操作给上层属性
                        } catch (error) {
                            console.error(`node ${data} of page ${data.dm()._url} error: ${error}`);
                            i.update(data, 'exec', false); //230528，用i.update()代替data.ca('exec', false)赋值回写，避免逐层暴露上去的属性，无法同步操作给上层属性
                        }
                        i.update(data, 'exec', false); //230528，用i.update()代替data.ca('exec', false)赋值回写，避免逐层暴露上去的属性，无法同步操作给上层属性
                        data._i_hasInputing = false; //231214，复位输入标记，避免exec中每次都是从inputtmp变量取！
                    }
                    //230421，非必要不做setTimeout()，会导致调试时堆栈无法回滚到当下状态的数据，只能回滚到这个步骤。
                    if (data.ca('delay') > 0) {
                        _i.setTimeout(() => { //支持延时执行
                            // data._i_timeoutedExec = true; //231112，定时器异步执行时标记，因为此时纯粹的exec属性已经被复位了！
                            __exec();
                            // data._i_timeoutedExec = false; //231112，复位
                        }, data.ca('delay'));
                    } else {
                        __exec();
                    }  
                } else {
                    //常规执行结束、复位时，也对遍历执行复位！
                    i.update(data, 'arrExec', false);
                    data._i_hasInputing = false; //231214，复位输入标记，避免exec中每次都是从inputtmp变量取！
                }
            }, //以下是动态新增的属性
            'a:fields': e => {
                _i.enableAttrEditByFirstItem(data, e); //230830，代替i.arrExpandByFirst(e.newValue);
            }
        }, [{
            'a:function': '__init__'
        }, 'a:exec', 'a:inputsArrToObj', 'a:noteTips'], () => {

        }, null, e => { //tips 240127，data.fp()赋值操作，可以放到上面那个会掉函数即loadedInit中，但是不能放到下面这里commonCb公共回调函数中，会造成死循环！！
            //tips 240128，发现工具函数的别名显示，下面用data.s('label',newValue)还不行，用data.s('label',null,newValue)反而可以！！！是否类似data.fp的oldValue那种，强制变化赋值响应？？暂未深究！！
            data.s('label', null, i.getValueTypeName('ToolFunction', data.ca('function')));
        });

        //230324，有勾选exeWhenLoad时，加载时便执行
        if (data.ca('exeWhenLoad')) data.fp('a:exec', null, true);
    }
} 