/**
 * Created by Vlad on 11/10/2016.
 */


module jaxx {

    export class TransactionController {
        accountService: JaxxAccountService;
        db: JaxxDatastoreLocal;
        name: string;
        toSaveNonces: boolean;
       // toSaveUTXO: boolean;
        toSaveBalances: boolean;
        toSaveTempUTXOs: boolean;
        nonces: _.Dictionary<number> = {};

        balancesTemp: VOBalanceTemp[] = [];

        CACHE_EXPIRE: number =  1000 * 60 * 60 * 24;
        intervalSaveScanner: number = 2500;




        // preparedTransactions: VOTransaction[];
        emitter$ = $({});

        ON_ALL_TRANSACTIONS_SENT: string = 'ON_TRANSACTIONS_SENT';
        ON_ONE_TRANSACTION_SENT: string = 'ON_ONE_TRANSACTION_SENT';
        ON_TRANSACTIONS_CONFIRMED: string = 'ON_TRANSACTIONS_CONFIRMED';


        //ON_PREPARING_TRANSACTIONS_RECEIVE:string ='ON_PREPARING_TRANSACTIONS_RECEIVE';
        // ON_PREPARING_TRANSACTIONS_CHANGE:string = 'ON_PREPARING_TRANSACTIONS_CHANGE';

        ON_UTXOS_READY: string = 'ON_UTXOS_READY';
        ON_NONCES_READY:string = 'ON_NONCES_READY';


       // transactionsTempController: TransactionsTempControl;
        service: JaxxAccountService;

        // timeoutReceive:number;
        downloadingData: JQueryPromise<any>;
        //timeoutChange:number;
        //downloadingChange:JQueryPromise<any>;

        lastSendTimestamp: number;
        isActive: boolean;

        /*  startTimer(balance: VOBalanceTemp): void {
         setTimeout(() => {
         var balance: VOBalanceTemp = this.removeBalanceTemp(balance);
         console.log(' removing balance manualy ', balance);

         }, 2 * 60 * 1000);
         }*/

        /*   reset(): void {

         var balances: VOBalanceTemp[] = this.db.getBalancesTemp();
         balances.forEach((bal)=> {
         this.startTimer(bal);
         })
         //this.db.saveBalancesTemp([]);
         // this.db.balanceSpent=0;
         }*/


        logNonces() {
            console.log('%c nonces', 'color:red');
            for (let str in this.nonces) console.log(str + ' ' + this.nonces[str]);
        }

       /* saveScanner(): void {

            if (this.toSaveNonces) {
                this.db.saveNonces(this.nonces);
                this.toSaveNonces = false;
            }

            if (this.toSaveUTXO) {
                this.db.saveUTXOs(this.transactionsUnspent);
                this.toSaveUTXO = false;

            }
            if (this.toSaveBalances) {

                this.toSaveBalances = false;
            }


        }*/

        private saveInterval: number;
        private refreshInterval:number;
        private isToken:boolean;

        constructor(private controller: JaxxCryptoController) {

            this.isToken = controller.isToken;
            this.accountService = controller._accountService;
            this.name = this.accountService.name;
            this.db = controller._db;
            this.service = controller._accountService;



          //  this.transactionsTempController = new TransactionsTempControl(controller);


            this.service.balances$.on(this.service.ON_NEW_TRANSACTIONS, () => {
                this.prepareTransactions();
            });

            this.service.balances$.on(this.service.ON_BALANCES_DIFFERENCE, (evt, diff:string[]) => {
                // let addresses: string[] = Utils.getIds(diff);
                //console.log(diff);

                this.refreshUTXOs();

            });


            this.controller.emitter$.on(this.controller.ON_CURRENT_ADDRESS_RECEIVE_GOT_BALANCE, (evt, balance: VOBalance) => {
                //console.log(' new balance     ', balance);

                this.refreshUTXOs();
                if(this.isToken){

                }
            });

            controller.emitter$.on(controller.ON_RESTORE_HISTORY_DONE, () => {
                this.refreshUTXOs();
                //this.prepareTransactions();
            });

            this.controller.emitter$.on(this.controller.ON_TRANSACTION_CONFIRMED,(evt, transactions:VOTransaction[])=>{
               this.refreshUTXOs();
            })

        }

