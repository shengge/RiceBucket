///<reference path="../com/models.ts"/>
///<reference path="../services/account-service.ts"/>
///<reference path="../com/Registry.ts"/>
///<reference path="../datastore/crypto_controller.ts"/>
///<reference path="../datastore/refresh_data_controller.ts"/>
///<reference path="balance.ts"/>
var JaxxDatastoreController = (function () {
    function JaxxDatastoreController() {
        var _this = this;
        this._cryptoControllers = [];
        this._currentCryptoController = null;
        ///////////////////////////////Interface implementation////////////////////////////////////////////////
        this.status$ = $({}); //    ON_READY | ON_ERROR | ON_NO_SERVICE  | SWITCHING_TO | SWITCHED_TO
        this.totalChange$ = $({}); // evt,number
        $(document).ready(function () {
            _this.balance = new jaxx.BalanceController(_this);
        });
        jaxx.Registry.application$.on(jaxx.Registry.BEGIN_SWITCH_TO_COIN_TYPE, function (evt, data) {
            //{currentCoinType:currentCoinType, targetCoinType:targetCoinType}
            // console.error('BEGIN_SWITCH_TO_COIN_TYPE   ' + data);
            /*   var target: number = data;
               setTimeout(() => this.activate(target), 500);
               ;*/
        });
        jaxx.Registry.application$.on(jaxx.Registry.COMPLETE_SWITCH_TO_COIN_TYPE, function (evt, coinType) {
            //{currentCoinType:currentCoinType, targetCoinType:targetCoinType}
            console.warn();
            setTimeout(function () { return _this.activate(coinType); }, 500);
        });
        /*jaxx.Registry.application$.on(jaxx.Registry.ON_USER_TRANSACTION_COFIRMED,(evt,tr:VOSendRawTransaction)=>{
         console.log(jaxx.Registry.ON_USER_TRANSACTION_COFIRMED,tr);
    
         /!*  if(this.tempHex){
         tr.hex = this.tempHex;
         this.tempHex = null;
         this._currentCryptoController.sendTransaction(tr).done(res=>{console.log(res)}).fail(err=>{console.error(err)});
         }*!/
         });
         */
        jaxx.Registry.application$.on(jaxx.Registry.ON_SEND_TRANSACTION, function (evt, tr) {
            _this.tempHex = tr.hex;
            console.log(jaxx.Registry.ON_SEND_TRANSACTION, tr);
        });
        /*jaxx.Registry.database$.on('CURRENCY_MODEL_READY',(evt,id)=>{
         console.warn('CURRENCY_MODEL_READY     '  +id);
         if( id== 'Ethereum'){
         var model = this.getCurrencyModelById(id);
         model.loadHistory();
         }
         })*/
        jaxx.Registry.datastore_controller_test = this;
        jaxx.Registry.application$.triggerHandler('JaxxDatastoreController', this);
    }
    JaxxDatastoreController.prototype.initialize = function (config) {
        var _this = this;
        config.options = _.keyBy(config.coinsOptions, 'id');
        // console.log(config);
        this.config = config;
        console.log("[ JaxxDatastoreController :: Initialize ]");
        // console.log( JaxxAppStatic);
        // g_JaxxApp.getGlobalDispatcher().addEvent(this,'CRYPTO_SELECTED',(evt,data) =>{
        jaxx.Registry.application$.on('CRYPTO_SELECTED', function (evt, data) {
            switch (data.name) {
                case 'BTC':
                    data.name = 'Bitcoin';
                    break;
                case 'ETH':
                    data.name = 'Ethereum';
                    break;
                case 'DASH':
                    data.name = 'Dash';
                    break;
                case 'ETC':
                    data.name = 'EthereumClassic';
                    break;
                case 'REP':
                    data.name = 'AugurEthereum';
                    break;
                case 'LTC':
                    data.name = 'Litecoin';
                    break;
                case 'TESTNET_RSK':
                    data.name = 'ZCash';
                    break;
                case 'ZEC':
                    data.name = 'ZCash';
                    break;
                case 'DOGE':
                    data.name = 'Doge';
                    break;
            }
            // console.log('   enable - disable ',data);
            _this.enableDisableCryptoController(data.name, data.enabled);
        });
        /* JaxxAppStatic.cryptoDispatcher$.on('CRYPTO_SELECTED',(evt,data) =>{
         console.warn(data);
         });*/
    };
    JaxxDatastoreController.prototype.enableDisableCryptoController = function (name, enabled) {
        var ctr = this.getCryptoControllerByName(name);
        if (ctr) {
            ctr.setEnabled(enabled);
        }
        else {
            console.warn(' cant find controller with name ' + name);
        }
    };
    JaxxDatastoreController.prototype.onSendTransactionStart = function (data) {
        if (this._currentCryptoController)
            this._currentCryptoController.onSendTransactionStart(data);
    };
    JaxxDatastoreController.prototype.setCoinTypes = function (ar) {
        var _this = this;
        var out = [];
        var config = this.config;
        _.each(ar, function (pouch) {
            if (pouch) {
                out.push(new JaxxCryptoController(pouch, config));
            }
        });
        this._cryptoControllers = out;
        this.refreshDataController = new jaxx.RefreshDataController(out);
        // console.log(this._cryptoControllers);
        setTimeout(function () {
            var defaultId = jaxx.Registry.currentCoinType;
            _this.activate(defaultId);
            if (jaxx.Registry.appState && jaxx.Registry.appState.create)
                delete jaxx.Registry.appState.create;
        }, 1000);
    };
    JaxxDatastoreController.prototype.addCoinTypes = function (ar) {
        var _this = this;
        var config = this.config;
        var out = this._cryptoControllers;
        _.each(ar, function (pouch) {
            if (pouch) {
                out.push(new JaxxCryptoController(pouch, config));
            }
        });
        // this._cryptoControllers = out;
        // this.refreshDataController = new jaxx.RefreshDataController(out);
        // console.log(this._cryptoControllers);
        setTimeout(function () {
            var defaultId = jaxx.Registry.currentCoinType;
            _this.activate(defaultId);
            $('#splashScreen').fadeOut();
        }, 1000);
    };
    /*  addCoinType(pouch:HDWalletPouch):JaxxCryptoController {
     var newCryptoController = new JaxxCryptoController(pouch);
     console.log(pouch);
     this._cryptoControllers.push(newCryptoController);
     return newCryptoController;
  
     }*/
    JaxxDatastoreController.prototype.testFunction = function () {
        this.activate('Ethereum');
        //this.activate('Bitcoin');
    };
    /* getBalance(): number {
     return this._currentCryptoController.getBalance();
     }*/
    JaxxDatastoreController.prototype.getCurrentName = function () {
        return this._currentCryptoController.controllerSettings.id;
    };
    JaxxDatastoreController.prototype.getHistory = function () {
        return null;
        //return this.currentModel.getTransactions();
    };
    /*  historyChange: JQuery = $({});
     onNewTransactions$: JQuery = $({});//evt, VOTransaction[]
  
  
     onSendTransactionConfirmed$: JQuery = $({});//evt , isConfirmed, transactionid
  
     */
    JaxxDatastoreController.prototype.setDefault = function (coinType) {
        this.defaultName = coinType;
    };
    JaxxDatastoreController.prototype.activate = function (coinType) {
        var cryptoController;
        if (typeof coinType === 'number') {
            cryptoController = this.getCryptoControllerById(coinType);
        }
        else
            cryptoController = this.getCryptoControllerByName(coinType);
        if (cryptoController) {
            if (this._currentCryptoController && this._currentCryptoController != cryptoController) {
                this._currentCryptoController.deactivate();
            }
            this._currentCryptoController = cryptoController;
            cryptoController.activate();
            jaxx.Registry.current_crypto_controller = cryptoController;
        }
        else
            console.log('%c dont have cotroller for ' + coinType, 'color:red');
        //this.addListeners(cryptoController);
    };
    //////////////////////////////////////////////end of interface ////////////////////////////////////////////////////
    JaxxDatastoreController.prototype.getCryptoControllerByCoinType = function (coinType) {
        return this.getCryptoControllerById(coinType);
    };
    JaxxDatastoreController.prototype.getCryptoControllerById = function (id) {
        var ar = this._cryptoControllers.filter(function (item) {
            return (item.id == id);
        });
        if (ar.length === 1)
            return ar[0];
        else {
            console.log('%c   something wrong with id  ' + id, 'color:red');
        }
        return null;
    };
    JaxxDatastoreController.prototype.getCryptoControllerByName = function (name) {
        var ar = this._cryptoControllers.filter(function (item) {
            return (item.controllerSettings.name == name);
        });
        if (ar.length === 1)
            return ar[0];
        else {
            console.log('%c no controlller with name ' + name, 'color:#0FF');
        }
        return null;
    };
    JaxxDatastoreController.prototype.clearAndReset = function () {
        this._cryptoControllers.forEach(function (ctr) {
            ctr.resetStorage();
        });
        console.log("dataStore :: clearAndReset");
    };
    JaxxDatastoreController.onAddressChangeChanged = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NEW_ADDRESS_CHANGE, [arguments]);
    };
    JaxxDatastoreController.onAddressReceiveChanged = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NEW_ADDRESS_RECEIVE, [arguments]);
    };
    JaxxDatastoreController.onBalanceChanged = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_SPENDABLE_CHANGED, [arguments]);
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_BALANCE_CHANGED, [arguments]);
    };
    JaxxDatastoreController.onTransactionToBuildPreparing = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_PREPARING);
    };
    JaxxDatastoreController.onTransactionToBuildReady = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_READY);
    };
    JaxxDatastoreController.onNetworkError = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NETWORK_ERROR, [arguments]);
    };
    JaxxDatastoreController.onNewTransactions = function () {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTIONS_CHANGE, [arguments]);
    };
    /*addListeners(ctr:JaxxCryptoController): void {
      var trc: jaxx.TransactionController = ctr.transactionController;
  
      ctr.emitter$.on(ctr.ON_NEW_TRANSACTIONS,JaxxDatastoreController.onNewTransactions)
  
      ctr.emitter$.on(ctr.ON_RESTORE_HISTORY_START, JaxxDatastoreController.onRestoreHistoryStart);
      ctr.emitter$.on(ctr.ON_RESTORE_HISTORY_DONE, JaxxDatastoreController.onRestoreHistorydDone);
  
      ctr.emitter$.on(ctr.ON_TRANSACTION_SEND_START, JaxxDatastoreController.onTransactionSendStart);
      ctr.emitter$.on(ctr.ON_TRANSACTION_SENT, JaxxDatastoreController.onTransactionSent);
      ctr.emitter$.on(ctr.ON_TRANSACTION_SEND_PROGRESS, JaxxDatastoreController.onTransactionSendProgress);
  
  
    }
  */
    /* removeListeners(): void {
       var ctr: JaxxCryptoController = this._currentCryptoController;
       if (!ctr) return;
       var service: jaxx.JaxxAccountService = ctr._accountService;
       var trc: jaxx.TransactionController = ctr.transactionController;
       //var self=this;
   
       ctr.emitter$.off(ctr.ON_RESTORE_HISTORY_START, JaxxDatastoreController.onRestoreHistoryStart);
       ctr.emitter$.off(ctr.ON_RESTORE_HISTORY_DONE, JaxxDatastoreController.onRestoreHistorydDone);
   
       ctr.emitter$.off(ctr.ON_TRANSACTION_SEND_START, JaxxDatastoreController.onTransactionSendStart);
       ctr.emitter$.off(ctr.ON_TRANSACTION_SENT, JaxxDatastoreController.onTransactionSent);
       ctr.emitter$.off(ctr.ON_TRANSACTION_SEND_PROGRESS, JaxxDatastoreController.onTransactionSendProgress);
   
       // service.balances$.off(service.ON_BALANCE_CHANGE_CHANGE,self.onBalanceChangeChanged);
       // service.balances$.off(service.ON_BALANCE_RECEIVE_CHANGE,self.onBalanceReceiveChanged);
   
     }
   */
    JaxxDatastoreController.ON_NEW_ADDRESS_RECEIVE = 'ON_NEW_ADDRESS_RECEIVE';
    JaxxDatastoreController.ON_NEW_ADDRESS_CHANGE = 'ON_NEW_ADDRESS_CHANGE';
    JaxxDatastoreController.ON_NEW_BALANCE = 'ON_NEW_BALANCE';
    JaxxDatastoreController.ON_NEW_BACKGROUND_BALANCE = 'ON_NEW_BACKGROUND_BALANCE';
    JaxxDatastoreController.ON_BALANCE_CHANGED = 'ON_BALANCE_CHANGED';
    JaxxDatastoreController.ON_SPENDABLE_CHANGED = 'ON_SPENDABLE_CHANGED';
    JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_PREPARING = 'ON_TRANSACTION_TO_BUILD_PREPARING';
    JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_READY = 'ON_TRANSACTION_TO_BUILD_READY';
    /*
    
      static ON_TRANSACTION_SEND_START: string = 'ON_TRANSACION_SEND_START';
      static ON_TRANSACTION_SENT: string = 'ON_TRANSACTION_SENT';
      static ON_TRANSACTION_SEND_PROGRESS: string = 'ON_TRANSACTION_SEND_PROGRESS';
    
      static ON_TRANSACTION_SENT_ERROR: string = 'ON_TRANSACTION_SENT_ERROR';
    */
    /* static onTransactionSendStart(): void {
       JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_SEND_START, [arguments]);
     }*/
    /*  static onTransactionSent(): void {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_SENT, [arguments]);
      }*/
    /*  static onTransactionSendProgress(): void {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_SEND_PROGRESS, [arguments]);
      }*/
    /*  static onTransactionSendError(): void {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_SENT_ERROR, [arguments]);
      }*/
    /* static ON_NEW_TRANSACTIONS_HISTORY: string = 'ON_NEW_TRANSACTIONS_HISTORY';
     static ON_TRANSACTIONS_HISTORY_UPDATED: string = 'ON_TRANSACTIONS_HISTORY_UPDATED';*/
    /*
      static onNewTransactionsHistory(): void {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NEW_TRANSACTIONS_HISTORY, [arguments]);
      }
    
      static onNewTransactionsHistoryUpdated(): void {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTIONS_HISTORY_UPDATED, [arguments]);
      }
    */
    // static ON_RESTORE_HISTORY_START: string = 'ON_RESTORE_HISTORY_START';
    // static ON_RESTORE_HISTORY_DONE: string = 'ON_RESTORE_HISTORY_DONE';
    // static ON_RESTORE_HISTORY_ERROR: string = 'ON_RESTORE_HISTORY_ERROR';
    /*static onRestoreHistoryStart(): void {
      JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_RESTORE_HISTORY_START, [arguments]);
  
    }
    */
    /*
      static onRestoreHistorydDone(): void {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_RESTORE_HISTORY_DONE, [arguments]);
    
      }*/
    /*static onRestoreHistoryError(): void {
      JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_RESTORE_HISTORY_ERROR, [arguments]);
  
    }*/
    JaxxDatastoreController.ON_NETWORK_ERROR = 'ON_NETWORK_ERROR';
    JaxxDatastoreController.ON_SWITCHING_CRYPTO = 'ON_SWITCHING_CRYPTO';
    JaxxDatastoreController.ON_CTYPTO_CHANGED = 'ON_CTYPTO_CHANGED';
    JaxxDatastoreController.ON_CRYPTO_OFF = 'ON_CRYPTO_OFF';
    JaxxDatastoreController.ON_TRANSACTIONS_CHANGE = 'ON_TRANSACTIONS_CHANGE';
    JaxxDatastoreController.emitter$ = $({});
    return JaxxDatastoreController;
}());
//var JAXX$ = JaxxDatastoreController.emitter$ 
//# sourceMappingURL=datastore_controller.js.map