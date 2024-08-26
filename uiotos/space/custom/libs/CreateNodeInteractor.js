var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b)
            if (b.hasOwnProperty(p))
                d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var CreateNodeInteractor = /** @class */ (function (_super) {
    __extends(CreateNodeInteractor, _super);
    function CreateNodeInteractor(graphView) {
        return _super.call(this, graphView) || this;
    }
    CreateNodeInteractor.prototype.handle_mousedown = function (e) {
        this.handle_touchstart(e);
    };
    CreateNodeInteractor.prototype.handle_touchstart = function (e) {
        this.isLeftClick = ht.Default.isLeftButton(e) && ht.Default.getTouchCount(e) === 1;
    };
    CreateNodeInteractor.prototype.handle_mouseup = function (e) {
        this.handle_touchend(e);
    };
    CreateNodeInteractor.prototype.handle_touchend = function (e) {
        var graphView = this._graphView;
        if (graphView.getDataAt(e) == null && !graphView._panning && this.isLeftClick && this._image) {
            var node = new ht.Node();
            node.setPosition(graphView.getLogicalPoint(e));
            node.setParent(graphView.getCurrentSubGraph());
            node.setImage(this._image);
            graphView.getDataModel().add(node);
            graphView.getSelectionModel().setSelection(node);
            delete this.isLeftClick;
        }
    };
    return CreateNodeInteractor;
}(ht.graph.Interactor));
