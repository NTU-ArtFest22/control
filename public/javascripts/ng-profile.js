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
      $http.get('/user').success(function(response) {
        $scope.user = response;
        $scope.ctrl = "";
        $http.get('/activitylist').success(function(res){
          $scope.activitylist = res;

          for( var i = 0 ; i < $scope.user.activities.length ; i++ ){
            for( var act_i in $scope.activitylist ){
              var act = $scope.activitylist[ act_i ];
              if( act._id == $scope.user.activities[i].id ){
                $scope.user.activities[i].location = act.location;
                $scope.user.activities[i].time = act.time;
                $scope.user.activities[i].isRunning = act.isRunning;
                $scope.user.activities[i].acttype = act.acttype;
                console.log( $scope.user.activities[i] );
                break;
              }
            }
          }
        });

      });
    };

    rundetail();

    $scope.addActivity = function( uid , acid ){
      $http.post('/user/addActivity', $scope.ctrl).success(function(response) {
        console.log(response);
        refreshUser();
      });
    };

  });

})();


