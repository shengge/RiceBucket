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

module jaxx {
    export class Registry {

        static RESET_STORAGE:string = 'RESET_STORAGE';

        static BALANCE_OUT_OFF_SYNC = 'BALANCE_OUT_OFF_SYNC';
        static BALANCE_IN_SYNC = 'BALANCE_IN_SYNC';
        static SYNC_CHECK_START:string = 'SYNC_CHECK_START';
        static SYNC_CHECK_END:string = 'SYNC_CHECK_END';

        static ON_SHAPE_SHIFT_ACTIVATE:string = 'ON_SHAPE_SHIFT_ACTIVATE';


        static ON_UTXOS_READY:string = 'ON_UTXOS_READY';
        static ON_NONCES_READY:string = 'ON_NONCES_READY';

        static ON_SEND_TRANSACTION: string = 'ON_SEND_TRANSACTION';
        static ON_USER_TRANSACTION_COFIRMED: string = 'ON_USER_TRANSACTION_COFIRME';
        static DATA_FROM_RELAY: string = 'DATA_FROM_RELAY';
        static ON_TRANSACTIONS_OBJECT: string = 'ON_TRANSACTIONS_OBJECT';
        static BEGIN_SWITCH_TO_COIN_TYPE: string = 'BEGIN_SWITCH_TO_COIN_TYPE';
        static COMPLETE_SWITCH_TO_COIN_TYPE: string = 'COMPLETE_SWITCH_TO_COIN_TYPE';
        ///////////TODO remove duplicates
        static TRANSACTION_BEFORE_SEND: string = 'TRANSACTION_BEFORE_SEND';
        static TRANSACTION_SENT: string = 'TRANSACTION_SENT';
        static TRANSACTION_FAILED: string = 'TRANSACTION_FAILED';
        static TRANSACTION_ACCEPTED: string = 'TRANSACTION_ACCEPTED';
        static TRANSACTION_CONFIRMED: string = 'TRANSACTION_CONFIRMED';
        static ON_RESTORE_HISTORY_START: string = 'ON_RESTORE_HISTORY_START';
        static ON_RESTORE_HISTORY_ERROR: string = 'ON_RESTORE_HISTORY_ERROR';
        static ON_RESTORE_HISTORY_DONE: string = 'ON_RESTORE_HISTORY_DONE';

        //Balances
      //  static ON_RESTORE_BALANCE_START = "ON_RESTORE_BALANCE_START";
        static ON_RESTORE_BALANCE_ERROR = "ON_RESTORE_BALANCE_ERROR";
      //  static ON_RESTORE_BALANCE_END = "ON_RESTORE_BALANCE_END";
        static ON_RESTORE_BALANCE_MANUAL_START = "ON_RESTORE_BALANCE_MANUAL_START";
        static ON_RESTORE_BALANCE_MANUAL_END = "ON_RESTORE_BALANCE_MANUAL_END";




        static ON_BALANCE_RECEIVE_CHANGE:string = 'ON_BALANCE_RECEIVE_CHANGE';
        static ON_BALANCE_DEEMED:string = 'ON_BALANCE_DEEMED';
        static ON_BALANCE_ACCURATE:string = 'ON_BALANCE_ACCURATE';


//////////////////////
        static BITCOIN_MINING_FEE: string = 'BITCOIN_MINING_FEE';

        static ON_NEW_WALLET_CREATED: string = 'ON_NEW_WALLET_CREATED';

        /////////////////////////// Application events ////////////////////////////
        static OFFLINE: string = 'OFFLINE';
        static ONLINE: string = 'ONLINE';
        static PAUSE: string = 'PAUSE';
        static RESUME: string = 'RESUME';

        static KILL_HISTORY: string = 'KILL_HISTORY';


        static appState:AppState;

        ////////////////////////////////////////////////////////////////////////////
        static datastore_controller_test: JaxxDatastoreController;
        static current_crypto_controller: JaxxCryptoController;
        //static crypto_controllers_test:any = {};

        //static database$ = $({});
        //static userActions$=$({});
        // static idatamodel:IDataModel;
        static application$ = $({});
        static sendTransaction$ = $({});
        static _currentCoinType: number;
        static set currentCoinType(currentCoinType: number) {
            // console.error(' setting currentCoinType ' + currentCoinType);
            Registry._currentCoinType = currentCoinType
        };

        static get currentCoinType() {
            return Registry._currentCoinType;
        };

        static tempStorage:any = {};
        static currentTransaction: any;
        static currentTransactionTemp: any;
        static ON_KEY_INIT: string = 'ON_KEY_INIT';
        static settings: any;
        // static implEthereum:any;
        static start: number;
        static tempWallet: any;

    }
    Registry.start = Date.now();
}