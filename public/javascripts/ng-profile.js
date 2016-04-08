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

    var rundetail = function(){
      for( var i = 0 ; i < $scope.user.activities.length ; i++ ){
        for( var act in $scope.activitylist ){
          if( act._id == $scope.user.activities[i].id ){
            $scope.user.activities[i].location = act.location;
            $scope.user.activities[i].time = act.time;
            $scope.user.activities[i].isRunning = act.isRunning;
            console.log( $scope.user.activities[i] );
            break;
          }
        }
      }
    };

    refreshUser();
    refreshList();
    rundetail();

    $scope.addActivity = function( uid , acid ){
      $http.post('/user/addActivity', $scope.ctrl).success(function(response) {
        console.log(response);
        refreshUser();
      });
    };

  });

})();


