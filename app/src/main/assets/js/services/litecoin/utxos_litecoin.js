/**
 * Created by fieldtempus on 2016-11-15.
 */
//<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../blockchain/utxos_blockchain.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var jaxx;
(function (jaxx) {
    var UTXOsLitecoin = (function (_super) {
        __extends(UTXOsLitecoin, _super);
        function UTXOsLitecoin() {
            _super.call(this);
        }
        UTXOsLitecoin.prototype.init = function () {
            this._enableLog = false;
            this._batchSize = 10;
        };
        return UTXOsLitecoin;
    }(jaxx.UTXOsBlockchain));
    jaxx.UTXOsLitecoin = UTXOsLitecoin;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=utxos_litecoin.js.map