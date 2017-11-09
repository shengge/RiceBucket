/**
 * Created by Vlad on 2016-11-24.
 */
module jaxx{

    export class TransactionsUpdater{
        service: JaxxAccountService;
        db: JaxxDatastoreLocal;

        private transactions: VOTransaction[];

        updatetimer:number;
        name:string;
        emitter$=$({});
        ON_TRANSACTION_CONFIRMED:string = 'ON_TRANSACTION_CONFIRMED';

        constructor(
            private controller:JaxxCryptoController,
            private options:{updateTimeout:number, confirmations:number}
            ){

            this.name = controller.name;
           this.updatetimer  = setInterval(()=>this.onTimer(), options.updateTimeout);

        }

        onError(err:any){

        }


        onTimer():void{
                if(!this.controller.isActive) return;
            if(this.isBusy ) {
                console.warn(' skipping request => no respond from server ');
                this.isBusy = false;
                return;
            }

            let trs:VOTransaction[] = this.controller._db.getTransactionsReceive();
            if(trs.length === 0) return;


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
                if(this.checUncofirmed(trs)){

                }else{
                    //this.checkTransactinsLast3Addresses(trs)

                }



        }

        checkTransactinsLast3Addresses(trs:VOTransaction[]):boolean{
              let addresses:string[] =   this.controller.getAddressesReceive();

              addresses = _.takeRight(addresses,3);
              trs.forEach(function (item) {
                  if(addresses.indexOf(item.address) !==-1) addresses.splice(addresses.indexOf(item.address),1);
              })
            return addresses.length !==0;

        }

        isBusy:boolean;

        checUncofirmed(trs:VOTransaction[]):boolean{
            let min:number = this.options.confirmations;
            // console.log(trs);

            let unconfirmed:VOTransaction[] = trs.filter(function (item) {
               // console.log(item.confirmations);
                return item.confirmations < min;
            })

            console.log('%c ' + this.controller.name + '  checkForUpdates total: ' + trs.length + ' unconfirmed: ' + unconfirmed.length,'color:red');



            if(unconfirmed.length){
                this.checkForUpdates(unconfirmed);
                return true;
            }

        }

        checkForUpdates(trs:VOTransaction[]):void{

                if(trs.length === 0) return;

                let db:JaxxDatastoreLocal = this.controller._db;
                let ctr:JaxxCryptoController = this.controller;
                let service:JaxxAccountService = this.controller._accountService;




            let addresses:string[] = trs.map(function (item) {
                return item.address;
            });

            let out:string[] = addresses.filter(function (item, pos) {
                return addresses.indexOf(item) == pos;
            });
            if(out.length>20) out =  _.take(out, 20);

           // console.log(' downloadTransactions   '+out.toString());

            this.isBusy = true;

                service.downloadTransactions(out).done((result:any)=>{

                    this.isBusy = false;

                    let newTransactions = result.transactions || result;
                 //   console.log(newTransactions);
                    let indexed:any  = _.keyBy(newTransactions,'id');
                    let oldTrs:VOTransaction[] =  db.getTransactionsReceive();

                    let justConfiremed:VOTransaction[] =[];

                   oldTrs.forEach(function (item) {

                       if(indexed[item.id]) {
                           //console.log(' old confirmations: ' + item.confirmations + ' new ' + indexed[item.id].confirmations);
                           if(!item.confirmations && indexed[item.id].confirmations) {

                               item.timestamp = indexed[item.id].timestamp;

                               console.log(' TRANSACTION_CONFIRMED  ' + item.confirmations +'   new ' + indexed[item.id].confirmations +'  at ' + new Date(item.timestamp*1000).toLocaleTimeString());
                               justConfiremed.push(item);
                           }
                          // if(!isNaN(indexed[item.id].timestamp))  item.timestamp = indexed[item.id].timestamp;
                           item.block = indexed[item.id].block;
                           item.confirmations = indexed[item.id].confirmations || 0;
                       }
                    });

                   if(justConfiremed.length) this.emitter$.triggerHandler(this.ON_TRANSACTION_CONFIRMED,[justConfiremed]);
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


                }).fail(err=>{
                    this.isBusy = false;
                    this.onError(err)
                });
        }



    }
}