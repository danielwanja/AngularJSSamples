// This controller allows to switch between EFT and CC
var app = angular.module('paymentDemo', []);

app.controller('SwitchController', ['$scope', '$rootScope', function($scope,$rootScope) {
  $scope.gotoEFT = function() {
    $scope.start("eft")
    $scope.init();
  };
  $scope.gotoCC = function() {
    $scope.start("cc")
    $scope.init();
  };
  $scope.cancel = function() {
    $rootScope.currentModel  = $rootScope.nullModel
  }
  // private
  $scope.start = function(paymentType) {
    $rootScope.currentModel = paymentType=="eft" ? $rootScope.eftModel : $rootScope.ccModel;
  };
  $scope.init = function() {
    $rootScope.$broadcast('initPayement');  // controller to controller communication. Don't abuse.
  }
}]);

app.controller('PaymentController', ['$scope', '$rootScope','$timeout', function($scope,$rootScope,$timeout) {
  $scope.model = null;

  $scope.init = function() {
    $scope.model = $rootScope.currentModel;
    $scope.model.slide = $scope.model.existingAccounts.length == 0 ? "new" : "saved"
    $scope.updateSlide();
  }
  $scope.addPayment = function() {}
  $scope.newPayment = function() {}
  $scope.selectAccount = function(account) {
    $scope.model.transaction = {account: account, amount: $rootScope.sharedData.totalPayment };
    $scope.model.slide = "confirm";
    $scope.updateSlide();
  }
  $scope.confirm = function() {
    $scope.model.slide = "processing";
    $scope.updateSlide();
    $timeout(function() {
        $scope.done()
    }, 1500);
  }
  $scope.done = function() {
    $scope.model.slide = "done";
    $scope.updateSlide();
  }

  $scope.goBack = function() {
    $scope.init(); // just getting back to start...could reset new payment if needed
  }

  // private
  $scope.$on('initPayement', function() {
    $scope.init()
  });
  $scope.updateSlide = function() {
    $scope.model.slideUrl = "views/"+$scope.model.paymentType + "_" + $scope.model.slide + '.html';
  }
}]);


app.run(function($rootScope, $location) {
  // Data initialization. Normally this would come from a server
  $rootScope.nullModel = {
    paymentType: 'none',
    title: "Please select payment type",
    existingAccounts: [],
    newPayment: {},
    transaction: null,
    slide: "saved"   // saved, new, or confirm
  };
  $rootScope.ccModel = {
    paymentType: 'cc',
    title: "Pay by credit card",
    existingAccounts: [],
    newPayment: {},
    transaction: null,
    slide: "saved"   // saved, new, or confirm
  };
  $rootScope.eftModel = {
    paymentType: 'eft',
    title: "Pay by bank",
    existingAccounts: ["Bank1", "Bank2", "Bank3"],
    newPayment: {},
    transaction: null,
    slide: "new"     // saved, new, or confirm
  };
  $rootScope.currentModel = $rootScope.nullModel // Default.

  $rootScope.sharedData = {totalPayment: 999} // This would be the managed by the Payment Calculator Controller (not included here)

});
