///<reference path="../com/models.ts"/>
///<reference path="../services/account-service.ts"/>
///<reference path="../com/Registry.ts"/>
///<reference path="../datastore/crypto_controller.ts"/>

///<reference path="../datastore/refresh_data_controller.ts"/>
///<reference path="balance.ts"/>


//import JaxxAccountService = jaxx.JaxxAccountService;
//import TransactionController = jaxx.TransactionController;
declare var g_JaxxApp: any;
declare var JaxxApp: any;
declare var JaxxAppStatic: any;


class JaxxDatastoreController {
 // allCurrency: string[] = ['Bitcoin', 'Ethereum', 'Dash', 'LIGHT'];
  settings: any;
  currentName: string;
  defaultName: string;


  _cryptoControllers: JaxxCryptoController[] = [];
  _currentCryptoController: JaxxCryptoController = null;
  tempHex: string;
  refreshDataController: jaxx.RefreshDataController;
  balance: jaxx.BalanceController;

  constructor() {

    $(document).ready(() => {
      this.balance = new jaxx.BalanceController(this);
    })
    jaxx.Registry.application$.on(jaxx.Registry.BEGIN_SWITCH_TO_COIN_TYPE,

      (evt, data) => {
        //{currentCoinType:currentCoinType, targetCoinType:targetCoinType}
       // console.error('BEGIN_SWITCH_TO_COIN_TYPE   ' + data);

     /*   var target: number = data;
        setTimeout(() => this.activate(target), 500);
        ;*/
      });

    jaxx.Registry.application$.on(jaxx.Registry.COMPLETE_SWITCH_TO_COIN_TYPE,
      (evt, coinType) => {
        //{currentCoinType:currentCoinType, targetCoinType:targetCoinType}
        console.warn();

          setTimeout(() => this.activate(coinType), 500);

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
    jaxx.Registry.application$.on(jaxx.Registry.ON_SEND_TRANSACTION, (evt, tr) => {
      this.tempHex = tr.hex;
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


  config:any;

  initialize(config:any): void {
     config.options = _.keyBy(config.coinsOptions,'id');
     // console.log(config);
      this.config = config;
    console.log("[ JaxxDatastoreController :: Initialize ]");
    // console.log( JaxxAppStatic);

    // g_JaxxApp.getGlobalDispatcher().addEvent(this,'CRYPTO_SELECTED',(evt,data) =>{


    jaxx.Registry.application$.on('CRYPTO_SELECTED', (evt, data) => {

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
              data.name ='ZCash';
              break;
          case 'ZEC':
          data.name ='ZCash';
          break;
          case 'DOGE':
              data.name ='Doge';
              break;
      }

     // console.log('   enable - disable ',data);
      this.enableDisableCryptoController(data.name,data.enabled);

    });
    /* JaxxAppStatic.cryptoDispatcher$.on('CRYPTO_SELECTED',(evt,data) =>{
     console.warn(data);
     });*/

  }

  enableDisableCryptoController(name:string, enabled:boolean):void{
      var ctr: JaxxCryptoController = this.getCryptoControllerByName(name);
      if (ctr) {
          ctr.setEnabled(enabled);
      }else {
          console.warn(' cant find controller with name ' + name);
      }
  }


  onSendTransactionStart(data: any): void {
    if (this._currentCryptoController) this._currentCryptoController.onSendTransactionStart(data);

  }

  setCoinTypes(ar: HDWalletPouch[]): void {
    var out: any[] = [];
    let config:any = this.config;
    _.each(ar, function (pouch) {
      if (pouch) {
        out.push(new JaxxCryptoController(pouch, config));
      }
    });

    this._cryptoControllers = out;
    this.refreshDataController = new jaxx.RefreshDataController(out);
    // console.log(this._cryptoControllers);

    setTimeout(() => {
      var defaultId: number = jaxx.Registry.currentCoinType;
      this.activate(defaultId);
      if(jaxx.Registry.appState && jaxx.Registry.appState.create) delete jaxx.Registry.appState.create;
    }, 1000);
  }


  addCoinTypes(ar: HDWalletPouch[]): void {

      let config:any = this.config;
    var out: any[] = this._cryptoControllers;
    _.each(ar, function (pouch) {
      if (pouch) {

        out.push(new JaxxCryptoController(pouch,config));
      }
    });

    // this._cryptoControllers = out;
    // this.refreshDataController = new jaxx.RefreshDataController(out);
    // console.log(this._cryptoControllers);

    setTimeout(() => {

      var defaultId: number = jaxx.Registry.currentCoinType;
      this.activate(defaultId);
      $('#splashScreen').fadeOut();
    }, 1000);
  }


  /*  addCoinType(pouch:HDWalletPouch):JaxxCryptoController {
   var newCryptoController = new JaxxCryptoController(pouch);
   console.log(pouch);
   this._cryptoControllers.push(newCryptoController);
   return newCryptoController;

   }*/
  testFunction() {
    this.activate('Ethereum');
    //this.activate('Bitcoin');

  }

  ///////////////////////////////Interface implementation////////////////////////////////////////////////
  status$: JQuery = $({}) //    ON_READY | ON_ERROR | ON_NO_SERVICE  | SWITCHING_TO | SWITCHED_TO
  /* getBalance(): number {
   return this._currentCryptoController.getBalance();
   }*/

  getCurrentName(): string {
    return this._currentCryptoController.controllerSettings.id;
  }

  totalChange$: JQuery = $({})// evt,number
  getHistory(): VOTransaction[] {
    return null;
    //return this.currentModel.getTransactions();
  }


  /*  historyChange: JQuery = $({});
   onNewTransactions$: JQuery = $({});//evt, VOTransaction[]


   onSendTransactionConfirmed$: JQuery = $({});//evt , isConfirmed, transactionid

   */



  setDefault(coinType: string): void {
    this.defaultName = coinType;
  }


  activate(coinType: string | number): void {
    var cryptoController: JaxxCryptoController;
    if (typeof coinType === 'number') {
      cryptoController = this.getCryptoControllerById(coinType);
    }
    else cryptoController = this.getCryptoControllerByName(coinType);

    if (cryptoController) {
      if (this._currentCryptoController && this._currentCryptoController != cryptoController) {
        this._currentCryptoController.deactivate();
      }

      this._currentCryptoController = cryptoController;

      cryptoController.activate();
      jaxx.Registry.current_crypto_controller = cryptoController;

    } else console.log('%c dont have cotroller for ' + coinType, 'color:red');

    //this.addListeners(cryptoController);
  }

  //////////////////////////////////////////////end of interface ////////////////////////////////////////////////////

  getCryptoControllerByCoinType(coinType: number): JaxxCryptoController {
    return this.getCryptoControllerById(coinType);
  }

  getCryptoControllerById(id: number): JaxxCryptoController {
    var ar: JaxxCryptoController[] = this._cryptoControllers.filter(function (item) {
      return (item.id == id);
    })
    if (ar.length === 1)  return ar[0];
    else {
      console.log('%c   something wrong with id  ' + id, 'color:red');
    }
    return null;
  }

  getCryptoControllerByName(name: string): JaxxCryptoController {
    var ar: JaxxCryptoController[] = this._cryptoControllers.filter(function (item) {
      return (item.controllerSettings.name == name)
    })

    if (ar.length === 1)  return ar[0];
    else {
      console.log('%c no controlller with name ' + name, 'color:#0FF');
    }
    return null;
  }

  clearAndReset(): void {

      this._cryptoControllers.forEach(function (ctr) {
          ctr.resetStorage();
      });
    console.log("dataStore :: clearAndReset");

  }


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

  static ON_NEW_ADDRESS_RECEIVE: string = 'ON_NEW_ADDRESS_RECEIVE';
  static ON_NEW_ADDRESS_CHANGE: string = 'ON_NEW_ADDRESS_CHANGE';

  static onAddressChangeChanged(): void {


    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NEW_ADDRESS_CHANGE, [arguments]);
  }

  static onAddressReceiveChanged(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NEW_ADDRESS_RECEIVE, [arguments]);
  }


  static ON_NEW_BALANCE: string = 'ON_NEW_BALANCE';
  static ON_NEW_BACKGROUND_BALANCE: string = 'ON_NEW_BACKGROUND_BALANCE';

  static ON_BALANCE_CHANGED: string = 'ON_BALANCE_CHANGED';
  static ON_SPENDABLE_CHANGED: string = 'ON_SPENDABLE_CHANGED';


  static onBalanceChanged(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_SPENDABLE_CHANGED, [arguments]);
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_BALANCE_CHANGED, [arguments]);
  }


