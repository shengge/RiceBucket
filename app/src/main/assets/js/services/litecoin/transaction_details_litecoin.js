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
    var TransactionDetailsLitecoin = (function (_super) {
        __extends(TransactionDetailsLitecoin, _super);
        function TransactionDetailsLitecoin() {
            _super.call(this);
        }
        TransactionDetailsLitecoin.prototype.init = function () {
            this._enableLog = false;
            this._batchSize = 10;
        };
        return TransactionDetailsLitecoin;
    }(jaxx.TransactionDetailsBitcoin));
    jaxx.TransactionDetailsLitecoin = TransactionDetailsLitecoin;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transaction_details_litecoin.js.map