(function(){
  var app = angular.module('profile', [ '$scope', '$http' ]);

  var refresh = function() {
    $http.get('/user').success(function(response) {
      console.log("I got the data I requested");
      $scope.user = response;
      $scope.ctrl = "";
    });
  }

  app.controller('ActivityCtrl', function($scope){
    $scope.addActivity = function( uid , acid ){
      $http.put('/user/addActivity', $scope.ctrl).success(function(response) {
        console.log(response);
        refresh();
      });
    };


  });

})();


