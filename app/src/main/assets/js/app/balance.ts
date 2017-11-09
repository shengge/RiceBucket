/**
 * Created by Vlad on 10/11/2016.
 */
    ///<reference path="../com/models.ts"/>
    ///<reference path="../com/Registry.ts"/>
module jaxx{
  export class BalanceController{
        $refreshBtn:JQuery;
        $coinType:JQuery;
        $balance:JQuery;
        $currency:JQuery;
        $controls:JQuery;
      $overlay:JQuery

    constructor(private main:JaxxDatastoreController){
        this.$overlay = $('<div>')
            .addClass('overlay')
            .css( {
                position: 'absolute',
                top: '0',
                left: '0',
                width:'100%',
                height:'100%',
                backgroundColor:'rgba(0,0,0,0.5)'
                })
        this.init();

    }
    init():void{
        this.$refreshBtn = $('.scriptAction.refresh').first();
        //console.error(this.$refreshBtn.length);

        if(this.$refreshBtn.length == 0){
            setTimeout(()=>this.init(),2000);
            return;
       }

       /*
        this.$controls = $('#CryptoControls');
        this.$controls.get(0).addEventListener('click',(evt)=>{
            var v = $(evt.currentTarget);

          //  console.log(v.hasClass('off'));
            if(v.hasClass('off')){
                evt.stopPropagation();
            }else{

            }
        },true);*/

        var controls = this.$controls;
      //  console.warn( this.$refreshBtn);
        this.$refreshBtn.click(function () {
            console.error('click');
        })
     /*   this.$refreshBtn.click(()=>{

            ///console.log('  refresh ');
            //this.$refreshBtn.show();
            console.error('click');
            if(this.$controls.hasClass('off'))return;
            //this.$controls.addClass('off');
            //this.$controls.fadeTo('fast',0.5);
          this.main._currentCryptoController.checkBalanceCurrentReceive();
          jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_BALANCE_START);
          this.main._currentCryptoController.downloadAllBalances((err)=>{
            jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_RESTORE_BALANCE_END);
          })
            // 22nd Jan 2017 Anthony only wants to refresh balance and not transaction history
            //this.main._currentCryptoController.restoreHistoryAll((err)=>{

                //this.$refreshBtn.hide();
               // controls.removeClass('off');
               // controls.fadeTo('fast',1.0);
            //})
        })
*/
    }
  }

  export class CurrentAddressController{

    $currentAdderss:JQuery;
    $qrCode:JQuery;
  }



  export class SendOptionsController{
    $view:JQuery
    $optionsBtn:JQuery;
    $gasLimit:JQuery;
    $customData:JQuery;
    isVisible:boolean;
    isOptions:boolean;
    constructor(){
      this.init();
    }
    init():void{
      this.$view = $('.advancedTabContentEthereum.cssGapSmall.cssAdvancedTabContentEthereum').first();
      this.$customData =  $('.advancedTabButton.cssAdvancedTabButton').first().click((evt)=>{
        if(this.isVisible) this.isVisible = false;
        else this.isVisible = true;
        this.toggleView();
      })

    }

    showButton():void{
      if(this.isOptions){

      }else {
        this.isOptions = true;
        this.$optionsBtn.show();
      }
    }
    hideButton():void{
      if(this.isOptions) this.$optionsBtn.hide();
    }
   toggleView(){
     if(this.isVisible){
       this.$view.show('fast');

     }else{
       this.$view.hide('fast');
     }
    }

  }

  export class SendConfirmationController{
    $view:JQuery;
    $btnConfirm:JQuery;
    $btnClose:JQuery;
    $message:JQuery;
    $tax:JQuery;
    $taxMessage:JQuery;
    onConfirmed:Function
  ;
    onClose:Function;
    tr:any;
    constructor(){
      this.init();
    }
    init():void{
      this.$view = $('.modal.send').first();
      this.$btnClose = this.$view.find('.cssClose').first().click(()=>{console.log('on close click')});
      this.$btnConfirm = $('#Send-Confirm-Button').click((evt)=>this.onConfirmed());
    }

    show():void{
      this.$view.show();
    }
    hide():void{
      this.$view.hide();
    }
    setTransaction(tr:any):void{
      this.tr = tr
    }
    setAmount(num:number):void{

    }
    setMessage(str:string):void{

    }
  }


