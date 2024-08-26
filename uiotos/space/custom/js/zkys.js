window.app_config = {
    heatMapMinValue: 0, // 热力图点最小值
    heatMapMaxValue: 600, // 热力图点最大值
    heatRankObject: {},
    heatRankList: [],
    rankMaxNum: 6,
    // 随机获取 温度排行表格 数据
    getTempRankTableData: function () {
        var length = 1 + Math.ceil(Math.random() * 5),
            data = [];
        for (var i = 0; i < length; i++) {
            data.push({
                "number": "ZD" + Math.ceil(Math.random() * 100),
                "depth": "4M",
                "northLatitude": "23°47`",
                "eastLongitude": "109°75`",
                "temperature": (400 + Math.ceil(Math.random() * 100)) + "℃"
            });
        }
        return data;
    },
    // 随机获取 检测点参数表格 数据
    getCheckPointTableData: function () {
        var length = 1 + Math.ceil(Math.random() * 7),
            data = [];
        for (var i = 0; i < length; i++) {
            data.push({
                "number": "ZD" + +Math.ceil(Math.random() * 100),
                "northLatitude": "23°47`",
                "eastLongitude": "109°75`",
                "temperature": (400 + Math.ceil(Math.random() * 100)) + "℃"
            });
        }
        return data;
    },
    getHeatData: function (heatMapWidth, heatMapHeight, heatDeep) {

    },
    // 看板
    boardInfo: function ({
        name,
        value,
        dm2d,
        dm3d,
    }) {
        if (dm3d && dm3d.getDataByTag('board')) {
            if (name == '氧气001')
                dm3d.getDataByTag('board').a('o2', value)
            else if (name == '二氧化硫001')
                dm3d.getDataByTag('board').a('so2', value)
            else if (name == '一氧化碳001')
                dm3d.getDataByTag('board').a('co', value)
            else if (name == '湿度')
                dm3d.getDataByTag('board').a('humidity', value)
            else if (name == '气温')
                dm3d.getDataByTag('board').a('tempr', value)
        }
    },
    refreshedRanklist() {
        function pureVal(rawObj) {
            return Number(rawObj.temperature.split(' ℃')[0])
        }
        let rankListTmp = []
        let objtmp = window.app_config.heatRankObject
        for (let index = 0; index < window.app_config.rankMaxNum; index++) { //依次获取排名前
            let targettmp = null
            for (let name1 in objtmp) { //获取当前剩余空间里最大的
                //已经挑出去的大的，不再参与这里比较
                let flag = false
                rankListTmp.forEach(ele => {
                    if (ele.number === name1) {
                        flag = true
                    }
                })
                if (flag)
                    continue
                //不断记录当下最大的一个
                let valtmp = pureVal(objtmp[name1])
                if (targettmp === null) {
                    targettmp = objtmp[name1]
                } else {
                    if (valtmp > pureVal(targettmp))
                        targettmp = objtmp[name1]
                }
            }
            if (targettmp) {
                rankListTmp.push(targettmp)
            }
        }
        let hasChanged = true
        //判断排行榜跟之前是否变化
        if (looseEqual(rankListTmp, window.app_config.heatRankList)) {
            hasChanged = false
        }
        //更新当前排行榜列表
        window.app_config.heatRankList = rankListTmp
        return hasChanged ? rankListTmp : []
    }
};