        ///////////////////////////////////////////////////////////////////////////////

        onSendTransactionStart(data: any): void {
            data.name = this.name;
            console.log(this.name + ' transaction start ',data);
        }

        ////////////////////////////////////////////////////////////////////////////////////

        timeoutSentTransactions: number;

        registerSentTransaction(data: {sent: any, result: any, name: string, fee: number}): void {
            //console.log(result);



            this.lastSendTimestamp = Date.now();
            //this.isActive = true;
            // this.checkStatus();

            console.log(this.name + ' Transaction sent', data);

            if (data.result.error) {
                console.error(data.result, this.nonces, this.utxos);
                return;
            }



            if (this.name.indexOf('Ethereum') !== -1) {
                console.warn(this.name + ' sending ' + data.sent.valueDelta)

                var txid: string = data.result.result;

                if(this.isToken)data.sent.gasPrice = 0;

                var bal: VOBalanceTemp = this.createBalanceTempEther(data.sent, txid);


                if(this.isToken){
                    let amount:number = jaxx.Registry.tempStorage[this.name]['amount'];
                    bal.spent = amount;
                  //  console.warn(bal);
                   Registry.datastore_controller_test.getCryptoControllerByName('Ethereum').transactionController.addTempNonce(bal);
                   // return;
                }else {

                    this.addTempNonce(bal);
                }

                this.db.addBalancesSpent([bal]);

                console.log(this.name + ' adding balance temp');
                clearTimeout(this.timeoutSentTransactions);
                this.timeoutSentTransactions = setTimeout(() => {
                    this.emitter$.triggerHandler(this.ON_ALL_TRANSACTIONS_SENT);
                }, 500);

            } else {




                let sentObj: VOTransactionSentObj = new VOTransactionSentObj(data.sent);

             //   console.log(sentObj)


                let vosent:VOTransactionSent = sentObj.sent;


                let sent:any = data.sent;
                let kkMockTx = sent._kkMockTx;

                let from:string = vosent.inputs[0].address;
                let to:string =vosent.outputs[0].address;
                let amount:number = vosent.outputs[0].amount;
                let timestamp:number = Math.round(vosent.timestamp/1000);
                let fee:number = sentObj.fee;


/*
                let tr:VOTransaction = new VOTransaction({
                    id:vosent.txid,
                    address:from,
                    from:from,
                    to:to,
                    value:amount,
                    timestamp:timestamp,
                    confirmations:0,
                    amount:amount/1e8,
                    miningFee:fee/1e8,
                    isTemp:true
                });*/

                //console.log(tr);




                if(sentObj.sent.inputs[0].address === 'notmyaddress'){
                    console.log(' it is not my transaction  ');
                    return;
                }

                this.sendTransactionController(sentObj);

              //  this.emitter$.triggerHandler(this.ON_TRANSACTIONS_SENT,tr);
                this.timeoutSentTransactions = setTimeout(() => {
                    this.emitter$.triggerHandler(this.ON_ALL_TRANSACTIONS_SENT);
                }, 500);
            }



            this.lastSendTimestamp = Date.now();

            this.emitter$.triggerHandler(this.ON_ONE_TRANSACTION_SENT);

        }


        createBalanceTempBitcoin(input: VOInput): VOBalanceTemp {

            return new VOBalanceTemp({
                id: input.address,
                timestamp: Date.now(),
                txid: input.txid,
                count: 0,
                value: input.amount,
                spent: -input.amount
            });

        }


