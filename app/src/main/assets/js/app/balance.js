/**
 * Created by Vlad on 10/11/2016.
 */
///<reference path="../com/models.ts"/>
///<reference path="../com/Registry.ts"/>
var jaxx;
(function (jaxx) {
    var BalanceController = (function () {
        function BalanceController(main) {
            this.main = main;
            this.$overlay = $('<div>')
                .addClass('overlay')
                .css({
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)'
            });
            this.init();
        }
        BalanceController.prototype.init = function () {
            var _this = this;
            this.$refreshBtn = $('.scriptAction.refresh').first();
            //console.error(this.$refreshBtn.length);
            if (this.$refreshBtn.length == 0) {
                setTimeout(function () { return _this.init(); }, 2000);
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
            });
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
        };
        return BalanceController;
    }());
    jaxx.BalanceController = BalanceController;
    var CurrentAddressController = (function () {
        function CurrentAddressController() {
        }
        return CurrentAddressController;
    }());
    jaxx.CurrentAddressController = CurrentAddressController;
    var SendOptionsController = (function () {
        function SendOptionsController() {
            this.init();
        }
        SendOptionsController.prototype.init = function () {
            var _this = this;
            this.$view = $('.advancedTabContentEthereum.cssGapSmall.cssAdvancedTabContentEthereum').first();
            this.$customData = $('.advancedTabButton.cssAdvancedTabButton').first().click(function (evt) {
                if (_this.isVisible)
                    _this.isVisible = false;
                else
                    _this.isVisible = true;
                _this.toggleView();
            });
        };
        SendOptionsController.prototype.showButton = function () {
            if (this.isOptions) {
            }
            else {
                this.isOptions = true;
                this.$optionsBtn.show();
            }
        };
        SendOptionsController.prototype.hideButton = function () {
            if (this.isOptions)
                this.$optionsBtn.hide();
        };
        SendOptionsController.prototype.toggleView = function () {
            if (this.isVisible) {
                this.$view.show('fast');
            }
            else {
                this.$view.hide('fast');
            }
        };
        return SendOptionsController;
    }());
    jaxx.SendOptionsController = SendOptionsController;
    var SendConfirmationController = (function () {
        function SendConfirmationController() {
            this.init();
        }
        SendConfirmationController.prototype.init = function () {
            var _this = this;
            this.$view = $('.modal.send').first();
            this.$btnClose = this.$view.find('.cssClose').first().click(function () { console.log('on close click'); });
            this.$btnConfirm = $('#Send-Confirm-Button').click(function (evt) { return _this.onConfirmed(); });
        };
        SendConfirmationController.prototype.show = function () {
            this.$view.show();
        };
        SendConfirmationController.prototype.hide = function () {
            this.$view.hide();
        };
        SendConfirmationController.prototype.setTransaction = function (tr) {
            this.tr = tr;
        };
        SendConfirmationController.prototype.setAmount = function (num) {
        };
        SendConfirmationController.prototype.setMessage = function (str) {
        };
        return SendConfirmationController;
    }());
    jaxx.SendConfirmationController = SendConfirmationController;
    var SendAmmountController = (function () {
        function SendAmmountController() {
            var _this = this;
            //console.error( " SendAmmountController ");
            this.optionsController = new SendOptionsController();
            this.sendConfirmation = new SendConfirmationController();
            // this.rawTransaction = new VOSendRawTransaction();
            this.sendConfirmation.onConfirmed = function () {
                console.warn('   send confirmation confirmed   ');
                jaxx.Registry.application$.triggerHandler(jaxx.Registry.ON_USER_TRANSACTION_COFIRMED, _this.rawTransaction);
            };
            this.init();
        }
        SendAmmountController.prototype.onInvalid = function (reason) {
            console.error(reason);
        };
        SendAmmountController.prototype.checkIsvalid = function () {
            if (this.total < (this.rawTransaction.amount + this.rawTransaction.miningFee))
                this.onInvalid('amount to send more then total');
        };
        SendAmmountController.prototype.setCoinType = function (str) {
            this.rawTransaction.coinType = str;
            this.rawTransaction.miningFee = 21000;
        };
        SendAmmountController.prototype.setTotal = function (num) {
            this.total = num;
            this.checkIsvalid();
        };
        SendAmmountController.prototype.setTax = function (num) {
            this.rawTransaction.miningFee = num;
            this.checkIsvalid();
        };
        SendAmmountController.prototype.getAmount = function () {
            return this.rawTransaction.amount;
        };
        SendAmmountController.prototype.getTax = function () {
            return this.rawTransaction.miningFee;
        };
        SendAmmountController.prototype.onCoinTypeChanged = function (coinType) {
            this.rawTransaction.coinType = coinType;
            if (this.rawTransaction.coinType === 'Ether') {
                this.optionsController.showButton();
            }
            else
                this.optionsController.hideButton();
        };
        SendAmmountController.prototype.init = function () {
            var _this = this;
            this.$sendStartBtn = $('.tabSend.scriptAction.tab.send').first().click(function (evt) {
                console.log(evt.currentTarget);
                if (_this.isActive)
                    _this.isActive = false;
                else
                    _this.isActive = true;
                _this.changeActive();
            });
            this.$sendBtn = $('#Send_Recieve_Btn').click(function () {
                console.log('send clicked');
                _this.rawTransaction.amount = _this.$amountInput.val();
                _this.rawTransaction.to = _this.$addressInput.val();
                _this.rawTransaction.from = _this.$myAddress.text();
                _this.sendConfirmation.setTransaction(_this.rawTransaction);
                _this.sendConfirmation.show();
            });
            //console.log(this.$sendStartBtn);
            this.$view = $('.tabContent.cssTabContent').first();
            this.$myAddress = $('.populateAddress.cssAddress').first();
            this.$addressInput = $('#receiver_address').on('input', function () {
                var val = _this.$addressInput.val();
                _this.rawTransaction.to = val;
                _this.checkIsvalid();
                // console.log(val);
            });
            //console.log(this.$addressInput);
            this.$amountInput = $('#amountSendInput').on('input', function () {
                var val = _this.$amountInput.val();
                console.log(val);
                _this.rawTransaction.amount = val;
                _this.checkIsvalid();
            });
            //console.log(this.$amountInput);
        };
        SendAmmountController.prototype.onSendClick = function () {
            var addresTo = this.$addressInput.val();
            var addressFrom = this.$myAddress.text();
            var value = this.$amountInput.val();
            var tax = this.getTax();
        };
        SendAmmountController.prototype.changeActive = function () {
            if (this.isActive) {
                this.$sendStartBtn.addClass('cssSelected selected');
                this.$view.addClass('cssSelected selected');
                this.$view.show('fast');
            }
            else {
                this.$sendStartBtn.removeClass('cssSelected selected');
                this.$view.removeClass('cssSelected selected');
                this.$view.hide('fast');
            }
        };
        return SendAmmountController;
    }());
    jaxx.SendAmmountController = SendAmmountController;
    var TransferAmmountController = (function () {
        function TransferAmmountController() {
        }
        return TransferAmmountController;
    }());
    jaxx.TransferAmmountController = TransferAmmountController;
})(jaxx || (jaxx = {}));
//# sourceMappingURL=balance.js.map