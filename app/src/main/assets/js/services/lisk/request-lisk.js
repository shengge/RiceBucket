var jaxx;
(function (jaxx) {
    var RequestLisk //implements IRequestServer
     = (function () {
        function RequestLisk //implements IRequestServer
            (settings) {
        }
        RequestLisk //implements IRequestServer
        .prototype.setType = function (str) {
        };
        RequestLisk //implements IRequestServer
        .prototype.loadTransactions = function () {
            return null;
        };
        RequestLisk //implements IRequestServer
        .prototype.getAddress = function (i) {
            return '';
        };
        RequestLisk //implements IRequestServer
        .prototype.getBalances = function (addr) {
            return null;
        };
        RequestLisk //implements IRequestServer
        .prototype.setTransactionEventEmiter = function (emitter$) {
        };
        RequestLisk //implements IRequestServer
        .prototype.checkTransaction = function (trs) {
            return null;
        };
        RequestLisk //implements IRequestServer
        .prototype.restoreIndex = function (type) {
            return null;
        };
        return RequestLisk //implements IRequestServer
        ;
    }());
    jaxx.RequestLisk //implements IRequestServer
     = RequestLisk //implements IRequestServer
    ;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=request-lisk.js.map