        getBalancesTempFromTransaction(sent: VOTransactionSent): VOBalanceTemp[] {

            let ar: VOInput[] = sent.inputs;
            let indexed = {};

            for (let i = 0, n = ar.length; i < n; i++) {
                let input: VOInput = ar[i];

                if (indexed[input.address]) {
                    indexed[input.address].value -= input.amount
                } else {
                    indexed[input.address] = this.createBalanceTempBitcoin(input);
                }
            }

            let balancesTemp: VOBalanceTemp[] = [];

            for (let str in indexed) {
                balancesTemp.push(indexed[str]);
            }

            return balancesTemp;
        }


        tempUTXOS: VOutxo[] = [];


        sendTransactionController(sent: VOTransactionSentObj): void {

            //console.log(sent);

            let toSpent: VOOutput[] = sent.toSpent;

            let transaction: VOTransactionSent = sent.sent;

            let txid: string = transaction.txid;

            let outputs: VOOutput[] = transaction.outputs;

           // console.log(outputs);

            let toAddress: string = outputs[0].address;


            let myReceive: string[] = this.controller.getAddressesReceive();

            let addressChange:string = this.controller.getCurrentAddressChange();

            let change: VOOutput;

            /// TODO what to do with outputs;
            /// what am


            outputs.forEach(function (item) {
                if(item.address === addressChange){
                    change = item;
                }


                if (item.addressInternal) {
                    change = item;
                }
                else {

                    let ind: number = myReceive.indexOf(item.address);

                    if (ind !== -1) {

                        let utxo: VOutxo = new VOutxo(item);
                        utxo.amountBtc = HDWalletHelper.convertSatoshisToBitcoins(item.amount);
                        utxo.addressIndex = ind;
                        //  utxo.index = 0;
                        utxo.standard = true;

                        console.log(' going to my address ', item);
                    }

                }

            });


            let inputs: VOInput[] = transaction.inputs;

            console.log('inputs,outputs',inputs,outputs);

            let tempBalance: VOBalanceTemp[] = Utils.createTempBalancesFromInputs(inputs, toAddress);


            if(change){
                console.log(' adding change   ' + change.amount);

                let balanceChange:VOBalanceTemp = new VOBalanceTemp({
                    id:change.address,
                    spent:-change.amount,
                    txid:txid,
                    timestamp:Date.now()
                });
                tempBalance.push(balanceChange);
            }

            this.db.addBalancesSpent(tempBalance);
            console.log(tempBalance);


            this.utxosSpentIds = inputs.map(function (item) { return item.address+'-'+item.previousTxId; });



           // let keys2: string[] = Utils.constartcInput2Keys(inputs);

           // console.log('before', this.getUTXOsNotInQueue());

           // Utils.setInQueueUTXOsBy2Keys(this.utxos, keys2);

           // console.log(' NOT in queue ', this.getUTXOsNotInQueue());
            //console.log('in queue ', this.getUTXOsInQueue());


        }

        utxosSpentIds:string[] = [];

        updateUTXOS(utxos: VOutxo[]): void {
            this.utxos = Utils.updateUTXOS(this.utxos, utxos);
            this.toSaveTempUTXOs = true;
        }

        loadUnconfirmedTransactions(): void {
            let uncofirmed: VOutxo[] = this.getUTXOs().filter(function (item) {
                return item.inqueue;
            })
        }


        intervalCheckUTXO: number = 0;
        delayCheckUTXOInterval: number = 10000;


        sartCheckUTXOS(): void {
            if (this.intervalCheckUTXO === 0) {
                this.intervalCheckUTXO = setInterval(() => this.loadUnconfirmedTransactions(), this.delayCheckUTXOInterval)
            }
        }


        addUTXO(utxo: VOutxo): void {
            //TODO check is this transaction exists;
            // var ids:string[] = Utils.getUTXOIds(this.transactionsUnspent);
            // if(ids.indexOf(utxo.txid) === -1) this.transactionsUnspent.push(utxo);
            this.utxos.push(utxo);

        }