  static ON_TRANSACTION_TO_BUILD_PREPARING: string = 'ON_TRANSACTION_TO_BUILD_PREPARING';
  static ON_TRANSACTION_TO_BUILD_READY: string = 'ON_TRANSACTION_TO_BUILD_READY';

  static preparingTimeout: number;


  static onTransactionToBuildPreparing(): void {

    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_PREPARING);
  }

  static onTransactionToBuildReady(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTION_TO_BUILD_READY);
  }

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


  static ON_NETWORK_ERROR: string = 'ON_NETWORK_ERROR';

  static onNetworkError(): void {
    JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_NETWORK_ERROR, [arguments]);
  }

  static ON_SWITCHING_CRYPTO: string = 'ON_SWITCHING_CRYPTO';
  static ON_CTYPTO_CHANGED: string = 'ON_CTYPTO_CHANGED';
  static ON_CRYPTO_OFF: string = 'ON_CRYPTO_OFF';



  static ON_TRANSACTIONS_CHANGE:string = 'ON_TRANSACTIONS_CHANGE';

    static onNewTransactions(): void {
        JaxxDatastoreController.emitter$.triggerHandler(JaxxDatastoreController.ON_TRANSACTIONS_CHANGE, [arguments]);

    }

  static emitter$: JQuery = $({});

}

//var JAXX$ = JaxxDatastoreController.emitter$