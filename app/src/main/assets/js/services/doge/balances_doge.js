/**
 * Created by fieldtempus on 2016-11-07.
 */
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
///<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/balances_blockchain.ts"/>
var jaxx;
(function (jaxx) {
    var BalancesDoge = (function (_super) {
        __extends(BalancesDoge, _super);
        function BalancesDoge() {
            _super.call(this);
        }
        BalancesDoge.prototype.init = function () {
            this._enableLog = false;
            this._batchSize = 20;
        };
        return BalancesDoge;
    }(jaxx.BalancesBlockchain));
    jaxx.BalancesDoge = BalancesDoge;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=balances_doge.js.map