        remapUTXOs(utxos: VOutxo[]): VOutxo[] {
            let ctr:JaxxCryptoController = this.controller;
            utxos.forEach(function (item) {

                item.addressIndex = ctr.getAddressIndex(item.address);
                item.addressInternal = ctr.isAddressInternal(item.address);
               // item.confirmations = 6;
                //item.amountBtc = item.amountBtc//(item.amount/1e8)+'';
                    item.spent = false;
                    item.standard = true;
                    item.index = item.vout;
            });
            return utxos;

/*
            let out: any[] = [];
            let indexed:any = {};

            for (let i = 0, n = unspent.length; i < n; i++) {
                let trs = unspent[i];
                if(indexed[trs.id + trs.address]){

                    console.warn(' duplicate UTXO ' + trs.id + ' address: ' +  trs.address);
                    continue;
                }
                indexed[trs.id + trs.address] = trs;

                out.push(new VOutxo({
                    address: trs.address,
                    addressIndex: this.controller.getAddressIndex(trs.address),
                    addressInternal: this.db.isAddressInternal(trs.address),
                    amount: trs.amount,
                    amountBtc: trs.amountBtc + '',
                    confirmations: trs.confirmations,
                    index: trs.index,
                    spent: false,
                    standard: true,
                    timestamp: trs.timestamp,
                    txid: trs.id
                }));

            }
            return out;*/
        }


        remapTransactionsToOldCode(unspent: VOTransactionUnspent[]): VOutxo[] {

            let out: any[] = [];
            let indexed:any = {};

            for (let i = 0, n = unspent.length; i < n; i++) {
                let trs = unspent[i];
                if(indexed[trs.id + trs.address]){

                    console.warn(' duplicate UTXO ' + trs.id + ' address: ' +  trs.address);
                    continue;
                }
                indexed[trs.id + trs.address] = trs;

                out.push(new VOutxo({
                    address: trs.address,
                    addressIndex: this.controller.getAddressIndex(trs.address),
                    addressInternal: this.db.isAddressInternal(trs.address),
                    amount: trs.amount,
                    amountBtc: trs.amountBtc + '',
                    confirmations: trs.confirmations,
                    index: trs.index,
                    spent: false,
                    standard: true,
                    timestamp: trs.timestamp,
                    txid: trs.id
                }));

            }
            return out;
        }




       /* downloadUpdateUTXOs(addresses:string[]): void{
            if (addresses.length === 0) {
                return;
            }
            let start: number = Date.now();
            console.log('%c '+ this.name + '     downloadUTXOs    '+ addresses.toString(),'color:#22F');
            this.downloadingTransactions$ = this.service.downloadTransactionsUnspent(addresses).done(res => {

                console.log(this.name + ' download unspent transactions in ' + (Date.now() - start) + ' ms');

                this.updateUTXOS(this.remapTransactionsToOldCode(res.utxos));
                this.toSaveUTXO = true;

            })
        }
*/

