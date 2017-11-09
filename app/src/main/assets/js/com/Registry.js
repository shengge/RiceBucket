/**
 * Created by Vlad on 10/6/2016.
 */
///<reference path="models.ts"/>
///<reference path="../datastore/datastore_local.ts"/>
///<reference path="../app/datastore_controller.ts"/>
/*var MyRegistry={
 $emmiter:$({}),
 ON_ADDRESSES:'ON_ADDRESSES',
 addressData:{},
 ddatabase:null
 }*/
var starttime = Date.now();
var jaxx;
(function (jaxx) {
    var Registry = (function () {
        function Registry() {
        }
        Object.defineProperty(Registry, "currentCoinType", {
            get: function () {
                return Registry._currentCoinType;
            },
            set: function (currentCoinType) {
                // console.error(' setting currentCoinType ' + currentCoinType);
                Registry._currentCoinType = currentCoinType;
            },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Registry.RESET_STORAGE = 'RESET_STORAGE';
        Registry.BALANCE_OUT_OFF_SYNC = 'BALANCE_OUT_OFF_SYNC';
        Registry.BALANCE_IN_SYNC = 'BALANCE_IN_SYNC';
        Registry.SYNC_CHECK_START = 'SYNC_CHECK_START';
        Registry.SYNC_CHECK_END = 'SYNC_CHECK_END';
        Registry.ON_SHAPE_SHIFT_ACTIVATE = 'ON_SHAPE_SHIFT_ACTIVATE';
        Registry.ON_UTXOS_READY = 'ON_UTXOS_READY';
        Registry.ON_NONCES_READY = 'ON_NONCES_READY';
        Registry.ON_SEND_TRANSACTION = 'ON_SEND_TRANSACTION';
        Registry.ON_USER_TRANSACTION_COFIRMED = 'ON_USER_TRANSACTION_COFIRME';
        Registry.DATA_FROM_RELAY = 'DATA_FROM_RELAY';
        Registry.ON_TRANSACTIONS_OBJECT = 'ON_TRANSACTIONS_OBJECT';
        Registry.BEGIN_SWITCH_TO_COIN_TYPE = 'BEGIN_SWITCH_TO_COIN_TYPE';
        Registry.COMPLETE_SWITCH_TO_COIN_TYPE = 'COMPLETE_SWITCH_TO_COIN_TYPE';
        ///////////TODO remove duplicates
        Registry.TRANSACTION_BEFORE_SEND = 'TRANSACTION_BEFORE_SEND';
        Registry.TRANSACTION_SENT = 'TRANSACTION_SENT';
        Registry.TRANSACTION_FAILED = 'TRANSACTION_FAILED';
        Registry.TRANSACTION_ACCEPTED = 'TRANSACTION_ACCEPTED';
        Registry.TRANSACTION_CONFIRMED = 'TRANSACTION_CONFIRMED';
        Registry.ON_RESTORE_HISTORY_START = 'ON_RESTORE_HISTORY_START';
        Registry.ON_RESTORE_HISTORY_ERROR = 'ON_RESTORE_HISTORY_ERROR';
        Registry.ON_RESTORE_HISTORY_DONE = 'ON_RESTORE_HISTORY_DONE';
        //Balances
        //  static ON_RESTORE_BALANCE_START = "ON_RESTORE_BALANCE_START";
        Registry.ON_RESTORE_BALANCE_ERROR = "ON_RESTORE_BALANCE_ERROR";
        //  static ON_RESTORE_BALANCE_END = "ON_RESTORE_BALANCE_END";
        Registry.ON_RESTORE_BALANCE_MANUAL_START = "ON_RESTORE_BALANCE_MANUAL_START";
        Registry.ON_RESTORE_BALANCE_MANUAL_END = "ON_RESTORE_BALANCE_MANUAL_END";
        Registry.ON_BALANCE_RECEIVE_CHANGE = 'ON_BALANCE_RECEIVE_CHANGE';
        Registry.ON_BALANCE_DEEMED = 'ON_BALANCE_DEEMED';
        Registry.ON_BALANCE_ACCURATE = 'ON_BALANCE_ACCURATE';
        //////////////////////
        Registry.BITCOIN_MINING_FEE = 'BITCOIN_MINING_FEE';
        Registry.ON_NEW_WALLET_CREATED = 'ON_NEW_WALLET_CREATED';
        /////////////////////////// Application events ////////////////////////////
        Registry.OFFLINE = 'OFFLINE';
        Registry.ONLINE = 'ONLINE';
        Registry.PAUSE = 'PAUSE';
        Registry.RESUME = 'RESUME';
        Registry.KILL_HISTORY = 'KILL_HISTORY';
        //static crypto_controllers_test:any = {};
        //static database$ = $({});
        //static userActions$=$({});
        // static idatamodel:IDataModel;
        Registry.application$ = $({});
        Registry.sendTransaction$ = $({});
        Registry.tempStorage = {};
        Registry.ON_KEY_INIT = 'ON_KEY_INIT';
        return Registry;
    }());
    jaxx.Registry = Registry;
    Registry.start = Date.now();
})(jaxx || (jaxx = {}));
//# sourceMappingURL=Registry.js.map