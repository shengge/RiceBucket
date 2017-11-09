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
    var UTXOsZCash = (function (_super) {
        __extends(UTXOsZCash, _super);
        function UTXOsZCash() {
            _super.call(this);
        }
        UTXOsZCash.prototype.init = function () {
            this._enableLog = false;
            this._batchSize = 10;
        };
        return UTXOsZCash;
    }(jaxx.UTXOsBlockchain));
    jaxx.UTXOsZCash = UTXOsZCash;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=utxos_zcash.js.map