        downloadUTXOs(callBack:Function,): void {
          //  console.log(' downloadUTXOs  '+  this.downloadingData);
            if(this.downloadingData) return;
            let start: number = Date.now();
            let addresses = this.db.getAddressesNot0();
            addresses.push(this.db.getCurrentAddressChange());
            addresses.push(this.db.getCurrentAddressReceive());

             /*   console.log(this.db.getBalancesReceive().filter(function (item) {
                    return item.balance !==0;
                }));*/
              /*  console.log(this.db.getBalancesChange().filter(function (item) {
                    return item.balance!==0;
                }));*/
/*
            if (addresses.length === 0) {
                return;
            }*/

           // console.log(this.name + ' address change ' + this.db.getCurrentAddressChange());

           // console.log('%c '+ this.name +' download UTXOs '+ addresses.toString(),'color:green');

            this.downloadingData = this.service.downloadTransactionsUnspent(addresses).done(res => {
              //  console.log(addresses.length);
                console.log('%c '+this.name + ' download UTXOs in ' + (Date.now() - start) + ' ms','color:green');

               // console.log(res.utxos);

                let utxos:VOutxo[];
                if(!res.utxos)utxos = this.remapUTXOs(res.result);
                else utxos = this.remapTransactionsToOldCode(res.utxos);
                let utxosSpentIds:string[] = this.utxosSpentIds;
               // console.log(utxosSpentIds);
                let outUtxos:VOutxo[] = [];
               // console.log(utxos);
                this.utxos = utxos.filter(function (item) { return utxosSpentIds.indexOf(item.address+'-'+item.txid) ===-1 });
                //this.utxos =
                this.db.saveUTXOs(this.utxos);
                 console.log(this.utxos);

               // this.toSaveUTXO = true;
                this.lastSendTimestamp = 0;
                this.unspentObj = res.result;

                this.emitter$.triggerHandler(this.ON_UTXOS_READY,[this.getUTXOs()]);
                callBack();
            }).fail(err=>callBack(err))
                .always(()=>this.downloadingData = null);
        }



        getUTXOsInQueue(): VOutxo[] {

            return this.getUTXOs().filter(function (item) {
                return item.inqueue
            });
        }

        getUTXOsNotInQueue(): VOutxo[] {

            return this.getUTXOs().filter(function (item) {
                return !item.inqueue
            });
        }

        getUTXOs(): VOutxo[] {

            return Utils.deepCopy(this.utxos) || [];

        }

        ////////////////////////////// en of Bitcoin ///////////////////////////////////////////

        onNewTransactions(transactions: VOTransaction[]): void {
            //console.warn('new transactions',transactions);

            /*  var balancesTemp:VOBalance[] = this.db.getBalancesTemp();
             if(balancesTemp.length){

             var indexed = _.keyBy(transactions,'id');

             var out:VOBalanceTemp[] = [];
             balancesTemp.forEach((item)=>{

             if(!indexed[item.txid]){
             out.push(item)
             }else{
             var spent:number = item.spent
             this.db.removeSpending(spent);
             // console.log('  bingo removing temp transaction ');
             }
             })



             //  console.log('%c after transactions removed  have spent ' + this.db.balanceSpent/1e15,'color:red');
             if(balancesTemp.length !== out.length){
             this.db.saveBalancesTemp(out);
             }
             }
             */
        }

        //////////////////////////////////////// integration //////////////////////////////


        deactivate(): void {
            this.isActive = false;
            clearInterval(this.saveInterval);
            clearInterval(this.refreshInterval);
            this.downloadingData = null;
        }

        ON_PREPAROING_TRANSACTIONS: string = 'ON_PREPAROING_TRANSACTIONS';

        activate(): void {
            this.isActive = true;
            console.log('%c ' + this.name + ' activating transaction-controller ' + this.lastSendTimestamp,'color:green');

           this.prepareTransactions();
            clearInterval(this.saveInterval);
            clearInterval(this.refreshInterval);
            this.refreshInterval = setInterval(()=>{
                if(this.name.indexOf('Ethereum') === -1) this.refreshUTXOs();
            },20000);


            //this.saveInterval = setInterval(() => this.saveScanner(), this.intervalSaveScanner);

        }

        refreshUTXOs():JQueryDeferred<any>{
            let promise:JQueryDeferred<any> = $.Deferred();

            if (this.name.indexOf('Ethereum') !== -1){

                console.log('%c '+ this.name + ' calling download nonce  is busy ' + this.downloadingData,'color:orange');
                this.downloadNonce((err)=>{
                    if(err) promise.reject(err);
                    else promise.resolve(this.nonces);
                });
            }
            else  this.downloadUTXOs((err)=>{

                if(err) promise.reject(err);
                else promise.resolve(this.getUTXOs())
            });
            return promise;
        }



