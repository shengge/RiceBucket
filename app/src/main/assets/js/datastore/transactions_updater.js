/**
 * Created by Vlad on 2016-11-24.
 */
var jaxx;
(function (jaxx) {
    var TransactionsUpdater = (function () {
        function TransactionsUpdater(controller, options) {
            var _this = this;
            this.controller = controller;
            this.options = options;
            this.emitter$ = $({});
            this.ON_TRANSACTION_CONFIRMED = 'ON_TRANSACTION_CONFIRMED';
            this.name = controller.name;
            this.updatetimer = setInterval(function () { return _this.onTimer(); }, options.updateTimeout);
        }
        TransactionsUpdater.prototype.onError = function (err) {
        };
        TransactionsUpdater.prototype.onTimer = function () {
            if (!this.controller.isActive)
                return;
            if (this.isBusy) {
                console.warn(' skipping request => no respond from server ');
                this.isBusy = false;
                return;
            }
            var trs = this.controller._db.getTransactionsReceive();
            if (trs.length === 0)
                return;
            /* let lastTr:VOTransaction = _.last(trs);
 
             console.log(lastTr);
 
             let lastTransactionTimestamp = lastTr.timestamp;
 
 
             let balances:VOBalance[] = this.controller._db.getBalancesReceive();
             let now:number = Date.now();
 
             console.log('lastTransactionTimestamp ' + (new Date(lastTransactionTimestamp).toLocaleDateString()));
 
             let withdelta:VOBalance[] = balances.filter(function (item) {
                 let dif:number = lastTransactionTimestamp - item.timestamp;
                 console.log(dif);
                 if(lastTransactionTimestamp > item.timestamp ) item.delta = 0;
                 if((now - item.timestamp) > 1000*360) item.delta = 0;
 
                 if(item.delta) return item;
 
             });
 
 
 
             if(withdelta.length){
 
                 let addresses:string[] = Utils.getIds(withdelta);
 
                 this.controller._accountService.downloadNewTransactions(addresses);
             }
 
 
             console.log(this.name + ' withdelta     ',withdelta );
 
 */
            if (this.checUncofirmed(trs)) {
            }
            else {
            }
        };
        TransactionsUpdater.prototype.checkTransactinsLast3Addresses = function (trs) {
            var addresses = this.controller.getAddressesReceive();
            addresses = _.takeRight(addresses, 3);
            trs.forEach(function (item) {
                if (addresses.indexOf(item.address) !== -1)
                    addresses.splice(addresses.indexOf(item.address), 1);
            });
            return addresses.length !== 0;
        };
        TransactionsUpdater.prototype.checUncofirmed = function (trs) {
            var min = this.options.confirmations;
            // console.log(trs);
            var unconfirmed = trs.filter(function (item) {
                // console.log(item.confirmations);
                return item.confirmations < min;
            });
            console.log('%c ' + this.controller.name + '  checkForUpdates total: ' + trs.length + ' unconfirmed: ' + unconfirmed.length, 'color:red');
            if (unconfirmed.length) {
                this.checkForUpdates(unconfirmed);
                return true;
            }
        };
        TransactionsUpdater.prototype.checkForUpdates = function (trs) {
            var _this = this;
            if (trs.length === 0)
                return;
            var db = this.controller._db;
            var ctr = this.controller;
            var service = this.controller._accountService;
            var addresses = trs.map(function (item) {
                return item.address;
            });
            var out = addresses.filter(function (item, pos) {
                return addresses.indexOf(item) == pos;
            });
            if (out.length > 20)
                out = _.take(out, 20);
            // console.log(' downloadTransactions   '+out.toString());
            this.isBusy = true;
            service.downloadTransactions(out).done(function (result) {
                _this.isBusy = false;
                var newTransactions = result.transactions || result;
                //   console.log(newTransactions);
                var indexed = _.keyBy(newTransactions, 'id');
                var oldTrs = db.getTransactionsReceive();
                var justConfiremed = [];
                oldTrs.forEach(function (item) {
                    if (indexed[item.id]) {
                        //console.log(' old confirmations: ' + item.confirmations + ' new ' + indexed[item.id].confirmations);
                        if (!item.confirmations && indexed[item.id].confirmations) {
                            item.timestamp = indexed[item.id].timestamp;
                            console.log(' TRANSACTION_CONFIRMED  ' + item.confirmations + '   new ' + indexed[item.id].confirmations + '  at ' + new Date(item.timestamp * 1000).toLocaleTimeString());
                            justConfiremed.push(item);
                        }
                        // if(!isNaN(indexed[item.id].timestamp))  item.timestamp = indexed[item.id].timestamp;
                        item.block = indexed[item.id].block;
                        item.confirmations = indexed[item.id].confirmations || 0;
                    }
                });
                if (justConfiremed.length)
                    _this.emitter$.triggerHandler(_this.ON_TRANSACTION_CONFIRMED, [justConfiremed]);
                db.setTransactions(oldTrs);
                ctr.dispatchNewTransactions();
                // console.log(newTransactions);
                /* let search1:VOTransaction[] = [];
                 newTransactions.forEach(function (item) {
                     if(trsids.indexOf(item.id) !==-1 ) search1.push(item);
                 });

                 console.log(search1);


                 db.updateTransactionsReceive(newTransactions);

                 let search2:VOTransaction[] = [];

                 db.getTransactionsReceive().forEach(function (item) {
                     if(trsids.indexOf(item.id) !==-1 ) search2.push(item);
                 });

                 console.log(search2);*/
                // console.log(db.getTransactionsReceive());
                // Utils.updateOldTransactions(trs,result);
            }).fail(function (err) {
                _this.isBusy = false;
                _this.onError(err);
            });
        };
        return TransactionsUpdater;
    }());
    jaxx.TransactionsUpdater = TransactionsUpdater;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=transactions_updater.js.map