(function(){
  var app = angular.module('about', []);

  app.controller('aboutController', function($scope, $http){
    $http.get('/json/us.json')
    .then(function(res){
      $scope.workers = res.data;
    });
  });
})();