        prepareTransactions():void{
            if (this.name.indexOf('Ethereum') !== -1){
                this.nonces = this.db.getNonces();
                this.refreshUTXOs();
            } else {

                this.utxos = this.db.getUTXOs();
                this.utxos = _.uniqBy(this.utxos, 'txid');

                this.refreshUTXOs();
            }
        }



/*


        prepareChache():void{
           console.log(this.name + ' prepareCache ');

            if (this.name.indexOf('Ethereum') !== -1) {

                this.nonces = this.db.getNonces();
                this.downloadTransactionsReceive();
                  console.log(this.name + ' prepareChache   nonces ', this.nonces);
                if (_.isEmpty(this.nonces)) {
                    console.warn(this.name + ' nonces are empty downloadTransactionsReceive');
                    this.downloadTransactionsReceive();
                }

            } else {
                this.transactionsUnspent = this.db.getUTXOs();
                console.log(' UTXOs', this.transactionsUnspent);

                if (this.transactionsUnspent.length === 0) {
                    this.downloadUTXOs();
                }
            }
        }*/

        reset(): void {
            this.db.saveNonces({});
            this.db.saveUTXOs([]);
            this.db.resetBalancesSpent();
           // this.transactionsReceive = null;
            this.utxos = null;
            this.nonces = null;
            this.lastSendTimestamp = 0;
        }

        private utxos: VOutxo[] = [];
        private unspentObj: any = {};
        downloadingTransactions$: JQueryPromise<any>;


////////////////////////////////////// Ethereum //////////////////////////////////////////////////////


        createBalanceTempEther(tr: any, txid: string): VOBalanceTemp {

            var sent: number = -tr.valueDelta;
            var fee: number = tr.gasPrice * tr.gasUsed;
            var to: string = tr.to;
            // var txid:string = result.result.result;


            var balanceT: VOBalanceTemp = new VOBalanceTemp({
                id: tr.from,
                fee: tr.gasPrice * tr.gasUsed,
                // balance:- (sent + fee),
                nonce: tr.nonce,
                spent: (sent + fee),
                timestamp: Date.now(),
                txid: txid,
                count: 0,
                value: tr.valueDelta
            });

            return balanceT;

        }

        //downloadNonceForAddress(address:string)

        downloadNonceForFirstAddress():void{
            if(Object.keys(this.nonces).length){
                console.log(' have nonces -> breaking ' , this.nonces);
                return;
            }
            console.log(' download nonce of first address ');
            let address:string =  this.controller.getAddressRecieve(0);

           // his.downloadingData =
                this.service.downloadTransactions([address]).done((trs: any) => {


              //  this.downloadingData = null;
                let nonces = jaxx.Utils.getNoncesOfAddresses(trs);

                if(!this.nonces) this.nonces = {};
                this.nonces[address] = nonces[address];
                this.toSaveNonces = true;
                console.log(this.name,this.nonces);
                //this.emitter$.triggerHandler(this.ON_PREPARING_READY);
                this.lastSendTimestamp = 0;
                //console.log('%c transactions receive  in: '+(Date.now() - start)+'ms','color:#bb0');


            })
        }

        //transactionsReceive: VOTransaction[];