  export class SendAmmountController{
    $view:JQuery;
    $sendStartBtn:JQuery;
    $sendBtn:JQuery;
    $addressInput:JQuery;
    $amountInput:JQuery;
    $myAddress:JQuery;
    $maxBtn:JQuery;
    isActive:boolean;
   // coinType:string;
    optionsController:SendOptionsController;
    sendConfirmation:SendConfirmationController;
   // miningFee:number;
   // amount:number;
   // from:string;
   // to:string;
    rawTransaction:any;
    total:number;
    spendable:number;

    constructor(){
      //console.error( " SendAmmountController ");
      this.optionsController = new SendOptionsController();
      this.sendConfirmation = new SendConfirmationController();
      // this.rawTransaction = new VOSendRawTransaction();
      this.sendConfirmation.onConfirmed = ()=>{
        console.warn('   send confirmation confirmed   ');

        Registry.application$.triggerHandler(Registry.ON_USER_TRANSACTION_COFIRMED,this.rawTransaction);
      }
      this.init();
    }

    onInvalid(reason:string):void{
      console.error(reason);
    }

    checkIsvalid():void{
      if(this.total<(this.rawTransaction.amount+this.rawTransaction.miningFee)) this.onInvalid('amount to send more then total');
    }

    setCoinType(str:string):void{
      this.rawTransaction.coinType = str;
      this.rawTransaction.miningFee = 21000;
    }

    setTotal(num:number):void{
      this.total = num;
      this.checkIsvalid();

    }

    setTax(num:number):void{
      this.rawTransaction.miningFee = num;
      this.checkIsvalid();
    }

    getAmount():number{
      return this.rawTransaction.amount;
    }

    getTax():number{
      return this.rawTransaction.miningFee;
    }

    onCoinTypeChanged(coinType:string):void{
      this.rawTransaction.coinType = coinType;
      if(this.rawTransaction.coinType === 'Ether'){
        this.optionsController.showButton();
      }else this.optionsController.hideButton();
    }

    init():void{
      this.$sendStartBtn = $('.tabSend.scriptAction.tab.send').first().click((evt)=>{
        console.log(evt.currentTarget);
        if(this.isActive)this.isActive = false;
        else this.isActive = true;
        this.changeActive();
      })

      this.$sendBtn  = $('#Send_Recieve_Btn').click(()=>{
        console.log('send clicked');
        this.rawTransaction.amount = this.$amountInput.val();
        this.rawTransaction.to = this.$addressInput.val();
        this.rawTransaction.from = this.$myAddress.text();
        this.sendConfirmation.setTransaction(this.rawTransaction);
        this.sendConfirmation.show();
      })

      //console.log(this.$sendStartBtn);

      this.$view = $('.tabContent.cssTabContent').first();

      this.$myAddress =$('.populateAddress.cssAddress').first();



      this.$addressInput = $('#receiver_address').on('input',()=>{
        var val =  this.$addressInput.val();
        this.rawTransaction.to = val;
        this.checkIsvalid();
       // console.log(val);

      })
      //console.log(this.$addressInput);

      this.$amountInput = $('#amountSendInput').on('input',()=>{
        var val = this.$amountInput.val();
        console.log(val);
        this.rawTransaction.amount = val;
        this.checkIsvalid();
      })

      //console.log(this.$amountInput);

    }

    onSendClick():void{
      var addresTo:string  = this.$addressInput.val();
      var addressFrom:string =  this.$myAddress.text();
      var value:number = this.$amountInput.val();
      var tax:number =this.getTax();

    }

    changeActive():void{
      if(this.isActive){
        this.$sendStartBtn.addClass('cssSelected selected');
        this.$view.addClass('cssSelected selected');
        this.$view.show('fast');
      }else{
        this.$sendStartBtn.removeClass('cssSelected selected');
        this.$view.removeClass('cssSelected selected');
        this.$view.hide('fast');
      }

    }
  }

  export class TransferAmmountController{
    $view:JQuery;
    $shaleShiftInput:JQuery;
    $amountInput:JQuery;
    constructor(){

    }
  }


}