(function(){
  var app = angular.module('profile', [ ]);

  app.controller('ActivityCtrl', function($scope, $http){
    
    var refreshUser = function() {
      $http.get('/user').success(function(response) {
        $scope.user = response;
        $scope.ctrl = "";
      });
    };

    var refreshList = function(){
      console.log('refreshing activity list');
      $http.get('/activitylist').success(function(res){
        $scope.activitylist = res;
      })
    };

    refreshUser();
    refreshList();

    $scope.addActivity = function( uid , acid ){
      $http.post('/user/addActivity', $scope.ctrl).success(function(response) {
        console.log(response);
        refreshUser();
      });
    };

  });

})();