        downloadNonce(callBack:Function): void {


            if(this.downloadingData) return;
            this.emitter$.triggerHandler(this.ON_PREPAROING_TRANSACTIONS);

            let start: number = Date.now();

            var addesses: string[] = Utils.addresseFromBalances(this.db.getBalancesNot0Receive());

             console.log('%c '+ this.name + ' have not 0 balances ' + addesses.length,'color:orange');

             if (addesses.length == 0) {

                this.nonces = {};
                this.db.saveNonces(this.nonces);
                return;
            }

            this.downloadingData = this.service.downloadTransactions(addesses).done((trs: any) => {

                // console.log(trs);
                //this.transactionsReceive = trs;
                this.downloadingData = null;

                this.nonces = jaxx.Utils.getNoncesOfAddresses(trs);

                this.db.saveNonces(this.nonces);

                //this.toSaveNonces = true;
                console.log(this.name + ' download nonce in ' + (Date.now() - start) + ' ms',this.nonces);

                this.emitter$.triggerHandler(this.ON_NONCES_READY,this.getNonces());

                this.lastSendTimestamp = 0;
                //console.log('%c transactions receive  in: '+(Date.now() - start)+'ms','color:#bb0');


            }).fail(err=>callBack(err))
            //.progress(res=>console.log(res+'%c ready transactions receive ','color:#bb0'))
                .always(res => this.downloadingData = null);

        }


        getNonces(orig?:boolean):any{
            return orig?this.nonces:_.clone(this.nonces);
        }

        addTempNonce(balance: VOBalanceTemp) {
            console.log('%c  ' + this.name + ' add nonce  to address '+ balance.id,'color:orange' );
            if (this.nonces) {

                if (this.nonces[balance.id]) {

                    this.nonces[balance.id]++;
                    console.log('%c '+ this.name + ' nonce added to ' + balance.id + '   ' + this.nonces[balance.id], 'color:orange');
                } else {
                    this.nonces[balance.id] = 1;
                    console.log('%c nonce setting  to 1 ' + balance.id, 'color:orange');
                }

                this.toSaveNonces = true;

            } else console.error(' nonces are not ready ');
        }


        getNonceForAddress(address: string): number {
            return this.nonces[address] || 0;
        }


        //sortedHighestAccountArray:{index:number, balance:number, address:string}[] = [];

        getHighestAccountBalanceAndIndex(): {index: number, balance: number, address: string}[] {
            // if(this.highestAccountBalanceAndIndex) return this.highestAccountBalanceAndIndex;
            var balancesReceive: VOBalance[] = this.db.getBalancesIndexedReceiveNot0WithIndex();
            var balancesChange: VOBalance[] = this.db.getBalancesIndexedChangeNot0WithIndex();
            /// console.log(balancesReceive);
            var balances: VOBalance[] = balancesReceive.concat(balancesChange);


            var ar: VOBalance[] = _.sortBy(balances, ['balance']).reverse();

            var out: {index: number, balance: number, address: string}[] = [];
            _.each(ar, function (item) {
                out.push({index: item.index, balance: item.balance, address: item.id});
            });

            if (out.length === 0) {
                this.controller._sortedHighestAccountArray = [];
                return null;
            }

            return out;
            // return this.controller._sortedHighestAccountArray[0];
        }


        prepareAddresses(addresses: string[]): JQueryDeferred<any> {





            var deferred: JQueryDeferred<_.Dictionary<number>> = $.Deferred();
            deferred.resolve(this.nonces);


            return deferred;
        }



        /* getTransactionsUnspent2():VOTransactionUnspent[]{

         return this.transactionsUnspent.map(function(item){ return new VOTransactionUnspent(item)});
         }

         getTransactionsUnspent():VOTransactionUnspent[]{

         return Utils.deepCopy(this.transactionsUnspent);
         }*/





        /* clearBalancesTemp(): VOBalanceTemp[] {
         var bals: VOBalanceTemp[] = this.balancesTemp;
         this.balancesTemp = [];
         return bals;
         }*/


        /* removeBalanceTemp(balance: VOBalanceTemp): VOBalanceTemp {
         var balances = this.db.getBalancesTemp();
         var i = balances.indexOf(balance);
         if (i !== -1) {
         this.db.removeSpending(balance.spent);
         balances.splice(i, 1);
         //this.db.saveBalancesTemp(balances);
         return balance;
         } else {
         //console.log('%c balance was removed  ' + balance.spent/1e15,'color:brown');
         }
         }*/

