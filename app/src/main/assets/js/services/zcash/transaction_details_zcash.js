/**
 * Created by fieldtempus on 2016-11-08.
 */
//<reference path="../../com/models.ts"/>
///<reference path="../../com/Utils2.ts"/>
///<reference path="../service-mapper.ts"/>
///<reference path="../bitcoin/transaction_details_bitcoin.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var jaxx;
(function (jaxx) {
    var TransactionDetailsZCash = (function (_super) {
        __extends(TransactionDetailsZCash, _super);
        function TransactionDetailsZCash() {
            _super.call(this);
        }
        TransactionDetailsZCash.prototype.init = function () {
            this._enableLog = false;
            this._batchSize = 10;
        };
        return TransactionDetailsZCash;
    }(jaxx.TransactionDetailsBitcoin));
    jaxx.TransactionDetailsZCash = TransactionDetailsZCash;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transaction_details_zcash.js.map