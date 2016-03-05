(function(){
  var app = angular.module('admin', [ '$scope', '$http' , 'ngAnimate', 'ui.bootstrap']);

 

  app.controller('adminUsersCtrl', function($scope, $window, $uibModal, $log){
    var refresh = function(){
      $http.get('/admin/userlist').success(function(res){
        $scope.userlist = res;
      });
    };
    
    refresh();

    $scope.remove = function( id ){
      var ans = $window.confirm( "Are you sure to remove the user?" );
      if(ans){
        $http.delete('/admin/userlist/' + id).success(function(res){
          refresh();
        });  
      }
      else{
        console.log('Cancel to remove the user.');
      }
    };

    $scope.open = function () {

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'edit-user-modal.html',
        controller: 'UserModalCtrl',
        resolve: {
          editUser: function () {
            return $scope.selected.user;
          }
        }
      });

      modalInstance.result.then( function () {
        $log.info('Modal dismissed at: ' + new Date());
      });

    };

  };

  /***********************************
   * userModalCtrl --- 
   *        for modal 
   *
   *** Please note that $uibModalInstance represents a modal window (instance) dependency.
   *** It is not the same as the $uibModal service used above.
   ***********************************/

  app.controller('userModalCtrl', function($scope, $uibModalInstance, editUser){
    $scope.editUser = editUser;

    var getActivitylist = function(){
      $http.get('/admin/activitylist').success(function(res){
        $scope.activitylist = res;
      });
    };

    var refresh = function(){
      $http.get('/admin/userlist/' + editUser._id).success(function(res){
        $scope.editUser = res;
      });
    };

    getActivitylist(); // not sure put here or adminUsersCtrl
    refresh();

    $scope.addActivity = function(){
      $http.put('/admin/userlist/' + editUser._id + '/' + $scope.ctrl.act._id).success(function(res){
        refresh();
      });
    }

    $scope.removeActivity = function( act_id ){
      $http.delete('/admin/userlist/' + editUser._id + '/' + act_id).success(function(res){
        refresh();
      })
    };

    $scope.ok = function () {
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };


  });

});
})();