        //if(this.isBusy)return;
        // console.warn(addresses);

        /*   var unique:string[] = [];
         addresses.forEach(function(address){
         if(unique.indexOf(address) == -1) unique.push(address)

         })

         addresses = unique;
         var deferred:JQueryDeferred<_.Dictionary<number>> = $.Deferred();

         //TODO uncomment busy
         //this.controller.isBusy = true;

         this.accountService.downloadTransactions(addresses).done(transactions =>{

         /!* if(this.transactionsChecker.transactionsTemp.length){
         transactions = Utils.concatTransactions(transactions, this.transactionsChecker.getTransactionsTemp())
         }*!/

         this.preparedTransactions = transactions;

         var nonces = jaxx.Utils.getNoncesOfAddresses(transactions);
         this.nonces = nonces;
         deferred.resolve(this.nonces);

         }).fail(err => deferred.resolve(err))
         .progress((p) => deferred.notify(p))
         // .always(res=>this.controller.isBusy = false);*/
        // transactionsChange:VOTransaction[];

        // transactionsEthereum :VOTransaction[];

        /* isPreapred:boolean
         preparingReady():void{
         this.isPreapred = true;
         }*/

        /* prepareTransactionData():void{
         switch (this.name){
         case 'Ethereum':
         this.prepareEthereum();
         break;
         default:
         //this.prepareBitcoin();
         break

         }
         if(this.isPreapred) {
         this.emitter$.triggerHandler(this.ON_PREPARING_READY);
         }
         }
         */


        /*  prepareEthereum():void{
         // console.log('prepareEthereum')
         if(!this.transactionsReceive) return;


         console.log(this.nonces);
         // let ids:string[] = Utils.getIds(this.transactionsReceive);
         // this.db.removeTempBalancesByTxIds(ids);

         this.preparingReady();
         }*/

        /*   addNoncesFromTempBalances():void{
         /!*var tempBal:VOBalanceTemp[] = this.db.getBalancesTemp();



         for(var i=tempBal.length -1;i>=0;i--){
         var trsids:string[] = tempBal[i].txids;
         if(Utils.isArrayInObject(trsids,this.nonces)) {
         //console.log('   removing from temp   ',tempBal[i]);
         tempBal.splice(i,1);
         }else{
         var id:string = tempBal[i].id
         if(this.nonces[id]){
         this.nonces[id]++;
         console.warn(' still have temp balance  adding nonce for address ' + id + '   ' + this.nonces[id])
         }
         }
         }*!/

         }
         */


        /*
         prepareBitcoin():void{
         if (this.relayedTransactionListArrayChange && this.transactionsChange && this.relayedTransactionListArrayReceive && this.transactionsReceive){
         //console.log(this.relayedTransactionListArrayChange);
         ////console.log(this.transactionsChange);
         // console.log(this.relayedTransactionListArrayReceive);
         // console.log(this.transactionsReceive);

         this.preparingReady();

         }


         }*/

        /*  prepareTransactionsForAddresses(addresses: string[], name:string):JQueryDeferred<number>{

         var deferred: JQueryDeferred<number> = $.Deferred();

         this.accountService.downloadTransactions(addresses)
         .done(transactions =>{
         //console.log(transactions);
         /!* if(this.transactionsChecker.transactionsTemp.length){
         transactions = Utils.concatTransactions(transactions, this.transactionsChecker.getTransactionsTemp())
         }*!/
         switch(name){
         case 'Ethereum':
         this.transactionsEthereum = transactions;
         break;
         case 'Bitcoin':
         break;
         }



         deferred.resolve(transactions.length);

         }).fail(err => deferred.resolve(err))
         .progress((p) => deferred.notify(p))

         return deferred
         }*/


        /*createNonces():void{
         this.nonces = jaxx.Utils.getNoncesOfAddresses(addresses, transactions);
         }*/


    }


}