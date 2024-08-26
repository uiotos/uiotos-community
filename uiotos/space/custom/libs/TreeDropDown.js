ht.ui.TreeDropDown = function() {}
ht.Default.def('ht.ui.TreeDropDown', ht.ui.DropDownTemplate, {
    /*
    [
        {
            "name": "Button",                       //id：1
            "children": [
                {
                    "name": "ToggleButton",         //id：1.1
                    "children": [
                        {
                            "name": "CheckBox"      //id：1.1.1
                        },
                        {
                            "name": "RadioButton"   //id：1.1.2
                        }
                    ]
                },
                {
                    "name": "MenuButton"            //id：1.2
                }
            ]
        },
        {
            "name": "TextField",                    //id：2
            "children": [
                {
                    "name": "ComboBox"              //id：2.1
                },
                {
                    "name": "NumberInput"           //id：2.2
                }
            ]
        }
    ]
    */
    initDropDownView: function(master, datas, value) {
        if (master.treeView == undefined) {
            master.treeView = new ht.ui.treeView();
        }
        var self = this,
            treeView = master.treeView,
            dataModel = treeView.dm(),
            selectionModel = treeView.sm();
        dataModel.clear();

        //塞入子组件对象。master可以就是外层的combobox组件对象！注意，这里是点击展开tree的时候才触发调用！
        master.treeView.fillDataModel(master.treeView, datas, null, master.getDisplayField(), master.getValueField());
        if (value != null) {
            //默认combobox只传入值：combobox.setValue(val)，而非对象；如果传入val是对象，那么再根据值字段提取value值内容
            var selectedData = null;
            if (typeof(value) == 'object') {
                selectedData = dataModel.getDataById(value[master.getValueField()]);
            } else {
                selectedData = dataModel.getDataById(value);
            }
            selectionModel.setSelection(selectedData);
        }
        return master.treeView;
    },
    getWidth: function() {
        return 200;
    },

    getHeight: function() {
        return 200;
    },
    getDropDownValue: function() {
        var lastData = this.getDropDownView().sm().ld();
        if (lastData) return lastData.a('data');
    },

});